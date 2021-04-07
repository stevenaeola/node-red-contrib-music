const dgram = require('dgram');
const osc = require('osc');
const fs = require('fs');
const glob = require('glob');
const path = require('path');
const nrp = require('node-red-contrib-properties');

// see http://danielnouri.org/docs/SuperColliderHelp/ServerArchitecture/Server-Command-Reference.html for details of SuperCollider commands

module.exports = function (RED) {
    'use strict';

    const heartbeatInterval = 1000;
    const minBusNum = 16; // hopefully no clashes with sclang: default 8 input and 8 output buses
    const maxSynthID = 100000;
    const fps = 44100;

    // names for variables in the global context
    const gBufNum = 'supercolliderNextBufNum';
    const gBusNum = 'supercolliderNextBusNum';
    const gGroupNum = 'supercolliderNextGroupNum';

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

        node.groupID = nextGroupNum();
        node.queuedSetup = []; // list of messages for audio setup that are waiting for the node to be ready

        reset();

        this.on('input', function (msg) {
            properties.input(msg);
            if (msg.payload === 'reset') {
                reset();
                return;
            }

            if (checkAudioSetup(msg)) {
                return;
            }

            if (msg.topic && msg.topic.startsWith('fxcontrol:')) {
                const fxcontrol = msg.topic.substring(10);
                const controlval = Number(msg.payload);
                setFXParam(fxcontrol, controlval, msg);
                return;
            }

            switch (msg.payload) {
                case 'tick':
                    if (!node.ready) {
                        break;
                    }
                    const synthtype = msg.synthtype;
                    const looperAction = msg.looper;
                    if (synthtype) {
                        checkFXType(msg.fxpath, msg.details.bpm);
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

        function checkAudioSetup (msg) {
            if (!['synthtype', 'fxtype', 'looper'].includes(msg.topic)) {
                return false;
            }

            if (!node.ready) {
                node.queuedSetup.push(msg);
                return true;
            }

            let fxpath = msg.fxpath;

            switch (msg.topic) {
                case 'synthtype':
                    let synthtype = msg.payload;
                    checkSynthType(synthtype);
                    checkFXType(fxpath);
                    return true;
                    // break;

                case 'fxtype':
                    checkFXType(fxpath);
                    return true;
                    // break;

                case 'looper':
                    let looperID = msg.nodeID;
                    checkLooper(looperID);
                    clearLooper(looperID);
                    return true;
                    // break;

                default:
                    return false;
            }
        }

        // ehecks the synththype is valid and sends anything needed to SuperCollider
        function checkSynthType (synthtype) {
            if (!synthtypes[synthtype] && !isUserSample(synthtype)) {
                node.warn('SuperCollider unknown synthtype: ' + synthtype);
                return;
            }

            checkSynthDef(synthDefName(synthtype));

            if (!isUserSample(synthtype) && synthtypes[synthtype].synth) {
                return;
            }
            checkSamples(synthtype);
        }

        function userSampleFile (synthtype) {
            let bits = synthtype.split('#');
            if (bits.length !== 2) {
                return null;
            }
            if (bits[0] !== 'user-sample') {
                return null;
            }
            return bits[1];
        }

        function isUserSample (synthtype) {
            return userSampleFile(synthtype) !== null;
        }

        function checkSamples (synthtype) {
            if (node.samples[synthtype]) {
                return;
            }

            const bufNum = nextBufNum();
            node.samples[synthtype] = { 0: bufNum }; // could be varied by pitch

            let matches = [];

            // glob uses forward slashes even in Windows

            if (isUserSample(synthtype)) {
                const uploadDir = '/uploads';
                const sampleName = path.basename(userSampleFile(synthtype));
                matches.push(uploadDir + '/' + sampleName);
            } else {
                const sampdir = '/samples';
                matches.push(sampdir + '/Dirt/' + synthtype + '/*.wav');
                matches.push(sampdir + '/SonicPi/' + synthtype + '.flac');
                matches.push(sampdir + '/Freesound/' + synthtype + '.wav');
                matches.push(sampdir + '/VSCO/' + synthtype + '.wav');
            }

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

        function checkFXType (fxpath, bpm) {
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
                const bus = node.chain2buses[keyFull][head.nodeID];
                // synth already exists, just set the bpm fx parameter
                return bus;
            } else {
                const headBusNum = nextBusNum();
                const synthID = busNum2synthID(headBusNum);
                checkSynthDef(head.fxtype);
                let payload = [head.fxtype, synthID];
                // specify position in the group: just before the next soundfx in
                if (tailBusNum) {
                    payload.push(2, busNum2synthID(tailBusNum));
                } else {
                    payload.push(1, node.groupID);
                }

                payload.push('inBus', headBusNum);
                payload.push('out_bus', tailBusNum);

                const fxDetails = head.parameters;
                for (let key in fxDetails) {
                    payload.push(key, Number(fxDetails[key]));
                }
                // delay the sending to give the synthdef time to arrive through checkSynthDef
                setTimeout(() => {
                    sendOSC({ address: '/s_new', args: payload });
                }, 50);
                let buses = clone(node.chain2buses[keyTail] || {});
                buses[head.nodeID] = headBusNum;
                node.chain2buses[keyFull] = buses;
                return headBusNum;
            }
        }

        function setFXParam (fxcontrol, controlval, msg) {
            for (let fxchain in node.chain2buses) {
                let node2bus = node.chain2buses[fxchain];
                for (let nodeID in node2bus) {
                    if (nodeID === msg.nodeID) {
                        let synthID = busNum2synthID(node2bus[nodeID]);
                        let payload = [synthID, fxcontrol, Number(controlval)];
                        sendOSC({ address: '/n_set', args: payload });
                    }
                }
            }
        }

        function checkLooper (nodeID) {
            if (node.loopers[nodeID]) {
                return;
            }
            if (!node.ready) {
                return;
            }
            checkSynthDef('playSampleStereo');
            checkSynthDef('recordSampleStereo');

            const bufNum = nextBufNum();
            node.loopers[nodeID] = bufNum;
            // create an empty buffer ready for recording
            const seconds = 20; // assumed max length for now
            const createMsg = {
                address: '/b_alloc',
                args: [node.loopers[nodeID], fps * seconds * 2, 2]
            };
            sendOSC(createMsg);
            clearLooper(nodeID);
        }

        function clearLooper (nodeID) {
            // assumes checkLooper has already been called
            const zeroMsg = {
                address: '/b_zero',
                args: [node.loopers[nodeID]]
            };
            sendOSC(zeroMsg);
        }

        function clone (obj) {
            return JSON.parse(JSON.stringify(obj));
        }

        // extract the node ids
        function path2chain (fxpath) {
            return fxpath.map(e => ({ 'nodeID': e.nodeID, 'fxtype': e.fxtype }));
        }

        function nextBufNum () {
            return nextGlobalNum(gBufNum, 1, 0);
        }

        function nextBusNum () {
            return nextGlobalNum(gBusNum, 2, minBusNum);
        }

        function nextGroupNum () {
            return nextGlobalNum(gGroupNum, 1, 0);
        }

        function nextGlobalNum (which, inc, def) {
            let num = Number(global.get(which));
            if (isNaN(num)) {
                num = def;
            }
            num += inc;
            global.set(which, num);
            return num;
        }

        function busNum2synthID (busNum) {
            return maxSynthID - busNum / 2;
        }

        function reset () {
            clearTimeout(node.heartbeat);

            if (node.udpPort) {
                node.udpPort.close();
                node.udpPort = null;
            }
            node.ready = false;
            node.status({ fill: 'red', shape: 'ring', text: 'disconnected' });

            let client = dgram.createSocket('udp4'); // unspecified port number makes OS select one at random
            node.udpPort = client;

            client.on('connect', function () {
                heartbeat();
            });

            client.on('error', function (err) {
                if (node.ready) {
                    node.warn('SuperCollider connection error: ' + err);
                    reset();
                }
            });

            client.on('message', function () {
                node.heartbeatResponse = true;
                if (!node.ready) {
                    heartbeatHandler();
                }
            });
            client.connect(Number(properties.get('port')), properties.get('host'));
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
            node.udpPort.send(Buffer.from(osc.writePacket(msg)));
        }

        function synthDefName (synthtype) {
            if (isUserSample(synthtype)) {
                return 'playSampleMono';
            }
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
            let synthDetails;
            if (isUserSample(synthtype)) {
                synthDetails = synthtypes['user-sample'];
            } else {
                synthDetails = synthtypes[synthtype];
            }
            // add the synth to the head of the root group
            // use node ID of -1 to auto-generate synth id
            let payload = [synthdef, -1, 0, node.groupID];

            if (!synthDetails.synth) {
                payload.push('buffer', node.samples[synthtype][0]); // TODO check if sample is note-dependent
                let midibase;
                if (isUserSample(synthtype)) {
                    let sampleFile = userSampleFile(synthtype);
                    // search for a midi value at the end of the filename
                    const base = path.basename(sampleFile, path.extname(sampleFile));
                    const rexp = /\d+$/;
                    const matches = base.match(rexp);
                    if (matches && matches.length > 0) {
                        midibase = parseInt(matches[0]);
                    }
                } else if (synthDetails.midibase) {
                    midibase = synthDetails.midibase;
                }
                if (midibase) {
                    payload.push('midibase', midibase);
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
            let payload = [synthDef, -1, 0, node.groupID];
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
            node.heartbeatResponse = false;
            node.udpPort.send(heartbeatBuffer);

            const drift = 1 + 0.1 * Math.random(); // in case there is more than one connection want to avoid clashes
            node.heartbeat = setTimeout(heartbeatHandler, heartbeatInterval * drift);
        }

        function heartbeatHandler () {
            if (node.heartbeat) {
                clearTimeout(node.heartbeat);
            }
            if (node.heartbeatResponse) {
                // any response indicates that the connection to SuperCollider works
                // and that SuperCollider is alive
                if (!node.ready) {
                    sendOSC({
                        address: '/g_new',
                        args: [node.groupID, 0, 0]
                    });
                    sendOSC({
                        address: '/g_freeAll',
                        args: [node.groupID]
                    });
                    clearSynthStore();

                    setTimeout(() => {
                        node.ready = true;
                        for (let setupMsg of node.queuedSetup) {
                            checkAudioSetup(setupMsg);
                        }
                        node.queuedSetup = [];
                        node.status({ fill: 'green', shape: 'dot', text: 'connected' });
                    }, 100);
                }
                heartbeat();
            } else {
                reset();
            }
        }
    }

    RED.nodes.registerType('supercollider', SuperColliderNode);
};
