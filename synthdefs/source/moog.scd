
(
SynthDef("moog", {
	| out_bus = 0, pan = 0, note = 60, amp = 0.5, sustain = 1, cutoff = 1000, gain = 2.0, latt = 0.001, dec = 0.3, sus = 0.9, rel = 0.2, chorus = 0.7 |
	var freq= midicps(note.clip(0,128));
	var osc, filter, env, filterenv, snd, chorusfx, playTime;

	playTime =sustain;

	osc = Mix(VarSaw.ar(
		freq: freq* [1.0, 1.001, 2.0],
		iphase: Rand(0.0,1.0) ! 3,
		width: Rand(0.5,0.75) ! 3,
		mul: 0.5));

	filterenv = EnvGen.ar(Env.linen(0.2, playTime-0.4, 0.2));

	filter =  MoogFF.ar(
		in: osc,
		freq: cutoff * (1.0 + (0.5 * filterenv)),
		gain: gain);

	env = EnvGen.ar(
		envelope: Env.linen(0.001, playTime, 0.2),
		doneAction: 2);

	snd = (0.7 * filter + (0.3 * filter.distort)) * env;

	chorusfx = Mix.fill(7, {

		var maxdelaytime = rrand(0.005, 0.02);
		DelayC.ar(
			in: snd,
			maxdelaytime: maxdelaytime,
			delaytime: LFNoise1.kr(
				freq: Rand(4.5, 10.5),
				mul: 0.25 * maxdelaytime,
				add: 0.75 * maxdelaytime)
		)
	});

	snd = (snd + (chorusfx * chorus)) * amp ;

	Out.ar(out_bus, Pan2.ar(snd, pan));

}).store;
)
