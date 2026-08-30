---
id: T-025-s4
title: The Bash allowlist is the one grant cwd scoping does not cover — `cp` and `mkdir` reach the whole filesystem, and the effective grant is the union of three tables of which one is reviewed
feature: F-03
milestone: 3
priority: 4
size: S
status: done
blocked_by: []
touches: [app-agent]
suggested_by: verifier claude-opus-5 @T-025
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
verified_by: claude-opus-5@subagent
review:
---

Criterion 2's containment argument is "the CLI's own cwd scoping IS the
project-dir scoping", and for `--permission-mode acceptEdits` that is
exactly right: Edit/Write are auto-accepted inside cwd and prompt (=
auto-deny in `-p` print mode) outside it, and there is no `--add-dir`
anywhere, pinned by
`permission_mode_is_accept_edits_and_scoped_to_cwd`. The verifier
re-derived that and it holds.

**`--allowedTools` is a different kind of grant, and it carries no path
scope at all.** Claude Code's tool-permission syntax matches the
COMMAND STRING (`Bash(npm run test:*)` = "any command starting with
`npm run test`"), never the paths the command touches. So of the six
patterns:

| pattern | reach |
|---|---|
| `Bash(git init:*)` | can init a repo outside cwd (`git init /elsewhere`) — creation only |
| `Bash(git add:*)` | bounded to the cwd repo in practice (`git -C …` does not match the prefix) |
| `Bash(git commit:*)` | as above; runs repo hooks, and stage 0 creates the repo, so no inherited hooks |
| `Bash(git status:*)` | read-only |
| `Bash(mkdir:*)` | **creates directories anywhere the user can write** |
| `Bash(cp:*)` | **reads AND writes any path the user can reach** — `cp ~/.aws/credentials ./docs/x.md`, `cp ~/.claude/.credentials.json /tmp/…` |

`Bash(cp:*)` is the strongest case and the one this file exists for: it
is a filesystem-wide read+write primitive handed to the spawned agent,
and it is precisely the capability the cwd-scoping argument is meant to
deny. (Prefix matching probably also admits `cpio …`, which starts with
`cp` — worth confirming when someone touches this.)

**Why this is recorded and not fixed here.** The six patterns are the
kit's imperative surface exactly as the T-023 verdict recorded it
("file copies, docs writes, git init/add/commit"), so the executor
implemented a landed decision rather than inventing one; the criterion
names verifier sweep as the control, which is what this is; and the
grant is exercised by the user's own agent, under the user's own login,
in a folder the user just picked. Reachability today is also thin: the
init line the model cannot forge, a greenfield folder with no repo
content to inject from, and `WebFetch`/`WebSearch` denied.

**The narrowing worth considering**, when someone has an authenticated
machine (T-025-s2) and can watch a real stage-0 run:

1. **Drop `cp` and `mkdir` entirely.** Both are avoidable: the planner
   can copy `docs-templates/**` into `docs/**` with Read + Write, which
   `acceptEdits` DOES scope to cwd, and Claude Code's Write creates
   parent directories. The result would be a scaffold whose entire file
   surface is cwd-scoped, with the git verbs as the only shell.
2. If `cp` must stay, narrow the prefix as far as the CLI's matcher
   allows (a leading `cp .nputer/genesis/kit/` form, if prefix matching
   accepts it) rather than a bare verb.

Both need one real observed stage-0 run to choose between, which is
exactly the @human item T-025-s2 already carries. Whoever does it: the
six patterns are pinned by
`allowed_tools_are_exactly_the_kits_imperative_surface`, so any change
is a deliberate, reviewed edit with its own justification comment — the
alarm is already wired.

Triage 2026-08-16 (architect): PARKED — blocked on T-025-s2's observed
run, which no agent can perform. RE-VERIFIED at triage: the six
patterns are unchanged in adapter.rs and still include `Bash(mkdir:*)`
and `Bash(cp:*)`, and `--allowedTools` still matches the COMMAND
STRING and never a path — so `cp` is a filesystem-wide read+write
primitive inside a grant whose containment argument is cwd scoping.
NOT a rejection: the six are the T-023-recorded imperative surface, so
the executor implemented a landed decision, and both suspect verbs
look avoidable (Read+Write IS cwd-scoped under `acceptEdits`). But
choosing an arm without one watched real stage-0 scaffold risks the
first genesis a user ever runs dying on a denied tool. UNPARK WITH s2
— read them together.

Re-affirmed at triage 2026-08-17 (third pass): unchanged and still
gated on T-025-s2's observed run, which nobody in this pipeline can
perform. One adjacency worth recording rather than acting on: T-060
was created at this triage and reshapes the resolver in the same
component, but it deliberately does NOT touch the six patterns —
narrowing the allowlist is a decision about what the planner may do,
not about what the runner trusts from disk, and folding it into a
hygiene card would smuggle a product ruling past the human. Read with
s2.

**Observed 2026-08-19 — the containment argument is weaker than this
file assumed, and the proposed fix cannot work.** One authenticated
planner turn (`docs/research/real-cli-observation.md`) ran `ls -la` and
`find … | head -100` **unprompted**, and neither is among the six
patterns. The obvious confound is ruled out: this machine's
`~/.claude/settings.json` allows only `Bash(git add|rm|mv|commit:*)` —
no `ls`, no `find`. So the CLI itself grants a read-only Bash class
under `--permission-mode acceptEdits`, on top of the adapter's table.

Two consequences, both against this file's own premise:

1. **Narrowing the six patterns cannot narrow the effective grant.**
   This file's implied remedy — drop `cp` and `mkdir`, lean on Read+Write
   which IS cwd-scoped — leaves whatever the CLI grants by default
   untouched, and the size of that default is now known to be non-empty
   and is otherwise unmeasured. Any future containment claim has to
   characterise the CLI's own baseline, not just the adapter's table.
2. **The adapter deliberately passes no `--settings`, so it rides the
   user's config.** On 2026-08-19 this machine's user settings gained
   `Bash(git rm:*)` and `Bash(git mv:*)` for unrelated reasons — and
   those are now in the spawned planner's grant surface, under a table
   whose header says the planner cannot remove files. The grant surface
   is the union of the adapter's table, the CLI's defaults, and whatever
   the user happens to have configured; only the first is reviewed.

Also observed, and it makes the `cp` question moot in one direction:
**`cp <glob>` is structurally refused** regardless of the pattern —
*"Glob patterns are not allowed in write operations."* Stage 0's literal
instruction is *copy docs-templates/\*.md into docs/*, so widening
`Bash(cp:*)` can never make the natural command work; the planner needed
eight separate `cp` calls. Whatever arm is taken, it is not "grant the
glob".

STILL PARKED, and now for a better reason: the arm this file leaned
toward is disproved, and the replacement question — what does the CLI
grant when we say nothing — is a measurement nobody has taken. UNPARK
with that measurement, or with F-04's adapter card (T-086 in the
2026-08-19 decomposition draft), whichever comes first.

Measurement 2026-08-30 (integration seat, T-025-s2's closing run): the gating run this park waited on HAS HAPPENED. Observed: one compound Bash call denied in band ("Contains shell syntax (string) that cannot be statically analyzed"), typed `denied` event, planner recovered via Write + a simpler Bash and completed the scaffold. So the allowlist's narrowness is REAL and fails safe-and-loud, and the open question is now priced: one denial per genesis turn, zero turn failures.

## PROMOTED at standing triage sitting #2 (2026-08-30), F-03 priority 4 — the park's own UNPARK condition has fired

**RE-DERIVED BEFORE PROMOTING, because a resurfaced card is re-derived
and never trusted.** The park's condition was *"UNPARK with that
measurement, or with F-04's adapter card, whichever comes first"* — the
measurement being what the CLI grants when the adapter says nothing.
`T-025-s2` is `status: done`; the run happened; the capture is
`docs/research/captures/real-planner-turn-2026-08-30.txt`, beside the
earlier observation in `docs/research/real-cli-observation.md`. So the
gate is met and the card comes off the shelf.

**WHAT THE CARD MAY NOT ASSUME, and this is why the criteria are shaped
the way they are.** The 2026-08-30 run priced ONE denial; it did not
characterise the CLI's default grant, which is the measurement the
2026-08-19 note said was missing. Two observations bound the question
and neither is a full answer: the CLI granted `ls` and `find` unprompted
under a user config that allows neither, and it refused a compound
command it could not statically analyse. **The effective grant is the
union of three tables — the adapter's six patterns, the CLI's own
defaults, and whatever the user happens to have configured — and only
the first is reviewed.** That sentence, not the six patterns, is what
this card now exists to make true or false in writing.

## Acceptance criteria

- THE lane SHALL characterise the EFFECTIVE grant from the landed
  captures and the adapter's own source, and record it here as three
  named tables with what each contributes — naming, for each, the
  question the captures cannot answer rather than leaving the gap
  implicit.
- THE lane SHALL then either narrow the adapter's imperative surface or
  record the ruling that it stays, with the reason, on this card and
  dated. Both arms are acceptable; leaving the question open is not,
  because that is what this card has already cost three triages.
- WHERE the answer is to narrow, THE change SHALL move the pin that
  asserts the imperative surface is exactly the kit's — reconciled,
  never loosened — and SHALL carry the justification comment that pin
  demands.
- THE lane SHALL record whether the containment argument in `T-025`'s
  criterion 2 survives its own findings, in one sentence, because that
  argument is what every later reader will cite.
- THE lane SHALL NOT spawn a real planner turn as its proof (the
  `T-025-s5` / `T-025-s6` precedent): the fixture suites green are the
  evidence, and any question only a real run can settle is RECORDED and
  ROUTED to @human rather than taken.
- Verification: headless. The app crate's own `cargo test` green at the
  lane's ref, with the moved pin's assertions shown changed rather than
  weakened.

## Implementation notes
<!-- executor appends before finishing -->

**Confirmation (executor, 2026-08-30, lane `task/T-025-s4-allowlist`, cut
from `8ebbb08`), written before any other edit.** I read this card as
asking me to make ONE SENTENCE true or false in writing — that the
planner's effective grant is the union of three tables (the adapter's six
`--allowedTools` Bash patterns, the CLI's own defaults, and whatever the
user happens to have configured) of which only the first is reviewed — by
characterising each table from the two landed captures
(`docs/research/captures/real-planner-turn-2026-08-30.txt`,
`docs/research/real-cli-observation.md` and the 2026-08-19 JSONL it
preserves) plus `adapter.rs` itself, recording all three HERE with what
each contributes and, for each, the question the captures CANNOT answer;
and then closing the question this card has carried through three triages
with either a narrowing of the adapter's imperative surface or a DATED
ruling that it stays, with the reason. Where I narrow I move
`allowed_tools_are_exactly_the_kits_imperative_surface` RECONCILED and
never loosened, carrying the justification comment that pin demands. I
record in one sentence whether `T-025` criterion 2's containment argument
survives. I spawn NO real planner turn: the fixture suites green are the
evidence, and any question only a real run can settle is RECORDED and
ROUTED to @human rather than taken. My fence is C-14/app-agent's five
paths plus `docs/tasks`; `method/`, `docs/research/` and
`docs/architecture/` are OUTSIDE it, so any remedy landing there is a
routed suggestion rather than a silent omission. Per
`method/roles/executor.md` I did NOT read `docs/ROADMAP.md`, which my
brief's read-first row named and which that role file explicitly
subtracts — the role file wins, and the correction is in my report.

---

## THE EFFECTIVE GRANT, IN THREE NAMED TABLES (criterion 1)

Characterised from `docs/research/captures/real-planner-turn-2026-08-19.jsonl`
(the JSONL `docs/research/real-cli-observation.md` preserves),
`docs/research/captures/real-planner-turn-2026-08-30.txt`, and
`app/src-tauri/src/agent/adapter.rs` itself. **The tables are also
LANDED IN CODE** as `adapter::EFFECTIVE_GRANT_TABLES`, beside the grants
they are about, for the reason that file already states about T-124's
classification: *a finding kept only in a task file is a finding the next
author of this table will not meet* — which is exactly what happened to
the 2026-08-19 observation, which sat here for eleven days beside a doc
comment that contradicted it.

### Table 1 — the adapter's own `--allowedTools` patterns — **REVIEWED**

**Contributes:** auto-approval for a command whose TEXT begins with one
of six fixed verbs. It carries no path scope, so `Bash(cp:*)` and
`Bash(mkdir:*)` reach any path the user can write. Membership is not
copied anywhere — it is `CLAUDE_V1.allowed_tools()`, pinned by
`allowed_tools_are_exactly_the_kits_imperative_surface`.

**The question the captures CANNOT answer:** whether the real CLI's
matcher agrees with the word-boundary rule `granted_prefix_reached`
models — i.e. whether `Bash(cp:*)` also admits `cpio`, the question this
card raised in its own second paragraph and left open. The 2026-08-24
refusal calibrates the PREFIX half; **nothing on disk tests the BOUNDARY
half**, and only a real turn can. ROUTED to @human.

### Table 2 — the CLI's own defaults — **NOT REVIEWED**

**Contributes:** the TOOL SET itself, plus a read-only Bash class the CLI
approves without asking. The set is measured, from the `system`/`init`
line of the 2026-08-19 capture, taken under THIS adapter's own argv:
`Task, Bash, CronCreate, CronDelete, CronList, DesignSync, Edit,
EnterWorktree, ExitWorktree, ListAgents, Monitor, NotebookEdit,
PushNotification, Read, RemoteTrigger, ReportFindings, ScheduleWakeup,
SendMessage, Skill, TaskCreate, TaskGet, TaskList, TaskOutput, TaskStop,
TaskUpdate, ToolSearch, Workflow, Write`. That list is not transcribed on
trust: `the_cli_default_tool_table_is_read_off_the_2026_08_19_capture`
in `tests/agent_runner.rs` asserts it against the file.

**Two facts fall straight out of it, and both are new.**

1. **`--allowedTools` is an AUTO-APPROVAL list, not a tool restriction.**
   Six Bash patterns were passed on that very run and the array is not
   six Bash patterns. This is what makes the grant a UNION rather than a
   table, and it is the mechanism the card's sentence was asserting
   without evidence.
2. **`--disallowedTools` measurably bites, and it is the only lever this
   adapter has here.** `WebFetch` and `WebSearch` are exactly the two
   names the adapter denies and exactly the two missing from the array.
   Both directions are asserted. **A denylist can never close the table**
   — a CLI that gains a tool tomorrow grants it by default — so no
   in-fence change can make the card's sentence false.

**The question the captures CANNOT answer:** *which* Bash commands the
CLI approves on its own. `ls -la` and `find … | head -100` ran unprompted
on 2026-08-19 under a user config allowing neither, and the rule that
admitted them is unstated. **The 2026-08-30 capture cannot narrow it and
must not be read as though it could**: it carries tool LABELS only, and
those labels are deduplicated against the previous label (`last_activity`
in `runner.rs`), so it cannot say which commands ran, or even how many.
Only a real turn moves this. ROUTED to @human.

### Table 3 — whatever the user happens to have configured — **NOT REVIEWED**

**Contributes:** every permission the user's own settings allow,
inherited because the adapter deliberately passes no `--settings` and no
`--setting-sources` (*"the user's CLI configuration is the user's; we
ride it"*). It is not a fixed table — it is whatever that file says at
spawn time.

**READ, not assumed** — a live-environment fact, so it carries when and
where it was read and never a commit ref: `~/.claude/settings.json` on
`Mac.lan` at **2026-08-30T18:11:17Z** has `permissions.allow` =
`Bash(git add:*)`, `Bash(git rm:*)`, `Bash(git mv:*)`,
`Bash(git commit:*)`, `Bash(git merge:*)`. **The card is out of date here
and the drift IS the finding**: the 2026-08-19 note recorded four of
those; there are five today, and the one that arrived is `git merge` —
the verb this project's own CONVENTIONS reserve to @human's gate. The
table this card said drifts has drifted again, under observation, inside
eleven days, for a reason that had nothing to do with genesis.

**The question the captures CANNOT answer:** what this table contains for
any user but this one, and what it contains here tomorrow. Nothing in
this repository can keep a copy of it honest — which is why the third
entry's `observed` field is empty ON PURPOSE and its own test asserts
that emptiness rather than letting a stale literal accumulate.

### The verdict on the sentence

**TRUE — and it stays true under every arm reachable from inside this
fence.** Table 1 is the only reviewed member; the adapter can subtract
from table 2 only by name and only for names known when the binary was
built, and can close table 3 only by refusing to ride the user's own
configuration. None of those makes the sentence false.

## THE RULING (criterion 2) — dated 2026-08-30: THE SIX STAY

Arm taken: **record the ruling that the imperative surface stays.** Three
reasons, none of them the one this card assumed, all landed in
`adapter.rs` beside the patterns:

- **(a) `mkdir` is NOT avoidable, and the card was wrong that it is.**
  `Write` creates parent directories, but stage 0's `docs/decisions/`,
  `docs/tasks/` and `docs/rooms/` are wanted EMPTY — the 2026-08-30
  capture's own completion text says so — and no file write creates an
  empty directory.
- **(b) `cp` IS avoidable and the paired change is out of this fence.**
  Every observed use copies inside the cwd, which `acceptEdits` already
  covers through `Write`. But the change that makes dropping it safe is
  the kit's own stage-0 instruction (`method/`), which is
  `RefusalRemedy::PlannerInstruction`'s territory and not `app-agent`'s;
  the one observed stage 0 needed **eight** separate `cp` calls, so
  dropping the grant unpaired buys eight in-band denials on the first
  genesis a user ever runs — and pricing that needs exactly the real turn
  criterion 5 forbids.
- **(c) It is the smallest member and the wrong lever.** Narrowing table
  1 moves the union very little and moves tables 2 and 3 not at all.

**Consequently criterion 3 does not fire.**
`allowed_tools_are_exactly_the_kits_imperative_surface` is UNMOVED and
its assertions are untouched — there is no narrowing to reconcile, and
loosening it was never on the table.

## Criterion 4 — does `T-025` criterion 2's containment argument survive?

**In one sentence: it survives only as a claim about
`--permission-mode acceptEdits`, whose cwd scoping is real and pinned by
`permission_mode_is_accept_edits_and_scoped_to_cwd`, and it FAILS as a
claim about the grant as a whole — `Bash(cp:*)` and `Bash(mkdir:*)` carry
no path scope, and the CLI's own default Bash class was never in the
argument at all.** The over-broad half of that sentence is now RETRACTED
in `adapter.rs`'s own doc comment, where the next reader will meet it.

## ROUTED to @human (criterion 5) — none of these taken here

1. **Narrow table 2 by name.** `CronCreate`, `CronDelete`, `CronList`,
   `ScheduleWakeup`, `RemoteTrigger`, `PushNotification`, `SendMessage`,
   `EnterWorktree`, `ExitWorktree` are all measured present and a genesis
   interview provably needs none of them — the same *"free ADR-010
   narrowing"* argument that already justifies `WebFetch`/`WebSearch`.
   **NOT TAKEN**: [reason restated at verification — the original said
   "it is unknown whether the CLI validates unknown tool names", which
   this card's own table 2 refutes: all nine names are measured present
   in the 2026-08-19 capture, so they are KNOWN names to CLI 2.1.226.]
   The real unpriced risk: the adapter spawns against ANY installed CLI
   version, and whether a denylist naming a tool a DIFFERENT build does
   not know is refused at argument-validation time is unmeasured — an
   untested denylist still risks killing genesis at SPAWN, which is
   worse than the gap. Only a real run prices it; the routing stands on
   that.
2. **Close table 3 with `--setting-sources`**, given the measured drift.
   **NOT TAKEN**: it also drops the user's hooks and project settings and
   changes the auth posture ADR-003 fixes. A product decision plus a real
   run.
3. **The `cpio` boundary question** (table 1's own gap).
4. **Drop `Bash(cp:*)` paired with the kit's stage-0 instruction.** The
   only arm that actually narrows table 1; it needs `method/` in the
   fence and one watched stage 0 to price the eight denials.

## Where this card was wrong

- *"both suspect verbs look avoidable (Read+Write IS cwd-scoped under
  `acceptEdits`)"* — **false for `mkdir`**, per (a) above.
- *"Narrowing the six patterns cannot narrow the effective grant"*
  (2026-08-19, consequence 1) — **overstated**. It cannot narrow tables 2
  and 3. It does narrow table 1, which is the only member that
  auto-approves a WRITE outside the cwd. The true claim is the weaker one.
- *"this machine's `~/.claude/settings.json` allows only
  `Bash(git add|rm|mv|commit:*)`"* — no longer true at the time read.
- *"the replacement question — what does the CLI grant when we say
  nothing — is a measurement nobody has taken"* — **half of it had been
  taken, and was sitting in the capture this card already cites.** The
  init line's `tools` array is that measurement. What was genuinely
  untaken is the Bash sub-class boundary, which is the gap table 2 now
  names explicitly.

## What landed, and where

- `app/src-tauri/src/agent/adapter.rs` — `GrantTable` +
  `EFFECTIVE_GRANT_TABLES` (the three tables, each with its own
  unanswered question); the `acceptEdits` bullet's over-broad containment
  sentence RETRACTED in place; the dated ruling written beside the six
  patterns; the `--settings` bullet told what riding the user's config
  costs. New unit body
  `the_effective_grant_is_three_tables_and_exactly_one_is_reviewed`.
- `app/src-tauri/tests/agent_runner.rs` — new body
  `the_cli_default_tool_table_is_read_off_the_2026_08_19_capture`. It
  adds NO new docs reader: `docs-gate.mjs` resolves all three climbs in
  that file to the capture the two existing bodies already read.
- `allowed_tools_are_exactly_the_kits_imperative_surface`: **UNMOVED.**

## Drill ledger (four one-sided mutants, all killed)

Detached scratch worktree at `/tmp/t25s4` (short root), at commit
`31e17fe`, with `CARGO_TARGET_DIR=/tmp/t25s4/target` — inside itself, so
the lane's own cache is untouched. **Every mutant is on the CONST side;
no assertion was touched, and no literal shared by both sides was
touched** — the denied tool names the assertions use are read off the
live argv, and the tool array they compare against is read off the
capture file.

Controls first, because a red proves nothing without them: the unit body
1 passed / exit 0, the integration body 1 passed / exit 0.

| # | mutation (const side only) | result |
|---|---|---|
| A | `"DesignSync"` → `"DesignSyncX"` in table 2's `observed` | **exit 101** — the transcription body reds and prints the capture's own array as the right side |
| B | table 3 `reviewed: false` → `true` | **exit 101** — "exactly one table is reviewed" |
| C | table 1's `unanswered` → `""` | **exit 101** — the criterion-1 gap assertion, by name |
| D | `"WebFetch"` inserted into table 2's `observed` | **exit 101 in BOTH bodies** — the measured-lever control and the transcription |

Restoration proved after each, and again at the end, by sha256 rather
than asserted: `git show 31e17fe:app/src-tauri/src/agent/adapter.rs |
shasum -a 256` and the working file both
`66e76ba9235f0f6ec865c1f349603454e6c4ef50bddf66194df5d8b2e4084aaa`, with
an empty per-path `git diff` as the companion. The unit body was re-run
after the last restore: 1 passed, exit 0. Worktree removed.

## Gates, derived at this tip's forecast tree

The path list is the RANGE RULE's own —
`git merge-tree --write-tree 8ebbb08 HEAD` (exit 0, tree
`2c108cd`), three paths — and it does not move when this notes commit
lands, so these decisions are not one commit behind.

- **GRAPH REGEN — FIRES** (`*.rs` outside `docs/`). `index --check`
  **before**: CURRENT, 1039074 bytes / 199 files / 2065 symbols / 2334
  edges, exit 0. **After**: STALE, exit 1 — 1039590 bytes / 199 files /
  2067 symbols / 2334 edges, `files +0 -0 ~2`, no indexed file added,
  removed or moved. **The regen is the integrator's, not this lane's.**
  **AND IT IS NEWS**: headroom falls **926 → 410 bytes** against the
  1,040,000 budget, still inside the alarm band `T-140-s4` carries.
  `truncated_symbols` was already `true` at the base, and
  `tests/agent_runner.rs` was already truncated to zero symbols — which
  is why the new integration body cost no symbols and only the two
  consts did.
- **BOOT GATE — FIRES** (`app/src-tauri/**`).
  `NPUTER_BOOT_PORT=14733 npm run boot:check` → **exit 0**, both lines:
  `[nputer] project folder: /Users/ujju/Projects/nputer-T-025-s4` and
  `[nputer] window "main" created`. Port read to zero rows immediately
  before; 1420 was left alone and is held by the human's app.
- **DOCS GATE — FIRES**, and the dispatch brief said it would not. It
  named `docs/tasks` as exempt, but `docs/tasks/T-*.md` IS a code input:
  the gate answers **exit 1** on this card and names three suites.
  - `npx vitest run` from `lib/parser/` → **exit 0**, 336 passed.
  - `npm test` from `app/` → **exit 0**, 1060 passed.
  - `npm test` from `tools/e2e/` → **exit 1**, 330 passed / **2 failed**,
    and **both failures are PROVEN not this lane's**. Both are
    `session-economics.spec.ts` bodies asserting
    `brief.mjs --task T-157` exits 0; the assembler refuses with
    *"fences are not disjoint: T-163-s4 tools/e2e against T-157
    tools/e2e"*. Run at the BASE ref in a detached worktree at `/tmp/b25`
    (`8ebbb08`) the same command exits **1** with a byte-identical
    refusal on the same line — so it is a live-board condition, not a
    diff. The brief's own disjointness block clears this lane by name:
    *"T-025-s4 and T-163-s4: DISJOINT"*, *"T-025-s4 and T-157:
    DISJOINT"*. **No suggestion filed**: `T-163-s4` is live right now and
    its own title is *the session economics positive control fences
    against the live board* — this is that lane's subject, and the
    collision is a live lane joined against a card at `status: done`.

`cargo test` from `app/src-tauri/` (the whole crate) at `31e17fe`:
**exit 0, 590 passed, 0 failed** — the base battery's 588 plus the two
bodies this card adds.

## Verdicts Queues for the next standing sitting with this evidence.

## VERDICT (2026-08-30, blind verifier claude-opus-5@subagent)

**APPROVED WITH ASSIGNED CORRECTIONS** — two, both prose, both
performed at merge: (1) ruling reason (c) in adapter.rs now carries
its own counterweight (smallest by COUNT is largest by WRITE REACH —
(a) and (b) carry the ruling, not (c)); (2) routed item 1's stated
obstacle restated above — the lane's own table 2 refuted the original
wording, and the routing now stands on the real risk (a DIFFERENT
installed CLI build's argument validation), which it does.

The verifier DISCLOSED ITS OWN BLINDNESS VIOLATION: the card came
back in full before the attack set was written. It recorded the
violation at the top of its attack file and compensated by
re-deriving every figure from disk and aiming its mutants at the
axes the executor never touched — M1/M2 mutated the CAPTURE FILE
itself and proved the fidelity body reads the capture's bytes (the
panic printed the file's mutated array), the decisive answer to the
second-implementation question. Five mutants, five killed, exactly
one failing body where the shape demands it; the unmoved pin proved
a live alarm (deleting Bash(cp:*) from the argv reds four bodies).
All six criteria MET, re-derived: 590/0 cargo, the three tables'
gaps all real (none rhetorical), the pin byte-identical base→tip
(1825 bytes compared), criterion 4 one sentence and true against the
pins on disk, no real turn spawned. Fence clean. The two e2e reds'
attribution CONFIRMED and the condition has since cleared — the same
command at the same tree now exits 0, because T-163-s4 landed while
this lane was under verification: the class this board just closed,
observed closing. Graph: headroom 926 → 410 at this merge, the
integrator's regen.

## @human RULED 2026-08-30, in session — ROUTED ITEM 2 IS DECLINED

**"lets not lock down list 3. we can think about this design later, if
need be."**

So routed item 2 — closing table 3 with `--setting-sources` — is
**DECLINED**, and it is declined as a DESIGN CALL rather than deferred
for a measurement, which is what separates it from the other three.

**WHAT THE DECLINE COSTS, WRITTEN DOWN SO NOBODY RE-DISCOVERS IT AS
NEWS:** table 3 keeps drifting. It is the user's own
`~/.claude/settings.json`, the spawned planner inherits it because the
adapter passes neither `--settings` nor `--setting-sources`, and this
card already measured it moving under observation — four entries on
2026-08-19, five on 2026-08-30, the arrival being `Bash(git merge:*)`,
the one verb this project's CONVENTIONS reserve to @human's own gate.
Nothing in this repository can keep a copy of that table honest, which
is why the third entry's `observed` field is empty on purpose.

**WHY THE DECLINE IS NOT MERELY A DEFERRAL, stated at the strength of
its evidence.** `--setting-sources <sources>` takes a comma-separated
list of `user, project, local` (read from the installed CLI's own
`--help` at this ruling). Passing it does not subtract permissions
alone: the user's settings source also carries hooks and participates
in how credentials resolve — the same help text ties `apiKeyHelper` to
`--settings` — so restricting the sources trades a bounded, visible
exposure for unbounded invisible ones, against a code path ADR-003
designed to inherit the user's setup. That is a product judgement and
@human made it.

**THE MIDDLE PATH NOBODY HAS PRICED, recorded rather than proposed**:
`--settings` accepts an explicit file or JSON string, so a future design
could hand the planner a KNOWN permission set without discarding the
user's hooks. It is not on this card's list of four, it is not ruled
here, and it would want a real watched genesis run like the rest.

**THE OTHER THREE ROUTED ITEMS ARE UNTOUCHED BY THIS RULING** — 1 (the
nine-name denylist), 3 (the `cpio` boundary) and 4 (dropping
`Bash(cp:*)`). The seat's recommendation, routed and NOT ruled: each
needs a price only a watched genesis run can give — whether an unknown
tool name refuses at spawn on another CLI build, where the boundary
falls, and what eight in-band denials actually feel like on a first
run — so they wait for that run rather than for an opinion.
