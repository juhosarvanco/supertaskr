---
id: T-215-s1
title: CONVENTIONS' limits paragraph is tracked BY HAND against `lane-fence.mjs`'s header, and nothing compares them — the branch spelling and the carve-out set are both compared, this is the third pair and the only uncompared one
feature: F-06
milestone: 4
priority: 2
size: S
status: verifying
blocked_by: []
touches: [tools/e2e/tests/lane-fence.spec.ts, docs/CONVENTIONS.md]
suggested_by: "executor claude-opus-5@subagent @T-215"
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
review: independent
---

**T-215's third acceptance criterion was a CONSIDER, and this card is the
answer it asked for.** `docs/CONVENTIONS.md`'s lane bullet publishes the
lane fence's limits; `.claude/hooks/lane-fence.mjs`'s header declares
them. The two are two copies of one fact with no comparison between
them, which is exactly the drift `T-215` was filed to repair by hand
after `T-199` moved the hook and left the page behind.

## Why it earns a card rather than a habit

**THE PATTERN IS ALREADY BUILT TWICE IN THE SAME SPEC FILE.**
`tools/e2e/tests/lane-fence.spec.ts:652` compares the hook's
`LANE_BRANCH_RE` against the spelling the document publishes, and `:1029`
compares `INTEGRATION_SEAT_PATHS` against the carve-out set the document
publishes. Both exist for the reason the hook's own header gives: this
file cannot parse a document on every keystroke, so the constant and the
page are COMPARED rather than trusted. The limits are the third pair and
the only one nobody checks.

**AND THE DIVERGENCE REDS NOTHING TODAY — MEASURED, NOT ASSUMED.**
Measured in the `T-215` lane at `e47bf86`: the whole set of eleven bodies
the DOCS GATE derives as readers of `docs/CONVENTIONS.md` was run against
a mutant paragraph carrying the exact falsehood `T-215` exists to delete
(*"a path OUTSIDE the writing checkout is allowed in BOTH seats … a
sibling lane's own tree … the last DELIBERATELY"*). **298 passed, exit
0.** The positive control run beside it — the same suite against a
one-word mutation of the carve-out sentence at line 1136, which body 1029
DOES read — reds by name: **1 failed / 52 passed, exit 1**, *"the hook's
carve-outs and the page's have drifted"*. So the reader family is live
and the paragraph is simply outside it.

## What the comparison would look like

**NOT A PROSE DIFF.** Both sides are prose, and a body asserting that two
paragraphs match reds on every re-wording — a gate this project would
learn to ignore, which is the objection `checkout-currency.mjs` already
records against its own sweep being a refusal.

**COMPARE THE DECLARED KEYS, THE WAY THE OTHER TWO PAIRS DO.** The hook's
header numbers its limits as `N. TITLE IN CAPS.` inside a
`── THE HONEST LIMITS` block, and `decide` names each declining limit with
a verdict CODE that is a string literal in the module — `not-a-repository`,
`not-judged-detached`, `not-judged-lane-list`, `no-path-to-judge`,
plus the refusing `unreadable-request`, `held-by-a-live-lane` and
`outside-the-fence`. Both are greppable literals, and the spec already
reads the hook's TEXT (`:542` does `readFileSync` on it and asserts a
header phrase), so no new export is needed and the fence is one file.

A body would then assert, naming both sides on a red:

1. the COUNT of numbered limits in the header equals the count the
   document's paragraph publishes (the paragraph numbers them `(1)`–`(8)`
   for exactly this reason), and
2. every declining CODE the hook can return appears in the lane bullet,
   so a limit the hook gains cannot land unpublished.

**AND IT NEEDS ITS OWN POSITIVE CONTROL**, per `docs/CONVENTIONS.md`'s
A NEGATIVE ASSERTION NEEDS A POSITIVE CONTROL: a fixture whose header
carries one more numbered limit than the page must red, or the body
passes against a page that publishes nothing.

## Acceptance criteria

- A body in `tools/e2e/tests/lane-fence.spec.ts` SHALL compare the count
  of numbered limits in `.claude/hooks/lane-fence.mjs`'s HONEST LIMITS
  header against the count `docs/CONVENTIONS.md`'s lane bullet publishes,
  and SHALL name both sides when they disagree.
- The body SHALL require every DECLINING verdict code the hook can return
  to appear in that bullet.
- A FIXTURE positive control SHALL prove the body reds when the header
  gains a limit the page does not carry.
- Verification: headless.

## TRIAGE, 2026-09-02 — promoted and dispatched, priority 2, at T-215's merge (c8f69aa)

