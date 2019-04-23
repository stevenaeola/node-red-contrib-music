SYNTHDEFS = playSampleStereo playSampleMono recordSampleStereo bell crotale dx fmtanh ghost kick marimba moog piano prophet snare
FXDEFS = bpf hpf lpf delay drop flanger reverb distortion

all: $(SYNTHDEFS) $(FXDEFS)

$(SYNTHDEFS) $(FXDEFS):
	cp ~/'Library/Application Support/SuperCollider/synthdefs'/$@.scsyndef compiled

