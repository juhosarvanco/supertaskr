# State

Updated: 2026-08-16 by integrator (T-046 merge), claude-opus-5 @fresh

## Just completed
T-046 (the boot check guards a merge, S, tools/e2e) done and merged —
built by `claude-opus-5 @fresh`, verified by `claude-opus-5 @fresh`,
`review: same-model`, **APPROVED first pass**. It absorbs T-020-s3 and
T-040-s1 and closes the hole T-040 walked through: **`cargo run` was
the one command this pipeline never issued**, so a one-line manifest
regression that stopped the app launching at all passed an executor, an
adversarial verifier and an integrator — all of whom ran `cargo test`,
`cargo build` and three consecutive full suites, none of which care how
many binaries a crate has. The boot check existed since T-020 and
guarded nothing, because it bind-probed 1420 and exited 2 whenever the
human's app was open, which on this machine is most of the time. **A
gate that no-ops whenever the app is running is not a gate.**

**WHAT SHIPPED.** `NPUTER_BOOT_PORT` moves the whole check to a scratch
port so it can run BESIDE the live app, and threads the matching
`--config` overlay — `devUrl` AND `beforeDevCommand`
(`npm run dev -- --port N --strictPort`), which must move together or
the check hangs on a URL nothing serves — through to `tauri dev` as
**CLI flags only**; `tauri.conf.json` has zero diff. Unset or empty →
1420, `overridden: false`, and the spawn argv is byte-identically the
pre-T-046 `["run","tauri","dev"]`, so the three original exit paths run
the same process they always did.

- **A REFUSAL WITH ITS OWN EXIT CODE.** If the override resolves to
  1420 the script refuses loudly and exits **3** — deliberately not 2,
  because a refusal must never be readable as "the port was busy", nor
  as 1's "the boot failed". Raised BEFORE the bind probe, so a refused
  run touches the network not at all. The override must never become a
  second way to contend for the human's app; this is the same rule as
  the lane config's existing 1420 throw.
- **A VERBATIM FAILURE TAIL** (last 40 non-empty lines of the child's
  merged output) on every exit-1 report. The builder added it after its
  OWN first fixture run: the gate fired correctly and reported only
  `exit=101` with two MISSING lines and no cause. **A gate whose
  failure isn't legible is half a gate.** Success prints nothing extra.
- **THE CONVENTIONS BULLET**, mirroring the T-009-s1 regen rule's shape
  (label + provenance → "at any merge whose diff touches …" → command →
  record), carrying the sentence that is the whole point: **"IF the
  check cannot run THEN say so LOUDLY in the checkpoint, naming the
  reason and the exit code — a skipped gate is news, never silence."**
- **CRITERION 6 DECIDED: YES**, the executor runs it too, on the same
  trigger, with its counter-argument recorded rather than waved off —
  T-040 was a COMPOSITION failure (T-025 added the second binary and
  its own fence forbade touching any manifest), so the gate fires on a
  condition the executor may be forbidden to fix. The answer is that
  the finding of T-040 is that the break was INVISIBLE, not that it was
  unfixable: **news the executor cannot act on is still news, and it
  arrives with the diff that caused it still in context.** A red the
  executor's fence forbids fixing is filed as a suggestion and said out
  loud in the notes rather than absorbed silently. It lives in
  CONVENTIONS because method/roles/executor.md says only "run the test
  commands from CONVENTIONS.md until green" and integrator.md names no
  commands at all — CONVENTIONS is the only place a rule meets both
  roles. **It is marked trimmable to integrator-only with a one-line
  edit** if it proves noisy; the verifier checked that claim by doing
  it (delete the one "THE EXECUTOR RUNS IT TOO…" sentence and a
  coherent integrator-only bullet remains).

**THE VERIFICATION, recorded because it is unusually strong.**
- **The T-040 fixture reproduced, both directions, on the shipped
  script.** With `default-run = "nputer"` removed from Cargo.toml the
  check exits **1** and the tail carries cargo's own words verbatim,
  ANSI bytes and all — "could not determine which binary to run …
  available binaries: fake_agent, nputer". Restored: **exit 0 in 6 s**,
  both `[nputer]` lines, clean tree kill, and Cargo.toml/Cargo.lock
  md5 AND sha256 identical to the pre-fixture baseline. The builder's
  recorded hashes are the ones the verifier measured before touching
  anything, so the fixture was fully reverted at hand-off too.
- **THE REFUSAL WAS ATTACKED, NOT INSPECTED.** The shipped script run
  under `node --import` with a spy patching `net.Server.listen`,
  `net.Socket.connect` and `child_process.spawn` (via `createRequire`,
  so the builtin's ESM facade is evaluated after the patch —
  verified by a positive control that logged both a BIND-ATTEMPT and a
  SPAWN-ATTEMPT on a free port). The file on disk was never modified.
  **Twenty-two spellings of 1420 — every one exit 3, binds=0
  connects=0 spawns=0**: leading/trailing whitespace, `\n`, `\t`, `+`,
  `.0`, hex `0x58c`/`0X58C`, octal `0o2614`, binary `0b10110001100`,
  scientific `1.42e3`/`14.20e2`, zero-padded `01420`/`0000001420`,
  fullwidth `１４２０`, Arabic-indic `١٤٢٠`, and **66956** (= 1420 +
  65536, so nothing wraps at 16 bits). At the resolver level NBSP,
  U+2028 and BOM prefixes refuse too. The guard is on the NUMBER, not
  the string. The one input that resolves to 1420 without refusing is
  `""` — the documented empty branch, which takes the DEFAULT path and
  bind-probes, so it cannot become a second way to contend. Attacked
  and ruled benign.
