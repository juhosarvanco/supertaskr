# State

Updated: 2026-08-19 by integrator (T-076 merged and checkpointed),
claude-opus-5 @fresh

## Just completed

**T-076 — the id layer is total, and every issue names its space.**
F-02, milestone 4, size M, `touches: [lib-parser]`. Built and verified
by `claude-opus-5 @fresh`, `review: same-model`. Approved branch tip
**`0ff4371`**; merge **`79ae34a`**. The card was at `status: verifying`
on its branch (main still read `planned`); the integrator stamped
**`done`**, following T-043's and T-057's precedent that the merge
commit carries `verifying` and the checkpoint carries `done`.

**A COMPARATOR THAT RETURNS `NaN` IS NOT A COMPARATOR.**
`compareComponentIds` compared the digit halves with
`Number(na) - Number(nb)`. Past roughly 309 digits both sides are
`Infinity`, the difference is `NaN`, and `NaN !== 0` is TRUE — so the
function RETURNED `NaN` before its string fallback could ever run. It is
the comparator the rule "first match by component id order wins" rests
on, and the one T-053 passes into `aliasedIdSlots`.

**TWO DISTINCT DEGRADATIONS FOLLOWED, AND ONLY ONE WAS ON THE CARD.**
At the sort, `Array.prototype.sort` is free to do anything and V8 leaves
the pair in ARRIVAL order — non-deterministic, and that is the half the
card named. At `component.ts:374`'s
`compareComponentIds(a.id, b.id) || (file compare)`, **`NaN` is FALSY**,
so the `||` silently swallowed it and the `ambiguous-mapping` winner was
decided by **FILE PATH** — deterministic and wrong, which is the worse
failure of the two because it looks like an answer. The executor found
the second mechanism itself and flagged it; the verifier reproduced BOTH
through the real parser at the branch point and confirmed both close at
HEAD:

    BRANCH POINT compareComponentIds(400x9, 401x9) = NaN
      sort([a,b]) lengths [402,403] · sort([b,a]) lengths [403,402]
      CASE A winner_digits 400 · CASE B winner_digits 401
      winner file C-aaa.md in BOTH · deterministic 5-for-5
    HEAD  compare = -1 | reverse = 1 | isNaN either? false
      MECH2 winner A=400 B=400 | same id? true
      MECH1 aliased ids order X = Y

**The fix is one primitive, not two.** `compareDigitRuns` over
`canonicalDigits` is the same textual strip `idSlotKey` already uses, so
the comparator and the slot key agree about what the digits of an id are
BY CONSTRUCTION rather than by coincidence. Ordering is unchanged over
an EXHAUSTIVE 1,210,000 ordered pairs of every 2- and 3-digit `C-` id,
with one declared reversal: between 2^53 and Infinity the old body was
WRONG rather than imprecise — `Number` fused 17 nines with 1e17, the
difference was 0, and the string fallback then put the 17-digit id after
the 18-digit one it is smaller than. That pair is pinned with BOTH
bodies so the direction of the change lives in the pin.

**The other two criteria close asymmetries rather than defects.**
`duplicate-id` gained a REQUIRED `space` at all four emit sites — the
shape `aliased-id` got at T-053 — so `dangling-reference` is now the
last kind in this union spanning three id spaces with no structural
discriminator (filed as `T-076-s3`). `dangling-reference` gained a
NEAR-MISS HINT at all three sites, structured `nearMiss?: string[]`
*plus* prose, so a `blocked_by: [T-01]` beside a declared `T-001` names
the id it almost matched instead of only denying it exists. The hint is
keyed by a `Map` and never an object literal (ADR-009), and
`__proto__`, `constructor` and `toString` acquire nothing — measured,
with `hasOwnProperty` false, not argued.

**NONE OF IT IS LIVE ON THIS TREE, and that is the honest frame.** The
registry stops at `C-14`; the identity gate demands two-or-more digits
and sets no upper bound, so any file anyone writes can reach the range,
but nothing in the repo does. This is a totality fix, not an incident
response.

**The best thing in the card after the second mechanism is the ORDER.**
Criterion 6 required two rulings — structured field versus prose, and
whether component `depends_on` gets the same treatment — to be made
BEFORE building. `a931bfb` (11:44:22) touches the card and nothing else,
92 lines, both rulings present; `62bec51` (11:50:42) is the first source
byte. Checkable in `git log` rather than asserted, and the verifier
checked it there.

## The seventh poison shape, which is this merge's finding with reach

**Mutant (q): inline the pre-T-076 comparator at the
`ambiguous-mapping` sort site (`component.ts:412`) ONLY, leaving
`compareComponentIds` total. It survives 263/263 at exit 0** — and it is
genuinely non-equivalent, not an equivalent mutant: rebuilt and driven,
it restores the file-path winner verbatim while the comparator itself
stays total.

