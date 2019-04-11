(
SynthDef("delay", {| out_bus = 0, inBus, bpm = 100, beats = 1, decaybeats = 100|
	var input, delayed, time;
	time = beats*60/bpm;

	input = In.ar(inBus, 2);

	delayed = CombN.ar(input, time, time, time*decaybeats);
	Out.ar(out_bus, input);
	Out.ar(out_bus, delayed);

}).store;
)
