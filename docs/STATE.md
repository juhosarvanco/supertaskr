# State

Updated: 2026-08-17 by integrator (T-053 merged), claude-opus-5 @fresh

## Just completed

**T-053 — id aliasing across all three id spaces.** Size S, six
criteria, `lib-parser`. Built by `claude-opus-5 @fresh`, verified by
`claude-opus-5 @fresh`, `review: same-model`, **APPROVED first pass**.
16 files, +1,133 / −24. Merge **`baaf199`**.

**THE PARSER STOPS TRUSTING ZERO PADDING ANYWHERE, NOT JUST IN THE
REGISTRY.** T-030 shipped `aliased-id` for components: `C-05` and
`C-005` are one registry slot spelled twice, the strings differ so
`duplicate-id` correctly stays silent, and every consumer that reasons
NUMERICALLY then resolves the tie by an accident of padding. The
criterion scoped it to components, and components were the one id space
the board does not render. **`T-01`/`T-001` and `F-1`/`F-01` were legal
and unchecked** — the card's own four-file reproduction went through the
branch-point parser at **zero issues**, producing two feature columns
for what a human reads as one feature and a `blocked_by: [T-01]` that
silently resolves to whichever spelling matches.

**THE GROUPING NOW EXISTS ONCE.** `lib/parser/src/id-slot.ts` holds
`idSlotKey` and `aliasedIdSlots`; `component.ts`, `validate.ts` and
`roadmap.ts` call it and own only their message and their `space`. The
`bySlot` loop is GONE from `parseComponentSet` rather than copied —
three copies of a slot key are three chances to disagree about what an
id is.

**TWO PROPERTIES ARE LOAD-BEARING AND BOTH ARE EASY TO LOSE.** The
strip is **TEXTUAL, never `Number()`** — T-030's stated reason carried
forward, so two genuinely different ids past 2^53 cannot false-alias
because floating point ran out of room. And **every digit run is
canonicalized separately with its separators kept**, which is what the
task space needs: a `-sN` suffix is part of the IDENTITY, so `T-01-s1`
and `T-001-s1` alias, `T-01-s01` and `T-01-s1` alias, and **`T-01` and
`T-01-s1` do NOT**. A suffix-blind key silently merges a suggestion into
its parent task, which is a worse bug than the aliasing this module
exists to report.

**THE UNION GAINED A FIELD, NOT THREE KINDS**, and the reasoning is
recorded in the card because criterion 5 asked for it: `aliased-id`
keeps one kind and gains a REQUIRED `space: IdSpace`. That is the shape
`dangling-reference` and `duplicate-id` already use, the root cause is
ONE concept in three spaces, and a new required field breaks the
compiler at every construction site where a new KIND would fall silently
through an exhaustive `switch`.

## The evidence that makes it trustworthy

**THE VERIFIER RE-DERIVED RATHER THAN TRUSTED, and that is the whole
reason the verdict is worth anything.** It did not read the executor's
evidence and agree with it — it built its own. Its own **28-body poison
sweep** (28 red, **zero collateral**, all three touched suites restored
**sha256-identical**). Its own **four discriminating mutants** against
`idSlotKey`, because a poison sweep proves a body RUNS and this card's
traps are about a body being WRONG: a `Number()`-keyed build reds 4, a
suffix-blind key reds 9, a strip-every-zero key reds 11, and identity
reds 23. Its own fixtures for **all four `-sN` suffix cases**. And its
own suite runs **unpiped** — it caught the executor piping through
`tail`, which hides an exit code behind a pipeline's status, and re-ran
everything rather than accept the numbers.

**DO NOT CITE THE LIVE-TREE SMOKE TEST AS THE REASON THE SUFFIX CASE IS
SAFE** — the verifier asked for this specifically and it is carried
here. Mutant (b)'s "and the smoke test reds" is a true observation about
ONE tree whose contents just swung hard: **58 suffixed task ids on the
branch, 16 on main after the third triage**. Its power as a control is
contingent on tree contents, so it is not a standing guarantee. **The
unit pins are the actual guard.**

**THE CARD'S ONE INTERNAL CONTRADICTION WAS RULED, NOT ABSORBED.**
Criterion 1 ("T-030's four pins SHALL pass untouched") and criterion 5
("the issue SHALL say which id space it is about") cannot both be obeyed
literally — either discriminator changes the object
`component.test.ts:395` asserts with a whole-object `toEqual`. The
executor took the field, tightened that ONE pin by one line, left the
three BEHAVIOUR pins byte-untouched (proved by a one-hunk diff), and
**said so out loud** under "What contradicts the card" rather than
quietly reconciling a fixture. Read criterion 1 as "the component
DETECTION behaviour is unchanged" and it is fully met; read it literally
and it is unmeetable.

**THE STATUS STAMP THE CARD REFUSED TO WRITE, and the card's own
subject caught it.** The hand-off asked for `status: built`, which is
not one of TASK-FORMAT's eight. Writing it produced an `invalid-field`
on THAT FILE, reddened the live-tree smoke test and took the tree from
0 issues to 1 — **the exact failure mode this task exists to prevent,
arriving through the task's own stamp.** Left at `building` for the
integrator, correctly.

## THE MERGE ITSELF

**CLEAN, and the clean case has a proof the conflicted one cannot.**
Merge **`baaf199`**, merge-base **`5995ac7`**, main before at
**`2dd9ea5`**. `git merge-tree --write-tree` was run FIRST and predicted
tree **`b4c09ed1`**; the merged tree **IS `b4c09ed1`, byte-equal** — so
the merge introduced nothing beyond the two parents' contents.

