
// bell
(
SynthDef("bell",
{
		|out = 0, midi = 40, amp = 0.5, pan = 0|
// Klank - bank of resonators excited by impulses
		var p, z, panned, env;
		var freq = midicps(midi.clip(0,128));
		var freqs = [ freq,
			freq*1.81*Rand(1,1.01),
			freq*2.73*Rand(1,1.01),
			freq*4.03*Rand(1,1.01),
			freq*5.69*Rand(1,1.01),
			freq*6.48*Rand(1,1.01) ];
		// see "http://scitation.aip.org/confst/ASA/data/1/4pMU4.pdf" for harmonic specs
		z = `[	// filter bank specification :
			freqs,	// frequencies
			Array.fill(6, { arg i; 1/(6+i) }), 			// amplitudes
			Array.geom(6, 1500/freq, 0.75)		// ring times
			];
		env = Env([0,1,0], [0.002,0.02]);
		panned = Pan2.ar(
			Klank.ar(z, BrownNoise.ar(mul: amp*0.25)*EnvGen.ar(env, 1, doneAction:0)), pan
		);
		DetectSilence.ar(panned, doneAction:2);
		Out.ar(out, panned);
	}
).store
)



(
SynthDef("kick",{
	| out = 0, freq = 50, mod_freq = 2, mod_index = 5, sustain = 0.3, amp = 0.5, beater_noise_level = 0.05 |
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
	drum_env = drum_lpf * EnvGen.ar(Env.perc(0.01, sustain), doneAction: 2);
	beater_source = WhiteNoise.ar(beater_noise_level);
	beater_hpf = HPF.ar(in: beater_source, freq: 500, mul: 1, add: 0);
	lpf_cutoff_contour = Line.kr(6000, 500, 0.03);
	beater_lpf = LPF.ar(in: beater_hpf, freq: lpf_cutoff_contour, mul: 1, add: 0);
	beater_env = beater_lpf * EnvGen.ar(Env.perc, doneAction: 2);
	kick_mix = Mix.new([drum_env, beater_env]) * 8 * amp;
	DetectSilence.ar(kick_mix, doneAction:2);

	Out.ar(out, [kick_mix, kick_mix])
	}
).store
)



(
SynthDef("snare",
	{arg out = 0, sustain = 0.1, drum_mode_level = 0.25,
	snare_level = 50, snare_tightness = 100,
	freq = 805, amp = 0.5;
	var drum_mode_sin_1, drum_mode_sin_2, drum_mode_pmosc, drum_mode_mix, drum_mode_env;
	var snare_noise, snare_brf_1, snare_brf_2, snare_brf_3, snare_brf_4, snare_reson;
	var snare_env;
	var snare_drum_mix;

	drum_mode_env = EnvGen.ar(Env.perc(0.005, sustain), doneAction: 2);
	drum_mode_sin_1 = SinOsc.ar(freq*0.53, 0, drum_mode_env * 0.5);
	drum_mode_sin_2 = SinOsc.ar(freq, 0, drum_mode_env * 0.5);
	drum_mode_pmosc = PMOsc.ar(	Saw.ar(freq*0.85),
					184,
					0.5/1.3,
					mul: drum_mode_env*5,
					add: 0);
	drum_mode_mix = Mix.new([drum_mode_sin_1, drum_mode_sin_2, drum_mode_pmosc]) * drum_mode_level;

// choose either noise source below
//	snare_noise = Crackle.ar(2.01, 1);
	snare_noise = LFNoise0.ar(20000, 0.1);
	snare_env = EnvGen.ar(Env.perc(0.005, sustain), doneAction: 2);
	snare_brf_1 = BRF.ar(in: snare_noise, freq: 8000, mul: 0.5, rq: 0.1);
	snare_brf_2 = BRF.ar(in: snare_brf_1, freq: 5000, mul: 0.5, rq: 0.1);
	snare_brf_3 = BRF.ar(in: snare_brf_2, freq: 3600, mul: 0.5, rq: 0.1);
	snare_brf_4 = BRF.ar(in: snare_brf_3, freq: 2000, mul: snare_env, rq: 0.0001);
	snare_reson = Resonz.ar(snare_brf_4, snare_tightness, mul: snare_level) ;
	snare_drum_mix = Mix.new([drum_mode_mix, snare_reson]) * 10 * amp;
	Out.ar(out, [snare_drum_mix, snare_drum_mix])
	}
).store
)




(
SynthDef("piano",
	{ |out = 0, midi = 60, amp = 0.5, pan = 0 |
		var delayTime, detune, strike, hammerEnv, hammer;
		var threeStrings, panned, silenced;
		var freq = midicps(midi.clip(0,128));
		strike = Impulse.ar(0, 0, amp*0.9);

		hammerEnv = Decay2.ar(strike, 0.008, 0.04); // excitation envelope
		threeStrings = // array of 3 strings per note
			Mix.ar(Array.fill(3, { arg i;
				// detune strings, calculate delay time :
				detune = #[0.999, 1, 1.0005].at(i);
			delayTime = 1 / (freq*detune);
				// each string gets own exciter :
				hammer = LFNoise2.ar(3000, hammerEnv); // 3000 Hz was chosen by ear..
				CombL.ar(hammer,		// used as a string resonator
					delayTime, 		// max delay time
					delayTime,			// actual delay time
					4) 				// decay time of string
			}));
		panned = Pan2.ar(threeStrings,pan);
		DetectSilence.ar(panned, doneAction:2);

		Out.ar(out, panned)
	}
).store
)



// FROM github.com/brunoruviaro/SynthDefs-for-Patterns/

(
SynthDef("dx", {arg out = 0, midi = 20, numharm = 10, att = 0.01, rel = 1, amp = 0.5, pan = 0.5;
	var snd, env;
	var freq = midicps(midi.clip(0,128));
	env = EnvGen.ar(Env.perc(att, rel, amp), doneAction: 2);
	snd = LeakDC.ar(Mix(Blip.ar([freq, freq*1.01], numharm, env)));
	Out.ar(out, Pan2.ar(snd, pan));
}).store;
)


(
SynthDef("marimba", {|midi = 80, amp = 0.5|
	var snd, env, env2;
	var freq = midicps(midi.clip(0,128));
	env = EnvGen.ar(Env.linen(0.015, 1, 0.5, amp*300), doneAction:2);
	env2 = EnvGen.ar(Env.perc(0.015, 1, level:4), doneAction:2);
	snd = BPF.ar(env2, freq, 0.02);
	snd = BLowShelf.ar(snd, 220, 0.81, 6);
	snd = snd * env;
	Out.ar(0, Splay.ar(snd));
}).store;
)

(
SynthDef("prophetdrone", {
	| out = 0, pan = 0.0, midi=60, amp = 0.5, gate = 0, att = 0.01, rel = 0, sus = 1, dec = 0.5, lforate = 10, lfowidth = 0.5, cutoff = 12000, rq = 0.5 |

	var lfo, pulse, filter, env;
	var freq = midicps(midi.clip(0,128));
	lfo = LFTri.kr(lforate * [1, 1.01], Rand(0, 2.0) ! 2);
	pulse = Pulse.ar(freq * [1, 1.01], lfo * lfowidth + 0.5);
	filter = RLPF.ar(pulse, cutoff, rq);
	env = EnvGen.ar(
		envelope: Env.adsr(att, dec, sus, rel,1),
		gate: gate,
		doneAction: 0);
	Out.ar(out, Pan2.ar(
		in: Mix(filter) * env * 0.2 * amp,
		pos: pan)
	);
}).store
)

(
SynthDef("prophet", {
	| out = 0, pan = 0.0, midi=60, amp = 0.5, beats = 1, bpm = 100, att = 0.01,  dec = 0.5, lforate = 10, lfowidth = 0.5, cutoff = 12000, rq = 0.5 |

	var lfo, pulse, filter, env;
	var freq = midicps(midi.clip(0,128));
	var playTime = beats*60/bpm;
	lfo = LFTri.kr(lforate * [1, 1.01], Rand(0, 2.0) ! 2);
	pulse = Pulse.ar(freq * [1, 1.01], lfo * lfowidth + 0.5);
	filter = RLPF.ar(pulse, cutoff, rq);
	env = EnvGen.ar(
		envelope: Env.linen(att, playTime - att - dec, dec),
		doneAction: 2);
	Out.ar(out, Pan2.ar(
		in: Mix(filter) * env * 0.2 * amp,
		pos: pan)
	);
}).store
)

(
SynthDef("moogdrone", {
	| out = 0, pan = 0, midi=60, amp = 0.5, gate = 0, cutoff = 1000, gain = 2.0, lagamount = 0.5, att = 0.001, dec = 0.3, sus = 0.9, rel = 0.2, chorus = 0.7 |
	var freq= midicps(midi.clip(0,128));
	var osc, filter, env, filterenv, snd, chorusfx;

	osc = Mix(VarSaw.ar(
		freq: freq.lag(lagamount) * [1.0, 1.001, 2.0],
		iphase: Rand(0.0,1.0) ! 3,
		width: Rand(0.5,0.75) ! 3,
		mul: 0.5));

	filterenv = EnvGen.ar(
		envelope: Env.asr(0.2, 1, 0.2),
		gate: gate);

	filter =  MoogFF.ar(
		in: osc,
		freq: cutoff * (1.0 + (0.5 * filterenv)),
		gain: gain);

	env = EnvGen.ar(
		envelope: Env.adsr(0.001, 0.3, 0.9, 0.2, 1),
		gate: gate,
		doneAction: 0);

	snd = (0.7 * filter + (0.3 * filter.distort)) * env;

	chorusfx = Mix.fill(7, {

		var maxdelaytime = rrand(0.005, 0.02);
		DelayC.ar(
			in: snd,
			maxdelaytime: maxdelaytime,
			delaytime: LFNoise1.kr(
				freq: Rand(4.5, 10.5),
				mul: 0.25 * maxdelaytime,
				add: 0.75 * maxdelaytime)
		)
	});

	snd = (snd + (chorusfx * chorus)) * amp * 12.0;

	Out.ar(out, Pan2.ar(snd, pan));

}).store;
)

(
SynthDef("moog", {
	| out = 0, pan = 0, midi=60, amp = 0.5, bpm=100, beats = 1, cutoff = 1000, gain = 2.0, latt = 0.001, dec = 0.3, sus = 0.9, rel = 0.2, chorus = 0.7 |
	var freq= midicps(midi.clip(0,128));
	var osc, filter, env, filterenv, snd, chorusfx, playTime;

	playTime = beats*60/bpm;

	osc = Mix(VarSaw.ar(
		freq: freq* [1.0, 1.001, 2.0],
		iphase: Rand(0.0,1.0) ! 3,
		width: Rand(0.5,0.75) ! 3,
		mul: 0.5));

	filterenv = EnvGen.ar(Env.linen(0.2, playTime-0.4, 0.2));

	filter =  MoogFF.ar(
		in: osc,
		freq: cutoff * (1.0 + (0.5 * filterenv)),
		gain: gain);

	env = EnvGen.ar(
		envelope: Env.linen(0.001, playTime, 0.2),
		doneAction: 2);

	snd = (0.7 * filter + (0.3 * filter.distort)) * env;

	chorusfx = Mix.fill(7, {

		var maxdelaytime = rrand(0.005, 0.02);
		DelayC.ar(
			in: snd,
			maxdelaytime: maxdelaytime,
			delaytime: LFNoise1.kr(
				freq: Rand(4.5, 10.5),
				mul: 0.25 * maxdelaytime,
				add: 0.75 * maxdelaytime)
		)
	});

	snd = (snd + (chorusfx * chorus)) * amp * 12.0;

	Out.ar(out, Pan2.ar(snd, pan));

}).store;
)


(
SynthDef("sinebass", {
	| out = 0, pan = 0, midi=60, amp = 0.5, bpm = 100, beats = 1 |
	var env, osc, panned;
	var playTime = beats*60/bpm;

	env = EnvGen.ar(
		envelope: Env.linen(0.001, playTime, 0.2),
		doneAction: 2);



})
)



// Crotale adapted from SuperCollider book p24
(
//run this first
SynthDef("crotale", {
| midi = 60, tone = 3, art = 1, amp = 0.5, pan = 0|
var env, out, mod, freq;

	freq = midicps(midi.clip(0,128));
env = Env.perc(0, art);
mod = 5 + (1/IRand(2, 6));

out = PMOsc.ar(freq, mod*freq,
	pmindex: EnvGen.kr(env, timeScale: art, levelScale: tone, doneAction:2),
	mul: EnvGen.kr(env, timeScale: art, levelScale: 0.3, doneAction:2));

out = Pan2.ar(out, pan);

out = out * amp*1.5 * EnvGen.kr(env,  timeScale: 1.3*art,
	levelScale: Rand(0.1, 0.5), doneAction:2);
Out.ar(0, out); //Out.ar(bus, out);

}).store;
)

// resonance designed to be in range 0-100
(
SynthDef("ghostdrone",
	{|amp = 0.5, out=0, midi=40, resonance=70, lag = 1.0, gate =0|

		var noise=WhiteNoise.ar(mul:amp);
		var freq = Lag.kr(midicps(midi.clip(0,128)), lag);
		var env = EnvGen.ar(
		envelope: Env.adsr(2, 0.3, 0.8, 1, 1.2),
		gate: gate,
		doneAction: 0);
		Out.ar(out, env *
			RLPF.ar(noise, freq, 2.pow(-1.0*resonance/10.0))!2);
}).store
)

(
SynthDef("ghost",
	{|amp = 0.5, out=0, midi=40, bpm = 100, beats = 1, resonance=70, lag = 1.0|

		var noise=WhiteNoise.ar(mul:amp);
		var freq = midicps(midi.clip(0,128));
		var playTime = beats*60/bpm;

		var env = EnvGen.ar(
		envelope: Env.linen(0.05, playTime, 0.25),
		doneAction: 2);

		Out.ar(out, env *
			RLPF.ar(noise, freq, 2.pow(-1.0*resonance/10.0))!2);
}).store
)


(
SynthDef("fmtanh",
	{|out = 0, amp = 0.5, midi = 60, bpm = 100, beats = 8, dist = 10|
		var freq = midicps(midi.clip(0,128));
		var detune = 0.01;
		var baseFreq = Array.fill(4,{|i| freq*LFNoise2.ar(5,mul:detune, add:1)});
		var playTime = beats*60/bpm;

		var env = EnvGen.ar(
		envelope: Env.linen(playTime*0.33, playTime*0.33, playTime*0.33),
		doneAction: 2);
		var modindex = env*LFNoise2.ar(1,mul:0.1,add:1);
		var modfreq = freq*0.5*LFNoise2.ar(1,mul:0.01,add:1);
		var fm = modindex*modfreq*SinOsc.ar(modfreq);

		var srcFM = (SinOsc.ar(baseFreq+ fm, 0, dist).tanh * amp*env).tanh.tanh;
		Out.ar(out, srcFM);
}).store
)




(
b = Buffer.alloc(s, 512, 1, {arg buf; buf.sine1Msg(1.0/[1,2,3,4,5,6,7,8,9,10])});
{ COsc.ar(b.bufnum, 200, 0.7, 0.25) }.play;
)



(
SynthDef("recordSample", {
	| buffer, recLevel=1, preLevel=1 |
    var in;
	in = SoundIn.ar([0,1]);
    RecordBuf.ar(in, buffer,
		recLevel: recLevel,
		preLevel: preLevel,
		loop:0);
}).store
)

(
SynthDef("playSample", {
	|buffer, out = 0, amp=0.5, rate=1, startPos = 0|
    Out.ar(out, amp*PlayBuf.ar(2, buffer, rate, startPos: startPos) ! 2)
}).store;
)

(
SynthDef("playSampleMono", {
	|buffer, out = 0, amp=0.5, midi=60, midibase=60, startPos = 0|
	var snd,rate;
	rate=midicps(midi.clip(0,128))/midicps(midibase.clip(0,128));
	snd = PlayBuf.ar(1, buffer, rate, startPos: startPos, doneAction:2) ! 2;
    Out.ar(out, amp*snd)
}).store;
)

// soundFX
(
SynthDef("reverb", { |outBus = 0, inBus|
	var input;
	input = In.ar(inBus, 2);


	Out.ar(outBus, FreeVerb.ar(input));
	}).store;
)




(
SynthDef("delay", {| out = 0, inBus, bpm = 100, beats = 1|
	var input, delayed, time;
	time = beats*60/bpm;

	input = In.ar(inBus, 2);

	delayed = CombN.ar(input, time, time, time*10);
	Out.ar(out, input);
	Out.ar(out, delayed);

}).store;
)

(
SynthDef("LPF", {| out = 0, inBus, midi = 40|
	var input, filtered;
	var freq = midicps(midi.clip(0,128));
	input = In.ar(inBus, 2);


	filtered = LPF.ar(input, Lag.kr(freq,0.1));
	Out.ar(out, filtered);
}).store;
)


(
SynthDef("HPF", {| out = 0, inBus, midi = 60|
	var input, filtered;
	var freq = midicps(midi.clip(0,128));
	input = In.ar(inBus, 2);


	filtered = HPF.ar(input, Lag.kr(freq,0.1));
	Out.ar(out, filtered);
}).store;
)


(
SynthDef("drop", {| out = 0,  inBus, t_trig = 0|
	var input, filtered, env, kick, kickenv;
	kick = BrownNoise.ar();
	input = In.ar(inBus,2);
	env = EnvGen.kr(Env.perc(0.1, 0.5, 2000, -1), t_trig, 2, 10);
	kickenv = EnvGen.kr(Env.perc(0.01, 0.1, 1, -1), t_trig);

	filtered = HPF.ar(input, env);
//	Mix.new([
//		HPF.ar(input, env),
//		LPF.ar(kick*kickenv*100,50).dup;
//	]);
	Out.ar(out, filtered);
}).store;
)

(
SynthDef(\bubblebub, {	|out=0, t_trig=0, attack=0.01, decay=0.08, pitchcurvelen=0.1, freq=1000, doneAction=0, amp=0.1|
	var pitch, son;
	amp   = amp * EnvGen.ar(Env.perc(attack, decay).delay(0.003), t_trig, doneAction: doneAction);
	pitch = freq * EnvGen.ar(Env.new([0,0,1],[0,1]).exprange(1, 2.718), t_trig, timeScale: pitchcurvelen);
	son = SinOsc.ar(pitch);
	// high-pass to remove any lowpitched artifacts, scale amplitude
	son = HPF.ar(son, 500) * amp * 10;
	Out.ar(out, son);
}).store;
)


x = Synth(\bubblebub);
x.set("t_trig", 1);


d = Synth("drop");


d.set("t_trig",1);






s.dumpOSC(1);
