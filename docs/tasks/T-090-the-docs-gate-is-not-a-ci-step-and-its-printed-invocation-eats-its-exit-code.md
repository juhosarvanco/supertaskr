---
id: T-090
title: The DOCS GATE is a hand-run ritual, the invocation CONVENTIONS prints destroys its four-code contract, and two sentences about it are false
feature: F-06
milestone: 4
priority: 46
size: S
status: building
blocked_by: []
touches: [tools/e2e, .github/, docs/CONVENTIONS.md]
builder: claude-opus-5
verifier:
built_by:
verified_by:
review:
---

Absorbs (seventh triage, 2026-08-24): T-061-s3, T-064-s7, T-101-s3, T-061-s5 — files removed in this commit.

> **DRAFTER'S NOTE — remove before landing.** T-084-s2 names ONE false
> sentence. I measured a SECOND while verifying it, and it is sharper
> than the first: the DOCS GATE bullet's empty-list clause states a BSD
> `xargs` premise that is false on this machine in BOTH halves, and the
> consequence is that `T-084-s6`'s remedy never fires through the
> invocation the bullet prints. Every figure below is measured at HEAD
> `4d2f03c` on Darwin 25.6.0 with `/usr/bin/xargs`. The exit-mapping
> figure the T-084 integrator recorded in STATE (*"BSD `xargs` maps a
> utility exit of 1–125 to 123"*) does NOT reproduce here — see the
> third bullet — and the fifth triage assigned that figure to T-091 as
> a reader fixture. Both cards can carry it: this one CORRECTS the
> sentence, T-091 builds the thing that would have caught it. Flagged
> so the overlap is deliberate rather than accidental.

Absorbs: T-084-s2 (sixth triage, 2026-08-20). That file is removed in
this commit.

**The third standing gate is the only one with an enforcing copy and the
only one nobody is obliged to run.** `tools/e2e/scripts/docs-gate.mjs`
is invoked by hand from the repo root and is deliberately not an npm
script: `tools/e2e/package.json` carries exactly four
(`test`, `typecheck`, `lint:tokens`, `boot:check`). The reason is
mechanical rather than preference. Adding a command to CONVENTIONS'
`run from tools/e2e/:` bullet puts it in the section
`tools/e2e/tests/workflow-parity.spec.ts` DERIVES from, and
`deriveExpectedSteps` then pushes a problem by name — *"docs/CONVENTIONS.md
'Build & test' lists [tools/e2e] npm run lint:docs, which this spec has
no entry for"* — until the command is entered in `CI_SEQUENCE` with its
workflow step, or in `LOCAL_ONLY` with the reason CI does not run it.
`CI_SEQUENCE` requires the step to exist in `.github/workflows/ci.yml`,
and T-084's fence was `[docs/CONVENTIONS.md, tools/e2e]`. `LOCAL_ONLY`
would have created a gate CI never runs, which is worse than no command.

**TWO SENTENCES IN CONVENTIONS ARE FALSE, both about this gate, both
measured at `4d2f03c`.**

1. **The CI bullet's *"It is silent in exactly ONE case, a command the
   DOC gains that the spec does not yet claim"*.** `deriveExpectedSteps`
   pushes a problem for exactly that case — the `for (const key of
   doc.keys())` loop, whose message tells the reader to add a
   `CI_SEQUENCE` or `LOCAL_ONLY` entry. The silent case, if there is
   one, is something else. **Note how the sentence hides**: it wraps
   across two lines, so `grep "silent in exactly ONE case"` over
   `docs/CONVENTIONS.md` returns NOTHING while the sentence is live —
   this card's own T-077-s3 sibling, met while verifying this card.
   Search for `silent in exactly`, or read the bullet.

2. **The DOCS GATE bullet's *"the invocation above pipes through
   `xargs`"*.** The invocation printed above it does not pipe through
   anything — it is `node tools/e2e/scripts/docs-gate.mjs <changed
   path>...`. The pipeline it describes lives in `docs-gate.mjs`'s own
   header comment. And its premise about BSD `xargs` is false in both
   halves on this platform, which is what makes it worth a criterion
   rather than a copy-edit:

   - **Empty input does NOT run the utility.** A planted probe script
     that prints on entry printed nothing:
     `printf '' | xargs <probe>` exits **0** with no invocation, and so
     does `printf '' | xargs echo HELLO`. So through the documented
     pipeline, `git diff --name-only HEAD HEAD | xargs node
     tools/e2e/scripts/docs-gate.mjs` exits **0** — the gate never runs
     — while the direct call `node tools/e2e/scripts/docs-gate.mjs`
     exits **2**. **`T-084-s6`'s remedy is unreachable by the route
     `T-084-s6` was written about**: silence still wears a clean gate's
     costume, arrived at by the opposite mechanism.
   - **Every nonzero utility exit collapses to 1.** Measured over the
     whole contract, one invocation per code — utility 1, 2, 3, 125,
     126, 127 and 255 each produce xargs **1**. macOS's own man page
     says so (*"If any other error occurs, xargs exits with a value of
     1"*). The **123** figure is GNU's mapping, which is what CI's
     ubuntu runner will use — so the contract breaks in two DIFFERENT
     ways on the two platforms, and both erase the distinction the four
     codes exist for. Demonstrated: `printf -- '--nope\n' | xargs node
     tools/e2e/scripts/docs-gate.mjs` exits **1** where the direct call
     exits **2**, so *called wrong* arrives as *has a verdict*; an exit
     3 (GATE COULD NOT RUN) would arrive the same way.

**What is held meanwhile is more than nothing**, and the card should not
overstate the gap: `tools/e2e/tests/docs-input-gate.spec.ts` runs inside
`npm test` from tools/e2e, which IS a CI step, and it asserts the live
tree clean and the documented trigger equal to the derivation. The
gate's FINDINGS are enforced today. What is not enforced is that anybody
RUNS the one-shot form before a merge — the standing GRAPH REGEN's regen
already has.

**Placement wants an argument, not a slot.** The token lint is CI's
FIRST step, ahead of every `npm ci`, because `npm run` needs no
installed node_modules and `token-scan.mjs` is deliberately
zero-dependency. `docs-gate.mjs` imports `yaml` — a tools/e2e
devDependency, chosen because it is the SAME package `lib/parser` uses
so a block parses for both or neither — so it CANNOT hold the token
lint's position. `docs-scan.mjs` itself stays zero-dependency and its
header says why.

## Acceptance criteria

- THE gate SHALL become a named command in all three places at once: a
  `lint:docs` script in `tools/e2e/package.json`, the command in
  CONVENTIONS' `run from tools/e2e/:` bullet, and a step in
  `.github/workflows/ci.yml` with its `CI_SEQUENCE` entry beside it.
- IF the command is added to CONVENTIONS without the `CI_SEQUENCE`
  entry THEN `workflow-parity.spec.ts` SHALL red BY NAME — demonstrated
  in the notes with the message quoted, not asserted, because that
  demonstration is also the disproof of false sentence 1.
- **THE CI bullet's "silent in exactly ONE case" sentence SHALL be
  deleted or corrected against the derivation as it stands**, and the
  correction SHALL name the loop that falsifies it rather than restate
  a new tally.
- **THE DOCS GATE bullet SHALL stop prescribing an invocation that
  destroys the gate's own exit codes.** Whatever spelling it ends up
  printing, THE SAME SPELLING SHALL appear in `docs-gate.mjs`'s header
  comment — the two disagree today, and a recipe in two places is two
  chances to disagree (T-057).
- **THE FOUR CODES SHALL BE SHOWN TO SURVIVE THE PRINTED INVOCATION, on
  BOTH `xargs` implementations or on neither.** Produce the matrix: for
  each of 0, 1, 2, 3 the code the reader observes when they run what the
  doc prints, measured on BSD `xargs` (this machine) and on GNU `xargs`
  (CI's runner). IF a spelling cannot preserve all four THEN the doc
  SHALL print one that does not use `xargs` at all and SHALL say why.
- **THE EMPTY-LIST TRAP SHALL BE RE-PROVED AGAINST THE NEW SPELLING,
  with a planted positive**: a range command that FAILS, fed to the
  documented invocation, SHALL reach the reader as a non-zero code that
  is not "not owed". Today it reaches them as exit 0 with the gate
  never invoked.
- IF the CI step cannot hold the token lint's bare-checkout position
  THEN the CI bullet SHALL state where it sits and why (the `yaml`
  import), so the next editor does not "fix" the ordering.
- A pin SHALL hold the new script the way the lint's is held: the
  `EXIT` object in `docs-gate.mjs` stays the single authority and the
  npm script SHALL NOT re-type the numbers.

Verification: headless — `npm test` and `npm run typecheck` from
tools/e2e with `docs-input-gate.spec.ts` and `workflow-parity.spec.ts`
green, the exit matrix printed with each `$?` read UNPIPED, and the
POISON DRILL on every new or changed body: mutate one side only, read
the mutated text back with `git diff` before running, restore and prove
the restoration by sha256 against the commit the drill ran at. The DOCS
GATE fires on the CONVENTIONS edit — run what it owes and record which.
Every figure carries the ref it was measured at. @human: none.
