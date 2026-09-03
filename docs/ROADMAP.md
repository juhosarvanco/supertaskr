# Roadmap

Compacted 2026-08-27 under ADR-019 (docs/rooms/governing-docs.md),
RE-LANDED 2026-08-30 by T-162 whose addendum to ADR-019 carries the new
gate values. The contract: one present-tense paragraph per feature —
capability now, what is next, card ids — and at most one new sentence
per feature per merge, absorbed into the paragraph at the next edit.
**A MERGE'S STORY IS ITS CARD'S AND ITS CHECKPOINT RECORD'S, NEVER
THIS FILE'S**: docs/checkpoints/ holds one record per integration and
a card id here is the pointer to both. The exact behaviour census is
docs/CAPABILITIES.md (generated, currency-checked); the pre-compaction
file, 1,199 lines of per-card chronicle, is permanently readable at
`git show 08aef1c:docs/ROADMAP.md`, and every paragraph it carried
opens with the card id that still holds its story.

## Backbone (revised per ADR-008 — app-first)

- F-01: Method — the convention itself (method/), usable by hand.
  Runs this project daily: lanes, fences, verdicts, checkpoints, and
  since ADR-019 (2026-08-27) the three-tier governing-docs contract
  this file itself is under. The behaviour census is GENERATED rather
  than written (docs/CAPABILITIES.md, T-138-s1) and the corrected
  read-first set reaches new projects (T-145). ADR-020's layer is
  LANDED (2026-08-29) — determinism at the write (T-154), the method
  redding its own degradation (T-155: every bump owes the eval block),
  health bands over its own metrics (T-156) — and ADR-018 LANDED
  (2026-08-30, T-135 Half B: blast-radius rungs ADVISORY, binding at
  the measured flip). Suggestion arrivals queue for T-159's metabolism
  rules, never a second amnesty. **THE LIVE METHOD VERSION IS
  CONVENTIONS' FIRST-GOTCHA STAMP AND IS NEVER QUOTED HERE**; what a
  bump moved is on its release card and that card's checkpoint
  (v0.1.8: T-159). The second CONVENTIONS compaction landed
  2026-09-02 (T-236: 160,043 to 117,505 bytes, every program-read
  sentence byte-identical, the budget re-landed), and the census
  regeneration has an owner (T-201). The rest of the ledger — T-158's human front door,
  the amnesty sitting's dispositions, T-153-s6/s9's CI first-contact
  classes and the first fully green run, T-157's derived seat-strength
  row — is one record per merge in docs/checkpoints/. Next: T-140-s1.
- F-02: App shell + board — Tauri app, read-only story map rendered
  beautifully from files
  Shipped and in daily use: the board renders this repository's own
  plan live off the docs watcher, one bounded scroll model on every
  screen (T-062), a declared window minimum (T-051), diagnostics that
  stay reachable (T-066). Hardening continues as inherited backlog —
  the F-02 cards riding milestone 4 — with `app-shell`'s
  umbrella-fence cost cut by T-149, and the docs watcher's live tests
  awaiting the CONVERGED state across platforms (T-153). Next:
  T-149-s1…s5.
  The watcher's re-arm ordering is pinned as the watcher promises it
  (T-018-s2), and the pick reply and the startup pull ask the genesis
  switch's own overtake question, so an older snapshot with a higher
  seq never overwrites an emit that overtook it (T-018-s5, T-018-s6).
- F-03: In-app genesis — planning interview as split view (planner
  chat + board materializing live); archaeology variant
  The screen is a conversation (T-027): ask, answer, watch the answer
  become a file and the files become cards, then one button lands you
  on your new board (T-028). Chips come from the WATCHER seeing files,
  never from what the model said (ADR-017); resume, fresh-session and
  CLI-less kickoff all exist (T-029); the runner is hardened —
  validated session ids (T-039), probe-only CLI resolution (T-060),
  fast honest cancel (T-043), typed failures that never cost a user an
  affordance (T-069/T-101/T-102/T-107/T-113), and nothing the runner
  hands execve is unbounded (T-153-s2). THE GATE THAT REMAINS is
  milestone 3's, stated there and not restated here. The archaeology
  variant stays parked (ADR-005). The interview ships as ONE
  interview in two lenses — a skill in the agent app and this split
  view, one prompt, one file contract (ADR-021, T-242).
- F-04: Dispatch — worktrees, model@session, verify/merge, from the
  board; CLI as plumbing/power path
  The board reads its own lanes off git's files with no subprocess
  (T-110, made real by T-126), derives per-card dispositions with
  REASONS a human can argue with (T-111), and the brief is a written
  contract (T-089) a program assembles (dispatch-brief.mjs); the
  named slice deliberately spawns nothing. The fence is a PROPERTY at
  the write (T-154 — a dispatch-stamped manifest, a zero-dependency
  hook, hostile-payload verified), and dispatch PREFLIGHTS the card
  itself (T-160 — a failed preflight refuses the manifest). T-112
  LANDED (the board hands you the brief); D3 and D5 RULED 2026-08-30;
  and on 2026-09-03 the seat's chair was ruled for v1 — the architect
  sits in the user's agent app, the app assembles briefs and spawns
  nothing (ADR-021). Next: T-241 (the seat skill), T-244 (`npx nputer`).
