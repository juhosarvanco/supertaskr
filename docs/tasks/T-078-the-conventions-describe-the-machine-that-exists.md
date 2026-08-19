---
id: T-078
title: The conventions describe the machine that exists — the walks, the gate's window, and the drill's missing clauses
feature: F-01
milestone: 4
priority: 2
size: M
status: planned
blocked_by: []
touches: [docs/CONVENTIONS.md, method/]
builder:
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-054-s1, T-054-s2, T-054-s3, T-054-s4, T-060-s1, T-060-s2
(fourth triage, 2026-08-19). The suggestion files are removed in the
same commit as this card. Six findings, one file. Two cards touching
only `docs/CONVENTIONS.md` could never run in parallel anyway, so they
are one card.

**HOW A RULE GOES UNWRITTEN WHILE EVERYONE BELIEVES IT EXISTS.** T-060's
re-verification verdict ends "No blocker or new suggestion remains",
which reads as closing all five of its findings. Two of them — s1 and s2
— are filed explicitly as CLASSES whose entire ask is a paragraph in
this file, and their INSTANCES were indeed fixed on that branch. Grep
over `docs/CONVENTIONS.md` and `method/` at the fourth triage for every
phrase in either ask returned **zero hits**. The rules were never
written, the verdict sentence was true about the code and misleading
about the method, and both files sat at `status: suggested` for three
triages while the project believed the lesson had landed. That is the
motivation for this card, and it is also the reason its criteria are
about TEXT rather than about behaviour.

THE POISON DRILL IS THE SHARPEST HALF AND IT BIT ITS OWN VERIFIER ON THE
FIRST DRILL. A global substitution of a message literal over
`workflow-parity.spec.ts` reported three substitutions and stayed GREEN
at 14 passed, exit 0. The literal lives once in the producer and once in
each of two assertions, so the mutation changed both sides at once and
the test still agreed with itself. **A symmetric mutation produces a
green indistinguishable from a vacuous assertion — the exact failure the
drill exists to detect, wearing the drill's own costume.** The recorded
lesson ("count your substitutions, never assume a mutation landed")
would NOT have caught it: three was the true number of occurrences and
three is what applied. The same failure one level deeper, in the same
session: a doc mutation written through a perl one-liner reported one
substitution and changed nothing observable, because without a UTF-8
output layer perl emitted a raw byte rather than the two-byte separator
the splitter looks for. The count was right; the TEXT was wrong.

## Acceptance criteria
- THE POISON DRILL bullet SHALL gain the ONE-SIDEDNESS clause, in its
  "MUTATE every new or changed assertion" sentence: *mutating the code
  under test OR the assertion, never a literal the two SHARE, and
  confirming the mutated TEXT is what you intended rather than only that
  a substitution count was non-zero. A symmetric mutation stays green
  and reads exactly like a vacuous assertion.* The bullet already says
  to mutate every changed ASSERTION rather than every body and is right
  about why; one-sidedness is the natural companion, because both are
  about making the mutation land where the assertion can see it.
- THE SAME BULLET SHALL NUMBER THE TWO SHAPES A VALUE-POISON PASSES,
  because two lanes independently found one in the same week and both
  have now landed. The four already catalogued share one tell — **the
  matcher moved, never the value**. These two do not:
  - **SHAPE FIVE — the assertion SET has no cardinality or coverage
    floor, so deleting an assertion deletes its own failure.** Measured
    on `token-scan.mjs` (filed as T-058-s2, absorbed by **T-080**):
    four deletions applied one at a time each left the selftest green at
    a SMALLER printed number, and the sharpest lost the only positive
    sample for each of four patterns and stayed green everywhere. The
    module already knows this class exists — its own must-cover list
    records T-045 measuring it — and defends exactly one property with
    it. **Shape five is listed FIRST because it has a mechanical
    remedy**: a coverage floor per pattern id, or a cardinality pin,
    makes a deletion fail against something that did not move with it.
  - **SHAPE SIX — a body that reds under an expected-value poison while
    killing no mutant another test does not already kill.** Measured on
    `interview-model.test.ts` (filed as T-057-s1, absorbed by **T-072**):
    a replacement positive was byte-equivalent to a test three cases
    above it, and rewriting one inert string made the two calls
    character-identical with the file still passing 58 of 58. It is not
    vacuous in the poison sense, which is precisely why the poison
    discipline passed it. There is no mechanical remedy — the drill has
    to ask whether the body kills a mutant of its OWN.
- THE TESTING GOTCHAS SHALL GAIN THE NEGATIVE-CONTROL RULE, beside the
  constant-parametrisation rule T-063 produced, because they are one
  lesson from two directions and a reader meeting one should meet the
  other: *a test that asserts something is REFUSED must first prove the
  fixture would otherwise have been ACCEPTED; otherwise it cannot tell
  refusal from absence.* Worked example, measured: a lookup asserted to
  return nothing for a relative path element passed with the
  pre-T-060 VULNERABILITY restored, because the fixture did not exist
  relative to the test's working directory and both implementations
  refused it for different reasons. Counting assertions would not have
  shown it; only mutating the producer did. For a path-shaped fixture
  the control has to be built the way the PRODUCER builds it, not merely
  written to look similar.