**The shape is: "zero survivors" measured against a mutant set derived
from the PINS rather than from the CRITERIA.** Sixteen mutants, every
one aimed at something a pin already names; the one input class the
card's own "Flagged for the verifier" section ADMITS is unpinned was
never mutated, and it survives. **It is the dual of shape six** — shape
six is a body that kills no unique mutant, shape seven is a mutant no
body kills — **and it is worth more, because a redundant body costs
nothing while this costs the criterion.** Every mutant sweep this
project has run is vulnerable to it, which is why it belongs in the
checkpoint and not only on a card. Filed as **`T-076-s4`**, carrying the
drill-discipline remedy: derive at least one mutant from a CRITERION
with the test file closed.

`T-076-s5` is a SECOND survivor found the same way — mutant (v), the
layer order at `project.ts:202` — which makes the disk and pure layers
genuinely disagree while the deep-equal pin stays green, because that
pin is asserted against `broken-project`, a fixture with no roadmap or
component issue and therefore no way to see the difference.
**Pre-existing**, and visible only because T-076 wrote the first
assertion that the order is a contract at all.

## The five corrections the verifier made, carried rather than summarised

All five re-derived at this merge, not transcribed.

1. **FIVE pre-existing bodies moved, not four.** The notes' table lists
   four; the mechanical derivation (indent-matched `it()` block
   extraction at both revisions, set difference on body TEXT) returns
   five — the fifth is `component.test.ts` base `:349` → HEAD `:477`.
   The notes' sentence "Nothing else in any pre-existing body moved" is
   FALSE. The move itself is clean and additive-only, so this is an
   accuracy defect in the prose rather than in the work.
2. **THIRTEEN `.ts` files outside `docs/`, not twelve.** Confirmed
   independently here from the merge's own diff — seven source, six
   test — and `index --check` itself prints `~13`.
3. **`(k)`'s three reds are a PROPER SUBSET of `(i)`'s five**, so the
   notes' claim that dropping the field and dropping the sentence red
   "DIFFERENT tests" is wrong. Ruling 1's substance survives — each half
   is independently detectable, which is what "pinned as two things" has
   to mean — but the symmetry does not.
4. **`T-076-s1` UNDERSTATES ITSELF, and this correction runs in the
   card's favour.** s1 says T-076 neither created nor closed the
   parser/Rust divergence. It CLOSED part of it: Rust's `numeric_id`
   parses to `u64` and is exact to 19 digits, the pre-T-076 TypeScript
   used `Number` and was exact only to 15, so the two disagreed across
   the 16–19-digit band and now agree. T-076 **narrowed** the divergence
   to 20+ digits and changed the remainder from "two engines wrong
   differently" to "one right, one that gives up safely at `u64::MAX`".
   **It widens nothing**, and it does not trip any of ADR-015's three
   revisit triggers — not a third join, not a consumer needing an
   unanswered question, and not "the first live divergence", since the
   registry maxes at `C-14`. It belongs as an ADR-015-family follow-up
   card, never as a recorded widening.
5. **The verifier OVERRULED the executor's own confession, and this is
   the correction most worth keeping.** The notes declare
   `files.test.ts:192` an instance of shape six — a body that reds while
   killing no unique mutant. It is not. Mutant (u), swapping the
   assembly order in `parseProjectFromFiles` (`files.ts:182`), reds
   **exactly that one body in 263**. The executor searched for a killer
   only among `space` mutants and correctly found none; the body's
   SECOND assertion pins a different relation entirely — the layer order
   `files.ts:181` declares in a source comment. It earns its place on
   the ordinary ground and the notes should say so instead of
   apologising for it.

## Integration truth

