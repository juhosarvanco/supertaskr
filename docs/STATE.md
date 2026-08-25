# State

Updated: 2026-08-25 by the T-110 integrator.

**READ THIS FIRST IF YOU ARE PICKING THE PROJECT UP: THREE LANES ARE
LIVE, THE HUMAN'S WINDOW IS PINNED TO A CHECKOUT MAIN CANNOT REACH, AND
`cargo test` REDS ABOUT 80% OF THE TIME IN THIS CHECKOUT FOR A REASON
THAT IS NOT A BUG IN ANY TEST.** Two lanes are in verification, one is
building, and every standing gate was derived and run at this merge.
Nothing on main is broken. **But two known reds will meet you before any
real defect does — read the next two sections before you debug
anything.** The second one has been mis-filed as a flake since T-088 and
this checkpoint finally measured what it actually is.

## THE THING THAT WILL COST YOU AN HOUR IF NOBODY TELLS YOU — `T-120-s3`

**`tools/e2e/tests/token-scan.spec.ts:201` IS RED EXACTLY ONCE IN EVERY
FRESH CHECKOUT, THEN GREEN FOREVER AFTER, AND RE-RUNNING IT PROVES
NOTHING.** It is still `status: suggested` and still unfixed — it is the
first item under "Next up" for the third checkpoint running.

The body captures `statSync(target)`, restores with
`utimesSync(target, clock.atime, clock.mtime)`, then asserts
`statSync(target).mtimeMs === clock.mtimeMs`. **`Stats.mtime` is a
`Date`, and a `Date` holds whole milliseconds** — so the restore writes
back a ROUNDED timestamp while the assertion compares the unrounded
float it captured. **And the failure repairs the condition that caused
it**: the `utimesSync` in the `finally` block leaves the mtime on a whole
millisecond, so the next run passes. Red once, green forever, in that
checkout.

**IT DID NOT FIRE AT THIS MERGE, AND THAT IS THE PREDICTION HOLDING
RATHER THAN THE DEFECT BEING GONE.** Main is not a fresh checkout —
something ran the body here long ago — so E2E was 146/146 first time.
It fires in exactly the places this project creates most often: a fresh
lane worktree and a fresh poison-drill worktree. **DO NOT "FIX" IT BY
RE-RUNNING UNTIL GREEN.** The fix is one token:

    - utimesSync(target, clock.atime, clock.mtime);
    + utimesSync(target, clock.atimeMs / 1000, clock.mtimeMs / 1000);

**Keep the strict `toBe`** — weakening it to whole milliseconds deletes
the property `T-079-s3` exists to defend.

## `T-088-s4` IS NOT A FLAKE. IT IS AN 8.7 GB `target/` DIRECTORY, AND THAT IS MEASURED

**`docs_watch::tests::startup_arm_watches_the_initial_root` has been
carried as a flake with a "3 red in 12" tally since T-088. It is not one.
It reds ~80% of the time in THIS checkout and ~0% everywhere else, and
the single variable is the size of the cargo target directory.**

This integration met it seven times in eight full `cargo test` runs and
refused to write it off, because three consecutive reds of one body is
exactly the shape that must not be waved through. The experiments below
each change ONE thing.

**STEP 1 — is it the merge?** `cargo test --lib` alone never builds or
runs T-110's new `dispatch_lanes` binary, and it reds by itself. `lib.rs`
declares `agent`, `docs_watch`, `churn`, `index_cmd`, `acl_pin` and
**not** `dispatch`; the merge's only `app/src-tauri/src/**` paths are
`src/dispatch/**`, which nothing compiles. Suggestive, not decisive.

**STEP 2 — same TREE, two checkouts** (interleaved, so load is
controlled; the throwaway has its own small target dir):

| checkout of `1223543` | red | test time |
|---|---|---|
| clean worktree, own target dir | **0 / 5** | 3.85–3.93s |
| main's own checkout | **4 / 5** | 8.85–15.14s |

**STEP 3 — same CHECKOUT, two target dirs.** This is the one that
names the cause. Identical source, identical checkout, identical load —
only `CARGO_TARGET_DIR` differs:

| target dir | red | test time |
|---|---|---|
| isolated (1.5 GB, fresh) | **0 / 5** | 3.82–3.93s |
| main's own, **8.7 GB** | **4 / 5** | 8.85–14.70s |

**THE LIB TEST BINARY IS BYTE-IDENTICAL ACROSS THAT TABLE AND RUNS ~4x
SLOWER**, and one body in it has a wall-clock deadline, so it is the one
that reds. `du -sh app/src-tauri/target` reads **8.7G**.

**WHY THE HISTORICAL TALLY WAS ERRATIC, EXPLAINED RATHER THAN
APOLOGISED FOR.** A lane worktree and a poison drill both start with a
small target dir and see green; main's checkout has been accumulating
since the project began and sees red. The tally moved with WHERE each
session happened to run, which is why it looked like a coin flip. **A
tally that mixes checkouts is not a flake rate.**

