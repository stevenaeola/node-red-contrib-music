# Changelog

## vv1.0.0 (27/12/2020)

#### bug

- [**bug**] sonic-pi synthdefs should be sent by supercollider [#101](https://github.com/stevenaeola/node-red-contrib-music/issues/101)
- [**bug**] tabla_ghe1 sample should be mono [#93](https://github.com/stevenaeola/node-red-contrib-music/issues/93)
- [**bug**] setting node should clear value when closed [#92](https://github.com/stevenaeola/node-red-contrib-music/issues/92)
- [**bug**] volume setting with flow context should work [#90](https://github.com/stevenaeola/node-red-contrib-music/issues/90)
- [**bug**] elec_blip and elec_blip2 should be mono [#88](https://github.com/stevenaeola/node-red-contrib-music/issues/88)
- [**bug**] Volume control in example is not global [#87](https://github.com/stevenaeola/node-red-contrib-music/issues/87)
- [**bug**] misc_crow synth should be mono [#86](https://github.com/stevenaeola/node-red-contrib-music/issues/86)
- [**bug**] bd_fat synth should be mono [#79](https://github.com/stevenaeola/node-red-contrib-music/issues/79)
- [**bug**] Loading samples doesn't work on Windows [#77](https://github.com/stevenaeola/node-red-contrib-music/issues/77)
- [**bug**] Synth node does not list synthtypes [#74](https://github.com/stevenaeola/node-red-contrib-music/issues/74)
- [**bug**] Global bpm has no effect [#57](https://github.com/stevenaeola/node-red-contrib-music/issues/57)
- [**bug**] Match mono/stereo sample synths to sample types [#56](https://github.com/stevenaeola/node-red-contrib-music/issues/56)
- [**bug**] Missing synths: soundfx nodes and recordSampleMono [#49](https://github.com/stevenaeola/node-red-contrib-music/issues/49)
- [**bug**] beat latency doesn't work outside London time zone [#30](https://github.com/stevenaeola/node-red-contrib-music/issues/30)
- [**bug**] settings increases past upper limit when receiving "up" messages [#29](https://github.com/stevenaeola/node-red-contrib-music/issues/29)
- [**bug**] global setting of root affects synths [#24](https://github.com/stevenaeola/node-red-contrib-music/issues/24)
- [**bug**] Message "cannot create sampler synth without buffer" when changing synth type to a sample [#23](https://github.com/stevenaeola/node-red-contrib-music/issues/23)
- [**bug**] synth octave configuration broken [#22](https://github.com/stevenaeola/node-red-contrib-music/issues/22)
- [**bug**] sampler occasionally drops out with "duplicate node ID" error [#21](https://github.com/stevenaeola/node-red-contrib-music/issues/21)
- [**bug**] sequencer should be able to send null values [#20](https://github.com/stevenaeola/node-red-contrib-music/issues/20)
- [**bug**] sequencer should restart after reset [#17](https://github.com/stevenaeola/node-red-contrib-music/issues/17)
- [**bug**] Sampler name should inherit sample name [#16](https://github.com/stevenaeola/node-red-contrib-music/issues/16)
- [**bug**] sequencer doesn't appear modified when changing controls [#12](https://github.com/stevenaeola/node-red-contrib-music/issues/12)
- [**bug**] soundfx has fixed synthid for each fx type to avoid problems with zombie fx synths [#7](https://github.com/stevenaeola/node-red-contrib-music/issues/7)

#### closed

- [**closed**] Setting scale to 'whole tone' in global setting doesn't work [#94](https://github.com/stevenaeola/node-red-contrib-music/issues/94)
- [**closed**] Reconnection of synth requires redeployment [#82](https://github.com/stevenaeola/node-red-contrib-music/issues/82)
- [**closed**] Give synthcontrols as options in synth configuration [#59](https://github.com/stevenaeola/node-red-contrib-music/issues/59)
- [**closed**] Bars start one beat out [#54](https://github.com/stevenaeola/node-red-contrib-music/issues/54)
- [**closed**] Instructions/link for startsc.sh [#46](https://github.com/stevenaeola/node-red-contrib-music/issues/46)
- [**closed**] Remove sample node [#43](https://github.com/stevenaeola/node-red-contrib-music/issues/43)
- [**closed**] Bugs in markdown on npmjs/nodered.org [#42](https://github.com/stevenaeola/node-red-contrib-music/issues/42)
- [**closed**] Find replacements for tidal samples [#39](https://github.com/stevenaeola/node-red-contrib-music/issues/39)
- [**closed**] sustained synths have lengths [#14](https://github.com/stevenaeola/node-red-contrib-music/issues/14)
- [**closed**] Update node help for sequencer [#13](https://github.com/stevenaeola/node-red-contrib-music/issues/13)

#### duplicate

- [**duplicate**][**enhancement**] Tunable samples [#15](https://github.com/stevenaeola/node-red-contrib-music/issues/15)

#### enhancement

- [**enhancement**] Beat generator to have option to auto-start/continue on deployment [#95](https://github.com/stevenaeola/node-red-contrib-music/issues/95)
- [**enhancement**] Allow single-stepping of beat generator [#81](https://github.com/stevenaeola/node-red-contrib-music/issues/81)
- [**enhancement**] status for divide node [#80](https://github.com/stevenaeola/node-red-contrib-music/issues/80)
- [**enhancement**] Add looper component for importing [#76](https://github.com/stevenaeola/node-red-contrib-music/issues/76)
- [**enhancement**] Add volume control to looper [#75](https://github.com/stevenaeola/node-red-contrib-music/issues/75)
- [**enhancement**] Add icons for all node types [#72](https://github.com/stevenaeola/node-red-contrib-music/issues/72)
- [**enhancement**] Add extra scale types [#71](https://github.com/stevenaeola/node-red-contrib-music/issues/71)
- [**enhancement**] Add documentation for soundfx node [#70](https://github.com/stevenaeola/node-red-contrib-music/issues/70)
- [**enhancement**] Add flanger soundfx [#68](https://github.com/stevenaeola/node-red-contrib-music/issues/68)
- [**enhancement**] Add distortion soundfx [#66](https://github.com/stevenaeola/node-red-contrib-music/issues/66)
- [**enhancement**] Add envelope to samples so they don't overlay [#65](https://github.com/stevenaeola/node-red-contrib-music/issues/65)
- [**enhancement**] Allow additions to sequencer values (e.g. notes, note lengths) with incoming messages [#63](https://github.com/stevenaeola/node-red-contrib-music/issues/63)
- [**enhancement**] Make all synths use sonic-pi format [#61](https://github.com/stevenaeola/node-red-contrib-music/issues/61)
- [**enhancement**] Reduce download size [#55](https://github.com/stevenaeola/node-red-contrib-music/issues/55)
- [**enhancement**] Use beat count to self-terminate looper synthdefs : no need to store ID [#52](https://github.com/stevenaeola/node-red-contrib-music/issues/52)
- [**enhancement**] Master - slave synchronization via websockets [#51](https://github.com/stevenaeola/node-red-contrib-music/issues/51)
- [**enhancement**] Beat synchronization using arbitrary data via tap-tempo input [#50](https://github.com/stevenaeola/node-red-contrib-music/issues/50)
- [**enhancement**] Categorise samples and allow search from selector [#48](https://github.com/stevenaeola/node-red-contrib-music/issues/48)
- [**enhancement**] Integrate Berkeley/beat nodes for sync [#47](https://github.com/stevenaeola/node-red-contrib-music/issues/47)
- [**enhancement**] Make build process for scsynths [#44](https://github.com/stevenaeola/node-red-contrib-music/issues/44)
- [**enhancement**] Use global volume for synths [#40](https://github.com/stevenaeola/node-red-contrib-music/issues/40)
- [**enhancement**] Allow output of fx to another fx [#38](https://github.com/stevenaeola/node-red-contrib-music/issues/38)
- [**enhancement**] Use sonic-pi synths [#36](https://github.com/stevenaeola/node-red-contrib-music/issues/36)
- [**enhancement**] Give soundfx nodes initial fxcontrol values in configuration [#34](https://github.com/stevenaeola/node-red-contrib-music/issues/34)
- [**enhancement**] Label all nodes' input and outputs [#33](https://github.com/stevenaeola/node-red-contrib-music/issues/33)
- [**enhancement**] make note length work with bpm and length of tick (e.g. bar) [#32](https://github.com/stevenaeola/node-red-contrib-music/issues/32)
- [**enhancement**] sequencer should have separate output for one-off control events [#31](https://github.com/stevenaeola/node-red-contrib-music/issues/31)
- [**enhancement**] Use global setting for bpm in synth and beat [#27](https://github.com/stevenaeola/node-red-contrib-music/issues/27)
- [**enhancement**] Make sid sample synth tuned [#26](https://github.com/stevenaeola/node-red-contrib-music/issues/26)
- [**enhancement**] beat generator takes default bpm from setting [#25](https://github.com/stevenaeola/node-red-contrib-music/issues/25)
- [**enhancement**] sampler has timestamp [#19](https://github.com/stevenaeola/node-red-contrib-music/issues/19)
- [**enhancement**] sampler has volume control [#18](https://github.com/stevenaeola/node-red-contrib-music/issues/18)
- [**enhancement**] sequencer uses chord names I, IV, V etc [#11](https://github.com/stevenaeola/node-red-contrib-music/issues/11)
- [**enhancement**] sample has better name than "load" [#10](https://github.com/stevenaeola/node-red-contrib-music/issues/10)
- [**enhancement**] non-percussive synth sounds with number of beats [#8](https://github.com/stevenaeola/node-red-contrib-music/issues/8)
- [**enhancement**] Make sequencer hold for indefinite period with "next" input [#6](https://github.com/stevenaeola/node-red-contrib-music/issues/6)
- [**enhancement**] sampler and looper have OSC timestamp [#5](https://github.com/stevenaeola/node-red-contrib-music/issues/5)
- [**enhancement**] sampler has pitch control [#4](https://github.com/stevenaeola/node-red-contrib-music/issues/4)
- [**enhancement**] sequencer has range of output options [#2](https://github.com/stevenaeola/node-red-contrib-music/issues/2)
- [**enhancement**] separate oneshot sampler (e.g. for SuperDirt) from loop [#1](https://github.com/stevenaeola/node-red-contrib-music/issues/1)

---

## vv1.1.0 (27/12/2020)

#### bug

- [**bug**] sonic-pi synthdefs should be sent by supercollider [#101](https://github.com/stevenaeola/node-red-contrib-music/issues/101)
- [**bug**] tabla_ghe1 sample should be mono [#93](https://github.com/stevenaeola/node-red-contrib-music/issues/93)
- [**bug**] setting node should clear value when closed [#92](https://github.com/stevenaeola/node-red-contrib-music/issues/92)
- [**bug**] volume setting with flow context should work [#90](https://github.com/stevenaeola/node-red-contrib-music/issues/90)
- [**bug**] elec_blip and elec_blip2 should be mono [#88](https://github.com/stevenaeola/node-red-contrib-music/issues/88)
- [**bug**] Volume control in example is not global [#87](https://github.com/stevenaeola/node-red-contrib-music/issues/87)
- [**bug**] misc_crow synth should be mono [#86](https://github.com/stevenaeola/node-red-contrib-music/issues/86)
- [**bug**] bd_fat synth should be mono [#79](https://github.com/stevenaeola/node-red-contrib-music/issues/79)
- [**bug**] Loading samples doesn't work on Windows [#77](https://github.com/stevenaeola/node-red-contrib-music/issues/77)
- [**bug**] Synth node does not list synthtypes [#74](https://github.com/stevenaeola/node-red-contrib-music/issues/74)
- [**bug**] Global bpm has no effect [#57](https://github.com/stevenaeola/node-red-contrib-music/issues/57)
- [**bug**] Match mono/stereo sample synths to sample types [#56](https://github.com/stevenaeola/node-red-contrib-music/issues/56)
- [**bug**] Missing synths: soundfx nodes and recordSampleMono [#49](https://github.com/stevenaeola/node-red-contrib-music/issues/49)
- [**bug**] beat latency doesn't work outside London time zone [#30](https://github.com/stevenaeola/node-red-contrib-music/issues/30)
- [**bug**] settings increases past upper limit when receiving "up" messages [#29](https://github.com/stevenaeola/node-red-contrib-music/issues/29)
- [**bug**] global setting of root affects synths [#24](https://github.com/stevenaeola/node-red-contrib-music/issues/24)
- [**bug**] Message "cannot create sampler synth without buffer" when changing synth type to a sample [#23](https://github.com/stevenaeola/node-red-contrib-music/issues/23)
- [**bug**] synth octave configuration broken [#22](https://github.com/stevenaeola/node-red-contrib-music/issues/22)
- [**bug**] sampler occasionally drops out with "duplicate node ID" error [#21](https://github.com/stevenaeola/node-red-contrib-music/issues/21)
- [**bug**] sequencer should be able to send null values [#20](https://github.com/stevenaeola/node-red-contrib-music/issues/20)
- [**bug**] sequencer should restart after reset [#17](https://github.com/stevenaeola/node-red-contrib-music/issues/17)
- [**bug**] Sampler name should inherit sample name [#16](https://github.com/stevenaeola/node-red-contrib-music/issues/16)
- [**bug**] sequencer doesn't appear modified when changing controls [#12](https://github.com/stevenaeola/node-red-contrib-music/issues/12)
- [**bug**] soundfx has fixed synthid for each fx type to avoid problems with zombie fx synths [#7](https://github.com/stevenaeola/node-red-contrib-music/issues/7)

#### closed

- [**closed**] Setting scale to 'whole tone' in global setting doesn't work [#94](https://github.com/stevenaeola/node-red-contrib-music/issues/94)
- [**closed**] Reconnection of synth requires redeployment [#82](https://github.com/stevenaeola/node-red-contrib-music/issues/82)
- [**closed**] Give synthcontrols as options in synth configuration [#59](https://github.com/stevenaeola/node-red-contrib-music/issues/59)
- [**closed**] Bars start one beat out [#54](https://github.com/stevenaeola/node-red-contrib-music/issues/54)
- [**closed**] Instructions/link for startsc.sh [#46](https://github.com/stevenaeola/node-red-contrib-music/issues/46)
- [**closed**] Remove sample node [#43](https://github.com/stevenaeola/node-red-contrib-music/issues/43)
- [**closed**] Bugs in markdown on npmjs/nodered.org [#42](https://github.com/stevenaeola/node-red-contrib-music/issues/42)
- [**closed**] Find replacements for tidal samples [#39](https://github.com/stevenaeola/node-red-contrib-music/issues/39)
- [**closed**] sustained synths have lengths [#14](https://github.com/stevenaeola/node-red-contrib-music/issues/14)
- [**closed**] Update node help for sequencer [#13](https://github.com/stevenaeola/node-red-contrib-music/issues/13)

#### duplicate

- [**duplicate**][**enhancement**] Tunable samples [#15](https://github.com/stevenaeola/node-red-contrib-music/issues/15)

#### enhancement

- [**enhancement**] Beat generator to have option to auto-start/continue on deployment [#95](https://github.com/stevenaeola/node-red-contrib-music/issues/95)
- [**enhancement**] Allow single-stepping of beat generator [#81](https://github.com/stevenaeola/node-red-contrib-music/issues/81)
- [**enhancement**] status for divide node [#80](https://github.com/stevenaeola/node-red-contrib-music/issues/80)
- [**enhancement**] Add looper component for importing [#76](https://github.com/stevenaeola/node-red-contrib-music/issues/76)
- [**enhancement**] Add volume control to looper [#75](https://github.com/stevenaeola/node-red-contrib-music/issues/75)
- [**enhancement**] Add icons for all node types [#72](https://github.com/stevenaeola/node-red-contrib-music/issues/72)
- [**enhancement**] Add extra scale types [#71](https://github.com/stevenaeola/node-red-contrib-music/issues/71)
- [**enhancement**] Add documentation for soundfx node [#70](https://github.com/stevenaeola/node-red-contrib-music/issues/70)
- [**enhancement**] Add flanger soundfx [#68](https://github.com/stevenaeola/node-red-contrib-music/issues/68)
- [**enhancement**] Add distortion soundfx [#66](https://github.com/stevenaeola/node-red-contrib-music/issues/66)
- [**enhancement**] Add envelope to samples so they don't overlay [#65](https://github.com/stevenaeola/node-red-contrib-music/issues/65)
- [**enhancement**] Allow additions to sequencer values (e.g. notes, note lengths) with incoming messages [#63](https://github.com/stevenaeola/node-red-contrib-music/issues/63)
- [**enhancement**] Make all synths use sonic-pi format [#61](https://github.com/stevenaeola/node-red-contrib-music/issues/61)
- [**enhancement**] Reduce download size [#55](https://github.com/stevenaeola/node-red-contrib-music/issues/55)
- [**enhancement**] Use beat count to self-terminate looper synthdefs : no need to store ID [#52](https://github.com/stevenaeola/node-red-contrib-music/issues/52)
- [**enhancement**] Master - slave synchronization via websockets [#51](https://github.com/stevenaeola/node-red-contrib-music/issues/51)
- [**enhancement**] Beat synchronization using arbitrary data via tap-tempo input [#50](https://github.com/stevenaeola/node-red-contrib-music/issues/50)
- [**enhancement**] Categorise samples and allow search from selector [#48](https://github.com/stevenaeola/node-red-contrib-music/issues/48)
- [**enhancement**] Integrate Berkeley/beat nodes for sync [#47](https://github.com/stevenaeola/node-red-contrib-music/issues/47)
- [**enhancement**] Make build process for scsynths [#44](https://github.com/stevenaeola/node-red-contrib-music/issues/44)
- [**enhancement**] Use global volume for synths [#40](https://github.com/stevenaeola/node-red-contrib-music/issues/40)
- [**enhancement**] Allow output of fx to another fx [#38](https://github.com/stevenaeola/node-red-contrib-music/issues/38)
- [**enhancement**] Use sonic-pi synths [#36](https://github.com/stevenaeola/node-red-contrib-music/issues/36)
- [**enhancement**] Give soundfx nodes initial fxcontrol values in configuration [#34](https://github.com/stevenaeola/node-red-contrib-music/issues/34)
- [**enhancement**] Label all nodes' input and outputs [#33](https://github.com/stevenaeola/node-red-contrib-music/issues/33)
- [**enhancement**] make note length work with bpm and length of tick (e.g. bar) [#32](https://github.com/stevenaeola/node-red-contrib-music/issues/32)
- [**enhancement**] sequencer should have separate output for one-off control events [#31](https://github.com/stevenaeola/node-red-contrib-music/issues/31)
- [**enhancement**] Use global setting for bpm in synth and beat [#27](https://github.com/stevenaeola/node-red-contrib-music/issues/27)
- [**enhancement**] Make sid sample synth tuned [#26](https://github.com/stevenaeola/node-red-contrib-music/issues/26)
- [**enhancement**] beat generator takes default bpm from setting [#25](https://github.com/stevenaeola/node-red-contrib-music/issues/25)
- [**enhancement**] sampler has timestamp [#19](https://github.com/stevenaeola/node-red-contrib-music/issues/19)
- [**enhancement**] sampler has volume control [#18](https://github.com/stevenaeola/node-red-contrib-music/issues/18)
- [**enhancement**] sequencer uses chord names I, IV, V etc [#11](https://github.com/stevenaeola/node-red-contrib-music/issues/11)
- [**enhancement**] sample has better name than "load" [#10](https://github.com/stevenaeola/node-red-contrib-music/issues/10)
- [**enhancement**] non-percussive synth sounds with number of beats [#8](https://github.com/stevenaeola/node-red-contrib-music/issues/8)
- [**enhancement**] Make sequencer hold for indefinite period with "next" input [#6](https://github.com/stevenaeola/node-red-contrib-music/issues/6)
- [**enhancement**] sampler and looper have OSC timestamp [#5](https://github.com/stevenaeola/node-red-contrib-music/issues/5)
- [**enhancement**] sampler has pitch control [#4](https://github.com/stevenaeola/node-red-contrib-music/issues/4)
- [**enhancement**] sequencer has range of output options [#2](https://github.com/stevenaeola/node-red-contrib-music/issues/2)
- [**enhancement**] separate oneshot sampler (e.g. for SuperDirt) from loop [#1](https://github.com/stevenaeola/node-red-contrib-music/issues/1)

---

## vv2.0.0 (27/12/2020)

#### bug

- [**bug**] sonic-pi synthdefs should be sent by supercollider [#101](https://github.com/stevenaeola/node-red-contrib-music/issues/101)
- [**bug**] tabla_ghe1 sample should be mono [#93](https://github.com/stevenaeola/node-red-contrib-music/issues/93)
- [**bug**] setting node should clear value when closed [#92](https://github.com/stevenaeola/node-red-contrib-music/issues/92)
- [**bug**] volume setting with flow context should work [#90](https://github.com/stevenaeola/node-red-contrib-music/issues/90)
- [**bug**] elec_blip and elec_blip2 should be mono [#88](https://github.com/stevenaeola/node-red-contrib-music/issues/88)
- [**bug**] Volume control in example is not global [#87](https://github.com/stevenaeola/node-red-contrib-music/issues/87)
- [**bug**] misc_crow synth should be mono [#86](https://github.com/stevenaeola/node-red-contrib-music/issues/86)
- [**bug**] bd_fat synth should be mono [#79](https://github.com/stevenaeola/node-red-contrib-music/issues/79)
- [**bug**] Loading samples doesn't work on Windows [#77](https://github.com/stevenaeola/node-red-contrib-music/issues/77)
- [**bug**] Synth node does not list synthtypes [#74](https://github.com/stevenaeola/node-red-contrib-music/issues/74)
- [**bug**] Global bpm has no effect [#57](https://github.com/stevenaeola/node-red-contrib-music/issues/57)
- [**bug**] Match mono/stereo sample synths to sample types [#56](https://github.com/stevenaeola/node-red-contrib-music/issues/56)
- [**bug**] Missing synths: soundfx nodes and recordSampleMono [#49](https://github.com/stevenaeola/node-red-contrib-music/issues/49)
- [**bug**] beat latency doesn't work outside London time zone [#30](https://github.com/stevenaeola/node-red-contrib-music/issues/30)
- [**bug**] settings increases past upper limit when receiving "up" messages [#29](https://github.com/stevenaeola/node-red-contrib-music/issues/29)
- [**bug**] global setting of root affects synths [#24](https://github.com/stevenaeola/node-red-contrib-music/issues/24)
- [**bug**] Message "cannot create sampler synth without buffer" when changing synth type to a sample [#23](https://github.com/stevenaeola/node-red-contrib-music/issues/23)
- [**bug**] synth octave configuration broken [#22](https://github.com/stevenaeola/node-red-contrib-music/issues/22)
- [**bug**] sampler occasionally drops out with "duplicate node ID" error [#21](https://github.com/stevenaeola/node-red-contrib-music/issues/21)
- [**bug**] sequencer should be able to send null values [#20](https://github.com/stevenaeola/node-red-contrib-music/issues/20)
- [**bug**] sequencer should restart after reset [#17](https://github.com/stevenaeola/node-red-contrib-music/issues/17)
- [**bug**] Sampler name should inherit sample name [#16](https://github.com/stevenaeola/node-red-contrib-music/issues/16)
- [**bug**] sequencer doesn't appear modified when changing controls [#12](https://github.com/stevenaeola/node-red-contrib-music/issues/12)
- [**bug**] soundfx has fixed synthid for each fx type to avoid problems with zombie fx synths [#7](https://github.com/stevenaeola/node-red-contrib-music/issues/7)

#### closed

- [**closed**] Setting scale to 'whole tone' in global setting doesn't work [#94](https://github.com/stevenaeola/node-red-contrib-music/issues/94)
- [**closed**] Reconnection of synth requires redeployment [#82](https://github.com/stevenaeola/node-red-contrib-music/issues/82)
- [**closed**] Give synthcontrols as options in synth configuration [#59](https://github.com/stevenaeola/node-red-contrib-music/issues/59)
- [**closed**] Bars start one beat out [#54](https://github.com/stevenaeola/node-red-contrib-music/issues/54)
- [**closed**] Instructions/link for startsc.sh [#46](https://github.com/stevenaeola/node-red-contrib-music/issues/46)
- [**closed**] Remove sample node [#43](https://github.com/stevenaeola/node-red-contrib-music/issues/43)
- [**closed**] Bugs in markdown on npmjs/nodered.org [#42](https://github.com/stevenaeola/node-red-contrib-music/issues/42)
- [**closed**] Find replacements for tidal samples [#39](https://github.com/stevenaeola/node-red-contrib-music/issues/39)
- [**closed**] sustained synths have lengths [#14](https://github.com/stevenaeola/node-red-contrib-music/issues/14)
- [**closed**] Update node help for sequencer [#13](https://github.com/stevenaeola/node-red-contrib-music/issues/13)

#### duplicate

- [**duplicate**][**enhancement**] Tunable samples [#15](https://github.com/stevenaeola/node-red-contrib-music/issues/15)

#### enhancement

- [**enhancement**] Beat generator to have option to auto-start/continue on deployment [#95](https://github.com/stevenaeola/node-red-contrib-music/issues/95)
- [**enhancement**] Allow single-stepping of beat generator [#81](https://github.com/stevenaeola/node-red-contrib-music/issues/81)
- [**enhancement**] status for divide node [#80](https://github.com/stevenaeola/node-red-contrib-music/issues/80)
- [**enhancement**] Add looper component for importing [#76](https://github.com/stevenaeola/node-red-contrib-music/issues/76)
- [**enhancement**] Add volume control to looper [#75](https://github.com/stevenaeola/node-red-contrib-music/issues/75)
- [**enhancement**] Add icons for all node types [#72](https://github.com/stevenaeola/node-red-contrib-music/issues/72)
- [**enhancement**] Add extra scale types [#71](https://github.com/stevenaeola/node-red-contrib-music/issues/71)
- [**enhancement**] Add documentation for soundfx node [#70](https://github.com/stevenaeola/node-red-contrib-music/issues/70)
- [**enhancement**] Add flanger soundfx [#68](https://github.com/stevenaeola/node-red-contrib-music/issues/68)
- [**enhancement**] Add distortion soundfx [#66](https://github.com/stevenaeola/node-red-contrib-music/issues/66)
- [**enhancement**] Add envelope to samples so they don't overlay [#65](https://github.com/stevenaeola/node-red-contrib-music/issues/65)
- [**enhancement**] Allow additions to sequencer values (e.g. notes, note lengths) with incoming messages [#63](https://github.com/stevenaeola/node-red-contrib-music/issues/63)
- [**enhancement**] Make all synths use sonic-pi format [#61](https://github.com/stevenaeola/node-red-contrib-music/issues/61)
- [**enhancement**] Reduce download size [#55](https://github.com/stevenaeola/node-red-contrib-music/issues/55)
- [**enhancement**] Use beat count to self-terminate looper synthdefs : no need to store ID [#52](https://github.com/stevenaeola/node-red-contrib-music/issues/52)
- [**enhancement**] Master - slave synchronization via websockets [#51](https://github.com/stevenaeola/node-red-contrib-music/issues/51)
- [**enhancement**] Beat synchronization using arbitrary data via tap-tempo input [#50](https://github.com/stevenaeola/node-red-contrib-music/issues/50)
- [**enhancement**] Categorise samples and allow search from selector [#48](https://github.com/stevenaeola/node-red-contrib-music/issues/48)
- [**enhancement**] Integrate Berkeley/beat nodes for sync [#47](https://github.com/stevenaeola/node-red-contrib-music/issues/47)
- [**enhancement**] Make build process for scsynths [#44](https://github.com/stevenaeola/node-red-contrib-music/issues/44)
- [**enhancement**] Use global volume for synths [#40](https://github.com/stevenaeola/node-red-contrib-music/issues/40)
- [**enhancement**] Allow output of fx to another fx [#38](https://github.com/stevenaeola/node-red-contrib-music/issues/38)
- [**enhancement**] Use sonic-pi synths [#36](https://github.com/stevenaeola/node-red-contrib-music/issues/36)
- [**enhancement**] Give soundfx nodes initial fxcontrol values in configuration [#34](https://github.com/stevenaeola/node-red-contrib-music/issues/34)
- [**enhancement**] Label all nodes' input and outputs [#33](https://github.com/stevenaeola/node-red-contrib-music/issues/33)
- [**enhancement**] make note length work with bpm and length of tick (e.g. bar) [#32](https://github.com/stevenaeola/node-red-contrib-music/issues/32)
- [**enhancement**] sequencer should have separate output for one-off control events [#31](https://github.com/stevenaeola/node-red-contrib-music/issues/31)
- [**enhancement**] Use global setting for bpm in synth and beat [#27](https://github.com/stevenaeola/node-red-contrib-music/issues/27)
- [**enhancement**] Make sid sample synth tuned [#26](https://github.com/stevenaeola/node-red-contrib-music/issues/26)
- [**enhancement**] beat generator takes default bpm from setting [#25](https://github.com/stevenaeola/node-red-contrib-music/issues/25)
- [**enhancement**] sampler has timestamp [#19](https://github.com/stevenaeola/node-red-contrib-music/issues/19)
- [**enhancement**] sampler has volume control [#18](https://github.com/stevenaeola/node-red-contrib-music/issues/18)
- [**enhancement**] sequencer uses chord names I, IV, V etc [#11](https://github.com/stevenaeola/node-red-contrib-music/issues/11)
- [**enhancement**] sample has better name than "load" [#10](https://github.com/stevenaeola/node-red-contrib-music/issues/10)
- [**enhancement**] non-percussive synth sounds with number of beats [#8](https://github.com/stevenaeola/node-red-contrib-music/issues/8)
- [**enhancement**] Make sequencer hold for indefinite period with "next" input [#6](https://github.com/stevenaeola/node-red-contrib-music/issues/6)
- [**enhancement**] sampler and looper have OSC timestamp [#5](https://github.com/stevenaeola/node-red-contrib-music/issues/5)
- [**enhancement**] sampler has pitch control [#4](https://github.com/stevenaeola/node-red-contrib-music/issues/4)
- [**enhancement**] sequencer has range of output options [#2](https://github.com/stevenaeola/node-red-contrib-music/issues/2)
- [**enhancement**] separate oneshot sampler (e.g. for SuperDirt) from loop [#1](https://github.com/stevenaeola/node-red-contrib-music/issues/1)

---

## vv2.0.1 (27/12/2020)

#### bug

- [**bug**] sonic-pi synthdefs should be sent by supercollider [#101](https://github.com/stevenaeola/node-red-contrib-music/issues/101)
- [**bug**] tabla_ghe1 sample should be mono [#93](https://github.com/stevenaeola/node-red-contrib-music/issues/93)
- [**bug**] setting node should clear value when closed [#92](https://github.com/stevenaeola/node-red-contrib-music/issues/92)
- [**bug**] volume setting with flow context should work [#90](https://github.com/stevenaeola/node-red-contrib-music/issues/90)
- [**bug**] elec_blip and elec_blip2 should be mono [#88](https://github.com/stevenaeola/node-red-contrib-music/issues/88)
- [**bug**] Volume control in example is not global [#87](https://github.com/stevenaeola/node-red-contrib-music/issues/87)
- [**bug**] misc_crow synth should be mono [#86](https://github.com/stevenaeola/node-red-contrib-music/issues/86)
- [**bug**] bd_fat synth should be mono [#79](https://github.com/stevenaeola/node-red-contrib-music/issues/79)
- [**bug**] Loading samples doesn't work on Windows [#77](https://github.com/stevenaeola/node-red-contrib-music/issues/77)
- [**bug**] Synth node does not list synthtypes [#74](https://github.com/stevenaeola/node-red-contrib-music/issues/74)
- [**bug**] Global bpm has no effect [#57](https://github.com/stevenaeola/node-red-contrib-music/issues/57)
- [**bug**] Match mono/stereo sample synths to sample types [#56](https://github.com/stevenaeola/node-red-contrib-music/issues/56)
- [**bug**] Missing synths: soundfx nodes and recordSampleMono [#49](https://github.com/stevenaeola/node-red-contrib-music/issues/49)
- [**bug**] beat latency doesn't work outside London time zone [#30](https://github.com/stevenaeola/node-red-contrib-music/issues/30)
- [**bug**] settings increases past upper limit when receiving "up" messages [#29](https://github.com/stevenaeola/node-red-contrib-music/issues/29)
- [**bug**] global setting of root affects synths [#24](https://github.com/stevenaeola/node-red-contrib-music/issues/24)
- [**bug**] Message "cannot create sampler synth without buffer" when changing synth type to a sample [#23](https://github.com/stevenaeola/node-red-contrib-music/issues/23)
- [**bug**] synth octave configuration broken [#22](https://github.com/stevenaeola/node-red-contrib-music/issues/22)
- [**bug**] sampler occasionally drops out with "duplicate node ID" error [#21](https://github.com/stevenaeola/node-red-contrib-music/issues/21)
- [**bug**] sequencer should be able to send null values [#20](https://github.com/stevenaeola/node-red-contrib-music/issues/20)
- [**bug**] sequencer should restart after reset [#17](https://github.com/stevenaeola/node-red-contrib-music/issues/17)
- [**bug**] Sampler name should inherit sample name [#16](https://github.com/stevenaeola/node-red-contrib-music/issues/16)
- [**bug**] sequencer doesn't appear modified when changing controls [#12](https://github.com/stevenaeola/node-red-contrib-music/issues/12)
- [**bug**] soundfx has fixed synthid for each fx type to avoid problems with zombie fx synths [#7](https://github.com/stevenaeola/node-red-contrib-music/issues/7)

#### closed

- [**closed**] Setting scale to 'whole tone' in global setting doesn't work [#94](https://github.com/stevenaeola/node-red-contrib-music/issues/94)
- [**closed**] Reconnection of synth requires redeployment [#82](https://github.com/stevenaeola/node-red-contrib-music/issues/82)
- [**closed**] Give synthcontrols as options in synth configuration [#59](https://github.com/stevenaeola/node-red-contrib-music/issues/59)
- [**closed**] Bars start one beat out [#54](https://github.com/stevenaeola/node-red-contrib-music/issues/54)
- [**closed**] Instructions/link for startsc.sh [#46](https://github.com/stevenaeola/node-red-contrib-music/issues/46)
- [**closed**] Remove sample node [#43](https://github.com/stevenaeola/node-red-contrib-music/issues/43)
- [**closed**] Bugs in markdown on npmjs/nodered.org [#42](https://github.com/stevenaeola/node-red-contrib-music/issues/42)
- [**closed**] Find replacements for tidal samples [#39](https://github.com/stevenaeola/node-red-contrib-music/issues/39)
- [**closed**] sustained synths have lengths [#14](https://github.com/stevenaeola/node-red-contrib-music/issues/14)
- [**closed**] Update node help for sequencer [#13](https://github.com/stevenaeola/node-red-contrib-music/issues/13)

#### duplicate

- [**duplicate**][**enhancement**] Tunable samples [#15](https://github.com/stevenaeola/node-red-contrib-music/issues/15)

#### enhancement

- [**enhancement**] Beat generator to have option to auto-start/continue on deployment [#95](https://github.com/stevenaeola/node-red-contrib-music/issues/95)
- [**enhancement**] Allow single-stepping of beat generator [#81](https://github.com/stevenaeola/node-red-contrib-music/issues/81)
- [**enhancement**] status for divide node [#80](https://github.com/stevenaeola/node-red-contrib-music/issues/80)
- [**enhancement**] Add looper component for importing [#76](https://github.com/stevenaeola/node-red-contrib-music/issues/76)
- [**enhancement**] Add volume control to looper [#75](https://github.com/stevenaeola/node-red-contrib-music/issues/75)
- [**enhancement**] Add icons for all node types [#72](https://github.com/stevenaeola/node-red-contrib-music/issues/72)
- [**enhancement**] Add extra scale types [#71](https://github.com/stevenaeola/node-red-contrib-music/issues/71)
- [**enhancement**] Add documentation for soundfx node [#70](https://github.com/stevenaeola/node-red-contrib-music/issues/70)
- [**enhancement**] Add flanger soundfx [#68](https://github.com/stevenaeola/node-red-contrib-music/issues/68)
- [**enhancement**] Add distortion soundfx [#66](https://github.com/stevenaeola/node-red-contrib-music/issues/66)
- [**enhancement**] Add envelope to samples so they don't overlay [#65](https://github.com/stevenaeola/node-red-contrib-music/issues/65)
- [**enhancement**] Allow additions to sequencer values (e.g. notes, note lengths) with incoming messages [#63](https://github.com/stevenaeola/node-red-contrib-music/issues/63)
- [**enhancement**] Make all synths use sonic-pi format [#61](https://github.com/stevenaeola/node-red-contrib-music/issues/61)
- [**enhancement**] Reduce download size [#55](https://github.com/stevenaeola/node-red-contrib-music/issues/55)
- [**enhancement**] Use beat count to self-terminate looper synthdefs : no need to store ID [#52](https://github.com/stevenaeola/node-red-contrib-music/issues/52)
- [**enhancement**] Master - slave synchronization via websockets [#51](https://github.com/stevenaeola/node-red-contrib-music/issues/51)
- [**enhancement**] Beat synchronization using arbitrary data via tap-tempo input [#50](https://github.com/stevenaeola/node-red-contrib-music/issues/50)
- [**enhancement**] Categorise samples and allow search from selector [#48](https://github.com/stevenaeola/node-red-contrib-music/issues/48)
- [**enhancement**] Integrate Berkeley/beat nodes for sync [#47](https://github.com/stevenaeola/node-red-contrib-music/issues/47)
- [**enhancement**] Make build process for scsynths [#44](https://github.com/stevenaeola/node-red-contrib-music/issues/44)
- [**enhancement**] Use global volume for synths [#40](https://github.com/stevenaeola/node-red-contrib-music/issues/40)
- [**enhancement**] Allow output of fx to another fx [#38](https://github.com/stevenaeola/node-red-contrib-music/issues/38)
- [**enhancement**] Use sonic-pi synths [#36](https://github.com/stevenaeola/node-red-contrib-music/issues/36)
- [**enhancement**] Give soundfx nodes initial fxcontrol values in configuration [#34](https://github.com/stevenaeola/node-red-contrib-music/issues/34)
- [**enhancement**] Label all nodes' input and outputs [#33](https://github.com/stevenaeola/node-red-contrib-music/issues/33)
- [**enhancement**] make note length work with bpm and length of tick (e.g. bar) [#32](https://github.com/stevenaeola/node-red-contrib-music/issues/32)
- [**enhancement**] sequencer should have separate output for one-off control events [#31](https://github.com/stevenaeola/node-red-contrib-music/issues/31)
- [**enhancement**] Use global setting for bpm in synth and beat [#27](https://github.com/stevenaeola/node-red-contrib-music/issues/27)
- [**enhancement**] Make sid sample synth tuned [#26](https://github.com/stevenaeola/node-red-contrib-music/issues/26)
- [**enhancement**] beat generator takes default bpm from setting [#25](https://github.com/stevenaeola/node-red-contrib-music/issues/25)
- [**enhancement**] sampler has timestamp [#19](https://github.com/stevenaeola/node-red-contrib-music/issues/19)
- [**enhancement**] sampler has volume control [#18](https://github.com/stevenaeola/node-red-contrib-music/issues/18)
- [**enhancement**] sequencer uses chord names I, IV, V etc [#11](https://github.com/stevenaeola/node-red-contrib-music/issues/11)
- [**enhancement**] sample has better name than "load" [#10](https://github.com/stevenaeola/node-red-contrib-music/issues/10)
- [**enhancement**] non-percussive synth sounds with number of beats [#8](https://github.com/stevenaeola/node-red-contrib-music/issues/8)
- [**enhancement**] Make sequencer hold for indefinite period with "next" input [#6](https://github.com/stevenaeola/node-red-contrib-music/issues/6)
- [**enhancement**] sampler and looper have OSC timestamp [#5](https://github.com/stevenaeola/node-red-contrib-music/issues/5)
- [**enhancement**] sampler has pitch control [#4](https://github.com/stevenaeola/node-red-contrib-music/issues/4)
- [**enhancement**] sequencer has range of output options [#2](https://github.com/stevenaeola/node-red-contrib-music/issues/2)
- [**enhancement**] separate oneshot sampler (e.g. for SuperDirt) from loop [#1](https://github.com/stevenaeola/node-red-contrib-music/issues/1)

---

## vv2.1.0 (27/12/2020)

#### bug

- [**bug**] sonic-pi synthdefs should be sent by supercollider [#101](https://github.com/stevenaeola/node-red-contrib-music/issues/101)
- [**bug**] tabla_ghe1 sample should be mono [#93](https://github.com/stevenaeola/node-red-contrib-music/issues/93)
- [**bug**] setting node should clear value when closed [#92](https://github.com/stevenaeola/node-red-contrib-music/issues/92)
- [**bug**] volume setting with flow context should work [#90](https://github.com/stevenaeola/node-red-contrib-music/issues/90)
- [**bug**] elec_blip and elec_blip2 should be mono [#88](https://github.com/stevenaeola/node-red-contrib-music/issues/88)
- [**bug**] Volume control in example is not global [#87](https://github.com/stevenaeola/node-red-contrib-music/issues/87)
- [**bug**] misc_crow synth should be mono [#86](https://github.com/stevenaeola/node-red-contrib-music/issues/86)
- [**bug**] bd_fat synth should be mono [#79](https://github.com/stevenaeola/node-red-contrib-music/issues/79)
- [**bug**] Loading samples doesn't work on Windows [#77](https://github.com/stevenaeola/node-red-contrib-music/issues/77)
- [**bug**] Synth node does not list synthtypes [#74](https://github.com/stevenaeola/node-red-contrib-music/issues/74)
- [**bug**] Global bpm has no effect [#57](https://github.com/stevenaeola/node-red-contrib-music/issues/57)
- [**bug**] Match mono/stereo sample synths to sample types [#56](https://github.com/stevenaeola/node-red-contrib-music/issues/56)
- [**bug**] Missing synths: soundfx nodes and recordSampleMono [#49](https://github.com/stevenaeola/node-red-contrib-music/issues/49)
- [**bug**] beat latency doesn't work outside London time zone [#30](https://github.com/stevenaeola/node-red-contrib-music/issues/30)
- [**bug**] settings increases past upper limit when receiving "up" messages [#29](https://github.com/stevenaeola/node-red-contrib-music/issues/29)
- [**bug**] global setting of root affects synths [#24](https://github.com/stevenaeola/node-red-contrib-music/issues/24)
- [**bug**] Message "cannot create sampler synth without buffer" when changing synth type to a sample [#23](https://github.com/stevenaeola/node-red-contrib-music/issues/23)
- [**bug**] synth octave configuration broken [#22](https://github.com/stevenaeola/node-red-contrib-music/issues/22)
- [**bug**] sampler occasionally drops out with "duplicate node ID" error [#21](https://github.com/stevenaeola/node-red-contrib-music/issues/21)
- [**bug**] sequencer should be able to send null values [#20](https://github.com/stevenaeola/node-red-contrib-music/issues/20)
- [**bug**] sequencer should restart after reset [#17](https://github.com/stevenaeola/node-red-contrib-music/issues/17)
- [**bug**] Sampler name should inherit sample name [#16](https://github.com/stevenaeola/node-red-contrib-music/issues/16)
- [**bug**] sequencer doesn't appear modified when changing controls [#12](https://github.com/stevenaeola/node-red-contrib-music/issues/12)
- [**bug**] soundfx has fixed synthid for each fx type to avoid problems with zombie fx synths [#7](https://github.com/stevenaeola/node-red-contrib-music/issues/7)

#### closed

- [**closed**] Setting scale to 'whole tone' in global setting doesn't work [#94](https://github.com/stevenaeola/node-red-contrib-music/issues/94)
- [**closed**] Reconnection of synth requires redeployment [#82](https://github.com/stevenaeola/node-red-contrib-music/issues/82)
- [**closed**] Give synthcontrols as options in synth configuration [#59](https://github.com/stevenaeola/node-red-contrib-music/issues/59)
- [**closed**] Bars start one beat out [#54](https://github.com/stevenaeola/node-red-contrib-music/issues/54)
- [**closed**] Instructions/link for startsc.sh [#46](https://github.com/stevenaeola/node-red-contrib-music/issues/46)
- [**closed**] Remove sample node [#43](https://github.com/stevenaeola/node-red-contrib-music/issues/43)
- [**closed**] Bugs in markdown on npmjs/nodered.org [#42](https://github.com/stevenaeola/node-red-contrib-music/issues/42)
- [**closed**] Find replacements for tidal samples [#39](https://github.com/stevenaeola/node-red-contrib-music/issues/39)
- [**closed**] sustained synths have lengths [#14](https://github.com/stevenaeola/node-red-contrib-music/issues/14)
- [**closed**] Update node help for sequencer [#13](https://github.com/stevenaeola/node-red-contrib-music/issues/13)

#### duplicate

- [**duplicate**][**enhancement**] Tunable samples [#15](https://github.com/stevenaeola/node-red-contrib-music/issues/15)

#### enhancement

- [**enhancement**] Beat generator to have option to auto-start/continue on deployment [#95](https://github.com/stevenaeola/node-red-contrib-music/issues/95)
- [**enhancement**] Allow single-stepping of beat generator [#81](https://github.com/stevenaeola/node-red-contrib-music/issues/81)
- [**enhancement**] status for divide node [#80](https://github.com/stevenaeola/node-red-contrib-music/issues/80)
- [**enhancement**] Add looper component for importing [#76](https://github.com/stevenaeola/node-red-contrib-music/issues/76)
- [**enhancement**] Add volume control to looper [#75](https://github.com/stevenaeola/node-red-contrib-music/issues/75)
- [**enhancement**] Add icons for all node types [#72](https://github.com/stevenaeola/node-red-contrib-music/issues/72)
- [**enhancement**] Add extra scale types [#71](https://github.com/stevenaeola/node-red-contrib-music/issues/71)
- [**enhancement**] Add documentation for soundfx node [#70](https://github.com/stevenaeola/node-red-contrib-music/issues/70)
- [**enhancement**] Add flanger soundfx [#68](https://github.com/stevenaeola/node-red-contrib-music/issues/68)
- [**enhancement**] Add distortion soundfx [#66](https://github.com/stevenaeola/node-red-contrib-music/issues/66)
- [**enhancement**] Add envelope to samples so they don't overlay [#65](https://github.com/stevenaeola/node-red-contrib-music/issues/65)
- [**enhancement**] Allow additions to sequencer values (e.g. notes, note lengths) with incoming messages [#63](https://github.com/stevenaeola/node-red-contrib-music/issues/63)
- [**enhancement**] Make all synths use sonic-pi format [#61](https://github.com/stevenaeola/node-red-contrib-music/issues/61)
- [**enhancement**] Reduce download size [#55](https://github.com/stevenaeola/node-red-contrib-music/issues/55)
- [**enhancement**] Use beat count to self-terminate looper synthdefs : no need to store ID [#52](https://github.com/stevenaeola/node-red-contrib-music/issues/52)
- [**enhancement**] Master - slave synchronization via websockets [#51](https://github.com/stevenaeola/node-red-contrib-music/issues/51)
- [**enhancement**] Beat synchronization using arbitrary data via tap-tempo input [#50](https://github.com/stevenaeola/node-red-contrib-music/issues/50)
- [**enhancement**] Categorise samples and allow search from selector [#48](https://github.com/stevenaeola/node-red-contrib-music/issues/48)
- [**enhancement**] Integrate Berkeley/beat nodes for sync [#47](https://github.com/stevenaeola/node-red-contrib-music/issues/47)
- [**enhancement**] Make build process for scsynths [#44](https://github.com/stevenaeola/node-red-contrib-music/issues/44)
- [**enhancement**] Use global volume for synths [#40](https://github.com/stevenaeola/node-red-contrib-music/issues/40)
- [**enhancement**] Allow output of fx to another fx [#38](https://github.com/stevenaeola/node-red-contrib-music/issues/38)
- [**enhancement**] Use sonic-pi synths [#36](https://github.com/stevenaeola/node-red-contrib-music/issues/36)
- [**enhancement**] Give soundfx nodes initial fxcontrol values in configuration [#34](https://github.com/stevenaeola/node-red-contrib-music/issues/34)
- [**enhancement**] Label all nodes' input and outputs [#33](https://github.com/stevenaeola/node-red-contrib-music/issues/33)
- [**enhancement**] make note length work with bpm and length of tick (e.g. bar) [#32](https://github.com/stevenaeola/node-red-contrib-music/issues/32)
- [**enhancement**] sequencer should have separate output for one-off control events [#31](https://github.com/stevenaeola/node-red-contrib-music/issues/31)
- [**enhancement**] Use global setting for bpm in synth and beat [#27](https://github.com/stevenaeola/node-red-contrib-music/issues/27)
- [**enhancement**] Make sid sample synth tuned [#26](https://github.com/stevenaeola/node-red-contrib-music/issues/26)
- [**enhancement**] beat generator takes default bpm from setting [#25](https://github.com/stevenaeola/node-red-contrib-music/issues/25)
- [**enhancement**] sampler has timestamp [#19](https://github.com/stevenaeola/node-red-contrib-music/issues/19)
- [**enhancement**] sampler has volume control [#18](https://github.com/stevenaeola/node-red-contrib-music/issues/18)
- [**enhancement**] sequencer uses chord names I, IV, V etc [#11](https://github.com/stevenaeola/node-red-contrib-music/issues/11)
- [**enhancement**] sample has better name than "load" [#10](https://github.com/stevenaeola/node-red-contrib-music/issues/10)
- [**enhancement**] non-percussive synth sounds with number of beats [#8](https://github.com/stevenaeola/node-red-contrib-music/issues/8)
- [**enhancement**] Make sequencer hold for indefinite period with "next" input [#6](https://github.com/stevenaeola/node-red-contrib-music/issues/6)
- [**enhancement**] sampler and looper have OSC timestamp [#5](https://github.com/stevenaeola/node-red-contrib-music/issues/5)
- [**enhancement**] sampler has pitch control [#4](https://github.com/stevenaeola/node-red-contrib-music/issues/4)
- [**enhancement**] sequencer has range of output options [#2](https://github.com/stevenaeola/node-red-contrib-music/issues/2)
- [**enhancement**] separate oneshot sampler (e.g. for SuperDirt) from loop [#1](https://github.com/stevenaeola/node-red-contrib-music/issues/1)

---

## yv1.3.5 (01/09/2019)

#### bug

- [**bug**] Loading samples doesn't work on Windows [#77](https://github.com/stevenaeola/node-red-contrib-music/issues/77)

#### enhancement

- [**enhancement**] Add looper component for importing [#76](https://github.com/stevenaeola/node-red-contrib-music/issues/76)
- [**enhancement**] Add volume control to looper [#75](https://github.com/stevenaeola/node-red-contrib-music/issues/75)
- [**enhancement**] Use beat count to self-terminate looper synthdefs : no need to store ID [#52](https://github.com/stevenaeola/node-red-contrib-music/issues/52)

---

## yv1.3.4 (17/06/2019)

#### bug

- [**bug**] Synth node does not list synthtypes [#74](https://github.com/stevenaeola/node-red-contrib-music/issues/74)

---

## yv1.3.3 (26/05/2019)
*No changelog for this release.*

---

## yv1.3.2 (08/05/2019)

#### enhancement

- [**enhancement**] Add icons for all node types [#72](https://github.com/stevenaeola/node-red-contrib-music/issues/72)

---

## yv1.3.1 (26/04/2019)
*No changelog for this release.*

---

## yv1.3.0 (24/04/2019)

#### bug

- [**bug**] Global bpm has no effect [#57](https://github.com/stevenaeola/node-red-contrib-music/issues/57)
- [**bug**] Match mono/stereo sample synths to sample types [#56](https://github.com/stevenaeola/node-red-contrib-music/issues/56)

#### closed

- [**closed**] Give synthcontrols as options in synth configuration [#59](https://github.com/stevenaeola/node-red-contrib-music/issues/59)

#### enhancement

- [**enhancement**] Add extra scale types [#71](https://github.com/stevenaeola/node-red-contrib-music/issues/71)
- [**enhancement**] Add documentation for soundfx node [#70](https://github.com/stevenaeola/node-red-contrib-music/issues/70)
- [**enhancement**] Add flanger soundfx [#68](https://github.com/stevenaeola/node-red-contrib-music/issues/68)
- [**enhancement**] Add distortion soundfx [#66](https://github.com/stevenaeola/node-red-contrib-music/issues/66)
- [**enhancement**] Add envelope to samples so they don't overlay [#65](https://github.com/stevenaeola/node-red-contrib-music/issues/65)
- [**enhancement**] Make all synths use sonic-pi format [#61](https://github.com/stevenaeola/node-red-contrib-music/issues/61)
- [**enhancement**] Reduce download size [#55](https://github.com/stevenaeola/node-red-contrib-music/issues/55)
- [**enhancement**] Categorise samples and allow search from selector [#48](https://github.com/stevenaeola/node-red-contrib-music/issues/48)
- [**enhancement**] Make build process for scsynths [#44](https://github.com/stevenaeola/node-red-contrib-music/issues/44)
- [**enhancement**] Use global volume for synths [#40](https://github.com/stevenaeola/node-red-contrib-music/issues/40)
- [**enhancement**] Use sonic-pi synths [#36](https://github.com/stevenaeola/node-red-contrib-music/issues/36)
- [**enhancement**] Give soundfx nodes initial fxcontrol values in configuration [#34](https://github.com/stevenaeola/node-red-contrib-music/issues/34)
- [**enhancement**] Label all nodes' input and outputs [#33](https://github.com/stevenaeola/node-red-contrib-music/issues/33)
- [**enhancement**] Make sid sample synth tuned [#26](https://github.com/stevenaeola/node-red-contrib-music/issues/26)

---

## yv1.2.1 (31/03/2019)

#### bug

- [**bug**] beat latency doesn't work outside London time zone [#30](https://github.com/stevenaeola/node-red-contrib-music/issues/30)

#### closed

- [**closed**] Bars start one beat out [#54](https://github.com/stevenaeola/node-red-contrib-music/issues/54)
- [**closed**] Update node help for sequencer [#13](https://github.com/stevenaeola/node-red-contrib-music/issues/13)

#### enhancement

- [**enhancement**] Beat synchronization using arbitrary data via tap-tempo input [#50](https://github.com/stevenaeola/node-red-contrib-music/issues/50)

---

## yv1.2.0 (17/03/2019)
- [beat can be started with 'tap' messages, allowing synchronisation. closes #50](https://github.com/stevenaeola/node-red-contrib-music/commit/1f5adfc3c1701534ec96861897b35bc7f69e7429) - @stevenaeola
- [Update manifesto](https://github.com/stevenaeola/node-red-contrib-music/commit/49837a3062a37b0dd4ab0ca024d2a93e8cc71600) - undefined
- [Added rationale/manifesto](https://github.com/stevenaeola/node-red-contrib-music/commit/d5489df2cea4543c9973d9d6b5817a87a521010a) - undefined
- [code tidy: remove unused files and lint all .js files](https://github.com/stevenaeola/node-red-contrib-music/commit/c116ce69e3574b035b00d673e3896ccb31c699ad) - @stevenaeola
- [looper works with sounfx, synth linted](https://github.com/stevenaeola/node-red-contrib-music/commit/df21bdd3fef7a0c6a6b37763117c1f27eecaba19) - @stevenaeola
- [eslint beat.js](https://github.com/stevenaeola/node-red-contrib-music/commit/da2fcaa36a66af82c90edab47bbe9a6b61c7b2c2) - @stevenaeola
- [looper works with latency](https://github.com/stevenaeola/node-red-contrib-music/commit/2c1b425fd9de9d6916497af42c7b55349f7f942e) - @stevenaeola
- [eslint supercollider.js](https://github.com/stevenaeola/node-red-contrib-music/commit/e4c4153044bc31edca63667564e43f8bf57e9384) - @stevenaeola
- [eslint on looper.js](https://github.com/stevenaeola/node-red-contrib-music/commit/f5c2e169135ddb12a8369fe143f8a719b68392e5) - @stevenaeola
- [refactor with supercollider.js](https://github.com/stevenaeola/node-red-contrib-music/commit/70c39604efcaa15bb0193917b3c68df40ff1084f) - @stevenaeola
- [refactor shared code into supercollider.js](https://github.com/stevenaeola/node-red-contrib-music/commit/095874c4976c3292062f181b7c17cdaa603dd0f1) - @stevenaeola
- [looper works in stereo](https://github.com/stevenaeola/node-red-contrib-music/commit/cb63e8734d88a45e362d1cbae51fe856bcc8281f) - @stevenaeola
- [fixed start of beat on follower so that sub-beats work properly](https://github.com/stevenaeola/node-red-contrib-music/commit/bea24452d924046f5bee859c7b8ca76cb398d4b2) - @stevenaeola
