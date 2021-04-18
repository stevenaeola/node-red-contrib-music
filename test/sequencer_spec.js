const helper = require('node-red-node-test-helper');
const sequencerNode = require('../sequencer.js');

helper.init(require.resolve('node-red'));

describe('sequencer Node', function () {
    let sequencerBase;

    beforeEach(function (done) {
        helper.startServer(done);
        sequencerBase =
        [{
            'id': 'n1',
            'type': 'sequencer',
            'name': 'sequencer',
            'input': 'beat',
            'notesrand': false,
            'rhythm': '[3,1]',
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
    });

    afterEach(function (done) {
        helper.unload();
        helper.stopServer(done);
    });

    test('should be loaded', function (done) {
        let flow = sequencerBase;
        helper.load(sequencerNode, flow, function () {
            const n1 = helper.getNode('n1');
            try {
                n1.should.have.property('name', 'sequencer');
                done();
              } catch (err) {
                done(err);
              }
        });
    });

    // it('should send first beat when first length is 1 and bar is started', function (done) {
    //     let flow = sequencerBase;
    //     helper.load(sequencerNode, flow, function () {
    //         const n1 = helper.getNode('n1');
    //         const n2 = helper.getNode('n2');
    //         const spy = sinon.spy();
    //         const injectMsg = { 'payload': 'tick', 'start': ['beat', 'bar'] };
    //         n2.on('input', function (msg) {
    //             try {
    //                 spy(msg);
    //             } catch (err) {
    //                 done(err);
    //             }
    //         });
    //         spy.should.not.have.been.called;
    //         n1.receive(injectMsg);
    //         spy.should.have.been.called;
    //         done();
    //     });
    // });

    // it('should not send beat when start event (bar) has not happened', function (done) {
    //     let flow = sequencerBase;
    //     helper.load(sequencerNode, flow, function () {
    //         const n1 = helper.getNode('n1');
    //         const n2 = helper.getNode('n2');
    //         const spy = sinon.spy();
    //         const injectMsg = { 'payload': 'tick', 'start': ['beat'] };
    //         n2.on('input', function (msg) {
    //             try {
    //                 spy(msg);
    //             } catch (err) {
    //                 done(err);
    //             }
    //         });
    //         n1.receive(injectMsg);
    //         spy.should.not.have.been.called;
    //         done();
    //     });
    // });

    // it('should follow pattern from start event', function (done) {
    //     let flow = sequencerBase;
    //     helper.load(sequencerNode, flow, function () {
    //         const n1 = helper.getNode('n1');
    //         const n2 = helper.getNode('n2');
    //         const spy = sinon.spy();
    //         const injectMsg1 = { 'payload': 'tick', 'start': ['beat', 'bar'] };
    //         const injectMsg2 = { 'payload': 'tick', 'start': ['bar'] };
    //         n2.on('input', function (msg) {
    //             try {
    //                 spy(msg);
    //             } catch (err) {
    //                 done(err);
    //             }
    //         });
    //         n1.receive(injectMsg1);
    //         spy.should.have.been.calledTwice;
    //         n1.receive(injectMsg2);
    //         spy.should.have.been.calledTwice;
    //         n1.receive(injectMsg2);
    //         spy.should.have.been.calledTwice;
    //         done();
    //     });
    // });
});
