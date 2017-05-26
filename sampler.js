module.exports = function(RED) {
    "use strict";

    function SamplerNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;

	reset();
	
        this.on('input', function(msg) {
	    switch(msg.payload){
	    case "tick":
		tickHandler(msg);
		break;
		
	    case "play": // the action
	    case "record": // the action
		switch(node.state){
		case "play": // the state
		    stopSynth("play");
		    break;

		case "record": // the state
		    stopSynth("record");
		    break;

		default:
		    // do nothing
		}
		node.count = -1;
		setState(msg.payload);
		break;

	    case "stop":
		switch(node.state){
		case "play":
		case "record":
		    stopSynth(node.state);
		    node.count = -1;
		    setState("waiting");
		}
		break;
		
	    case "reset":
		reset();
		// do not send on message
		break;
		
	    default:
		// do nothing
		break;

	    }
        });

	function tickHandler(msg){
	    switch(node.state){
	    case "wait":
		// do nothing
		break;
		
	    case "play": // the state
	    case "record": // the state
		var start = msg.start || [];
		if(node.count <= 0){
		    if(start.includes(node.start)){
			node.count = node.length;
			setState(node.state); // to display status
			createSynth(node.state);
		    }
		    else{
			return; // ignore all ticks until the start event
		    }
		}
		else{
		    if(start.includes(node.input)){
			node.count--;
		    }
		    if(node.count <= 0){
			stopSynth(node.state);
			if(node.loop){
			    // whether we are recording or looping we carry on to play
			    setState("play");
			    // call the handler immediately in case the looper starts playing immediately it finishes recording
			    tickHandler(msg);
			}
			else{
			    setState("wait"); // TODO: unless we are looping
			}
		    }
		}
		break;
		
	    default:
		// do nothing
	    }
	}
	
	function createBuffer(){
	    if(!node.bufnum){
		var global = node.context().global;
		var bufnum = Number(global.get("sampler_next_bufnum"));
		if(isNaN(bufnum)){
		    bufnum = 1; // hopefully no clashes with sclang
		}
		global.set("sampler_next_bufnum", bufnum + 1);
		node.bufnum = bufnum;
	    }
	    var fps = 44100;
	    var seconds = 20; //assumed max length for now
	    var createMsg = {
		topic: "/b_alloc",
		payload: [node.bufnum, fps * seconds * 2, 2]
	    }
	    node.send(createMsg);
	}

	function freeBuffer(){
	    if(node.bufnum){
		var freeMsg = {
		    topic: "/b_free",
		    payload: node.bufnum
		}
		node.send(freeMsg);
	    }
	}

	function createSynth(action){
	    if(!["play", "record"].includes(action)){
		node.warn("no synth for action " + action);
		return;
	    }

	    if(!node.bufnum){
		node.warn("cannot create sampler synth without buffer");
		return;
	    }
	    
	    var synth = action + "_synth_id";
	    if(node[synth]){
		freeSynth(node[synth]);
		node[synth] = null;
	    }

	    var global = node.context().global;
	    var id = Number(global.get("synth_next_sc_node"));
	    if(isNaN(id)){
		id = 100000; // high to avoid nodes from sclang
	    }
	    global.set("synth_next_sc_node", id + 1);
	    node[synth] = id;

	    var createMsg = {
		topic: "/s_new",
		payload: [action + "Sample", node[synth], 1, 1, "buffer", node.bufnum]
	    }
	    node.send(createMsg);
	}

	function freeSynth(synth_id){
	    if(synth_id){
		var freeMsg = {
		    topic: "/n_free",
		    payload: synth_id
		}
		node.send(freeMsg);
	    }
	}

	function stopSynth(action){
	    freeSynth(node[action + "_synth_id"]);
	}
	
	function setState(state){
	    // state can be:
	    // "wait" for a command ("play" or "record");
	    // "play"; although if beatCount is -1 it is not actually play yet
	    // "record"; ditto

	    var text, shape, colour;
	    node.state = state;
	    text = state;

	    switch(state){
	    case "record":
		colour = "red";
		break;

	    case "play":
		colour = "green";
		break;

	    case "wait":
		colour = "grey";
		break;
	    }
	    
	    if(node.count == -1){
		shape = "ring";
	    }
	    else{
		shape = "dot";
	    }
	    
	    node.status({fill: colour, shape: shape, text: state});
	}
	
	function restart(){
	    node.count = -1; // the number of relevant ticks left to the end of the play/record. -1 indicates it hasn't started yet
	    setState("wait");
	    
	    freeBuffer();
	    createBuffer();
	}
	
	function reset(){
	    node.input = config.input || "beat";
	    
	    node.start = config.start || "bar"; // sampler won't start playing/recording until this
	    
	    node.loop = config.loop || false;

	    node.length = Number(config.length) || 4;

	    restart();
	}
    }


    RED.nodes.registerType("sampler", SamplerNode);
}