**BOTH SIDES ENUMERATED BEFORE MERGING, and main had moved a long way.**
**16 branch files against 83 main-side**, and **`comm -12` returns
ZERO**. Main's 83 are the third triage: **12 added cards (T-054…T-065),
47 deletions, 23 modifications, 1 `git mv` into `docs/tasks/rejected/`**
— and **81 of the 83 are under `docs/tasks/`**, the other two being
`docs/CONVENTIONS.md` and `docs/STATE.md`. **ZERO main-side files under
`lib/`, `app/`, `tools/` or `method/`.** The triage never touched
T-053's card (verified: `git log 5995ac7..2dd9ea5 -- docs/tasks/T-053*`
returns nothing), which is exactly where T-014's conflict lived.
`2dd9ea5..HEAD` is **exactly the branch's 16 files** and nothing else;
`git diff --check` clean.

**THE VERIFIER LEFT NO COMMIT, and that is worth saying plainly.** The
branch tip `05046ef` is the EXECUTOR's last commit; `## Verdicts` was
**empty** at merge time and all four verifier stamps were unset. The
verdict was delivered out-of-band and is **transcribed** into the card
by the integrator, marked as a transcription rather than passed off as a
first-hand signature. TASK-FORMAT makes that section the verifier's to
append, so this is a process gap, not a formatting one: **ADR-016's
two-mark set did not exist on the card until the checkpoint commit
wrote it.** Nothing was lost — the verdict's substance is recorded in
full — but a verifier session that ends without committing leaves the
integrator transcribing hearsay, and the next one should commit before
it dies.

## The graph regen

STANDING INTEGRATOR PRACTICE (T-009-s1), **TWENTY-SEVENTH** exercise.

**FIRED and NOT a no-op**: 11 `.ts` files outside `docs/`. Order per
`ceaa949` — regen to MEASURE, then the fixture edits, then the FINAL
regen, because the fixtures are themselves indexed files. **Confirmed
necessary live again**: the sha moved from `7a7757bf` (measuring) to
`aed3fe28` (final) purely because of the fixture edits.

**The graph:** **107 → 109 files**, **853 → 857 symbols**, **1315 →
1325 edges** (import **+5**, call **+4**, type_ref **+1**), 497,426 →
**500,788 bytes**. Languages still `["ts"]`. Final sha256
**`aed3fe2850a640ee17408a5f605fdcb2b243857f9e5f894c0129988e3ece3e85`**.
**DETERMINISM PROVED**: two consecutive regens byte-identical (`cmp`
exit 0). Plain non-golden self-check with `NPUTER_UPDATE_GOLDEN`
confirmed **UNSET at the shell**: `self_graph_is_current … ok`, exit 0.
Cross-checked with the SECOND instrument: `nputer-index index --check`
→ `graph.json is CURRENT (500788 bytes, 109 files, 857 symbols, 1325
edges)`, exit 0. **Two independent instruments, both green.**

**Operational note for the next regen**: run from `app/src-tauri/`,
`index --check` resolves `docs/architecture/graph.json` relative to the
CWD and reports it **MISSING** (exit 1) unless you pass
`--root <repo>`. That is a false red, not a stale graph — it cost one
confused minute here.

**NOTHING BUT C-06 MOVED, and that was DERIVED rather than hoped.** Two
new file nodes, both C-06's: `lib/parser/src/id-slot.ts` (loc 99, 3
symbols — `idSlotKey`, `aliasedIdSlots` and the unexported
`compareIdSpellings`) and `lib/parser/test/id-slot.test.ts` (loc 110, 0
symbols). **The first time since T-008 that C-06 moves at all**, and the
first regen in the log whose moving component is neither C-05 nor C-12
nor C-13. All **ten** new edges are C-06-INTERNAL or C-06→package —
three src imports of `id-slot.ts`, the suite's two, four `call` edges
into `aliasedIdSlots`/`idSlotKey`, one `type_ref` `ParseIssue`→`IdSpace`
— so **no component PAIR is created or grown**: findings, all six D1
`fileEdges` lists, the 30-row relation table with its 13/8/9 tally,
every observedCount, every drift ring and C-12's `files` array are
**byte-identical**. Only `types.ts` moves a symbol count, 20 → 21.
Mapping **107 → 109** with **C-06 21 → 23** the only per-component move.

**THREE ASSERTIONS MOVED PLUS ONE `it()` NAME, and the forecast was
COMPLETE** — the first time in six merges the forecast has not come up
short. Derived from the added-file list and the registry glob BEFORE
anything was run: the size check and the `["C-06", 21] → 23` row in
`architecture-dogfood.test.ts`, and the index hint `107 → 109` in
`map-dogfood-render.test.tsx`. **The C-06 row is the SECOND assertion in
the same `it()` body as the size check**, so a red hides it — the trap
that cost T-048 and T-049 a row each and T-027 its tenth assertion. It
was caught by derivation, not by failure output.

**T-024's three-fixtures rule does NOT fire, VERIFIED rather than
assumed** — T-053 declares no component and edits no registry file, so
`lib/parser/test/smoke.test.ts` is deliberately untouched. That
verification mattered more than usual here: this is a **lib-parser**
branch, so the one pin the rule protects lives in the very package the
branch edits.

