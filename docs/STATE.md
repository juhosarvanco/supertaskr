# State

Updated: 2026-08-16 by integrator (T-047 merge), claude-opus-5 @fresh

## Just completed
T-047 (what the runner trusts from disk, M, app-agent) done and merged
— built by `claude-opus-5 @fresh`, verified by `claude-opus-5 @fresh`,
`review: same-model`, **APPROVED first pass**. It absorbs T-039-s1,
T-039-s2 and T-039-s4, and it closes **four things the runner believed
without checking** between a file on disk and `execve`. Every one was
REPRODUCED against the unfixed code before it was fixed, by the builder
and then independently by the verifier with its own instruments.

**(1) THE CACHED LOGIN `PATH` IS GONE FROM THE STRUCT, not validated.**
`login_path` no longer exists as a field on `CacheEntry`
(`runner.rs:634`), so serde makes a planted value **structurally
unreachable rather than merely unused** — it still parses, and nothing
can read it, and no later change can trust it by accident. The PATH is
re-probed per resolve by `probe_login_path`, whose script is narrower
than the resolution probe's on purpose (it asks only for the PATH: a
compile-time constant, no `command -v`, no interpolation). **The arm was
chosen by MEASUREMENT, not by taste**: a login-shell probe costs
4.8–7.7 ms against the 41–57 ms `claude --version` the same resolve
**already paid** — and the verifier measured the FREQUENCY rather than
reading it, with a counting `$SHELL`: **exactly one spawn per turn** (1
at `start_genesis`, 1 at `send_turn`), and, with the cache file deleted,
still exactly one. Pre-fix the child's PATH was
`/verifier-hostile/bin:/tmp/verifier-attacker-shims`; post-fix it is the
live environment's, and **the planted value is still sitting in the
user's file, unread** — refusing to read a value is not a licence to
rewrite someone's file.

