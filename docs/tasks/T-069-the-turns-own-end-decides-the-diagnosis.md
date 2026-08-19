---
id: T-069
title: The turn's own end decides the diagnosis, and everything parsed gets relayed
feature: F-03
milestone: 3
priority: 12
size: S
status: verifying
blocked_by: []
touches: [app-agent]
builder: claude-opus-5 @fresh
verifier:
built_by: claude-opus-5 @fresh
verified_by:
review:
---

Absorbs: T-029-s8, T-029-s9 (fourth triage, 2026-08-19). The suggestion
files are removed in the same commit as this card.

ONE CLOSURE, TWO REMAINING EDGES. T-029's second executor bound both
classifications to the turn's TERMINAL state rather than to anything
merely seen: the `Result` arm of `run_turn` assigns
`auth_status = api_error_status;` unguarded, and the classification
closure guards `ToolDenied` with `result_is_error &&
!permission_denials.is_empty()`. Both hold, both were re-verified, both
are correct, and T-029-s6/s7 are discharged on that card. What is left
is what the DECLINED diagnosis leaves behind, and what the narrowing
cost that nobody wrote down.

THE DECLINED DIAGNOSIS RELAYS NOTHING. The `result` line's text reaches
the diagnostic ring only under `if is_error`, so a turn whose terminal
line says `is_error: false` contributes no text to `stderr_tail`. With
an empty stderr — which the 2.1.226 auth smoke measured as the real
CLI's behaviour — the tail is the empty string, `failureDetail` returns
null for an empty trimmed detail, and `FailureBlock` renders no detail
span. Measured through the real `run_turn`: both `denied-then-end-turn`
and a fatal denial carrying `is_error: false` produce
`ExitNonZero { code: Some(1), stderr_tail: "" }`, so the screen reads
exactly "the planner exited with code 1" and nothing else. **The
information was parsed**: `permission_denials` was read into a bounded,
control-stripped, typed `Vec<String>` and then dropped on the floor.
That is this family's own spine — a fact known and typed inside the
process, delivered nowhere a user can see it — surviving in the corner
of the task that closed it everywhere else.

THE TRADE WAS RIGHT AND IS UNDOCUMENTED. The fix's comment says the
terminal line is the turn's own verdict. It does not say the
consequence: an auth failure that names its status ONLY in the
diagnostic is no longer typed. Measured one line apart at `307319b`
(pre-fix, `AuthFailed`) and `4540821` (post-fix, `ExitNonZero` with the
full auth sentence in the tail). This does not touch the observed CLI —
the transcribed `auth-error` scenario carries `api_error_status` on its
own `result` line and classifies `AuthFailed` at both refs — so the
narrowing bites a shape 2.1.226 does not produce, and it degrades in the
safe direction. But a future CLI version that moves the status is a
silent loss of the flagship affordance with no test watching for it.

## Acceptance criteria
- WHEN a turn's `result` line carries `permission_denials` but the
  classifier DECLINES to claim them, the parsed denial names SHALL reach
  the diagnostic ring anyway, so `ExitNonZero`'s tail names them. The
  `api_retry` note is the precedent: the ring already carries
  diagnostics the classifier does not act on. RELAYING is not
  DIAGNOSING — the distinction the fix's own comment draws — and the
  comment SHALL say so beside the new push.
- THE comment beside `auth_status = api_error_status;` SHALL disclose
  the false NEGATIVE the assignment introduced, and a pin SHALL assert
  the transcribed 2.1.226 shape still carries `api_error_status` on its
  own `result` line, so a CLI that moves the status REDS instead of
  silently dropping the typed auth failure.
- THE residual false POSITIVE — a recovered 401 with NO result line at
  all, which still classifies `AuthFailed` — SHALL be closed using
  evidence the stream already carries and NOT vocabulary T-029-s5
  records as unverified. Model text emitted AFTER the last
  status-bearing diagnostic is direct evidence the CLI got past the
  error, and the runner already tracks relayed text. IF the
  discriminator is judged too speculative THEN it SHALL be declined IN
  WRITING, naming the `auth-403-no-result` counter-pin as the reason —
  that stream has no delta and must keep classifying `AuthFailed`.
- REGRESSION pins SHALL DISCRIMINATE, not merely pass: the control row
  (a stream identical to the failing one minus the 401 diagnostic) and
  an `api_retry` 401 followed by a text delta and no result line.

