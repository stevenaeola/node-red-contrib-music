// DECIDE WHETHER TO USE SOCKETS INSTEAD OF REQUESTS
// NEED TO UPDATE TO ALLOW NEGATIVE OFFSETS WITHOUT ACTUALLY PUTTING THE TIME BACK (gentle offset slowdown method) DO THIS FOR beat.js too
var ipAddressRetriever = require("./ipAddress.js");
	
var offset = 0; // offset from real-time in milliseconds (can simulate multiple logical clocks)
var started = false;

// Set offset in milliseconds
function setOffset(o){
	offset = o;
}

// Get offset
function getOffset(){
	return offset;
}

// Changes offset by a certain amount
function updateOffset(changeAmount){
	//console.log("Offset to change: ",changeAmount);
	offset += changeAmount;
}

// Reset total drift
function resetClock(){
	offset = 0;
}

// Start the clock (add drift every 3 seconds)
function startClock(){
	started = true;
}

// Function to get the time synchronously (i.e not in a promise)
function getCurrentTimeSync(){
	if (!started){
		return 0;
	}else{
		return Date.now() + offset;
	}
}


module.exports = {
	setOffset: setOffset,
	getOffset: getOffset,
	resetClock: resetClock,
	startClock: startClock,
	updateOffset: updateOffset,
	getCurrentTimeSync: getCurrentTimeSync
}

/* 
// Code to set up clock.js to have a synchroniseWith() function instead of separating it
function setUpUDPServer(){
	
}

var slaves = []; // Need someway of getting slaves
var udpServer;
var lastMessageSentTime;
var RTT;
var masterIPAddress;
var masterPort = 41232; // HARDCODED FOR NOW
var isMaster = false;
var sycnrhonisationAlgorithm = "Cristian"; // Algorithm, Berkeley or Cristian

// Adds an ipAddress to the list of slaves, assumes they all have the same port
// Only useful if using Berkeley's algorithm
function addSlave(ipAddress, port=41233){
	slaves.push(ipAddress);
}

// Set up UDP servers depending on if this clock is the master or slave
function setUpClientUDPServer(){
	var dgram = require('dgram');
	var server = dgram.createSocket({type: 'udp4', reuseAddr: true});
	var HOST = ipAddressRetriever.getIPAddress();
	var PORT = 41233;
	
	// Set up error messages
	server.on('error', function(err){
		console.log("Error: ", err.stack);
	});
	
	// Set up message responses
	server.on('message', function(msg, info){
		var senderAddress = info.address;
		var senderPort = info.port;
		
		var jsonData = JSON.parse(msg);
		var type = jsonData["type"];
		
		if (type == "timeResponse"){
			var currentTimeFromMaster = jsonData["time"];
			var currentTime = getCurrentTimeSync();
			var rtt = ???????
			
			// Use different algorithm here???
		}
	});
	
	server.on('listening', function(){
		var address = server.address();
		console.log(`Server listening on ${address.address}:${address.port}`);
	});
	
	server.bind(PORT, HOST);
	
	udpServer = server;
}


function setUpMasterUDPServer(){
	var dgram = require('dgram');
	var server = dgram.createSocket({type: 'udp4', reuseAddr: true});
	var HOST = ipAddressRetriever.getIPAddress();
	var PORT = 41232;
	
	// Set up error messages
	server.on('error', function(err){
		console.log("Error: ", err.stack);
	});
	
	// Set up message responses
	server.on('message', function(msg, info){
		var senderAddress = info.address;
		var senderPort = info.port;
		
		var jsonData = JSON.parse(msg);
		
		if (type == "askForTime"){
			var currentTime = getCurrentTimeSync();
			var responseJSON = {"type":"timeResponse", "time":currentTime};
			var response = new Buffer(JSON.stringify(responseJSON));
			
			server.send(response, 0, response.length, senderPort, senderAddress, function(err, bytes){
				if (err) throw err;
				console.log("UDP message sent to: " + senderAddress + ":" + senderPort);
			});
		}
		
	});
	
	server.on('listening', function(){
		var address = server.address();
		console.log(`Server listening on ${address.address}:${address.port}`);
	});
	
	server.bind(PORT, HOST);
	
	udpServer = server;
	isMaster = true;
}


// Function to synchronise this clock with another IP address using Cristian's???
function synchroniseWith(ipAddress){
	masterIPAddres = ipAddress;
	
}
 */