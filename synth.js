module.exports = function(RED) {
    "use strict";

    var osc = require("osc"); // required by node-red-contrib-osc
    var _ = require("underscore");
    var fs = require("fs");

    
    var configurables = ["root", "scale", "volume", "octave", "name"];

    // exponential scale with 0->0 and 100->1
    function vol2amp(vol){
	vol = Math.max(0, vol);
	var base = 1.02;
	return (Math.pow(base, vol)-1)/(Math.pow(base,100)-1);
    }

    function freeSynths(node){
	var global = node.context().global;
	var toDelete = global.get("synth_delete_sc") || [];
	for(var i = 0; i < toDelete.length; i++){
	    var freeMsg = {
		topic: "/n_free",
		payload: toDelete[i]
	    }
	}
	node.send(freeMsg);
	global.set("synth_delete_sc", []);
    }

    function deleteSynth(node, synth_id){
	var global = node.context().global;
	var toDelete = global.get("synth_delete_sc") || [];
	toDelete.push(synth_id);
	global.set("synth_delete_sc", toDelete);
    }

    function SynthNode(config) {
	
        RED.nodes.createNode(this,config);
        var node = this;
	
	reset();
	
        this.on('input', function(msg) {
	    if(msg.topic && msg.topic.startsWith("synthcontrol:")){
		var synthcontrol = msg.topic.substring(13);
		var controlval = Number(msg.payload);
		node.parameters[synthcontrol] = controlval;
		setSynthParam(synthcontrol, controlval);
		return;
	    }
	    
	    switch(msg.topic){

	    default:
		switch(msg.payload){
		    
		case "tick":
		    configureTick(msg);
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
		    // nothing to do
		    break;
		    
		default:
		    configureMsg(msg);
		    // do nothing
		}
		
	    }
        });
	
	this.on('close', function(){
	    deleteSynths();
	});
	
	function sendNote(noteVal, msg){

	    var midi = note2midi(noteVal);

	    var payload;
	    var action;
	    var synth_id;

	    var amp = vol2amp(node.vol);
	    
	    if(node.voices>0){
		action = "/n_set";
		synth_id = node.synth_ids[node.next_voice];
		payload = [synth_id];
		if(midi == -1){
		    payload.push("gate", 0);
		}
		else{
		    payload.push("gate", 1);
		}
	    }
	    else{
		action = "/s_new";
		synth_id = -1;

		// add it to the head of the root group
		payload = [node.name, -1, 0, 0, "amp", amp, "out", node.outBus];
		
	    }
	    
	    if(midi){
		payload.push("midi", midi);
	    }

	    for(var param in node.parameters){
		payload.push(param);
		payload.push(node.parameters[param]);
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

	    // avoid problems with DetectSilence leaving zombie synths at amp 0
	    if(amp>0 && (!midi || midi>=0 || node.voices>0)){
		node.send(playmsg);
	    }

	    node.next_voice++;
	    if(node.next_voice >= node.voices){
		node.next_voice = 0;
	    }
	}

	function setSynthParam(param, val){
	    for(var voice = 0; voice<node.voices; voice++){
		var volmsg = {
		    "topic": "/n_set",
		    "payload": [node.synth_ids[voice], param, val]
		}
		node.send(volmsg);
	    }

	}
	
	function setSynthVol(){
	    setSynthParam("amp", vol2amp(node.vol));
	}

	
	function createSynth(){
	    freeSynths(node);
	    var synthdefFile = __dirname +"/synthdefs/" + node.name + ".scsyndef";
	    fs.readFile(synthdefFile, function (err,data){
		if(err){
		    node.warn(err);
		}
		else{
		    var synthMsg={
			topic: "/d_recv",
			payload: [data, 0]
		    }
		    node.send(synthMsg);
		}
	    });


	    // leave some time for the synthdef to be sent
	    // check for sustained synths: should do this by seeing if they've got a gate parameter
	    if(node.voices > 0){
		setTimeout(function(){
		    var global = node.context().global;
		    for(var voice = 0; voice < node.voices; voice++){
			var id = Number(global.get("synth_next_sc_node"));
			if(isNaN(id)){
			    id = 100000; // high to avoid nodes from sclang
			}
			global.set("synth_next_sc_node", id + 1);
			node.synth_ids[voice] = id;
			
			// add it to the head of the root group
			var createMsg = {
			    topic: "/s_new",
			    payload: [node.name, node.synth_ids[voice], 0, 0, "out", node.outBus]
			}
			node.send(createMsg);
		    }
		    setSynthVol();
 		}, 200);
	    }
	}

	// mark for deletion: the actual freeing takes place when the new one is deployed,
	// so that we can be sure all the wires are in place to connect to server via OSC
	function deleteSynths(){
	    for(var voice = 0; voice<node.voices; voice++){
		if(node.synth_ids[voice]){
		    deleteSynth(node, node.synth_ids[voice]);
		    node.synth_ids[voice] = null;
		}
	    }
	}

	function reset(){
	    node.name = config.name || "piano";
	    node.vol = Number(config.start_vol) || 50;
	    node.next_voice = 0;
	    node.outBus = Number(config.outBus) || 0;
	    
	    node.octave = config.octave || 0;

	    if(_.contains(["moog", "prophet", "ghost"], node.name)){
		node.voices = 1;
	    }
	    else{
		node.voices = 0;
	    }

	    node.synth_ids = Array(node.voices);
	    node.noteoffset = 0;
	    node.parameters = {};
	    
	    setRoot(config.root);
	    node.scale = config.scale; // if not defined we will use the global value

	    // wait a little while to allow wires to be created
	    setTimeout(function(){
		createSynth();
	    }, 200);
		  
	}

	function setRoot(root){
	    var global = node.context().global;
	    root = root || global.get("root");
	    root = root || 60;

	    var roman = {
		i: 1,
		ii: 2,
		iii: 3,
		iv: 4,
		v: 5,
		vi: 6,
		vii:7,
		viii:8
	    }

	    if(roman[root]){
		node.noteoffset = roman[root];
		root = global.get("root") || 60;
	    }
	    
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

	    // work out notes above the offset values by shifting up an octave
	    while(note > offsets.length){
		note -= offsets.length-1;
		midi += offsets[offsets.length-1];
	    }

	    // work out notes below the offset values by shifting down an octave
	    // notes 0 and -1 are the same as +1

	    if(note == 0 || note == -1){
		note = 1;
	    }
	    
	    var negative = false;
	    while(note < 0){
		negative = true;
		note += offsets.length-1;
		midi -= offsets[offsets.length-1];
	    }
	    
	    midi += node.octave*12;

	    if(negative){
		midi += offsets[note+1];
	    }
	    else{
		midi += offsets[note-1];
	    }
	    
	    return midi;
	}
	
	function configureTick(msg){
	    for(var i=0; i<configurables.length; i++){
		var configurable = configurables[i];
		if(msg[configurable]){
		    configure(configurable, msg[configurable]);
		}
	    }
	}

	function configureMsg(msg){
	    for(var i=0; i<configurables.length; i++){
		var configurable = configurables[i];
		if(msg.topic == configurable){
		    configure(configurable, msg.payload);
		}
	    }
	}

	function configure(config, val){
	    switch(config){
	    case "volume":
		var newVol = Number(val);
		if(!Number.isNaN(newVol)){
		    node.vol = newVol;
		}
		
		node.vol = Math.min(100, Math.max(0, node.vol));

		setSynthVol();
		break;

	    }
	}

	
    }

    function SoundFXNode(config) {
	
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
		// 100 should be neutral volume, not max
		
		setFXParam("amp", vol2amp(node.vol));
		
		break;
		
	    default:
		    
		if(msg.payload== "reset"){
		    reset();
		    // just this once the reset message is not propagated
		    return;
		}

		setFXParam(msg.topic, msg.payload);
		
	    }
        });
	
	this.on('close', function(){
	    deleteSynth(node, node.synth_id);
	    node.synth_id = null;
	});
	
    
	function setFXParam(param, val){
	    var parammsg = {
		"topic": "/n_set",
		"payload": [node.synth_id, param, val]
	    };
	    node.send(parammsg);
	}

	function createFX(){
	    freeSynths(node);
	    var global = node.context().global;
	    var id = Number(global.get("synth_next_sc_node"));
	    if(isNaN(id)){
		id = 100000; // high to avoid nodes from sclang
	    }
	    global.set("synth_next_sc_node", id + 1);
	    node.synth_id = id;
	    
	    // add it to the tail of the root group
	    var createMsg = {
		topic: "/s_new",
		payload: [node.fxtype, node.synth_id, 0, 0, "inBus", node.inBus]
	    }
	    node.send(createMsg);
	    
	    setFXParam("amp", vol2amp(node.vol));
	}

	function reset(){
	    node.fxtype = config.fxtype || "reverb";
	    node.name = config.name || node.fxtype;
	    node.inBus = Number(config.inBus);
	    node.outBus = Number(config.outBus) || 0;
	    
	    // wait a little while to allow wires to be created
	    setTimeout(function(){
		createFX();
	    }, 200);
	    
	}

    }
	
    RED.nodes.registerType("synth",SynthNode);
//    RED.nodes.registerType("soundfx",SoundFXNode);
}


