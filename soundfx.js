const sc = require('./synth_common');

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
                setFXParam(fxcontrol, controlval, msg);
                return;
            }

            switch (msg.topic) {
                case 'volume':
                    const newVol = Number(msg.payload);
                    if (!Number.isNaN(newVol)) {
                        node.volume = newVol;
                    }
                    // 100 should be neutral volume, not max
                    setFXParam('amp', sc.volume2amp(node), msg);
                    break;

                case 'fxtype':
                    updateFXPath(msg);
                    break;

                case 'synthtype':
                case 'looper':
                    updateFXPath(msg);
                    break;

                default:
                    switch (msg.payload) {
                        case 'tick':
                            updateFXPath(msg);
                            updateBPM(msg);
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

        function updateFXPath (msg) {
            let fxpath = msg.fxpath || [];
            fxpath.push({ nodeID: node.id, fxtype: node.fxtype, parameters: node.parameters });
            msg.fxpath = fxpath;
            node.send(msg);
        }

        function updateBPM (msg) {
            const fxDetails = fxtypes[node.fxtype];
            if (fxDetails && fxDetails.usesBPM) {
                let thisBPM = msg.details.bpm;
                if (thisBPM && thisBPM !== node.parameters.bpm) {
                    const bpmMsg = { topic: 'fxcontrol:bpm', payload: thisBPM };
                    setFXParam('bpm', thisBPM, bpmMsg);
                }
            }
        }

        function setFXParam (param, val, msg) {
            // see if this has been passed on from another soundfx
            if (msg.nodeID) {
                node.send(msg);
                return;
            }

            if (!fxtypes[node.fxtype].fxcontrols[param] && param !== 'bpm') {
                node.warn('No such fxcontrol: ' + param);
                return;
            }
            // do not store trigger values, they should be sent once only
            if (param.substring(0, 2) !== 't_') {
                node.parameters[param] = val;
            }
            msg.nodeID = node.id;
            node.send(msg);
        }

        function reset () {
            node.fxtype = config.fxtype || 'reverb';
            node.name = config.name || node.fxtype;

            node.parameters = node.parameters || {};

            setTimeout(() => {
                node.send({ topic: 'fxtype', fxpath: [{ nodeID: node.id, fxtype: node.fxtype, parameters: node.parameters }] });
                if (config.fxcontrols) {
                    for (let fxcontrol in config.fxcontrols) {
                        const controlval = config.fxcontrols[fxcontrol];
                        let msg = { topic: 'fxcontrol:' + fxcontrol, payload: controlval };
                        setFXParam(fxcontrol, controlval, msg);
                    }
                }
            }, 200);
        }
    }

    RED.nodes.registerType('soundfx', SoundFXNode);
};
