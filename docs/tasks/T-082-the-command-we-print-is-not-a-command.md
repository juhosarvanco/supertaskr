---
id: T-082
title: The recovery command the app prints does not exist — `claude login` is parsed as a prompt
feature: F-03
milestone: 4
priority: 40
size: S
status: done
blocked_by: []
touches: [app-shell, app-agent, tools/e2e]
builder: claude-opus-5
verifier:
built_by: claude-opus-5 @fresh
verified_by:
review: self-verified
---

**T-029 exists to stop the app sending a user to `claude login` when
their login is fine. It never checked whether `claude login` is a thing
you can run.** It is not.

Verified against the shipped CLI 2.1.226 on 2026-08-19:

    $ claude --help
    Commands:
      auth      Manage authentication
      …
    $ claude auth --help
      login [options]   Sign in to your Anthropic account
      logout            Log out from your Anthropic account
      status [options]  Show authentication status

There is no `login` command. `claude [options] [command] [prompt]` parses
an unrecognised leading word as **the prompt** — `claude login --help`
prints the general help rather than erroring, which is the tell. So a
user whose credentials really have expired, following the instruction the
app itself renders, does not get a login flow. They get a session that
sends the word "login" to a model they cannot reach.

**That is a worse failure than a wrong error message**, and it is in the
one path a first-time user is most likely to hit: the app has correctly
diagnosed an expired login, has correctly decided to help, and hands over
a command that silently does something else.

THE STRING IS SHIPPED IN THE PRODUCT AND PINNED BY THREE TESTS —
`app/src/genesis/interview-model.ts:584` is the rendered value;
`app/test/interview-model.test.ts:725`,
`app/test/interview-resume-dom.test.tsx:214` and
`tools/e2e/tests/resume-fallback.spec.ts:68` all assert it exactly. The
pins are doing their job: they will go red, and that is the point.

**THE ONE DISTINCTION THIS CARD MUST NOT COLLAPSE.** Three of the
occurrences are not the app's advice — they are a *fixture* and its
commentary: `app/src-tauri/src/bin/fake_agent.rs:176` prints
`credentials expired, please run \`claude login\`` as a stand-in for the
CLI's own stderr, and `runner.rs:116` / `agent_runner.rs:1372,1677` /
`agent-store.ts:38` describe the harm in prose. **If the real CLI's own
expired-credentials message says `claude login`, the fixture is a
faithful transcription and MUST NOT be "corrected"** — a fixture that
prints something the CLI never printed is worse than a wrong command,
because it makes the suite lie about the world. The app's *own* advice is
a separate thing and is what this card fixes.

Provenance for the correction is `docs/research/real-cli-observation.md`;
the auth-message provenance is the earlier 2.1.226 smoke recorded in
STATE.md.

## Acceptance criteria

- THE command the app renders as the recovery action for an expired login
  SHALL be a command the installed CLI actually accepts, and the card
  SHALL record how that was checked rather than asserting it.
- **THE FIXTURE'S TEXT SHALL BE DECIDED ON PROVENANCE, NOT ON
  CONSISTENCY.** The executor SHALL determine whether
  `fake_agent.rs:176`'s message is transcribed from a real CLI stderr or
  was composed, and SHALL state which. IF transcribed THEN it stays
  verbatim and the divergence from the app's advice SHALL be commented at
  the fixture with the reason. IF composed THEN it SHALL be marked as
  composed, because an untranscribed fixture standing in for real CLI
  output is exactly the defect T-029-s5 was filed about.
- THE three assertions that pin the old string SHALL be **corrected, never
  loosened** — no `toContain`, no regex that would pass for both the old
  and new value. A pin that survives the change unchanged is a pin that
  was not testing this.
