# Checkpoint: the rename sitting of 2026-09-08/09 — Supertaskr ruled (ADR-022); T-264 the identifier rename merged with its fence widened by fast path A mid-lane; T-224 landed on its third pass with the verdict's correction performed at the merge; T-265 the prose rename merged with its corrections; the ask channel operated by hand five times; three night lanes cut under @human's night mandate

## Merge

@human ruled the name at 16:2xZ (*"Supertaskr it is. without the e."*),
cleared the marks (*"EUIPO and USPTO are ok."*), approved the L dispatch
(*"dispatch in the right order."*), then *"im going out. keep
dispatching."*, *"dispatch T-224 and T-265 together after T-264
merges"*, and at night *"keep dispatching, I'm heading to bed"* and
*"Feel free to dispatch any L cards if they are the kind that dont need
my decision making. Keep dispatching in the right priority order until
the morning."*

| card | base | tip | verdict | merge | what landed |
|---|---|---|---|---|---|
| T-264 the identifier rename (L) | fe2a2aa | 69b86b1 | APPROVED WITH ASSIGNED CORRECTIONS e4ef958 | 9cbc351 | .supertaskr/, supertaskr.yaml, .supertaskrignore, SUPERTASKR_* (33), the packages, dev.supertaskr.app, the crates (directory moved), CI, hooks |
| T-224 the touches-line landing gate (M) | dfe35a5 | 7cebf35 → rework 4a9f278 → third pass 63b9c3d | REJECTED dde56da (a renamed card evades: cards resolved by path, not id), REJECTED again 40b22e4 (the fix's regression: a decoy file with the card's id straddles the endpoints under the new dedupe), the architect WAIVED once in writing (rooms/t224-second-rejection.md), then APPROVED WITH ASSIGNED CORRECTIONS e710e4b — the finding: an inherited ambiguity on one id discarded a refusal already found for another (not lane-reachable through this gate; 0 duplicated ids on the live board at three refs; an announced allow, not a silent one) | d487a2d | the gate compares each card's `touches:` line against the integration ref's copy at both landing moments, resolves every endpoint by card id (rename and delete-and-re-add do not evade), refuses a duplicate the range arrives at, announces one it inherits; 43 → 52 bodies (51 at the verdict + the correction's) |
| T-265 the prose rename (M) | 15619b4 | 3589e0f | APPROVED WITH ASSIGNED CORRECTIONS 1d14064 | 167621d | method/, guide, reference, NORTH_STAR, ROADMAP, templates, VERSIONS, business, the map say Supertaskr; v0.1.9 → v0.1.10; 133 mentions moved, 30 survivors classified; the yaml rename carved out to T-269 |

No merge-tree forecast was taken for T-224 or T-265: the ritual
(merge-lane.sh, the seat's script) merges `--no-ff --no-commit` and
reads the merge's own output — both auto-merged with no conflict (T-224:
11 files; T-265: 48 files, VERSIONS.md and the card auto-merged). The
merge commits carry the named integrator writes: T-224 — the verdict's
correction (hook + one body), the census, the letter note on T-224-s4
((f) is taken; the entry it asks for is (g)), the correction note on
the card; T-265 — the record floors re-scoped (identifier-rename.spec.ts
6/6), the graph regeneration, the census. Ranges: each lane's own pair;
the integrator's `<merge>^1..<merge>`. Disjointness: T-224's paths
(.claude/hooks, tools/e2e/tests/landing-gate.spec.ts, docs/tasks) and
T-265's (method/, docs/guide, docs/reference, the governing documents,
kit.rs, genesis-derive.ts) share none; the three night lanes' fences —
lib/parser (T-219-s6), the index crate (T-153-s3), tools/method-evals
(T-205-s1) — are disjoint from both and from each other.

**The correction, performed at T-224's merge to lane standards.**
`touchesAmendments` collects an inherited ambiguity into a third list,
`unjudged`, instead of returning `{ problem }` from inside its loop;
both verdict arms refuse on `moved`/`duplicated` with the unjudged ids
named beside the refusal, and where nothing is refused the allow names
them. The body owed (five arms through the wired hook) was RED against
the hook as verified at 63b9c3d — `an inherited ambiguity discarded the
widening refusal … landing-gate-cannot-compare`, the natural mutant —
and GREEN after the patch; the whole spec 52 passed (51.8 s); typecheck
clean after a JSDoc block was moved back above `duplicateReport`.

## Fast path A, four times, and the ask channel by hand, five

