(
SynthDef("BPF", {| out_bus = 0, inBus, note = 60, rq = 1|
	var input, filtered;
	var freq = midicps(note.clip(0,128));
	input = In.ar(inBus, 2);

	filtered = BPF.ar(input, Lag.kr(freq,0.1), rq);
	Out.ar(out_bus, filtered);
}).store;
)