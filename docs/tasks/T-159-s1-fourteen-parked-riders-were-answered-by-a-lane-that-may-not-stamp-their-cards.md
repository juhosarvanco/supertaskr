---
id: T-159-s1
title: Fourteen parked cards named T-159 as their resurfacing condition and the bump answered every one, but disposition is triage's and the lane never touched their frontmatter
feature: F-01
milestone: 4
priority: 2
size: S
status: building
blocked_by: []
touches: [docs/tasks/T-052-s5-integrator-md-now-holds-two-numbered-lists-and-every-citation-cites-by-number.md, docs/tasks/T-091-s4-the-predicted-tree-comparison-is-practised-everywhere-and-written-nowhere.md, docs/tasks/T-104-s4-four-defects-in-the-card-s-own-criteria-that-the-merge-reveals-rather-than-introduces.md, docs/tasks/T-124-s1-the-planner-must-run-git-bare-in-its-own-cwd-and-write-with-the-write-tool.md, docs/tasks/T-126-s5-two-fences-that-cannot-be-obeyed-as-written.md, docs/tasks/T-126-s6-a-lanes-gate-derivation-is-stale-at-its-own-tip-and-only-the-verifier-seat-was-told.md, docs/tasks/T-132-s2-method-is-a-code-input-and-no-standing-gate-fires-on-it.md, docs/tasks/T-132-s4-the-staged-state-rule-two-shipped-files-cite-does-not-exist.md, docs/tasks/T-132-s5-ruling-thirteen-sorts-by-when-and-never-by-who.md, docs/tasks/T-132-s6-rule-four-partitions-by-checkout-and-ports-are-machine-wide.md, docs/tasks/T-133-s3-step-5b-requires-the-contract-and-names-no-way-to-obey-it.md, docs/tasks/T-135-s4-a-half-dispatched-card-has-no-status-and-the-executor-role-forbids-the-workaround.md, docs/tasks/T-145-s2-a-kit-file-changed-under-a-fence-that-could-not-bump-the-version-that-describes-it.md, docs/tasks/T-152-row-eleven-lives-in-a-file-the-read-first-set-does-not-name.md]
suggested_by: executor claude-opus-5@subagent @T-159
builder: claude-opus-5@subagent
verifier:
built_by:
verified_by:
review:
---

**PROMOTED at the first standing triage, 2026-08-30, near the TOP of its column — because until it lands the board is telling every seat something false about fourteen cards.**

**THE COUNT WAS RE-DERIVED AT THIS REF AND IT HOLDS EXACTLY: fourteen.**
`grep -l 'T-159' docs/tasks/T-*.md` returns 25 files at this ref (the
card measured 20 at `9a8a2e9`; the difference is the five `T-159-s*`
cards filed since plus T-159 itself — the PARKED subset is unchanged).
Filtering to `status: parked` gives the fourteen named in this card's
fence, and **every one of their resurfacing conditions has FIRED.**

The card's own 12+2 split also holds: twelve name T-159 as the primary
vehicle, and `T-132-s2` and `T-132-s6` name a different primary while
assigning an arm to it.

**THE ANSWERS ARE ALREADY WRITTEN. THIS CARD IS THE STAMPS.**
`docs/tasks/T-159-method-v018-the-metabolism-release.md` carries the
full per-rider disposition table — TAKEN, TAKEN in a better form,
DISCHARGED, WITHDRAWN, arm 1 taken — and all fourteen frontmatters still
read `status: parked`. The lane that wrote the answers had no standing to
stamp them, correctly: **disposition is triage's**, by the same
single-writer rule that governs every other placement field.

**TWO OF THE FOURTEEN ARE NOT SIMPLE STAMPS AND THIS IS THE PART A LANE
MUST NOT SKIM.** `T-132-s2`'s primary is discharged but its
trigger-widening arm survives with its author's own UNVERIFIED mark, and
`T-132-s6`'s arm 1 was taken while its arm 2 still waits on T-120-s2's
merge — a condition that has NOT fired. TASK-FORMAT is explicit that a
resurfaced card is re-derived, never trusted, and that **parking twice
with the same note is how a shelf forms**. So those two are re-parked
with a NEW condition each, not re-stamped under the old note.

**RE-DERIVE, DO NOT COPY THE TABLE.** Each of the fourteen gets its
needle re-run at the executing ref before its stamp is written; where an
ask no longer holds, the card says so in writing. The table is the
starting point and not the authority — this card's own count moved
between filing and promotion, and that is the lesson it exists to teach.

**THE FENCE NAMES ALL FOURTEEN CARD FILES EXPLICITLY.** A bare
`docs/tasks` fence is refused BY THE PARSER (`UNFENCEABLE_PATHS`) —
this card's first draft tried it and took `lib/parser/test/fence.test.ts`
to 2 failed / 312 passed at exit 1, which is why it arrived with no
fence at all. Narrowed by hand on the T-108 precedent.

