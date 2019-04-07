
(
SynthDef("piano",
	{ |out_bus = 0, note = 60, amp = 0.5, pan = 0 |
		var delayTime, detune, strike, hammerEnv, hammer;
		var threeStrings, panned, silenced;
		var freq = midicps(note.clip(0,128));
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

		Out.ar(out_bus, panned)
	}
).store
)