T-076 and main shared base **`e4a5ae7`**. Main-before was **`76cf034`**
and the approved worktree was clean at **`0ff4371`**. Main advanced
**sixteen** paths from that base (T-043's merge plus its checkpoint);
T-076 changed **nineteen**. **Their changed-file intersection is EMPTY**,
computed with `comm -12` over the two sorted lists rather than argued
from the slugs. The read-only `merge-tree` predicted tree **`1011d256`**
before anything was written, and the no-ff merge **`79ae34a`** produced
that tree exactly, with parents `76cf034` and `0ff4371` and nothing
else.

**The merge's diff (`76cf034..79ae34a`) is NINETEEN files**: seven
`lib/parser/src`, six `lib/parser/test`, the T-076 card and its five
`T-076-s*` files. By suffix that is **6 `.md` + 13 `.ts` and nothing
else**; five are additions and fourteen modifications; `file --mime`
reports `charset=utf-8` on all nineteen. The naive `merge-base..HEAD`
derivation returns **THIRTY-FIVE** — and because the intersection is
empty, 19 + 16 = 35 exactly, which is the arithmetic check that the two
sets really are disjoint.

**The brief handed to this integration carried a stale range, and it is
worth naming because it is the same lesson twice.** It said the verifier
derived "17 paths, +1310/−37". That is true of the EXECUTOR's tip
`f531311`; the approved tip `0ff4371` is **19 paths, +1823/−40**,
because the verifier's own three verdict increments added the `T-076-s4`
and `T-076-s5` cards and +513 lines to the card. A range figure is a
figure about a COMMIT, and it goes stale the moment the branch moves —
including when the person quoting it is the one who moved it.

**The board, derived from disk at both ends.** Main-before: **106 task
files, 52 done / 28 planned / 20 parked / 6 suggested**. At this
checkpoint: **111 task files, 53 done / 27 planned / 20 parked / 11
suggested**; 53 + 27 + 20 + 11 = 111. The deltas are exactly T-076
planned→done and the five new suggestion files. Ten files sit in
`docs/tasks/rejected/` and are counted separately, as always.

**Security movement is zero, and for once it is zero by construction
rather than by comparison:** the merge's diff contains **no `.rs` file,
no manifest, no lockfile and no `.json` or `.toml` at all** — 0 paths
matched. `acl_pin.rs` is byte-identical across the merge (sha256
`8d24cbad706d9e6f09eca6888cf8a21d264039cac6153271093ea4847b60b00e`) with
**92** grants counted twice from the `EXPECTED_GRANTS` array body — 92
entry lines and 92 unique strings agreeing. The IPC surface is unchanged
at **thirteen** commands. Exactly **three** `#[ignore]` ATTRIBUTES
repo-wide (`crates/nputer-index/tests/perf.rs:53`,
`crates/nputer-index/tests/self_graph.rs:58`,
`tests/agent_runner.rs:3037`), matching the three the cargo run reports;
the other eight `git grep` hits are prose in doc comments.

## Suites, every number derived at this merge, exits read unpiped

No suite was piped through `tail`, `head` or `grep`; every command
redirected to a file and the exit code was read with `echo $?` from the
command itself.

- **parser: 263/263 across 12 files**, exit 0, `tsc --noEmit` exit 0,
  build exit 0. **The `+29` is DERIVED, not carried**: main's advance
  `e4a5ae7..76cf034` contains **zero `lib/parser` paths**, so the parser
  baseline at main-before is the base's **234/234**, and the count of
  `it()`/`test()` openers under `lib/parser/test` moves **230 → 259**
  across the merge's own diff — exactly +29, from a second direction.
- **app: 825/825 across 42 files**, exit 0, UNCHANGED; `tsc --noEmit`
  exit 0; build exit 0 with **265 modules transformed**
  (`index-DjYVlJel.js` 501.37 kB, `index-CwYF5FQb.css` 43.95 kB). The
  build is a PREREQUISITE, not a courtesy: without `app/dist` twelve
  shipped-bundle assertions fail by design.
  **And the bundle was checked STRUCTURALLY, not by its hash.** The
  content hash is identical to the branch's, which proves reproduction
  and not currency, so the shipped bundle was read: the minified
  `compareComponentIds` is
  `function Ns(n,s){…const o=IS(a,l);if(o!==0)return o…}` — delegating
  to `compareDigitRuns` — and no `Number(x)-Number(y)` survives anywhere
  in it. The change genuinely reaches the shipped app, which matters
  because `compareComponentIds` is EXPORTED and `app/src` imports it at
  `architecture/map-layout.ts:1` and `lib/architecture/derive.ts:19`.
- **bare Rust workspace: 337 passed / 0 failed / 3 ignored**, exit 0,
  summed from **fifteen** `test result:` lines: `nputer_lib` 117 ·
  `fake_agent` 0 · `nputer` 0 · `agent_runner` 60 + 1 ignored ·
  `nputer_index` lib 123 · `nputer-index` bin 0 · arch 7 · cli 13 ·
  containment 3 · golden 7 · perf 0 + 1 · self_graph 2 + 1 · watch 4 ·
  doctests 1 / 0. **The brief was WRONG here and the verifier caught
  it**, so it is re-derived at both ends rather than repeated:
  `cargo 337 + 3` is MAIN's count, not the branch point's. `#[test]`
  attributes under `app/src-tauri` number **327 at `e4a5ae7`** and
  **339 at `76cf034` and at the merge** — a +12 from T-043's Rust work,
  which is why the branch honestly reports **325 + 3** and main reports
  337 + 3. The merge's diff has zero `.rs` paths, so main's baseline
  carries unmoved.
- **E2E: 88/88**, exit 0, typecheck exit 0, scratch port **17961**
  bind-probed free with a real `net.createServer().listen()` before use
  (`17961 FREE`) and proven free again afterwards
  (`17961 FREE again`), one worker, zero retries, zero skips. The lane
  was RUN rather than argued away: the branch's own reasoning ("nothing
  under `tools/e2e` imports the parser") is sound, but this merge does
  reach the app's shipped bundle, and a lane that drives that bundle is
  cheap enough to measure.
- **token lint: TOKEN 118 / CONTROL 507**, exit 0; selftest **49 TOKEN
  samples + 2 CONTROL samples, 37 walk-policy checks**, exit 0.
- **`cargo audit -n`** (no fetch) exit 0: **0 vulnerabilities / 17
  allowed warnings** over 472 locked crates against the existing
  1,216-advisory database.

**CONTROL moves 502 → 507 and the arithmetic closes at both ends.**
Tracked files are **520** at main-before and **525** at the merge — the
five new `T-076-s*` files and nothing else — and 525 − 18 binary assets
gives **507**, which is what the shipped scanner reports. TOKEN is
unchanged at **118**, correctly: the merge adds no file under `app/src`,
`app/test` or `tools/e2e`. **Nothing pins either count**, which is what
T-058-s1 is about and what T-080 inherits.

**No `npm ci` or `npm install` ran in the main checkout** (T-052
mechanism B): every suite ran against the existing install. A
fresh-install proof was NOT taken this merge, and that is a deliberate
gap rather than an oversight — it is stated here so it is not read as
one. The last one was taken at the T-043 merge, one commit of `.md` and
`.rs` ago, and this merge moves no manifest, no lockfile and no
`package.json`: `git diff 76cf034..79ae34a` matches **zero** of them, so
there is nothing an install could resolve differently.

## The two gates, with their triggers computed

**BOOT GATE — computed, and it does NOT fire.** The trigger is
`app/src/**`, `app/src-tauri/**`, `app/package.json` or
`app/src-tauri/Cargo.toml` over **`76cf034..79ae34a`**. That set matches
**ZERO paths** — the merge is `lib/parser/**` plus `docs/tasks/**` and
nothing else — so `boot:check` was correctly not run, no window was
opened, and there is no `BOOT_EXIT` to record. **The derivation is where
this gate earns its warning**: over the naive `e4a5ae7..79ae34a` the
same filter matches **five** paths, all of them T-043's Rust, already
merged and already boot-gated at their own merge. A `merge-base`
derivation would have fired a gate on a parser-only merge. That is the
seventh consecutive integrator to have to reason this out, and the first
time the two derivations return a different ANSWER rather than a
different width — every previous merge fired on both.

**GRAPH REGEN — the trigger FIRES.** `*.ts/*.tsx/*.js/*.jsx` outside
`docs/` over the merge's diff matches **THIRTEEN** files, all under
`lib/parser/` — seven source, six test. The read-only gate was run
first and its forecast checked line by line before anything was written:

    INDEX_CHECK_EXIT=1   graph.json is STALE
      committed:   571733 bytes · 117 files · 989 symbols · 1508 edges
      fresh index: 575346 bytes · 117 files · 995 symbols · 1518 edges
      files  +0  -0  ~13
      | ~ lib/parser/src/id-slot.ts  (content, loc 99 -> 207, symbols 3 -> 8)
      edges  +14  -4

**`files +0 -0` is the load-bearing line**: no file node joins or
leaves, so C-06's dogfood file COUNT cannot move. `id-slot.ts` symbols
**3 → 8** is exactly the four new exports plus `canonicalDigits`, and
the sixth new symbol is `component.test.ts` 5 → 6, for the measured +6.
The fourteen added edges are **three file-level import pairs that
already existed** (their `symbols` lists grew — the same three pairs
appear in the −4, so not one NEW file pair) plus **eleven symbol-level
`call` edges with both ends inside `lib/parser`**, which is C-06. An
edge inside one component can create or grow no component PAIR.

**T-024's three-fixture rule does NOT fire, VERIFIED rather than
assumed.** Its trigger is DECLARING A COMPONENT
(`docs/CONVENTIONS.md:145`), and
`git diff 76cf034..79ae34a -- docs/architecture/components/` is a
**0-file diff**. No component was declared; the registry still stops at
`C-14`, which is also why `T-076-s1` cannot be a live divergence.
`lib/parser/test/smoke.test.ts` was correctly left untouched.

**The `ceaa949` order was followed and it MATTERED, measurably.** Regen
to MEASURE (`e50ba36e…` → `92190210…`, 575,346 bytes), then the fixture
edits, then a re-check that proved the edits had staled the measuring
regen — `files +0 -0 ~2`, `architecture-dogfood.test.ts` loc 1635→1680
and `map-dogfood-render.test.tsx` loc 342→354 — then the FINAL regen,
then a THIRD regen and `cmp`. **Byte-identical: the regeneration is
deterministic.** Final graph: **575,351 bytes · 117 files · 995 symbols
· 1518 edges**, sha256
`56178286e733de5cc7029cb70ec23ee48a48307e13f97ef0824734609e55abea`.
This is the **twenty-second** hold of that ordering, derived rather than
carried: the last NUMBERED hold is T-028's nineteenth and the two
entries since (T-055, T-057) each held it without an ordinal.

**T-054's standing clause, discharged by hand.** There is still no git
remote and `ci.yml` has never executed a single step, so `index --check`
as a CI gate remains true in the future tense only. The integrator ran
it: after the final regen and after every documentation edit,
`cargo run -p nputer-index -- index --check --root ../..` from
`app/src-tauri` exits **0** and reports **CURRENT**. The docs edits do
not stale it because `docs/` is `.nputerignore`d — proven by re-running
the gate after them rather than reasoned from the ignore file.

**`--root` is load-bearing, and it was demonstrated rather than quoted.**
Run from `app/src-tauri` WITHOUT it, `index --check` exits **1** and
prints a STALE headline `cmp`-identical to a real staleness report, with
`committed: MISSING at docs/architecture/graph.json` only on the SECOND
line. A reader who stops at the headline reads a false red.

## The fixture forecast, and whether it was complete

**Forecast: ZERO assertions move — and it was MEASURED before the fixture
files were opened, not sampled afterwards.** The mechanism is the one
the last nine merges converged on: a throwaway probe `it()` appended to
`architecture-dogfood.test.ts`, run once against the freshly regenerated
graph, printing in a single line every value the two dogfood fixtures
assert — so a SECOND assertion inside an already-moving body cannot hide
behind the first one's failure. It printed:

    fileComponent.size 117 · unmappedFiles []
    mapping C-05 54 / C-06 25 / C-08 10 / C-09 3 / C-10 2 /
            C-12 14 / C-13 8 / C-14 1  (= 117)
    registry 11 ids · declared 11 · placeholder 0
    relation table 32 rows — 13 confirmed / 10 undeclared / 9 planned
    C-05->C-06 observedCount 10 · its fileEdges list 10 entries
    findings: ten D1 + three D3
    drift [C-01,C-05,C-07,C-08,C-09,C-11,C-13]
    declaredOnly [C-01,C-07,C-11] · pinned [C-01]
    project issues 0 · graph issues 0

Every one identical to what the fixtures assert. **The forecast was
complete**: the only edits either fixture needed were their ledger
comments, and both dogfood files passed against the fresh graph before
and after. The probe was removed and the removal proved by **sha256
against `git show HEAD:<path>`** — `2475901a…`, matching exactly — never
by a clean `git status`, and `git grep` finds no residue.

## What ACTUALLY reached the human's running app

**Port 1420 is the human's app** — a vite listener (node pid **82549**,
up since Aug 18 03:45:46) serving this checkout. It was never bound,
connected to or signalled; read-only `lsof` only, checked at the start
and again at the end, same pid both times. Scratch port **17961** was
bind-probed free before and after the E2E lane.

