---
id: T-117
title: An unbuilt worktree says so once — the bundle-evidence bodies stop reporting a missing build as a stale one, and CONVENTIONS stops saying five
feature: F-02
milestone: 4
priority: 53
size: S
status: planned
blocked_by: []
touches: [app-shell, docs/CONVENTIONS.md, docs/conventions/lanes.md, docs/conventions/standing-gates.md, docs/conventions/verification.md]
builder:
verifier:
built_by:
verified_by:
review:
---

> **DRAFTER'S NOTE — for the architect, remove before landing.** Three
> things measured at `6b0cf47` that the anchor finding does not say, or
> says wrongly. **(1) THE TREE IS AT SIX, NOT FIVE.** Exactly six app
> test files call `resolve("dist/assets")`; the sixth is
> `map-t1-t2-dom.test.tsx`, added by T-013. **(2) CONVENTIONS ALREADY
> CONTAINS ITS OWN CORRECTION AND DID NOT APPLY IT** — the POISON DRILL
> bullet says six and names the LANE PROTOCOL bullet as the stale one,
> so this is a file disagreeing with itself, not a figure nobody caught.
> **(3) `T-089-s5`'s CLOSING SENTENCE IS FALSE AT HEAD** — it says
> tools/e2e "reads `app/dist` too", and it does not: the lane's
> `playwright.config.ts` runs `npm run dev` (vite), and the only `dist`
> tokens under tools/e2e are `SKIP_DIRS` entries in `docs-scan.mjs` and
> `token-scan.mjs`. The finding told its reader to derive that list
> rather than trust it, and deriving it refutes it. **`T-013-s7` was
> REJECTED at this triage and moved to `docs/tasks/rejected/`; its
> rejection line assigns its SECOND half to this card**, which is why
> there is no `Absorbs:` entry for it below — a rejection is a move, not
> an absorption.

