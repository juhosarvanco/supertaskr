# State

Updated: 2026-08-19 by integrator (T-069 merged and checkpointed),
claude-opus-5 @fresh

## Just completed

**T-069 — the turn's own end decides the diagnosis, and everything
parsed gets relayed.** F-03, milestone 3, size S, `touches: [app-agent]`.
Built and verified by `claude-opus-5 @fresh`, `review: same-model`.
Approved branch tip **`fb578a9`**; merge **`7e3e8b5`**. The card was at
`status: verifying`; the integrator stamped **`done`** at this
checkpoint, the fifth card running (T-043, T-057, T-076, T-073, T-069).

**A FACT THE PROCESS HAD ALREADY PARSED, DELIVERED NOWHERE A USER COULD
SEE IT.** When a turn's `result` line carried `permission_denials` but
the classifier DECLINED to claim them — `is_error: false`, so T-029-s7's
deliberately narrow `ToolDenied` guard does not fire — **nothing was
relayed at all**. The decline is right: a cumulative record of what was
refused is not a statement that a refusal ended the turn. But
`is_error: false` also kept the result TEXT out of the diagnostic ring,
so the turn arrived as `ExitNonZero { code: Some(1), stderr_tail: "" }`,
`failureDetail` returned null for an empty trimmed detail, `FailureBlock`
rendered no detail span, and the screen read **"the planner exited with
code 1" with nothing underneath** — over denial names sitting parsed,
bounded and control-stripped in a typed `Vec` three lines away. That is
this family's own spine surviving in the one corner of the task that
closed it everywhere else.

**THE PRINCIPLE THE CARD WRITES DOWN IS "RELAYING IS NOT DIAGNOSING",
AND THE PRECEDENT WAS ALREADY IN THE FILE.** The `api_retry` note is a
diagnostic the classifier never acts on, because the ring is a
DIAGNOSTIC ring and not a claim. The denial names now push there
unconditionally, bounded by `denial_names` (16 × 128 bytes), sanitized
there and again with the whole tail. The two decisions — what to relay
and what to claim — are independent from here on.

**TWO SMALLER CLOSURES RIDE WITH IT.** The comment beside
`auth_status = api_error_status;` now discloses the false NEGATIVE that
assignment bought (an auth failure naming its status ONLY in a
diagnostic stops being typed), and `auth-error-result-only` — the
transcribed 2.1.226 stream minus its `api_retry` line, emitted through
the SAME function so the two cannot drift — REDS if a future CLI moves
the status off the terminal line, instead of silently losing the
flagship affordance. And the residual false POSITIVE is closed: a
recovered 401 with no `result` line at all used to classify `AuthFailed`,
removing Try again and sending a user whose login is fine to
`claude login`. `text_after_auth_status` withdraws it when model text
arrives after the LAST status-bearing line. No `terminal_reason`
vocabulary is read, so the set T-029-s5 records as unverified is not
touched.

## The ruling, and why the verifier's argument is the one that carries

The executor **built** the discriminator rather than declining it, and
disclosed its own weakest joint in writing: the flag assumes **a delta
is the MODEL speaking**, while the CLI demonstrably writes its own prose
into a nominally-model field. **The verifier did not argue about that —
it CONSTRUCTED the stream and confirmed a true diagnosis IS withdrawn:**

    VERIFIER PROBE (CLI prose delta after an UNRECOVERED 401)
      => ExitNonZero { stderr_tail: "api_retry: authentication_failed 401\n" }
    the same stream at 76cf034
      => AuthFailed { status: Some(401), … }

**IT HOLDS ANYWAY, FOR A REASON THE NOTES DO NOT STATE, AND THIS IS THE
ARGUMENT THIS CHECKPOINT CARRIES.** That stream and the legitimate one
**differ only in the delta's TEXT, which `run_turn` never reads** — the
runner records the ARRIVAL of a delta, never its content. So closing the
joint requires reading delta content against a guessed vocabulary, which
is exactly what the card's third criterion forbids. The card's own
framing (a speculative discriminator, accepted because the counter-pin
holds) is weaker than that, and the counter-pin argument alone would not
have survived the probe.

**AND THE DEGRADATION IS BETTER THAN THE CARD CLAIMS.** Pre-fix the
message was the generic "the agent CLI could not authenticate"; post-fix
`failureDetail` renders the raw 401 line and `data-retryable` is TRUE.
The user loses a label and gains both the status and the button. That is
the direction T-029's verifier ratified — losing a diagnosis to a relay
beats a false positive that takes an affordance away — and it is now
measured on the exact stream that was supposed to be the counter-example.

## Three findings, none rejection-grade

- **`T-069-s2` — the discriminator declines evidence STRONGER than the
  evidence it acts on.** The runner's own justification ("model text is
  streamed by a request that SUCCEEDED") applies verbatim to
  `StreamLine::Activity` — a `tool_use` block — which `classify_line`
  already produces and the flag does not consult. It is stronger, not
  weaker: **the CLI fabricates prose, not tool_use blocks**, so the
  discriminator reads the evidence that CAN be forged and ignores the
  evidence that cannot. Measured, not argued: a `tool_use` delta after a
  recovered 401 still classifies `AuthFailed`. The family this closure
  reaches is smaller than its own argument — an ordinary opening for a
  planner that reads the repo before it speaks.
