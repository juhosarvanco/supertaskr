---
id: T-174
title: The kit cites a method it does not ship — a genesis project's TASK-FORMAT and STATE name role files, lane-protocol and docs-protocol that KIT_FILES never materializes
feature: F-01
milestone: 4
priority: 12
size: M
status: planned
blocked_by: []
suggested_by: "the first-walk cold-start test (2026-08-30), finding B-1 — surfaced by the walk, confirmed against kit.rs"
touches: [app-agent]
builder:
verifier:
built_by:
verified_by:
review:
---

**CONFIRMED at the walk's project:** `/Users/ujju/Projects/first-walk`
has NO `method/` tree — `KIT_FILES` (14 entries,
`app/src-tauri/src/agent/kit.rs`) ships the planner's role file, the
two interview documents, the five doc templates, the two adapters,
TASK-FORMAT + the T-000 template, and `runtime/nputer.yaml` — and the
TASK-FORMAT and STATE it ships cite, normatively:
`roles/executor.md`, `roles/verifier.md`, `roles/orchestrator.md`
(step 5b), `lane-protocol.md` (rules 4, 6, 7 and the dispatch-stamp
section), `docs-protocol.md`, and `interview/decomposition.md`'s
neighbours. A fresh builder in the generated project cannot learn how
to cut a lane, what a checkpoint contains, what the executor's or
verifier's procedure is, or what model runs an empty `builder:` seat.
The subset's internal references cross the subset boundary.

## What the fix has to decide

Two honest shapes, and the choice is triage's, not a lane's:

1. **Ship the method runtime.** KIT_FILES grows the files its own
   shipped documents cite. Cost: the shipped-bytes surface widens
   (every future edit to those files becomes test-1 relevant for the
   bump question), and the kit stops being "the interview and its
   scaffold" and becomes "the method".
2. **Trim the citations at materialization.** The shipped
   TASK-FORMAT/STATE variants reference only what ships (or point at
   nputer-the-app as the method's home). Cost: a fork between our
   TASK-FORMAT and the shipped one — a second implementation of a
   normative document, the exact class CONVENTIONS warns on.

Either way the acceptance is the cold-start test's own: a fresh
reader of a generated project's docs/ SHALL be able to resolve every
normative citation those docs make, or the citation names where it
lives. The walk's capture
(docs/research/captures/cold-start-first-walk-2026-08-30.md) is the
evidence file.

## TRIAGE (2026-08-30, standing triage sitting #4) — PROMOTED F-01 p12, and SHAPE 1 RULED

**THE RULING: SHIP WHAT THE SHIPPED DOCUMENTS CITE (shape 1). Shape 2 is
declined, and the reason is this repository's own standing law.** Shape 2
forks TASK-FORMAT — one normative document with two implementations,
which `docs/CONVENTIONS.md` names as a defect class in as many words
(*"a rule with two implementations is two chances to disagree"*, T-057)
and which this project has already paid for twice. A fork also makes
every future edit to the method's own TASK-FORMAT a two-file edit
forever, with no test holding the two together.

**THE SET IS ENUMERABLE, WHICH IS WHAT MAKES SHAPE 1 A CARD RATHER THAN
A PROJECT.** Derived at `b60b06d` over the two shipped documents that
carry normative citations:

    command grep -oE "roles/[a-z]+\.md|lane-protocol\.md|docs-protocol\.md" \
      method/tasks/TASK-FORMAT.md method/docs-templates/STATE.md

answers `lane-protocol.md` (4 citations), `roles/orchestrator.md` (2),
`roles/verifier.md` (1), `roles/executor.md` (1) and `docs-protocol.md`
(1) — **five files**, against a `KIT_FILES` table that currently holds
fourteen entries. `interview/decomposition.md` is cited twice and is
ALREADY shipped, so it is not part of the gap.

**THE COST IS NAMED RATHER THAN WAVED AWAY**: those five files become
shipped bytes, so every future edit to them takes test 1 and owes a
bump. That is the honest price of a kit whose documents can be read to
the end, and it is smaller than the price of a forked normative
document.

**WHAT THE LANE STILL DECIDES**: whether the five ship as-is or whether
any of them needs a project-agnostic pass first — `roles/integrator.md`
and `lane-protocol.md` are deliberately outside the kit today and the
card SHALL re-derive `KIT_FILES` at its own ref before assuming this
count.

**DISPATCH IS BLOCKED ON @human's `T-140-s4` RULING, NOT ON THIS CARD.**
The graph sits at **410 bytes** of headroom at `b60b06d`
(`wc -c docs/architecture/graph.json` = 1,039,590 against the crate's
1,040,000 budget), and this card's fence reaches indexed source. The
sitting records the block rather than lowering the priority.

## CORROBORATION, 2026-09-02 — T-189-s4, absorbed here as a second instance

T-189-s4 (now under docs/tasks/rejected/, its argument kept there) found
this card's class from the other end: `method/tasks/TASK-FORMAT.md` SHIPS,
and its ceremony cell now cites lane-protocol rules 4 and 6 — a file
`KIT_FILES` never materializes — so a scaffolded project receives the
self-integration CONDITION without its decision procedure, and the
obvious way to answer "do I hold it?" from the cell alone is the solitude
proxy T-189 measured and refused. Add to this card's decision: whether the
answer is to ship lane-protocol.md or to move the holder's decision
procedure into a file already shipped, argued rather than assumed, and a
sweep at the fixing ref for every shipped file that cites an unshipped
one, derived rather than transcribed from the 14-entry count.
