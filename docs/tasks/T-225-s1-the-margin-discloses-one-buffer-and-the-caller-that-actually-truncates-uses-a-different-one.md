---
id: T-225-s1
title: The margin discloses ONE pipe buffer, and the caller that actually truncates uses a different number — `spawnSync`'s `maxBuffer` is 1 MiB by default and truncates with an `ENOBUFS` error nobody reads
feature: F-06
milestone: 4
priority: 3
size: S
status: done
blocked_by: []
touches: [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts]
suggested_by: executor claude-opus-5@subagent @T-225
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
verified_by: claude-opus-5@subagent
review: independent
---

**FOUND WHILE BUILDING T-225's DECISION 3, AND DELIBERATELY NOT BUILT
THERE.** That card's criterion is *"WHERE the brief approaches its
boundary it SHALL DISCLOSE the margin in its own output, the way the
graph budget already does"*, and one reference point is what the graph
budget discloses. A second reference is a design change to the
disclosure, not a completion of it.

**THE FACT.** `PIPE_BUFFER_BYTES` in `tools/e2e/scripts/dispatch-brief.mjs`
is 65,536 — one pipe buffer on this platform, and the FLOOR both readers
`tests/brief-flush.spec.ts` derives against share. It is the number
T-225's card is written around. **It is not the number that truncates a
`spawnSync` caller**: node's `spawnSync` defaults `maxBuffer` to 1 MiB
and, past it, returns the output TRUNCATED with an `error` field set to
`ENOBUFS` — a field most callers never read, at a status that looks
ordinary. So the two ceilings a caller can meet are an order of magnitude
apart and the disclosure names only the nearer one.

**WHY THIS IS WORTH A CARD RATHER THAN A COMMENT.** `--dispatch` at
T-225's own ref printed 85,818 bytes unfiltered, which is 131% of one
pipe buffer and 8% of the `spawnSync` ceiling. The filter T-225 landed
puts it near 30,000. **The next ceiling anybody meets on this command is
therefore the 1 MiB one**, and when they do, the disclosure will say
"UNDER" in large friendly letters.

**WHAT A FIX WOULD DECIDE.** Whether `marginRecs` takes a SET of named
reference points rather than one buffer — each with the caller it
belongs to, the way `brief-flush.spec.ts` already labels its derived
loss point with the reader it was measured against. That spec's own
sentence is the precedent: *"This is ONE reader's answer, never THE
boundary."* The disclosure currently makes the opposite implicit claim by
naming one number.

## CORROBORATION 2026-09-02 — verifier claude-opus-5@subagent @V-225, measured at `b5d015b`

This card says the disclosure names the wrong NUMBER. It also names the
wrong FAILURE, and that half is printed to every dispatcher who crosses
the line. The OVER arm emits, verbatim:

    output: 102752 of 65536 bytes (156.8%) - OVER by 37216: past one buffer the
    tail arrives only while the reader drains, and a caller collecting into a
    fixed buffer of that size receives a prefix with no error

Measured against the reader this repository actually uses —
`spawnSync(node, [brief.mjs, "--dispatch", "--full"], { maxBuffer: 65536 })`:

    stdout        102,752 bytes — the WHOLE answer, not a prefix
    status        null
    signal        SIGTERM
    error.code    ENOBUFS

So for that caller the clause is wrong in both of its claims: nothing is
truncated to a prefix, and the error is loud rather than absent. The
same command at Node's DEFAULT `maxBuffer` (1 MiB) returns all 102,752
bytes with `error: none` and `status: 0`.

The clause is true of a POSIX caller doing one `read()` into a 64 KiB
buffer, and that reading is defensible — but it is unqualified, in a
tool whose contract is that a figure never leaves it detached from its
source, and the repository's own named reader contradicts it. Whatever
this card does about the number, the sentence should either name the
caller it is true of or say what `spawnSync` actually does.

Independently derived: the ENOBUFS behaviour is in this verifier's
phase-1 ground truth, stamped at the base ref `5f193e6` as
`709f2046ab0f25f188a5425e86df8e6e6817ee67e96edfe6efa06ae12cbc08d3`
before this lane's first commit existed.

## TRIAGE, 2026-09-02 — promoted to `planned`, priority 3

The architect seat, at the stamp of T-225's merge (7435eae). The OVER
arm's sentence is false against `spawnSync` (the verifier's V-225
corroboration: `maxBuffer: 65536` returns the whole 102,752 bytes with
`ENOBUFS` and `SIGTERM`), and the executor concurred while correctly
declining to fix a producer in a pass scoped to F1. Criterion: the
margin's OVER arm SHALL describe what each named caller actually does
past the line, measured, and a body SHALL red when the sentence and the
measurement disagree. Fence is free now that T-225 has merged; T-239
serialises behind this card on dispatch-brief.mjs.

## Absorbs: T-225-s3 (2026-09-02)

`withMargin`'s UNSETTLED fallback is a branch no body drives. The same
file, the same block: the lane SHALL drive it with a planted
non-converging total and show the labelled honest answer printed, and
SHALL say whether the fixed point can fail to converge at any real
width or only at a planted one.


## Implementation notes — 2026-09-02, executor claude-opus-5@subagent

Lane `/Users/ujju/Projects/nputer-T-225-s1`, branch
`task/T-225-s1-margin-over-arm-measured`, cut at the dispatch stamp
`fb2a944078142f3a8acc809e5b28be5ac8ce5255`. Code commit `33f47ec`. Fence
held exactly — `tools/e2e/scripts/dispatch-brief.mjs` and
`tools/e2e/tests/brief.spec.ts`, plus this card and three routed
suggestions under the always-writable `docs/tasks/`.

### THE SENTENCE, BEFORE AND AFTER

Before, the whole of the OVER arm's second half, one line, naming nobody:

    past one buffer the tail arrives only while the reader drains, and a
    caller collecting into a fixed buffer of that size receives a prefix
    with no error

