module.exports = function(RED) {
    "use strict";

    var osc = require("osc"); // required by node-red-contrib-osc
    var _ = require("underscore");
    
    
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
		    if(Array.isArray(msg.note)){
			msg.note.forEach(function(noteVal){
			    sendNote(noteVal, msg);
			});
		    }
		    else{
			sendNote(msg.note, msg);
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
	
	function sendNote(noteVal, msg){

	    var midi = note2midi(noteVal);

	    var payload;
	    var action;
	    var synth_id;
	    
	    if(node.voices>0){
		action = "/n_set";
		synth_id = node.synth_ids[node.next_voice];
		payload = [synth_id];
		if(midi == -1){
		    payload.push("gate", 0);
		}
		else{
		    payload.push("gate", 1);
		    payload.push("t_trig", 1);
		}
	    }
	    else{
		action = "/s_new";
		synth_id = -1;
		payload = [node.name, -1, 1, 1];
	    }
	    
	    if(midi){
		payload.push("midi", midi);
	    }

	    if(msg.timeTag ){
		var playmsg = {
		    payload:{
			timeTag: msg.timeTag,
			packets: [
			    {
				address: action,
				args: payload
			    }
			]
		    }
		};
	    }
	    else{
		var playmsg = {
		    topic: action,
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
	    node.voices = Number(config.voices) || 0;
	    node.next_voice = 0;
	    node.synth_ids = Array(node.voices);

	    node.octave = config.octave || 0;

	    setRoot(config.root);
	    node.scale = config.scale; // if not defined we will use the global value


	    freeSynth();
	    createSynth();
	}

	function setRoot(root){
	    var global = node.context().global;
	    root = root || global.get("root");
	    root = root || 60;

	    var midiroot = Number(root);

	    if(isNaN(midiroot)){
		var name2midi = {
		    c: 60,
		    d: 62,
		    e: 64,
		    f: 65,
		    g: 67,
		    a: 69,
		    b: 71
		}

		var rootbits = root.toLowerCase().split("");
		var base = rootbits.shift();
		midiroot = name2midi[base];
		if(midiroot === undefined){
		    node.warn("Scale root should be a midi number or start with a letter A-G");
		    return;
		}
		var next = rootbits.shift();
		if(next == "#" || next == "s"){
		    midiroot++;
		}
		else if(next == "b"){
		    midiroot--;
		}
		else if(next !== undefined){
		    rootbits.unshift(next);
		}
		if(rootbits.length > 0){
		    var octave = Number(rootbits.join(""));
		    if(!isNaN(octave)){
			midiroot += (octave - 5)*12;
		    }
		}

	    }
	    else{
		if(midiroot<0 && midiroot>127){
		    node.warn("Scale root must be in range 0-127");
		    return;
		}
	    }
	    node.root = midiroot;
	    
	}

	function note2midi(note){
	    
	    var global = node.context().global;

	    setRoot(config.root);
	    
	    if(Array.isArray(note)){
		return _.map(note, note2midi);
	    }
	    if(note === null){
		return -1;
	    }
	    var intervals = {
		minor: [0,2,3,5,7,8,10,12],
		major: [0,2,4,5,7,9,11,12],
		dorian: [0,2,3,5,7,9,10,12],
		mixolydian: [0,2,4,5,7,9,10,12],
		"major pentatonic": [0,2,4,7,9,12],
		"minor pentatonic": [0,3,5,7,10,12],
		blues: [0,3,5,6,7,10,12],
		chromatic: [0,1,2,3,4,5,6,7,8,9,10,11,12]
	    }

	    var scale = node.scale;
	    if(scale == "default"){
		scale = null;
	    }
	    scale = scale || global.get("scale") || "minor";

	    var offsets = intervals[scale];
	    var midi = node.root;
	    while(note > offsets.length){
		note -= offsets.length-1;
		midi += offsets[offsets.length-1];
	    }
	    
	    midi += node.octave*12;
	    
	    midi += offsets[note-1];
	    
	    return midi;
	}

	
    }


	
    RED.nodes.registerType("synth",SynthNode);
}

