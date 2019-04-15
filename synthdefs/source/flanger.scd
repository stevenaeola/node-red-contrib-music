/* adapted from http://ecmc.rochester.edu/ecmc/docs/supercollider/scbook/Ch21_Interface_Investigations/ixi%20SC%20tutorial/ixi_SC_tutorial_12.html

Original material:
Copyright (c) 2005-2010, ixi audio.
This work is licensed under a Creative Commons
Attribution-NonCommercial-ShareAlike 2.0 England & Wales License.
http://creativecommons.org/licenses/by-nc-sa/2.0/uk/

Adaptation:
Copyright (c) 2019, Steven Bradley
This work is licensed under a Creative Commons
Attribution-NonCommercial-ShareAlike 2.0 England & Wales License.
http://creativecommons.org/licenses/by-nc-sa/2.0/uk/

*/

(
SynthDef("flanger", { |out_bus = 0, inBus = 0, delay = 0.1, depth = 0.08, rate = 0.06, feedback = 0.0, decay = 0.0 |

	var input, maxdelay, maxrate, dsig, mixed, local;
	maxdelay = 0.013;
	maxrate = 10.0;
	input = In.ar(inBus, 1);
	local = LocalIn.ar(1);
	dsig = AllpassL.ar(
		input + (local * feedback),
		maxdelay * 2,
		LFPar.kr(
			rate * maxrate,
			0,
			depth * maxdelay,
			delay * maxdelay),
		decay);
	mixed = input + dsig;
	LocalOut.ar(mixed);
	Out.ar([out_bus, out_bus+1], mixed);
}).store;
)