---
id: T-132
title: Three of the four rulings this card was filed to add were already written in method/ and the architect broke all three — the finding is not an incomplete method, it is a prose contract that did not bind
feature: F-01
milestone: 4
priority: 5
size: S
status: planned
blocked_by: [T-104]
touches: [method/]
builder:
verifier:
built_by:
verified_by:
review:
---

**THIS CARD WAS DRAFTED TO ADD FOUR RULINGS AND SHRANK TO ONE AND A HALF
WHEN ITS OWN CLAIMS WERE CHECKED.** The checking is the deliverable. It
is recorded in full rather than quietly corrected, because the corrected
version is a better finding than the draft was.

The architect drafted this as *"four rulings were made in tonight's
verdicts and have nowhere to live"*, on the model of `T-104`. Then read
the files. **Three of the four were already written in `method/`, in
detail, with their mechanisms and in two cases their measured costs — and
the architect had violated all three during the same session.**

## WHAT WAS ALREADY WRITTEN, AND WHO BROKE IT

**1. `method/roles/orchestrator.md:30-31` already specifies how a brief
is built:** *"The brief is assembled to the contract in
roles/executor.md — **every row, from the sources that row names**."*
And `executor.md`'s row 5 names those sources exactly: the card's
`touches:`, **the repository's live worktree list on a task branch**, and
the slug↔path map with the authoritative field named.

**Every dispatch brief written on 2026-08-25 violated that contract.**
Not by omitting rows — by filling them from the dispatcher's context
instead of from the sources the row names. The consequences were
measured: at least one error per brief, a lane list wrong four times, and
in the worst case an assertion that a lane *"notes"* something the lane
records nowhere. **The rule was not missing. It was not read.**

**2. The same file, at lines 24-29, already forbids the stamp-after-cut
error and states its hazard**: the stamp is written on the integration
branch and committed BEFORE the cut, *"and the lane inherits the stamp in
its own base rather than writing that line itself. Stamping after the cut
makes that line writable by both branches — clean only while a single
side writes it."*

**The architect stamped two cards after the cut**, believing the
held-index rule forbade writing to main. **It did not**, and this file
already said what to do instead. Two lanes then derived fence
disjointness from a stale fence on main and got the wrong answer. That is
`T-128`'s fourth instance, and it was a violation of a written rule
rather than a gap in one.

**3. `docs/CONVENTIONS.md`'s POISON DRILL bullet already carries the
drill-pollution class in full** — the required per-drill
`CARGO_TARGET_DIR`, the mechanism (`env!("CARGO_MANIFEST_DIR")` baked in
at compile time and not fingerprinted by cargo), the measured cost of
getting it wrong on T-013's lane, **and the reverse direction verbatim**:
*"a mutant can look DEAD against a stale binary that never saw the
mutation."* The architect drafted this as a hazard nobody had named. It
is named better than the draft named it.

**4. `method/roles/executor.md:126-128` already rules the out-of-fence
criterion**: *"A criterion that cannot be built inside the fence is NOT
built. Record it, route it as a suggestion naming the fence it needs, and
build the rest."*

T-126's lane deleted a file outside its fence because its card told it
to. **That is a violation of an existing rule, not a question the method
had left open** — which is what T-126's verifier concluded independently,
and its reasoning is worth reading at the verdict rather than
paraphrasing: `executor.md` is unconditional, a criterion-shaped
exception would nullify it because *every* out-of-fence edit is made
because some criterion seemed to want it, and *"held by no live lane"* is
a statement about collision risk rather than authority.

## THE REFRAME, WHICH IS THE POINT OF THE CARD

**A prose contract in `method/` did not bind the seat that writes
briefs — and that seat is the architect's own.** Three rules, all
written, all clear, all violated in one session by the reader most
responsible for them.

**This is the strongest available evidence for a claim `T-131` makes on
weaker grounds**: a convention that could be a gate should be a gate.
`T-131` argues it from cost — prose is re-read by every agent, expensively
and lossily. **This card argues it from failure**: the prose was read
*enough to be quoted* and still did not change what the dispatcher did.

**And it changes the fix.** "Adopt a rule that briefs carry no state" is
the wrong remedy for a rule that already exists. The remedy for a
violated contract is a **check**, not more prose — a dispatcher that
cannot emit a brief row without naming the command it came from, or a
brief template whose rows are commands rather than values.