**AND THE MERGE IS EXONERATED BY MEASUREMENT, NOT BY REASONING** — the
same tree is 0/5 in a clean checkout. Also 0 red in 6 runs at main's
PRE-merge tip `19f93bb` in its own worktree, which is the control for the
other direction.

**DO NOT `cargo clean` MAIN'S TARGET DIRECTORY TO "FIX" THIS RIGHT NOW**
without checking `lsof` first: `target/debug/nputer` is a running binary
(pid **89201** at this checkpoint). This wants a card, not a reflex —
see "Next up".

**A SECOND, GENUINELY LOAD-DRIVEN RED, KEPT SEPARATE BECAUSE IT IS A
DIFFERENT THING.** One `npm test` from `app/` reported `1 failed | 957
passed` on `shell-frame.test.tsx > 1. the front door is bounded` —
`Test timed out in 5000ms`, vitest's own footer reading `environment
1141.99s`, at **load average 32.36 on a 10-CPU machine** while three
sibling lanes ran their own suites. Green at 958/958 before and after,
and it did not recur once load fell. **Read `uptime` before you believe a
timeout** — but do not file this one under the target-dir finding above,
because the experiments that isolate that one do not cover this.

## THE LANE LIST, DERIVED FROM `git worktree list` AT THIS COMMIT

Read as **entries on a `task/T-NNN-*` branch** — a detached entry is not
a lane (the T-089 correction in CONVENTIONS). **THERE IS NO TIP COLUMN
AND THIS IS THE SEVENTH MEASUREMENT SAYING SO**: between this
integrator's first worktree read and its last, T-052 moved `966b8dd` →
`7434f93`, and two scratch drill worktrees that existed at the merge read
were gone by the checkpoint read. **A live lane's tip is a
live-environment fact, not a function of a tree.** What is stable is
WHICH lane holds WHICH fence. For a tip, run `git worktree list`.

| lane | fence (`touches:`) | where it is |
|---|---|---|
| **T-124** | `[app-agent]` | **under verification** |
| **T-052** | `[method/, docs/CONVENTIONS.md]` | **under verification** |
| **T-033** | `[docs/architecture/components/, lib-parser, app-map, app-shell]` | building |

**ALL THREE CARDS READ `status: building` ON DISK, DERIVED HERE, AND TWO
OF THEM ARE WRONG ABOUT THEIR OWN PHASE.** `verifying` is **0** across
all 212 files. **BELIEVE THE WORKTREE AND THE ROOM, NOT THE STAMP** —
and see the board-truth question below, which T-110 is the card that
makes this gap legible.

**ONE WORKTREE THAT IS NOT A LANE, AND IT MATTERS A LOT:**

- **`/Users/ujju/Projects/nputer-app`, detached at `c4cfe52`** —
  **@human's app checkout, and the one serving port 1420.** See the
  running-app section below.
- **Detached `drill-T-NNN-*` entries — scratch worktrees belonging to
  whichever passes are running.** DO NOT QUOTE A LIST FROM HERE; the
  CLASS is recorded and the membership is `git worktree list`. Two
  existed at this integration's merge read and neither survived to its
  checkpoint read, which is the sixth and seventh data points for the
  rule one paragraph up.

**AND TWO LANE WORKTREES SIT AT NON-STANDARD PATHS**, under
`tools/nputer-T-052` and `tools/nputer-T-124` — **INSIDE the
repository**, where `method/lane-protocol.md` rule 3 asks for a sibling
directory. The dispatcher cut them with a relative path, owns the error,
and relocation is pending. **THE DISPATCH BRIEF FOR THIS MERGE SAID
THREE; IT IS TWO** — T-120's was removed at its own checkpoint, which is
the count going stale between the brief being written and the merge
running. Derive it from `git worktree list`. The visible consequence is
in `git status --short`, and it broke a standing check — see `T-120-s1`.

**`[app-dispatch]` IS FREE** as of this checkpoint, in the order lane
protocol rule 6 fixes (merge, then checkpoint, then remove). Free too:
`app-board`, `app-interview`, `crate-index`, `tools/e2e`, `.github/`.

## Just completed

**T-110 — a lane is a fact on disk, and the app reads it there.** F-04,
milestone 4, size M, `touches: [app-dispatch]`, **fence never widened**.
Main-before **`19f93bb`**, lane tip **`69cc6c9`**, merge **`1223543`**,
this checkpoint after it. `built_by: claude-opus-5 @T-110 (rebuilt twice
after rejections)`; **three verification passes**, `review: same-model`.

**WHAT THE APP CAN DO NOW THAT IT COULD NOT.** It can read which lanes
exist **from git's own files** — `.git/worktrees/*/gitdir` and `*/HEAD` —
with **no subprocess**, returning a typed
`{task_id, branch, worktree_path, exists_on_disk}` per entry. The task id
is derived by a POSITIVE SHAPE (`task/T-<1..6 digits>-<slug>` matched
whole, the id BUILT from validated digits) and never by stripping a
prefix; a branch that does not match is reported as `NotALane` carrying
the reason rather than dropped. Every way the question can have no answer
gets its own named refusal — `NotAGitRepository`, `GitIsAFile`,
`NoWorktreesDirectory`, `WorktreesUnreadable` — so **an empty list never
means two different things**.

**THE DISAGREEMENT IS THE PRODUCT, NOT A BUG.** The board's `status:` and
the worktree list are joined, and their four combinations are named and
each is driven by its own pin: a lane that **DIED** (stamped in flight,
no worktree — the shape a killed lane leaves, and the one nothing in the
tree could previously see), a dispatch that **SKIPPED THE STAMP**
(worktree, no stamp — the lapse T-089 documented), a **LIVE** lane
(both), and **NOT DISPATCHED** (neither). A board that renders only one
of the two inputs can report neither failure. The lane table three
sections up and its "two of them are wrong about their own phase" note is
exactly the disagreement this card exists to make machine-readable.

**IT UNBLOCKS `T-111`** (the board says what is dispatchable) **and
`T-112`** (a card hands you its brief) — F-04's remaining slice.

**ONE DISCLOSED DEFECT SHIPS WITH IT, AND IT IS IN THE RECORD RATHER
THAN IN A COMMENT.** `lib.rs` declares no `pub mod dispatch;`, so **the
shipped app binary does not compile this module** — it reaches the
compiler only through the two-line `#[path]` shim at
`app/src-tauri/tests/dispatch_lanes.rs`. That is not an oversight: `lib.rs`
is C-05's `app-shell`, the fence is C-15's two paths, and widening from
inside the lane is the one repair `method/roles/executor.md` says an
executor may never make. Measured rather than reasoned — a hard type
error planted in `lanes.rs` leaves `cargo build` at **exit 0**. The
wiring is `T-110-s1`, and it is the suggestion that makes the other
twelve reachable.

