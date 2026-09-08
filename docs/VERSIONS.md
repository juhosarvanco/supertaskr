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
| Security at the write (ruled 2026-09-08) | the dependency-legitimacy gate (T-247), the injection scan on docs writes (T-248), the secret read guard in the fence hook (T-249) — the layer GSD Core ships and nputer lacked | T-247/T-248/T-249 planned p2 |
| The gate taxonomy, named | pre-flight, revision, escalation, abort — the four types nputer runs, written into CONVENTIONS | T-250 planned p3 |
| The debt-marker limit | a TODO or FIXME a lane adds must cite a card id, or the landing is refused | T-251 planned p3 |
| The quick path below the loop (ruled 2026-09-08, v1) | one line files a size-S card with a light review mode and lands with a verdict; guard-class cards refused | folded into T-241 |

**Explicitly NOT in v1:** F-05's in-app orchestrator conversation and
any in-app spawn path (ADR-021); a Codex spawn adapter inside the app;
the archaeology/Adopt variant (ADR-005); the non-coder spec studio
(ADR-006, layer 2); everything in v2, v3+ and unruled below. Milestone
0's domain and trademark sweep is still open — a gate, not a feature.

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

## v2 additions ruled 2026-09-08

- plan-checker seat, design-mockup stage, UAT walk, browser QA seat, security audit seat — the Ring 2 productization pass or the non-coder layer
- reviewer instances with consensus → under 21 Competitive Execution (T-170 parked)
- ship, deploy and canary → under 04 Environment Tiers
- a capability registry that declares its gates as blocking or advisory → the shape the landing gate's limits take in the productization pass
- the multi-harness installer beyond Claude and Codex (T-244 carries the v1 stance)
- 22 The Version Table
- from the parked list: pocket cockpit, calibration scorecards, retro role, spec red team, dry run, the sandbox half of enforced touches

## v3+ additions ruled 2026-09-08

- from the parked list: time machine, truth maintenance beyond the drift slice, production feedback, synthetic users, explainer
- dropped as duplicates: seeds (= 23 The Kit Is the Product), proof of process (= 17 Compliance for Free)

## Unruled — needs a version ruling before it can become a card

- **32 The Accountability Layer** — v3+ by its ring; never named in a ruling; awaits @human's word.

## Moves, by sitting

- **2026-08-30** — the partition ruled as drafted: v1 = the F-01…F-04 arc + 01 + 03 + the launcher, Ring 2 as-is; v2 = 02, 04, 16, 21, the productization pass; v3+ = 14–20 and the registry (rooms/version-planning.md).
- **2026-09-03** — F-05's conversation and spawn path v1 → v2-or-later; T-241, T-242, T-243, T-244 added to v1 (planned, none dispatched); the charter checked in; this page created (ADR-021, the form sitting record).
- **2026-09-08** — ten competitor-sweep candidates added to UNRULED at @human's "do both"; no ruling, no column changed (T-245 filed for the map).
- **2026-09-08, later** — @human: drive from the native apps, the app keeps its interview (ADR-021 Addendum 1); T-241, T-242, T-244 to priority 1; T-246 added to v1 (planned). No column changed.
- **2026-09-08, the version sitting** — @human: *"approve the v1 five, fold the rest as proposed"* and the quick path to v1. v1 gains T-247 (dependency-legitimacy gate), T-248 (injection scan on docs writes), T-249 (secret read guard), T-250 (gate taxonomy named), T-251 (debt-marker limit), and the quick path inside T-241; nine sweep items recorded as already delivered under other names; the rest of the sweep and the parked list ruled v2 or v3+ as listed above; two duplicates dropped. UNRULED is now entry 32 alone.
