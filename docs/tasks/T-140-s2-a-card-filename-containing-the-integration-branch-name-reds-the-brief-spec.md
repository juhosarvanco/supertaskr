---
id: T-140-s2
title: A card whose FILENAME contains the integration branch as a word reds brief.spec.ts, because the provenance classifier regexes the branch name against the whole source string
status: suggested
suggested_by: executor claude-opus-5 @T-140
---

**Found by `T-140`'s lane running the e2e suite for its DOCS GATE, and
PROVEN INHERITED rather than caused by that lane's diff.** Needs the
`tools/e2e` fence, which `T-153-s9` holds at the time of writing.

## The red

    tools/e2e npm test  ->  1 failed / 280 passed of 281, exit 1
    [chromium] tests/brief.spec.ts:313
      "a figure read from the MOVING integration ref is a LIVE fact —
       two reads at ONE ref disagree"

    Expected substring: "  <- read "
    Received:  T-153-s9 touches: tools/e2e  <- @ <ref> ;
               docs/tasks/T-153-s9-a-pull-request-checkout-has-no-local-main-so-...md
               frontmatter field touches

## The mechanism

The body's closing rule says *every line whose SOURCE names the
integration branch carries a clock*, and it selects those lines with

    const via = (l) => l.replace(/^.*? {2}<- /, "");
    before.filter((l) => l.includes("  <- ") && new RegExp(`\\b${branch}\\b`).test(via(l)))

`branch` is `main`. The SOURCE half of a lane-list line is a card's PATH,
and `T-153-s9`'s filename contains `-local-main-so-`, where `main` is
delimited by hyphens and therefore matches `\bmain\b`. So a line whose
source is a card file on disk — a TREE fact, correctly stamped `<- @` —
is classified as a read of the mutable branch and required to carry a
clock it must not carry.

**The rule is right and the CLASSIFIER is wrong.** It asks "does the
source string mention the branch", where the property is "was this figure
READ FROM the branch". The two agreed until a card was named after the
branch, and that card is one the dispatcher itself filed.

## Proved inherited, not caused

Re-run alone at `T-140`'s tip: same single failure, so it is not the
concurrency artifact CONVENTIONS warns about. Then reproduced at
`T-140`'s BASE `a533a4d` in a detached worktree, using that tree's OWN
`brief.mjs` and the spec's own two lines of classification: **5 refReads,
2 not live-stamped**, both of them `T-153-s9` lines. `T-140`'s diff adds
no path containing `main` and touches no file under `tools/e2e`.

## Shapes worth considering, none of them chosen here

- Classify by the RECORD's provenance kind rather than by regexing the
  rendered source — the assembler knows which reads came from the branch.
- Match the branch only where the source names it as a git ref (`git log
  … main`, `git rev-parse main`) rather than anywhere in the string.
- Keep the string match but exclude the path segment of the source.

The first is the one that cannot be broken by the next thing somebody
names after a branch, which is this finding's whole subject.

## Two related notes for whoever takes it

- The suite reports ONE failing body because the loop stops at the first
  bad line; there are TWO bad lines per lane whose card is so named, and
  a fix should check both.
- The same classifier is what makes this body's own positive control
  (`refReads.length > 1`) pass, so a narrowing fix has to keep that
  control non-vacuous rather than narrowing it to zero.