**IT IS TRUE.** Measured at `33f47ec`, `--dispatch --full` piped into
`dd bs=65536 count=1` delivers exactly 65,536 bytes — a prefix — and the
reader is told nothing. What the sentence never did was say *of whom*,
and the repository's own reader does the opposite thing: `spawnSync` past
its `maxBuffer` is KILLED. A figure detached from its source is the
defect this module exists against; a CONSEQUENCE detached from the caller
it belongs to is that defect one level up, and worse, because the reader
cannot tell which of the two claims was meant for them.

After, the arm is one stamped line per named caller, plus a `buffer:`
line in BOTH arms saying which reader the figure is the floor for. The
rendered text is not transcribed here — `brief.spec.ts`'s OVER-arm body
is its keeper, and a note restating it would be a second implementation.

### WHAT EACH NAMED CALLER ACTUALLY DOES PAST THE LINE — MEASURED

All at `33f47ec` on `Mac.lan`, node v22.22.0, macOS arm64, against this
command's own `--dispatch --full` answer. Its size is LIVE and moved
three times while this lane ran (115,248 → 119,809 → 134,497 bytes as
sibling lanes opened); the run recorded here is the 134,497-byte one.

| caller | bytes received | status | signal | error.code |
|---|---|---|---|---|
| pipe reader that keeps reading (4 KiB every 5 ms) | 134,497 — all of it | writer 0 | — | none |
| one fixed read, `dd bs=65536 count=1` | 65,536 — a PREFIX | reader 0 | — | none |
| `spawnSync`, `maxBuffer` 134,496 (smallest it crosses) | 134,497 | null | SIGTERM | ENOBUFS |
| `spawnSync`, `maxBuffer` 1,024 (crosses by a mile) | 65,536 | null | SIGTERM | ENOBUFS |
| `spawnSync`, `maxBuffer` 65,536 (the disclosed figure) | 119,809 | null | SIGTERM | ENOBUFS |
| `spawnSync`, node's 1,048,576-byte default | 134,497 | 0 | null | none |

**THE BYTE COUNT OF A KILLED CHILD IS A RACE AND IS ASSERTED NOWHERE.**
The same limit hands back the whole answer against a fast producer and a
part-way kill against a slow one, because what comes back is quantised to
node's own reads rather than to the caller's number: 65,536 at
`maxBuffer` 1,024 and the whole answer at `maxBuffer` 65,536, in one run.
So the arm claims `status`, `signal`, `error.code` and that the stdout
**OVERRUNS** the limit — `>` is the property, and the body asserts only
that. An equality would be a flake wearing a measurement; the dispatching
seat's bench measured a slow producer killed at 73,728 bytes, neither the
whole answer nor the limit, which is the same point from the other side.

**AND THE WRITER'S OWN EXIT BEHIND THE ONE-READ READER IS ALSO A RACE.**
Six hand runs and the dispatching bench read 0; this card's own body read
**1** on its first loaded run, and **1** again on the drill bench's
baseline. Whether the `EPIPE` from the closed pipe reaches node before the
process ends is timing. The claim was in the sentence and in the needle,
and both were removed: what the arm says about that caller is the
READER's side, which is stable and is the half the retired clause got
right. Routed as `T-225-s6`.

### THE ABSORBED T-225-s3 — REAL WIDTH OR PLANTED?

**REAL, and there are exactly four of them.** Driving the real
`withMargin` over every body width 1..200,000 at `33f47ec` finds **4**
non-converging widths — **54,394 / 63,395 / 64,296 / 64,386** — each a
period-2 cycle at a digit boundary of `left`: the block loses one byte as
the declared total gains one, so the iteration flips between two totals
forever and the bounded loop falls through. The mechanism is the UNDER
arm's alone. `left` is the only field that SHRINKS as the body grows;
over the line the total, the percentage and `OVER by` all grow together,
so the OVER arm cannot oscillate at all.

**THE WIDTHS ARE A FUNCTION OF THIS BLOCK'S OWN PROSE AND MUST NEVER BE
PINNED.** The dispatching seat measured the same four cycles at `fb2a944`
at **55,193 / 64,194 / 65,095 / 65,185** — the same four boundaries,
moved by exactly the bytes this card added to the block. So the body
DERIVES them at run time from the boundaries themselves, drives all four,
and carries a coverage floor: every boundary where the block loses a byte
must produce a cycle. A prose change moves the count with it instead of
quietly covering fewer widths. Its control is the neighbours — one byte
either side of each width, the same function settles.

**AND IT IS REACHABLE RATHER THAN THEORETICAL.** `brief-flush.spec.ts`'s
live `--task T-133 --state` arm rendered 65,917 bytes on the dispatching
bench, a few hundred bytes from one of those cycles. The fallback prints
the DERIVATION's own size — exact — labelled as such, and the body pins
both halves: the figure, and that the block is NOT the size it names.

### POISON DRILL — 10 mutants, 10 kills, at `33f47ec`

In a DETACHED worktree at `/private/tmp/nd-T-225-s1` cut from `33f47ec`,
installed in fresh-clone order, removed afterwards. Baseline there: 39
passed, exit 0. Every mutant moves the PRODUCER
(`tools/e2e/scripts/dispatch-brief.mjs`) and never an assertion; each was
read back with `git diff` before its run — one line changed, one side —
and each restored with
`git restore --source=33f47ec --staged --worktree` proved by sha256.