## WHAT SURVIVES AS GENUINELY NEW

- **THIRTEEN — repair what the merge introduces, file what the merge
  merely reveals.** Stated by T-108's integrator. Verified absent from
  `method/` and `docs/CONVENTIONS.md`. It is the missing companion to
  `T-083`'s ruling that discharging a finding is not the integrator's
  call: that rule says what an integrator may not CLOSE; this says what it
  may FIX. The same integrator then applied it against itself, repairing a
  citation its own lane had shipped that went stale in thirty-one minutes.
- **~~A third pollution direction~~ — REMOVED FROM THIS CARD BEFORE
  FILING, and the removal is worth more than the item.** T-129's verifier
  found that its own drill left a mutated binary in its target directory
  and produced a well-formed, entirely false defect report before it
  caught itself. That sentence belongs in the POISON DRILL bullet of
  `docs/CONVENTIONS.md` — **and this card's fence is `[method/]`, which
  cannot reach that file at all.** As drafted the item was not merely
  duplicative but **unperformable**.
  **It already has a home**: `T-104`'s integrator routed it to **`T-092`**
  (`touches: [docs/CONVENTIONS.md, app-agent]`), in ONE edit with
  `T-079-s3` items 2–3 and `T-130-s1`, on the argument that all three are
  **one gap seen three ways — the bullet rules how a restoration is PROVED
  and never says what restoring MEANS.** Caught by T-129's integrator
  reading this draft; recorded rather than silently deleted, because *a
  card drafted to stop rulings from scattering had begun scattering one.*
- **A CARD-AUTHOR CLAUSE for the out-of-fence rule.** `executor.md:126`
  binds the EXECUTOR. Nothing binds the person WRITING the criterion.
  T-126's card ordered an out-of-fence edit and the rule as written puts
  the whole burden of refusal on the lane. One clause in the
  criteria-writing guidance closes it.
- **`T-108-s3` and `T-108-s4`**, both already filed: step 5's notes
  requirement is unperformable for a card fenced at path granularity
  (a card's own file is never in its own fence, and two lanes split on it
  the same night); and the pathspec rule needs a ROOT clause, because
  `git grep -- .` from a subdirectory exits 1 on a string that is present.

## Acceptance criteria

- **THE THREE VIOLATIONS SHALL BE RECORDED WHERE THE RULE IS, not only
  here.** A rule that has been broken once by the seat that owns it earns
  a sentence saying so — the project's archive is trustworthy because it
  records its own errors with attribution, and an unattributed rule reads
  as advice.
- **NO ALREADY-WRITTEN RULE SHALL BE RESTATED** (T-057). For each of the
  three, the deliverable is a citation and at most a clause — **not a
  second spelling.** IF a closer reading shows one of the three is NOT in
  fact covered THEN say so with the line, and it becomes a real addition.
- **RULING THIRTEEN SHALL LAND IN `method/roles/integrator.md`**, beside
  the ritual, and SHALL be cited to the verdict that made it.
- **THE CARD-AUTHOR CLAUSE SHALL BIND THE WRITER, NOT THE READER.** It is
  a criteria-writing rule; putting it in `executor.md` again would
  reproduce the defect it fixes.
- **THE COUNT AND THE ABSENCES SHALL BE RE-DERIVED AT THE EXECUTING REF.**
  This card's central claim is "already written" and the executor SHALL
  verify each of the four independently before acting. **The architect
  drafted three false novelty claims here and caught them only by opening
  the files; the same check is owed again.**
- **THE REFRAME SHALL NOT BECOME A PROPOSAL.** Whether to build a check
  is `T-131`'s question and @human's ruling. **This card records the
  evidence and SHALL NOT implement a gate.**

Verification: headless. **This card adds no test body and that is stated
here rather than left silent.** The DOCS GATE fires on this card and on
any `method/` path a code suite reads — run it **directly, never through
`xargs`**, and record what it owed and each exit. `cargo test` is owed IF
the method snapshot version moves; it should not, since this card adds
clauses rather than formats — **derive that rather than assuming it.**
Ask GRAPH REGEN rather than predicting, and ask again after any write.
@human: none — every ruling here was made by a hand with standing, and
the corrections are to the architect's own draft.
