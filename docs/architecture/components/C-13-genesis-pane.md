---
id: C-13
name: Genesis pane
layer: app
paths:
  - app/src/genesis/**
depends_on: [C-06, C-08, C-10, C-11, C-14, C-16]
decisions: [ADR-006, ADR-017]
status: auto
touch_slugs: [app-interview]
---
The interview screen's right half — "the project, so far" (F-03).
A pure lens over the docs tree as it materializes: a deterministic
derivation (artifact status, approximate banking stage, north-star
card, backbone entries) feeding a read-only pane. Driver-agnostic by
construction — it renders whatever lands in docs/, whether written by
the spawned planner or by a human hand-driving the method in a
terminal (ADR-017's lens half; ADR-006's evidence instrument).
Data arrives on C-10's existing watcher path: no polling, no IPC of
its own. Never writes. The shell mount point arrives with T-026.