| mutant | what moved | suite | failing bodies |
|---|---|---|---|
| M1 | `signal SIGTERM` → `SIGKILL` | 1 failed / 38 passed | OVER arm |
| M2 | `error.code ENOBUFS` → `EPIPE` | 1 / 38 | OVER arm |
| M3 | `OVERRUNS that ` → `stops at that ` | 1 / 38 | OVER arm |
| M4 | `status null` → `status 0` | 1 / 38 | OVER arm |
| M5 | the default-`maxBuffer` line's key | 1 / 38 | OVER arm |
| M6 | the `buffer:` line's owner clause | 2 / 37 | live-output + BOTH arms |
| M7 | the fallback returns `whole: true` | 1 / 38 | UNSETTLED |
| M8 | the fallback discloses `total`, not `bodyBytes` | 1 / 38 | UNSETTLED |
| M9 | the pipe reader's claim inverted | 1 / 38 | OVER arm |
| M10 | the one-read reader's `NO error` clause | 1 / 38 | OVER arm |

Restoration proof, after all ten:
`git show 33f47ec:tools/e2e/scripts/dispatch-brief.mjs | shasum -a 256` =
`baba8c0cba5f4e04ac722234a489cf8be97c2c4292ed7b169c68d6619921fa43`, equal
to the worktree file's; `tools/e2e/tests/brief.spec.ts` untouched
throughout, both sides
`32c1d1d7fc065d69c2747fd1dc6a6997e147bdda66a4009933e53439c3967a5f`. The
worktree's tracked status was clean before removal.

**KILL-SET CONTAINMENT.** Nine of the ten kill exactly ONE body. M6 kills
TWO, and they are not duplicates: one asserts the module's rendered arms,
the other asserts what the LIVE command prints, and a producer can pass
the first while `brief.mjs` stops emitting the block at all. No mutant of
this card's own subject is killed ONLY by a body that predates it.

**THE SAME TEN WERE RUN ONCE BEFORE, AT AN EARLIER TIP** (`482be56`,
before the three absence assertions below were narrowed), with identical
kill sets. The lane's history was rewritten to put the narrowing in the
code commit where it belonged, and the drill re-run at the real tip
rather than reported from the older one.

**AND THE POSITIVE CONTROL FOR THE TEXT IS IN-RUN, BECAUSE THE PROPERTY
IS TEXT.** The OVER-arm body runs its checker a second time against the
retired clause above, planted verbatim, and requires disagreements: it
reported **7** against this run's measurements, including the missing
`error.code ENOBUFS` and the default-`maxBuffer` caller the old arm named
nowhere. Without it a green says *"the readers could not disagree"*
exactly as loudly as it says *"the sentence is true"*.

### A FIX NAMES ITS CLASS AND ITS SWEEP

**Class:** an absence assertion whose haystack is a whole rendered block
and whose needle is a short phrase other prose can supply — SHAPE EIGHT
from the other end. Found because `expect(under).not.toContain("per ")`
went red on the words *"per run"* inside this card's new `buffer:` line,
reporting a density line that does not exist. **Sweep:**
`grep -n "not\.toContain\|not\.toMatch" tools/e2e/tests/brief.spec.ts` at
`33f47ec` — **29** hits, shown able to answer non-zero. **THREE are in
that shape**, all three in the margin bodies (`"per "`, `"OVER by"`,
`" left"`), and all three are now narrowed to the LINE the property lives
on. The other 26 use ids, paths or whole sentences as needles.

### COMMANDS, IN ORDER, EACH READ FROM `$?` UNPIPED

Setup: `npm ci` from `tools/e2e/` **0**; `npm ci` from `app/` **0**
(`lib/parser` was installed and built in this lane before dispatch —
`dist/` verified present); later `npm run build` from `app/` **0**.

Measurement: `brief.mjs --dispatch` **0**; `brief.mjs --dispatch --full`
**0**; three scratch measurement scripts **0**, **0**, **0** — five
`maxBuffer` ceilings x three runs, the `dd` pipeline x three runs, and
the 1..200,000 width sweep.

Bodies: `npm run typecheck` from `tools/e2e/` **0** (x4);
`npx playwright test tests/brief.spec.ts` **1** (the `"per "` sweep
finding), **1** (the writer-exit race), then **0**, **0**, **0** — 39
passed each time.

Drill: `git worktree add --detach /private/tmp/nd-T-225-s1 33f47ec` **0**;
parser `npm ci` + `npm run build` **0**; app `npm ci` **0**; e2e `npm ci`
**0**; drill baseline **0** (39 passed); ten mutant runs **1** each, by
construction; `git worktree remove --force` **0**.

Battery, from the lane root at `33f47ec`, reading COUNTS:
`node tools/e2e/scripts/gate-run.mjs parser` **0** — 363 bodies, GREEN;
`… app` **0** — 1135 bodies, GREEN; `… rust` **0** — 639 bodies, GREEN;
`… e2e` **1** — 577 bodies, RED, attributed below. The same four legs ran
GREEN across the board at the earlier tip `482be56` (363 / 1135 / 639 /
577), including e2e; what changed between the two runs is the HOST, not
the diff.

Gates: `git merge-tree --write-tree main HEAD` **0**;
`cargo run -q -p nputer-index -- index --check --root ../..` **0**;
`docs-gate.mjs` on the forecast's two code paths **0**, on the three the
notes commit makes **1**; `npm run capabilities:check` **1** (STALE,
expected); `npm run lint:tokens` **0**.

### THE E2E RED, ATTRIBUTED BY NAME AND BY MEASUREMENT AT THE BASE

Six bodies, none of them in this lane's fence and none of them in
`brief.spec.ts` (571 passed):

    card-preflight.spec.ts:719     a discrepancy answers ONE …
    checkout-currency.spec.ts:852  THE WIRING'S POSITIVE CONTROL …
    checkout-currency.spec.ts:953  THE SWEEP AT ARM TIME …
    lane-lock.spec.ts:899          the DISPATCH STEP arms it …
    session-economics.spec.ts:179  the recommended seat is a function …
    session-economics.spec.ts:365  the advisory line is NOT a contract row …

