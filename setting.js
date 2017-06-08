module.exports = function(RED) {
    "use strict";
    
    function SettingNode(config) {
	
        RED.nodes.createNode(this,config);
        var node = this;

	reset();
	
	var newVal;
	
        this.on('input', function(msg) {
	    switch(msg.topic){
	    case "up":
	    case "down":
		var oldVal = Number(node.trackedVal);

		if(Number.isNaN(oldVal)){
		    node.warn("To change a setting up or down the value must be a number");
		    return;
		}
		
		var change = numberFrom(msg.payload, 1);
		if(msg.topic == "down"){
		    change = -change;
		}
		
		newVal = oldVal + change;
		setSetting(newVal);

		break;

	    case "set":
	    default:
		if(msg.payload == "reset"){
		    reset();
		    node.send(msg);
		}
		else{
		    setSetting(msg.payload);
		}
		break;
	    }
        });

	function setSetting(newVal){
	    if(Math.min || Math.max){
		node.trackedVal = Math.min(node.max, Math.max(node.min, newVal));
	    }
	    var disp;
	    if(node.trackedVal>=10){
		disp = Math.round(node.trackedVal);
	    }
	    else{
		disp = Math.round(node.trackedVal*10)/10;
	    }
	    node.status({fill: "grey", shape: "ring", text: node.setting + ": " + disp});

	    if(node.global){
		node.context().global.set(node.variable, node.trackedVal);
	    }
	    node.send({
		topic: node.setting,
		payload: node.trackedVal
	    });
	}

	function reset(){
	    node.name = config.name || config.setting || "setting";
	    node.setting = config.setting || "volume";
	    node.initial = Number(config.initial) || 50;
	    node.global = config.global || false;
	    node.min = Number(config.min) || 0;
	    node.max = Number(config.max) || 100;

	    // set the value a little later so other nodes are connected and ready to receive the message
	    setTimeout(function(){
		setSetting(node.initial);
	    },200);
	}

    }
    
    function numberFrom(val, undef){
	var num = Number(val);
	if(val.length == 0 || Number.isNaN(num)){
	    num = undef;
	}
	return num;
    }
    
	

    RED.nodes.registerType("setting",SettingNode);
}

