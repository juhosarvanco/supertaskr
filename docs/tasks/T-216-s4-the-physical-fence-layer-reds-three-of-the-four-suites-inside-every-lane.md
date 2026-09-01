---
id: T-216-s4
title: The physical fence layer reds THREE of the four suites inside every lane — four bodies write tracked files outside the fence, and no lane can measure its own battery
feature: F-06
milestone: 4
priority: 2
status: planned
suggested_by: executor claude-opus-5@subagent @T-216-s1
blocked_by: []
touches: [tools/e2e, app/src-tauri]
builder:
verifier:
built_by:
verified_by:
review:
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
