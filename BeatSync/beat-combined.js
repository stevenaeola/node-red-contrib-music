module.exports = function(RED) {
    "use strict";

    var mathjs = require("mathjs");
    var _ = require("underscore");
	
	// Set up clock
	var backupClock = require("./clock.js");
	backupClock.startClock();

	// Get IP address
	var ipAddressRetriever = require("./ipAddress.js");
		
    function BeatNodeCombined(config) {
	
        RED.nodes.createNode(this,config);
        var node = this;
		
		var globalContext = this.context().global;
	
		setTimeout(reset, 1000); // Set timeout so berkeley nodes can set globalContext clocks before this node tries to access them
	
	
        this.on('input', function(msg) {
	    switch(msg.topic){
	    case "bpm":
		if ((!node.isMaster && !node.connectedToMaster) || node.isMaster) setBPM(msg.payload); // Only allow slaves to set BPM if not connected to master
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
		clearInterval(node.connectToMaster);
	});
		
		
	function reset(){
		node.isMaster = config.isMaster;
		if (node.isMaster){
			masterReset();
		}else{
			slaveReset();
		}
	}

	
	function masterReset(){
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
		//console.log("IP address: ", node.ipAddress);
		
		// Need to make sure berkeley nodes are running first!! Else this won't exist
		node.synchronisedClock = globalContext.get("master-clock")||globalContext.get("slave-clock")||backupClock;
	
		node.bandGroup = config.bandGroup;
		//console.log("BAND GROUP: ",node.bandGroup)
		globalContext.set("bandGroup", node.bandGroup);
		
		if (node.server!= null){
			node.server.close();
		}
		node.server = null;
		
		// Set up UDP server
		setUpUDPServer();
	}
	
	
	function slaveReset(){
		clearTimeout(node.tick);
		clearInterval(node.connectToMaster);
	    node.output = config.output;
	    node.subBeats = config.subBeats || [];
	    node.latency = Number(config.latency) || 0;
	    node.bpm = config.bpm;
		
	    setFractionalBeats(node.subBeats);
	    
	    setBPM(config.bpm);
	    
	    node.started = false;
	    node.beatNum = 0;
		
		//console.log(config)
		
		// MY CODE
		node.ipAddress = ipAddressRetriever.getIPAddress(); // Get the IP address of this node

		// Set ip address of master (Could configure port too)
		node.masterAddress = config.masterAddress; // Need to check it is a valid IP address
		//console.log("Master IP address: ",node.masterAddress)
		globalContext.set("masterAddress",node.masterAddress);
		
		// Send message to master to calculate RTT
		node.roundTripTime = 0;
		
		// Set variable for next beat time???
		node.intervalToNextBeat = 0;
		node.timeOfNextBeat = 0;
		node.intervalOffset = 0;
		node.rttMessageSentTime = 0;
		
		globalContext.set("intervalToNextBeat", node.intervalToNextBeat);
		globalContext.set("timeOfNextBeat", node.timeOfNextBeat);
		globalContext.set("intervalOffset", node.intervalOffset);
		globalContext.set("rttMessageSentTime", node.rttMessageSentTime);
		
		node.synchronisedClock = globalContext.get("slave-clock")||globalContext.get("master-clock")||backupClock;
		var slaveClock = globalContext.get("slave-clock") || null;
		var masterClock = globalContext.get("master-clock") || null;
		
		node.timeoutToResend = 5000; // If no message received within 5 seconds, try to join master again
		node.messageReceived = false;
		node.connectedToMaster = false;
		
		globalContext.set("bandGroup", "Group 1");
		
		//console.log("NODE CLIENT: ", node.client);
		if (node.client!= null){
			//console.log("CLOSING CLIENT");
			node.client.close();
		}
		node.client = null;
		
		setUpUDPServer();
	}
	
	
	function setBPM(bpm){
		if (node.isMaster) node.slaves = globalContext.get("slaves");
	    if(!isNaN(bpm)){
		if(bpm>10 && bpm <1000){
			//console.log("CHANGING BPM");
			node.bpm = bpm;
		    node.interval = 60000.0/bpm;
		    
		    node.fractionalIntervals = _.map(
			node.fractionalBeats,
		    	function(event){ return {names: event.names, pos: event.pos*node.interval}});
				
			// SEND TO SLAVES
			// console.log("Slaves: ",node.slaves);
			if (node.isMaster){
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
		}
		else{
		    node.warn("BPM not in range 10-1000");
		}
	    }
	    else{
		node.warn("BPM is not a number: " + bpm);
	    }
		//console.log("BPM: ",node.bpm);
		//console.log("INTERVAL: ",node.interval);
		globalContext.set("bpm", node.bpm);
		globalContext.set("interval", node.interval);
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
		if (node.isMaster) masterBeat();
		else{
			slaveBeat();
		}
	}
	
	
	function masterBeat(){
		//console.log("Perfoming beat");
		node.slaves = globalContext.get("slaves");
		//node.warn("Slaves:");
		//node.warn(node.slaves);
	    node.beatCounter = node.beatCounter || new Object();
	    node.subBeatNum = node.subBeatNum || 0;
	    node.thisBeatStart = node.thisBeatStart || node.synchronisedClock.getCurrentTimeSync();//node.synchronisedClock.getCurrentTimeSync();//clock.getCurrentTimeSync();//Date.now(); // Replace Data.now() with clock.js time??
	    
		
		var beatStartTimeSystemClock = Date.now(); // Use for timeTag as timeTag must be relative to system clock as it is used in the OSC node
		
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
			//console.log("ADDING LATENCY: ", node.latency)
			msg.timeTag = beatStartTimeSystemClock + subBeat.pos + node.latency;
			//console.log("TIME TAG: ",msg.timeTag);
			//console.log("CURRENT TIME: ", node.synchronisedClock.getCurrentTimeSync());
	    }
	    
		//node.warn("MASTER BEAT DETAILS");
		//node.warn(node.thisBeatStart);
		//node.warn(node.beatCounter["beat"]);
		//node.warn("MASTER TIME (logical clock): ");
		//node.warn(node.synchronisedClock.getCurrentTimeSync());
		
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
			var messageJSON = {"type":"beat", "thisBeatStart":node.thisBeatStart, "subBeatNum":node.subBeatNum, "beatCounter": node.beatCounter, "currentBPM": node.bpm, "latency":node.latency};
			//console.log("Sending message: ", messageJSON)
			
			var message = new Buffer(JSON.stringify(messageJSON));
			
			// Get the time before sending the message
			var sentTime = node.synchronisedClock.getCurrentTimeSync(); 
				
			node.server.send(message, 0, message.length, serverPort, serverHost, function(err, bytes) {
				if (err) throw err;
				//console.log('UDP message for beat tick sent to ' + serverHost +':'+ serverPort);
				//sendingTimes[serverHost] = sentTime; // Store the time the message was sent
			});
		}
	    node.tick = setTimeout(beat, interval);
		//console.log("\n\n");
	}
	
	
	function slaveBeat(){
		//console.log("Perfoming beat");
		node.interval = globalContext.get("interval");
		node.bpm = globalContext.get("bpm");
		//console.log("INTERVAL: ",node.interval);
		node.thisBeatStart = globalContext.get("thisBeatStart");
		//node.subBeatNum = globalContext.get("subBeatNum");
		node.beatCounter = globalContext.get("beatCounter");
		node.latency = globalContext.get("latency") || node.latency || 0;
		
		node.thisBeatStart = node.thisBeatStart || node.synchronisedClock.getCurrentTimeSync();//synchronisedClock.getCurrentTimeSync();
		node.subBeatNum = node.subBeatNum || 0;
		node.beatCounter = node.beatCounter || new Object();
				
		var beatStartTimeSystemClock = Date.now(); // Use this for timeTags as timeTags must be relative to the system clock
		
		var difference = node.synchronisedClock.getCurrentTimeSync() - node.thisBeatStart;
		//node.warn("thisBeatStart: ");
		//node.warn(node.thisBeatStart);
		//node.warn("Difference");
		//node.warn(difference);
		
		// Don't perform beats in the past
		while (difference > node.interval/2){
			node.thisBeatStart += node.interval;
			difference = node.synchronisedClock.getCurrentTimeSync() - node.thisBeatStart;
			//console.log("Difference: ", difference);
		}
		
		// If thisBeatStart is in the future, bring it back to a reasonable time interval
		while(difference < -node.interval/2){
			//console.log("Ignoring this beat start as far in the future");
			node.thisBeatStart -= node.interval
			difference = node.synchronisedClock.getCurrentTimeSync() - node.thisBeatStart;
		}
		
		//console.log("SUB BEAT NUM: ", node.subBeatNum);
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
			//console.log("ADDING LATENCY: ", node.latency)
			msg.timeTag = beatStartTimeSystemClock + subBeat.pos + node.latency;
			//console.log("TIME TAG: ",msg.timeTag);
			//console.log("CURRENT TIME: ", node.synchronisedClock.getCurrentTimeSync());
	    }
		
		//node.warn("SLAVE BEAT DETAILS");
		//node.warn(node.thisBeatStart);
		//node.warn(node.beatCounter["beat"]);
		//node.warn("SLAVE time (logical clock): ");
		//node.warn(node.synchronisedClock.getCurrentTimeSync());
		
		node.send(msg); // NEED THIS TO ALLOW BEAT TO BE PASSED THROUGH

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
			node.thisBeatStart += node.interval;
	    }
		
		globalContext.set("thisBeatStart", node.thisBeatStart);
		globalContext.set("subBeatNum", node.subBeatNum);
		globalContext.set("beatCounter", node.beatCounter);
		
	    var nextSubBeat = node.fractionalIntervals[node.subBeatNum];
	    var nextSubBeatStart = node.thisBeatStart + nextSubBeat.pos;
	    var interval = nextSubBeatStart - node.synchronisedClock.getCurrentTimeSync();//node.synchronisedClock.getCurrentTimeSync();//clock.getCurrentTimeSync();//Date.now(); // Replace Date.now() with my clock.js code?? YES DO THIS
	
		//node.warn("Interval:");
		//node.warn(interval);
		//clock.getCurrentTimeSimple()
		//.then(function(currentTime){
/* 			console.log("Setting time of next beat slave");
			console.log("Interval offset: ",globalContext.get("intervalOffset"));
			var interval_updated = interval + globalContext.get("intervalOffset"); //node.intervalOffset; // Offset interval to match master. Need to deal with intervalOffset > interval
			console.log("Updated interval: ",interval_updated);
			node.timeOfNextBeat = currentTime + interval; // Store timeStamp of next beat relative to logical clock (if logical clock changes, this won't be accurate anymore)
			node.intervalToNextBeat = interval; // Store interval as well
			globalContext.set("intervalToNextBeat", node.intervalToNextBeat);
			console.log("Time of next beat slave: ",node.timeOfNextBeat);
			 */
			//interval = interval_updated; // Update the interval to match
		
		node.tick = setTimeout(beat, interval);
		//});
		//console.log("\n\n");
	}
	
	
	function setUpUDPServer(){
		if (node.isMaster){
			setUpUDPServerMaster();
		}else{
			setUpUDPServerSlave();
		}
	}
	
	
	function setUpUDPServerMaster(){
		var slaves = node.slaves;
		
		var dgram = require('dgram');

		var server = dgram.createSocket({ type: 'udp4', reuseAddr: true });
		 
		var HOST = node.ipAddress;//"10.245.142.191";//"192.168.1.115"; // NEED SPECIFIC IP ADDRESS HERE
		var PORT = 41238;
		
		server.on('error', function(err){
			//console.log("Error: ", err.stack);
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
			//console.log(`Server listening on ${address.address}:${address.port}`);
			
		});

		// Causes server to listen for messages on a specific port (and optional address)
		// If no address given, server listens on all addressess
		// 'listening' event emitted once binding is complete
		server.bind(PORT, HOST);
		
		node.server = server;
	}
	
	
	function setUpUDPServerSlave(){
		var dgram = require('dgram');
		var client = dgram.createSocket({ type: 'udp4', reuseAddr: true });

		var HOST = node.ipAddress;//"10.245.142.191";//"192.168.1.115"; // Connecting to RPi
		var PORT = 41237; // Do the same with the port??

		client.on('error', function(err){
			//console.log("Error: ", err.stack);
			client.close();
		});

		// Emitted when a new datagram is available on the socket
		// info contains address, family(IPv4 or IPv6), port and size
		client.on('message', function(msg, info){
			messageFromMaster(msg, info);
		});

		//===================================================================================================================================
		// Emitted when the socket begins listening for datagram messages 
		client.on('listening', function(){
			var address = client.address();
			//console.log(`Server listening on ${address.address}:${address.port}`);
			calculateRoundTripTime(); // Could set an interval to do this?? Probably will just do it everytime it receives a message
			checkMasterAvailability();
			//setInterval(synchronise, 2000);
		});


		client.bind(PORT, HOST); // Bind client server so it can receive messages
		
		node.client = client;
	}
	
	
	
	// MASTER FUNCTIONS /////////////////////////////
	function messageFromSlave(msg, info){
		//console.log(`Server received: ${msg} from ${info.address}:${info.port}`);
		
		//console.log(`Server received: ${msg} from ${info.address}:${info.port}`);
		var clientAddress = info.address
		var clientPort = info.port
		
		// Extract type information
		var jsonData = JSON.parse(msg);
		var type = jsonData["type"];
		
		if (type == "rttEstimation"){
			//console.log("Received rtt message");
			rttResponse(clientAddress, clientPort);
		}
	}
	
	
	function rttResponse(address, port){
		node.slaves = globalContext.get("slaves");
		//node.warn("Received response");
		//node.warn("Slaves:");
		//node.warn(node.slaves);
		// Assume this message is sent at deploy time (and only once)
		// Add this address to node.slaves
		if (!(node.slaves.includes(address))){
			node.slaves.push(address);
		}
		//node.warn(node.slaves);
		globalContext.set("slaves", node.slaves);
		//node.warn("Set slaves");
		//node.warn(globalContext.get("slaves"));
		var bandGroup = globalContext.get("bandGroup") || "Group 1";
		var messageJSON = {"type":"rttEstimationResponse", "bandGroup":bandGroup, "latency":node.latency};
		var message = new Buffer(JSON.stringify(messageJSON));
		
		node.server.send(message, 0, message.length, port, address, function(err, bytes) {
			if (err) throw err;
			//console.log('UDP message for rtt estimation sent to ' + address +':'+ port);
			//sendingTimes[serverHost] = sentTime; // Store the time the message was sent
		});
	}
	
	//SLAVE FUNCTIONS //////////////////////////////
	
	function messageFromMaster(msg, info){
		node.masterAddress = globalContext.get("masterAddress");
		//console.log(`Client received: ${msg} from ${info.address}:${info.port}`);
		var serverAddress = info.address
		var serverPort = info.port
		
		// Only accept messages from beat-master (given by node.masterAddress)
		if (serverAddress !== node.masterAddress){
			//console.log("Message not from master")
			//console.log("Master: ", node.masterAddress)
			//console.log("Current: ", serverAddress)
			return
		}
		
		node.messageReceived = true;
		
		// Extract type information
		var jsonData = JSON.parse(msg);
		var type = jsonData["type"];
		
		//console.log(type);
		
		// TODO: CHANGE TO CASE SWITCH
		// Type called to update offset
		if (type == "beat"){
			updateBeatFromMaster(jsonData);

		}	
		
		if (type=="bpm"){
			var bpm = jsonData["bpm"];
			setBPM(bpm);
		}
		
		if (type == "rttEstimationResponse"){
			completeRoundTripTimeEstimation(jsonData);
		}		
	}
	
	
	function updateBeatFromMaster(jsonData){
		node.thisBeatStart = jsonData["thisBeatStart"];
		//node.subBeatNum = jsonData["subBeatNum"];
		node.beatCounter = jsonData["beatCounter"];
		
		//console.log("Updated this beat start: ",node.thisBeatStart);
		globalContext.set("thisBeatStart", node.thisBeatStart);
		//globalContext.set("subBeatNum", node.subBeatNum);
		globalContext.set("beatCounter", node.beatCounter);
		// Check bpm value
		var masterBPM = jsonData["currentBPM"];
		if (masterBPM !== node.bpm){
			//console.log("MASTER BPM IS NOT THE SAME AS THE CURRENT BPM SO CHANGING");
			setBPM(masterBPM);
		}
		
		node.latency = jsonData["latency"];
		globalContext.set("latency", node.latency);
	}
	
	
	// RTT CALCULATION
	function calculateRoundTripTime(){
		// Could send multiple messages => store results in array
		// setTimeout to average RTT results (maybe ignore outliers?? Or use to find potential maximum?)
		startRoundTripTimeEstimation();
	}
	
	
	function startRoundTripTimeEstimation(){
		//node.warn(node.rttMessageSentTime);
		if (node.masterAddress == "") {
			//console.log("Master not defined")
			return;
		}
		
		var messageJSON = {"type":"rttEstimation"};
		//console.log("Sending message: ", messageJSON);
		var message = new Buffer(JSON.stringify(messageJSON));
		
		var serverHost = node.masterAddress;
		var serverPort = 41238; // HARDCODED FOR NOW (Store as node property)
		
		// WAIT FOR CLIENT TO BE INITIALISED
		
		var currentTime = Date.now();
		node.rttMessageSentTime = currentTime;
		//console.log("RTT message sent time: ",node.rttMessageSentTime); // UPDATE WORKS HERE
		//console.log("Ready to send RTT message to beat-master");
		
		node.client.send(message, 0, message.length, serverPort, serverHost, function(err, bytes) {
			if (err) throw err;
			//console.log('UDP message for rtt estimation sent to ' + serverHost +':'+ serverPort);
			//sendingTimes[serverHost] = sentTime; // Store the time the message was sent
		});

		globalContext.set("rttMessageSentTime",node.rttMessageSentTime);
	}
	
	
	function completeRoundTripTimeEstimation(message){
		var currentTime = Date.now();
		//console.log("Message sent at: ", globalContext.get("rttMessageSentTime")); // GETS OLD VERSION OF rttMessageSentTime
		//console.log("Message received at: ",currentTime);
		var rtt = currentTime - globalContext.get("rttMessageSentTime");
		//console.log("Round trip time: ",rtt);
		globalContext.set("roundTripTime", rtt);
		//console.log("COMPLETED ROUND TRIP TIME ESTIMATION")
		node.messageReceived = true;
		globalContext.set("messageReceived", node.messageReceived);
		//console.log("MESSAGE RECEIVED 1: ", globalContext.get("messageReceived"));
		
		// Set band group
		var bandGroup = globalContext.get("bandGroup");
		if (message["bandGroup"] != bandGroup){
			globalContext.set("bandGroup", message["bandGroup"]);
		}
		
		node.latency = message["latency"];
		globalContext.set("latency", node.latency);
	}
	
	// Every 5 seconds check if a message was received from master
	// If it was, must be connected to master 
	// If it wasn't, send a RTT check message and wait 2 seconds
	// If master responds, must be connectedToMaster
	// If not, master is down
	function checkMasterAvailability(){
		node.messageReceived = globalContext.get("messageReceived");
		node.connectToMaster = setInterval(function(){
			if (node.messageReceived){
				node.connectedToMaster = true;
			}
			else if (!node.messageReceived){
				calculateRoundTripTime(); // Let master know slave is ready
				setTimeout(function(){
					node.messageReceived = globalContext.get("messageReceived");
					//console.log("MESSAGE RECEIVED 2: ",node.messageReceived);
					node.connectedToMaster = node.messageReceived;
				}, node.timeoutToResend/2);
			}
			node.messageReceived = false;
			//console.log("CONNECTED TO MASTER: ",node.connectedToMaster + "\n\n");
		},node.timeoutToResend);
		
		node.connectToMaster;
	}
	
    }
	
    RED.nodes.registerType("beat-combined",BeatNodeCombined);
	
	
	
}

