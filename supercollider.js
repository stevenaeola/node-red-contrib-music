// commonly used functions, imported by synth.js, soundfx.js, looper.js

const fs = require("fs");
const glob = require("glob");

function freeSynth(node, synth_id){
    if(synth_id){
	const freeMsg = {
	    topic: "/n_free",
	    payload: synth_id
	}
	node.send(freeMsg);
    }
}

function sendSynthDef(node, synthdefName){
    const synthdefFile = __dirname +"/synthdefs/" + synthdefName + ".scsyndef";
    fs.readFile(synthdefFile, function (err,data){
	if(err){
	    node.warn(err);
	}
	else{
	    const synthMsg={
		topic: "/d_recv",
		payload: [data, 0]
	    }
	    node.send(synthMsg);
	}
    });
}

function createBuffer(node){
    if(!node.bufnum){
	const global = node.context().global;
	var bufnum = Number(global.get("sampler_next_bufnum"));
	if(isNaN(bufnum)){
	    bufnum = 1; // hopefully no clashes with sclang
	}
	global.set("sampler_next_bufnum", bufnum + 1);
	node.bufnum = bufnum;
    }
    const fps = 44100;
    if(node.synthtype){
	loadBuffer(node);
    }
    else{
	// create an empty buffer ready for recording
	const seconds = 20; //assumed max length for now
	const createMsg = {
	    topic: "/b_alloc",
	    payload: [node.bufnum, fps * seconds * 2, 2]
	}
	node.send(createMsg);
    }
}

function freeBuffer(node){
    if(node.bufnum){
	var freeMsg = {
	    topic: "/b_free",
	    payload: node.bufnum
	}
	node.send(freeMsg);
    }
}

    function loadBuffer(node){
	var sampdir = __dirname + "/samples/";
	var matches = Array();
	matches.push( sampdir + "Dirt/" + node.synthtype + "/*.wav" );
	matches.push( sampdir + "SonicPi/" + node.synthtype + ".flac" );
	matches.push( sampdir + "Freesound/" + node.synthtype + ".wav" );

	for(let match of matches){
	    glob(match, {nocase: true}, function (er, files) {
		var fname;
		fname = files[0];
		if(fname){
		    // create and load the buffer from file
		    var createMsg = {
			topic: "/b_allocRead",
			payload: [node.bufnum, fname ]
		    }
		    node.send(createMsg);
		}
	    });

	}
    }


module.exports = { createBuffer,
		   freeBuffer,
		   freeSynth,
		   loadBuffer,
		   sendSynthDef};
