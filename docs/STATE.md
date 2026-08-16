# State

Updated: 2026-08-16 by integrator (T-039 merge), claude-opus-5 @fresh

## Just completed
T-039 (session-id injection gate, S, app-agent) done and merged — built
by `claude-opus-5 @fresh`, verified by `claude-opus-5 @fresh`,
`review: same-model`, **APPROVED first pass**. It closes **T-025-s6**,
the argv-injection path T-025's own verifier found, and it was the
ruled GATE on T-029. Milestone 3 now carries no security debt.

**WHAT SHIPPED, in one breath.** `AgentAdapter::argv` is now
**FALLIBLE** — `Result<Vec<String>, SessionIdRejection>` — so there is
**no infallible way in the tree to assemble a resume argv**. That is the
whole shape of the fix and it is worth more than the validator itself: a
future caller cannot skip the check by forgetting, because there is no
un-gated spelling left to reach for. The alternative considered and
rejected was a `try_argv` beside an infallible `argv`, which would have
left the vulnerable spelling in the tree as the convenient one. Cost:
five existing adapter-test call sites gained an `.expect()`.

Validation runs at **both boundaries**, not one:
- **capture** — `runner.rs:931`, inside the `StreamLine::Init` arm,
  BEFORE `emitter.session_registered`, before `out.native_session_id` is
  set, before anything is written. `runner.rs:949` is the ONLY
  assignment to `native_session_id` in the tree, and it sits immediately
  after the validation break, so there is no second capture path to gate.
- **registry read** — `SessionEntry::resume_id()` (`sessions.rs:70`),
  the accessor **T-029 must use**; reading the raw field to spawn with is
  now the bug, and `adapter::argv` refuses it a second time if anyone
  does. Used at `mod.rs:249`, where a rejection becomes
  `StartOutcome::Error { message }` naming the file, the entry and the
  reason. `Ok(None)` — an entry with no id — still starts fresh, which is
  correctly not an error.