- **THE ADVICE SHALL NOT BE ASSEMBLED FROM WHAT THE CLI SAID.** If the app
  relays a command out of the CLI's own error text it inherits whatever
  that text contains, including this defect. The rendered action SHALL be
  the app's own, and a pin SHALL prove it by driving a fixture whose
  stderr names a different command entirely and requiring the app's value
  to be unmoved.
- IF the app renders any other executable command anywhere in a failure
  path THEN this card SHALL enumerate them and state, for each, whether it
  was checked against the CLI — the class of defect is "a command nobody
  ran", and fixing one instance while leaving its siblings unexamined
  leaves the class open.
- THE prose occurrences in `runner.rs`, `agent_runner.rs` and
  `agent-store.ts` SHALL be updated only where they describe what the app
  now does; where they quote the historical harm they SHALL stay, since
  the harm was real and the record of it is the reason the guard exists.
- THE ROADMAP's two occurrences (`:337`, `:424`) SHALL be reconciled — the
  roadmap promises this exact behaviour and currently promises the broken
  form.

Verification: headless — `npm test` and `npm run build` from app/,
`cargo test` from app/src-tauri, `npx playwright test` for the e2e pin,
the boot gate if `app/src-tauri/**` moves. Each corrected assertion
poisoned back to the old value and shown RED. **No real model call** —
the CLI's command surface is read from `--help`, which spawns no turn.
@human: none; the correct command is checkable.

## Implementation notes

Built by the executor at `a114f45` on branch `task/T-082-auth-command`,
cut from `ddcc8bb`. Size S: no verifier, no separate integrator, so the
adversarial pass below is the executor's own on its own work. NOT merged
— the branch and its worktree are left in place.

**THE LANE'S BASE WAS VERIFIED, NOT TAKEN.** The dispatch brief said
"the three commits after `cb3aa31` are docs-only". There are **two**
commits, not three (`9c62d04` and `ddcc8bb`), carrying **three paths** —
`docs/CONVENTIONS.md`, `docs/STATE.md` and
`docs/tasks/T-083-….md`. `git diff --name-only cb3aa31..ddcc8bb` (TWO
dots) is 3 paths and `grep -v '^docs/'` over it is empty, so the
substance of the claim holds and the lane is safe to cut from the tip.

## What changed, and the one place it changed

The app's advice moves in exactly ONE place: `failureAction`'s
`authFailed` arm in `app/src/genesis/interview-model.ts`, from
`claude login` to **`claude auth login`**. Everything else is a pin, a
mirror, or prose.

| file | what |
|---|---|
| `app/src/genesis/interview-model.ts` | THE VALUE. `failureAction` → `claude auth login`, with the check recorded at the literal. |
| `app/test/interview-model.test.ts` | pin CORRECTED (exact equality) + one new T-082 body. |
| `app/test/interview-resume-dom.test.tsx` | pin CORRECTED (exact equality) + one new T-082 body in its own describe. |
| `tools/e2e/tests/resume-fallback.spec.ts` | pin CORRECTED (`toHaveText` is a full-text match). |
| `app/src/lib/agent-store.ts` | the TS mirror's doc comment — describes what the app now does. |
| `app/src-tauri/src/agent/runner.rs` | `AuthFailed`'s doc comment — same, plus why the runner produces no command at all. |
| `app/src-tauri/src/bin/fake_agent.rs` | the `nonzero` stderr line MARKED COMPOSED; text unchanged. |
| `docs/ROADMAP.md` | the live promise corrected; the historical sentence kept and labelled. |
| `docs/architecture/graph.json` | regenerated — GRAPH REGEN fired. |

**HOW THE COMMAND WAS CHECKED (criterion 1), rather than asserted.**
Three reads of the installed CLI 2.1.226's own command surface, each of
which spawns no turn and calls no model:

- `claude --help` → `Commands:` lists `auth  Manage authentication`.
  There is **no bare `login`**, and the grammar line is
  `Usage: claude [options] [command] [prompt]`.
- `claude auth --help` → `login [options]` / `logout` / `status
  [options]`.