- **THE SILENT-NO-OP FAILURE MODE WAS DEMONSTRATED, NOT ARGUED.** The
  builder split port resolution into its own module rather than guard
  the check with `import.meta.url === argv[1]`, on the grounds that any
  path mismatch would turn the gate into a silent exit 0. The verifier
  **BUILT that guard in its usual form and ran it through a symlink: no
  output, exit 0.** The shipped script through the same symlink: exit 3
  — it ran. Also probed from the repo root in CI's invocation form
  (exit 2, ran), from `/` with an absolute path (exit 3, ran), and with
  `boot-port.mjs` renamed away (**exit 1 with a loud
  `ERR_MODULE_NOT_FOUND`, never a quiet 0**). Exit 0 is reachable only
  through `finish(0)`, called only when both needles are seen, and the
  overlay JSON is derived from an integer, so no caller can inject a
  string that forges them. **The separate-module design was the right
  call, and now there is evidence for it.**
- **Every new test executes** — six targeted assertion mutations, the
  verifier's own rather than the builder's, each aimed at the
  assertion carrying the actual claim, each `1 failed / 5 passed` on
  the NAMED test (read off the failure title, not the count), each
  reverted and `cmp`-verified byte-exact. The two load-bearing ones are
  live: `not.toContain("free")` (probed nothing) and
  `not.toContain("1420")` (override honoured end to end).

**THE LIMIT THE VERIFIER FOUND, AND IT MUST BE CARRIED FORWARD.** It
asked the question the task did not: does the fixture catch the CLASS
or only that one string? Four further launch-breaking mutations, one at
a time:

| mutation | gate |
| --- | --- |
| `default-run = "nputrr"` — same class, different member | **exit 1**, cargo's `default-run target 'nputrr' not found` + its `help: a target with a similar name exists`, quoted |
| `app/package.json` `"dev": "true"` — dev server never starts | **exit 1**, tail repeats the `Waiting for your frontend dev server…` line |
| `tauri.conf.json` `devUrl` → dead port 14999 | **exit 0 — BLIND** |
| `tauri.conf.json` `beforeDevCommand` → a nonexistent script | **exit 0 — BLIND** |

The first two answer yes, and their failures are diagnosable without
re-running — the tail report earns its place. The last two are the
hole: **the `--config` overlay replaces exactly `devUrl` and
`beforeDevCommand`, so the override path is blind precisely where it
overlays.** It is NOT a criterion failure — criterion 1 prescribes the
overlay, and both keys must move together — but it is an unrecorded
blind spot in the gate CONVENTIONS now mandates, and the mandated form
is the overriding one. Filed **T-046-s4** with a shape that shrinks it
rather than a demand to close it: derive the overlay from the committed
values instead of hard-coding them.

