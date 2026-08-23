# State

Updated: 2026-08-24 by integrator (T-085 merged and checkpointed).

## Just completed

**T-085 — a docs path written relative to a PACKAGE directory is a
DERIVED reader now, and the live one is owed `cargo test`.** F-06,
milestone 4, size M, `touches: [tools/e2e]`, fence never widened.
Built by `claude-opus-5 @T-085` then rebuilt by a SECOND executor
(`claude-opus-5 @T-085-fix`) after rejection; verified by
`claude-opus-5` across TWO passes; `review: same-model`. **REJECTED on
the first verdict — on one clause, a live false comment — APPROVED on
the second.** Both verdicts are on the card. Main-before **`1aa7137`**,
approved tip **`7cc5d9e`**, merge **`2ea1d27`**; the card was
`verifying` and this checkpoint stamps **`done`**.

**WHAT LANDED, and why it is a gate fixing its own premise.** T-084
shipped the DOCS GATE with a bound stated as a universal: *a file that
holds this repository's root is the only kind of file that CAN read this
repository's docs/*. It is false, and the tree held the counterexample
the whole time. `app/src-tauri/tests/agent_runner.rs:1760` reads the
captured planner turn through

    Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../../docs/research/captures/real-planner-turn-2026-08-19.jsonl")

— no repository root anywhere in the file, so no arm of the gate could
see it. Mutate one field of that capture and the gate fired owing only
suites that PASS while bare `cargo test` went red. **An integrator
obeying the gate merged a red tree**, which is the failure the gate was
built to remove, surviving its own fix on a fifth prefix.

**The card takes the RESOLUTION arm, not the disclaimer arm.**
`siteDocsPrefix` now resolves every docs-shaped literal against its
file's own EVALUATED base and keeps what lands inside `<root>/docs` —
which SUBSUMES the old `docs`-first rule rather than replacing it. The
live instance derives with no ledger entry naming it by hand; the gate
prints it as a `climb` line with where it landed. **The class is closed
BY CONSTRUCTION, not by a population**, so completeness rests on the
textual `docsShaped` filter and its one disclosed gap is filed
(`T-085-s1`). The false universal is retracted, its three restatements
are each scoped, and a positional pin guards the retraction.

**SEVEN PATHS — 4 `docs/tasks`, 3 `tools/e2e`.** 3 added / 4 modified,
1962 insertions, 104 deletions. No `app/` path, no manifest, no
lockfile, no capability file, no `tokens.css`, no graph.

## THE FIXTURES DISCRIMINATOR SURVIVED BY CONTAINMENT, WHICH IS THE PART THAT MAKES THE ARM SAFE

Criterion 2 asked whether widening the judgement lets fixture readers
flood the reader set. It does not, and the verifier ruled it the hard
way rather than the easy one: on the live tree `evalBase` returns
**null** for all six docs-shaped sites in `lib/parser/test/files.test.ts`
(`root = fixture(name)`, a call WITH ARGUMENTS the calculus cannot
follow), so today the exclusion is TAKEN by evaluation failure. The
verifier respelled the base into a form the calculus CAN follow and
re-derived: `evalBase` then resolves, and **all six sites still yield
`prefix = null`**, dropped by CONTAINMENT because the fixture tree is
rooted at the file's own directory and is nowhere near `<root>/docs`.
The exclusion survives the evaluator improving. It is pinned twice in
the tree, so it cannot regress silently.

## The verification was this board's most thorough, and it is not re-run here — it CARRIES, provably

The second verdict proved the fix comment-only rather than eyeballing
it: both scripts comment-stripped and whitespace-normalised at `8f09df1`
and at `ea4a758` are **byte-identical executable code** (`docs-scan.mjs`
39929 chars both, `docs-gate.mjs` 5657 both). **RE-CONFIRMED AT THIS
MERGE, one step further out**: `docs-scan.mjs`, `docs-gate.mjs` AND
`docs-input-gate.spec.ts` are byte-identical between `ea4a758` and
`2ea1d27` (`cfbe8e58…`, `17aebca4…`, `f4340198…`). So the first
verdict's findings carry forward by identity and the second verdict's
five pin mutants were run against the bytes that are merged here:

