module.exports = function (RED) {
    'use strict';

    const dgram = require('dgram');
    const osc = require('osc');

    const heartbeatInterval = 5000;

    function SuperColliderNode (config) {
        const nrp = require('node-red-contrib-properties');

        RED.nodes.createNode(this, config);
        var node = this;

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

        this.on('close', function () {
            if (node.heartbeat) {
                clearTimeout(node.heartbeat);
                node.heartbeat = null;
            }
        });

        function checkSynthType (synthtype) {
            node.warn('Unknown synthtype: ' + synthtype);
        }

        function reset () {
            clearTimeout(node.heartbeat);
            heartbeat();
        }

        function heartbeat () {
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
