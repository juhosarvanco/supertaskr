# State

Updated: 2026-08-17 by integrator (T-014 merge), claude-opus-5 @fresh

## Just completed
T-014 (nputer-index binary — index, `--check`, `--watch`, `arch`,
`arch drift`; `crate-index` = C-07, M, milestone 4, F-06) done and
merged. Built by `claude-opus-5 @fresh`, verified by `claude-opus-5
@fresh`, `review: same-model`, **APPROVED first pass**. Four criteria,
26 files under `app/src-tauri/crates/nputer-index/`, one added
`Cargo.lock` line. Absorbs T-009-s1 — **but only its first limb; see
the retirement section below, because T-045 changed what applying it
costs.**

**WHAT SHIPPED.** The crate stopped being a library with a golden test
and became an INSTRUMENT. `[[bin]] nputer-index` (a 19-line shim; all
logic stays in the lib) with `index [--root .]`, `index --check`
(writes nothing, exits non-zero on a stale graph and prints WHAT
moved), `index --watch` (headless, debounced 250 ms, the app watcher's
containment rules), `arch` and `arch drift [--fail-on
undeclared|unmapped|any]` (read the COMMITTED graph, one record per
line, fixed field order, leading keyword — `grep '^component'`,
`'^edge'`, `'^finding'`, `'^summary'`, `'^verdict'` each yield a clean
table). Zero Node code: this task builds none, per ADR-015/ADR-003.

**THE EXIT-CODE CONTRACT is the part worth remembering**, and it is
one range shared with `npm run boot:check` so a single `case $?` reads
both gates: **0 clean · 1 the gate's own verdict (stale, or drift at
the requested severity) · 2 called wrong · 3 could not run**. The
separation that earns its keep is **1 from 3**: "the graph is stale"
and "I could not tell you" are different news. A deleted
`components/` directory exits 3 and says `no component registry`; it
can never read as ordinary drift, and it can never read as clean.
That is T-046's *a skipped gate is news, never silence* built into a
return value.

Cargo went **220 → 299** (+79, +3 ignored unchanged).

### THE FORK QUESTION, AND ITS RULING — this is the substance of the task

`arch` / `arch drift` place a **second reality-side join in Rust**
inside a decision (ADR-015) whose whole point was that derivation
lives in TypeScript. The verifier attacked the equivalence rather than
re-reading the claim: a differential harness ran both engines — Rust
through `arch::model()`, TypeScript through `parseProjectFromFiles` +
`deriveArchitecture` — over identical trees, dumping the same fact
shape and diffing.

- On the live registry: **252 fact lines byte-identical.** Not counts
  — the complete fact set: all **92** file→component assignments, all
  **28** relation rows in order, all **100** observed file edges
  including every `p:@nputer/parser` annotation, all **9** finding ids
  in order (6 D1 + 3 D3), all **22** D1 file edges, unmapped `[]` both
  sides, 6 drift components.
- Against ten hostile fixtures built to break it: **eight of ten
  identical, line for line.**

**BUT THE VERIFIER FOUND A REAL DIVERGENCE, and it is the finding that
matters most here.** `registry.rs::unquote` strips quotes without
processing YAML escapes; `@nputer/parser` processes them. A `paths:`
entry carrying an escape — `"app/emoji-\U0001F600/**"` — is read as a
literal backslash-U by one engine and as an emoji by the other,
**BOTH engines exit 0**, and the file lands in different components.
Driven to the gate: `arch drift --fail-on unmapped` exits **1** with a
D2 on a repo the TypeScript engine maps cleanly with **no findings at
all**. Two siblings **invert the polarity** — a duplicate `paths:` key
(Rust MERGES the lists and exits 0; @nputer/parser rejects the record)
and a tab-indented list item (Rust accepts; @nputer/parser rejects) —
and there the HARDENED parser is the one that refuses while the second
reader guesses. So the notes' load-bearing sentence, "this one either
reads the same facts or stops the gate (exit 3)", **is not exact.**
Filed as **T-014-s6** with a **three-refusal close** (refuse an
escape, refuse a duplicate key, refuse a tab) that restores the
property without implementing YAML — which would be the fork ADR-015
forbids. **Latent, checked mechanically: none of the three triggers
occurs in any of the eleven live component files.**

**ADR-015 GAINED AN ADDENDUM AT THIS MERGE — applied, not deferred.**
The architect drafted it and it was appended VERBATIM as a dated
`## Addendum` section, ADR-011's precedent: the original decision text
is byte-identical (diffed against `HEAD` — 39 lines, 0 changes), only
appended to. Its ruling: **ADR-015 stands** — derivation is TypeScript
and the binary's join is a reader that exists because a CLI cannot
call into the app's TS — **but the decision's implicit promise, that
one engine means one answer, is now false in a measurable way, and the
record says so.** It names its own revisit trigger: a THIRD join, or
the first LIVE divergence, or a consumer needing the Rust side to
answer something the reader deliberately does not (rollups, the task
join). Any of those and the two-engine question is no longer narrow
and wants its own ADR.

**EVERY NUMBER IN THE ADDENDUM WAS VERIFIED AGAINST THE VERDICT BEFORE
IT WAS COMMITTED, and all fourteen check out. One thing the next
reader needs, though, and it is not an error:** the **92** assignments
and **22** D1 edges are BRANCH-POINT measurements, taken at `5927adc`
when the committed graph carried 92 files. Main has since advanced to
100. Re-measured live at this merge with the merged binary itself:
`arch` reports **100 files, 100 mapped, 0 unmapped**, and the D1
`file_edges` sum is **24**. The addendum is a dated record of what was
measured, so it was applied verbatim rather than edited — but do not
read 92/22 as current.

### THE CONVERGENCE EVIDENCE (criterion 4, measured not argued)

