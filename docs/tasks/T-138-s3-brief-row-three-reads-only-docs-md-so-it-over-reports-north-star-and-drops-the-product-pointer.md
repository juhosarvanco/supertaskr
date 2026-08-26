---
id: T-138-s3
title: The brief's read-first row extracts only `docs/*.md` from the adapter, so it over-reports NORTH_STAR and drops the product pointer entirely — row 3 is wrong in both directions today
status: suggested
suggested_by: executor claude-opus-5 @T-138
touches: [tools/e2e]
---

**ROW 3 OF EVERY GENERATED BRIEF IS WRONG IN BOTH DIRECTIONS RIGHT NOW,
AND IT IS ONE REGEX.** Measured at `00e133a` by running the tool:

```
$ node tools/e2e/scripts/brief.mjs --task T-138
ROW 3 — Read-first set
  CLAUDE.md names: docs/STATE.md docs/ROADMAP.md docs/ARCHITECTURE.md docs/CONVENTIONS.md docs/NORTH_STAR.md
  AGENTS.md names: docs/STATE.md docs/ROADMAP.md docs/ARCHITECTURE.md docs/CONVENTIONS.md docs/NORTH_STAR.md
```

`deriveReadFirst` in `tools/e2e/scripts/dispatch-brief.mjs` extracts the
set with `/\bdocs\/[A-Za-z0-9_./-]*\.md\b/g` — every `docs/*.md` mention
anywhere in the adapter, and nothing else. Two consequences, both live:

- **IT OVER-REPORTS.** `docs/NORTH_STAR.md` is in that list because the
  adapter's closing sentence says *"If your instructions conflict with
  docs/NORTH_STAR.md, stop and open a room."* That is a ROUTING pointer,
  not a read-first document. The regex cannot tell the two apart, so
  every brief tells every session to read a document the adapter never
  asked it to read.
- **IT UNDER-REPORTS, AND THIS IS THE HALF THAT MATTERS.** Commit
  `6a6bc87` added the product pointer — *"`tools/e2e/tests/` holds spec
  files whose names are sentences about what the app actually does"* —
  to both adapters. **It does not appear in row 3 at all**, because it is
  not a `docs/*.md` path. The fix that closed T-138's instance is
  invisible to the machinery that puts row 3 into every brief.

**This is T-138's own subject one layer down**: the read-first set was
written in one place and read from another, and the two disagree.

## Two repairs, and they are not the same size

**(a) Mark the set rather than pattern-match it.** Have the adapter carry
an explicit block the deriver reads — a heading, a list, anything with a
boundary — so a routing mention and a read-first entry are structurally
different rather than distinguished by a regex that cannot see intent.
Cost: it changes the adapter TEMPLATE too, so it composes with
`T-138-s2` and owes the same three-file method bump.

**(b) Widen the pattern and subtract the routing sentence.** Cheaper,
smaller, and it inherits the same weakness one step further out — the
next pointer that is neither `docs/` nor the routing sentence is wrong
again.

**Recommendation: (a), taken together with `T-138-s1`**, whose generated
`docs/CAPABILITIES.md` would be picked up by the CURRENT regex for free.
That is worth stating plainly: **s1 does not need this card, and this card
is what stops the next non-`docs/` entry from vanishing the same way.**

## Do not gate this without measuring first

`T-136` was rejected on 2026-08-26 for gating a defect that did not
exist. This one does exist and is reproduced by one command above — but
what a gate would assert (that the adapter's set and the brief's row 3
agree) is a *second* copy of the set, which is the shape T-138 exists to
warn about. Fix the deriver; do not add a checker that has to be kept in
step with it.

## One more thing found while measuring, already recorded elsewhere

`brief.mjs --role orchestrator` exits **3** at `00e133a` — the contract
table lives only in `method/roles/executor.md`, so `contractRows` finds
zero tables for any other role. That is pre-existing (`T-133` records it
at its own `:277` and `:553` for `--role verifier`) and is named here only
so the next session that hits it does not file it a third time.