The allowlist is `^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$`
(`adapter.rs:258`), **deliberately wider than exact-UUID** and the
widening is recorded rather than accidental: a CLI that changes its id
format — a prefix, a ULID, a base58 blob — would otherwise make every
recorded session unresumable on upgrade, a loud failure but a needless
one. **The security property does not rest on the format guess, it rests
on the character class**: no leading `-` (never a flag), no `=` (never
`--flag=value`), no `/` or `\` (never a path), no whitespace, no NUL, no
control character, nothing outside ASCII, hard 128-byte bound. A UUID is
a strict subset. Derived from what the CLI actually produces, sourced
twice: the one real id ever observed in this repo (T-025's real smoke)
and `claude 2.1.226`'s own `--help` line for its sibling flag
(`--session-id <uuid>`), both re-read first-hand by the verifier —
`--help`/`--version` only, no model call. The first character must be
alphanumeric, so `.`, `..` and `.hidden` are refused as a class.

The **bypass pin was widened to inspect the fully assembled argv**, not
just the adapter table — which is exactly what T-025's pin could not do,
because that pin searched the TABLE and the injection arrived through
DATA. Three halves now: the original three-spelling case-insensitive
table search (unchanged in wording and message, but fed four real ids
instead of one); NEW — over the fully assembled argv of every adapter,
spawn and resume, an element may begin with `-` only by BEING the
template's own flag at that index, byte for byte; NEW — the T-025
verifier's exact injections are asserted to be `Err(LeadingDash)`, i.e.
to have no argv at all. **The same rule runs in PRODUCTION**
(`check_no_data_borne_flag`, called from `argv` on every assembly) and
returns a typed refusal rather than panicking — a `debug_assert!` would
leave the shipped binary unguarded.

**THE VERIFICATION, recorded in detail because it is the strongest this
project has seen.** Every result below was re-derived by the verifier
first-hand; none was read off the builder's notes.
- **THE VULNERABILITY WAS REPRODUCED ON PRE-FIX CODE**, checked out from
  `7f5025b` and driven by a probe of the verifier's own writing, before
  the fix was ever read as a fix. Unit half: `argv` tail for
  `"--dangerously-skip-permissions"` came out as
  `["WebSearch", "--resume", "--dangerously-skip-permissions"]`, and on
  the same tree the old pin
  (`no_adapter_argv_can_ever_bypass_permissions`) ran **ok** — the pin
  was GREEN while the flag was in the argv. End-to-end half, through
  DATA and a **real spawned turn-2 child recording its own argv**: the
  fake CLI put the injection in its own init line, it was captured, it
  reached the registry file, `send_turn` returned `Accepted { turn: 2 }`,
  and the child received
  `["WebSearch", "--resume", "--dangerously-skip-permissions"]`. Both
  halves of T-025-s6 confirmed against running code, not against a claim.
  The same probes against HEAD: `Err(LeadingDash)`, captured id `None`,
  registry id `None`, `send_turn` → `NoSession`, turn-2 child dump
  absent.
- **THE ALLOWLIST IS PROVEN, NOT ASSERTED.** The builder's table is a
  list of strings, and a list of strings cannot prove an allowlist. The
  verifier swept **every codepoint U+0000–U+2FFFF** (196,608 values)
  through `validate_session_id` in **both positions** and compared the
  accept sets by **equality, not sampling**: 62 accepted at position 0
  (`assert_eq!` to `[A-Za-z0-9]`) and 65 accepted in the body
  (`assert_eq!` to `[A-Za-z0-9._-]`). Both passed. No homoglyph, no
  full-width form, no combining mark, no control character, no non-ASCII
  codepoint is accepted anywhere. The Cyrillic and full-width rows in the
  builder's table are true as a CONSEQUENCE of the rule rather than as
  entries in it. Length exact: 128 `Ok`, 129 `TooLong { len: 129 }`, 0
  `Empty`, and the byte check runs before the char loop so a 1 MiB id
  costs one comparison.
- **THEN IT HUNTED FOR AN ACCEPTED STRING THAT IS STILL DANGEROUS.** All
  **261,950** accepted three-character ids were enumerated and each
  asserted pure ASCII, not `-`-leading, free of whitespace, control
  chars, `=`, `/`, `\`, `@`, `$`, `:`, never equal to `.` or `..`, and
  **assembling to exactly one argv element** whose last position does not
  begin with `-`. All passed.
- **THE `.`/`..` QUESTION WAS MEASURED, NOT ARGUED.** `a..b`, `a..` and
  `a.` ARE accepted — and `Path::new("/base/x").join(…)` renders every
  one of them as `Normal("a..")`, **never `ParentDir`**. Only a bare `..`
  is `ParentDir`, and a bare `..` cannot pass the first-character rule.
  An accepted id is always exactly one non-traversing path component.
  Normalization tricks are closed structurally: the accept set is pure
  ASCII, whose NFC/NFD/NFKC forms are itself, and overlong UTF-8 cannot
  exist in a Rust `&str`.
- **ELEVEN HOSTILE IDS OF THE VERIFIER'S OWN, in a hand-written
  registry.** A `format!` template with no runner code involved, planted
  with ids the builder never used and **chosen from `claude --help` for
  what they would DO rather than for how they look**:
  `--settings=/tmp/nputer-evil-settings.json` — which the verifier notes
  is **arguably worse than the measured injection, because it loads an
  arbitrary settings file** — plus `-c`, `--fork-session`, `--safe-mode`,
  `--add-dir=/`, `""`, `..`, a U+2010 lookalike, a NUL-carrying id, 129
  bytes, and an embedded-space id. **Every one**: typed
  `StartOutcome::Error` naming the file and the entry, **no child
  spawned, no kit materialized, the planted file byte-identical**, and no
  echo of the refused id in the message. Refusing to resume is not a
  licence to rewrite the user's runtime state. The discriminating half
  holds too — a ULID, `a`, `0`, `sess.2f8a-9c_x` all reach
  `ResumeAvailable`, and an entry with no id reaches `Started`.
  Independently, T-029's actual call shape: `run_turn` handed
  `resume: Some(hostile)` for six values returned `MalformedStream` every
  time with `spawned=false` and exactly one `Failed` event, no `Started`.
- **THE PIN WAS DRILLED FOUR WAYS AND THE DRILLS RE-DERIVED.** Removing
  `validate_session_id(id)?` from `argv` reds three lib tests including
  the pin; with the argv body restored to the literal pre-fix shape and
  `--add-dir=/` planted in the pin's own id list — a string none of the
  three needles match, so half one cannot fire — half two reds with its
  own message; each of the three forbidden spellings planted in
  `spawn_args` fires the ORIGINAL search with its ORIGINAL message; and
  `adapter.rs` was `shasum`-compared byte-identical after every drill.
  **Worth recording: with only the validation removed, the PRODUCTION
  backstop caught `--add-dir=/` first** — the guarantee is genuinely
  structural and not test-only.
- **EXECUTION SWEEP.** A poison `assert!(false, …)` was scripted into
  each of the **nine** changed test bodies one at a time (8 new + the
  renamed `a_hostile_session_id_never_reaches_argv_at_all`), the single
  test run by exact name, the marker confirmed in the output, the file
  restored and byte-compared. **9/9 red on demand.** The test-name delta
  was derived independently by diffing function names `7f5025b` vs HEAD:
  8 added, 1 renamed, 0 deleted-without-replacement — and 200 + 8 = 208,
  which is the observed total.
- **COERCION SWEEP** (criterion 2's "loud, never coerced"): the whole
  agent module grepped for `trim`/`replace`/`retain`/`strip_*`/
  `truncate`/`filter`/`to_lowercase`/`normali*` — nothing touches the id
  path. The one `truncate_utf8` near a rejection bounds the ENTRY KEY in
  the message, not the id, and **the id is never echoed at all**: the
  message names the class, the codepoint and the byte offset, all
  `escape_debug`'d, so a refused id carrying `\u{1b}[2K` cannot paint a
  terminal on its way out.

cargo **200 → 208** (+8, all new; one test renamed and strengthened —
`a_hostile_session_id_stays_one_inert_argv_element` became
`a_hostile_session_id_never_reaches_argv_at_all`, because its old claim
"one inert element" was true and INSUFFICIENT, which is precisely
T-025-s6's finding).

**THE FINDINGS, RANKED.**
- **T-039-s4 (NEW, filed by the verifier) — the argv backstop trusts its
  slice lengths, and the two copies of the same rule disagree.** The
  PRODUCTION `check_no_data_borne_flag` zips `template.iter()` with
  `assembled.iter()`; `zip` stops at the shorter, so **any assembled tail
  longer than the template is never inspected** — measured by calling the
  `pub` function directly: a 2-element template with a flag at index 2
  returns `Ok(())`. Meanwhile the TEST copy of the rule carries the
  `assert_eq!(template.len(), assembled.len())` the production function
  lacks. It also covers the **leading-dash class only** — `Bash(*)`
  substituted into an `--allowedTools` value slot returns `Ok(())`, which
  is correct for criterion 4 but narrower than the doc comment promises.
  Unreachable today (`argv` builds `assembled` by `template.iter()
  .map(…)`, so lengths are equal by construction) — **and it is the same
  shape as the bug T-039 just closed**: a guard that looks like it covers
  a class while silently skipping part of its input. That is why it ranks
  first among the four.
- **T-039-s1 — RULED LIVE BACKLOG, NOT A GATE, and the ruling is the
  point.** Unlike T-025-s6, **nothing has to land for it to be
  reachable.** Verified line by line: `read_cache` (`runner.rs:450`) does
  `serde_json::from_str` → `PathBuf::from(entry.path)` with **zero**
  validation — not absolute, not `..`-free, not name-matched to
  `adapter.binary`, not signature-bound; `resolve_cli` gates it on
  **exactly** `is_executable_file` and then hands it to `probe_version`,
  which does `Command::new(path)` — **so a poisoned `agent-paths.json`
  executes its binary AT RESOLVE TIME, before any turn**, a step sharper
  than the s1 card itself claims. `resolve_cli` runs from BOTH
  `start_genesis` (`mod.rs:278`) and `send_turn` (`mod.rs:375`), so the
  file is read live on every start and every turn. The second half is
  worse: `cli.login_path` becomes the child's `PATH` with **no gate
  whatsoever**, not even an executable bit, because it is a string.
  **The honest counterweight the card omits**: the precondition is write
  access to the user's own app config dir, and anything holding that also
  holds `~/.zshrc`, `~/.claude/settings.json` and LaunchAgents — so this
  is an **equivalent-privilege persistence surface, not a boundary
  crossing**. What lifts it above ordinary backlog is the COMPOSITION it
  names: nputer advertises a six-pattern Bash allowlist as containment,
  **T-025-s4 (parked) already records that those patterns match the
  COMMAND STRING and carry no path scope**, and an ungated cached
  `login_path` silently decides which `git`/`cp` they resolve to. The
  containment nputer advertises is weaker than it reads. **The
  verifier's preference, recorded for the next triage: take the THIRD
  option first — do not cache the `PATH` at all, or validate each element
  absolute** — since that half is both the completely ungated one and the
  cheap one. @human priority call.
- **T-039-s2 — the `model` field rides the same init line unchecked.**
  `classify_line` reads it (`runner.rs:701`), `runner.rs:952-953` copies
  it into `out.model` unvalidated, and the only bound anywhere is
  `MAX_LINE_BYTES` (**1 MiB**) — so ~1 MiB per turn can land in a
  registry file that is otherwise a few hundred bytes. Correctly limited
  (never argv, never a path, serde-escaped) and correctly NOT folded into
  a security task by sympathy.
- **T-039-s3 — the reused variants are honest, and its `StartOutcome`
  half is closer to a precondition than a nicety.** `MalformedStream` and
  `StartOutcome::Error { message }` were reused rather than given new
  arms because `app/src/lib/agent-store.ts` mirrors every Rust variant by
  hand and that file is outside this task's fence — a Rust variant with
  no mirror is drift, and half a mirror is worse than none. Both refusals
  ARE typed and both NAME the reason in a string the user can act on, so
  the criteria are met on their own terms. What the reuse costs is
  MACHINE distinguishability in a UI that does not yet exist. **The
  verifier's sharpening, recorded rather than filed twice: T-029's resume
  screen is exactly where "your saved session is unusable, delete it"
  must read differently from "the registry could not be written", and
  today it can only tell them apart by parsing English.**
- **THE WINDOWS NOTE the verifier chose NOT to file**, recorded here so
  the day this ports it is already known: Windows-reserved device names
  (`NUL`, `CON`, `AUX`, `PRN`, `COM1`, `LPT1`, `nul.txt`) ARE accepted by
  the pattern, and `is_executable_file` returns `true` unconditionally
  under `#[cfg(not(unix))]`. Harmless today — nothing in this tree joins
  the id to a path (it reaches `Command::args` only), Windows is not a
  target, and the effect would be an empty read rather than an
  escalation. Also measured: `--help` says `--resume`'s value may be a
  search term, so a well-shaped id that is not this project's session is
  a search term rather than an error — which is the "shape check, not
  authenticity check" silence the task file already records, bounded by
  the runner's existing start/stall timeouts.

**SUITES ON MERGED MAIN**, all four re-derived here first-hand, fresh
installs, ADR-011 order:
- lib/parser `npm ci` + `npm test` **159/159 (10 files)**, `npx tsc
  --noEmit` clean, `npm run build` clean.
- app `npm install` + `npx tsc --noEmit` clean + `npm run build` exit 0
  (**252 modules**) + `npm test` **483/483 (27 files)** — exactly the
  forecast, since the branch adds no app test and no TS at all. Bundle
  **442.05 kB, `index-DvrlAOQE.js` — byte-for-byte the same asset the
  T-025 and T-037 merges shipped**, which is the correct outcome for a
  branch whose entire payload is Rust.
- app/src-tauri bare `cargo test` **208 passed + 3 ignored**, run
  **three times with identical per-target counts**: lib 100, agent_runner
  **28 + 1 ignored** (was 24 + 1 at T-025 — the four new integration
  tests), 68, 3, 7, 0 + 1, 2 + 1. **THE UNNAMED `agent_runner` FLAKE DID
  NOT APPEAR** — it stays on the books exactly as T-025's merge left it:
  one unreproduced, unnamed red seen once by T-025's verifier. If anyone
  ever sees it, capture the test name and output VERBATIM before
  re-running.
- tools/e2e `npm ci` + `npx playwright test` **17/17 in 4.6s**, headless,
  one worker, its own vite. `npm run lint:tokens` **clean, 37 files**.

**No `fake_agent` orphan survives** (`pgrep -fl fake_agent` empty).
**Nothing here bound or contacted port 1420** — the human's `tauri dev`
is holding it for an open visual session and was never touched; the
runner opens no sockets and no suite starts a server. **No model call
was made anywhere in this merge**: the env-gated `#[ignore]` smoke was
deliberately NOT run and the boot-check was not run.

**THE MERGE WAS CLEAN, AND THE DISJOINTNESS WAS PROVED RATHER THAN
FORECAST.** Branch point `7f5025b`; main had advanced twice underneath
the builder (`97845cf` T-040's `default-run` fix, `2536776` the second
triage). The two changed-file sets were intersected with `comm` and the
intersection is **EMPTY** — a stronger statement than "no conflicts",
because it means no file needed reconciling at all; `git merge-tree` then
produced **zero conflict markers**, re-derived here and not inherited
from the verifier's run. The merge carries **eleven files**: six `.rs`
inside `app/src-tauri/` (`agent/{adapter,mod,runner,sessions}.rs`,
`bin/fake_agent.rs`, `tests/agent_runner.rs`), the task file, and the
four new suggestions. Notably this is the first merge in the project
whose worktree needed no fixture reconciliation whatsoever.

STANDING INTEGRATOR PRACTICE (T-009-s1, the ratified CONVENTIONS interim
regen rule; retires when T-014's `nputer index --check` becomes the
gate) — **FOURTEENTH** exercise, and **IT DID NOT FIRE. Checked from the
merged diff, not assumed** — a no-fire that was verified is worth more
than a no-fire that was skipped, and the verification is what this entry
records. The no-fire is **over-determined, and both halves were proved
separately**:
1. **The trigger is absent.** The rule fires on a merged diff touching
   `*.ts/*.tsx/*.js/*.jsx` outside `docs/`. `git diff --name-only
   2536776..ceb22cc` filtered to those extensions returns **NOTHING** —
   not outside `docs/`, not inside it either. The payload is six `.rs`
   files and five `.md` files. This is the cleanest possible no-fire:
   contrast T-020's merge, whose diff DID carry `.ts` outside `docs/`
   (`tools/e2e/tests/*.spec.ts`) and where the graph stayed put only
   because `tools/` is `.nputerignore`d — a fired-but-no-op, which is a
   different thing and should not be confused with this.
2. **A regen would have been a no-op anyway.** `nputer-index` walks
   `Lang::Ts, Lang::Js` only (`Lang::Rust` exists in the enum but is not
   walked until T-010), so the entire branch is **invisible** to the
   indexer. Derived from the committed graph rather than from the source:
   `languages: ["ts"]`, **88 files, ZERO `.rs` files indexed**. Proved
   positively and non-destructively by running the **plain (non-golden)
   ignored self-check** — `cargo test -p nputer-index --test self_graph
   -- --ignored` → `self_graph_is_current ... ok` — which re-derives the
   graph in memory and compares it to the committed bytes. **The
   committed graph is current on the merged tree.**
`docs/architecture/graph.json` is therefore **byte-identical** to
pre-merge main: sha256
`a433638041054391c98499ab4e7b6809891a30c18df119a4db0a1ed6dfa24789`,
363,994 bytes, still 88 files / 595 symbols / 990 edges, compared as
`git show 2536776:docs/architecture/graph.json | shasum` against the
working file and confirmed equal. **No regen was run, no fixture moved,
and the two app dogfood fixtures and the parser smoke pin were all
correctly left untouched** — the T-024-s5 rule reads the other way here:
no component was declared and no `.ts` moved, so ZERO of the three
registry fixtures move.

INTEGRATOR JUDGMENT CALLS, recorded.
- **ROADMAP: milestone 3's Progress line CHANGED, by one clause, and the
  judgment is worth stating because "unchanged" was the likelier
  answer.** T-039 adds no capability and removes none, so a
  what-can-a-user-do line would not move. But this particular Progress
  line already enumerates the runner's SECURITY mechanism by name ("zero
  new webview grants, zero new crates, and an environment BUILT rather
  than inherited"), so a security fact of this size fits its established
  register, and a reader of ROADMAP alone would otherwise never learn
  that the milestone carried a gate and that it closed. The inserted
  clause states the vulnerability, the fallible-argv fix, both
  boundaries, and that T-029 is no longer held by security debt. **The
  honest remainder is untouched**: T-027, T-028, T-029, plus one observed
  real turn. The milestone is still NOT claimed.
- **ARCHITECTURE: NOT edited, deliberately.** Nothing in the table or the
  Interfaces text became false. C-05's status cell already says the shell
  can spawn the planner; the "Genesis:" line already describes argv as
  "fixed arrays and the user's text on stdin (never a shell string, never
  in argv)" — which T-039 strengthens rather than corrects; the Code
  layout bullet's territory is unchanged (no new file, no new component).
  The note it already carries for T-010 — that FOUR `.rs` files under
  `app/src-tauri/` are claimed by no component — **is still exactly
  right and still exactly four**: this branch modified
  `bin/fake_agent.rs` and `tests/agent_runner.rs` but created no new
  unclaimed file. Editing ARCHITECTURE to narrate a hardening pass would
  be adding history to a document whose job is current shape.
