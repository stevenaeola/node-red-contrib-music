// Crotale adapted from SuperCollider book p24
(
SynthDef("crotale", {
| note = 60, tone = 3, art = 1, amp = 0.5, pan = 0, out_bus = 0|
var env, out, mod, freq;

	freq = midicps(note.clip(0,128));
	env = Env.perc(0, art);
	mod = 5 + (1/IRand(2, 6));

	out = PMOsc.ar(freq, mod*freq,
		pmindex: EnvGen.kr(env, timeScale: art, levelScale: tone, doneAction:2),
		mul: EnvGen.kr(env, timeScale: art, levelScale: 0.3, doneAction:2));

	out = Pan2.ar(out, pan);

	out = out * amp*1.5 * EnvGen.kr(env,  timeScale: 1.3*art,
		levelScale: Rand(0.1, 0.5), doneAction:2);
	Out.ar(out_bus, out); //Out.ar(bus, out);

}).store;
)
