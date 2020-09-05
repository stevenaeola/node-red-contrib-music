const dgram = require('dgram');
const osc = require('osc');
const fs = require('fs');
const glob = require('glob');
const nrp = require('node-red-contrib-properties');

module.exports = function (RED) {
    'use strict';

    const heartbeatInterval = 5000;

    // names for variables in the global context
    const gBufnum = 'supercollider_next_bufnum';

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

            switch (msg.payload) {
                case 'tick':
                    let synthtype = msg.synthtype;
                    if (!synthtype) {
                        node.warn('No synthtype defined');
                    }

                    checkSynthType(synthtype);
                    sendOSC(note2sc(msg));
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

        // ehecks the synttype is valid and sends anything needed to SuperCollider
        function checkSynthType (synthtype) {
            if (!synthtypes[synthtype]) {
                node.warn('SuperCollider unknown synthtype: ' + synthtype);
                return false;
            }

            if (!checkSynthDef(synthDefName(synthtype))) {
                return false;
            }

            if (synthtypes[synthtype].synth) {
                return true;
            } else {
                return checkSamples(synthtype);
            }
        }

        function checkSamples (synthtype) {
            if (node.samples[synthtype]) {
                return true;
            }

            const bufnum = nextBufnum();
            node.samples[synthtype] = { 0: bufnum }; // could be varied by pitch

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
                            args: [bufnum, fname]
                        };
                        sendOSC(createMsg);
                    }
                });
            }
            return true;
        }

        function checkSynthDef (synthDefName) {
            if (node.synthDefSent.has(synthDefName)) {
                return true;
            }

            node.synthDefSent.add(synthDefName);

            const synthDefDir = '/synthdefs/compiled';
            let matches = [];
            matches.push(synthDefDir + '/' + synthDefName + '.scsyndef');
            matches.push(synthDefDir + '/SonicPi/' + synthDefName + '.scsyndef');

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
            return true;
        }

        function nextBufnum () {
            var bufnum = Number(global.get(gBufnum));
            if (isNaN(bufnum)) {
                bufnum = 0; // hopefully no clashes with sclang
            }
            bufnum++;
            global.set(gBufnum, bufnum);
            return bufnum;
        }

        function reset () {
            clearTimeout(node.heartbeat);
            heartbeat();
            node.samples = {}; // this is a map from synthtype to buffer (if required)
            node.synthDefSent = new Set();
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
                return synthtype;
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

            const noteDetails = msg.details;

            // copy all of the details into the payload to be sent via OSC
            for (let key in noteDetails) {
                payload.push(key, noteDetails[key]);
                if (key === 'midi') {
                    // this is to work with the sonic pi synth defs
                    payload.push('note', noteDetails.midi);
                }
            }

            if (!synthDetails.synth) {
                payload.push('buffer', node.samples[synthtype][0]); // TODO check if sample is note-dependent
                if (synthDetails.midibase) {
                    payload.push('midibase', synthDetails.midibase);
                }
            }

            // TODO add output for soundfx

            const action = '/s_new';
            let playmsg;
            if (msg.timeTag) {
                playmsg = {
                    payload: {
                        timeTag: msg.timeTag,
                        packets: [
                            {
                                address: action,
                                args: payload
                            }
                        ]
                    }
                };
            } else {
                playmsg = {
                    topic: action,
                    payload: payload
                };
            }

            // avoid problems with DetectSilence leaving zombie synths at amp 0
            if (noteDetails.amp > 0 && (!noteDetails.midi || noteDetails.midi >= 0)) {
                return playmsg;
            } else {
                return {};
            }
        }

        function heartbeat () {
            // TODO reset samples, synths when connection (re)established

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
                    });

                    client.on('error', function (err) {
                        node.warn('Error creating SuperCollider connection' + err);
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
