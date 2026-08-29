# Roadmap

Compacted 2026-08-27 under ADR-019 (docs/rooms/governing-docs.md). The
contract: one present-tense paragraph per feature — capability now,
what is next, card ids — and at most one new sentence per feature per
merge, absorbed into the paragraph at the next edit. The story of any
merge lives on its card; the exact behaviour census is
docs/CAPABILITIES.md (generated, currency-checked); the pre-compaction
file, 1,199 lines of per-card chronicle, is permanently readable at
`git show 08aef1c:docs/ROADMAP.md`, and every paragraph it carried
opens with the card id that still holds its story.

## Backbone (revised per ADR-008 — app-first)

- F-01: Method — the convention itself (method/), usable by hand.
  Runs this project daily: lanes, fences, verdicts, checkpoints, and
  since ADR-019 (2026-08-27) the three-tier governing-docs contract
  this file itself is under. The corrected read-first set reaches new
  projects (T-145) and the behaviour census is GENERATED rather than
  written (docs/CAPABILITIES.md, T-138-s1) — @human's T-138 ruling
  delivered. What the set costs and why is the room's ledger; the
  docs-protocol is in method/ at v0.1.7, so every future genesis
  inherits the contract. Since ADR-020 (2026-08-29, from the
  AI-native-SDLC comparison) the next layer is ratified: determinism
  at the moment of the write (T-154), a method that measures itself
  (T-155), health bands over its own numbers (T-156) — org-scale by
  construction, nothing org-shaped built before a second team exists.
  ADR-018 stays owed to T-135 Half B.
- F-02: App shell + board — Tauri app, read-only story map rendered
  beautifully from files
  Shipped and in daily use: the board renders this repository's own
  plan live off the docs watcher, one bounded scroll model on every
  screen (T-062), a declared window minimum (T-051), diagnostics that
  stay reachable (T-066). Hardening continues as inherited backlog —
  the F-02 cards riding milestone 4 — with `app-shell`'s
  umbrella-fence cost just cut by T-149. Next: T-149-s1…s5.
- F-03: In-app genesis — planning interview as split view (planner
  chat + board materializing live); archaeology variant
  The screen is a conversation (T-027): ask, answer, watch the answer
  become a file and the files become cards, then one button lands you
  on your new board (T-028). Chips come from the WATCHER seeing files,
  never from what the model said (ADR-017); resume, fresh-session and
  CLI-less kickoff all exist (T-029); the runner is hardened —
  validated session ids (T-039), probe-only CLI resolution (T-060),
  fast honest cancel (T-043), typed failures that never cost a user an
  affordance (T-069/T-101/T-102/T-107/T-113). THE GATE THAT REMAINS is
  not a card: no planner turn has ever run against a real model —
  every stream ever seen is a fixture. `T-025-s2`, @human's, one real
  timed genesis on an authenticated machine. The archaeology variant
  stays parked (ADR-005).
