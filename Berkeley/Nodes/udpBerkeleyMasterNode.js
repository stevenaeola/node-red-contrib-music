module.exports = function(RED) {
    "use strict";


    function BerkeleyMasterNode(config) {
	
        RED.nodes.createNode(this,config);
        var node = this;
		
		var globalContext = this.context().global;
		//var flowContext = this.context().flow;
		
		// Get synchroniser
		var berkeleyMasterSynchroniser = require('./../master-clean.js');
				
		// Set global clock variable
		//var setClock = setInterval(setCurrentTime, 5000);
		//setClock;
		
		setMasterClock();
		
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
			//node.warn("Reset called on master");
			stopSynchronisation();
			node.output = config.output;
			node.started = false;

			node.port = config.port;
			node.sampleInterval = config.sampleInterval;	
			
			setMasterClock();
			startSynchronisation();
		}
		
		
		function startSynchronisation(){
			//node.warn("Master starting synchronisation");
			//if (node.started){
			berkeleyMasterSynchroniser.startSynchronisation(node.port, node.sampleInterval);
			//}
		}
		
		
		function stopSynchronisation(){
			berkeleyMasterSynchroniser.stopSynchronisation();
		}
		
		
		function setCurrentTime(){
			var time = berkeleyMasterSynchroniser.getCurrentTime();
			globalContext.set("master-time", time);
		}
		
		function setMasterClock(){
			globalContext.set("master-clock", berkeleyMasterSynchroniser.getClock());
		}

	}
	
	RED.nodes.registerType("berkeley-master",BerkeleyMasterNode);
}

