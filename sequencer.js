module.exports = function (RED) {
    'use strict';

    var _ = require('underscore');

    function SequencerNode (config) {
        RED.nodes.createNode(this, config);
        var node = this;

        reset();

        this.on('input', function (msg) {
            switch (msg.payload) {
            case 'tick':
                var start = msg.start || [];
                var controlSet = false;
                if (start.indexOf(node.input) >= 0) {
                    //                only start/ restart when we get the right kind of tick
                    if (node.rhythmPos > -1 || start.indexOf(node.start) >= 0) {
                        node.rhythmCount--;
                        if (node.rhythmCount <= 0) {
                            if (node.rhythmrand && node.loop) {
                                node.rhythmCount = _.sample(node.rhythm);
                                node.rhythmPos = 0; // needs to be > 0 so that it continues after start/restart
                            } else {
                                node.rhythmPos++;
                                if (node.rhythmPos >= node.rhythm.length) {
                                    node.rhythmPos = 0;
                                }
                                node.rhythmCount = node.rhythm[node.rhythmPos];
                            }

                            for (let i = 0; i < node.controls.length; i++) {
                                let control = node.controls[i];
                                // use undefined instead of null so we can include null values in sequences
                                control.value = undefined;
                                if (node.notesrand && node.loop) {
                                    control.value = _.sample(control.values);
                                } else {
                                    control.pos++;
                                    if (control.pos >= control.values.length) {
                                        if (node.loop) {
                                            control.pos = 0;
                                            control.value = control.values[control.pos];
                                        }
                                    } else {
                                        control.value = control.values[control.pos];
                                    }
                                }
                                if (control.value !== undefined) {
                                    controlSet = true;
                                }
                            }
                            if (!controlSet) {
                                reset();
                            }
                        }
                    }
                }

                // send control message to second output every time
                if (controlSet) {
                    for (let i = 0; i < node.controls.length; i++) {
                        let control = node.controls[i];
                        if (control.value != null) {
                            let controlMsg = { topic: control.name,
                                               payload: control.value
                                             };
                            node.send([null, controlMsg]);
                        }
                    }
                }

                switch (node.output) {
                case 'single':
                    if (controlSet) {
                        var playmsg = JSON.parse(JSON.stringify(msg));
                        var beatRatio = 1;
                        if (node.input !== 'beat') {
                            beatRatio = msg['beats_per_' + node.input];
                        }
                        playmsg.beats = node.rhythmCount * beatRatio;
                        for (let i = 0; i < node.controls.length; i++) {
                            let control = node.controls[i];
                            if (control.value !== undefined) {
                                playmsg[control.name] = control.value;
                            }
                        }
                        node.send([playmsg, null]);
                    }
                    break;

                case 'all':
                    for (let i = 0; i < node.controls.length; i++) {
                        let control = node.controls[i];
                        if (control.value != null) {
                            msg[control.name] = control.value;
                        }
                    }
                    node.send([msg, null]);

                    break;

                default:
                    node.warn('Unknown output type ' + node.output);
                    // do nothing
                    break;
                }
                break;

            case 'reset':
                reset();
                node.send([msg, null]);
                break;

            default:
                // see if the topic is one of the sequenced values
                var foundTopic = false;
                for (let i = 0; i < node.controls.length; i++) {
                    let control = node.controls[i];
                    if (control.name === msg.topic) {
                        try {
                            if (Array.isArray(msg.payload)) {
                                control.values = msg.payload;
                            } else {
                                control.values = JSON.parse(msg.payload);
                            }
                            foundTopic = true;
                        } catch (e) {
                            // do nothing
                        }
                    }
                }

                if (!foundTopic) {
                    node.send([msg, null]);
                }
                break;
            }
        });

        function restart () {
            node.controls = JSON.parse(JSON.stringify(node.controlsraw));
            if ((!Array.isArray(node.controls)) || node.controls.length < 1) {
                node.controls = [{ name: 'note', values: '[1,4,5,4]' }];
            }

            for (let i = 0; i < node.controls.length; i++) {
                let control = node.controls[i];
                try {
                    control.values = JSON.parse(control.values);
                } catch (e) {
                    control.values = [1, 4, 5, 4];
                }
                if (!Array.isArray(control.values)) {
                    if (control.values) {
                        control.values = [control.values];
                    } else {
                        control.values = [1, 4, 5, 4];
                    }
                }
            }

            node.rhythmPos = -1; // the position in the list of lengths
            node.rhythmCount = 0; // count down the number of beats
            if (node.rhythmrand & !node.loop) {
                node.rhythm = _.shuffle(node.rhythm);
            }

            for (let i = 0; i < node.controls.length; i++) {
                let control = node.controls[i];
                control.pos = -1;
                if (node.notesrand & !node.loop) {
                    control.values = _.shuffle(control.values);
                }
            }
        }

        function reset () {
            node.input = config.input || 'beat';

            try {
                node.rhythm = JSON.parse(config.rhythm);
            } catch (e) {
                node.rhythm = null;
            }
            if (!Array.isArray(node.rhythm)) {
                node.rhythm = [node.rhythm];
            }

            node.start = config.start || 'bar'; // sequence won't start until this

            node.loop = config.loop || false;
            node.notesrand = config.notesrand || false;
            node.rhythmrand = config.rhythmrand || false;
            node.output = config.output || 'single';

            node.controlsraw = config.controls;

            restart();
        }
    }

    RED.nodes.registerType('sequencer', SequencerNode);
};
