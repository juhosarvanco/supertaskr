# State

Updated: 2026-08-23 by claude-opus-4.8 @T-070-integrate (T-070 merged and
checkpointed).

## Just completed

**T-070 — arriving at a genesis reads what is on disk, bounded, and
without a CLI.** F-03, milestone 3, size M, `touches: [app-agent,
app-interview]`. Built by `claude-opus-5 @T-070` then rebuilt by a
SECOND executor `claude-opus-5 @T-070-fix`; verified by `claude-opus-5
@T-070-verify`; `review: same-model`. **REJECTED on the first verdict,
rebuilt, APPROVED on the second** — both verdicts are on the card.
Approved branch tip **`10123ae`** (the second-verdict commit, which
appended 220 lines to the card and added no finding file). Merge
**`740f0b7`**; the card was `verifying` and the integrator stamped
**`done`** at this checkpoint.

**WHAT LANDED.** Since T-029 the interview screen rehydrated its
transcript by reading the WHOLE `.nputer/genesis/transcript.jsonl` and
parsing every line before dropping all but the last
`MAX_REHYDRATED_LINES` (200) — the per-line cap protected the webview and
nothing protected the read, so a tens-of-MiB transcript cost a
tens-of-MiB read on every arrival. The read is now bounded AT THE READ:
`agent::transcript` calls `read_transcript_tail`, which drives a private
`tail_lines<R: Read + Seek>` that seeks from the end and walks backward
in `TAIL_CHUNK` (64 KiB) steps, stopping at the line budget OR a byte
ceiling `MAX_REHYDRATED_LINES × TRANSCRIPT_TEXT_CAP` (= 52 MB,
file-size-independent). The bound is held by a pin PAIR whose
COMPOSITION is the point — a `Counting<R>` cost pin that is total
because `tail_lines` is handed no path, plus a six-arm source tripwire
`the_only_production_path_to_the_transcript_is_the_bounded_one` binding
the callee set of each hop from `genesis_transcript` down, so a
whole-file read at ANY hop, in an allowlisted leaf, or in a new ordinary
reader reds BY NAME and FAILS CLOSED. `KickoffOutcome::Ready` now
carries `record: Option<GenesisRecord>` from `sessions::genesis_record`
(no CLI in the call), so a user with no supported CLI — routed to the
hand-driven kickoff — is finally told what they banked, and the turn
count reaches the DOM.

**THE FIRST VERDICT WAS RIGHT AND THE REBUILD IS WHY THIS MERGE IS
SOUND.** The first build's pin pair bound a private helper and a STRICT
whole-file decode, not the arrival read: two whole-file mutants (one in
`read_transcript_tail`, one in `agent::transcript`) survived the entire
Rust suite at 356/0/3 exit 0, and a newline-free file ran the walk to
byte 0. The rebuild added the byte ceiling and TOOK the source tripwire
the first build had refused — the verifier falsified the stated reason
for refusing it (V3 proved M2's pin green on exactly the mutant the
tripwire kills). **A criterion can be satisfied by a pin that measures
the wrong thing, and only a mutant derived from the criterion's own
adversary class finds it.**

**ELEVEN PATHS, SIX CODE, FIVE UNDER `docs/`.** The merge's diff is `M`
`app/src-tauri/src/agent/mod.rs`, `M` `app/src-tauri/src/agent/
sessions.rs`, `M` `app/src-tauri/tests/agent_runner.rs`, `M`
`app/src/genesis/InterviewChat.tsx`, `M` `app/src/lib/agent-store.ts`,
`M` `app/test/interview-resume-dom.test.tsx`, `M` the card, and `A` four
findings `T-070-s1`…`s4`. 2716 insertions, 14 deletions. IPC did not
move (13/13); `lib.rs` is a 0-line diff — the payload widened underneath
the commands.

## Ranges, every dot count stated, at their own refs

