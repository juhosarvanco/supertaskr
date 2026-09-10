---
id: T-295
title: The arm merges — `brief.mjs --merge <id>` runs the ritual from the verdict (the lane branch to the bench tip, the merge, the corrections from the MUTANT BLOCKs, the re-drill scoped to the fix diff, the census and graph regenerations, the bump when method text moved, the message) with the cheap keepers as steps with exits, stopping before the commit on any refusal; the seat rules, never edits
feature: F-04
milestone: 4
size: L
priority: 1
status: verifying
suggested_by: "@human (2026-09-10): \"Rule the loop room, A to I as amended: yes\" — docs/rooms/loop-cost-and-speed.md, ADR-024"
blocked_by: []
touches: [tools/e2e/scripts/merge.mjs, tools/e2e/scripts/brief.mjs, tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/scripts/rename-scan.mjs, tools/e2e/scripts/gate-run.mjs, .claude/hooks/landing-gate.mjs, tools/e2e/tests/merge.spec.ts, tools/e2e/tests/cli.spec.ts, tools/e2e/tests/brief-flush.spec.ts, method/roles/integrator.md, docs/CONVENTIONS.md]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

## What was measured

Seven merges on 2026-09-09 each took the seat 15 to 21 minutes of hand steps, and two of the day's three reds were the seat's hand edits: a paraphrase of a spec-pinned sentence and a comment spelling the pre-rename identifier. Superpowers forbids controller-side fixes for the same reason. T-281-s10 asked for the fence half (the verdict's spec outside the fence, widened on main before the merge); this card is the whole verb. Absorbs T-281-s10's criteria.

## Acceptance criteria

- WHEN `brief.mjs --merge <id>` runs on a card with an approved verdict THE verb SHALL perform the ritual's steps in order — widen the fence on main for any verdict body outside it (T-281-s10), move the lane branch to the bench tip, merge without committing, take the lane's copy of ITS card on a card conflict, resolve a same-file end-of-file append by keeping both and restoring the closing, stamp done, regenerate the census when a spec name moved and the graph when a source under the walk moved, run the docs gate — and STOP before the commit with every step's exit printed.
- WHEN the verdict carries MUTANT BLOCKs THE verb SHALL apply each correction's `new` text, re-drill every block through runMutantDrill with the fix diff as its scope (a mutant that reds more than its own body is a refusal naming the bodies), and regenerate after the corrections, never before.
- WHEN method text moved THE verb SHALL bump the three stamp files, run the pin test, the half-bump drill and the eval gate, and refuse on any red; WHEN it did not move THE stamp SHALL be untouched.
- WHEN any changed line under method/ or docs/ matches a sentence a spec pins verbatim, WHEN the diff carries a forbidden spelling (the rename keeper's list, a personal name, an email, a home path, a secret shape), WHEN an XS card's diff exceeds the XS bound, or WHEN the card's preflight exits non-zero THE verb SHALL refuse before the commit naming the line — each seen refusing on a planted instance.
- WHEN the verb finishes THE message SHALL be written from the verdict's own sentences and counts (never composed by hand), the lane's and verifier's `## Meters` blocks SHALL be appended to the bands' readings, and the seat's return SHALL be one line per step; a body SHALL show the verb refusing to commit on a count that moved (2d6d354's class).
- IF the merge conflicts inside one file that both sides changed THEN the verb SHALL stop and name it as a fence finding, never resolve it.

## Implementation notes

**The verb is `brief.mjs --merge <id>` and the derivation is
`merge.mjs`'s.** The wrapper derives the dials and renders one line per
step; the module plans the steps, runs them and grades them. Nineteen
steps ran end to end on the fixture clone at exit 0, and the run stopped
with the merge STAGED and nothing pushed.

**THE SEAT TYPES ONE CARD ID AND EVERY DIAL IS DERIVED** (`mergeDials`):
the lane branch off `git for-each-ref refs/heads/task/<id>-*`, the lane
worktree off `git worktree list --porcelain` and never off the
CONVENTIONS bullet (the measured fault: a lane cut before the rename was
not found by a script that read the bullet), the BENCH TIP off the
detached bench worktree's HEAD — not the verdict sha, because the
verifier commits its correction bodies after writing the verdict — and
both seats off the card's own `builder:`/`verifier:` fields. A card with
no lane branch, or with two, is a refusal naming the count rather than a
guess.

**THE CORRECTION IS THE BLOCK'S `old` TEXT, AND THE MECHANISM IS WHY.**
The card's criterion 2 reads "apply each correction's `new` text" and the
brief's ground rule reads the opposite; only one of them closes.
`runMutantDrill` requires the block's `old` text to be IN the tree so
that planting `new` is a mutation the named body reds on — so a verb that
applied `new` would make its own next step unrunnable, and `plantMutant`
would refuse it one step later with "the old anchor matches 0 time(s)".
`correctionFor` therefore asks the TREE, in this order: the tree already
carries `old` (nothing is written, and the step says the correction was
already in the merged tree — the lane's own fix pass had landed it at
four of the merges this card was cut from); else the tree carries `new`
exactly once (the `old` text is applied); else a refusal naming both
counts. The order matters because a `new` text is often a substring of
its own `old`, so asking for `new` first would "correct" a correct tree
back to the mutant. An ask was written at the start and parked; the
inversion is a two-line change if the seat rules the card's letter, and
the correction step and the drill step have to invert together.

**THE READER'S DISCRIMINATOR MOVED FROM THE MARGIN TO THE ENCLOSURE.**
`readMutantBlocks` took a fence at column zero only, so at the T-293
merge a verifier's block indented four spaces inside its verdict entry
was not read at all and the merged tree's own re-drill reported zero
blocks over a verdict that assigned a correction. It now reads a fence at
any margin, dedents the body by the fence's own indent (the anchors are
exact text, so a block read with its indent on matches nothing), and
skips a fence that is INSIDE another code fence — CommonMark's own rule,
which is what still lets a verdict quote the layout. The residual risk is
a verdict quoting the layout indented and unfenced; that risk is LOUD
where the old one was silent, because such a quotation either drills its
placeholder anchors and refuses or fails to parse and refuses the read.

