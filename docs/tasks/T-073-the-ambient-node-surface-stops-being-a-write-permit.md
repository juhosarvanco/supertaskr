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

### Adversarial verification — `claude-opus-5 @fresh`, 2026-08-19 — **APPROVED**

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

#### The third pin — it discriminates against the three shapes it was built for, and I broke it three other ways. `T-073-s4`.

P6a/P6b/P6c re-derived, one-sided, mutated text read back from
`git diff`, all three RED at exit 1 with the exact messages the card
reports (`expected [ 'src', 'test' ] to deeply equal [ 'src',
'test/node-builtins.d.ts' ]`; `expected [ 'appendFileSync', …(6) ]…`;
`expected [ 'mkdirSync', 'mkdtempSync', …(2) ]…`). The pin is real and
it is worth having. Then I attacked it.

**(a) THE REGEX ADMITS A PASSING REVERT, and the test says in its own
comment that it cannot.** The comment reads "Parsed rather than
string-matched: the include list is read out of the JSON … so neither
assertion can be satisfied by a comment" — and the card repeats it
("parsed out of the JSON, not string-matched"). It is
`/"include"\s*:\s*\[([^\]]*)\]/.exec(text)` over the raw file:
**first match wins, and comments are text.** I reverted the guard the
way a developer actually would — widen the line, keep the old value in a
comment explaining what it used to be:

```
+  /* T-073 kept this narrow: "include": ["src", "test/node-builtins.d.ts"] —
+     widened back only because the editor complained. */
+  "include": ["src", "test"],
```

`regex-first-match: "src", "test/node-builtins.d.ts"` · `last match in
file: "src", "test"`. The compiler obeys the second; the pin reads the
first. **`tsc` exits 0 with a write probe under `app/src`, and the pin
passes, 14/14.** This is the exact scenario the pin was built for — "the
shape an editor complaint invites" — and the natural way to write it
walks straight through. The doubt the executor recorded was the right
doubt and the answer is no: a shape match is not enough here.

**(b) THE GUARD CAN BE DEFEATED WITHOUT TOUCHING EITHER PINNED FACT.**
One line at the top of `node-builtins.d.ts` — the file the card
describes as "READ-ONLY BY CONSTRUCTION":

```
+/// <reference path="./node-builtins-write.d.ts" />
```

