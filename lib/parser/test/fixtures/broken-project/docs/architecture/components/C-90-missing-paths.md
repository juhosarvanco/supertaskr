---
id: C-90
name: Missing my paths
layer: lib
depends_on: []
---
THE component layer SHALL flag my missing paths and still return me — so
this fixture carries an issue from the COMPONENT layer as well as from the
task and roadmap layers, and the disk/pure parity assertion over it holds
the WHOLE declared layer order (task -> roadmap -> component) rather than
the one layer it could see before (T-096).
