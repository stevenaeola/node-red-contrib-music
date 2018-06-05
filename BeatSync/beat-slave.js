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
			beat(); 
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
	    
	    setBPM(config.bpm);
	    
	    node.started = false;
	    node.beatNum = 0;
		
		//console.log(config)
		
		// MY CODE
		node.ipAddress = ipAddressRetriever.getIPAddress(); // Get the IP address of this node
		//console.log("IP address: ", node.ipAddress);
		// Set ip address of master (Could configure port too)
		node.masterAddress = config.masterAddress; // Need to check it is a valid IP address
		//console.log("Master IP address: ",node.masterAddress)
		
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
		console.log("Slave clock: ",node.synchronisedClock);
		node.warn(node.synchronisedClock);
		
		node.messageReceived = false;
		node.connectedToMaster = false;
		
		setUpUDPServer();
		
	}

	function setBPM(bpm){
		// If not connected to master, don't do this (unless not trying to connect to master??)
	    if(!isNaN(bpm)){
		if(bpm>10 && bpm <1000){
			node.bpm = bpm;
		    node.interval = 60000.0/bpm;
		    
		    node.fractionalIntervals = _.map(
			node.fractionalBeats,
		    	function(event){ return {names: event.names, pos: event.pos*node.interval}});
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
		node.thisBeatStart = node.thisBeatStart || node.synchronisedClock.getCurrentTimeSync();//synchronisedClock.getCurrentTimeSync();
		node.subBeatNum = node.subBeatNum || 0;
		node.beatCounter = node.beatCounter || new Object();
				
		
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
		
		node.warn("SLAVE BEAT DETAILS");
		node.warn(node.thisBeatStart);
		node.warn(node.beatCounter["beat"]);
		node.warn("SLAVE time (logical clock): ");
		node.warn(node.synchronisedClock.getCurrentTimeSync());
		
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

	    var nextSubBeat = node.fractionalIntervals[node.subBeatNum];
	    var nextSubBeatStart = node.thisBeatStart + nextSubBeat.pos;
	    var interval = nextSubBeatStart - node.synchronisedClock.getCurrentTimeSync();//node.synchronisedClock.getCurrentTimeSync();//clock.getCurrentTimeSync();//Date.now(); // Replace Date.now() with my clock.js code?? YES DO THIS
	
		node.warn("Interval:");
		node.warn(interval);
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
		console.log("\n\n");
	}
	
	/* MY CODE FOR SYNCHRONISATION - TAKEN FROM master.js and slave.js */
	/* SLAVE */
	function setUpUDPServer(){
		var dgram = require('dgram');
		var client = dgram.createSocket({ type: 'udp4', reuseAddr: true });

		var HOST = node.ipAddress;//"10.245.142.191";//"192.168.1.115"; // Connecting to RPi
		var PORT = 41237; // Do the same with the port??

		client.on('error', function(err){
			console.log("Error: ", err.stack);
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
			console.log(`Server listening on ${address.address}:${address.port}`);
			calculateRoundTripTime(); // Could set an interval to do this?? Probably will just do it everytime it receives a message
			//setInterval(synchronise, 2000);
		});


		client.bind(PORT, HOST); // Bind client server so it can receive messages
		
		node.client = client;
	}
	
	
	function messageFromMaster(msg, info){
		console.log(`Client received: ${msg} from ${info.address}:${info.port}`);
		var serverAddress = info.address
		var serverPort = info.port
		
		// Only accept messages from beat-master (given by node.masterAddress)
		if (serverAddress !== node.masterAddress){
			console.log("Message not from master")
			console.log("Master: ", node.masterAddress)
			console.log("Current: ", serverAddress)
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
			updateBeatFromMaster(jsonData)

		}	
		
		if (type=="bpm"){
			var bpm = jsonData["bpm"];
			setBPM(bpm);
		}
		
		if (type == "rttEstimationResponse"){
			completeRoundTripTimeEstimation();
		}		
	}
	
	
	function updateBeatFromMaster(jsonData){
		node.thisBeatStart = jsonData["thisBeatStart"];
		node.subBeatNum = jsonData["subBeatNum"];
		node.beatCounter = jsonData["beatCounter"];
		
		// Check bpm value
		var masterBPM = jsonData["currentBPM"];
		if (masterBPM !== node.bpm){
			setBPM(masterBPM);
		}
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
			console.log("Master not defined")
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
			console.log('UDP message for rtt estimation sent to ' + serverHost +':'+ serverPort);
			//sendingTimes[serverHost] = sentTime; // Store the time the message was sent
		});

		globalContext.set("rttMessageSentTime",node.rttMessageSentTime);
	}
	
	
	function completeRoundTripTimeEstimation(){
		var currentTime = Date.now();
		//console.log("Message sent at: ", globalContext.get("rttMessageSentTime")); // GETS OLD VERSION OF rttMessageSentTime
		//console.log("Message received at: ",currentTime);
		var rtt = currentTime - globalContext.get("rttMessageSentTime");
		//console.log("Round trip time: ",rtt);
		globalContext.set("roundTripTime", rtt);
		node.messageReceived = true;
	}
	
	// Every 5 seconds check if a message was received from master
	// If it was, must be connected to master 
	// If it wasn't, send a RTT check message and wait 2 seconds
	// If master responds, must be connectedToMaster
	// If not, master is down
	var connectToMaster = setInterval(function(){
		if (node.messageReceived){
			node.connectedToMaster = true;
		}
		else if (!node.messageReceived){
			calculateRoundTripTime(); // Let master know slave is ready
			setTimeout(function(){
				node.connectedToMaster = node.messageReceived;
			}, node.timeoutToResend/2);
		}
		node.messageReceived = false;
	},node.timeoutToResend);
	
	connectToMaster;
    }
	
    	
	
	
	
    RED.nodes.registerType("beat-slave",BeatNode);
	

}

