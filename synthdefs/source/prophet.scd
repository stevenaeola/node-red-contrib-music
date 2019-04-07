
(
SynthDef("prophet", {
	| out_bus = 0, pan = 0.0, note = 60, amp = 0.5, sustain = 1, att = 0.01,  dec = 0.5, lforate = 10, lfowidth = 0.2, cutoff = 12000, rq = 0.5 |

	var lfo, pulse, filter, env;
	var freq = midicps(note.clip(0,128));
	lfo = LFTri.kr(lforate * [1, 1.01], Rand(0, 2.0) ! 2);
	pulse = Pulse.ar(freq * [1, 1.01], lfo * lfowidth + 0.5);
	filter = RLPF.ar(pulse, cutoff, rq);
	env = EnvGen.ar(
		envelope: Env.linen(att, sustain,dec),
		doneAction: 2);
	Out.ar(out_bus, Pan2.ar(
		in: Mix(filter) * env * 0.2 * amp,
		pos: pan)
	);
}).store
)

