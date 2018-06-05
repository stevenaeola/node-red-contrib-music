module.exports = function(RED) {
    "use strict";

    var mathjs = require("mathjs");
    var _ = require("underscore");
	
	// Set up clock
	var backupClock = require("./clock.js");
	backupClock.startClock();

	// Get IP address
	var ipAddressRetriever = require("./ipAddress.js");
		
    function BeatNode(config) {
	
        RED.nodes.createNode(this,config);
        var node = this;
		
		var globalContext = this.context().global;
	
	reset();
	
	
        this.on('input', function(msg) {
	    switch(msg.topic){
	    case "bpm":
		setBPM(msg.payload);
		break;

	    default:
		switch(msg.payload){
		case "start":
		    if(!node.started){
			beat(); // Need this to to be sent to the slaves and happen instantly???
			node.started = true;
		    }
		    node.send(msg);
		    break;

		case "stop":
		    clearTimeout(node.tick);
		    node.thisBeatStart = null;
		    node.started = false;
		    node.send(msg);
		    break;

		case "reset":
		    reset();
		    node.send(msg);
		    break;

		default:
		    node.send(msg);
		}
	    }
        });

	this.on('close', function(){
	    clearTimeout(node.tick);
	});
		
		
	function reset(){
	    clearTimeout(node.tick);
	    node.output = config.output;
	    node.subBeats = config.subBeats || [];
	    node.latency = Number(config.latency) || 0;
	    node.bpm = config.bpm;
	    setFractionalBeats(node.subBeats);
	    
		node.slaves = [];/*["10.245.142.191"];*///["192.168.1.115"]; // array of slave urls (GET AUTOMATICALLY IN FINAL VERSION)
		globalContext.set("slaves", node.slaves);
		
	    setBPM(config.bpm);
	    
	    node.started = false;
	    node.beatNum = 0;
		
		node.ipAddress = ipAddressRetriever.getIPAddress(); // Get the IP address of this node
		console.log("IP address: ", node.ipAddress);
		
		// Need to make sure berkeley nodes are running first!! Else this won't exist
		node.synchronisedClock = globalContext.get("slave-clock")||globalContext.get("master-clock")||backupClock;

		// Set up UDP server
		setUpUDPServer();
	}

	function setBPM(bpm){
		node.slaves = globalContext.get("slaves");
	    if(!isNaN(bpm)){
		if(bpm>10 && bpm <1000){
			node.bpm = bpm;
		    node.interval = 60000.0/bpm;
		    
		    node.fractionalIntervals = _.map(
			node.fractionalBeats,
		    	function(event){ return {names: event.names, pos: event.pos*node.interval}});
				
			// SEND TO SLAVES
			// console.log("Slaves: ",node.slaves);
			for (var i=0; i<node.slaves.length; i++){
				//var server = servers[i]; 
				// Extract host and port information
				var serverHost = node.slaves[i];
				var serverPort = 41236;//PORT; // All assumed to use the same port
				var messageJSON = {"type":"bpm", "bpm":bpm};
				// console.log("Sending bpm message: ", messageJSON);
				var message = new Buffer(JSON.stringify(messageJSON));

					
				node.server.send(message, 0, message.length, serverPort, serverHost, function(err, bytes) {
					if (err) throw err;
					// console.log('UDP message for bpm sent to ' + serverHost +':'+ serverPort);
					//sendingTimes[serverHost] = sentTime; // Store the time the message was sent
				});
			}
			
		}
		else{
		    node.warn("BPM not in range 10-1000");
		}
	    }
	    else{
		node.warn("BPM is not a number: " + bpm);
	    }
	}

	function setFractionalBeats(subBeats){
	    if(subBeats.length > 0){

		// find the LCM of the subBeat counts
		var lcm = 1;
		var subBeatList = [];
		for(var i = 0; i<subBeats.length; i++){
		    var subBeat = subBeats[i];
		    var count = Number(subBeat.count);
		    if(count > 0 && Number.isInteger(count)){
			lcm = mathjs.lcm(lcm, count);
			subBeatList.push({name:subBeat.name, count: count});
		    }
		    else{
			node.warn("subBeat count for " + subBeat.name + " needs to be a positive integer: " + count) ;
			return;
		    }
		}

		// generate a list of lists of all the subBeats with their position in the list
		var allEvents = [{name:node.output, pos:0}];

		for(var i = 0; i<subBeatList.length; i++){
		    var subBeat = subBeatList[i];
		    for(var j=0; j<subBeat.count; j++){
			allEvents.push({name:subBeat.name, pos:j*lcm/subBeat.count});
		    }
		}

		allEvents.sort(function(a,b){ return a.pos-b.pos});

		var combinedEvents = _.reduce(allEvents, function(sofar, event){

		    if(sofar.length == 0){
			return [{names:[event.name],pos:event.pos}];
		    }
		    var lastSofar = _.last(sofar);
		    var lastPos = lastSofar.pos;
		    var lastNames = lastSofar.names;
		    var eventPos = event.pos;
		    if(lastPos == eventPos){
			lastNames.push(event.name);
			sofar.pop();
			sofar.push({names:lastNames, pos:lastPos});
		    }
		    else{
			sofar.push({names:[event.name], pos:eventPos});
		    }

		    return sofar;
		}, []);

		node.fractionalBeats = _.map(combinedEvents, function (event){ event.pos /= lcm; return event;});
	    }
	    else{
		node.fractionalBeats = [{names:[node.output], pos:0}];
	    }
	    node.allSubBeatNames = node.fractionalBeats[0].names;
	    node.beatCounter = new Object();
	    node.subBeatNum = 0;
	    node.thisBeatStart = null;
	}

	function beat(){
		console.log("Perfoming beat");
		node.slaves = globalContext.get("slaves");
		//node.warn("Slaves:");
		//node.warn(node.slaves);
	    node.beatCounter = node.beatCounter || new Object();
	    node.subBeatNum = node.subBeatNum || 0;
	    node.thisBeatStart = node.thisBeatStart || node.synchronisedClock.getCurrentTimeSync();//node.synchronisedClock.getCurrentTimeSync();//clock.getCurrentTimeSync();//Date.now(); // Replace Data.now() with clock.js time??
	    
	    var subBeat = node.fractionalIntervals[node.subBeatNum];

	    for(var i = 0; i<subBeat.names.length; i++){
		var subName = subBeat.names[i];
		node.beatCounter[subName] = node.beatCounter[subName] || 0;
		node.beatCounter[subName]++;
	    }

	    var msg = {payload: "tick",
		       start: _.clone(subBeat.names)
		       };


	    for(var j = 0; j<node.allSubBeatNames.length; j++){
		var subName = node.allSubBeatNames[j];
		msg[subName] = node.beatCounter[subName];
	    }

	    if(node.latency){
		msg.timeTag = node.thisBeatStart + subBeat.pos + node.latency;
	    }
	    
		node.warn("MASTER BEAT DETAILS");
		node.warn(node.thisBeatStart);
		node.warn(node.beatCounter["beat"]);
		//node.warn("MASTER TIME (logical clock): ");
		//node.warn(node.synchronisedClock.getCurrentTimeSync());
		console.log("\n\n");
		
	    node.send(msg);

	    node.subBeatNum++;
		
		
	    if(node.subBeatNum >= node.fractionalIntervals.length){
		node.subBeatNum = 0;
		var firstSubBeat = node.fractionalIntervals[0];
		for(var i = 0; i<firstSubBeat.names.length; i++){
		    var subName = firstSubBeat.names[i];
		    if(subName != node.output){
			node.beatCounter[subName] = 0;
		    }
		}
		
		node.thisBeatStart += node.interval; // Set to time of next beat
	    }

	    var nextSubBeat = node.fractionalIntervals[node.subBeatNum];
	    var nextSubBeatStart = node.thisBeatStart + nextSubBeat.pos;
	    var interval = nextSubBeatStart - node.synchronisedClock.getCurrentTimeSync();//node.synchronisedClock.getCurrentTimeSync();//clock.getCurrentTimeSync()//Date.now(); // Replace Date.now() with my clock.js code??
		
		var currentTime = node.synchronisedClock.getCurrentTimeSync();

		// SEND BROADCAST MESSAGE INSTEAD OF ITERATING THROUGH ALL SLAVES
		for (var i=0; i<node.slaves.length; i++){
			//var server = servers[i]; 
			// Extract host and port information
			var serverHost = node.slaves[i];
			var serverPort = 41237;//PORT; // All assumed to use the same port
			var beatTime = currentTime + interval;
			var messageJSON = {"type":"beat", "thisBeatStart":node.thisBeatStart, "subBeatNum":node.subBeatNum, "beatCounter": node.beatCounter, "currentBPM": node.bpm};
			//console.log("Sending message: ", messageJSON)
			
			var message = new Buffer(JSON.stringify(messageJSON));
			
			// Get the time before sending the message
			var sentTime = node.synchronisedClock.getCurrentTimeSync(); 
				
			node.server.send(message, 0, message.length, serverPort, serverHost, function(err, bytes) {
				if (err) throw err;
				console.log('UDP message for beat tick sent to ' + serverHost +':'+ serverPort);
				//sendingTimes[serverHost] = sentTime; // Store the time the message was sent
			});
		}
	    node.tick = setTimeout(beat, interval);
	}
	
	function setUpUDPServer(){
		var slaves = node.slaves;
		
		var dgram = require('dgram');

		var server = dgram.createSocket({ type: 'udp4', reuseAddr: true });
		 
		var HOST = node.ipAddress;//"10.245.142.191";//"192.168.1.115"; // NEED SPECIFIC IP ADDRESS HERE
		var PORT = 41238;
		
		server.on('error', function(err){
			console.log("Error: ", err.stack);
			server.close();
		});

		// Emitted when a new datagram is available on the socket
		// info contains address, family(IPv4 or IPv6), port and size
		server.on('message', function(msg, info){
			messageFromSlave(msg, info);			
		});

		// Emitted when the socket begins listening for datagram messages 
		server.on('listening', function(){
			var address = server.address();
			console.log(`Server listening on ${address.address}:${address.port}`);
			
		});

		// Causes server to listen for messages on a specific port (and optional address)
		// If no address given, server listens on all addressess
		// 'listening' event emitted once binding is complete
		server.bind(PORT, HOST);
		
		node.server = server;
	}
	
	function messageFromSlave(msg, info){
		console.log(`Server received: ${msg} from ${info.address}:${info.port}`);
		
		//console.log(`Server received: ${msg} from ${info.address}:${info.port}`);
		var clientAddress = info.address
		var clientPort = info.port
		
		// Extract type information
		var jsonData = JSON.parse(msg);
		var type = jsonData["type"];
		
		if (type == "rttEstimation"){
			console.log("Received rtt message");
			rttResponse(clientAddress, clientPort);
		}
	}
	
	
	function rttResponse(address, port){
		node.slaves = globalContext.get("slaves");
		node.warn("Received response");
		node.warn("Slaves:");
		node.warn(node.slaves);
		// Assume this message is sent at deploy time (and only once)
		// Add this address to node.slaves
		if (!(node.slaves.includes(address))){
			node.slaves.push(address);
		}
		//node.warn(node.slaves);
		globalContext.set("slaves", node.slaves);
		//node.warn("Set slaves");
		node.warn(globalContext.get("slaves"));
		var messageJSON = {"type":"rttEstimationResponse"};
		var message = new Buffer(JSON.stringify(messageJSON));
		
		node.server.send(message, 0, message.length, port, address, function(err, bytes) {
			if (err) throw err;
			//console.log('UDP message for rtt estimation sent to ' + address +':'+ port);
			//sendingTimes[serverHost] = sentTime; // Store the time the message was sent
		});
	}
	
	
	
    }
    RED.nodes.registerType("beat-master",BeatNode);
	
	
	
}

