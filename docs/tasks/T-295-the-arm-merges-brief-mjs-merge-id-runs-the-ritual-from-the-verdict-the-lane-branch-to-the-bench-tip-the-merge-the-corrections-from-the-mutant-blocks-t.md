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

**THE SEAT RULED ASK 1 AT 2026-09-10T14:36:42Z: THE BRIEF'S HALF STANDS
AND NOTHING BUILT ABOVE INVERTS.** A block's `old` text is the
correction and is applied when the merged tree carries `new` exactly
once, nothing is written when the tree already carries `old` and the
step says so, and anything else refuses naming the block — so
criterion 2's letter ("apply each correction's `new` text") is read as
so amended, the card standing as the record it is, and the drill goes
on planting `new` over `old`.

**ASK 2 WAS GRANTED AT 2026-09-10T15:44:53Z BY THE FAST PATH, AND THE
FIVE FLAGS ARE ARGUED IN THIS COMMIT.** Main commit `9e34aaec` widened
this card's `touches:` by `tools/e2e/tests/brief-flush.spec.ts` and the
lane's fence manifest carries it, so the five flags this card adds to
`brief.mjs` — `--merge` and its four modifiers `--bump`, `--meters`,
`--tier` and `--blocks-absent` — now sit in that file's `NOT_AN_ARM`
beside `--dispatch-lane`, each with the reason that guard requires: a
verb that stages a merge, widens a fence and stamps a card cannot be an
arm a size guard RUNS, which is `--dispatch-lane`'s own argument at the
closing end of the loop, and `merge.spec.ts` drives it end to end
instead.

**THE CLOSING BATTERY, RE-RUN AT `938b31df` AFTER THE FLUSH-GUARD FIX**
— the range's own owed set, `46c33c07..HEAD` through `gate-run.mjs`, one
run, on `SUPERTASKR_E2E_PORT=15295`: parser 389 bodies exit 0 GREEN, app
1171 bodies exit 0 GREEN, rust 655 bodies exit 0 GREEN, e2e 890 bodies
exit 0 GREEN, range exit 0. Every figure is read at that ref. The one
red of the previous reading — `brief-flush.spec.ts`'s arm-list coverage
body, at `:753` then and at `:773` now, over the five flags this card
adds — is the body the same commit turned green, and no other body in
that file moved: the file's six bodies pass alone as well.

## Verdicts
### VERDICT 2026-09-10 — APPROVED WITH ASSIGNED CORRECTIONS — claude-opus-5@subagent (verifier, phase 2)

The arm merges, it stops with the merge staged, and the one commit it makes is the fence widening the landing gate has to read from a first parent — measured on a shared clone, not argued: `.git/MERGE_HEAD` stood at the end of every run, exactly one commit appeared on the integration branch and it was the widening, and the control with every verdict-named spec already inside the fence made none. Five corrections are assigned, each carried by a body committed on this bench and drilled RED ALONE.

**The frame.** Blind two-phase: the attack set was written tool-less at the base before any file was opened, and this phase cites all three sealed inputs by hash — attack set `sha256:ce31efdfa586d7f04ee887209d3e7b976cc76cc1ca52ef0912f2636c10c60a9d`, ground truths `sha256:624cc2dc24283427df461dc308b7476e8a8f41365375f566e3c3da7fa9d25310`, ground addendum `sha256:04763f80949e418304d5f0ff14c47f0dc9be08be0d40e1e71bbf3790ffa66af5`. All three verified against `stamps-T-295.txt` before anything else was opened. **This brief was hand-written by the seat and carried no context pack**, so the standing documents were read at the base by the bullets the fence implicates. `method/roles/verifier.md` at the bench does not spell the four suite legs, so ADR-024 decision 4 governs and the RANGE FORM through `gate-run.mjs` is this verifier's run. The executor's report, the ask file, the card's notes and the commit messages were opened only after every finding below was written; every figure they claim was re-measured here.

**The fence.** `git diff --name-only 46c33c07..9331fbc8` moves twelve paths and every one is inside the fence: the eight fenced files the lane touched, plus `docs/tasks/` for its own card and three NEW suggested cards. `dispatch-brief.mjs`, `rename-scan.mjs` and `gate-run.mjs` are fenced and UNTOUCHED — which settles the attack set's own conflict (ii): the four new forbidden classes live in `merge.mjs`, the shared scanner's `KEPT_CLASSES` did not move, and the rename class rides that file's own classifier rather than a second copy. `docs/checkpoints/meters.jsonl` does not appear in the lane's diff, as the verb creates it at merge time. The method stamp does not move in the lane, which settles conflict (i): `integrator.md` moved, so the merge owes a bump, and the bump is the verb's `--bump` dial rather than a lane write.