- `claude auth login --help` → that subcommand's own usage, with
  `--claudeai`, `--console`, `--email <email>` and `--sso`.

All three exited 0. `claude --version` reports `2.1.226 (Claude Code)` at
`/opt/homebrew/bin/claude`, which is the binary
`docs/research/real-cli-observation.md` names.

## THE FIXTURE'S PROVENANCE: COMPOSED, not transcribed

Criterion 2's ruling, on evidence rather than on consistency.
`app/src-tauri/src/bin/fake_agent.rs`'s `nonzero` scenario prints
`fake-agent: credentials expired, please run [claude login]` on stderr.
**It is COMPOSED — the fixture's own voice — and it is now marked so in
place.** The text is left verbatim; nothing was "corrected".

Four independent facts, each derived here:

1. **It carries the binary's own prefix.** All four `eprintln!` calls in
   the file open `fake-agent: `, and the other three are unambiguously
   the fixture's own diagnostics (`unknown scenario`, `no current_exe`,
   `could not fork a grandchild`).
2. **It predates the observation it would have had to transcribe.**
   `git log -S` puts the line at `74a0274`, 2026-08-16 11:41:37 — the
   T-025 scaffold. The 2.1.226 auth smoke was run and recorded at
   `1cb08ba`, 11:59:30, **eighteen minutes later**, and that is the
   commit that added the `auth-error` scenario.
3. **THE REAL CLI WRITES NOTHING TO STDERR WHEN IT CANNOT
   AUTHENTICATE**, so there is no real stderr line here to transcribe.
   `1cb08ba`'s own message records the smoke reporting
   `exitNonZero { code: 1, stderrTail: "" }` — *"An empty explanation"* —
   and the `auth-error` comment two lines below the fixture says the CLI
   *"writes NOTHING to stderr"*.
4. **The words the CLI really does emit name no command at all.** They
   ride the `result` line: *"Failed to authenticate. API Error: 401 OAuth
   access token has been revoked."* The scenario that transcribes them is
   the SEPARATE `auth-error`, and the `nonzero` scenario is a stand-in
   for "any nonzero exit with something on stderr" — it types as
   `exitNonZero`, not `authFailed`, and renders no command.

**THE BRIEF WAS RIGHT THAT TODAY'S OBSERVATION CANNOT SETTLE THIS, AND IT
DID NOT HAVE TO.** `docs/research/real-cli-observation.md` captured a
SUCCESSFUL turn — exit 0, `is_error: false`, and *"zero bytes on stderr —
consistent with the earlier smoke: this CLI reports in band"* — so it
carries no expired-credentials stderr. It corroborates fact 3 and settles
nothing on its own. What settles it is the EARLIER smoke, whose captured
`stderrTail: ""` is recorded in `1cb08ba`'s commit message, plus the
eighteen-minute ordering in fact 2, which no later observation can
change.

## The pins: corrected, never loosened

All three stay EXACT-VALUE matchers, which is what makes the inverse
check below meaningful.

- `interview-model.test.ts` — `expect(action.command).toBe("claude auth
  login")`.
- `interview-resume-dom.test.tsx` — `expect(q("[data-testid=
  interview-failure-command]")?.textContent).toBe("claude auth login")`.
- `resume-fallback.spec.ts` — `toHaveText("claude auth login")`.
  Playwright's `toHaveText` with a STRING is a full-text match, not a
  substring one, so this reds for the old value; the comment says so at
  the assertion.

No `toContain` and no regex was introduced anywhere in the three.

## Criterion 4: the advice is the app's own

`failureAction` is a pure switch on `error.kind` and reads no error text
— that was already true and is now PINNED, in two places, because a
property nothing holds is not a property. Both new bodies drive an auth
failure whose own words name a different command entirely
(`frobnicate --relogin`) and require the app's value to be unmoved:

- **at the model** — `interview-model.test.ts`, "keeps its own recovery
  command when the CLI's words name a different one".
- **at the render** — `interview-resume-dom.test.tsx`, "renders its own
  command while the CLI's words name a different one".

**EACH HAS A POSITIVE CONTROL, per CONVENTIONS' rule that a negative
assertion needs one.** Without it, "the command did not move" is
satisfied equally by *insulated* and by *the message never arrived*. The
control asserts the hostile text DID reach the app and IS rendered — as
`failureDetail` at the model, as the `interview-failure-detail` element
at the render. Poison round 3 below proves the control is not vacuous.

## Criterion 5: every other executable command the app renders in a failure path

Enumerated by three sweeps of `app/src`, not by memory: every `<code>`
element (**one** site, the failure command); every literal containing a
command name (`claude|npm|npx|cargo|git|brew|chmod|sudo`); and every
user-facing `run`/`install`/`terminal` string. **No second executable
command is rendered anywhere.** The full list of near-misses, each with
its verdict:

| # | what the app renders | where | checked? |
|---|---|---|---|
| 1 | `claude auth login` | `failureAction` → `interview-failure-command` | **YES** — the subject of this card, read off 2.1.226's `--help` surface. |
| 2 | `login shell [command -v claude]` and `PATH lookup for [claude]` | `runner.rs`'s `ResolveError::NotFound { probed }` → `interview-cli-probed` | **YES, and by construction.** These are DESCRIPTIONS of what the app already ran, not advice — the resolver really does spawn `$SHELL -l -c` with `command -v`, a POSIX builtin. Nothing tells the user to type them. |
| 3 | the assembled kickoff prompt | `assemble_kickoff` / `assemble_resume_kickoff` → `interview-kickoff` | **N/A — not a command.** It is natural-language text for an agent ("You are the planner. KIT ROOT: …"). The surrounding sentence, "Run this in any agent CLI in your terminal", deliberately names no invocation. |
| 4 | "Run index" | `MapView.tsx` → `map-run-index` | **N/A — an in-app button**, not a command the user types; it invokes IPC. |
| 5 | every other typed outcome (`busy`, `noProject`, `noSession`, `alreadyPlanned`, `resumeAvailable`, `sessionIdRejected`, `nothingToResume`, `staleProject`, `unsupportedVersion`, `error`) | `noticeSentence` | **YES — none renders a command.** Checked one arm at a time against the switch. |
| 6 | every `Error { message }` producer in `agent/mod.rs` and `lib.rs` | relayed as `outcome.message` | **YES — none carries a command.** They are "could not write the method kit: {err}" shapes. |
| 7 | `failureDetail` — the CLI's own words | `interview-failure-detail` | **Deliberately unchecked, and that is the point.** It is EVIDENCE, never advice; criterion 4's pins exist precisely so a command inside it can never become the app's. |

Row 5 produced a real finding: **`unsupportedVersion` names a fixable
problem and offers no command at all** — filed as `T-082-s4` rather than
fixed, because it is a different renderer (`OutcomeNotice`, which has no
`command` slot) and choosing between `claude install` / `claude update` /
`brew upgrade` is a product decision this fence does not cover.

## Criterion 6: prose, split by what it describes

**THE CARD'S OWN LIST WAS ONE SHORT.** It names `runner.rs:116`,
`agent_runner.rs:1372,1677` and `agent-store.ts:38` — four sites. There
are **five**: `runner.rs` carries a second occurrence inside
`classify_line`'s T-069 comment (line 1973 before this diff, 1983 after).

| site | describes | done |
|---|---|---|
| `runner.rs` `AuthFailed` doc comment | what the app NOW does | UPDATED to `claude auth login`, plus a note that the runner produces neither string — it carries a status and the CLI's message, and the action is the app's. |
| `agent-store.ts` `authFailed` doc comment | what the app NOW does | UPDATED. |
| `runner.rs` T-069 comment (the un-listed fifth) | historical harm, pre-T-069 | KEPT VERBATIM. |
| `agent_runner.rs:1372` | historical harm, "the first build" | KEPT VERBATIM. |
| `agent_runner.rs:1677` | historical harm, pre-T-069 | KEPT VERBATIM. |

