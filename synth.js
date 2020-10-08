const sc = require('././synth_common');
const _ = require('underscore');

// prefix for served GET requests
const synthtypesURL = 'node-red-contrib-music/synthtypes';

let synthtypes = require('./synthtypes');
for (let synthtype in synthtypes) {
    let synthcontrols = synthtypes[synthtype].synthcontrols || {};
    synthcontrols.pan = { 'description': 'position in stereo field: left (-1) or right (1)', 'min': -1, 'max': 1, 'default': 0 };
    synthtypes[synthtype].synthcontrols = synthcontrols;
}

module.exports = function (RED) {
    'use strict';

    RED.httpAdmin.get('/' + synthtypesURL, function (req, res) {
        // so we can edit syntypes.json without having to restart the server
        synthtypes = require('./synthtypes');
        res.json(synthtypes);
    });

    function SynthNode (config) {
        const configurables =
        {
            root: { 'default': 'C4' },
            scale: { 'default': 'minor' },
            volume: { 'default': 50 },
            octave: { 'default': 0 },
            synthtype: { 'default': 'kick' },
            key: { 'default': 'C minor' },
            degree: { 'default': 'I' }
        };

        RED.nodes.createNode(this, config);
        const node = this;

        for (let conf in configurables) {
            configure(conf, config[conf]);
        }

        reset();

        this.on('input', function (msg) {
            if (msg.topic && msg.topic.startsWith('synthcontrol:')) {
                const synthcontrol = msg.topic.substring(13);
                const controlval = Number(msg.payload);
                setSynthcontrol(synthcontrol, controlval);
                return;
            }

            switch (msg.topic) {
                default:
                    switch (msg.payload) {
                        case 'tick':
                            configureTick(msg);
                            handleTickSynth(msg);
                            break;

                        case 'reset':
                            for (let conf in configurables) {
                                configure(conf, config[conf]);
                            }
                            reset();
                            // just this once the reset message is not propagated
                            break;

                        case 'stop':
                            // nothing to do
                            break;

                        case 'start':
                            // nothing to do
                            break;

                        default:
                            configureMsg(msg);
                    }
            }
        });

        this.on('close', function () {
            // nothing to do
        });

        function handleTickSynth (msg) {
            if (Array.isArray(msg.note)) {
                msg.note.forEach(function (noteVal) {
                    sendNote(noteVal, msg);
                });
            } else {
                sendNote(msg.note, msg);
            }
        }

        function sendNote (noteVal, msg) {
            let midi;
            if (isNaN(msg.midi)) {
                if (isNaN(noteVal)) {
                    noteVal = 1;
                }
                midi = note2midi(noteVal);
            } else {
                midi = msg.midi;
            }

            const amp = sc.volume2amp(node);
            let details = { amp };

            if (midi) {
                Object.assign(details, { midi });
            }

            const bpm = msg.bpm || node.context().global.get('bpm');
            if (msg.beats) {
                details.beats = msg.beats;
                if (bpm) {
                    // set release to 0.25 beats
                    let release = 0.25 * 60 / bpm;
                    // tried subtracting release time but it seemed to leave gaps
                    let sustain = msg.beats * 60 / bpm;
                    Object.assign(details, { bpm, sustain, release });
                }
            }

            for (let p in node.parameters) {
                details[p] = node.parameters[p];
            }

            let noteMsg = {
                payload: 'tick',
                details,
                synthtype: node.synthtype
            };

            if (msg.timeTag) {
                noteMsg.timeTag = msg.timeTag;
            }

            // from v2.0 all synth instructions area sent this way
            node.send(noteMsg);
        }

        function setSynthcontrol (synthcontrol, value) {
            let synthcontrolSpecs = synthtypes[node.synthtype].synthcontrols || {};
            // all synths allow pan at least
            synthcontrolSpecs.pan = { 'note': { 'description': 'position in stereo field: left (-1) or right (1)', 'min': -1, 'max': 1, 'default': 0 } };
            if (!synthtypes[node.synthtype].synthcontrols[synthcontrol]) {
                node.warn('No such synthcontrol: ' + synthcontrol);
                return;
            }
            node.parameters[synthcontrol] = Number(value);
        }

        function reset () {
            node.tuned = config.tuned;
            node.parameters = node.parameters || {};
            if (config.synthcontrols) {
                for (let synthcontrol in config.synthcontrols) {
                    setSynthcontrol(synthcontrol, config.synthcontrols[synthcontrol]);
                }
            }
            setTimeout(() => {
                node.send({ topic: 'synthtype', payload: node.synthtype });
            }, 200);
        }

        function isTuned () {
            return synthtypes[node.synthtype] && synthtypes[node.synthtype].tuned;
        }

        // turn note number (degree of scale) into midi
        function note2midi (note) {
            if (Array.isArray(note)) {
                return _.map(note, note2midi);
            }

            if (!isTuned()) {
                return;
            }

            if (note === null) {
                return -1;
            }

            const global = node.context().global;

            var root = node.root;

            var scale = node.scale;

            var degree = node.degree;
            var globalkey = global.get('key');
            var globalroot;
            var globalscale;
            if (typeof globalkey === 'string') {
                var bits = globalkey.split(' ');
                globalroot = bits.shift();
                globalscale = bits.shift();
            }

            if (root === '') {
                root = global.get('root') || globalroot ||
                    configurables.root['default'];
            }

            if (scale === '') {
                scale = global.get('scale') || globalscale ||
                    configurables.scale['default'];
            }

            if (degree === '') {
                degree = global.get('degree') || configurables.degree['default'];
            }

            /*
              node.warn("degree " + degree);
              node.warn("scale " + scale);
              node.warn("root " + root);
            */

            // turn the degree into an offset

            const roman = {
                I: 1,
                II: 2,
                III: 3,
                IV: 4,
                V: 5,
                VI: 6,
                VII: 7,
                VIII: 8
            };

            var noteoffset = 0;
            if (_.isString(degree) && roman[degree.toUpperCase()]) {
                noteoffset = roman[degree.toUpperCase()] - 1;
            }

            var midiroot;

            if (isNaN(root)) {
                const name2midi = {
                    C: 60,
                    D: 62,
                    E: 64,
                    F: 65,
                    G: 67,
                    A: 69,
                    B: 71
                };

                var rootbits = root.toUpperCase().split('');
                var base = rootbits.shift();
                midiroot = name2midi[base];
                if (midiroot === undefined) {
                    node.warn('Scale root should be a midi number or start with a letter A-G');
                    return;
                }
                var next = rootbits.shift();
                if (next === '#' || next === 's') {
                    midiroot++;
                } else if (next === 'b') {
                    midiroot--;
                } else if (next !== undefined) {
                    rootbits.unshift(next);
                }
                if (rootbits.length > 0) {
                    var octave = Number(rootbits.join(''));
                    if (!isNaN(octave)) {
                        midiroot += (octave - 4) * 12;
                    }
                }
            } else {
                if (root < 0 && root > 127) {
                    node.warn('Scale root must be in range 0-127');
                    return;
                }
                midiroot = root;
            }

            note += noteoffset;

            const intervals = {
                minor: [0, 2, 3, 5, 7, 8, 10, 12],
                major: [0, 2, 4, 5, 7, 9, 11, 12],
                dorian: [0, 2, 3, 5, 7, 9, 10, 12],
                mixolydian: [0, 2, 4, 5, 7, 9, 10, 12],
                'major pentatonic': [0, 2, 4, 7, 9, 12],
                'minor pentatonic': [0, 3, 5, 7, 10, 12],
                blues: [0, 3, 5, 6, 7, 10, 12],
                chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
                'whole tone': [0, 2, 4, 6, 8, 10, 12],
                'octatonic': [0, 2, 3, 5, 6, 8, 9, 11, 12]
            };

            if (!intervals[scale]) {
                node.warn('Unrecognised scale: ' + scale);
                scale = configurables.scale['default'];
                node.warn('Using: ' + scale);
            }
            var offsets = intervals[scale];
            var midi = midiroot;

            // work out notes above the offset values by shifting up an octave
            while (note > offsets.length) {
                note -= offsets.length - 1;
                midi += offsets[offsets.length - 1];
            }

            // work out notes below the offset values by shifting down an octave
            // notes 0 and -1 are the same as +1

            if (note === 0 || note === -1) {
                note = 1;
            }

            var negative = false;
            while (note < 0) {
                negative = true;
                note += offsets.length - 1;
                midi -= offsets[offsets.length - 1];
            }

            midi += node.octave * 12;

            if (negative) {
                midi += offsets[note + 1];
            } else {
                midi += offsets[note - 1];
            }

            return midi;
        }

        function configureTick (msg) {
            for (var configurable in configurables) {
                var val = msg[configurable];
                if (val != null) {
                    configure(configurable, val);
                }
            }
        }

        function configureMsg (msg) {
            for (var configurable in configurables) {
                if (msg.topic === configurable) {
                    configure(configurable, msg.payload);
                }
            }
        }

        function configure (config, val) {
            if (!Object.keys(configurables).includes(config)) {
                node.warn(config + ' is not configurable');
                return;
            }

            var def = configurables[config].default;

            switch (config) {
                case 'volume':
                    var newVol = Number(val);
                    if (Number.isNaN(newVol)) {
                        if (Number.isNaN(node.volume)) {
                            node.volume = def;
                        }
                    } else {
                        node.volume = newVol;
                    }

                    node.volume = Math.min(100, Math.max(0, node.volume));

                    break;

                case 'key':
                    if (val) {
                        var bits = val.split(' ');
                        configure('root', bits.shift());
                        configure('scale', bits.shift());
                    }
                    break;

                case 'synthtype':
                    node[config] = val;
                    reset();
                    break;

                default:
                    node[config] = val;
            }
        }
    }

    RED.nodes.registerType('synth', SynthNode);
};
