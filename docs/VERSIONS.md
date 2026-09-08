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
| Interview (F-03) | seven questions → the five governing docs, first cards, a board; ONE interview in two lenses (skill + split view) | shipped; T-242 planned |
| — charter 01 Skill Packs | skills loaded into genesis, stamped into the record | T-167 done |
| — charter 03 Customization by Interview | more interview, not a settings screen | T-173 planned (size L) |
| — cold-start seam | the method's cold-start test gets an operational owner | T-175 planned |
| Board (F-02) | story map live off files, detail panel, lanes off git, dispositions with reasons | shipped |
| — app opens on a folder from outside | so a skill can put the mirror beside the chat | T-243 planned |
| Dispatch (F-04) | dispatch view, brief as contract, fence at the write, preflight, blind verification as a spawn property, binding assignment, the one-command arm; the app spawns nothing | shipped (T-112, T-239 done) |
| — the seat skill | the architect's hand work as a slash command over the arm | T-241 planned |
| CLI (C-02) | the scripts and the indexer behind `npx nputer` | T-244 planned (size L) |
| Map (F-06) | architecture + tasks lenses, intent over reality, drift, cycles, blast, churn, budget with a measured reason (the ADR-013 slice of truth maintenance) | shipped |
| Ring 2, as it is | 05 Card Preflight · 06 Fences & Dispatch Sets · 07 Proof-of-Teeth · 08 Blind Adversarial Verification · 09 Record-First Landings · 10 Merge Pre-Proof · 11 Process Vital Signs · 12 The Metabolism · 13 Seat Economics — working internals, documented, no productization pass in v1 | shipped inside |
| The launcher | one command launches the human's app worktree fresh | T-164 done |

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

## Unruled — needs a version ruling before it can become a card

- **22 The Version Table** — @human's idea; builds at a version sitting under the standing rule.
- **docs/future.md's parked items** ("nothing enters scope until the first real project run"):
  - v0.2 batch — cost telemetry (largely delivered as 13 Seat Economics), pocket cockpit, calibration scorecards, retro role, enforced touches.
  - v0.3 batch — N-version building (the same idea as 21), spec red team, time machine, handoff score, dry run.
  - horizon — truth maintenance (its drift slice is in F-06 v1 by ADR-013; the premise graph is not), production feedback, synthetic users, seeds, explainer, proof of process.
- **Learned from the competitor sweep of 2026-09-08** (T-245 carries the readings; each item names where it was seen; none is ruled):
  - a quick path for small changes that skips the full loop (GSD's quick command)
  - skills that trigger without a slash command (Superpowers)
  - a plan-checker seat that verifies the plan before execution (GSD)
  - a design-mockup stage before code (defract; GSD's UI spec)
  - a UAT walk where the human confirms each deliverable (GSD)
  - a browser QA seat, a security audit seat, and ship, deploy and canary steps (gstack)
  - per-agent model cost profiles — overlaps 13 Seat Economics (GSD)
  - cross-session memory of project learnings (gstack)
  - PR bodies written from the record (GSD, gstack)
  - an installer that targets many harnesses; nputer has one adapter (all three)

## Moves, by sitting

- **2026-08-30** — the partition ruled as drafted: v1 = the F-01…F-04 arc + 01 + 03 + the launcher, Ring 2 as-is; v2 = 02, 04, 16, 21, the productization pass; v3+ = 14–20 and the registry (rooms/version-planning.md).
- **2026-09-03** — F-05's conversation and spawn path v1 → v2-or-later; T-241, T-242, T-243, T-244 added to v1 (planned, none dispatched); the charter checked in; this page created (ADR-021, the form sitting record).
- **2026-09-08** — ten competitor-sweep candidates added to UNRULED at @human's "do both"; no ruling, no column changed (T-245 filed for the map).
