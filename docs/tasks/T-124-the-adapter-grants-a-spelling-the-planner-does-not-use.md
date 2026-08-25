---
id: T-124
title: The adapter grants six bare Bash patterns and the planner spells them with a directory flag — the kit's own imperative surface is refused
feature: F-03
milestone: 4
priority: 6
size: M
status: verifying
blocked_by: []
touches: [app-agent]
builder: claude-opus-5
verifier:
built_by:
verified_by:
review:
---

Every source reading below was derived at `45691d9`. The EVIDENCE is the
first real-CLI permission text this project has ever captured — three
refusals on a live genesis turn against `claude` **2.1.226**, 2026-08-24,
recorded in STATE's T-101-look section and reproduced here verbatim.

**THE PLANNER WAS REFUSED ITS OWN GRANTED SURFACE.** `CLAUDE_V1`'s
`spawn_args` in `app/src-tauri/src/agent/adapter.rs` grants exactly six
Bash patterns — `Bash(git init:*)`, `Bash(git add:*)`,
`Bash(git commit:*)`, `Bash(git status:*)`, `Bash(mkdir:*)`,
`Bash(cp:*)` — as T-023's verdict recorded the kit's imperative surface,
spelled BARE. The real planner spells them with a directory flag, and
that form matches none of the six.

## The three captured refusals, and they classify themselves

1. *"This command changes directory before running git, which can execute
   untrusted hooks from the target directory. Approve only if you trust
   it."*
2. *"Redirect target concatenation contains `$`/`` ` `` — unanalyzable gap
   or substitution"*
3. *"This Bash command contains multiple operations. The following part
   requires approval: `git -C <projectdir> status --short`"*

**THEY NAME THEIR OWN MECHANISMS, WHICH IS WHY THIS CARD CAN BE PRECISE
WITHOUT SPENDING A MODEL CALL.** Reason 3 names OUR narrowness: it quotes
the exact command and says it requires approval, and `git -C <dir> status
--short` cannot match a `git status:*` prefix. Reason 1 names the CLI'S
OWN hook-safety heuristic about changing directory before git — a guard
that fires independently of whatever we allowlist. Reason 2 names the
CLI's own command ANALYSER declining to parse a redirect target, on a
write the planner should not have been doing through the shell at all:
`--permission-mode acceptEdits` already auto-accepts that write through
the Write tool, inside the cwd.

**THE FIX IS THEREFORE NOT ONE FIX**, and a change aimed at the wrong
mechanism cannot work — widening `--allowedTools` does nothing about
reason 1, and no argv can teach the planner to prefer the Write tool.

## What it cost, and why it is not cosmetic

Nothing was lost on the observed turn: stage 0 banked in full and the
planner routed around all three refusals, which is T-081's *a denial is
not a death* holding against a real model. **The cost is that the genesis
loop runs DEGRADED** — the planner works around grants it was given,
every refusal spends a turn's reasoning, and the six patterns that
document the kit's imperative surface describe a surface the planner does
not reach. The gap is visible at all only because T-101 put the notice on
screen; before that it was invisible by construction.

## Acceptance criteria

- **EACH CAPTURED REFUSAL SHALL BE CLASSIFIED BY MECHANISM FROM ITS OWN
  TEXT, and the classification SHALL drive the fix** — ours (the
  allowlist), the CLI's own safety heuristic, or the CLI's own analyser.
  The classification SHALL be recorded where the grants live, not only in
  the notes.
- **FOR REFUSALS CAUSED BY OUR OWN NARROWNESS the patterns SHALL be
  widened MINIMALLY and the widening SHALL be pinned.**
  `no_adapter_argv_can_ever_bypass_permissions` SHALL be re-run and shown
  still green, and any pattern admitting a path ARGUMENT rather than a
  fixed verb SHALL carry the reason it is safe — a grant that matches an
  arbitrary directory is a wider grant than the one it replaces, and
  ADR-012's narrowness lives in the signature.
- **FOR REFUSALS CAUSED BY THE CLI'S OWN GUARDS THE FIX IS A PLANNER
  INSTRUCTION AND NOT AN ARGV CHANGE**, and it is OUTSIDE this fence: the
  kit is `method/roles/planner.md` + `method/interview/plan-interview.md`,
  and editing them is a method version bump whose third file is Rust
  (CONVENTIONS' first gotcha, `METHOD_SNAPSHOT_VERSION` in
  `app/src-tauri/src/agent/kit.rs`). It SHALL be routed with the exact
  proposed wording — run git bare in the cwd, which IS the project; write
  files with the Write tool rather than a shell redirect — naming **T-104**
  as the vehicle that already owns the owed bump to v0.1.6.
- **WIDENING SHALL NOT BE THE DEFAULT ANSWER.** IF the honest conclusion
  is that no argv change helps THEN this card SHALL land the
  classification, the routed instruction change and the pins, and SHALL
  say plainly that the adapter did not move. A card that widens a grant
  to look productive has made the app less safe for nothing.
- **A FIXTURE SHALL CARRY THE REAL REFUSAL TEXT.** These three reasons
  are the first real-CLI permission text this project holds, and nothing
  in the suite can regenerate them: `real_cli_arms_forbidden` forbids a
  test from resolving the user's CLI, by construction and on purpose
  (T-047-s6, T-060). The fixture is therefore the only durable form, and
  it SHALL be reachable by the runner's own classification bodies rather
  than pasted into a comment.
- **THE SPELLING-SENSITIVITY SHALL BE STATED WHERE THE GRANTS ARE.**
  `adapter.rs`'s header enumerates the six patterns with T-023's
  reasoning and reads today as though the surface were reachable. It
  SHALL record that the grant is spelling-sensitive, and that a planner
  writing `git -C <dir> …` reaches none of it.
- IF the widened patterns change what a turn can do THEN the change SHALL
  be visible in the `permission_denials` a fixture drives, so the
  before/after is a measured difference and not an assertion about the
  real CLI.