The include list is untouched. Neither ambient file's `export function`
set moves. All three pin assertions pass. And the write declarations are
back in the app program: **`npm run build` exits 0** and the **whole app
suite is 827/827 at exit 0** with
`rmSync(dir, { recursive: true, force: true })` live in an `app/src`
module. `T-073-s2` even names this mechanism ("`exclude` … does not stop
a file arriving by import or by a triple-slash reference") without
noticing that it also defeats the pin the same card built.

**(c) WHY (b) IS NOT COVERED BY THE OTHER CLOSER.** `rmSync` is in
NONE of the eleven SINKS strings. Measured on the intact branch: the
`rmSync` probe reds `tsc` (TS2305, exit 2) and the sweep passes it
**14/14, exit 0**. So for the most destructive call in T-028's
surface the type guard is a SINGLE point of failure, and (a) or (b)
removes it.

#### The sweep's other unpinned dimension — shape SEVEN, found here. `T-073-s4`.

The corpus pin holds `frontendFiles()`'s output. The guarantee depends
on two more things it does not hold, and both are ordinary call sites:

**(a) THE SINK VOCABULARY.** I planted a DOM-typed sink under `app/src`
— `await fetch("https://example.com/telemetry", { method: "POST", body:
payload })` — which `tsc` is structurally blind to (**exit 0**; `fetch`
is DOM-typed, and this is precisely the class the sweep exists for). The
sweep reds it correctly. Then one string left the array:

```
     const SINKS = [
-      "fetch(",
       "XMLHttpRequest",
```

**`npm run build` exit 0, app suite 42 files / 827 tests / exit 0**,
with a live network sink in the shipped frontend. The corpus pin is
green (the corpus did not move), the include pin is green, and the
type program cannot see it. **A mutant at a call site the pins do not
cover, surviving an 827-test suite at exit 0** — the same shape that
was catalogued hours earlier, reproduced on this card's own guarantee.

**(b) THE SWEEP'S ITERATION, WHICH IS NOT THE CORPUS.** The pin asserts
what `frontendFiles()` returns; the sweep is free to filter afterwards.
One line inside the loop —
`if (file === "t073-verify-probe.ts") continue; // known false positive`
— leaves the live sink unswept with **14/14 green** and the corpus pin
untouched by construction, because the corpus genuinely did not change.
A per-file excuse is exactly how a sweep dies in practice: the first
legitimate false positive earns one, and nothing then holds the rest.

Neither (a) nor (b) is a criterion failure — the criteria asked for the
widening and got it — but the card's claim that the pin "reds on every
realistic narrowing" is true only of the file dimension. Filed as
`T-073-s4`.

#### `app/package.json` — THE RULING THIS PASS EXISTS FOR: IN FENCE, and correct.

The card's fence is "TypeScript, tsconfig and tests only — no Rust",
and `app/package.json` is a manifest. The executor flagged it rather
than assumed it and said it could not judge. It judges as follows.

**The fence's own stated purpose is not violated.** The card states why
the fence exists: "this card holds `app-shell` only because the fence
spans both halves of C-05; the `app/src-tauri` half is untouched, so
nothing in this diff can collide with a Rust-only lane." `app/package.json`
is not Rust, is inside `app/`, and cannot collide with an
`app/src-tauri/**` lane.

**`touches:` is scheduling, not permission** — `method/tasks/TASK-FORMAT.md:18`
defines it as "expected blast radius; orchestrator never parallelizes
tasks with overlapping touches". The precedent a sibling verifier set
this week is directly on point, and T-058 rewrote another card's file in
place under a `tools/e2e` fence.

**No live lane collides.** Checked read-only against all three sibling
branch tips (`task/T-069-relay`, `task/T-076-id-layer`,
`task/T-078-conventions`): none touches `app/package.json`, either
tsconfig, or any `app/test/` file this card edits.

**The alternative was a real regression, measured rather than argued.**
I appended `const t073VerifierTypeError: number = "not a number";` to
`app/test/map-search.test.ts` and ran the gates:

```
bare `tsc` (the app program, i.e. build without the added line):  BARE_TSC_EXIT=0   <- MISSED
`tsc -p tsconfig.test.json` (the line the executor added):        TESTPROG_EXIT=2   <- CAUGHT
`npx vitest run test/map-search.test.ts`:                         VITEST_EXIT=0     <- MISSED
```

Vitest transpiles without typechecking, so without that one line
**nothing in this repo would typecheck any of the 42 test files** — a
silent, permanent coverage loss, caused by this card, in exchange for
avoiding a one-word manifest edit. `workflow-parity.spec.ts:243` pins
`{ kind: "verbatim", dir: "app", cmd: "npm run build" }` — the COMMAND
string, not the script body — so the e2e lane is untouched by the
change (88/88 confirmed below), and CONVENTIONS' description of
`npm run build` stays true.

**Ruled: the line stays.** Removing it would trade a documented,
in-`app/` manifest edit for an undocumented hole in the repo's typecheck
coverage. The executor made the right call and was right to flag it.

#### Criterion 4 — no behaviour change. MET, and proved harder than the card proved it.

The card asserted the bundle was byte-identical by comparing content
hashes of two builds. I built **both sides**: `npx vite build` on HEAD,
then the identical tree with `76cf034`'s `app/tsconfig.json` swapped in,
into a separate `dist-base/`. `diff -r dist dist-base` reports
**DIRECTORIES IDENTICAL** — every asset and `index.html`, not just the
hashed names (`index-lKOTjpzi.js`
`59ea3dc8c569365dcf8337db917ad990d778f8feb807e496c541d570362965ca`,
`index-CwYF5FQb.css`
`71ed851ed89e20354cb8711e0a72294b60a7512561aef523316793a816b200bb`, both
sides). `git diff --name-only 76cf034..HEAD -- app/src app/index.html
app/vite.config.ts app/package-lock.json app/components.json` is
**empty**, so no bundle input moved. `dist-base/` was removed.

And there was nothing to fix: all eleven sink strings, `git grep -F`
from the repo ROOT over `app/src`, return **0 files each**. `T-073-s1`
is accurate — the ADR-009 raw-markup sweep one test below still reads
`const dir = resolve("src/genesis")` with a flat `readdirSync`, and the
card names only the sink sweep, so leaving it was correct.

#### Gates and suites — all first-hand in this worktree, exits from my own `echo $?`

| gate | result | exit |
|---|---|---|
| parser vitest | **234 passed (12 files)** | 0 |
| parser `tsc --noEmit` | — | 0 |
| app vitest | **827 passed (42 files)** | 0 |
| `cargo test` | **337 passed / 0 failed / 3 ignored**, 15 targets | 0 |
| e2e `npx playwright test` | **88 passed** | 0 |
| `npm run lint:tokens` | `clean (TOKEN 119 files …; CONTROL 507 tracked text files)` | 0 |
| `npm run lint:tokens -- --selftest` | 49 TOKEN + 2 CONTROL samples, 37 walk-policy checks | 0 |
| `npm run build` (app) | both `tsc` passes + vite | 0 |

Every baseline reproduces: 234/12, 825→**827** (+2, this card's two new
tests), 337+3, 88, TOKEN 118→**119**.

**BOOT GATE — fires on the manifest limb alone, re-derived.** Over
`76cf034..HEAD`: `app/src-tauri/` **0**, `app/src/` **0**,
`app/src-tauri/Cargo.toml` **0**, `app/package.json` **1**. Run on my own
scratch port, bind-probed free before spawning and well away from 1420:
`NPUTER_BOOT_PORT=15731 npm run boot:check` from `tools/e2e`.
**`BOOT_EXIT=0`** — my own `echo $?`, not the script's word — with both
lines seen (`[nputer] project folder:
/Users/ujju/Projects/nputer-T-073`, `[nputer] window "main" created`)
and `process tree stopped (exit=null signal=SIGTERM)`. 15731 re-probed
**FREE** afterwards; `ps -Ao pid,ppid,command | grep nputer-T-073`
returns nothing.

**1420 NEVER TOUCHED** — read-only `lsof` before and after, still the
human's `node` pid **82549**. The only orphans remain T-060's
`fake_agent` pair **52504/52505**, ppid 1, `Tue Aug 18 16:21:18`,
unchanged and not mine.

**GRAPH — stale, correctly left for the integrator, and the red is
REAL.** `cargo run -p nputer-index -- index --check --root ../..` from
`app/src-tauri` exits **1**, and the SECOND line reads
`committed: 571733 bytes · 117 files · 989 symbols · 1508 edges` against
`fresh index: 571994 bytes · 118 files · 989 symbols · 1508 edges` —
counts, not `MISSING`. Files `+1 -0 ~2`:
`+ app/test/node-builtins-write.d.ts`, `~ crescendo-dom.test.tsx
(loc 575 -> 677)`, `~ node-builtins.d.ts (loc 47 -> 49)`; **symbols 989
and edges 1508 unmoved**. For contrast I ran the same command WITHOUT
`--root` and got the identical headline with `committed: MISSING at
docs/architecture/graph.json` — the false red. The card's delta is
exact. **Not regenerated**, per CONVENTIONS: that is the integrator's
act at the checkpoint.

#### Poison table — 8 for 8 re-derived, not read

Every row re-run in this worktree, one-sided, mutated text read back
from `git diff`, restored by sha256 against `git show HEAD:<path>`:

- **P1** `[a-z_]+ → [a-z]+`: `expected [] to deeply equal [
  'docs_snapshot', …(9) ]`, exit 1.
- **P2** walk root `src → src/genesis`: three tests fail, the sweep
  throwing `ENOENT … app/src/BoardCrescendo.tsx`, exit 1. The
  executor's observation is right and worth keeping: **a root mutation
  cannot hide, a filter mutation can** — which is the whole argument for
  the corpus pin.
- **P3** `App.tsx` dropped, dir set intact: `expected [
  'architecture/MapEdge.tsx', …(45) ] to include 'App.tsx'`, exit 1 —
  46 files across the same nine directories, so only the anchor caught
  it. The anchors are not decoration.
- **P4** proved with my own probe rather than replayed: exit 1,
  `t073-verify-probe.ts must not reach for writeFile`.
- **P5** re-derived above; stronger than reported (the IPC census reds
  too).
- **P6a/P6b/P6c** re-derived, exit 1 each, exact messages as reported.

The table is honest. What it did not reach is the class the brief sent
me to hunt: **mutants derived from the PINS rather than from the
CRITERIA**. Every drill above mutates something a pin watches. Three
mutations that no pin watches are in `T-073-s4` and `T-073-s5`, and each
survives the full 827-test suite at exit 0.

#### Card corrections

1. **"parsed out of the JSON, not string-matched"** (implementation
   notes) and the test's own comment **"neither assertion can be
   satisfied by a comment"** are FALSE for the include half. It is a
   raw-text regex with a first-match rule, and a comment satisfies it
   while the real line is reverted — demonstrated above. The
   export-surface halves ARE read from declarations, so that part of the
   sentence stands. `T-073-s5` carries the measured one-line fix
   (`tsc --showConfig`, or `--listFiles` to pin the program itself).
2. **"The pin reds on every realistic narrowing"** is true of the FILE
   dimension only. The sink vocabulary, the sweep's own iteration, and
   the file count are unpinned; all three narrow silently (`T-073-s4`).
3. The restoration hash `deb2badd…` for `crescendo-dom.test.tsx` is the
   file at **`1a1e388`**, not at HEAD (`57eec879…`) — correct for the
   P1–P5 drills, which ran before the third pin landed, but a later
   reader checking it against HEAD will find a mismatch. Name the commit
   beside the hash.
4. The `app/src` aggregate digest **`4fe995c4…`** does not reproduce
   under four obvious forms of the same computation (mine is
   `f84955f8…`). The load-bearing claim — 53 files, 0 mismatches against
   `git show HEAD:<path>` — reproduces exactly, so this is a
   reproducibility wart, not a false claim: quote the command, or quote
   only the per-file result.
5. `T-073-s2` names the triple-slash reference as a way a file enters a
   program, without noticing that it therefore also walks around the pin
   the same card built. Cross-reference `T-073-s5`.

#### VERDICT: **APPROVED**

- **Criterion 1 — the writes leave the shared ambient file.** MET. My
  own probe (`fa2d69ff…`) reds the app program at exit 2 with TS2305 +
  TS2724; the identical bytes green at exit 0 against `76cf034`, so it
  is a restoration and not a no-op; `tsc -p tsconfig.test.json` exits 0
  and the writing tests compile unchanged. The card's refutation of its
  own second option reproduces on both limbs (program-global merge;
  TS2664 for `node:os`).
- **Criterion 2 — proved by probe, then removed, tree proved clean.**
  MET. 53/53 files under `app/src` byte-match `git show HEAD:<path>`
  after every drill, set digest back to `f84955f8…`, `git status`
  empty.
- **Criterion 3 — the sweep widens to all of `app/src`.** MET. One
  shared `frontendFiles()` walk feeding both censuses, 47 files across 9
  directories, all clean; both closers fire independently on one probe
  while the pre-T-073 sweep replayed verbatim reports `files=8 hits=0`.
  "Both closers, not either" is measured.
- **Criterion 4 — no behaviour change.** MET, and proved harder than
  claimed: `diff -r` between a HEAD build and a base-tsconfig build
  reports DIRECTORIES IDENTICAL. No real sink exists (eleven strings, 0
  files each, `git grep` from the repo root), so nothing was quietly
  fixed, and the three things the executor found were filed.
- **Fence.** `app/package.json` is IN FENCE and the line stays — see the
  ruling above. That answers the card's "NOT CONFIDENT ABOUT": triage
  does want the line, because without it nothing in this repo typechecks
  any of the 42 test files (measured: `BARE_TSC_EXIT=0`,
  `VITEST_EXIT=0`, `TESTPROG_EXIT=2`).
- **Gates.** All green first-hand; boot gate fires on the manifest limb
  alone and passes at `BOOT_EXIT=0` on port 15731; graph is stale by
  design with a REAL red, deltas exactly as reported, left for the
  integrator.

**Why APPROVED with five findings.** Every acceptance criterion is met
and independently re-measured. `T-073-s4` and `T-073-s5` are both about
the THIRD pin — a mechanism the card built beyond its criteria, on the
correct instinct that a restoration nothing holds is not a restoration.
The instinct deserves credit; the mechanism is one dimension short in
two places. Neither weakens what the criteria bought: the app program
genuinely denies the writes today, and the sweep genuinely covers all 47
files today. What is not yet held is that both stay true — which is the
next card, not this one.

`status: verifying` left as dispatched; the size-S question (TASK-FORMAT
gives S "executor + tests, no verifier") is the integrator's to close.