**THE RE-DRILL'S SCOPE IS THE FIX DIFF, AND IT IS NARROW BY DEFAULT
BECAUSE THE WIDE ONE WAS PRICED.** `drillScope` asks `gate-run.mjs`'s
own `deriveOwning` which specs own the files the corrections wrote. By
default that answer is spent on a READING rather than on the run: a
block whose `spec` is not among them is pinning a property the correction
did not move, which is said. `--drill-wide` runs the whole owning set
instead — the stronger claim, "RED ALONE" over every body the corrected
source can reach. It was measured on the fixture: one correction to one
script under `tools/e2e` was owned by THIRTEEN e2e spec files, and that
one block's drill ran 443 bodies in 9.6 minutes, against a ritual whose
target is about five. The narrow run of the same block is one spec and
seconds. `runMutantDrill` takes a `scope` and runs one runner per
package, unioning the failing bodies, so a scope spanning two packages
is still one reading.

**THE DOCS GATE IS GRADED ON ITS WORDS, NOT ITS EXIT.** It exits 1 both
when it FIRES and when something is STALE, and every merge carries at
least a card under `docs/tasks/` — so a step graded on the exit alone
would stop every merge this project ever makes. FIRES is NEWS and the
owed suites join the message; STALE stops.

**EVERY STEP IS CAPTURED.** The first fixture run had the docs gate
inherit stdio: it refused, the ledger said `exit 1`, and the gate's own
sentence was nowhere in the transcript the seat was handed. A verb whose
whole job is to be read cannot have a step that writes somewhere else.
The card's preflight is the one step marked `quiet` — it renders a whole
brief — and its output goes out in full on a refusal.

**THE CONFLICT ARM NEEDED THE MERGE BASE, WHICH THE FIRST BUILD DID NOT
HAVE.** An end-of-file append and two rewrites of a one-line file are
both ONE conflicted hunk at the end of the file, and a resolver keying on
the end alone concatenated two rewrites and called it a merge — caught by
this card's own fixture. So the runner re-materialises every conflicted
path with `git checkout --merge --conflict=diff3` and the classifier
requires the hunk's MERGE BASE to be present and EMPTY: both sides added
where the base had nothing, or it is not an append. A conflict with no
base section is refused rather than guessed at.

**THE FOUR CHEAP KEEPERS, and the two defects the first fixture run
found in them.** The forbidden-spelling keeper split the git identity
into words and then refused every line carrying a card id or the word
"fixture" — eleven findings over four files, none of them a leak; a
keeper that fires on ordinary vocabulary is one that gets turned off on
its second day, so the identity is now taken WHOLE. And it printed the
same sentence once per LINE; it is now once per file per class. The
XS bound is FORTY changed lines outside the card's own file, stated here
and in CONVENTIONS so the tier work has something to read, and it is a
number to be moved by measurement.

**THE READINGS FILE IS `docs/checkpoints/meters.jsonl`** — the shape
T-297 is blocked on. One JSON object per line, appended and never
rewritten: `at`, `card`, `size`, `tier`, `seat` (executor or verifier),
`source`, `merge` (the bench tip), and `meters` carrying the block's own
text WHOLE. The text is not parsed into fields at write time: T-297 owns
the parse, this owns the capture, and a capture that loses nothing is the
only one a later parser can be written against. Two readings landed on
the fixture run, one per seat.

**WHAT DID NOT MOVE.** The method stamp: `integrator.md` is method text,
so this merge fires the METHOD EVAL GATE and owes a bump, and the `--bump
<old>..<new>` block is the integrator's at the merge — the lane leaves
0.1.18 alone. The census: a spec name moved (a new spec file), and
`npm run capabilities` lands in the MERGE commit, the integrator's, which
is also the step the verb now performs itself.

**THE VERB NEVER PUSHES**, and one body reads the file's own git argv to
say so with its positive control beside it. The one commit it makes is
the fence widening, on the integration branch, ahead of the merge —
because the landing gate reads a merge's fence from its FIRST PARENT, so
a widening that rode inside the merge is invisible to the gate it exists
to satisfy. The landing gate now labels each out-of-fence path as a
VERDICT-NAMED spec or a LANE write, since the two have different
remedies.

## Verdicts