The architect seat. The verifier measured that this card's second
criterion (every declining verdict code appearing in the bullet) cannot
be met inside a one-spec fence — the codes occur zero times in
CONVENTIONS — so the fence gains docs/CONVENTIONS.md, and the two
sibling corrections to the same paragraph ride this lane so the keeper
lands on a paragraph that is already true. Criteria: a body SHALL
compare the header's numbered-limit count and its declining verdict
codes against what the lane bullet publishes and red when either
drifts, with a positive control against a planted header; the
paragraph SHALL carry the codes; the two absorbed corrections SHALL be
made first and covered by the same keeper.

## Absorbs: T-215-s3 (2026-09-02)

The bullet publishes ONE fence layer and there are two: limit 1's
"stays protocol-covered" understates T-210's physical read-only layer.
The paragraph SHALL name both layers and what each catches.

## Absorbs: T-215-s5 (2026-09-02)

"The hook FAILS OPEN in exactly one shape" is false — checkout-currency
.spec.ts:387 measures ARM B, one fault (only the hook file absent) where
the published shape needs two. The paragraph SHALL state both shapes,
and the keeper SHALL read the count from the hook.

## Absorbs: T-219-s5 (2026-09-02, handed to this live lane at T-219-s3's merge f6e3924)

T-219-s3 removed `carveOutFor`'s own-card arm (no manifest the parser
produces ever selected it), and two documents this lane already holds
still describe it. Both halves of this hand-off are the dispatching
seat's: the card on main and the lane's copy carry this section.
The sites, verbatim from T-219-s5:

