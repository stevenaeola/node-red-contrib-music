// commonly used functions, imported by synth.js, soundfx.js, looper.js

const fs = require('fs');
const glob = require('glob');
const path = require('path');

function freeSynth (node, synthID, timeTag) {
  let freeMsg;
  const address = '/n_free';
  const payload = synthID;

  if (synthID) {
    if (timeTag) {
      freeMsg = {
        payload: {
          timeTag: timeTag,
          packets: [
            {
              address,
              args: payload
            }
          ]
        }
      };
    } else {
      freeMsg = {
        topic: address,
        payload
      };
    }
    node.send(freeMsg);
  }
}

function sendSynthDef (node) {
    let synthdefPath = path.join(__dirname, 'synthdefs', 'compiled');
    if (node.tags.includes('sonic-pi')) {
        synthdefPath = path.join(synthdefPath, 'sonic-pi');
    }

    const synthdefFile = path.join(synthdefPath, node.synthdefName + '.scsyndef');

    fs.readFile(synthdefFile, function (err, data) {
        if (err) {
            node.warn(' problem sending file for ' + node.synthtype);
            node.warn(err);
        } else {
            const synthMsg = {
                topic: '/d_recv',
                payload: [data, 0]
            };
            node.send(synthMsg);
        }
    });
}

function createBuffer (node) {
  if (!node.bufnum) {
    const global = node.context().global;
    var bufnum = Number(global.get('sampler_next_bufnum'));
    if (isNaN(bufnum)) {
      bufnum = 1; // hopefully no clashes with sclang
    }
    global.set('sampler_next_bufnum', bufnum + 1);
    node.bufnum = bufnum;
  }
  const fps = 44100;
  if (node.synthtype) {
    loadBuffer(node);
  } else {
    // create an empty buffer ready for recording
    const seconds = 20; // assumed max length for now
    const createMsg = {
      topic: '/b_alloc',
      payload: [node.bufnum, fps * seconds * 2, 2]
    };
    node.send(createMsg);
  }
}

function freeBuffer (node) {
  if (node.bufnum) {
    var freeMsg = {
      topic: '/b_free',
      payload: node.bufnum
    };
    node.send(freeMsg);
  }
}

function loadBuffer (node) {
    /* glob uses forward slashes even in Windows */
  var sampdir = '/samples';
  var matches = [];
  matches.push(sampdir + '/Dirt/' + node.synthtype + '/*.wav');
  matches.push(sampdir + '/SonicPi/' + node.synthtype + '.flac');
  matches.push(sampdir + '/Freesound/' + node.synthtype + '.wav');

  for (let match of matches) {
      glob(match, { nocase: true, root: __dirname }, function (er, files) {
      var fname;
      fname = files[0];
      if (fname) {
        // create and load the buffer from file
        var createMsg = {
          topic: '/b_allocRead',
          payload: [node.bufnum, fname]
        };
        node.send(createMsg);
      }
    });
  }
}

// exponential scale with 0->0 and 100->1
function volume2amp (node) {
    let volume = Math.max(0, node.volume);

    const globalVolume = node.context().global.get('volume');
    if (globalVolume !== null && globalVolume >= 0) {
        volume = volume * globalVolume / 100;
    }

    const base = 1.02;
    return (Math.pow(base, volume) - 1) / (Math.pow(base, 100) - 1);
}

module.exports = { createBuffer,
                   freeBuffer,
                   freeSynth,
                   loadBuffer,
                   sendSynthDef,
                   volume2amp };
