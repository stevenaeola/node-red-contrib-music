module.exports = function(RED) {
    "use strict";

    var _ = require("underscore");
    
    function SequencerNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;

	reset();
	
        this.on('input', function(msg) {
	    switch(msg.payload){
	    case "tick":
		var start = msg.start || [];
		if(start.indexOf(node.input)>=0){
//		    only start/ restart when we get the right kind of tick
		    if(node.rhythmPos == -1 && start.indexOf(node.start)<0){
			return;
		    }
		    node.rhythmCount--;
		    if(node.rhythmCount<=0){
			if(node.rhythmrand && node.loop){
			    node.rhythmCount = _.sample(node.rhythm);
			    node.rhythmPos = 0; // needs to be > 0 so that it continues after start/restart
			}
			else{
			    node.rhythmPos++;
			    if(node.rhythmPos>=node.rhythm.length){
				node.rhythmPos = 0;
			    }
			    node.rhythmCount = node.rhythm[node.rhythmPos];
			    msg.rhythm_pos = node.rhythmPos;
			}

			var note;
			if(node.notesrand && node.loop){
			    note = _.sample(node.notes);
			}
			else{
			    node.notePos++;
			    if(node.notePos >= node.notes.length){
				if(node.loop){
				    node.notePos = 0;
				}
				else{
				    restart();
				    return;
				}
			    }
			    note = node.notes[node.notePos]
			}
			var playmsg = 
			    {payload: "play",
			     midi: note2midi(note)};
			node.send(playmsg);
		    }
		}
		break;

	    case "reset":
		reset();
		node.send(msg);
		break;
		
	    default:
		node.send(msg);
		break;
	    }
        });

	function restart(){
	    node.rhythmPos = -1; // the position in the list of lengths
	    node.rhythmCount = 0; // count down the number of beats
	    node.notePos = -1; // the position in the list of notes
	    if(node.rhythmrand & !node.loop){
		node.rhythm = _.shuffle(node.rhythm);
	    }
	    if(node.notesrand & !node.loop){
		node.notes = _.shuffle(node.notes);
	    }
	}
	
	function reset(){
	    node.input = config.input || "beat";
	    
	    try{
		node.notes = JSON.parse(config.notes);
	    }
	    catch(e){
		node.notes = null;
	    }
	    if(!Array.isArray(node.notes)){
		node.warn("Invalid or undefined notes, using [1]");
		node.notes = [1];
	    }
	    
	    try{
		node.rhythm = JSON.parse(config.rhythm);
	    }
	    catch(e){
		node.rhythm = null;
	    }
	    if(!Array.isArray(node.rhythm)){
		node.warn("Invalid or undefined note lengths for using [1]");
		node.rhythm = [1];
	    }
	    
	    node.octave = config.octave || 0;
	    
	    node.start = config.start || "bar"; // sequence won't start until this
	    
	    node.loop = config.loop || false;
	    node.notesrand = config.notesrand || false;
	    node.rhythmrand = config.rhythmrand || false;
	    
	    setRoot(config.root);
	    node.scale = config.scale; // if not defined we will use the global value

	    restart();
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
	// use default scale for now    
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

    
    RED.nodes.registerType("sequencer",SequencerNode);
}

