#!/bin/bash

killall jackd
killall scsynth
sleep 1
jackd -R -p 32 -d alsa -d hw:0 -n 3 -p 2048 -o2 -r 44100 &
sleep 3
#scsynth -u 57110 -a 64 -m 131072 -D 0 -R 0 -l 8 -z 128 -c 128 -U /usr/lib/SuperCollider/plugins:/opt/sonic-pi/app/server/native/raspberry/extra-ugens/ -i 2 -o 2 -b 4096 &
scsynth -u 57110 -a 64 -m 131072 -D 0 -R 0 -l 8 -z 128 -c 128 -i 2 -o 2 -b 4096 &
sleep 3
jack_connect SuperCollider:out_1 system:playback_1
jack_connect SuperCollider:out_2 system:playback_2
