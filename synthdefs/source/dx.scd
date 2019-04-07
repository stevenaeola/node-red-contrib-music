
// FROM github.com/brunoruviaro/SynthDefs-for-Patterns/

(
SynthDef("dx", {arg out_bus = 0, note = 20, numharm = 10, attack = 0.01, rel = 1, amp = 0.5, pan = 0;
	var snd, env;
	var freq = midicps(note.clip(0,128));
	env = EnvGen.ar(Env.perc(attack, rel, amp), doneAction: 2);
	snd = LeakDC.ar(Mix(Blip.ar([freq, freq*1.01], numharm, env)));
	Out.ar(out_bus, Pan2.ar(snd, pan));
}).store;
)