**THE T-027 MERGE LEFT NO TOP-OF-FILE RECONCILIATION BLOCK, and it is
restored here.** `architecture-dogfood.test.ts` carries a dated log of
every regen; T-042's is the twenty-fourth and the next entry was this
one. Two are missing between them, for OPPOSITE reasons: the
twenty-fifth (T-014's merge) **fired and was a verified no-op** — a
Rust-only crate against `languages: ["ts"]`, graph unmoved at
`88e1daf6` — so it correctly left nothing, exactly like T-045's. The
twenty-sixth (T-027's) **moved the graph 100→107 and ten assertions with
it**, and recorded the whole reconciliation inline at the assertion
sites and in its commit message instead. Both halves of that record are
intact and nothing was lost, but **the top-of-file log is the instrument
the next integrator reads before touching a body**, so the gap is named
and the log is unbroken again.

## The gates — one fired, one did not, and both are news

**"The merge's diff" is `<main-before>..HEAD`, and it is now WRITTEN
DOWN** (`docs/CONVENTIONS.md`, commit `98f931e`) after six consecutive
integrators derived it the hard way. Used deliberately here.

**GRAPH REGEN: FIRED, ran, green.** Trigger from `2dd9ea5..HEAD` = **11
`.ts` files outside `docs/`**, every one under `lib/parser/**`.

**BOOT GATE (T-046): DID NOT FIRE, and that is stated rather than
skipped.** Trigger set computed from `2dd9ea5..HEAD`: **`app/src-tauri/**`
= 0 files · `app/src/**` = 0 files · `app/package.json` = not present ·
`app/src-tauri/Cargo.toml` = not present.** The merge's 16 files are 11
under `lib/parser/**` and 5 under `docs/tasks/`. **Zero of the four
trigger classes.** A gate that does not fire is news too; silence is
not.

**A NEW SHAPE OF THE `<main-before>` WRINKLE, and the first of its
kind.** At the previous four merges the naive `<merge-base>..HEAD`
derivation returned a WIDER TRIGGER SET. Here it returns the **same**
trigger sets — 11 graph-trigger files and 0 boot-trigger files by both
derivations — because main's whole window was `docs/`-only. What
diverges is the HEADLINE: **16 files by the correct rule against 99 by
the naive one.** So the rule's value this time is not which gate fires
but **what the checkpoint claims the merge touched**: the naive figure
would have said a parser-only merge rewrote 83 task cards and the
backlog. That is the failure mode the CONVENTIONS bullet names, arriving
without any gate hinging on it.

**CI STILL HAS NEVER GATED GRAPH CURRENCY.** `ci.yml:127` is bare
`cargo test`, which skips `#[ignore]`d tests, and `self_graph_is_current`
is `#[ignore]`d — a stale graph passes CI green, because the dogfood
fixtures assert against the COMMITTED graph and a stale graph plus
fixtures matching it agree perfectly. **Twenty-seven regens have been
held up by a written ritual and conscientious integrators, nothing
else.** T-054 closes it and is still undispatched. Until it lands the
T-009-s1 ritual is not a formality and skipping it is caught by nothing.

## WHAT THIS MERGE DID TO THE HUMAN'S RUNNING APP

**RECORDED DELIBERATELY, because the practice of saying so is being
ratified rather than left to conscience.** The app was running out of
the MAIN checkout throughout this merge — `node` pid 81894 on
`[::1]:1420`, the architect's `npm run tauri dev` from ~05:30.

**IT WAS DISTURBED, in exactly one way, and the disturbance is T-052's
instance 5.** `app/node_modules/@nputer/parser` is a **symlink** to
`../../../lib/parser`, and that package's `exports` point at `dist/`. So
`npm run build` in `lib/parser` — required by ADR-011 and allowed —
**changed what the RUNNING app parses with, without a single file under
`app/` being touched.** Measured: dist went 44 → 48 files, rolled-up
sha256 `4ea9421b…` → `c1c0e34a…`, the four additions being
`id-slot.{js,d.ts,js.map,d.ts.map}`. **Expected and harmless here** —
the live tree carries **zero** parser issues before and after, so the
app's board reads identically — but it is a real write into a running
process's dependency graph and the next lane should assume it, not
rediscover it.

**WHAT WAS NOT DONE, and why.** **No `npm ci` or `npm install` was run
anywhere in `/Users/ujju/Projects/nputer`.** All five suites ran against
the EXISTING `node_modules`. A fresh install in this checkout removes
`node_modules` under the human's live vite and kills the app — T-052's
mechanism B, nine instances, and it has already happened once. **The
fresh-install proof was relocated** to a scratch `git worktree` at the
merged commit, per the shape `docs/STATE.md` now prescribes; both sets
of numbers are below.

**1420 was never bound, connected to or signalled.** The only
interaction at any point was read-only `lsof`, run at session start,
before the parser build, before the e2e lane and after everything —
listener present and healthy every time. The e2e lane took scratch port
**14771** (probed free, chosen away from 14520/14610/14611/14653/15131,
every port the other lanes have used tonight). Afterwards: 14771 and
14772 empty, 1420 still held by pid 81894. `pgrep` finds one
`tauri dev` tree — **pids 81703/81705/81720, the architect's, i.e. the
human's app, NOT a stray of this merge.**

## SUITES ON MERGED MAIN

ADR-011 order, all re-run first-hand, **every expectation DERIVED from
the merged parents** rather than inherited from either side, **never
piped through `tail`**, exit codes read from `$?`:

- **lib/parser** `npm run build` exit 0 + `npx tsc --noEmit` exit 0 +
  `npx vitest run` → **225/225 (11 files)**, exit 0. **DERIVED: main's
  197 in 10 files + the branch's 28 new tests in 1 new file = 225 in 11**
  — and the 28 split exactly as the poison sweep counted them
  (id-slot 10, validate +10, roadmap +8; `component.test.ts` stays 54,
  because the one-line tightening added no test).
- **app** `npx tsc --noEmit` exit 0, `npm run build` exit 0, `npx vitest
  run` → **718/718 (38 files)**, exit 0. **DERIVED: main's 718/38 + the
  branch's ZERO app tests = 718/38**, and the three fixture numbers this
  merge changed add no test. Bundle **`index-Ch0Gpkv4.js` (484.43 kB)**
  and `index-DSR1ACex.css` (43.30 kB) — the bundle hash MOVED from
  main's `index-GxM6iwW9.js` because the app bundles the parser, and it
  reproduces the executor's hash exactly, which is a cross-check worth
  having.
- **app/src-tauri** bare `cargo test` → **299 passed + 3 ignored, 0
  failed**, exit 0, **zero compiler warnings**, summed across **13 test
  binaries + 2 doc-test targets**
  (108/0/0/32+1/123/0/7/13/3/7/0+1/2+1/4/0/0). **DERIVED: main's 299 +
  the branch's ZERO Rust = 299.**
- **tools/e2e** `npm run typecheck` exit 0 + `NPUTER_E2E_PORT=14771 npm
  test` → **60 passed in 10.0 s**, headless chromium, one worker,
  retries 0, **no skips, no retries, no flakes**. 60 on main + 0 = 60.
- **`npm run lint:tokens`** → `clean (107 files scanned under app/src,
  app/test, tools/e2e)`, exit 0, **ZERO allowlist**. **DERIVED as
  UNCHANGED at 107**, which is the interesting derivation here: the
  merge adds two `.ts` files and **neither is under a walk root** —
  `lib/parser/**` is outside `app/src`, `app/test` and `tools/e2e`
  entirely. `-- --selftest` → **49 samples green, 14 walk-policy checks
  green**.

**THE T-052-COMPLIANT FRESH-INSTALL PROOF**, run in a scratch
`git worktree` at the merged commit so that main's `node_modules` was
never removed under the running app — see "Health of the tree" below
for the numbers, which reproduce the five suites above from `npm ci`.

## INTEGRATOR JUDGMENT CALLS, recorded

- **ARCHITECTURE: EDITED, one row — C-06's.** The discriminator says
  this changes what a component IS: the row already carries T-030's
  strictness clause, and T-053 is its direct continuation (it promotes
  T-030-s3), so leaving it would leave a reader consulting the row
  believing aliasing is component-only — **precisely the false belief
  this task exists to correct**. The added clause states the lift, the
  two load-bearing properties, the `-sN` rule, the field-not-three-kinds
  choice, and the zero app-side change. Checked before editing per the
  standing correction: C-06 **does** have a row (the table stops at
  C-07), and nothing else in ARCHITECTURE — the Code-layout bullet, the
  Map-data bullet, ADR-015's addendum — makes a claim T-053 falsifies.
- **ROADMAP: NOT EDITED, deliberately.** The established discriminator
  ("does the task add a USER CAPABILITY") is not close. T-053's new
  issues fire on **no real tree** — every task id's base number here is
  three digits and the live tree parses at zero issues before and after
  — and **T-053-s1 records that an aliased slot names itself nowhere in
  the UI**: it raises the board's issue COUNT and the details strip
  lists only per-file parse failures. A user gains a counter that
  increments in a situation that does not occur. Writing a Progress
  entry for that would be overclaiming, in a file whose recent entries
  are careful to say "the honest reading of it is narrow". F-02's
  backbone line is unaffected. **The value of this card is
  forward-looking and it is recorded on the card, not the roadmap**: the
  interview now writes ROADMAP.md and task files with a language model
  choosing id spellings, so the trap goes live exactly when the product
  starts working.
- **THE REGISTRY: NOT EDITED**, and nothing asked it to be — T-053
  declares no component.
- **NO NEW ADR (three-prong).** (a) T-053's one real decision — a field
  versus three kinds — is RULED and recorded where it belongs, in the
  card's "The union shape" section with five numbered reasons, and it is
  an application of an existing house shape (`dangling-reference`,
  `duplicate-id`) rather than a new one. (b) Prong two verified
  MECHANICALLY: the merge is **zero Rust**, **zero app/src**, **zero
  IPC**, **zero new grants** (`acl_pin.rs` re-pins the 92-grant set
  green inside the 299), **zero new dependencies** and **zero manifest
  lines** — `app/src-tauri/**`, `capabilities/**`, `app/src/**` and
  every manifest/lockfile are 0-file diffs. ADR-011 holds (the family is
  untouched). ADR-003 holds — **no model call was made**, and none was
  possible: zero Rust and no runner path in the diff. ADR-009 holds and
  was EXERCISED: `aliasedIdSlots` keys a `Map` and never an object
  literal, with the reason in its doc. ADR-014/ADR-015 hold and were
  exercised (committed, deterministic, proved current by two
  instruments). ADR-016 holds **as of the checkpoint commit** — see the
  verifier-left-no-commit note above. The register ends at **ADR-017**.
  (c) Prong three: the durable calls live in the card's criteria→
  evidence map, its union-shape section, its "What contradicts the card"
  list and the transcribed verdict.
- **THE TASK FILE'S STAMPS WERE INCOMPLETE** on the branch, unusually —
  `status: building → done` plus **all three verifier marks**
  (`verifier`, `verified_by`, `review: same-model`) plus the whole
  `## Verdicts` entry were written at the checkpoint. Parser-validated
  before and after: **0 issues both times**.
- **T-053-s2 WAS APPENDED TO, NOT DUPLICATED**, at the verifier's
  request: the same NaN comparator governs the ordering of T-053's own
  `aliased-id.ids` array in the component space, so past 309 digits the
  reported spelling order is implementation-defined too — **not a
  regression**, being byte-identical to T-030's pre-existing
  `sort(compareComponentIds)` at that site. **Reproduced first-hand**
  rather than transcribed (`Infinity - Infinity` is NaN, `NaN !== 0` is
  true, so the string fallback is never reached), which turned up one
  more thing now recorded there: **`aliasedIdSlots`'s doc comment
  defends its `compare` argument by claiming any numeric-first
  comparator "has already degenerated to" string order, and that claim
  is FALSE in exactly the range the suggestion describes.** The comment
  states as a guarantee the one thing the suggestion says is not
  guaranteed.
- **THE CONTROL-BYTE HABIT WAS RUN AND IS CLEAN.** `file(1)` over every
  file this merge wrote: all text, **none classified `data`**; a C0 scan
  excluding tab and newline returns **0 bytes** in all four. Nothing
  requiring escape construction was written, so no generator script was
  needed. The habit is now nine-for-nine.
- **THE SHARED-INDEX HAZARD did not recur.** `git diff --cached --stat`
  was checked before **both** commits and the staged set was exactly
  this session's each time. Three other agents were live throughout.
  House shape held: **merge → checkpoint**, two commits.

## In progress / broken right now

**TWO LANES ARE LIVE.** Worktrees are open — if this session dies, they
are the first thing to look at:

    ../nputer-T-028   task/T-028-crescendo   from e41dd16   built; an agent is live in it
    ../nputer-T-051   task/T-051-window      from e41dd16   VERIFIED APPROVED — READY TO MERGE

**BOTH LANES MOVED WHILE THIS MERGE WAS RUNNING**, so this block is
measured at the checkpoint rather than inherited from the last baton:

- **T-028** — milestone 3's closer (lens→board handoff, timed
  completion, the rain), carrying T-027-s1's refocus fix as a sixth
  criterion. Its branch reached **`2a9d124` "(4/4): the card stamped,
  the notes written, four suggestions filed"**, so the executor is DONE
  and the card sits at `building` — the house's executor hand-off state,
  the same one T-053 arrived in. **An agent is working in that worktree
  right now**: `app/src/lib/watcher-store.ts` is modified and
  uncommitted. Do not assume the branch tip is the whole lane.
- **T-051** — the window the split fits in (~1280×840 + minimums),
  human-approved, confined to `tauri.conf.json`'s window block.
  **VERIFIED APPROVED during this merge** — `8a1cdbb`, "every criterion
  re-derived, the 229px discrepancy resolved to fixture row count, 1024
  attacked and held; **s5–s9 filed**". Its worktree is CLEAN and its
  boot gate re-fired green on scratch port 15189. **It is the next thing
  ready to merge.**
- **T-053's worktree is removed and its branch KEPT.**

**A CROSS-LANE COLLISION IS FILED — read `T-051-s6` before scheduling
either merge.** Summarized here so it cannot die with that session, and
flagged rather than acted on: **T-028 and T-051 were built concurrently
on OVERLAPPING `touches`**
(T-051 `[app-shell]`, T-028 `[app-interview, app-shell]`, both cut from
`e41dd16`), which TASK-FORMAT's parallelism guardrail says never
happens. T-028 puts a board/lens switch inside the `genesis-pane-slot`
that T-051's new `tools/e2e/tests/window-contract.spec.ts` measures, and
T-028's own fixture note says the full streak tree "no longer renders
the lens at all" — so two assertions in the window spec name a testid
`BoardCrescendo` does not render and **red on a string mismatch, not on
anything about the window**. Whichever merges second inherits the red.
**This is another session's uncommitted work product, quoted as
evidence; nothing was changed in that worktree.**

**T-029 is deliberately NOT dispatched**: it shares `app/src/genesis/`
with T-028 and reuses T-028's completion detection, so it wants T-028
landed first, not merged against.

**T-054 is written and still NOT dispatched.** It is the card that makes
CI gate graph currency, and the gate it closes has never existed. It is
the strongest pre-condition of a quiet week on this list.

**THE THIRD TRIAGE IS APPLIED AND STANDS.** It opened at **66 files**
and closed at **16, every one PARKED with a dated trigger to unpark**:

    66 open  →  37 promoted · 12 folded · 16 parked · 1 rejected
                 1 removed as already-absorbed

**THE SUGGESTED COUNT WAS ZERO FOR EXACTLY ONE MERGE.** That was the
first time in the project's history, and T-053 files **four** — s1
(aliases raise the board's count and name themselves nowhere), s2 (the
NaN comparator, now with the doc-comment finding appended), s3
(`duplicate-id` is now the only id-space issue with no structural
discriminator — its sibling just got one, which is what makes it
visible), s4 (the REFERENCE side of the same trap: `blocked_by: [T-01]`
against a declared `T-001` says "no task declares it" while a
numerically equal id sits one file away). **None is dispositioned; they
are the next triage's.** s3 is the interesting one — it is a finding
CREATED by this merge's own ruling.

**THIRTEEN CARDS WERE CREATED at the triage**, every one a CLUSTER
rather than a card per finding: **T-053** (now DONE) and **T-054** are
the architect's; the analyst authored eleven — **T-055** one answer to
what content is · **T-056** the transcript stops re-rendering itself ·
**T-057** assertions that cannot fail · **T-058** the tree stays
searchable · **T-059** the two joins cannot quietly disagree · **T-060**
the resolver trusts nothing it did not just prove · **T-061** the boot
gate cleans up · **T-062** the frame holds everywhere · **T-063** a
startup that fails says so · **T-064** the switch tells one story ·
**T-065** one wire, one shape. **None is dispatched.** Grant 3 covers
applying the triage, not dispatching what it creates.

**THE CONTROL-BYTE HAZARD stands at THIRTEEN reproductions across five
sessions**, one of them inside the card describing the mechanism. The
habit is now nine-for-nine and it found nothing this merge. Still no
gate; T-058 owns it, and its `docs/**` coverage gap is named on the card
(three of the thirteen instances are markdown, and the gate walks source
trees only).

## Next up (1–4)

1. **DISPATCH ORDER, and T-053 has changed one thing about it.** The
   analyst's ranking still stands, but **T-053 is no longer "must merge
   right after T-028"** — it merged first, and that is fine: the reason
   it was queued behind T-028 was that T-028 makes a PLANNER write task
   files, so the first model-authored ids might land before the check
   that catches an alias. **The check is now on main, so that race is
   closed in the safe direction.**
   - **Before T-029 goes out**: its three folds are already applied to
     its card (T-027-s2, T-039-s3, T-047-s3). **T-054** is the other
     pre-condition of a quiet week — it closes a gate that has never
     existed. **T-063** is the only item in the whole backlog with a real
     user report attached, and the report could not describe itself.
   - **T-028 and T-051 both want an integrator, and T-051-s6 says the
     order matters.** Whoever goes second inherits the window-spec red;
     it is a fixture reconciliation, not a defect, but it must be
     forecast rather than discovered.
   - **Milestone-4-adjacent**: **T-055 is now UNBLOCKED behind T-053**
     in lib-parser (the lane is free again); T-057, T-058, T-059
     (`blocked_by: [T-033]`, and it DISSOLVES if that ruling moves
     `arch` to the Node CLI), T-062 (`blocked_by: [T-051]`), T-065.
   - **Launch-prep**: **T-060** — STATE has recorded NO STANDING
     SECURITY GATE since T-025-s6 closed at T-039, and this is the
     sharpest open set: a probe arm that executes a relative path the
     cache gate refuses, a `$SHELL` that picks which program runs, and a
     suite where nothing structurally stops a test spawning the real
     CLI, which already happened once. Then **T-061** (a demonstrated
     orphaned listener, one forgotten env var from 1420) and **T-064**.
   - **Still un-homed, and NOT one of the 66**: the
     **Tailwind/`app/src-tauri` finding** from T-014's merge — a Rust
     identifier is in the shipped CSS and no gate can see the directory.
     It has no suggestion file and never did. **T-058 is its natural
     neighbour** (both are "the walk policy IS the gate"), so fold it
     there or file it, but do not let a fourth triage lose it.
2. **@human — THE MORNING'S AGENDA. The app IS running; the architect
   relaunched it at ~05:30 out of main**, and this merge left it running.
   You pick up everything at once: T-042's genesis truthfulness, T-014's
   23 CSS bytes, and **T-027's entire screen**.
   **READ THIS BEFORE OPENING A GENESIS FOLDER.** The interview
   auto-starts on arrival, and on this machine the CLI login is revoked
   — so the first turn fails, and the failure is a DEAD END rather than
   a diagnosis. Traced end to end and recorded in T-029's notes: the CLI
   exits 1, which types as `ExitNonZero`; this failure carries NOTHING
   on stderr; `failureDetail` returns null on an empty detail and
   `FailureBlock` renders the detail span only when non-null. **So the
   screen says exactly "the planner exited with code 1", shows no detail
   at all, and offers a Try again button that will fail identically
   forever.** Nothing points at the login. Run `claude login` first. The
   401 IS already parsed (`runner.rs:896-902` emits a Diagnostic
   carrying it) and routed to a channel the failure block never reads —
   **the gap is delivery, not detection**, which is why T-029's
   `AuthFailed` criterion should lead that task rather than trail it.
   To reach the interview at all a folder needs NO `docs/ROADMAP.md` and
   NO `docs/tasks/*.md` (`PlanProbe::has_plan`, `docs_watch.rs:414` — an
   `ARCHITECTURE.md` alone is still genesis-eligible). There is no
   `genesis-demo` folder anywhere on disk; `mkdir` one.
   - **THE SIX T-027 VISUAL JUDGMENTS, none self-answerable, and they
     are the point of this milestone**:
     1. **The one-question-at-a-time feel** — is the current question big
        enough to be the only thing on the left?
     2. **The challenge treatment in LIGHT AND DARK.** The two new tokens
        have **no dark source in the design bundle at all** and are
        family-derived — the one place the design had to be extended
        rather than followed, so the one place your eye is the only
        authority.
     3. **The eight disclosed deviations**, especially the **line-height
        gap**: design 1.55/1.6/1.5 against the tokens' 1.43/1.45/1.41,
        read at real size. The tokens won pending your call.
     4. **The 640/lens balance at 1280 and 1440.**
     5. **THE LENS DOES NOT RENDER AT THE APP'S OWN 800×600 WINDOW.** The
        split needs ≥1024 and the configured window is smaller, so the
        shipped default shows the chat alone. **T-051 is the card that
        fixes this and it is in verification now.**
     6. **Does the header's "nputer + project path" read as the design's
        "nputer — new project"?**
   - **ONE REAL OBSERVED PLANNER TURN, on an authenticated machine** —
     still the biggest unobserved thing in the project, and the ONLY
     thing standing between milestone 3 and an honest claim. This
     machine's `claude` OAuth token is revoked, so no model call has ever
     gone through the runner. **T-025-s2 carries the exact command.**
   - **The at-a-glance amber judgment**; **the launch shot**; **T-023's
     dry-run transcript quality**; **a Linux run** (the "watch the first
     CI run" item).
   - **T-050-s2 still matters most of the older set**: escaping the
     failure screen with "Open a folder…" rather than "Try again" reaches
     a board with real content that is **silently dead**. Use "Try
     again".
   - **The six T-034 judgments**, of which **WAVE 0 IS A WALL
     (T-034-s1)** is the big one: 32 of 50 cards in one wave, a
     1440×3818 canvas in a ~600 px pane. The question is whether the lens
     is USEFUL there, not whether it is correct — correct it demonstrably
     is.
   - **The model badges should be SHORT** (T-030-s1): T-020's and
     T-024's cards should read `opus`; T-001's verified-by badge should
     read `+`, and **the judgment that is yours is that `+` is honest but
     ugly**.
   - **The header's density** (T-049's item); **T-024's pane light AND
     dark**; **T-026's front door light AND dark** (read **T-048-s4
     BEFORE T-048-s3** — s3's conclusion is wrong); the real picker
     flows; the `tauri dev` quit-the-app orphan check (T-025-s7's ~5 s
     hang is expected and harmless).
   - **The T-047-s6 stray, a decision not a look.**
     `~/.claude/projects/-private-var-folders-…-t047va-count-97806-…/` —
     outside the repo, deliberately not deleted. **Delete or keep.**
3. **MILESTONE 3 (F-03) — NOT CLAIMED, and the remainder is unchanged by
   this merge.** T-023 → T-024 → T-026 → T-037 → T-025 → T-039 → T-041 →
   T-042 → T-048 → T-049 → T-050 → T-027 are through the pipeline.
   **T-028 is built and awaiting verification; T-029 remains.** T-029 is
   worth more than its position suggests: the user's half of the
   transcript does not survive a remount or an app restart —
   `refreshGenesisStatus` rebuilds phase/turn/session but never `turns`
   — so a mid-interview reload shows an empty chat over a LIVE session.
   And beyond both: **one observed real turn**, which is the evidence the
   milestone's claim will rest on and which has never happened.
   **MILESTONE 4** carries T-010, T-013, T-015 and now **T-053 as its
   first completed card**. **T-010 is still the interesting one** — it
   makes `languages: ["ts"]` false, indexes the 44 `.rs` files, turns the
   four unclaimed ones into live unmapped-territory findings, and gives
   `arch drift` something new to say.
4. **OVERNIGHT DISPATCH GRANTS and the BACKLOG.** Grant 1 (**milestone 3
   to completion**) is what T-028 and T-029 execute; grant 2 closed at
   T-034; grant 3 (third triage applied) stands, and **tasks NEWLY
   created by triage still do NOT dispatch without the human.** Unchanged
   method rules: a second REJECTED parks a lane for the human; @human
   judgments are never self-answered; no screen control beyond the ruled
   boot check; **port 1420 is the human's, and it is OCCUPIED.**
   **LANE AVAILABILITY.** `lib-parser` is FREE again — released by this
   merge, which unblocks **T-055**, **T-031** and **T-032** (and
   **T-032 carries T-034-s7**, a criterion that reads as an instruction
   to type a control byte and **should be amended BEFORE it is built**).
   `crate-index` free (**T-010**, **T-013**, **T-015**); `app-agent`
   free (**T-043**); `app-map` free (T-013, T-015, T-032's map-badge
   half). `app-interview` and `app-shell` are held by T-028 and T-051.
   The standing app-shell queue's next named item is **T-022** (M,
   milestone 4, `blocked_by: []`), which T-034-s3 made bigger.
   **THE SIXTEEN PARKED are unmoved**, each re-checked at the third
   triage against the tree: the nine standing (T-003-s2, T-008-s1,
   T-018-s1, T-021-s1, T-025-s2 @human, T-025-s3, T-025-s4, T-026-s1,
   T-038-s1) plus seven new — T-014-s5, T-030-s1 (@human), T-034-s1
   (@human), T-034-s4 (@human), T-045-s3, T-046-s3, T-047-s2.
   **T-030-s3's unparking is the worked example of the test that moves
   them**: *what merged recently that makes this item's "not live yet"
   clause false?* T-027 shipped the interview, so an interview-written
   backbone became a real path, and the premise that had parked the item
   through two triages expired. It is now merged and done.

