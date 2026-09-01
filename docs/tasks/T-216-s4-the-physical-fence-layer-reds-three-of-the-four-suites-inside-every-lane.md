---
id: T-216-s4
title: The physical fence layer reds THREE of the four suites inside every lane — four bodies write tracked files outside the fence, and no lane can measure its own battery
feature: F-06
milestone: 4
size: M
priority: 2
status: verifying
suggested_by: executor claude-opus-5@subagent @T-216-s1
blocked_by: []
touches: [tools/e2e/tests/token-scan.spec.ts, tools/e2e/tests/lane-lock.spec.ts, tools/e2e/scripts/token-scan.mjs, app/src-tauri/crates/nputer-index/tests/cli.rs, app/src-tauri/crates/nputer-index/tests/golden.rs, app/src-tauri/crates/nputer-index/tests/common/mod.rs]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

**FOUND WHILE BUILDING T-216-s1, NOT FIXED THERE** — every path a fix
would touch is outside that card's fence, and the finding is about the
fence itself.

**Class parent: none.** `T-218` owns the CAPABILITIES half of this
collision (a lane cannot regenerate a document it staled); this is a
different half — four TEST BODIES that write tracked files outside the
lane's fence and now fail with `EACCES` rather than running. Disposition
hint: promote. It costs every lane a green battery, which is the reading
a push gate and an integrator both depend on.

## What T-210 armed, and what it caught

`T-210`'s physical layer makes every tracked file OUTSIDE a lane's fence
read-only in that lane's worktree (`lane-lock.mjs`, armed by
`brief.mjs --write-fence`). It is doing exactly what it says. **The
finding is that four of this repository's own test bodies write such
files**, so three of the four suites cannot be green in ANY lane whose
fence excludes `app/`, `lib/` and `method/` — which is nearly every lane.

## Measured on T-216-s1's lane, at `47672fb`, fence `[.claude, tools/e2e, .github]`

    gate-run e2e    exit 1   529 bodies   2 failed
    gate-run rust   exit 101 631 bodies   2 failed
    gate-run parser exit 0   349 bodies   GREEN
    gate-run app    exit 0   1131 bodies  GREEN

The four bodies, each with the mechanism rather than only the symptom:

1. `tools/e2e/tests/token-scan.spec.ts` — *"one runtime-built control
   byte reds all seven first-party roots at exact byte offsets"*.
   It plants a control byte into seven TRACKED files across four
   packages and restores them (`docs/CONVENTIONS.md` describes this side
   effect in the tools/e2e bullet). Four of the seven are outside a
   `tools/e2e` fence:

       EACCES: permission denied, open '<lane>/app/package.json'
       ls -l app/package.json  ->  -r--r--r--

2. `tools/e2e/tests/lane-lock.spec.ts` — *"POSITIVE CONTROL — the
   protocol's own writes all still succeed under the layer"*.
   **This one is indirect and is the interesting one.** Its fixture
   builds a scratch repository with
   `cpSync(<repoRoot>/method, <fixture>/method, { recursive: true })`,
   and `cpSync` COPIES MODE BITS. In a lane, `method/roles/executor.md`
   is `-r--r--r--`, so the fixture's copy is too — and the body then
   asserts that the fixture's *integration checkout* copy is writable,
   which is the very control that separates "the layer reached the lane"
   from "the layer reached everything":

       expect(writable(path.join(fx.repo, OUT_OF_FENCE))).toBe(true)
       -> received false, for method/roles/executor.md

   **A body that proves the layer did not overreach is defeated by the
   layer overreaching into its own fixture.** No lane can run T-210's
   own positive control.

3. `app/src-tauri/crates/nputer-index/tests/cli.rs` —
   *`a_cycle_planted_into_a_fixture_reds_the_real_process_and_is_named_as_a_path`*:

       panicked at crates/nputer-index/tests/cli.rs:309:6:
       Os { code: 13, kind: PermissionDenied }

4. `app/src-tauri/crates/nputer-index/tests/common/mod.rs:44` —
   *`incremental_reindex_after_an_edit_matches_a_fresh_index`*:

       write: Os { code: 13, kind: PermissionDenied }

## Why it is new rather than long-standing

`T-210` landed on 2026-09-01. Before it, an out-of-fence tracked file was
writable and every one of these bodies ran. **The obligation was
satisfied by the guard not existing**, which is the same honest shape
`T-218` records for the census — and, as there, it is not an argument
against arming the layer.

