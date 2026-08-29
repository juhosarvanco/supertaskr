---
id: T-138-s1
title: The product-shaped read-first entry is a GENERATED capabilities document assembled from the e2e spec names — 163 sentences, 11 808 bytes, 3.24% on the read-first set
status: rejected
suggested_by: executor claude-opus-5 @T-138
touches: [tools/e2e, docs/CAPABILITIES.md, CLAUDE.md, AGENTS.md]
---

**@human DECIDED this on 2026-08-26 and T-138's fence could not build
it.** T-138 holds `[CLAUDE.md, method/roles/orchestrator.md,
method/roles/executor.md]`; a generator and its output are outside that
three ways over, and the adapter pointer needs `AGENTS.md`, which T-138
also does not hold. This card carries the shape, the measurements and the
one hazard, so whoever takes it does not re-derive any of them.

## Why generated and not written

`docs/ROADMAP.md` already carried the sentence that would have saved a
working day and it went unread. **A hand-maintained product document
reproduces the exact failure T-138 records** — prose is something somebody
has to keep true, and this project has 1 079 lines of evidence that
nobody reads all of it. A document derived from spec names is true by
construction: a sentence is false the moment its body reds.

**Nobody keeps the generated summary true. The generator does, and what
gets reviewed is the generator.**

## What generates it, measured at `00e133a`

`tools/e2e/tests/` holds **23 spec files** and **170 `test(` call sites**.

- **163** of those have a literal double-quoted name and are extractable
  by reading the source: `command grep -rhE '^[[:space:]]*test\("' `.
- **7 are template literals.** Two interpolate a constant into a single
  test. **Five sit inside `for` loops** — `keyboard-activation`,
  `panel-real-keys`, `range-rule` over `CHECK_IDS`, `shell-frame` over
  `VIEWPORTS`, `window-contract` over its size list — and each expands to
  more than one test at run time.

**SO A GENERATOR THAT READS ONLY `test("…")` IS HONEST ABOUT 163 AND
SILENTLY DROPS SEVEN FAMILIES.** It must either expand the loops or NAME
what it could not extract, in the document, in the shape this project
already uses for a census it cannot complete. A generated document that
quietly omits is worse than prose that visibly goes stale, because
nothing points at the omission.

**The other honest source is the RUN**: Playwright prints `Running N
tests`, and N is larger than 170. Deriving from the run rather than the
source gets every loop expansion for free and costs a full suite run per
regeneration. Both options are real; this card should rule on which, and
the ruling belongs with whoever knows what regenerating costs at
checkpoint time.

## Where it goes, and this is measured rather than aesthetic

**`docs/CAPABILITIES.md`, not a pointer at `tools/e2e/tests/`.**

`tools/e2e/scripts/dispatch-brief.mjs`'s `deriveReadFirst` extracts the
read-first set from the root adapter with
`/\bdocs\/[A-Za-z0-9_./-]*\.md\b/g` — **`docs/*.md` paths only.** Run at
`00e133a`, brief row 3 emits:

```
CLAUDE.md names: docs/STATE.md docs/ROADMAP.md docs/ARCHITECTURE.md docs/CONVENTIONS.md docs/NORTH_STAR.md
```

The `tools/e2e/tests/` paragraph that commit `6a6bc87` added — the
product pointer, the entire point of that commit — **does not appear in
the brief at all.** A document under `docs/` is picked up by that regex
with no change to the tool. (Row 3 also over-reports `docs/NORTH_STAR.md`;
that half is `T-138-s3`.)

## What it costs, measured at `00e133a`

The 163 sentences as a flat list: **163 lines / 2 052 words / 11 808
bytes**. The read-first set today: **4 807 lines / 58 276 words / 364 118
bytes**. So the entry is a **3.24%** increase on what every session
already pays, and **16.1%** the size of `ROADMAP.md`, which is itself
**20.1%** of the set — while answering the question the failing session
opened `ROADMAP.md` for.

## The hazard whoever takes this will hit

**Both root adapters must move together.** `CLAUDE.md` and `AGENTS.md`
are byte-identical, and `deriveReadFirst` compares the two and files a
FOUND finding — `brief.mjs` exit 1 — when they disagree about the set.
Fence both or neither.

**And `token-scan.spec.ts:106` plants control bytes into seven
first-party roots and asserts an EMPTY DIFF; `AGENTS.md` is one of the
seven.** An uncommitted edit to it reds that body and the failure looks
like a defect in the plant. Commit before running the e2e suite.

closed_by: the commit that introduces docs/CAPABILITIES.md and
tools/e2e/scripts/capabilities.mjs (ADR-019 phase 2, executed directly
at @human's direction per docs/rooms/governing-docs.md's override —
find it with `git log --diff-filter=A -- docs/CAPABILITIES.md`). The
source-vs-run choice this card left open was settled the way T-138's
checkpoint predicted: SOURCE reaches the full census by resolving the
loops' own literals — 231 sentences extracted, and the one family the
generator cannot resolve (window-contract's manifest-derived sizes, 2
behaviours) is NAMED in the document per this card's honest-omission
rule. Census 233 = the runner's own count. `npm run capabilities:check`
is the currency gate, poison-drilled both ways at landing. Both root
adapters moved together and are cmp-identical, per this card's hazard.

Amnesty triage 2026-08-29 (triage seat): REJECTED — DISCHARGED, NOT DECLINED — the card carries its own closed_by line and the work landed. Verified at this base: docs/CAPABILITIES.md and tools/e2e/scripts/capabilities.mjs both exist, CLAUDE.md's read-first set now names CAPABILITIES as the exact behaviour census generated from the spec names, and the gate lists capabilities.mjs among its derived docs readers. The source-vs-run choice this card left open was settled the way T-138's checkpoint predicted. Recorded here rather than as an absorption because the resolver is ADR-019's phase-2 commit and no card exists to carry the Absorbs line.