Verification: headless, driving the real `run_turn` through
`RunnerConfig::binary_override` with a scripted CLI. No real CLI, no
model, no network. Rust-only diff — no TypeScript, no manifest, no
capability, no IPC surface.

## Implementation notes

Built by `claude-opus-5 @fresh` in `/Users/ujju/Projects/nputer-T-069`,
branch `task/T-069-relay`, based on **`76cf034`**. Rust only: three files
under `app/src-tauri/**`, plus this card and one suggestion. No
TypeScript, no manifest, no capability, no IPC surface, no dependency, no
lockfile. No real CLI, no model, no network — every stream is scripted
through `RunnerConfig::binary_override` and the `fake_agent` bin.

### Reproduced FIRST, before a line of runner code moved

The fixtures and pins were written and run against the UNCHANGED runner.
All three card claims reproduced verbatim:

| stream | pre-fix, measured through the real `run_turn` |
|---|---|
| `denied-then-end-turn` | `ExitNonZero { code: Some(1), stderr_tail: "" }` |
| `denied-fatal-not-flagged` (a fatal `is_error:false` denial) | `ExitNonZero { code: Some(1), stderr_tail: "" }` |
| `retry-401-then-no-result` | `AuthFailed { status: Some(401), message: "the agent CLI could not authenticate" }` |

Both tails EMPTY, exactly as the card says, and `failureDetail`
(`app/src/genesis/interview-model.ts:620`, read only) returns null for an
empty trimmed detail, so `FailureBlock`
(`app/src/genesis/interview-turns.tsx:284`) renders no detail span. The
screen read "the planner exited with code 1" and nothing else.

### 1 — THE RELAY (`runner.rs:1806-1839`)

The parsed denial names are pushed into the diagnostic ring inside the
`Result` arm, before `permission_denials` is moved, as
`permission_denials: <names>` + newline. Bounded and control-stripped by
`denial_names` already (16 x 128 bytes), then sanitized again with the
whole tail at classification. The comment beside the push says why —
**RELAYING IS NOT DIAGNOSING** — and names the `api_retry` precedent
directly below it: the ring already carries diagnostics the classifier
does not act on, because it is a DIAGNOSTIC ring and not a claim.

Pushed UNCONDITIONALLY rather than only when the classifier declines.
`ToolDenied` carries no `stderr_tail`, so a claimed denial never renders
the note; gating the push on the classification would put a
classification decision inside the parse loop, which is the coupling this
change exists to break.

### 2 — THE DISCLOSURE (`runner.rs:1772-1796`, on `runner.rs:1797`)

Twenty-five lines beside `auth_status = api_error_status;`, on the
assignment itself. They keep T-029-s6's reasoning and add what it cost:
an auth failure naming its status ONLY in a diagnostic, over a `result`
line carrying none, is CLEARED and stops being typed. The trade costs
2.1.226 nothing for exactly one reason — the transcribed shape carries
`api_error_status` on its own `result` line — and the comment says that
is a fact about the CLI, which moves.

The pin is `auth-error-result-only`: the transcribed stream MINUS its
`api_retry` diagnostic, one `bool` apart through the same emitter
(`fake_agent.rs`, `auth_error`), so the terminal line is the only carrier
of the status left.
`the_transcribed_auth_shape_carries_its_status_on_its_own_result_line`
drives it.

### 3 — THE RULING: the residual false positive is CLOSED, not declined

**Built.** `text_after_auth_status` (`runner.rs:1635`) is set on a
`TextDelta` while an auth status is live, cleared wherever a status is
WRITTEN — the `Diagnostic` arm and the `Result` arm — and the auth
classification arm now reads
`matches!(auth_status, Some(401) | Some(403)) && !text_after_auth_status`
(`runner.rs:1991`).

**Why built rather than declined.** Four reasons, in order of weight.

1. **The asymmetry is already ratified on this card's own parent.**
   T-029's verifier recorded that "losing a diagnosis to a blob is
   strictly better than the false positive it replaced, which took the
   retry away from a user whose login was fine." That is exactly this
   trade. When the discriminator is WRONG the turn degrades to
   `ExitNonZero` with the status still legible in the tail and Try again
   restored; when it is absent, a crashed turn behind a recovered 401
   loses Try again altogether and is sent to fix a login that is fine.
   The harm it removes is unrecoverable inside the app; the harm it can
   cause is one wasted retry.