Verification: headless — bare `cargo test` from app/src-tauri
(`--no-fail-fast`, exit read unpiped from `$?`, the total summed from the
`test result:` lines). **POISON DRILL on every new or changed assertion,
one side only**, producer mutated and never the assertion, each mutated
text read back with `git diff` before its run, restores proved per-path
by sha256 against the drill's own commit, in a detached scratch worktree
with its own `CARGO_TARGET_DIR` inside it (arm (c)) and named for this
card rather than the shared literal `drill` (T-088-s3). Then the shape-six
check on each new body. BOOT GATE fires on `app/src-tauri/**` — run it on
a scratch port and record the exit and both `[nputer]` lines. DOCS GATE
fires on this card; ask it directly, never through `xargs`. **A real-CLI
probe is PERMITTED but NEVER REQUIRED and is never a test** — it spends
the user's own model call, and every criterion above is satisfiable from
the captured text. @human: none.

## Implementation notes

Built by `claude-opus-5 @T-124` on `task/T-124-adapter-spelling`, base
`c4cfe52`, tip `82eb2ed` + this commit. Every figure re-derived at this
lane's own ref. **No real CLI was spawned and no model was called** — the
card's own note that every criterion is satisfiable from the captured
text held, and nothing here needed the probe.

### THE ADAPTER DID NOT MOVE, AND THAT IS THE FINDING

`CLAUDE_V1::spawn_args` is byte-identical to what T-023's verdict
recorded. Not one of the six patterns changed. The card asked for that
possibility in advance (*"WIDENING SHALL NOT BE THE DEFAULT ANSWER"*) and
it is the honest answer, for a reason that is measured rather than
preferred:

**THE ONE REFUSAL THAT IS OURS IS THE SAME COMMAND A CLI GUARD REFUSES
INDEPENDENTLY.** Refusal 1 establishes that this CLI carries a
hook-safety heuristic on directory-changing git which fires whatever we
allowlist. Refusal 3's command IS directory-changing git. So any pattern
admitting it would still meet refusal 1's guard: **the widening would be
both wider and ineffective**, which is a stronger reason to decline than
"we prefer narrowness". Note the argument does not need the two refusals
to have been the same tool call — only that the guard exists and that
refusal 3's command is in its class, both of which the captured text says
directly.

And the patterns that COULD admit it are worse than the gap. `Bash(git
-C:*)` grants every git subcommand in every directory on disk (`push`,
`reset --hard`, `clean -fdx`). A runtime-substituted project path would
put a `/`-bearing user-controlled string into a permission grant — the
class `validate_session_id` refuses from argv on purpose — and would need
a second substitution slot that `check_no_data_borne_flag` has no way to
vouch for. ADR-012's narrowness lives in the signature, and there is no
narrow spelling of "this directory".

### Criterion by criterion

1. **Each refusal classified by mechanism from its own text, recorded
   where the grants live** — MET. `adapter::OBSERVED_PLANNER_REFUSALS`
   sits directly under `CLAUDE_V1`/`planner_adapter`, carrying each
   reason with `RefusalMechanism` (`CliSafetyHeuristic` /
   `CliCommandAnalyser` / `OurAllowlist`), `RefusalRemedy` and the `why`.
   It is DATA, not prose: `every_captured_refusal_is_classified_and_none_is_fixed_by_argv`
   pins three distinct mechanisms and exactly one `OurAllowlist`.
2. **Minimal widening, pinned; `no_adapter_argv_can_ever_bypass_permissions`
   re-run green** — MET BY DECLINING, per criterion 4. Nothing was
   widened, so no pattern admits a path argument; the fixed-verb property
   is now asserted (with the two rejected widenings as the control that
   proves the check can fail). The bypass pin is green in every run below.
3. **CLI-guard refusals routed as a planner instruction with exact
   wording, naming T-104** — MET, as `T-124-s1`, with the two proposed
   texts (`method/roles/planner.md` step 1; the stage-0 row in
   `method/interview/plan-interview.md`) quoted ready to paste. **Not
   edited here**: `method/` is out of this fence, a method FORMAT change
   is a three-file commit whose third file is Rust
   (`METHOD_SNAPSHOT_VERSION`), and `method/` was T-052's live fence while
   this lane ran.
4. **Widening is not the default; say plainly if the adapter did not
   move** — MET. It did not move. Said plainly here, in the commit
   subject, and in the header.
5. **A fixture carries the real refusal text, reachable by classification
   bodies rather than pasted into a comment** — MET.
   `OBSERVED_PLANNER_REFUSALS` is `pub const` data read by two bodies in
   two files.
6. **The spelling-sensitivity stated where the grants are** — MET. The
   `--allowedTools` bullet in `adapter.rs`'s header now says the grant is
   a prefix over a fixed verb, that it covers a command's TEXT and not
   its EFFECT, and that `git -C <dir> …` reaches none of it.
7. **IF the widened patterns change what a turn can do THEN the change
   SHALL be visible in the `permission_denials` a fixture drives** —
   **DISCHARGED VACUOUSLY, and deliberately.** The antecedent is false:
   no pattern was widened, so no turn can do anything it could not do
   before, and there is no before/after difference for a fixture to show.
   Building one would have measured a difference that does not exist.

### THE CARD'S OWN "FIRST AND ONLY" CLAIM IS FALSE, AND THE ERROR IS USEFUL

The card says these three reasons *"are the first real-CLI permission
text this project holds"*. **They are not.**
`docs/research/captures/real-planner-turn-2026-08-19.jsonl` — tracked,
five days older, same CLI **2.1.226** — carries two real
`permission_denied` messages, one of them a `subcommandResults` refusal.
STATE at `45691d9` makes the narrower claim that is true: 2026-08-24 was
the first time the GENESIS LOOP ran against a real model; the 2026-08-19
capture came off a scripted lane.

