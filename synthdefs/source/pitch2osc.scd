
{SoundIn.ar(0)}.scope

c = Bus.control(s,1);

n = NetAddr("127.0.0.1", 3000);
(
SynthDef(\busCopy, {|bus|
	var x = SoundIn.ar(0);
	Out.kr(bus, Pitch.kr(x,ampThreshold: 0.02, median: 7, minFreq: 30));


}).add;
)
(
r = Routine({
	inf.do({
		var val = c.getSynchronous;
		n.sendMsg(\pitch, cpsmidi(val));
		0.5.wait;
	});
});
)


b = Synth(\busCopy, [\bus, c]);
r.play;

Platform.userExtensionDir;