1. **Their app PROCESS was NOT replaced, and this time that is the
   expected answer.** Pid **45155** (started 11:37:17) is the same
   process the last checkpoint recorded, under the same unchanged
   `tauri dev` supervisor (ppid 82364). `tauri dev` watches
   `app/src-tauri/**`, and this merge is a **0-file diff** there, so
   nothing triggered a rebuild-and-relaunch.
2. **It is still running an unlinked PRE-T-043 image, and the gap is now
   wider.** `lsof` shows pid 45155 holding inode **26762149** while the
   on-disk debug binary is inode **27086578** (rewritten 14:33:48 by
   this session's `cargo test` into the human's shared `target/`
   directory — a THIRD distinct inode; the last checkpoint measured
   26813168). On macOS, replacing a running binary does not touch the
   running process. **The window they are looking at still contains the
   pre-merge grace poll**, so the relaunch item below has not been
   discharged and has now been true across two merges.
3. **THEIR FRONTEND DID TAKE A HOT UPDATE — and this is the news, the
   opposite of the last merge.** `app/node_modules/@nputer/parser` is a
   SYMLINK to `lib/parser`, `@nputer/parser` is **not** in vite's
   optimized-deps list (`.vite/deps/_metadata.json` holds react,
   react-dom, `@tauri-apps/api/*`, class-variance-authority, clsx,
   radix-ui, tailwind-merge and yaml, and nothing else), and
   `vite.config.ts` explicitly widens `server.fs.allow` to
   `../lib/parser` with a comment that vite "resolves through the
   symlink to the real path". So `lib/parser/dist/*.js` sits in the dev
   server's LIVE module graph, and the required parser build rewrote six
   of those files at 14:31. The update is entailed by that structure;
   it was deliberately NOT confirmed by querying the server, because
   confirming it would mean connecting to port 1420. **Their board and
   map are now running T-076's comparator.**
