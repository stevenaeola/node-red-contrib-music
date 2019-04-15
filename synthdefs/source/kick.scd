(
SynthDef("kick",{
	| out = 0, freq = 50, mod_freq = 2, mod_index = 5, sus = 0.3, amp = 0.5, beater_noise = 0.05, pan = 0 |
	var pitch_contour, drum_osc, drum_lpf, drum_env;
	var beater_source, beater_hpf, beater_lpf, lpf_cutoff_contour, beater_env;
	var kick_mix;
	pitch_contour = Line.kr(freq*2, freq, 0.02);
	drum_osc = PMOsc.ar(	pitch_contour,
				mod_freq,
				mod_index/1.3,
				mul: 1,
				add: 0);
	drum_lpf = LPF.ar(in: drum_osc, freq: 1000, mul: 1, add: 0);
	drum_env = drum_lpf * EnvGen.ar(Env.perc(0.01, sus), doneAction: 2);
	beater_source = WhiteNoise.ar(beater_noise);
	beater_hpf = HPF.ar(in: beater_source, freq: 500, mul: 1, add: 0);
	lpf_cutoff_contour = Line.kr(6000, 500, 0.03);
	beater_lpf = LPF.ar(in: beater_hpf, freq: lpf_cutoff_contour, mul: 1, add: 0);
	beater_env = beater_lpf * EnvGen.ar(Env.perc, doneAction: 2);
	kick_mix = Mix.new([drum_env, beater_env]) * 8 * amp;
	DetectSilence.ar(kick_mix, doneAction:2);

	Out.ar(out, Pan2.ar(kick_mix, pan))
	}
).store
)

