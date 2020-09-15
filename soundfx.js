const sc = require('./scsynth');

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

                case 'fxtype':
                    let fxpath = msg.fxpath || [];
                    fxpath.push({ nodeID: node.id, fxtype: node.fxtype, parameters: node.parameters });
                    msg.fxpath = fxpath;
                    node.send(msg);
                    break;

                case 'synthtype':
                    node.send(msg);
                    break;

                default:
                    switch (msg.payload) {
                        case 'tick':
                            let fxChain = msg.fxChain || [];
                            fxChain.push({ 'node': node.id, 'fxtype': node.fxtype });
                            msg.fxChain = fxChain;
                            node.send(msg);
                            break;

                        case 'reset':
                            reset();
                            // just this once the reset message is not propagated
                            break;

                        default:
                            node.send(msg);
                            break;
                    }
            }
        });

        this.on('close', function () {
            sc.freeSynth(node, node.synthID);
            node.synthID = null;
        });

        function setFXParam (param, val) {
            if (!fxtypes[node.fxtype].fxcontrols[param] && !['bpm'].includes(param)) {
                node.warn('No such fxcontrol: ' + param);
            }
// TODO replace this in supercollider.js
/*             const parammsg = {
                'topic': '/n_set',
                'payload': [node.synthID, param, val]
            };
            node.send(parammsg); */
        }
/*
        function setFXbpm (msg) {
            const bpm = msg.bpm;

            if (bpm) {
                setFXParam('bpm', bpm);
            }
            // TODO make sure this is called when the FX synth is created
        }
*/

        function reset () {
            node.fxtype = config.fxtype || 'reverb';
            node.name = config.name || node.fxtype;

            node.parameters = node.parameters || {};
            if (config.fxcontrols) {
                for (let fxcontrol in config.fxcontrols) {
                    node.parameters[fxcontrol] = config.fxcontrols[fxcontrol];
                }
            }
            node.send({ topic: 'fxtype', fxpath: [{ nodeID: node.id, fxtype: node.fxtype, parameters: node.parameters }] });
        }
    }

    RED.nodes.registerType('soundfx', SoundFXNode);
};
