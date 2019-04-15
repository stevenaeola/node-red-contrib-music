
(
SynthDef("fmtanh",
	{|out_bus = 0, amp = 0.5, note = 60, sustain = 1, sustain_prop = 0.33, detune = 0.01, lfnoise_freq = 5, pan =0 |
		var n = 4;
		var freq = midicps(note.clip(0,128));
		var dist = 10;
		var baseFreq = Array.fill(n.trunc, {|i| freq*LFNoise2.ar(lfnoise_freq, mul:detune, add:1)});
		var playTime = sustain;

		var env = EnvGen.ar(
			envelope: Env.linen(playTime*(1-sustain_prop)/2, playTime*sustain_prop, playTime*(1-sustain_prop)/2),
			doneAction: 2);
		var modindex = env*LFNoise2.ar(1,mul:0.1,add:1);
		var modfreq = freq*0.5*LFNoise2.ar(1,mul:0.01,add:1);
		var fm = modindex*modfreq*SinOsc.ar(modfreq);

		var srcFM = (SinOsc.ar(baseFreq+ fm, 0, dist).tanh * 0.5*amp*env).tanh.tanh;
		Out.ar(out_bus, Splay.ar(srcFM, spread: 0.5, center: pan));
}).store
)