## THE CARD'S HISTORY IS ITS VALUE — THREE BUILDS, THREE VERDICTS, ONE WAIVER

**This card was rejected twice and merged on a third pass under an
explicit @human waiver.** All three passes' notes and all three verdicts
are on the card, byte-untouched (T-101's precedent: a record that erases
what was rejected erases the evidence of why).

1. **REJECTED — criterion 4 had no pin.** The four states were built in
   TypeScript, which no suite in this repository imports; four
   one-sided producer mutants survived a green suite at 940/940. The
   repair was a PLACEMENT change, not a redesign: the join moved into
   `app/src-tauri/src/dispatch/join.rs`, C-15's own path, where a pin can
   reach it. The fence was not widened.
2. **REJECTED — a security defect.** `read_small` used `fs::metadata`,
   which **follows symlinks**, so a symlinked `gitdir` was chased and an
   unrelated file's contents were `Serialize`d onto a `Lane` bound for the
   board. **That tripped the method's two-rejection stop condition**;
   `docs/rooms/t110-second-rejection.md` is `status: resolved` and carries
   @human's ruling of 2026-08-25 — *"waive T-110 once"* — plus the
   amendment it prompted (**`T-104` ruling EIGHT**: the stop condition
   must WEIGH rejections rather than COUNT them, so a card is not punished
   for being verified thoroughly. A third rejection remains terminal.)
3. **APPROVED**, and the third pass found the defect was **worse than
   every document recorded**. Two things, both new:
   - **The forgery is COMPLETE.** The second verdict pointed its symlink
     at a credentials file, so the forged row carried a `worktree_path`
     that was visibly not a path and `exists_on_disk: false`. Point it at
     a target that is **small and well-formed** and you get a lane the
     board renders as live, on disk, **indistinguishable from a real
     one**. The bad case is not "a secret leaks onto a row" — it is "a
     secret leaks onto a row that looks correct".
   - **The sibling leaks too, and nobody had run it.** `read_small` is
     called TWICE. The `HEAD` call site is the sharper half: an unrelated
     file's contents decide the **BRANCH**, and therefore the **TASK ID**.
     A `gitdir` follow forges *where* a lane is; a `HEAD` follow forges
     *which card it belongs to*.

### THE FIX IS NOT "TWO TOKENS", AND THREE DOCUMENTS STILL SAY IT IS

**The room, the second verdict and this merge's own dispatch brief all
describe the repair as a two-token change** — `fs::metadata` →
`fs::symlink_metadata`. **That is one half of it.** The third verifier's
mutant **M5 removes the `is_file()` gate while KEEPING
`symlink_metadata`, and both symlink bodies go RED**: the read would
otherwise follow the link by the other door. The stat is one half; the
gate is the other, and **a fix pinned only at the stat is reopenable in
silence.** The third pass took both and pinned both. Recorded here
because the three documents that describe it have not been corrected, and
a reader who takes "two tokens" at face value will under-review the next
fix of this shape.

**AND THE POLICY EXISTED AT FOUR SITES, WAS WRONG AT ONE, AND WAS PINNED
AT NONE.** The third pass's drill flipped each of the three *correct*
`symlink_metadata` checks to `metadata` — the `.git` check, the
`.git/worktrees` check, the entry-directory check — and **all three
survived a green suite**. They were right by accident of authorship.
Closing only the site the verdict named would have shipped a correct fix
resting on three unguarded lines. All four are now pinned, by a commit
that changes **no producer line at all** — assertions only.

