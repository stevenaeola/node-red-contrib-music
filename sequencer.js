module.exports = function (RED) {
    'use strict';

    const _ = require('underscore');

    function SequencerNode (config) {
        RED.nodes.createNode(this, config);
        const node = this;

        reset();

        this.on('input', function (msg) {
            switch (msg.payload) {
            case 'tick':
                let start = msg.start || [];
                let controlSet = false;
                if (start.indexOf(node.input) >= 0) {
                    //                only start/ restart when we get the right kind of tick
                    // rhythmCount counts the number of events left in the current sequence position
                    // rhythmPos points to where we are in the sequence
                    // rhythmPos starts at -1, and only becomes non-negative when the sequence is started by a node.start event
                    if (node.rhythmPos > -1 || start.indexOf(node.start) >= 0) {
                        node.rhythmCount--;
                        if (node.rhythmCount <= 0) {
                            if (node.rhythmrand && node.loop) {
                                node.rhythmCount = _.sample(node.rhythm);
                                node.rhythmPos = 0; // needs to be > -1 so that it continues after start/restart
                            } else {
                                node.rhythmPos++;
                                if (node.rhythmPos >= node.rhythm.length) {
                                    if (node.loop) {
                                        node.rhythmPos = 0;
                                    } else {
                                        node.rhythmPos = -1;
                                    }
                                }
                                if (node.rhythmPos >= 0) {
                                    node.rhythmCount = node.rhythm[node.rhythmPos];
                                }
                                // use a null value to pause the sequence until a start comes along
                                if (node.rhythmCount === null) {
                                    node.rhythmCount = Number.NaN;
                                }
                            }

                            for (let control of node.controls) {
                                // use undefined instead of null so we can include null values in sequences
                                control.value = undefined;
                                if (node.notesrand && node.loop) {
                                    control.value = _.sample(control.valueList);
                                } else {
                                    // control.pos always goes from 0 upwards, even when the sequence is running backwards
                                    // control.reverse is true if running backwards
                                    control.pos++;
                                    if (control.pos >= control.valueList.length) {
                                        control.pos = 0;
                                        if (node.order.includes('forwardbackward')) {
                                            control.reverse = !control.reverse;
                                        }

                                        if (node.order === 'forwardbackwardnorep' && control.valueList.length > 1) {
                                            control.pos = 1;
                                        }
                                    }
                                    control.value = control.valueList[pos2Index(control)];
                                }
                                if (control.value !== undefined) {
                                    controlSet = true;
                                }
                            }
                            if (!controlSet) {
                                restart();
                            }
                        }
                    }
                }

                // send control message to second output every time
                if (controlSet) {
                    for (let control of node.controls) {
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
                        let playmsg = JSON.parse(JSON.stringify(msg));
                        let beatRatio = 1;
                        if (node.input !== 'beat') {
                            beatRatio = msg['beats_per_' + node.input];
                        }
                        playmsg.beats = node.rhythmCount * beatRatio;
                        for (let control of node.controls) {
                            if (control.value !== undefined) {
                                playmsg[control.name] = control.value;
                            }
                        }
                        node.send([playmsg, null]);
                    }
                    break;

                case 'all':
                    for (let control of node.controls) {
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

                // move on to the next position next time
                // particularly useful with a null value
            case 'next':
                node.rhythmCount = 0;
                break;

            case 'reset':
                reset();
                node.send([msg, null]);
                break;

                default:
                    // see if the topic is one of the sequenced values
                    let foundTopic = false;
                    const indexRegex = /(\w+)\[(\d+)]/;
                    let topicControl = msg.topic;
                    let controlIndex = null;
                    let match = msg.topic.match(indexRegex);

                    if (match) {
                        controlIndex = Number(match[2]);
                        if (Number.isInteger(controlIndex) && controlIndex >= 0) {
                            topicControl = match[1];
                        } else {
                            controlIndex = null;
                        }
                    }
                    for (let i = 0; i < node.controls.length; i++) {
                        let control = node.controls[i];
                        let controlraw = node.controlsraw[i];
                        if (control.name === topicControl) {
                            if (controlIndex !== null) {
                                while ((control.valueList.length - 1) < controlIndex) {
                                    control.valueList.push(null);
                                    controlraw.valueList.push(null);
                                }
                                control.valueList[controlIndex] = controlraw.valueList[controlIndex] = JSON.parse(msg.payload);
                                foundTopic = true;
                            } else {
                                try {
                                    if (Array.isArray(msg.payload)) {
                                        control.valueList = msg.payload;
                                    } else {
                                        let bits = msg.payload.split(' ');
                                        let firstBit = bits.shift();
                                        if (firstBit === 'pop') {
                                            control.valueList.pop();
                                            controlraw.valueList.pop();
                                        } else if (firstBit === 'push') {
                                            const rest = JSON.parse(bits.join(' '));
                                            control.valueList.push(rest);
                                            controlraw.valueList.push(rest);
                                        } else {
                                            controlraw.valueList = control.valueList = JSON.parse(msg.payload);
                                        }
                                    }
                                    foundTopic = true;
                                } catch (e) {
                                    // do nothing
                                }
                            }
                        }
                    }

                    if (!foundTopic) {
                        node.send([msg, null]);
                    }
                    break;
            }
        });

        function pos2Index (control) {
            return control.reverse ? (control.valueList.length - 1 - control.pos) : control.pos;
        }

        function restart () {
            node.controls = JSON.parse(JSON.stringify(node.controlsraw));
            if ((!Array.isArray(node.controls)) || node.controls.length < 1) {
                node.controls = [{ name: 'note', values: '[1,4,5,4]' }];
            }

            for (let control of node.controls) {
                if (!Array.isArray(control.valueList)) {
                    if (control.valueList) {
                        control.valueList = [control.valueList];
                    } else {
                        control.valueList = [1, 4, 5, 4];
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
                control.reverse = node.order === 'backward';
                if (node.notesrand & !node.loop) {
                    control.valueList = _.shuffle(control.valueList);
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
            node.order = config.order || (config.notesrand ? 'random' : 'forward');
            node.notesrand = node.order === 'random';
            node.rhythmrand = config.rhythmrand || false;
            node.output = config.output || 'single';
            node.controlsraw = [];
            for (let ccontrol of config.controls) {
                let values;
                try {
                    values = JSON.parse(ccontrol.values);
                } catch (e) {
                    values = null;
                }
                let control = { name: ccontrol.name, valueList: values };
                node.controlsraw.push(control);
            }

            restart();
        }
    }

    RED.nodes.registerType('sequencer', SequencerNode);
};