- **NO NEW ADR (three-prong, and it was genuinely close on prong one).**
  The candidate was real and worth stating: **"no infallible path
  assembles an argv"** is a structural discipline, not an implementation
  detail, and it is the kind of thing charter exists for. Ruled
  C-14-LOCAL for now, for three reasons. (a) **It is one function in one
  component.** `AgentAdapter::argv` is the only assembly site in the
  tree; a charter written from a single call site is a charter written
  from a single example. (b) **The principle above it is already
  chartered twice.** ADR-017 clause 2 puts the adapter table — binary,
  argv templates, output format, permission flags — Rust-side as data the
  webview never sees or supplies; ADR-017 clause 4 plus ADR-002 make
  `.nputer/` losable runtime state rather than truth. T-039 is the
  mechanical realization of "a losable runtime file is untrusted input",
  read together with clause 2, rather than a new axis. (c) **PRECEDENT,
  and consistency with it matters here.** T-025's merge faced the same
  question about the env allowlist, ruled it a C-14-local const with a
  source-level pin, and flagged that **it will want a charter when a
  SECOND component spawns agents** — F-04's dispatch through C-02 or
  C-04. T-039's rule is the same category and gets the same answer. **The
  new obligation this creates, recorded so F-04's decomposition meets it
  rather than re-deriving it: there are now TWO C-14-local spawn-hygiene
  rules** — the built-not-inherited environment and the fallible,
  allowlisted argv — and the charter question is "what does spawn hygiene
  mean across components", which should be asked ONCE with both rules in
  hand, not twice. F-04 will assemble argv from worktree paths, branch
  names, task ids and `model@session` strings, all of them file-borne;
  that is the merge point where this stops being one component's choice.
  Prong two, verified as an empty set rather than by eye — `git diff
  --name-only 2536776..ceb22cc` restricted to `method/`, `lib/parser/`,
  `app/src/`, `tools/`, `docs/architecture/graph.json`, `acl_pin.rs`,
  `index_cmd.rs`, `docs_watch.rs`, `lib.rs`, `capabilities/`,
  `tauri.conf.json`, `crates/` and every `Cargo.toml`/`Cargo.lock`/
  `package.json`/`package-lock.json` returns **nothing**. So ADR-012
  held (capabilities still literally `["core:default"]`, `acl_pin.rs`
  zero-diff so `EXPECTED_GRANTS` is untouched), ADR-011 held (zero new
  crates, no lockfile line), ADR-003 held (no API call, `claude` invoked
  only for `--help`/`--version`), ADR-017 clauses 2 and 4 are
  **reinforced**, not contradicted: argv is now not merely un-supplied by
  the webview but un-assemblable without passing the gate, and the
  registry-read refusal tells the user in its own message that the file
  is runtime state, losable by charter. Prong three: the durable calls
  live in the task file's five recorded deviations and three deliberate
  silences.

