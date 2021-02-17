(
SynthDef.new(\vsti, { arg out = 0;
    // VST instruments usually don't have inputs
    Out.ar(out, VSTPlugin.ar(nil, 2));
}).add;
)

VSTPlugin.search;

(
~vsti = VSTPluginController(Synth(\vsti));
)

(
~vsti.open("LABS.vst3", editor: true, verbose: true);
)



~vsti.midi.noteOn(0, note: 100);

~vsti.midi.noteOff(0);


~vsti.browse;

(
p = Pbind(
    \type, \vst_midi,
    \vst, ~vsti, // the VSTPluginController instance
    \midicmd, \noteOn, // the default, can be omitted
    \chan, 0, // MIDI channel (default: 0)
    \midinote, Pseq(#[0, 2, 4, 7], inf) + Pwhite(-12, 12).stutter(Pwhite(4, 16)) + 60,
    \dur, Prand(#[0.125, 0.25, 0.5], inf),
    \legato, Pexprand(0.5, 1.0, inf),
    \amp, Pexprand(0.5, 1.0, inf)
).play(quant: 1);
)

~vsti.program_(2);

~vsti.info.printPresets
