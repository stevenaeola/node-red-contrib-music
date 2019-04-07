
// bell
(
SynthDef("bell",
{
		|out_bus = 0, note = 40, amp = 0.5, pan = 0|
// Klank - bank of resonators excited by impulses
		var p, z, panned, env;
		var freq = midicps(note.clip(0,128));
		var freqs = [ freq,
			freq*1.81*Rand(1,1.01),
			freq*2.73*Rand(1,1.01),
			freq*4.03*Rand(1,1.01),
			freq*5.69*Rand(1,1.01),
			freq*6.48*Rand(1,1.01) ];
		// see "http://scitation.aip.org/confst/ASA/data/1/4pMU4.pdf" for harmonic specs
		z = `[	// filter bank specification :
			freqs,	// frequencies
			Array.fill(6, { arg i; 1/(6+i) }), 			// amplitudes
			Array.geom(6, 1500/freq, 0.75)		// ring times
			];
		env = Env([0,1,0], [0.002,0.02]);
		panned = Pan2.ar(
			Klank.ar(z, BrownNoise.ar(mul: amp*0.25)*EnvGen.ar(env, 1, doneAction:0)), pan
		);
		DetectSilence.ar(panned, doneAction:2);
		Out.ar(out_bus, panned);
	}
).store
)