The three that stay are past-tense records of what the app printed at the
time. Rewriting them to `claude auth login` would make the history false:
the app never printed that then, and the harm those guards exist to
prevent is real.

## Criterion 7: ROADMAP

- **`:337`, the live promise** — now `claude auth login`, with two
  sentences naming the defect and how it was checked.
- **`:424`, the historical sentence** — `claude login` KEPT, with a
  parenthetical saying which it is: *the string the app printed at the
  time, and the one T-082 later found is not a command at all*. Changing
  it would falsify the record; leaving it bare would let it read as
  advice in a document that promises the real command four hundred lines
  up. **One drafted claim was measured and corrected before it shipped:**
  the first draft said the bad command "read `claude login` for three
  days". `git log -S` puts it at `6072325`, 2026-08-17 (T-029), so it is
  **two** days, and the sentence now names both dates instead of a
  duration.

## Gates — both fired, both derived rather than assumed

**Every range below is `ddcc8bb..HEAD`, TWO dots**, and the two spellings
were checked against each other rather than trusted: two-dot and
three-dot both return 9 paths and `diff` of the two lists is empty,
because `git merge-base ddcc8bb HEAD` IS `ddcc8bb` (`--is-ancestor` exits
0). That is T-083's mechanism confirmed on a BRANCH — the forms collapse
while the base is still an ancestor. **If main advances before this
lands, they will diverge and the integrator must use
`<main-before-the-merge>..HEAD`.**

**GRAPH REGEN — FIRES, 5 trigger paths** (`*.ts/*.tsx/*.js/*.jsx` outside
`docs/`): `app/src/genesis/interview-model.ts`, `app/src/lib/agent-store.ts`,
`app/test/interview-model.test.ts`,
`app/test/interview-resume-dom.test.tsx`,
`tools/e2e/tests/resume-fallback.spec.ts`.

**IT WAS RUN, NOT REASONED AWAY, AND IT WAS NOT A NO-OP.**
`index --check` first: **exit 1, a REAL red** — and distinguishable from
the false red CONVENTIONS warns about, because the second line prints
counts and a `~` diff rather than `committed: MISSING`. It named FOUR
files, not five: `tools/e2e/tests/resume-fallback.spec.ts` matches the
trigger and is `.nputerignore`d, so it cannot move the graph. **That is a
fourth worked example of the trigger being deliberately wider than the
walk**, after T-054's branch, T-058's merge and T-080's merge.
`NPUTER_UPDATE_GOLDEN=1 cargo test -p nputer-index --test self_graph --
--ignored` exit 0; `docs/architecture/graph.json` moved
`aba7c44b1c6a20d9d2c8093eb792371b9f88208b34472492f5f0f91b88653993` →
`7f1f90ce47b5958606e73331e03f10a2950193f572d9eddbdd27b419ed50c293`,
86 insertions / 86 deletions, **all of them `hash`, `loc` and symbol
`range` — 0 symbols and 0 edges move**, which is what a comment-and-literal
diff should do. `index --check` afterwards: **exit 0, CURRENT** (575619
bytes, 118 files, 995 symbols, 1518 edges — the same four figures the
last two checkpoints record). **The integrator must regen AGAIN at the
checkpoint**, because the checkpoint edits indexed fixture files; this
regen only keeps the branch from handing off a red gate.

