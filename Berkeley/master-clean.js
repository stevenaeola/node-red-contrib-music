// BERKELEY'S ALGORITHM
var decache = require('decache'); // Used to decache clock.js for testing so master and slave don't use same clock object
var request = require('request');
var ipAddressRetriever = require("./ipAddress.js");
//var saveData = require("./../storeDifferenceData.js");
// Set up logical clock (only needed when running all files on one computer)
var clock = require("./clock.js");
decache('./clock.js');
var dgram = require('dgram');
var _ = require("underscore");

var sampleInterval = 2000;// Time between rounds in milliseconds
var server; 
 
var HOST = ipAddressRetriever.getIPAddress();
var PORT = 41236;

var slaves = []; // LIST OF SERVERS TO SYNCHRONISE (Should have function to add more)
var sendingTimes = []; // Matches server addresses with time it last sent a message
var receivedTimes = []; // Matches server addresses with estimated received times
var timeout = 1000; // How long algorithm is willing to wait for time responses
var dealWithResponses = false; // If true, move on to synchroniseClocks();
var synchronising = false; // If false, don't synchronise
var synchroniserIntervalObject;
var timeoutObject; 
var maxOffsetLimitApplied = false;
var maxOffset = 200000; // No offset greater than this limit will be applied, will dynamically change if offsets are continously smaller
var minOffsetEverAllowed = 1 // Minimum offset ever allowed - stops it going sub-linear

var newSlaves = [] // Stores a list of new slaves that have not had one round of synchronisation yet

var storedOffsets = [] // List of lists (one for each round), where each list stores all the absolute values of offsets applied in each round
// Will save this in a JSON file and write python code to get graph from that
//setInterval(function(){
//	saveData.storeDifferences(storedOffsets, "BERKELEY", "UDP", sampleInterval, maxOffsetLimitApplied);
//},20000)

var round = 0;
var withMusic = true; // For testing purposes, to test the effect of the berkeley limit with and without playing UDP music at the same time
// When round == 40, save results
function saveOffsets(){
	saveData.storeDifferences(storedOffsets, "BERKELEY", "UDP", sampleInterval, withMusic, maxOffsetLimitApplied);
}

clock.startClock(); // Start clock


function startBerkeleyAlgorithm(inputPort=PORT, inputSampleInterval= 2000){
	setUpUDPServer(); // Set up server
	
	// Set variables
	port = inputPort;
	sampleInterval = inputSampleInterval;
	timeout = sampleInterval/2;
	
	synchronising = true;
	synchroniserIntervalObject = setInterval(synchronise, sampleInterval);
	synchroniserIntervalObject;
}


function stopSynchronising(){
	if (synchronising){
		clearInterval(synchroniserIntervalObject);
		clearTimeout(timeoutObject);
		synchronising = false;
	}
}


function setUpUDPServer(){
	server = dgram.createSocket({ type: 'udp4', reuseAddr: true });
	
	// server.bind();
	// server.setBroadcast(true);
	// server.setMulticastTTL(128);
	// server.addMembership(ipAddress);
	
	server.on('error', function(err){
		//console.log("Error: ", err.stack);
		server.close();
	});


	// Emitted when a new datagram is available on the socket
	// info contains address, family(IPv4 or IPv6), port and size
	server.on('message', function(msg, info){
		//console.log(`Server received: ${msg} from ${info.address}:${info.port}`);
		// Extract client information
		var clientHost = info.address;
		var clientPort = info.port;
			
		// Extract type information
		var jsonData = JSON.parse(msg);
		var type = jsonData["type"];
		
		// If client asking for time
		if (type == "time"){
			var time = jsonData["value"]; // Extract the time value
			receivedTime(time, clientHost, clientPort); // Send to function to deal with received time (unlike Cristian's, have to specify host and port as will be receiving multiple times from different clients)
		}
		
		if(type == "newSlave"){
			// Send message back to slave with current time to tell if current time (assume UDP message gets through)
			// Get slave to take current time + rtt
			// Slave should then be within the limit
			slaves.push({"host":clientHost, "port":clientPort});
			//console.log("Slaves 1: ", slaves);
			// If using multicast, doesn't even need to know when slaves join???
		}
	});


	// Emitted when the socket begins listening for datagram messages 
	server.on('listening', function(){
		var address = server.address();
		console.log(`Berkeley server listening on ${address.address}:${address.port}`);
	});


	// Causes server to listen for messages on a specific port (and optional address)
	// If no address given, server listens on all addressess
	// 'listening' event emitted once binding is complete
	server.bind(PORT, HOST);

}


