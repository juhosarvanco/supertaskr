---
id: T-108-s3
title: executor.md step 5 is unperformable under a path-granular fence — a card's own file is never in its own fence, so "append implementation notes to the task file" is a fence breach for every narrowly-fenced card, and this is the SECOND unruled conflict on that one step
status: suggested
suggested_by: integrator claude-opus-5 @T-108
---

Routed to **`T-104`**, the rulings vehicle, whose fence is
`[method/, docs/CONVENTIONS.md, app-agent]` and which can therefore take
this without widening. Found by T-108's executor, which hit it and
resolved it correctly on its own; recorded by T-108's integrator at merge
`188262e`.

## The conflict

`method/roles/executor.md` step 5:

> Append Implementation notes to the task file: what you did, what you'd
> flag for the verifier, anything you noticed but didn't do

`docs/tasks/T-108-…md`'s architect fence ruling, written at `765924d`:

> It SHALL NOT write any `docs/tasks/` path outside the three named
> above

and, in the same ruling, the sentence that makes the two irreconcilable:

> **A CARD'S OWN FILE IS NEVER PART OF ITS FENCE** … the dispatch stamp
> and the integrator's closing stamp are **protocol writes, not lane
> writes**

**So the task file step 5 orders the executor to append to is, by
construction, outside the fence.** T-108's executor obeyed the ruling and
put everything in its report instead. That was the right call — and the
report is the only reason T-108's integrator could check the work at all,
since this card had no verifier.

## Why this is general and not a quirk of one card

**Every card fenced at path granularity has this property**, because the
"a card's own file is never in its fence" clause is not about T-108 — it
is the reason a fence check can be left switched on at all. And T-108's
ruling asks the project to adopt path granularity as the norm (*"a bare
`docs/tasks/` directory fence is never correct"*). **So the conflict
arrives with the improvement**: the narrower the fences get, the more
often step 5 is unperformable.

**THE TWO LANES LIVE TONIGHT SPLIT ON IT**, which is the signature of an
unruled conflict rather than of one session's mistake: T-116's executor
appended implementation notes to its own card (its integrator's
checkpoint records a miscount inside those notes, so they are certainly
there), and T-108's did not. Two faithful executors, one method, two
behaviours.

## It is the SECOND conflict on this step, and executor.md already records the first

`method/roles/executor.md`'s own closing bullet:

> **THE VERIFIER READS THE CARD THIS ROLE WRITES INTO, and that conflict
> is recorded here rather than resolved.** `roles/verifier.md` gives the
> verifier "ONLY the task file (spec + acceptance criteria) and the diff
> — never the executor's reasoning", while step 5 above appends this
> role's reasoning to that same task file. Both cannot hold.

**That is one conflict about where step 5's output goes. This is a
second, about whether step 5 may write there at all.** Two independent
conflicts on one step is an argument about the step rather than about
either counterparty, and it is worth ruling as one question.

## What a ruling has to decide, not what it should decide

Recorded as questions because an integrator does not get to pick:

1. **Is the executor's own task file a protocol write or a lane write?**
   The fence ruling says the STAMP is a protocol write. Implementation
   notes are neither a stamp nor lane content — they are a third thing,
   and nothing names it.
2. **If notes belong in the report rather than on the card, what carries
   them into the archive?** The integrator's checkpoint is the only hand
   left, and an integrator transcribing an executor's notes is a copy of
   a fact, which is what T-057 exists to prevent.
3. **Does the answer differ by size tier?** A size-S card self-integrates,
   so its executor IS the hand that would file the notes — which makes
   the conflict invisible at S and sharp at M and above, exactly backwards
   from where the ceremony is heaviest.

**A change to `method/roles/executor.md`'s step 5 is a method format
change and therefore a version bump**, whose third file is Rust
(`METHOD_SNAPSHOT_VERSION` in `app/src-tauri/src/agent/kit.rs`) — and
`T-104` is the first lane in eight that can pay that debt, since its
fence includes `app-agent`. Taking this alongside `T-124-s1` costs one
commit instead of two.