- AND THE GUARD-LIFT RULE, which the same session paid for: *when a test
  lifts a safety guard in order to discriminate, the lifted arm SHALL be
  proven to terminate in a fixture, and the body SHALL assert the
  guard's state before it exercises anything.* The discriminating half
  of a SAFETY guard is by construction a deliberate removal of the
  safety, executed in the same process as every other test with whatever
  ambient environment the developer has — **the stronger the guard, the
  more dangerous its own discriminator**. T-060 reached the developer's
  real CLI inside the test written to prove that could not happen. The
  instance is now structurally unreachable (child process, empty search
  path, pre-flight assert) rather than argued away; the RULE is written
  nowhere, and it applies to every guard the project has: the ACL pin,
  the containment rules, the session-id character class, the cleared
  environment.
- A CITATION SHALL NAME A SYMBOL, NOT A LINE. Four of the fourth
  triage's forty-six findings cited line numbers that no longer
  resolved, every one of them drifted downward by a later merge into the
  same file while the finding's SUBSTANCE reproduced exactly. A file
  path plus a function, test or constant name survives the merges a line
  number does not, and it is what a reader can search for.
- THE GRAPH REGEN TRIGGER SHALL STOP SAYING "outside docs/". The
  indexer's walk is narrower than the rule: `.nputerignore` excludes
  `docs/`, `tools/` AND the indexer's own fixture trees, so a diff
  confined to `tools/**` matches the trigger and cannot move the graph
  by construction — demonstrated on T-054's own branch, whose diff
  included a `.ts` file under `tools/` and whose `index --check`
  reported the graph current and unchanged. The error direction is SAFE,
  which is why this is a wording fix and not a defect. **PREFERRED ARM,
  because it cannot go stale**: keep the wide trigger and say the regen
  is a NO-OP unless an INDEXED file moved, with `index --check` as the
  one-second way to find out — inverting the rule from "predict whether
  to regen" into "ask the gate", which is the shape T-054 made
  available.
- THE "WHICH WALK SEES THIS FILE" OPEN QUESTION SHALL BE CLOSED WITH ONE
  SHORT TABLE, stating the walks side by side: the graph's walk, the
  token lint's TOKEN corpus, the token lint's CONTROL corpus, and the
  parser's live-docs walk. STATE carries this as an open question and
  every integrator re-derives it; the 2026-08-17 merge is the live case,
  where five new files split four to the graph and five to the lint.
  **The table SHALL accommodate the fourth walk T-058 added** — a
  CONTROL corpus of 529 files against TOKEN's 118 at `9b15f7d` — and
  SHALL cross-reference `.nputerignore` and the scanner as the
  authorities rather than restating their contents, so it cannot drift
  from the files that decide it.
- GRAPH REGEN's claim that the property is "held by a gate" SHALL STOP
  READING PRESENT-TENSE. `git remote` returns ZERO remotes — verified
  again at the fourth triage — and this file says so itself one section
  above. The bullet SHALL name the local confirmation it already implies
  and say beside it that the CI step becomes the ENFORCING copy at the
  repo's first push. The property is enforced by considerably more than
  nothing (the regen obligation is retained in full, a failing regen
  reds on its own, and deleting the step reds the parity spec), but not
  by what the sentence claims.
- `lint:tokens` SHALL GAIN AN EXIT-CODE LEGEND. This file legends exit
  codes for the graph check, the boot check and the audit; **CI's FIRST
  step is the only gate without one**. The legend SHALL describe what
  the gate does TODAY, including the gap: a tree the gate cannot read
  (git absent, the corpus underivable) and a tree that is genuinely
  dirty both exit 1, so "the gate could not run" and "the tree has a
  violation" are no longer distinguishable. **T-080 restores that
  distinction**; this criterion SHALL be written so it does not depend
  on T-080 landing first, and SHALL gain the second row when it does.
- THE MIDDLE-DOT SEPARATOR RULE SHALL GET A HOME a next editor will
  read: a separator may not appear inside a command's parenthetical,
  only between commands or after the last one. It currently lives only
  in T-054's implementation notes, which the next editor of the build
  section will not open. **PREFERRED HOME: a clause in the CI bullet
  itself, which keeps this card `docs/CONVENTIONS.md`-only.** The
  alternative home — the parity spec's own docstring, which already
  explains the ends-at-first-non-backtick rule in general terms but
  never names the parenthetical hazard — **WIDENS THIS CARD'S FENCE TO
  `tools/e2e`** and SHALL be chosen deliberately if at all.
- AND T-054'S NOTES SHALL BE CORRECTED WITH IT. They say three commands
  "would have silently vanished from CI parity". Measured: the exposed
  command count drops from 19 to 16 and the lane REDS, 2 failed and 12
  passed, naming all three by key — because the derivation's second
  direction catches every truncated command the spec CLAIMS. The
  truncation is silent in exactly ONE case: a command the DOC gains that
  the spec does not yet claim. That is narrower, more precise, and the
  shape of every future edit to that section, which is why it is worth
  stating exactly.

Verification: prose only. The parity spec SHALL stay green — it parses
this file, so every edit to a command bullet is a live test. Poison
discipline applies to any spec change, one-sided per this card's own new
clause. **No code fence is held: `docs/CONVENTIONS.md` and `method/`
collide with no code lane**, which is why this card is dispatchable
beside anything.

## Implementation notes

## Verdicts
