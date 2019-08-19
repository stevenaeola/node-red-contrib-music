(
SynthDef("recordSampleStereo", {
	| buffer, recLevel=1, preLevel=1 |
    var in;
	in = SoundIn.ar([0,1]);
    RecordBuf.ar(in, buffer,
		recLevel: recLevel,
		preLevel: preLevel,
		loop:0,
                doneAction: 2);
}).store
)