4. **The map pane DID see a new graph** — `docs/architecture/graph.json`
   moved for the first time in three checkpoints, 571,733 → 575,351
   bytes, and it is inside the watch root.
5. **Docs-watcher snapshots.** The watcher ships a full snapshot of
   `<project>/docs` on every change, so their board re-read the tree:
   T-076 now shows `done`, five new `T-076-s*` cards appeared, and
   STATE.md and ARCHITECTURE.md moved with this checkpoint. ROADMAP.md
   did NOT — see below.
6. **No second window opened.** The boot gate did not fire, so no
   `tauri dev` was spawned and there is no flash this time.
7. **`app/dist` was rewritten** by the required pre-suite build. The dev
   server does not serve `dist` and no module in its graph imports it,
   so this is invisible to their window.

**No process from this integration survives.** Census by
`ps -Ao pid,ppid,stat,lstart,command` at the end: zero `vitest`, zero
`playwright` or `chromium`, zero `cargo` or `rustc`, zero `fake_agent`
of mine, no stray `tauri dev` and no orphaned shell; both scratch ports
free. **No broad `pkill` was used at any point.** The two `nputer-T-060`
orphans (`52504`/`52505`, ppid 1, start `Tue Aug 18 16:21:18`) predate
this session, are unchanged before and after, and are deliberately left
alone — they are `T-043-s1`, not this integration's to claim or clean.

