---
id: T-121
title: The verifier is promised blindness and handed the file the executor writes into — the interim discipline is a BOUNDED read, and it belongs where a verifier reads it
feature: F-01
milestone: 4
priority: 59
size: M
status: planned
blocked_by: []
touches: [docs/CONVENTIONS.md]
builder:
verifier:
built_by:
verified_by:
review:
---

> **DRAFTER'S NOTE — for the architect, remove before landing.** The
> triage brief for this card named the interim remedy as
> **`sed -n '1,86p'`**. **THE TREE REFUTES THAT NUMBER, in both
> directions, and the card below is written against the tree.** Measured
> at `6b0cf47` over all **166** flat `docs/tasks/T-*.md`: **88** carry a
> `## Implementation notes` heading, and its first line ranges from
> **27** to **372**. **41 of the 88 have it at or before line 86** — on
> those, `1,86p` reads the executor's reasoning rather than withholding
> it, up to 59 lines of it on `T-003` and `T-007` — and **47 have it
> after 86**, where `1,86p` truncates the criteria the verifier is
> required to attack. **Exactly 2 cards sit at 86 or 87.** The brief also
> attributed one verifier's report to the wrong session; both
> corrections are in the body. `T-112`'s criterion 5 currently carries
> the same number and will need the same amendment — that is the
> architect's, not this lane's.

Absorbs (seventh triage, 2026-08-24): T-089-s2 — file removed in this
commit.

`method/roles/verifier.md` opens: *"You are adversarial by design. You
receive ONLY the task file (spec + acceptance criteria) and the diff —
never the executor's reasoning. Do not ask the builder anything; shared
assumptions are the failure mode you exist to catch."*
`method/roles/executor.md` step 5: *"Append Implementation notes to the
task file: what you did, what you'd flag for the verifier, anything you
noticed but didn't do."* **The task file IS the executor's reasoning by
the time the verifier reads it, and "what you'd flag for the verifier"
is reasoning addressed to the verifier by name. Both sentences cannot
hold, and they have not held on any card this project has run.**

A THIRD surface: **the architect's own brief.** Row 13 of the brief
contract tells the executor to report where the brief was wrong; when
the architect folds that correction into the VERIFIER's brief, the
verifier is handed the builder's reasoning before it has read a line of
diff. `executor.md`'s interim clause bans only content addressed to the
executor ALONE and says nothing about executor-derived content arriving
in the verifier's brief. **So the blindness is contradicted on three
surfaces, and whichever arm eventually wins must govern all three.**

## What this card is, and what it is not

**It is not the resolution.** The four arms — describe what actually
happens; move the notes to a separate artifact; split evidence from
reasoning; or order the reads — are the architect's or the human's
choice, and they live in `method/roles/*.md`, **outside this fence.**
A `[docs/CONVENTIONS.md]` fence cannot edit `method/` and cannot carry a
method version bump (T-078-s3 — the third file is Rust). **The card
SHALL route that, not decide it.**

**It is not the durable fix either.** `T-112` builds the assembler that
withholds by construction — *a human cannot un-read; the assembler can
simply not send* — and this card SHALL cross-reference it rather than
duplicate it. What this card owes is the interim: **a hand-driven
verifier can have blindness TODAY, and the discipline that gives it to
them is written nowhere.**

## The capability exists and is disbelieved, which is worse than absent

Four verifiers this session declared the exposure unavoidable "via a
single `cat`", and each was one command from not having it. **Two of
them then performed the bounded read anyway, and their two commands are
different numbers**, which is the whole finding:

- **T-085's verifier** read `sed -n '1,86p'` — *"frontmatter through the
  last criterion, stopping one line short of `## Implementation
  notes`"* — wrote its mutant set first, read `:87` onward only
  afterwards, and recorded that the leak path *"was AVOIDED here rather
  than declared"*. It did the same again in round two before forming
  that round's mutant set. On T-085's card at `6b0cf47`, line 87 IS
  `## Implementation notes`. **The command was exactly right, for that
  card.**
- **T-101's first verifier** (verdict `0e6889b`) read **lines 1–110
  only**, *"stopping at `## Implementation notes`"*, wrote its mutant
  list to a scratch file BEFORE reading further, and reported that the
  pre-notes list *"is what produced V7/V8 and P5/P7 — the three blocking
  findings — none of which appear in the executor's eleven-row matrix."*
  On T-101's card, `## Implementation notes` is at line **111** — at
  that verdict commit and still at `6b0cf47`. **Also exactly right, and
  a different number.**

**The number is not the discipline. The BOUNDARY is.** Writing a
constant into CONVENTIONS would hand T-101's verifier a read stopping 24
lines inside its criteria and hand `T-003`'s verifier 59 lines of the
executor's account — and it is precisely what this file's own
**A CITATION NAMES A SYMBOL, NOT A LINE** bullet forbids, for exactly
the reason it gives: a line number drifts under other people's merges
and the mechanism never does.

**A derived boundary reproduces where a constant cannot.** Measured at
`6b0cf47` over all 166 flat cards, a read that stops at the first
`## Implementation notes` or `## Verdicts` heading emits **zero**
occurrences of either heading and truncates the `## Acceptance criteria`
section on **zero** cards; no card in the tree places `## Verdicts`
before its notes, and a `status: planned` card has neither heading, so
the read is the whole file — which is correct, because there is no
reasoning there to withhold.

