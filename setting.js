
const nrp = require('node-red-contrib-properties');

module.exports = function (RED) {
    'use strict';

    function SettingNode (config) {
        RED.nodes.createNode(this, config);
        const node = this;

        reset();

        let newVal;

        this.on('input', function (msg) {
            if (msg.topic) {
                switch (msg.topic) {
                    case 'up':
                    case 'down':
                        const oldVal = getSetting();

                        if (Number.isNaN(oldVal)) {
                            node.warn('To change a setting up or down the value must be a number');
                            return;
                        }

                        let change = numberFrom(msg.payload, 1);
                        if (msg.topic === 'down') {
                            change = -change;
                        }

                        newVal = oldVal + change;
                        setSetting(newVal);
                        msg.topic = node.setting;
                        msg.payload = getSetting(); // not newVal in case it is outside limits
                        node.send(msg);
                        break;

                    case 'set':
                    default:
                        if (node.properties.inputPayload(msg)) {
                            node.send(msg);
                        }
                }
            } else {
                if (msg.payload === 'reset') {
                    reset();
                    setTimeout(() => node.send(msg), 200); // wait for links to be created
                } else {
                    if (!node.properties.inputProperties(msg)) {
                        setSetting(msg.payload);
                    }
                    node.send(msg);
                }
            }
        });

        this.on('close', function () {
            setSetting(null);
        });

        function setSetting (newVal) {
            if (!isNaN(newVal) && newVal !== null) {
                if (!isNaN(node.min)) {
                    newVal = Math.max(newVal, node.min);
                }

                if (node.max && !isNaN(node.max)) {
                    newVal = Math.min(newVal, node.max);
                }
            }

            let disp;
            if (isNaN(newVal)) {
                disp = newVal;
            } else {
                if (newVal >= 10) {
                    disp = Math.round(newVal);
                } else {
                    disp = Math.round(newVal * 10) / 10;
                }
            }
            node.status({ fill: 'grey', shape: 'ring', text: node.setting + ': ' + disp });

            node.properties.setRaw(node.setting, newVal);
        }

        function getSetting () {
            return node.properties.get(node.setting);
        }

        function reset () {
            node.name = config.name || config.setting || 'setting';
            node.setting = config.setting || 'volume';
            node.initial = config.initial || 50;
            node.contextName = config.context || 'node';
            node.min = Number(config.min);
            node.max = Number(config.max);

            let props = {};
            props[node.setting] = { value: config.initial };
            node.properties = new nrp.NodeRedProperties(node, config, props);
            node.properties.setContext(node.contextName, node.setting);
            node.properties.handle(setSetting, node.setting);

            // set the value a little later so other nodes are connected and ready to receive the message
            setTimeout(function () {
                setSetting(node.initial);
            }, 200);
        }
    }

    function numberFrom (val, undef) {
        let num = Number(val);
        if (val.length === 0 || Number.isNaN(num)) {
            num = undef;
        }
        return num;
    }

    RED.nodes.registerType('setting', SettingNode);
};