Main-before **`c03a193`** (the actual tip at start — T-064's fourth
commit, NUL-probe correction), approved tip **`10123ae`**, merge-base
**`2036fb2`** (T-084's checkpoint, an ANCESTOR of `c03a193`).

    git merge-tree --write-tree c03a193 10123ae -> tree 7e58571e…, exit 0 (read from $?)
    git diff --name-only c03a193 <TREE>                      -> 11   THE PRESCRIBED PRE-MERGE FORM
    git diff --name-only c03a193...10123ae   (THREE dots)    -> 11   collapses onto branch-only before the merge
    git diff --name-only 2036fb2..10123ae    (TWO, branch-only) -> 11
    git diff --name-only c03a193..10123ae    (TWO dots)      -> 164  THE FORBIDDEN PRE-MERGE FORM
    git diff --name-only c03a193..740f0b7    (TWO dots)      -> 11   THE MERGE'S DIFF, the only one that means anything

`git merge-base --is-ancestor c03a193 740f0b7` exits **0**, so at the
merge two dots and three dots COLLAPSE. The staged merge tree was
byte-identical to the forecast (`git write-tree` == `7e58571e…`) and the
merge's `HEAD^{tree}` IS that tree, with parents `c03a193` and `10123ae`
and nothing else. **NOTHING WAS WRITTEN INTO THE MERGE COMMIT**
(T-083-s4); the graph regen, the `closed_by:` repoint and every
integrator edit are in this checkpoint.

**THE FORBIDDEN COUNT IS 164 AND THAT IS LEFT-ENDPOINT DRIFT, NOT THIS
MERGE.** Main advanced **153** paths from the cut, the branch **11**;
`comm -12` over the sorted lists is **EMPTY**, and 153 + 11 = 164 —
exactly the forbidden count, and that arithmetic is the check that the
two sets are disjoint. The dispatch brief predicted "140+"; the branch's
own last forecast measured 141 at `ea7ea0a`, and main advanced another
23 paths under it while the lane sat. **A forbidden two-dot count goes
stale from the LEFT, and naming the ref is the whole defence.**

## THREE gates — all three FIRE, all three RUN

| gate | prescribed `c03a193..740f0b7` (11 paths) |
|---|---|
| BOOT GATE (`app/src-tauri/**`, `app/src/**`, either manifest) | **5 — FIRES** |
| GRAPH REGEN (`*.ts/*.tsx/*.js/*.jsx` outside docs/) | **3 — FIRES** |
| DOCS GATE (a `docs/` path a code suite reads) | **5 — FIRES**, three suites |

**BOOT GATE — OWED at 5 of 11, RUN, exit 0.** (The sixth code path,
`app/test/interview-resume-dom.test.tsx`, sits under `app/test/` — a
GRAPH REGEN trigger but NOT a boot trigger, which is `app/src/**` /
`app/src-tauri/**` / a manifest.) `NPUTER_BOOT_PORT=14741
npm run boot:check` from tools/e2e exits **0** with both `[nputer]`
lines (*project folder: /Users/ujju/Projects/nputer* and *window "main"
created*), child pid 29849, captured group 29849 (setsid, pgid == pid),
tree stopped on SIGTERM. Port **14741** was bind-probed free on all four
stacks (`127.0.0.1`, `0.0.0.0`, `::1`, `::`) before use.

**GRAPH REGEN — OWED on 3 paths, RUN AT THE CHECKPOINT, and a REAL RED —
re-derived, not inherited.** At the merge `index --check --root ../..`
exits **1** with the real-red discriminator on both halves: both count
lines present (committed *587539 bytes · 119 files · **1021** symbols ·
**1546** edges*; fresh *588891 · 119 · **1023** · **1550***) and `files
+0 -0 ~3` — three CONTENT changes (`InterviewChat.tsx`, `agent-store.ts`,
`interview-resume-dom.test.tsx`), zero adds/deletes, so not the `--root`
false red. **+2 symbols / +4 edges** (edges +5 −1): the new symbols are
`bankedSentence` (InterviewChat.tsx) and `GenesisRecordPayload`
(agent-store.ts). **THE ABSOLUTE NUMBERS ARE NOT THE BRANCH'S 1020/1543
— THE TWO REGENS COMPOUND.** The branch measured +2/+4 on top of the
1018/1539 base at its cut `2036fb2`; main's base has since moved to
1021/1546 (T-064's regen), so the same delta lands at **1023/1550**. The
regen (`NPUTER_UPDATE_GOLDEN=1 cargo test -p nputer-index --test
self_graph -- --ignored`) exits 0, and `index --check` exits **0** after
it, unpiped (`${PIPESTATUS[0]}` is EMPTY in zsh — read every exit off its
own `$?`).

**THE THREE-FIXTURE RULE DID NOT FIRE.** The registry is a 0-file diff
under `docs/architecture/components/`, so the parser pin holds, and the
two app dogfood bodies (`architecture-dogfood.test.ts` +
`map-dogfood-render.test.tsx`, **9 + 8 = 17/17**) are green against the
freshly regenerated graph — every new edge's endpoints sit inside C-13
and C-14, so no component relation moved. This checkpoint's own diff
outside `graph.json` is `docs/**` only, which `.nputerignore` excludes,
so the committed graph cannot restale from the doc edits — and no
indexed fixture needed reconciling, so the twice-run lesson held at one
re-run (index --check 0 after the checkpoint's own edits, below).

**DOCS GATE — FIRES, exit 1**, invoked DIRECTLY with the RANGE RULE's own
path list and never through `xargs`. Five `docs/` paths (the card + four
findings) owe **three** suites: `npm test from app/`, `npm test from
tools/e2e/`, `npx vitest run from lib/parser/`. `cargo test from
app/src-tauri/` is correctly NOT owed — its readers resolve
`docs/architecture/components` and `docs/CONVENTIONS.md`, neither
touched. It reports **11 derived readers across 4 suites**, **0
frontmatter issues**, a census of **118 docs-shaped sites in 22 files,
11 root-anchored in 9 files**, and *every live task card's frontmatter
parses, with a legal status* — the machine check that the four merged
findings and the two materialized here (below) are legal. All three owed
suites were re-run AFTER the checkpoint edits.

## The verdict's non-blocking findings are FILES now — materialized here

The second (APPROVED) verdict raised TWO non-blocking findings and one
provenance nit, and — the T-061 hazard — the verdict commit touched
ONLY the card, so both findings lived as card-body text, invisible to
triage. **Materialized here as files, crediting the verifier:**

- **`T-070-s5`** — the source tripwire's doc comment OVERSTATES its
  refactor-tolerance. The comment promises "split its loop … its callee
  set is unchanged and this stays green"; the verifier rewrote
  `transcript()` into an accumulate-with-`push` loop reaching the file
  only through the bounded reader, and the hop-1 exact-set assertion RED
  because `push` is a new callee. It FAILS CLOSED (the red carries the
  exact instruction, re-blessed by hand like `EXPECTED_GRANTS`), so it
  is a prose correction and NOT a correctness hole. **Not fixed in the
  merge** — the approved code is unaltered; the reword is filed for
  triage (the brief's "not this merge's job to fix").
- **`T-070-s6`** — the fragment-reconstruction bypass is a live
  whole-file read no source pin catches (a reader assembling the path
  from split fragments, wired through `transcript_path`; full suite
  358/0/3 exit 0). Ruled honestly bounded: disclosed in as many words,
  catches every accidental shape, and matches the `T-080-s4`
  disclosed-residual precedent.

## The `closed_by:` repoint — provenance nit closed, with its proof

`T-070-s4`'s frontmatter read `closed_by: 1e0b940` — a commit **rewritten
out of existence** (a predecessor of the delivered code tip `aec0d66`),
verified NOT on the branch (`git merge-base --is-ancestor 1e0b940
10123ae` exits **1**). The chunk-join that discharges s4 (`Vec<Vec<u8>>`
+ pop-and-join-once) was introduced by **`aec0d66`** (`git log -S
"Vec<Vec<u8>>"` names it; the verifier's own verdict says "delivered
commit is aec0d66"). Repointed **in this checkpoint** to `aec0d66`, which
is an ancestor of BOTH the approved tip and the merge (`git merge-base
--is-ancestor aec0d66 10123ae` and `… 740f0b7` each exit **0**). The
body's "the drill ran at `1e0b940`" reference is the executor's own
measurement-worktree provenance and is left untouched — out of the
one-line frontmatter scope.

## Suites, every number derived at the merge, exits read unpiped

- **parser: 263/263 across 12 files**, exit 0; `npm run build` **0**
  FIRST (fresh-clone order); `npx tsc --noEmit` **0**.
- **app: 857/857 across 43 files**, exit 0 — **854 at `c03a193`, plus
  this card's three DOM bodies**. `npm run build` **0**, 265 modules,
  `index-DsNHI2Jr.js` **503.61 kB** (the JS hash IS this merge's doing —
  `InterviewChat.tsx` and `agent-store.ts` are bundle inputs and both
  moved) and `index-CwYF5FQb.css` **43.95 kB** unchanged (no class
  moved).
- **bare Rust `cargo test --no-fail-fast`: 361 passed / 0 failed / 3
  ignored, exit 0**, summed programmatically over **fifteen** `test
  result:` lines. **The T-061-s4 kill-path flake
  (`the_exit_reap_pays_the_full_grace_when_a_same_group_descendant_resists`)
  did NOT fire** — one run, zero failures, no re-run needed and none
  performed. Not a baseline.
- **E2E: 129/129**, exit 0, scratch port **14743** (bind-probed free on
  four stacks); `npm run typecheck` **0**. Adds no spec, so equals main.
- **token lint: selftest 0, lint 0** — `clean (TOKEN 124 …; CONTROL 579
  tracked text files)`, 49 TOKEN + 4 CONTROL samples, 71 walk-policy, 8
  evidence-floor. Also the repo's only NUL gate, green.
- **`cargo audit -n`** exit **0**: 472 crates, **0 vulnerabilities / 17
  allowed warnings**, unmoved — a 0-file `Cargo.lock` diff requires it.
- **`index --check`** exit **1** before the regen, **0** after it, and
  **0** again after the checkpoint's doc edits.
- **DOCS GATE** exit **1**, owing three suites — all three run twice.
- **BOOT GATE** exit **0**, owed at 6 of 11 and run.

## CONTROL closes from both directions; TOKEN moved with MAIN

Tracked files **593 at `c03a193` → 597 at the merge**, the delta exactly
the **four T-070 finding files** `T-070-s1`…`s4`. So CONTROL **575
(c03a193) + 4 = 579 (merge)**, and the lint printed **579**. TOKEN is
**124** — unchanged BY this merge (it adds no `.ts/.tsx/.mjs` FILE under
app/src, app/test or tools/e2e); the move from the branch's 123 is
main's own advance. This checkpoint adds `T-070-s5` + `T-070-s6`, two
tracked docs, so CONTROL is **581** at the checkpoint; TOKEN unchanged.

## The poison drill — the brief's one mutant, at the MERGED commit

Detached scratch worktree `../nputer-T070-idrill` at **`740f0b7`**, with
`CARGO_TARGET_DIR` set INSIDE the drill directory (T-013-s7 — the main
checkout's `target/` was untouched). **Correspondence by hash before any
mutation**: `agent/sessions.rs`
`e490ded82bdfa8cea8995838a4bf00b46578a806f45f2061aa3a100c10579009` and
`agent/mod.rs`
`f9b82155aef3a9d74869d4103628a129330c59989e2f1d81f783a9483b45e5e4`,
identical to `git show 740f0b7:<path>` (the same hashes the verifier's
own approved-verdict drill recorded).

- **Baseline: `cargo test -p nputer --lib` -> 127 passed / 0 failed,
  exit 0.**
- **MUTANT V1 — `read_transcript_tail` → `fs::read` +
  `String::from_utf8_lossy` + last-N, `tail_lines` BYPASSED.**
  Substitution count 1, mutated text read back with `git diff` first.
  **Exit 101, 126 passed / 1 failed**, and the ONE red body is
  `the_only_production_path_to_the_transcript_is_the_bounded_one` at
  `mod.rs:1150` — *"read_transcript_tail gained or lost a callee — a
  whole-file read here is invisible to the Counting pin"* — the hop-2
  callee-set arm, exactly as the brief prescribed.

Restored by byte copy from `git show 740f0b7:<path>`, proved by an empty
`git diff` and sha256 back to `e490ded8…`; the drill worktree's only
untracked item was its scratch `.drilltarget/`, and the worktree was
removed.

## Security sweep — zero movement, every figure re-derived

The merge's diff contains **no lockfile, no `Cargo.toml`, no
`package.json`, no `tauri.conf.json`, no capability file, no
`.entitlements`** — zero manifest paths. **No dependency added.** The
change is boundary-NEUTRAL — the payload widens (a field is added to an
existing outcome) and no command crosses.

- `app/src-tauri/src/acl_pin.rs` is a **0-file diff**, sha256
  `8d24cbad706d9e6f09eca6888cf8a21d264039cac6153271093ea4847b60b00e`,
  `EXPECTED_GRANTS` unmoved at 92 (green inside the cargo run).
- **IPC is THIRTEEN at both ends**: 13 anchored `#[tauri::command]` and
  13 `generate_handler!` entries; `lib.rs` is a 0-line diff. No command
  added.
- `ENV_ALLOWLIST` unmoved at **16**; `runner.rs` a 0-file diff.
- **Exactly THREE `#[ignore]` attributes**, unmoved.
- The new code opens ONE file read-only (`fs::File::open` on the
  transcript) and adds no write path, no process surface (0 added
  `Command::new`/`spawn`/`child_process`). **0 NULs** across all paths
  this integration wrote (byte scan validated on a canary first — the
  ugrep `-P` false-green trap T-064 recorded).
- The sweep this card needs is the tripwire's own soundness, driven
  rather than reasoned: the six arms kill every accidental/ordinary
  whole-file read (V1 confirmed here); the one bypass they cannot kill
  is disclosed (`T-070-s6`).

## What ACTUALLY reached the human's running app

**Port 1420 was read with `lsof -nP -iTCP:1420 -sTCP:LISTEN` and nothing
else**, before and after — no bind, no connect, no signal, on any
interface. Holder `node` pid **82549**, one socket `TCP [::1]:1420
(LISTEN)`, identical throughout.

1. **THEIR APP RELAUNCHED, AT THE MERGE'S WORKING-TREE WRITE** — pid
   **93036 → 22955** (same supervisor ppid 82364, started 21:04:25),
   triggered by `git merge --no-ff --no-commit` putting the new
   `agent/mod.rs` and `agent/sessions.rs` on disk, which their `tauri
   dev` watcher rebuilt from. The supervisor chain (`npm run tauri dev`
   82342 → `tauri dev` 82364) and vite (82549) all survived. **T-084's
   generalisation holds again: the BOOT GATE's own trigger set predicts
   whether the human's window survives, and the trigger fires at the
   WORKING-TREE WRITE, not at the commit.**
2. **The map pane sees a NEW graph** — `docs/architecture/graph.json`
   moved 587539 → 588891 bytes, 119 files (unchanged), 1021 → **1023**
   symbols, 1546 → **1550** edges. Both new symbols and all four new
   edges sit inside C-05/C-13, so no component relation, finding or
   drift ring moves; the architecture lens looks the same.
3. **`app/dist` was rewritten** by the pre-suite build
   (`index-DsNHI2Jr.js`), and the bytes are this merge's.
4. The boot gate's own `tauri dev` built and ran a separate window on
   scratch port 14741 and was SIGTERM'd; it changed no source, so it
   triggered no further relaunch of the human's app.

**No process from this integration survives.** Scratch ports 14741
(boot), 14743 (e2e) were bind-probed free on all four stacks before use
and are free after. **No `pkill` at any point.** The T-070 worktree is
removed and the branch kept. The two `nputer-T-060` `fake_agent` orphans
(`52504`/`52505`, ppid 1) are unchanged and left alone (T-043-s1). **An
untracked zero-byte file `z`** sits in the main checkout (mtime
predating this session) — not mine, not staged, left alone. The
drill worktree used a scratch `CARGO_TARGET_DIR` and was removed.

## The board, derived from disk at this checkpoint

**157 flat task files, 67 done / 41 planned / 28 parked / 21 suggested /
0 verifying**; 67 + 41 + 28 + 21 = 157. Twenty-two files sit in
`docs/tasks/rejected/`, counted separately. The deltas from `c03a193` are
T-070 verifying → done, the four merged `T-070-s1…s4`, and the two
`T-070-s5`/`s6` materialized here. Every flat card's `status:` is in the
parser's vocabulary (the docs gate confirms it whole-tree).

## Provenance and health

T-070 is **built by `claude-opus-5` (two passes) and verified by
`claude-opus-5`**, `review: same-model`, **rejected then approved** — the
second executor's rebuild answered both blocking findings and the
integrator stamped `done` here. **67 done cards — 52 `same-model`, 9
`self-verified`, 5 `independent`, 1 EMPTY (T-056)**; 52 + 9 + 5 + 1 =
67. T-070 moves `same-model` from 51 to 52.

At this checkpoint main contains T-070's merge `740f0b7` plus this
checkpoint. Parser, app, Rust, E2E, token lint and its selftest, `cargo
audit`, the graph-currentness gate and the docs gate are all green;
**all three standing gates FIRED and all three were RUN.** Nothing is
broken. **Two KNOWN residuals of the delivered artifact are filed, not
hidden**: the tripwire doc-comment overstatement (`T-070-s5`, a
still-live false sentence in a `mod.rs` comment, the T-061-s8 shape) and
the fragment-reconstruction bypass (`T-070-s6`).

## In progress / broken right now

**TWO SIBLING LANES ARE LIVE, both carry a REJECTED verdict, and both are
DISJOINT from this merge** — `comm -12` over each lane's branch-only path
list against this merge's eleven returns **0**.

| lane | branch | tip | branch paths | base | `touches` |
|---|---|---|---|---|---|
| **T-013** | `task/T-013-semantic-zoom` | `056cb3d` | 26 | `2036fb2` | `[app-map, app-shell]` |
| **T-089** | `task/T-089-brief-contract` | `1e5c4e9` | 16 | `4d2f03c` | `[method/, docs/CONVENTIONS.md]` |

**T-013 STILL SHARES THE `app-shell` SLUG AND STILL OVERLAPS IN ZERO
FILES** — measured again at a tip (`056cb3d`) that is newer than the one
the last checkpoint recorded. **T-013'S INTEGRATOR MUST RE-DERIVE THE
GRAPH FORECAST AGAINST THIS CHECKPOINT'S 1023/1550, NOT AN OLDER BASE** —
the two regens compound exactly as they did here: a forecast computed
against 1021/1546 (or the older 1018/1539) is stale by +2/+4 the moment
this checkpoint lands. Its own base is `2036fb2`, so its range must be
derived at that base. **T-089's base is `4d2f03c`, not `2036fb2`**, so
its range must be derived at its own base as well; it fixes a rejection
and touches `method/` + `docs/CONVENTIONS.md`. Both tips are readings,
not facts — each moved between checkpoints (T-013 `c7528cc → 056cb3d`,
T-089 `b38a3cf → 1e5c4e9`).

`task/T-070-arrival-reads-disk` is kept as a branch and its worktree is
removed.

## Next up

1. **Triage the TWENTY-ONE suggestions.** T-070 deposited six of them —
   `T-070-s1` (the card's premise is wider than the tree: only the
   no-native-id arm still reaches `CliNotFound` silent), `T-070-s2` (the
   READ is bounded, the FILE still grows forever), `T-070-s3` (the
   budget-meaning change, filed by the executor against their own work),
   `T-070-s4` (discharged, `closed_by: aec0d66`, awaiting triage's
   promotion move), and the two materialized here, `T-070-s5` (tripwire
   doc reword) and `T-070-s6` (the disclosed bypass).
2. **`T-070-s5` IS A ONE-COMMENT FIX A TRIAGE OR A PASSING CARD SHOULD
   TAKE.** The comment in
   `the_only_production_path_to_the_transcript_is_the_bounded_one`
   conflates the SAFETY invariant with the GREEN-NESS condition; the
   reword is XS and strictly better than leaving a false sentence live.
3. **`T-070-s6` and `T-070-s2` are the disclosed-residual family** —
   the read is bounded, the file is not, and the source pin's boundary
   against deliberate obfuscation is stated rather than closed. If ever
   wanted, the arm is a read-boundary gate in the T-039 shape, not more
   census spellings.
4. **`T-070-s3`'s wrong-answer trade is the shape-six-adjacent lesson**:
   a budget on lines READ cannot answer what a whole-file read would
   have, and the card's "never a wrong answer" was corrected IN PLACE —
   confirmed reading true in the merged tree.
5. **Two lanes are in flight and both were REJECTED.** T-013 and T-089
   are each on a second pass; the graph-regen compounding trap above is
   T-013's specific hazard, and both must derive their ranges at their
   OWN bases.
6. **The relay-drift fixture (`T-083-s2`) gains a data point**: this
   card's forbidden two-dot count came in at 164, and the dispatch
   brief's own "140+" was a forecast relayed across an endpoint that
   then moved 23 paths further — right when written, stale when read.
