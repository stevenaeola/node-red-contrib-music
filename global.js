module.exports = function(RED) {
    "use strict";
    
    function GlobalNode(config) {
	
        RED.nodes.createNode(this,config);
        var node = this;

	node.variable = config.variable || "scale";
	node.value = config.value;
	
	
        this.on('input', function(msg) {
	    node.value = msg.payload;
	    node.context().global.set(node.variable, node.value);
	    node.status({fill: "grey", shape: "ring", text: node.variable + ": " + node.value});
	    
	    node.send({
		topic: node.variable,
		payload: node.value
	    });
	});
		
    }
	

    RED.nodes.registerType("global",GlobalNode);
}