**MEASURED AT THE BASE, NOT ARGUED.** A detached bench at `fb2a944`
(`/private/tmp/nd-base-T-225-s1`, installed in fresh-clone order, removed
after) ran those four spec files: **6 failed / 86 passed**, the SAME six
by name. The same four files in this lane at `33f47ec`: **6 failed / 86
passed**, the same six. The diff is absent on one side and present on the
other and the answer does not move.

Both are the classes docs/STATE.md already names. Four of them say
`STALE [guard-surface-behind]` — the judged checkout is at `fb2a944`,
which does not contain `ed6474e`, the newest main commit touching
`.claude`, and is **27** commits behind main; a lane cut before a guard
merges reds on its own guard surface, and `T-238` moves them to a fixture
vantage. The two `session-economics` bodies say
*"T-215-s6 holds a worktree … and no live card declares that id"* — a
SIBLING lane cut AFTER this lane's base, whose card does not exist in
this lane's tree. That is the ref-skew STATE.md records under *amend
every card of a wave before the first stamp*.

**AND THE LIVE BOARD MOVED UNDER THIS LANE WHILE IT RAN**, which is the
same fact from a third side: `--dispatch --full` went 115,248 → 119,809 →
134,497 bytes, `main` advanced from `fb2a944` to `34f4db2`, and the lane
list turned over two of five entries. Every figure here that depends on
the host carries the time it was read.

### STANDING GATES, DERIVED ON THE MERGE FORECAST

`TREE=$(git merge-tree --write-tree main HEAD)` exits **0** (read first)
against `main` at `34f4db2`; `git diff --name-only main $TREE` returns
**2** paths — `tools/e2e/scripts/dispatch-brief.mjs` and
`tools/e2e/tests/brief.spec.ts` — and **6** once this notes commit adds
this card and the three suggestions.

- **GRAPH REGEN — FIRES** on `brief.spec.ts` (`*.ts` outside `docs/`);
  `.mjs` is not in the trigger's suffix list at all. The gate was ASKED
  rather than predicted: `index --check` answers **CURRENT** at exit 0
  (1,169,022 bytes, 200 files, 2,503 symbols, 2,391 edges) — the no-op
  this trigger's own bullet says a `tools/**` diff must be, since
  `tools/` is `.nputerignore`d. Nothing to regenerate.
- **BOOT GATE — NOT OWED** on all 6 paths: none under `app/src/**`,
  `app/src-tauri/**`, or either manifest.
- **DOCS GATE — FIRES**, on the card paths only, and only once this notes
  commit lands: the gate answers **0** on the code diff's 2 paths and
  **1** on the set including them, owing `npm test` from `app/`,
  `npm test` from `tools/e2e/` and `npx vitest run` from `lib/parser/`.
  All three ran at `33f47ec`; the frontmatter half of the gate answers
  clean on the four cards this lane writes (`0 frontmatter issue(s)`).
- **METHOD EVAL GATE — NOT OWED** on all 6 paths: nothing under
  `method/**`.
- **CENSUS — STALE, AND IT IS THE INTEGRATOR'S** (T-201): two test bodies
  were added, so `capabilities:check` exits 1 (committed 48,201 bytes
  against a fresh 48,481). `npm run capabilities` belongs in the merge
  commit; `docs/CAPABILITIES.md` is outside this lane's fence.
- **THE VERDICT TOKEN IN `.nputer/` NAMES `33f47ec`'s TREE**, not this
  notes commit's. The integrator re-mints before any push (T-203).

### FIGURES, EACH WITH ITS REF

At `33f47ec`: the block's own cost, rendered at a fixed size and a fixed
clock against `fb2a944`'s module — UNDER arm **342 → 1,141** bytes
(+799), OVER arm **500 → 2,183** (+1,683); the four non-converging
widths; the suite counts; the graph figures. Live at `2026-09-02T06:39Z`
and after on `Mac.lan`: nothing listening on 1420; five lanes live
(`T-215-s6`, `T-225-s1`, `T-229-s6`, `T-237-s3`, `T-238`); the answer
sizes above. Every live figure carries its reading time and none carries
a ref.

### WHERE THE BRIEF WAS WRONG

1. **Row 4's base commit.** It names
   `6cc38909ab24c9c5c06b4e23a0fa11424662a038` and builds its `create:`
   command from it, while the lane was cut at
   `fb2a944078142f3a8acc809e5b28be5ac8ce5255` — the brief's own
   *"integration tip right now"* row, and the commit that stamped this
   card `building`. The worktree's HEAD is the truth (T-233's known
   defect; the dispatch said so in advance).
2. **The advisory's `signal criteria`** reads *"the card carries no
   acceptance criteria, so there is nothing to build against — TRY"*.
   The card carries criteria in three places: the TRIAGE section's
   *"Criterion:"* sentence, the absorbed `T-225-s3` paragraph's two
   SHALLs, and the corroboration's closing sentence. What the assembler
   cannot see is a criterion that is not under a `## Acceptance criteria`
   heading — a property of the pattern rather than of the card.
3. **Row 5's lane list is a live fact and it moved.** The brief names
   `T-018-s6 T-215-s1 T-225-s1 T-229-s6 T-238`; re-read at
   `2026-09-02T06:39Z` on `Mac.lan` the live set is `T-215-s6 T-225-s1
   T-229-s6 T-237-s3 T-238` — two gone, two new, so every disjointness
   verdict in that row is about a set that no longer exists. Re-derived
   here: no live lane's `touches:` meets this card's two paths.
4. Rows 1, 2, 3, 6, 7, 8, 9, 11, 12 and 13 held at this lane's own ref.

### ROUTED, NEVER BUILT

`T-225-s6` — the writer's own exit behind a reader that stops after one
read is a race nothing in the tree records. `T-225-s7` — the margin
guard's live-arm list omits `--dispatch --full`, the biggest arm there is
and the view T-225 made the triage default. Both need
`tools/e2e/tests/brief-flush.spec.ts`, outside this fence. `T-225-s8` —
the block's own cost grew by 799 bytes under the line; inside this fence,
but a DECISION for triage rather than a defect, so it is routed rather
than taken.

