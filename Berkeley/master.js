// BERKELEY'S ALGORITHM

var request = require('request');

// Set up logical clock (only needed when running all files on one computer)
var clock = require("./../clock.js");
//clock.setOffset(2000);
//clock.setDrift(0.4);
clock.startClock();

var storeDifferenceData = require('./../storeDifferenceData.js');

var slaves = /*["http://10.245.142.79:8881"];*/["http://192.168.1.185:8881", "http://192.168.1.115:8881"]; // array of slave urls (GET AUTOMATICALLY IN FINAL VERSION)

var UDP_OR_TCP = true; // true for UDP, false for TCP

var communicationType = UDP_OR_TCP ? "UDP" : "TCP";
var differences = [];
var samplesTaken = 0; // When this reaches 20, save the data and end
var largeOffset = false;

// Stores the difference data for this client
function storeData(){
	storeDifferenceData.storeDifferences(differences, "Berkeley's", communicationType, synchronisationRate, largeOffset);
	console.log("\n\n SAVED DATA \n\n");
}


var sampleInterval = 2000;// Time between rounds in milliseconds
var synchronisationRate = sampleInterval/1000;

function updateAllServers(){
	var currentTime;
	
	getAllServerTimes()
	.then(function(serverTimeDetails){
		clock.getCurrentTime()
		.then(function(currentTimeDetails){
			currentTime = currentTimeDetails["time"];
			//console.log("\n Got current time");
			//console.log(currentTime);
			return updateRelativeServerTimes(serverTimeDetails, currentTime);
		})
		.then(function(details){
			//console.log("\n Updated relative times");
			//console.log(details);
			
			var serverTimes = details["serverTimes"]; // Array list of server times
			var newTimeDetails = details["fullTimeDetails"]; // Links IPAddresses to server times
			
			serverTimes.push(currentTime); // include the current master time
			
			console.log("Server Times: ",serverTimes);
			getAverageImproved(serverTimes, 0) // getAverage with fValue 0 for now (no fault-tolerance)
			.then(function(average){
				//console.log("\n Calculated average");
				//console.log(average);
				
				// Should master update its own clock?? YES IT SHOULD
				var diff = average - currentTime;
				console.log("Average: ",average);
				console.log("Updating master with offset: ",diff);
				differences.push(diff);
				clock.updateOffset(diff);
					
				calculateDifferences(newTimeDetails, average)
				.then(function(differences){
					//console.log("\n Found differences");
					//console.log(differences);
					
					updateServerTimes(differences);
					
					
				});
			});
		});
	});
}


// USE UDP TO GET TIMES FROM SERVERS (JUST USE CODE FROM Cristian's but store the ipAddress and time of sending each UDP message, 
// then when receiving messages, check the ipAddress of sender, match it to sent message and create JSON data of ipAddress, serverTime)
// Then proceed as normal with these functions

// Runs getCurrentServerTime on all slaves
// returns times from all slaves
function getAllServerTimes(){
	return new Promise(function(resolve, reject){
		var promises = []; 
		var serverTimeDetails = [];
		
		var currentTime;
		
		// Loop through all slave time servers
		slaves.forEach(function(ipAddress){
			promises.push(
				getCurrentServerTime(ipAddress)
				.then(function(timeDetails){
					serverTimeDetails.push(timeDetails);
				})
			);
		});
		
		Promise.all(promises).then(function(){
			//console.log("\n Got server times");
			//console.log(serverTimeDetails);
			resolve(serverTimeDetails);
		});
	});
}


// Returns the current server time (from url) estimated from round-trip time, along with the time it was retrieved
function getCurrentServerTime(ipAddress){
	return new Promise(function(resolve, reject){
		var clockTimeBefore;
		var clockTimeNow;
		var serverTime;
		var roundTripTime;
		var difference;
		clock.getCurrentTime()
		.then(function(timeDetails){
			clockTimeBefore = timeDetails["time"];
			return getTimeFromTimeServer(ipAddress+"/time");
		})
		.then(function(time){
			serverTime = time;
			return clock.getCurrentTime()
		})
		.then(function(timeDetails){
			clockTimeNow = timeDetails["time"];
			roundTripTime = clockTimeNow - clockTimeBefore;
			console.log("RTT: ",roundTripTime);
			serverTime = serverTime + roundTripTime/2;
			var timeDetails = {ipAddress: ipAddress, currentTime: clockTimeNow, serverTime: serverTime}
			resolve(timeDetails);
		})
		.catch(function(error){
			reject(error);
		});
	});
}


