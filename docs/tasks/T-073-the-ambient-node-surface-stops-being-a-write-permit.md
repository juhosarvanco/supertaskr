---
id: T-073
title: The ambient node surface stops being a write permit for app/src
feature: F-02
milestone: 4
priority: 32
size: S
status: verifying
blocked_by: []
touches: [app-shell]
builder: claude-opus-5 @fresh
verifier: claude-opus-5 @fresh
built_by: claude-opus-5 @fresh
verified_by: claude-opus-5 @fresh
review: same-model
---

Absorbs: T-028-s6 (fourth triage, 2026-08-19). The suggestion file is
removed in the same commit as this card.

A GUARD THAT USED TO BE FREE, AND NO LONGER IS. `app/tsconfig.json`
reads `"include": ["src", "test"]`, so the ambient declarations in
`app/test/node-builtins.d.ts` are visible to **`app/src` as well as
`app/test`**. That file exists precisely because the app ships no
`@types/node`: a webview module that reaches for a node builtin used to
fail `tsc` by construction, and the declarations were deliberately
narrow — the whole `node:fs` surface was READ-ONLY. T-028 needed to
write a real decomposition into a temp project, so it extended the file
with `mkdtempSync`, `mkdirSync`, **`writeFileSync`**, `rmSync` and
`node:os`'s `tmpdir`. Legitimate, and the file's own comment scopes it
honestly. The side effect is that those write functions are now declared
for `app/src` too.