// Main wrapper for synchronising function
function synchronise(){
	if(!synchronising){
		return;
	}
	// Clear arrays
	sendingTimes = [];
	receivedTimes = [];
	askForTimeFromServers();
	timeoutObject = setTimeout(function(){
		dealWithResponses = true;
		synchroniseClockResponses();
		dealWithResponses = false;
	}, timeout);
	
	timeoutObject;
}


// Function to ask the servers to send the time
// WANT TO CHANGE TO BROADCAST OR MULTICAST INSTEAD!!
// IF using broadcast, don't need to update relative times later
function askForTimeFromServers(){
	//console.log("Slaves 2: ", slaves);
	//console.log("\n\n");
	//console.log("Asking for time from servers");
	
	// Using old method
	for (var i=0; i<slaves.length; i++){
		// Extract host and port information
		var serverDetails = slaves[i];
		var serverHost = serverDetails["host"];
		var serverPort = serverDetails["port"];//41235;//PORT; // All assumed to use the same port
		
		var messageJSON = {"type":"askForTime"};
		
		var message = new Buffer(JSON.stringify(messageJSON));
		
		// Get the time before sending the message
		var sentTime = clock.getCurrentTimeSync();
		sendingTimes[serverHost+"-"+serverPort] = sentTime;
		
		server.send(message, 0, message.length, serverPort, serverHost, function(err, bytes) {
			if (err) throw err;
			//console.log('UDP message sent to ' + serverHost +':'+ serverPort);
		});
	}
	
	// Using multicasting
/* 	
	var messageJSON = {"type":"askForTime"};
	var message = new Buffer(JSON.stringify(messageJSON));
	var sentTime = clock.getCurrentTimeSync();
	server.send(message, 0, message.length, multicastServerPort, multicastServerHost, function(err, bytes) {
		if (err) throw err;
		console.log('UDP message sent to ' + serverHost +':'+ serverPort);
		sendingTimes[serverHost+"-"+serverPort] = sentTime; // Store the time the message was sent
	}); */
	
}


// Function to deal with receiving a time from a client (slave)
function receivedTime(time, host, port=PORT){
	// Look through data from when messages were sent
	// Extract time message was sent to client
	var clockTimeBefore = sendingTimes[host+"-"+port]; // Change this to sentTime if using multicasting
	//console.log("clock time before: ", clockTimeBefore);
	// Estimate clock time now using RTT (like in Cristian's algorithm)
	var clockTimeNow = clock.getCurrentTimeSync();
	var roundTripTime = clockTimeNow - clockTimeBefore;
	//console.log("Round trip time: ", roundTripTime);
	var serverTimeEstimate = time + roundTripTime/2;
	var receivedTime = {ipAddress: host, port: port, currentTime: clockTimeNow, serverTimeEstimate: serverTimeEstimate, roundTripTime: roundTripTime};
	receivedTimes.push(receivedTime);
}