## Why a lane cannot work around it

`lane-lock.mjs --release` exists and is published in `--write-fence`'s
own output, but releasing the layer to make a suite pass is a lane
disarming its own guard to certify itself. `method/lane-protocol.md`
fast path B drops the layer only for a protocol-performed merge, and
re-arms from the manifest afterwards. There is no sanctioned "drop it to
run the battery" and there should not be one.

## What a fix decides

1. **Whether these four bodies should write tracked files at all.** The
   token-scan body already proves its own restoration (sha256 per file
   plus an empty diff); it could plant into a scratch COPY of each root
   instead of the tracked file, which would make it lane-safe and lose
   nothing it currently asserts. The two Rust bodies look like the same
   shape.
2. **Or whether `cpSync` should strip modes** in `lane-lock.spec.ts`'s
   fixture (`{ mode: constants.COPYFILE_...}` has no such option — the
   fix is a `chmodSync` walk after the copy). That one is a two-line
   change and closes instance 2 alone.
3. **Or whether the battery is simply not a lane's to run**, and the
   obligation moves to the integration checkout — which would be a
   change to what a lane reports at handoff, and needs saying in
   `docs/CONVENTIONS.md` rather than being discovered per lane.

## Acceptance criteria

- A lane whose fence excludes `app/`, `lib/` and `method/` SHALL be able
  to reach a green `gate-run e2e` and `gate-run rust` with its physical
  layer ARMED, or `docs/CONVENTIONS.md` SHALL name the seat that owns
  those two readings instead.
- WHERE a body is changed to write a copy, it SHALL keep the restoration
  proof it already has, and a positive control SHALL show the body can
  still fail.
- The `lane-lock.spec.ts` fixture SHALL NOT inherit the lane's own mode
  bits — a fixture that measures the layer must not be built out of a
  tree the layer has already touched.
- Verification: headless.

## Triage — PROMOTED at the T-216-s1 merge, 2026-09-01

**Promoted at the stamp while the context was hot** (orchestrator 2), and
it is the highest-value of the two because of WHAT it costs: **no lane can
measure its own battery.** Three of four suites red inside any fence
excluding `app/`, `lib/` and `method/`, from `EACCES`/`PermissionDenied`
raised by T-210's physical layer against four bodies that write tracked
files.

**Confirmed from the other direction at this merge**: the same suites run
GREEN in the unarmed integration checkout. That is the third-direction pin
this project used for T-216's own reds — armed lane red, unarmed tip
green, unarmed integration green — so the attribution is to the ARMING and
not to any diff.

**Its sharpest sub-finding is that T-210's own positive control is
defeated by T-210**: `lane-lock.spec.ts` builds its fixture with
`cpSync`, which copies mode bits, so the control inherits the very
read-only state it exists to detect.

## DISPATCH, 2026-09-02 — the stamp, and what the audit found

**Fence narrowed at dispatch to the five files the fix lives in**, so the
three sibling lanes cut tonight (T-223, T-230, T-236) stay disjoint by
PATH rather than serialising behind the `tools/e2e` token — lane-protocol
rule 5's own norm, adopted on this board for the first time. The
previous fence `[tools/e2e, app/src-tauri]` was a component-sized
permission; the card's four bodies are in four files and one shared
helper.

**Audit correction (orchestrator 5b)**: instance 4 cites
`tests/common/mod.rs:44` as where the write panics, which is the HELPER;
the test body `incremental_reindex_after_an_edit_matches_a_fresh_index`
lives in `tests/golden.rs`, so both files are in the fence. Instance 3's
body is at `tests/cli.rs` as cited. Both e2e bodies exist under the
names cited (checked against tools/e2e/tests at 2489853).

**Decision 3 is ruled OUT for this lane**: `docs/CONVENTIONS.md` is
outside the fence tonight (T-236 holds it), so "the battery is not a
lane's to run" cannot be written here — build options 1 and 2, and IF a
sentence in CONVENTIONS is still owed THEN route it as a suggestion
naming that fence.

**Holder**: this lane does NOT hold the integration checkout and does
not merge; it stamps `verifying`, reports ready-to-merge with its branch
and tip, and leaves its worktree standing (lane-protocol rules 4 and 6).
review: independent, set at this stamp — the subject is the physical
fence layer, a guard.

