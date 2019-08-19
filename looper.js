const sc = require('./supercollider');

module.exports = function (RED) {
    'use strict';

    function LooperNode (config) {
        RED.nodes.createNode(this, config);
        const node = this;

        reset();

        this.on('input', function (msg) {
            switch (msg.payload) {
            case 'tick':
                tickHandler(msg);
                break;

            case 'play': // the action
            case 'record': // the action
                node.count = -1;
                setState(msg.payload);
                break;

            case 'stop':
                switch (node.state) {
                case 'play':
                case 'record':
                    node.count = -1;
                    setState('waiting');
                }
                break;

            case 'reset':
                reset();
                // do not send on message
                break;

            default:
                // do nothing
                break;
            }
        });

        function tickHandler (msg) {
            switch (node.state) {
            case 'wait':
                // do nothing
                break;

            case 'play': // the state
            case 'record': // the state
                let start = msg.start || [];
                if (node.count <= 0) {
                    if (start.includes(node.start)) {
                        node.count = node.length;
                        setState(node.state); // to display status
                        createSynth(node, msg, node.state);
                    } else {
                        // ignore all ticks until the start event
                    }
                } else {
                    if (start.includes(node.input)) {
                        node.count--;
                    }
                    if (node.count <= 0) {
                        if (node.loop) {
                            // whether we are recording or looping we carry on to play
                            setState('play');
                            // call the handler immediately in case the looper starts playing immediately it finishes recording
                            tickHandler(msg);
                        } else {
                            setState('wait'); // TODO: unless we are looping
                        }
                    }
                }
                break;

            default:
                // do nothing
            }
        }

        function restart () {
            node.count = -1; // the number of relevant ticks left to the end of the play/record. -1 indicates it hasn't started yet
            setState('wait');

            // wait a little while to allow wires to be created

            setTimeout(function () {
                    sc.freeBuffer(node);
                sc.createBuffer(node);
                node.synthdefName = 'playSampleStereo';
                sc.sendSynthDef(node);
                node.synthdefName = 'recordSampleStereo';
                sc.sendSynthDef(node);
            }, 200);
        }

        function reset () {
            node.volume = config.volume || 50;

            node.input = config.input || 'beat';

            node.start = config.start || 'bar'; // sampler won't start playing/recording until this

            node.loop = config.loop || false;

            node.length = Number(config.length) || 4;

            node.tags = [];

            restart();
        }

        function setState (state) {
            // state can be:
            // 'wait' for a command ('play' or 'record');
            // 'play'; although if beatCount is -1 it is not actually play yet
            // 'record'; ditto

            let shape, colour;
            node.state = state;

            switch (state) {
            case 'record':
                colour = 'red';
                break;

            case 'play':
                colour = 'green';
                break;

            case 'wait':
                colour = 'grey';
                break;
            }

            if (node.count === -1) {
                shape = 'ring';
            } else {
                shape = 'dot';
            }

            node.status({ fill: colour, shape: shape, text: state });
        }
    }

    function createSynth (node, msg, action) {
        if (!['play', 'record'].includes(action)) {
            node.warn('no synth for action ' + action);
            return;
        }

        if (!node.bufnum) {
            node.warn('cannot create sampler synth without buffer');
            return;
        }

        var payload = [action + 'SampleStereo', -1, 0, 0, 'buffer', node.bufnum];

        payload.push('amp', sc.volume2amp(node));
        const bpm = msg.bpm || node.context().global.get('bpm');
        let sustain = node.length * 60 / bpm;
        let multiple = msg['beats_per_' + node.input];
        if (multiple) {
            sustain *= multiple;
        }
        payload.push('sustain', sustain);

        const address = '/s_new';

        let createMsg;
        if (msg.timeTag) {
            let timeTag = msg.timeTag;
            if (msg.latency) {
                timeTag -= msg.latency / 2;
            }
            createMsg = {
                payload: {
                    timeTag,
                    packets: [
                        {
                            address: address,
                            args: payload
                        }
                    ]
                }
            };
        } else {
            createMsg = { topic: address, payload: payload };
        }

        node.send(createMsg);
    }

    RED.nodes.registerType('looper', LooperNode);
};