### FOR THE VERIFIER

The two claims worth attacking hardest. **One:** the OVER-arm body's
needles are built from the measurement, so a body that measured nothing
would pass vacuously — the guard is the block of direct assertions above
the join (SHAPE TEN) plus the planted-sentence control, and both are
worth trying to defeat. **Two:** the unsettled body derives its own
widths, so a derivation returning an empty set would report success about
a case it never reached — the coverage floor against the boundaries that
shrink is what closes that, and it is the assertion to poison.

## FIX PASS — 2026-09-02, executor claude-opus-5@subagent, on V-T-225-s1's REJECTION at `1e9fb6e`

Both findings were pre-registered in the verifier's sealed attack set
(A11 and A1) and both are the card's own criterion. Both are repaired in
`301b7cb`, and both remedies are shown RED-before/GREEN-after on a
detached bench cut from the rejected tip itself.

**FINDING ONE, in the verifier's words:** *"`SPAWNSYNC_DEFAULT_MAXBUFFER`
is transcribed, not driven. Doubled to `2048 * 1024` the command prints
'spawnSync at its 2097152-byte DEFAULT maxBuffer' to a dispatcher and
brief.spec.ts passes 39/39 — a figure with no keeper, in the module whose
contract is that a figure never leaves it detached from its source, under
a comment claiming every figure here is driven. The boundary is
deterministic: 1,048,576 clean, 1,048,577 ENOBUFS."* It is right, and the
comment it quotes was mine. The body now spawns a producer writing
exactly `SPAWNSYNC_DEFAULT_MAXBUFFER` bytes and one writing exactly one
more, and requires the first clean and the second `ENOBUFS`. That
brackets node's default from BOTH sides — a constant too large fails the
first assertion, one too small fails the second — in two spawns and with
no race, because **the boundary is a property of the CHILD's size rather
than of the reader's timing**: node trips when what it has accumulated
EXCEEDS the limit, and a producer writing exactly N never accumulates
past N. Disclosed at every run beside the other callers:
`node's DEFAULT bracketed at 1048576 (none) and 1048577 (ENOBUFS)`.

**FINDING TWO, in the verifier's words:** *"`disagreements()` has no
ABSENCE half. The retired clause restored ALONGSIDE the true text …
is green at 39/39, in the same run that measured ENOBUFS and a
135,657-byte overrun. The planted control catches replacement and misses
addition, which is the asymmetry this diff correctly repaired one body
earlier."* That last clause is the sting: this lane narrowed three
whole-block absence assertions to their own line and then wrote a checker
with no absence question in it at all. `Claim` now carries `absent:`
beside `needles`, built from the same measurement — this run saw an error
and an overrun, so the line may not also promise *"with no error"*,
*"receives a prefix"* or *"never OVERRUNS"* — and a second planted
control splices the retired clause INTO the arm this run actually
rendered, which is the ADDITION form the first control cannot see. The
retired sentence now disagrees with **9** measurements where it disagreed
with 7.

**THE TWO REMEDIES, RED BEFORE AND GREEN AFTER.** A detached bench at
`/private/tmp/nd-fix-T-225-s1`, installed in fresh-clone order, ran each
of the verifier's two mutants at BOTH tips — one side only, landing read
back from `git diff -U0`, restored with `git restore --source=<tip>
--staged --worktree` and proved by sha256, bench removed afterwards.

| mutant | at `1e9fb6e` (rejected) | at `301b7cb` (fixed) |
|---|---|---|
| `SPAWNSYNC_DEFAULT_MAXBUFFER` → `2048 * 1024` | **39 passed**, exit 0 — the defect | **1 failed / 38 passed** — the OVER-arm body alone |
| the retired clause spliced BESIDE the true text | **39 passed**, exit 0 — the defect | **1 failed / 38 passed** — the OVER-arm body alone |

The reds are assertions and not resolution errors. Finding one fails with
*"a child writing exactly 2097152 bytes was refused by an unconfigured
spawnSync, so node's default maxBuffer is SMALLER than the figure this
arm prints as it"*. Finding two fails naming all three restored promises,
each as *"the line at "past it, spawnSync at a maxBuffer this answer
exceeds:" STILL says … which this run's own measurement contradicts"*.
Restoration hashes: producer at `1e9fb6e`
`baba8c0cba5f4e04ac722234a489cf8be97c2c4292ed7b169c68d6619921fa43`, at
`301b7cb` `eb85bc2b7e25cc0a33868eeadab5f84d16dd799b79e358adf122785e843a496b`,
each matching its worktree file after every one of the four runs.

**COMMANDS, IN ORDER.** `npm run typecheck` from `tools/e2e/` **0** (x2);
`npx playwright test tests/brief.spec.ts` **0** — 39 passed;
`npx playwright test tests/brief-flush.spec.ts` **0** — 4 passed;
`npx vitest run` from `lib/parser/` **0** — 363 passed;
`git worktree add --detach /private/tmp/nd-fix-T-225-s1 1e9fb6e` **0**;
bench install parser/app/e2e **0**, **0**, **0**; four mutant runs
**0**, **0**, **1**, **1** exactly as the table says;
`git worktree remove --force` **0**.

**WHAT DID NOT MOVE.** Everything the verdict recorded as standing —
the seven producer mutants the OVER-arm body kills alone, the three the
UNSETTLED body kills alone, the transplant reding all four margin bodies,
the four real widths and their −799 relationship to the base's four, the
floor naming the right reader, and the `>`-not-`===` call on a killed
child's stdout. `status: verifying` is unchanged and `verified_by` stays
unstamped: a rejected card returns to its lane, and stamping either field
is the dispatching seat's.

