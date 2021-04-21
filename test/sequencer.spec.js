const helper = require('node-red-node-test-helper');
const sequencerNode = require('../sequencer.js');

helper.init(require.resolve('node-red'));

describe('sequencer Node', function () {
    let sequencerBase;
    let beatMsg;
    let barMsg;

    beforeEach(function (done) {
        helper.startServer(done);
        sequencerBase =
        [{
            'id': 'n1',
            'type': 'sequencer',
            'name': 'sequencer',
            'input': 'beat',
            'notesrand': false,
            'rhythm': '[2,1]',
            'rhythmrand': false,
            'loop': true,
            'start': 'bar',
            'output': 'single',
            'controls': [
                {
                    'name': 'note',
                    'values': '[1,2,4]'
                }
            ],
            'wires': [
                ['n2']
            ]
        },
        {
            'id': 'n2',
            'type': 'helper'
        }
    ];
        barMsg = { 'payload': 'tick', 'start': ['beat', 'bar'] };
        beatMsg = { 'payload': 'tick', 'start': ['beat'] };
    });

    afterEach(function (done) {
        helper.unload();
        helper.stopServer(done);
    });

    it('should be loaded', function (done) {
        let flow = sequencerBase;
        helper.load(sequencerNode, flow, function () {
            const n1 = helper.getNode('n1');
            try {
                expect(n1).toHaveProperty('name', 'sequencer');
                done();
              } catch (err) {
                done(err);
              }
        });
    });

    // send a message to a node and wait to the next loop so that any events are triggered, return a promise so we can await resolution
    function receivePromise (node, msg) {
        return new Promise(resolve => {
            node.receive(msg);
            setImmediate(resolve);
        });
    }

    // return the most recent value for the first parameter passed to the spy function
    function lastValue (spy) {
        return spy.mock.calls[spy.mock.calls.length - 1][0];
    }

    it('should send first beat when first length is 1 and bar is started', function (done) {
        let flow = sequencerBase;
        helper.load(sequencerNode, flow, async function () {
            const n1 = helper.getNode('n1');
            const n2 = helper.getNode('n2');
            const spy = jest.fn();
            await n2.on('input', function (msg) {
                try {
                    spy(msg);
                } catch (err) {
                    done(err);
                }
            });
            expect(spy).not.toHaveBeenCalled();
            await receivePromise(n1, barMsg);
            expect(spy).toHaveBeenCalled();
            done();
        });
    });

    it('should not send beat when start event (bar) has not happened', function (done) {
        let flow = sequencerBase;
        helper.load(sequencerNode, flow, async function () {
            const n1 = helper.getNode('n1');
            const n2 = helper.getNode('n2');
            const spy = jest.fn();
            n2.on('input', function (msg) {
                try {
                    spy(msg);
                } catch (err) {
                    done(err);
                }
            });
            await receivePromise(n1, beatMsg);
            expect(spy).not.toHaveBeenCalled();
            done();
        });
    });

    it('should follow pattern from start event', function (done) {
        let flow = sequencerBase;
        helper.load(sequencerNode, flow, async function () {
            const n1 = helper.getNode('n1');
            const n2 = helper.getNode('n2');
            const spy = jest.fn();
            n2.on('input', function (msg) {
                try {
                    spy(msg);
                } catch (err) {
                    done(err);
                }
            });
            expect(spy).not.toHaveBeenCalled();
            await receivePromise(n1, barMsg);
            expect(spy).toHaveBeenCalledTimes(1);
            await receivePromise(n1, beatMsg);
            expect(spy).toHaveBeenCalledTimes(1);
            await receivePromise(n1, beatMsg);
            expect(spy).toHaveBeenCalledTimes(2);
            done();
        });
    });

    it('should should loop when loop is true', function (done) {
        let flow = sequencerBase;
        helper.load(sequencerNode, flow, async function () {
            const n1 = helper.getNode('n1');
            const n2 = helper.getNode('n2');
            const spy = jest.fn();
            n2.on('input', function (msg) {
                try {
                    spy(msg);
                } catch (err) {
                    done(err);
                }
            });
            expect(spy).not.toHaveBeenCalled();
            await receivePromise(n1, barMsg);
            expect(spy).toHaveBeenCalledTimes(1);
            await receivePromise(n1, beatMsg);
            expect(spy).toHaveBeenCalledTimes(1);
            await receivePromise(n1, beatMsg);
            expect(spy).toHaveBeenCalledTimes(2);
            await receivePromise(n1, beatMsg);
            expect(spy).toHaveBeenCalledTimes(3);
            done();
        });
    });

    it('should should not loop when loop is false', function (done) {
        let flow = sequencerBase;
        let seqNode = flow[0];
        seqNode.loop = false;
        flow[0] = seqNode;
        helper.load(sequencerNode, flow, async function () {
            const n1 = helper.getNode('n1');
            const n2 = helper.getNode('n2');
            const spy = jest.fn();
            n2.on('input', function (msg) {
                try {
                    spy(msg);
                } catch (err) {
                    done(err);
                }
            });
            expect(spy).not.toHaveBeenCalled();
            await receivePromise(n1, barMsg);
            expect(spy).toHaveBeenCalledTimes(1);
            await receivePromise(n1, beatMsg);
            expect(spy).toHaveBeenCalledTimes(1);
            await receivePromise(n1, beatMsg);
            expect(spy).toHaveBeenCalledTimes(2);
            await receivePromise(n1, beatMsg);
            expect(spy).toHaveBeenCalledTimes(2);
            done();
        });
    });

    it('should wait until start event occurs', function (done) {
        let flow = sequencerBase;
        helper.load(sequencerNode, flow, async function () {
            const n1 = helper.getNode('n1');
            const n2 = helper.getNode('n2');
            const spy = jest.fn();
            n2.on('input', function (msg) {
                try {
                    spy(msg);
                } catch (err) {
                    done(err);
                }
            });
            expect(spy).not.toHaveBeenCalled();
            await receivePromise(n1, beatMsg);
            expect(spy).not.toHaveBeenCalled();
            await receivePromise(n1, beatMsg);
            expect(spy).not.toHaveBeenCalled();
            await receivePromise(n1, barMsg);
            expect(spy).toHaveBeenCalledTimes(1);
            done();
        });
    });

    it('should add sequenced note values to ticks', function (done) {
        let flow = sequencerBase;
        helper.load(sequencerNode, flow, async function () {
            const n1 = helper.getNode('n1');
            const n2 = helper.getNode('n2');
            const spy = jest.fn();
            n2.on('input', function (msg) {
                try {
                    spy(msg);
                } catch (err) {
                    done(err);
                }
            });
            await receivePromise(n1, barMsg);
            expect(lastValue(spy)).toHaveProperty('note', 1);
            await receivePromise(n1, beatMsg);
            await receivePromise(n1, beatMsg);
            expect(lastValue(spy)).toHaveProperty('note', 2);
            await receivePromise(n1, beatMsg);
            expect(lastValue(spy)).toHaveProperty('note', 4);
            done();
        });
    });

    it('should allow values to be pushed', function (done) {
        let flow = sequencerBase;
        let seqNode = flow[0];
        seqNode.rhythm = '[1]';
        flow[0] = seqNode;
        let pushMsg = { topic: 'note', payload: 'push 7' };
        helper.load(sequencerNode, flow, async function () {
            const n1 = helper.getNode('n1');
            const n2 = helper.getNode('n2');
            const spy = jest.fn();
            n2.on('input', function (msg) {
                try {
                    spy(msg);
                } catch (err) {
                    done(err);
                }
            });
            await receivePromise(n1, barMsg);
            expect(lastValue(spy)).toHaveProperty('note', 1);
            await receivePromise(n1, pushMsg);
            await receivePromise(n1, beatMsg);
            expect(lastValue(spy)).toHaveProperty('note', 2);
            await receivePromise(n1, beatMsg);
            expect(lastValue(spy)).toHaveProperty('note', 4);
            await receivePromise(n1, beatMsg);
            expect(lastValue(spy)).toHaveProperty('note', 7);
            done();
        });
    });

    it('should allow values to be popped', function (done) {
        let flow = sequencerBase;
        let seqNode = flow[0];
        seqNode.rhythm = '[1]';
        flow[0] = seqNode;
        let popMsg = { topic: 'note', payload: 'pop' };
        helper.load(sequencerNode, flow, async function () {
            const n1 = helper.getNode('n1');
            const n2 = helper.getNode('n2');
            const spy = jest.fn();
            n2.on('input', function (msg) {
                try {
                    spy(msg);
                } catch (err) {
                    done(err);
                }
            });
            await receivePromise(n1, barMsg);
            expect(lastValue(spy)).toHaveProperty('note', 1);
            await receivePromise(n1, popMsg);
            await receivePromise(n1, beatMsg);
            expect(lastValue(spy)).toHaveProperty('note', 2);
            await receivePromise(n1, beatMsg);
            expect(lastValue(spy)).toHaveProperty('note', 1);
            done();
        });
    });

    it('should allow individual values to be changed', function (done) {
        let flow = sequencerBase;
        let seqNode = flow[0];
        seqNode.rhythm = '[1]';
        flow[0] = seqNode;
        let changeMsg = { topic: 'note[1]', payload: '7' };
        helper.load(sequencerNode, flow, async function () {
            const n1 = helper.getNode('n1');
            const n2 = helper.getNode('n2');
            const spy = jest.fn();
            n2.on('input', function (msg) {
                try {
                    spy(msg);
                } catch (err) {
                    done(err);
                }
            });
            await receivePromise(n1, barMsg);
            expect(lastValue(spy)).toHaveProperty('note', 1);
            await receivePromise(n1, changeMsg);
            await receivePromise(n1, beatMsg);
            expect(lastValue(spy)).toHaveProperty('note', 7);
            done();
        });
    });
});
