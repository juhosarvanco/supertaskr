# State

Updated: 2026-08-25 by the T-102 integrator.

**READ THIS FIRST IF YOU ARE PICKING THE PROJECT UP: FOUR LANES HOLD
FENCES, ONE APPROVED CARD IS WAITING FOR AN INTEGRATOR, AND MAIN MOVED
FOUR TIMES UNDER THIS ONE INTEGRATION — TWICE WHILE THE CHECKPOINT WAS
BEING WRITTEN.** Nothing on main is broken — this merge was **460 / 958 /
264 / 146 green, first time, no re-runs, nothing discarded**. But **three
known intermittents will meet you before any real defect does**, and this
checkpoint is the first to hit the shared-checkout hazard `T-128` was
filed about *while reading `T-128`'s own commit*. Read the next four
sections before you debug anything, and the lane section before you cut
anything.

## THE NEW ONE — MAIN IS A SHARED WORKING TREE AND `HEAD` IS NOT A FIXED BASELINE

**THIS COST THIS INTEGRATOR A WRONG CONCLUSION, STATED CONFIDENTLY,
BEFORE IT WAS CAUGHT — AND THE MECHANISM IS WORTH MORE THAN THE
CORRECTION.** Mid-checkpoint, `git status --porcelain` in the main
checkout reported ` M docs/tasks/T-127-….md` — a file this integration
never touched. Two seconds later `git diff` on that path returned EMPTY
and `git show HEAD:<path> | shasum -a 256` matched the working file
exactly, so it was recorded as a harmless stat-cache artifact: a foreign
`touch` that moved an mtime without changing content.

**THAT WAS WRONG.** The ` M` was a REAL uncommitted amendment by another
session, and it matched `HEAD` because **`HEAD` had advanced to include
it two seconds earlier** (`ab6ddb9`, committed 16:03:06; the check ran at
16:03:08). Proved after the fact by comparing the two committed blobs
directly: the card is `94f26d58…` at `48ed848` and `93f49d35…` at
`ab6ddb9` — different files.

**THE STANDING LESSON: `git show HEAD:<path>` IS NOT A FIXED BASELINE IN
A CHECKOUT SOMEBODY ELSE IS COMMITTING TO.** `HEAD` is a moving ref, so a
comparison against it silently re-baselines under you and answers
"identical" about a file that just changed. **Compare against a NAMED
COMMIT** — the sha you started from — never against `HEAD`, whenever the
tree is shared. This is `T-128`'s subject, reproduced live by the pass
that was reading `T-128`'s own commit, an hour after it was written.

