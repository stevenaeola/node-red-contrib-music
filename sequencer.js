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
			     note: note};
			if(msg.timeTag){
			    playmsg.timeTag = msg.timeTag;
			}
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
		node.notes=[node.notes];
	    }
	    
	    try{
		node.rhythm = JSON.parse(config.rhythm);
	    }
	    catch(e){
		node.rhythm = null;
	    }
	    if(!Array.isArray(node.rhythm)){
		node.rhythm = [node.rhythm];
	    }
	    	    
	    node.start = config.start || "bar"; // sequence won't start until this
	    
	    node.loop = config.loop || false;
	    node.notesrand = config.notesrand || false;
	    node.rhythmrand = config.rhythmrand || false;
	    
	    restart();
	}


    }

    
    RED.nodes.registerType("sequencer",SequencerNode);
}