## Health of the tree

The T-053 worktree is removed and its branch KEPT — **38 task branches
merged now**. Main tree clean; every suite green; the token lint green
over 107 files at zero allowlist; the committed graph current and proved
so **twice, by two independent instruments**. The parser re-parses the
whole live tree at **0 issues** — the control this task's own criteria
name, and the one its `status: built` slip briefly broke.

**THE BOARD, as MAIN sees it**: **85 task files**, tally **39 done / 26
planned / 16 parked / 4 suggested / 0 building**, plus **9 in
`rejected/`**. 6 features, 11 components. **81 → 85 is T-053's four
suggestions**; **38 → 39 done and 27 → 26 planned is T-053 itself.**
Two of those 26 (T-028, T-051) are live in worktrees and flip to
`building` only on their own branches, so the board on main honestly
shows nothing in flight while two lanes are.

**THE FRESH-INSTALL PROOF, RELOCATED — and this is the shape T-052
wants.** Run in a throwaway `git worktree` at the merged commit, so
`npm ci` never went near the `node_modules` under the human's live vite.
Both sets of numbers agree exactly:

    package        in MAIN (existing node_modules)   in the scratch worktree (npm ci)
    lib/parser     225/225, 11 files                 225/225, 11 files    (55 pkgs, 0 vulns)
    app            718/718, 38 files                 718/718, 38 files    (499 pkgs, 0 vulns)
    app/src-tauri  299 passed / 3 ignored            299 passed / 3 ignored  (COLD build, 34.7s)
    tools/e2e      60 passed in 10.0s                60 passed in 10.4s   (8 pkgs, 0 vulns)
    lint:tokens    clean, 107 files                  clean, 107 files
    selftest       49 + 14 green                     49 + 14 green