**WHAT DID WORK, AND IT IS THE CHECK THIS REPO ALREADY PRESCRIBES.**
`T-120-s1`'s replacement for the pre-write exclusivity check — `git diff
--cached --name-only` plus `git diff --name-only`, both empty — was clean
at the merge and clean at the checkpoint, and it is the right check
precisely because both commands REFRESH the index before answering, where
`git status` alone can report a stat-cache `M`. **`??` lines alone are
not a ceremony** and there was exactly one (`z`).

**FOUR COMMITS BY OTHER SESSIONS LANDED ON MAIN DURING THIS
INTEGRATION** — `c87cfd8` (T-128), `ab6ddb9` (T-127 amended), `e900fac`
(T-129 promoted), and a suite run in main's own checkout by a third
session at 16:00:46. **The architect disclosed the first two
unprompted**, which is the behaviour that made them cheap: they were
docs-only card files, outside this merge's 8 paths, and the range
`48ed848..a9ed33d` is between two FIXED commits and is therefore
unaffected by any of it. **A RANGE BETWEEN TWO NAMED COMMITS IS THE ONE
FIGURE A CONCURRENT COMMIT CANNOT SPOIL** — which is the deeper reason
this project's RANGE RULE names a PAIR rather than a notation.

## THE THING THAT WILL COST YOU AN HOUR IF NOBODY TELLS YOU — `T-120-s3`

**`tools/e2e/tests/token-scan.spec.ts:201` IS RED EXACTLY ONCE IN EVERY
FRESH CHECKOUT, THEN GREEN FOREVER AFTER, AND RE-RUNNING IT PROVES
NOTHING.** It is still `status: suggested` and still unfixed — it is the
first item under "Next up" for the EIGHTH checkpoint running.

The body captures `statSync(target)`, restores with
`utimesSync(target, clock.atime, clock.mtime)`, then asserts
`statSync(target).mtimeMs === clock.mtimeMs`. **`Stats.mtime` is a
`Date`, and a `Date` holds whole milliseconds** — so the restore writes
back a ROUNDED timestamp while the assertion compares the unrounded float
it captured. **And the failure repairs the condition that caused it**: the
`utimesSync` in the `finally` block leaves the mtime on a whole
millisecond, so the next run passes. Red once, green forever, in that
checkout.

**THE SIGNATURE IS A FRACTIONAL MILLISECOND, AND THREE PASSES HAVE NOW
CAUGHT IT WITH THE DIGITS**, which is what turns a warning into an
identification:

    Error: tools/e2e/fixtures/shell.ts restored its MTIME too
    Expected: 1787655727832.5427
    Received: 1787655727833

**Match a fractional tail against a whole number and you are looking at
this and not at your own change.** It did NOT fire at this merge — 146/146
first time, ONE run, nothing to declare — because main is not a fresh
checkout. **DO NOT "FIX" IT BY RE-RUNNING UNTIL GREEN**, and if you do
run twice, DECLARE BOTH RUNS. The fix is one token:

    - utimesSync(target, clock.atime, clock.mtime);
    + utimesSync(target, clock.atimeMs / 1000, clock.mtimeMs / 1000);

**Keep the strict `toBe`** — weakening it to whole milliseconds deletes
the property `T-079-s3` exists to defend. T-052's lane removed this
finding's own "needs a fresh checkout to prove" prerequisite by
reproducing the red ON DEMAND in a healed worktree, so whoever takes the
fix can verify it anywhere.

## `T-088-s4` — THE CACHE CLIFF IS REAL, IT IS SETTLED, AND MAIN IS STILL OUT OF IT

**PRESERVED ACROSS SIX CHECKPOINTS BECAUSE IT IS THE MOST USEFUL THING
IN THIS FILE FOR A SESSION THAT RUNS `cargo test` IN MAIN.**

`docs_watch::tests::startup_arm_watches_the_initial_root` was carried as a
flake for weeks. It is not one. **It reds when the cargo target directory
is large and ~never when it is small, and the single variable is the size
of that directory.** T-110's experiments named the cause: same TREE, two
checkouts, and then same CHECKOUT, two target dirs —

| target dir | red | test time |
|---|---|---|
| isolated (1.5 GB, fresh) | **0 / 5** | 3.82–3.93s |
| main's own, **8.7 GB** | **4 / 5** | 8.85–14.70s |

**THE LIB TEST BINARY IS BYTE-IDENTICAL ACROSS THAT TABLE AND RUNS ~4x
SLOWER**, and one body in it has a wall-clock deadline, so it is the one
that reds. **A tally that mixes checkouts is not a flake rate.**

### THE CLOCK TEST STILL SEPARATES GREEN FROM RED, AND MAIN IS STILL IN THE GREEN BAND

T-124 found the lib suite's own `test result:` time sorts its runs
perfectly — every green under 9.5s, every red over 14.6s, **a gap of more
than five seconds with nothing in it** — and T-052 reproduced it. The
prediction keeps holding: `du -sh app/src-tauri/target` reads **2.9 GB**
here (unchanged from one checkpoint ago, though this merge's cargo runs,
graph gate, regen and boot check all wrote into it), and this merge's
`cargo test` ran the lib suite in **4.07s**, with the watcher body read
by NAME as `ok` rather than inferred from a green exit. **Thirteen runs
across five integrations and not one lands between 9.5s and 14.6s.** Read
the lib suite's own time first; it tells you which regime you are in
before any assertion does.

**DO NOT `cargo clean` REFLEXIVELY.** The 8.7 GB reclaim was a MEASURED
experiment, not a habit. What remains is that a lane may be building
against this repository, and there are FOUR of them right now: `lsof`
first.

## THE INTERMITTENT THAT WAS SETTLED AND IS NOT — `a_hostile_session_id…`

`a_hostile_session_id_in_the_init_line_fails_the_turn_and_is_never_recorded`
(`app/src-tauri/tests/agent_runner.rs`, T-039's, last touched by T-124 and
now by T-102) had been declared settled at better than 400-to-1 on 15
clean-cache runs that saw it zero times. **T-086's lane refuted that
within the hour**: it redded **1 in 4** full `cargo test` runs in a FRESH
lane worktree — with the `docs_watch` body GREEN and the lib suite at
**3.97s**, inside the healthy band — so the cache cliff cannot be what
crossed its deadline. Run alone the body is **5 green in 5**.

**THE SETTLEMENT WAS RETRACTED IN PLACE at `086bf1c`** with the rule it
produced: *a re-measurement can only settle a finding whose MECHANISM the
intervention addresses.* Pooled clean-cache evidence is **1 red in 19**.
**Live, load-sensitive, ~1-in-19 on a clean cache, and it is
`T-086-s1`'s subject.** It did NOT fire at this merge (read by NAME,
`ok`), which is one more data point and not a reprieve.

**AND IT ACQUIRED A THIRD DATA POINT FROM T-102's LANE THAT CUTS AGAINST
THE REMAINING HYPOTHESIS**: it fired in a FRESH drill worktree with a
SMALL `CARGO_TARGET_DIR` — the configuration the slow-checkout
hypothesis calls green — once in thirteen full runs, with the identical
mutant re-run immediately afterwards as its control. Filed as
**`T-102-s3`**. Read it beside `T-086-s1`: two findings, one body.

## THE LANE LIST, DERIVED FROM `git worktree list` AT THIS COMMIT

Read as **entries on a `task/T-NNN-*` branch** — a detached entry is not a
lane (the T-089 correction in CONVENTIONS). **THERE IS NO TIP COLUMN AND
THIS IS THE ELEVENTH MEASUREMENT SAYING SO.** A live lane's tip is a
live-environment fact, not a function of a tree; two of the four below
moved their tips DURING this integration. For a tip, run
`git worktree list`.

| lane | fence (`touches:`) | board says |
|---|---|---|
| **T-033** | `[docs/architecture/components/, lib-parser, app-map, app-shell]` | building |
| **T-091** | `[tools/e2e]` | building — **APPROVED, awaiting an integrator** |
| **T-108** | `[docs/tasks/T-027-…, T-025-…, T-081-…]` — THREE CARDS | **planned on main** |
| **T-116** | `[app-map]` | **planned on main** |

**T-102's WORKTREE IS REMOVED BY THIS CHECKPOINT**, so four lanes hold
fences after it. **`T-129` READS `status: building` ON MAIN WITH NO
WORKTREE AT ALL** — promoted from `T-010-s8` at `e900fac` while this
checkpoint was being written, fence `[crate-index]`. That is the
board-truth window at its widest yet: the stamp is written on main
BEFORE the branch is cut (lane-protocol, "Why the branch carries the
dispatch stamp"), so between those two acts the board claims a lane that
does not exist. **DERIVE THE LANE LIST FROM `git worktree list`; NEVER
READ IT OFF A BRIEF OR OFF THIS TABLE.**

**THE BOARD-TRUTH WINDOW HAS NOW BEEN OBSERVED AT `verifying`, AT
`building`-with-a-lane, AND AT `building`-with-NO-lane.** Seven earlier
checkpoints recorded the first, T-107's recorded the second, and T-129 is
the third. All three are the same mechanism and the field differs each
time, which is the argument that disposition 2 below (read phase from the
lane set) is the one that generalises. **Four independent witnesses now:
the worktree list, the branch-side stamp, the card on main, and a
`building` card with no branch — and the card on main is the one that is
wrong.**

**THREE DETACHED NON-LANE ENTRIES EXIST RIGHT NOW AND ONLY ONE IS
PERMANENT.** Derive the membership; do not quote it.

- **`/Users/ujju/Projects/nputer-app`, detached at `c4cfe52`** —
  **@human's app checkout, and the one serving port 1420.** Permanent, by
  @human's ruling of 2026-08-25. It holds no fence, is named after no
  card, and must not be removed after a merge. **`c4cfe52` is an ANCESTOR
  of main** (exit **0**) and main is now **58+ commits ahead of it**,
  which is the accurate reason nothing merged here reaches that window —
  *not* a trigger that failed to fire. Nothing reaches it until @human
  runs `git -C ../nputer-app checkout --detach main`.
- **Detached `drill-*` entries** — the scratch worktrees belonging to
  whichever passes are running. **TWO were present at this checkpoint**
  (`drill-T-102-verify`, `drill-T-116`). They come and go at other
  sessions' keystrokes; the class is stable, the list is not.
  **`drill-T-102-verify` OUTLIVED ITS VERIFICATION and is still on disk**
  — T-107's verifier removed its own drill when it finished (T-052-verify's
  precedent) and that is the shape to copy; this one did not, and it is
  not the integrator's to remove.

**NO LANE WORKTREE SITS AT A NON-STANDARD PATH.** Every lane entry is a
`../nputer-T-NNN` sibling, which is the spelling CONVENTIONS gives.
**`app-agent` IS RELEASED BY THIS CHECKPOINT.** Free too: `app-board`,
`app-dispatch`, `app-interview`, `docs/CONVENTIONS.md`, `method/`,
`.github/`. **`crate-index` is claimed by `T-129`'s stamp but by no
worktree** — treat it as taken.

## Just completed

**T-102 — the discriminator declines the evidence that cannot be
forged.** F-03, milestone 4, size M, `touches: [app-agent]`, **fence
never widened**. Main-before **`48ed848`**, lane tip **`d12efac`**, merge
**`a9ed33d`**, this checkpoint after it. `builder: claude-opus-5`,
`built_by: claude-opus-5 @T-102 — code commit 023ab3b`,
`verifier: claude-opus-5`,
`verified_by: claude-opus-5 @T-102-verify — APPROVED, 2026-08-25 —
verdict commit d12efac`, `review: same-model`. `blocked_by: [T-113]` was
checked, not assumed: T-113 reads `done` on main.

**WHAT LANDED.** T-069's auth guard withdraws a typed `AuthFailed` when
model TEXT arrives after the last status-bearing line, so a 401 the CLI
retried and got past stops taking *Try again* from a user whose login is
fine. **The guard's own justification never stopped at text**:
`classify_line` produces `StreamLine::Activity` from a `tool_use` content
block — the same model response in a different block type — and that arm
set nothing, so a turn that recovered a 401 and then called a tool
without speaking first still reached the user as an auth failure. That is
an ordinary opening for a planner that reads the repo before it speaks.
**And the ignored evidence is the STRONGER of the two**, which inverts
T-069's own honest limit: the CLI writes its own prose into a
nominally-model field so a delta is not certainly the model, while a
block naming a tool is not prose and the CLI has no reason to fabricate
one. `text_after_auth_status` becomes **`evidence_after_auth_status`**,
and the rename is part of the finding — the old name said `text`, so a
missing CASE read as a different SUBJECT.

**THE SECOND FLAG WAS REFUSED IN WRITING RATHER THAN BUILT.** There is
exactly ONE reader — a guard that WITHDRAWS a claim and never makes one —
withdrawal has no degrees, and the direction of error is identical for
both sources, so two flags would differ in nothing but name while being
able to drift. The condition that would split them (a future arm making a
POSITIVE claim from unforgeable evidence) is named at the declaration, so
the absence is on record as CHECKED rather than overlooked.

### **SEVEN ASSERTIONS THAT COULD NOT FAIL, REPLACED AND PROVED FROM BOTH ENDS**

**THIS IS THE BEST MEASUREMENT IN THE LANE AND SUMMARISING IT AWAY WOULD
BE THE FAILURE.** Seven bodies matched on the failure event and then
asserted the settled status was NOT some other variant. The idiom cannot
fail: `run_turn` sets `out.error` and emits the same value, so by the
time the negative runs the match arm has already accepted the variant it
forbids — and the form is green under the storage bug it looks like it
would catch, because `!matches!(None, Some(..))` is true. All seven
become `assert_settled_error_is`, an equality against the failure event
that ENTAILS the old inequality, with each site still NAMING the variant
its turn must not be confused with.

Dropping `guard.last_error = outcome.error.clone()` in `agent/mod.rs`:

| ref | result |
|---|---|
| tip `023ab3b` | **exit 101, ELEVEN bodies red** |
| base `c4c15c8`, same mutant, same token | **75 passed / 1 failed — all seven predecessors GREEN** |

**THE COUNT IS ELEVEN AND NOT TEN, AND THE ELEVENTH WAS CHECKED RATHER
THAN ASSUMED TO BE THE KNOWN INTERMITTENT**: it is
`a_hostile_session_id…`, whose panic reads `left: None / right:
Some(RejectedSessionId…)` — a genuine kill. That body's settling
assertion was ALREADY the positive form, in this same file since T-039,
so T-102 did not invent the replacement; it generalised the one assertion
in the file that could already catch a dropped classification.

**THE HONEST RESIDUAL, CARRIED RATHER THAN BURIED**: all ten new sites
kill this one mutant class, so nine are redundant with respect to it.
They are no longer bodies that CANNOT fail, but they are ten copies of
one kill.

### **CRITERION 8 WAS DECLINED ON THE EVIDENCE, AND THE DECLINE IS ENFORCED**

The card offered to lower `MAX_AUTH_MESSAGE_BYTES` (**2048**) under
`docs_watch::MAX_ECHO_LOG_CHARS` (**800**) so its *"this is headroom with
a hard stop"* comment would become true. **Read as EARS the SHALL is
*write the rule and assert it over the constants*; the lowering is an
`IF…THEN` antecedent — an option, not a requirement.** It was refused for
a reason `T-081-s4` never reached: **`sanitize_for_log` appends
`…(truncated)` and `truncate_utf8` appends nothing**, so a bound that
LOSES to the cap truncates VISIBLY and a bound that WINS truncates
SILENTLY. Lowering it would make "hard stop" true *and* delete the
disclosure from the one string a refused user reads.

**THE DECLINE IS NOT A DODGE AND IS HELD BY A TEST.** The verifier ran
the criterion's own IF-arm as a mutant (2048 → 700) across the workspace:
**459 / 1 / 3, exit 101**, reddening the new bound body alone with a
message naming what was given up. The test DERIVES the cap behaviourally
rather than naming it, because `MAX_ECHO_LOG_CHARS` is private to
`docs_watch` and reaching it means widening a fence to assert a number
(`T-102-s1`) — and it reds from BOTH sides, raise a bound here or lower
the cap there, each exit 101. The trade is routed as `T-102-s2`.

### **TWO RECORD DEFECTS SHIP WITH THIS CARD — ONE RECORDED, ONE ROUTED**

1. **The drill's record is incomplete.** The lane's notes say *"Shown
   still red-able by drill M2b (below)"* and **there is no table below,
   anywhere on the branch**; labels M1/M2/M3/M6 are never defined; and of
   the four mutants the Verification section names by hand, **"the
   `Activity` flag removed" has no reported result at all**. The verifier
   ran it independently (reds one body) so the PROPERTY holds — what is
   missing is the lane's own record. Under the succession rule, a
   dead-mutant account that exists only in a dispatch message did not
   happen. **Recorded, not repaired**: an integrator cannot retroactively
   author a drill it did not run.
2. **A NEW UNIVERSAL IN SHIPPED SOURCE IS FALSE**, confirmed at the
   source by this integrator rather than relayed: the caps-block header
   claims *"Every stream-borne string in this module reaches the app
   through `bounded_stream_string`"*, and that helper has exactly
   **three** production call sites, all on the denial path. The
   `Activity` label, the `TextDelta` relay (`cap_text`, 32 KiB) and
   `terminal_reason` each falsify it. **DISPOSITION: ROUTED, NOT
   CORRECTED** — on T-107's precedent one card earlier, where an
   integrator met the identical shape (a false claim in a source comment
   inside the merged fence) and left the source as filed while carrying
   the correction in ARCHITECTURE and the card. Editing shipped Rust in a
   checkpoint would ship an unverified source change and re-stale the
   graph this checkpoint just regenerated. **The narrow repair is one
   clause and has NO CARRIER of its own**; the wide one is `T-102-s4`,
   and a triage pass should give the narrow one a home.

**`T-102-s4` IS THE SHARP ONE**: `RunEvent::Activity { label }` reaches
the webview through *neither* bound — no truncation, no
control-stripping, ceiling only `MAX_LINE_BYTES` (1 MiB) — while the same
`tool_use` `name` field on the denial path is capped at 128 bytes and
stripped. **Not a regression, but it falsifies a universal T-102 itself
just wrote.** Left `status: suggested`: triage is not the integrator's
(T-083's ruling).

## Ranges, every dot count stated, at their own refs

    git merge-tree --write-tree 48ed848 d12efac -> tree 125e496b…, exit 0 (read from $? FIRST)
    git diff --name-only 48ed848 <TREE>                        ->   8   THE PRESCRIBED PRE-MERGE FORM
    git diff --name-only 48ed848..a9ed33d  (THE MERGE'S DIFF)  ->   8   the only one that means anything
    git diff --name-only 48ed848...d12efac (branch-only, TWO)  ->   8
    git diff --name-only c4c15c8..48ed848  (main's advance)    ->  22
    git diff --name-only 48ed848..d12efac  (TWO dots, FORBIDDEN)   ->  30

**THE FORBIDDEN TWO-DOT FORM OVERSTATES BY 22 PATHS — 3.75x — AND IT IS
PURE LEFT-ENDPOINT DRIFT.** Main advanced **22** under this lane, the
branch **8**, `comm -12` over the sorted lists is **EMPTY**, the union of
the two sets is **byte-identical to the forbidden two-dot set** under
`diff`, and 22 + 8 = 30 — the arithmetic that proves them disjoint,
checked as SETS and not only as counts. Ratios so far: T-110 **7.0x**,
T-120 **1.2x**, T-124 **5.6x**, T-052 **5.3x**, T-086 **2.67x**, T-107
**2.25x**, T-102 **3.75x**. The ratio is weather; **the left endpoint is
the signal.**

**THE FORECAST TREE IS THE MERGE'S TREE, BYTE FOR BYTE.**
`merge-tree --write-tree` returned
`125e496ba9707fe5644b2c2b17cd3ad1a29539ad` before the merge and
`git rev-parse HEAD^{tree}` returns the same afterwards. Parents are
`48ed848` and `d12efac` and nothing else; **NOTHING WAS WRITTEN INTO THE
MERGE COMMIT.**

**THE DISPATCH BRIEF FOR THIS MERGE CARRIED THE VERIFIER'S RANGE FIGURES
AND SAID SO, WHICH IS WHY THEY COST NOTHING.** It relayed prescribed
**8**, three-dot agreeing, intersection EMPTY and forbidden **16** at
`05dd4d9`, and explicitly warned that main had moved. At this
integrator's refs the first three reproduce exactly and **the forbidden
form is 30, not 16** — the difference is main's own advance between the
two refs, and nothing else. **A COUNT COPIED OUT OF AN EARLIER PASS IS A
COUNT ABOUT A DIFFERENT TREE**, and the brief that says so while quoting
one is the brief that survives contact.

## THREE standing gates — ALL THREE FIRE, DERIVED from the merge's own 8 paths

| gate | trigger | on these 8 | result |
|---|---|---|---|
| GRAPH REGEN | `*.ts/*.tsx/*.js/*.jsx` **or `*.rs`** outside `docs/` | **3 — FIRES** | exit **1, STALE** → regen → **0, CURRENT** |
| BOOT GATE | `app/src-tauri/**`, `app/src/**`, either manifest | **3 — FIRES** | exit **0** |
| DOCS GATE | a `docs/` path a code suite reads | **5 — FIRES** | exit **1**, three suites owed, all green |

The 8 are three `.rs` files under `app/src-tauri/` and five under
`docs/tasks/` — this card and its four suggestions. **GRAPH REGEN AND
BOOT GATE FIRE ON THE IDENTICAL THREE PATHS HERE, AND THAT IS A
COINCIDENCE OF THIS DIFF RATHER THAN A PROPERTY** — CONVENTIONS' own
worked counterexamples are T-120's and T-079's, where a `.ts` file under
`tools/` matched GRAPH and not BOOT. Do not derive one trigger from the
other.

- **GRAPH REGEN — a REAL stale, not the `--root` false red**, read off
  the SECOND line as this project's own trap requires: it printed both
  counts and a `~` file diff rather than `committed: MISSING`. **Main was
  CURRENT at `48ed848` BEFORE the merge**, checked first, so the stale is
  attributable to this merge and not inherited. Committed **921 608 bytes
  · 178 files · 1960 symbols · 1881 edges** → fresh **923 899 · 178 ·
  1967 · 1881**: **+7 symbols, edges UNMOVED, files `+0 −0 ~3`**.
  Regenerated and committed **with this checkpoint, not the merge**;
  `index --check` is **exit 0, CURRENT** afterwards, and was asked AGAIN
  after two unrelated cards landed on main mid-checkpoint — still
  CURRENT, which is `.nputerignore` working and was **asked rather than
  predicted**. **THIS IS THE SECOND MERGE UNDER
  `app/src-tauri/src/agent/**` TO PAY T-010's NEW OBLIGATION**, after
  T-123; the four merges before T-010 landed could each state
  "byte-identical" without regenerating anything.
  **THE VERIFIER'S DELTA FORECAST REPRODUCED AND ITS ABSOLUTE DID NOT,
  EXACTLY AS IT WARNED**: it predicted +7 symbols with edges unmoved off
  a 920 597-byte baseline; the delta is **2291 bytes on both sides**
  (920 597 → 922 888 there, 921 608 → 923 899 here) and only the baseline
  moved, because T-107's checkpoint regenerated in between.
- **NO FIXTURE RECONCILIATION WAS OWED, DERIVED RATHER THAN ASSUMED.**
  The regen moves symbols but **not FILES** (178, `+0 −0 ~3`) and
  declares no component, so CONVENTIONS' *"a MERGE REGEN alone moves only
  the two app fixtures"* had nothing to move. Checked by running them
  after the regen: app **958/958**, parser **264/264**, both exit 0.
- **BOOT GATE — exit 0**, `NPUTER_BOOT_PORT=15284 npm run boot:check`
  from tools/e2e, both `[nputer]` lines observed: `[nputer] project
  folder: /Users/ujju/Projects/nputer` and `[nputer] window "main"
  created`. Captured process group **2971**, stopped by SIGTERM,
  confirmed gone afterwards — no orphan.
- **DOCS GATE — exit 1**, invoked DIRECTLY from the repo root with the
  merged paths as ROOT-RELATIVE `$(…)` arguments, **never through
  `xargs`**, fed the RANGE RULE's own path list. **5 of 8 under `docs/`,
  THREE suites owed** — `npm test from app/`, `npm test from tools/e2e/`,
  `npx vitest run from lib/parser/` — all three run and green. **`cargo
  test from app/src-tauri/` is NOT owed and that is DERIVED**, not
  skipped: this diff carries no `docs/CONVENTIONS.md`, no
  `docs/architecture/components` and no `docs/research/` capture, which
  are the three things its readers resolve. It was run anyway and is
  green. The gate reports **12 derived readers across 4 suites**, a
  census of **130** docs-shaped sites in 22 files, and **0 frontmatter
  issues**.

## Suites, every number derived here, exits read unpiped

`${PIPESTATUS[0]}` is EMPTY in zsh; every exit below came off its own `$?`
on an unpiped command captured on the very next token — **and the COUNT
was read as well as the exit**, because an exit alone cannot tell a green
suite from a suite that did not run.

- **cargo: 460 passed / 0 failed / 3 ignored, exit 0**, SUMMED over
  **SIXTEEN** `test result:` lines and DERIVED rather than read off the
  exit, lib suite **4.07s**. **GREEN FIRST TIME — no re-run, nothing
  discarded.** Up from main's 455: this merge adds test bodies, which is
  the honest reading of a moved count.
- **parser: 264/264 across 12 files, exit 0.**
- **app: `npm run build` exit 0** · **`npm test` 958/958 across 46 files,
  exit 0** — unchanged, which is `agent-store.ts` being a 0-file diff and
  no `TurnError` variant moving, CHECKED rather than claimed.
- **E2E: 146/146, exit 0**, on scratch port **15283**, **ONE run** — there
  was no second run to declare.
- **`npm run typecheck` exit 0**, **`npm run lint:docs` exit 0** run the
  way CI runs it, and **`npm run lint:tokens` exit 0** at **TOKEN 132 /
  CONTROL 699**. **CONTROL is 699 here against 694 at T-107's
  checkpoint** — the corpus is `git ls-files`, so it grows with every
  tracked file main gains, and this merge's four new markdown files plus
  main's own new cards account for the move. **Derive it at your own ref;
  it is not a constant**, and the dispatch brief's quoted band of 691–694
  was already below the tree by the time it was read.
- **BOTH KNOWN CARGO INTERMITTENTS WERE READ BY NAME**, not inferred from
  a green exit: `startup_arm_watches_the_initial_root` `ok`,
  `a_hostile_session_id…` `ok`.
- **EVERY SUITE RAN AT THE MERGE, AND THE THREE THE CHECKPOINT ITSELF
  OWES RAN AGAIN AFTER ITS DOC WRITES** (T-081-s9) — asked of the gate
  rather than predicted.

**THE "RE-RUN AFTER THE DOC WRITES" RULE BITES ON THE FILE SET, NOT ON THE
PROSE, and this merge is on the biting side of it.** **NO SUITE IN THIS
REPOSITORY READS `docs/STATE.md`'s CONTENT** — the two `docs`-wide readers
(`shell-frame.spec.ts`, `window-contract.spec.ts`) `walk()` the tree and
consume the FILE LIST, and every by-name occurrence of `docs/STATE.md` in
`app/test/**` and `tools/e2e/**` is a synthetic genesis FIXTURE path. So a
content-only edit to STATE cannot move any suite's answer — but this merge
ADDS FOUR FILES under `docs/`, which can, which is why the docs gate was
run on the merged set rather than on the branch's.

## The board, derived from disk at this checkpoint

**233 flat task files — 87 done / 38 planned / 41 parked / 64 suggested /
0 verifying / 3 building; 26 in `rejected/`.**
87 + 38 + 41 + 64 + 0 + 3 = 233. T-102's stamp moves done from 86 to 87
and verifying from 1 to 0.

**THE BOARD MOVED UNDER THIS CHECKPOINT AND THE MOVES WERE NOT ITS OWN:**
`T-128` arrived as a new `planned` card, `T-127` was amended in place,
and `T-010-s8` was promoted to **`T-129`** (`suggested` −1, `building`
+1, flat total unchanged at 233). **Re-derive from disk; this census is a
reading at a moment, and the moment had three other authors in it.**

**THE `building` COUNT OF THREE IS THE BOARD'S NUMBER AND NOT THE LANE
LIST'S** — four lanes hold fences after this checkpoint, two of them read
`planned` on main, and `T-129` reads `building` with no lane at all. Read
the lane section above.

**THE SUGGESTION BACKLOG IS SIXTY-FOUR AND THE LAST TRIAGE WAS THE
TENTH.** This merge added **FOUR**. `T-102-s1` and `T-102-s2` should be
read together — one is *the cap is private so the rule cannot name it*
and the other is *making a bound honest costs the disclosure*; they are
the two halves of one joint, and `T-102-s4` is the instance that proves
the rule was written too broadly. **THEY ARE NOT TRIAGED HERE:**
disposition belongs to a triage pass, not to an integrator (T-083's
ruling), so all four stay `status: suggested` exactly as filed.

## Documents ticked

- **ROADMAP — ticked.** T-102 gets a paragraph in milestone 3's progress
  section, immediately after T-107's, because it continues the same
  T-069 → T-081 → T-101 → T-113 → T-107 lineage those paragraphs are
  about. It records the discriminator reading the forgeable half of its
  own evidence, the second flag refused in writing rather than built, the
  family of seven replaced and proved from both ends, the criterion
  declined on evidence with the decline enforced, and the universal that
  ships false and routed.
- **ARCHITECTURE — updated at C-14's entry, and NOT at the components
  table.** The table's rows stop at C-07, so no row's status moved, which
  was checked rather than assumed. The C-14 paragraph records the flag
  rename and why the rename is part of the finding, the one-flag refusal
  with its split condition, the seven-for-eleven replacement measured
  from both ends, the criterion-8 decline and the visible/silent
  truncation asymmetry behind it, the false universal with its
  disposition, and the graph movement — **+7 symbols, edges UNMOVED,
  files unmoved, all three changed files inside C-14, so no component
  relation moves and the registry still stops at C-14.**
  **ONE IN-PLACE CORRECTION BEYOND THIS MERGE'S SUBJECT**: C-07's row
  asserted in the PRESENT TENSE that the committed graph *is* 890 866
  bytes — a figure from T-010's merge that every regen since has moved
  and no checkpoint has updated. It is now stamped with its ref and
  carries the current reading (**923 899 bytes, 92.39%, 76 101 bytes of
  headroom** at `a9ed33d`) plus the instruction to derive it. T-101's
  correct-in-place precedent, applied to a number instead of a tense.
- **NO NEW ADR, and that is derived rather than skipped.** The two
  non-obvious decisions — one flag rather than two for the auth
  discriminator, and refusing to lower a bound because losing to the log
  cap is what makes a truncation VISIBLE — are both COMPONENT-level
  rulings, and each is already recorded in three places a reader will
  actually meet: at the declaration in `runner.rs`, in the card, and in
  ARCHITECTURE. That is the precedent T-101's suppression-keying ruling
  and T-107's refusal-to-guess both took. Nothing here supersedes or
  amends ADR-001–017.
- **CONVENTIONS — NOT TOUCHED**, by the merge or by this checkpoint. No
  sentence in it is falsified by T-102.
- **The card** is stamped `done` with the five fields, written with em
  dashes because a colon-space in a YAML plain scalar opens a nested
  mapping and has broken a card three times. It also carries an
  `## Integration` section. **The lane's implementation notes and the
  verifier's verdict are preserved byte-untouched** — including the
  drafter's note marked *"remove before landing"*, which is deliberately
  LEFT: criterion 5 CITES it (*"the note above already orders that"*), so
  removing it breaks a live cross-reference inside a now-`done` card's
  acceptance criteria. Whoever removes it owes criterion 5 a rewrite.
- **`T-102-s1`…`T-102-s4` stay as filed** (`status: suggested`).

## Provenance — SELF-DECLARED, never read off a trailer

T-102 is **built by `claude-opus-5` and verified by `claude-opus-5`**, and
integrated by a third hand that did neither. **`review: same-model` IS NOT
A WEAKER VERDICT HERE, and T-104's ruling SEVEN is why**: the independence
that pays is INFORMATIONAL, not model diversity — the model string is
provenance and the BLINDNESS is the guarantee. This pass earned it
literally: **the card was read at the BASE ref `c4c15c8` — the copy
carrying the drafter's note and the architect's amendment and NOT the
executor's notes — and the sixteen-mutant set was derived from the
CRITERIA and written down before `tests/agent_runner.rs` was opened.**
Producer-side only, each mutant read back with `git diff` before its run,
restores proved by sha256. The notes were opened afterwards only to check
the EVIDENCE half. **The `Co-Authored-By` trailer on this lane's commits
is a harness constant and is NOT evidence of a model** — T-085 proved it
and T-101 sharpened the proof with a counterexample inside one session.

**87 done cards — 64 `same-model`, 17 `self-verified`, 5 `independent`, 1
EMPTY (T-056)**; 64 + 17 + 5 + 1 = 87. T-102 moves `same-model` from 63
to 64.

### **THE VERDICT'S MECHANISM WAS WRONG AND IT IS RECORDED RATHER THAN QUIETLY REPAIRED**

**The verifier committed its verdict by repointing the shared branch ref
with raw `git update-ref` from an unrelated detached worktree, twice,
instead of committing inside the lane's worktree.** The damage is bounded
and was re-verified here rather than taken on report: `935a78d` **is** an
ancestor of `d12efac` (exit 0), so the lane's work is intact; the one
discarded commit `c0ff888` was the verifier's OWN first verdict commit
and survives in the reflog; and the lane worktree's index had gone one
commit stale, showing a spurious staged delete and a modify, repaired by
the dispatching pass with `git reset --hard d12efac` after confirming
nothing would be lost. It read **0 dirty paths, HEAD `d12efac`** when
this integrator arrived.

**THE RULE IT EARNS BELONGS WITH THE METHOD RATHER THAN BURIED IN A
VERDICT: a verifier commits its verdict IN the lane's worktree, or in its
own checkout of that branch — never by repointing a shared ref from
elsewhere**, because the ref is shared state and every other holder's
index silently goes stale. **Routed to `T-104`**, the rulings vehicle,
which already owes a v0.1.6 method bump. **The verification was NOT
re-run**: its substance was checked and is sound; the mechanism was
wrong, not the finding. Read it beside `T-128`, which is the same class
from three other directions in the same session.

## What ACTUALLY reached the human's running app

**Port 1420 was read with `lsof -nP -iTCP:1420 -sTCP:LISTEN` and nothing
else** — no bind, no connect, no signal, on any interface. Holder `node`
pid **88948**, one socket `TCP [::1]:1420 (LISTEN)`, read at **15:52:42**
BEFORE the merge and again at **16:00:56** after it and after the boot
gate; the app binary is pid **89201**, started **2026-08-25 10:54:33**,
unchanged throughout, read with the **anchored** match
`ps -eo pid,lstart,command | awk '$NF=="target/debug/nputer"'`.
**A pid, a port holder and a start time are live-environment facts, so
these are stated with the time they were read and are already stale for
you.**

**RULE 1's TRIGGER NEVER FIRED, WHICH IS BETTER THAN A REFUSAL AND IS
STATED AS THE DERIVATION IT IS**: all three `node_modules` trees, both
`dist/` directories and `target/` were already present in this checkout,
each checked individually, so no fresh dependency install was owed at any
point. **No `npm ci` was run.** Had one been owed, the CHECKOUT test is
what decides — `lsof -p 88948` puts the holder's cwd at
`/Users/ujju/Projects/nputer-app/app`, a DIFFERENT checkout, so it would
have been permitted rather than refused. That is `integrator.md` rule 1
applied rather than CONVENTIONS' DETECT AND REFUSE paragraph quoted;
those two are still different facts and the repair is still item 3 below,
**unwritten after FOUR consecutive merges performed it by hand**.

**NOTHING FROM THIS MERGE REACHED THE APP'S CODE, AND THE REASON IS
STRUCTURAL RATHER THAN A TRIGGER THAT DID NOT FIRE.** The window serves
from `/Users/ujju/Projects/nputer-app`, detached at `c4cfe52`, an
**ancestor** of this merge — re-verified at exit **0**. **This matters at
this merge specifically**, because this diff touches
`app/src-tauri/**`, which on the ordinary single-checkout setup is the
trigger set that REBUILDS AND RELAUNCHES the binary — a new pid and a new
start time — rather than the `app/src/**` set that goes to vite HMR. The
pid and start time above are the measurement that it did not happen, and
the second checkout is the only reason.

**WHAT DID REACH @HUMAN IS THE FOUNDING DEMO WORKING.** The app RUNS from
the pinned checkout but OPENS `/Users/ujju/Projects/nputer` as its
project, so this merge's board changes — a card moving to `done`, four
new suggestion files — land in the watched folder live. Code and watched
folder are independent, which is the property @human's ruling preserves.

**No process from this integration survives.** Scratch ports **15283**
(e2e) and **15284** (boot gate) were each `lsof`-read FIRST (zero rows),
then bind-confirmed free on `127.0.0.1`, `0.0.0.0`, `::1` and `::` in
that order and never the reverse, with a probe this session **wrote
itself** into **its own named scratch directory** rather than trusting
one by name out of the shared scratch root. Both were free again
afterwards, and the boot check's captured process group **2971** was
confirmed gone. **No `pkill`. No `npm ci`. No `cargo clean`. No
`git update-ref`, no force-push, no history rewriting** — and be precise
rather than claiming more than is true: this integration's `cargo test`,
the graph gate, the regen and the boot check all WROTE to main's
`app/src-tauri/target/`, which reads **2.9 GB**, as any cargo run must.
What was not done is a reclaim or a clean, and nothing contended for it.
No sibling worktree was entered or modified. **The untracked zero-byte
file `z`** still sits in the main checkout — not this integrator's, not
this merge's, not staged, **left alone for the sixteenth checkpoint
running**. No path was staged by wildcard; `git add -A` was never used,
and it would have staged three gitlinks.

**THREE STALE `fake_agent` PROCESSES FROM OTHER LANES ARE RUNNING AND ARE
NOT THIS MERGE'S** — two out of `/Users/ujju/Projects/nputer-T-060` and
two out of `/Users/ujju/Projects/nputer/tools/nputer-T-052`, the latter
being one of the three worktrees CONVENTIONS records as wrongly cut
INSIDE the tree. They are named here because integrator rule 4 says an
unexplained process or file in a shared checkout is evidence, and **left
alone**: the process is not this integrator's to end.

## In progress / broken right now

**NOTHING IS BROKEN.** Four lanes hold fences — **T-033**, **T-091**,
**T-108** and **T-116** — and **`T-091` IS APPROVED AT `1e134b1` AND
WAITING FOR AN INTEGRATOR**, which makes it the next thing to land.
`T-129` is stamped `building` on main with no worktree yet.
`app-agent` was released by this checkpoint. `git branch` still lists
every lane this repo has ever run, which is the intended asymmetry: the
BRANCH is kept and only the WORKTREE is removed.

**T-033 IS STILL THE ONE TO WATCH: ITS LANDING UNBLOCKS THREE CARDS.**
T-125, T-126 and T-111 are all `status: planned` and all wait on it —
T-033 holds `docs/architecture/components/`, `lib-parser`, `app-map` and
`app-shell` between them, which is every fence those three need. It is
also the lane holding the fence `T-107-s4` needs (`app/test/**` is C-05
`app-shell`), so T-107's missing pin cannot be written until T-033 lands.

## Next up

1. **`T-091` IS APPROVED AND UNINTEGRATED.** It is the only card in that
   state and it holds `[tools/e2e]`, which is also the fence
   `T-120-s3` needs. Land it before dispatching into that tree.
2. **`T-120-s3` IS STILL THE ONE TO DISPATCH FIRST AMONG THE UNBUILT**,
   and it is one token of code. EIGHTH checkpoint running at the top of
   this list. Fence `[tools/e2e]`, **held by T-091** — so it waits, or it
   rides that lane. THREE passes have caught it with the fractional
   millisecond.
3. **THE FRESH-INSTALL DETECTOR NEEDS ONE MORE STEP, AND THIS IS THE
   FOURTH CONSECUTIVE INTEGRATION TO PERFORM THE FIX BY HAND WITHOUT
   WRITING IT DOWN.** CONVENTIONS' DETECT AND REFUSE paragraph tests the
   PORT; `integrator.md` rule 1 governs the CHECKOUT; since @human's app
   moved to its own checkout those are two different facts and the
   literal procedure refuses forever in main. **The repair is one step —
   `lsof -p <pid>` for the holder's cwd, compared against the checkout
   you are installing into.** Fence `[docs/CONVENTIONS.md]`, **free**.
   Cheapest fix on this list, and now shares a seat with item 4.
4. **`T-128` — FOUR SILENT CORRUPTIONS OF SHARED STATE**, filed this
   session by the architect, `planned`, fence `[method/,
   docs/CONVENTIONS.md]`. **This checkpoint is its fifth instance and its
   first from the READ side**: `git show HEAD:<path>` re-baselining under
   a concurrent commit (top of this file). Read it with the
   `git update-ref` rule under Provenance above — same class, and
   `T-104` is where the method half lands. **Items 3 and 4 share a
   fence**, so one lane can take both.
5. **`T-102-s4` — THE `Activity` LABEL REACHES THE WEBVIEW THROUGH NO
   BOUND AT ALL**, while the same field on the denial path is capped at
   128 bytes and stripped. It is also the instance that falsifies the
   universal T-102 shipped, so the narrow comment repair should ride it.
   Fence `[app-agent]`, **free as of this checkpoint**. Read it beside
   `T-102-s1` and `T-102-s2`.
6. **`T-086-s1` + `T-102-s3` — THE HOSTILE-SESSION-ID BODY IS LIVE AT
   ~1-IN-19** and now has a data point from a FRESH worktree with a SMALL
   target dir, which is where the slow-checkout hypothesis said it would
   not fire. Two findings, one body — read them together. Fence
   `[app-agent]`, **free**.
7. **`T-107-s4` — THE PIN THAT COULD NOT BE WRITTEN.** The body exists,
   ready to paste, measured green then red twice by two independent
   passes. It needs `app/test/**`, which is C-05 `app-shell`, **held by
   T-033**. Until it lands, deleting T-107's whole behaviour leaves the
   tree green. Read it beside **`T-110-s9`**.
8. **`T-124-s1` — THE HALF OF T-124 THAT DID NOT LAND**, for **T-104**'s
   owed v0.1.6 method bump. T-052 routed a second item to the same seat,
   and this checkpoint routes a THIRD — the `git update-ref` rule. The
   debt is per-VERSION, not per-change, so one three-file commit
   discharges T-089's, T-124's, T-052's and T-102's residual together.
   T-104 also carries the standing ruling on S-card verification.
9. **THE BOARD-TRUTH RULING** — EIGHTH ask, and this checkpoint is the
   first to observe the window with **NO LANE AT ALL** (`T-129`,
   `building` on main, no worktree). Three dispositions, none free: stamp
   on the integration branch at handoff; drop the field and read phase
   from the lane set; or keep it and document it as lane-local. **The
   second now has evidence from three different shapes.** It wants a
   ruling, not a ninth observation.
10. **`T-110-s1` — THE LANE READER IS BUILT AND NOT WIRED.** `lib.rs`
    declares no `pub mod dispatch;`, so the shipped binary does not carry
    the module and `cargo build` is not a gate on it. **The commit that
    takes it DELETES the test shim**, which also drains the D2 bucket.
    Fence `app-shell`, **held by T-033**.
11. **THE GRAPH IS AT 92.39% OF ITS CEILING** with **76 101 bytes** of
    headroom — it went UP again at this merge — and **nothing reports
    that number**. ARCHITECTURE's C-07 row now carries it WITH ITS REF
    rather than in the present tense, but it is still a transcription and
    will go stale at the next regen.
12. **THE SUGGESTION BACKLOG IS SIXTY-FOUR AND WANTS AN ELEVENTH
    TRIAGE.** This merge added four. **The narrow repair for T-102's
    false universal has no carrier at all** — a triage pass should give
    it one rather than leaving it in this file.
13. **`T-111` IS `planned` AND ITS THREE FINDINGS ARE STILL FRESH**:
    `[app-board]` cannot hold a pin, and **C-11 is claimed by both
    `app-board` and `app-shell`, so those two fences were never
    disjoint**. Read `T-111-s1` and `T-111-s2` before cutting the next
    overlapping pair.
14. **`T-052-s1` — THE FRESH-INSTALL REFUSAL COULD BE A GATE** rather
    than a ritual each session performs from prose. Read it together with
    item 3.
15. **A PATTERN COUNT IN THE FOUR WALKS TABLE STILL HAS NO OWNER**
    (carried from T-079's checkpoint, undischarged). The walk table's
    TOKEN row still enumerates `P1–P4` plus `P6` with nothing deriving
    it.
16. **The GNU `xargs` column still closes at the first push**, and
    `git remote` still returns zero remotes.
