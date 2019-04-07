(
SynthDef("marimba", {|note = 80, amp = 0.5, out_bus = 0, pan = 0|
	var snd, env, env2;
	var freq = midicps(note.clip(0,128));
	env = EnvGen.ar(Env.linen(0.015, 1, 0.5, amp*300), doneAction:2);
	env2 = EnvGen.ar(Env.perc(0.015, 1, level:4), doneAction:2);
	snd = BPF.ar(env2, freq, 0.02);
	snd = BLowShelf.ar(snd, 220, 0.81, 6);
	snd = snd * env;
	Out.ar(out_bus, Splay.ar(snd, spread: 0.2, center: pan));
}).store;
)