**Criterion 1 — the ritual, and the stop.** There is exactly ONE `git commit` in the whole of `merge.mjs`, in `widenFenceStep`, and it is the widening. `git merge` runs `--no-ff --no-commit`; there is no `--amend`, no `--continue`, no `--allow-empty`, no `push` in any argv. Every git and npm call is `spawnSync` with an argv ARRAY — no `execSync`, no shell string, nowhere. On a `git clone --shared` fixture under scratch (`T-950`, a lane, a verdict carrying one block at a four-space margin), the verb committed `dcb925b4` — the widening, naming the verdict that owed it — then staged the merge and left `.git/MERGE_HEAD` standing. **The control is what makes that finding mean something**: the same fixture with the verdict-named spec already in `touches:` planned no `fence:widen` step at all and made ZERO commits on the integration branch. The widening is conditional, not unconditional, which was the attack set's load-bearing control C-2.6.

Ancestry is checked BEFORE the branch moves — `precondition:verdict` runs `merge-base --is-ancestor <lane> <verdict>` in that order, and `branch:move` is the step after it — so a refusal leaves the branch unmoved (S-5). The lane worktree is DISCOVERED: `laneWorktree` matches `branch refs/heads/<lane>` out of `git worktree list --porcelain` and never constructs a path from the card id, so the recorded fault of a lane cut at an old worktree spelling cannot recur. The clean-tree precondition is graded on OUTPUT, not exit, and it treats UNTRACKED files as dirty — settling the attack set's conflict (iii): this is correct and consistent with `integrator.md`'s rule that an unexplained file in the integration checkout is evidence, but the seat must clear stray untracked files before merging, and this is an operational fact rather than a defect.

**Criterion 2 — the old/new direction, which was the highest-stakes judgment on this bench.** `correctionFor` returns `source.replace(block.new, () => block.old)`: the block's `old` text is written where the tree carries its `new`. Proven twice — as a function, and end to end on the fixture, where `tools/probe/guard.mjs` came out of the merge carrying `return n > 0;`, the corrected text. The three-way answer the seat ruled for is exactly what is implemented: applied where the tree carries `new`, nothing written and SAID OUT LOUD where the tree already carries `old`, a refusal naming the block otherwise. The replacement is a FUNCTION replacer, which is what stops a `$&` or `$1` in a subagent-written block from being expanded — a real injection defence and an easy one to miss. Corrections are planned ahead of every regeneration in `tailPlan`, and the drill is scoped by the fix diff through `gate-run.mjs`'s own `deriveOwning`, narrow by default with the ownership stated as a reading beside it.

The parse cross-check the attack set most wanted is present and is the best thing in the diff: a verdict that ASSIGNS corrections and yields zero blocks is REFUSED, and the way through — `--blocks-absent <sha>` — must name the run's own verdict sha at seven characters or more. It is not a blanket. That closes the whole silent-miss class, not just the indentation that produced it.

**Criterion 3 and 4.** The bump is four operations with four exits, and it is not derived from the diff but taken as an explicit `<old>..<new>` dial the verb refuses to guess at. All four keepers are steps with their own exits. The XS bound of 40 and the pinned-sentence floor of 30 are both ARGUED at their definition — forty as the first round number above the largest merge a seat would have called XS on sight, thirty as the shortest verbatim-pinned SENTENCE in this repository's own specs — and both are published in `docs/CONVENTIONS.md`, where a reader looks, and pinned against those publishing sentences by a body. The pinned-sentence keeper judges REMOVALS, which is the right half of the fault class. `docs/CONVENTIONS.md` grows 140,462 → 143,653 bytes, inside the 146,878 warn bound with 3,225 bytes of headroom.

**The security sweep.** A block's `file:`/`spec:` is confined at PARSE time — absolute paths and anything normalising to `..` are refused before any write, and the refusal names the path. The nested-fence attack — the one the attack set called the most likely real vulnerability, where a lenient dedent composes with an ignored enclosure so a documented example block gets executed — does NOT work: a ```mutant fence inside another code fence reads as ZERO blocks, while the identical block unfenced is refused for its `/etc/hosts` path. The two leniencies do not compose. The message is written to a FILE and never passed on a command line. Three things the sweep did find are assigned below: two refusals that publish the value they exist to suppress, and a merge that proceeds on a REJECTED verdict.

