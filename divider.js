module.exports = function (RED) {
    'use strict';

    function DividerNode (config) {
        const nrp = require('node-red-contrib-properties');

        RED.nodes.createNode(this, config);
        var node = this;

        let properties = new nrp.NodeRedProperties(node, config,
                                                   {
                                                       name: { value: 'bar' },
                                                       input: { value: 'beat' },
                                                       output: { value: 'bar' },
                                                       ratio: { value: 4 }
                                                   });

        /*
         * node.offsetCount is used as an offest to the number of beats when calculating the number of bars and the beat of bar from the beat number
         * This is usually 0, but changes when the ratio is changed
         */

        properties.handle(setRatio, 'ratio');
        reset();
        setRatio(config.ratio || 4);

        this.on('input', function (msg) {
            if (properties.input(msg)) {
                return;
            }

            switch (msg.payload) {
            case 'tick':
                const start = msg.start || [];
                const end = msg.end || [];
                let inputVal, inputCount, outputCount;
                inputVal = msg[node.input];
                inputCount = counts(inputVal).input;
                outputCount = counts(inputVal).output;

                if (inputCount >= node.ratio && end.includes(node.input)) {
                    end.push(node.output);
                }

                if (inputCount === 1 && start.includes(node.input)) {
                    start.push(node.output);
                }

                msg.start = start;
                msg.end = end;

                var counter = node.input + '_of_' + node.output;
                var beatsPerName = 'beats_per_' + node.output;
                let beatsPerVal;

                if (node.input === 'beat') {
                    beatsPerVal = node.ratio;
                } else {
                    beatsPerVal = node.ratio * msg['beats_per_' + node.input];
                }
                msg[beatsPerName] = beatsPerVal;

                msg[counter] = inputCount;
                node.lastInput = inputCount;

                msg[node.output] = outputCount;
                node.lastOutput = outputCount;

                node.status({ 'text':
                             node.output + ':' + outputCount + ' ' +
                              node.input + ':' + inputCount + ' ' +
                              ' ratio ' + node.ratio });

                node.send(msg);

                break;

            case 'reset':
                reset();
                node.send(msg);
                break;

            default:
                node.send(msg);
                break;
            }
        });

        // calculate the counts (e.g. beat of bar, bar)
        function counts (inputVal) {
            let beatExpr = inputVal - 1 + node.offsetCount;
            return { input: beatExpr % node.ratio + 1,
                    output: Math.floor(beatExpr / node.ratio) + 1 };
        }

        function setRatio (ratio, msg) {
            msg = msg || {};
            ratio = Number(ratio);
            if (node.ratio > 0 && Number.isInteger(ratio)) {
                let oldRatio = node.ratio;
                node.ratio = ratio;
                // recalculate the offset to retain the same e.g. bar and beat of bar (bob)
                // beat = (bar-1)*ratio + bob + offset
                if (node.lastOutput) {
                    node.offsetCount = node.offsetCount + (node.lastOutput - 1) * (ratio - oldRatio);
                    // when changing down ratio, make sure the new input is at most the last beat of bar
                    let changeDown = Math.max(node.lastInput - ratio, 0);
                    node.offsetCount -= changeDown;
                } else {
                    // should only happen when first deploying
                    node.offsetCount = 0;
                }
            } else {
                node.warn('Not a valid ratio: ' + ratio);
            }
        }

        function reset () {
            node.input = config.input || 'beat';
            node.output = config.output || 'bar';
            node.ratio = config.ratio || 4;
            node.name = config.name;
            node.offsetCount = 0;
            node.status('');
        }
    }

    RED.nodes.registerType('divider', DividerNode);
};
