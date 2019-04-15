(
SynthDef("playSampleMono", {
	|buffer, out_bus = 0, amp = 0.5, note = 60, midibase = 60, startPos = 0, pan = 0, sustain = 1, dec = 0.1|
	var snd, rate, env;
	rate = midicps(note.clip(0, 128)) / midicps(midibase.clip(0, 128));
	snd = PlayBuf.ar(1, buffer, rate, startPos: startPos, doneAction:2)!2;
	env = EnvGen.ar(
		envelope: Env.linen(0, sustain, dec),
		doneAction: 2);
	Out.ar(out_bus, Splay.ar(amp*snd*env, spread: 1, center: pan))
}).store;
)