**(2) THE CACHED BINARY PATH IS VALIDATED BEFORE `Command::new` AND
BEFORE `probe_version`**, so a poisoned `agent-paths.json` **no longer
executes its binary at resolve time** — which it did, before any turn,
on both doors. `validate_cached_binary` (`runner.rs:293`) requires
absolute, no `.`/`..` component, file name == `adapter.binary`, and
keeps the executable-file check as the last step. On failure: a
sanitized loud line, the entry discarded from the file, the reason
pushed into `probed`, then a fresh probe, then typed `cliNotFound` —
never a silent fallback to the poisoned value. **The verifier
reproduced this with its own tattler** (a `/bin/sh` script with the
tattle path baked into its TEXT, so it survives `env_clear()` and does
not depend on the fake agent's env var), its own planted JSON, at both
doors: pre-fix `TATTLE EXISTS AFTER RESOLVE: true`; post-fix **`false`**,
a typed `NotFound` whose `probed` NAMES the refused entry and never
relays the poisoned bytes, and the cache file left as
`{ "entries": {} }`. It then confirmed the file is **re-judged before
EVERY turn**: turn 1 through a LEGITIMATE entry (the discriminating
half), poisoned mid-session, turn 2 → `CliNotFound`, no second child, no
turn-2 dump, single-flight latch released. `resolve_cli` has exactly two
production call sites and no spawn path bypasses it. The WRITE side is
gated too, and discriminates: a probe result carrying a `.` component
was USED for its own resolve and NOT written, while a clean one was.

**(3) `check_no_data_borne_flag` NOW INSPECTS THE WHOLE ASSEMBLED ARGV.**
The pre-fix `zip` skipped any tail longer than the template — a template
of 2 with a flag at index 2 returned `Ok(())`. It now walks `assembled`
by index against `template.get(at)`, and a length disagreement in either
direction is itself a refusal (`ArgvLengthMismatch`). **The length rule
now has ONE home**: the pin's own `assert_eq!(template.len(),
assembled.len())` was replaced by an assertion **through the production
function**, so the two copies that disagreed cannot drift apart again.
Both halves were drilled rather than asserted: deleting the production
length block reds exactly the dedicated pin and nothing else, and making
`argv` push one extra element reds **seven** lib tests including the
derived pin (`the spawn template assembles: FlagInValuePosition { at:
17, arg: "--settings=/tmp/evil.json", shape: FlagEqualsValue }`).

**(4) THE `model` STRING FROM THE INIT LINE IS BOUNDED AND VALIDATED**
like the session id — 128 bytes, printable ASCII with no space, typed
named rejections, never coerced. The class is deliberately WIDER than
the id's and the reason is in the header beside it: an id becomes an
ARGV ELEMENT and a model never does, it is a stored, rendered fact, so
refusing `:`/`@`/`/` would break real Bedrock, Vertex and router
spellings for no security gain. A refused model **does not fail its
turn** (a refused id must, because a turn whose id was refused cannot be
resumed; a refused model costs only the recorded NAME of what ran) — the
key is **ABSENT** from `sessions.json` rather than present-and-shortened,
so nothing was coerced. Pre-fix a hostile init line wrote a 200,290-byte
registry; post-fix 271 B, no `model` key, and no fragment of the hostile
value survives anywhere in the bytes. The discriminating half
round-trips, including a 101-byte Bedrock ARN the id's class would have
refused.

**THE VERIFICATION, RECORDED HONESTLY — including what SURVIVED.**

- **The `--help` table audit found ZERO MISSES IN EITHER DIRECTION.**
  `claude 2.1.226`'s `--help` was read and parsed **first-hand by the
  verifier** — **73 option tokens, 15 subcommand spellings** — and
  diffed against `KNOWN_CLI_FLAGS`/`KNOWN_CLI_SUBCOMMANDS`. No miss, in
  either direction. The only asymmetry is two EXTRA rows
  (`--append-system-prompt-file`, `--system-prompt-file`) — real flags
  named in prose but absent from the Options list — so the table is a
  superset, i.e. stricter, i.e. harmless.
- **REFUSED** (eighteen path shapes and twelve argv shapes attacked):
  `..`, `.`, relative, `~/…`, `$HOME/…`, empty, a DIRECTORY named
  `claude`, a 0644 file, a trailing slash, a case-folded `CLAUDE`
  (byte-exact name — stricter than this case-insensitive filesystem), a
  NUL inside the path and a NUL in the name, an ANSI escape in the name;
  a lone `-` and a lone `--` (both `LeadingDash`), a value equal to the
  template's literal at a DIFFERENT index (per-index exemption, not set
  membership), and **reordered equal-length argv** (refused at index 0).
  Log forging refused too: a planted path carrying `\u{1b}[2K` and two
  newlines spelling a fake `[nputer] agent:` record printed as literal
  escapes on one physical line, `cat -v` confirming no raw ESC byte.
- **SURVIVED, all four inside the residual the function header already
  records**: a **symlink named `claude`** pointing elsewhere (the gate
  does not `canonicalize`), a real `claude` inside a directory whose
  NAME carries a newline, `//double//slash`, and a **setuid** binary
  (unexamined, and worth nothing to an attacker who already owns the
  config dir). The verifier's ruling on the shape of that residual is
  the useful part: **TOCTOU adds nothing, because the gate never checks
  identity** — an attacker with write access to the referenced directory
  does not need to win a race. Demonstrated directly by leaving the path
  alone and swapping the FILE, after which the binary ran the full
  resume argv.
- **A calibration on the builder's prose, not a criterion failure.** In
  today's template the substituted value sits at index 18, immediately
  after `--resume` at 17, and `-r, --resume [value]` binds the next
  non-dash token as its VALUE — so **a bare `doctor` would be consumed
  as a resume value, not dispatched as a subcommand**. "`claude doctor`
  is a different program" is true of the CLI and NOT true of today's
  argv. The subcommand class is therefore a **backstop for a future
  substituted slot**, which is what its own doc comment says, and
  **criterion 6's stated minimum (known flag names, `--flag=value`) is
  met independently**. The cost side is real and measured: a CLI that
  ever issued a session id spelled `doctor` would become unresumable.

**THE FINDINGS, and the new one is the sharpest.**

- **T-047-s5 (NEW, verifier) — the FRESHLY-PROBED path skips the gate
  the cached one must pass.** `login_shell_probe` falls back to
  `which_on_path`, which reads the APP's inherited `PATH` and does
  `dir.join(binary)` — so a relative PATH entry yields a relative binary
  path, **and it is executed**. Reproduced: `resolve_cli -> Ok(path:
  "relbin/claude")`, tattle present, **while `validate_cached_binary`
  calls that same string `NotAbsolute`** and the write-side gate
  declines to cache it. **Two doors, one standard, and only one door is
  guarded** — and the tell is that the code already knows the value is
  not one it would trust from a file, and runs it anyway. The recorded
  justification for the exemption ("it came from the user's own login
  shell in this process") is true of one probe arm and **false of the
  other**. Remedy 1 (apply the same validator to the probe result) is
  ~5 lines in `runner.rs`.
- **T-047-s4 — an arbitrary `$SHELL` script IS executed with `-l -c`.**
  Reproduced directly. Reachability is **equivalent-privilege** and the
  verifier ruled it correctly NOT a gate: `launchctl setenv` in the
  user's own domain reaches subsequently-launched GUI apps with no
  admin, but the precondition already buys `~/.zshrc` — the very file
  the login shell is about to source. **What is NOT optional is its
  option 3**: `RunnerConfig`'s doc comment "a hostile env var cannot
  redirect the production spawn" is now **demonstrably FALSE**, and a
  false claim in the record is a defect by this project's own standard.
  T-047's chosen arm also makes this spawn happen **every turn** instead
  of once per install.
- **T-047-s1 — the binary cache now buys almost nothing.** Measured, not
  argued: with or without the file, **exactly one login shell runs per
  turn**, so the cache saves **ZERO** shell spawns. Its stated
  justification ("so the login-shell probe runs once per install rather
  than once per turn") is gone, and the probe already returns the binary
  path and the PATH in one spawn. Retiring the file deletes the whole
  file→exec class rather than narrowing it. The one input it lacks: a
  heavy `~/.zshrc` (nvm/rbenv/conda) could make the spawn cost real — in
  which case the right answer is a process-lifetime memo, never a file.
- **T-047-s2** (the flag/subcommand table is a version snapshot;
  subcommands are the one-sided exposure since the leading-dash arm
  covers unknown flags), **T-047-s3** (the model is validated on the way
  IN but has no READ boundary, unlike `native_session_id`'s
  `resume_id()` — its home is T-027, the first task that renders it),
  and **T-047-s6** as filed below.

**THE @human ITEM, CARRIED FORWARD EXACTLY.** During verification a
scratch probe set `probe_login_shell: true` with no binary override and
no cache entry. The controlled `$SHELL` answered the PATH question and
**failed its `command -v claude` half**, so `login_shell_probe` fell
through to `which_on_path`, which found **the human's REAL `claude`** and
spawned it with the genesis planner prompt. It answered `API Error: 401
OAuth access token has been revoked` and exited — **every assistant
record in the resulting file reads `"model":"<synthetic>"` with ZERO
tokens, so no model ran.** The verifier reported it rather than hiding
it, and **left the artifact in place rather than deleting the human's
data**:

    ~/.claude/projects/-private-var-folders-8h-bknxwr1x63x8w2c4t7nk1p2c0000gp-T-t047va-count-97806-1786893110341-project/
      4873202c-1d76-4842-8110-9cd07ab4e936.jsonl   (17,128 bytes)

Confirmed still present at this merge, one file, unchanged. **The human
decides whether to delete it.** That incident is exactly what **T-047-s6**
is filed about: `tests/agent_runner.rs`'s header says "no test can
resolve the user's real CLI even by accident", and that is
**discipline, not construction** — the property lives in a field every
test must remember to set, while `RunnerConfig::default()` correctly
ships `probe_login_shell: true` and `..RunnerConfig::default()` is the
idiom the whole suite uses. Its remedy 1 (a `NPUTER_NO_REAL_CLI=1` guard
`resolve_cli` honours, set once for the suite) turns "every test
remembers" into "one place decides". **Worth doing before F-04**, which
adds more spawn sites and more test files that will each have to
remember.

**SUITES ON MERGED MAIN**, all four re-derived here first-hand, fresh
installs, ADR-011 order:
- lib/parser `npm ci` + `npm test` **159/159 (10 files)**, `npx tsc
  --noEmit` clean, `npm run build` clean.
- app `npm install`, `npx tsc --noEmit` clean, `npm run build` exit 0
  (**252 modules**, `index-vTAlOtQD.js` **442.07 kB** /
  `index-BheOMAjN.css` 41.24 kB — **byte-identical to the asset T-041
  shipped**, which is the correct outcome for a branch whose entire
  payload is Rust), `npm test` **491/491 (28 files)** — unmoved, as it
  must be.
- app/src-tauri bare `cargo test` **217 passed + 3 ignored, 0 failed**,
  exit 0, **zero warnings**, summed across **11 test binaries** (105 / 0
  / 0 / 32+1 / 68 / 3 / 7 / 0+1 / 2+1 / 0 / 0) — **+9 over T-041's 208**,
  exactly the nine new tests. **THREE consecutive runs, identical
  per-binary, not just identical in total.** **NOT piped through `tail`**
  (the standing trap: T-046's verifier fell into it, T-020's notes record
  it). The unnamed `agent_runner` flake did not appear in any run.
- tools/e2e `npm ci` + `npx playwright test` **33/33 in 7.3s**,
  headless, one worker, retries 0, no skips — unmoved from T-041.
  `npm run typecheck` clean · `npm run lint:tokens` **clean, 37 files** ·
  `--selftest` **43 samples green**.

**THE BOOT GATE FIRED — the SECOND merge it governs, and the first on a
Rust diff.** The trigger is `app/src-tauri/**`, met by four files. Run on
scratch port **14521**, never 1420:

    [boot-check] port 14521 free — spawning `npm run tauri dev -- --config {…}` in /Users/ujju/Projects/nputer/app
    [boot-check] NPUTER_BOOT_PORT=14521 — threading --config {…}
    [boot-check] app: [nputer] project folder: /Users/ujju/Projects/nputer
    [boot-check] detected startup line 1/2: [nputer] project folder:
    [boot-check] app: [nputer] window "main" created
    [boot-check] detected startup line 2/2: [nputer] window "main" created
    [boot-check] process tree stopped (exit=null signal=SIGTERM)
    BOOT_EXIT=0

**Exit 0, both `[nputer]` startup lines, ONE run.** The exit code was
captured **from `$?` on an unpiped command** writing to a file — not from
`$PIPESTATUS`, which zsh does not define and which cost the T-041
integrator its first run. A gate whose exit code was not actually
captured has not been recorded; this one was, so no re-run was needed.
After it: `lsof -nP -iTCP:14521` **empty** (the scratch port released),
14520 empty, `pgrep -fl tauri-boot-check` empty, `pgrep -fl fake_agent`
empty. The full `ps` sweep is the strong form — **zero pids appeared and
zero pids vanished** against the pre-run baseline, compared by pid set,
not by eye. T-046-s1 did not bite on this path (it names the
SIGKILL-mid-boot path, not the orderly exit).

**1420 was never bound, contacted or signalled.** The human's vite still
holds `[::1]:1420` on **the same pid 90127, the same fd 28u, the same
device 0xc074e387883bd776** as at T-041's merge. The boot check bound
14521 only; the lane bound 14520 only.

**A SIDE EFFECT THE HUMAN SHOULD KNOW ABOUT, larger than T-041's and
worth a rule.** T-041's checkpoint recorded that a boot check RELINKS
`target/debug/nputer` while leaving the running app alone, because a
replaced file does not disturb a process holding the old inode. **This
merge did something stronger, and it was the MERGE itself, not the boot
check.** The human's live `tauri dev` (pid 89953) watches
`app/src-tauri/src/**`; the merge landed four `.rs` files there at
18:46:04, and one second later that dev server **rebuilt and restarted
its own app binary** — the app the human is reviewing on 1420 went from
pid 1753 to **pid 8392**, parented to the same unchanged `tauri dev`
chain, with vite on 1420 untouched throughout. Nothing was signalled by
this session; the human's own watcher reacted to files on disk. **It is
unavoidable for any app-agent or app-shell merge** — a merge must write
the working tree — but it means **the human's app silently restarts
under them mid-review**, and nobody has written that down. Worth a
CONVENTIONS line or a note in the @human item; left for a triage rather
than settled here.

**THE MERGE WAS CLEAN AND THE INTERSECTION WAS PROVED EMPTY, not
assumed.** Merge commit **`3f2eb1e`**, merge-base **`2961599`**, eleven
files. Both changed-file sets were enumerated and `comm -12` is
**EMPTY**: T-047 carries four source files
(`app/src-tauri/src/agent/{adapter,runner}.rs`, `src/bin/fake_agent.rs`,
`tests/agent_runner.rs`) plus its card and six suggestions; main since
the base carries `app/src/lib/watcher-store.ts`, four `app/test/**`,
three docs, `graph.json`, ten task files and nine under `tools/e2e/`.
`git merge-tree --write-tree` was run first and produced a single tree
hash with **zero conflict markers**. Neither ../nputer-t048 nor the
removed ../nputer-t047 was entered.

STANDING INTEGRATOR PRACTICE (T-009-s1, the ratified CONVENTIONS interim
regen rule; retires when T-014's `nputer index --check` becomes the
gate) — **SEVENTEENTH** exercise, and the first in a while where **the
rule never FIRED at all**, which is a different thing from firing to no
effect and is recorded as such.
- **Trigger ABSENT, verified from the merged diff**: `git diff
  --name-only e78bfdc..HEAD` filtered to `*.ts/*.tsx/*.js/*.jsx` returns
  **nothing** — and the stronger form is true too, there is not a single
  file of those extensions in the diff **even inside docs/**. The diff is
  four `.rs` files and seven `.md`. Contrast the last two exercises:
  T-041's rule fired and MOVED the graph (88→89 files), T-046's fired and
  was a NO-OP (its `.ts` lived under `.nputerignore`d `tools/`). This one
  did neither — there was nothing to evaluate.
- **`.rs` is invisible to the indexer until T-010**, checked rather than
  assumed: `nputer-index` walks `Lang::Ts, Lang::Js` only, and the four
  files T-047 changed are among the ones ARCHITECTURE already flags as
  claimed by no component.
- **Byte-identity proved anyway, positively rather than as an absence.**
  The **plain (non-golden) ignored self-check** — `cargo test -p
  nputer-index --test self_graph -- --ignored`, with
  `NPUTER_UPDATE_GOLDEN` confirmed unset in the environment — returned
  `self_graph_is_current ... ok`, which re-derives the graph in memory
  and compares it to the committed bytes. sha256 before and after:
  `05ebc2c772ffa3aaabc23aefa0feae60f2c4652ab9e64ac1c64de0044f5e478a`,
  **368,496 bytes**, 89 files / 602 symbols / 1003 edges, and `git
  status` shows `graph.json` unmodified. **Nothing was regenerated**, per
  the builder's and verifier's concurring instruction.

**No model call was made anywhere in this merge.** The env-gated
`#[ignore]` smoke was NOT run (it is one of the 3 ignored). No screen
control, no screenshots, no OS input injection, nothing read off the
screen. The boot run opened and closed its own window, which is the
@human ruling of 2026-08-16 that T-046 rests on and this merge does not
extend.

INTEGRATOR JUDGMENT CALLS, recorded.
- **ARCHITECTURE: EDITED — one new Interfaces bullet, "Resolving the
  agent CLI (disk → `execve`)".** Ruled genuinely incomplete rather than
  merely terse, on the section's own terms: Interfaces describes what
  crosses the app's boundaries, and **disk → `execve` is a boundary
  crossing the document did not mention at all.** Two specific falsehoods
  a careful reader would have drawn from it. First, the Genesis bullet
  enumerates the app's durable writes as `sessions.json`,
  `genesis/transcript.jsonl` and `genesis/kit/` — "all outside the docs
  watch root" — from which a reader concludes the app's disk footprint is
  `.nputer/`. **It is not**: `agent-paths.json` lives in the app config
  dir, outside the project entirely, and its contents decide which binary
  is executed. Second, "one short-lived child per turn" is true of the
  agent child and no longer the whole picture — the resolve ahead of
  every turn now spawns a login shell and a version probe. The bullet
  states both, names the gate and what it checks, records the measurement
  that chose the not-cached arm, and carries the two residuals with their
  filed ids. It also **scopes the environment claim** rather than leaving
  it to be contradicted: the CHILD's environment is still built not
  inherited (`env_clear()` — unchanged and still true), while the
  RESOLVER reads `$SHELL` and `PATH` from the app's own environment. That
  wording is deliberate — T-047-s4's live finding is that
  `RunnerConfig`'s comment makes the unscoped claim and is now false, and
  **an integrator should not leave the same falsehood in the architecture
  document while filing a task about it in the code.** Everything else in
  the file stayed true and was re-checked: the FOUR `.rs` files claimed
  by no component are still exactly four and still exactly those four.
- **ROADMAP: NOT edited.** T-047 is in milestone 3 and F-03, so the T-046
  precedent does not settle it by itself and the T-041 test was applied
  instead: milestone 3's Progress line enumerates **what a user can do**,
  and T-047 adds no user capability — the same UI, the same commands, the
  same wire shapes, byte-identical bundle. The T-039 disanalogy holds
  exactly as T-041 recorded it: T-039 was named in ROADMAP only because
  ROADMAP itself had said the remainder was "held by security debt", so
  retiring that hold edited a sentence already in the file. **T-047's
  work was never held out in ROADMAP**, and the honest remainder (T-027,
  T-028, T-029, plus one observed real turn) is untouched. Milestone 3
  still NOT claimed.
- **CONVENTIONS: NOT edited.** The BOOT GATE bullet was exercised a
  second time, on its other trigger limb (`app/src-tauri/**` rather than
  `app/src/**`), and needed nothing. The one new friction — the human's
  live `tauri dev` restarting its app under them when a merge writes
  `.rs` — is real and is written up above, but **it is a rule about the
  shared working tree, not about the gate**, it belongs with the two
  open questions already in that family, and an integrator who just
  caused it is not thereby entitled to charter the remedy.
- **NO NEW ADR (three-prong), and this one was argued rather than
  assumed, because it is the THIRD instance.** The candidate: *everything
  the runner hands to `execve` — argv, environment, and now the binary
  path itself — is built from compile-time constants or validated
  inputs, never trusted from disk or environment.* T-025 (env allowlist)
  and T-039 (argv gate) were both ruled C-14-local, each flagging that
  the charter question arrives when a **SECOND component spawns agents at
  F-04**. **Does a third instance change that? No — and the reason is
  better than "the named trigger has not fired" (though it has not: C-14
  is still the only spawner, C-02 is `planned`).**
  (a) **An ADR charters a DECISION between live alternatives, and there
  is no alternative here.** Nobody has proposed trusting the disk. All
  three tasks closed holes against a standard everyone already agreed to;
  none of them chose between designs. The ADR series' territory is what
  nputer IS or how it is shaped — files-are-the-brain, shell-out-to-CLIs,
  app-first, native surfaces Rust-side, graph-as-committed-files,
  spawned-planner-lens. "Validate before you exec" is engineering hygiene
  inside one component.
  (b) **THE DECIDING REASON, and it is specific to the third instance:
  the standard is not yet settled, so a charter would freeze the wrong
  version of it.** T-047-s5 is the proof — the cached door and the probed
  door apply **different** standards today, the verifier ruled the
  recorded justification for that exemption does not cover the
  `which_on_path` arm, and the reconciliation is an OPEN suggestion. A
  charter that said "one standard for everything reaching `execve`"
  would be contradicted by the code on the day it was written; one that
  described the two-door reality would not be a decision worth
  chartering. **The moment to write it is when s5 lands** — that is when
  there is a single rule to charter — and that is a nearer, sharper
  trigger than "a second component", so it is recorded as an addition to
  the existing one rather than a replacement.
  (c) **T-047-s1 argues the cache should be RETIRED**, which would delete
  `validate_cached_binary` and its pins outright. Chartering how to
  validate a cache entry while the live proposal is to remove the cache
  would charter a thing that may not exist next month.
  **Prong two, verified as an EMPTY SET rather than by eye**: `git diff
  --name-only e78bfdc..HEAD` restricted to `method/`, `lib/parser/`,
  `app/src/`, `tools/`, `capabilities/`, `tauri.conf.json`, `acl_pin.rs`,
  `lib.rs`, `index_cmd.rs`, `docs_watch.rs`, `graph.json` and every
  `Cargo.toml`/`Cargo.lock`/`package.json`/`package-lock.json` returns
  **nothing**. So ADR-012 held (no native surface moved, zero grants
  touched, `acl_pin.rs` zero-diff, the 92-grant set unmoved), ADR-011
  held (zero new crates, zero new npm deps, no lockfile line), ADR-003
  held (no model call anywhere in this merge), ADR-014/015 held (the
  graph was not regenerated because the rule did not fire, and was proved
  current by the indexer's own self-check). **No new IPC variant**: the
  six wire enums are unchanged, and the three new Rust enums
  (`ArgShape`, `ModelRejection`, `CachedPathRejection`) derive **no
  `Serialize`** — checked at the derive line, not by grep — so
  `app/src/lib/agent-store.ts` needs no mirror and has none. Prong three:
  the durable calls live in the task file's criteria→evidence map, its
  eight proof obligations, its six deviations and its six genuine
  silences.

## In progress / broken right now
**ONE TASK IS `building`.**
- **T-048** (the frame holds — the genesis page stops growing and the
  pane starts scrolling, S, app-shell, F-03), worktree ../nputer-t048.
  It absorbs T-041-s1 and T-041-s3 and carries the corrected three-edit
  fix: two `min-h-screen` → `h-screen` **plus `min-h-0` on
  GenesisScreen.tsx:37**, the link the original one-line remedy was
  missing.
  **THE ORPHANED-SIBLING HAZARD IS RESOLVED — re-derived here rather
  than carried forward, and the previous checkpoint's warning is now
  STALE.** T-041's checkpoint recorded that t048 sat on `cf5a650`, an
  orphaned sibling of main's `37cb0ed`, making the merge-base `0378cb9`
  and a docs/STATE.md conflict expected. **Its builder has since MERGED
  MAIN FORWARD** (`a3a5ccb`, "Merge main into t048-frame-holds", never a
  rebase — the house rule was followed), so as of this checkpoint:
  `git merge-base main t048-frame-holds` is **`e78bfdc`**, the branch
  now contains both T-046's and T-041's checkpoints, and
  `git diff e78bfdc..t048-frame-holds` is **EMPTY** — it carries no
  commits of its own yet. **So no docs/STATE.md conflict is expected any
  more**: its STATE.md is byte-identical to `e78bfdc`'s, this
  checkpoint's rewrite applies cleanly over it, and the "take main's
  side whole" instruction no longer has anything to resolve. That stays
  true unless its builder edits docs/STATE.md, which is an integrator's
  file, not a builder's. Note the branch does NOT contain T-047 —
  disjoint by area (app-shell + tools/e2e vs app-agent), so no
  reconciliation is expected there either. Its **criterion 5** owes the
  replacement of `tools/e2e/tests/genesis-screen.spec.ts`'s tripwire
  block (~196-228),
  which deliberately PINS the overflow as today's broken truth; that file
  has been on main since `9e70ea9`, so the drafted-hunk workaround is not
  needed, but **a tripwire silently passing on the old numbers is the one
  outcome nobody wants.**

**Do not enter ../nputer-t048.**

**THE SHARED-INDEX HAZARD, and it did not recur.** `git diff --cached
--stat` was checked before **both** commits and the staged set was
exactly this session's each time. The house shape here is clean: **merge
→ checkpoint**, two commits.

The t047 worktree is removed and its branch KEPT — **28 task branches
merged now**, `t001-app-shell` through `t047-runner-trust` (counted with
`git branch --merged main`), plus the one live branch. Main tree clean;
all four suites green; the token lint green; the committed graph current
and proved so by the plain self-check rather than by assumption. The
parser re-parses the whole live tree at **0 issues**: **70 tasks**, tally
**29 done / 18 planned / 9 parked / 13 suggested / 1 building** (T-048),
6 features, 11 components. (Tasks rise by six and `suggested` by six —
that is T-047's six suggestion files, not a board that grew work.)

**NO STANDING SECURITY GATE.** T-025-s6 closed at T-039 and nothing
replaced it. What T-047 leaves behind is the sharpest open set this
component has had: **T-047-s5** (two doors, one standard, only one
guarded — the only one whose remedy is ~5 lines), **T-047-s6** (nothing
structurally stops a test resolving the real CLI — the one that has
already fired once), **T-047-s4** (`$SHELL` picks the program, and a
comment in the code is now false), and **T-047-s1** (the cache that saves
zero spawns). Beside them the older process-hygiene pair stands:
**T-046-s1** (the unsignalled process group, on the human's own port) and
**T-041-s4** (the one env-var path that would package a DEV harness).

LAUNCH ITEM, carried forward unchanged in substance — **watch the first
CI run** (T-020). At the repo's first push (`git remote -v` is still
empty), confirm in order: the ubuntu apt/webkit2gtk set installs; the
three `uses:` SHA pins resolve; playwright-on-Linux runs the lane — **33
tests**, whose ten newest are the most platform-sensitive the lane has
ever taken because they measure REAL CSS in Chromium-on-Linux (**if
anything goes red there, look at the font and colour assertions in
`front-door.spec.ts` and `genesis-screen.spec.ts` first**). Then:
`cargo audit` behaves as it does locally; and **the xvfb `tauri dev` boot
prints both `[nputer]` startup lines** — the FIRST exercise of the boot
check on Linux, and the only place T-046's override's Linux behaviour
will ever be observed (CI deliberately sets no `NPUTER_BOOT_PORT`, so the
override path stays Linux-unverified by design). AND (T-018-s3 fold) the
THREE T-018 SENTINEL LIVE TESTS inside the ubuntu `cargo test` step —
replaced-wholesale and deleted-recreated docs/. They discriminate only
where inotify watches INODES; macOS FSEvents watches paths and was
accidentally resilient, which is why T-018's replace-half evidence is
mechanism-only today. Green there CLOSES that gap; red there is a real
reconcile gap macOS could never surface, and gets filed immediately.
This run also closes T-001/T-003's Linux halves, and carries T-026-s1
(the plan probe's exact-case match) and T-021-s1 (the ACL pin is
macOS-derived). Since T-025 the ubuntu `cargo test` step also runs the
`agent_runner` integration tests — **now 32 + 1 ignored**, up from 28 —
which spawn real child processes and send real signals, the first time
this repo exercises process control on Linux. **T-047 makes that step
sharper in one specific way**: its new tests plant files, refuse paths
and assert on executable bits, so a Linux permissions or `/bin/sh`
difference would show up there first. Watch it, and watch for the unnamed
`agent_runner` flake there too.

## Next up (1–4)
1. **@human — THE VISUAL SESSION IS STILL OPEN.** The app is RUNNING on
   1420 as this checkpoint lands, **though its process was restarted by
   its own dev server at 18:46 when this merge wrote four `.rs` files**
   (pid 1753 → 8392; see the side-effect note above — if the window
   looks freshly launched, that is why). T-047 ships **no UI and no
   CSS** — the bundle is byte-identical to T-041's — so every item below
   stands as the last checkpoint left it. **The route to the pane**:
   "Start an interview" on a docs-less folder, or "Start an interview
   here" on a folder the app just refused.
   - **T-024's pane, light AND dark**: built/forming/slot card contrast
     in dark, the warm writing-row border, the five type sizes that
     moved 0.5–1px, the substituted footer right slot
     (`stage ~4 · constraints`).
   - **THE COMPOSITION QUESTION, still the ONLY framing item left here.**
     T-024 drew the pane as the **RIGHT HALF of a split view**; until
     T-027 it sits **full-width inside T-026's card frame**. Does its
     `bg-sidebar` ground read right framed by a `bg-card` bordered box,
     and does the **five-across backbone grid** hold at full width when
     it was drawn for a half-width pane? **This is the question T-027's
     planning pass waits on** (item 2). The scroll/overflow half is
     T-048's, BUILDING — look again once it lands.
   - **T-026's front door, light AND dark**: the two-button row and the
     "No plan in &lt;folder&gt;" card against the design's `open a
     folder` screen — button sizes/inks, the checklist ○/✓ (the ✓ rides
     `--review-disc`, whose dark value #4ecf9e is a token-family
     derivation, not measured from a dark mockup), the card's 10px vs
     the design's 12px radius, and whether the footnote reads as a
     footnote. The lane now pins the machine-checkable half of both
     screens, so what is left for the eye is genuinely taste.
   - **The at-a-glance amber judgment** (T-012 criterion 5's human
     half — drift stroke vs building/verifying fills, BOTH schemes,
     incl. composed building+drift; the dogfood hero renders it live).
     C-05's drift count reads **4**.
   - **The launch-shot re-judgment** (T-006's pending screenshot
     predates the rail — light + dark now include it).
   - **The T-023 dry-run conversational quality judgment** (did the two
     "pushing back:" challenges actually challenge; true cold-context
     evidence still arrives with T-029).
   - **T-026-s4's question**: point the app at a folder whose `docs/`
     holds files but no plan (a lone ARCHITECTURE.md). It renders
     **through the lens** now, as the pane's own `docs/ · 0 files
     written` scaffold with `expected` placeholder rows and north star
     `forming…`. Judge whether THAT reads right over a non-empty docs/.
   - **The real picker flows on the real screen** — the standing T-007
     checklist, still @human because native dialogs are unreachable from
     a browser harness and tauri-driver has no macOS. What remains is
     exactly the native half: "Start an interview" → native dialog → a
     docs-less folder lands on the genesis screen; ⌘N and ⌘O on the
     front door; "Start an interview here" on a folder the app just
     refused; a folder that already has a plan → the board, not genesis.
   - **The `tauri dev` quit-the-app orphan check** (from T-025). Start a
     `hang`-scenario genesis in a scratch project, quit the app, confirm
     no orphan — **and watch for T-025-s7's ~5 s main-thread hang on
     quit**, which is expected, harmless, and worth confirming is only
     ~5 s.
   - **NEW, and it is a decision not a look: the T-047-s6 stray.**
     `~/.claude/projects/-private-var-folders-…-t047va-count-97806-…-project/`
     (one .jsonl, 17,128 bytes, zero-token synthetic records). It is
     outside the repo and was deliberately not deleted. **Delete it or
     keep it — the call is yours.**
   - **ONE REAL OBSERVED PLANNER TURN, on an authenticated machine** —
     still the biggest unobserved thing in the project. This machine's
     `claude` OAuth token is revoked (**re-confirmed the hard way during
     T-047's verification: the accidental real spawn 401'd**), so no
     model call has ever gone through the runner. Two questions ride on
     it: does the kickoff land a real planner in stage 0, and is the
     six-pattern Bash allowlist sufficient for a real stage-0 scaffold
     (which is what T-025-s4 needs before it can narrow `Bash(cp:*)` /
     `Bash(mkdir:*)` safely). **T-025-s2 carries the exact command.**
   - **A Linux run** — the "watch the first CI run" item above.
   - **A PRIORITY CALL, not a screen action.** The next triage now has
     **three** process/spawn-hygiene items to rank against each other:
     T-046-s1 (the unsignalled group, on the human's own port),
     T-047-s6 (the guard that stops a test reaching the real CLI — the
     only one that has already fired), and T-047-s5 (two doors, one
     standard, ~5 lines).
2. MILESTONE 3 (T-023…T-029 + T-039 + T-041 + T-047, ADR-017). **T-041's
   served-bundle gate is DOWN** and T-027/T-028/T-029 can each write the
   probe their Verification line promises. **What still holds the
   milestone is the human, in this order:**
   (a) **T-027's planning pass waits on the human's split-view verdict**
   (item 1) — it builds the LEFT half of a composition whose whole
   design question is what the open visual session is judging.
   `blocked_by` [T-024 ✓, T-025 ✓, T-026 ✓] has been satisfied since
   T-025 merged. **T-027 also now inherits T-047-s3**, which wants a
   read boundary on `model` at the first site that renders it.
   (b) **T-029 is UNGATED but not unblocked** — its `blocked_by` is
   still `[T-027]`, and T-028's is too.
   (c) **T-048 is ahead of T-027 in the app-shell lane** and is the
   thing that makes the screen usable at the size the app opens.
   The milestone is NOT claimed: the first slice delivers hand-driven
   genesis, the runner exists and is now hardened at four boundaries,
   but no agent loop has ever run against a real model.
3. OVERNIGHT DISPATCH GRANTS (human, 2026-08-16 night): the app-shell
   lane queue was T-021 → T-026 → T-025 → T-022; T-021, T-026 and T-025
   are all DONE, so the standing grant's next named item is **T-022**
   (M, milestone 4, `blocked_by: []`), with T-027 ahead of it in
   milestone order but held for the visual verdict. **app-agent is now
   FREE** — T-047 has merged — which unblocks **T-043**'s "serialize
   behind T-039 on app-agent" condition outright; **app-shell is
   OCCUPIED by T-048.** Triage: APPLY granted — but tasks NEWLY created
   by triage (T-041…T-048) do NOT dispatch without the human; T-041,
   T-046, T-047 and T-048 each got that nod explicitly. Unchanged method
   rules: a second REJECTED on any task parks that lane for the human;
   @human judgments are never self-answered.
4. SUGGESTION BACKLOG — **22 open files: 9 parked + 13 suggested.**
   (The last checkpoint's "13 open" line was wrong against its own
   parser tally of 9 + 7; the number here is read straight from the
   parser.) **T-047 contributes six**, which is the largest single
   addition the board has taken.
   **Untriaged (13)**: the six T-047 cards — **s5** (the probed path
   skips the gate; smallest remedy, and it makes the write-side gate
   redundant rather than load-bearing), **s6** (nothing structurally
   stops a test resolving the real CLI; **already fired once**, and its
   remedy should land before F-04), **s4** (`$SHELL` picks the program;
   its option 3 is NECESSARY because a code comment is now false),
   **s1** (retire the cache — it saves zero spawns; wants one
   measurement first, a heavy `~/.zshrc`), **s2** (the flag table is a
   version snapshot; subcommands are the one-sided exposure), **s3**
   (the model has no read boundary; home is T-027) — plus **T-041-s2**
   (the wire shape is pinned in Rust and mirrored by hand in TS with
   nothing comparing them; three lane specs now assert against those
   hand-written payloads), **T-041-s4** (`NODE_ENV`, not `--mode`,
   flips the DEV gate), **T-046-s1** (the unsignalled process group),
   **T-046-s4** (the overlay's blind spot), **T-046-s2** (`checkJs` —
   its worked example is wrong and the correction is IN the file),
   **T-046-s3** (nothing gates the packaged build — read with s4 and
   T-041-s4: all three are "a gate proves the configuration it was
   handed, not the one that ships"), and **T-039-s3** (give the
   session-id refusal its own typed outcome; home is T-029).
   **The nine parked, unchanged**, all blocked on something only the
   world can provide: T-003-s2 (a real project near the ~25 MB knee),
   T-008-s1 (F-04/F-05 layout), T-018-s1 (a Windows lane — **note
   T-047 made `is_executable_file` return `false` off-unix, so a
   Windows lane now inherits a refusal it must deliberately implement
   rather than a hole it must remember to find**), T-021-s1 and
   T-026-s1 (both await the first Linux run), T-025-s2 (@human, one
   command on an authenticated machine), T-025-s4 (gated by s2),
   T-025-s3 (nputer.yaml is F-04 era; its count fix rides T-043),
   T-038-s1 (no responsive call site yet).
   Five triage-born tasks stand ready and un-dispatched: T-042 (genesis
   switch truthfulness), **T-043** (kill path: honest grace and honest
   scope — **its serialization condition is now SATISFIED and app-agent
   is free**; T-047-s4 explicitly nominates it as a home), T-044 (shell
   pins cover their surface), T-045 (the gates cover the rules).
   Milestone-4 queue after F-03: T-010, T-013, T-014, T-015, T-030…
   T-035, T-044, T-045, plus T-022.

## Open questions
- **Does the BOOT GATE rule retire, and when?** Carried forward
  unchanged. T-009-s1's sibling rule names its retirement (T-014's
  `nputer index --check`); BOOT GATE names none in CONVENTIONS, and
  `.github/workflows/ci.yml` already invokes the boot check on ubuntu
  while dormant. Does it retire at the repo's first push, or only when a
  macOS gate exists too? Left for a triage. **Two exercises in now, on
  both trigger limbs** (`app/src/**` at T-041, `app/src-tauri/**` here),
  and it has needed no amendment either time.
- **Should `method/` name the class of CONVENTIONS-level pipeline
  gates?** Unchanged: there are TWO gates with the shape trigger →
  command → record, one of which binds the executor, and
  `method/roles/executor.md` still says only "run the test commands from
  CONVENTIONS.md until green". Ask ONCE when a THIRD lands, or when the
  executor rule proves noisy. A method version bump, not an ADR.
- **Does the shared main working tree need a rule?** Carried forward and
  **now with a second, different symptom**. The first was the git INDEX
  (T-046's merge lost its house shape to a shared index; the fix that
  works is social — "the pen is yours" — plus `git diff --cached --stat`
  before every commit, done twice here). The second, new today, is the
  WORKING TREE ITSELF: the human's live `tauri dev` watches
  `app/src-tauri/src/**`, so **any app-agent or app-shell merge restarts
  the app the human is reviewing**, one second after the merge commit,
  with no signal from the integrator. Neither is written down anywhere.
  Method/process, so the architect's (ADR-004).
- **NEW: when does spawn hygiene become an ADR?** Three C-14-local rules
  now exist (T-025's env allowlist, T-039's argv gate, T-047's four
  boundaries) and this merge ruled AGAINST a charter — see the
  three-prong above. The existing trigger ("a second component spawns
  agents at F-04") is joined by a nearer one: **when T-047-s5 lands and
  the cached and probed doors hold ONE standard**, there is for the first
  time a single rule to charter. Until then a charter would either freeze
  a two-door reality or contradict the code.
