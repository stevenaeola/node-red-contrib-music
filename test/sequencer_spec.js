// const sinon = require('sinon');
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

    it('should be loaded', function (done) {
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

    // it('should send first beat unchanged when first length is 1 and bar is started', function (done) {
    //     let flow = sequencerBase;
    //     helper.load(sequencerNode, flow, function () {
    //         const n1 = helper.getNode("n1");
    //         const n2 = helper.getNode("n2");
    //         const spy = sinon.spy();
    //         const injectMsg = { "payload": "tick", "start": ["beat", "bar"] };
    //         n2.on("input", function (msg) {
    //             try {
    //                 spy(injectMsg);
    //                 done();
    //             } catch (err) {
    //                 done(err);
    //             }
    //         });
    //         n1.receive(injectMsg);
    //     });
    // });
});