**BOOT GATE — FIRES, 4 trigger paths**
(`app/src-tauri/**`, `app/src/**`, either manifest):
`app/src-tauri/src/agent/runner.rs`, `app/src-tauri/src/bin/fake_agent.rs`,
`app/src/genesis/interview-model.ts`, `app/src/lib/agent-store.ts`.
**`NPUTER_BOOT_PORT=18240 npm run boot:check` → exit 0**, both lines
detected: `[nputer] project folder: /Users/ujju/Projects/nputer-T-082`
and `[nputer] window "main" created`. The process tree stopped on
SIGTERM.

**PORT DISCIPLINE.** 1420 was read ONCE, read-only, with the one command
CONVENTIONS permits: `lsof -nP -iTCP:1420 -sTCP:LISTEN` → `node` pid
**82549**, `TCP [::1]:1420 (LISTEN)`, IPv6 only, exactly as STATE
records. **It was never bound, connected to or signalled.** Scratch ports
**18240** (boot check) and **18241** (E2E lane) were bind-probed free on
**both stacks** — `::1`, `127.0.0.1` and `0.0.0.0` — before use, and both
are away from the lane's 14520 default because this diff touches
`tools/e2e`.

## Suites — every exit code read from its own `$?`, never through a pipe

Baselines were taken in the worktree BEFORE any edit, so a pre-existing
red could not be mistaken for one of mine.

| suite | baseline @`ddcc8bb` | after | exit |
|---|---|---|---|
| app `npm run build` | 265 modules, `index-DjYVlJel.js` 501.37 kB, `index-CwYF5FQb.css` 43.95 kB | 265 modules, `index-DIZb3mB8.js` 501.37 kB, **same CSS hash** | `APP_BUILD_EXIT=0` |
| app `npm test` | 827/827 across 42 files | **829/829** across 42 files | `APP_TEST_EXIT=0` |
| parser `npx vitest run` | 263/263 across 12 files | 263/263 | `PARSER_EXIT=0` |
| parser `npx tsc --noEmit` | — | — | `PARSER_TSC_EXIT=0` |
| Rust `cargo test` | — | **343 passed / 0 failed / 3 ignored**, summed programmatically from **fifteen** `test result:` lines | `CARGO_TEST_EXIT=0` |
| E2E `npm test` | — | **91/91**, 1 worker, 0 retries, 0 skips | `E2E_EXIT=0` |
| E2E `npm run typecheck` | — | — | `E2E_TYPECHECK_EXIT=0` |
| `lint:tokens --selftest` | — | 49 TOKEN + 4 CONTROL samples, 71 walk-policy checks, 8 evidence-floor checks | `LINT_SELFTEST_EXIT=0` |
| `lint:tokens` | TOKEN 119 / CONTROL 542 | TOKEN 119 / CONTROL 542 | `LINT_TOKENS_EXIT=0` |
| `index --check` | — | CURRENT after the regen | `INDEX_CHECK_EXIT=0` |
| `boot:check` | — | both `[nputer]` lines | `BOOT_CHECK_EXIT=0` |

**The app suite's +2 is exactly the two bodies added** — no existing body
moved. **The E2E lane holds at 91** because a body was corrected, not
added. **The CSS content hash is unchanged**, which a zero-token diff
requires; only the JS hash moves.

**CONTROL CLOSES ARITHMETICALLY AT `ddcc8bb`**, from the tree rather than
from a checkpoint: `git ls-tree -r HEAD` gives **560** tracked, minus
**0** under a `SKIP_DIRS` segment, minus **18** with a
`CONTROL_BINARY_EXTENSIONS` suffix (`.icns .ico .png .woff2`) — both sets
read out of `token-scan.mjs` rather than remembered — = **542**, the
figure the lint prints. Neither corpus moves across this diff, which a
0-added / 0-deleted file list requires.

**BASELINE CAVEAT, STATED RATHER THAN HIDDEN.** The worktree carries no
`node_modules`, and `npm ci` is forbidden here. Each package's
`node_modules` was populated with PER-ENTRY symlinks into the main
checkout (not a directory symlink), so vite's `node_modules/.vite` cache
lands in the worktree and cannot disturb the human's running dev server;
`lib/parser/dist` likewise. Nothing was installed anywhere. The baseline
app suite reproduced main exactly (827/827, byte-identical bundle
hashes), which is the check that the arrangement is faithful.

