module.exports = function(RED) {
    "use strict";
    
    function TrackerNode(config) {
	
        RED.nodes.createNode(this,config);
        var node = this;

	reset();
	
	var newVal;
	
        this.on('input', function(msg) {
	    switch(msg.topic){
	    case "up":
	    case "down":
		var oldVal = node.trackedVal;
		
		var change = numberFrom(msg.payload, node.step);
		if(msg.topic == "down"){
		    change = -change;
		}
		
		if(node.multiply){
		    if(oldVal <= node.min && change > 0){
			var range = (node.max - node.min);
			var inc = range / 50;
			newVal = node.min + inc;
		    }
		    else{
			var changeProp = 1 + change/100.0;
			newVal = oldVal * changeProp;
		    }
		}
		else{
		    newVal = oldVal + change;
		}
		setTracker(newVal);
		break;

	    case "set":
	    default:
		if(msg.payload == "reset"){
		    reset();
		    node.send(msg);
		}
		else{
		    newVal = Number(msg.payload);
		    if(!Number.isNaN(newVal)){
			setTracker(newVal);
		    }
		}
		   // else nothing
		break;
	    }
        });

	function setTracker(newVal){
	    node.trackedVal = Math.min(node.max, Math.max(node.min, newVal));
	    var disp;
	    if(node.trackedVal>=10){
		disp = Math.round(node.trackedVal);
	    }
	    else{
		disp = Math.round(node.trackedVal*10)/10;
	    }
	    node.status({fill: "grey", shape: "ring", text: node.track + ": " + disp});
	    
	    node.send({
		topic: node.track,
		payload: node.trackedVal
	    });
	}

	function reset(){
	    node.track = config.track || "volume";
	    node.name = config.name || " tracker";
	    node.min = Number(config.min) || 0;
	    node.max = Number(config.max) || 100;
	    node.initial = Number(config.initial) || 50;
	    node.step = Number(config.step) || 5;
	    node.multiply = Boolean(config.multiply) || false;
	    
	    setTracker(node.initial);
	}
    }
    
    function numberFrom(val, undef){
	var num = Number(val);
	if(val.length == 0 || Number.isNaN(num)){
	    num = undef;
	}
	return num;
    }
    
	

    RED.nodes.registerType("tracker",TrackerNode);
}