// Returns server time in promise from the url specified
function getTimeFromTimeServer(url){
	return new Promise(function(resolve, reject){
		// NEED TO CHANGE PORT NUMBER TO MATCH EACH SLAVE
		request(url, function(error, response, body){
			var jsonData = JSON.parse(body);
			// DEAL WITH ERROR HERE
			var serverTime = jsonData["time"];
			resolve(serverTime);
		});
	});
}


// Updates server times so that they are relative to the same clock time 
// serverTimeDetails in form [{ipAddress:192.x.x.x, serverTime:time, currentTime:master_time_at_retrieval}]
// currentTime is current system time in milliseconds
// DON'T NEED THIS WHEN USING BEAT/BAR TIMES INSTEAD
function updateRelativeServerTimes(serverTimeDetails, currentTime){
	return new Promise(function(resolve, reject){		
		var promises = []; // Makes for loop synchronous
		var newTimeDetails = []; // ipAddresses linked to serverTimes
		var serverTimes = []; // all server times
		
		// Use current time to update the server times
		serverTimeDetails.forEach(function(timeDetails){
			promises.push(
				new Promise(function(resolve, reject){
					var ipAddress = timeDetails["ipAddress"];
					var serverTime = timeDetails["serverTime"];
					var clockTime = timeDetails["currentTime"];
					
					var newServerTime = serverTime + (clockTime - currentTime);
					
					newTimeDetails.push({ipAddress: ipAddress, serverTime: newServerTime});
					serverTimes.push(newServerTime);
					resolve();
				})
			);
		});
		
		Promise.all(promises).then(function(){
			var details = {fullTimeDetails: newTimeDetails, serverTimes: serverTimes}
			resolve(details);
		});
	});
}


// Returns average of all server times in the serverTimes array
// fValue signifies level of fault-tolerance, throws out f highest and lowest values (defaults to 0)
// Uses a more complicated averaging function
// Could be used for Welch-style algorithm - would only need to remove code that sends time to other servers, and have every server run this code to update its own time
function getAverageImproved(serverTimes, fValue = 0){
	serverTimes.sort(); // Order by time
	serverTimes.splice(0, fValue) // Remove f lowest times
	serverTimes.splice(-fValue, fValue) // Remove f highest times
	return getMean(serverTimes); // Return result of using normal averaging function on remaining values
}


// Returns the average of all server times in the serverTimes array
function getMean(serverTimes){
	return new Promise(function(resolve, reject){
		var length = serverTimes.length;
		var total = 0;
		for(var i = 0; i < length; i++){
			total+= serverTimes[i];
		}
		var average = total/length;
		resolve(average);
	});	
}


// Calculate differences between server times and averages
// serverTimeDetails is in form [{ipAddress:192.x.x.x, serverTime: time_in_milliseconds}]
// Average is the time to set clock to
function calculateDifferences(serverTimeDetails, averageTime){
	return new Promise(function(resolve, reject){
		
		var promises = []; // Makes for loop synchronous
		var differences = []; // ipAddresses linked to differences (offsets)
		
		// Use current time to update the server times
		serverTimeDetails.forEach(function(timeDetails){
			promises.push(
				new Promise(function(resolve, reject){
					var ipAddress = timeDetails["ipAddress"];
					var serverTime = timeDetails["serverTime"];
					
					var difference = averageTime - serverTime; // +ve if server is behind, -ve if server ahead
					
					differences.push({ipAddress: ipAddress, difference: difference});
					resolve();
				})
			);
		});
		
		Promise.all(promises).then(function(){
			resolve(differences); 
		});
	});
	
}


// CREATE UDP VERSIONS OF THE UPDATE FUNCTIONS ==============================================================================================================

// Updates each server in serverTimeDifferences where a server is {ipAddress: ip, difference: amountToChangeClock}
function updateServerTimes(serverTimeDifferences){
	serverTimeDifferences.forEach(function(details){
		var ipAddress = details["ipAddress"];
		var change = details["difference"];
		console.log("\n UPDATING TIME SERVERS WITH DIFFERENCES");
		console.log(ipAddress);
		console.log(change);
		updateServerTime(ipAddress, change);
	});
}