2. **It withdraws a claim, it never makes one.** Every arm T-029 built
   asserts a cause and therefore needs strong evidence. This suppresses
   an assertion, and evidence against a claim may be weaker than
   evidence for it. That is why it is allowed to rest on a delta while
   the arms above rest on terminal state.
3. **It touches no unverified vocabulary.** T-029-s5's objection is
   specifically about the `terminal_reason` SET a real denial produces.
   A text delta is not vocabulary — it is the stream's own content, on
   the path the whole product already relays.
4. **The counter-pin holds by construction, not by tuning.**
   `auth-403-no-result` streams NO delta, so the guard cannot reach it;
   `a_diagnostic_auth_failure_with_no_result_line_at_all_is_still_authfailed`
   is untouched and still reds under the over-broad fix (sweep round R5).

**The honest limit, stated rather than left to a verifier.** The
discriminator assumes a text delta is the MODEL speaking. The CLI
demonstrably writes its own prose into a nominally-model field — the
transcribed auth failure's `result` text is the CLI's sentence, not the
planner's — so a future CLI that streamed its error prose as a delta and
then died without a `result` line would lose its typed `AuthFailed`. No
observed stream does this (the transcribed failure writes a `result`
line, and `auth-403-no-result` streams nothing), and the degradation is
the safe one. That risk, not the counter-pin, is the real argument for
declining, and it was weighed against reasons 1-4 above and judged
lighter.

### The pins, and what each one alone can kill

Six new bodies, one changed body, six new fixture scenarios through
three shared emitters (`auth_error`, `no_result_after`,
`emit_api_retry_401`) so no scenario is a second transcription of its
neighbour.

| body | scenario | unique mutant (reds it and nothing else) |
|---|---|---|
| `a_denial_the_planner_routed_around_…` (CHANGED) | `denied-then-end-turn` | with the row below, the relay push (R1) |
| `a_fatal_denial_the_cli_did_not_flag_as_an_error_still_names_the_tool` | `denied-fatal-not-flagged` | also a TRIPWIRE: widening the guard to `terminal_reason == "refusal"` reds here |
| `the_transcribed_auth_shape_carries_its_status_on_its_own_result_line` | `auth-error-result-only` | the terminal line may only CONFIRM a status, never introduce one (R9) |
| `an_auth_failure_that_streamed_text_before_it_failed_is_still_typed` | `auth-error-after-text` | the `Result`-arm reset (R3) |
| `a_second_auth_retry_behind_the_recovered_one_is_still_an_auth_failure` | `retry-401-text-then-401-no-result` | the `Diagnostic`-arm reset (R4) |
| `a_recovered_auth_retry_followed_by_model_text_and_no_result_line_…` | `retry-401-then-no-result` | the discriminator guard (R2) |
| `the_same_no_result_stream_without_the_retry_line_has_nothing_to_relay` | `no-result-no-retry` (CONTROL) | the control's own `with_retry` flipped ON (R6) |

**The control keeps a falsifying body, unlike T-029's.** T-029 recorded
that flipping its control's `with_retry` to `true` left it green, because
making the two streams indistinguishable IS that fix. This control
asserts the tail is EMPTY rather than that the classification matches, so
the same flip reds it (R6). That assertion is the discriminator: the 401
row asserts the tail NAMES the status, the control asserts there is no
status to name.

### TWO MECHANISMS HAD NO FALSIFYING BODY, found by drilling rather than reading

Both are T-043-s4's shape — a mechanism no body can distinguish the
presence of from the absence — and both were found by running the sweep
against code that was already green at 64/64.

- **The `Result`-arm reset.** It is what makes the turn's own verdict
  outrank the text before it. Deleting it changed nothing, because no
  fixture put a delta between an auth diagnostic and an auth `result`
  line. `auth-error-after-text` is now that stream, and R3 reds only
  that body.
- **The `Diagnostic`-arm reset.** It is what makes the rule "text after
  the LAST status-bearing line" rather than "after any status ever
  seen". Deleting it changed nothing either.
  `retry-401-text-then-401-no-result` is now that stream — recover one
  401 of a budget of ten, answer, hit another and die — and R4 reds only
  that body. Without it, T-069 would have closed a false positive by
  opening a false negative on the same family.

