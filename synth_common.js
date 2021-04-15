// commonly used functions, imported by synth.js, soundfx.js, looper.js

// exponential scale with 0->0 and 100->1
function volume2amp (node) {
    let volume = Math.max(0, node.volume);

    const globalVolume = node.context().flow.get('volume') || node.context().global.get('volume');
    if (globalVolume !== null && globalVolume >= 0) {
        volume = volume * globalVolume / 100;
    }

    const base = 1.02;
    return (Math.pow(base, volume) - 1) / (Math.pow(base, 100) - 1);
}

// -1, 0 and 1 are all the same, distance 0.
// The fifth of the scale (note 5) is +4 from root
// Negative notes give negative numbers
function distanceFromRoot (note) {
    if (Math.abs(note) <= 1) {
        return 0;
    }
    return Math.sign(note) * (Math.abs(note) - 1);
}

// positive intervals go up, negative intervals go down
// but an interval of 1 is no gap at all
// so intervals of -1, 0 and 0 are all the same
function transpose (note, interval) {
    let offset = distanceFromRoot(interval);
    let transposed = note;

    if (offset !== 0) {
        transposed = distanceFromRoot(note);
        transposed += offset;
        transposed = Math.sign(transposed) * (Math.abs(transposed) + 1);
    }
    return transposed;
}

module.exports = { volume2amp, transpose };