## FENCE WIDENED IN FLIGHT, 2026-09-02 — fast path A, the dispatch step performed again

Added `tools/e2e/scripts/token-scan.mjs`: the scanner derives its
repository root from its own module path with no argument and no
environment override, so the card's decision-1 remedy for instance 1 —
plant the control byte into scratch COPIES and scan those — cannot be
written without a root override in the scanner, and the scanner was
outside the fence. Measured by the verifier's phase-1 ground truth at
the base ref, before any diff existed. Re-expanded through
`brief.mjs --write-fence` against the live lanes (T-223, T-230, T-236):
disjoint. The lane's own copy of this card carries the same line,
character for character; the grant is those two files on disk.

## Implementation notes

**Built in `task/T-216-s4-lane-battery-measurable`, from base `e648590`.**
Four files changed, all inside the fence; `tests/cli.rs` and the widened
`tools/e2e/scripts/token-scan.mjs` are untouched, and the second of those
is a deliberate refusal recorded below.

### What was measured before any diff existed, in this lane, armed

    cargo test --no-fail-fast   exit 101   2 failed   (cli.rs, golden.rs)
    npm test from tools/e2e     exit 1     5 failed / 530 passed

TWO suites, not three, and FIVE bodies, not four. Of the five e2e
failures only three are this card's: `token-scan.spec.ts:225` (its
instance 1), `token-scan.spec.ts:356` (the P6 body, which this card does
not name — see the census correction below) and `lane-lock.spec.ts:428`
(its instance 2). The other two are `session-economics.spec.ts` and are
neither this card's nor this lane's; that is pinned below.

### The fix, in two shapes

**RUST — one class fix, two instances, no change to either named body.**
`common::copy_dir` used `fs::copy`, which carries the source's permission
bits, so a fixture materialized inside a lane arrived read-only and every
body that then EDITED the temp tree panicked. `common::unlock` puts the
owner write bit back on the COPY (`| 0o200`, never
`set_readonly(false)` — the exec and group/other bits stay as the copy
found them). `cli.rs:309` and `golden.rs`'s incremental body both go
green with no edit of their own; `cli.rs` therefore has a ZERO DIFF.

**E2E — the plant targets move into a scratch repository.**
`token-scan.mjs` resolves the tree it walks from its OWN MODULE PATH, so
a scratch directory carrying a copy of the scanner and its wrapper under
`tools/e2e/scripts/` is a whole repository to the gate; CONTROL's corpus
is `git ls-files`, so the fixture is a real repository with a real index
(`git init --initial-branch=main` pinned, nothing committed — `add` fills
the index and the index is what `ls-files` reads). Both plant bodies keep
every assertion they had: exit code, hit counts, exact byte offsets, line
numbers, the `(0 TOKEN, 7 CONTROL)` / `(1 TOKEN, 0 CONTROL)` census, the
sha256 restoration proof and T-153-s5's clock round-trip — which is a
property of the HOST rather than of which file is written, and still
reports real deltas (`-33ns … 72ns of 1489`, darwin, uv 1.52.0). They
GAIN a live-corpus half a scratch tree cannot make (these seven paths
really are CONTROL-covered here, at seven DISTINCT first-party roots; and
`tools/e2e/fixtures/shell.ts` really is in the live TOKEN corpus) and a
proof that they leave this tree alone.

`lane-lock.spec.ts`'s fixture stopped inheriting the lane's mode bits
(the card's decision 2, as a `chmodSync` walk after the copy, applied to
the four `copyFileSync` calls as well as the `cpSync`). Three new bodies,
each MANUFACTURING its own read-only source rather than finding one, so
the mutant dies in an unarmed checkout too.

### After, in this lane, armed

    npx playwright test tests/token-scan.spec.ts tests/lane-lock.spec.ts
      -> 24 passed, exit 0
    cargo test -p nputer-index --test golden --test cli
      -> 16 + 10 passed, exit 0

### FOUR CORRECTIONS TO THIS CARD'S OWN PROSE, measured at `e648590`

1. **THREE suites is TWO.** The title, the opening paragraph and the
   triage paragraph all say three; the card's own table and its first
   acceptance criterion say two, and two is right. `gate-run parser` and
   `gate-run app` are green under both the old fence and this one.