**What is NOT confined, and is a finding rather than a correction**: `file:` is confined to the project ROOT but not excluded from `.git/`. A block naming `.git/hooks/pre-commit` parses, and `applyCorrectionStep` writes the file BEFORE the `git add` that would refuse it. Exploitation needs the hook to already exist and to carry the block's `new` text verbatim, so it is narrow — but the write ordering is the wrong way round and the classifier is one clause short. Filed as T-295-s6.

**Regressions.** `cli.spec.ts` carries 48 bodies at the base and 48 at the tip with an IDENTICAL body-name set — nothing renamed, nothing removed. (The sealed ground truth lists fifty for this file; two of its entries are its own extraction artefacts, not bodies.) `brief-flush.spec.ts` carries 6 bodies at both ends and none moved; the five new flags are argued into `NOT_AN_ARM` beside `--dispatch-lane` and the sweep body is green. `integrator.md`'s diff is ADDITIONS ONLY, so no sentence a spec pins verbatim could have been broken by it. No added line in the whole diff carries an absolute path, an arrow, or the retired identifier.

**The suites, re-measured at 9331fbc8 on this bench.** The range form through the blessed runner: `parser 389 GREEN exit 0 / app 1171 GREEN exit 0 / rust 655 GREEN exit 0 / e2e 890 GREEN exit 0`, gate exit 0. Scoped: `cli.spec.ts` 48 passed exit 0; `brief-flush.spec.ts` 6 passed exit 0; `tools/method-evals/run.mjs` 10 model-free evals exit 0. `merge.spec.ts` is 22 passed / 4 failed at this tip, and the four failures are the verifier's own bodies below, red by design until the corrections are applied — with all five applied it is 26 passed, exit 0. Every figure the executor's report claims was reproduced.

**One measured fact that is nobody's failure and belongs on the record.** Run against its own card on the shared clone, the verb REFUSES its own merge: `merge T-295: stopped at keeper:forbidden-spelling (exit 1)`, because the keeper's own committed fixtures in `merge.spec.ts` plant a credential-shaped token and an example address, and those are lines this diff ADDS. The keeper is doing exactly what criterion 4 tells it to, so the criterion is met and this is not a correction — but the address class and the credential class carry no exemption the way the rename class rides `rename-scan.mjs`'s classifier, so the next card that commits a fixture of that shape has no way through. It is also the compounding case for corrections 3 and 4: the refusal printed the fixture address into the transcript. In practice T-295's own merge is performed by the integration checkout's script, which predates this arm, so nothing is blocked today. Filed as T-295-s4.

**Credit where the lane declined to fake it.** Three of the attack set's pre-committed findings-against-the-CARD were found by the lane first and filed rather than papered over: `XS` is T-296's tier and the parser knows S/M/L, so the bound exists ahead of the tier that reads it and a card of any other size is explicitly NOT judged; the wide re-drill is priced and unwired (T-295-s1); and the counts guard can seldom judge because a verdict states its counts in prose (T-295-s3). Criterion 5's "refusing to commit" is read honestly as refusing to leave the staged tree ready, which is the only reading available once the verb never commits.

---

#### CORRECTION 1 — the card arm takes ITS OWN card and no other

`classifyConflict` anchors the card arm on `^docs/tasks/<id>(?:-|\.)`, and every suggested card a lane files is spelled `<id>-s<n>-...`, so its path matches too. Reproduced on the shared clone: a conflict in `docs/tasks/T-950-s1-a-sibling-card.md`, written by both sides, was resolved to the LANE's copy and the integration branch's copy discarded without a word, under a printed sentence reading "is T-950's OWN card" — which it is not. Criterion 1's word is ITS and criterion 6 says everything else STOPS as a fence finding. RED at 25 passed / 1 failed with the mutant planted, GREEN at 26 passed with the correction applied, restore proved by sha256.

```mutant
correction: the card arm takes ITS OWN card and no other
file: tools/e2e/scripts/merge.mjs
spec: tools/e2e/tests/merge.spec.ts
body: the card arm takes ITS OWN card and no other, so a SUGGESTED card of the same lane is a fence finding
message: a SUGGESTED card of the same lane is NOT this card
--- old
  const mine = new RegExp(`^docs/tasks/${id}(?:-|\\.)`).test(rel);
  const suggested = new RegExp(`^docs/tasks/${id}-s\\d`).test(rel);
  if (mine && !suggested) {
--- new
  if (new RegExp(`^docs/tasks/${id}(?:-|\\.)`).test(rel)) {
```

#### CORRECTION 2 — a correction is applied wherever its NEW text names a site OUTSIDE its OLD text