- T-264 (15:44Z): the executor met `.nputerignore` outside its fence
  (the card's defect: the root dotfiles were missing from `touches:`),
  reverted the crate move and routed T-264-s1; @human relayed the
  agent's line; the grant landed (ebc51bc: + .nputerignore,
  .supertaskrignore, .gitignore; manifest re-expanded; lane copy
  delivered; stamp == line); the executor read both halves at 15:44:45Z,
  redid the move, withdrew the routed card. T-268 filed: the ask has no
  live channel.
- T-265 (17:25Z, the first ask written to the ask file the brief named;
  the waiter woke the seat within 20 s): ASK 1 (the yaml rename's three
  readers) REFUSED — token-scan.mjs is inside T-224's live fence; the
  yaml carved out of criterion 1 (5e1b305) and filed as T-269; ASK 2
  (the version pin's three files) and ASK 3 (the banking-map cell)
  GRANTED (+kit.rs, genesis-derive.ts, CONVENTIONS, ARCHITECTURE,
  C-01-method.md; re-expanded with no overlap with T-224).
- T-265 ASK 4 (17:37Z): T-264's records guard counts non-record files
  the lane renames → REFUSED (tools/e2e is T-224's); T-264-s6 promoted;
  the floors re-scoped at the merge as an assigned correction.
- T-224 (at dispatch): phase 1's A1.1 asked for GT-9; GT-9 showed
  T-264's real grant shape (the lane commits the widened line, no merge
  of main) refutes a base-vs-tip rule; bullet 1 AMENDED at 6f1622e on
  main and in the lane copy before the diff existed; the executor
  derived the same rule independently.
- T-205-s1 (22:12Z): four asks, all PARKED by the executor (nothing in
  its build depends on them), all REFUSED as grants by the seat —
  docs/CONVENTIONS.md and docs/reference sat inside T-265's live fence,
  tools/e2e inside T-224's. Asks 2, 3 and 4a routed as corrections at
  its merge from paste-ready text on the card; ask 1 (a tree home for
  the sealed attack sets) filed as T-205-s6 with the seat's
  recommendation (`docs/benches/<card-id>/`, written by the integrator
  at the checkpoint that lands the verdict; @human confirms); 4b the
  executor's own suggested card. SendMessage is disabled in this
  session: the ask file was the only channel, and the executor read the
  answer there.

## Gates

- GRAPH: T-224's merge — asked, CURRENT (tools/ and .claude/ are
  index-excluded). T-265's merge — kit.rs and genesis-derive.ts moved
  under the walk → regenerated (regen exit 0); `index --check` CURRENT
  after (1191343 bytes, 201 files, 2542 symbols, 2441 edges, 55.5 % of
  budget); the six dogfood pins re-read, exit 0.
- CENSUS: regenerated at both merges (T-224: a body added at the
  correction; T-265: spec names moved).
- DOCS GATE: FIRES at both (T-224: 9 docs paths are code inputs; T-265:
  36) — app, e2e and parser owed, run in battery48 below. `npm run
  lint:docs` at 167621d: 0 findings, 4 governing budgets hold. On
  T-205-s6's filing: FIRES (a card is a code input); the parser suite
  377/377 before its commit.