// Function called to finish synchronising the clocks once all messages have been received
// SAME CODE AS MAIN FUNCTION WHEN USING EXPRESS (COULD FIND WAY TO COMBINE THEM AND JUST HAVE TWO SEPARATE FUNCTIONS FOR THE TIME RETRIEVAL PART)
function synchroniseClockResponses(){
	var offsetsWithinLimit = true // Assume the offsets applied are within maxOffsetLimit
	var offsetsForThisRound = [] // Store absolute values of offsets applied this round
	
	if (receivedTimes.length == 0){
		return;
	}
	//console.log("Received times: ", receivedTimes);
	
	// This step not necessary if using multicasting as all slaves would have received message at the same time 
	var currentTime = clock.getCurrentTimeSync();
	//console.log("Current time: ", currentTime) 
	var receivedTimesUpdated = updateRelativeServerTimes(receivedTimes, currentTime);
	//console.log("Updated received times: ", receivedTimesUpdated);
	
	// Add all times to a list
	var serverTimes = [currentTime];
	_.each(receivedTimesUpdated, function(entry){serverTimes.push(entry["serverTime"])});
	//console.log("Server times: ", serverTimes);
	
	// Get average time
	var fValue = 0;
	if(serverTimes.length >= 4) {
		fValue = Math.floor(serverTimes.length/10) + 1; // (if less than 10 will be 1, if less than 20 will be 2, etc.)
	}
	var averageTime = getAverageTime(serverTimes, fValue);
	//console.log("Average: ",averageTime);
	
	// Calculate offset for this clock
	var offset = averageTime - currentTime;
	//console.log("Current clock with offset: ",offset);
	if (maxOffsetLimitApplied == true){
		if (Math.abs(offset) > maxOffset*1.1){
			//console.log("Offset bigger than max")
			if (offset < 0) offset = -1*maxOffset // Negative or positive????
			else offset = maxOffset
			offsetsWithinLimit = false 
		}
	}
	clock.updateOffset(offset.toFixed(0));
	
	offsetsForThisRound.push(Math.abs(offset));
	
	// Update the offsets of all the servers that replied
	_.each(receivedTimesUpdated, function(entry){
		// Use average time to calculate difference
		var ipAddress = entry["ipAddress"];
		var port = entry["port"];
		var serverTime = entry["serverTime"];
		var offset = averageTime - serverTime;
		
		// If this ipAddress is from an established slave, limit the offset
		if (!(ipAddress in newSlaves)){
			if (maxOffsetLimitApplied == true){
				if (Math.abs(offset) > maxOffset*1.1){
					//console.log("Offset bigger than max")
					if (offset < 0) offset = -1*maxOffset // Negative or positive????
					else offset = maxOffset
					offsetsWithinLimit = false 
				}
			}
		}else{
			// If the ipAddress is new, don't limit the offset 
			// Remove it from the list of new slaves
			newSlaves.remove(ipAddress);
		}
		updateServerTimeUDP(ipAddress, port, offset);  // HARDCODE PORT FOR NOW
		offsetsForThisRound.push(Math.abs(offset));
	});
	
	if (maxOffsetLimitApplied == true){
		if (offsetsWithinLimit == true){
			// All offsets have been within the maxOffsetLimit so halve it 
			maxOffset = maxOffset/2
		}else{
			// Values are exceeding max offset limit so increase by 50% (not the same as doubling so going up is slower than going down)
			maxOffset += maxOffset/5
		}
	}
	if (maxOffset < minOffsetEverAllowed) maxOffset = minOffsetEverAllowed;
	
	storedOffsets.push(offsetsForThisRound);
	round += 1;
	if (round == 40){
		saveOffsets();
	}
}


// Updates server times so that they are relative to the same clock time 
// serverTimeDetails in form [{ipAddress:192.x.x.x, serverTime:time, currentTime:master_time_at_retrieval}]
// currentTime is current system time in milliseconds
function updateRelativeServerTimes(receivedTimes, currentTime){
	var updatedReceivedTimes = [];
	_.each(receivedTimes, function(entry){
		updatedReceivedTimes.push({"ipAddress":entry["ipAddress"], "port":entry["port"], "serverTime": entry["serverTimeEstimate"] + (currentTime - entry["currentTime"])});
	});
	return updatedReceivedTimes;
}


// Get the average time from all server times
function getAverageTime(serverTimes, fValue = 0){
	serverTimes.sort(); // Order by time
	serverTimes.splice(0, fValue) // Remove f lowest times
	serverTimes.splice(-fValue, fValue) // Remove f highest times
	var sum = _.reduce(serverTimes, function(memo, num){ return memo + num; }, 0);
	return sum/serverTimes.length;
}


// Sends post request to ipAddress/update to update offset of logical clock
// difference is the amount the server should change its time by (positive or negative)
function updateServerTimeUDP(ipAddress, port, difference){
	//console.log("Updating: ",ipAddress," on port: ",port);
	var jsonResponse = {"type":"update", "value":difference}; // Create JSON response
	var message = new Buffer(JSON.stringify(jsonResponse)); // Create message buffer
	
	server.send(message, 0, message.length, port, ipAddress, function(err, bytes) {
			if (err) throw err;
			//console.log('UDP message sent to ' + ipAddress +':'+ port);
		});
}


function getCurrentTime(){
	return clock.getCurrentTimeSync();
}


function getClock(){
	return clock;
}

module.exports = {
	startSynchronisation: startBerkeleyAlgorithm,
	stopSynchronisation: stopSynchronising,
	getCurrentTime: getCurrentTime,
	getClock: getClock
}