`correctionFor` asks whether the `old` text occurs AT ALL before it asks where the `new` text is, so a block whose `old` text also appears somewhere else in the same file is answered "already carries the block's `old` text" — and the defect the verdict assigned a correction for is left in the merged tree, reported as a correction already made.

**The lane's ordering is not arbitrary and this correction keeps its reason.** The notes argue the order because a block's `new` text is often a SUBSTRING of its own `old`, and there a tree carrying `old` carries `new` inside it — "already" is then the right answer. Confirmed on this bench: `old: "  return n > 0 && n < 10;"` with `new: "  return n > 0"` answers `already` today and must keep doing so. **The two cases are indistinguishable by COUNTING** — each is one `old` and one `new` — so simply asking about `new` first, which was this verifier's first draft of the correction, would have corrupted the substring case by splicing `old` into text that already contained it. What separates them is POSITION: mask every occurrence of `old` out of the source, and count the occurrences of `new` that remain. Exactly one is the site; none is "already"; anything else refuses. The body carries both directions, and the three answers the lane's own body pins are all preserved. RED 25/1, GREEN 26, restore proved by sha256.

```mutant
correction: a correction is applied wherever its NEW text names a site OUTSIDE its OLD text
file: tools/e2e/scripts/merge.mjs
spec: tools/e2e/tests/merge.spec.ts
body: a correction is applied whenever the tree carries its NEW text once, even where the OLD text also occurs elsewhere
message: the site is there, so the correction is applied
--- old
  const hasOld = occurrences(source, block.old);
  const hasNew = occurrences(source, block.new);
  // EVERY OCCURRENCE OF `new` THAT IS NOT PART OF ONE OF `old`. The two
  // counts alone cannot tell "already corrected, and this block's `new`
  // text is a substring of its own `old`" from "the correction is owed
  // HERE, and its `old` text also occurs elsewhere in the file" — both
  // read as one of each, and answering them alike leaves the defect in
  // the merged tree under the word "already".
  const MASK = "\u0000";
  const masked = source.split(block.old).join(MASK);
  if (occurrences(masked, block.new) === 1) {
    return { text: masked.replace(block.new, () => block.old).split(MASK).join(block.old) };
  }
  if (hasOld > 0) {
    return {
      already:
        `${block.correction}: ${block.file} already carries the block's \`old\` text, so this ` +
        "correction is in the merged tree and nothing was written. The re-drill below is what " +
        "says whether the body still pins it",
    };
  }
  return {
    problem:
      `${block.correction}: ${block.file} carries the block's \`old\` text 0 time(s) and its ` +
      `\`new\` text ${String(hasNew)} time(s), so this merge cannot tell whether the correction ` +
      "is owed or already made. An anchor that names no site, or names several, is not a " +
      "correction — the merge stops here rather than guessing",
  };
--- new
  const hasOld = occurrences(source, block.old);
  if (hasOld > 0) {
    return {
      already:
        `${block.correction}: ${block.file} already carries the block's \`old\` text, so this ` +
        "correction is in the merged tree and nothing was written. The re-drill below is what " +
        "says whether the body still pins it",
    };
  }
  const hasNew = occurrences(source, block.new);
  if (hasNew !== 1) {
    return {
      problem:
        `${block.correction}: ${block.file} carries the block's \`old\` text 0 time(s) and its ` +
        `\`new\` text ${String(hasNew)} time(s), so this merge cannot tell whether the correction ` +
        "is owed or already made. An anchor that names no site, or names several, is not a " +
        "correction — the merge stops here rather than guessing",
    };
  }
  return { text: source.replace(block.new, () => block.old) };
```

#### CORRECTION 3 — the address a refusal found is not republished by the refusal

The forbidden-spelling keeper exists because "an address in a tracked file is an address published", and its own refusal prints the address verbatim into the seat's return — which is what a checkpoint record quotes. The credential class already names the class and redacts the value; this asks the address class to do the same. The file and the class are what a seat needs to find the line, and the value is what it must not carry. RED 25/1, GREEN 26, restore proved by sha256.

```mutant
correction: the address a refusal found is not republished by the refusal
file: tools/e2e/scripts/merge.mjs
spec: tools/e2e/tests/merge.spec.ts
body: a forbidden-spelling refusal names the file and the class and REDACTS the value, on every class it carries
message: but the address is NOT published by the refusal
--- old
        `${rel}: this merge ADDS a line carrying an email address. An address in a tracked ` +
          "file is an address published, and this refusal does not repeat the one it found",
--- new
        `${rel}: this merge ADDS a line carrying an email address — ` +
          `${JSON.stringify(EMAIL_SHAPE.exec(line)?.[0] ?? "")}. An address in a tracked file is ` +
          "an address published",