**THE RUNG THAT FAILED TWICE, WORTH THE SPACE.** The FIRST verification
symlinked a `gitdir` at a 2.4 MB file, watched `GitdirTooLarge` refuse it
and concluded *"the bound holds through the symlink — Correct."* **The
SIZE bound stopped that fixture before the symlink policy ran at all.**
That is CONVENTIONS' *"A NEGATIVE ASSERTION NEEDS A POSITIVE CONTROL"*
failing **inside a security sweep**, which is the most expensive place
for it to fail. Both shipped bodies are now built so it cannot recur:
the target is small and well-formed, its length is ASSERTED under
`MAX_METADATA_BYTES` in the body, and **the same bytes written as a real
file are asserted ACCEPTED as a complete `Lane` one entry away in the
same scan** — so the refusal is provably a refusal of the SYMLINK.

## A BOARD-TRUTH QUESTION THE ARCHITECT OWES A RULING ON

**`verifying` reads 0 on the board while two lanes are genuinely in
verification** — T-124 and T-052 both carry `status: building`. The
mechanism is now understood rather than merely observed: **an executor
stamps `verifying` in its LANE, and that stamp only reaches main at the
merge.** So the field is not "unused"; it is *structurally unobservable
from main for the entire window it is supposed to describe*.

This is precisely the intent-vs-reality gap T-110 exists to expose, which
is why it is a question and not a complaint: the card's own four states
call a live worktree under a `building` stamp **LIVE**, and a live
worktree under a `verifying` stamp **LIVE** too (`IN_FLIGHT_STATUSES` is
`building | verifying | merging`, a disclosed judgement — the lane
protocol keeps the worktree alive past the handoff, so scoring it
`StampSkipped` would make the board cry wolf on its healthiest lane).
**So the join is already correct under either answer**, and the ruling is
about what the BOARD should claim, not about what the reader should do.

Three dispositions, none of them free:

1. **The stamp moves on the integration branch at handoff**, the way
   T-089 has the architect stamp `building` before the cut. Costs a write
   to main per handoff by whoever is holding the lane.
2. **The field goes**, and phase is read from the lane set — which is
   what T-110 now makes possible and T-111 would render.
3. **It stays and is documented as lane-local**, i.e. main's copy is
   knowingly one merge behind.

**Three checkpoints have now recorded this** (T-120's, T-079's and this
one). It wants a ruling rather than a fourth observation.

## Ranges, every dot count stated, at their own refs