**A third mechanism is redundant and is KEPT deliberately, disclosed
here rather than found later.** The `if auth_status.is_some()` guard on
the `TextDelta` arm cannot change behaviour: `auth_status` is written in
exactly the two places that also clear the flag, so any delta before a
status is wiped by that status anyway. It is kept because it is what
makes the variable's NAME true at all times rather than only at the point
of use, and removing it would make the flag depend on both resets being
complete forever. It has no falsifying body and no test claims it.

### The poison sweep — 12 rounds, run INLINE, no scratch script

Producer rounds mutate the shipped source; the two passes mutate
assertion VALUES one-sidedly in the test file (never a literal both sides
read — the producer literals live in `fake_agent.rs`, the expected values
in `agent_runner.rs`). Every mutation was re-read from the file after
applying it, not trusted to a substitution count.

| round | mutation | red |
|---|---|---|
| R1 | the denial relay push dropped | the two relay rows — **2** |
| R2 | `&& !text_after_auth_status` dropped (the ruling reverted) | the no-result row — **1** |
| R3 | the `Result`-arm reset deleted | `…streamed_text_before_it_failed…` — **1** |
| R4 | the `Diagnostic`-arm reset deleted | `a_second_auth_retry_behind…` — **1** |
| R5 | the OVER-BROAD fix: `result_is_error &&` added to the auth arm | `auth-403-no-result` **and** the second-retry row — **2** |
| R6 | FIXTURE: the control's `with_retry` flipped ON | the control — **1** |
| R7 | FIXTURE: `api_error_status` moved off the `result` line | **3** — see "did not reproduce" |
| R8 | `auth_status = api_error_status;` deleted outright | **4** (it also restores T-029's latch) |
| R9 | the terminal line may only CONFIRM: `auth_status.and(api_error_status)` | `the_transcribed_auth_shape…` — **1** |
| R10 | `result_is_error` dropped from the `ToolDenied` guard (T-029's round C) | the two denial rows — **2**, both at the match arm |
| Pass A | the FIRST new assertion in each of the 7 bodies, value-poisoned | **7 of 7**, each at its own line |
| Pass B | the SECOND new assertion in each body that has one | **6 of 6**, each at its own line |

Pass A and Pass B were checked line by line: every panic fired at the
assertion that was poisoned (`1533`, `1578`, `1618`, `1658`, `1697`,
`1733`, `1764` and `1531`, `1577`, `1624`, `1659`, `1695`, `1763`), never
at a neighbour, so no body passed for a different reason than it claims.

One perl round mis-quoted and left the file unmutated; the run was
discarded as a no-op and re-done by line number rather than counted as a
green poison.

**Restoration proved by sha256 against `git show HEAD:<path>` after every
round**, never by a clean `git status`. All three files byte-identical at
the end: `runner.rs`
`8a334697b7e19a8c4533c8df97776e85f9d87119259c3613917c8ce63c147777`,
`fake_agent.rs`
`f1c270f2ce2a9d65ae548a217481c1990925651579fd81578dcd59b15169f2ad`,
`agent_runner.rs`
`4218d4476da325a29af235b101e16583136d0f667c5cb8e294d472c1e44079cf`.

### WHAT DID NOT REPRODUCE

**The card's "silent loss" premise is half wrong, measured at R7.** The
card says a CLI version that moves `api_error_status` off the `result`
line would be "a silent loss of the flagship affordance with no test
watching for it". Moving it in the fixture reds THREE bodies, and one of
them is the PRE-EXISTING
`an_in_band_auth_failure_is_typed_authfailed_not_a_relayed_exit_code` —
because the assignment CLEARS the diagnostic's status, so the
transcription move breaks the transcribed test too. A transcription move
was therefore never silent.

The new pin is still worth its line, and R9 is why: its unique mutant is
the RUNNER ceasing to read the status off the terminal line while the
diagnostic still carries it. Under R9 every other body stays green and
only this one reds. So the criterion's pin exists and discriminates — but
the danger it was written against is the runner side, not the CLI side.

### Suites, first-hand in this worktree, exits read with `echo $?`, nothing piped

No suite was piped through `tail`, `head` or `grep`; every command
redirected to a file and the exit code was read from the command itself.

- **lib/parser**: `tsc --noEmit` exit 0 · **234/234 across 12 files**,
  exit 0. Unchanged — this card touches no TS.
- **app**: `npm run build` exit 0, **265 modules transformed** ·
  **825/825 across 42 files**, exit 0. Unchanged.
- **app/src-tauri**, bare `cargo test`: **343 passed / 0 failed / 3
  ignored**, exit 0, summed from **fifteen** `test result:` lines. The
  baseline at `76cf034` is 337 + 3, and **343 − 337 = 6**, which is
  exactly the six new bodies; `agent_runner` moves **60 → 66** passed,
  1 ignored.
- **E2E**: **88 passed**, exit 0, scratch port **17311** bind-probed free
  first.
- **token lint**: selftest exit 0 · **TOKEN 118 / CONTROL 502**, exit 0.
  CONTROL is 502 because it counts TRACKED files and the suggestion below
  was still untracked when it ran; it becomes **503** once committed.
- **graph currency**: `index --check --root ../..` exit 0 — **CURRENT**,
  571733 bytes / 117 files / 989 symbols / 1508 edges. The graph was NOT
  regenerated and did not need to be: the indexer reads TS, this diff is
  Rust.
- **Exactly three `#[ignore]` ATTRIBUTES repo-wide**, unchanged
  (`crates/nputer-index/tests/perf.rs:53`,
  `crates/nputer-index/tests/self_graph.rs:58`,
  `tests/agent_runner.rs:3218`). The one env-gated real smoke did not
  run and no second was added.

### BOOT GATE — fired, ran, PASSED

The fence is `app/src-tauri/**`, so it fires. Run from `tools/e2e/` in a
cold worktree (parser `npm ci` + build, app `npm install`, e2e `npm ci`,
in ADR-011 order) on scratch port **14993**, bind-probed free with a
`net.createServer()` listen before spawning anything.

**`BOOT_EXIT=0`** — read from my own `echo $?`, not from the script's
output. Both `[nputer]` startup lines observed:

```
[boot-check] app: [nputer] project folder: /Users/ujju/Projects/nputer-T-069
[boot-check] app: [nputer] window "main" created
[boot-check] process tree stopped (exit=null signal=SIGTERM)
```

Port 14993 released afterwards (`lsof -nP -iTCP:14993` empty). **1420 was
never bound, contacted or signalled** — only read with `lsof`, which
showed the human's vite (pid 82549) holding it throughout.

### No process survived

Snapshotted `ps -eo pid,ppid,lstart,command` before any work and again
after the last suite. **The two lists are identical, pid for pid and
start-time for start-time**: `45155` (the human's app), `82342` / `82364`
/ `82549` / `82550` (the human's `tauri dev` + vite + esbuild on main),
`58407` (an unrelated ClawStudio binary), and `52504` / `52505` — the two
`nputer-T-060` orphans, ppid 1, start `Tue Aug 18 16:21:18`, **confirmed
present at the start, not mine, and not touched**. Every process this
session created — cargo builds, three `fake_agent` fixtures per suite
run, the boot check's `tauri dev` tree, playwright's chromium — is gone.
No `pkill` of any kind was issued, broad or narrow.

### For the verifier

- **The ruling is the thing to attack.** It is built, not declined. The
  argument is above in four numbered parts and its honest limit is
  stated; if the "a delta is the model speaking" assumption is judged
  too weak, the decline is a one-line revert (drop
  `&& !text_after_auth_status`) plus this card's reasoning inverted, and
  R2 shows exactly which body would then need to flip.
- **R5 and R9 are the two rounds worth re-running**, because they are the
  ones that prove the counter-pin and the new auth pin are not
  decorative.
- One suggestion filed: **T-069-s1**, the mirrored `status.last_error`
  assertions that cannot fail unless the match arm above them already
  has. It is not a T-069 defect and it predates this card in four
  bodies; T-069 wrote one more of them to match the file's shape rather
  than diverge from five neighbours.
- **The `denied-fatal-not-flagged` shape has an honest ceiling.** If a
  real CLI writes `is_error: false` on a genuinely fatal refusal, the
  user gets an exit code plus a named tool in the tail rather than a
  typed `ToolDenied`. Closing that needs the observation T-029-s5 is
  parked on; nothing here guesses at it.


## Verdicts
