const sc = require('./supercollider');

// prefix for served GET requests

let fxtypes = require('./fxtypes');
const fxtypesURL = 'node-red-contrib-music/fxtypes';

module.exports = function (RED) {
    'use strict';
    
    RED.httpAdmin.get('/' + fxtypesURL, function (req, res) {
        fxtypes = require('./fxtypes');
        res.json(fxtypes);
    });

    function SoundFXNode (config) {

        RED.nodes.createNode(this, config);
        const node = this;

        reset();

        this.on('input', function (msg) {
            if (msg.topic && msg.topic.startsWith('fxcontrol:')) {
                const fxcontrol = msg.topic.substring(10);
                const controlval = Number(msg.payload);
                node.parameters[fxcontrol] = controlval;
                setFXParam(fxcontrol, controlval);
                return;
            }

            switch (msg.topic) {
            case 'volume':
                const newVol = Number(msg.payload);
                if (!Number.isNaN(newVol)) {
                    node.volume = newVol;
                }
                // 100 should be neutral volume, not max

                setFXParam('amp', sc.volume2amp(node));

                break;

                // receiving a play message from a synth
            case '/s_new':
                msg.payload.push('out', node.inBus);
                msg.payload.push('out_bus', node.inBus);

                setFXbpm(msg);

                node.send(msg);
                break;

            default:
                if (msg.payload.timeTag) {
                    let args = msg.payload.packets[0].args;
                    if (Array.isArray(args)) {
                        args.push('out', node.inBus);
                        args.push('out_bus', node.inBus);
                    }

                    setFXbpm(msg);

                    node.send(msg);
                    return;
                }
                if (msg.payload === 'reset') {
                    reset();
                    // just this once the reset message is not propagated
                    return;
                }

//                setFXParam(msg.topic, msg.payload);
                node.send(msg);
            }
        });

        this.on('close', function () {
            sc.freeSynth(node, node.synthID);
            node.synthID = null;
        });

        function setFXParam (param, val) {
            if (!fxtypes[node.fxtype].fxcontrols[param] && !['bpm'].includes(param)) {
                node.warn('No such fxcontrol: ' + param);
                return;
            }

            const parammsg = {
                'topic': '/n_set',
                'payload': [node.synthID, param, val]
            };
            node.send(parammsg);
        }

        function setFXbpm (msg) {
            const bpm = msg.bpm;

            if (bpm) {
                setFXParam('bpm', bpm);
            }
        }

        function createFX () {
            node.tags = [];
            node.synthdefName = node.fxtype;
            sc.sendSynthDef(node);
            // leave some time for the synthdef to be sent

            setTimeout(function () {
                sc.freeSynth(node, node.synthID);

                let payload = [node.fxtype, node.synthID, 1, 0, 'inBus', node.inBus, 'amp', sc.volume2amp(node)];
                for (let param in node.parameters) {
                    payload.push(param);
                    payload.push(Number(node.parameters[param]));
                }
                payload.push('amp');
                payload.push(sc.volume2amp(node));

                // add it to the tail of the root group
                const createMsg = {
                    topic: '/s_new',
                    payload: payload
                };

                node.send(createMsg);
            }, 200);
        }

        function reset () {
            node.fxtype = config.fxtype || 'reverb';
            node.name = config.name || node.fxtype;
            node.inBus = fxtypes[node.fxtype].inBus;
            node.outBus = Number(config.outBus) || 0;
            // fix the synthID according to the fxtype (via inBus number)
            // means we can only have one fx node per fx type
            // ... which is deliberate
            node.synthID = 100000 - node.inBus / 2;
            node.volume = 100;

            node.parameters = node.parameters || {};
            if (config.fxcontrols) {
                for (let fxcontrol in config.fxcontrols) {
                    node.parameters[fxcontrol] = config.fxcontrols[fxcontrol];
                }
            }

            // wait a little while to allow wires to be created
            setTimeout(function () {
                createFX();
            }, 200);
        }
    }

    RED.nodes.registerType('soundfx', SoundFXNode);
};