**Every exit code 0 on both sides, and the app bundle hashes MATCH**
(`index-Ch0Gpkv4.js` 484.43 kB / `index-DSR1ACex.css` 43.30 kB), which
is the check that makes the two columns worth printing: an existing
`node_modules` and a lockfile-exact `npm ci` produce the same bundle
from the same tree. The worktree was created at the merge commit and
the checkpoint's uncommitted diff applied into it, so it carried the
EXACT tree this commit lands — verified by sha256 on `graph.json`,
`architecture-dogfood.test.ts` and `STATE.md` before anything ran.

**PORTS: 1420 IS OCCUPIED AND THAT IS DELIBERATE.** The architect
relaunched the app out of the MAIN checkout at ~05:30 (node pid 81894,
one listener). **Every agent tonight has been briefed to probe it
read-only and never bind, connect to or signal it**, and every lane and
verifier has honoured it — T-051's boot gate took 15131, T-053's e2e
14653, this merge's e2e 14771. No OTHER listener is bound; no stray
`tauri dev`, `vite` or boot-check process survives beyond the human's
own app. **The integrator who takes the next merge inherits T-052's
problem live**: main's `node_modules` is under a running vite, so a
fresh install there kills the app (mechanism B, nine instances). Run
installs in a scratch worktree — **that route is now walked and
documented above** — or refuse loudly. A skipped gate is news, never
silence.

