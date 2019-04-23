(
SynthDef("distortion", {| out_bus = 0, inBus, preGain = 2, postGain = 2, amp =1 |
	var input, distorted;
	input = In.ar(inBus, 2);

	distorted = (((input*preGain).distort* postGain).distort) * amp;
	Out.ar(out_bus, distorted);
}).store;
)