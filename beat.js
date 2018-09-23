module.exports = function(RED) {
    "use strict";

    const mathjs = require("mathjs");
    const _ = require("underscore");
    const WebSocket = require("ws");
    const wsIP = "127.0.0.1";
    const wsPort = 2880; // seems to be unused and is reminiscent of node-red port 1880
    const wsPath = "beat";
    
    function BeatNode(config) {
	
        RED.nodes.createNode(this,config);
        var node = this;
	
	stopBeat();
	reset();
	
	
        this.on('input', function(msg) {
	    switch(msg.topic){
	    case "bpm":
		node.bpm = msg.payload;
		setBPM();
		break;

	    default:
		switch(msg.payload){
		case "start":
		    if(!node.started && node.sharing !== "follower"){
			beat();
			node.started = true;
		    }
		    node.send(msg);
		    break;

		case "stop":
		    stopBeat();
		    node.send(msg);
		    break;

		case "reset":
		    stopBeat();
		    reset();
		    node.send(msg);
		    break;

		default:
		    node.send(msg);
		}
	    }
        });

	this.on('close', function(){
	    if(node.started){
		clearTimeout(node.tick);
	    }
	    if(node.heartbeat){
		clearTimeout(node.heartbeat);
		node.heartbeat = null;
	    }

	    if(node.wss){
		node.wss.close();
	    }
	    if(node.ws){
		node.ws.close();
	    }

	});
		
	function reset(){
	    node.started = node.started || false;
	    console.log("Clearing timeout for " + node.tick);
	    clearTimeout(node.tick);
	    node.started = false;
	    node.beatNum = 0;
	    node.output = config.output;
	    node.subBeats = config.subBeats || [];
	    node.latency = Number(config.latency) || 0;
	    node.sharing = config.sharing || "standalone";

	    // get rid of old sockets if already there

	    if(node.wss){
		node.wss.close();
	    }
	    if(node.ws){
		node.ws.close();
	    }

	    switch(node.sharing){

	    case "conductor":
		resetConductor();
		break;
		
	    case "follower":
		resetFollower();
		break;

	    default:
		// do nothing
	    }
	    setFractionalBeats(node.subBeats);
	    
	    setBPM();
	    
	}

	function stopBeat(){
	    clearTimeout(node.tick);
	    node.thisBeatStart = null;
	    node.started = false;
	    if(node.followers){
		for(var ip in node.followers){
		    var connections = node.followers[ip].ws;
		    for(var i = 0; i<connections.length; i++){
			connections[i].send(JSON.stringify({payload: "stop"}));
		    }
		}
	    }
	}
	
	function getBPM(){
	    return node.bpm || config.bpm || node.context().global['bpm'] || 200;
	}
	
	function setBPM(){
	    if(getBPM() == node.current_bpm){
		return;
	    }
	    var bpm = Number(getBPM());
	    if(!isNaN(bpm)){
		if(bpm>10 && bpm <1000){
		    node.interval = 60000.0/bpm;
		    node.fractionalIntervals = _.map(
			node.fractionalBeats,
		    	function(event){ return {names: event.names, pos: event.pos*node.interval}});
		    node.current_bpm = bpm;
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
	    node.subBeatCounts = new Object();
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
		    node.subBeatCounts[subBeat.name] = subBeat.count;
		    
		    for(var j=0; j<subBeat.count; j++){
			allEvents.push({name:subBeat.name,
					pos:j*lcm/subBeat.count});
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

	function resetConductor(){
	    // set up web socket server
	    // get rid of old one if already there

	    console.log("reset conductor");
	    node.wss = new WebSocket.Server({
		port: wsPort,
		perMessageDeflate: false,
		clientTracking: true
	    });

	    node.followers = {}; // client IP addressess are keys. Values are ojbects holding the socket connections, and details of the clock offsets
	    // offsets holds (up to) the last 9 estimated clock offsets
	    // offset is the best estimate

	    // when a follower registers
	    // * send an 'empty' beat (beatCount=-1) to elicit initial response for estimating clock offset

	    node.wss.on('connection', function connection(ws, req){
		var remoteIP = req.connection.remoteAddress;
		if(!node.followers[remoteIP]){
		    node.followers[remoteIP] = {ws: [], offsets: []};
		}
		node.followers[remoteIP].ws.push(ws);

		console.log("Received socket connection from " + remoteIP);
		ws.on('message', function incoming(msg){
		    console.log("Received message " + msg);
		    if(msg === "ping"){
			return;
		    }
		    updateOffsets(remoteIP, msg);
		    
		});

		var bmsg = {payload: "sync",
			    conductorSent: Date.now(),
			    beatCount: -1};
		ws.send(JSON.stringify(bmsg));
	    });
	    
	    
	    // when a beat happens,
	    // * send it to all followers
	    // * wait for response for updating offset estimate
	    // can have more than one follower per machine?
	    
	    // for offsets keep 9 most recent, ignore the fastest and slowest 2, average other five
	}
	
	function updateOffsets(remoteIP, msg){
	    var creceived = Date.now();
	    var jmsg = JSON.parse(msg);
	    var csent = jmsg['conductorSent'];
	    var rtt = creceived - csent;
	    var fsent = jmsg.followerSent;
	    var offset = fsent - csent - rtt/2;
	    var follow = node.followers[remoteIP];
	    follow.offsets.push(offset);
	    if(follow.offsets.length > 9){
		follow.offsets.shift();
	    }
//	    console.log("Offsets for " + remoteIP);
//	    console.log(follow.offsets);

	    var sortedOffsets = follow.offsets.slice().sort();
	    // remove the two largest
	    while(sortedOffsets.length >7 ){
		sortedOffsets.pop();
	    }
	    // and the two smallest
	    while(sortedOffsets.length >5 ){
		sortedOffsets.shift();
	    }
	    // then take the median
	    var medIndex = Math.floor(sortedOffsets.length /2);
	    var medOffset = sortedOffsets[medIndex];
//	    console.log("Estimated offset for " + remoteIP + ": " + medOffset);
	    follow.offset = medOffset;
	}
	
	function resetFollower(){
	    
	    // set up web socket connection
	    node.connected = false;
	    let wsURL = "ws://" + wsIP +":" + wsPort + "/" + wsPath;
	    try{
		node.ws = new WebSocket(wsURL);
		node.connected = true;
	    }
	    catch(e){
		node.warn("Cannot open connection at " + wsURL);
		node.connected = false;
		return;
	    }
	    node.ws.on('error', function error (){
		node.warn("Cannot open connection at " + wsURL);
		node.connected = false;
		return;
	    });
	    
	    node.ws.on('open', function open (){
		console.log("Opened client side web socket");
	    });
	    
	    node.ws.on('message', function incoming(msg){
		console.log("client received " + msg);
		var rcvd = Date.now();
		var jmsg = JSON.parse(msg);
		jmsg.followerSent = rcvd;
		var tmsg = JSON.stringify(jmsg);
		node.ws.send(tmsg, function ack(error){
		    node.connected = false;
		    return;
		});

		switch(jmsg.payload){
		case "tick":
		    if(node.started){
			console.log("beat already started");
			// see if the clock is in sync
			// update the bpm if necessary
		    }
		    else{
			console.log(" starting follower beat");
			node.bpm = jmsg.bpm;
			node.beatCounter['beat'] = jmsg.beat;
			node.thisBeatStart = jmsg.timeTag;
			node.latency = jmsg.latency;
			beat();
			node.started = true;
		    }
		    break;

		case "stop":
		    stopBeat();
		    break;

		case "sync":
		    // do nothing;
		    break;
		    
		default:
		    console.log("unrecognised message in websocket client " + msg);
		}
	    });

	    function heartbeat(){
		console.log("heartbeat");
		if(node.connected){
		    console.log("ping");
		    node.ws.send("ping", function ack(error){
			node.connected = false;
		    });
		}
		else{
		    console.log("reset");
		    resetFollower();
		}
		node.heartbeat = setTimeout(heartbeat, 10000);
	    }

	    if(!node.heartbeat){
		node.heartbeat = setTimeout(heartbeat, 10000);
	    }

	    // register with server
	    // * wait for response with time
	    // * send another response for updating latency/offset estimate


	    // wait for beat if it doesn't arrive, do it anyway and wait for the next one
	    // add sub-beats locally
	}
	    
	function beat(){
	    setBPM();
	    node.beatCounter = node.beatCounter || new Object();
	    node.subBeatNum = node.subBeatNum || 0;
	    node.thisBeatStart = node.thisBeatStart || Date.now();

	    
	    var subBeat = node.fractionalIntervals[node.subBeatNum];

	    if(node.sharing == "conductor" && node.subBeatNum == 0){
		for(let ip in node.followers){
		    let connections = node.followers[ip].ws;
		    let offset = node.followers[ip].offset;
		    let followerBeatTime = node.thisBeatStart + offset + node.latency;

		    
		    for(let i = 0; i<connections.length; i++){
			let bmsg = {payload: "tick",
				    start: ["beat"],
				    beat:node.beatCounter['beat'],
				    bpm: node.current_bpm,
				    latency: node.latency,
				    timeTag: followerBeatTime,
				    conductorSent: Date.now()
				   };
			
			connections[i].send(JSON.stringify(bmsg), function ack(error){
			    console.log("Problem sending to connection " + i);
			});
		    }
		}
	    }

	    
	    for(var i = 0; i<subBeat.names.length; i++){
		var subName = subBeat.names[i];
		node.beatCounter[subName] = node.beatCounter[subName] || 0;
		node.beatCounter[subName]++;
	    }
	    
	    var msg = {payload: "tick",
		       start: _.clone(subBeat.names),
		       bpm: node.current_bpm
		       };

	    for(var j = 0; j<node.allSubBeatNames.length; j++){
		var subName = node.allSubBeatNames[j];
		msg[subName] = node.beatCounter[subName];
		if(node.subBeatCounts[subName] >0){
		    msg["beats_per_" + subName] = 1.0/node.subBeatCounts[subName];
		}
	    }

	    if(node.latency){
		msg.timeTag = node.thisBeatStart + subBeat.pos + node.latency;
	    }
	    
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
		node.thisBeatStart += node.interval;
	    }

	    var nextSubBeat = node.fractionalIntervals[node.subBeatNum];
	    var nextSubBeatStart = node.thisBeatStart + nextSubBeat.pos;
	    var interval = nextSubBeatStart - Date.now();
	    node.tick = setTimeout(beat, interval);
	}
    }
    
	
    RED.nodes.registerType("beat",BeatNode);
}