2. **The two Rust instances do not write TRACKED files.** Rust `fs::copy`
   preserves permission bits and `materialize_fixture` copies into
   `std::env::temp_dir()`, so both bodies write a TEMP copy that
   inherited a read-only mode from the lane. That is instance 2's shape,
   not instance 1's, and the fix site is `copy_dir` rather than either
   write site — which is why one three-line change closed both.
3. **The census is a census of ONE FENCE.** Under this lane's own fence a
   FIFTH body reds: `token-scan.spec.ts:356`, the P6 body, whose plant
   target `tools/e2e/fixtures/shell.ts` was inside the `[tools/e2e]` fence
   the card was written against and is outside a five-file one. A plant
   target chosen to sit inside a fence moves whenever a fence narrows,
   which is now written into that body's own header.
4. **`{ mode: constants.COPYFILE_… }` reads as though a mode option had
   been looked for and rejected.** There is no mode option on either copy
   call at all; the card's parenthetical is right about the remedy and
   loose about the reason.

### THE FENCE WAS WIDENED IN FLIGHT AND THE GRANT WAS NOT SPENT

At 22:39Z the dispatching seat added `tools/e2e/scripts/token-scan.mjs`
to this card's `touches:` and re-stamped the manifest (`aad0cf7`). Both
halves were read off disk here and AGREE character for character, and the
physical layer has released that file (`-rw-r--r--`). The reason given
was that decision 1 "cannot be written without a root override in the
scanner". **The repository says otherwise and the repository wins**: the
scanner's root is `path.resolve(<its own dir>, "..", "..", "..")`, so a
COPY of the module at `<fixture>/tools/e2e/scripts/` already resolves to
the fixture. It is measured, not argued — mutants M14 and M17 point the
gate back at the live tree and both bodies red.

So the grant is held and unspent, deliberately. A root override on
`token-scan.mjs` would put an argument- or environment-controlled REDIRECT
into the gate CI runs FIRST against a bare checkout — a gate whose stated
design is *"still zero allowlist, by design: no file, line or comment can
mute it"*. A redirect is a mute with a longer name. Keeping the diff
inside test files leaves the shipped gate byte-identical.

### WHAT IS RED HERE AND IS NOT THIS CARD'S — pinned by moving ONE variable

`session-economics.spec.ts:179` and `:365` assert exit 0 from
`brief.mjs`, which computes lane disjointness by crossing the
MACHINE-scoped live worktree list with the card files IN THE CHECKOUT IT
RUNS IN. At `e648590` this lane's copies of `T-223` and `T-230` still
carry their pre-narrowing `tools/e2e` fences; on `main` at `aad0cf7` they
are narrowed and pairwise disjoint. In the detached drill worktree, with
NOTHING else changed:

    sibling cards as at e648590   ->  2 failed / 8 passed, exit 1
    sibling cards as at aad0cf7   ->  10 passed,           exit 0

Same tree, same diff, same machine, same live worktree list. **It is REF
SKEW, and it is already owned**: `T-143-s1` (planned) is these two bodies
by name, and `T-187` (planned) is the class — a lane cut from a checkpoint
reading a stale copy of the board. Recorded here, not re-filed.

### Stale, reported rather than repaired