**A live sibling lane was observed and correctly left alone.** A vitest
tree appeared mid-integration running from
`/Users/ujju/Projects/nputer-T-073/lib/parser` and `.../app` under a
different `claude` process (pid 92215, started 14:25:25). It is the
T-073 lane's, not this integration's, and nothing was signalled. **It is
also writing into the same scratch directory this session was given**,
under filenames `parser.log` and `app.log`; no name collided with this
session's, but the directory is not in fact private, and files in it
date back to Aug 17. Worth knowing before any integrator trusts a
scratch path to be its own.

## Health of the tree

At this checkpoint main contains T-076 merge `79ae34a` plus this
checkpoint. Parser, app, Rust, E2E, token lint, audit and
graph-currentness gates are all green; the boot gate correctly did not
fire.

**ROADMAP WAS NOT TICKED, and the reason is measured rather than
asserted.** The discriminator this repo uses is: does it change what a
USER can do? T-076 answers no, three times over, and each was checked
rather than argued. The comparator's defect needs an id with 309+
digits, and the registry stops at `C-14`. `duplicate-id`'s new `space`
field is read by **no app source** — that is T-077's subject, which is
where T-053-s1 went. The near-miss hint is the one that looked
user-visible and is not: `validateProject` has **zero call sites under
`app/src/`**, and the board's `parse-error-details` strip renders
`f.issues[0]?.message` from per-FILE parse failures only
(`docs-model.ts:240` `failingIssues(path, content)`), never the
cross-reference issue set. **The precedent is unanimous once the class
is right**: T-019, T-030 and T-053 — the parser-internal cards, and
T-053 is this card's direct predecessor absorbing the same suggestion
family — have zero ROADMAP presence. T-055 DOES have a paragraph and is
the case worth distinguishing: a commented-out roadmap row was a phantom
FEATURE on the board, which the user sees. Nothing here is.

**ARCHITECTURE WAS TOUCHED**, and unlike the last two merges the call is
easy rather than sharp. `lib-parser` is **C-06**, which has a row IN the
Components table (the table runs C-01…C-07), so the "no C-id, no
paragraph" test that excluded T-058 does not apply. More than that, the
C-06 row's own T-053 clause states as load-bearing that "the strip is
TEXTUAL and never `Number()`, so two genuinely different ids past 2^53
cannot false-alias when floating point runs out of room" — **true of
`idSlotKey`, and false one function away of the comparator, until this
card**. A row that claims a property for a layer while a member of that
layer violates it is the exact hazard this project keeps finding, so the
row now records the whole shape: both degradations, the shared textual
primitive, the `space` field, the near-miss hint, and — explicitly —
that none of it is live on this tree and that it earns no ROADMAP
narrative.

## Provenance

T-076 is **built and verified by `claude-opus-5 @fresh`**,
`review: same-model` — the same model on both sides, honestly stamped.
Re-derived across all done cards at this checkpoint rather than assumed:
**53 done cards — 42 read `same-model`, 5 read `self-verified`, 5 read
`independent`, and T-056 is a done card whose `review:` is EMPTY.**
T-076 is the card that moves `same-model` from 41 to 42.

Of the five `independent` stamps, **only three have different models on
the two sides**: T-057 and T-058 (codex/gpt-5.6 built, claude-opus-5
verified) and T-060 (claude-opus-5 built, codex/gpt-5 verified). **T-055
and T-066 are stamped `independent` with the SAME model on both sides**,
which is `same-model` by the convention's own definition. That count is
unchanged by this merge, and no card's history was re-stamped.

**A fourth data point on who stamps `done`, and it now looks like a
practice rather than a coin flip.** T-076's verifier left
`status: verifying` for the integrator, exactly as T-043's did, and the
integrator stamped it at the checkpoint rather than in the merge commit
— which is also where T-043's and T-057's stamps landed. Three of the
last four agree; T-058's executor is the outlier.
`method/roles/executor.md:19` still settles only who may NOT stamp it at
size M.

## In progress / broken right now

**Three sibling lanes are live** — one more than the last checkpoint —
and all three were verified against their branch refs through this
repository's shared object store rather than assumed from their slugs.
No sibling worktree was read into, written to, built from or signalled.

- **T-069 — the turn's own end decides the diagnosis**
  (`task/T-069-relay`, worktree `../nputer-T-069`). F-03, milestone 3,
  size S, `touches: [app-agent]`, `status: verifying`. **In
  verification**: its tip moved during this integration, `b4d87cc` at
  the start and **`8054d0b`** at the end, whose subject is
  "verdict (3/n)".
- **T-073 — the ambient node surface stops being a write permit**
  (`task/T-073-write-permit`, worktree `../nputer-T-073`). F-02,
  milestone 4, size S, `touches: [app-shell]`, `status: verifying`.
  **In verification**, and the earlier of the two: `7386790` at the
  start, **`01a452b`** at the end, subject "verdict (1/n)".