Absorbs (seventh triage, 2026-08-24): T-089-s5 — file removed in this
commit. **Also carries the second half of the rejected `T-013-s7`** (a
fresh worktree has no `app/dist`, so the app suite cannot be drilled
until it is built; the LANE PROTOCOL bullet's five-file figure is six),
per that file's rejection line in `docs/tasks/rejected/`.

Six app test files read the shipped bundle off `app/dist`, and on a tree
where that directory was never created **every one of their messages is
about the build being STALE**. A session meets a dozen failures about
staleness on a worktree where nothing has been built, and reads them as
a claim about the tree.

## Measured

At `4d2f03c`, in a fresh worktree with `npm ci` run in all three
packages and `lib/parser` built, before that lane changed anything:
`npm test` from `app/` was **12 failed / 828 passed of 840, across 5
test files, exit 1**; after `npm run build` from `app/`, the identical
tree was **840 / 840, exit 0**. At T-013's merge `6834287` the same
procedure on an unbuilt drill worktree was **14 failures across 6 files,
924/924 after `npm run build`** — T-013 had added
`map-t1-t2-dom.test.tsx`, the sixth reader.

**NEITHER TOTAL IS CURRENT AND BOTH MUST BE RE-DERIVED.** `4d2f03c`
(2026-08-23 17:44) *precedes* `6834287` (22:48), so 840 is a pre-T-013
figure; and `app/test/**` has moved again since that merge —
`architecture-dogfood`, `board-truth`, `interview-chat-dom`,
`map-dogfood-render` and `select-board` all changed between `6834287`
and `d41456b`. Derive the count at your own ref (CONVENTIONS: CITE THE
SHAPE, NOT THE TALLY).

**The reader set, derived at `6b0cf47` and stable:** six files call
`resolve("dist/assets")` — `window-manifest.test.ts`,
`genesis-mount.test.tsx`, `map-tasks-lens-dom.test.tsx`,
`map-t1-t2-dom.test.tsx`, `shell-harness.test.ts`,
`interview-harness.test.ts`. `architecture-glob.test.ts` mentions
`"dist"` as a glob FIXTURE and reads nothing. **Derive this list too**;
a hand list is the defect two cards have already been spent on.

All six are legitimate build-evidence bodies. The problem is what they
say when the evidence does not exist: their messages read *"the build is
at least as new as the mount and the lens"*, *"the build is newer than
the screen it is evidence about"*, *"`dist/` predates <file> — rebuild
before trusting this probe"*. Some of the failures are not even about
the bundle — a shipped-sheet font-size assertion and a `minWidth`
breakpoint check fail downstream of the same missing directory.

**Nothing in the repository says the order is load-bearing, except a
gotcha.** The fresh-clone ORDER at the top of CONVENTIONS covers
parser-before-app and stops; the app bullet lists `npm run build` before
`npm test` without saying the second depends on the first. CI never
meets it, because `ci.yml` orders app build ahead of app suite. **It is
a HAND-RUN-ONLY failure, which is exactly the population this project's
lanes are drawn from** — and it was found because a dispatch brief named
the fresh-clone order and omitted this step.

## Acceptance criteria

- **AN ABSENT `app/dist` SHALL FAIL ONCE, AND THE MESSAGE SHALL NAME THE
  COMMAND.** One shared precondition, called by every body that reads
  the built bundle, failing with `run npm run build from app/ first`
  rather than a dozen sentences about staleness. **One helper, one
  spelling** (T-057) — not a copy per file.
- **THE READER SET SHALL BE DERIVED, NOT LISTED.** The precondition
  SHALL be reached by every file that resolves a path under `app/dist`,
  and a pin SHALL fail if a file reads the bundle without it. A
  hand-maintained list of six goes stale the day a seventh lands —
  which is exactly how the figure this card corrects went stale.
- **THE STALE-BUILD BODIES SHALL KEEP THEIR REAL ASSERTIONS.** They were
  written for the case where the build EXISTS and is older than its
  source, and that case is still theirs. This card changes what happens
  when the directory is ABSENT and nothing else.
- **A PIN SHALL DRIVE THE ABSENT CASE**, not only the present one:
  point the precondition at a directory that does not exist and require
  the one named failure. A precondition proved only against a built tree
  is a body that cannot fail (T-080-s1).
- IF making `npm test` depend on `npm run build` in `app/package.json`
  is preferred THEN it SHALL be measured before it is chosen, not
  reasoned about — it doubles the cost of every watch-mode run — and
  the card SHALL state **which arm it took and why**. The anchor
  finding rejected that arm without measurement and said so.
- **THE LANE PROTOCOL BULLET SHALL STOP SAYING FIVE.** Its fresh-worktree
  clause SHALL carry the count and file set re-derived at this lane's
  own ref, with that ref named, and SHALL agree with the POISON DRILL
  bullet's clause in the same file. **Two clauses in one file
  disagreeing about one fact is the defect** — leaving both and adding a
  third figure is not a fix.
- IF the two clauses would then state the same fact twice THEN one of
  them SHALL be the statement and the other SHALL point at it, with the
  precedence named (the brief rules' "redundancy with no precedence rule
  is two facts, not one fact checked twice").
- **THE tools/e2e CLAIM SHALL BE SETTLED BY DERIVATION AND WRITTEN
  DOWN.** The anchor finding asserts the lane reads `app/dist`;
  `playwright.config.ts` runs `npm run dev` and no lane file resolves a
  path under `app/dist`. Re-derive at the lane's own ref, and record the
  answer either way — **an unrefuted false sentence in a finding becomes
  a fact in the next card that quotes it.**

Verification: headless — `npm test` and `npm run build` from app/, with
counts and exits stated (`$?`, unpiped), **run twice: once on a tree
with `app/dist` removed and once after `npm run build`**, since the
whole property is the difference between those two runs. **POISON DRILL
on every new or changed assertion, one side only**: delete the
precondition from one call site and require the derived pin RED; make
the precondition pass on an absent directory and require its own body
RED. Each mutated text read back with `git diff` before its run;
restores per-path proved by sha256 at the drill's own commit. Note the
recursion — **this card's own drill needs the build it is about**;
build first, then baseline, then mutate. The DOCS GATE fires on
`docs/CONVENTIONS.md` and on this card, and CONVENTIONS is read off disk
by `cargo test` (`snapshot_version_matches_the_live_method_stamps`) and
by the lane's `workflow-parity` derivation: ask
`node tools/e2e/scripts/docs-gate.mjs <changed path>...` directly, never
through `xargs`, and run what it owes. **No method version bump is
possible from this fence** (T-078-s3: the third file is Rust) — if an
edit here would need one, stop. @human: none.

**Fence re-pointed 2026-09-14 (the architect seat, after T-290's merge).** docs/CONVENTIONS.md is now the index over the chapters under docs/conventions/; this fence gains the chapter(s) this card's work needs, mapped by opener: docs/conventions/lanes.md, docs/conventions/standing-gates.md, docs/conventions/verification.md. The index stays fenced for its pointer line.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