```

#### CORRECTION 4 — the account name a refusal found is not republished by the refusal

The same fault, the same function, the other half: the derived personal name is echoed verbatim while the home path beside it is named by class alone. The name is derived from the machine precisely so that no list of names lives in the repository, and the refusal then writes one into the record. RED 25/1, GREEN 26, restore proved by sha256.

```mutant
correction: the account name a refusal found is not republished by the refusal
file: tools/e2e/scripts/merge.mjs
spec: tools/e2e/tests/merge.spec.ts
body: a forbidden-spelling refusal names the file and the class and REDACTS the value, on every class it carries
message: and neither is the name
--- old
          `${rel}: this merge ADDS a line carrying the seat's own account or git name. A ` +
            "personal name reaches a tracked file by accident far more often than on purpose, " +
            "and this refusal does not repeat the one it found",
--- new
          `${rel}: this merge ADDS a line carrying the seat's own account or git name ` +
            `(${JSON.stringify(name)}). A personal name reaches a tracked file by accident far ` +
            "more often than on purpose",
```

#### CORRECTION 5 — a merge is what an APPROVED verdict authorises

Criterion 1 opens "on a card with an approved verdict" and nothing reads that condition. A card whose NEWEST verdict is REJECTED plans `drill:none` — "assigns no correction, so nothing is re-drilled", exit 0 — and the run walks on to write a message whose own subject begins `Merge T-900 (REJECTED at ...)`. The newest-verdict selection itself is correct and was attacked: an APPROVED entry older than a REJECTED one does not win. What is missing is only which answers authorise a merge, and the state is already computed for that subject line, so the check costs a comparison. RED 25/1, GREEN 26, restore proved by sha256.

```mutant
correction: a merge is what an APPROVED verdict authorises
file: tools/e2e/scripts/merge.mjs
spec: tools/e2e/tests/merge.spec.ts
body: a merge is what an APPROVED verdict authorises, so a REJECTED newest verdict refuses the drill
message: a REJECTED verdict is a refusal, not a clean drill
--- old
  if ("problem" in verdict) return refuse(verdict.problem);
  const state = verdictState(verdict.heading);
  if (!/^(?:APPROVED|ACCEPTED)/i.test(state)) {
    return refuse(
      `the newest verdict (${verdict.heading}) reads ${state}, which is not an approval. A merge ` +
        "is what an APPROVED verdict authorises, and the newest verdict is the one that counts",
    );
  }
  const read = readMutantBlocks(verdict.text);
--- new
  if ("problem" in verdict) return refuse(verdict.problem);
  const read = readMutantBlocks(verdict.text);
```

---

**Improvement ideas that are not failures** are filed as T-295-s4, T-295-s5 and T-295-s6, not folded into this verdict.

## Meters

- wall clock: 16:28Z to 17:01Z, 33 minutes end to end, read off the session's own timestamps rather than estimated. By phase, with the long runs detached and overlapped: the three sealed inputs and the standing read 8 min; the diff, the fence and the static attacks 11 min; the shared-clone fixtures and the four runtime reproductions 12 min, overlapping the suites; the four bodies, the five corrections and the RED-ALONE drill 13 min; the verdict, the cards and step 7 8 min. The range form ran 15 min detached from 16:30Z, inside the reading.
- context consumed: about 319,000 tokens of the 15,000,000 budget at dispatch.
- model: claude-opus-5@subagent, effort set at session start and never switched.
- suites run: the RANGE FORM through `gate-run.mjs` at 46c33c07..9331fbc8 (parser 389 / app 1171 / rust 655 / e2e 890, every leg exit 0 and GREEN, gate exit 0); `merge.spec.ts`, `cli.spec.ts` and `brief-flush.spec.ts` each alone by name; `tools/method-evals/run.mjs` (10 model-free evals, exit 0); and `merge.spec.ts` a further eleven times across the RED, GREEN and five RED-ALONE drill runs.
- bodies graded: 22 of the lane's own in `merge.spec.ts`, 48 in `cli.spec.ts`, 6 in `brief-flush.spec.ts`, plus the 4 this bench committed.
- mutants drilled: 5, each RED ALONE at 25 passed / 1 failed, each restore proved by sha256 `3e55542baef6b144`.
- fixtures: one `git clone --shared` under the scratch directory, its `main` its own; four end-to-end runs of the verb on it (the ritual, the widening control, the sibling-card conflict, and the card's own merge). The verb was never run against the host repository, the integration checkout, the lane or this bench.
