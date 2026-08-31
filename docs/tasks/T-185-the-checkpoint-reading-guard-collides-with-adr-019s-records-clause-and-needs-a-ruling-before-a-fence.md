---
id: T-185
title: The absorbed T-181 trigger cannot be built as written — a guard that reads a checkpoint record's CONTENTS is what ADR-019's Records clause forbids, and this needs a RULING before it needs a fence
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-167-s8, routed from inside the lane: the criterion is unbuildable as written, not merely out of fence"
touches: [.claude, tools/e2e]
---

**CLASS PARENT: `T-167-s8`** (this is its absorbed T-181 half, unbuilt).
Adjacent cards that already declined the same build for the same clause,
and which this does NOT duplicate — they refused to write a scanner,
while this reports a ratified decision colliding with a PROMOTED
criterion: `T-156-s1`, `T-156-s6`, `T-157`, `T-157-s2`.

**DISPOSITION HINT (the filer's, advisory):** this needs a RULING from
@human before it needs a fence — do not dispatch it as a build card. If
the ruling is *"the clause holds"*, the criterion should be struck from
`T-167-s8` and rebuilt as shape 1 below, which needs no ruling at all and
would have been buildable in this lane had it been the written
criterion. If the ruling is *"a pre-commit guard is outside the clause"*,
that belongs in an ADR-019 addendum first, and the fence is then
`[.claude, tools/e2e]` exactly as `T-167-s8`'s was.

**ROUTED OUT OF `T-167-s8`, WHICH BUILT ITS OWN TRIGGER AND STOPPED AT
THIS ONE.** That card's push guard shipped. Its ABSORBED half — T-181's
second trigger, the commit that adds a record under `docs/checkpoints/` —
did not, and the reason is not a fence. **It is a ratified @human
decision that says, in terms, that the thing the criterion asks for may
not exist.**

## The criterion, and the clause it meets

`T-167-s8`'s absorbed acceptance reads:

> WHEN a commit adds a record under `docs/checkpoints/`, THE guard SHALL
> refuse it unless that record carries a health-band census line and its
> exit, and — where the diff meets BOOT GATE's trigger — the boot check's
> exit and both `[nputer]` lines.

`docs/decisions/019-governing-docs-rules-truths-records.md`, `## Records`:

> **No suite, gate or generator may DEPEND on this directory's
> contents.** The two e2e specs that walk all of docs/ will walk these
> files as app content; that walk is not a dependency and must never
> become one.

A guard that refuses a commit unless the record's TEXT matches a shape is
a gate depending on that directory's contents. The two cannot both hold.

## WHY THIS IS A RULING AND NOT A JUDGEMENT CALL

**The clause is unamended and is restated in seven places**, derived at
`b8dcb37`, none of them transcribed from another:

- `docs/decisions/019-…md`, `## Records` — the source.
- `docs/checkpoints/TEMPLATE.md`, preamble, and again under
  `## Metrics (ADR-020)`: *"**NOTHING MAY READ THESE LINES BACK.** …the
  shape above is a WRITING instruction and not a schema anything parses.
  A reporter a human or a checkpointing integrator runs BY HAND over the
  records is fine; **a gate is not.**"*
- `docs/CONVENTIONS.md`, HEALTH BANDS AT THE CHECKPOINT: *"AND NOTHING
  MAY SCAN THE RECORDS FOR ANY OF THIS."*
- `method/docs-protocol.md` rule 4 and `method/roles/integrator.md`'s
  Checkpoint ritual step 3: *"No suite may ever depend on it."*
- `tools/e2e/tests/session-economics.spec.ts`'s file docblock, which is
  a lane DECLINING this exact build: *"a body that read the template to
  check it would enrol this suite as a reader of that directory."*

**ADR-020 amends nothing here** — its own `## Supersedes / amends`
says *"Amends nothing"* — and ADR-019's four addenda re-affirm the
clause rather than narrow it.

**The room that produced the clause moved in the LOOSENING direction and
still lands on the wrong side of this.** `docs/rooms/governing-docs.md`,
`## The ruling (@human, 2026-08-27)`, replaced the draft's *"read by no
suite, ever"* with *"NO DEPENDENCY, not as no walk"*. A walk is
permitted; a DEPENDENCY is what this criterion asks for.

**And four cards have already declined to build it** — `T-156-s1`
(*"a scanner over the records is the WRONG build of the next card"*),
`T-156-s6` (*"would break ADR-019"*), `T-157` (*"Criterion 2 has no
mechanical enforcement and must not get one"*) and `T-157-s2`
(*"A reporter a human or a checkpointing integrator RUNS BY HAND is
fine; a gate is not"*).

**NEITHER T-181, NOR THE ABSORPTION BLOCK, NOR THE TRIAGE RECORD CITES
THE CLAUSE.** That is the whole finding. The argument for the trigger is
strong and the measurement behind it is real; what was never done is the
check against the decision it collides with — the same omission the
absorbed card's own filer made about `cargo audit` and corrected by
checking.

## The ONE distinction that might survive, stated so the ruling can rule on it

A PRE-COMMIT guard is not obviously the thing the clause protects
against, and this is the argument a ruling seat should weigh rather than
have decided for it inside a lane:

- The hazard the clause names is a gate whose verdict is a function of an
  APPEND-ONLY, IMMUTABLE directory: once a bad record lands, the gate
  reds forever and the fix is forbidden, because records may not be
  edited.
- A pre-commit guard reads only the record **in the commit under
  judgement**, never a landed one, and never the directory. It cannot red
  retroactively, and the committer can always satisfy it before
  committing.

So the guard genuinely lacks the hazard — and the clause as WRITTEN is
categorical, and this repository has read it strictly every time it has
come up. **An executor does not get to prefer a rule's purpose to its
text against a ratified @human decision.** Hence: routed.

## Two shapes that would NOT collide, if the ruling goes the other way

1. **KEY ON THE FILENAME, DEMAND IN THE COMMIT MESSAGE.** The trigger
   (*a commit adds a file under `docs/checkpoints/`*) is filename-only,
   which is exactly the contact `docs-gate.mjs` already has and which
   Addendum 2 blessed — it reads FILENAMES and COMMIT TIMES, never
   contents. The READING then goes in the commit message, which
   `docs/CONVENTIONS.md` already prescribes for the METHOD EVAL GATE for
   a directly applicable reason: *"a file … would be a figure with no
   keeper — ADR-019's Law 2… A commit message is stamped at the ref it
   was measured at and cannot drift from it."* **This shape touches no
   record's contents at all** and is the recommended build.
2. **RULE THE PRE-COMMIT CASE OUT OF THE CLAUSE EXPLICITLY**, by an
   ADR-019 addendum distinguishing a gate over LANDED records from one
   over the record in the commit that adds it. That is @human's to write,
   not a lane's.

## A trap the next lane must not walk into

`T-157-s2` names it: a guard naming `docs/checkpoints/` in a RUNTIME
string enrols its file in `docs-scan.mjs`'s reader census, creating the
dependency sideways even if it only stats the path. Whichever shape
lands, derive that census (`docs-gate.mjs --census`) at the lane's own
ref before and after.

## And one live coupling

`T-182` (live lane at the time of writing) reasons from this guard as an
assumed fact: *"The `T-167-s8`/`T-181` guard already fires on the commit
that adds a record."* **It does not, and after `T-167-s8` it still will
not.** That card's own build should not rest on it.
