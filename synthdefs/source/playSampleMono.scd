(
SynthDef("playSampleMono", {
	|buffer, out_bus = 0, amp = 0.5, note = 60, midibase = 60, startPos = 0, pan = 0|
	var snd, rate;
	rate = midicps(note.clip(0, 128)) / midicps(midibase.clip(0, 128));
	snd = PlayBuf.ar(1, buffer, rate, startPos: startPos, doneAction:2)!2;
	Out.ar(out_bus, Splay.ar(amp*snd, spread: 0.2, center: pan))
}).store;
)