## VERDICT — 2026-09-02, verifier claude-opus-5@subagent: REJECTED

Judged at tip `1e9fb6ef8e9ad499b1e6f9fb5829110ac0c5c596`, base
`fb2a944078142f3a8acc809e5b28be5ac8ce5255`, on an independent bench at
`/Users/ujju/Projects/nputer-V-T-225-s1` (node v22.22.0, macOS 26.6
arm64, `NPUTER_E2E_PORT=25225`; 1420 never touched).

**BLINDNESS WAS CLOCK-SHAPED, with one thing to disclose.** The bench was
cut with the lane and phase 1 ran before the branch carried a commit: the
attack set and a measured ground truth were sealed and hashed before any
diff was fetched — `attack-V-T-225-s1.md`
`dc440dfb3a47582e3924acb125d6260a7b354bb5eaf55f208e19d840585807c5`,
`ground-V-T-225-s1.md`
`f810f8dccf1da5426311888956f901932e5b803ed02878fbc3a114eda7755a33`,
sealed **2026-09-02T06:03:31Z**. The one disclosure: confirming this
bench's own stamp with `git worktree list` printed every worktree's commit
column, so this seat saw that the lane still stood at `fb2a944` — a fact
about the clock that disclosed no content, and it was not looked at again.
The dispatching brief's duties section named no executor-derived specific.
**BOTH FINDINGS BELOW WERE PRE-REGISTERED IN THAT SEALED ATTACK SET** (A11
and A1) and are reported because the pre-registered mutant SURVIVED, not
because a defect was hunted for after reading the diff.

### FINDING 1 — the figure that names one of the four callers is transcribed, and nothing keeps it true

`SPAWNSYNC_DEFAULT_MAXBUFFER = 1024 * 1024` is typed into
`dispatch-brief.mjs` and printed to the dispatcher as the identity of one
of the four callers the arm names. No body measures it.

    perl -0777 -pi -e 's/SPAWNSYNC_DEFAULT_MAXBUFFER = 1024 \* 1024/SPAWNSYNC_DEFAULT_MAXBUFFER = 2048 * 1024/' \
      tools/e2e/scripts/dispatch-brief.mjs
    node tools/e2e/scripts/brief.mjs --dispatch --full | grep "DEFAULT maxBuffer"

prints, live:

    past it, spawnSync at its 2097152-byte DEFAULT maxBuffer: this answer is UNDER
    that default, so a caller that configured nothing receives the whole answer at
    status 0 with no error

which is false about node. Expected: a red. Actual: `brief.spec.ts`
**39 passed**, `brief-flush.spec.ts` **4 passed**, both exit 0. The
mutant's landing was read from `git diff -U0` (one line, one-for-one).

Why this is REJECTED-level rather than a suggestion: the card's criterion
is *the OVER arm SHALL describe what each named caller actually does past
the line, measured, and a body SHALL red when the sentence and the
measurement disagree*. For three of the four callers it does. For the
fourth the sentence can disagree with node silently, and the disagreeing
half is the only thing that identifies that caller. **And the diff says
otherwise about itself**: the new comment on the constant asserts *"EVERY
CLAIM IN THIS PARAGRAPH AND IN THE ARMS BELOW IS DRIVEN AND NOT ASSERTED"*
and *"No figure from that measurement is transcribed here."* Both are
false of this constant — a figure with no keeper, in the module whose
whole contract is that a figure never leaves it detached from its source.

**The remedy is cheap and the measurement is deterministic.** This
verifier's sealed ground truth probed it at the base with a synthetic
producer, one run each:

    1,048,575 bytes -> stdout 1048575, status 0, no error
    1,048,576 bytes -> stdout 1048576, status 0, no error
    1,048,577 bytes -> stdout 1048577, status null, SIGTERM, ENOBUFS

So the boundary is exactly `SPAWNSYNC_DEFAULT_MAXBUFFER` and the
comparison is strictly greater. A producer at the constant and at the
constant plus one, asserted clean and ENOBUFS, pins it in two spawns and
no race — the same shape the body already uses for its two ceilings.

### FINDING 2 — the checker has no ABSENCE half, so the retired clause restored ALONGSIDE the true text passes

`disagreements()` asks whether each needle is PRESENT on the anchored
line. It never asks whether a retired needle is ABSENT. So the exact
sentence this card was filed about, restored verbatim to the exact line
this card is about, contradicting the measurement taken in the same run,
is green:

    perl -0777 -pi -e 's/and the stdout handed back OVERRUNS that /and a caller collecting into a fixed buffer of that size receives a prefix with no error, never OVERRUNS that /' \
      tools/e2e/scripts/dispatch-brief.mjs

The command then prints to a dispatcher:

    past it, spawnSync at a maxBuffer this answer exceeds: the child is KILLED —
    status null, signal SIGTERM, error.code ENOBUFS — and a caller collecting into
    a fixed buffer of that size receives a prefix with no error, never OVERRUNS
    that maxBuffer by however much node had already read, so the caller's own
    number bounds nothing

Expected: a red — the line asserts both that the caller is told through
`error.code ENOBUFS` and that it receives no error, and this run measured
`ENOBUFS` with an overrun of 135,657 bytes past a 135,656 ceiling.
Actual: `brief.spec.ts` **39 passed**, exit 0.

The positive control catches the RETIRED-BY-REPLACEMENT form and misses
the RETIRED-BY-ADDITION form. That asymmetry is the same one this diff
correctly repaired one body earlier: the base's
`expect(under).not.toContain("OVER by")` was an absence assertion over a
whole block, and the lane narrowed it to the figure line. The `Claim`
shape needs the mirror of that — an `absent: string[]` beside `needles`,
carrying the retired clause — and the planted `RETIRED` control already in
the body then exercises the absence half at no extra cost.

### WHAT STANDS, AND IT IS MOST OF THE CARD

Recorded so the next pass does not re-derive it.

