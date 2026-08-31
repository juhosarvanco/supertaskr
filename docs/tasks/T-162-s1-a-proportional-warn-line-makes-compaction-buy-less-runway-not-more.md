---
id: T-162-s1
title: A proportional warn line makes compaction buy LESS runway, not more — the ADR-019 budget formula is the wrong shape for a document under this merge velocity, and only @human can change it
feature: F-01
milestone: 4
priority: 3
size: S
status: done
blocked_by: []
touches: [docs/decisions, docs/rooms]
suggested_by: executor claude-opus-5@subagent @T-162
builder: claude-opus-5@subagent
verifier:
built_by: claude-opus-5@subagent
verified_by:
review: self-verified
---

**FILED FROM T-162's OWN ARITHMETIC.** ADR-019 §Budgets legislates
`warn = landed × 1.25` and `fail = landed × 1.5`. Headroom under the
warn line is therefore exactly a QUARTER of the landing, so a document
that is compacted harder gets a TIGHTER tripwire, in absolute bytes,
than one that is not.

## Measured on T-162's own pass, at the refs the addendum stamps

- docs/ROADMAP.md: cutting 10,315 → 9,801 (−514 bytes) moved the
  headroom 2,579 → 2,451, so the cut COST 128 bytes of runway.
- docs/CONVENTIONS.md: cutting 134,167 → 131,514 (−2,653) moved the
  headroom 33,542 → 32,879, costing 663.
- What actually bought runway was RE-BASING the lines on a document
  three days of legitimate rule growth had left behind: ROADMAP's warn
  10,499 → 12,252, CONVENTIONS' 137,928 → 164,393.

At the velocity T-162 measured — ROADMAP +1,761 bytes net over sixteen
commits in one night, CONVENTIONS +23,825 over six merges in fourteen
hours — the new lines are ~1.4 nights and ~1.4 days of runway. The
re-landing is a re-basing, and a re-basing is exactly what @human's
ruling declined to do on its own ("raise-the-lines-only").

## The question, which a lane cannot rule on

`landed × 1.25` is one instrument. Two others exist and neither is
legislated:

1. **A FLOOR IN BYTES** — `warn = landed + max(F, landed × 0.25)`, so a
   small document is not punished for being small. ROADMAP is the case:
   it is the file the contract asks to stay short and the file whose
   runway is shortest.
2. **A PER-MERGE BUDGET** — gate the DELTA rather than the total, which
   is the shape the ROADMAP contract already states in prose ("at most
   one new sentence per feature per merge") and which nothing enforces.

## Why this is a suggestion and not a lane

ADR-019 §Budgets is @human's decision text. T-162's fence reaches
docs/decisions and could have written a new formula into it; that would
be a lane rewriting the decision it was dispatched to execute. The
honest move is the room: this belongs beside
docs/rooms/governing-docs.md, with T-162's addendum 4 as its evidence.

Corroborates rather than duplicates: ADR-019 addendum 3 (2026-08-29)
already recorded that CONVENTIONS' growth "is rule text that survived
the pipeline, which is what the document is FOR". That is the same
observation from the other side — the document is not sludge, so the
tripwire's shape is the thing left to argue about.

**PARKED at standing triage sitting #2 (2026-08-30, architect) — because the ruling this needs is one only @human can give, and the seat's rule is to park with that as the condition rather than guess.** ADR-019 §Budgets is @human's decision text; the formula it legislates is what this card argues is the wrong shape. A lane rewriting it would be a lane rewriting the decision it was dispatched to execute, which is the honest framing this card already gives itself, and triage has no more standing to write a new formula than a lane does.

**ROUTED TO @human at this sitting**, with the arithmetic above as the whole of the ask: compaction buys less absolute runway than it costs whenever headroom is a fixed fraction of the landing, and two instruments exist that the decision does not name — a byte FLOOR, so a small document is not punished for being small, and a PER-MERGE delta budget, which is the shape the ROADMAP contract already states in prose and nothing enforces.

**RESURFACES on either event, and both are things a reader can check:**

1. **@human records a resolution on the budget formula** in `docs/rooms/governing-docs.md` — the room this belongs beside, and the file whose RESOLUTION line is the machine-visible answer. Whatever is ruled, this card is then either promoted to implement it or archived as the argument that produced it.
2. **A governing document crosses its warn line again** — `npm run lint:docs` prints the budget line for each governed document on every run, so the next warn is the evidence that a re-basing bought one-and-a-bit days of runway rather than a policy. The seat that sees it appends the reading here, dated, and re-routes.

**Re-derive before either move.** The figures in this card are stamped at T-162's refs; the lines were re-based at that merge, so headroom now is not headroom then.

## PROMOTED (2026-08-30, sitting #4's seat) — @human RULED the byte FLOOR

Resurfacing condition 1 has FIRED: @human recorded a resolution on the
budget formula, in session, and it is written into
`docs/rooms/governing-docs.md` under **THE BUDGET FORMULA**. The ruling:
**add the byte floor (`warn = landed + max(F, landed × 0.25)`); do NOT
build the per-merge delta budget.**

So this card stops being an argument and becomes the implementation of
one. What it now owes:

- ADR-019 §Budgets' formula text moves to the floor form — @human's
  decision text, changed under @human's own recorded ruling, which is
  the only thing that made it untouchable before.
- `F` is DERIVED at the lane's own ref (one ordinary merge's growth for
  the smallest governed document), never picked round, with the
  derivation shown on this card.
