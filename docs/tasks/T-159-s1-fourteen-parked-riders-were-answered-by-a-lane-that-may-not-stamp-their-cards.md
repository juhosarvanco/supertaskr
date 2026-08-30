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

### The census, re-derived — and THE CARD'S OWN COMMAND IS WRONG AT THIS REF

The card publishes its census as a command and an answer: *"`grep -l
'T-159' docs/tasks/T-*.md` returns 25 files at this ref … Filtering to
`status: parked` gives the fourteen named in this card's fence."* Run at
`51fa31c`, the ref this lane executed at, **it returns 29 files, of which
17 are `status: parked`** — and excluding the vehicle's own suggestion
train still leaves 16. **The FENCE is right and the COMMAND is not.** The
three extras are `T-159-s2` (its own id contains the vehicle's), and
`T-143-s2` and `T-155-s5`, which merely CITE T-159 in prose — `T-155-s5`
resurfaces on *"the next checkpoint written for a `tools/method-evals`
card"* and `T-143-s2` quotes `T-159-s4` as a worked fence-overlap
example. Each of the three was read by hand and none is a rider. So the
rider set is exactly the fourteen in the fence, the 12+2 split holds
(`T-132-s2` and `T-132-s6` name another primary and assign an arm here),
and **the card's own lesson landed on the card itself**: the count moved
20 → 25 → 29 across filing, promotion and execution, and the sentence
that wrote it down as exact was one day old. Filed as `T-159-s6`.

### What each of the fourteen received, and why

Every landing below was re-derived at `51fa31c` from the method text
itself, never read off T-159's table. **ELEVEN PROMOTED BY ABSORPTION**
into `docs/tasks/T-159-method-v018-the-metabolism-release.md` — the
`Absorbs:` line there is the surviving record and carries the per-rider
citations, so removal is not silent deletion: `T-052-s5` (integrator.md's
citation vocabulary), `T-091-s4` (the predicted-tree comparison and the
checkpoint loudness clause; `git grep -n merge-tree -- method/` went from
zero rows to `integrator.md:55`), `T-104-s4` (item 2 taken, item 4
discharged at `a8d6df6`, items 1 and 3 ruled NO WORK at the amnesty and
that ruling carried onto the absorption line), `T-124-s1` (arm A landed,
arm B carried by `T-159-s4`), `T-126-s6`, `T-132-s4`, `T-132-s5`,
`T-133-s3` (the CONVENTIONS/orchestrator split its own first question
asked for), `T-135-s4`, `T-145-s2`, `T-152`. Three ids ride with them
transitively — `T-138-s4` into `T-152`, `T-132-s3` into `T-133-s3`,
`T-120-s1` into `T-132-s4` — and are named on the line so nothing
absorbed twice loses its record.

**ONE ARCHIVED AS DISCHARGED — NOT DECLINED.** `T-126-s5` moved to
`docs/tasks/rejected/` at `status: rejected`, naming the commit as this
project's archive wording requires. **Both its arms were already closed
when its parking note was written**, which the note denies: `9dfb5a0`
(T-134, 2026-08-26) landed the own-card exemption, the not-a-fence-breach
sentence, the unfenceable-directory clause AND the parser half
(`UNFENCEABLE_PATHS = ['docs/tasks']`), three days before the 2026-08-29
amnesty sitting that called the residual *"still unwritten anywhere"*;
arm one's general ruling landed at `b1783a6` (T-132, 2026-08-25).
**T-159's own notes credit this to "T-154 AFTER the parking note was
written" and both halves of that are wrong** — `git log -S "A CARD'S OWN
FILE IS NEVER PART OF ITS OWN FENCE" -- method/lane-protocol.md` returns
exactly one commit and it is `9dfb5a0`. The correction is written on the
archived card, where the evidence is; the disposition was DISCHARGE
either way, so nothing downstream moves.

**TWO PARKED BACK WITH NEW CONDITIONS, EACH NARROWED TO THE ONE ARM THE
BUMP COULD NOT REACH** — the part the card said a lane must not skim.
`T-132-s2`: primary discharged by the METHOD EVAL GATE
(`docs/CONVENTIONS.md:1542`), cargo residual TAKEN and named in that same
bullet at `:1605-1619`, and the measurement still reproduces —
`node tools/e2e/scripts/docs-gate.mjs` on three `method/` paths from the
repository root gives *"none under docs/ — this gate is not owed"*,
exit 0. What survives is the trigger-widening arm its author marked
UNVERIFIED, whose two preconditions are countable at this ref (24 derived
readers across 4 suites; 6 root-anchored files argued in
`ROOT_ANCHOR_LEDGER`). **New condition: the merge of `T-127-s8`**, the
planned `[tools/e2e]` card whose own subject is that census, falling back
to the next dispatch reaching BOTH `docs-gate.mjs` and `docs-scan.mjs`.
`T-132-s6`: arm 1 taken in a better form and arm 3 substantially with it
(rule 4's MACHINE-versus-CHECKOUT class, `lane-protocol.md:159-180`),
its T-137-s9 corroboration discharged by the same text, and the card's
LITERAL ask confirmed to have no site — `command grep -in 'surface'
docs/CONVENTIONS.md` returns **3 rows at `51fa31c`** and none is the
five-surface enumeration. Arm 2 alone survives and is one line to check:
`tools/e2e/preflight.ts:28-29`, `resolveLanePort()` still falls back to
the constant **14520**. **New condition: whichever comes first of the
merge of `T-120-s2` (`planned` at this ref, so the old condition has NOT
fired) or the next dispatch whose fence reaches `preflight.ts`** — a
pair, because the old note bet everything on one card surviving triage.

### What was NOT done, and why

- **No method text was touched.** Every rider's ask was already written;
  the two survivors want a `tools/e2e` scanner change and a
  `tools/e2e/preflight.ts` construction, neither of which is method text
  and neither of which is in this fence.
- **No corroboration was appended to `T-092-s1`**, which owns the sibling
  shape a layer down (a whole-card token match standing in for a field
  assertion). Appending to another parked card is a TRIAGE act, not a
  protocol write, and this seat holds no standing for it. The genus is
  named inside `T-159-s6` instead, where triage will find it and may
  merge the two.
- **No merge, no push, no branch but this one**, per the dispatching
  instruction — which overrides the size-S self-integration this card's
  ceremony row would otherwise give it. The worktree is left standing.
