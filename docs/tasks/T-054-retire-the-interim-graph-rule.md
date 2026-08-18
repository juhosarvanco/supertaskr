---
id: T-054
title: Retire the interim graph rule — make `index --check` the gate CI actually runs
feature: F-06
milestone: 4
priority: 3
size: M
status: building
blocked_by: []
touches: [docs, method, tools/e2e, ci]
builder: claude-opus-5 @T-054
verifier:
built_by: claude-opus-5 @T-054
verified_by:
review:
---

Absorbs: T-014-s8 (architect, 2026-08-17). The suggestion file is
removed in the same commit as this card. T-014 drafted the retirement
and deliberately did not apply it ("DRAFTED FOR THE INTEGRATOR — not
applied here"); T-014's verifier then measured that the draft can no
longer be applied alone. This card carries both halves plus the
architect ruling the retirement was waiting on.

Also absorbs: T-014-s3, T-045-s1, T-045-s4, T-049-s1 (triage
2026-08-17, merged into this card rather than given a second one).
All four land in the same three files this card already opens —
`docs/CONVENTIONS.md`, `tools/e2e/tests/workflow-parity.spec.ts` and
`.github/workflows/ci.yml`. Their suggestion files are removed in the
same commit as this line. Sized S to **M** on that merge.

**One criterion that WAS in the triage draft is already discharged and
is deliberately absent**: "both gate bullets name which diff they
read" (`<main-before>..HEAD`, six integrators having hit it) landed
early in **`98f931e`**, before the triage was applied, in both bullets,
with the 9-against-36 measurement and the honest limit that it has
never changed *whether* a gate fires — only what the checkpoint claims
was touched. Do not re-do it; read it as context for the wording of
everything below.

## The finding that decides this card

`docs/CONVENTIONS.md`'s INTERIM integrator rule says it "retires when
T-014's `nputer index --check` becomes the gate". T-014 shipped that
command. So the question was framed as *may we now retire a rule?* —
and framing it that way hid what was actually measured while writing
this card:

**CI has never gated graph currency. Not once.**

- `.github/workflows/ci.yml:127` runs bare `cargo test`, which SKIPS
  `#[ignore]`d tests.
- `self_graph_is_current` — the byte-comparison against the committed
  `docs/architecture/graph.json` — is `#[ignore]`d
  (`crates/nputer-index/tests/self_graph.rs:58`). Its own module doc
  calls itself "the manual `--check` stand-in until T-014".
- `git grep nputer-index -- .github/` returns **zero**. There is one
  workflow file.

So a stale `graph.json` passes CI green today. The dogfood fixtures
assert against the committed graph, so a stale graph and fixtures that
match it agree with each other perfectly. **The only thing that has
kept the graph current is the written ritual and twenty-six
conscientious integrators.** This is not a retirement of a redundant
rule; it is the closing of a gate that has been open the whole time.

## The ruling — `index --check` is a CI step, and here is why not the alternatives

- **NOT `cargo test -- --include-ignored`.** That sweeps in
  `tests/perf.rs`, which is `#[ignore]`d precisely "so the default suite
  never flakes" and which requires a RELEASE build — its own docs say
  "debug numbers are not the criterion", and CI builds debug. (It would
  also REACH `agent_runner.rs`'s real-CLI smoke, but that one is
  additionally env-gated on `NPUTER_REAL_CLI=1` and would skip safely —
  stated accurately rather than as a scare. The perf harness is the
  real objection.)
- **NOT un-`#[ignore]`ing `self_graph_is_current`.** That makes local
  `cargo test` go red whenever anyone edits unrelated TypeScript — the
  exact ergonomic its module doc protects on purpose ("stays hermetic to
  unrelated TS edits and never dirties the working tree").
- **`index --check` as its own CI step** gates the property, leaves
  local `cargo test` hermetic, and touches no other ignored test. It is
  also the disposition T-014's own `Absorbs:` note asked for.

## Acceptance criteria
- THE change SHALL land as ONE commit touching `docs/CONVENTIONS.md`,
  `tools/e2e/tests/workflow-parity.spec.ts` and
  `.github/workflows/ci.yml`. Applying the CONVENTIONS half alone REDS
  the e2e lane by name — T-014's verifier measured it: 11 passed
  baseline, `1 failed, 10 passed` with the drafted block applied, the
  failure naming `index --check`, `index --watch` and `arch` as
  commands the spec has no entry for. **Reproduce that measurement
  before fixing it**, so the commit is known to close a red rather than
  to have never seen one.
- `nputer-index index --check` SHALL be a `CI_SEQUENCE` step placed
  after the cargo suite, with the matching step in `ci.yml`, and it
  SHALL actually fail CI on a stale graph. **Prove it by making the
  graph stale on a scratch copy and watching the command exit
  non-zero** — a gate nobody has seen fail is a gate nobody has seen.
  Record the exit code and the message.
- `index --watch` and `arch` SHALL be `LOCAL_ONLY` with their reasons
  recorded in the spec: a watcher runs until stopped, and `arch` is a
  reporter rather than a gate.
- THE interim rule (T-009-s1) SHALL be retired from `docs/CONVENTIONS.md`
  in the same commit and NOT before — retiring the ritual while CI still
  does not check would leave the property enforced by nothing at all.
  The regen command itself STAYS documented: `--check` detects a stale
  graph but does not produce a fresh one, so integrators still need
  `NPUTER_UPDATE_GOLDEN=1 …` and still commit the result. What retires
  is the obligation to hand-run the byte-comparison, not the regen.
- THE wording of the CONVENTIONS block SHALL be chosen deliberately
  against the spec's own parser, not left to chance. T-014's verifier
  found the derivation "ends at the first `·` segment that does not open
  with a backtick", so **the sentence structure decides which commands
  are visible to CI parity at all** — it flagged three of the five
  backticked commands in the draft. Enumerate which commands your final
  wording exposes, print that list, and confirm it is the list you
  intended. Do not trust the three reported problems to be the complete
  set.
- THE claim at the head of this card SHALL be re-verified first-hand and
  reported: that bare `cargo test` skips the ignored test, that
  `self_graph_is_current` is the only thing byte-comparing the committed
  graph, and that `.github/` mentions `nputer-index` zero times. **If any
  of it is wrong, say so and stop** — the whole ruling rests on it, and
  an architect's premise is evidence to reproduce like any other.

### Merged in at the 2026-08-17 triage

- THE INTERIM RULE'S WORDING SHALL MATCH WHAT INTEGRATORS ACTUALLY DO,
  in whatever survives of it. `docs/CONVENTIONS.md:205-206` says
  "commit `docs/architecture/graph.json` **with the merge**"; the
  house shape is merge → checkpoint, and the regen lands in the
  SECOND commit. Measured at T-050: at the merge commit
  `nputer-index index --check` exits 1 (STALE), at the checkpoint it
  exits 0. The rule and the practice have disagreed for twenty-six
  regens. It cannot simply move into the merge commit, and the notes
  SHALL say why: the checkpoint edits INDEXED fixture files, so a
  regen committed with the merge is stale again the moment they are
  reconciled — the ordering lesson held twelve times. If the rule
  retires wholesale per the criteria above, this becomes one sentence
  in whatever replaces it; if any part survives, it says "checkpoint"
  (T-014-s3).
- THE DISPATCH RULE SHALL BE WRITTEN DOWN: brief lanes to branch from
  the last CHECKPOINT, not from a merge commit. Seven-for-seven —
  T-027 is the seventh worked example (cut from `e92056a`, a
  checkpoint; it inherited a current graph and no inherited red), and
  T-014 is the counter-example (cut from the merge `5927adc`, it
  inherited a stale graph and a red `self_graph_is_current` through no
  fault of its own, and four sibling lanes were dispatched into the
  same window). **This rule is what makes the window harmless; the
  CI gate above is what makes it visible. Both, not either** (T-014-s3).
- THE PARSE SHALL BECOME STRUCTURAL WHERE IT IS CURRENTLY SILENT.
  T-045's verifier attacked the derivation twenty-four ways: 18 red
  loudly, 3 are correctly tolerated, and 3 are SILENT — all one shape,
  a command ARRIVING in a structure the typography rule does not
  recognise (an indented sub-bullet, an indented sub-bullet with its
  own marker, a fenced block after a bullet; each `problems=0
  steps=17`, invisible). The mechanism is `commandBullets()` splitting
  on a newline followed by "- " at column 0, so anything indented is
  glued to the PRECEDING bullet's chunk and never read. An indented
  bullet line and an opening fence inside "Build & test" SHALL push a
  problem NAMING the structure, the way a fifth `run from` bullet
  already does — without teaching the parser markdown. One new fixture
  per shape. **This is directly load-bearing for the criteria above**:
  this card's whole method is writing new commands into that section,
  and the asymmetry is that a command which ARRIVES in an unread shape
  is exactly what stays invisible (T-045-s4).
- TWO OF THE FOUR CI DIVERGENCES SHALL CLOSE while `ci.yml` is open.
  The parse found FOUR where the doc claimed two:
  `npm install`→`npm ci` and the playwright install are genuine
  environment differences and STAY; `npm run lint:tokens` →
  `node scripts/lint-tokens.mjs` and `npm run boot:check` →
  `xvfb-run -a node tools/e2e/scripts/tauri-boot-check.mjs` are CI
  spelling the same command differently and NEED NOT BE. `npm run`
  does not require `node_modules` installed — the scripts are plain
  node and npm only extends PATH — so both become the documented
  command with `working-directory: tools/e2e`, the xvfb wrapper
  staying real on the boot half. That leaves exactly the two the doc
  always claimed. **One local check is required first**: npm's argv
  handling ate a bare `--config` after a script name at T-046, so the
  flag form after a double dash SHALL be sanity-checked before the
  workflow is edited (T-045-s1).
- THE LANE'S HONEST SCOPE SHALL BE RECORDED beside the other gate
  rules: the e2e lane covers what a BROWSER can reach, and
  Tauri-gated affordances are jsdom-plus-@human territory. Two live
  instances, neither a defect and both correct about what a browser
  can do: `runPicker` opens with a not-Tauri early return, so an
  accelerator's ACTION is unobservable in the served bundle — the
  lane can prove a chord was CLAIMED, never that it was OBEYED — and
  both header buttons are gated behind `isTauriRuntime()`, so the one
  screen where they live is the one screen the lane cannot show.
  T-027 made this bigger by adding a whole screen whose actions are
  all IPC. Arms 1 (a DEV-only attempt counter) and 2 (render the pair
  disabled in browser mode) stay AVAILABLE and SHALL be named in
  notes; arm 3 is taken now because a recorded sentence beats a
  second DEV-gated surface that T-041's single-gate argument
  disfavours (T-049-s1).
- THE VERIFICATION PRACTICE THAT CATCHES VACUOUS ASSERTIONS SHALL BE
  RATIFIED where a verifier will read it. Integrators and verifiers
  already mutate every test body and require it to red — 133-for-133
  at T-027 — and nothing in `docs/CONVENTIONS.md` or `method/roles/`
  says so: verified at triage, zero occurrences of "vacuous" or
  "mutation" in either, and the one occurrence of "vacuously" is
  about ACL grants. SIX assertions that cannot fail were caught in a
  single night by a practice that is pure oral tradition. One bullet,
  in the shape the other gate rules already use (trigger → command →
  record → IF-it-cannot-run → why). T-057 fixes what it found; this
  is the rule that found it.

Verification: headless — the reproduced red, the green after, the
staleness proof with its exit code, the exposed-command enumeration,
the three new structural fixtures, and the full tools/e2e suite. No
app code, no Rust code: this task changes documentation, a method
file, a spec's tables and a CI workflow only. **Serialize with T-052**,
which also touches `method/` and `docs/CONVENTIONS.md`.

## Implementation notes

Built by `claude-opus-5 @T-054`, fresh session, in worktree
`nputer-T-054` off **`2fc3475`** (a STATE commit, not a merge — the
dispatch rule this card writes down). Main was never touched; port 1420
was probed read-only at session start and end (one healthy listener, the
architect's app) and never bound, connected to or signalled. This lane
took **16450**, bind-probed free first and empty after.

### THE PREMISE RE-VERIFIED FIRST-HAND (criterion 6) — it holds, all three limbs

Nothing here is taken from the card. Each was run in this worktree:

1. **Bare `cargo test` skips the ignored test.**
   `cargo test -p nputer-index --test self_graph` →
   `test self_graph_is_current ... ignored, byte-compares the committed
   graph.json; run explicitly (see module docs)`, then
   `test result: ok. 2 passed; 0 failed; 1 ignored`, exit 0. The full
   `cargo test` run below reports **3 ignored** across 15 targets and
   exit 0 — a stale graph cannot red it.
2. **`self_graph_is_current` is the only byte-comparison against THIS
   repo's committed graph.** `git grep "architecture/graph.json"` and
   `git grep GRAPH_REL_PATH` over `*.rs` return: `check.rs` (the
   `--check` implementation itself, i.e. the fix), `cli.rs`, `emit.rs`,
   `watch.rs`, `cache.rs` and `tests/cli.rs` — every one of which
   operates on a `TempTree` fixture or a `--root` argument, never on
   this repo — plus `docs_watch.rs`/`index_cmd.rs`, which match on the
   PATH STRING. `app/test/architecture-dogfood.test.ts` and
   `map-dogfood-render.test.tsx` read the committed graph but assert
   DERIVED counts, which is exactly why a stale graph agrees with them.
3. **`.github/` mentions `nputer-index` zero times.**
   `git grep -c "nputer-index" -- .github/` exits 1 with no output;
   `git ls-files .github/` returns exactly one file.

**And the fourth premise, from the merged-in poison criterion, also
holds.** At `2fc3475`, over `docs/CONVENTIONS.md` + `method/roles/`:
"poison" **0**, "mutation" **0**, and the single `vacuous*` hit is
`CONVENTIONS.md:107`, "(vacuously "clean"" — about ACL grants, exactly
as the card said. The practice really was written down nowhere.

### THE RED, REPRODUCED BEFORE IT WAS CLOSED (criterion 1)

Baseline `npx playwright test tests/workflow-parity.spec.ts` →
**11 passed**, exit 0. Then the CONVENTIONS command block ALONE (the
app/src-tauri bullet gaining the three nputer-index commands, nothing
else touched) →

    ✘ 2 › the expected commands derive cleanly from docs/CONVENTIONS.md
      1 failed
      10 passed
      exit 1

naming all three, verbatim:

    lists [app/src-tauri] cargo run -p nputer-index -- index --check --root ../.., which this spec has no entry for
    lists [app/src-tauri] cargo run -p nputer-index -- index --watch --root ../.., which this spec has no entry for
    lists [app/src-tauri] cargo run -p nputer-index -- arch --root ../.., which this spec has no entry for

**11 → 1 failed, 10 passed, the three names.** Byte-for-byte the
measurement T-014's verifier recorded. The three files then landed as
ONE commit, so the commit closes a red it was seen to open.

### THE EXPOSED-COMMAND ENUMERATION (criterion 5)

The derivation was re-implemented inline and CALIBRATED against
`git show HEAD:docs/CONVENTIONS.md` first, where the right answer is
known independently: the spec's `CI_SEQUENCE` (14 non-ci-only) +
`LOCAL_ONLY` (2) = 16 claimed keys, and `problems === []` on main means
the doc exposes exactly those. The re-implementation returned exactly
those 16, so it is a faithful instrument rather than a guess.

Against the final wording it returns **19**, and this is the list I
intended — the 16 unchanged, plus three, all three VISIBLE:

     1-4  [lib/parser]     npm ci · npx vitest run · npx tsc --noEmit · npm run build
     5-9  [app]            npm install · npm run build · npm test · npm run tauri dev · npm run tauri build
    10    [app/src-tauri]  cargo test
    11    [app/src-tauri]  cargo run -p nputer-index -- index --check --root ../..
    12    [app/src-tauri]  cargo audit
    13    [app/src-tauri]  cargo run -p nputer-index -- index --watch --root ../..
    14    [app/src-tauri]  cargo run -p nputer-index -- arch --root ../..
    15-19 [tools/e2e]      npm ci · npm test · npm run typecheck · npm run lint:tokens · npm run boot:check

**THE TRAP BIT ONCE, IN DRAFT, AND THE ENUMERATION IS WHAT CAUGHT IT.**
The first wording legended the exit codes as `exit 0 current · 1 STALE ·
2 usage · 3 could not run` inside the `index --check` parenthetical.
Those `·` characters are the SPLITTER: the segment `1 STALE` does not
open with a backtick, so the list would have ENDED there and `cargo
audit`, `index --watch` and `arch` — three of five commands, including
one that already existed — would have silently vanished from CI parity.
Rewritten with commas. **The rule for anyone editing that section: a `·`
may not appear inside a command's parenthetical, only between commands
or after the last one** (which is why the tools/e2e bullet's `Exit 0
booted · 1 …` legend sits at the very end, and it is not decoration).

### THE GATE, WATCHED FAILING (criterion 2)

All four runs are `cargo run -q -p nputer-index -- …` from `app/src-tauri`.

**A. As CI will run it — exit 0:**

    [nputer-index] graph.json is CURRENT - ../../docs/architecture/graph.json matches a fresh index (532485 bytes, 114 files, 916 symbols, 1408 edges)

**B. THE FALSE RED, the same command without `--root` — exit 1:**

    [nputer-index] graph.json is STALE - the committed graph does not match a fresh index of this tree
    [nputer-index]   committed:   MISSING at docs/architecture/graph.json
    [nputer-index]   regenerate: nputer-index index --root .

**C/D. A REAL stale graph on a scratch copy — exit 1.** The copy is an
rsync of this worktree minus `node_modules`, `target`, `.git` and
`dist`; it read CURRENT at the identical 532485 bytes first, as a
control. Adding one indexed file:

    [nputer-index] graph.json is STALE - the committed graph does not match a fresh index of this tree
    [nputer-index]   committed:   532485 bytes · 114 files · 916 symbols · 1408 edges
    [nputer-index]   fresh index: 532977 bytes · 115 files · 917 symbols · 1408 edges
    [nputer-index]   files  +1  -0  ~0
    [nputer-index]   | + app/src/t054-stale-probe.ts

**E. And the realistic shape — EDITING an existing indexed file, exit 1:**

    [nputer-index]   files  +0  -0  ~1
    [nputer-index]   | ~ app/src/lib/docs-model.ts  (content, loc 297 -> 299, symbols 14 -> 15)

**THE CARD AND STATE ARE SLIGHTLY WRONG ABOUT HOW TO TELL B FROM C, AND
CONVENTIONS NOW SAYS THE MEASURED THING.** Both describe the false red
as "reports the graph MISSING"; what it actually prints is the STALE
headline — **identical to a real red** — with `committed: MISSING at
docs/architecture/graph.json` on the SECOND line. My own first draft of
the CONVENTIONS sentence repeated the error ("the message says MISSING,
staleness says STALE") and was corrected against the transcript above.
The discriminator is the second line, not the headline.

**AN INCIDENTAL PROOF WORTH KEEPING:** the scratch copy has **no
`node_modules` anywhere** and still indexed to a byte-identical graph.
So the gate is insensitive to whether dependencies are installed, and
its placement in `ci.yml` after the npm steps is a convenience rather
than a precondition.

### WHAT CHANGED, PER FILE

**`docs/CONVENTIONS.md`.**
- The `app/src-tauri` command bullet gains `index --check` (between
  `cargo test` and `cargo audit`), `index --watch` and `arch`, each with
  its reason, plus a trailing paragraph on why `--root` is load-bearing
  and how to tell a false red from a real one.
- The CI bullet drops from **FOUR** deliberate divergences to **TWO** —
  `npm install`→`npm ci` and playwright's `--with-deps`, the two genuine
  environment differences — and records the new spellings of the lint
  and boot steps plus the two LOCAL_ONLY nputer-index commands.
- **The INTERIM rule (T-009-s1) is GONE**, replaced by **GRAPH REGEN**:
  same trigger, same regen command, `with the merge` → **with the
  CHECKPOINT** with the reason (the checkpoint edits INDEXED fixtures,
  so a merge-commit regen is stale again on reconcile — T-050's exit 1
  at the merge and 0 at the checkpoint), and an explicit split of WHAT
  RETIRED (the hand-run byte-comparison) from WHAT DID NOT (the regen —
  `--check` detects, it never produces). The old rule's second
  `cargo test … --ignored` byte-identity re-run is what retires.
- Three new bullets beside the other gate rules: **DISPATCH FROM THE
  LAST CHECKPOINT**, **POISON DRILL**, **THE E2E LANE'S HONEST SCOPE**.
  The poison bullet uses the standing gate shape (trigger → command →
  record → IF-it-cannot-run → why) and is deliberately STRICTER than
  the oral practice: it says mutate every new or changed **assertion**,
  not every body, because a body-level mutation reds at assertion one
  and never reaches assertion four — which is how a vacuous assertion
  survives a drill. I then held myself to that stricter rule (below).

**`tools/e2e/tests/workflow-parity.spec.ts`.** `index --check` added to
`CI_SEQUENCE` as **verbatim** immediately after `cargo test`; `--watch`
and `arch` added to `LOCAL_ONLY` with reasons; the lint and boot
mappings rewritten to the documented commands; the boot test now finds
its step by `boot:check` and additionally asserts
`working-directory: tools/e2e`; the derived-step floor 15 → **18** and
the restructured-section complaint count 16 → **19**; a new exported
`structuralProblems()` wired in at step 0 of `deriveExpectedSteps`; and
**three new fixtures**, one per silent attack.

**`.github/workflows/ci.yml`.** The `graph currency (nputer-index index
--check)` step after the cargo suite; the two lint steps and the xvfb
boot step now invoke the documented npm commands, the boot step gaining
`working-directory: tools/e2e`.

### THE STRUCTURAL GAP (T-045-s4) — and how the fixtures avoid passing for the wrong reason

`structuralProblems()` flags two SHAPES inside "Build & test": a line
matching `^[ \t]+- ` (an indented bullet), and a line that opens a code
fence with three backticks. It teaches the parser no markdown. **`+`
and `*` are deliberately NOT flagged**, because the section legitimately
wraps prose onto a line beginning `  + nputer-index crate suite` — a
rule that reds on real prose is a rule editors learn to route around.
The section as it now stands contains **zero** indented bullets and
**zero** fences, verified mechanically, so the new rule does not
false-positive on my own wording.

Each fixture asserts BOTH halves — that the smuggled command really is
invisible (`after.steps` equals `before.steps`, which is the
`steps=17`-unchanged half of T-045's measurement) and that the lane now
names the shape. The second fixture additionally asserts the SILENCE it
exploits: an indented `run from tools/extra/:` marker produces **no**
"no longer carries exactly the four" complaint, because the loudest
guard in the derivation cannot see it either. Without that assertion the
fixture could have passed on the four-bullet guard rather than on the
new rule.

### THE TWO CI DIVERGENCES CLOSED (T-045-s1), WITH THE SANITY CHECK THE CARD REQUIRED

**The npm argv check, run before the workflow was edited:**

    npm run lint:tokens -- --selftest
      → lint-tokens selftest: 49 samples green, 14 walk-policy checks green   exit 0

    npm run lint:tokens --selftest        (the bare form, T-046's hazard)
      → npm warn Unknown cli config "--selftest".
      → lint-tokens: clean (114 files scanned …)                              exit 0

**The bare form does not error — it silently runs the WRONG COMMAND at
exit 0**, which is worse than a failure and is why the `--` is in the
workflow. **And the no-node_modules claim is measured, not argued**:
`npm run lint:tokens` was run in this worktree BEFORE `npm ci` had ever
been executed in `tools/e2e` (the directory did not exist) and returned
`clean (114 files scanned …)`, exit 0. So the lint can keep its place as
the job's first step.

**The boot half is safe for a reason that is checkable**: both
`lint-tokens.mjs` and `tauri-boot-check.mjs` derive `repoRoot` from
`import.meta.url` (`:91`/`:93` and `:57`/`:58`), never from
`process.cwd()`, so invoking them through npm from `tools/e2e` is
behaviourally identical to the old repo-root `node …` form.

### SUITES — all first-hand in this worktree, exit codes read from `$?`, never piped through `tail`

| suite | result | derivation |
|---|---|---|
| lib/parser | `npx tsc --noEmit` 0 · `npm run build` 0 · `npx vitest run` **225/225 (11 files)**, exit 0 | main's 225/11 + ZERO parser files = 225/11 |
| app | `npx tsc --noEmit` 0 · `npm run build` 0 · `npx vitest run` **768/768 (41 files)**, exit 0 | main's 768/41 + ZERO app files = 768/41; bundle `index-ByWKsUIt.js` 488.81 kB / `index-DVAVecvn.css` 43.79 kB, hash-identical to main's |
| app/src-tauri | bare `cargo test` **299 passed / 3 ignored / 0 failed**, 15 targets, **0 warnings**, exit 0 | main's 299 + ZERO Rust files = 299 |
| tools/e2e | `npm run typecheck` 0 · `NPUTER_E2E_PORT=16450 npm test` **73 passed in 13.1 s**, exit 0, no skips, no retries, no flakes | see below |
| lint:tokens | `clean (114 files scanned under app/src, app/test, tools/e2e)`, exit 0 · `-- --selftest` **49 + 14 green** | main's 114 + ZERO new walked files = 114 |

**THE E2E COUNT, DERIVED TWO WAYS, AND THE COUNTING TRAP HAS MOVED.**
Simple: main's 70 executions + 3 new `test(` declarations, none inside a
loop, = **73**. Structural: **73** raw lines matching `test(` across the
specs, minus **THREE** false positives, plus **3** for the three
two-iteration loops (`keyboard-activation:34`, `panel-real-keys:40`,
`window-contract:318`) = 73.

**STATE records ONE false positive (`workflow-parity.spec.ts:442`,
`i.match.test(s.run)`). THIS BRANCH ADDS TWO MORE** — `structuralProblems`
tests two regexes against a line, at `:160` and `:169`. So the next
integrator's derivation is **raw − 3 + 3**, and the raw baseline moves
68 → 73. Recorded here because STATE's version of this arithmetic will
otherwise be off by two and land on 75.

### POISON DRILLS — 18 assertions, 18 REDS, plus 2 discrimination drills

Run inline, no scratch script, against the committed blob; restored with
`git checkout` between every round.

Seventeen of the eighteen are new or changed by this task; the
eighteenth (`expect(problems).toEqual([])` in the derivation test) is
pre-existing and was re-proven as a by-product.

    R1  the splice neutered (`md.replace(…)` → `md`)
        → RED 12, 13, 14 — the three `.not.toBe(md)` assertions
    R2  the "is an INDENTED BULLET" message text changed
        → RED 12, 13 only. 14 stays green: clean discrimination
    R3  the "carries a CODE FENCE" message text changed
        → RED 14 only. 12, 13 stay green
    R4  DISCRIMINATION: the indented rule made to fire on EVERY line
        → RED 2, the derivation test — proof that structuralProblems is
          really wired into deriveExpectedSteps, and that a rule which
          over-fires reds the lane rather than passing quietly
    R5  floor 18→19 · boot run string · restructured 19→20 · the clippy
        needle · fence count 2→3
        → RED 2, 6, 11, 12, 14
    R6  boot `working-directory` · the three "genuinely unread"
        step-equality assertions flipped to `.not.toEqual`
        → RED 6, 12, 13, 14
    R7  the four-bullet-guard silence assertion · the fence[0] needle
        → RED 13, 14
    R8  the "marker of its own" needle
        → RED 13

**RESTORATION PROVED, not asserted** — sha256 of each working file
against `git show HEAD:<path>`:

    MATCH  100257c931657c32119d1dc1b2d19d4322f55bf1b382a02c941f6428933a40fa  tools/e2e/tests/workflow-parity.spec.ts
    MATCH  4fb144f78aa9fcb8a16452040c0ca26b3d8dda702e088dc203d76442efa7c3cd  docs/CONVENTIONS.md
    MATCH  5598c3ebd8a5191f8f909dc02e1dd4f6139458c9bf76ce0870ef3b04a272ac68  .github/workflows/ci.yml

with `git status --short` and `git diff --stat` both empty afterwards.

**One drill did NOT apply on the first attempt and it is recorded rather
than quietly retried**: a `perl -0 \Q…\E` pattern spanning a newline
matched nothing, so R5 applied five of six substitutions. The diffstat
(`5 insertions(+), 5 deletions(-)` against six intended) is what caught
it — **count your substitutions, never assume a mutation landed**, or a
missing RED reads as a vacuous assertion that is really an unapplied
patch. It was split into R7 with an explicit multiline regex.

### GATE TRIGGERS, DERIVED

- **BOOT GATE: DOES NOT FIRE.** `git diff --name-only 2fc3475..HEAD` is
  exactly `.github/workflows/ci.yml`, `docs/CONVENTIONS.md`,
  `tools/e2e/tests/workflow-parity.spec.ts` — zero files under
  `app/src-tauri/**`, `app/src/**`, `app/package.json` or
  `app/src-tauri/Cargo.toml`. Not run, and the trigger is genuinely
  unmet rather than unrunnable.
- **GRAPH REGEN: the trigger FIRES on the literal wording and the graph
  is provably unchanged** — the diff contains a `.ts` file outside
  `docs/`, but it is under `.nputerignore`d `tools/`. The graph was NOT
  regenerated (integrator's ritual) and `index --check` confirms CURRENT
  at 532485 bytes both before and after all work. Filed as **T-054-s1**.
- **`docs/architecture/graph.json` was never written**, confirmed by
  `git diff --stat` on it and by the pin that `--check` writes nothing.

### FOR THE VERIFIER

- **`status:` was stamped `building`, not `verifying`**, on the
  dispatcher's explicit instruction, matching what T-028's branch
  carried. `method/roles/executor.md` step 6 says `verifying` for a size
  M. The two disagree; the dispatcher's instruction was followed. Worth
  a ruling, not a re-stamp by me.
- **`touches:` still reads `[docs, method, tools/e2e, ci]` and no
  `method/` file was edited.** The poison-discipline criterion says "in
  the shape the other gate rules use", and every other gate rule lives
  in `docs/CONVENTIONS.md`; the card's own criteria and its verification
  note both scope the work to the three files. Fields lock at
  `status: building` (TASK-FORMAT § Lifecycle) so the field was left
  alone — a process note, not a builder decision.
- **The xvfb boot step now has an `npm` process between `xvfb-run` and
  `node`.** Behaviour is identical for the happy path (the script
  manages the `tauri dev` tree, not itself), but no gate in this repo
  can execute a GitHub runner: `ci.yml` is dormant and the boot step has
  never run on any runner. It belongs on the standing "watch the first
  CI run" list (T-020), and it is a change nobody can prove headlessly.
- **`arch drift --fail-on <sev>` is deliberately NOT wired to CI.** The
  registry carries live undeclared edges the architect is holding open
  (T-028's merge added two more), so wiring it would red CI on intent.
  Recorded in `LOCAL_ONLY`'s reason and in the CONVENTIONS bullet.
- **Control-byte habit:** `file(1)` over all four files written
  (`docs/CONVENTIONS.md`, the spec, `ci.yml`, this card) returns text,
  none classified `data`; a C0 scan excluding tab and newline returns
  **0 bytes** in each. `git grep` was used throughout in place of
  `grep`/`rg` wherever a result mattered.

## Verdicts