- F-04: Dispatch — worktrees, model@session, verify/merge, from the
  board; CLI as plumbing/power path
  The board reads its own lanes off git's files with no subprocess
  (T-110, made real by T-126), derives per-card dispositions with
  REASONS a human can argue with (T-111), and the brief is a written
  contract (T-089) a program assembles (dispatch-brief.mjs). The
  named slice — "dispatch without writing the prompt" — deliberately
  spawns nothing. Next: T-112 hands you the brief and lane commands
  from the board (the slice's third clause); it is also the board's
  most colliding card — derive the flip pairs first. Open rulings:
  D3 (may the app write into docs/?) and D5 (`model@session`
  per-adapter, from the cockpit-or-mirror room).
- F-05: Rooms, sessions & daemon — @mention routing, resolutions,
  registry pane
  Not started; follower-first ordering ruled in
  rooms/cockpit-or-mirror.md — the in-app orchestrator conversation
  comes after F-04's spawn path.
- F-06: Architecture map — intent + reality overlaid, drift as a
  first-class signal (docs/design/map-technical-plan.md, ADR-013/014/
  015; added 2026-08-15, sequencing open in rooms/map-sequencing.md).
  Two lenses behind one control (architecture · tasks, T-034), zoom
  and churn (T-013), churn that forgets on project switch (T-116),
  Rust on the map (T-010), and the map honest about ITSELF: findings
  cut 15 → 3 by declaring what was real (T-033), `arch
  cycles`/`drift`/`blast` reach the command line (T-014/T-127/T-135),
  the indexer degrades instead of aborting on hostile input (T-129),
  and the graph budget carries a measured reason — 1,040,000 bytes,
  T-139 — whose HEADROOM is the number nothing reports: derive it
  with `index --check`, never quote it. Since T-092 and T-093
  (2026-08-27) the poison-drill taxonomy and the hand's measurement
  hazards are written rules — a query that runs clean is not yet an
  answer. Next: T-140 (the ~802 bytes-per-file floor caps the map at
  ~1,000 files — the real constraint on pointing nputer at a big
  codebase), and the budget VALUE call now rides `T-151`.

## Milestones

### Milestone 0 — planning (current)
Goal: interview completed, milestone 1 decomposed into exact tasks.
- [x] Convention v0.1.3 (EARS, touches, security sweep, succession,
      suggestions, room resolutions)
- [x] Market map + steal list (docs/research/competitors.md)
- [x] Interview complete, Q1–Q7 (rooms/first-user.md; NORTH_STAR)
- [x] Name decided: nputer (rooms/naming.md; npm/PyPI free)
- [ ] Domain + trademark sweep for "nputer"
- [x] Decomposition pass → docs/tasks/ T-001…T-007

### Milestone 1 — the mirror (scoped 2026-08-14, interview Q7)
Goal: open the nputer app and watch nputer being built on its own
board — read-only story map of this repo; the method run by hand
underneath. Progress: COMPLETE 2026-08-15, T-001…T-007 through the
pipeline.

### Milestone 2 — the map slice (decided 2026-08-15, rooms/map-sequencing.md)
Goal: the architecture map's vertical slice on nputer's own repo.
Progress: COMPLETE 2026-08-15, T-008 → T-009 → T-011 → T-012; the map
renders the repo's own drift.

### Milestone 3 — in-app genesis (F-03)
Goal: the planning interview as split view; decomposed at its own
/plan review (ADR-017). Tasks: T-023…T-029 plus the hardening train —
every card is through the pipeline, and the arc a user walks is
continuous: open a folder with no plan → be asked → answer → watch the
answer become a file → watch the files become cards → press one button
and stand in your new board. The full per-card chronicle (what each
merge changed for a user, and what each verification caught) lives on
the cards' own bodies and at `git show 08aef1c:docs/ROADMAP.md`; the
behaviour census is docs/CAPABILITIES.md.
**THE MILESTONE IS NOT COMPLETE AND WHAT IT WAITS ON IS NOT A TASK**:
no planner turn has ever been observed against a real model — this
machine's `claude` OAuth token is revoked, so every stream the app has
ever seen is a scripted fixture. One real, timed, end-to-end genesis
on an authenticated machine (`T-025-s2`, @human) is the whole
remaining gate.

### Milestone 4 — dispatch (F-04) (decided 2026-08-19, @human D1 ruling)
Goal: stop hand-writing the instructions that put an agent to work —
the board reads its own lanes, says which card is dispatchable AND WHY
THE OTHERS ARE NOT, and hands you the exact brief and lane commands.
Deliberately, not one card in it spawns a process (milestone 3's own
hand-driven-first precedent, one role over).
Rulings and standing facts: D1 ruled 2026-08-19; D2 taken (dispatch
is C-15, slug `app-dispatch`); D3 and D5 open. ~80 inherited-backlog
cards carry `milestone: 4` without being slice content — a known,
accepted cost of the ruling; a milestone census and a board census
answer DIFFERENT questions, and neither is this file's to transcribe.
Progress: DERIVE IT — cross `^feature: F-04$` with each card's own
`^status:` over `docs/tasks/`; the transcribed fraction went stale
here under work nobody's merge did, repeatedly, which is why this line
is now a command. The slice's remaining clause is T-112's brief.

## Parked

The staged future lives in docs/future.md (two expert-room batches:
v0.2 cost telemetry, retro role, sandboxing, pocket cockpit; v0.3
N-version, spec red team, time machine, handoff score, dry run;
horizon: truth maintenance, production feedback, synthetic users,
seeds, explainer, proof of process). Nothing there enters scope until
the first real project run — one recorded exception: the
architecture-drift slice of truth maintenance was pulled forward into
F-06 v1 by human directive (ADR-013, 2026-08-15). Also parked:
archaeology/Adopt variant — after the first real greenfield genesis
run (reuses the F-03 runner + split view wholesale; ADR-005).
