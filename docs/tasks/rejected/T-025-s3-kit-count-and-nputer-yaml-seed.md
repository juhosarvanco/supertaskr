---
id: T-025-s3
title: The kit snapshot ships 14 files, not the plan's "13" — and nothing yet reads nputer.yaml
status: rejected
suggested_by: executor claude-opus-5 @T-025
---

Two small, related loose ends from packaging the method kit (§3), both
recorded rather than silently resolved.

**1. The count.** §3 says "exactly the driver-contract kickoff set plus
its operational references (13 files, ~60 KB)" and then ENUMERATES the
set. The enumeration contains **fourteen** files, not thirteen —
`roles/planner.md`, `interview/plan-interview.md`,
`interview/decomposition.md`, five `docs-templates/*.md`,
`docs-templates/decisions/000-template.md`, two `adapters/*.md`,
`tasks/TASK-FORMAT.md`, `tasks/T-000-template.md`,
`runtime/nputer.yaml`. The executor shipped the ENUMERATION (14), on the
grounds that the list is the normative half and the parenthetical count
is an aside; the parity walk and `the_snapshot_carries_the_driver_
contracts_kickoff_set` pin the set, not the number, so no test encodes
the wrong figure. Nothing is broken; the plan text is just off by one
and someone re-reading it will trip on the same discrepancy. Worth a
one-word correction if the plan section is ever revised.

**2. The seed nobody performs.** `runtime/nputer.yaml` rides the kit
because `method/roles/planner.md` step 1 says the planner MAY seed
`.nputer/nputer.yaml` from it. But:

- the runner does not seed it (correctly — the app is not the writer);
- the planner may or may not, since it is a MAY;
- and T-025 §9 explicitly parks reading role→agent mappings out of
  `.nputer/nputer.yaml` ("the planner:claude default is v1-hardcoded as
  THE entry; yaml consultation is named growth").

So the file is packaged, reachable, and consulted by nobody. That is
fine as a way station, but it means two future tasks could each invent
their own answer: the multi-adapter work (F-04 era) will want the roles
map, and `turns` in `sessions.json` already exists to drive
`warn_after_turns`, which lives in that same yaml — so the sediment
warning has a threshold source no code reads. Decide once, when the
second adapter lands: either the runtime yaml becomes a real input (and
something seeds it deterministically), or it leaves the kit and the
defaults live in Rust.

Triage 2026-08-16 (architect): PARKED — split, both halves accounted
for. The "13 vs 14" off-by-one is a plan-text correction with no test
encoding it and rides T-043's T-025 text sweep, recorded there as a
criterion. The real content is the `runtime/nputer.yaml` decision —
packaged, reachable, consulted by nobody — and the suggestion's own
answer is "decide once, when the second adapter lands", which is F-04
era. Unpark with the second adapter.

Re-affirmed at triage 2026-08-17 (third pass): unchanged on both
halves. The 13-vs-14 off-by-one still rides T-043 as a criterion and
T-043 is still planned and undispatched; `runtime/nputer.yaml` is
still packaged, still reachable, and still consulted by nobody, and no
second adapter has landed. Unpark with the second adapter.

Disposition 2026-09-13 (the pruning sitting (T-306), the owner's ruling of 2026-09-13): discharged — the work landed elsewhere: the tree at HEAD. the runtime template is the dot-directory read by seven modules, and the kit table now holds 19 entries pinned by two assertions.