**NO `touches:` ON PURPOSE, AND THE FIRST DRAFT OF THIS CARD GOT IT
WRONG IN THE FUNNIEST AVAILABLE WAY.** It was filed as
`touches: [docs/tasks/]` — the one directory `method/lane-protocol.md`
rule 5 says no card may fence, because the protocol writes there on
every card — by the same lane that was editing rule 5. The parser
refused it mechanically and `lib/parser/test/fence.test.ts` went **2
failed / 312 passed** at exit 1, naming the token. **That is the clause
working exactly as its own text says it must**: rule 5 requires this to
be refused WHERE THE FENCE IS READ rather than left to a reader,
because a fence-versus-fence comparison has no term for a protocol
write and cannot ever discover it. Placement fields are optional on a
suggestion; triage sets them at promotion, naming the individual card
files.

**CLASS PARENT: none — this is the first instance of a class the bump
itself created.** The metabolism text T-159 landed says a parked card
carries a resurfacing condition, that the condition is checkable by
whoever cuts the next lane over its fence, and that **a resurfaced card
is re-derived and either taken or parked back with a NEW condition**.
T-159 is the first dispatch to run that loop at scale, and it hit the
seam the loop does not cover: **the lane that answers a rider may not
dispose of it.**

**DISPOSITION HINT: promote to a triage sitting of one pass — every
answer is already written, this needs the stamps and nothing else.**

## Derived at the lane's base 9a8a2e9

`command grep -l 'T-159' docs/tasks/T-*.md` returns twenty files; of
those, **fourteen are `status: parked`**. Twelve carry T-159 as their
named resurfacing condition; two more (`T-132-s2`, `T-132-s6`) name a
different primary vehicle and assign an arm to T-159, which is the
arithmetic behind the amnesty record's *"twelve parked riders"* and is
worth writing down rather than leaving as a discrepancy.

The bump's implementation notes on
`docs/tasks/T-159-method-v018-the-metabolism-release.md` carry the
per-rider disposition — TAKEN with the file it landed in, or PARKED
BACK with the reason its ask no longer holds — for all fourteen plus
the record-derived riders. **What is missing is the frontmatter half**,
and it is missing deliberately: `roles/executor.md` files findings and
routes them, `tasks/TASK-FORMAT.md` gives disposition to triage under
the same single-writer rule that governs every other placement field,
and a lane stamping fourteen other cards would be exactly the
disposition-without-triage the method forbids an integrator.

## What the taker does

Read the notes section, then for each rider make one of the three
moves. Three shapes recur and each wants a different one:

- **TAKEN IN FULL** — the ask is now text in `method/` at v0.1.8.
  Normally promoted-by-absorption: the bump's card is the absorbing
  card and the suggestion file goes, with the `Absorbs:` line as the
  surviving record.
- **DISCHARGED BEFORE THE BUMP REACHED IT** — the ask had already
  landed by another route and the parking note is stale. The archive
  wording this bump added applies: *discharged, naming the commit*, not
  *declined*.
- **PARKED BACK** — an arm survives that the fence could not reach.
  These need a NEW condition, because parking twice under the same note
  is the shelf the metabolism text exists to prevent.

## Why it is worth one sitting rather than a background drip

The rider set is the first real test of whether a parking condition is
a promise or a filing cabinet. Fourteen conditions came due on one
dispatch and were all met on that dispatch — **the mechanism worked** —
and if the board still shows fourteen parked cards a week later, what
it will have demonstrated instead is that resurfacing costs nothing to
declare and everything to honour.

## Implementation notes

Built at base `51fa31c` on `task/T-159-s1-method-debt`, worktree
`/Users/ujju/Projects/nputer-T-159-s1`. Every figure below is derived at
the ref it names; live-environment facts carry the time they were read.

### Understanding, confirmed before anything was touched

This card is the FRONTMATTER HALF of a disposition whose reasoning half
is already written. T-159's lane answered fourteen parked riders whose
resurfacing condition had fired, wrote the per-rider table into
`docs/tasks/T-159-method-v018-the-metabolism-release.md`, and correctly
did not stamp a single one of the fourteen — disposition is triage's by
the same single-writer rule that governs every other placement field. My
job is to write the stamps triage's promotion note ordered: for each of
the fourteen, re-derive its needle at MY ref (never copy the table), then
make exactly one of three moves — **promoted by absorption** where the
ask is now text at v0.1.8 (the bump's card is the absorbing card, the
`Absorbs:` line is the surviving record, the suggestion file goes in the
same commit); **archived as DISCHARGED-NOT-DECLINED**, naming the
commit, where the ask had already landed by another route and the
parking note is stale; or **PARKED BACK with a NEW condition** where an
arm survives that the fence could not reach — the last being explicitly
required for `T-132-s2` (trigger-widening, its author's own UNVERIFIED
mark) and `T-132-s6` (arm 2, waiting on a T-120-s2 merge that has not
happened), because parking twice under the same note is how a shelf
forms. My fence is exactly the fourteen card files plus the protocol's
always-writable `docs/tasks/`; `method/` and `docs/CONVENTIONS.md` are
outside it, so where a rider's residual wants method text I record it and
route it rather than reaching out.