`npm run capabilities:check` reds in this lane: one e2e test body was
ADDED (`lane-lock.spec.ts` — *the fixture does NOT inherit the mode bits
of the tree it is copied from*), and `docs/CAPABILITIES.md` is generated
from spec names and is outside this fence. The regeneration is the
INTEGRATOR's, in the merge commit, before the checkpoint
(docs/CONVENTIONS.md's capabilities clause).

### Routed

- `T-216-s6` — `npm install` from app/ exits 243 (EACCES on
  `app/package-lock.json`) inside an armed lane; needs
  `docs/CONVENTIONS.md`, which `T-236` holds.
- `T-216-s7` — the class sweep: three more fixtures copy modes out of
  the live tree (`card-preflight.spec.ts`, `lane-fence.spec.ts`,
  `perf.rs`), green today only because none asserts on a copy's
  writability, and `perf.rs`'s body is `#[ignore]`d so nothing can ever
  tell. `app/test` and `lib/parser/test` swept EMPTY.

### For the verifier

- `tests/cli.rs` has a zero diff and is meant to. So does
  `tools/e2e/scripts/token-scan.mjs`, which this lane holds and declined.
- The three new bodies each manufacture their read-only SOURCE. That is
  deliberate and is the only reason a mutant dies in an unarmed drill
  worktree: `method/roles/executor.md` and `tests/fixtures/**` are `644`
  wherever the layer is not armed.
- The `git diff --quiet` companion moved from the plant targets to the
  LIVE tree, where no clock is rewritten, so the stat-cache interaction
  the P6 body's own comment records cannot reach it. The fixture keeps
  the sha256, which docs/CONVENTIONS.md names as the proof either way.
- 18 mutants, 18 kills, 16 of them with a failing-body count of exactly
  ONE. The two that are not are recorded with their reason in the report.

### A HAZARD THIS LANE WALKED INTO, WORTH THE SENTENCE

**A SUB-CARD'S FINDING TAKES THE NEXT FREE `T-NNN-sN`, NOT A SECOND
SUFFIX.** The two routed findings were first filed as `T-216-s4-s1` and
`T-216-s4-s2`, which reads as the obvious spelling for *a suggestion from
a sub-card* and is not a legal task id: `lib/parser` accepts ONE suffix
level (*"field 'id' must be a task id like T-016 or T-016-s2"*). The
board loses the card silently — nothing errors at write time and
`docs-gate.mjs` answered *"every live task card's frontmatter parses,
with a legal status"*, because the ID FORMAT is not what that half
checks.

What caught it is the four-suite battery, in exactly the shape the DOCS
GATE bullet describes: a commit whose entire diff was markdown took
`gate-run parser` to **1 failed / 348 passed** (`smoke — finds zero
issues in the live tree`) and `gate-run app` to **RED over 1131 bodies**,
three layers from the cause. Renamed to `T-216-s6` and `T-216-s7` — the
next free ids beside `T-216-s1/s3/s4/s5` — and both suites are green
again at 349/349 and 1131/1131. **Filed here rather than as a third
card**: the parser's message is already exact, and the reason it took a
battery to find is that the gate which reads frontmatter does not read
ids.

## Verdicts

### V-216-s4 — 2026-09-02, claude-opus-5[1m]@subagent (verifier seat V-T-216-s4): **APPROVED** at `1757f330a4249fc5d90f0e28b14c044ff26799be`

Measured in the verifier bench `/Users/ujju/Projects/nputer-V-T-216-s4`, detached,
with `NPUTER_E2E_PORT=25216` and `CARGO_TARGET_DIR` unset. **Blindness: CLOCK-SHAPED.**
The bench was cut alongside the lane and phase 1 ran while no diff existed; the attack
set and the ground truth were written and `shasum -a 256`-stamped before the tip
existed (`attack-V-T-216-s4.md` `3653282…`, re-stamped after the fence amendment;
`ground-V-T-216-s4.md` `fe021ff…`). I declined nothing, because there was nothing to
decline. **Read AFTER this verdict was drafted, and disclosed rather than denied:** the
card's `## Implementation notes`, the two routed cards' bodies, and the branch's commit
messages. One leak before drafting: `git checkout --detach` printed the tip's subject
line, which I did not seek and could not suppress.

#### The criteria

**AC1 — a lane whose fence excludes `app/`, `lib/` and `method/` reaches a green
`gate-run e2e` and `gate-run rust` with its physical layer ARMED. MET for `rust`; MET
for `e2e` up to three failures that are measured, at the BASE ref, to be nothing to do
with this diff.** The armed state was reproduced by chmod in the bench, never in a real
lane, using this repository's own `within()` and `trackedFiles()`, over the AMENDED
six-path fence (`tracked=1135 locked=647 writable=488`, arithmetic closing).

| suite | base `e648590` ARMED | tip `1757f33` ARMED | tip UNARMED |
|---|---|---|---|
| parser | 0 / 349 GREEN | — | 0 / 349 GREEN |
| app | 0 / 1131 GREEN | — | 0 / 1131 GREEN |
| rust | **101 / 631 RED, 2 failed** | **0 / 632 GREEN** | 0 / 632 GREEN |
| e2e | **1 / 535 RED, 5 failed** | 1 / 536 RED, 3 failed | 1 / 536 RED, 2 failed |

All four instances the card names are closed, and so is a **fifth this card never
named**: `token-scan.spec.ts`'s *P6 reds a planted bare motion utility…*, whose plant
target `tools/e2e/fixtures/shell.ts` is outside this lane's own fence. Phase 1 recorded
that body failing under the five-path fence at the base ref, before the diff existed;
it passes now.

**The three residual e2e failures are attributed, each measured at the base ref:**
- `session-economics.spec.ts:179` and `:365` — REF SKEW. `brief.mjs` computes lane
  disjointness from the live worktree list crossed with the card files *in the checkout
  it runs in*; at `e648590` the sibling cards still carry pre-narrowing `tools/e2e`
  tokens. At main's card set the same four fences give **0 pairwise overlaps** under
  this repository's own `within()`. Present unarmed at base and at tip.
- `lane-lock.spec.ts` *the DISPATCH STEP arms it* — `checkout-currency` STALE: this
  bench is **16 commits behind main and does not contain `33e50b8`**, the newest main
  commit touching `.claude`. Main advanced past that commit DURING this sitting, between
  my 23:15 unarmed run (green) and my 23:23 armed run (red). **Re-measured alone at the
  BASE ref `e648590` at 23:31: it fails there too, same finding, same commit named.**
  Base red, tip red, one cause, and the cause is a fact about this machine's refs.

Body counts rose (**e2e 535 → 536, rust 631 → 632**) and no `test.skip`, `test.fixme`,
`.skip(` or `#[ignore]` appears anywhere in the diff. `gate-run`'s `judge()` refuses only
on zero-bodies and on parts≠baseline, so a skip would have read GREEN at a smaller
denominator; the counts are what rule that out, which is why phase 1 stamped them.

**AC2 — a body changed to write a copy keeps its restoration proof, and a positive
control shows it can still fail. MET.** The per-file sha256 and the microsecond-bounded
`expectClocksRestored` survive intact over the fixture, and the live-tree half of the
old proof is re-aimed as `expectUntouched` (hash plus `git diff --quiet`). Drilled, one
side only, mutation read back from `git diff`, restoration sha256-proved, tree clean
after every cycle:
- `.md` added to `CONTROL_BINARY_EXTENSIONS` → the seven-roots body REDS.
- `workflows` added to `SKIP_DIRS`, dropping exactly one first-party root → REDS.
- the printed byte offset moved by one → REDS, and **it is the only body that dies:
  kill count 1.** That is the containment answer. `CONTROL covers every tracked suffix
  class…` dies under the first two and survives the third; the seven-roots body dies
  under all three. Neither kill set contains the other, so both are load-bearing and the
  rewrite did not collapse this body into a restatement.
- `expectUntouched`'s expected side replaced by a constant hash → both bodies that call
  it RED, so the live-tree guard is reached and compares real bytes.

**AC3 — the `lane-lock.spec.ts` fixture does not inherit the lane's own mode bits. MET,
and met in the one way that could be checked.** Phase 1 pre-committed that this was the
criterion most likely to be satisfied by an assertion that cannot fail, because the
property is invisible wherever the tree is 644 — which is the integration checkout, this
bench, CI, and every detached drill worktree. Both new controls **manufacture the hostile
precondition** instead of leaning on the ambient tree, and both therefore kill their
mutant in an UNARMED tree:
- `common::copy_dir` loses `unlock(&dst)`; whole `cargo test --no-fail-fast` in a
  detached drill worktree with its own `CARGO_TARGET_DIR` at `<scratch>/target`:
  **kill count 1**, `a_materialized_fixture_is_writable_even_when_its_source_is_read_only`
  alone. **The two repaired bodies stayed GREEN under that mutant**, which is the diff's
  own claim that neither can be the repair's control, measured.
- `copyIntoFixture` loses `unlockTree` → *the fixture does NOT inherit the mode bits of
  the tree it is copied from* REDS.
- **DATA MUTANT**, where the property lives: the manufactured source `0o444 → 0o644`.
  The body REDS at its own precondition assertion, so the read-only literal is
  load-bearing and the control cannot pass over a source that was never read-only.

The criterion says *the fixture*, not *the method copy*, and all five copy sites are
covered: `cpSync` and the four `copyFileSync` calls now go through one mode-stripping
helper. `| 0o200` rather than a flat mode, so git's executable bit is untouched and the
armed tree stays `git status`-clean. `unlockTree` returns on a symlink, following
`lane-lock.mjs`'s own `lstat` precedent.

**AC4 — headless. MET.** Nothing was clicked, typed into or screenshotted. The boot gate,
owed by the `app/src-tauri/**` paths, opens and closes its own window and is not screen
control (@human's 2026-08-16 ruling): `NPUTER_BOOT_PORT=26216 npm run boot:check` →
**exit 0**, both `[nputer]` startup lines. 1420 read with `lsof -nP -iTCP:1420
-sTCP:LISTEN` only; no listener, never probed by binding.

#### The granted path, unspent — and I checked the reading rather than taking it

The fence was widened in flight to `tools/e2e/scripts/token-scan.mjs` on my own phase-1
finding, so that finding is an input to the contract I am judging and I do not get to
accept the result because I caused it. **The file carries a ZERO diff.** The lane's
reading — that a copied module resolves its root to the fixture it sits in, so no
override is needed — HOLDS, verified independently of the suite: a copy of the scanner
and its wrapper under `<scratch>/tools/e2e/scripts/` reports `CONTROL 4 tracked text
files`, reds at **exit 1** naming `AGENTS.md:byte 3: U+0000` in the FIXTURE, and leaves
the live tree clean. I also confirmed the non-obvious line it rests on: with one TOKEN
root absent the walk throws and the wrapper exits **3, GATE COULD NOT RUN** — which is
why `TOKEN_ROOT_DIRS` is created empty rather than omitted.

This is the better outcome. My re-stamped attack set called an environment-readable root
on this scanner a REJECTED-level hazard: `npm run lint:tokens` is CI's first step, and a
gate that can be pointed elsewhere exits 0 over an empty tree. **No root override, no new
argument, and no `process.env` read appears anywhere in the diff.** The hazard was never
opened.

#### Security sweep — mandatory, and answered item by item

No `chmod`/`set_permissions`/`umask` in the diff can reach a path under the repository
root: every call site targets a `mkdtemp`/`TempTree` path, and `lane-lock.spec.ts` pins
the one-directionality explicitly (*the live tree is never chmodded*, plus a content
assertion on the source). `releaseLaneLock` and `--release` appear only in prose — no
code path disarms the layer. `make_read_only` targets a `TempTree` removed on `Drop`, and
unlink is authorised by the parent directory, so an interrupted run leaves no read-only
residue. No `shell: true`, no `sh -c`; argv arrays throughout. **No dependency added** —
no `package.json`, lockfile or `Cargo.toml` in the diff. No secrets. Nothing swallows an
`EACCES` or tolerates a read-only tree. Fixtures live under `os.tmpdir()`, are registered
and removed through `removeGitFixture` in `afterAll` (T-178), and the scratch stem is
DERIVED from the card (`nputer-T-216-s4-token-scan-`) per the SCRATCH RULE. Fixture
repositories pin `--initial-branch=main` and carry `NO_BACKGROUND_MAINTENANCE`; the
token-scan fixture commits nothing, so it needs no committer identity, and its comment
says why.

#### Gates, and what this lane does NOT owe

`npx tsc --noEmit` from lib/parser **0** · `npm run typecheck` from tools/e2e **0** ·
`npm run lint:tokens` **0** (TOKEN 173 files, CONTROL 1117) · `--selftest` **0** ·
`npm run lint:docs` **0** · `npm run boot:check` **0**. The DOCS GATE, handed the three
changed `docs/tasks` paths, FIRES and names `npm test` from app/, `npm test` from
tools/e2e and `npx vitest run` from lib/parser — all three run above — and reports every
live card's frontmatter parsing with a legal status and the governing-document budgets
holding.

Two gates are STALE and **both are the integrator's, not this lane's**:
`cargo run -p nputer-index -- index --check --root ../..` exits **1**, `files +0 -0 ~2`,
naming the two Rust test files this diff edits (`common/mod.rs`, symbols 9 → 10) — GRAPH
REGEN belongs to the checkpoint, and T-211 rules that a lane never updates the pins.
`npm run capabilities:check` exits **1**, 44961 → 45036 bytes, for the one added e2e body
name; `docs/CAPABILITIES.md` is outside this fence, so per T-201 the lane reports it and
the integrator regenerates it in the merge commit.

**News for the integrator, not a defect:** `git merge-tree --write-tree <main> HEAD`
exits **1 with a CONFLICT** — read `$?` first, as CONVENTIONS requires — in the card file
alone, because main added `## FENCE WIDENED IN FLIGHT` at `aad0cf7` and the lane adopted
it from its own base. The resolution is mechanical: the `touches:` line and that whole
section are **byte-identical** between `main` and `1757f33` (section sha256 `f295071…`),
and the lane's `.nputer/lane-fence.json` `touchesLine` matches the amended card exactly,
so nothing here would refuse with `re-expand`. `lane-lock --status` in the lane reports
**ARMED, 647 outside the fence, 647 read-only, no drift and no stray** — fast path A's
re-apply was performed, not skipped.

#### One finding that is not a failure, filed rather than folded in

**`T-216-s8`**, `status: suggested`: `T-216-s7`'s sweep is recorded over `app/test`,
`lib/parser/test`, `tools/e2e/tests` and the indexer crate, and `tools/method-evals/`
is outside that scope — `lib/fixture-root.mjs` `cpSync`s `method/`,
`docs/architecture` and the live docs and adapters straight out of the checkout and
then hands each eval a generic `write(rel, text)` into that same tree. **Measured, not
asserted, and it does not red today**: `node tools/method-evals/run.mjs --set
model-free` is exit 0 over 6 evals both unarmed and with the layer armed in this bench.
It is a latent site with no keeper, the same shape `T-216-s7` already records for
`perf.rs`'s `#[ignore]`d body, and it belongs in that card's scope rather than in a
verdict.

**A second finding was DROPPED as a duplicate rather than filed.** The
`brief.mjs`-exit-0 coupling behind the `session-economics` pair is already
`T-143-s1` (`planned`), whose title names the mechanism exactly, with `T-187`
(`planned`) holding the ref-skew class. A third would be the defect the triage
bullet exists to prevent.

#### What I read after drafting, and what it changed

Read only once the above was written: the card's `## Implementation notes`, the two
routed cards' bodies, and the branch's commit messages. **Nothing in them changed this
verdict**, and one thing is worth recording: the notes reach the same FOUR corrections
to this card's prose that my phase-1 ground truth reached blind — three suites is two,
the Rust instances inherit modes rather than writing tracked files, the census is a
census of one fence with a fifth body under this one, and the `COPYFILE_*`
parenthetical is loose about the reason. Two seats, no contact, one answer. The lane's
armed baseline (`5 failed / 530 passed`) is the number my own fence-B run measured
independently at the same ref. The notes also carry a stronger pin on the ref skew than
mine — sibling cards swapped from `e648590` to `aad0cf7` with nothing else moved, 2
failed becoming 10 passed — and one hazard I would otherwise have missed: the routed
findings were first filed as `T-216-s4-s1`/`-s2`, which the parser refuses as ids while
`docs-gate.mjs` still reports frontmatter clean, because the id format is not what that
half reads. Renamed before the tip; `gate-run parser` 349/349 and `gate-run app`
1131/1131 confirm it here.

#### Addendum, same date and seat — the figure re-derived at the tip this verdict created

**A COUNT IN A VERDICT IS A CLAIM ABOUT A TREE, AND MY OWN COMMIT MOVED THE TREE.** The
three-residual-failure figure above is measured at `1757f33` and stays true there. At
`7771c28` — this verdict and `T-216-s8`, committed — `gate-run parser` is **0 / 349
GREEN** and `gate-run app` is **0 / 1131 GREEN**, so the prose broke no board reader and
both new card ids parse; `gate-run e2e` is **1 / 536 RED with SIX failures**, three more
than at `1757f33`.

**The three extra are environmental too, and pinned by moving no variable but the
clock**: `card-preflight.spec.ts:670`, `checkout-currency.spec.ts:852` and
`checkout-currency.spec.ts:953` all fail **identically at the pre-commit tip `1757f33`**
when re-run at 23:47Z (3 failed / 49 passed). They join the `--write-fence` body in the
same family: this bench is 16 commits behind a `main` that advanced twice during this
sitting, and those bodies assert against the live refs and the machine's live worktree
list, which other seats are changing continuously tonight. **The verdict is unchanged.**
Six residual e2e failures, none of them this diff's, every one re-measured either at the
card's base `e648590` or at the pre-commit tip.

**The honest reading of that number is that it is not a property of this branch.** It is
why `gate-run`'s ref field exists, and why this addendum names one.