## In progress / broken right now
**NOTHING IS BUILDING, and the board is idle for the first time today** —
no task is dispatched, no worktree is open. The t039 worktree is removed
and its branch KEPT — **25 task branches on the books now**, every one
the pipeline has ever merged, `t001-app-shell` through
`t039-injection-gate`.
Main tree clean; all four suites green; the token lint green; the
committed graph current and verified so by the self-check rather than by
assumption. The parser re-parses the whole live tree at **0 issues**
(59 tasks, 6 features, 11 components; status tally 26 done / 20 planned /
9 parked / 4 suggested — **zero `building`**).

**THE ONE STANDING RISK IS GONE.** T-025-s6 — "must close before T-029
starts" — is closed, and T-029 is no longer gated by it. Nothing has
replaced it: T-039-s1 is reachable-today backlog rather than a gate
(it needs no future task to turn it on), and T-039-s4 is unreachable by
construction today. **The milestone's remaining holds are design and
human judgment, not security.**

LAUNCH ITEM, carried forward unchanged — **watch the first CI run**
(T-020), no longer gated (T-038 closed the token lint). At the repo's
first push (`git remote -v` is still empty), confirm in order: the ubuntu
apt/webkit2gtk set installs; the three `uses:` SHA pins resolve;
playwright-on-Linux runs the lane; `cargo audit` behaves as it does
locally; the xvfb `tauri dev` boot prints both `[nputer]` startup lines.
AND (T-018-s3 fold) the THREE T-018 SENTINEL LIVE TESTS inside the ubuntu
`cargo test` step — replaced-wholesale and deleted-recreated docs/. They
discriminate only where inotify watches INODES; macOS FSEvents watches
paths and was accidentally resilient, which is why T-018's replace-half
evidence is mechanism-only today. Green there CLOSES that evidence gap;
red there is a real reconcile gap macOS could never surface, and gets
filed immediately. This run also closes T-001/T-003's Linux halves, and
it carries T-026-s1 (the plan probe's exact-case match makes macOS and
Linux disagree about "already has a plan") and T-021-s1 (the ACL pin is
macOS-derived). Since T-025 the ubuntu `cargo test` step also runs the
`agent_runner` integration tests, which spawn real child processes and
send real signals — **now 28 of them, not 24** — the first time this repo
exercises process control on Linux. Watch it, and watch for the unnamed
`agent_runner` flake there too.