**MAIN ADVANCED 120 PATHS UNDER THIS LANE** — the lane was cut at
`d46f71f` and held open across many merges, which is what makes the
forbidden form so wrong below.

    git merge-tree --write-tree 19f93bb 69cc6c9 -> tree 43530533…, exit 0 (read from $? FIRST)
    git diff --name-only 19f93bb <TREE>                        ->  20   THE PRESCRIBED PRE-MERGE FORM
    git diff --name-only 19f93bb..1223543  (THE MERGE'S DIFF)  ->  20   the only one that means anything
    git diff --name-only 19f93bb...69cc6c9 (THREE dots)        ->  20
    git diff --name-only d46f71f..69cc6c9  (branch-only, TWO)  ->  20
    git diff --name-only 19f93bb..69cc6c9  (TWO dots, FORBIDDEN)   -> 140
    git diff --name-only d46f71f..1223543  (merge-base, FORBIDDEN) -> 140
    git diff --name-only d46f71f..19f93bb  (main's advance)        -> 120

**THE FORBIDDEN FORMS OVERSTATE BY 120 PATHS — 7.0x — AND BOTH ARE PURE
LEFT-ENDPOINT DRIFT.** Main advanced **120**, the branch **20**,
`comm -12` over the sorted lists is **EMPTY**, and 120 + 20 = 140 — the
arithmetic that proves the sets disjoint. T-120 measured **1.2x** on the
same mistake ten days ago and wrote down why the ratio is not the signal:
*"a lane held open for ten minutes and one held open for six hours
produce wildly different numbers from the SAME mistake."* **This is that
sentence's other end** — the widest gap this project has recorded, from a
lane held open across three rejections. **The left endpoint is the
signal; the ratio is weather.**

**THE FORECAST TREE IS THE MERGE'S TREE, BYTE FOR BYTE.**
`merge-tree --write-tree` returned
`43530533cdf713acaca7acefc8b068cf577629a7` before the merge and
`git rev-parse HEAD^{tree}` returns the same afterwards. Parents are
`19f93bb` and `69cc6c9` and nothing else; **NOTHING WAS WRITTEN INTO THE
MERGE COMMIT.**

**THE TWO TOOLS WANT OPPOSITE THINGS, AND THIS INTEGRATION USED EACH
WHERE IT BELONGS.** `git merge-tree` reads **COMMITS** — it cannot see an
index, so staging a file before measuring buys nothing. The DOCS GATE
reads **TRACKED files** — so new doc files must be `git add`ed before it
can see them (`T-010-s10`). At this merge the docs were already committed
by the merge itself, so the gate saw all 14 without staging; the
checkpoint's own doc writes were staged before their gate run.

## THREE standing gates — DERIVED from the merge's own 20 paths

| gate | trigger | on these 20 |
|---|---|---|
| GRAPH REGEN | `*.ts/*.tsx/*.js/*.jsx` **or `*.rs`** outside `docs/` | **6 — FIRES** |
| BOOT GATE | `app/src-tauri/**`, `app/src/**`, either manifest | **6 — FIRES** |
| DOCS GATE | a `docs/` path a code suite reads | **14 — FIRES**, three suites |

- **GRAPH REGEN — FIRES on SIX paths**, not the five the third verdict
  recorded. Both gates take the same six here (four `dispatch/*.rs`,
  `tests/dispatch_lanes.rs`, `dispatch-store.ts`), and the verdict's
  *"5 of 19 are `.rs`/`.ts` outside `docs/`"* undercounts its own list by
  one — the `app/` half of that diff was six paths, not five. The
  conclusion is unchanged and the gate was run. **ASKED, never predicted.**
- **BOOT GATE — FIRES, 6 of 20. RUN, exit 0** on scratch port **15191**,
  both startup lines observed: `[nputer] project folder:
  /Users/ujju/Projects/nputer` and `[nputer] window "main" created`.
- **DOCS GATE — exit 1**, invoked DIRECTLY from the repo root with the
  merged paths as ROOT-RELATIVE arguments, **never through `xargs`**.
  **14 of 20 under `docs/`, THREE suites owed** — `npm test from app/`,
  `npm test from tools/e2e/`, `npx vitest run from lib/parser/` — all
  three run and green, at the merge and again after this checkpoint's doc
  writes. The gate reports **12 derived readers across 4 suites**, a
  census of 129 sites in 22 files, and **0 frontmatter issues**; every
  live card's frontmatter parses with a legal status.
  **`cargo test from app/src-tauri/` is NOT owed by this diff** — its
  three readers are `docs/architecture/components`, `docs/CONVENTIONS.md`
  and a research capture, and none of them is among the 20 — and it was
  run anyway, four times, because this merge changes Rust.

## THE REGEN — the largest this repository has taken, and the endpoints agree three ways

**`NPUTER_UPDATE_GOLDEN=1 cargo test -p nputer-index --test self_graph -- --ignored`**, committed WITH this checkpoint.

| | bytes | files | symbols | edges |
|---|---|---|---|---|
| committed (main at `19f93bb`) | 895 891 | 172 | 1889 | 1849 |
| fresh at the merge | **918 406** | **178** | **1951** | **1878** |
| **DELTA** | **+22 515** | **+6** | **+62** | **+29** |

The six are named rather than counted: `dispatch/fixtures.rs`,
`dispatch/join.rs`, `dispatch/lanes.rs`, `dispatch/mod.rs`,
`tests/dispatch_lanes.rs`, `app/src/lib/dispatch-store.ts`. The delta is
purely additive — nothing removed, nothing modified.

**THIS FIGURE HAS NOW BEEN DERIVED THREE TIMES BY THREE ROUTES AND
AGREES EXACTLY**: the third pass forecast it by building the predicted
tree in a throwaway; the third verifier reproduced it by `git archive`-ing
that tree and running MAIN's own indexer against it; and this integration
measured it at the real merge commit. **A forecast that survives a change
of method is worth more than one that survives a re-run.**

**`index --check` is exit 0 — CURRENT — after the regen, and again after
every doc write in this checkpoint.** That is the verdict, and it is the
ONLY thing trusted here: **T-123's integrator measured a stale graph
whose four headline figures AND byte count were identical on both sides
while the sha256 differed.** A byte count is not evidence.

**THE SIZE AGAINST BOTH CEILINGS: 918 406 of `max_graph_bytes` 1 000 000
= 91.84%, with 81 594 bytes of headroom.** Up from 89.59%. **This is the
highest this repository has ever been, and NOTHING REPORTS IT** — no
gate, no test, no line of output. A lane cut now owes its regen forecast
against **1951 symbols / 1878 edges at 918 406 bytes / 178 files**.

## THE FIXTURE RECONCILIATION — six bodies, and TWO of them hold their COUNT while their CONTENT moves

A new component gaining its first indexed files moves the live-registry
dogfood fixtures (CONVENTIONS' own gotcha). C-15 had been declared-only
since T-088; this merge gives it real files. **Every value below was
derived from a throwaway probe `it()` that PRINTS rather than asserts
(the T-088 technique), run against the regenerated graph BEFORE the suite
was run** — the probe was then deleted and its removal proved by
`git status --short -- app/test/`, not by memory. **Reconciled corrected,
never loosened.**

**`app/test/architecture-dogfood.test.ts`:**

1. *"C-15 is DECLARED-ONLY"* → **"C-15 HAS TERRITORY AT LAST"**. `files`
   `[]` → **five**; `declaredOnly` `true` → **false**; the
   `fileComponent` filter `[]` → five `"C-15"`; the `D3:C-15` finding
   → **`[]`**. Four assertions and the title. `paths`, `kind` and
   `issues` deliberately unchanged.
2. *"all 172 files map — zero unclaimed territory"* → **"all 178 files
   map — and ONE of them is unclaimed territory"**. `fileComponent.size`
   **172 → 178**; `unmappedFiles` `[]` →
   **`["app/src-tauri/tests/dispatch_lanes.rs"]`**; the UNMAPPED_ID
   lookup **`toBeUndefined()` → defined**, and it is now asserted by
   SHAPE (kind and files) so a bucket holding some other file could not
   pass. The per-component tally gains **`["C-15",5]`** and
   **`["unmapped",1]`**.
3. *"THE FINDINGS"* — **`D3:C-15` leaves and `D2:unmapped` arrives.**
4. *"drift flags land on the right nodes"* — **C-15 leaves and
   `"unmapped"` joins**; `declaredOnly` `["C-01","C-11","C-15"]` →
   **`["C-01","C-11"]`**.

**`app/test/map-dogfood-render.test.tsx`:**

5. *"renders all twelve declared components … no unmapped bucket"* —
   node count **12 → 13**, and the `unmapped` selector **inverts from
   `toBeNull()` to `not.toBeNull()`**.
6. *"the header hint reads the committed graph's scale"* — `committed
   graph · 172 files` → **178**.

**TWO OF THESE HOLD THEIR LENGTH WHILE THEIR MEMBERSHIP CHANGES, AND
THAT IS THE FINDING WORTH CARRYING FORWARD.** The findings array is
**fifteen rows before and fifteen after** — `D3:C-15` leaving and
`D2:unmapped` arriving cancel exactly. The drift array is **eight before
and eight after** — C-15 out, `unmapped` in. **A fixture that asserted
`findings.length` or `drift.length` would have been GREEN across this
merge while both ends of both lists changed.** Both are pinned as whole
arrays, which is the only reason this was visible at all.

**AND THIS REPOSITORY HAS ITS FIRST D2 FINDING.** Four separate
reconciliation blocks in that file's header say *"D2 STAYS EMPTY"*; it
stops being true here. `app/src-tauri/tests/dispatch_lanes.rs` is claimed
by no component — T-010's settlement claimed every unclaimed `.rs` file
by NAME and could not claim one that did not exist on main yet.
`docs/ARCHITECTURE.md`'s *"the D2 bucket is DRAINED"* clause is corrected
in place with the ref (T-101's precedent). **The registry repair is
`T-110-s9` and this checkpoint did NOT make it**:
`docs/architecture/components/` is **T-033's live fence tonight**. It may
never need making — the commit that takes `T-110-s1` and wires the module
properly **DELETES the shim**, draining the bucket by removing its
occupant.

**`lib/parser/test/smoke.test.ts` DOES NOT MOVE, VERIFIED RATHER THAN
ASSUMED.** T-024's three-fixture rule fires for a REGISTRY change; this
is a regen and the registry is byte-identical. Checked two ways: the
component ID list is unchanged (C-15 was declared at T-088, not here),
and the DOCS GATE's own reader table shows that suite reads
`docs/ROADMAP.md docs/architecture/components docs/tasks` and **not**
`graph.json`, so a regen cannot reach it. Green at 264/264 on both sides.

## Suites, every number derived here, exits read unpiped

`${PIPESTATUS[0]}` is EMPTY in zsh; every exit below came off its own
`$?` on an unpiped command captured on the very next token — **and the
COUNT was read as well as the exit**, because an exit alone cannot tell a
green suite from a suite that did not run. One `index --check` was run
through a pipe first and its exit **discarded and re-read unpiped**,
because a pipe's status is not the process's.

- **cargo: 452 passed / 0 failed / 3 ignored, exit 0**, summed over
  **SIXTEEN** `test result:` lines, **zero warnings**. `dispatch_lanes`
  contributes **34**. **The line count is tree-dependent and was derived,
  not quoted** — main read 15 before this merge and reads 16 after,
  because this lane adds a test target.
  **THE HONEST TALLY: eight full runs in main's checkout, ONE green and
  SEVEN red, every red the same body** — and the section at the top of
  this file shows by controlled experiment that the cause is main's
  8.7 GB target directory and not this merge, not the tree, and not the
  test. The same tree is **0 red in 5** in a clean checkout and **0 red
  in 5** in main's own checkout with an isolated target dir. Every re-run
  is declared; **none was a silent re-run to reach green**.
  **`cargo test from app/src-tauri/` is not even owed by this
  checkpoint** — it writes no Rust and none of the three docs that suite
  reads — and it was run anyway, repeatedly, because the merge changes
  Rust.
  **ONE RUN WAS DISCARDED RATHER THAN COUNTED**, and it is worth the
  line: an invocation returned **exit 101 with ZERO `test result:`
  lines** — a `cd` to the repo root left cargo with no `Cargo.toml`, and
  a build failure wears the same exit code as a test failure. **The COUNT
  is what caught it, not the exit**, which is exactly why this project
  derives both (T-124's executor caught a misread the same way).
- **app: `npm run build` exit 0, `npm test` 958/958 across 46 files, exit
  0** — before the regen, and again after the regen plus the fixture
  reconciliation.
- **parser: 264/264 across 12 files, exit 0.**
- **E2E: 146/146, exit 0**, on scratch port **15190**. `npm run
  typecheck` **0**.
- **Every suite ran AT the merge and again AFTER this checkpoint's doc
  writes** (T-081-s9). Both passes are the numbers above.

**THE SHIPPED BUNDLE DID NOT MOVE, AND THAT IS MEASURED RATHER THAN
ARGUED.** `index-CNznNhXD.js` / `index-D41xl3Gz.css` are **527.99 kB /
45.18 kB** — byte-identical filenames and sizes to T-120's checkpoint,
after a real rebuild (`git merge` bumps mtimes the way `git checkout`
does). **Nothing imports `dispatch-store.ts`**, so `tsc` typechecks it in
both programs and vite tree-shakes it out. A 314-line new frontend file
that changes the bundle by zero bytes is the honest signature of a
module that is built and not yet wired — the same fact `T-110-s1` states
from the Rust side.

## Documents ticked

- **ROADMAP — F-04 earns a paragraph, and its progress line was stale on
  BOTH halves.** It read *"1 of 2 written F-04 cards done"* and *"T-088
  … is still `planned`"*; T-088 merged long ago and the written F-04 set
  is **six** (T-088, T-089, T-110 done; T-111, T-112, T-125 planned).
  Milestone 4 carries **86** cards on disk, of which 6 are F-04 —
  the file's own *"DERIVE IT, DO NOT QUOTE IT"* hazard, caught on its own
  progress line. Corrected in place with the ref.
- **ARCHITECTURE — the D2 clause is corrected, and C-15 needs no row.**
  The Components table carries C-01…C-07 only, so C-15 has no row to
  update; the slug signpost and the derived slug map both still read
  `app-dispatch -> C-15` and neither moves. What DID move is T-010's
  *"the D2 bucket is DRAINED … `unmappedFiles: []` held without being
  relaxed"* — true when written, and refilled by the very next merge that
  added a Rust file.
- **CONVENTIONS was NOT touched, deliberately.** It is T-052's fence
  tonight.
- **The card** is stamped `done`, with `built_by`, a three-pass
  `verified_by` and `review: same-model` — **SELF-DECLARED, never read
  off a commit trailer**. All three passes' notes and all three verdicts
  are preserved byte-untouched.
- **The lane's and the verifiers' thirteen suggestion files stay as
  filed** (`T-110-s1` … `T-110-s13`).

## What ACTUALLY reached the human's running app — NOTHING, AND THE REASON IS STRUCTURAL

**Port 1420 was read with `lsof -nP -iTCP:1420 -sTCP:LISTEN` and nothing
else** — no bind, no connect, no signal, on any interface. Holder `node`
pid **88948**, one socket `TCP [::1]:1420 (LISTEN)`, unchanged before and
after. `target/debug/nputer` is pid **89201**, started 10:54:33.

**THE WINDOW IS NOT SERVING FROM THIS CHECKOUT.** It serves from
`/Users/ujju/Projects/nputer-app`, which is **detached at `c4cfe52`**.

**SO THIS MERGE CANNOT REACH IT, AND THE REASON IS NOT A RESTART
TRIGGER.** Earlier checkpoints could say "this merge did not reach the
window because neither restart trigger fired". **That reasoning does not
apply and stating it would be wrong.** The checkout is PINNED at an older
commit — `c4cfe52` is an ancestor of this merge, verified with
`git merge-base --is-ancestor` — so main is strictly ahead of it and
nothing committed to main after `c4cfe52` reaches that window **until
@human moves it**, whatever any trigger does. A session that asks "did my
change reach the app?" by checking `app/src/**` triggers gets the right
answer for the wrong reason today, and a wrong answer the moment @human
switches back. **@human's tree was not touched at any point.**

**No process from this integration survives.** Scratch ports **15190**
(e2e), **15191** (boot gate) and **15192** (the post-checkpoint e2e
re-run) were each `lsof`-read FIRST (zero rows), then bind-confirmed free
on `127.0.0.1`, `0.0.0.0`, `::1` and `::` in that order and never the
reverse, and all three were free again after. **No `pkill` at any
point.** No sibling lane worktree was touched. **The untracked zero-byte
file `z`** still sits there — not this integrator's, not staged, left
alone for the eleventh checkpoint running.

**Two throwaway worktrees were created OUTSIDE the repository and both
are removed and pruned at this commit** — `drill-T-110-integrate`
(detached at main's pre-merge tip `19f93bb`) and
`drill-T-110-integrate-post` (detached at the merge `1223543`), each with
its own `CARGO_TARGET_DIR` INSIDE itself (T-013-s7 arm (c)), both named
per-lane rather than by a shared literal (T-088-s3). They exist in the
record because they are what turned "a flake" into a measured cause.
**`target/debug/nputer` (pid 89201) was deliberately NOT disturbed**, and
main's 8.7 GB target directory was left exactly as found.

## The board, derived from disk at this checkpoint

**212 flat task files — 82 done / 39 planned / 41 parked / 47 suggested /
0 verifying / 3 building; 26 in `rejected/`.**
82 + 39 + 41 + 47 + 0 + 3 = 212. T-110's stamp moves done from 81 to 82
and verifying from 1 to 0; its thirteen suggestion files took `suggested`
from 34 to 47.

**`verifying` IS ZERO AND TWO LANES ARE IN VERIFICATION.** See the
board-truth section above — the mechanism is now named, and it wants a
ruling.

**THE SUGGESTION BACKLOG IS FORTY-SEVEN AND THE LAST TRIAGE WAS THE
SEVENTH.** T-110 contributed **thirteen** — the largest single
contribution this project has recorded — and `T-110-s1` (the wiring) is
the one that makes the rest reachable.

## Provenance — SELF-DECLARED, never read off a trailer

T-110 is **built by `claude-opus-5` across three passes and verified by
three independent `claude-opus-5` sessions**, none of which wrote the
build it judged. **The `Co-Authored-By` trailer on this lane's commits is
a harness constant and is NOT evidence of a model** — T-085 proved it and
T-101 sharpened the proof with a counterexample inside one session.

**82 done cards — 60 `same-model`, 16 `self-verified`, 5 `independent`, 1
EMPTY (T-056)**; 60 + 16 + 5 + 1 = 82. T-110 moves `same-model` from 59
to 60.

## In progress / broken right now

**NOTHING IS BROKEN.** Three lanes are live: two in verification (T-124,
T-052), one building (T-033). `[app-dispatch]` was released by this
checkpoint. `git branch` still lists every lane this repo has ever run,
which is the intended asymmetry: the BRANCH is kept and only the WORKTREE
is removed.

## Next up

1. **`T-120-s3` IS STILL THE ONE TO DISPATCH FIRST**, and it is one token
   of code. Third checkpoint running at the top of this list. Fence
   `[tools/e2e]`, free.
2. **`T-110-s1` — THE LANE READER IS BUILT AND NOT WIRED.** `lib.rs`
   declares no `pub mod dispatch;`, so the shipped binary does not carry
   the module and `cargo build` is not a gate on it. It needs
   `pub mod dispatch;` plus one zero-argument command, and **the commit
   that takes it DELETES the test shim** — which also drains the D2
   bucket. Fence `app-shell`, **held by T-033 tonight**. It unblocks
   T-111 and T-112 in practice even though they are not formally blocked.
3. **THE BOARD-TRUTH RULING on `verifying`** — three checkpoints have
   asked. Section above carries the three dispositions.
4. **`T-110-s9`** — either a component claims `app/src-tauri/tests/**` or
   `T-110-s1` lands and the question dissolves. Fence
   `docs/architecture/components/`, held by T-033.
5. **THE GRAPH IS AT 91.84% OF ITS CEILING** with 81 594 bytes of
   headroom, and **nothing reports that number**. At the rate F-04's
   remaining cards add code, this becomes a real question inside this
   milestone rather than a curiosity.
6. **`T-088-s4` WANTS RE-FILING AND THEN A ONE-LINE CARD, because it is
   not the thing it says it is.** The measurements are at the top of this
   file: main's **8.7 GB** `app/src-tauri/target` makes the lib test
   binary run ~4x slower and reds a wall-clock deadline **4 times in 5**,
   while the identical tree in the identical checkout with a fresh target
   dir is **0 in 5**. Every session that runs `cargo test` in main pays
   this, and every one of them has so far attributed it to a flake.
   Two dispositions, and the first is not free: **(a)** reclaim the
   target dir — but `lsof` FIRST, `target/debug/nputer` is a running
   binary (pid 89201 at this checkpoint) and this integrator deliberately
   did not touch it; **(b)** give the body a deadline proportional to
   what it is waiting for, which fixes the symptom in every checkout and
   is the smaller change. **This integrator did not file the card** —
   scope belongs to the architect, and filing one here would have moved
   the board counts this checkpoint derives.
7. **THE TWO MISPLACED LANE WORKTREES SHOULD BE RELOCATED** once T-052
   and T-124 finish. `lane-protocol.md` rule 3 asks for a sibling
   directory.
8. **`T-120-s1`** — the pre-write exclusivity check still cannot
   discriminate; this integration used the replacement it derives
   (`git diff --cached --name-only` plus `git diff --name-only`, both
   empty), which is what made this turn provably exclusive rather than
   judged.
9. **A PATTERN COUNT IN THE FOUR WALKS TABLE STILL HAS NO OWNER**
   (carried from T-079's checkpoint, undischarged).
10. **The GNU `xargs` column still closes at the first push**, and
    `git remote` still returns zero remotes.
11. **Outstanding: @human's T-110 waiver is SPENT.** A third rejection
    would have parked the card; the third pass was approved, so the
    waiver is discharged rather than standing. @architect holds the
    board-truth question above.
