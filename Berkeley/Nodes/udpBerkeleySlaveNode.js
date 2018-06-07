module.exports = function(RED) {
    "use strict";


    function BerkeleySlaveNode(config) {
	
        RED.nodes.createNode(this,config);
        var node = this;
		
		var globalContext = this.context().global;
		var flowContext = this.context().flow;
		
		// Get synchroniser
		var berkeleySlaveSynchroniser = require('./../slave-clean.js');
	
		// Set global clock variable
		//var setClock = setInterval(setCurrentTime, 5000);
		//setClock;
		
		setSlaveClock();
		
		reset();
	
	
        this.on('input', function(msg) {
			switch(msg.payload){
				case "reset":
					reset();
					break;
				default:
				}
        });

		this.on('close', function(){
		});


		
		function reset(){
			stopSynchronisation();
			node.output = config.output;
			node.started = false;
			
			node.port = config.port;
			node.masterAddress = config.masterIPAddress;
			node.masterPort = config.masterPort;
			
			//node.warn(node.port);
			//node.warn(node.masterAddress);
			//node.warn(node.masterPort);
			
			setSlaveClock();
			startSynchronisation();
		}
		
		
		function startSynchronisation(){
			//if (node.started){
			//node.warn("Starting slave synchronisation");
			berkeleySlaveSynchroniser.startSynchronisation(node.port, node.masterAddress, node.masterPort, node.timeout);
			//}
		}
		
		
		function stopSynchronisation(){
			berkeleySlaveSynchroniser.stopSynchronisation();
		}

		function setCurrentTime(){
			var time = berkeleySlaveSynchroniser.getCurrentTime();
			globalContext.set("slave-time", time);
		}
			
			
		function setSlaveClock(){
			globalContext.set("slave-clock", berkeleySlaveSynchroniser.getClock());
		}
	}
	
	RED.nodes.registerType("berkeley-slave",BerkeleySlaveNode);
}