- **`T-069-s3` — shape seven, AND IT WAS FOUND FROM THE CRITERIA.**
  Criterion 1 says the denial **NAMES** (plural) reach the tail. Both
  relayed fixtures carry exactly ONE denial, and the only two-denial
  fixture classifies `ToolDenied`, a variant with no `stderr_tail` field
  at all. Reducing `denials.join(", ")` to the first name leaves
  `agent_runner` at **66/66, exit 0**; dropping the combined form
  entirely leaves the whole workspace at **343/0/3, exit 0**. A coverage
  gap, not a defect — the shipped behaviour is right and the criterion
  was measured met, so it does not carry the verdict. **This is the
  shape found independently in four lanes in one day, and it is the one
  instance found the RIGHT way: by reading a criterion rather than the
  tests.** Its fix is two lines (a second denial on
  `denied-fatal-not-flagged`, both names asserted).
- **`T-069-s1` — the mirrored `status.last_error` assertions cannot fail
  on their own.** Four-plus bodies in the T-029 family match the failure
  event and then assert the settled status is NOT some other variant;
  the match arm has already accepted the variant by the time the
  negative assertion runs, so every poison reds at `other => panic!`.
  The verifier judged the executor's choice — write one more of them, to
  match five neighbours rather than diverge from them — CORRECT. **The
  improvement is additive and is one line**: `TurnError` derives
  `PartialEq, Eq`, so the strong form is
  `assert_eq!(status.last_error.as_ref(), Some(&got))`, which pins the
  event-to-state path and fixes all five mirrored bodies at once without
  being brittle.

## The third redundancy is DEFENSIBLE and kept — with a better reason than the card gives

