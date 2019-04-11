(
SynthDef("reverb", { |out_bus = 0, inBus, pan = 0, room = 0.5, damp = 0.5|
	var input, reverbed;
	input = In.ar(inBus, 2);
	reverbed = FreeVerb.ar(input, room:room, damp:damp);
	Out.ar(out_bus, Splay.ar(reverbed, spread: 0.5, center: 0, levelComp: true))
	}).store;
)