**12,018 reads, 0 mismatched, 0 empty**, across 40 app-side writes and
40 interleaved binary runs; watcher + app writer **converged 1 ms**
after the last app write; startup index 427 ms; source change → graph
105 ms at `--debounce-ms 100`. Plus **three attacks the task never
asked for**:

- **SIGKILL mid-write, 40 rounds** on the real 396 KB graph:
  complete-old 10, complete-new 30, **torn 0, invalid-JSON 0, stray
  temp files 0**.
- **8 concurrent binaries on one root**: **612 reads, 0 torn, 0 empty,
  exactly 2 distinct complete states** (the old inode and the new).
  Final bytes equal a fresh index; `--check` after the race exits 0.
- **`--watch` live while an external writer stamped the OLD bytes back
  over its output six times**: converged, `--check` 0, 0 strays, and
  the log shows the loop terminating (`2 change(s), none indexable -
  graph untouched`) rather than chasing its own write.

A hand-planted leftover temp (`.graph.json.tmp-99999`, invalid JSON)
is inert and is not indexed.

### THE PROCESS FINDING — the most consequential thing in this task

**THE STALE-GRAPH WINDOW IS REAL AND WORSE THAN FILED.** The builder
found it with two commits; the verifier proved it over the graph's
whole history: **every regen of `docs/architecture/graph.json` has
landed in a CHECKPOINT commit, six for six** — `be182ce`, `db8da6c`,
`b3bfe45`, `6356246`, `e78bfdc`, `086614a` — and **not once in a merge
commit**, though CONVENTIONS says "commit … with the merge". So this
was never an oversight at T-050: **the rule has never described the
practice**, and the practice is the one the `ceaa949` ordering
discipline FORCES (the checkpoint edits indexed fixtures, so a graph
committed at the merge is stale again immediately). Confirmed
independently: `b3bfe45` (T-049's checkpoint) and `5927adc` (T-050's
merge) carry the **identical** sha `815412de…`/385,451 — the merge
carried the checkpoint's graph forward untouched, which is exactly why
T-014's own branch inherited a red. **T-014 was the worked example.**

**THE ONE-LINE RULE THAT FOLLOWS — dispatch lanes from the CHECKPOINT,
not from the merge.** A lane cut from a merge commit inherits a stale
graph and reds the two dogfood fixtures on its first run, through no
fault of its own. The orchestrator has already adopted this in
practice: **T-027 was dispatched from `e92056a`, a checkpoint.** It
still has no home in CONVENTIONS. **It should get one at the next
triage** — it is one line, it is measured six-for-six, and it is the
cheapest thing on this list.

### THE COUPLING NOBODY PLANNED — and why the retirement did NOT land here

