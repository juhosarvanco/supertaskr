---
id: C-13
name: Genesis pane
layer: app
paths:
  - app/src/genesis/**
  # The seven tests that exercise the interview and the lens, routed out
  # of C-05's test umbrella at T-149. Every one drives `src/genesis/**`
  # plus C-10 and C-14, both already declared above. The four
  # genesis-named tests that are NOT here mount `App.tsx` or
  # `components/shell/GenesisScreen.tsx` — their subject is the SHELL's
  # mount, boundary and switch, so they stay C-05's.
  - app/test/crescendo.test.ts
  - app/test/genesis-derive.test.ts
  - app/test/genesis-pane-dom.test.tsx
  - app/test/interview-chat-dom.test.tsx
  - app/test/interview-harness.test.ts
  - app/test/interview-model.test.ts
  - app/test/interview-resume-dom.test.tsx
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
