module.exports = function(RED) {
    "use strict";

    var mathjs = require("mathjs");
    var _ = require("underscore");

    function BeatNode(config) {
	
        RED.nodes.createNode(this,config);
        var node = this;
	
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
	    
	    setFractionalBeats(node.subBeats);
	    
	    setBPM(config.bpm);
	    
	    node.started = false;
	    node.beatNum = 0;
	}

	function setBPM(bpm){
	    bpm = bpm || node.context().global['bpm'] || 200;
	    bpm = Number(bpm);
	    if(!isNaN(bpm)){
		if(bpm>10 && bpm <1000){
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
	    node.beatCounter = node.beatCounter || new Object();
	    node.subBeatNum = node.subBeatNum || 0;
	    node.thisBeatStart = node.thisBeatStart || Date.now();
	    
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