## Next up (1–4)
1. **@human — THE VISUAL SESSION IS OPEN RIGHT NOW AND UNCHANGED BY THIS
   MERGE.** The app is RUNNING on port 1420 as this checkpoint lands, and
   T-039 ships **zero UI and zero TS** — the shipped bundle asset is
   byte-identical — so every item below stands exactly as the T-025
   checkpoint left it. **The route to the pane**: "Start an interview" on
   a docs-less folder, or "Start an interview here" on a folder the app
   just refused.
   - **T-024's pane, light AND dark** — the item this session was
     scheduled on: built/forming/slot card contrast in dark, the warm
     writing-row border, the five type sizes that moved 0.5–1px, and the
     substituted footer right slot (`stage ~4 · constraints`).
   - **Two framing questions that exist only because of the mount.**
     (a) T-024 drew the pane as the **RIGHT HALF of a split view**; until
     T-027 it sits **full-width inside T-026's card frame**. Does its
     `bg-sidebar` ground read right framed by a `bg-card` bordered box —
     a sidebar tone inside a card, which the design never draws? And does
     the **five-across backbone grid** still hold at full width when it
     was drawn for a half-width pane? **This is the question T-027's
     planning pass waits on** (see item 2). (b) The slot is `min-h-0
     flex-1` so the pane's own `overflow-y-auto` scrolls — but the
     shell's column is **`min-h-screen`, not `h-screen`**, so at very
     short window heights the page may grow before the pane's own scroll
     region engages. One look at a short window with the complete tree
     loaded.
   - **T-026's front door, light AND dark**: the two-button row and the
     "No plan in &lt;folder&gt;" card against the design's `open a
     folder` screen — button sizes/inks, the checklist ○/✓ (the ✓ rides
     `--review-disc`, whose dark value #4ecf9e is a token-family
     derivation, not measured from a dark mockup), the card's 10px vs the
     design's 12px radius, and whether the footnote reads as a footnote.
   - **The at-a-glance amber judgment** (T-012 criterion 5's human half —
     drift stroke vs building/verifying fills, BOTH schemes, incl.
     composed building+drift; the dogfood hero renders it live). C-05's
     drift count reads **4**.
   - **The launch-shot re-judgment** (T-006's pending screenshot predates
     the rail — light + dark now include it).
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
     checklist, still @human because native dialogs are unreachable from
     a browser harness and tauri-driver has no macOS: "Start an
     interview" → native dialog → a docs-less folder lands on the genesis
     screen; ⌘N and ⌘O on the front door; "Start an interview here" on a
     folder the app just refused; a folder that already has a plan → the
     board, not genesis.
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
     sufficient for a real stage-0 scaffold (which is what T-025-s4 needs
     before it can narrow `Bash(cp:*)` / `Bash(mkdir:*)` safely).
     **T-025-s2 carries the exact command.**
   - **A Linux run** — the "watch the first CI run" item above.
   - **NEW, a priority call rather than a screen action — T-039-s1.**
     The verifier asks the next triage to take the third option first
     (do not cache the `PATH`, or validate each element absolute). See
     the ranked findings above for why it reads sharper than its card.
2. MILESTONE 3 (T-023…T-029 + T-039, ADR-017). **T-029 IS NOW UNGATED**
   — the security hold is discharged. It is NOT unblocked: its
   `blocked_by` is still `[T-027]`, and T-028's is too. **The milestone's
   remaining cards all wait on the human, in this order:**
   (a) **T-027's planning pass waits on the human's split-view verdict**
   (item 1a) — it builds the LEFT half of a composition whose whole
   design question is what the open visual session is judging;
   dispatching a size-L planning pass now would have the planner guess
   the answer the human is mid-way through giving. Its `blocked_by`
   [T-024 ✓, T-025 ✓, T-026 ✓] has been satisfied since T-025 merged.
   (b) **T-041 (shell harness, M, `blocked_by: []`) is the hard gate
   before T-027/T-028/T-029 can write the served-bundle probes they each
   promise** — it is the triage-created task that must land first, and
   like every triage-created task it needs a human nod to dispatch.
   The milestone itself is NOT claimed: the first slice delivers
   hand-driven genesis, the runner exists and is now hardened, but no
   agent loop has ever run against a real model.
3. OVERNIGHT DISPATCH GRANTS (human, 2026-08-16 night): the app-shell
   lane queue was T-021 → T-026 → T-025 → T-022; **T-021, T-026 and
   T-025 are all DONE**, so the standing grant's next named item is
   **T-022** (M, milestone 4, `blocked_by: []`), with T-027 ahead of it
   in milestone order but held for the visual verdict. Triage: APPLY
   granted — but tasks NEWLY created by triage (T-041…T-046) do NOT
   dispatch without the human. Unchanged method rules: a second REJECTED
   on any task parks that lane for the human; @human judgments are never
   self-answered.
4. SUGGESTION BACKLOG — **13 open files, and the shape changed with this
   merge.** The 2026-08-16 second triage took the backlog to its floor:
   nine open suggestions, ALL parked, ALL blocked on something only the
   world can provide (a Linux run, a Windows lane, an authenticated CLI,
   a real project at scale, a responsive requirement, the second
   adapter). **T-039 filed four more — s1, s2, s3, s4 — and they are the
   only UNTRIAGED suggestions on the board.** Three of the four are
   NOT world-blocked, which is new: s1 and s4 are actionable today, and
   s3 has a named home (T-029) but no disposition. They want a triage
   pass; the ranking above is the input to it, not the ruling.
   The nine parked, unchanged: T-003-s2 (a real project near the ~25 MB
   knee), T-008-s1 (F-04/F-05 layout), T-018-s1 (a Windows lane),
   T-021-s1 and T-026-s1 (both await the first Linux run — already on the
   launch item), T-025-s2 (@human, one command on an authenticated
   machine), T-025-s4 (gated by s2 — read together, and now ALSO
   load-bearing for T-039-s1's composition argument), T-025-s3
   (nputer.yaml is F-04 era; its count fix rides T-043), T-038-s1 (no
   responsive call site yet).
   Six triage-born tasks stand ready and un-dispatched: T-041 (shell
   harness — land before T-027), T-042 (genesis switch truthfulness),
   T-043 (kill path: honest grace and honest scope — **its "serialize
   behind T-039 on app-agent" condition is now satisfied**, so app-agent
   is a free lane), T-044 (shell pins cover their surface), T-045 (the
   gates cover the rules), T-046 (the boot check guards a merge — the ONE
   that needs an explicit human nod beyond the standing rule, because it
   has the pipeline start the app). Milestone-4 queue after F-03: T-010,
   T-013, T-014, T-015, T-030…T-035, T-044, T-045, plus T-022.

## Open questions
None.