- **T-078 — the conventions describe the machine that exists**
  (`task/T-078-conventions`, worktree `../nputer-T-078`). F-01,
  milestone 4, size M, `touches: [docs/CONVENTIONS.md, method/]`,
  `status: verifying`. **In a POST-REJECTION FIX**, which is the state
  worth naming precisely: it was rejected, and its tip moved `041e8ec`
  → **`1f0f7ae`**, subject "T-078 fix: both rejected integers,
  re-derived at this ref, and s6 closed".

**All three are disjoint from this merge**, computed with `comm -12`
against this merge's own nineteen-file list rather than inferred from
`touches:` — T-069 changed 5 paths, T-073 10, T-078 9, and every
intersection is **0**. `lib-parser` is released by this merge.

Nothing is broken. No lane is blocked on this checkpoint.

## Next up

1. **Triage the eleven undispositioned suggestions** — six `T-043-s*`
   carried over and five `T-076-s*` arriving with this merge.
   **`T-076-s4` is the one with reach beyond its own card**, and it is
   sharper than `T-043-s4` was: it is not a taxonomy question but a
   measured hole in the METHOD. Every mutant sweep this project has run
   derived its mutants from the pins, so every "zero survivors" claim in
   the archive is a claim about the pins rather than about the criteria.
   The remedy is small and belongs in T-078's drill clause with the
   other shapes: derive at least one mutant from a CRITERION with the
   test file closed.
2. **`T-076-s1` needs a ruling, not a re-measurement.** Three
   independent derivations agree the divergence NARROWED; what is open
   is whether an ADR-015-family follow-up card is worth cutting while
   the registry maxes at `C-14` and no trigger fires.
3. **T-070** remains newly dispatchable on the fence T-043 released
   (`app-agent`, `blocked_by: []`), alongside the three lanes running.
   **T-065** (`blocked_by: [T-057, T-058]`) remains unblocked and
   undispatched; **T-067** and **T-068** still wait behind it. **T-077**
   inherits T-053-s1 and now also owns the consumer story for
   `duplicate-id`'s `space`, which this card made structural and nothing
   yet renders.
4. The human-owned authenticated genesis below, which is still the whole
   remaining milestone-3 gate.

Dispatch the next lane from THIS checkpoint, not from the merge commit
(T-014-s3): a merge carries a graph the checkpoint has not regenerated
yet, and a lane cut from one inherits a red `index --check` through no
fault of its own. **That is not hypothetical this time** — this merge
DID stale the graph, so `79ae34a` is exactly the kind of commit the rule
exists to keep lanes off.

## Human-owned evidence and decisions

- **Real genesis run:** authenticate the supported CLI, then perform one
  timed end-to-end genesis on a toy idea, target <=30 minutes, with
  light and dark completion screenshots. No planner turn has succeeded
  against a real model on this machine.
- **Relaunch the desktop app — still owed, and now two merges stale.**
  The process was replaced at the T-043 merge but runs an unlinked
  pre-merge image (inode `26762149` against an on-disk `27086578` that
  has since been rewritten twice), so it does not contain T-043's kill
  path. **A cancel in that window still pays the full five seconds.**
  Note the asymmetry this checkpoint measured: their FRONTEND is
  current — it hot-updated to T-076's parser — while their RUST is not.
  Half the app they are looking at is two merges behind the other half.