## Poison drill — four rounds, all three limbs, every mutation read back

Every mutation was **ONE-SIDED** — the PRODUCER only, never a literal an
assertion shares — **READ BACK AS TEXT** with `git diff` before any suite
ran, and **RESTORED WITH PROOF**: `git show HEAD:<path> | shasum -a 256`
against the working file, plus an empty `git status --porcelain`. Four
for four.

**ROUND 1 — the producer reverts to the OLD value.** This is also the
INVERSE check: no corrected pin may survive `claude login`.
`interview-model.ts`'s `command:` → `"claude login"`.
**RED, four bodies**, each reading `expected 'claude login' to be 'claude
auth login'`, plus the E2E pin at
`Expected: "claude auth login" / Received: "claude login"`
(`P1_APP_EXIT=1`, `P1_E2E_EXIT=1`). **All three corrected pins red
against the old value**, so none of them was a pin that survives the
change.

**ROUND 2 — the producer ASSEMBLES the command from the CLI's message**,
which is the exact defect criterion 4 forbids: `command:` becomes a
regex pulling the first backticked token out of `error.message`.
**RED exactly twice — only the two NEW bodies** — `expected 'frobnicate
--relogin' to be 'claude auth login'`, with 75 of 77 passing and the E2E
lane fully **GREEN** at `P2_E2E_EXIT=0`. **This is the drill's second
question answered with a number** (CONVENTIONS SHAPE SIX: does any other
test already drive this call?): the three pre-existing pins drive the
real 401 message, which carries no backticked command, so they cannot see
this mutant at all. The new bodies are not duplicates.

**ROUND 3 — the positive control is starved.** `failureDetail`'s
`authFailed` arm → `""`. **RED**, and the two new bodies red precisely on
their control lines (`expect(failureDetail(error)).toContain("frobnicate
--relogin")` and the `interview-failure-detail` element). So the control
is live: if the CLI's words stopped reaching the app, the suite says so
instead of quietly reporting the command "unmoved".

**ROUND 4 — the leak moves to the COMPONENT.** `interview-turns.tsx`
renders the backticked token from `error.message` in the command element
when present, else `action.command`. **RED exactly ONCE — only the DOM
body** — 76 of 77 passing, with the model-level body and all three
original pins green. A component that relays the CLI's command is
invisible to a pure-function pin, and this proves the render-level body
kills a mutant the model-level one cannot.

**THE NINTH SHAPE WAS CHECKED FOR AND DOES NOT APPLY.** A migration
between families that a cardinality floor cannot see needs a COUNT to
hide behind; all three corrected pins and both new command assertions are
EXACT-VALUE equalities with no count anywhere, and rounds 1–4 red by
NAME. The nearest thing to a count in this diff is the app suite's
827→829, and it is derived from the two bodies rather than asserted.

**NO BODY WAS FOUND THAT CANNOT BE POISONED.**

## Security sweep — unmoved, every figure re-derived at `ddcc8bb..HEAD`

The lane's diff contains **no lockfile, no `Cargo.toml`, no
`package.json`, no `tauri.conf.json`, no capability file and no
`acl_pin.rs`** — 0 paths match any of them, so `cargo audit`'s baseline
(472 locked crates, 0 vulnerabilities / 17 allowed warnings) cannot have
moved and was not re-run.

- **`acl_pin.rs`: 0-file diff**, sha256
  `8d24cbad706d9e6f09eca6888cf8a21d264039cac6153271093ea4847b60b00e`,
  **92 grants** counted four independent ways over the symbol-anchored
  body: 92 quote-bearing lines, 92 quoted strings in total, 92 UNIQUE
  quoted strings, 92 lines matching the strict entry shape. No byte count
  is quoted. **THE SPAN FIGURE IN THE BRIEF IS WRONG AND IS FILED AS
  `T-082-s1`** — see below.