- **eight over-admission mutants planted, SEVEN refused** — a fixture
  `docs/` dir with an evaluable base (containment), a `mkdtempSync`
  base (null), a sibling checkout (refused one layer earlier, at
  `docsShaped`), an escape climb (`outside`), a partially-foldable
  variable, a `method/` template (`outside`), and a bare-`docs`
  suite-less reader whose admission leaves ledger equality unaffected.
  The one real admission became `T-085-s2`.
- **both spellings planted BY THE VERIFIER and both derived** — the
  Rust `CARGO_MANIFEST_DIR` idiom and the JS `resolve("../docs/…")`
  one. T-084's verifier missed the live instance by probing only the JS
  idiom; probing both, the Rust idiom derives.
- **the 11 → 12 reader delta is exactly one file**, measured by running
  BOTH scanners over the same tree: `ADDED ['app/src-tauri/tests/agent_runner.rs']`,
  `REMOVED []`.
- **`T-085-s1`'s "NIL census" became a MEASUREMENT** — 3800 bindings
  enumerated, exactly 2 land inside `<root>/docs`, both local and both
  already derived readers. The imported case, which is the actual
  residual, is nil by measurement rather than by assertion.

## The record defect the verifier left deliberately — `built_by:` named ONE of two executors

The frontmatter read **`built_by: claude-opus-4.8 @T-085`** while TWO
executors built this card; the second was credited only inside
`T-085-s2`'s `suggested_by`. The field is stamped at `done`, so the
verifier left it as found rather than editing it from its own seat.
T-081's and T-084's precedent is explicit — `built_by:` names BOTH
passes — and it is applied here in T-084's spelling.

**AND THE MODEL STRING WAS WRONG, WHICH IS THE PART WORTH RECORDING.**
`claude-opus-4.8` occurs **NOWHERE ELSE in `docs/`** — zero hits across
the whole tree. Where it came from is measurable: the trailer
`Co-Authored-By: Claude Opus 4.8` sits on **ALL TEN** commits in this
lane, **including the two the VERIFIER wrote**, and those two
self-declare `claude-opus-5 @T-085-verify` and `@T-085-verify-2`. **A
trailer that is identical across sessions that were demonstrably
different models is a harness constant, not a model fact** — and this
integrator is the live counterexample, running as `claude-opus-5` under
a harness that instructs the same `Claude Opus 4.8` trailer on every
commit, including the two written today. The first executor read its own
commit signature and recorded it as provenance. Corrected to
**`claude-opus-5 @T-085 (re-built after the rejection by claude-opus-5
@T-085-fix)`**; `verified_by:` widened the same way to name both passes.

## Ranges, every dot count stated, at their own refs