**THE ERROR PAID FOR ITSELF.** That older capture is the only thing in
this repository that can corroborate any of the three, and it does:
refusal 3's first **85 bytes** are byte-identical to the capture's own
denial message, which is what
`the_2026_08_24_transcription_agrees_with_the_2026_08_19_capture` asserts
against the file. It also settles the one transcription question the
rendered form leaves open — **the capture carries no backticks**, so the
backticks in the card's quotations are the transcriber's markdown and the
const strips them. Two of the three reasons remain uncorroborable by
construction and the body says so out loud rather than implying it
checked all three.

### What was pinned, and the one thing that was NOT duplicated

`allowed_tools_are_exactly_the_kits_imperative_surface` already pins the
exact six patterns, so a second body asserting "the six did not change"
would kill no mutant it does not already kill — **poison shape six, and
it was declined rather than written.** The new bodies assert what nothing
else does: that a command's TEXT reaches or misses a grant, and that the
classification says what it says.

### Suites and gates, every exit read UNPIPED off `$?` on the next token

| command | where | exit |
|---|---|---|
| `npm ci` + `npm run build` | `lib/parser` | 0, 0 |
| `npm ci` | `tools/e2e` | 0 |
| `npm install` + `npm run build` | `app` | 0, 0 |
| `cargo test --no-fail-fast` | `app/src-tauri` | **0** |
| `cargo run -p nputer-index -- index --check --root ../..` | `app/src-tauri` | **1 — STALE** |
| `NPUTER_BOOT_PORT=15130 npm run boot:check` | `tools/e2e` | **0** |
| `node tools/e2e/scripts/docs-gate.mjs <5 paths>` | repo root | **1 — FIRES** |
| `npx vitest run` | `lib/parser` | **0** — 264/264 across 12 files |
| `npm test` | `app` | **0** — 958/958 across 46 files |
| `NPUTER_E2E_PORT=15132 npm test` | `tools/e2e` | **0** — 145/145 |
| `npm run lint:tokens` | `tools/e2e` | **0** — clean, TOKEN 131 / CONTROL 659 |

**cargo: 421 passed / 0 failed / 3 ignored, exit 0**, summed over **15**
`test result:` lines. That is STATE's 418 plus this lane's three new
bodies (418 + 3 = 421). **`T-088-s4`'s known watcher flake did NOT fire
on this run** — recorded as one more data point on an honest tally,
not as a claim that it is fixed.

### THREE STANDING GATES, DERIVED FROM THIS LANE'S OWN 4 PATHS

    git merge-tree --write-tree c4cfe52 HEAD -> efc07702…, exit 0 (read from $? FIRST)
    git diff --name-only c4cfe52 <TREE>      -> 4   THE PRESCRIBED FORM

| gate | trigger | on these 4 |
|---|---|---|
| GRAPH REGEN | `*.ts/*.tsx/*.js/*.jsx` **or `*.rs`** outside `docs/` | **2 — FIRES** |
| BOOT GATE | `app/src-tauri/**`, `app/src/**`, either manifest | **2 — FIRES** |
| DOCS GATE | a `docs/` path a code suite reads | **2 — see below** |

- **GRAPH REGEN — FIRES, and it was ASKED rather than predicted.**
  `index --check` is **exit 1, STALE**: committed **895 891 bytes · 172
  files · 1889 symbols · 1849 edges**, fresh **898 082 · 172 · 1897 ·
  1849** — `+8 symbols, +0 edges, +0 files`, two files `~`
  (`adapter.rs` loc 1319→1707 symbols 24→31, `agent_runner.rs` loc
  4517→4607 symbols 118→119). **The regen belongs to the INTEGRATOR at
  the checkpoint and was NOT run here.** The `.rs` trigger (`e1f3023`)
  earned its keep on its first lane: a suffix list narrower than the walk
  would have missed all eight symbols. Post-regen the graph would sit at
  **89.81%** of `max_graph_bytes` with **101 918** bytes of headroom.
- **BOOT GATE — FIRES on 2 of 4, RUN, exit 0**, scratch port **15130**.
  Both lines: `[nputer] project folder:
  /Users/ujju/Projects/nputer/tools/nputer-T-124` and `[nputer] window
  "main" created`.
- **DOCS GATE — exit 1**, invoked DIRECTLY with the five paths as
  ARGUMENTS, ROOT-RELATIVE, never through `xargs`, with every new file
  `git add`ed first (`T-010-s10`'s hole worked around rather than walked
  into). **3 of 5 under `docs/`, THREE suites owed** — `npm test` from
  `app/`, `npm test` from `tools/e2e/`, `npx vitest run` from
  `lib/parser/`; all three run and green above. The gate reports **12
  derived readers across 4 suites** and **0 frontmatter issues**, and
  says *"every live task card's frontmatter parses, with a legal
  status"* — which is this card's `verifying` stamp checked rather than
  assumed. `cargo test from app/src-tauri/` is not owed BY THE DOCS GATE
  (the capture it reads is not in this diff) and is owed anyway by the
  Rust in it; it ran.
- **A SECOND CLIMB SITE INTO THE CAPTURE IS NOW REPORTED**, at
  `agent_runner.rs:1993` beside the existing `:1880`. Both resolve to
  `docs/research/captures/real-planner-turn-2026-08-19.jsonl`. This lane
  adds a reader of a file that was ALREADY a `cargo test` docs input, so
  it adds no new suite to any future diff's obligations.

### THE E2E SUITE RED ONCE AND IT WAS MINE — recorded, not re-run away

**Run 1: exit 1, 1 failed / 144 passed.** The failure was
`tools/e2e/tests/token-scan.spec.ts:201` — *"P6 reds a planted bare
motion utility and leaves its motion-safe twin alone"* — at its MTIME
assertion, the one T-079 added five commits ago. **I caused it**: I ran
`npm run lint:tokens` in the same package while that suite was mid-plant.
The same concurrent command failed with `EJSONPARSE ... Unexpected
non-whitespace character` on `tools/e2e/package.json`, because T-058's
control-byte body had its own plant in that file at that instant.

