module.exports = function(RED) {
    "use strict";

    var glob = require("glob");
    
    function SampleNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;

	reset();
	
        this.on('input', function(msg) {
	    switch(msg.topic){

	    case "load":
		node.load = msg.payload;
		loadBuffer(node);
		break;
		
	    case "offset":
		node.loadoffset = Number(msg.payload);
		loadBuffer(node);
		break;
		
	    default:
		switch(msg.payload){
		case "tick":
		    createSynth(node, "play", msg.timeTag);
		    break;
		    
		case "reset":
		    reset();
		    // do not send on message
		    break;

		default:
		// do nothing
		break;

		}
	    }
        });

	function reset(){

	    node.load = config.load || "";
	    node.loadoffset = Number(config.loadoffset) || 0;
	    
	    setTimeout(function(){
		freeBuffer(node);
		createBuffer(node);
	    }, 200);

	}

    }

    function LooperNode(config) {
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
		    stopSynth(node, "play");
		    break;

		case "record": // the state
		    stopSynth(node, "record");
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
		    stopSynth(node, node.state);
		    if(!node.load){
			node.count = -1;
			setState("waiting")
		    };
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
			createSynth(node, node.state, msg.timeTag);
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
			stopSynth(node, node.state);
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

	function restart(){
	    node.count = -1; // the number of relevant ticks left to the end of the play/record. -1 indicates it hasn't started yet
	    setState("wait");

	    // wait a little while to allow wires to be created

	    setTimeout(function(){
		freeBuffer(node);
		createBuffer(node);
	    }, 200);
	}
	
	function reset(){
	    node.input = config.input || "beat";
	    
	    node.start = config.start || "bar"; // sampler won't start playing/recording until this
	    
	    node.loop = config.loop || false;

	    node.length = Number(config.length) || 4;

	    restart();
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

	
    }
	
    function createBuffer(node){
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
	if(node.load){
	    loadBuffer(node);
	}
	else{
	    // create an empty buffer ready for recording
	    var seconds = 20; //assumed max length for now
	    var createMsg = {
		topic: "/b_alloc",
		payload: [node.bufnum, fps * seconds * 2, 2]
	    }
	    node.send(createMsg);
	}

    }

    function loadBuffer(node){
	var dir = __dirname + "/Dirt-Samples/" + node.load;
	var match = dir + "/*.wav";
	var fname;
	glob(match, {nocase: true}, function (er, files) {
	    var offset = node.loadoffset % files.length;
	    fname = files[offset];
	    // create and load the buffer from file
	    var createMsg = {
		topic: "/b_allocRead",
		payload: [node.bufnum, fname ]
	    }
	    node.send(createMsg);
	});
    }
    
    function freeBuffer(node){
	if(node.bufnum){
	    var freeMsg = {
		topic: "/b_free",
		payload: node.bufnum
	    }
	    node.send(freeMsg);
	}
    }

    function createSynth(node, action, timeTag){
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
	    freeSynth(node, node[synth]);
	    node[synth] = null;
	}

	var global = node.context().global;
	var id = Number(global.get("synth_next_sc_node"));
	if(isNaN(id)){
	    id = 100000; // high to avoid nodes from sclang
	}
	global.set("synth_next_sc_node", id + 1);
	node[synth] = id;

	var payload = [action + "Sample", node[synth], 1, 1, "buffer", node.bufnum];

	var address = "/s_new";

	var createMsg;
	if(timeTag){
	    createMsg  = {
		    payload:{
			timeTag: timeTag,
			packets: [
			    {
				address: address,
				args: payload
			    }
			]
		    }
		};


	}
	else{
	    createMsg = {topic: address, payload:payload};
	}

	node.send(createMsg);
    }

    function freeSynth(node, synth_id){
	if(synth_id){
	    var freeMsg = {
		topic: "/n_free",
		payload: synth_id
	    }
	    node.send(freeMsg);
	}
    }

    function stopSynth(node, action){
	freeSynth(node, node[action + "_synth_id"]);
    }
	
    RED.nodes.registerType("sample", SampleNode);
    RED.nodes.registerType("looper", LooperNode);
}

