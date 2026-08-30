---
id: T-111-s11
title: The graph walk indexes any cargo target directory not literally named `target`, so a drill under a chosen name is counted as repository content — teach the walk to skip a directory carrying cargo's own CACHEDIR.TAG
feature: F-06
milestone: 4
priority: 12
size: S
status: planned
blocked_by: []
touches: [crate-index]
suggested_by: executor claude-opus-5@subagent @T-111-s10
builder:
verifier:
built_by:
verified_by:
review:
---

**ROUTED OUT OF `T-111-s10` BY THAT CARD'S THIRD ACCEPTANCE CRITERION**,
which reads: *"THE class fix (teaching the walk to skip any directory
containing cargo's own `CACHEDIR.TAG`) SHALL be ROUTED as its own
`[crate-index]` card rather than taken here — it is code, it is a
different fence, and the doc edit must not wait on it. Arm (a) and arm
(c) are not alternatives."* `T-111-s10` took arm (a) — the POISON DRILL
bullet now names `<scratch>/target`, the one name the walk already
excludes. **That fixes today's readers and not the class**, and this
card is the class.

## The defect

`.gitignore` carries `target/` and nothing else — re-derived at
`39f2302`, where the whole file is `.DS_Store`, `node_modules/`,
`dist/`, `target/`, and `.nputerignore` adds only `docs/`, the indexer's
own test fixtures and `tools/`. So a `CARGO_TARGET_DIR` placed inside a
worktree under ANY other name is walked, indexed and counted as
repository content, and `index --check` reports a confident wrong answer
rather than an error — the same failure shape the `--root` paragraph of
docs/CONVENTIONS.md already documents for a different cause, and the
headline does not distinguish it.

Measured twice, from two lanes, with two different chosen names and two
different phantoms:

- `T-111`'s fix pass at main `6a6bc87`, target dir named `.fctarget`:
  the same tree and command gave `files +3 -0 ~2` with the target dir
  INSIDE the worktree and `files +0 -0 ~2` with it BESIDE — the three
  extra files being cargo build-script `out/private.rs` outputs, plus a
  phantom `p:cargo:serde_core` package node and its import edge.
- `T-110`'s drill, target dir named `.drilltarget`: the same collision,
  a tauri build-script `__global-api-script.js` carrying zero symbols
  and zero edges, so only the FILE count moved. Its own record reports
  six moved dogfood assertions where five were real.

**Why the wrong answer is expensive in BOTH directions.** `files +0 -0`
is the sentence a checkpoint decides on — it is the whole argument for
*"the checkpoint owes NO fixture reconciliation"*. A phantom `+3` buys a
reconciliation nobody owes, which is the cheap direction; the expensive
one is equally available, a REAL `+1` hidden among build artefacts a
reader has learned to discount.

## PROMOTED at standing triage sitting #2 (2026-08-30), F-06 priority 12

Taken as filed: the criteria below are already exact, they were written
by the lane that measured the defect twice from two directions, and
`T-111-s10`'s own third criterion ORDERED this card into existence
rather than leaving it to a reader's judgement. Priority 12 rather than
the filed 6 because `crate-index` carries `T-167-s2` at 1 and the
budget's ruled fix chain ahead of it, and this is a correctness fix on a
walk nothing is currently mis-walking — real, and not first.

## Acceptance criteria

- THE walk SHALL skip any directory containing a `CACHEDIR.TAG` file
  whose first line is cargo's own tag signature, rather than matching on
  the directory's NAME — the name is what today's rule cannot pin, and a
  reader who chooses a third name is the case arm (a) cannot reach.
- THE exclusion SHALL be derived from the tag FILE and not from a widened
  ignore list, so it holds for a target directory created under any name
  by any tool that writes the same tag.
- THE change SHALL carry a positive control: a fixture directory that
  DOES carry the tag is excluded and an otherwise identical one that does
  NOT is still walked, so the exclusion is shown capable of failing (`A
  NEGATIVE ASSERTION NEEDS A POSITIVE CONTROL`, docs/CONVENTIONS.md).
- THE lane SHALL re-derive the graph at its own ref and record
  `index --check`'s answer before and after, since the trigger it changes
  is the walk that gate reads.
- THE doc half SHALL NOT be re-taken here: `T-111-s10` landed arm (a) in
  the POISON DRILL bullet, including the sentence naming this card's fix
  as the class remedy. This card changes code only.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