// Sends post request to ipAddress/update to update offset of logical clock
// difference is the amount the server should change its time by (positive or negative)
function updateServerTime(ipAddress, difference){
	var options = {
		url: ipAddress + "/update",
		method: 'POST',
		form: {'difference':difference},
		//json: true
	}
	
	request(options, function(error, response, body){
		console.log("Server updated");
	});
}






// TESTS
if (!UDP_OR_TCP){
	setInterval(function(){
		updateAllServers();
		samplesTaken += 1; // Increase samples counter
		if(samplesTaken >= 20){
			// Save
			storeData();
			// End 
			clearInterval();
			samplesTaken = 0; // Reset
			return;
		}
	}, sampleInterval);
}


//updateServerTime("http://192.168.0.12:8881", 500);

//var data = {"http://192.168.0.12:8881":400, "http://192.168.0.12:8882":-200};
//updateServerTimes(data);

//var data = [500, 1000, 1500];
//getAverage(data);





//===============================================================================================================
// Code for UDP communication

var dgram = require('dgram');

var server = dgram.createSocket('udp4');
 
var HOST = "192.168.1.115" // NEED SPECIFIC IP ADDRESS HERE
var PORT = 41236;

server.on('error', function(err){
	console.log("Error: ", err.stack);
	server.close();
});

// Emitted when a new datagram is available on the socket
// info contains address, family(IPv4 or IPv6), port and size
server.on('message', function(msg, info){
	console.log(`Server received: ${msg} from ${info.address}:${info.port}`);
	
	// Extract type information
	var jsonData = JSON.parse(msg);
	var type = jsonData["type"];
	
	// If client asking for time
	if (type == "time"){
		// Extract client information
		var clientHost = info.address;
		var clientPort = info.port;

		var time = jsonData["value"]; // Extract the time value
		receivedTime(time, clientHost, clientPort); // Send to function to deal with received time (unlike Cristian's, have to specify host and port as will be receiving multiple times from different clients)
	}
});

// Emitted when the socket begins listening for datagram messages 
server.on('listening', function(){
	var address = server.address();
	//console.log(`Server listening on ${address.address}:${address.port}`);
});

// Causes server to listen for messages on a specific port (and optional address)
// If no address given, server listens on all addressess
// 'listening' event emitted once binding is complete

if (UDP_OR_TCP){
	server.bind(PORT, HOST);
}


var servers = ["192.168.1.185", "192.168.1.115"]; // LIST OF SERVERS TO SYNCHRONISE
var sendingTimes = []; // Matches server addresses with time we last sent a message
var receivedTimes = []; // Matches server addresses with estimated times

// Main wrapper for synchronising function
function synchronise(){
	// Clear arrays
	sendingTimes = [];
	receivedTimes = [];
	askForTimeFromServers();
}

// Function to ask the servers to send the time
function askForTimeFromServers(){
	console.log("\n\n");
	// Send message to ask for time 
	//console.log("Sending message to ", SERVER_HOST, ":",SERVER_PORT);
	
	for (var i=0; i<servers.length; i++){
		//var server = servers[i]; 
		// Extract host and port information
		var serverHost = servers[i];
		var serverPort = 41235;//PORT; // All assumed to use the same port
		
		var messageJSON = {"type":"ask"};
		
		var message = new Buffer(JSON.stringify(messageJSON));
		
		// Get the time before sending the message
		var sentTime;
		clock.getCurrentTimeSimple()
		.then(function(time){
			sentTime = time;
		});
			
		server.send(message, 0, message.length, serverPort, serverHost, function(err, bytes) {
			if (err) throw err;
			//console.log('UDP message sent to ' + serverHost +':'+ serverPort);
			sendingTimes[serverHost] = sentTime; // Store the time the message was sent
		});
	}
	
}

var finalResponse = false; // If true, move on to synchroniseClocks();