**Run 2, with nothing else touching the tree: exit 0, 145/145** — the
exact count STATE records at `c4cfe52`, and `git status` over
`tools/e2e/` was clean before it. So the red was contention, not a
defect, and both runs are reported rather than the good one alone.

**IT IS A THIRD FACE OF `T-079-s3`, AND WORTH THE LINES.** That
suggestion says a plant-and-restore restores the bytes and not the clock,
and that a LATER reader can see it. This is the hazard from a third
direction: a CONCURRENT reader sees the planted state directly, in a
window the plant fully intends to close. Nothing is wrong with the
bodies; what is missing is that running any other command inside
`tools/e2e/` while its own suite runs is unsafe by construction, and
nothing says so where someone about to do it would read it. **Not filed
as a new suggestion** — it is the same finding `T-079-s3` already owns,
and it belongs in that file's next reading rather than in a fourth one.

**AND I MISREAD RUN 1'S EXIT BEFORE I CAUGHT IT.** The backgrounded
wrapper reported "exit code 0" while the suite's own `E2E EXIT=$rc` line
said **1**. What caught it was the COUNT not matching STATE's 145 — not
the exit I had just read. That is the brief's own warning ("reading an
exit through a pipe gives you the pipe's") arriving by a different route:
a wrapper's exit is not the command's either. **Derive the count as well
as the exit; they fail independently.**

### The poison drill — SEVEN MUTATIONS, SEVEN REDS

Detached scratch worktree **`drill-T-124`** at **`82eb2ed`**, created
OUTSIDE the repository at `/Users/ujju/Projects/drill-T-124`, with its
own `CARGO_TARGET_DIR` at `.drilltarget-T-124` INSIDE it (arm (c)) —
driver `drill-T-124-driver.py` and results `drill-T-124-results.txt`,
both named per-lane (T-088-s3). **ONE SIDE ONLY**: every mutation edits a
PRODUCER — `granted_prefix_reached` or the `OBSERVED_PLANNER_REFUSALS`
const — never an assertion and never a literal the two share. Each was
read back with `git diff` BEFORE its run. Every restore proved by sha256
`ffe7a27314cdcdcad873d0324d71804c5ccfa6ee06ee68dec2a6dd94a6a63e67`
against the drill's own commit.

| # | mutation (producer only) | lib | agent_runner |
|---|---|---|---|
| M1 | `granted_prefix_reached` forgets the word boundary | **RED** 159/1 | green |
| M2 | it is widened to a token subsequence, so `git -C <dir> status` matches `git status` | **RED** 158/2 | green |
| M3 | the one refusal that is OURS is reclassified as the CLI's | **RED** 159/1 | **RED** 75/1 |
| M4 | the transcribed CLI sentence is paraphrased (`requires`→`needs`) | **RED** 159/1 | **RED** 75/1 |
| M5 | a refusal claims an argv change would fix it | **RED** 159/1 | green |
| M6 | one captured refusal is DELETED (poison shape five) | **RED** 159/1 | **RED** 75/1 |
| M7 | **shape-six discriminator** — `Bash`→`bash`, one character | **GREEN 160** | **RED** 75/1 |

**M2 IS THE ONE WORTH CARRYING FORWARD**: it is a plausible
implementation of the widening this card declined, written as a mutant,
and it reds both new adapter bodies. The rejected fix is now a killed
mutant rather than a paragraph.

**M7 ANSWERS THE SHAPE-SIX QUESTION WITH A MEASUREMENT.** Every other
mutant that reds the transcription body also reds the classification
body, which is exactly the shape a duplicate wears. M7 separates them: a
ONE-CHARACTER paraphrase that leaves the classification body's own
phrases (`requires approval`, `unanalyzable`) intact leaves the lib suite
**GREEN at 160** and reds only the transcription body, against real
captured bytes. The transcription body therefore kills a mutant nothing
else kills. CONVENTIONS says shape six *"has no mechanical remedy — the
drill has to ASK"*; this is the asking.

**M6 IS THE SHAPE-FIVE GUARD, PROVED BY DELETION** rather than claimed:
removing a refusal reds the cardinality floor instead of quietly shrinking
a printed number.

### Ports and the human's running app

Port **1420** was read with `lsof -nP -iTCP:1420 -sTCP:LISTEN` and
nothing else — no bind, no connect, no signal, on any interface.

**ITS HOLDER CHANGED UNDER THIS LANE, WHICH IS WHY THE RULE SAYS RE-READ
RATHER THAN QUOTE.** It was `node` pid **82549** at the start (the pid
STATE records) and `node` pid **88948** at the end, with
`target/debug/nputer` at pid **89201**, both started **10:54:32–33**.
**IT IS NOT THIS LANE**, and that is derived rather than hoped: the new
vite runs from `/Users/ujju/Projects/nputer-app/app/node_modules/.bin/vite`
— a DIFFERENT checkout, the detached `nputer-app` worktree that appeared
in `git worktree list` during this lane. The live dev app was relocated
to its own worktree by someone else. This lane never wrote outside
`/Users/ujju/Projects/nputer/tools/nputer-T-124`.

Scratch ports **15130** (boot gate), **15131** and **15132** (e2e), all
inside the 15130–15134 range, were each `lsof`ed FIRST (zero rows) and
then bind-confirmed free on `127.0.0.1`, `0.0.0.0`, `::1` and `::` in
that order and never the reverse; all three were free again after. **No
`pkill` at any point.** No sibling worktree was touched, and the
untracked `z` in the main checkout was left alone.