- **`ENV_ALLOWLIST`: 423 bytes / 16 entries**, extracted by anchoring on
  `pub const ENV_ALLOWLIST` and its closing `];`, never a byte offset.
  Unmoved.
- **Exactly THREE `#[ignore]` ATTRIBUTES**, from an anchored
  `git grep -n -E '^\s*#\[ignore'` at the repo ROOT, cited by symbol:
  `perf_cold_and_incremental_within_ceilings`,
  `self_graph_is_current` and
  `real_cli_smoke_records_the_stream_schema`. Independently confirmed by
  `cargo test` reporting `3 ignored`. **The raw-hit tally in the brief is
  wrong repo-wide and is filed as `T-082-s2`.**
- **IPC surface unchanged at THIRTEEN**, derived from both ends and
  INTERSECTED: 13 `#[tauri::command]` attributes, 13 function names
  following them, 13 names in `generate_handler!` with comments stripped,
  and the intersection is 13 with **no orphan on either side**.
- **NO REAL MODEL CALL FROM ANY SUITE.** The one `#[ignore]`d smoke
  never ran; `cargo test` reports `3 ignored`. **But see `T-082-s3` —
  one turn was started outside the suites, by accident, and it is
  recorded rather than buried.**

## Findings filed

- **`T-082-s1`** — the security sweep's "128-line span" for
  `EXPECTED_GRANTS` is anchored on a `//!` doc comment that MENTIONS the
  symbol, not on its declaration. From the declaration the span is 92
  lines, all 92 entries, zero comment or blank. The previous checkpoint
  corrected a right number to a wrong one.
- **`T-082-s2`** — "11 raw `#[ignore` hits, 8 prose" is true only under
  an unstated `-- '*.rs'` pathspec; from the repo root with no pathspec
  it is 62 and 59. The attribute count is the invariant; the tally is a
  line number by another name.
- **`T-082-s3`** — **a backtick inside a shell `echo` label executed
  `claude login` and started a real turn**, during the very card that
  documents what that does. The mechanism, the evidence and the one-line
  fix are in the card. Recorded rather than buried, on the precedent
  STATE set for the 1420 bind probe.
- **`T-082-s4`** — `unsupportedVersion` names a fixable problem and
  offers no command at all, in a renderer that has no slot for one.

## What the human's running app saw

`app/src-tauri/target/` in this worktree is the worktree's OWN, so
nothing relinked the human's `app/src-tauri/target/debug/nputer`. The
boot check spawned its own `tauri dev` on 18240 and stopped its process
tree; the E2E lane ran its own vite on 18241. The human's vite (pid
82549, `[::1]:1420`) was read once with `lsof` and is unchanged. **No
`pkill` was used at any point**, and the two `nputer-T-060` orphans
(`52504`/`52505`) were left alone. Their docs watcher will see T-082 flip
to `done`, four new `T-082-s*` cards, and the ROADMAP edit.

## For the integrator

1. **Regenerate the graph again at the checkpoint.** This branch's
   `graph.json` is current for `ddcc8bb..HEAD`, but the checkpoint edits
   indexed fixture files, and the rule is "with the CHECKPOINT".
2. **Re-derive both gate triggers at `<main-before-the-merge>..HEAD`.**
   The two dot-forms collapse today only because `ddcc8bb` is still an
   ancestor; if main advances they diverge by main's whole advance.
3. The three-fixture rule does NOT fire — this diff contains no
   `docs/architecture/components/` path.
4. `docs/STATE.md`'s bullet *"`claude login` IS NOT A COMMAND, and the
   app ships it"* becomes false at this merge and is the checkpoint's to
   rewrite; this fence could not reach it.


## Verdicts
