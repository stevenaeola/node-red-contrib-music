module.exports = function(RED) {
    "use strict";
    
    function RandomNode(config) {
	
        RED.nodes.createNode(this,config);
        var node = this;
	reset();
	
        this.on('input', function(msg) {
	    switch(msg.topic){
	    case "values":
		setValues(msg.payload);
		break;
		
	    default:
		switch(msg.payload){
		case "reset":
		    reset();
		    node.send(msg);
		    break;

		default:
		    var value;
		    var min, max;
		    var rand = Math.random(); // in between 0 and 1

		    switch(node.inbetween){
		    case "none":
			value = node.values[Math.floor(rand*node.values.length)];
			sendRand(value, msg);
			break;

		    case "int":
			min = Math.ceil(node.values[0]);
			max = Math.floor(node.values[1]);
			value = Math.floor(rand*(max - min + 1)) + min;
			sendRand(value, msg);
			break;

		    case "float":
			min = node.values[0];
			max = node.values[1];
			value = Math.floor(rand * (max - min)) + min;
			sendRand(value, msg);
			break;

		    default:
			node.send(msg);
			// do nothing
		    }
		    break;
		}
	    }
        });

	function sendRand(value){
	    var randMsg = {topic: node.generate,
		       payload: value};
	    node.send(randMsg);
	    if(node.forward){
		node.send(msg);
	    }
	}
	
	function reset(){
	    node.generate = config.generate || "notes";
	    node.inbetween = config.inbetween || "none";
	    node.name = config.name || node.generate;
	    node.forward = config.forward || false;
	    setValues(config.values);
	}

	function setValues(values){
	    try{
		node.values = JSON.parse(values);
	    }
	    catch(e){
		node.values = null;
	    }
	    if(!Array.isArray(node.values)){
		node.warn("Invalid or undefined values, using [1, 15]");
		node.values = [1, 15];
	    }
	}

    }
    
    
    RED.nodes.registerType("random",RandomNode);
}