Neutralising `if auth_status.is_some()` to `if true` in the `TextDelta`
arm leaves **66/66** — inert, exactly as the executor disclosed. The
card justifies keeping it aesthetically ("it makes the variable's NAME
true at all times"). **The measured justification is stronger and is the
one that belongs in the source comment: FAULT CONTAINMENT.** With the
`Diagnostic` arm's reset deleted, a stream whose text precedes any
status classifies `AuthFailed` **with** the guard and `ExitNonZero`
**without** it. It is load-bearing only under a compound fault, which is
why no single-mutation drill can red it — and that is a reason to keep
it, not a reason to call it decorative. The verifier's sentence, kept
verbatim because it generalises: *"the notes' aesthetic justification is
weaker than the measured one."*

## Card corrections carried, not summarised

1. **The third `#[ignore]` is at `tests/agent_runner.rs:3284`, not
   `:3218`.** The notes cite the stale figure (it was `:3037` at the base
   `76cf034`, per T-043's verdict). Re-derived here from the repo ROOT
   with an anchored grep: exactly **three** `#[ignore = "…"]` attributes
   repo-wide — `crates/nputer-index/tests/perf.rs:53`,
   `crates/nputer-index/tests/self_graph.rs:58`,
   `tests/agent_runner.rs:3284`. The other 53 `#[ignore` hits are prose.
   **A citation names a symbol, not a line** — the eighth instance of
   that lesson in this archive, and the second on this card alone.
2. **The `is_some()` guard's source comment states the wrong property.**
   It should carry the fault-containment argument above rather than
   "makes the name true". Filed as a correction rather than fixed,
   because the integrator does not edit shipped source at the merge.

## Integration truth

T-069 and main shared base **`76cf034`**, which is also the
`merge-base`. Main-before was **`fb750cf`** and the approved worktree was
clean at **`fb578a9`** (`git status --porcelain` empty). Main advanced
**36** paths from that base (T-076's and T-073's merges plus their
checkpoints); T-069 changed **7**. **Their changed-file intersection is
EMPTY**, computed with `comm -12` over the two sorted lists; 36 + 7 = 43,
which is exactly the naive derivation's count, and that arithmetic is the
check that the two sets really are disjoint. The read-only
`git merge-tree --write-tree` predicted tree
**`cb605ec793482d51e69d0336232573edfea821a2`** BEFORE anything was
written, and the no-ff merge **`7e3e8b5`** produced that tree exactly,
with parents `fb750cf` and `fb578a9` and nothing else. The staged set at
`git merge --no-commit` was the seven paths and nothing more.

**The merge's diff (`fb750cf..7e3e8b5`) is SEVEN files**, +1475/−30:
three `.rs` under `app/src-tauri/` (`src/agent/runner.rs`,
`src/bin/fake_agent.rs`, `tests/agent_runner.rs`) and four `.md` under
`docs/tasks/` (the card, modified, plus the three new `T-069-s*` files).
By suffix that is **3 `.rs` + 4 `.md`**; three are additions and four
modifications. `file --mime` reports `charset=utf-8` on all seven (the
mime TYPE varies — `text/x-java` and `text/x-c` for two of the `.rs`
files — which is libmagic heuristics, not an encoding finding).

**THE BRIEF'S RANGES WERE RE-DERIVED RATHER THAN TRUSTED, AND ONE FIGURE
IN IT IS WRONG.** The brief describes the branch as "3 `.rs` + 2 `.md`";
it is **3 `.rs` + 4 `.md`** — the card plus THREE suggestion files, one
of which (`T-069-s1`) was written by the executor and two by the
verifier. Everything else the brief named reproduces exactly: tip
`fb578a9`, base `76cf034`, main-before `fb750cf`, cargo 343 + 3,
`agent_runner` 60 → 66, `acl_pin.rs` `8d24cbad…`, 92 grants,
`ENV_ALLOWLIST` 423 bytes / 16 entries, three `#[ignore]`s.

**The board, derived from disk at both ends.** Main-before: **116 task
files, 54 done / 26 planned / 20 parked / 16 suggested**. At this
checkpoint: **119 task files, 55 done / 25 planned / 20 parked / 19
suggested**; 55 + 25 + 20 + 19 = 119. The deltas are exactly T-069
planned→(verifying, from the branch)→done and the three new suggestion
files. Ten files sit in `docs/tasks/rejected/` and are counted
separately, as always.

**Security movement is zero, and the limb that needed checking is the
`.rs` one.** The merge's diff contains **no lockfile, no `Cargo.toml`,
no `package.json`, no `tauri.conf.json` and no capability file** — 0
paths matched. It DOES contain three `.rs` files, and one of them
(`runner.rs`) owns the child environment, so that was read rather than
assumed: the diff touches **zero** `ENV_ALLOWLIST` lines, and the
allowlist is unmoved at **423 bytes / 16 entries** over the anchored
range `runner.rs:929-948` (never a byte offset into the file).
`acl_pin.rs` is byte-identical across the merge (0-file diff, sha256
`8d24cbad706d9e6f09eca6888cf8a21d264039cac6153271093ea4847b60b00e`) with
**92** grants counted twice from the `EXPECTED_GRANTS` array body
(`:55-146`) — 92 entry lines and 92 unique strings agreeing. The IPC
surface is unchanged at **thirteen** commands, derived from both ends:
13 `#[tauri::command]` attributes in `lib.rs` and 13 names listed in
`generate_handler!` (the fourteenth repo-wide grep hit is prose in
`agent/mod.rs`'s doc comment, line 24).

## Suites, every number derived at this merge, exits read unpiped

No suite was piped through `tail`, `head` or `grep` for its exit code;
each command printed its own `echo $?` and the counts were read from the
full output.

- **parser: 263/263 across 12 files**, exit 0; `tsc --noEmit` exit 0.
  UNCHANGED, and derivably so: the merge's diff contains **zero
  `lib/parser` paths**. `lib/parser` was NOT rebuilt.
- **app: 827/827 across 42 files**, exit 0. `npm run build` exit 0 with
  **265 modules transformed**, emitting `index-DjYVlJel.js` **501.37 kB**
  and `index-CwYF5FQb.css` **43.95 kB** — main's own T-076/T-073 figures,
  unmoved, which is what a merge with a **0-file diff under `app/src`**
  has to produce. The build is a PREREQUISITE, not a courtesy: without
  `app/dist` twelve shipped-bundle assertions fail by design.
- **bare Rust workspace: 343 passed / 0 failed / 3 ignored**, exit 0,
  summed from **fifteen** `test result:` lines: `nputer_lib` 117 ·
  `fake_agent` 0 · `nputer` 0 · **`agent_runner` 66 + 1 ignored** ·
  `nputer_index` lib 123 · `nputer-index` bin 0 · arch 7 · cli 13 ·
  containment 3 · golden 7 · perf 0 + 1 · self_graph 2 + 1 · watch 4 ·
  doctests 1 / 0. **337 → 343 is the whole movement, and all six land in
  `agent_runner` (60 → 66)**, which is where the merge's only test file
  is. No body was deleted.
- **E2E: 88/88**, exit 0; `npm run typecheck` exit 0. Scratch port
  **17318** bind-probed free with a real `net.createServer().listen()`
  before use and proven free again afterwards — deliberately NOT the
  lane's 14520 default, because T-080 is a live `tools/e2e` lane and a
  default port is a collision waiting to happen. One worker, zero
  retries, zero skips.
- **token lint: TOKEN 119 / CONTROL 517**, exit 0.
- **`cargo audit -n`** (no fetch) exit 0: **0 vulnerabilities / 17
  allowed warnings** — the same 16 `unmaintained` + 1 `unsound` baseline,
  unmoved, which a **0-file `Cargo.lock` diff** requires.

**BOTH LINT COUNTS ARE DERIVED FROM TWO DIRECTIONS AND BOTH CLOSE.**
TOKEN is **unchanged at 119** because the merge adds no file under
`app/src`, `app/test` or `tools/e2e` — its three new files are all under
`docs/tasks/`. CONTROL moves **514 → 517**: tracked files go **532 → 535**
(`git ls-files`, both ends), the three new `T-069-s*` files and nothing
else, and 535 − 18 binary assets gives **517**, which is what the shipped
scanner reports. **Nothing pins either count** — still T-058-s1, still
T-080's subject, and T-080 has now committed seven more paths since the
last checkpoint.

**No `npm ci` or `npm install` ran in the main checkout** (T-052
mechanism B): every suite ran against the existing install. **The
fresh-install proof was NOT taken this time, and the reason is derived
rather than deferred**: the last checkpoint took it because that merge
moved `app/package.json`'s build command. This merge's diff contains
**zero manifests and zero lockfiles**, so there is no install-time claim
to prove — a fresh install of this commit resolves exactly what the last
one resolved. The scratch worktree that WAS taken (below) is for the
poison drill, and it is a Rust drill, not an install proof.

## The integrator's poison drill, run at the MERGED commit and NOT in the human's checkout

**The drilled artifact is provably the merged artifact.** All three
`.rs` files at the merge hash exactly what the verifier recorded at
`fb578a9` — runner `8a334697…`, fake_agent `f1c270f2…`, agent_runner
`4218d447…` — which they must, since the merge's file sets are disjoint,
and which is now measured rather than reasoned.

**FOUR ROUNDS, THREE REQUIRED REDS AND ONE REQUIRED GREEN, each naming
the body it moved.** Baseline in the scratch tree is **66 passed / 0
failed / 1 ignored, exit 0** — the same figure as the main checkout, so
the drill tree is not a different tree.

    P1  relay push writes zero bytes           exit 101  64/2 FAILED
        (ring.push(&note.as_bytes()[..0]))     both relay pins by name:
                                               a_denial_the_planner_routed_around…
                                               a_fatal_denial_the_cli_did_not_flag…
    P2  `&& !text_after_auth_status` deleted   exit 101  65/1 FAILED
                                               a_recovered_auth_retry_followed_by_
                                               model_text_and_no_result_line_…
    P3  Diagnostic arm's reset deleted         exit 101  65/1 FAILED
                                               a_second_auth_retry_behind_the_
                                               recovered_one_is_still_an_auth_failure
    P4  denials.join(", ") -> first name only  exit 0    66/0 PASSED  <- s3

**P4 is `T-069-s3` reproduced independently at the MERGED commit**, not
carried from the verdict: the relay's plural genuinely has no pin, and a
mutation that silently discards every refused tool but the first walks
through the whole suite. **P3 is the round that matters most for the
ruling above** — the reset in the `Diagnostic` arm is what scopes the
discriminator to the LAST status, and it has exactly one body that reds
when it goes. Restoration proved by sha256 against
`git show HEAD:<path>` after every round, not by a clean `git status`:
all three files back to `8a334697…` / `f1c270f2…` / `4218d447…`, and the
drill worktree's `git status --porcelain` empty at the end.

**The drill ran in a detached scratch worktree at `7e3e8b5` with its own
`CARGO_TARGET_DIR`, and that placement is the finding worth keeping.**
Poisoning `runner.rs` in the main checkout would edit source that the
human's live `tauri dev` is watching: it would rebuild and relaunch
their app on the mutant and again on the restore, twice per round. The
last three merges were TypeScript-only and never faced this. **A lane
whose fence is `app/src-tauri/**` cannot drill in the live checkout
without driving the human's window through the mutation set** — that is
new, it is not written anywhere, and it belongs in CONVENTIONS beside
the boot gate.

## The two gates, with BOTH trigger derivations computed

**BOOT GATE — IT FIRES, AND BOTH DERIVATIONS AGREE THAT IT DOES.** The
trigger is `app/src-tauri/**`, `app/src/**`, `app/package.json` or
`app/src-tauri/Cargo.toml`. Over the merge's diff (`fb750cf..7e3e8b5`)
it matches **THREE** paths, all `app/src-tauri/**`; `app/src/**` 0,
`app/package.json` 0, `app/src-tauri/Cargo.toml` 0. The naive
`76cf034..7e3e8b5` derivation matches **FOUR** — the same three plus
`app/package.json`, which is T-073's line, already boot-gated at its own
merge. Same answer, a trigger set one path too wide.

Run as `NPUTER_BOOT_PORT=47311 npm run boot:check` from `tools/e2e`,
port bind-probed free before spawning and well away from 1420.
**`BOOT_EXIT=0`** — my own `echo $?`, since the script prints none —
with both startup lines seen:
`[nputer] project folder: /Users/ujju/Projects/nputer` and
`[nputer] window "main" created`. The tree stopped cleanly
(`exit=null signal=SIGTERM`) and 47311 was re-probed FREE afterwards.

**GRAPH REGEN — THE TWO DERIVATIONS DISAGREE ABOUT THE ANSWER, FOR THE
SECOND TIME THIS WEEK, AND THIS ONE IS WIDER.** The trigger is
`*.ts/*.tsx/*.js/*.jsx` outside `docs/`. Over the merge's diff it matches
**ZERO** — the branch is three `.rs` and four `.md`, and the indexer is
TypeScript-only — **so the gate DOES NOT FIRE and no regen was owed**.
The naive `76cf034..7e3e8b5` derivation matches **EIGHTEEN**: T-073's
three `app/test` files and T-076's fifteen `lib/parser` files, every one
already merged and already regenerated at its own checkpoint. **0 vs 18.**

CONVENTIONS still carries the sentence *"It has never yet changed
WHETHER the gate fires — both derivations fired all six times."* The
T-076 merge falsified it at **0 vs 5**; this merge falsifies it again,
more than three times as wide, and on the OTHER gate's sibling rule. It
is no longer a one-off worth a footnote: **a lane whose own work is
Rust-only, cut from a checkpoint that main has since moved past with
TypeScript work, will reproduce this every time.** T-078 owns the text
and now has two worked examples instead of one.

**T-054's standing clause, discharged by hand.** There is still no git
remote and `ci.yml` has never executed a single step, so `index --check`
as a CI gate remains true in the future tense only. The integrator ran
it at the merge and again after every documentation edit:

    INDEX_CHECK_EXIT=0
    [nputer-index] graph.json is CURRENT — ../../docs/architecture/graph.json
      matches a fresh index (575619 bytes, 118 files, 995 symbols, 1518 edges)

`docs/architecture/graph.json` is a **0-file diff across the merge** and
sha256 `aba7c44b1c6a20d9d2c8093eb792371b9f88208b34472492f5f0f91b88653993`
— byte-identical to what the last checkpoint committed. The doc edits do
not stale it because `docs/` is `.nputerignore`d, proven by re-running
the gate after them rather than reasoned from the ignore file.

**`--root` is load-bearing and was used on every invocation.** Run from
`app/src-tauri` without it, `index --check` exits 1 and prints a headline
string-identical to a real staleness report, with
`committed: MISSING at docs/architecture/graph.json` only on the SECOND
line. A reader who stops at the headline reads a false red.

**T-024's three-fixture rule does NOT fire, verified rather than
assumed.** Its trigger is DECLARING A COMPONENT, and
`git diff fb750cf..7e3e8b5 -- docs/architecture/components/` is a
**0-file diff**. The registry still stops at `C-14`.

## The fixture forecast, and whether it was complete

**Forecast, made before any suite ran: ZERO assertions move.** The
derivation is short and it is the whole of it — the indexer is
`languages: ["ts"]`, the merge's diff is three `.rs` and four `.md`, and
`docs/` is `.nputerignore`d, so nothing in the merge can enter the graph.
No file count, no C-05 mapping row, no `map-dogfood-render.test.tsx`
index hint can move.

**The forecast was COMPLETE, and it was confirmed twice independently**:
`index --check` reports CURRENT at the merge with no regen run at all
(the first checkpoint in this ledger where the answer is "the gate did
not fire AND the graph was already current"), and the app suite is
**827/827 across 42 files at exit 0** at the merged tree with **no
fixture reconciliation of any kind**. This is the FIRST merge in the
recent series with no fixture movement to forecast — the previous ten
each had at least one assertion to catch — and the reason is structural
rather than lucky: a Rust-only lane is invisible to a TypeScript-only
indexer.

## What ACTUALLY reached the human's running app

**Port 1420 is the human's app** — a vite listener (node pid **82549**,
up since Aug 18 03:45:46) serving this checkout. It was never bound,
connected to or signalled; read-only `lsof` only, checked at the start
and again at the end, **same pid both times**. Scratch ports **47311**
and **17318** were bind-probed free before use and proven free again
after.

1. **THEIR APP PROCESS WAS REPLACED, AND FOR THE FIRST TIME IN FOUR
   MERGES THAT IS THIS MERGE'S DOING.** The last checkpoint recorded pid
   **45155**; it is **gone**. Pid **36009** now runs `target/debug/nputer`
   under the same unchanged `tauri dev` supervisor (ppid 82364, itself
   unmoved since Aug 18), started **Wed Aug 19 15:33:23** — two seconds
   after `git merge --no-commit` wrote `runner.rs`, `fake_agent.rs` and
   `agent_runner.rs` into their checkout at 15:33:21. `tauri dev` watches
   `app/src-tauri/**`, and this merge is the first since T-043 with a
   non-zero diff there (3 paths). The two-second gap is too short for a
   link, so the CAUSAL claim is left as the most likely reading rather
   than asserted.
2. **The image it is running was built from the MERGED tree, and that
   part is measured.** Pid 36009 holds inode **27270788** at
   **39,730,872 bytes** — now unlinked, because this integration's own
   boot gate rebuilt `target/debug/nputer` at 15:39 into inode
   **27281745**, at **exactly the same 39,730,872 bytes**, from the same
   merged source. The pre-merge build of the same target was
   **39,720,824** bytes (Aug 17), so the running image is NOT a
   pre-merge binary. The on-disk binary contains the string
   `permission_denials: ` — T-069's relay, present.
3. **SO THE RELAUNCH ITEM OWED ACROSS THREE MERGES IS DISCHARGED, BY
   THEIR OWN WATCHER RATHER THAN BY THEM.** The window they are looking
   at is no longer the pre-T-043 image. It contains T-043's kill path
   AND T-069's relay. The inode is unlinked again, which is cosmetic on
   macOS — replacing a running binary does not touch the running process
   — and the CONTENT question is what mattered, which is why it was
   measured by size and by string rather than by inode.
4. **Their frontend did NOT take a hot update.** `app/src` is a 0-file
   diff, and `lib/parser/dist/*.js` — which sits in the dev server's
   LIVE module graph through the `app/node_modules/@nputer/parser`
   symlink — is byte-unchanged, mtime still 14:31, since the merge moves
   no parser source and no parser build was required or run. The dev
   server was not restarted (`npm run dev` 82504 and vite 82549 are both
   the originals from Aug 18).
5. **The map pane saw NOTHING new.** `docs/architecture/graph.json` is a
   0-file diff and its mtime is still 15:14, the last checkpoint's. Their
   map's index hint still reads **118 files**, correctly.
6. **Docs-watcher snapshots.** The watcher ships a full snapshot of
   `<project>/docs` on every change, so their board re-read the tree:
   T-069 now shows `done`, three new `T-069-s*` cards appeared, and
   STATE.md, ARCHITECTURE.md **and ROADMAP.md** all moved with this
   checkpoint. ROADMAP moving is the unusual one — see below.
7. **A second window opened and closed** when the boot gate fired on
   scratch port 47311; they may have seen the flash. It is also what
   rewrote the on-disk binary in item 2.
8. **`app/dist` was rewritten** by the required pre-suite build. The dev
   server does not serve `dist` and no module in its graph imports it, so
   this is invisible to their window.

**No process from this integration survives.** Census by
`ps -Ao pid,ppid,stat,command` at the end: zero `vitest`, zero
`playwright` or `chromium` of mine, zero `cargo` or `rustc`, zero
`fake_agent` of mine, no stray `tauri dev`, no orphaned shell; both
scratch ports free; the scratch worktree removed. **No broad `pkill` was
used at any point.** The two `nputer-T-060` orphans (`52504`/`52505`,
ppid 1) are unchanged before and after and are deliberately left alone —
they are `T-043-s1`, not this integration's to claim or clean. An
unrelated `ClawStudio/Omputer` process (pid 58407) is the human's and
was never touched.

**THE SCRATCH DIRECTORY IS NOT PRIVATE, FOURTH OBSERVATION.** Every file
this session wrote into the shared session-keyed directory was prefixed
`T069-integ-`, including the drill worktree and its cargo target. The
directory is keyed by session and shared in practice; prefix or lose it.

## Health of the tree

At this checkpoint main contains T-069 merge `7e3e8b5` plus this
checkpoint. Parser, app, Rust, E2E, token lint, boot and
graph-currentness gates are all green.

**ROADMAP WAS TICKED, AND THIS IS THE FIRST TIME IN SIX MERGES.** The
discriminator this repo uses is: does it change what a USER can do or
see? T-069 answers **yes**, and the strongest form of the answer is that
it makes a sentence ALREADY IN THE ROADMAP true. T-029's entry promises
that "a turn killed because `--allowedTools` was too narrow names the
tool that was denied" — and that promise held only while the CLI flagged
its own result an error. The `is_error: false` shape produced "the
planner exited with code 1" and nothing else, over names the process was
holding in memory. A card that closes the gap between a written promise
and the screen is not an internal-correctness card, and the precedent
class is T-029 and T-043 (both app-agent, both with entries), not T-019 /
T-030 / T-053 / T-076 / T-073. The second half — Try again restored for
a planner that recovered a 401 and died of something else — is an
affordance, which is the most user-visible thing this backlog tracks.

**ARCHITECTURE WAS TOUCHED, in C-14's narrative, and the call is easy
for a reason that has nothing to do with the Components table.** That
table stops at C-07 and `app-agent` is **C-14**, so the "no C-id, no
paragraph" test does not decide this one either way — but C-14 already
owns a card-by-card narrative in the same file (T-029, T-056, T-057,
T-043), and T-069 changes what that narrative's central claim DELIVERS.
The paragraph says C-14 "classifies WHY a turn died as a typed outcome
instead of relaying an exit code and a blob"; T-069's content is that
classifying and relaying were coupled, and are not any more. The auth
arm's new property is stated in the same entry: **`AuthFailed` can now be
WITHDRAWN by evidence, not only asserted by it** — which is a fact about
the component that no amount of reading a single function reveals. What
is NOT held is recorded there too: the delta-content limit, and
`T-069-s2`'s stronger unread evidence.

## Provenance

T-069 is **built and verified by `claude-opus-5 @fresh`**,
`review: same-model` — the same model on both sides, honestly stamped.
Re-derived across all done cards at this checkpoint rather than assumed:
**55 done cards — 44 read `same-model`, 5 read `self-verified`, 5 read
`independent`, and T-056 is a done card whose `review:` is EMPTY.**
T-069 is the card that moves `same-model` from 43 to 44.

Of the five `independent` stamps, **only three have different models on
the two sides**: T-057 and T-058 (codex/gpt-5.6 built, claude-opus-5
verified) and T-060 (claude-opus-5 built, codex/gpt-5 verified). **T-055
and T-066 are stamped `independent` with the SAME model on both sides**,
which is `same-model` by the convention's own definition. Unchanged by
this merge; no card's history was re-stamped.

**A sixth data point on who stamps `done`, and it agrees with the
fifth.** T-069's verifier left `status: verifying` for the integrator,
exactly as T-043's, T-076's and T-073's did, and the integrator stamped
it at the checkpoint — five of the last six, with T-058's executor the
only outlier. T-069 is size **S**, so `method/roles/executor.md:19`
permitted the executor to stamp it and the executor declined, which is
the second consecutive instance of the practice holding against a
written permission. **This is now settled enough to write down**, and
the file to write it in is T-078's.

## In progress / broken right now

**TWO sibling lanes hold worktrees, and TWO further sessions are running
outside the repo.** Every tip below was verified against its branch ref
through this repository's shared object store rather than assumed from a
slug. No sibling worktree was read into, written to, built from or
signalled.

- **T-078 — the conventions describe the machine that exists**
  (`task/T-078-conventions`, worktree `../nputer-T-078`). F-01,
  milestone 4, size M, `touches: [docs/CONVENTIONS.md, method/]`.
  **APPROVED and QUEUED FOR INTEGRATION directly behind this
  checkpoint.** Tip **`d219482`**, subject "T-078 re-verify: my own two
  middle dots, caught by the same range check and rewritten"; **16**
  paths from base `e4a5ae7`, carrying nine `T-078-s*` findings.
  **FOUR items in this checkpoint are its text to write**: the boot-gate
  sentence that is now false TWICE (0 vs 5 at T-076, 0 vs 18 here), the
  size-S carve-out, `T-073-s2`'s program-scope sentence, and the drill
  clause's criterion-derived mutant.
- **T-080 — the gate sees what the corpus does**
  (`task/T-080-gate-sees`, worktree `../nputer-T-080`), cut from the
  checkpoint `16bb47b`. **Building, and it moved a long way during this
  integration**: `fef8870`/3 paths at the start, **`9c64cd8`**/**10**
  paths now, subject "T-080: fix two unparseable finding titles, file
  s6, record the catch". This is the lane that inherits T-058-s1 — that
  nothing pins TOKEN or CONTROL — and this merge moved CONTROL again
  (514 → 517) while TOKEN stayed put, so the lane's subject stays live.
- **A REAL-CLI OBSERVATION SESSION, outside the repo, and it is the most
  important thing running.** The human authenticated, so the four
  unobservable things `T-025-s2` records are being MEASURED for the first
  time. Every fixture in `fake_agent.rs` — including the three T-069
  added — is a transcription of a 2.1.226 stream, and T-069's own card
  states that the safety of T-029's terminal-line rule is a FACT ABOUT
  THE CLI rather than about the code. This session is the first thing
  that can confirm or refute those transcriptions. It writes nothing to
  the repo.
- **An F-04 DECOMPOSITION PASS, outside the repo.** Also read-only from
  this tree's point of view; it writes nothing here.

**Both worktree lanes are disjoint from this merge**, computed with
`comm -12` against this merge's own seven-file list rather than inferred
from `touches:` — T-078 changed 16 paths, T-080 10, and both
intersections are **0**, re-computed at the END of the integration
against the tips above rather than the ones the brief named (both had
moved). `app-agent` is released by this merge.

Nothing is broken. No lane is blocked on this checkpoint.

## Next up

1. **Integrate T-078.** It is approved, queued, and it owns four
   corrections this checkpoint has now measured rather than argued.
2. **Triage the nineteen undispositioned suggestions** — six `T-043-s*`,
   five `T-076-s*`, five `T-073-s*` and three `T-069-s*`. **Treat
   `T-076-s4`, `T-069-s3` and `T-073-s4`/`s5` as ONE item.** Four lanes
   that could not see each other found the same shape in one day, and
   `T-069-s3` is the instance that shows the remedy works: it was found
   by reading a CRITERION with the test file closed. That sentence is
   the fix, and it is small.
3. **`T-069-s2` is the cheapest real improvement on the board**: one arm
   (`StreamLine::Activity` sets the same flag), one fixture, one body.
   The question to settle first is whether a `tool_use` block should
   carry the same weight as a delta or MORE, since T-069's stated limit —
   the CLI fabricates prose — does not apply to it.
4. **`T-069-s1` is one line** and improves five bodies at once:
   `assert_eq!(status.last_error.as_ref(), Some(&got))`. It belongs to
   whoever owns `agent/mod.rs`'s status storage.
5. **T-070** remains newly dispatchable on the fence T-043 released
   (`app-agent`, `blocked_by: []`), and `app-agent` is free again as of
   this merge. **T-065** (`blocked_by: [T-057, T-058]`) remains unblocked
   and undispatched; **T-067** and **T-068** still wait behind it.
   **T-077** inherits T-053-s1.
6. The human-owned authenticated genesis below — still the whole
   remaining milestone-3 gate, and now being measured for the first time
   by the real-CLI session above.

Dispatch the next lane from THIS checkpoint, not from the merge commit
(T-014-s3). **The usual reason does not apply this time and the rule
still does** — this merge did NOT stale the graph, so `7e3e8b5` happens
to be a safe cut point; but "happens to be" is not a rule, and the next
merge that touches TypeScript restores the hazard immediately.

## Human-owned evidence and decisions

- **Real genesis run:** authenticate the supported CLI, then perform one
  timed end-to-end genesis on a toy idea, target <=30 minutes, with
  light and dark completion screenshots. **A session is now measuring
  the CLI's real stream shapes for the first time** (above); the timed
  genesis itself is still owed.
- **Relaunch the desktop app — DISCHARGED at this merge, without anyone
  doing it.** Their `tauri dev` replaced the process at 15:33:23 and the
  running image is a merged-tree build, so the window now contains
  T-043's kill path and T-069's relay. **The three-merge debt is
  closed.** What is worth one confirmation from the human: that the
  window they are looking at did in fact restart, since the causal claim
  above is inferred from timing and measured from binary size.
- **Confirm the quit-mid-turn behaviour** (T-043's own @human line):
  start a `hang`-scenario genesis, quit the app, and it should close
  promptly rather than after a five-second pause. **This is now actually
  runnable** — the relaunch it waited on has happened.
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

- **Where does a lane whose fence is `app/src-tauri/**` run its poison
  drill?** New here, and it has no written answer. Mutating shipped Rust
  in the main checkout drives the human's live `tauri dev` through the
  whole mutation set — rebuild and relaunch, twice per round. This
  integration drilled in a detached scratch worktree with its own
  `CARGO_TARGET_DIR` to avoid it, at the cost of a cold build. The three
  previous merges were TypeScript-only and never met this. Candidate
  rule: any drill that mutates a watched source tree runs in a scratch
  worktree, and the checkpoint says so. The cost is real and should be in
the rule: the drill tree's own cargo target reached **2.0 GB** before it
was removed.
- **Should CONVENTIONS' boot-gate sentence be corrected, or replaced?**
  "It has never yet changed WHETHER the gate fires" is now false twice
  in one week — 0 vs 5 at T-076, 0 vs 18 here — and the second instance
  shows it is not accidental: any Rust-only lane cut from a checkpoint
  that main has since advanced with TypeScript work reproduces it. The
  correction is T-078's; what is open is whether the sentence should
  become a WARNING about the naive derivation rather than a reassurance.
- **Does TASK-FORMAT's size-S row need a carve-out, and what is it?**
  Unchanged from the last checkpoint, and T-069 is a second worked
  example: size S, and it ran executor + verifier + integrator because
  two standing gates name the integrator by role. Candidate shape: the S
  tier holds while a card stays inside its fence and moves nothing a
  standing gate watches.
- **Is `T-073-s4` shape seven, and has the archive's "zero survivors"
  claim been retired?** Four independent sightings in one day now
  (`T-076-s4`, `T-069-s3`, `T-073-s4`/`s5`). `T-069-s3` is the one found
  from a CRITERION rather than from the pins, which is evidence the
  remedy is usable and not just correct. `T-043-s4` (a mechanism made
  unfalsifiable by a REDUNDANT second path) still needs its own answer —
  **and T-069's `is_some()` guard is a second instance of exactly that
  shape with the OPPOSITE verdict**: redundant under single mutation,
  load-bearing under a compound fault, kept.
- **Should a pin ever assert a PROXY for the thing it means?** Unchanged
  from the last checkpoint (T-073's include pin, its corpus pin).
- **What does `review: independent` mean — a different session, or a
  different model?** Unchanged: five done cards carry it and only three
  have different models on the two sides.
- **Does a card's `status: done` belong to the verifier or the
  integrator?** Five of the last six now answer "the integrator, at the
  checkpoint" (T-043, T-057, T-076, T-073, T-069), against T-058's
  executor. Two of those five are size S, where the executor was
  permitted to stamp it and declined. **Close it.**
- **Should `aliasedIdSlots` keep its `compare` parameter?** Endorsed by
  two sessions and filed by neither.
- **Should a restoration sha be recorded at all?** T-069 supplies the
  cleanest evidence yet on the OTHER side: the verifier recorded three
  shas WITH the commit they belong to, and all three reproduced exactly
  at the merged tree — which is what made "the drilled artifact is the
  merged artifact" a measurement instead of an argument. **Provisional
  answer, now four instances in: record the sha WITH its commit, and it
  earns its keep; record it bare, and it rots.**
- **Should `docs/CONVENTIONS.md` legend the token lint's exit codes?**
  A criterion of T-078, with T-080 restoring the distinction.
- T-057-s2 leaves an unpinned behaviour change in C-13 that moves
  against T-056's direction; it is T-072's third criterion.

**Answered by this merge, and left in place rather than edited out:**
*"Is a discriminator that rests on the CLI's honesty too speculative to
ship?"* — **no, when it can only WITHDRAW a claim.** The verifier built
the adversarial stream and confirmed a true diagnosis is lost on it. The
answer is that the loss is bounded by direction: a withdrawal degrades to
a relay with the evidence still on screen and the retry affordance
restored, while the false positive it replaces removes a button from a
user whose login is fine. Evidence quality has to be judged against what
a wrong answer COSTS, not on its own.

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
not a line. T-043's two drifted anchors were a fifth and sixth instance;
T-076 supplied a seventh of a different kind (`roadmap.ts:48`, wrong when
written rather than drifted); **T-069's notes supply an eighth**
(`agent_runner.rs:3218` for an attribute at `:3284`, itself `:3037` at
the base — the same line, cited from three different commits, wrong in
two of them).

**The poison shapes have ordinals.** **Shape five** — the assertion SET
has no cardinality or coverage floor (T-058-s2, absorbed by T-080).
**Shape six** — a body that reds under an expected-value poison while
killing no mutant another test does not already kill (T-057-s1, absorbed
by T-072). **Shape seven** — a mutant NO body kills, produced by deriving
the mutant set from the pins rather than the criteria — has now been
found independently by FOUR lanes, and `T-069-s3` is the first found by
the remedy rather than by accident. All three belong in T-078's drill
clause.

**Appended 2026-08-19, at T-069's checkpoint.** Suggested is
**nineteen**: the six `T-043-s*`, five `T-076-s*`, five `T-073-s*` and
three `T-069-s*`, all undispositioned. The **corpus figures quoted in
this section are as of `9b15f7d` and remain stale**: CONTROL was 521
there, 502 three checkpoints ago, 507 two ago, 514 at the last one and is
**517** here. The 20.6%-unpinned analysis that made T-080 survives the
change in denominator; the raw totals do not — and T-080 is a live lane
with ten paths committed, so the next checkpoint should be able to stop
saying that nothing pins these counts.