**NO STANDING SECURITY GATE.** T-025-s6 closed at T-039 and nothing
replaced it. **T-053's security posture is easy to state and was
verified rather than argued**: zero Rust, zero IPC call sites, zero new
grants, zero new dependencies, zero manifest lines, and a 0-file diff
under `app/`. What it touches is a PURE function over untrusted file
content, and ADR-009 was exercised rather than assumed — the slot map is
a `Map` and never an object literal, with the reason in its doc, so a
file declaring `id: __proto__` cannot pollute a prototype through the
grouping. The sharpest open set is unchanged and still app-agent's:
**T-047-s5**, **T-047-s6**, **T-047-s4**, **T-047-s1**; beside them
**T-046-s1** and **T-041-s4**. **T-060 is the card that would close
most of it and it is undispatched.**

LAUNCH ITEM, carried forward — **watch the first CI run** (T-020).
T-053 adds **zero lane specs** and **zero CI steps** (`.github/` and
`tools/` are 0-file diffs), so the workflow is unchanged in shape. The
cautions for a Linux runner are unchanged: T-027's lane specs measure
**geometry** against a real bundle and real CSS, and font metrics and
scrollbar widths are not identical across platforms — **read T-027-s5
first if a lens-scroll assertion reds**, because that assertion is known
to have zero pixels of margin. Otherwise unchanged: the ubuntu
apt/webkit2gtk set; the three `uses:` SHA pins; the `e2e types` step
(still never executed on any runner); T-034's `map-tasks-lens-dom.test.tsx`
reading the BUILT stylesheet, so **build-then-test ORDER is
load-bearing**; T-014's nputer-index watch timings measured on FSEvents;
`cargo audit`; the xvfb boot check; and the THREE T-018 SENTINEL live
tests.

