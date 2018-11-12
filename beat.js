module.exports = function(RED) {
    "use strict";

    const mathjs = require("mathjs");
    const _ = require("underscore");
    const WebSocket = require("ws");
    const wsIP = "127.0.0.1";
    const wsPort = 2880; // seems to be unused and is reminiscent of node-red port 1880
    const wsPath = "beat";
    const heartbeatInterval = 5000;
    
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
		setTimeout(resetFollower, 100);
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
	    node.nextBeatStart = null;
	    node.beatCounter = new Object();
	    node.started = false;
	    if(node.wss){
		node.wss.clients.forEach(function each(client) {
		    if (client.readyState === WebSocket.OPEN) {
			client.send(JSON.stringify({payload: "stop"}));
		    }
		});
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
	    node.nextBeatStart = null;
	}

	function resetConductor(){
	    // set up web socket server
	    // get rid of old one if already there

	    node.wss = new WebSocket.Server({
		port: wsPort,
		perMessageDeflate: false,
		clientTracking: true
	    }, () => node.log("Web socket server created for beat conductor"));


	    node.wss.on('connection', function connection(ws, req){
		ws.on('message', function incoming(msg){
		    var rcvd = Date.now();
		    var jmsg = JSON.parse(msg);
		    if(jmsg.payload && jmsg.payload == "sync"){
			jmsg.conductorSent = rcvd;
		    }
		    ws.send(JSON.stringify(jmsg));
		});

	    });
	    

	    // when a beat happens,
	    // * send it to all followers
	    // * wait for response for updating offset estimate
	    // can have more than one follower per machine?
	    
	    // for offsets keep 9 most recent, ignore the fastest and slowest 2, average other five
	}
	
	function updateOffsets(msg, fRcvd){
	    const fSent = msg.followerSent;
	    const cSent = msg.conductorSent;
	    const rtt = fRcvd - fSent;
	    const offset = fSent - cSent - rtt/2;
	    node.offsets.push(offset);
	    if(node.offsets.length > 9){
		node.offsets.shift();
	    }

	    let sortedOffsets = node.offsets.slice().sort();
	    // remove the two largest
	    while(sortedOffsets.length >7 ){
		sortedOffsets.pop();
	    }
	    // and the two smallest
	    while(sortedOffsets.length >5 ){
		sortedOffsets.shift();
	    }
	    // then take the median
	    const medIndex = Math.floor(sortedOffsets.length /2);
	    const medOffset = sortedOffsets[medIndex];
	    node.offset = medOffset;
	}
	
	function resetFollower(){
	    
	    // set up web socket connection
	    node.connected = false;
	    node.offsets = [];
	    
	    const wsURL = "ws://" + wsIP +":" + wsPort + "/" + wsPath;
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
		// launch heartbeat a little while 
		// and make it random so that not all followers deployed at the same time
		// have their heartbeat at the same time
		setTimeout(heartbeat, 1000*Math.random());
	    });
	    
	    node.ws.on('message', function incoming(msg){
		const rcvd = Date.now();
		const jmsg = JSON.parse(msg);
		const localThisBeatStart = Number(jmsg.thisBeatStart) + Number(node.offset);
		const localNextBeatStart = Number(jmsg.nextBeatStart) + Number(node.offset);
		switch(jmsg.payload){
		case "tick":
		    // update the bpm if necessary
		    node.bpm = jmsg.bpm;
		    if(node.started){
			let incomingBeat = Number(jmsg.beat);
			node.bpm = jmsg.bpm;
			const beatCount = node.beatCounter['beat'];
			if(incomingBeat == beatCount + 1){
			    // beat is on time (conductor is ahead of follower)
			    node.nextBeatStart = localThisBeatStart;
			}
			else if(incomingBeat == beatCount){
			    // beat is slightly late (follower ahead of conductor)
			    node.nextBeatStart = localNextBeatStart;
			}
			else if(incomingBeat < beatCount){
			    // more than one beat late (follower ahead of conductor)
			    node.nextBeatStart = localNextBeatStart;
			}
			else{
			    // more than one beat early (conductor ahead of follower)
			    // should maybe set next beatStart to now
			    // or just reset the follower beatNum if a long way out
			    node.warn("incomg beat is early " + incomingBeat + " beatCount " + beatCount );
			}
		    }
		    else{
			node.bpm = jmsg.bpm;
			node.beatCounter = new Object();
			node.beatCounter['beat'] = jmsg.beat - 1;
			node.thisBeatStart = localThisBeatStart;
			beat();
			node.started = true;
		    }
		    break;

		case "stop":
		    stopBeat();
		    break;

		case "sync":
		    updateOffsets(jmsg, rcvd);
		    break;
		    
		default:
		    node.warn("unrecognised message in websocket client " + msg);
		}
	    });

	    function heartbeat(){
		if(node.connected){
		    let now = Date.now();
		    let msg = {payload: "sync",
			       followerSent: now}
		    node.ws.send(JSON.stringify(msg), function ack(error){
			if(error){
			    node.warn("heartbeat sync error " + error);
			    node.connected = false;
			}
		    });
		}
		else{
		    resetFollower();
		}
		node.heartbeat = setTimeout(heartbeat, heartbeatInterval);
	    }

	    // register with server
	    // * wait for response with time
	    // * send another response for updating latency/offset estimate


	    // wait for beat if it doesn't arrive, do it anyway and wait for the next one
	    // add sub-beats locally
	}
	    
	function beat(){
	    node.beatCounter = node.beatCounter || new Object();
	    node.subBeatNum = node.subBeatNum || 0;
	    node.thisBeatStart = node.thisBeatStart || Date.now();

	    if(node.subBeatNum === 0){
		setBPM();
	    }

	    // node.interval is set in setBPM()
	    node.nextBeatStart = Math.round(node.nextBeatStart || node.thisBeatStart + node.interval);
	    var subBeat = node.fractionalIntervals[node.subBeatNum];

	    for(var i = 0; i<subBeat.names.length; i++){
		var subName = subBeat.names[i];
		node.beatCounter[subName] = node.beatCounter[subName] || 0;
		node.beatCounter[subName]++;
	    }

	    if(node.sharing == "conductor" && node.subBeatNum == 0){
		const bmsg = {payload: "tick",
			      start: ["beat"],
			      beat:node.beatCounter['beat'],
			      bpm: node.current_bpm,
			      thisBeatStart: node.nextBeatStart,
			      nextBeatStart: node.nextBeatStart + node.interval
			     };
		const jbmsg = JSON.stringify(bmsg);
		
		node.wss.clients.forEach(function each(client) {
		    if (client.readyState === WebSocket.OPEN) {
			client.send(jbmsg, function ack(error){
			    if(error){
				node.warn(error +" Problem sending beat to follower" );
			    }
			});
		    }
		});
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
		msg.timeTag = node.thisBeatStart + subBeat.pos;
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
		node.thisBeatStart = node.nextBeatStart;
		// save next beat now - if a late beat arrives from a follower then it will be taken into account
		node.nextBeatStart = node.thisBeatStart + node.interval;
	    }

	    var nextSubBeat = node.fractionalIntervals[node.subBeatNum];
	    var nextSubBeatStart = node.thisBeatStart + nextSubBeat.pos;
	    var interval = Number(nextSubBeatStart) - Number(Date.now()) - Number(node.latency);
	    
	    node.tick = setTimeout(beat, interval);
	}
    }
    
	
    RED.nodes.registerType("beat", BeatNode);
}