MEASURED, and re-verified live at `7282308` — the include line and the
write declarations are both unchanged. A four-line probe placed under
`app/src` importing `mkdirSync` and `writeFileSync` typechecks at exit
0 with zero diagnostics; against the same tree with only
`node-builtins.d.ts` reverted to its pre-T-028 content it fails with
TS2305 and TS2724 ("has no exported member named 'writeFileSync'. Did
you mean 'readFileSync'?").

WHY IT MATTERS, AND WHY IT IS SMALL. ADR-017's rule is that the spawned
planner writes and the app renders what lands. The type system used to
enforce half of that for free. What remains is `crescendo-dom.test.tsx`'s
sink sweep, which greps for the write calls but **only over
`app/src/genesis/`** — a write introduced anywhere else under `app/src`
would now pass `tsc` and pass every existing gate. Rollup would probably
complain about a node builtin in the webview bundle, but "probably" at
build time is not a red diagnostic at the seam. It is small because
nothing does this today: `git grep` over `app/src` for the write calls
returns nothing.

## Acceptance criteria
- THE write declarations SHALL LEAVE THE SHARED AMBIENT FILE — a second
  ambient file included only by a test-scoped tsconfig, or a
  `declare module` block inside the one test that needs it. `app/src`
  SHALL return to the read-only node surface it had, and the tests that
  legitimately write into a temp project SHALL keep compiling
  unchanged.
- THE RESTORATION SHALL BE PROVED BY A PROBE, not asserted: a file under
  `app/src` importing a write call SHALL be shown to RED the typecheck
  with the expected diagnostics, then removed, with the tree proved
  clean afterwards. A criterion that only says "tsc still passes" would
  pass with the hole open.
- THE SINK SWEEP SHALL WIDEN from `app/src/genesis/` to ALL of
  `app/src` — one `walk()` instead of one `readdirSync`, the same shape
  as the IPC command sweep beside it. **Both closers, not either**: the
  ambient split restores the free guard exactly, the sweep catches more
  than this one, and they are not alternatives.
- THE DIFF SHALL CARRY NO BEHAVIOUR CHANGE. Nothing under `app/src`
  writes today, so this is a guard restoration; if the widened sweep
  finds a real sink, that is a finding and SHALL be filed rather than
  quietly fixed inside this card.

Verification: headless — `npx tsc --noEmit` with the probe in and out,
app Vitest for the widened sweep. No Rust, no manifest, no IPC surface.

FENCE NOTE: TypeScript, tsconfig and tests only — **no Rust**. This card
holds `app-shell` only because the fence spans both halves of C-05; the
`app/src-tauri` half is untouched, so nothing in this diff can collide
with a Rust-only lane except through the fence's coarseness.

## Implementation notes

Built by `claude-opus-5 @fresh` on branch `task/T-073-write-permit`,
base `76cf034`. Six files, all under `app/`, no Rust, nothing under
`app/src/**` — the shipped frontend is byte-identical to the base (see
"zero behaviour change" below).

**THE PREMISE HELD, ALL THREE LIMBS, RE-VERIFIED AT `76cf034` BEFORE
ANYTHING WAS TOUCHED.** `app/tsconfig.json:27` read
`"include": ["src", "test"]`; `app/test/node-builtins.d.ts:21-30` still
carried T-028's `mkdtempSync`/`mkdirSync`/`writeFileSync`/`rmSync` and
`:33-38` its `node:os` `tmpdir`; and `git grep` from the repo ROOT for
`writeTextFile\|writeFile\|mkdir` over `app/src` returned **nothing**
(exit 1). All eleven sink strings return zero over `app/src`, so the
widening finds nothing to fix. The four-line probe was reproduced: at
`76cf034`, a file under `app/src` importing `mkdirSync` and
`writeFileSync` typechecked at **exit 0, zero diagnostics**.

**THE CARD'S SECOND OPTION IS REFUTED, AND THAT IS WHY THE SHAPE IS WHAT
IT IS.** The criterion offered "a second ambient file included only by a
test-scoped tsconfig, **or** a `declare module` block inside the one
test that needs it". The second is not an alternative: **ambient module
declarations merge PROGRAM-WIDE**. Measured on this tree — write block
deleted from `node-builtins.d.ts` and written instead as a
`declare module "node:fs"` block at the bottom of
`crescendo-dom.test.tsx`, nowhere else — the `app/src` probe **still
compiled at exit 0**. (A second lesson from the same run: a module file
can only AUGMENT an ambient module, never create one — the matching
`node:os` block failed with **TS2664**, "Invalid module name in
augmentation".) One program cannot both grant the writes to a test and
deny them to `app/src`, so the split had to be a PROGRAM boundary. Filed
as `T-073-s3`.

**WHAT WAS BUILT.** `app/test/node-builtins-write.d.ts` (new) carries
T-028's whole surface — the four `node:fs` writes plus `node:os`'s
`tmpdir`, moved as one unit because `tmpdir` is what makes the writes
land outside the repo. `app/tsconfig.test.json` (new) is
`extends: "./tsconfig.json"` with `include: ["src", "test"]` and nothing
else, so the two programs cannot drift in any option. `app/tsconfig.json`
narrows to `["src", "test/node-builtins.d.ts"]` — the shipped frontend
plus the read-only surface, named one path at a time so the guard is
legible in the config. `app/package.json`'s build becomes
`tsc && tsc -p tsconfig.test.json && vite build`, because otherwise the
narrowing would silently drop all 42 test files from the fast gate;
CONVENTIONS' description of `npm run build` ("typecheck + frontend
build") stays true, and `workflow-parity` pins the COMMAND string, not
the script body, so the lane is unaffected (88/88 green).

**A THIRD PIN WAS BUILT RATHER THAN FILED, and the measurement is why.**
A restoration nothing holds is the defect this card fixed. With
`app/tsconfig.json`'s include line reverted to `["src", "test"]`,
`npx tsc --noEmit` exits **0** and the app suite runs **826 passed / 1
failed** — every gate in the repo is happy, and the one failure is the
new pin. So `crescendo-dom.test.tsx` now also asserts the include list
(parsed out of the JSON, not string-matched) AND the exported-declaration
set of BOTH ambient files, so a write creeping back into the shared file
reds too. Reverting the guard is the shape an editor complaint invites
("test file is not in a project"), and before this pin nothing at all
would have noticed.

**FENCE NOTE, FLAGGED RATHER THAN ASSUMED.** `app/package.json` is a
manifest, not TypeScript/tsconfig/tests. It was taken as in-fence
because it is the invocation of the tsconfigs and the alternative was a
real coverage regression; it is one line, inside `app/`, and cannot
collide with an `app/src-tauri/**` lane. It is also the ONLY reason the
boot gate fires (below).

**THE PROBE, RED, AND ITS REMOVAL PROVED BY HASH.** The same bytes
(sha256 `4ea339578b01f824c6cb4042786bed5b05a4f1c1d0b81ddaca90333e9dcc6b8a`)
that greened at exit 0 on the base now fail the app program at **exit 2**
with exactly the predicted pair:

```
src/t073-probe.ts(1,10): error TS2305: Module '"node:fs"' has no exported member 'mkdirSync'.
src/t073-probe.ts(1,21): error TS2724: '"node:fs"' has no exported member named 'writeFileSync'. Did you mean 'readFileSync'?
```

`npm run build` fails at the same point, exit 2. Removal is proved
against `git show HEAD`, not against a clean `git status`: the `app/src`
FILE SET hashes `4fe995c42a40a63828e66704bd856f1b101b3e77e79fb522203da14822e9e048`
on both sides, and all **53** files under `app/src` match
`git show HEAD:<path>` byte for byte, **0 mismatches**.

**THE RESTORATION'S HONEST SCOPE.** The guard is restored *in the
program that gates*. The test program necessarily contains `app/src`
too — the tests import it — so under `tsc -p tsconfig.test.json` the
probe still greens (exit 0, measured). No arrangement can fix that while
tests import the frontend. The property is therefore "the APP program
denies writes", which is the program `npm run build` runs first and the
one CI runs. Filed as `T-073-s2` so triage can rule rather than inherit
it silently.

**THE SWEEP, WIDENED AND ITS CORPUS PINNED.** `crescendo-dom.test.tsx`
now shares ONE `frontendFiles()` with the IPC census beside it — one
walk, two censuses — and the sink sweep runs over all of `src`: **8
files → 47 files, across 9 directories**, all clean of all eleven sinks.
Because a sweep whose coverage is printed but pinned nowhere can be
silently narrowed, the new test pins the CORPUS: the exact nine-entry
directory set, plus four anchors at four depths. Directories rather than
a file list, deliberately — files land under `app/src` constantly and a
fourth live-registry fixture is not worth it, while a new DIRECTORY is
rare and deliberate. The pin reds on every realistic narrowing: back to
`src/genesis` (set collapses to `['genesis']`), losing recursion (to
`['.']`), or an extension filter (`.tsx` only drops `lib` and
`lib/architecture`; `.ts` only drops `components/ui` and
`components/board/badges`).

**BOTH GATES FIRE INDEPENDENTLY ON THE SAME PROBE, AND THE OLD SWEEP
MISSES IT.** The probe reds the typecheck (TS2305/TS2724, exit 2) and
reds the sweep (`t073-probe.ts must not reach for writeFile`, exit 1),
while the PRE-T-073 sweep replayed verbatim over the identical tree
reports **8 files and ZERO hits**. That is the whole argument for "both
closers, not either", measured rather than asserted.

**POISON DRILL: 8 for 8, three limbs each, every mutation one-sided.**
Every mutation was applied to the PRODUCER; no expected literal was ever
touched, and the mutated TEXT was read back from `git diff` each time
rather than trusting a substitution count.

| # | producer mutated | relation broken | exit | failure |
|---|---|---|---|---|
| P1 | invoke-name class `[a-z_]+` → `[a-z]+` | the ten names found | 1 | `expected [] to deeply equal [ 'docs_snapshot', …(9) ]` |
| P2 | `walk(resolve("src"))` → `resolve("src/genesis")` | the nine-directory corpus | 1 | `expected [ '.' ] to deeply equal [ '.', 'architecture', …(7) ]` |
| P3 | walk drops `App.tsx`, DIR SET intact | the anchor membership | 1 | `expected [ 'architecture/MapEdge.tsx', …(45) ] to include 'App.tsx'` |
| P4 | a REAL write planted at `src/t073-probe.ts` | no swept file holds a sink | 1 | `t073-probe.ts must not reach for writeFile` |
| P5 | corpus filtered back to `genesis/` WITH the probe present | — (shape five) | see below | — |
| P6a | `app/tsconfig.json` include reverted to `["src", "test"]` | the app program's node surface | 1 | `expected [ 'src', 'test' ] to deeply equal [ 'src', 'test/node-builtins.d.ts' ]` |
| P6b | `appendFileSync` added to the SHARED ambient file | the shared file is reads-only | 1 | `expected [ 'appendFileSync', …(6) ] to deeply equal [ 'fileURLToPath', 'join', …(4) ]` |
| P6c | `rmSync` deleted from the write file | T-028's surface is whole | 1 | `expected [ 'mkdirSync', 'mkdtempSync', …(2) ] to deeply equal [ 'mkdirSync', 'mkdtempSync', …(3) ]` |

P3 is the one that proves the anchors are not decoration: 46 files
across the same nine directories, so the set assertion PASSED and only
the anchor caught it. **P5 is the shape-five demonstration**: with the
corpus filtered back to the old eight `genesis/` files while a real
write sits at `src/t073-probe.ts`, **the sink sweep goes GREEN (exit 0)**
— silently narrowed, printing success — **and the corpus pin REDS
(exit 1)**. That is exactly the failure mode the pin exists for. (P5's
first form, narrowing the walk ROOT, is NOT a silent narrowing: paths
are resolved from `src`, so it throws ENOENT. Recorded because it means
a root mutation cannot go quiet even without the pin — a filter mutation
can.)

Restoration after every drill was proved by sha256 against
`git show HEAD:<path>`, not by `git status`: `crescendo-dom.test.tsx`
back to `deb2baddb23c8faffbfbb4beacdfc22e0056fce5fa0606e632ded9423cdbdebf`
each time, and the whole `app/src` tree re-proved as above. The two
UNCHANGED bodies in that describe — "Rust exposes exactly thirteen
commands" and the ADR-009 raw-markup sweep — were not drilled, because
neither was touched.

**ZERO BEHAVIOUR CHANGE, MEASURED THREE WAYS.** `app/src` byte-identical
to the base (53/53); the vite bundle byte-identical by content hash
(`dist/assets/index-lKOTjpzi.js`, `index-CwYF5FQb.css` before and
after); and the widened sweep finds no real sink, so nothing had to be
fixed and nothing was quietly fixed.

**SUITES, FIRST-HAND AND UNPIPED, in this worktree.** parser
**234/234 (12 files)** + `tsc --noEmit` exit 0 · app **827/827 (42
files)** — the baseline 825 plus this card's two new tests, the corpus
pin and the include/surface pin ·
cargo **337 passed / 0 failed / 3 ignored** · e2e **88/88** · token lint
**clean, TOKEN 119 files** (118 + `node-builtins-write.d.ts`; CONTROL 504
before this card's three suggestion files were tracked, 507 after) and `--selftest` green. The app suite was run after `npm run build`,
so the twelve shipped-bundle assertions had a real dist/.

**BOOT GATE: IT FIRES, AND THE TRIGGER IS COMPUTED.** Over
`76cf034..HEAD` (6 files): `app/src-tauri/**` **0**, `app/src/**` **0**,
`app/src-tauri/Cargo.toml` **0**, `app/package.json` **1**. So the gate
fires on the MANIFEST limb alone — the frontend limb does not fire at
all, which is unusual and is the direct consequence of `app/src` being
byte-identical. Run as
`NPUTER_BOOT_PORT=14733 npm run boot:check` from `tools/e2e`, port
bind-probed free first and well away from 1420. **`BOOT_EXIT=0`** (my
own `echo $?`), both startup lines seen:
`[nputer] project folder: /Users/ujju/Projects/nputer-T-073` and
`[nputer] window "main" created`. The tree was stopped cleanly
(`exit=null signal=SIGTERM`) and 14733 was released; nothing of this
worktree is left running.

**1420 WAS NEVER TOUCHED.** It is the human's `tauri dev` (node pid
82549), confirmed by read-only `lsof` before and after. The only orphans
on this machine remain T-060's two `fake_agent` processes (pids
52504/52505, ppid 1, `Tue Aug 18 16:21:18`) — the exact pair `T-043-s1`
recorded, unchanged, and not touched.

**GRAPH: STALE BY DESIGN, DELIBERATELY NOT REGENERATED.**
`cargo run -p nputer-index -- index --check --root ../..` exits **1**
with the REAL red (the second line prints counts and a file diff, not
`committed: MISSING`): **117 → 118 files, +1
`app/test/node-builtins-write.d.ts`**, `~ crescendo-dom.test.tsx`
(loc 575→677) and `~ node-builtins.d.ts` (loc 47→49); **symbols 989 and
edges 1508 both UNMOVED**. The graph-regen trigger fires on three `.ts`
files outside `docs/`. Per CONVENTIONS the regen belongs to the
integrator AT THE CHECKPOINT, so it was left alone; the delta above is
what to expect. The three live-registry fixtures do NOT move: both
dogfood suites read the COMMITTED graph, and 117 is still what it holds.

**SIZE-S NOTE.** TASK-FORMAT makes size S "executor + tests, no
verifier", which would license `done`; the dispatch briefing instructed
`verifying`, and that is what is stamped. The integrator can close it
without a verifier pass if the S tier is meant literally.

**FILED, NOT FIXED:** `T-073-s1` (the ADR-009 raw-markup sweep one test
below is still `src/genesis`-only — free to widen, measured clean over
all 47 files, but the card names only the sink sweep), `T-073-s2` (the
test program's residual, above), `T-073-s3` (the program-global gotcha
belongs in CONVENTIONS, since the card specified an option that cannot
work).

**NOT CONFIDENT ABOUT:** whether triage wants the `app/package.json`
line at all — the alternative is accepting that the fast gate stops
typechecking the 42 test files, which seemed the worse trade but is a
judgement, not a measurement. Also whether the third pin's include-list
assertion should have been a `.json` fixture instead of a regex over the
file text: `app/tsconfig.json` is JSONC and its `paths` value contains
`"@/*": ["./src/*"]`, so naive comment-stripping before `JSON.parse`
eats the file from that `/*` onward — the regex avoids that, at the cost
of being a shape match rather than a parse.

## Verdicts

### Adversarial verification — `claude-opus-5 @fresh`, in progress

Worktree `nputer-T-073`, branch `task/T-073-write-permit`, tip `7386790`,
**4** commits from `76cf034` (`git rev-list --count 76cf034..HEAD` = 4),
working tree clean at start and clean again after every drill below.
Ten files in `git diff --name-status 76cf034..HEAD`: six under `app/`,
four under `docs/tasks/`. **Zero bytes under `app/src/**`,
`app/src-tauri/**`, `lib/**`, `tools/**`** — derived, not accepted.
Dispatched despite size S because the executor edited `app/package.json`
outside its own fence and said it could not judge whether the line
belongs. That ruling is below.

**Every drill was run inline; every restoration is proved by sha256
against `git show HEAD:<path>`, never by a clean `git status` alone.**

#### Criterion 1 — the writes leave the shared ambient file. MET.

My own four-line probe, different bytes from the executor's
(sha256 `fa2d69ff0b10d41634166b0a30dc01ff0fe05762bdd4e0ae49ce4ba2f7fb4c63`),
at `app/src/t073-verify-probe.ts`, importing `mkdirSync`/`writeFileSync`
from `node:fs`. Against the branch, `npx tsc --noEmit` from `app/`:

```
src/t073-verify-probe.ts(1,10): error TS2305: Module '"node:fs"' has no exported member 'mkdirSync'.
src/t073-verify-probe.ts(1,21): error TS2724: '"node:fs"' has no exported member named 'writeFileSync'. Did you mean 'readFileSync'?
TSC_EXIT=2
```

**And it is a restoration, not a no-op**: the identical bytes against
`76cf034`'s `app/tsconfig.json` + `node-builtins.d.ts`, with
`node-builtins-write.d.ts` moved aside, compile at **`BASE_TSC_EXIT=0`,
zero diagnostics**. The tests that write still compile —
`tsc -p tsconfig.test.json` exits 0 and the 42-file app suite is green
(below).

#### Criterion 2 — proved by probe, then removed, tree proved clean. MET.

53 tracked files under `app/src` at HEAD, 53 in the working tree. After
every drill, each was compared to `git show HEAD:<path>`:
**checked=53 mismatches=0**, and the set digest returned to its
pre-probe value `f84955f8289e11ca54fa3e49f0f4f5b0ef6180d8eaae76ac7674e888d3c13832`
(my own combining form; the executor's `4fe995c4…` does not reproduce
under four obvious forms of the same computation — a formatting
artifact, since the load-bearing claim, 53 files 0 mismatches, does
reproduce exactly). `app/package.json`, both tsconfigs and all three
`app/test/` files also hash-match HEAD, and `git status --porcelain` is
empty.

#### The refuted second option (`T-073-s3`) — REPRODUCED, both halves.

The card offered "a `declare module` block inside the one test that
needs it" as an alternative. It is not one. With `include: ["src",
"test"]`, the write block deleted from `node-builtins.d.ts` and written
only at the bottom of `crescendo-dom.test.tsx` (`writeFileSync` count:
**8 in the test file, 0 declarations in the ambient file**), the
`app/src` probe **compiled at exit 0** — ambient module declarations
merge program-wide, exactly as claimed. The second half reproduces
verbatim too:

```
test/crescendo-dom.test.tsx(686,16): error TS2664: Invalid module name in augmentation, module 'node:os' cannot be found.
test/crescendo-dom.test.tsx(3,24): error TS2307: Cannot find module 'node:os' or its corresponding type declarations.
```

A module file can augment an ambient module, never create one. The card
specified an option that could not have worked; `T-073-s3` is correct
and belongs in CONVENTIONS.

#### `T-073-s2` — the test program's residual. JUDGED: it does not undercut the card.

Reproduced: with the probe in place, `npx tsc -p tsconfig.test.json
--noEmit` exits **0**. So `app/src` code can still reach a node write by
being compiled in the test program. What the guard restored is therefore
precisely: **the program `npm run build` gates on denies the write**,
and `npm run build` reds at exit 2 on the same probe. The residual is
reachable only by a command no gate runs, and reaching it requires
writing a test that imports the offending `app/src` module — at which
point the widened sink sweep reds on the same file regardless of
program. This is a documented door in a second building, not a door in
the fence: it cannot be walked through by an `app/src` author alone.
s2's own recommendation (accept, and write the sentence into
CONVENTIONS) is the right ruling.

#### Criterion 3 — the sweep widens. MET, and P5 re-derived.

`frontendFiles()` walks all of `src`: **47 files across the 9 pinned
directories**. Both closers fire independently on one probe — `tsc` at
exit 2, and the sweep at exit 1 with
`t073-verify-probe.ts must not reach for writeFile` — while the
**pre-T-073 sweep replayed verbatim over the identical tree reports
`OLD SWEEP files=8 hits=0`**. "Both closers, not either" is measured,
not asserted.

**P5 re-derived, and it is stronger than reported.** Producer mutated
one-sidedly (`return found` → `return found.filter((f) =>
f.startsWith("genesis/"))`, read back from `git diff`) with the real
write present: the **sink sweep goes GREEN** — silently narrowed,
printing success — while the **corpus pin REDS**, and the IPC census
reds alongside it (the executor did not claim this second catch).
Exit 1.