**THE LANE WORKTREE IS INSIDE THE REPOSITORY AND SHOULD NOT BE.**
`/Users/ujju/Projects/nputer/tools/nputer-T-124` violates
`method/lane-protocol.md` rule 3 (a lane worktree is a SIBLING of the
repository, never a path inside it). The dispatcher cut it with a
relative path from `tools/e2e` and has owned the error; it is recorded
here because the lane's own report is where a reader will look for it.
Nothing was polluted — `tools/` is `.nputerignore`d so the indexer never
walks it, and the token lint is clean at CONTROL 659 — but the drill
worktree was deliberately placed OUTSIDE the repository at
`/Users/ujju/Projects/drill-T-124` rather than inheriting the mistake,
and every `git add` in this lane named its paths explicitly (never
`-A` at the root, never `commit -a`), because three sibling lane
directories now sit under `tools/` where a broad add would stage them.

### Two findings routed out of fence

- **`T-124-s1`** — the exact planner wording, for T-104's owed v0.1.6
  bump. Carries a number this card did not claim: **all four git grants
  are lost to the `-C` spelling**, not merely `git status`, so the
  banking boundary (`git add` / `git commit`) is as unreachable as the
  scaffold's `git status`.
- **`T-124-s2`** — **the app renders the CLI's real permission text and
  banks none of it.** `sessions::TranscriptLine` is
  `{turn, role, text, atMs, machine}`; `git grep -c denial
  app/src-tauri/src/agent/sessions.rs` is **0**; `TurnError::ToolDenied`
  persists tool NAMES only. The denial `message` reaches the pane and
  nothing else. This card's evidence exists because a human retyped it
  off a screen — which is why two of three reasons can never be
  corroborated.

## Verdicts

2026-08-25 — claude-opus-5 @T-124-verify (verifier, same-model as
builder): **APPROVED**

Read BOUNDED, by the ruling on T-121 arm 2: the spec was read at its base
ref (`git show c4cfe52:docs/tasks/T-124-…`), the attack was formed and RUN
from that alone, and the lane's own copy and notes were opened only
afterwards to check the EVIDENCE half. Every figure below is re-derived at
main `ce8b8e7` / tip `e896865`. Two findings routed as `T-124-s3` and
`T-124-s4`; neither blocks.

### DECLINING TO WIDEN WAS CORRECT, ARGUED FROM MY OWN ANALYSIS

The card's fourth criterion makes "the adapter did not move" a legal
outcome, so the thing to rule on is not whether a fix was applied but
whether the refusal was right. **It was, and it does not need the lane's
own strongest argument to be right.**

The grants are prefixes over fixed verbs. The only patterns that could
admit `git -C <dir> status --short` are two, and both are worse than the
gap:

1. **`Bash(git -C:*)`.** A `Bash(<prefix>:*)` grant covers a command's
   text from its first byte, so this admits `git -C <anywhere>
   <any-subcommand>` — `push`, `reset --hard`, `clean -fdx`, in every
   directory on disk. It replaces four verb-scoped grants with one grant
   over an arbitrary directory AND an arbitrary subcommand. That reaches
   OUTSIDE the project, which is precisely what the deliberate absence of
   `--add-dir` and the cwd scoping of `--permission-mode acceptEdits`
   were chosen to prevent.
2. **A runtime-substituted project path.** Not expressible without
   changing what `spawn_args` IS: it is `&'static [&'static str]`, so a
   project path needs a second substitution slot beside
   `SESSION_ID_SLOT`, carrying a `/`-bearing user-controlled string into
   a permission grant that `check_no_data_borne_flag` has no rule for.
   This is a TYPE-LEVEL argument, not a taste one.

And a third fact makes both unnecessary rather than merely unattractive:
**the bare twin is already granted.** `git status --short` reaches
`Bash(git status:*)` and the planner's cwd already IS the project
directory, so an instruction costing ZERO grant surface reaches the same
operation. When one remedy costs nothing and the other costs an
arbitrary-directory git grant, ADR-012's narrowness settles it without
needing any claim about the CLI's internals.