- `tools/e2e/scripts/docs-scan.mjs`'s `DOC_BUDGETS` and the health
  bands' doc-headroom derivation read the same table and must agree with
  the new shape — **that is OUTSIDE this card's `[docs/decisions,
  docs/rooms]` fence**, so it is either a widened fence decided at
  dispatch or a routed sibling. Decide before cutting the lane, not
  inside it.
- **Re-derive every figure**: the lines were re-based at T-162's merge,
  so the headroom numbers in this card's body are stamped at refs that
  have moved.

## Implementation notes (2026-08-31, executor claude-opus-5@subagent)

Lane `task/T-162-s1-the-byte-floor-lands-in-the-adr`, worktree
`/Users/ujju/Projects/nputer-T-162-s1`, base `bd8a8e88c727` (`main` had
moved to `a3bb22d4c47f` while the lane ran; no input below depends on
it). Fence `[docs/decisions, docs/rooms]`, `docs/tasks` always writable.
**Every figure in this section is re-derived at `bd8a8e88c727`**, which
the card's own body ordered — the body's numbers are T-162's and have
moved.

**WHAT LANDED.** ADR-019 §Budgets now legislates
`warn = landed + max(F, landed × 0.25)` with `fail = landed × 1.5`
unchanged, and states `F` = 2 053 with the two thresholds the shape
implies. ADR-019 addendum 5 carries the derivation, the consequence
table and the routing.
`docs/rooms/governing-docs.md` §THE BUDGET FORMULA gains a CARRIED
subsection — @human's ruling text is untouched; the note is appended
beneath it.

**THE DERIVATION OF `F`, WHICH IS THE WHOLE DECISION.** The ruling fixed
the SHAPE ("one ordinary merge's growth for the smallest governed
document … the same shape `check::WARN_HEADROOM_BYTES` uses") and left
the VALUE to be measured. That precedent
(`app/src-tauri/crates/nputer-index/src/check.rs`) is the **mean of the
positive single-commit growths**, stated with median and max beside it.
Applied here: for each first-parent commit changing the file,
`git cat-file -s $c:<file>` minus the same at its first parent, positives
kept, mean taken. `docs/STATE.md` is the smallest governed document on
all three readings (landed 6 772, size at this ref 7 571, target 12 KB),
giving 147 positive growths summing 301 751 → **`F` = 2 053** (median
842, max 12 039). No creation event is in the series.

**THE CHOICE OF DOCUMENT WAS NOT FREE, AND THE CHECK THAT SETTLED IT.**
The ruling's derivation rule says *smallest governed document*; its
motivation says *ROADMAP is the case the floor exists for*. Those pick
different files at this ref. Deriving from ROADMAP gives `F` = 1 058,
which binds where `landed < 4 232` — **no governed document is under
that, so the ruling would change nothing at all.** A derivation that
reduces a ruling to a no-op is a wrong derivation, so the lane followed
the derivation rule and routed the discrepancy to @human in the room
rather than picking a number that made ROADMAP bind. **This is the one
thing the lane could not settle.**

**WHAT IT MOVES.** One line: `docs/STATE.md`'s warn, 8 465 → 8 825
(+360). ROADMAP, ARCHITECTURE and CONVENTIONS stay on the proportional
term, unchanged. STATE's live headroom goes 894 → 1 254 bytes — **less
than one ordinary STATE merge (2 053)**, which is stated plainly because
the alternative is to inflate `F` until it reads better. Its health band
moves 10.56% → 14.21% of the warn line, off the 10% drift edge it is
currently sitting half a point above.

**AND THE CARD'S OWN PREMISE SURVIVED RE-DERIVATION, WITH ONE REVERSAL.**
The arithmetic holds. But the body's *"ROADMAP … the file whose runway is
shortest"* is no longer true: at this ref STATE has 894 bytes of headroom
against ROADMAP's 1 906. `docs/CONVENTIONS.md` is also already at
145 583 bytes against a 131 514 landing — **+14 069 in the day since
T-162 re-based it**, which corroborates the velocity claim the card was
filed on.

**WHAT WAS NOT BUILT, AND IT IS HALF THE RULING.** The per-merge delta
budget. @human refused it explicitly; the lane did not reopen it.
`fail` was likewise left alone — the ruling replaced the `warn` formula
and said nothing about `fail`, and a lane does not widen a ruling.

**ROUTED: `T-162-s2`** (`touches: [tools/e2e]`, `blocked_by: [T-162-s1]`).
The dispatch-time call to split this card was CHECKED, not trusted, and
it was right: `DOC_BUDGETS` and every prose statement of the old formula
live under `tools/e2e` — `docs-scan.mjs` (the table, its doc-comment and
the RE-LANDED comment) and `health-bands.config.mjs` (two comments that
argue *against* a byte floor and rest on a "headroom is EXACTLY 20% of
the warn line by construction" invariant this ruling breaks — STATE now
lands at 23.3%). `docs/STATE-template.md` mentions `DOC_BUDGETS` but
states no formula, so it needs nothing. **`tools/e2e` was held by the
live lane `T-167-s8` (`[.claude, tools/e2e]`) at this ref**, so routing
was also the only option that could run tonight.

## Integrator review (self, per the ceremony row `S, diff outside shipped code`)

No blind verifier is owed on this row, so this half is the executor's and
is stamped as `review: self-verified`. **What was actually checked:**

- **The ruling was read at its source**, not from the dispatch prompt —
  `docs/rooms/governing-docs.md` §THE BUDGET FORMULA — and both halves
  were honoured: floor added, delta budget not built.
- **The precedent was read before it was imitated** — `check.rs`'s
  `WARN_HEADROOM_BYTES` is a mean of positive growths, which is why `F`
  is a mean and not a median. Had it been a median, `F` would have been
  842 and the floor would have bound nothing.
- **The vacuity check** above — the reason the derivation is defensible
  rather than merely literal.
- **The blast radius was measured, not assumed**: a sweep for every site
  stating `× 1.25` across `*.md`/`*.mjs`/`*.ts`/`*.rs`, and a sweep for
  anything under `tools/e2e` that reads `docs/decisions` or `docs/rooms`.
  Nothing asserts on the text of either file, so the diff cannot red an
  assertion; the two Playwright specs that walk all of `docs/` read bytes
  for layout only.
- **Gates**: `npm run lint:docs` from tools/e2e/, and the DOCS GATE's own
  fire/not-owed question answered from the real diff rather than assumed.

**WHAT THIS REVIEW COULD NOT DO, said rather than left to be found:**

- **It is not independent.** The same seat derived `F` and reviewed the
  derivation. The vacuity check is the strongest evidence on offer and it
  is still self-produced.
- **It did not run the suite the DOCS GATE owes.** The gate fires for this
  diff and owes `npm test from tools/e2e/` — a Playwright suite needing a
  built app bundle, which this docs-only lane did not build. It is owed at
  the MERGE and left to the integrating seat, flagged rather than skipped
  quietly.
- **It cannot confirm @human's intent** where the ruling's derivation rule
  and its motivation diverge. The lane followed the operative half and
  wrote the question down in the room; only @human can close it.
- **`F` is a snapshot.** It is a mean over this repository's whole
  first-parent record for one file; it will move as the record grows, and
  ADR-019 §Budgets says it is re-derived at the next landing pass rather
  than treated as constant.
