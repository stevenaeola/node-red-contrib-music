(
SynthDef("s1",
	{ |out = 0, freq = 110, mod = 0.0, pan=0, vibfreq = 10, vibdepth = 0 |
		var mul, z, panned, vib, depth, f;
		depth = Lag.kr(vibdepth, 10, 0.5);
		vib = 1 + SinOsc.kr(Lag.kr(vibfreq, 10), 0, depth, depth);
		mul = Lag.kr(mod*vib,10.0)/3;
		f = freq; // * vib
		z =  RLPF.ar(Mix.new([ LFTri.ar(f, mul:mul), LFTri.ar(f*1.005, mul:mul), LFTri.ar(f*0.997, mul:mul), Resonz.ar(WhiteNoise.ar(mul*64.0), f*2, 0.002)
		]) , vib*100);
		//z = Blip.ar(freq,harms,0.1);
		panned = Pan2.ar(z,pan);
		Out.ar(out, panned);
	}
).store
)



(
var note_names, note_freqs, synths, sliders, slider1;
note_names = ["C", "D", "E", "Fs", "G", "A", "B", "C", "Cs", "D", "E", "F", "Fs", "G", "A", "B", "C"];
note_freqs = [36, 38, 40,  42,       43,  45,  47,  48,  49,       50,  52,  53,  54,       55,  57,   59, 60];
synths = Array.fill(note_freqs.size, {arg i; var s; s = Synth("s1"); s.set("freq", midicps(note_freqs[i])); s});

w=Window("Bass synth", Rect(100, 400, 400, 500));
w.view.decorator = FlowLayout(w.view.bounds);


sliders = Array.fill(note_freqs.size, {|j| var slider; slider = EZSlider(w, 300@30, note_names[j]++note_freqs[j], ControlSpec(0, 2),
	{|ez|  synths[j].set("mod", ez.value)});
	w.view.decorator.nextLine;
	slider;});

		//	ControlSpec(0, 2), {|ez|  synths[j].set("mod", ez.value);w.view.decorator.nextLine; slider ;
//sliders = Array.fill(note_freqs.size, {arg j; var slider; slider = EZSlider(w, 300@20, note_names[i],
//	ControlSpec(0, 2), {|ez|  synths[j].set("mod", ez.value);w.view.decorator.nextLine; slider})});

w.front;
)