**I ALSO CHECKED WHETHER A NARROW SPELLING EXISTS AND IT DOES NOT.** A
literal like `Bash(git -C . status:*)` would only help a planner told to
write `git -C .` — at which point telling it to write bare `git` is
strictly better and cheaper. A settings- or hook-based rule needs
`--settings`, which this adapter deliberately does not pass (the user's
CLI configuration is the user's). There is no expressible pattern that
admits the operation without admitting the directory.

**WHERE I DIVERGE FROM THE LANE'S REASONING** — recorded because a
verdict that only agrees is worth less. The lane leads with "refusal 1's
hook-safety guard fires independently of the allowlist, so a widening
would be wider AND ineffective." That is an inference about the CLI's
internal ordering which the captured text does not establish, and the
command behind refusal 1 was never recorded. The lane's card hedges one
link of it; `adapter.rs`'s comment states it flat. The CONCLUSION is
unaffected — arguments 1–3 above are independent of it — so this is
`T-124-s4`, not a rejection.

### CRITERION BY CRITERION, WITH THE ATTACK

1. **Classified by mechanism from its own text, recorded where the grants
   live — MET.** `adapter::OBSERVED_PLANNER_REFUSALS` sits under
   `CLAUDE_V1`, `pub const`, three entries, three distinct
   `RefusalMechanism` values, exactly one `OurAllowlist`. Attacked by
   mutating the classification: **M3** (the OURS entry reclassified) reds
   two bodies in two files; **M5** (one refusal deleted) reds the
   cardinality floor. Each `reason` is checked to contain the phrase its
   classification turns on.
2. **Minimal widening, pinned; the bypass pin re-run green — MET BY
   DECLINING.** Antecedent false. Checked positively rather than waved
   through: the `CLAUDE_V1` const block is **byte-identical** to main's
   (sha256 `2130e3f386d39a064d850ab7aac551618a7534b55ce2733c57b8ff3e36a0cd54`
   at `ce8b8e7` and at `e896865`, `cmp` exit 0), which covers all six
   grants, both templates and `--disallowedTools`.
   `no_adapter_argv_can_ever_bypass_permissions` is byte-identical too
   (`cmp` exit 0 over the whole body) and green in every run below. The
   lane goes further than the criterion asks and ASSERTS no grant prefix
   contains `/` or ` -`, with the two rejected widenings as the control
   that proves the check can fail.
3. **CLI-guard refusals routed as a planner instruction, exact wording,
   naming T-104 — MET.** `T-124-s1` carries both texts ready to paste and
   names T-104. Verified against the tree rather than the claim:
   `docs/tasks/T-104-…` is live at `status: planned` with
   `touches: [method/, docs/CONVENTIONS.md, app-agent]` — the three-way
   fence a method bump needs, including the Rust third file.
4. **Widening is not the default; say plainly if the adapter did not move
   — MET.** Said in the header, in the const's doc comment, in the notes
   and in the commit subject. **One imprecision worth a reader's
   attention:** `adapter.rs` gained 388 lines, so "the adapter did not
   move" is true only of the ARGV — every instance in this card scopes it
   to `spawn_args` in the same breath, which is why it is noted and not
   filed.
5. **A fixture carries the real refusal text, reachable by the
   classification bodies — MET.** `pub const` data read by bodies in two
   files, never a comment. Attacked with **M6**, a ONE-CHARACTER
   paraphrase (`This Bash command` → `This bash command`): the lib suite
   stays **GREEN at 160** and only
   `the_2026_08_24_transcription_agrees_with_the_2026_08_19_capture` reds,
   against real captured bytes. **The lane's shape-six claim reproduces
   under my own mutant** — that body kills a mutant nothing else kills.
6. **Spelling-sensitivity stated where the grants are — MET.** The
   `--allowedTools` bullet now says the grant is a prefix over a fixed
   verb, covers TEXT and not EFFECT, and that `git -C <dir> …` reaches
   none of the six — with the sharper number the card itself did not
   claim, that ALL FOUR git grants are lost to that spelling.
7. **IF the widened patterns change what a turn can do THEN … — VACUOUS,
   and honestly so.** Nothing widened; a before/after fixture would have
   measured a difference that does not exist.

### THE SECURITY SWEEP — ALL CLEAR, BY MEASUREMENT

The subject is a permission allowlist for a spawned process, so this pass
is the centre of gravity and every line is a measurement.

- **The six grants are byte-identical to main's** — the `CLAUDE_V1` block
  `cmp`s clean, sha256 `2130e3f3…` both sides. `--disallowedTools
  WebFetch WebSearch` is inside that block and therefore unmoved.
- **`no_adapter_argv_can_ever_bypass_permissions` still means what it
  says** — the body is byte-identical, and so is everything it reads:
  `all_argv_strings()`, `ADAPTERS` (still one entry), `CLAUDE_V1`.
- **No pattern admitting a `/`-bearing or user-controlled string entered
  argv.** Nothing entered argv at all. `spawn_args` remains
  `&'static [&'static str]` with `SESSION_ID_SLOT` as its only slot.
- **Nothing new reaches the child's environment.**
  `app/src-tauri/src/agent/runner.rs`, which owns `ENV_ALLOWLIST`, is a
  **0-file diff** — sha256
  `43b3d72bab5e055451f574d46d494004bbf5449c4c1d2aeb6fddf5f760426009` at
  both ends.
- **`acl_pin.rs` is a 0-file diff at its pinned 92-grant hash** — sha256
  `8d24cbad706d9e6f09eca6888cf8a21d264039cac6153271093ea4847b60b00e`,
  `EXPECTED_GRANTS` counted at **92** at the tip.
- **No new webview surface.** Zero `#[tauri::command]` and zero
  `generate_handler!` lines in the added diff; the new types are not
  reachable from the webview.
- **No new input path.** `granted_prefix_reached`, `bash_grant_prefix`
  and `allowed_tools()` are `pub` but have **no production caller** — a
  grep over the tree finds only the two adapter bodies and one
  `agent_runner` body. No argv, spawn or permission decision reads them.
- **No dependency added** — zero manifests or lockfiles in the diff.
- **No secret, key, path or user identifier in the diff.** The one path
  shaped string in the new const is the transcriber's redaction
  `<projectdir>`, declared as such.
- **THE MUTANT THAT MATTERS: a quiet widening cannot pass.** **M2**
  replaced `Bash(git status:*)` with `Bash(git -C:*)` in `spawn_args` —
  exactly the change this card claims it declined — and it reds **FOUR**
  bodies, including `allowed_tools_are_exactly_the_kits_imperative_surface`
  and `resume_substitutes_one_argv_element_and_spawn_carries_none`. The
  worst outcome available on this card is ruled out by measurement, not
  by reading.

### SUITES — every exit read UNPIPED off `$?`, and every COUNT derived

| command | where | exit | count |
|---|---|---|---|
| `cargo test --no-fail-fast` ×4 | lane `app/src-tauri` | **101 once, 0 three times** | **420/1/3 once, 421/0/3 three times**, 15 `test result:` lines each |
| `cargo run -p nputer-index -- index --check --root ../..` | lane `app/src-tauri` | **1 — STALE** | see GRAPH REGEN |
| `npx vitest run` | lane `lib/parser` | **0** | 264/264 across 12 files |
| `npm run build` | lane `app` | **0** | — |
| `npm test` | lane `app` | **0** | 958/958 across 46 files |
| `NPUTER_E2E_PORT=15170 npm test` | lane `tools/e2e` | **0** | 145/145 |
| `npm run typecheck` | lane `tools/e2e` | **0** | — |
| `npm run lint:tokens -- --selftest` | lane `tools/e2e` | **0** | 65 TOKEN + 4 CONTROL samples, 87 walk-policy, 9 evidence-floor |
| `npm run lint:tokens` | lane `tools/e2e` | **0** | clean, **TOKEN 131 / CONTROL 659** |
| `npm run lint:docs` | lane `tools/e2e` | **0** | whole-tree half, no diff judged |
| `NPUTER_BOOT_PORT=15171 npm run boot:check` | lane `tools/e2e` | **0** | both `[nputer]` lines |
| `node tools/e2e/scripts/docs-gate.mjs <5 paths>` | lane root | **1 — FIRES** | 3 suites owed |

**THE CARGO SUITE IS NOT 421/0/3; IT IS A RANGE, AND STATING THE RANGE IS
THE MORE TRUE OF THE TWO.** The first full run came back **420 passed / 1
failed / 3 ignored, exit 101**, on
`a_result_only_denial_is_a_live_event_and_is_not_repeated_in_the_tail` —
T-113's body, failing on its POSITIVE CONTROL with an empty `stderr_tail`.
**IT IS NOT THIS LANE'S**, derived rather than hoped: `runner.rs`, which
owns the stderr ring and the `ExitNonZero` path, is a 0-file diff. Green
6/6 in isolation, 14/14 as a target on the lane's Rust and 14/14 on
MAIN's Rust in a detached worktree. **`T-088-s4`'s watcher flake did NOT
fire in any of my four full runs**; this is a SECOND, previously unfiled
intermittent, and it is `T-124-s3`.

**AND THE WRAPPER'S EXIT WAS 0 WHILE CARGO'S WAS 101** — the same trap
the lane's own notes record, met from the other side. The count is what
caught it: 420 against the 421 the lane reports. Derive the count as well
as the exit.

### THE THREE STANDING GATES, DERIVED AT MY OWN REF FROM 5 PATHS

    git merge-tree --write-tree ce8b8e7 e896865 -> b239d367…, exit 0 (read from $? FIRST)
    git diff --name-only ce8b8e7 <TREE>         -> 5   THE PRESCRIBED PRE-MERGE FORM

**FIVE, not the four the notes' gate table states.** No contradiction —
that table was derived at the intermediate commit `82eb2ed`, before the
card itself joined the diff — but the same section then says "3 of 5"
four bullets later, and a reader meeting both will have to work that out.
Re-derive; do not quote either.

**THE RANGE HAZARD, NAMED: `merge-tree` reads COMMITS and the docs gate
reads the INDEX.** Both were run inside the lane worktree, where `git
status --short` is EMPTY — index, commit and working tree agree — so the
two requirements coincide here and the gate's answer is about the same
tree the forecast is about. On a dirty worktree they would not.

| gate | trigger | on these 5 |
|---|---|---|
| GRAPH REGEN | `*.ts/*.tsx/*.js/*.jsx` **or `*.rs`** outside `docs/` | **2 — FIRES** |
| BOOT GATE | `app/src-tauri/**`, `app/src/**`, either manifest | **2 — FIRES** |
| DOCS GATE | a `docs/` path a code suite reads | **3 — FIRES** |

- **GRAPH REGEN — FIRES on 2, ASKED rather than predicted.**
  `index --check` exit **1, STALE**: committed **895 891 bytes · 172
  files · 1889 symbols · 1849 edges**, fresh **898 082 · 172 · 1897 ·
  1849**; `files +0 -0 ~2`, `adapter.rs` loc 1319→1707 symbols 24→31 and
  `agent_runner.rs` loc 4517→4607 symbols 118→119. Identical to the
  lane's figures. **The regen is the INTEGRATOR's at the checkpoint and
  was NOT run here** — `docs/architecture/graph.json` is correctly absent
  from this diff. This is the first lane on which `e1f3023`'s `*.rs`
  clause does real work, and it earned it: without `.rs` the trigger
  would match 0 of 5 while the graph moved by 8 symbols.
- **BOOT GATE — FIRES on 2, RUN, exit 0**, scratch port **15171**.
  `[nputer] project folder: /Users/ujju/Projects/nputer/tools/nputer-T-124`
  and `[nputer] window "main" created`.
- **DOCS GATE — exit 1**, invoked DIRECTLY with the five paths as
  ROOT-RELATIVE arguments, never through `xargs`. **3 of 5 under
  `docs/`, THREE suites owed** — `npm test` from `app/`, `npm test` from
  `tools/e2e/`, `npx vitest run` from `lib/parser/`; all three run and
  green above. **12 derived readers across 4 suites, 0 frontmatter
  issues**, and both climb sites into the capture are reported
  (`agent_runner.rs:1880` and the lane's new `:1993`). `cargo test` is
  not owed BY the gate and is owed by the Rust in the diff; it ran.

### THE POISON DRILL — MY OWN MUTANTS, EIGHT FOR EIGHT

Detached scratch worktree **`drill-T-124-verify`** at `e896865`, created
OUTSIDE the repository at `/Users/ujju/Projects/drill-T-124-verify`, with
its own `CARGO_TARGET_DIR` at `.drilltarget-T-124-verify` INSIDE it (arm
(c)); driver `drill-T-124-verify-driver.py` and results
`drill-T-124-verify-results.txt`, both named per-lane. **ONE SIDE ONLY** —
every mutation edits a PRODUCER (`spawn_args`, `OBSERVED_PLANNER_REFUSALS`,
`granted_prefix_reached`, `allowed_tools`) and never an assertion. Each
mutated text read back with `git diff` BEFORE its run; each restore proved
by sha256 `ffe7a27314cdcdcad873d0324d71804c5ccfa6ee06ee68dec2a6dd94a6a63e67`
against the drill's own commit. A DID-NOT-COMPILE reading is decided by
`error[E` / `could not compile`, never by a bare `^error` grep. Baseline
**lib 160/0/0, agent_runner 76/0/1**.

| # | mutation (producer only) | lib | agent_runner |
|---|---|---|---|
| M1 | `granted_prefix_reached` taught to skip a `-C <dir>` segment — the plausible "just make it match" fix | **RED** 158/2 | green |
| M2 | **THE QUIET WIDENING** — `Bash(git status:*)` → `Bash(git -C:*)` in `spawn_args` | **RED** 156/4 | green |
| M3 | the one refusal that IS ours reclassified as the CLI's | **RED** 159/1 | **RED** 75/1 |
| M4 | the hook-safety refusal claims an ARGV change fixes it | **RED** 159/1 | green |
| M5 | **shape five** — one captured refusal DELETED outright | **RED** 159/1 | green |
| M6 | **shape six** — ONE-CHARACTER paraphrase, `This Bash` → `This bash` | **GREEN 160** | **RED** 75/1 |
| M7 | `allowed_tools()` forgets to stop at the next flag | **RED** 159/1 | green |
| M8 | `granted_prefix_reached` forgets the word boundary | **RED** 159/1 | green |

**M2 IS THE VERDICT'S LOAD-BEARING MUTANT.** A card whose whole claim is
"I declined to widen" is worthless if a widening could pass unnoticed;
this one reds four bodies. **M6 REPRODUCES THE LANE'S SHAPE-SIX CLAIM
INDEPENDENTLY** — one character, lib green at 160, only the transcription
body reds. **M1 turns the rejected fix into a killed mutant.** Restores
proved per-path; the drill's `git status --short` over the adapter is
clean.

### THE CARD'S OWN FALSE CLAIM, CHECKED RATHER THAN INHERITED FROM EITHER
SIDE

The spec asserts the three refusals are *"the first real-CLI permission
text this project holds"*. **False**, and the lane's own correction is
right: `docs/research/captures/real-planner-turn-2026-08-19.jsonl`
carries **two** `subtype: permission_denied` messages. The corroboration
claim also holds, measured: the CLI's fixed preamble is **86 bytes**
(*"This Bash command contains multiple operations. The following part
requires approval: "*), the first **85** bytes of the transcribed reason
and of the capture's own message are byte-identical, and **neither
captured message contains a backtick** — so the backticks in the card's
quotations are the transcriber's markdown and the const is right to strip
them.

**THE SHARED FIXTURE IS BYTE-UNCHANGED, BEFORE AND AFTER EVERYTHING.**
sha256 `273a3d33593a53614101489b9cd3e9574010beae3830a60f43a8e65f74da47ac`
at `c4cfe52`, at `ce8b8e7`, at `e896865`, in the main checkout's working
tree, in this lane's worktree and in the drill worktree — six readings,
one hash, and `git diff` over `docs/research/captures/` is empty.

### PORTS, AND WHAT REACHED THE HUMAN'S APP

**Nothing.** Port **1420** was read with `lsof -nP -iTCP:1420 -sTCP:LISTEN`
and nothing else, before and after — holder `node` pid **88948**, one
socket `TCP [::1]:1420 (LISTEN)`, identical throughout, and
`/Users/ujju/Projects/nputer-app` was never touched. Scratch ports
**15170** (e2e) and **15171** (boot check) were `lsof`ed FIRST (zero rows)
and then bind-confirmed free on `127.0.0.1`, `0.0.0.0`, `::1` and `::` in
that order, and both were free again after. **No `pkill` at any point.**
No sibling lane worktree was opened; the untracked `z` was left alone.
This verification wrote nothing into the lane worktree except this verdict
and the two suggestion files, and staged them by explicit path.

### TWO FINDINGS, NEITHER BLOCKING

- **`T-124-s3`** — a SECOND intermittent in the cargo suite, in code this
  lane never touched, and the first thing to falsify the pipeline's
  standing "green except `T-088-s4`" sentence.
- **`T-124-s4`** — two sentences in the `adapter.rs` block state as
  measured what the capture only makes plausible: the hook guard's
  independence, and a prefix model that reports `Some("git status")` for
  `git status && rm -rf /` while the project's own capture holds the CLI
  refusing exactly that shape. Both err SAFE and neither is read by
  production; measured through the shipped function in the drill
  worktree, probe removed and restore proved.

**THIS VERDICT'S OWN DOC WRITES WERE PUT THROUGH THE GATE THEY OWE**, with
the three files `git add`ed by explicit path first (`T-010-s10`'s hole
worked around rather than walked into). DOCS GATE **exit 1 — FIRES, 3 of
3**, three suites owed and all three re-run AFTER the writes: `npx vitest
run` from `lib/parser` **0**, 264/264 across 12 files · `npm test` from
`app` **0**, 958/958 across 46 files · `NPUTER_E2E_PORT=15170 npm test`
from `tools/e2e` **0**, 145/145. `npm run lint:tokens` **0**, clean at
**TOKEN 131 / CONTROL 661** — CONTROL moved 659 → 661 on the two
suggestion files, which is the printed-never-pinned count doing what it
does. `npm run lint:docs` **0**. `cargo test` is NOT owed by these writes
(they touch neither `docs/CONVENTIONS.md` nor the component registry) and
ran four times anyway for the Rust in the diff.

**MAIN MOVED UNDER THIS VERIFICATION AND THE FORECAST DID NOT.** Every
figure above was derived at main **`ce8b8e7`**; by the time this verdict
was committed main was **`19f93bb`** — T-120's merge and checkpoint, **6**
paths (`docs/STATE.md`, four `docs/tasks/T-120*` files and
`tools/e2e/tests/docs-input-gate.spec.ts`). Re-derived rather than
assumed: `git merge-tree --write-tree 19f93bb <this commit>` exits **0**
and `git diff --name-only 19f93bb "$TREE"` returns the SAME **7** paths as
against `ce8b8e7`, so the two sets are disjoint and no gate's answer
moves. The only figure that would shift is the graph's committed
endpoints, which the integrator re-derives at the checkpoint anyway. **Do
not quote any number here — re-derive it at your own ref**, which is the
rule that produced this paragraph.

