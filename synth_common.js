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

module.exports = { volume2amp };