- **The false clause is gone** and the arm names four callers with one
  measured line each. **SEVEN producer mutants killed, each by the new
  OVER-arm body ALONE**: `signal SIGTERM`→`SIGKILL`, `error.code
  ENOBUFS`→`EPIPE`, `KILLED — status `→`status 0 not `, the DEFAULT line
  unanchored (`-byte DEFAULT`→`-byte standard`), `OVERRUNS that
  `→`stops at that `, `receives every byte`→`loses the tail`, `NO error on
  the reader's side at all`→`an error on the reader's side every time`.
  Every landing read from `git diff`, never from the mutator.
- **THREE `withMargin` mutants killed by the new UNSETTLED body alone**,
  at the site the property lives: `whole: false`→`true`, `bytes:
  bodyBytes`→`total`, and the "did not settle" label replaced. Neither
  new body's kill set contains the other's, and neither is contained in
  the two existing margin bodies' (which alone killed the
  floor-names-the-wrong-reader mutant, `the floor for a reader that takes
  ONE `→`the floor for spawnSync and a reader that takes ONE `).
- **THE TRANSPLANT REDS.** The tip's spec against the BASE's producer
  (base module restored plus only the one export the import needs, so the
  red is an assertion and not a resolution stack trace): all four margin
  bodies fail, the new one naming all four callers as
  `no line opens with "past it, ..."`. These bodies are not decoration.
- **THE UNSETTLED BRANCH IS GENUINELY NON-CONVERGENT, NOT SLOW.** Raising
  the loop from `pass < 8` to `pass < 2000` leaves the body PASSING — the
  cycles are period 2 and never settle.
- **AND THE WIDTHS ARE DERIVED IN-RUN, NOT PINNED.** Adding ONE byte to
  the block's prose moved all four derived widths by exactly −1
  (64386/64296/63395/54394 → 64385/64295/63394/54393) with the body still
  green.
- **THE DERIVATION IS ALSO COMPLETE, CHECKED BY A DIFFERENT METHOD.** This
  verifier's exhaustive scan of every body width 1..200,000 against the
  tip's `withMargin` finds exactly `54394, 63395, 64296, 64386` — the same
  four, no fifth missed. The same scan sealed at the BASE found
  `55193, 64194, 65095, 65185`; every one differs by exactly **799**,
  which is the block's own growth and is what T-225-s8 records. **So the
  absorbed T-225-s3 question is answered correctly: the fixed point fails
  at REAL widths, one per digit boundary of `left`, and the OVER arm
  cannot oscillate at all** — 0 unsettled bodies in 65,537..200,000 at the
  base, confirmed independently of the lane.
- **THE FLOOR NAMES THE RIGHT READER.** Sealed measurement:
  `| dd bs=65536 count=1` receives exactly 65,536 bytes with reader exit 0
  (3/3), while `| cat` loses nothing (115,250 of 115,250, 3/3). *"The
  floor for a reader that takes ONE fixed-size read and stops … and no
  other reader's limit"* is exactly right, and it is the caller the
  retired sentence was true of.
- **THE LOAD-INDEPENDENCE CALL IS RIGHT, AND THIS SEAT PRE-COMMITTED TO
  IT.** The body asserts `>` on a killed child's stdout and never `===`.
  The sealed ground truth shows why that was necessary: at
  `maxBuffer: 65536` a one-shot producer hands back its whole 102,752
  bytes while a slow producer of the same size is cut at 73,728 — 3/3
  each. An equality would have been a flake wearing a measurement.
- **AND THE WRITER'S EXIT IS RIGHTLY NOT ASSERTED.** Five consecutive runs
  on this bench read writer status **1** behind the `dd` reader where the
  dispatching seat read 0. T-225-s6 files it correctly.
- Suite state: `brief.spec.ts` **39 passed** (base 37; +7.7s), green also
  under `GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_SYSTEM=/dev/null`.
  `brief-flush.spec.ts` 4 passed. `npx tsc --noEmit` exit 0.
  `gate-run e2e` at this tip: **bodies=577, 4 failed / 573 passed**, and
  those four — `card-preflight.spec.ts:719`,
  `checkout-currency.spec.ts:852`, `checkout-currency.spec.ts:953`,
  `lane-lock.spec.ts:899` — **red identically BY NAME at `fb2a944`** on
  this same bench, so they are `guard-surface-behind` and not this diff's.
- **SECURITY: clean.** No dependency change. Every path interpolated into
  a `/bin/sh -c` string goes through the new `shq()`; the only other
  interpolations are the module's own integer constants. The pipeline
  spawn carries a 64 MiB `maxBuffer`. No secrets, no network, no new
  endpoint.
- **FENCE: clean.** Six paths, none outside it. `brief.mjs` (T-238) and
  `brief-flush.spec.ts` are untouched, which is the temptation this card
  set up and the lane declined. The three filed cards are lane-protocol's
  prescribed ROUTING beside the card, one-level ids, `status: suggested`
  with `suggested_by` set, and the docs gate reports every live card's
  frontmatter parsing with a legal status.
- **CENSUS: stale by two bodies (48,201 committed against 48,481 fresh),
  correctly reported in the notes as the INTEGRATOR's** under T-201.
  `index --check` CURRENT at the base and unaffected by this diff.

### WHAT THE LANE OWES

Two edits, both inside the existing fence. **(1)** Drive
`SPAWNSYNC_DEFAULT_MAXBUFFER` from a measurement rather than a
transcription — the two-spawn probe above — or stop printing the number
as a fact about node. **(2)** Give `Claim` an absence half and put the
retired clause in it, then re-run the planted control, which will then
prove both halves. Nothing else in the diff needs to move, and the
frontmatter is deliberately left as this seat found it (`status:
verifying`, `verified_by` unstamped): a rejected card returns to its lane,
and stamping either field is the dispatching seat's.

