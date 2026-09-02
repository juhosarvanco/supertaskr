---
id: T-167-s13
title: The drop clause names HOW MANY files the emitter thinned and never WHICH — apply_budget discards the only record of that, so the one actionable half of a truncation report cannot be printed
feature: F-06
milestone: 4
priority: 4
size: S
status: planned
suggested_by: executor claude-opus-5@subagent @T-167-s5
blocked_by: []
touches: [crate-index]
builder:
verifier:
built_by:
verified_by:
review: independent
---

**FOUND WHILE BUILDING T-167-s5, AND DELIBERATELY NOT BUILT THERE.**
That card asked the alarm block to print the drop "and ideally which
files thinned". The count was built and pinned; the LIST was not, and
the reason is a signature rather than an oversight — which is the
distinction `T-196` and `T-208` established for this family.

`emit::apply_budget` accumulates the set it empties in a local
`all_dropped: BTreeSet<String>` and returns only `Graph`. The set is
dropped on return, and **it is not recoverable from the emitted
document**: a file whose `symbols` array was emptied by the budget is
byte-for-byte indistinguishable from a file that never had symbols. So
`stats.truncated_files` — a COUNT — is the last surviving trace of
which files were thinned, and a count cannot name them.

**THE UNIT IS THE POINT, AND T-167-s5 PINNED IT.** That lane's clause
prints `truncated_files` and says in the printed line that the unit is
FILES whose array was emptied, never symbols. This card does not move
that; it asks for the half a reader can act on. A count tells a lane
the map is lying; the list tells it *where*, which is the difference
between "regenerate and hope" and "these four files have no symbol
panel in the map today".

## Why it is a separate card

The change is to the EMITTER's signature or to `Graph`, not to a render
clause — `apply_budget` would have to return its dropped set (or record
it in `stats` as a list beside the count), and `CheckReport` would carry
it through to `check::drop_clause`. That is a different blast radius
from T-167-s5's, which stayed entirely inside `check.rs`'s own render
path, and it lands in the same file the schema is pinned on.

**AND THE SCHEMA IS THE REAL QUESTION.** `Stats` is under ADR-014's
content-determined rule and every optional member is omitted when
0/false. A list of paths in `stats` is a new schema member with a size
that grows with the truncation — on a badly truncated graph it is a
list of hundreds of paths inside the very document whose size caused
the truncation, which is a feedback loop worth deciding deliberately
rather than discovering. The cheaper shape may be to leave the schema
alone and return the set from `apply_budget` to `check` only, so the
list is printed by the gate and never committed.

## Acceptance criteria

- WHERE the fresh emit thinned any file, THE alarm block SHALL name
  WHICH files, bounded the way `check::MAX_LINES` already bounds every
  other delta list in this report ("... and N more").
- THE list SHALL be the emitter's own record of what IT emptied, never
  a re-derivation from empty `symbols` arrays — a file that legitimately
  has no symbols must never appear in it, and a fixture containing one
  is the control that decides it.
- WHERE the schema gains a member, THE decision SHALL be recorded
  against ADR-014's content-determined rule, including what the member
  costs on an already-truncated document.
- THE change SHALL NOT move `check::drop_clause`'s COUNT or its printed
  unit — `T-167-s5` pinned both, and the list is an addition beside
  them rather than a replacement for them.

## TRIAGE, 2026-09-02 — DISPOSITION IS PROMOTE, AND IT IS NOT APPLIED

Triaged at the architect seat at 1cd2c8d. The stamp stays `suggested` for
T-225's reason and no other: `brief.mjs --dispatch` printed 60,040 bytes
at 85dda6d against the 65,536-byte loss point, a promotion costs about
645 bytes, and the in-flight sections of the wave dispatched tonight
spend the rest. T-225 is dispatched as soon as T-216-s4 lands; when
T-225 lands, promote this card without re-triaging it. Read this as a
tool limit, never as a verdict on the finding.

**Holds**; F-06 p4 `[crate-index]`; `review: independent` set, because
the drop clause is the gate's own report.

**APPLIED, 2026-09-02, at the stamp of T-225's merge (7435eae):** the
byte ceiling that held this promotion no longer binds — `brief.mjs
--dispatch` answers what can START and `--full` is the triage view — so
the disposition above is now the stamp: `status: planned`.
