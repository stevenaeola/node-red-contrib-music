(
SynthDef("drop", {| out_bus = 0,  inBus, t_trig = 0, attack = 0.01, bpm = 100, beats =1 |
	var input, filtered, env, release;
	input = In.ar(inBus,2);
	release = beats*60/100;
	env = EnvGen.kr(Env.perc(0.1, release, 2000, -1), t_trig, 2, 10);

	filtered = HPF.ar(input, env);

	Out.ar(out_bus, filtered);
}).store;
)