// Function to deal with receiving a time from a client (slave)
function receivedTime(time, host, port=PORT){
	// Look through data from when messages were sent
	// Extract time message was sent to client
	var clockTimeBefore = sendingTimes[host];
	
	// Estimate clock time now using RTT (like in Cristian's algorithm)
	clock.getCurrentTimeSimple()
	.then(function(result){
		var clockTimeNow = result;		
		var roundTripTime = clockTimeNow - clockTimeBefore;
		//console.log("RTT: ",roundTripTime);
		var serverTime = time + roundTripTime/2;
		
		// Store new time
		var receivedTime = {ipAddress: host, currentTime: clockTimeNow, serverTime: serverTime}
		receivedTimes.push(receivedTime); // Store it in the same format as the functions using Express do (so can use the same analysis functions);
		
		// (JUST FOR TESTING ONE CLOCK, SET finalResponse = true, will Need a better check with more servers)
		finalResponse = true;
		
		// Need some check to see if it's the last response?? Then move on to Averaging functions etc
		// When sure this is the last one, call synchroniseClocks();
		if (finalResponse){
			synchroniseClocks();
		}
	});
}

// Updates each server in serverTimeDifferences where a server is {ipAddress: ip, difference: amountToChangeClock}
function updateServerTimesUDP(serverTimeDifferences){
	serverTimeDifferences.forEach(function(details){
		var ipAddress = details["ipAddress"];
		var port = PORT; // If it isn't the same, will need to store this in the data throughout the process
		var change = details["difference"];
		//console.log("\n UPDATING TIME SERVERS WITH DIFFERENCES");
		//console.log(ipAddress);
		//console.log(change);
		updateServerTimeUDP(ipAddress, port, change);
	});
}

// Sends post request to ipAddress/update to update offset of logical clock
// difference is the amount the server should change its time by (positive or negative)
function updateServerTimeUDP(ipAddress, port, difference){
	console.log("Updating: ",ipAddress," on port: ",port);
	var jsonResponse = {"type":"update", "value":difference}; // Create JSON response
	var message = new Buffer(JSON.stringify(jsonResponse)); // Create message buffer
	
	server.send(message, 0, message.length, port, ipAddress, function(err, bytes) {
			if (err) throw err;
			//console.log('UDP message sent to ' + ipAddress +':'+ port);
		});
}


// Function called to finish synchronising the clocks once all messages have been received
// SAME CODE AS MAIN FUNCTION WHEN USING EXPRESS (COULD FIND WAY TO COMBINE THEM AND JUST HAVE TWO SEPARATE FUNCTIONS FOR THE TIME RETRIEVAL PART)
function synchroniseClocks(){
	//console.log("Synchronising clocks");
	var serverTimeDetails = receivedTimes;
	var currentTime;
	clock.getCurrentTime()
	.then(function(currentTimeDetails){
		currentTime = currentTimeDetails["time"];
		//console.log("\n Got current time");
		//console.log(currentTime);
		//console.log("All times from servers: ",serverTimeDetails);
		return updateRelativeServerTimes(serverTimeDetails, currentTime);
	})
	.then(function(details){
		//console.log("\n Updated relative times");
		//console.log(details);
		
		var serverTimes = details["serverTimes"]; // Array list of server times
		var newTimeDetails = details["fullTimeDetails"]; // Links IPAddresses to server times
		
		serverTimes.push(currentTime); // include the current master time
		
		//console.log("All times updated: ",serverTimes);
		
		getAverageImproved(serverTimes, 0) // getAverage with fValue 0 for now (no fault-tolerance)
		.then(function(average){
			//console.log("\n Calculated average");
			console.log("Average: ",average);
			
			// Should master update its own clock????
			var diff = average - currentTime;
			clock.updateOffset(diff);
			differences.push(diff);
			console.log("Updating master clock with offset: ",diff);
				
			calculateDifferences(newTimeDetails, average)
			.then(function(differences){
				//console.log("\n Found differences");
				//console.log(differences);
				
				updateServerTimesUDP(differences);
				
				
			});
		});
	});
}

if(UDP_OR_TCP){
	setInterval(function(){
		synchronise();
		samplesTaken += 1; // Increase samples counter
		if(samplesTaken >= 20){
			// Save
			storeData();
			// End 
			clearInterval();
			samplesTaken = 0; // Reset
			return;
		}
	}, sampleInterval);
}
//===============================================================================================================