## Open questions

- **Does the BOOT GATE rule retire, and when?** Carried forward, and
  T-053 is the first merge in four to break the FIRED-and-RAN streak.
  **It is NOT the first non-fire, and finding that out is the useful
  part.** `T-030`'s merge (`59558de`) is the closest precedent — also
  lib-parser, also exactly 16 files — and it carried **zero** boot-gate
  trigger files too. But its checkpoint mentions neither "boot" nor
  "gate" **anywhere**: measured, not inferred. So the gate did not fire
  and nobody said so, which is exactly the **silence the CONVENTIONS
  bullet forbids** ("a skipped gate is news, never silence"). **T-053 is
  the first non-fire that SAYS SO**, with the trigger set enumerated in
  four measured classes. That reframes the retirement question: the
  argument against the gate was never that it costs ninety seconds, it
  is that a rule nobody records not-running is a rule that decays into
  habit. **The `<main-before>..HEAD`
  wrinkle also took a NEW shape** — see the gates section: for the first
  time both derivations agree on the trigger sets (11 and 0) and diverge
  only on the headline (16 files against 99), so the rule's value this
  time was purely in what the checkpoint CLAIMS. Left for triage.
- **Should `method/` name the class of CONVENTIONS-level pipeline
  gates?** Still LIVE and unchanged in substance:
  `method/roles/executor.md` still says only "run the test commands from
  CONVENTIONS.md until green", while four rules now share the
  trigger → command → record → IF-it-cannot-run → why shape. A method
  version bump, not an ADR.
