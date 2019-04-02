const sc = require('./supercollider');

module.exports = function (RED) {
  'use strict';

  const _ = require('underscore');

  const configurables =
      { root: { 'default': 'C4' },
        scale: { 'default': 'minor' },
        volume: { 'default': 50 },
        octave: { 'default': 0 },
        synthtype: { 'default': 'kick' },
        key: { 'default': 'C minor' },
        degree: { 'default': 'I' }
      };

  // exponential scale with 0->0 and 100->1
  function volume2amp (volume) {
    volume = Math.max(0, volume);
    const base = 1.02;
    return (Math.pow(base, volume) - 1) / (Math.pow(base, 100) - 1);
  }

  function freeSynths (node) {
    const global = node.context().global;
    const toDelete = global.get('synth_delete_sc') || [];
    for (var i = 0; i < toDelete.length; i++) {
      sc.freeSynth(node, toDelete[i]);
    }
    global.set('synth_delete_sc', []);
  }

  function deleteSynth (node, synthID) {
    const global = node.context().global;
    const toDelete = global.get('synth_delete_sc') || [];
    toDelete.push(synthID);
    global.set('synth_delete_sc', toDelete);
  }

  function SynthNode (config) {
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
        node.parameters[synthcontrol] = controlval;
        setSynthParam(synthcontrol, controlval);
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
          for (var conf in configurables) {
            configure(conf, config[conf]);
          }
          reset();
          // just this once the reset message is not propagated
          break;

        case 'stop':
          handleStopSynth();
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
      handleCloseSynth();
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

    function handleStopSynth () {
      for (var voice = 0; voice < node.voices; voice++) {
        var stopMsg = { topic: '/n_set',
                       payload:
                       [node.synthIDs[voice], 'gate', 0]
                      };
        node.send(stopMsg);
      }
    }

    function handleCloseSynth () {
      // mark for deletion: the actual freeing takes place when the new one is deployed,
      // so that we can be sure all the wires are in place to connect to server via OSC
      for (var voice = 0; voice < node.voices; voice++) {
        if (node.synthIDs[voice]) {
          deleteSynth(node, node.synthIDs[voice]);
          node.synthIDs[voice] = null;
        }
      }
    }

    function sendNote (noteVal, msg) {
      var midi;
      if (isNaN(msg.midi)) {
        if (isNaN(noteVal)) {
          noteVal = 1;
        }
        midi = note2midi(noteVal);
      } else {
        midi = msg.midi;
      }
      var payload;
      var action;
      var synthID;

      var amp = volume2amp(node.volume);

      if (node.voices > 0) {
        action = '/n_set';
        synthID = node.synthIDs[node.next_voice];
        payload = [synthID];
        if (midi === -1) {
          payload.push('gate', 0);
        } else {
          payload.push('gate', 1);
        }
      } else {
        action = '/s_new';
        synthID = -1;

        var synthname;
        if (isSynth()) {
          synthname = node.synthtype;
        } else {
          synthname = 'playSampleMono';
        }

        // add it to the head of the root group
        payload = [synthname, -1, 0, 0, 'amp', amp];

        if (!isSynth()) {
          if (!node.bufnum) {
            sc.createBuffer(node);
          }
          payload.push('buffer', node.bufnum);
          const midibase = node.synthtypes[node.synthtype].midibase;
          if (midibase) {
            payload.push('midibase', midibase);
          }
        }
      }

      if (midi) {
        payload.push('midi', midi);
      }

      for (var param in node.parameters) {
        payload.push(param);
        payload.push(node.parameters[param]);
      }

      const bpm = msg.bpm || node.context().global.get('bpm');

      if (msg.beats) {
        payload.push('beats');
        payload.push(msg.beats);
        if (bpm) {
          payload.push('bpm', bpm);
        }
      }

      let playmsg;
      if (msg.timeTag) {
        playmsg = {
          payload: {
            timeTag: msg.timeTag,
            packets: [
              {
                address: action,
                args: payload
              }
            ]
          },
          bpm: bpm  // this one is to be picked up by any fx on the way
        };
      } else {
        playmsg = {
          topic: action,
          payload: payload,
          bpm: bpm
        };
      }

      // avoid problems with DetectSilence leaving zombie synths at amp 0
      if (amp > 0 && (!midi || midi >= 0 || node.voices > 0)) {
        node.send(playmsg);
      }

      node.next_voice++;
      if (node.next_voice >= node.voices) {
        node.next_voice = 0;
      }
    }

    function setSynthParam (param, val) {
      for (var voice = 0; voice < node.voices; voice++) {
        var volmsg = {
          'topic': '/n_set',
          'payload': [node.synthIDs[voice], param, val]
        };
        node.send(volmsg);
      }
    }

    function setSynthVolume () {
      setSynthParam('amp', volume2amp(node.volume));
    }

    function createSynth () {
      freeSynths(node);
      sc.sendSynthDef(node, node.synthtype);

      // leave some time for the synthdef to be sent
      // check for sustained synths: should do this by seeing if they've got a gate parameter
      if (node.voices > 0) {
        setTimeout(function () {
          const global = node.context().global;
          for (var voice = 0; voice < node.voices; voice++) {
            const id = Number(global.get('synth_next_sc_node'));
            if (isNaN(id)) {
              id = 100000; // high to avoid nodes from sclang
            }
            global.set('synth_next_sc_node', id + 1);
            node.synthIDs[voice] = id;

            // add it to the head of the root group
            const createMsg = {
              topic: '/s_new',
              payload: [node.synthtype, node.synthIDs[voice], 0, 0, 'out', node.outBus]
            };
            node.send(createMsg);
          }
          setSynthVolume();
        }, 200);
      }
    }

    function reset () {
      freeSynths(node);
      node.synthtypes = config.synthtypes;
      node.tuned = config.tuned;

      if (isSynth()) {
        resetSynth();
      } else {
        resetSample();
      }

      node.parameters = {};
    }

    function resetSynth () {
      node.next_voice = 0;
      node.outBus = Number(config.outBus) || 0;

      if (isSustained()) {
        node.voices = 1;
      } else {
        node.voices = 0;
      }

      node.synthIDs = Array(node.voices);

      // wait a little while to allow wires to be created
      setTimeout(function () {
        createSynth();
      }, 200);
    }

    function resetSample () {
      setTimeout(function () {
        sc.freeBuffer(node);
        sc.createBuffer(node);
        sc.sendSynthDef(node, 'playSampleMono');
      }, 200);
    }

    function isSynth () {
      if (node.synthtypes[node.synthtype] && node.synthtypes[node.synthtype].synth) {
        return true;
      }
    }

    function isTuned () {
      return node.synthtypes[node.synthtype] && node.synthtypes[node.synthtype].tuned;
    }

    function isSustained () {
      return node.synthtypes[node.synthtype] && node.synthtypes[node.synthtype].sustained;
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
        chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
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

        setSynthVolume();
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

  function SoundFXNode (config) {
    RED.nodes.createNode(this, config);
    const node = this;

    reset();

    this.on('input', function (msg) {

      if (msg.topic && msg.topic.startsWith('fxcontrol:')) {
        const fxcontrol = msg.topic.substring(10);
        const controlval = Number(msg.payload);
        node.parameters[fxcontrol] = controlval;
        setFXParam(fxcontrol, controlval);
        return;
      }

      switch (msg.topic) {
      case 'volume':
        var newVol = Number(msg.payload);
        if (!Number.isNaN(newVol)) {
          node.volume = newVol;
        }
        // 100 should be neutral volume, not max

        setFXParam('amp', volume2amp(node.volume));

        break;

        // receiving a play message from a synth
      case '/s_new':
        msg.payload.push('out', node.inBus);
        
        setFXbpm(msg);
        
        node.send(msg);
        break;

      default:
        if (msg.payload.timeTag) {
          let args = msg.payload.packets[0].args;
          if (Array.isArray(args)) {
            args.push('out', node.inBus);
          }
          
          setFXbpm(msg);
          
          node.send(msg);
          return;
        }
        if (msg.payload === 'reset') {
          reset();
          // just this once the reset message is not propagated
          return;
        }

        //              setFXParam(msg.topic, msg.payload);
        node.send(msg);
      }
    });

    this.on('close', function () {
      deleteSynth(node, node.synthID);
      node.synthID = null;
    });

    function setFXParam (param, val) {
      const parammsg = {
        'topic': '/n_set',
        'payload': [node.synthID, param, val]
      };
      node.send(parammsg);
    }

    function setFXbpm(msg) {
      const bpm = msg.bpm;

      if (bpm) {
        setFXParam('bpm', bpm);
      }
    }
    
    function createFX () {
      sc.sendSynthDef(node, node.fxtype);
      // leave some time for the synthdef to be sent

      setTimeout(function () {
        sc.freeSynth(node, node.synthID);

        // add it to the tail of the root group
        const createMsg = {
          topic: '/s_new',
          payload: [node.fxtype, node.synthID, 1, 0, 'inBus', node.inBus]
        };
        node.send(createMsg);

        setFXParam('amp', volume2amp(node.volume));
      }, 200);
    }

    function reset () {
      node.fxtype = config.fxtype || 'reverb';
      node.name = config.name || node.fxtype;
      node.inBus = config.fxtypes[node.fxtype].inBus;
      node.outBus = Number(config.outBus) || 0;
      // fix the synthID according to the fxtype (via inBus number)
      // means we can only have one fx node per fx type
      // ... which is deliberate
      node.synthID = 100000 - node.inBus / 2;
      node.volume = 100;

      node.parameters = {};
      // wait a little while to allow wires to be created
      setTimeout(function () {
        createFX();
      }, 200);
    }
  }

  RED.nodes.registerType('synth', SynthNode);
  RED.nodes.registerType('soundfx', SoundFXNode);
};
