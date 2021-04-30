const helper = require('node-red-node-test-helper');
const sequencerNode = require('../sequencer.js');

helper.init(require.resolve('node-red'));

describe('sequencer Node', function () {
    let beatMsg;
    let barMsg;

    function sequencerBase (nonDefaultProps) {
        let n1 = {
            'id': 'n1',
            'type': 'sequencer',
            'name': 'sequencer',
            'input': 'beat',
            'rhythm': '[2,1]',
            'rhythmrand': false,
            'loop': true,
            'start': 'bar',
            'output': 'single',
            'order': 'forward',
            'controls': [
                {
                    'name': 'note',
                    'values': '[1,2,4]'
                }
            ],
            'wires': [
                ['n2']
            ]
        };
        Object.assign(n1, nonDefaultProps);
        let flow = [n1,
            {
                'id': 'n2',
                'type': 'helper'
            }
        ];
        return flow;
    }

    beforeEach(function (done) {
        helper.startServer(done);
        barMsg = { 'payload': 'tick', 'start': ['beat', 'bar'] };
        beatMsg = { 'payload': 'tick', 'start': ['beat'] };
    });

    afterEach(function (done) {
        helper.unload();
        helper.stopServer(done);
    });

    it('should be loaded', function (done) {
        let flow = sequencerBase();
        helper.load(sequencerNode, flow, function () {
            const n1 = helper.getNode('n1');
            try {
                expect(n1).toHaveProperty('name', 'sequencer');
                expect(n1).toHaveProperty('notesrand', false);
                expect(n1).toHaveProperty('loop', true);

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
        let flow = sequencerBase();
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
        let flow = sequencerBase();
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
        let flow = sequencerBase();
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
        let flow = sequencerBase();
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
            expect(spy).toHaveBeenCalledTimes(1); // rhythm [2,1]
            await receivePromise(n1, beatMsg);
            expect(spy).toHaveBeenCalledTimes(2);
            await receivePromise(n1, beatMsg);
            expect(spy).toHaveBeenCalledTimes(3);
            await receivePromise(n1, beatMsg);
            expect(spy).toHaveBeenCalledTimes(3);
            await receivePromise(n1, beatMsg);
            expect(spy).toHaveBeenCalledTimes(4);
            done();
        });
    });

    it('should should not loop when loop is false', function (done) {
        let flow = sequencerBase({ loop: false });
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
            for (let i = 0; i < 10; i++) {
                await receivePromise(n1, beatMsg);
                expect(spy).toHaveBeenCalledTimes(3);
            }

            done();
        });
    });

    it('should wait until start event occurs', function (done) {
        let flow = sequencerBase();
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
        let flow = sequencerBase();
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
        let flow = sequencerBase({ rhythm: '[1]' });
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
        let flow = sequencerBase({ rhythm: '[1]' });
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
        let flow = sequencerBase({ rhythm: '[1]' });
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

    it('should reset when told to', function (done) {
        let flow = sequencerBase({ rhythm: '[1]' });
        let resetMsg = { payload: 'reset' };
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
            await receivePromise(n1, resetMsg);
            expect(spy).toHaveBeenCalledTimes(2); // reset message is forwarded
            await receivePromise(n1, beatMsg);
            expect(spy).toHaveBeenCalledTimes(2); // need a bar message to restart
            await receivePromise(n1, barMsg);
            expect(lastValue(spy)).toHaveProperty('note', 1); // back to the beginning
            done();
        });
    });

    it('should wait indefinitely for a null length', function (done) {
        let flow = sequencerBase({ rhythm: '[1,null]' });
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
            for (let i = 0; i < 10; i++) {
                await receivePromise(n1, beatMsg);
                expect(spy).toHaveBeenCalledTimes(2);
            }
            done();
        });
    });

    it('should move on with a "next" message', function (done) {
        let flow = sequencerBase({ rhythm: '[1,null]' });
        let nextMsg = { payload: 'next' };
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
            for (let i = 0; i < 10; i++) {
                await receivePromise(n1, beatMsg);
                expect(spy).toHaveBeenCalledTimes(2);
                expect(lastValue(spy)).toHaveProperty('note', 2);
            }
            await receivePromise(n1, nextMsg);
            await receivePromise(n1, beatMsg);
            expect(spy).toHaveBeenCalledTimes(3);
            expect(lastValue(spy)).toHaveProperty('note', 4);
            done();
        });
    });

    it('should allow non-array values', function (done) {
        let flow = sequencerBase({ 'controls': [
            {
                'name': 'note',
                'values': '3'
            }
        ] });
        helper.load(sequencerNode, flow, async function () {
            const n1 = helper.getNode('n1');
            try {
                expect(n1.controls[0]).toHaveProperty('valueList', [3]);
                done();
              } catch (err) {
                done(err);
              }
        });
    });

    it('should go backwards', function (done) {
        let flow = sequencerBase({ 'order': 'backward' });
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
            expect(lastValue(spy)).toHaveProperty('note', 4);
            await receivePromise(n1, beatMsg);
            await receivePromise(n1, beatMsg);
            expect(lastValue(spy)).toHaveProperty('note', 2);
            await receivePromise(n1, beatMsg);
            expect(lastValue(spy)).toHaveProperty('note', 1);
            done();
        });
    });

    it('should go forwards and backwards with repeat', function (done) {
        let flow = sequencerBase({ 'order': 'forwardbackwardrep', 'rhythm': '[1]' });
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
            expect(lastValue(spy)).toHaveProperty('note', 2);
            await receivePromise(n1, beatMsg);
            expect(lastValue(spy)).toHaveProperty('note', 4);
            await receivePromise(n1, beatMsg);
            expect(lastValue(spy)).toHaveProperty('note', 4);
            await receivePromise(n1, beatMsg);
            expect(lastValue(spy)).toHaveProperty('note', 2);
            await receivePromise(n1, beatMsg);
            expect(lastValue(spy)).toHaveProperty('note', 1);
            done();
        });
    });

    it('should go forwards and backwards without repeat', function (done) {
        let flow = sequencerBase({ 'order': 'forwardbackwardnorep', 'rhythm': '[1]' });
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
            expect(lastValue(spy)).toHaveProperty('note', 2);
            await receivePromise(n1, beatMsg);
            expect(lastValue(spy)).toHaveProperty('note', 4);
            await receivePromise(n1, beatMsg);
            expect(lastValue(spy)).toHaveProperty('note', 2);
            await receivePromise(n1, beatMsg);
            expect(lastValue(spy)).toHaveProperty('note', 1);
            await receivePromise(n1, beatMsg);
            expect(lastValue(spy)).toHaveProperty('note', 2);
            await receivePromise(n1, beatMsg);
            expect(lastValue(spy)).toHaveProperty('note', 4);
            done();
        });
    });
});