T-014's card names the interim regen rule's retirement, and the
builder drafted the replacement (a delete + a GRAPH GATE bullet in the
BOOT GATE's shape + an `app/src-tauri` commands paragraph). **It was
NOT applied at this merge, deliberately.** Reasons, in order of
weight:

1. **T-045 inverted the hazard (T-014-s8).** T-045 rebuilt
   `tools/e2e/tests/workflow-parity.spec.ts` to DERIVE its expected
   commands from `docs/CONVENTIONS.md` "Build & test" in BOTH
   directions. The builder's note ("a CONVENTIONS edit alone will NOT
   red the lane") is now **history**. Measured by the verifier on a
   `git archive main` copy: baseline **11 passed**; with the drafted
   block applied **1 failed / 10 passed**, naming `[app/src-tauri]
   index --check`, `index --watch` and `arch` as commands the spec has
   no entry for. **The retirement must land as ONE commit touching
   `docs/CONVENTIONS.md` AND `tools/e2e/tests/workflow-parity.spec.ts`
   — and `.github/workflows/ci.yml` if `index --check` becomes the CI
   step.** Confirmed at this merge that the coupling is scoped as
   described: the parity spec parses only the `## Build & test`
   section, so the Gotchas bullets (the interim rule, BOOT GATE) are
   invisible to it — the collision is entirely with draft (c).
2. **The honest disposition of `index --check` is a DECISION, not a
   mechanical edit.** T-014's own `Absorbs:` note makes CI adoption a
   named precondition ("when --check lands **and** T-020's CI lane
   adopts it as a step"). Putting `index --check` in `LOCAL_ONLY`
   would retire the interim rule while recording that its replacement
   is enforced nowhere; putting it in `CI_SEQUENCE` means designing a
   new step in a workflow that has never run once. That is a ruling,
   and ADR-004 makes rulings the architect's.
3. **The wording of the block decides its own blast radius.** The
   verifier's note: the derivation "ends at the first `·` segment that
   does not open with a backtick", so draft (c) exposed only **three**
   of its five backticked commands to parity. The block has to be
   REWORDED deliberately — that is drafting, not applying.

**So `docs/CONVENTIONS.md` is a 0-file diff at this merge and the
interim rule stands, exercised for the TWENTY-FIFTH time.** What
retires in PRACTICE is already true and was exercised here: nobody
hand-runs `NPUTER_UPDATE_GOLDEN=1 cargo test … self_graph` as routine
any more — you run `--check`, and regenerate only when it is red.

### T-014-s7 — the fifth vacuous assertion of the night

The debounce default (250 ms) equals `docs_watch.rs:48`, and the test
that claims to PIN that equality **restates its own literal instead of
comparing the two constants**. Reproduced: moving the app watcher to
300 ms leaves every test green. The pin's correct home is the app
crate, which can see both.

## In progress / broken right now

**T-027 (the interview split view) is BUILDING** in `../nputer-t027`,
cut from `e92056a` — a CHECKPOINT, per the rule above, so it carries a
current graph. Lanes app-interview + app-shell + tools/e2e. **Its
worktree was never entered by this merge.** After it lands: the third
triage over a settled tree (~45 open suggestions).

**T-030-s3 IS STILL THE CORRECTNESS-OF-RECORD ITEM AND ITS DEADLINE
HAS PASSED**, now two merges older. `blocked_by` edges can silently
RE-POINT when an unpadded sibling id appears, and T-034 SHIPPED the
waves, the critical path and the worst blocker — all computed from
`blocked_by`. A silently re-pointing edge is a wrong picture in a pane
the human is about to look at. Unchanged by this merge.

## THE MERGE ITSELF — what an integrator did and proved

**THE MERGE CONFLICTED, AND THIS IS THE FIRST CONFLICT IN THE RECENT
RUN OF MERGES.** Merge commit **`bdada11`**, merge-base **`5927adc`**,
main before at **`e92056a`**. Both changed sets enumerated: **36
branch files against 60 main-side**, and `comm -12` returns **EXACTLY
ONE FILE — `docs/tasks/T-014-index-cli-watch-check.md`, the card
itself.** `git merge-tree --write-tree` was run FIRST and predicted
the conflict rather than a clean tree.

**The conflict, and why resolving it was mechanical rather than a
judgment call.** Main's `54d9fb5` ("Stamp T-014 dispatched") had set
`status: planned → building` and `builder: claude-opus-5`. The branch
set the same two, plus the four remaining stamps. Git auto-merged
`status` and `builder` (both sides identical) and conflicted on the
four ADJACENT lines only:

    <<<<<<< main            =======
    verifier:               verifier: claude-opus-5
    built_by:               built_by: "claude-opus-5 @fresh"
    verified_by:            verified_by: "claude-opus-5 @fresh"
    review:                 review: same-model

**Main's side is the EMPTY template; the branch's carries the true
values ADR-016 requires on a done card.** The branch side is a strict
superset — there is no information on main's side to lose. The
resolution was computed with `git merge-file` in a scratch copy BEFORE
the merge was started, and the resolved file is **byte-identical to
the branch blob (0 diff)**, verified again after the commit. Recorded
in the merge message so the call is auditable rather than silent.
`git diff --check` clean; `e92056a..HEAD` is **exactly the branch's 36
files** and nothing else. (The merged tree hash does NOT match
`merge-tree`'s `325b6197` — correct and expected: `merge-tree` wrote
the CONFLICTED tree, whose blob carries 2 conflict markers.)

**BOOT GATE (T-046): FIRED, RAN, GREEN — and it mattered unusually
here.** This crate's new binary makes **THREE BINS ACROSS TWO
PACKAGES**, the exact T-040 class that once stopped the app launching:
confirmed from `cargo metadata`, not from reading the manifest —
package `nputer` has bins `[fake_agent, nputer]` with
`default-run = nputer`, package `nputer-index` has bin
`[nputer-index]`. The verifier had already reproduced T-040's failure
by deleting line 13 of `app/src-tauri/Cargo.toml` and getting cargo to
list all three, and confirmed **T-014-s4** directly: with `default-run`
deleted, `cargo test` still reports **296 passed, exit 0** — the whole
suite is blind to it, and only the boot gate stands between the
manifest and T-040.

Scratch port **14590** (probed free alongside 14591–14594, deliberately
avoiding 1420, the lane default 14520, and every port earlier sessions
used tonight). Run **unpiped, redirected to a file, with the exit code
taken from `$?`**:

    [boot-check] port 14590 free — spawning `npm run tauri dev -- --config {…}`
    [boot-check] app: [nputer] project folder: /Users/ujju/Projects/nputer
    [boot-check] detected startup line 1/2: [nputer] project folder:
    [boot-check] app: [nputer] window "main" created
    [boot-check] detected startup line 2/2: [nputer] window "main" created
    [boot-check] process tree stopped (exit=null signal=SIGTERM)
    BOOT_EXIT=0

**Exit 0, both `[nputer]` lines.** After it: `lsof` on 14590 **empty**,
`pgrep -fl tauri-boot-check` **empty**, `pgrep -f "tauri dev"`
**empty**.

**THE `<main-before>..HEAD` RULE WAS USED, and the trap would have
mattered here.** Restricting **`e92056a..HEAD`** to the BOOT GATE limbs
returns **27** files, all of them this branch's crate work. Restricting
the naive **`5927adc..HEAD`** (merge-base) returns **35** — the extra
**eight** being `app/src-tauri/src/docs_watch.rs`, five
`app/src/architecture/**` files, `app/src/genesis/GenesisPane.tsx` and
`app/src/lib/watcher-store.ts`: T-034's and T-042's, **already on main
and already boot-gated at their own merges**. Both derivations fire
here, so nothing hinged on it again — but the merge-base derivation
would have made this Rust-only merge look like it touched the map pane
and the genesis pane, which it demonstrably does not. **Five
integrators have now hit this; the fix is still one clause in both
CONVENTIONS bullets naming which diff.**

**SUITES ON MERGED MAIN**, all re-run first-hand, fresh installs
(`node_modules` removed in all three packages), ADR-011 order. Every
expectation DERIVED rather than trusted:
- lib/parser `npm ci` (0 vulnerabilities) + `npm run build` clean +
  `npx tsc --noEmit` clean + `npx vitest run` **197/197 (10 files)** —
  unmoved, as a branch with a 0-byte parser diff must be.
- app `npm install` (0 vulnerabilities), `npx tsc --noEmit` clean,
  `npm run build` exit 0, `npx vitest run` **625/625 (35 files)** —
  unmoved, and that is the DERIVED expectation, not an inherited one:
  the branch adds zero files under `app/src` or `app/test`.
- app/src-tauri bare `cargo test` **299 passed + 3 ignored, 0 failed**,
  exit 0, **zero compiler warnings**, summed across **15 test
  binaries** (108/0/0/32+1/123/0/7/13/3/7/0+1/2+1/4/0/0) — **NOT piped
  through `tail`**, written to a file with the exit code from `$?`.
  **DERIVED: main's 220 + the branch's 79 = 299**, and it landed
  exactly.
- tools/e2e `npm ci` (0 vulnerabilities) + `npm run typecheck` clean +
  `NPUTER_E2E_PORT=14591 npm test` → **54 passed in 8.2 s**, headless,
  one worker, retries 0, **no skips, no retries, no flakes**. **54, not
  more** — T-014 adds zero lane specs. `lsof` on 14591 after: empty.
- `npm run lint:tokens` → `clean (99 files scanned under app/src,
  app/test, tools/e2e)`, exit 0, **ZERO allowlist** — unmoved, because
  the branch adds no file under any of those three roots.
  `-- --selftest` → **49 samples green, 14 walk-policy checks green**.

STANDING INTEGRATOR PRACTICE (T-009-s1) — **TWENTY-FIFTH** exercise,
and this is the first time it is worth distinguishing *fired* from
*fired-but-no-op*:
- **THE RULE FIRED — and the dispatch predicted it would be ABSENT,
  which is the correction.** Six `*.ts` files outside `docs/` appear in
  `e92056a..HEAD`: the clean-repo and gate-repo **fixture** trees under
  `app/src-tauri/crates/nputer-index/tests/fixtures/`. Read literally,
  the trigger is met.
- **IT IS A NO-OP, and that was DERIVED before it was confirmed.** All
  six sit inside a path the repo's root `.nputerignore` has excluded
  since T-009 (`332bd18`) with the reason written in the file —
  "fixture trees are deliberately broken indexer inputs, not map
  content". `.nputerignore` is a 0-file diff at this merge. The
  committed graph contains **zero** occurrences of that path, is
  `languages: ["ts"]`, and indexes **zero** `.rs` files, so the biggest
  half of this diff moves no graph node at all (Rust extraction is
  still T-010's).
- **PROVED, not assumed.** With `NPUTER_UPDATE_GOLDEN` confirmed UNSET
  at the shell, the plain (non-golden) ignored self-check is **GREEN**:
  `self_graph_is_current … ok`, exit 0. The committed graph is
  **unmoved** — sha256
  `88e1daf69645e5734acf43a910e36e03faeb9dca8464bc10f527a144b9a0a289`,
  **441,937 bytes**, 100 files / 757 symbols / 1170 edges, identical to
  T-042's checkpoint. **No regen was run and none was needed. No
  dogfood assertion moved.**

### THE FIRST LIVE EXERCISE OF THE INSTRUMENT — and it agrees with the golden in BOTH directions

The merged binary was built (`cargo build --release -p nputer-index`)
and run against THIS repo. This is the first time `--check` has been
used as a gate rather than tested as a feature.

    $ nputer-index index --check
    [nputer-index] graph.json is CURRENT - docs/architecture/graph.json
    matches a fresh index (441937 bytes, 100 files, 757 symbols, 1170 edges)
    exit 0

**Agreement was not left at "both are green."** A `.ts` file was
planted under `app/src` and both instruments re-run, then the plant
removed and both re-run again:

| tree state | `index --check` | `self_graph_is_current` |
|---|---|---|
| as merged | **0**, CURRENT | ok |
| + one planted `app/src/zz-integrator-probe.ts` | **1**, and it NAMES the file | FAILED (exit 101) |
| plant removed | **0** | ok |

**They agree in both directions, and `--check` is strictly the better
instrument.** Its red prints the delta — committed vs fresh byte,
file, symbol and edge counts, `files +1 -0 ~0`, the file by name, and
the regenerate command — where the golden prints `FAILED`. On stdout
when green, stderr when red, so `> /dev/null` is a silent gate. It
wrote nothing: `graph.json`'s sha256 is identical before and after
every run, and the tree was clean at each step.

**`arch` was exercised live too, and it reproduces the TypeScript
engine's committed fixture expectations:**

    summary  components=11  files=100  mapped=100  unmapped=0
             edges=28  findings=9  drift_components=6

`arch drift --fail-on any` → **exit 1**, 9 findings (6 D1 + 3 D3, the
same ids the app's dogfood fixture asserts). `arch drift --fail-on
unmapped` → **exit 0**, correctly, because unmapped is 0 — severity
gates its own rule. `arch` never wrote: the graph's sha256 is
unchanged.

### THE FINDING NOBODY WAS LOOKING FOR — a Rust variable name changed the app's CSS bundle

**A pure Rust + docs merge CHANGED THE FRONTEND ARTIFACT, and the
mechanism is one nothing in this repo guards.** The app bundle came out
`index-CqP7XAJm.css` at **41,998 bytes** where T-042's checkpoint
recorded `index-CJtBhg4R.css` at 41.98 kB — with **zero** files
changed under `app/src` or `app/test`. Chased to the bottom rather
than waved off:

- **Tailwind v4 auto-detects sources from the VITE ROOT, which is
  `app/` — and `app/src-tauri/` is inside it.** Proved with two probe
  files carrying unused utilities: one at the repo ROOT contributed
  **nothing** (hash byte-identical), one under
  `app/src-tauri/crates/nputer-index/` added **all three** utilities
  and grew the CSS to 42,427 bytes. Scan scope settled by experiment,
  not by reading docs.
- **Then the crate was moved out of the tree and the build re-run**:
  the CSS came back as **`index-CJtBhg4R.css`, 41,975 bytes** —
  **T-042's exact hash, reproduced**. Moved back; `git status` clean.
- **The delta is 23 bytes and it is one rule: `.inline{display:inline}`.**
  Selector-set diff of the two builds: **ADDED `inline`, REMOVED
  nothing.**
- **The source is a local variable.** `src/cli.rs` has
  `let (name, inline) = match arg.split_once('=')`. Tailwind read the
  bare token `inline` as a utility candidate. In all of `app/src` the
  word only ever appears as `inline-flex` (a different candidate) or
  `@theme inline` (a CSS at-rule) — **so this utility exists in the
  shipped bundle solely because of a Rust identifier.**

**Why nothing caught it.** `lint:tokens` scans `app/src`, `app/test`
and `tools/e2e` — **not `app/src-tauri`** — which is exactly why it
reported an unmoved 99 files while the bundle moved. And CONVENTIONS'
rule that "unmapped utilities are deliberately dead" is about
authoring discipline in the app; nothing states that the Rust tree is
a Tailwind content source at all. **Practically inert today** (no
element uses `.inline`, so nothing renders differently), but the
mechanism is general: any identifier in any future Rust file can add
dead CSS to the shipped bundle, and the one gate that would notice
cannot see the directory. **Flagged for triage rather than fixed here
— it is out of this merge's fence, and there is still no precedent for
integrator-filed `-sN` cards.** Two candidate closes: widen
`lint:tokens`' walk to `app/src-tauri`, or scope Tailwind's sources
explicitly to `app/src` + `app/test`. The second is the smaller one.

### 1420 — THE HUMAN'S APP IS DOWN, and it went down during this session

**It was never bound, contacted or signalled.** It was OBSERVED with
`lsof` only. At session start it was exactly as five checkpoints
recorded it: **node pid 64249** holding `[::1]:1420`, with an
established connection to their webview (**pid 51954**). **Both
processes are now gone and 1420 is free.** No vite, no tauri, no
nputer process is running anywhere.

**The boot check is EXONERATED, and that was checked rather than
assumed**: `tauri-boot-check.mjs` spawns `detached: true` (its own
process group) and kills with `process.kill(-child.pid, signal)` — a
process-GROUP kill that cannot reach a separately started `tauri dev`.
It also bound only 14590 and threaded a matching `--config`.

**Two candidate causes, and they cannot be separated from here.**
(1) The human quit the app — the webview process is gone too, which a
crashed vite would not by itself explain. (2) The ADR-011 fresh-install
discipline: `rm -rf app/node_modules` under a live vite, which
`tauri dev` supervises, could take the whole tree down with it. **Note
against (2): T-034's and T-042's merges performed the same removal and
pid 64249 survived both.** Recorded honestly rather than resolved.
**This is the NINTH face of the shared-working-tree question, and the
first where the shared tree may have cost a running PROCESS rather
than only an artifact.**

**The upside for the human**: whatever the cause, the next launch is a
fresh build, so the "reviewed artifact is not pinned to the review"
hazard is discharged for this cycle — they will see T-042's JS and
T-014's 23 CSS bytes together.

INTEGRATOR JUDGMENT CALLS, recorded.
- **CONVENTIONS: NOT EDITED, 0-file diff — deliberate.** The
  retirement's three reasons are above. The interim rule stays.
- **ARCHITECTURE: EDITED, in two places, because C-07's CONTRACT
  changed rather than its implementation.** (1) **C-07's row** said
  "Rust crate + small binary: code → graph.json" and listed the binary
  as future work ("Rust lang T-010, binary T-014 — milestone 4"). Both
  halves were wrong after this merge: the binary exists, and it now
  GATES and READS as well as writes. The row names all five commands,
  the shared exit-code contract, and points at ADR-015's addendum for
  the join; status stays **building** because **T-010 (Rust language
  extraction) is genuinely still open**. (2) The **"Map data (F-06)"
  bullet** said "derivation is pure TS inside C-05 (ADR-015)" — now
  INCOMPLETE in exactly the way T-042 found the Interfaces bullet to
  be. It gains a "Since T-014" clause that keeps the decision intact,
  states the join is a READER, cites the 252 byte-identical fact lines,
  and names T-014-s6 as the place the promise breaks.
- **THE STALE-ENUMERATION TRAP WAS SWEPT FOR, and it held.**
  ARCHITECTURE's note for T-010 says **FOUR** `.rs` files under
  `app/src-tauri/` are claimed by no component. Re-derived over the
  merged tree against every registry `paths:` glob: **still exactly
  four** — `acl_pin.rs`, `bin/fake_agent.rs`, `index_cmd.rs`,
  `tests/agent_runner.rs`. T-014's new Rust (C-07-claimed `.rs` rose to
  31 of 44) is entirely inside `crates/nputer-index/**`, which C-07
  already globs. **Left alone because it is right, not because it was
  not read.**
- **ROADMAP: EDITED**, and the established discriminator ("does the
  task add a USER CAPABILITY") comes out YES — with a twist worth
  naming: the capability is not a pane. F-06's backbone line gains a
  clause saying the feature now has a **SECOND SURFACE** — the binary
  reads the same committed graph from a shell, and `arch drift
  --fail-on` turns drift into something a build can FAIL on rather
  than only something a human can look at. There is no Milestone 4
  section to tick; milestones stop at 3.
- **`docs/architecture/components/C-07-nputer-index.md` NOT EDITED**,
  though its prose ("Emitting graph.json is its entire job") is now
  incomplete in the same way the two edited bullets were. Left alone on
  the standing precedent: the registry is the ARCHITECT's territory,
  and editing a registry file at a merge is the one thing that fires
  the T-024 three-fixtures rule. **Flagged for the architect, not
  silently absorbed.**
- **THE TASK FILE'S STAMPS WERE COMPLETE** on the branch side — all
  five correct — so only `status: building → done` changed, exactly
  one line. **Parser-validated before and after**: **0 issues** both
  times, and the re-parse reads all five stamps back correctly.
- **NO NEW ADR (three-prong).** (a) The one decision in this task —
  whether a second reality-side join may live in Rust — was RULED, and
  it landed in the right instrument: **an ADR-015 addendum, applied
  this merge**, which is lighter than a new ADR and names its own
  revisit trigger. Writing ADR-018 would duplicate it. The exit-code
  contract is a CONVENTION whose home is the Build & test bullet, and
  that edit is deferred with the retirement (T-014-s8). The Tailwind
  finding is a hygiene defect, not a decision. (b) **Prong two is not
  vacuous, and was verified mechanically rather than asserted.**
  ADR-015 holds, qualified — see the addendum. ADR-014 holds and was
  EXERCISED: the graph is committed, deterministic, and proved current
  by the new instrument. ADR-003 holds — the binary is precisely the
  "future CLI shells out to it" shape, and **no model call was made
  anywhere**. ADR-012/ADR-010 hold: **zero** added or removed
  `#[tauri::command]`, `invoke_handler`, `invoke(`, `listen(` or
  `emit(` call sites across the whole diff. ADR-011 holds: the family
  restricted to `method/`, `app/src-tauri/capabilities/` and every
  manifest/lockfile/tsconfig/vite/vitest/tauri.conf/`.nputerignore`
  returns **two** files — the crate's `Cargo.toml` and `Cargo.lock` —
  and the lock moves by **one line** (`+ "notify-debouncer-mini",`)
  with **zero** `name`/`version`/`checksum` lines added: the crate was
  already locked at `=0.7.0` for the app, so no package and no subtree
  arrived. ADR-016 holds (the done card carries its two-mark set).
  ADR-002 holds. ADR-017 unaffected. ADR-018 does not exist; the
  register ends at ADR-017. (c) Prong three: the durable calls live in
  the card's criteria→evidence map, the exit-code contract section,
  the seven proof obligations, the convergence attacks and the
  verifier's fork ruling.
- **THE CONTROL-BYTE HABIT WAS RUN AND IS CLEAN.** `file(1)` over all
  36 merged files before the merge commit: every one text, **none
  classified `data`**. The ADR-015 addendum was appended **by a
  script** rather than typed (escape text cannot be typed reliably
  through the editing tools — eleven reproductions across four
  sessions), then byte-verified against the draft and scanned: **0
  control bytes outside TAB/LF**.

**THE SHARED-INDEX HAZARD did not recur.** `git diff --cached --stat`
was checked before **both** commits and the staged set was exactly
this session's each time — the merge staged exactly the branch's 36
files, verified by `diff` against the enumerated branch set. House
shape held: **merge → checkpoint**, two commits.

The t014 worktree is removed and its branch KEPT — **36 task branches
merged now**. Main tree clean; every suite green; the token lint green
over 99 files at zero allowlist; the committed graph current and
proved so **twice, by two independent instruments**. The parser
re-parses the whole live tree at **0 issues**: **112 tasks**, tally
**37 done / 14 planned / 9 parked / 52 suggested / 0 building**, 6
features, 11 components. (T-014's card was already on main as
`building`; the branch brings its eight suggestion files.)

**NO STANDING SECURITY GATE.** T-025-s6 closed at T-039 and nothing
replaced it. T-014 adds no security surface: zero IPC call-site
movement, no new dependency, one lock line, and `acl_pin.rs` is a
0-byte diff. What it ADDS to the surface is worth naming precisely:
**`registry.rs` is a new untrusted-input reader** — it parses
component frontmatter in Rust — and **T-014-s6 is exactly a leniency
finding against it**. It is not a vulnerability (the inputs are
repo-local files), but it is the first non-TypeScript parser in the
project reading documents, and the ADR-009 discipline that hardened
the TS one has no Rust counterpart. The sharpest open set is otherwise
unchanged and still app-agent's: **T-047-s5**, **T-047-s6**,
**T-047-s4**, **T-047-s1**; beside them **T-046-s1** and **T-041-s4**.

LAUNCH ITEM, carried forward — **watch the first CI run** (T-020).
T-014 adds **zero lane specs** and **zero CI steps** (`.github/` is a
0-file diff), so the workflow is unchanged in shape — but it adds
**four new cargo test binaries** whose contents are the most
platform-sensitive Rust in the repo: `tests/watch.rs` drives a real
filesystem watcher with debounce timings measured on FSEvents, and
notify's inotify backend on Linux is not that backend. **If anything
in the nputer-index suite reds on Linux, read the TIMINGS before
assuming a logic bug** — the same caution T-042's transition tests
carry. Otherwise unchanged: the ubuntu apt/webkit2gtk set; the three
`uses:` SHA pins; the `e2e types` step (still never executed on any
runner); playwright-on-Linux — **still 54 tests**; T-034's
`map-tasks-lens-dom.test.tsx` reading the BUILT stylesheet, so
**build-then-test ORDER is load-bearing**; `cargo audit`; the xvfb
boot check; and the THREE T-018 SENTINEL live tests.

## Next up (1–4)
1. **T-027 IS BUILDING** in `../nputer-t027`, cut from `e92056a`.
   Nothing to dispatch until it returns. When it does: the third
   triage over a settled tree. **Four items should go into that triage
   already ranked**, because this merge measured all of them:
   - **T-014-s8 — the retirement, as ONE designed commit** touching
     CONVENTIONS + `workflow-parity.spec.ts` (+ `ci.yml` if
     `index --check` becomes a step). The `index --check` disposition
     is an architect ruling, not a mechanical edit.
   - **"Dispatch lanes from the CHECKPOINT, not the merge"** — one
     line, six-for-six evidence, no CONVENTIONS home yet (T-014-s3).
   - **The `<main-before>..HEAD` clause** in both gate bullets — five
     integrators have now hit it.
   - **The Tailwind/`app/src-tauri` finding** above — a Rust
     identifier is in the shipped CSS and no gate can see it.
2. **@human — THE APP IS NOT RUNNING.** 1420 is free; vite pid 64249
   and webview 51954 are both gone (see above — cause undetermined,
   the boot check is exonerated). **When you restart it you will pick
   up everything at once**: T-042's genesis-switch truthfulness (JS)
   and T-014's 23 CSS bytes, which change nothing you can see.
   - **T-042's case is worth trying first**: start an interview on a
     folder that ALREADY has a `docs/`. It used to lie; it does not
     now. (This retires T-026-s4 rather than answering it.)
   - **THE SIX T-034 JUDGMENTS, all yours, none self-answerable**:
     (1) the terracotta in both schemes beside a `rejected` card — the
     margin over `--destructive` is **1.42 units**, a tie decided by
     the SEMANTIC argument; (2) the blocked ghost against the ready
     grey; (3) **WAVE 0 IS A WALL — T-034-s1, the big one**: 32 of 50
     cards in one wave, a 1440×3818 canvas in a ~600 px pane — the
     question is whether the lens is USEFUL here, not whether it is
     correct, and correct it demonstrably is; (4) where the lens
     control belongs (T-034-s4); (5) two segmented controls in one
     header three feet apart; (6) the tasks-lens header's empty right
     side.
   - **STILL OPEN FROM T-030: the model badges should be SHORT.**
     T-020's and T-024's cards should read `opus`; T-001's
     verified-by badge should read `+`. **The judgment that is yours:
     `+` is honest but ugly** — T-030-s1, four fixes costed.
   - **THE HEADER'S DENSITY, T-049's item** — three equal outline
     buttons, so "Start an interview" looks exactly like "Toggle
     theme"; no `⌘O · ⌘N` hint; neither group wraps or truncates; and
     the header says `Open folder…` where the other two say `Open a
     folder…`.
   - **T-050's TWO OPEN JUDGMENTS**, and **T-050-s2 still matters
     more**: escaping the failure screen with "Open a folder…" rather
     than "Try again" reaches a board with real content that is
     **silently dead**. **Use "Try again".**
   - **The frame at 800×600** (T-048). **THE COMPOSITION QUESTION,
     T-027's** — the split view; T-027 is building against it now.
   - **T-024's pane, light AND dark**; **T-026's front door, light AND
     dark** (read **T-048-s4 BEFORE T-048-s3** — s3's conclusion is
     wrong); the at-a-glance amber judgment; the launch-shot
     re-judgment; the T-023 dry-run conversational quality; the real
     picker flows; the `tauri dev` quit-the-app orphan check (watch
     for T-025-s7's ~5 s hang, expected and harmless).
   - **The T-047-s6 stray, a decision not a look.**
     `~/.claude/projects/-private-var-folders-…-t047va-count-97806-…/`
     — outside the repo, deliberately not deleted. **Delete or keep.**
   - **ONE REAL OBSERVED PLANNER TURN, on an authenticated machine** —
     still the biggest unobserved thing in the project. This machine's
     `claude` OAuth token is revoked, so no model call has ever gone
     through the runner. **T-025-s2 carries the exact command.**
   - **A Linux run** — the "watch the first CI run" item above.
3. MILESTONE 3 (T-023…T-029 + T-039 + T-041 + T-047…T-050 + T-042,
   ADR-017). **What holds it is T-027, which is building**, then T-028
   and T-029 (both `blocked_by: [T-027]`). The milestone is NOT
   claimed: hand-driven genesis ships, the runner exists and is
   hardened at four boundaries, the genesis switch tells the truth —
   but **no agent loop has ever run against a real model.**
   **MILESTONE 4 gained its first completed task tonight**: T-014 is
   the first F-06 remainder card through the pipeline. T-010, T-013
   and T-015 remain, and **T-010 is now the interesting one** — it
   makes `languages: ["ts"]` false, which is what would finally index
   the 44 `.rs` files, turn the four unclaimed ones into live
   unmapped-territory findings, and give `arch drift` something new to
   say.
4. OVERNIGHT DISPATCH GRANTS (human, 2026-08-16/17 nights) and the
   BACKLOG. Grant 1 (**milestone 3 to completion**) is what T-027
   executes; grant 2 **closed entirely at T-034**; grant 3 (third
   triage applied) stands, and **tasks NEWLY created by triage still
   do NOT dispatch without the human.** Unchanged method rules: a
   second REJECTED parks a lane for the human; @human judgments are
   never self-answered; no screen control beyond the ruled boot check;
   **port 1420 is the human's even while nothing holds it.**
   Lane availability: **crate-index is FREE as of this merge** (T-014),
   which matters for **T-010**, **T-013** and **T-015**;
   **app-interview and app-shell are TAKEN by T-027**; **app-agent**
   free (unblocks **T-043**); **lib-parser** free (**T-031**,
   **T-032** — and **T-032 carries T-034-s7**, a criterion that reads
   as an instruction to type a control byte and **should be amended
   BEFORE it is built**); **tools/e2e** taken by T-027; **app-map**
   free (T-013, T-015, T-032's map-badge half). The standing app-shell
   queue's next named item is **T-022** (M, milestone 4,
   `blocked_by: []`), which T-034-s3 made bigger.
   **SUGGESTION BACKLOG — 61 open files: 9 parked + 52 suggested.**
   **T-014 contributes EIGHT**, the largest single-task contribution
   yet — **s6** (VERIFIER-FILED: the two joins silently disagree on
   quoted escapes; the three-refusal close; feeds ADR-015's addendum),
   **s8** (T-045 inverted the CONVENTIONS-draft hazard — the
   retirement must land as one commit), **s3** (the stale-graph
   window, six for six, and the dispatch-from-checkpoint rule),
   **s4** (nothing in `cargo test` pins `default-run`; 296 green with
   it deleted), **s1** (where the arch join belongs — the one the
   addendum answers narrowly and the architect may widen), **s2**
   (nothing pins the two joins together — note the verifier's
   correction: a live-registry pin would NOT have caught s6, because
   the live registry is clean), **s7** (the debounce pin restates its
   own literal), **s5** (watch triage errs toward re-indexing —
   honest, correctly self-ranked low).
   **Untriaged (52)**: the eight T-014 cards above — plus the three
   T-042 cards (**s3**, **s1**, **s2**) — the seven T-034 cards
   (**s1** @human wave-0 wall, **s5** lift the C0 gate into
   `lint:tokens`, **s6** binary-skipping SEARCHERS, **s7** amend
   T-032 before it is built, **s4** @human lens-control home, **s3**
   T-022 absorbs `lens`, **s2**) — the four T-045 cards — the five
   T-030 cards (**s3 PROMOTE FIRST, deadline PASSED**) — the three
   T-050 cards (**s2 FIX FIRST**) — the four T-049 cards — the five
   T-048 cards (**s2**, **s4** before **s3**) — the six T-047 cards
   — plus **T-041-s2**, **T-041-s4**, **T-046-s1**…**s4**, and
   **T-039-s3**.
   **The nine parked, unchanged**: T-003-s2, T-008-s1, T-018-s1,
   T-021-s1, T-026-s1, T-025-s2 (@human), T-025-s4, T-025-s3,
   T-038-s1. Triage-born tasks standing ready and un-dispatched:
   **T-043**, **T-044**, **T-051**.

## Open questions
- **Does the BOOT GATE rule retire, and when?** Carried forward, and
  **T-014 is the strongest argument yet that it must NOT.** Its
  sibling rule (T-009-s1) names its retirement and that condition has
  now half-arrived; BOOT GATE names none. **NINE exercises in, and
  this is the third consecutive merge where the gate FIRED and RAN** —
  and the first where the diff itself created the hazard the gate
  exists for: **three bins across two packages**, T-040's exact class.
  T-014-s4 sharpens it into a fact: with `default-run` deleted the
  whole 296-test suite is green and **only the boot gate stands
  between the manifest and a non-launching app.** The
  `<main-before>..HEAD` wrinkle is now measured at three consecutive
  merges (here: 27 correct against 35 naive). **Five integrators have
  hit it.** Left for triage.
- **Should `method/` name the class of CONVENTIONS-level pipeline
  gates?** **Still LIVE, and T-014 is the case that makes it
  concrete**: the task's own deliverable IS a gate, drafted in the
  BOOT GATE's exact shape (trigger → command → record → the
  IF-it-cannot-run clause → why it exists). Three rules already share
  that shape and a fourth was written for this one, yet
  `method/roles/executor.md` still says only "run the test commands
  from CONVENTIONS.md until green". A method version bump, not an ADR.
- **When does the C0/searchability rule become a gate?** Unchanged in
  substance: eleven reproductions across four sessions, none caught by
  a gate, the habit five-for-five. **T-014 adds an ADJACENT finding
  that argues the same way**: the Tailwind/`app/src-tauri` case above
  is another instance of *the gate cannot see the directory the
  problem is in* — `lint:tokens` walks three roots and the Rust tree
  is not one of them, exactly as T-034's C0 gate walks
  `app/src/architecture/` only. **Two different hazards, one shape:
  the walk policy is the gate.** That is an argument for making walk
  policy explicit and reviewed rather than incidental, and it is
  T-034-s5's territory. The architect's call (ADR-004).
- **Does the shared main working tree need a rule?** Carried forward
  with a **NINTH face, and it is the worst one so far.** The previous
  eight were about artifacts — the bundle moving under a human who was
  looking at it. This time **a running process died during a merge**
  (vite 64249 + webview 51954), the boot check is exonerated, and the
  two candidate causes are "the human quit" and "the ADR-011
  fresh-install `rm -rf app/node_modules` under their live server".
  **The merge cannot tell which**, and that inability is itself the
  finding: an integrator following documented discipline cannot
  currently know whether it just disrupted the human's session.
  Method/process, so the architect's (ADR-004).
- **When does spawn hygiene become an ADR?** Unchanged: when T-047-s5
  lands.
- **Does a verifier's remedy belong in an acceptance criterion?**
  Carried forward, and **T-014 is the EIGHTH data point with yet
  another shape: a verifier who RULED a fork the criteria left open
  and then filed the residue as a card.** Criterion 2's plain words
  required `arch`; the verifier confirmed the narrowing was genuine,
  ruled the join stays as built, and filed T-014-s6 for the exception
  — then said explicitly that **ADR-015 needs an addendum rather than
  an amended criterion.** That is the cleanest separation yet of "the
  criterion was met" from "the decision record is now incomplete", and
  it is the shape to reach for when a task's build is correct but its
  rationale has aged. The architect's call (ADR-004).
- **When a task retires a test, who owns the property it was reaching
  for?** Carried forward from T-045, unchanged.
- **What does the pipeline owe a task whose builder vanishes
  mid-flight?** Carried forward from T-050, unanswered.
- **Should a card's own numbers be treated as a claim to verify rather
  than a brief to implement?** **T-014 is the FIFTH instance in five
  merges, and the first where the correction was caught BEFORE the
  claim shipped rather than after.** The builder's own headline ("the
  regen ritual was skipped at T-050") was wrong; the builder corrected
  it in a follow-up commit (`cf28421`) and the verifier then proved
  the stronger, opposite fact — six-for-six, the rule never described
  the practice. **The correction is the better finding, and it is
  recorded as a correction rather than quietly replacing the claim.**
  Alongside it, this merge re-derived the ADR-015 addendum's numbers
  against the verdict before committing and found them all sound, but
  flagged that two (92 assignments, 22 D1 edges) are branch-point
  measurements which main's advance has moved to 100 and 24. The
  candidate rule is unchanged and now overdue: a numeric claim in a
  card body is EVIDENCE TO REPRODUCE; a task that reproduces it
  differently SHALL record the corrected number; and **a number copied
  from another task's report is the highest-risk kind, because nobody
  owns it.** Method version bump, the architect's call (ADR-004).
