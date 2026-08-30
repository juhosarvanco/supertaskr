---
id: T-174
title: The kit cites a method it does not ship — a genesis project's TASK-FORMAT and STATE name role files, lane-protocol and docs-protocol that KIT_FILES never materializes
status: suggested
suggested_by: "the first-walk cold-start test (2026-08-30), finding B-1 — surfaced by the walk, confirmed against kit.rs"
touches: [app-agent]
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
