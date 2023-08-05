(
SynthDef("soundIn", {
	| out_bus = 0, in_bus=0, amp = 0.5, pan = 0 |
    var in;
	in = SoundIn.ar(in_bus);
	Out.ar(out_bus, Pan2.ar(amp*in, pan))
}).store
)