// BERKELEY'S ALGORITHM
var decache = require("decache");
// Set up logical clock (only needed when running all files on one computer)
var clock = require("./clock.js");
decache('./clock.js');
//var storeDifferenceData = require('./../storeDifferenceData.js');
var dgram = require('dgram');
var ipAddressRetriever = require("./ipAddress.js");


var server;
var HOST = ipAddressRetriever.getIPAddress();
var PORT = 41235;
var differences = []; // Array to store the data about differences applied after each synchronisation round
var masterIPAddress;// Will be taken from arguments!!!
var masterPort;
var synchronising = false; // If false, don't synchronise with master

var timeoutToResend = 5000; // If no message received within 5 seconds, try to join master again
var messageReceived = false;
setInterval(function(){
	if (!messageReceived && synchronising){
		setMasterIPAddress(masterIPAddress, masterPort);
	}
	messageReceived = false;
},timeoutToResend);

//clock.setOffset(2000);
clock.startClock(); // Start clock

function startBerkeleyAlgorithm(port=PORT,  inputMasterIPAddress= HOST, inputMasterPort= 41236){
	setUpUDPServer(); // Set up server
	
	// Set variables
	PORT = port;
	masterIPAddress = inputMasterIPAddress;
	masterPort = inputMasterPort;
	synchronising = true;
}
 

function stopSynchronising(){
	if (synchronising){
		synchronising = false;
	}
}


// Function to set new master ip address
function setMasterIPAddress(ipAddress, port){
	masterIPAddress = ipAddress;
	masterPort = port; // HARDCODED FOR NOW
	var messageJSON = {"type":"newSlave"};
	var message = new Buffer(JSON.stringify(messageJSON));
	
	server.send(message, 0, message.length, masterPort, masterIPAddress, function(err, bytes){
		if (err) throw err;
		//console.log("UDP message sent to "+ masterIPAddress + ":"+masterPort);
	});
	
	// For multicasting
	// server.addMembership(masterIPAddress, HOST);
	
}


function updateOffset(offset){
	//console.log("Updating offset: ",offset);
	//console.log("\n");
	differences.push(offset.toFixed(0));
	clock.updateOffset(offset.toFixed(0));

/* 	samplesTaken += 1; // Increase samples counter
	if(samplesTaken >= 20){
		// Save
		storeData();
		samplesTaken = 0; // Reset
		return; // End
	} */
}


function setUpUDPServer(){
	server = dgram.createSocket({ type: 'udp4', reuseAddr: true });
	
	server.on('error', function(err){
		//console.log("Error: ", err.stack);
		server.close();
	});

	// Emitted when a new datagram is available on the socket
	// info contains address, family(IPv4 or IPv6), port and size
	server.on('message', function(msg, info){
		// Only continue if meant to be synchronising
		if (!synchronising){
			return;
		}
		
		// Extract information from server that is asking for the time
		var serverHost = info.address;
		var serverPort = info.port;
		
		if (serverHost != masterIPAddress || serverPort != masterPort){
			return;
		}
		
		messageReceived = true;
		
		// Extract type information
		var jsonData = JSON.parse(msg);
		var type = jsonData["type"];
	
		
		// Type called to update offset
		if (type == "update"){
			var offset = parseInt(jsonData["value"]); // Extract offset value from message
			console.log("Berkeley updating with offst: ",offset);
			updateOffset(offset);// Update the offset
		}
		
		// Server asking for the time
		if(type=="askForTime"){
			var time = clock.getCurrentTimeSync();
			var responseJSON = {"type":"time", "value":time};
			var response = new Buffer(JSON.stringify(responseJSON));
			
			server.send(response, 0, response.length, serverPort, serverHost, function(err, bytes){
				if (err) throw err;
				//console.log("UDP message sent to " + serverHost +':'+ serverPort);
			});
		}
	});

	//===================================================================================================================================

	// Emitted when the socket begins listening for datagram messages 
	server.on('listening', function(){
		var address = server.address();
		//console.log(`Server listening on ${address.address}:${address.port}`);
		//setInterval(synchronise, 2000);
		setMasterIPAddress(masterIPAddress, masterPort); // TAKEN FROM NODE ARGUMENTS
		
	});


	server.bind(PORT, HOST); // Bind client server so it can receive messages

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