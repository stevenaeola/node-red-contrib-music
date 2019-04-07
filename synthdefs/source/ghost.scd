(
SynthDef("ghost",
	{|amp = 0.5, out_bus = 0, note = 40, sustain = 1, resonance=70, pan = 0|

		var noise=WhiteNoise.ar(mul:amp);
		var freq = midicps(note.clip(0,128));
		var playTime = sustain;

		var env = EnvGen.ar(
		envelope: Env.linen(0.05, playTime, 0.25),
		doneAction: 2);

		Out.ar(out_bus,
			Pan2.ar(env *RLPF.ar(noise, freq, 2.pow(-1.0*resonance/10.0)), pan))
}).store
)

