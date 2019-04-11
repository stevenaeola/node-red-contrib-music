(
SynthDef("HPF", {| out_bus = 0, inBus, note = 60|
	var input, filtered;
	var freq = midicps(note.clip(0,128));
	input = In.ar(inBus, 2);


	filtered = HPF.ar(input, Lag.kr(freq,0.1));
	Out.ar(out_bus, filtered);
}).store;
)