- **What does the pipeline owe a task whose VERIFIER vanishes
  mid-flight?** **NEW, and it is the sibling of the T-050 question
  below.** T-053's verifier approved and left without committing: the
  card reached the integrator with an empty `## Verdicts` and four unset
  stamps, so ADR-016's two-mark set existed nowhere until the checkpoint
  wrote it, and the integrator transcribed a verdict rather than reading
  one. It worked because the verdict was relayed in full — but the
  record's integrity rested on a relay rather than on a commit, and
  nothing in TASK-FORMAT says the stamps are the verifier's LAST act
  rather than an optional one. The cheap fix is one clause; the
  architect's call (ADR-004).
- **When does the C0/searchability rule become a gate?** Unchanged in
  substance and still at **THIRTEEN reproductions across five sessions**,
  one of them inside the card describing the mechanism. The habit is
  **nine-for-nine**. Still no gate. T-058 owns it; the adjacent
  Tailwind/`app/src-tauri` finding argues the same way — *the walk policy
  IS the gate*.
- **Does the shared main working tree need a rule?** Carried forward
  with an **ELEVENTH face, and this is the first time the T-052
  procedure was exercised against the case it exists for.** At T-027's
  merge the probe found 1420 EMPTY, so relocating cost nothing and
  proved nothing. Here the listener was LIVE for the whole merge: no
  install ran in main, the fresh-install proof moved to a scratch
  worktree, and **the disturbance that DID happen was a different
  mechanism entirely** — `lib/parser`'s required `npm run build`
  rewriting `dist/` under the app's symlinked dependency without
  touching `app/`. T-052 names that as instance 5; it is now measured
  (44 → 48 files, sha moved) and recorded rather than left to
  conscience. **The rule this wants is not "do not install" but "say
  what you disturbed".** Method/process, so the architect's (ADR-004).
- **When does spawn hygiene become an ADR?** Unchanged: when T-047-s5
  lands.
- **Does a verifier's remedy belong in an acceptance criterion?**
  Carried forward, **TENTH data point**, and T-053's is a variant worth
  noting: the verifier did not find a defect to route, it found that
  **the CARD contradicted itself** (criteria 1 and 5 are not jointly
  satisfiable). It neither rejected nor amended — it endorsed the
  executor's ruling and its one-line pin edit, and let the disclosure
  stand in the notes. *The criteria were met; one of them was
  unmeetable as written* is a third statement beside the two this
  question already tracks. The architect's call.
- **Should a card's own numbers be treated as a claim to verify rather
  than a brief to implement?** **T-053 is the SEVENTH instance in seven
  merges, and the first where the card's error is STRUCTURAL rather than
  numeric**: `component.ts:335–355` reproduced exactly, but three of the
  card's four test citations point mid-body rather than at `it()`
  openers, and the hand-off asked for a status word that is not legal.
  **And the FORECAST WAS COMPLETE this time** — three assertions and one
  `it()` name, derived from the added-file list and the registry glob
  before anything ran, with the second-assertion-in-the-same-body trap
  caught by derivation rather than by a red. That is the first complete
  forecast in six merges, and the thing that made it complete was
  reading every `expect` in the body before touching it. Both limbs of
  the rule still want writing down: *a numeric claim is evidence to
  reproduce, AND an enumerated list of what will move is a floor rather
  than a ceiling.* Method version bump, the architect's call (ADR-004).
- **When a task retires a test, who owns the property it was reaching
  for?** Carried forward from T-045, unchanged.
- **What does the pipeline owe a task whose builder vanishes
  mid-flight?** Carried forward from T-050, unanswered — and now with a
  sibling above.