- **Confirm the quit-mid-turn behaviour** (T-043's own @human line):
  start a `hang`-scenario genesis, quit the app, and it should close
  promptly rather than after a five-second pause. Requires the relaunch
  above first, which is why it has not been discharged.
- **Visual judgment:** decide whether the bounded shell and its internal
  board/map/error scrollbars feel right in both schemes.
- **Stray real-smoke directories:** the pre-existing
  `nputer-t025-realsmoke-*` directories remain a human delete-or-keep
  choice.
- **The two `nputer-T-060` `fake_agent` orphans** (`52504`/`52505`) are
  still alive at ppid 1 and are safe to kill by pid; they are recorded
  as `T-043-s1` rather than swept, because nobody has attributed them.
- **Repository remote:** there is still no remote. **CI has never run on
  a real runner**, so `index --check` as a CI step remains true in the
  future tense only; the integrator ran it by hand at this checkpoint
  and it exited 0 (T-054's standing clause). The same is true of the
  token lint's dependency on git being on PATH.

Milestone 3's implementation list is complete, but the milestone is not
claimed until the real timed genesis exists.

## Open questions

- **Is `T-076-s4` shape SEVEN, and does it retire the archive's "zero
  survivors" claims?** The last checkpoint asked whether `T-043-s4` was
  a seventh shape or a variant of the sixth. This merge supplies a
  different candidate for the ordinal and a stronger one: a mutant NO
  BODY KILLS, produced by deriving the mutant set from the pins instead
  of the criteria. It is the exact dual of shape six, which makes the
  pair look like one axis rather than two shapes — and it leaves
  `T-043-s4` (a mechanism made unfalsifiable by a REDUNDANT second path)
  still needing its own answer. Triage owns the taxonomy; what it cannot
  defer is the question of whether every previous sweep's "zero
  survivors" now means less than it was read to mean.
- **What does `review: independent` mean — a different session, or a
  different model?** Five done cards carry it and only three have
  different models on the two sides. T-056 is also a done card with an
  empty `review:` where `self-verified` looks intended. ADR-016 says the
  distinction remains first-class DATA and always visible in TEXT, but
  never says which distinction.
- **Does a size-M card's `status: done` belong to the verifier or the
  integrator?** Now three of the last four cards answer "the integrator,
  at the checkpoint" (T-043, T-057, T-076) against T-058's executor
  stamping it in the build commit. `method/roles/executor.md:19` allows
  `done` only at size S, which settles who may not stamp it but not who
  must. This is close enough to settled to be written down.
- **Should `aliasedIdSlots` keep its `compare` parameter?** It now has
  exactly one caller passing exactly one value, and its doc has to warn
  that a different caller could reintroduce the NaN. Both the executor
  and the verifier reached the same conclusion — the parameter is a
  hazard with no user, and deleting it is a real option that was outside
  criteria. Endorsed by two sessions and filed by neither.
- **Should a restoration sha be recorded at all?** T-043's own central
  file falsified the card's restoration discipline for a reason that had
  nothing to do with the drills. A sha proves restoration at a COMMIT
  and stops meaning anything the moment the file moves for any other
  reason — and this merge added an instance one level up, where a RANGE
  figure (17 paths, +1310/−37) went stale on the branch that produced
  it.
- **Should `docs/CONVENTIONS.md` legend the token lint's exit codes?**
  A criterion of T-078, with T-080 restoring the distinction; left open
  here because T-078 is in a post-rejection fix as this is written.
- T-057-s2 leaves an unpinned behaviour change in C-13 that moves
  against T-056's direction; it is T-072's third criterion.

**Answered by this merge, and left in place rather than edited out:**
*"Is `files.test.ts:192` an instance of shape six?"* — **no.** Mutant
(u) reds exactly that one body in 263. The executor's own confession was
wrong in its own disfavour, and the verifier overruled it. A body can
look redundant against one family of mutants and be the only guard in
the suite against another.

## The fourth triage — 46 suggestions, then 50, dispositioned to zero

Run by `claude-opus-5 @fresh` as a read-only analyst, then applied in
the main checkout. The backlog was enumerated from disk rather than
inherited: **46** files at `status: suggested` before T-058 merged,
**50** after its four verifier findings landed with it, **42** after the
eight resolutions were committed at `9b15f7d`, and **zero** after that
pass.

**Twelve cards born, T-069 through T-080**, absorbing 35 suggestions.
Two folds (T-051-s8 into T-065, T-063-s3 into T-064). Four parks, each
with a dated unpark trigger. One rejection (T-051-s2, superseded). Eight
resolutions, recorded at `9b15f7d` as dated lines on the cards that
actually closed them.

**EIGHT FINDINGS WERE ALREADY CLOSED AND NOBODY HAD SAID SO.** Four were
expected; four were not. T-060-s3, s4 and s5 were closed inside T-060's
own re-verification, whose verdict says "No blocker or new suggestion
remains" — the files were never removed, and they sat at
`status: suggested` through three triages. T-029-s1 was closed at
`2fc3475`, a commit whose subject is literally that it corrects the
trace s1 was filed about. **The lesson is in T-078**: a verdict sentence
that reads as closing five findings, while two of them asked for written
rules, is exactly how a rule goes unwritten while everyone believes it
exists.

**Four citations no longer resolved**, every one drifted downward by a
later merge into the same file while the finding's substance reproduced
exactly. T-078 carries the rule that follows: a citation names a symbol,
not a line. T-043's two drifted anchors were a fifth and sixth instance.
**T-076 supplies a seventh of a different kind** — `roadmap.ts:48`, a
dispatch citation that pointed at the `description` split rather than at
the emit, which is `:51-56`. Not drift: wrong when written.

**The poison shapes have ordinals.** **Shape five** — the assertion SET
has no cardinality or coverage floor (T-058-s2, absorbed by T-080).
**Shape six** — a body that reds under an expected-value poison while
killing no mutant another test does not already kill (T-057-s1,
absorbed by T-072). Both are written into T-078's drill clause.

**Appended 2026-08-19, at T-076's checkpoint.** Suggested is **eleven**:
the six `T-043-s*` findings and the five `T-076-s*` findings, all
undispositioned. `T-076-s4` raises the strongest candidate yet for a
seventh shape and is the only one of the eleven whose subject is the
METHOD rather than a card. The **corpus figures quoted in this section
are as of `9b15f7d` and remain stale**: CONTROL was 521 there, was 502
at the last checkpoint and is **507** here. The 20.6%-unpinned analysis
that made T-080 survives the change in denominator; the raw totals do
not.
