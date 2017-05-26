module.exports = function(RED) {
    "use strict";

    var osc = require("osc"); // required by node-red-contrib-osc
    
    function SynthNode(config) {
	
        RED.nodes.createNode(this,config);
        var node = this;
	
	reset();
	
        this.on('input', function(msg) {
	    switch(msg.topic){
	    case "volume":
		var newVol = Number(msg.payload);
		if(!Number.isNaN(newVol)){
		    node.vol = newVol;
		}
		
		node.vol = Math.min(100, Math.max(0, node.vol));

		setSynthVol();
		
		break;
		
	    default:
		switch(msg.payload){
		    
		case "play":
		case "tick":
		    if(Array.isArray(msg.midi)){
			msg.midi.forEach(function(midiVal){
			    sendNote(midiVal, msg);
			});
		    }
		    else{
			sendNote(msg.midi, msg);
		    }
		    break;
		    
		case "reset":
		    reset();
		    // just this once the reset message is not propagated
		    break;
		    
		case "stop":
		    for(var voice = 0; voice < node.voices; voice++){
			var stopMsg = {topic: "/n_set",
				       payload:
				       [node.synth_ids[voice], "gate" , 0]
				      }
			node.send(stopMsg);
		    }
		    break;
		    
		case "start":
		    // restart the synth
		    freeSynth();
		    createSynth();
		    break;
		    
		default:
		    // do nothing
		}
		
	    }
        });
	
	this.on('close', function(){
	    freeSynth();
	});
	
	function sendNote(midi, msg){
	    var payload = [node.synth_ids[node.next_voice]];
	    
	    if(midi == -1){
		payload.push("gate", 0);
	    }
	    else{
		payload.push("gate", 1);
		payload.push("t_trig", 1);
		if(midi){
		    payload.push("midi", midi);
		}
	    }

	    if(msg.timeTag ){
		var playmsg = {
		    payload:{
			timeTag: msg.timeTag,
			packets: [
			    {
				address: "/n_set",
				args: payload
			    }
			]
		    }
		};
	    }
	    else{
		var playmsg = {
		    topic: "/n_set",
		    payload:  payload
		}
	    }

	    node.send(playmsg);
	    
	    node.next_voice++;
	    if(node.next_voice >= node.voices){
		node.next_voice = 0;
	    }
	}
    
	function setSynthVol(){
	    var amp = node.vol/100.0; // Use a logarithmic scale?
	    for(var voice = 0; voice<node.voices; voice++){
		var volmsg = {
		    "topic": "/n_set",
		    "payload": [node.synth_ids[voice], "amp", amp]
		}
		node.send(volmsg);
	    }
	}
	
	function createSynth(){
	    var global = node.context().global;
	    for(var voice = 0; voice < node.voices; voice++){
		var id = Number(global.get("synth_next_sc_node"));
		if(isNaN(id)){
		    id = 100000; // high to avoid nodes from sclang
		}
		global.set("synth_next_sc_node", id + 1);
		node.synth_ids[voice] = id;
		var createMsg = {
		    topic: "/s_new",
		    payload: [node.name, node.synth_ids[voice], 1, 1]
		}
		node.send(createMsg);
	    }
	    setSynthVol();
	}
	
	function freeSynth(){
	    for(var voice = 0; voice<node.voices; voice++){
		if(node.synth_ids[voice]){
		    var freeMsg = {
			topic: "/n_free",
			payload: node.synth_ids[voice]
		    }
		    node.send(freeMsg);
		    node.synth_ids[voice] = null;
		}
	    }
	}
	
	function reset(){
	    node.name = config.name || "piano";
	    node.vol = Number(config.start_vol) || 70;
	    node.voices = Number(config.voices) || 1;
	    node.next_voice = 0;
	    node.synth_ids = Array(node.voices);
	    
	    freeSynth();
	    createSynth();
	}
    }
    
	
    RED.nodes.registerType("synth",SynthNode);
}

