const dgram = require('dgram');
const osc = require('osc');
const fs = require('fs');
const glob = require('glob');
const nrp = require('node-red-contrib-properties');

module.exports = function (RED) {
    'use strict';

    const heartbeatInterval = 5000;
    const minBusNum = 16; // hopefully no clashes with sclang: default 8 input and 8 output buses
    const maxSynthID = 100000;
    const fps = 44100;

    // names for variables in the global context
    const gBufNum = 'supercolliderNextBufNum';
    const gBusNum = 'supercolliderNextBusNum';

    function SuperColliderNode (config) {
        // TODO make sure this is the only node of this type

        RED.nodes.createNode(this, config);
        var node = this;

        const synthtypes = require('./synthtypes');
        const global = node.context().global;

        let properties = new nrp.NodeRedProperties(node, config,
            {
                host: { value: '127.0.0.1' },
                port: { value: '57110' }
            });

        reset();

        this.on('input', function (msg) {
            properties.input(msg);

            if (msg.topic === 'synthtype') {
                let synthtype = msg.payload;
                checkSynthType(synthtype);
                return;
            }

            if (msg.topic === 'fxtype') {
                let fxpath = msg.fxpath;
                checkFXType(fxpath);
                return;
            }

            if (msg.topic === 'looper') {
                let looperID = msg.nodeID;
                checkLooper(looperID);
                // create an empty buffer ready for recording
                const seconds = 20; // assumed max length for now
                const createMsg = {
                    address: '/b_alloc',
                    args: [node.loopers[looperID], fps * seconds * 2, 2]
                };
                sendOSC(createMsg);
                return;
            }

            switch (msg.payload) {
                case 'tick':
                    const synthtype = msg.synthtype;
                    const looperAction = msg.looper;
                    if (synthtype) {
                        checkFXType(msg.fxpath);
                        checkSynthType(synthtype);
                        sendOSC(note2sc(synthtype, msg));
                    } else if (looperAction) {
                        checkFXType(msg.fxpath);
                        const looperID = msg.nodeID;
                        checkLooper(looperID);
                        sendOSC(looper2sc(looperAction, looperID, msg));
                    } else {
                        node.warn('No synthtype defined');
                    }
                    break;

                case 'reset':
                    reset();
                    break;

                default:
                    // do nothing
                    break;
            }
        });

        this.on('close', function () {
            if (node.heartbeat) {
                clearTimeout(node.heartbeat);
                node.heartbeat = null;
            }
        });

        // ehecks the syntthype is valid and sends anything needed to SuperCollider
        function checkSynthType (synthtype) {
            if (!synthtypes[synthtype]) {
                node.warn('SuperCollider unknown synthtype: ' + synthtype);
                return;
            }

            checkSynthDef(synthDefName(synthtype));

            if (synthtypes[synthtype].synth) {
                return;
            }
            checkSamples(synthtype);
        }

        function checkSamples (synthtype) {
            if (node.samples[synthtype]) {
                return;
            }

            const bufNum = nextBufNum();
            node.samples[synthtype] = { 0: bufNum }; // could be varied by pitch

            // glob uses forward slashes even in Windows
            const sampdir = '/samples';
            let matches = [];
            matches.push(sampdir + '/Dirt/' + synthtype + '/*.wav');
            matches.push(sampdir + '/SonicPi/' + synthtype + '.flac');
            matches.push(sampdir + '/Freesound/' + synthtype + '.wav');
            matches.push(sampdir + '/VSCO/' + synthtype + '.wav');

            for (let match of matches) {
                glob(match, { nocase: true, root: __dirname }, function (er, files) {
                    let fname = files[0];
                    if (fname) {
                        // create and populate the buffer in SuperCollider

                        var createMsg = {
                            address: '/b_allocRead',
                            args: [bufNum, fname]
                        };
                        sendOSC(createMsg);
                    }
                });
            }
        }

        function checkSynthDef (synthDefName) {
            if (node.synthDefSent.has(synthDefName)) {
                return;
            }

            node.synthDefSent.add(synthDefName);

            const synthDefDir = '/synthdefs/compiled';
            let matches = [];
            matches.push(synthDefDir + '/' + synthDefName + '.scsyndef');
            matches.push(synthDefDir + '/sonic-pi/' + synthDefName + '.scsyndef');

            for (let match of matches) {
                glob(match, { nocase: true, root: __dirname }, function (er, files) {
                    let fname = files[0];
                    if (fname) {
                        // send the synthdef to SuperCollider
                        fs.readFile(fname, function (err, data) {
                            if (err) {
                                node.warn(' problem sending file for ' + synthDefName);
                                node.warn(err);
                            } else {
                                const synthMsg = {
                                    address: '/d_recv',
                                    args: [data, 0]
                                };
                                sendOSC(synthMsg);
                            }
                        });
                    }
                });
            }
        }

        function checkFXType (fxpath) {
            // fxpath is a list of {nodeID, fxtype, parameters} objects, last element in the chain last in the list
            // builds chain: the path with the parameters removed
            // side effect is to claim buses and instantiate the relevant fxsynth
            // also updates the fx parameters
            // synth ID calculated from busNum
            // returns the input bus number of the first in the chain (i.e. the bus that any feeding synth should send its output to)
            if (!fxpath || fxpath.length === 0) {
                return 0; // then the final fx in the chain will send its output to audio out on bus 0
            }
            let keyFull = JSON.stringify(path2chain(fxpath));
            let [head, ...tail] = fxpath;
            let keyTail = JSON.stringify(path2chain(tail));
            let tailBusNum = checkFXType(tail);
            if (node.chain2buses[keyFull]) {
                // synth already exists, just set the fx parameters
                const bus = node.chain2buses[keyFull][head.nodeID];
                let payload = [busNum2synthID(bus)];
                const fxDetails = head.parameters;
                for (let key in fxDetails) {
                    payload.push(key, fxDetails[key]);
                }
                sendOSC({ address: '/n_set', args: payload });
                return bus;
            } else {
                const headBusNum = nextBusNum();
                const synthID = busNum2synthID(headBusNum);
                let payload = [head.fxtype, synthID];
                // specify position in the group: just before the next soundfx in
                if (tailBusNum) {
                    payload.push(2, busNum2synthID(tailBusNum));
                } else {
                    payload.push(1, 0);
                }

                payload.push('inBus', headBusNum);
                payload.push('out_bus', tailBusNum);

                const fxDetails = head.parameters;
                for (let key in fxDetails) {
                    payload.push(key, fxDetails[key]);
                }
                sendOSC({ address: '/s_new', args: payload });
                let buses = clone(node.chain2buses[keyTail] || {});
                buses[head.nodeID] = headBusNum;
                node.chain2buses[keyFull] = buses;
                return headBusNum;
            }
        }

        function checkLooper (nodeID) {
            if (node.loopers[nodeID]) {
                return;
            }
            checkSynthDef('playSampleStereo');
            checkSynthDef('recordSampleStereo');

            const bufNum = nextBufNum();
            node.loopers[nodeID] = bufNum;
        }

        function clone (obj) {
            return JSON.parse(JSON.stringify(obj));
        }

        // extract the node ids
        function path2chain (fxpath) {
            return fxpath.map(e => ({ 'nodeID': e.nodeID, 'fxtype': e.fxtype }));
        }

        function nextBufNum () {
            let bufNum = Number(global.get(gBufNum));
            if (isNaN(bufNum)) {
                bufNum = 0; // hopefully no clashes with sclang
            }
            bufNum++;
            global.set(gBufNum, bufNum);
            return bufNum;
        }

        function nextBusNum () {
            let busNum = Number(global.get(gBusNum));
            if (isNaN(busNum)) {
                busNum = minBusNum;
            }
            busNum += 2;
            global.set(gBusNum, busNum);
            return busNum;
        }

        function busNum2synthID (busNum) {
            return maxSynthID - busNum / 2;
        }

        function reset () {
            clearTimeout(node.heartbeat);
            clearSynthStore();
            heartbeat();
            setTimeout(() => {
                sendOSC({
                    'address': '/g_freeAll',
                    'args': [0]
                }
                );
            }, 100);
        }

        function clearSynthStore () {
            node.samples = {}; // map from synthtype to buffer (if required)
            node.loopers = {}; // map from nodeID to buffer
            node.synthDefSent = new Set();
            node.chain2buses = {}; // keys are (JSON encoded) lists of node ids with fxtypes. Values are objects mapping from node id to busNum
        }

        function sendOSC (msg) {
            // do not send empty objects
            if (!Object.keys(msg) || !Object.keys(msg).length) {
                return;
            }

            if (node.udpPort) {
                node.udpPort.send(Buffer.from(osc.writePacket(msg)));
            } else {
                node.warn('No connection to SuperCollider');
            }
        }

        function synthDefName (synthtype) {
            let synthDetails = synthtypes[synthtype];
            if (synthDetails.synth) {
                if (synthDetails.tags.includes('sonic-pi')) {
                    return 'sonic-pi-' + synthtype;
                } else {
                    return synthtype;
                }
            } else if (synthDetails.stereo === true) {
                return 'playSampleStereo';
            } else {
                return 'playSampleMono';
            }
        }

        function note2sc (synthtype, msg) {
            // assumes checkSynth has already been run
            const synthdef = synthDefName(synthtype);
            let synthDetails = synthtypes[synthtype];

            // add the synth to the head of the root group
            // use node ID of -1 to auto-generate synth id
            let payload = [synthdef, -1, 0, 0];

            if (!synthDetails.synth) {
                payload.push('buffer', node.samples[synthtype][0]); // TODO check if sample is note-dependent
                if (synthDetails.midibase) {
                    payload.push('midibase', synthDetails.midibase);
                }
            }

            const noteDetails = msg.details;

            // copy all of the details into the payload to be sent via OSC
            let playmsg = playSynthSC(noteDetails, payload, msg);

            // avoid problems with DetectSilence leaving zombie synths at amp 0
            if (noteDetails.amp > 0 && (!noteDetails.midi || noteDetails.midi >= 0)) {
                return playmsg;
            } else {
                return {};
            }
        }

        function looper2sc (looperAction, looperID, msg) {
            // assumes checkLooper has already been run
            const synthDef = looperAction + 'SampleStereo';
            let payload = [synthDef, -1, 0, 0];
            payload.push('buffer', node.loopers[looperID]);
            return playSynthSC(msg.details, payload, msg);
        }

        function playSynthSC (noteDetails, payload, msg) {
            for (let key in noteDetails) {
                payload.push(key, noteDetails[key]);
                if (key === 'midi') {
                    // this is to work with the sonic pi synth defs
                    payload.push('note', noteDetails.midi);
                }
            }

            let outBus = 0;
            if (msg.fxpath) {
                let fxChain = path2chain(msg.fxpath);
                let busMap = node.chain2buses[JSON.stringify(fxChain)];
                outBus = busMap[fxChain[0].nodeID];
            }
            payload.push('out_bus', outBus);

            const action = '/s_new';
            let playmsg;
            if (msg.timeTag) {
                playmsg = {
                    timeTag: osc.timeTag(0, msg.timeTag),
                    packets: [
                        {
                            address: action,
                            args: payload
                        }
                    ]
                };
            } else {
                playmsg = {
                    address: action,
                    args: payload
                };
            }
            return playmsg;
        }

        function heartbeat () {
            const heartbeatMsg = { address: '/status', args: [] };
            const heartbeatBuffer = Buffer.from(osc.writePacket(heartbeatMsg));

            if (node.heartbeatResponse) {
                // any response indicates that the connection to SuperCollider works
                // and that SuperCollider is alive
                node.connected = true;

                node.status({ fill: 'green', shape: 'dot', text: 'connected' });
            } else {
                node.connected = false;
                node.status({ fill: 'red', shape: 'ring', text: 'disconnected' });

                if (!node.udpPort) {
                    node.udpConnected = false;
                    let client = dgram.createSocket('udp4'); // unspecified port number makes OS select one at random
                    node.udpPort = client;

                    client.on('connect', function () {
                        node.udpConnected = true;
                        client.send(heartbeatBuffer);
                        clearSynthStore();
                    });

                    client.on('error', function (err) {
                        node.warn('Error creating SuperCollider connection' + err);
                        node.udpConnected = false;
                        node.udpPort = null;
                    });

                    client.on('message', function () {
                        node.heartbeatResponse = true;
                        node.status({ fill: 'green', shape: 'dot', text: 'connected' });
                    });
                    client.connect(Number(properties.get('port')), properties.get('host'));
                }
            }

            node.heartbeatResponse = false;
            if (node.udpConnected) {
                node.udpPort.send(heartbeatBuffer);
            }
            node.heartbeat = setTimeout(heartbeat, heartbeatInterval);
        }
    }

    RED.nodes.registerType('supercollider', SuperColliderNode);
};