**T-046-s1 IS REAL AND THE VERIFIER REPRODUCED IT.** The builder called
it empirically clean; it is clean only on the tauri CLI's ORDERLY exit.
The verifier ran the drill s1 itself proposes — **SIGKILL the CLI
mid-boot** — and the check exited 1 with a correct report while leaving
**a live vite listener and an orphaned esbuild** behind, killed by
hand afterwards. Not merge-blocking: the path is pre-existing and
criterion 3 explicitly froze it ("the three existing exit paths SHALL
be unchanged"), so fixing it here would have been the violation. **But
T-046 multiplies its exposure** — the script went from never running to
running at every qualifying merge and every qualifying executor — **and
on the DEFAULT path that orphan sits on 1420, the one port this project
protects.** Priority raised.

**T-046-s2 is real but its worked example is wrong, and the verifier
corrected the file.** s2 claimed a lying `@param {number}` would pass
`npm run typecheck` silently; the verifier planted exactly that lie and
typecheck **did** fire (TS2345, blaming the caller for the script's
lie). The genuine unchecked surface is larger: with `checkJs` off,
neither script BODY is checked against its own annotations, and
`scripts/tauri-boot-check.mjs` and `scripts/lint-tokens.mjs` **are not
in tsconfig `include` at all**, so tsc never opens them. The remedy and
the reason for deferring (flipping the flag edits a merge gate's kill
path as a side effect of a tsconfig change) are both right.

**T-046-s3 — nothing gates the packaged build.** Every gate in this
repo runs against DEV artefacts; nothing in the pipeline has ever
produced or launched a packaged nputer. s4 is a second instance of the
same shape — **a gate that proves the configuration it was handed, not
the one that ships.** Its cost reasoning is right: minutes not seconds,
so it does not belong in the per-merge bullet.

**THE npm FINDING, and a recorded mechanic that was wrong.** npm parses
argv AFTER the script name and eats flags it recognises. Measured by
the builder and independently re-measured by the verifier with its own
argv-echo probe on **npm 11.12.1**:

    npm run tauri dev --config '{…}'      -> ["dev","{…}"]      FLAG DROPPED
    npm run tauri -- dev --config '{…}'   -> ["dev","--config","{…}"]
    npm run tauri dev -- --config '{…}'   -> ["dev","--config","{…}"]

The first form silently drops the flag and hands tauri the JSON as a
stray positional. **T-020's own notes describe its scratchpad copy as
having "`--config` appended to the spawn args", which under today's npm
is that first form** — so that recorded mechanic was wrong. The third
form ships (it keeps `["run","tauri","dev"]` as a literal prefix), and
the `--` is now called out as load-bearing in the PORT RULE bullet.

**THE NEW GATE'S FIRST MERGE — AND THE SELF-REFERENCE, STATED PLAINLY.**
The bullet T-046 lands fires at any merge whose diff touches
`app/src-tauri/**`, `app/src/**` or either manifest. **This merge
touches NONE of those.** Its ten files are `tools/e2e/**` plus docs/, so
**by its own trigger the boot gate does NOT fire on the merge that
introduces it** — checked from the merged diff, not assumed. That is
recorded here rather than left for a reader to wonder about, because
under the very rule being landed a gate's silence must be explained.
It was then **run ONCE anyway as a smoke of the shipped gate on merged
main**, on scratch port 14521:

    [boot-check] port 14521 free — spawning `npm run tauri dev -- --config {…}` in /Users/ujju/Projects/nputer/app
    [boot-check] NPUTER_BOOT_PORT=14521 — threading --config {…}
    [boot-check] app: [nputer] project folder: /Users/ujju/Projects/nputer
    [boot-check] detected startup line 1/2: [nputer] project folder:
    [boot-check] app: [nputer] window "main" created
    [boot-check] detected startup line 2/2: [nputer] window "main" created
    [boot-check] process tree stopped (exit=null signal=SIGTERM)
    SHIPPED_EXIT=0

**Exit 0, both `[nputer]` startup lines, and NO STRAYS.** After it:
`lsof -nP -iTCP:14521` empty (the scratch port released), `pgrep -fl
tauri-boot-check` empty, and a full `ps` showed the ONLY surviving
tauri/vite/`target/debug/nputer`/esbuild processes were **the same five
pids that existed before the run** (89936/89938/89953 the human's
`tauri dev` chain, 90127 its vite, 90128 its esbuild, 1753 its app
binary), every one with an unchanged start time. **T-046-s1 did not
bite on this path** — the orderly-exit path signals the group correctly,
which is exactly what s1 says and does not contradict it.

**1420 was never bound, contacted or signalled.** The human's vite still
holds `[::1]:1420` on **the same pid 90127, the same fd 28u, the same
device 0xc074e387883bd776** as before the merge began.

**ONE HONEST SIDE EFFECT, recorded for the next integrator because it
would otherwise surprise someone.** The boot check shares
`app/src-tauri/target/` with the human's live `tauri dev`, and
`cargo run --no-default-features` **relinked `target/debug/nputer`**
(mtime 14:05 → 18:08, size 39,626,680 → 39,597,432 bytes). The RUNNING
app was unaffected — pid 1753 kept its 14:04:31 start time, because a
replaced file does not disturb a process holding the old inode, and
tauri's dev watcher watches source, not `target/`. This is the same
target-dir sharing `cargo test` already does with a different feature
set, so it is not new with T-046; it is simply now more frequent. Not
filed as a suggestion — no observed harm, and the alternative (a
separate target dir per gate run) would cost a full cold rebuild.

**SUITES ON MERGED MAIN**, all four re-derived here first-hand, fresh
installs, ADR-011 order:
- lib/parser `npm ci` + `npm test` **159/159 (10 files)**, `npx tsc
  --noEmit` clean, `npm run build` clean.
- app `npm install` + `npx tsc --noEmit` clean + `npm run build` exit 0
  (**252 modules**) + `npm test` **483/483 (27 files)** — exactly the
  forecast. Bundle **442.05 kB, `index-DvrlAOQE.js`**, byte-for-byte
  the same asset the T-025, T-037 and T-039 merges shipped, which is
  the correct outcome for a branch carrying zero TS under app/.
- app/src-tauri bare `cargo test` **208 passed + 3 ignored, 0 failed**,
  summed across **11 test binaries** (100 / 0 / 0 / 28+1 / 68 / 3 / 7 /
  0+1 / 2+1 / 0 / 0) — the branch adds no Rust, so the count is
  unmoved from T-039's merge. **The run was NOT piped through `tail`**:
  T-046's verifier fell into exactly that trap and got a nonsense
  total, and T-020's notes record it too. Sum the `test result:` lines.
  **The unnamed `agent_runner` flake did not appear** — it stays on the
  books as T-025's merge left it: one unreproduced, unnamed red seen
  once. If anyone ever sees it, capture the test name and output
  VERBATIM before re-running.
- tools/e2e `npm ci` + `npx playwright test` **23/23 in 4.8s** (17 at
  branch point + 6 new, all six of the new ones named for what they
  assert), headless, one worker. `npm run typecheck` clean ·
  `npm run lint:tokens` **clean, 37 files** · `-- --selftest`
  **43 samples green**. The parity spec was re-run alone after this
  merge's CONVENTIONS edit — still 6/6.

**No model call was made anywhere in this merge**, and no OS input was
injected, nothing screenshotted, nothing read off the screen. The one
boot run opened and closed its own window, which is the @human ruling
of 2026-08-16 this task relies on and does not extend.

**THE MERGE WAS CLEAN, AND THE DISJOINTNESS WAS TRIVIAL RATHER THAN
NEGOTIATED.** Merge-base `2961599`, and **main had not moved from it** —
`git diff --name-only 2961599..main` is EMPTY, so the two changed-file
sets intersect in nothing by construction (`comm -12` empty).
`git merge-tree` produced zero conflict markers, re-derived here.
The merge carries **ten files**: `docs/CONVENTIONS.md`, the task file,
four new suggestions, and four under `tools/e2e/` (`scripts/
boot-port.mjs` NEW, `scripts/tauri-boot-check.mjs`, `tests/
boot-check-guard.spec.ts` NEW, `tsconfig.json`). No lockfile moved and
no dependency was added. **The two sibling lanes still in verification
are provably disjoint from this one**, checked rather than assumed:
`t041-shell-harness` touches `app/src/lib/watcher-store.ts`,
`app/test/`, three new screen-named specs plus `tools/e2e/fixtures/`
and `tools/e2e/tests/shell-harness.ts`; `t047-runner-trust` touches
`app/src-tauri/src/agent/**` and `tests/agent_runner.rs`. **Neither
shares a single file with T-046** — note in particular that T-041 also
lands under `tools/e2e/` and still does not collide, since T-046 owns
`scripts/`, `tsconfig.json` and `boot-check-guard.spec.ts` only.
Neither ../nputer-t041 nor ../nputer-t047 was entered.

STANDING INTEGRATOR PRACTICE (T-009-s1, the ratified CONVENTIONS
interim regen rule; retires when T-014's `nputer index --check` becomes
the gate) — **FIFTEENTH** exercise, and this time **IT FIRED AND WAS A
NO-OP**, which is a different thing from the last one and the
distinction is the T-039 integrator's, kept deliberately. The rule
fires on a merged diff touching `*.ts/*.tsx/*.js/*.jsx` outside docs/,
and this diff carries exactly one such file:
**`tools/e2e/tests/boot-check-guard.spec.ts`**. So the ritual was owed
and was run in full — `NPUTER_UPDATE_GOLDEN=1 cargo test -p nputer-index
--test self_graph -- --ignored`, then the confirming re-run — and the
committed graph did not move by a byte, because `.nputerignore:8` is
`tools/`, so nothing in this diff is even walked. (The two `.mjs`
scripts do not match the rule's literal `*.js` glob; the `.spec.ts`
fires it on its own, so nothing turns on that.)
`docs/architecture/graph.json` is **byte-identical** to pre-merge main:
sha256
`a433638041054391c98499ab4e7b6809891a30c18df119a4db0a1ed6dfa24789`,
363,994 bytes, still 88 files / 595 symbols / 990 edges — compared as
`git show 2961599:docs/architecture/graph.json | shasum -a 256` against
the working file, equal, and `git status docs/architecture/` empty
after the golden run. The **plain (non-golden) ignored self-check** was
run separately and is the positive proof rather than an absence:
`self_graph_is_current ... ok`, i.e. the graph re-derived in memory
equals the committed bytes on the merged tree. **No fixture moved** —
the T-024-s5 rule reads the other way here: no component was declared
and no `.ts` moved inside the indexer's walk, so ZERO of the three
registry fixtures move.

INTEGRATOR JUDGMENT CALLS, recorded.
- **CONVENTIONS: ONE edit at merge time — a POINTER, not a move.** The
  verifier noted (and chose not to file) that the four-code exit legend
  lives in the tools/e2e commands bullet ~110 lines above the BOOT GATE
  bullet that tells the integrator to record an exit code, with nothing
  linking them. Ruled: **add a pointer.** Moving the legend would strand
  it away from the command it explains; duplicating it would create two
  copies free to drift; leaving it costs the reader a search at exactly
  the moment they are writing a checkpoint. One clause, zero
  duplication, both bullets stay complete. The BOOT GATE bullet now
  reads "The four exit codes are legended in the tools/e2e commands
  bullet under 'Build & test' above: 0 booted · 1 the boot failed · 2
  the port is busy · 3 the override was refused." Re-ran
  workflow-parity.spec.ts afterwards, since that spec reads CONVENTIONS
  for its command list — 6/6, the edit is prose and moved no command.
- **The verifier's SECOND CONVENTIONS note was deliberately NOT acted
  on, and it is recorded here so it is not lost.** T-009-s1's rule
  carries a retirement condition and BOOT GATE does not; the task notes
  say it retires "when something can check it", and that sentence is
  not in CONVENTIONS. Left alone on purpose: a pointer is navigation
  and is an integrator's to add, but a retirement clause is
  SUBSTANCE — it changes what a just-ratified rule promises about its
  own lifetime, and it is not obvious what the condition even is, since
  `.github/workflows/ci.yml` ALREADY invokes the boot check on ubuntu
  and is merely dormant. **The real question — does the rule retire at
  the repo's first push, or only when a macOS gate exists too? — wants
  a triage, not a silent integrator edit.** Next triage should rule it.
- **ROADMAP: NOT edited, on precedent rather than by eye.** Milestone
  3's Progress line enumerates what a user can do and (since T-039) the
  security fact, because T-039 was the ruled scheduling GATE on T-029
  and a reader of ROADMAP alone would otherwise never learn the
  milestone had carried a hold. T-046 gates nothing in milestone 3: it
  adds no capability, removes none, and changes the pipeline's own gate
  list rather than the product's. The precedent is unambiguous and was
  checked: **ROADMAP mentions T-020, T-036, T-038 and T-040 exactly
  nowhere** — every previous pipeline/gate task is absent from it. The
  honest remainder is untouched and the milestone is still NOT claimed.
- **ARCHITECTURE: NOT edited.** Nothing in the table or the Interfaces
  text became false. The Code-layout bullet already describes
  `tools/e2e/` as "the real-input E2E lane (T-020), dev tooling under
  no component … .nputerignored out of the map", which stays exactly
  true; the boot check has spawned `tauri dev` since T-020, so T-046
  changed how often it runs, not what the territory is. The T-010 note
  that FOUR `.rs` files under `app/src-tauri/` are claimed by no
  component is still exactly right and still exactly four — this branch
  added no `.rs` at all.
- **NO NEW ADR (three-prong), and the interesting prong-one argument
  is worth stating because it was raised deliberately.** The candidate:
  this is the **second ratified integrator practice** (after T-009-s1's
  regen rule) and **the first that has the pipeline START THE APP**,
  resting on a human ruling about a standing prohibition. Is that
  charter-level? **Ruled CONVENTIONS-level, for three reasons.**
  (a) **The ADR series' territory is the PRODUCT, not the pipeline.**
  All seventeen ADRs decide what nputer IS or how it is shaped —
  files-are-the-brain, shell-out-to-CLIs, app-first, native surfaces
  Rust-side, graph-as-committed-files. **Pipeline practice already has
  a home and it is not docs/decisions/**: the generic half lives in
  `method/roles/*.md`, the product-specific half in CONVENTIONS. The
  first ratified integrator practice (T-009-s1) got a CONVENTIONS
  bullet and no ADR, and consistency with that precedent matters more
  than the novelty of this one.
  (b) **A rule designed to retire is CONVENTIONS-level by
  construction.** T-046's own notes say it is "documented practice, not
  machinery … it retires the same way [as T-009-s1], when something can
  check it." Charter is for what persists. (See the deliberately-unmade
  edit above — the retirement condition itself still wants a ruling.)
  (c) **It is one command in one lane.** A charter written from a
  single gate is a charter written from a single example — the same
  reasoning T-039's merge used to keep the fallible-argv rule
  C-14-local, and the same answer.
  **The screen-control ruling is separately NOT ours to charter**: it
  is an operating agreement between the human and the pipeline about
  what may happen on the human's machine, it already lives in the
  standing memory rule and in T-046's own file, and an ADR asserting it
  would be the pipeline chartering its own permissions.
  **The obligation this creates, recorded so it is met rather than
  re-derived: there are now TWO CONVENTIONS-level pipeline gates with
  the same shape (trigger → command → record) and one of them binds the
  EXECUTOR as well.** `method/roles/executor.md` still says only "run
  the test commands from CONVENTIONS.md until green" and names none of
  them. When a THIRD such gate lands, or when the executor rule proves
  noisy enough to trim, ask ONCE whether method/ should name the class —
  that is a method version bump, still not an ADR.
  **Prong two, verified as an empty set rather than by eye**:
  `git diff --name-only 2961599..HEAD` restricted to `method/`,
  `lib/parser/`, `app/src/`, `app/src-tauri/`, `docs/architecture/
  graph.json`, `capabilities/`, `tauri.conf.json`, and every
  `Cargo.toml`/`Cargo.lock`/`package.json`/`package-lock.json` returns
  **nothing** — the whole diff is four files under `tools/e2e/` and six
  under `docs/`. So ADR-012 held (capabilities untouched, `acl_pin.rs`
  zero-diff), ADR-011 held (zero new crates, zero new npm deps, no
  lockfile line — the new module is plain node and the new spec imports
  only `@playwright/test`, `node:*` and repo-local files), ADR-003 held
  (no model call anywhere). Prong three: the durable calls live in the
  task file's criterion-6 ruling with its case-against, its six
  deliberate deltas, and its four honest limits.

## In progress / broken right now
**THREE TASKS ARE `building`.** Two are in ADVERSARIAL VERIFICATION,
both dispatched with T-046 at `2961599` and neither merged; the third
was dispatched mid-merge and has not started:
- **T-041** (shell harness — the served-bundle probe, M, app-shell),
  worktree ../nputer-t041 at `ecb404c`. It is the hard gate before
  T-027/T-028/T-029 can write the served-bundle probes they each
  promise.
- **T-047** (what the runner trusts from disk, app-agent), worktree
  ../nputer-t047 at `242697f`.
- **T-048** (the frame holds — the genesis page stops growing and the
  pane starts scrolling, S, app-shell, F-03), **dispatched by the
  architect at 18:17 WHILE THIS MERGE WAS RUNNING** and committed as
  `0378cb9` directly on top of the merge commit. It absorbs T-041-s1
  and T-041-s3, was human-approved during the open visual review
  session "because the screen is unusable at the size the app actually
  opens", and carries the re-derived numbers: at the app's OWN
  configured **800×600** window the genesis page is 1172 tall — **572px
  of overflow** — and the pane's own region measures 796/796 at every
  size, i.e. it never scrolls. It rules explicitly that this is **NOT**
  T-027's composition question. **No worktree yet, and it is
  effectively serialized behind T-041**: its fifth criterion updates a
  lane spec that exists only on `t041-shell-harness`, and both tasks
  are app-shell.

**Do not enter ../nputer-t041 or ../nputer-t047.** T-041's and T-047's
file sets are disjoint from each other and from this merge (checked
above), so both should merge without reconciliation — but T-041 lands
specs under `tools/e2e/` and its integrator should re-check that
against T-046's four files rather than inherit this note.

**A PROCESS HAZARD THIS MERGE HIT, AND IT SHOULD NOT BE LEARNED TWICE.**
That dispatch commit **swept in this integrator's staged checkpoint
edits** — the CONVENTIONS pointer, T-046's `status: done`, and an
intermediate STATE — because two actors were working in the SAME main
working tree and therefore shared one git INDEX. Nothing was lost or
corrupted (all three landed byte-correct inside `0378cb9`, verified),
and the T-048 file itself was never staged by this session. But the
house shape was broken: main now reads **merge → someone else's
dispatch → checkpoint**, and the checkpoint below carries only the
STATE remainder rather than the whole checkpoint. **The lesson, for
whoever writes the rule: `git add` in the shared main tree publishes
your work to every other actor's next `git commit`.** An integrator
should stage and commit in one breath, or the architect should dispatch
from an index it owns. Recorded here rather than filed as a suggestion,
because it is a method/process call and task creation is the
architect's (ADR-004) — but it is worth a rule.

The t046 worktree is removed and its branch KEPT — **26 task branches
merged now**, `t001-app-shell` through `t046-boot-gate` (counted with
`git branch --merged main`), plus the two live ones; T-048 has no
branch yet. Main tree clean; all four suites green; the token lint
green; the committed graph current and proved so by the self-check
rather than by assumption. The parser re-parses the whole live tree at
**0 issues** — measured twice, before and after T-048 landed: **61
tasks / 2 building** at the merge commit, **62 tasks / 3 building**
with T-048, both at zero issues, and lib/parser's live-tree smoke test
re-run green with T-048 present. Full tally now: **27 done / 18
planned / 9 parked / 5 suggested / 3 building** (T-041, T-047, T-048),
6 features, 11 components.

**NO STANDING SECURITY GATE.** T-025-s6 closed at T-039 and nothing
replaced it. T-046-s1 is the sharpest open item and it is a
process-hygiene risk on the human's own port, not a boundary crossing.

LAUNCH ITEM, carried forward and now slightly larger — **watch the
first CI run** (T-020). At the repo's first push (`git remote -v` is
still empty), confirm in order: the ubuntu apt/webkit2gtk set installs;
the three `uses:` SHA pins resolve; playwright-on-Linux runs the lane —
**now 23 tests, not 17**, and the six new ones are pure-node/subprocess
so they should be the least platform-sensitive in the lane;
`cargo audit` behaves as it does locally; and **the xvfb `tauri dev`
boot prints both `[nputer]` startup lines — which is now the FIRST
exercise of the boot check on Linux and the only place the T-046
override's Linux behaviour will ever be observed** (CI deliberately
sets no `NPUTER_BOOT_PORT`: on a fresh runner 1420 is free, so the
default path is correct there and the OVERRIDE path stays
Linux-unverified, exactly as T-046's honest-limits section says).
AND (T-018-s3 fold) the THREE T-018 SENTINEL LIVE TESTS inside the
ubuntu `cargo test` step — replaced-wholesale and deleted-recreated
docs/. They discriminate only where inotify watches INODES; macOS
FSEvents watches paths and was accidentally resilient, which is why
T-018's replace-half evidence is mechanism-only today. Green there
CLOSES that evidence gap; red there is a real reconcile gap macOS could
never surface, and gets filed immediately. This run also closes
T-001/T-003's Linux halves, and it carries T-026-s1 (the plan probe's
exact-case match makes macOS and Linux disagree about "already has a
plan") and T-021-s1 (the ACL pin is macOS-derived). Since T-025 the
ubuntu `cargo test` step also runs the `agent_runner` integration
tests, which spawn real child processes and send real signals — 28 of
them — the first time this repo exercises process control on Linux.
Watch it, and watch for the unnamed `agent_runner` flake there too.

## Next up (1–4)
1. **@human — THE VISUAL SESSION IS STILL OPEN AND UNCHANGED BY THIS
   MERGE.** The app is RUNNING on 1420 as this checkpoint lands (same
   pid since 13:21), and T-046 ships **zero UI and zero TS under
   app/** — the shipped bundle asset is byte-identical — so every item
   below stands exactly as the T-039 checkpoint left it. **The route to
   the pane**: "Start an interview" on a docs-less folder, or "Start an
   interview here" on a folder the app just refused.
   - **T-024's pane, light AND dark**: built/forming/slot card contrast
     in dark, the warm writing-row border, the five type sizes that
     moved 0.5–1px, the substituted footer right slot
     (`stage ~4 · constraints`).
   - **Two framing questions that exist only because of the mount.**
     (a) T-024 drew the pane as the **RIGHT HALF of a split view**;
     until T-027 it sits **full-width inside T-026's card frame**. Does
     its `bg-sidebar` ground read right framed by a `bg-card` bordered
     box, and does the **five-across backbone grid** hold at full width
     when it was drawn for a half-width pane? **This is the question
     T-027's planning pass waits on** (item 2).
     (b) **NOW MEASURED, by a probe rather than by eye — AND THE
     REMEDY THIS STATE FILE HAS CARRIED SINCE T-024 IS WRONG.** This
     item has read "the shell's column is `min-h-screen`, not
     `h-screen`, so at very short window heights the page may grow
     before the pane's own scroll region engages". T-041's harness
     measured it in the served bundle at 1280×720 with T-024's complete
     `streak` tree, and then made the swap: with `h-screen` live the
     column IS bounded at 720px — **and
     `documentElement.scrollHeight` is still 1110, and the pane's
     `overflow-y-auto` still never engages (796/796).** So
     `min-h-screen` → `h-screen` is **measurably not the fix**; the
     branch files that correction as **T-041-s3**, naming the missing
     link as `min-h-0` on the GenesisScreen section. (Rides T-041's
     merge; that branch is still in verification, so treat the figures
     as pending until it lands — but do NOT hand T-027 the old one-line
     remedy.) **This is no longer an open item on this list**: see the
     T-048 note under "In progress" — it was dispatched as its own task
     during this merge, and it is explicitly NOT the composition
     question, which stays with T-027 and stays @human. How the frame
     FEELS once it holds is still an eye judgment.
   - **T-026's front door, light AND dark**: the two-button row and the
     "No plan in &lt;folder&gt;" card against the design's `open a
     folder` screen — button sizes/inks, the checklist ○/✓ (the ✓ rides
     `--review-disc`, whose dark value #4ecf9e is a token-family
     derivation, not measured from a dark mockup), the card's 10px vs
     the design's 12px radius, and whether the footnote reads as a
     footnote.
   - **The at-a-glance amber judgment** (T-012 criterion 5's human
     half — drift stroke vs building/verifying fills, BOTH schemes,
     incl. composed building+drift; the dogfood hero renders it live).
     C-05's drift count reads **4**.
   - **The launch-shot re-judgment** (T-006's pending screenshot
     predates the rail — light + dark now include it).
   - **The T-023 dry-run conversational quality judgment** (did the two
     "pushing back:" challenges actually challenge; the founder was
     builder-scripted in-session, so true cold-context evidence still
     arrives with T-029).
   - **T-026-s4's question**: point the app at a folder whose `docs/`
     holds files but no plan (a lone ARCHITECTURE.md). It renders
     **through the lens** now, as the pane's own `docs/ · 0 files
     written` scaffold with `expected` placeholder rows and north star
     `forming…`. Judge whether THAT reads right over a non-empty docs/.
   - **The real picker flows on the real screen** — the standing T-007
     checklist, still @human because native dialogs are unreachable
     from a browser harness and tauri-driver has no macOS: "Start an
     interview" → native dialog → a docs-less folder lands on the
     genesis screen; ⌘N and ⌘O on the front door; "Start an interview
     here" on a folder the app just refused; a folder that already has
     a plan → the board, not genesis.
   - **The `tauri dev` quit-the-app orphan check** (from T-025). Start a
     `hang`-scenario genesis in a scratch project, quit the app, confirm
     no orphan — **and watch for T-025-s7's ~5 s main-thread hang on
     quit**, which is expected, harmless, and worth confirming is only
     ~5 s.
   - **ONE REAL OBSERVED PLANNER TURN, on an authenticated machine** —
     still the biggest unobserved thing in the project. This machine's
     `claude` OAuth token is revoked, so no model call has ever gone
     through the runner. Two questions ride on it: does the kickoff land
     a real planner in stage 0, and is the six-pattern Bash allowlist
     sufficient for a real stage-0 scaffold (which is what T-025-s4
     needs before it can narrow `Bash(cp:*)` / `Bash(mkdir:*)` safely).
     **T-025-s2 carries the exact command.**
   - **A Linux run** — the "watch the first CI run" item above.
   - **A PRIORITY CALL, not a screen action — T-046-s1.** The orphan it
     names sits on **1420** on the default path, and T-046 just made the
     script run far more often. The next triage should weigh it against
     T-039-s1's `PATH`-cache item, which is the other actionable
     backlog card.
2. MILESTONE 3 (T-023…T-029 + T-039, ADR-017). **T-029 is UNGATED but
   not unblocked** — its `blocked_by` is still `[T-027]`, and T-028's
   is too. **The milestone's remaining cards all wait on the human, in
   this order:**
   (a) **T-027's planning pass waits on the human's split-view verdict**
   (item 1a) — it builds the LEFT half of a composition whose whole
   design question is what the open visual session is judging;
   dispatching a size-L planning pass now would have the planner guess
   the answer the human is mid-way through giving. Its `blocked_by`
   [T-024 ✓, T-025 ✓, T-026 ✓] has been satisfied since T-025 merged.
   (b) **T-041 is the hard gate before T-027/T-028/T-029 can write
   their served-bundle probes** — it is IN VERIFICATION now, so this
   sub-item is live rather than waiting on a dispatch.
   The milestone itself is NOT claimed: the first slice delivers
   hand-driven genesis, the runner exists and is hardened, but no agent
   loop has ever run against a real model.
3. OVERNIGHT DISPATCH GRANTS (human, 2026-08-16 night): the app-shell
   lane queue was T-021 → T-026 → T-025 → T-022; T-021, T-026 and T-025
   are all DONE, so the standing grant's next named item is **T-022**
   (M, milestone 4, `blocked_by: []`), with T-027 ahead of it in
   milestone order but held for the visual verdict. **app-shell is
   currently OCCUPIED TWICE OVER — T-041 in verification and T-048
   dispatched behind it — and app-agent by T-047**, so neither lane is
   free until those merge, and T-048 is the app-shell lane's next
   worktree. Triage: APPLY
   granted — but tasks NEWLY created by triage (T-041…T-048) do NOT
   dispatch without the human; T-041, T-046, T-047 and T-048 each got
   that nod explicitly (T-048's came mid-review, from the screen
   itself). Unchanged method rules: a second REJECTED on any task
   parks that lane for the human; @human judgments are never
   self-answered.
4. SUGGESTION BACKLOG — **14 open files: 9 parked + 5 suggested.**
   **AN OBLIGATION FOR T-041's INTEGRATOR, recorded here because it is
   exactly the kind of thing that gets missed**: T-048 already carries
   `Absorbs: T-041-s1, T-041-s3`, but both suggestion files still exist
   on the unmerged `t041-shell-harness` branch. The ratified encoding
   (method/tasks/TASK-FORMAT.md v0.1.4, T-016) says promoted →
   "Absorbs:" line **plus the suggestion file removed in the same
   commit**. The absorbing task landed first here, so T-041's merge
   must delete those two files or the board will show a promoted
   suggestion as still open.
   The four T-046 suggestions are **the newest untriaged set**, and
   T-039-s3 is the one older untriaged card left (the 2026-08-16 second
   triage absorbed T-039-s1/s2/s4 into T-047, which is why the board
   shows fewer than the T-039 checkpoint's tally).
   **Untriaged (5)**: T-046-s1 (the unsignalled process group — ranked
   first of the four, reproduced, and the only one whose blast radius
   is the human's own port), T-046-s4 (the overlay's blind spot — the
   only one that weakens a gate the pipeline now depends on),
   T-046-s2 (`checkJs` — note the file's worked example is wrong and
   the verifier's correction is IN the file), T-046-s3 (nothing gates
   the packaged build — read together with s4: same shape, one step to
   the right), and T-039-s3 (give the session-id refusal its own typed
   outcome; its home is T-029, still no disposition).
   **The nine parked, unchanged**, all blocked on something only the
   world can provide: T-003-s2 (a real project near the ~25 MB knee),
   T-008-s1 (F-04/F-05 layout), T-018-s1 (a Windows lane), T-021-s1 and
   T-026-s1 (both await the first Linux run — already on the launch
   item), T-025-s2 (@human, one command on an authenticated machine),
   T-025-s4 (gated by s2), T-025-s3 (nputer.yaml is F-04 era; its count
   fix rides T-043), T-038-s1 (no responsive call site yet).
   Five triage-born tasks stand ready and un-dispatched: T-042 (genesis
   switch truthfulness), T-043 (kill path: honest grace and honest
   scope — its "serialize behind T-039 on app-agent" condition is
   satisfied, but app-agent is occupied by T-047 until that merges),
   T-044 (shell pins cover their surface), T-045 (the gates cover the
   rules). Milestone-4 queue after F-03: T-010, T-013, T-014, T-015,
   T-030…T-035, T-044, T-045, plus T-022.

## Open questions
- **Does the BOOT GATE rule retire, and when?** T-009-s1's sibling rule
  names its retirement (T-014's `nputer index --check`); BOOT GATE
  names none in CONVENTIONS, and `.github/workflows/ci.yml` already
  invokes the boot check on ubuntu while dormant. Deliberately left for
  a triage rather than settled by an integrator edit — see the judgment
  call above.
