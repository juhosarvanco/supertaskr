# Versions — which features are v1, v2, v3+, and which are still unruled

The one page to look at. The RULING lives in docs/rooms/version-planning.md
(2026-08-30, the draft partition approved as written, plus each later
sitting's moves); the TEXT of every charter entry lives in
docs/research/beyond-the-playbook-charter.md (the number is the link);
the parked items' text lives in docs/future.md. This page transcribes
and never rules — where it disagrees with the room, this page is the bug.
Versions ARE milestones on cards (the version-table addendum): once an
item is a card, the board is the list, so this page covers what is not
a card yet and points at the card where one exists. A status written
here is a reading bound to the date beside it; derive the live one with
`brief.mjs --state`.

Kept by hand: every version sitting appends its moves to the room and
re-touches this page in the same commit.

## v1 — the smallest product that makes NORTH_STAR honest

One solo developer runs the whole loop on their own project. The arc is
genesis + board + dispatch complete, the map's drift slice, and — since
ADR-021 (2026-09-03) — the seat itself shipped as a skill over the CLI,
with the app as the mirror.

| area | in v1 | where (status read 2026-09-03) |
|---|---|---|
| Method (F-01) | the convention, versioned and eval-gated; genesis ships it into any folder | shipped, v0.1.9 |
| Interview (F-03) | seven questions → the five governing docs, first cards, a board; ONE interview in two lenses — the skill in the native agent app is PRIMARY (ADR-021 Addendum 1), the app's split view stays as shipped | shipped; T-242 planned p1 |
| — charter 01 Skill Packs | skills loaded into genesis, stamped into the record | T-167 done |
| — charter 03 Customization by Interview | more interview, not a settings screen | T-173 planned (size L) |
| — cold-start seam | the method's cold-start test gets an operational owner | T-175 planned |
| Board (F-02) | story map live off files, detail panel, lanes off git, dispositions with reasons | shipped |
| — app opens on a folder from outside | so a skill can put the mirror beside the chat | T-243 planned |
| Dispatch (F-04) | dispatch view, brief as contract, fence at the write, preflight, blind verification as a spawn property, binding assignment, the one-command arm; the app spawns nothing | shipped (T-112, T-239 done) |
| — the seat skill | the architect's hand work as a slash command over the arm — the primary way v1 is driven (ADR-021 Addendum 1) | T-241 planned p1 |
| CLI (C-02) | the scripts and the indexer behind `npx nputer`, what both skills call | T-244 planned p1 (size L) |
| — Codex's skill form, measured | how a skill is installed and invoked in the ChatGPT app's Codex and its CLI, captured before any Codex claim | T-246 planned p1 |
| Map (F-06) | architecture + tasks lenses, intent over reality, drift, cycles, blast, churn, budget with a measured reason (the ADR-013 slice of truth maintenance) | shipped |
| Ring 2, as it is | 05 Card Preflight · 06 Fences & Dispatch Sets · 07 Proof-of-Teeth · 08 Blind Adversarial Verification · 09 Record-First Landings · 10 Merge Pre-Proof · 11 Process Vital Signs · 12 The Metabolism · 13 Seat Economics — working internals, documented, no productization pass in v1 | shipped inside |
| The launcher | one command launches the human's app worktree fresh | T-164 done |
| Security at the write (ruled 2026-09-08) | the dependency-legitimacy gate (T-247), the injection scan on docs writes (T-248), the secret read guard in the fence hook (T-249) — the layer GSD Core ships and nputer lacked | T-249 done (merged 2026-09-08), T-247 done (merged 2026-09-08), T-248 in rework after a blind REJECTED verdict (one missing test body) |
| The gate taxonomy, named | pre-flight, revision, escalation, abort — the four types nputer runs, written into CONVENTIONS | T-250 planned p3 |
| The debt-marker limit | a TODO or FIXME a lane adds must cite a card id, or the landing is refused | T-251 planned p3 |
| The quick path below the loop (ruled 2026-09-08, v1) | one line files a size-S card with a light review mode and lands with a verdict; guard-class cards refused | folded into T-241 |
| A test named per SHALL clause (ruled 2026-09-08, second sitting) | preflight lists, advisory first, the suite that will prove each clause and the clauses that name none | T-252 planned p3 |
| The edge and must-not questions in decomposition (ruled 2026-09-08, second sitting) | the interview asks each card's edges and prohibitions and writes the kept ones as criteria | T-253 planned p3 |
| Safe undo (ruled 2026-09-08, second sitting) | `npx nputer undo <card>` reverts a card's merge with a dependency check | folded into T-244 |
| The decision list (ruled 2026-09-08, third sitting) | decomposition writes each card's decisions — question, options, proposed default — only for what the interview and CONVENTIONS do not settle; past five items the card is to be split | folded into T-253 |
| Two decision modes, audit and auto (ruled 2026-09-08, third sitting) | `decide: audit` — the preflight refuses an unanswered item, the human's name on the choices; `decide: auto` — the planner's defaults stamped and reviewed in one batch at the checkpoint; project default in the runtime config; guard-class and user-facing cards audit; the quick path auto; two health bands | T-257 planned p2, behind T-253 |
| The commission list (ruled 2026-09-08, third sitting, "as proposed") | phase 2 enumerates every side effect the diff adds and maps each to a criterion; unmapped is a finding | T-258 planned p2 |
| The oracle class and the escalation form (ruled 2026-09-08, third sitting) | each `proves:` note may carry proof, type, property or example; example-only on an in-every-state or no-other-recovery clause prints an advisory; TASK-FORMAT gains the halt-and-hand-off sentence | T-259 planned p3, behind T-252 |
| Tool surfaces per role (added 2026-09-08 from the GSD agent reference) | phase 1 of the blind bench spawned as a defined agent type with no file, git or shell tool — blindness as a property of the spawn, measured before claimed | T-261 planned p9 |
| The verdict marker and the completion-contract registry (added 2026-09-08) | three exact-case verdict markers, a registry of every role's markers and consumer, a method eval that reds on drift; the rejection-rate band gets its keeper | T-262 planned p17 |

**Explicitly NOT in v1:** F-05's in-app orchestrator conversation and
any in-app spawn path (ADR-021); a Codex spawn adapter inside the app;
the archaeology/Adopt variant (ADR-005); the non-coder spec studio
(ADR-006, layer 2); everything in v2, v3+ and unruled below. Milestone
0's name is RULED (ADR-022, 2026-09-08: Supertaskr); the rename lanes are
T-264 (L, approval first), T-265, T-266; the trademark search for the new
spelling is a gate before launch, not a feature.

## v2 — teams and depth

- **02 Stage Slots** — named extension points at every stage of the loop.
- **04 Environment Tiers & Rehearsed Rollback** — when services ship.
- **16 Fleet Fences** — the fence system across machines (team-enablement room).
- **21 Competitive Execution** — the same card, two models, a blinded judge (T-170, parked on its trigger).
- **The Ring 2 productization pass** — dashboards and surfaces for preflight, economics and the bands.
- **The cockpit** — F-05's in-app orchestrator conversation: "not before v2, and only on evidence a user wants it" (ADR-021).

## v3+ — the horizon

- **Ring 3:** 14 Purpose-Drift Signal · 15 Counterfactual Policy Replay · 17 Compliance for Free · 18 The Self-Confessing Eval Corpus · 19 Method SemVer & the Method Marketplace · 20 Rooms & Standing Presence · 23 The Kit Is the Product.
- **Ring 4, the gift registry:** 24 Retroactive Verification · 25 Session Ghosts · 26 Counterfactual Gardens · 27 Dream Lanes · 28 Intent Compilation · 29 The Proof Economy · 30 The Method Breeds · 31 Judgment Scheduling · 32 The Accountability Layer (v3+ by its ring; never named in a ruling — @human to confirm).

## Already delivered under other names (walked 2026-09-08)

Items from the competitor sweep and the parked list that nputer already
has; no ruling needed, only the name to look under.

- per-agent model cost profiles → seat economics (13) plus D5's binding assignment per card; the routing table is `nputer.yaml`'s role defaults (C-03, planned)
- cross-session memory → the record itself (STATE, checkpoints, rooms) under the cold-start test
- PR bodies written from the record → record-first landings (09): the checkpoint record and the merge commit
- the honest fallback line → T-169 (done); the sentence form is folded into T-241
- gate taxonomy with stall detection → we run all four types; T-250 names them
- shortcut markers into a debt ledger → the metabolism (12); T-251 gives it teeth at the merge
- cost telemetry (parked list) → 13 and the Tokens line in every record
- enforced touches, the write half (parked list) → 06, done; the sandbox and network half is v2
- handoff score (parked list) → the cold-start band and the succession test, unscored
- from the EARS-for-the-AI-era reading (2026-09-08): test-writer independence → the blind verifier, inverted (the attack set is written from the spec before the diff exists); coverage per requirement → the behaviour census in CAPABILITIES; IDs, owners and versions → the cards, the rulings quoted verbatim, the records; glossary entries bound to code symbols → the component registry with the graph over it and T-230's quoted-claims preflight; the escalation pattern → the rooms; the weekly regeneration job → charter 26–28

## v2 additions ruled 2026-09-08

- plan-checker seat, design-mockup stage, UAT walk, browser QA seat, security audit seat — the Ring 2 productization pass or the non-coder layer
- reviewer instances with consensus → under 21 Competitive Execution (T-170 parked)
- ship, deploy and canary → under 04 Environment Tiers
- a capability registry that declares its gates as blocking or advisory → the shape the landing gate's limits take in the productization pass
- the multi-harness installer beyond Claude and Codex (T-244 carries the v1 stance)
- 22 The Version Table
- from the parked list: pocket cockpit, calibration scorecards, retro role, spec red team, dry run, the sandbox half of enforced touches
- ruled 2026-09-08, second sitting: a reversibility rating per card; a complexity-triggered refactor as a health band; calibrated effort estimation with an actuals loop (the shipped form of the calibration scorecards); forensics over git history; the dispatch view listing outstanding human checks (verification debt, whose tracking the metabolism already does)
- ruled 2026-09-08, third sitting (the EARS reading): catalogue-generated negatives — "and not otherwise" tests generated from the component registry once it is complete enough (the Ring 2 productization pass); the two-lane blind builder — a code lane and a test lane cut from one card with disjoint fences so the builder never reads test source (under 21 Competitive Execution, it doubles the seats); the uncertainty-bounded pattern — a metric at or above a threshold on a named eval set with a deterministic fallback (under the method evals, when a model-produced behaviour becomes a product feature); the static side-effect enumerator in the landing gate (T-258's tool half)

## v3+ additions ruled 2026-09-08

- from the parked list: time machine, truth maintenance beyond the drift slice, production feedback, synthetic users, explainer
- dropped as duplicates: seeds (= 23 The Kit Is the Product), proof of process (= 17 Compliance for Free)
- ruled 2026-09-08, second sitting: scope-reduction detection with re-injection → under 14 Purpose-Drift Signal

## Unruled — needs a version ruling before it can become a card

- **32 The Accountability Layer** — v3+ by its ring; never named in a ruling; awaits @human's word.
- (The second-pass items of 2026-09-08 were ruled the same day — see the v1 table, the v2 and v3+ lists, and the moves log.)

## Moves, by sitting

- **2026-09-08, the agent-reference reading** — @human: *"only add features that actually make our system reliably better"*. v1 gains T-261 (tool surfaces per role) and T-262 (the verdict marker and the registry); the coincidental-reliance rule folds into T-258; two efficiency items recorded in the loop-efficiency room, nothing else taken.

- **2026-08-30** — the partition ruled as drafted: v1 = the F-01…F-04 arc + 01 + 03 + the launcher, Ring 2 as-is; v2 = 02, 04, 16, 21, the productization pass; v3+ = 14–20 and the registry (rooms/version-planning.md).
- **2026-09-03** — F-05's conversation and spawn path v1 → v2-or-later; T-241, T-242, T-243, T-244 added to v1 (planned, none dispatched); the charter checked in; this page created (ADR-021, the form sitting record).
- **2026-09-08** — ten competitor-sweep candidates added to UNRULED at @human's "do both"; no ruling, no column changed (T-245 filed for the map).
- **2026-09-08, later** — @human: drive from the native apps, the app keeps its interview (ADR-021 Addendum 1); T-241, T-242, T-244 to priority 1; T-246 added to v1 (planned). No column changed.
- **2026-09-08, the version sitting** — @human: *"approve the v1 five, fold the rest as proposed"* and the quick path to v1. v1 gains T-247 (dependency-legitimacy gate), T-248 (injection scan on docs writes), T-249 (secret read guard), T-250 (gate taxonomy named), T-251 (debt-marker limit), and the quick path inside T-241; nine sweep items recorded as already delivered under other names; the rest of the sweep and the parked list ruled v2 or v3+ as listed above; two duplicates dropped. UNRULED is now entry 32 alone.
- **2026-09-08, the second version sitting** — @human: *"approve the v1 three, fold safe undo into T-244, rest as proposed"*. v1 gains T-252 (a test named per SHALL clause, advisory at preflight) and T-253 (the edge and must-not questions in decomposition); safe undo folded into T-244; five items to v2, one to v3+ under 14, verification-debt tracking recorded as already delivered by the metabolism. UNRULED is entry 32 alone.
- **2026-09-08, the third sitting (the EARS reading)** — @human: *"Can we build two modes, auto and audit"* → *"file it"*. The decision list folded into T-253; T-257 filed planned p2 behind it. From the same reading, still unruled and proposed: the commission list as a verifier rule (v1, S), the oracle class in T-252's note and the escalation sentence form in TASK-FORMAT (v1, S), catalogue-generated negatives, the two-lane blind builder and the uncertainty-bounded pattern (v2).
- **2026-09-08, the third sitting, ruled** — @human: *"as proposed"*. v1: T-258 (the commission list as a verifier rule) and T-259 (the oracle class and the escalation form, behind T-252). v2: catalogue-generated negatives, the two-lane blind builder, the uncertainty-bounded pattern, the static enumerator. Six items recorded as already delivered under other names.
