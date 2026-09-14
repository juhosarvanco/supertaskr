# 16 — The repository

The packages this repository is built from, the commands each one
publishes, the order a fresh clone builds them in, and the shell and git
environment every one of those commands actually runs in. It is the
chapter a reader opens to find out why a command is spelled the way it
is, rather than what to type: the rules themselves are in
docs/conventions/commands.md and docs/conventions/shell-and-scripts.md,
which docs/CONVENTIONS.md indexes.

It exists because the other fifteen chapters each own a STAGE of the
loop, and the tree's own build and shell forensics belong to none of
them (T-290). Chapter 15 would have been the closer home for the
settings material below, and it is GENERATED from the schema, so nothing
may be appended to it by hand.

## How to read it

- **Every entry below is a record, moved here verbatim.** It is the
  history, the measurement or the argument a conventions bullet was cut
  from at T-290 under ADR-023, and this project does not rewrite a
  record. Where an entry and the live rule disagree, the rule wins and
  the entry is the history of how it got there.
- **The card id in an entry is where the evidence lives.** The card
  carries the measurement and the verdict; this chapter carries the
  reasoning the rule was cut from.

## From the conventions — the forensics behind the rules (T-290)

The rules themselves live in the chapters under docs/conventions/,
which docs/CONVENTIONS.md indexes. What follows is the history, the
measurements and the argument each of those rules was cut from, moved
here VERBATIM at T-290 under ADR-023 — the records rule forbids a
rewrite, so not a byte of it is re-worded, re-ordered inside an entry,
or summarised. Each entry names the bullet it came out of.

### lib/parser

The suite's smoke test
  parses this repo's live docs/ tree and requires zero issues.

### tools/e2e

THE CATCH IS TOTAL AND IS NEVER A RESCUE: exit 3
  still FAILS the step, and `process.exit` inside the scanner is not
  interceptable by the wrapper, so a genuine hit cannot be relabelled as
  a gate that did not run. ONE HOLE REMAINS, NAMED (T-080-s4): a parse
  error in the gate's own two files means Node never links them, so the
  wrapper's `try` never runs and the process exits 1, not 3.

### AN EDIT SCRIPT'S SUCCESS IS A GATE, NOT A STEP

The
  rule was earned, recorded ONLY in checkpoint records, and then broken
  three times by seats able to quote it: the T-146 class, and the reason
  a MECHANISM belongs in a governing document while a record takes the
  INSTANCE.

### A GATE READ THROUGH A PIPE REPORTS THE PIPE

One
  seat read exit **254** as green four times.

### NEVER TYPE A PATH YOU CAN DERIVE

Three paths were INVENTED in a single sitting,
  one of them inside a VERIFIER'S BRIEF, so an agent spent part of its
  blind phase correcting its own instructions; each surfaced as an exit
  1 that was a stack trace rather than a verdict.

### RUN THE SUITE ONCE IN A BORROWED GIT ENVIRONMENT BEFORE YOU BELIEVE

  **THE LAST THREE ARE LOAD-BEARING AND THE FIRST TWO CANNOT DO THEIR
  WORK** (T-239-s4's class, measured at `0f6b37f`; published by T-256):
  the two `GIT_CONFIG_*` variables suppress config FILES only, and with
  no configured identity git AUTO-DETECTS one from `getpwuid` and the
  hostname, refusing only where it judges the result bogus — which is a
  property of the HOST.

It would have caught both of the CI reds this rule was written from,
  in seconds, before either push. A suite green here and red there is
  not flaky; it is measuring the machine.

The first version of this rule did (`HOME=$(mktemp -d)`) and
  reddened 54 browser bodies, because Playwright caches its browsers
  under `~/`: git's config and its auto-detected identity are the whole
  of what is wanted, and the wrong recipe was caught by running it —
  this bullet's own point applied to itself, twice now.

### PIN THE DEFAULT BRANCH IN EVERY GIT FIXTURE

Green here, red there, and the diff
  explains nothing; the asymmetry between the fixtures that pinned it
  and the three new ones that did not is what made it look like a
  platform bug.

### THE PROCESS IS SETTINGS, AND EVERY SWITCH IS DECLARED ONCE

`operational` means the arm reads the row and branches on it, and the
  label is EARNED: the lane that assigns it shows a body that CHANGES the
  value and watches the arm answer differently, with every value of the
  row erased from the answers before they are compared — a read site
  shows the value is read, and a surface printing the value back shows
  less than that.

The fence hook, the docs gate and the
  landing gate all read `declarative` and are all in force; what they are
  not is settings, because they live in code and in CI configuration that
  never consults the schema.

It lives there
  rather than in the block because T-319's reader answers each declared
  field BY NAME and would refuse a whole block carrying a row it does not
  return — so a `pause:` row today would be a control that silently did
  nothing.
