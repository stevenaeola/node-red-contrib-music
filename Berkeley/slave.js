// BERKELEY'S ALGORITHM

var express = require("express");
var app = express();
var bodyParser = require("body-parser");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

// Set up logical clock (only needed when running all files on one computer)
var clock = require("./../clock.js");
//clock.setOffset(2000);
//clock.setDrift(0.4);
clock.startClock();


var UDP_OR_TCP = true; // True if using UDP, false if using TCP

var differences = []; // Array to store the data about differences applied after each synchronisation round

// Save difference data after 20 seconds
var storeDifferenceData = require('./../storeDifferenceData.js');
var communicationType = UDP_OR_TCP ? "UDP" : "TCP";

var samplesTaken = 0; // When this reaches 20, save the data and end
var largeOffset = false;

// Stores the difference data for this client
function storeData(){
	storeDifferenceData.storeDifferences(differences, "Berkeley's", communicationType, synchronisationRate, largeOffset);
	console.log("\n\n SAVED DATA \n\n");
}

// HOW DOES THIS SLAVE FIND OUT THE SYNCHRONISATION RATE??? (STORE IN CONFIG FILE!!)
var synchronisationRate = 2;

//================================================================================================
// USES EXPRESS (TCP)
// Returns the current time of this logical clock
app.get("/time", function(req, res){
	console.log("Request for time");
	res.setHeader('Content-Type', 'application/json');
	clock.getCurrentTimeSimple()
	 .then(function(result){
		 var time = result;
/* 		 var totalDrift = timeDetails["totalDrift"];
		 var offset = timeDetails["offset"];
		 console.log(timeDetails);
		 console.log("Offeset: ",offset);
		 console.log("Total drift: ",totalDrift); */
		 console.log("Current time: ",time);
		 res.send({time: time});
	 })
	 .catch(function(error){
		 console.log("Error: ",error);
		 res.send({error: error});
	 });
});


// REPLACE clock.updateOffset(change) with beatGenerator.updateOffset(change);
// Updates the offset of this logical clock based on response from master
app.post("/update", function(req, res){
	var change = parseInt(req.body.difference, 10);
	console.log("");
	console.log("Changing offset by: ",change);
	//var offset = clock.getOffset();
	//clock.setOffset(offset + change); // Deal with negative changes
	updateOffset(change);
});


// Set up time server running on port 8880 (CHANGE FOR EACH CLIENT RUNNING)
var port = 8881;

function setUpServer(){
	server = app.listen(port, function(){
		console.log("Server listening on port "+port)
	});
	
/* 	server.on('error',function(e){
		console.log("Caught error");
		port+=1;
		setUpServer();
	}); */
}

if(!UDP_OR_TCP){
	console.log("Setting up server");
	setUpServer();
}

//========================================================================================================================================

// Function wrapper for clock.updateOffset function
function updateOffset(offset){
	differences.push(offset);
	clock.updateOffset(offset);

	samplesTaken += 1; // Increase samples counter
	if(samplesTaken >= 20){
		// Save
		storeData();
		samplesTaken = 0; // Reset
		return; // End
	}
}

//========================================================================================================================================
//CODE FOR UDP COMMUNICATION
var dgram = require('dgram');

var client = dgram.createSocket('udp4');

var HOST = /*"10.245.142.79";*/"192.168.1.115"; // Connecting to RPi
var PORT = 41235;

client.on('error', function(err){
	console.log("Error: ", err.stack);
	client.close();
});

// Emitted when a new datagram is available on the socket
// info contains address, family(IPv4 or IPv6), port and size
client.on('message', function(msg, info){
	//console.log(`Server received: ${msg} from ${info.address}:${info.port}`);
	
	// Extract type information
	var jsonData = JSON.parse(msg);
	var type = jsonData["type"];
	
	//console.log(type);
	
	// Type called to update offset
	if (type == "update"){
		var offset = jsonData["value"]; // Extract offset value from message
		console.log("Updating offset: ",offset);
		console.log("\n");
		//differences.push(offset); // Need someway of storing RTT with it too, need that sent from master.js
		updateOffset(offset);// Update the offset
	}
	
	// Server asking for the time
	if(type=="ask"){
		// Extract information from server that is asking for the time
		var serverHost = info.address;
		var serverPort = info.port;

		// Get the current time
		clock.getCurrentTime()
		.then(function(timeDetails){
			var time = timeDetails["time"];
			var jsonResponse = {"type":"time", "value":time}; // Create JSON response
			var message = new Buffer(JSON.stringify(jsonResponse)); // Create message buffer
			
			// Send message back
			client.send(message, 0, message.length, serverPort, serverHost, function(err, bytes) {
				if (err) throw err;
				console.log('UDP message sent to ' + serverHost +':'+ serverPort);
			});
		});
	}
});

//===================================================================================================================================

// Emitted when the socket begins listening for datagram messages 
client.on('listening', function(){
	var address = client.address();
	console.log(`Server listening on ${address.address}:${address.port}`);
	//setInterval(synchronise, 2000);
});


if (UDP_OR_TCP){
	client.bind(PORT, HOST); // Bind client server so it can receive messages
}