- METHOD EVAL GATE: T-265 touches method/** — `node
  tools/method-evals/run.mjs` at the staged tree: 9 model-free evals,
  exit 0.
- BOOT GATE: owed by T-265's kit.rs change — run (`npm run boot:check` from tools/e2e, port 14521): exit 0, both startup lines seen, the tauri tree stopped.
- HEALTH BANDS at 167621d + this commit's docs (`npm run health --
  --readings battery48/readings-rename.txt` from tools/e2e, the parser,
  rust and e2e runners' own captures plus `index --check`'s):
  `health-bands: 14 band(s) — 4 inside, 5 drifting, 1 BREACHED, 0 unread, 4 UNKEPT` — exit 3 (designed:
  four bands await keepers, T-156-s1/T-262). The one BREACH is
  suite/e2e-seconds, 798 s against a band set at 279 bodies (156 s);
  the lane is 706 bodies now — T-263 re-bands it. STATE and ROADMAP
  breached at the first reading (1.0 % and 1.9 % of their warn lines)
  and were cut in this commit to 5.3 % and 3.1 % (drifting): content
  moved to this record, no hazard deleted. Triage bands drift (24
  suggestions, 17 net arrivals since 0b7cecd): a triage sitting is
  due at the morning.
- INJECTION SCAN: 0 hits on every card, record and room written this
  sitting (the docs gate's advisory line at each run).

## Suites

battery47 on 9cbc351 (the rename): 3s/6s/34s/592s all GREEN under the
new names. Lanes at their tips: T-264 377/1163/639/690; T-224 at
e710e4b (the third verifier, once at its tip: 377/1163/639/705 — 704 +
brief-flush's margin guard red under a moving board, re-run GREEN); T-265 377/1163/639/690 (689 + the
attributed red). At the merges: landing-gate.spec.ts 52 passed after
the correction (1 failed before it, the drill); identifier-rename.spec
6 passed at T-265's staged tree; fence.test.ts 45/45 and the parser
377/377 on main after T-274's fence was fixed (ab00399).
battery48 on 167621d (integrator step 3, the run this record stamps):
parser GREEN 3 s (377) · app RED 9 s at the first run — 1 of 1163, genesis-mount's `dist/ predates src/genesis/genesis-derive.ts` (the merge moved an app source and the runner did not rebuild: rooms/loop-efficiency item 18's class) → `npm run build` in app/ (5 s) → app GREEN 9 s (1163) · rust GREEN 27 s (639, 18 targets) · e2e GREEN 800 s (706 passed, 13.3 min) · boot check GREEN. The closing battery on the checkpoint commit (the push's
token) runs after this commit; its figures go to the next record and CI
(rooms/loop-efficiency item 32: two runs are the price of the
two-commit landing under a tree-keyed token).

## CI

f9ec5eb: FAILED (6 shell-frame bodies, the docs harness's 15 s wait —
T-267), re-run once → SUCCESS (intermittent). 9cbc351 (the rename):
SUCCESS on a fresh runner. The 45 commits since 9cbc351 are unpushed at
this record's write; the push follows the closing battery and CI is
read after it.

## Board

Since the wave checkpoint (0b7cecd): planned 153 → 156; building 0 → 3
(T-219-s6 and T-205-s1 stamped `verifying` in their lanes, T-153-s3
building — the board sees `building` until their merges); done 252 →
255 (T-264, T-224, T-265); suggested 9 → 24 (T-224-s1…s6 — s6 filed by
the third verifier; T-264-s2…s7 with s6 promoted; T-265-s1…s4); parked
124 → 129 (T-126-s8/s9, T-185-s1, T-225-s10, T-205-s2 under ADR-021).
Filed by the seat: T-266 (@human's checklist; the marks ticked), T-267
(the harness wait, intermittent), T-268 (the ask channel + the watcher's
end condition + the grant arm), T-269 (the yaml rename with its
readers), T-270 (warm caches), T-271 (scoped suites, executors only),
T-272 (the rework contract), T-273 (the quick-fix route with the dispute
path), T-274 (the Sonnet fix-pass experiment; its fence corrected at
ab00399), T-275 (rooms in the mirror app, v1), T-205-s6 (the tree home).
Promotions: T-249-s1 p5 (absorbs s2), T-239-s6 p11, T-246-s1 p16,
T-264-s6 p28; T-248-s1/s2/s5 planned. The commits' subjects carry each
move (`git log 0b7cecd..167621d -- docs/tasks`).

## Environment

At the record's write (2026-09-09 ~00:15Z): lanes T-219-s6 (e74c12c,
bench at e74c12c, phase 2 live), T-153-s3 (dd0bcff building, vite
15153 pid 8926, its executor's scratch at ../T153s3-scratch), T-205-s1
(faf1b69, vite 15205 pid 16188, bench at faf1b69, phase 2 live); the
T-224 verifier's e2e re-run worktree in the scratchpad (vite 25224 pid
88456) still live; T-224's and T-265's lanes, benches and branches
removed, V3-T-224-mutants and nputer-D-T-265 removed. Strays registered
but not this sitting's: ../arch-verify (ae92f67, 2026-08-26, one dirty
file), ../V-s2-A (3a22cc4, 2026-08-31), two .claude/worktrees entries,
../nputer-app (detached on purpose). The integration checkout's seat is
under .supertaskr/ (re-taken at 17:07Z, T-264's correction 2).

## What the brief got wrong

- The arm's first run for both cards exited 2: zsh does not word-split
  `$pair` (the seat's own shell hazard; no stamp was written).
- T-224's stamp was refused: the card lacked verifier:/built_by:/
  verified_by: (a stamp on a missing key writes nothing and reports
  success — the arm now refuses it); keys added at 04a7522.
- Both executors' row 4 named the checkpoint as the base; the lane on
  disk was cut at the stamp commit — the repository won.
- T-265's brief said "fewer than two fences to compare"; T-224 was cut
  beside it during the lane and decided two of its four asks.
- The merge script's regen still spelled the old crate name after the
  rename (exit 101 at T-264's merge; the check was CURRENT because the
  lane had regenerated); fixed to derive the crate name.
- The phase-1 frame: kept by instruction in every bench (T-261 filed);
  both phase-2 briefs named executor-derived figures above the line
  (the verifiers disclosed and re-derived).
- The T-224 ground-truth capture lost four sections to zsh's `:t`
  modifier (`$R:tools/…` → `dfe35a5ools/…`); the verifier re-derived
  them at the base; memory note written (`${R}:path`).
- T-219-s6's brief asked for REFUSAL of an interior dot segment where
  the card asks for RESOLUTION (its "Why it was NOT folded into
  T-219-s4" section); the executor followed the card and said so — the
  card is the spec, a brief is evidence.
- The T-219-s6 ground truths' first census counted four dot-segment
  tokens that were the card's own worked examples inside its body (the
  harvester read whole files); re-taken over frontmatter: 921 tokens, 0
  dot segments; re-sealed with the errata in the file.
- The seat's own T-274 card carried `touches: [docs/tasks]`, which
  redded three fence.test.ts live-board bodies on main from cc5bf50 to
  ab00399 — and at the bases of the three night lanes cut in between.
  Attributed in each lane's ground truths; no lane charged.
- The third T-224 verifier wrote its verdict file under the name the
  seat asked for (verdict-T-224.md) while its predecessor had used
  verdict-V-T-224.md; two watchers were needed, one on the name and one
  on the old file's mtime.
- The seat merged T-224 at the verdict commit while the third
  verifier's step-7 battery was still running, and removed its bench and
  scratch worktree under it: the verdict FILE had been written and the
  seat read it as the finish. A bench stands until the verifier's
  NOTIFICATION (rooms 21-22, this file's own hazard); the verifier
  finished from its own copies and its final message carried the legs.

## Metrics (ADR-020)
- Rework cycles: T-264 0 · T-224 2 (REJECTED dde56da: rename evasion;
  REJECTED 40b22e4: the fix's regression; waived once in
  rooms/t224-second-rejection.md; the third pass at 63b9c3d closed
  both; the third verdict's correction performed at the merge, no fourth
  pass) · T-265 0.
- Tokens: T-264 phase 1 69,391 · executor 442,392 · phase 2 306,141;
  T-265 phase 1 64,950 · executor 289,233 · phase 2 265,237; T-224
  phase 1 64,137 · executor 416,334 · phase 2 211,671 · rework 240,258 ·
  re-verification 300,662 · third pass 440,176 · third verdict 347,790
  (143 tool uses, 81 min); the seat: not derivable here.
- Gate runtime: battery47 = 635 s; battery48 = 3 + 9 + 9 + 27 + 800 = 848 s (+ the 5 s rebuild); the
  correction's single-body runs 4 s each, the full landing-gate spec
  52 s, identifier-rename 1 s; the closing battery in the next record.
- Cold start: no switch; two compactions mid-sitting (the second at
  22:00Z), both resumed from the summary without a question.
- Drift incidents: 1 — T-274's fence token (the seat's own write)
  redded the parser suite on main for 5 commits; found at the night
  lanes' base capture, fixed at ab00399.

## Dispositions
- T-224: done; the verdict's half 2 (words vs code) not needed once
  half 1 made the code do what limit 5(f) says. T-224-s1…s6 suggested
  (s4 with the letter note; s6 the verifier's `absent` short-circuit
  body). rooms/t224-second-rejection.md RESOLVED in this commit: the
  waiver held, the third pass closed both rejections.
- T-265: done; T-265-s1…s4 suggested; T-269 (the yaml rename) blocked
  no longer by T-224 and T-265 — startable.
- T-205-s6 planned p66 — @human confirms `docs/benches/` at the morning
  sitting before dispatch.
- THE NIGHT MANDATE (@human, 2026-09-09 00:xx local): T-244 (L, `npx
  supertaskr`) approved for the night as a card needing no product
  decision, dispatched after this checkpoint together with T-120-s2;
  T-173 (the customisation form) stays — a product decision. Lanes kept
  ≤ 5; the next two fresh fix passes on claude-sonnet-5@subagent
  (T-274's experiment); scoped suites for executors only (T-271);
  suite-once at the verifier's tip (T-262).
- Also this sitting, at @human's rulings of 2026-09-09:
  rooms/loop-efficiency RESOLVED (16 items discharged by name; T-120-s2
  next; T-270 filed; items 16+19 → T-268, 18+27 → T-244); T-271–T-274
  filed ("file the first two and run the model experiment"); T-275
  ("Add rooms to the mirror app in v1"); the ask-watcher retirement
  condition into T-268; docs/VERSIONS.md written as the one page of
  version rulings; the technical reference (docs/reference/, 15
  chapters) written at @human's ask.