## RE-VERDICT — 2026-09-02, verifier claude-opus-5@subagent: APPROVED

Judged at tip `b1dc556fc7730b6b307d8d8986532d3ff6c22272`, fix range
`1e9fb6e..b1dc556`, on the same bench. **Both rejections are closed, and
each closure was checked by re-running the ORIGINAL sealed mutant
unchanged** — the same two substitutions, byte for byte, that survived at
`1e9fb6e`.

### FINDING 1 — CLOSED, and the bracket is two-sided and tight to ±1

    perl -0777 -pi -e 's/SPAWNSYNC_DEFAULT_MAXBUFFER = 1024 \* 1024/... = 2048 * 1024/'

now REDS, and with its own message rather than a generic one:

    a child writing exactly 2097152 bytes was refused by an unconfigured
    spawnSync, so node's default maxBuffer is SMALLER than the figure this arm
    prints as it

The bracket was then attacked from the other side and at the boundary,
because a one-sided check would have passed my mutant by luck:

| constant planted | verdict | the assertion that caught it |
|---|---|---|
| `2048 * 1024` (too large) | KILLED | the N-byte child was refused |
| `512 * 1024` (too small)  | KILLED | *"a child writing 524289 bytes was ACCEPTED … so node's default is LARGER"* |
| `1024 * 1024 + 1`         | KILLED | off by one, high |
| `1024 * 1024 - 1`         | KILLED | off by one, low |

Each by the OVER-arm body ALONE. This agrees exactly with the ground truth
this seat sealed at the base before the branch existed — 1,048,575 and
1,048,576 clean, 1,048,577 `ENOBUFS` — and the claim that it needs no race
is sound for the reason the comment gives: node trips when what it has
ACCUMULATED exceeds the limit, and a child writing exactly N never
accumulates past N. Disclosed at every run now, and stable 4 runs of 4:
`node's DEFAULT bracketed at 1048576 (none) and 1048577 (ENOBUFS)`.

### FINDING 2 — CLOSED, and the new control reds when disarmed

    perl -0777 -pi -e 's/and the stdout handed back OVERRUNS that /and a caller
      collecting into a fixed buffer of that size receives a prefix with no error,
      never OVERRUNS that /'

now REDS, naming all three contradictions it found on the anchored line:

    the line at "past it, spawnSync at a maxBuffer this answer exceeds:" STILL
      says "with no error", which this run's own measurement contradicts
    ... STILL says "receives a prefix" ...
    ... STILL says "never OVERRUNS" ...

**AND THE GUARD IS ITSELF GUARDED, WHICH IS WHAT STEP 2b ASKS AND WHAT
THIS SEAT CHECKED RATHER THAN TOOK ON TRUST.** Two mutations of the
CHECKER, not of the subject:

- emptying the `absent` list for that claim → the new addition control
  REDS with *"the retired clause restored ALONGSIDE the true text passed —
  the checker asks only what a line SAYS and never what it may no longer
  say, which is the asymmetry this body was rejected for"*;
- breaking the splice so `ADDED` would equal `over` → REDS with *"the
  addition control spliced nothing, so it is the true arm wearing a
  mutant's name"*.

So the control cannot silently become a no-op, and the absence half cannot
be removed without the control noticing. The banned phrases are derived
from this run's `clean` and `overran`, not typed beside the arm.

### NO REGRESSION, RE-MEASURED RATHER THAN ASSUMED

All ELEVEN mutants that died at `1e9fb6e` still die at `b1dc556`, with the
same kill sets: seven producer mutants and the wrong-reader mutant, plus
`whole: false`→`true`, `bytes: bodyBytes`→`total` and the dropped label,
each killed by the UNSETTLED body alone. The two new bodies' kill sets
still contain neither each other's nor the two existing margin bodies'.
Beyond them: the fix's spec transplanted onto the BASE producer reds all
four margin bodies; the loop ceiling raised from 8 to 2000 leaves the
UNSETTLED body PASSING, so the cycles are period-2 and not slow
convergence; one byte of added prose still moves all four derived widths
by −1 with the body green; and an exhaustive scan of every body width
1..200,000 against this tip's `withMargin` returns exactly
`54394, 63395, 64296, 64386` — the four the derivation reports, none
missed. The producer half of this fix is comment-only, so the block length
is unchanged at 1,142 bytes and the widths did not move.

Suites at this tip: `brief.spec.ts` **39 passed** (also 39 under
`GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_SYSTEM=/dev/null`),
`brief-flush.spec.ts` 4 passed, `npx tsc --noEmit` exit 0, the OVER-arm
body stable over 3 further consecutive runs. Security unchanged and clean:
no dependency moved, and `writesExactly` interpolates only this module's
own integer into a file it writes itself. Fence clean — three paths, the
two in `touches` and this card; `brief.mjs` and `brief-flush.spec.ts`
untouched.

### FILED, NOT BLOCKING

One third-order gap was measured while confirming the two closures and is
filed as **T-225-s9**, `status: suggested`: the `absent` list is per-claim,
so a clause that is FALSE about one caller survives on ANOTHER caller's
line (*"on the tail, and spawnSync past its maxBuffer likewise receives a
prefix with no error"* — 39 passed). It is not a failure of this card's
criterion, which is about each named caller's own line, and that line now
answers both questions with controls that red when disarmed. It is
recorded so it is not re-derived.

### THE CENSUS AND THE BATTERY

`capabilities:check` is STALE by the same two bodies (48,201 committed
against 48,481 fresh) and is the INTEGRATOR's under T-201; this lane's
fence leaves `docs/CAPABILITIES.md` read-only and the notes report it
correctly. The four-suite battery and the graph gate as re-run by this
seat at its own verdict tip are recorded in the commit that carries this
verdict; the four `e2e` reds are `guard-surface-behind` and red
identically BY NAME at `fb2a944` on this bench.
