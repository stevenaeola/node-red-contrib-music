// DECIDE WHETHER TO USE SOCKETS INSTEAD OF REQUESTS
// NEED TO UPDATE TO ALLOW NEGATIVE OFFSETS WITHOUT ACTUALLY PUTTING THE TIME BACK (gentle offset slowdown method) DO THIS FOR beat.js too

var drift = 0; // milliseconds of drift added each second
var totalDrift = 0; // Total drift added in milliseconds
var offset = 0; // offset from real-time in milliseconds (can simulate multiple logical clocks)
var started = false;

// Set drift in milliseconds
function setDrift(d){
	drift = d;
}

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
	offset = offset + parseInt(changeAmount);
}

// Reset total drift
function resetClock(){
	totalDrift = 0;
}

// Start the clock (add drift every 3 seconds)
function startClock(){
	// Increase drift every 3 seconds
	started = true;
	setInterval(function(){
		totalDrift += drift; 
	}, 3000);
}

// Gets the current time in milliseconds (including offset and drift) 
// Returns a promise object containing a json object with time, totalDrift, and offset
function getCurrentTime(){
	return new Promise(function(resolve, reject){
		if (!started) reject("Clock not started"); 
		else{
			var date = new Date();
			var time = date.getTime(); // Time in milliseconds
			//console.log("Time from clock.js: ",time);
			time += offset; // Add offset
			time += totalDrift; // Add total drift
			//var dataToSendBack = {time: time, totalDrift: totalDrift, offset:offset}
			resolve({time: time, totalDrift: totalDrift, offset:offset});
		}
	});
}


// Returns promise containing only the time
function getCurrentClockTimeSimple(){
	return new Promise(function(resolve, reject){
		if (!started) reject("Clock not started"); 
		else{
			var date = new Date();
			var time = new Date().getTime(); // Time in milliseconds
			time += offset;
			time += totalDrift;
			resolve(time); 
		}
	});
}

function getCurrentTimeSync(){
	if (!started) return 0;
	return Date.now() + offset;
}

module.exports = {
	setDrift: setDrift,
	setOffset: setOffset,
	getOffset: getOffset,
	resetClock: resetClock,
	startClock: startClock,
	getCurrentTime: getCurrentTime,
	getCurrentTimeSimple: getCurrentClockTimeSimple,
	updateOffset: updateOffset,
	getCurrentTimeSync: getCurrentTimeSync
}

/*  // Example how to make a clock
var clock = require("./clock.js");
clock.setOffset(1000);
clock.setDrift(0.2);
clock.startClock();
clock.getCurrentTime()
 .then(function(timeDetails){
	// Do something with timeDetails
	var time = timeDetails["time"];
	var totalDrift = timeDetails["totalDrift"];
	var offset = timeDetails["offset"];
 })
 .catch(function(error){
	 // Deal with error
 }); */
 
 
/* // CODE FOR SETTING CLOCK UP AS A SERVER
var express = require("express");
var app = express();
var bodyParser = require("body-parser");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
// Returns the current time of this logical clock
app.get("/time", function(req, res){
	res.setHeader('Content-Type', 'application/json');
	if (!started){res.send({error: "Clock not started"});
	else{
		getCurrentTime()
		 .then(function(timeDetails){
			 var time = timeDetails["time"];
			 var totalDrift = timeDetails["totalDrift"];
			 var offset = timeDetails["offset"];
			 res.send({time: time});
		 })
		 .catch(function(error){
			 console.log("Error: ",error);
			 res.send({error: error});
		 });
	}
});


// Updates the offset of this logical clock based on response from master
app.post("/update", function(req, res){
	var change = parseInt(req.body.difference, 10);
	console.log("");
	console.log("Changing offset by: ",change);
	//var offset = clock.getOffset();
	//clock.setOffset(offset + change); // Deal with negative changes
	clock.updateOffset(change);
});


// Set up time server running on port 8880 (CHANGE FOR EACH CLIENT RUNNING ON SAME COMPUTER)
var port = 8881;

function setUpServer(){
	server = app.listen(port, function(){
		console.log("Server listening on port "+port)
	});
	
	server.on('error',function(e){
		console.log("Caught error");
		port+=1;
		setUpServer();
	});
}
console.log("Setting up server");
setUpServer(); */