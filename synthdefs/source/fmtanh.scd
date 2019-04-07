
(
SynthDef("fmtanh",
	{|out_bus = 0, amp = 0.5, note = 60, sustain = 1, dist = 10, pan =0 |
		var n = 4;
		var freq = midicps(note.clip(0,128));
		var detune = 0.01;
		var baseFreq = Array.fill(n, {|i| freq*LFNoise2.ar(5,mul:detune, add:1)});
		var playTime = sustain;

		var env = EnvGen.ar(
		envelope: Env.linen(playTime*0.33, playTime*0.33, playTime*0.33),
		doneAction: 2);
		var modindex = env*LFNoise2.ar(1,mul:0.1,add:1);
		var modfreq = freq*0.5*LFNoise2.ar(1,mul:0.01,add:1);
		var fm = modindex*modfreq*SinOsc.ar(modfreq);

		var srcFM = (SinOsc.ar(baseFreq+ fm, 0, dist).tanh * 0.5*amp*env).tanh.tanh;
		/*
		var pans = Array.fill(n, {|i| ((pan*10+(n-1)/2-i)).tanh});
		var panned = Mix.fill(n, {|i| Pan2.ar(srcFM[i], pans[i])});
		*/
		Out.ar(out_bus, Splay.ar(srcFM, spread: 0.2, center: pan));
}).store
)