Main-before **`1aa7137`** (T-097's checkpoint, **verified as the tip at
start** rather than inherited), approved tip **`7cc5d9e`**, merge-base
**`a15b78e`** (T-070's checkpoint — the lane's own base, unmoved across
two verdicts and two main advances).

    git merge-tree --write-tree 1aa7137 7cc5d9e -> tree 0afa8999…, exit 0 (read from $?)
    git diff --name-only 1aa7137 <TREE>                       -> 7   THE PRESCRIBED PRE-MERGE FORM
    git diff --name-only 1aa7137...7cc5d9e   (THREE dots)     -> 7
    git diff --name-only a15b78e..7cc5d9e    (TWO, branch-only) -> 7
    git diff --name-only 1aa7137..7cc5d9e    (TWO dots)       -> 68  THE FORBIDDEN PRE-MERGE FORM
    git diff --name-only a15b78e..1aa7137    (main's advance)  -> 61
    git diff --name-only 1aa7137..2ea1d27    (TWO dots)       -> 7   THE MERGE'S DIFF, the only one that means anything
    git diff --name-only a15b78e..2ea1d27    (merge-base..merge) -> 68  FORBIDDEN AT THE MERGE TOO

`git merge-base --is-ancestor 1aa7137 2ea1d27` exits **0**, so at the
merge two dots and three dots COLLAPSE (both 7). **THE FORBIDDEN COUNT
IS 68 AND IT IS PURE LEFT-ENDPOINT DRIFT**: main advanced **61** paths
from the cut, the branch **7**, `comm -12` over the sorted lists is
**EMPTY**, and 61 + 7 = 68 — the arithmetic that proves the two sets
disjoint. Note the forbidden count is the SAME 68 before the merge and
at it, by two different mechanisms, which is exactly why the ban has to
name the PAIR and not the punctuation.

**THE FORECAST WAS EXACT AND WAS CHECKED THREE WAYS.** The staged merge
tree equalled the `merge-tree` forecast byte-for-byte (`git write-tree`
== `0afa8999…`), the merge's own `HEAD^{tree}` IS that tree, and `cmp`
over the sorted pre-merge path list against the merge's own diff exits
**0**. Parents are `1aa7137` and `7cc5d9e` and nothing else. **NOTHING
WAS WRITTEN INTO THE MERGE COMMIT**; every integrator edit is in this
checkpoint.

## THREE standing gates — DERIVED from the merge's own seven paths

`grep -n "at any merge whose diff" docs/CONVENTIONS.md` returns exactly
**3** (lines 592, 717, 746), the mechanical enumeration the brief
contract prescribes.

| gate | trigger | on these 7 |
|---|---|---|
| GRAPH REGEN | `*.ts/*.tsx/*.js/*.jsx` outside `docs/` | **1 — FIRES** |
| BOOT GATE | `app/src-tauri/**`, `app/src/**`, either manifest | **0 — NOT OWED** |
| DOCS GATE | a `docs/` path a code suite reads | **4 — FIRES**, three suites |

- **GRAPH REGEN — FIRES ON THE TRIGGER AND IS A 0-MOVE MATERIALLY, AND
  THE SECOND HALF IS MEASURED RATHER THAN ARGUED.** The one match is
  `tools/e2e/tests/docs-input-gate.spec.ts`; the two `.mjs` are not
  trigger suffixes. `.nputerignore` excludes `tools/`, so the walk
  cannot see it — but "cannot by construction" is a claim about the
  consequence, not the trigger, so the gate was ASKED:
  `cargo run -p nputer-index -- index --check --root ../..` from
  app/src-tauri exits **0** at the merge, graph CURRENT at **645482
  bytes · 126 files · 1120 symbols · 1703 edges**. **It is genuinely
  0-move and NO GRAPH IS COMMITTED IN THIS CHECKPOINT** — the first
  checkpoint in several where the regen is skipped, and it is skipped
  loudly with its measurement rather than silently.
- **BOOT GATE — 0 of 7, NOT OWED, and the derivation is confirmed in
  the NEGATIVE.** No path under `app/src-tauri/**`, `app/src/**`,
  `app/package.json` or `app/src-tauri/Cargo.toml`. The human's app pid
  **93529 (started 22:47:50)** is unchanged before and after the merge's
  working-tree write — where T-013's merge relaunched it thirty seconds
  before the commit, this one did not move it at all. The trigger set
  predicted the human's window in both directions on consecutive
  checkpoints.
- **DOCS GATE — exit 1 twice**, invoked DIRECTLY with the paths as
  ARGUMENTS, ROOT-RELATIVE, and never through `xargs`. At the MERGE, on
  the range rule's own four `docs/` paths: **three** suites owed — app,
  tools/e2e, lib/parser — and NOT cargo, because neither
  `docs/CONVENTIONS.md` nor `docs/research/captures/` is in the merge's
  diff. At the CHECKPOINT, on this commit's own **five** `docs/` paths:
  **the same three**, cargo still not joining because this checkpoint
  does not touch `docs/CONVENTIONS.md` — which is the difference from
  the last two checkpoints, where it did. All three re-run AFTER the doc
  edits (T-081-s9) and green: parser **263/263**, app **933/933**, e2e
  **135/135** on scratch port **14907**. Both gate runs report **12
  derived readers
  across 4 suites** (eleven before this card, twelve after), **0
  frontmatter issues**, a census of **119 docs-shaped sites in 22 files,
  12 of them in 10 files resolving into this repo's docs/**, **24 files
  holding the repository root** (11 derived, 0 unlinked, 13 with no
  linkable site), **1 package-relative site, derived** — the live
  instance, printed with where it landed — and ledger equality holding
  at 6 entries.

## Suites, every number derived at the merge, exits read unpiped

`${PIPESTATUS[0]}` is EMPTY in zsh; every exit below came off its own
`$?` on an unpiped command. `timeout` is absent from this shell.

- **parser: 263/263 across 12 files**, exit **0**; `npm run build` **0**
  FIRST (fresh-clone order); `npx tsc --noEmit` **0**.
- **app: 933/933 across 46 files**, exit **0** — and it closes from both
  sides trivially and correctly: main was 933/933 at `1aa7137` (T-097's
  own checkpoint records it), the merge adds **zero** `app/` paths, so
  the only way this figure could have moved is through the three task
  cards the dogfood bodies read, and it did not.
- **`npm run build` 0, 269 modules.** **The CSS hash is UNMOVED at
  `index-C86RloYb.css` / 45.06 kB**, the Tailwind content-scan check.
  The JS is `index-15GtSLaz.js` / 525.59 kB, which differs from T-013's
  checkpoint (`index-Dn5vl5H1.js`) **entirely because of T-097's own
  app work on main** — this merge contributes no bundle input at all, a
  property of the diff rather than a measurement.
- **bare Rust `cargo test --no-fail-fast`: 382 passed / 0 failed / 3
  ignored, exit 0**, summed programmatically over **fifteen** `test
  result:` lines. **The T-061-s4 kill-path flake did NOT fire — honest
  tally 1 of 1 green, no re-run performed and none needed.**
- **E2E: 135/135**, exit **0**, scratch port **14905** (bind-probed free
  on `0.0.0.0`, `127.0.0.1`, `::` and `::1` immediately before use and
  free again after); `npm run typecheck` **0**. Adds no spec, so equals
  main.
- **token lint: selftest 0, lint 0** — `clean (TOKEN 131 …; CONTROL 616
  tracked text files)`, 49 TOKEN + 4 CONTROL samples, 71 walk-policy, 8
  evidence-floor.
- **`cargo audit -n`** exit **0**, 472 crates, **0 vulnerabilities / 17
  allowed warnings**, unmoved — which a 0-file `Cargo.lock` diff
  requires.

## CONTROL closes from BOTH directions, and the brief's figure was one short

Re-derived at five refs by re-implementing the lint's own corpus rule
(`git ls-tree -r`, minus `SKIP_DIRS`, minus `CONTROL_BINARY_EXTENSIONS`,
imported from `token-scan.mjs` rather than retyped):

    a15b78e  581     1aa7137  613
    ea4a758  583     7cc5d9e  584     2ea1d27  616

**From main:** 613 + the three findings this merge adds = **616**, and
the lint printed 616. **From the lane:** 584 + main's advance
(581 → 613, +32) = **616**. The two directions meet.

**The dispatch brief said the approved tip was CONTROL 583; it is 584.**
583 is right at `ea4a758` and the verdict says so explicitly ("before
this commit's `T-085-s3`") — the verdict commit `a42143b` adds that
file. The figure was relayed one commit stale, which is the ordinary way
a correct number goes wrong.

**TOKEN is 131 and does not move**: the merge adds **zero**
`.ts`/`.tsx`/`.mjs` FILES under `app/src`, `app/test` or `tools/e2e`
(`docs-input-gate.spec.ts` is MODIFIED), so the figure is main's,
carried through.

## The poison drill — at the MERGED commit, arm (c), and one mutant that must red plus the changed test body

Detached scratch worktree at **`2ea1d27`** with `CARGO_TARGET_DIR` set
**INSIDE it** (`.drilltarget`, 2.2 GiB) — CONVENTIONS' arm (c).
**Correspondence by hash before any mutation**, three copies each
(drill / `git show` / main checkout), all agreeing:
capture `273a3d33…`, `docs-scan.mjs` `cfbe8e58…`, `docs-gate.mjs`
`17aebca4…`, `docs-input-gate.spec.ts` `f4340198…`, `agent_runner.rs`
`533da88b…`.

**THE CAPTURE MUTANT, THE ONE THE CARD'S FOURTH CRITERION OWES, RE-RUN
AT THE MERGE ON A THIRD INDEPENDENT FIELD.** The executor mutated a key
(`subcommandResults`), the verifier a value (`decision_reason_type`);
this run mutated `"tool_name": "Bash"` → `"MUTANT_Bash"` on line 17,
read back with `git diff` before the suite ran, **in the drill worktree
and never in place**.

| step | result |
|---|---|
| `docs-gate.mjs` on the one capture path, in the drill | exit **1**, owing **`cargo test from app/src-tauri/`** and `npm test from tools/e2e/` |
| bare `cargo test --no-fail-fast` under the mutant | **381 passed / 1 failed / 3 ignored** over 15 result lines, exit **101** |
| the failing body | `the_tool_denied_fixture_is_a_transcription_not_a_construction`, `tests/agent_runner.rs:1808:13`, *"denial 0: `tool_name` is not what the capture says it is"*, `left: Some(String("Bash"))` |
| restored + re-run | empty per-path `git diff`, sha256 back to `273a3d33…`, target **74 passed / 0 failed / 1 ignored**, exit **0** |

**THE BRIEF'S 360/1/3 DOES NOT REPRODUCE, AND THE DIFFERENCE IS THE
POINT.** 360 + 1 = 361 was the total at the lane's base `a15b78e`;
381 + 1 = 382 is the total here, and 382 − 361 = **21 = T-013's churn
bodies**, which landed on main between the verification and this merge.
The mutant's SHAPE reproduced exactly — one body, by name, exit 101 —
and only the population moved.

**THE CHANGED TEST BODY WAS DRILLED TOO** (CONVENTIONS names the
integrator explicitly), against the positional pin this card adds.
Baseline `docs-input-gate.spec.ts` **36/36 exit 0** on scratch port
**14906**:

| mutant | shape | result |
|---|---|---|
| A | the rejected claim restored at `docs-scan.mjs:1883`, outside the retraction window | **35/1 exit 1 — CAUGHT**, by name and by offset |
| E | the retraction's own quotation deleted (positive control) | **35/1 exit 1 — CAUGHT** |
| B | the same claim WRAPPED so `CAN` and `read` fall on different lines | **36/36 exit 0 — ESCAPES** |

A and E reproduce the verifier's independently. **B is the one worth
having reproduced by a third pair of hands**: it is `T-085-s3`'s central
claim, and the escape is not exotic — the file wraps at about 72
columns, so whether `CAN read` stays contiguous is an accident of the
wrap. The rejected defect is fully restored in the source and the suite
is green. Restored by byte copy, empty `git diff`, sha256 back to
`cfbe8e58…`, spec re-run **36/36 exit 0**.

**ONE HONEST MISTAKE, RECORDED BECAUSE HIDING IT WOULD BE WORSE.**
Mutant B's first `perl -i` was written with a path RELATIVE to the
session's cwd instead of the drill's, so it landed on the **main
checkout's** `docs-scan.mjs`. It was caught immediately — by reading the
mutated text back, which is exactly the step CONVENTIONS requires and
the reason it requires it — restored with `git checkout --`, and proved
byte-identical to `2ea1d27` (`cfbe8e58…`, empty per-path diff, HEAD
unmoved). Nothing was staged or committed. **THE LESSON IS THE RULE'S
OWN**: a drill worktree does not protect you if the command does not
name it, so drill commands take ABSOLUTE paths, not the worktree's
convenience.

The drill's symlinked `node_modules`/`dist` were **UNLINKED rather than
deleted** and all four targets verified present afterwards;
`.drilltarget` removed; the worktree removed and pruned. No `npm ci` or
`npm install` was run anywhere.

## Security sweep — every figure re-derived at the merged tree

The merge touches **zero** files under `app/`, so most of this is a
property of the diff; it was measured anyway.

- **`acl_pin.rs` is a 0-file diff at sha256
  `8d24cbad706d9e6f09eca6888cf8a21d264039cac6153271093ea4847b60b00e`**,
  the pinned value, unmoved. `EXPECTED_GRANTS`: declaration line 54,
  closing `];` line 147, entries 55–146 = **92**, zero blank or comment
  inside, 92 quote-bearing lines / 92 quoted strings / 92 UNIQUE quoted
  strings.
- **IPC 14/14, derived from BOTH ENDS and reconciled by NAME.**
  Attributes `git grep -cE "^[[:space:]]*#\[tauri::command\]"` summed =
  **14**; `generate_handler![…]` with `//` stripped per line and split
  on commas = **14**; **`comm -3` over the two sorted NAME lists is
  EMPTY**. `repo_churn` (T-013) is still the fourteenth.
- **Exactly THREE `#[ignore]` ATTRIBUTES**, line-anchored: `perf.rs:53`,
  `self_graph.rs:58`, `agent_runner.rs:3767`, all three carrying
  `= "reason"`.
- **0 manifests, lockfiles, capability files, `.entitlements` or
  `tokens.css`** in the merge's diff — no dependency added.
- **0 secret-shaped hits** over the merge's **1962** added lines
  (`sk-`/`AKIA`/PEM/bearer/assignment shapes).
- **0 NUL bytes across all 7 paths**, from a CANARY-VALIDATED byte probe
  (`wc -c` minus `tr -d '\000' | wc -c`): positive canary reports 1,
  clean control reports 0. **AND THE NAIVE PROBE WAS CAUGHT LYING AGAIN
  IN THE SAME RUN** — `LC_ALL=C grep -qP '\x00'` exits **1 on the
  positive canary**, a false GREEN, for the third time this session and
  the third checkpoint running.

## `T-101-s3` CONFIRMED HERE, so the two records agree

Filed on T-101's branch, reproduced in this lane at this merge on ONE
path, three spellings:

    docs/tasks/T-085-s3-….md      -> exit 1, FIRES
    ./docs/tasks/T-085-s3-….md    -> exit 0, "none under docs/ — this gate is not owed"
    /Users/…/docs/tasks/T-085-s3-….md -> exit 0, same false-clean sentence

`docsGate()` filters on `p.startsWith("docs/")`, so a `./`-prefixed or
absolute spelling of a path that OWES three suites is answered "not
owed" at a clean exit. It is silence wearing a clean gate's costume —
the same shape T-084-s6 removed from the empty-list case, arrived at by
a different route. **Root-relative paths were used throughout this
integration, deliberately.**

## The verdict's residuals are FILES, and one of them says the thing about itself

All three findings exist as real files with legal frontmatter — checked
because T-061's integrator found verdict findings left as card-body
text and three integrators since have had to check.

- **`T-085-s1`** — the package-relative class is closed by construction,
  so its one residual (limit 5b: a base already inside `docs/`, spent on
  a literal not itself starting with `docs`) has no enumerable census;
  the verifier ran the 3800-binding census anyway and it held at 2, both
  benign.
- **`T-085-s2`** — a docs reader in no declared suite is owed the
  literal `undefined from undefined/`. Loud, zero live instances, and
  newly reachable because of this card. **This checkpoint corrects its
  COST, because the next executor reads the finding and not the
  verdict**: the file said guarding the template "converts a loud
  garbage answer into a silent short one", and it does not. `fires` is
  `byPath.some((e) => e.readers.length > 0)` and `owed.push(r)` runs
  BEFORE the `command !== undefined` guard, so the gate still FIRES at
  exit 1 with the reader named on its per-path line and only the `Run:`
  list emptied. Re-derived from the source here, not relayed: the two
  sub-arms the bullet had conflated are now costed apart, and only
  *dropping the reader from `owed`* is the silent one.
- **`T-085-s3`** — the pin catches one spelling in one file. The file
  already carries the overclaim the verifier flagged (the spec's prose
  says the retraction "has to be the ONLY place it survives" while the
  assertion enforces that for one spelling in one file), so nothing was
  owed here beyond confirming it. **The tree proves the gap without a
  mutant**: `docs-scan.mjs:127-129` states the universal in different
  wording, outside the window, invisible to the pin, suite green —
  benign there because it is itself a retraction.

## What ACTUALLY reached the human's running app

**Port 1420 was read with `lsof -nP -iTCP:1420 -sTCP:LISTEN` and nothing
else**, before and after — no bind, no connect, no signal, on any
interface. Holder `node` pid **82549**, one socket `TCP [::1]:1420
(LISTEN)`, identical throughout.

1. **THE APP DID NOT RELAUNCH, AND THAT WAS PREDICTED.** Pid **93529**
   (started 22:47:50, T-013's window) is unchanged across the merge's
   working-tree write and the whole checkpoint, under the same
   supervisor chain (`npm run tauri dev` 82342 → `tauri dev` 82364).
   BOOT GATE derived 0 of 7 and the window did not move.
2. **The map pane sees the SAME graph.** `docs/architecture/graph.json`
   is untouched: 645482 bytes · 126 files · 1120 symbols · 1703 edges,
   `index --check` exit 0 before and after every edit.
3. **`app/dist` WAS rewritten** by the pre-suite `npm run build`, to
   `index-15GtSLaz.js` with an unchanged CSS hash — vite dev does not
   serve from `dist`, and the bundle's inputs are byte-identical to
   main-before because this merge contains no `app/` path.

**No process from this integration survives.** Five scratch ports were
used, each bind-probed free on all four stacks immediately before use
and free again after: **14905** (e2e at the merge), **14906** (the pin
drill, four runs), **14907** (the owed e2e re-run after the doc edits),
**14908** (the re-run after STATE's suite figures went in) and
**14909** — `docs/STATE.md` is a docs code input owing exactly ONE
suite, which the gate confirms and T-081-s9 requires, so the run that
validates the sentence you are reading is 135/135 at exit 0 on 14909.
None is the default 14520. **No `pkill` at any
point.** No `npm ci` / `npm install` was run anywhere. The T-085
worktree is removed and the branch kept; the drill worktree is removed
and pruned. The two `nputer-T-060` `fake_agent` orphans
(`52504`/`52505`, ppid 1) are unchanged and left alone (T-043-s1). **The
untracked zero-byte file `z`** still sits in the main checkout — not
mine, not staged, left alone for the third checkpoint running.

**The shared capture fixture was checked BEFORE the merge and again
after the drill.** `docs/research/captures/real-planner-turn-2026-08-19.jsonl`
is byte-identical to `HEAD` in the main checkout AND in both live lane
worktrees (sha256 `273a3d33…`, empty `git diff` in all three). The
brief's warning that a lane died mid-mutation on it this session did not
reproduce — nothing needed recovering, which is the second verification
running to report that.

## Two stale sentences ticked, one of them not this card's

- **ARCHITECTURE** carried *"a docs path expressed relative to a PACKAGE
  directory escapes every arm (`T-084-s8`)"* — false as of this merge,
  and replaced with what closed it and how. It also carried the digit
  **ELEVEN** for the reader count, which this card makes twelve. **The
  digit is not bumped, it is REMOVED** and replaced with the `--census`
  command, because CONVENTIONS' own DOCS GATE bullet already ruled that
  a transcribed reader count goes green and wrong — it did so once
  there, and this is the second document it happened in.
- **ROADMAP** said the milestone-3 re-entrants T-010/T-013/T-015 "remain
  planned". **T-013 landed 2026-08-23** (`6834287`, checkpoint
  `d673039`) and the sentence survived two checkpoints after its own
  merge. Corrected here; it is not this card's debt, but leaving it
  false would be.

## The board, derived from disk at this checkpoint

**183 flat task files, 71 done / 37 planned / 28 parked / 47 suggested /
0 verifying**; 71 + 37 + 28 + 47 = 183. Twenty-two files sit in
`docs/tasks/rejected/`, counted separately. The deltas from `1aa7137`
are T-085 verifying → done and the three merged `T-085-s1…s3`. Every
flat card's `status:` is in the parser's vocabulary (the docs gate
confirms it whole-tree, 0 frontmatter issues).

**TWO LIVE LANES AND ZERO CARDS AT `status: building`** — the lapse the
merged TASK-FORMAT bullet rules on, still live on this board for the
third checkpoint. The authority on what is being built is
`git worktree list` (lane-protocol rule 7), and it says T-085 (now
removed) and T-101.

## Provenance and health

T-085 is **built by `claude-opus-5` (two executors) and verified by
`claude-opus-5` (two passes)**, `review: same-model`, **rejected then
approved**. **71 done cards — 55 `same-model`, 10 `self-verified`, 5
`independent`, 1 EMPTY (T-056)**; 55 + 10 + 5 + 1 = 71. T-085 moves
`same-model` from 54 to 55.

At this checkpoint main contains T-085's merge `2ea1d27` plus this
checkpoint. Parser, app, Rust, E2E, token lint and its selftest, `cargo
audit`, the graph-currentness gate and the docs gate are all green;
**all three standing gates DERIVED — two fired and were run, one was
derived as NOT OWED and confirmed in the negative by the human's app not
moving.** Nothing is broken. **Known residuals of the delivered artifact
are filed, not hidden**: `T-085-s1` (the class is closed by construction,
so its one residual has no enumerable census and its tripwire inherits a
narrower version of T-084-s7's out-of-fence cost), `T-085-s2` (a reader
in no declared suite is owed `undefined from undefined/`; cost corrected
here) and `T-085-s3` (the pin reaches one spelling in one file — a
wrapped line, a lowercased `can`, or the same claim in `docs-gate.mjs`
all escape at a green suite, and B was reproduced independently at this
merge).

## In progress / broken right now

**ONE LANE LIVE.**

- **T-101 — `../nputer-T-101`, REJECTED, three blocking findings, fixing
  now.** The denial notice renders, but: (1) **`T-101-s1` has its
  mechanism backwards** — `runner.rs` emits a live `Denied` for every
  entry of `unannounced` AND pushes the same names into the stderr ring,
  so the narrowing selects the double-reported set; this card builds the
  second surface and "Bash" appears twice on one turn. (2) **The
  `toolDenied` gate over-suppresses to zero** — `denial_names` filters
  out nameless denials, so a nameless denial never reaches
  `error.denials` and the gate hides the whole notice, recreating the
  silence the runner's own comment says the card exists to fix.
  (3) Criterion 3's `toolUseId` key is unpinned; only dedupe-by-name is.
  Its fence is `[app-interview]` and was disjoint from T-085's
  `[tools/e2e]` throughout — `comm -12` empty at the merge. Its own
  `T-101-s3` is confirmed above.
- **T-085 is MERGED** at `2ea1d27` and checkpointed here; its worktree
  is removed and its branch kept.
- **T-013 and T-097 are merged and checkpointed** (`6834287`/`d673039`
  and `7e82667`/`1aa7137`).

**A LANE CUT NOW OWES ITS REGEN FORECAST AGAINST 1120 SYMBOLS / 1703
EDGES**, unchanged by this merge, not the 1023/1550 the older lanes
measured at.

## Next up

1. **`T-085-s3` is the sharpest of the three and it is cheap.** The pin
   that guards the retraction is one case-sensitive regex over one file;
   a whitespace- and case-insensitive sweep across BOTH scripts closes
   the three measured escapes, and pinning the CONCLUSION (a sweep for
   "exact set of places" that requires a scoping word nearby) would have
   caught mechanically all three restatements that were found by
   reading. Its own prose overclaim is in scope for whoever takes it.
2. **`T-101-s3` now has two independent confirmations and no owner.**
   The `./`-prefix and absolute-path false-clean is filed on a branch
   that is fixing something else. It is a one-line normalisation in
   `docsGate()` and it silently disarms the newest standing gate for any
   caller who spells a path the obvious second way.
3. **`T-013-s1` is still the sharpest thing on the board and it is
   addressed to the PLANNER.** A fence widened twice from inside a lane,
   both widenings ruled correct, and the method has no in-flight channel
   for "my fence just grew".
4. **`T-013-s8`'s one-line hardening is cheap**: refuse a resolved
   program under the project root, caller-side only, never in the shared
   gate.
5. **`T-089-s1` still has a deadline-shaped cost.** The method version is
   owed a bump to v0.1.6 and CONVENTIONS still carries the two sentences
   admitting the debt. Three-file commit plus an unpinned fourth
   hand-edit, needs a fence including `app-agent`, which is free. Do not
   split it: the two asserts are ORDERED.
6. **Triage the FORTY-SEVEN suggestions.** T-013 deposited ten and T-085
   three; the backlog has grown in every one of the last four
   checkpoints.
7. **The lane list beat the board for the third checkpoint running.**
   Two live worktrees at the merge, zero cards at `status: building`.
   The merged `orchestrator.md` 5b owns the stamp and the order; it has
   still not been exercised.