## Why this fence is enough for the interim

`docs/CONVENTIONS.md` is in the read-first set every session takes
(CLAUDE.md at the repo root), and `verifier.md`'s own step 1 sends the
verifier to it. It is also **row 9 of the brief contract's source** —
standing disciplines are assembled from the project's CONVENTIONS — so a
discipline written here is transcribed into every brief the architect
assembles, including the one that is itself the third leak path. **The
POISON DRILL bullet is the precedent and says why in as many words**: it
stays a discipline rather than a gate because nothing can automate
"would this have failed", *"which is precisely why it has to be written
where a verifier reads it instead of remembered."*

## Acceptance criteria

- **THE INTERIM DISCIPLINE SHALL BE WRITTEN IN `docs/CONVENTIONS.md`**,
  as a standing bullet a verifier meets in its read-first set: read the
  card only as far as the executor's reasoning begins, form and WRITE
  DOWN the mutant set and the attack list, and only then read on.
- **THE BOUNDARY SHALL BE DERIVED FROM THE FILE, NEVER STATED AS A LINE
  NUMBER.** The bullet SHALL give a command that finds the first
  `## Implementation notes` or `## Verdicts` heading and stops there.
  **A constant is the defect** — `86` is right on 2 of the 88 cards that
  have a boundary at all, leaks on 41 and truncates on 47 (measured at
  `6b0cf47`; re-derive at the lane's own ref).
- **THE BULLET SHALL BE MEASURED, NOT ASSERTED.** Whatever command it
  prints SHALL be run over EVERY live flat `docs/tasks/T-*.md` at the
  lane's own ref, and the bullet SHALL state three counts with that ref:
  cards swept, cards on which the output contains either heading (must
  be 0), and cards on which the output omits `## Acceptance criteria`
  while the file has one (must be 0). **A command that cannot be checked
  for completeness is the thing this repository has spent three cards
  on.**
- **THE `## Verdicts` SECTION SHALL BE INSIDE THE BOUNDARY, NOT OUTSIDE
  IT.** A second-round verifier reading a card that already carries a
  first verdict is reading a previous verifier's reasoning about the
  same diff — a fourth surface, and the one a boundary drawn only at
  `## Implementation notes` would miss on a rebuilt card. **State it, and
  state that no card in the tree currently orders them the other way**,
  so a reader knows the two-heading rule is a floor and not a
  coincidence.
- **THE BULLET SHALL NAME ALL THREE LEAK SURFACES AND SAY WHICH ONE IT
  CLOSES.** It closes the CARD. It does not close the verdict channel or
  the architect's brief — **naming one and stopping is the
  one-sidedness this file's POISON DRILL bullet warns about**, and a
  reader who trusts a half list edits into the half it omitted.
- **THE DURABLE FIX SHALL BE CROSS-REFERENCED AND NOT RESTATED.**
  `T-112`'s assembler is the version that withholds by construction;
  this bullet SHALL name it as the successor and SHALL say that the
  interim survives until that lands, so nobody reads the bullet as a
  decision that no program is coming.
- IF the method contradiction itself is to be RESOLVED — the four arms
  in the absorbed finding — THEN it is a `method/roles/*.md` edit
  **outside this fence** and SHALL be routed as a suggestion naming the
  fence it needs, never written from this lane. Widening the fence from
  inside is the one repair the executor role may never make.
- IF `T-112`'s criterion 5 still carries the constant when this lands
  THEN the divergence SHALL be reported rather than edited across the
  fence: **two copies of one discipline with no precedence rule is two
  facts, not one fact checked twice.**
- **THE BULLET SHALL SAY WHAT THE DISCIPLINE BUYS AND WHAT IT DOES
  NOT.** It gives the verifier a mutant set formed independently; it
  does NOT prevent a verifier from reading on afterwards, and it must
  not, because the evidence half of the notes — commands, exits,
  measured figures, restoration proofs — is what this project's verdicts
  already depend on. **Claiming more than the practice delivers is the
  failure two other cards in this batch are also correcting.**

Verification: headless, and the evidence is a sweep rather than a suite
— the derived-boundary command run over every live flat
`docs/tasks/T-*.md` at the lane's own ref, with the three counts above
and the ref stated. **The DOCS GATE fires**: `docs/CONVENTIONS.md` is
read off disk on every `cargo test` by
`snapshot_version_matches_the_live_method_stamps`, and the "Build & test"
section is derived by `tools/e2e/tests/workflow-parity.spec.ts`. Ask
`node tools/e2e/scripts/docs-gate.mjs <changed path>...` directly with
the RANGE RULE's own path list, **never through `xargs`** (two of the
four codes do not survive that pipe on Darwin), and run exactly what it
owes — CONVENTIONS owes two suites and not the app suite, but ask the
gate rather than quoting that. **No method version bump is possible from
this fence** (T-078-s3): if an edit here would need one, stop and open a
room. No POISON DRILL is owed unless a test body lands; if one does, the
full discipline applies. **@human: the choice among the four arms is
yours or the architect's** — this card deliberately makes none of them,
and says so where a reader will look.