1. `tools/e2e/tests/lane-fence.spec.ts`, the comment block above the
   `ownCard` assertions in *the carve-outs each free a DIFFERENT write,
   and the fence still holds around them* (the paragraph opening "THE
   OWN-CARD WRITE IS STILL ALLOWED, AND IT NO LONGER TAKES THE
   CARVE-OUT"). It reads `carveOutFor`'s FIRST arm answers for a lane's
   own card file` in the present tense, and ends *"the arm is ROUTED as
   `T-219-s3` rather than touched here, and this assertion is what will
   red when it is fixed."* **The arm was removed rather than made
   reachable, so the assertion did NOT red** — it is now the permanent
   pin, which is what `T-219-s3`'s own card prescribes for that branch of
   the decision (*"IF the arm is removed THEN … its comment pointing here
   SHALL be updated"*). The assertion and its message are still correct
   and should stay; only the comment's tense and its promise move.

2. `tools/e2e/tests/lane-fence.spec.ts`, the comment on the
   `"missing the excluded field the carve-outs are read from"` case in *a
   manifest the hook cannot read is a refusal, never a shrug*. It says
   the lane-less arm *"can only do that from a manifest that carries the
   carve-out"*. `readManifest` still REQUIRES `excluded` and the
   assertion is unchanged, but the field is now a SHAPE check — a
   manifest missing it was written by a writer older than `T-154-s2` —
   and no arm reads it. The label string is part of the assertion's
   message rather than a bare comment, so this one is a two-line edit.

3. `docs/CONVENTIONS.md`, the `THE LANE PROTOCOL` bullet, sentence
   opening **THE CARVE-OUTS ARE CRITERIA AND NEVER THE HOOK'S
   JUDGEMENT**. It lists three: `docs/tasks/` as `alwaysWritable`, *"a
   card's own file is outside every fence (its `excluded`)"*, and this
   seat's standing writes. The middle clause's CLAIM is still true — a
   card's own file is outside every fence — but it is listed as a
   carve-out the hook applies, and the hook no longer has an arm for it.
   `expandFence` subtracts the file from `paths` at dispatch, so the
   write meets no reservation at all. **The regex the spec's *the
   carve-out set this hook holds is the one docs/CONVENTIONS.md
   publishes* body extracts (`never a lane's to veto — exactly (.*?), no
   more`) is in the THIRD clause and is untouched by this**, which is why
   nothing reds.

Criteria carried:

- Site 1's comment SHALL describe the arm in the past tense and name
  `T-219-s3` as where it was removed and why, replacing the promise that
  the assertion will red; the assertion and its message stay.
- Site 2's label SHALL say the field is required as a manifest SHAPE
  check rather than as a carve-out source.
- Site 3's sentence SHALL attribute the own-file carve-out to
  `expandFence` at dispatch rather than to the hook's criteria, without
  moving the published `docs/STATE.md`/`docs/checkpoints` clause the
  spec's regex reads.
- A BODY SHALL pin that `carveOutFor` answers a card file through the
  UNFENCEABLE arm and not through an own-file arm, discriminating on the
  returned `domain`/`why` rather than on a carve-out being returned at
  all — the paragraph above says why presence proves nothing — and it
  SHALL be demonstrated red against a re-added arm before the card
  closes.
- The three prose edits above SHALL leave every existing body green:
  `lane-fence.spec.ts` in full, and the CONVENTIONS comparison body by
  name.

## Implementation notes — 2026-09-02, executor claude-opus-5@subagent

Lane `/Users/ujju/Projects/nputer-T-215-s1`, branch
`task/T-215-s1-limits-paragraph-keeper`, base
`838e74b87628f50595b029841caf37527b55b73d`. Every figure below carries
the ref it was measured at; live-environment facts carry the time and
host instead.

### The paragraph, before and after

BEFORE, at `838e74b`, the whole of what the lane bullet published about
limit 1 and about failing open: *"(1) A Bash-mediated write — `sed -i`,
a `>` redirect, a checkout — reaches disk without an Edit or a Write and
stays protocol-covered."* … *"And the hook FAILS OPEN in exactly one
shape, the harness's own contract: a command hook whose script cannot be
LOCATED never starts, which takes `CLAUDE_PROJECT_DIR` unset AND a shell
cwd outside any checkout carrying the hook, both wrong at once."* The
four declining verdict codes occurred ZERO times in the document.

AFTER, at `43e7b5f`: limit 1 names BOTH layers and what each catches —
this hook judges an Edit including one into ANOTHER lane's tree, which
never enters this lane's diff; `T-210`'s physical layer leaves
out-of-fence tracked files read-only so a shell write takes `EACCES`
unparsed, but only on an OPEN, never a rename-over (the canonical
`sed -i`), a create, a delete or git, which also DISARMS the bit, and
that residue is the landing gate's half. Failing open is now TWO shapes:
the unlocatable script (two faults at once) and, on ONE fault, a
COMPLETE registration whose hook FILE is gone — node starts, exits 1
where blocking is 2, and the checkout looks configured
(`checkout-currency.spec.ts`, ARM B, `:387` at `838e74b`). Each of the
four declining codes is now published beside the limit it belongs to:
`not-a-repository` at (2), `not-judged-detached` at (3),
`not-judged-lane-list` at (4), `no-path-to-judge` at (8) — **(8), not
the (5) the hook's own header names at `:144`, which is `T-215-s2`'s
card and is not this fence's to fix.**

### The keeper

`tools/e2e/tests/lane-fence.spec.ts` gains two bodies and four readers,
placed beside the two comparisons of the same shape that already exist.
`headerLimitNumbers` slices the hook's LEADING BLOCK COMMENT, then the
`── THE HONEST LIMITS` block inside it, and matches only a limit's
opening line — a whole-file matcher reads the cost table at `:100`
(`38.4 → 41.4 ms`) as a ninth limit, and prose `limit N` gives sixteen
occurrences over five numbers. `declineCodesInSource` reads the frozen
`DECLINE_CODES` literal out of the same text and the subject body
asserts it EQUALS the imported constant, which is the authority; only
ONE of the four codes is written inside the HONEST LIMITS block, so
grepping the header for them would measure a different thing. The
comparison is a `limitsDrift(hookSource, bullet)` function returning
complaints that name BOTH sides, so the control runs the SAME code over
a planted file.

### Commands, in order, with the exit read from `$?`

At `838e74b` unless noted; ports `NPUTER_E2E_PORT=15215` in the lane and
`15216` in the drill worktree; 1420 was read once and never touched.

    app/ npm ci                                              0
    tools/e2e/ npm ci                                        0
    app/ npm run build                                       0
    docs-gate.mjs docs/CONVENTIONS.md (baseline)             1 = FIRES
    brief.mjs --task T-215-s1 --full (before)                0
    tools/e2e/ npm run typecheck                             0
    tools/e2e/ playwright lane-fence.spec.ts                 0   56 passed
    tools/e2e/ playwright reader family (10 specs)           0  316 passed
    git worktree add --detach <drill> b7628ab                0
    drill lib/parser npm ci / npm run build                  0 / 0
    drill tools/e2e npm ci; drill app npm ci                 0 / 0
    drill playwright lane-fence.spec.ts (baseline @72f1446)  0   56 passed
    drill M1 … M5 (five mutants, below)                      1 each
    drill M1 across the reader family                        1   1 failed / 315
    git worktree remove --force <drill>                      0
    docs-gate.mjs docs/CONVENTIONS.md                        1 = FIRES
    tools/e2e/ npm run lint:docs                             0   0 findings
    gate-run.mjs parser app        @72f1446                  0   GREEN/GREEN
    gate-run.mjs rust              @72f1446                  0   GREEN
    gate-run.mjs e2e               @72f1446                  1   RED, 2 named
    tools/e2e/ playwright session-economics.spec.ts          1   same 2, same cause
    git merge-tree --write-tree main HEAD                    0
    tools/e2e/ npm run capabilities:check                    1   STALE
    tools/e2e/ npm run typecheck (after T-219-s5's edits)    0
    tools/e2e/ playwright lane-fence.spec.ts                 0   56 passed
    docs-gate.mjs (T-215-s6 frontmatter)                     1 = FIRES, 0 issues
    gate-run.mjs parser app        @43e7b5f                  0   GREEN/GREEN
    gate-run.mjs rust              @43e7b5f                  0   GREEN
    gate-run.mjs e2e               @43e7b5f                  1   RED, 6 named
    git merge-tree --write-tree main HEAD (forecast)         0
    docs-gate.mjs <the forecast's paths>                     1 = FIRES, 4 suites
    cargo run -p nputer-index -- index --check --root ../..  0   CURRENT

### Figures, each with its ref

- limits paragraph, raw: **2,548 → 3,321 bytes**; whitespace-COLLAPSED,
  which is the form every reader of the bullet sees: **2,392 → 3,125**
  (`838e74b` → `43e7b5f`).
- THE LANE PROTOCOL bullet, collapsed: **9,224 → 10,076**, so **+852**
  reaches `brief.mjs --full` — 733 of it the limits paragraph and 119
  the `T-219-s5` site-3 reword.
- `docs/CONVENTIONS.md`: **119,470 → 120,370 bytes**; warn 146,878, so
  26,508 of headroom (`43e7b5f`).
- `brief.mjs --task T-215-s1 --full`: **68,011 of 65,536 bytes, OVER by
  2,475** BEFORE any diff existed, read 2026-09-02T04:57 on Mac.lan.
  **The buffer was already breached at the base**; this lane widens the
  breach by 852 and does not open it. It could not be re-measured after
  the fact: `--full` now REFUSES for the live-environment reason below.
- `docs/CAPABILITIES.md`: committed **48,201**, a fresh generation
  **48,363** (`43e7b5f`) — STALE by construction, two bodies added.
- suite bodies at `43e7b5f`: parser 363, app 1,135, rust 639, e2e 577.
- `index --check`: **CURRENT**, 200 files / 2,503 symbols / 2,391 edges,
  1,169,022 of 2,145,959 bytes (`43e7b5f`).

### The drill — five mutants, one side each, at a commit

Run in a DETACHED worktree cut from this lane's own `72f1446`, at
`/private/tmp/.../scratchpad/drill-T-215-s1`, removed afterwards. Every
mutation was READ BACK from `git diff` before its suite ran, and every
restore is `git restore --source=72f1446 --staged --worktree` with the
sha256 of `git show <commit>:<path>` against the disk.

| # | one side mutated | red | restoration sha256 |
|---|---|---|---|
| M1 | page: limit `(8)` renumbered `(9)` | the subject ALONE | `8d283586…aeef3` |
| M2 | page: the count word `eight` → `seven` | the subject ALONE | `8d283586…aeef3` |
| M3 | page: `not-judged-lane-list` WRAPPED across a line | the subject ALONE | `8d283586…aeef3` |
| M4 | hook: limit 4's number struck from the header | subject + control | `21e04654…1aeb5` |
| M5 | comparator: the declining-code loop emptied | the control ALONE | `4a076856…f17e97` |

**M3 is the mutant the coordinator's fourth fact asked for**, and it is
the failure this pair is likeliest to meet in life: `conventionsBullet`
collapses whitespace, so a code the document wrapped reads as
`not-judged- lane-list` and matches nothing. It reds, and the complaint
says so in as many words.

**KILL-SET CONTAINMENT.** M1/M2/M3 are in the subject's kill set and NOT
the control's; M5 is in the control's and NOT the subject's. Neither set
contains the other, so both bodies are load-bearing. That is what the
control's DELTA form buys: an earlier draft asserted the whole complaint
list and died beside the subject on every data mutant, which is the
containment defect, caught by running M1 rather than by reasoning.

**THE POSITIVE CONTROL, DEMONSTRATED FAILING.** The control is a FIXTURE
COPY of the hook written to scratch and read back through the same
`readFileSync` the subject uses — the arrangement DIFFERS, which is what
makes it a control. It was seen to red against a comparator lacking the
property (M5, and M4 through the header). Its first arm plants a ninth
limit; its second renames a declining code in the planted file's own
frozen set, which is why the source reader exists at all: a control
taking its code list from the live module could never see a rename.

**AIMED AT THE SITE THE PROPERTY LIVES, AND THE PROPERTY IS DATA.** M1
was additionally run across the whole eleven-spec reader family the DOCS
GATE derives for this document: **1 failed / 315 passed**, and the one
was this card's own subject body. The paragraph really was outside every
reader, which is the claim this card was filed on, now measured from the
other side.

### Standing gates, derived on the MERGE FORECAST

`git merge-tree --write-tree main HEAD` was run twice as main moved
under this lane. At main `f6e3924`, before the notes commit: exit **0**,
clean, tree `216fe4f`. At main `47c8845`, with the notes committed:
exit **1**, tree `72740bc`, and `git diff --name-only main <tree>` gives
the same FOUR paths either way — `docs/CONVENTIONS.md`,
`tools/e2e/tests/lane-fence.spec.ts`, `docs/tasks/T-215-s6-….md` and
this card — so the gate derivation below is the same on both.

**THE FORECAST CONFLICTS ON EXACTLY ONE PATH, THIS CARD, AND THE
CONFLICT IS DEGENERATE.** The dispatching seat wrote the
`## Absorbs: T-219-s5` section to main (`451fe19`) and into this
worktree; both sides therefore INSERT at the same end-of-file point, and
git refuses to prefer the longer insertion. In the forecast tree the
region reads `<<<<<<< main` / `=======` at lines 182-183 with **nothing
on main's side** and this lane's `## Implementation notes` on the other,
closing at 456. The resolution is to take this lane's side and delete
the three marker lines; the frontmatter's `status: verifying` merged
cleanly, and the other three paths merged cleanly. No content of main's
is discarded by that resolution — `git diff 43e7b5f:<card>
main:<card>` is EMPTY, so main's section and this lane's are the same
bytes.

- **DOCS GATE — FIRES.** `docs/CONVENTIONS.md` and `docs/tasks/` are
  both code inputs. The gate names FOUR suites: `cargo test` from
  app/src-tauri/, `npm test` from app/, `npm test` from tools/e2e/,
  `npx vitest run` from lib/parser/ — the whole battery, all four run.
- **GRAPH REGEN — FIRES** by its own trigger (`*.ts` outside docs/).
  The regeneration is a no-op at this tree: `index --check` answers
  CURRENT at `43e7b5f`, because `tools/` is `.nputerignore`d and this
  trigger is deliberately wider than the walk.
- **BOOT GATE — NOT OWED.** No `app/src/**`, no `app/src-tauri/**`,
  neither manifest.
- **METHOD EVAL GATE — NOT OWED.** No `method/**`.
- **CENSUS — OWED TO THE INTEGRATOR.** Two bodies added, so
  `npm run capabilities` is owed in the merge commit;
  `docs/CAPABILITIES.md` is 0444 in this lane (`T-210`) and outside this
  fence, which is
  what CONVENTIONS' own GRAPH REGEN bullet says a lane does about it.

### The six e2e reds, attributed BY NAME and not by count

`gate-run.mjs e2e` is RED at `43e7b5f`, **571 passed / 6 failed**, and
none of the six touches this diff.

Four are `guard-surface-behind`, the class `docs/STATE.md` names in that
word — `card-preflight.spec.ts:719`, `checkout-currency.spec.ts:852` and
`:953`, `lane-lock.spec.ts:899`. Each failure text says why: this
checkout is at `43e7b5f`, which does NOT contain `7129d90` — the newest
main commit touching `.claude/`, which is `T-219-s3`'s own lane commit,
merged into main AFTER this lane was cut. Measured: `7129d90` is an
ancestor of `main` (`yes`), of this lane's BASE `838e74b` (`no`) and of
this tip (`no`), so these four red at the base exactly as at the tip and
no diff of this lane's could move them. `T-238` moves them to a fixture
vantage.

Two are `session-economics.spec.ts:179` and `:365`, both refusing with
*"T-229-s6 holds a worktree on `refs/heads/task/T-229-s6-eval-fixture-
writable` and no live card declares that id"*. `T-229-s6`'s lane was cut
after this base, so its card does not exist in this tree at all
(`ls docs/tasks | grep -c T-229-s6` = **0** at `43e7b5f`). Re-run alone
once: the same two bodies, the same named cause. This is also why
`brief.mjs --full` cannot be re-measured from this lane.

The same run's disclosure names a second live-environment fact this lane
did not create and cannot fix: a lane `T-133` holds `touches: tools/e2e`,
a whole-directory fence that is not disjoint from this lane's
`tools/e2e/tests/lane-fence.spec.ts` — nor from `T-225-s1`'s or
`T-238`'s paths. Read 2026-09-02T06:0x on Mac.lan from
`git worktree list --porcelain`; it is the dispatcher's to rule on.

### T-219-s5, absorbed mid-lane — three met, one routed

Sites 1, 2 and 3 are made as the section above specifies; the assertion
and message at site 1 and the assertion at site 2 are untouched, and
site 3 leaves the third clause — the one the carve-out keeper's
`never a lane's to veto — exactly (.*?), no more` regex extracts —
character for character where it was. `lane-fence.spec.ts` is **56
passed** after them, the CONVENTIONS comparison body included by name,
and `laneSpellings` still derives all four spellings from the bullet.

The FOURTH criterion is **ROUTED as `T-215-s6`, not built, and the
reason is a BASE rather than a fence.** This lane was cut at `838e74b`,
which predates `T-219-s3`'s merge at `f6e3924`, so
`.claude/hooks/lane-fence.mjs` in this worktree still carries
`carveOutFor`'s own-card first arm — read at `43e7b5f`, the
`manifest.excluded` loop is still the function's first statement. A body
asserting the post-removal `domain`/`why` therefore REDS at this tip. The
spec file is inside this fence; the base is not a lane's to move
(`method/lane-protocol.md` rule 2), and handing off a red lane to buy a
green body is not a trade this project makes. `T-215-s6` carries the
discriminator, the reason presence proves nothing, and the control.

### Where the brief was wrong

1. **The dispatch brief's row 4 base commit** reads
   `6cc38909ab24c9c5c06b4e23a0fa11424662a038`; this worktree's HEAD at
   dispatch was `838e74b87628f50595b029841caf37527b55b73d`. The
   worktree is the truth, as the dispatch message itself says
   (`T-233`'s known defect).
2. **The dispatch message cites `lane-fence.spec.ts:1029` for the
   carve-out sentence.** At `838e74b` that line is a comment inside a
   different body; the carve-out keeper opens at `:1073` and its
   `exec` of `never a lane's to veto — exactly (.*?), no more` is at
   `:1079`. The capture is intact and untouched — CONVENTIONS' own
   A CITATION NAMES A SYMBOL, NOT A LINE is why the symbol was searched
   for rather than the line trusted.
3. **The dispatch message says `brief.mjs --full` "sits near the
   65,536-byte buffer".** It was already OVER it by 2,475 bytes before
   any diff existed. The instruction to keep the paragraph at or under
   its current length could NOT be met: the card's three additions —
   both fence layers, both fail-open shapes, and four codes the document
   carried zero times — are ~830 bytes of new obligation against a
   2,548-byte paragraph, and the only way to hold the count was to
   delete true content, which `docs/STATE.md` forbids in as many words
   (*"a hazard is never deleted to fit"*). What WAS done instead: every
   measured instance moved to its citation (`method/lane-protocol.md`
   rule 5 and `T-210` for the physical layer's four measurements,
   `checkout-currency.spec.ts` ARM B for the second fail-open shape),
   and roughly 250 bytes of the pre-existing text were compressed —
   `WRITTEN DOWN BECAUSE`, `THE RESIDUE, NAMED AS ONE`, and the merge of
   the fail-open sentence with the DISPATCHING CHECKOUT paragraph, which
   were one topic told twice. The residue is +852 on the bullet,
   disclosed rather than absorbed. `T-225-s2` owns the buffer class.
4. **The coordinator's third fact corrected this build mid-flight** and
   the repository agrees with it: only `no-path-to-judge` is written
   inside the HONEST LIMITS block, so an earlier draft's header-grep for
   the four codes was checking the wrong thing. The authority is the
   exported frozen `DECLINE_CODES`, and the text reader that makes the
   planted control possible is asserted equal to it rather than trusted.

## VERDICT — APPROVED, 2026-09-02, verifier claude-opus-5@subagent

Judged at tip `8debbfededf2f4ab534ee37f7ad151b8edbf4abd`, base
`838e74b87628f50595b029841caf37527b55b73d`, in the bench
`/Users/ujju/Projects/nputer-V-T-215-s1`. Nothing was written in the
lane.

**THE BLINDNESS WAS CLOCK-SHAPED FOR THE DIFF AND DISCIPLINE-SHAPED FOR
THE LANE, AND THE LINE IS STAMPED.** Phase 1 reached this seat before
the work existed. The attack set and a measured ground truth were
sealed BEFORE the branch was fetched:

    attack-V-T-215-s1.md  f25cd38bf2bb56e037983105dd1302fa22978bea97ef45f7c0576ec8f7454870
    ground-V-T-215-s1.md  d8300efbbe92925631f0fea4495463371c072158b25eb76bc678efeb2ed64444
    stamps-V-T-215-s1.txt be2f68a587d5fb9fca33d0a14e85eac8dcd346f254cbef64dc36ac11e6130722
    sealed 2026-09-02T05:18:02Z

The executor's report reached this seat only in the phase-2 dispatch,
AFTER that seal, and every figure it carried was re-measured here rather
than taken as read. The lane's worktree and branch existed on this
machine throughout phase 1 and were left unopened by hand — that half
was discipline, not the clock, and a later reader cannot verify it from
the artefacts.

### The criteria, each attacked literally

**AC1 — the count, naming both sides.** Met. `headerLimitNumbers`
slices the hook's LEADING BLOCK COMMENT (`indexOf("\n */")`, ending at
line 238), then from `── THE HONEST LIMITS`, then matches
`^ \* (\d+)\. `. Measured here: declared `[1..8]`, published `[1..8]`,
count word `"eight"`. **The `:100` decoy was the pre-committed trap and
the keeper is immune to it twice over**: deleting that line
(`* 38.4 → 41.4 ms (refusal)`) does not move the answer, while the
loose whole-file matcher this body could have used answers **9**. The
comparison is SEQUENCE equality, not a count, so a re-ordering reds too,
and a third check compares the paragraph's count word against
`declared.length`. Both sides are named on a red — verified, not read:
M-C below prints *"the header numbers its limits 1/2/3/4/5/6/7/8/9 and
the lane bullet publishes 1/2/3/4/5/6/7/8"*.

**AC2 — every declining code in the bullet.** Met. All four are
published beside the limit each belongs to and all four survive the
whitespace collapse. `DECLINE_CODES` is the authority (already imported,
not re-typed), bound by assertion to a source-text reader that exists so
the control can read a PLANTED file. Correctly scoped to the four
DECLINING codes: the widening this seat pre-committed to check would
have scored `mid-integration` present on a prose accident at line 1168,
and no such widening was made.

**AC3 — the fixture positive control.** Met, and it is a real control:
it writes a COPY of the hook to a fresh `mkdtemp` scratch dir, reads it
back through the same `readFileSync`, and drives the SAME `limitsDrift`
function the subject drives. The arrangement that decides the control
(a planted file) is not the arrangement that decides the subject (the
live hook), which is the defect class `verifier.md` 2b says this method
produces most.

**The two absorbed corrections, made first.** Met and TRUE. The
fence-layer sentence matches its keeper clause for clause —
`lane-lock.spec.ts:418` uses the same word, *"`sed -i` is the canonical
instance"*, and holds that the rename succeeds because the PARENT
DIRECTORY is deliberately left writable; `:558` holds that the layer
arms lanes and nothing else, which is why *"TWO LAYERS FENCE A LANE"* is
correctly scoped; `:667` and `T-210-s1` hold the disarming the sentence
names. The fail-open sentence states both shapes and cites
`checkout-currency.spec.ts` ARM B by name rather than claiming a
first-hand measurement of this hook — the relayed-fact trap this seat
pre-committed to check.

**The hook's own `:144` error was NOT propagated.** The header calls
`no-path-to-judge` *"limit 5"* where the numbered block puts it at 8.
The page places it at **(8)** and the card routes the header-side repair
elsewhere. This seat pre-committed to rejecting if that error were
copied into the document; it was not.

### The drill — kill-set containment, both ways, run here

| mutant | site | subject | control |
|---|---|---|---|
| M-A pre-`T-215` paragraph replanted | doc | **RED** (7 complaints) | red |
| M-B a code WRAPPED across two lines | **doc (data)** | **RED alone** | green |
| M-C live hook gains a 9th limit | hook | **RED alone** | green |
| M-D a code renamed in the page only | doc | **RED alone** | green |
| M-E `limitsDrift` loses its number comparison | spec | green | **RED alone** |
| M-F `limitsDrift` loses its code loop | spec | green | **RED alone** |

**Neither kill set contains the other**, so both bodies are
load-bearing rather than one restating the other. M-B is a **DATA
mutant**, which 2b requires where the property lives in data, and it is
the failure this seat pre-committed as most likely: a hyphenated code
reflowed across a 70-column line collapses to `not-judged- lane-list`
and matches nothing. It reds, and the complaint text names the cause.

**AND THE CONTROL WAS SHOWN TO FAIL BEFORE IT WAS TRUSTED TO PASS.**
M-E and M-F damage the comparison the control guards; the control reds
alone in both while the subject stays green. That demonstration is 2b's
requirement of whoever grades a control, and it is run above rather than
asserted.

M-A additionally answers the card's own premise: the paragraph `T-215`
repaired by hand carries none of the four codes, no numbered items and
no count word, so the keeper reds seven ways on the exact drift that
reddened nothing before this card.

Restoration proved by sha256 at every step; the tree is clean
(`git status --porcelain` empty) and the planted headers never left
`mkdtemp`.

### Gates, all run at `8debbfe` in this bench

The docs gate was asked with the WHOLE changed-path set — the two new
card files pull in two suites that `docs/CONVENTIONS.md` alone does not
owe, which is easy to miss on a card that looks like prose and a test.
It FIRES and owes four suites; all four were run.

| gate | result |
|---|---|
| `cargo test` from `app/src-tauri/` | **635 passed, 0 failed, 4 ignored, exit 0** |
| `npx vitest run` from `lib/parser/` | **363 passed, exit 0** |
| `npm test` from `app/` | **1135 passed, exit 0** |
| `npm test` from `tools/e2e/` | **571 passed, 6 failed, exit 1** — every red attributed below |
| `lane-fence.spec.ts` alone | 56 passed, exit 0 |
| `index --check` | **CURRENT, exit 0** |
| `capabilities:check` | **STALE, 48201 → 48363, exit 1 — CORRECT** |
| docs-gate reader derivation | unchanged: 28 readers, 11 for CONVENTIONS, this spec still `(call conventionsText())` |
| `laneSpellings` | all four labels still resolve to exactly one |
| byte budget | CONVENTIONS 120,370 of warn 146,878 — holds |

**THE SIX e2e REDS ARE NOT THIS LANE'S, ATTRIBUTED BY NAME AT THE BASE
RATHER THAN BY COUNT.** The same six bodies — `card-preflight:719`,
`checkout-currency:852`, `checkout-currency:953`, `lane-lock:899`,
`session-economics:179`, `session-economics:365` — were re-run at
`838e74b`, where this diff does not exist, and **all six red there
too**. They are the `guard-surface-behind` family plus the machine's
newer lane cuts, exactly as `docs/STATE.md` warns.

The STALE census is correct and must not be repaired here:
`docs/CONVENTIONS.md`'s own rule makes regeneration the INTEGRATOR's, in
the merge commit, and `docs/CAPABILITIES.md` is absent from the diff.

**Fence**: `docs/CONVENTIONS.md`, `tools/e2e/tests/lane-fence.spec.ts`
and two files under the unfenceable `docs/tasks/`. Nothing out of fence
— in particular the hook, `lane-lock.mjs` and `docs/CAPABILITIES.md` are
untouched.

**Security sweep**: no new import, dependency, subprocess, `chmod` or
environment read. The planted headers are written under `mkdtemp` and
read as TEXT — never imported — so a generated `.mjs` is never executed,
and the live `.claude/hooks/lane-fence.mjs` is never edited in place.
Nothing to report.

### Two corrections to the record

1. **`--full` COULD be re-measured, and the lane did not grow it.** The
   handoff says the assembler refuses on `T-229-s6`'s undeclared
   worktree. It prints that FOUND block and then renders the brief
   anyway, margin included: **67,632 of 65,536 bytes, OVER by 2,096** at
   `8debbfe`, against **68,301, OVER by 2,765** measured at `838e74b`
   in phase 1. The brief SHRANK by 669 bytes despite the bullet growing
   852. The ceiling was already breached at the base; this lane moved it
   the safe way.
2. **A prediction of this seat's measured FALSE.** Phase 1 pre-committed
   that editing the spec would make `index --check` STALE and that a
   stale graph would therefore be correct at the tip. It stayed CURRENT
   with byte-identical figures — `tools/e2e/tests/` is not in the
   indexed set. Recorded because a pre-commitment that is quietly
   dropped is worth nothing.

### Residues — disclosed, none blocking

1. **The corrections' PROSE is not itself compared.** The keeper pins
   the numbering, the count word and the four codes. Reverting the
   two-layers sentence or the fail-open sentence would NOT red. That is
   the card's own deliberate trade — it argues at length against a prose
   diff — but *"covered by the same keeper"* means the corrections land
   inside the paragraph the keeper anchors on, not that every clause is
   pinned. The clauses about `T-210`'s layer are held by
   `lane-lock.spec.ts` instead, which is the right home for them.
2. **"IT FAILS OPEN IN TWO SHAPES" is still a count claim.** The general
   rule is that ANY exit that is not 2 fails open — an absent file, a
   throw at import, a missing `node`. Two shapes are MEASURED; the class
   is open, and a third will stale *"two"* the way it staled *"one"*.
   The sentence does expose the mechanism (*"exits 1 where blocking is
   2"*), so the class is derivable by a reader, which is why this is a
   residue and not a defect.
3. **A merge-order dependency.** Sites 1 and 2 describe `carveOutFor`'s
   own-file arm in the past tense, and at THIS tip the hook still
   carries that arm — `838e74b` predates `T-219-s3`'s merge `f6e3924`.
   The comments are true of the MERGED tree and transiently false on the
   branch. They come true at the merge, and main already carries
   `T-219-s3`; this branch must not be landed on a base that lacks it.
   The assertion beside them passes in both worlds, which is why nothing
   reds either way — and `T-219-s5`'s fourth criterion was correctly
   ROUTED as `T-215-s6` rather than built, because a body discriminating
   on the arm cannot be demonstrated red against a tree that still has
   it.

### Verdict

**APPROVED.** All three acceptance criteria are met literally, the two
absorbed corrections are true and traceable to live keepers, the
positive control was demonstrated to FAIL before it was trusted to pass,
and the two kill sets are disjoint in both directions with a data mutant
separating them. The third copy is now compared.