- F-05: Rooms, sessions & daemon — @mention routing, resolutions,
  registry pane
  Not started. The in-app orchestrator conversation and any in-app
  spawn path LEFT v1 on 2026-09-03 (ADR-021): rooms stay files under
  the method; the registry pane waits for evidence a user wants it.
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
  with `index --check`, never quote it. The drill taxonomy and the
  hand's measurement hazards are written rules (T-092/T-093 — a query
  that runs clean is not yet an answer), and the budget VALUE call
  was RULED 2026-08-30 (T-151 rejected; T-140-s1 owns the rollup fix,
  now unblocked). Since T-156 the method watches its own health
  (fourteen bands as data with measured reasons, doc-headroom bands
  derived from the budgets). `arch cycles` ANSWERS ACYCLIC on main
  since T-127-s6 (2026-08-29), with C-17/C-18 minted and no import
  severed; the file ceiling PRINTS from `index --check` every run
  (T-140), and an oversize graph tells the map the truth (payload
  shape: T-140-s1, @human's). The 2026-09-02 wave — the landing
  gate's sixth limit and the card derived from the lane branch (T-223),
  preflight of a card's quoted claims and path fences proved disjoint
  (T-230, T-216-s4), method v0.1.9 with demonstrated positive controls
  (T-229), the CI-reading push guard (T-237), the dispatch view under a
  disclosed margin (T-225), refused unfenceable or unresolvable fences
  (T-219), the holder on disk (T-238), blindness as a property of the
  spawn (T-205) — is one record per merge in docs/checkpoints/, the
  fourth Fable sitting record their index.

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
underneath. COMPLETE 2026-08-15, T-001…T-007.

### Milestone 2 — the map slice (decided 2026-08-15, rooms/map-sequencing.md)
Goal: the architecture map's vertical slice on nputer's own repo.
COMPLETE 2026-08-15, T-008 → T-009 → T-011 → T-012.

### Milestone 3 — in-app genesis (F-03)
Goal: the planning interview as split view; decomposed at its own
/plan review (ADR-017). Tasks: T-023…T-029 plus the hardening train —
every card is through the pipeline, and the arc a user walks is
continuous: open a folder with no plan → be asked → answer → watch the
answer become a file → watch the files become cards → press one button
and stand in your new board. The per-card chronicle lives on the
cards' own bodies and at `git show 08aef1c:docs/ROADMAP.md`; the
behaviour census is docs/CAPABILITIES.md.
**COMPLETE 2026-08-30, @human's ruling.** The genesis walk was
performed end to end at `/Users/ujju/Projects/first-walk` — seven
questions, every bank landed, a whole docs/ tree and three cards on a
board — and @human closed the milestone on it. The gate that had been
open (whether one completed planner turn closed it or the full Q1–Q7
walk did) is answered by the walk itself. **What the walk FOUND is
ordinary F-03 work and deliberately does not reopen this milestone**:
the interview has no terminal state (`T-171`), the cold-start test has
no operational owner (`T-175`), two chrome rulings (`T-172`), the
ruled write-up-first direction (`T-173`), and the two systemic kit
defects the walk's own board surfaced (`T-176`, `T-177`). All carry
`milestone: 4`. The walk's record is
docs/checkpoints/2026-08-30-the-genesis-walk.md and its cold-start
capture is in docs/research/captures/.

### Milestone 4 — dispatch (F-04) (decided 2026-08-19, @human D1 ruling)
Goal: stop hand-writing the instructions that put an agent to work —
the board reads its own lanes, says which card is dispatchable AND WHY
THE OTHERS ARE NOT, and hands you the exact brief and lane commands.
Deliberately, not one card in it spawns a process (milestone 3's own
hand-driven-first precedent, one role over).
Rulings and standing facts: D1 ruled 2026-08-19; D2 taken (dispatch
is C-15, slug `app-dispatch`); D3 ruled, D5 open. Most cards carrying
`milestone: 4` are inherited backlog rather than slice content — a
known, accepted cost of the ruling, and the count is a DERIVATION, not
a figure this file keeps; a milestone census and a board census answer
DIFFERENT questions, and neither is this file's to transcribe.
Progress: DERIVE IT — cross `^feature: F-04$` with each card's own
`^status:` over `docs/tasks/`; the transcribed fraction went stale
here under work nobody's merge did, repeatedly, which is why this line
is now a command. The slice's remaining clause is T-112's brief.

## Parked

The staged future — every charter entry and every parked item, by
version — is docs/VERSIONS.md (ruled in rooms/version-planning.md; the
parked texts stay in docs/future.md). Nothing unruled enters scope
until the first real project run — one recorded exception: the
architecture-drift slice of truth maintenance was pulled forward into
F-06 v1 by human directive (ADR-013, 2026-08-15). Also parked:
archaeology/Adopt variant — after the first real greenfield genesis
run (reuses the F-03 runner + split view wholesale; ADR-005).
