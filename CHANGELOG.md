# Changelog

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
