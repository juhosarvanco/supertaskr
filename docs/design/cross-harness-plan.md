# Cross-harness plan — Claude Code builds, Codex verifies

Written 2026-08-19 overnight, at the human's request, against main
`88c394f`. **This is a design pass, not a card and not a decision.**
Nothing here is dispatchable until §9's decisions are ruled.

## 0. Provenance, stated first because it governs how much weight each
## section can carry

This project's rule is that a measurement and an inference are different
things and must be labelled. So:

- **§2 is measured on this machine, this week.** Every figure is
  re-derivable at a named ref.
- **§4 is measured** — it is a reading of code in this repo.
- **§5 is NOT measured. It is read from OpenAI's published
  documentation.** The Codex binary is **not installed and not on the
  login-shell PATH on this machine** (checked 2026-08-19: `command -v
  codex` empty, `zsh -lic` empty, no binary under the usual prefixes).
  `~/.codex/` exists with a config and session state, so the tool has
  been used here at some point, but **nothing in §5 has been executed.**
  T-082 settled the `claude login` defect by reading the CLI's own
  `--help`; the equivalent for Codex could not be run tonight. Treat
  every Codex claim as a hypothesis with a citation, and see §8 for the
  cheap way to convert them into measurements.

## 1. The question

The human asked: when Claude Code builds a card and Codex verifies it,
how do they communicate, how does one know the other has finished, and
what is the smartest way to build that?

## 2. What is already true, measured

- **The two models have never talked and the pipeline works anyway.**
  Sixty-plus cards have run executor → verifier → integrator with the
  repository as the only medium.
- **`review: independent` appears on exactly 5 cards.** Of 83 real
  cards at `373a06e`: 46 `same-model`, 26 blank, **6** `self-verified`,
  5 `independent`. (Derived from frontmatter only. A `grep` over whole
  files reports 27 blank and 5 self-verified — it catches a line of
  prose in one card's body and misses a stamp. The 5 that matters is
  unaffected.) The cross-model path is the rare one here, not the norm
  — worth knowing before building for it.
- **`ADAPTERS` has exactly one entry**, and `ADAPTERS.len() == 1` is
  pinned by a test citing "ADR-017 clause 6: one declarative entry in
  v1". Adding Codex breaks that pin **deliberately** — it is a v1 scope
  decision, not an oversight.
- **`--model` is never passed to Claude**, on stated ADR-003 grounds:
  the user's CLI default IS the model, and the runner records what the
  init line reports.
- **A denial does not kill a Claude turn.** Measured 2026-08-19 on a
  real 2.1.226 turn: two `permission_denials`, the agent decomposed the
  compound command and continued, `is_error: false`,
  `terminal_reason: "completed"`, exit 0.
- **The effective grant is wider than the adapter's table.** `ls` and
  `find` ran unprompted under `--permission-mode acceptEdits` despite
  not appearing in the six `Bash(...)` patterns. **Narrowing the six
  cannot narrow the effective grant** (undercuts T-025-s4's premise).
- **`cp <glob>` is structurally refused** — "Glob patterns are not
  allowed in write operations" — independent of any pattern, so stage
  0's literal instruction can never be granted by widening `Bash(cp:*)`.

## 3. The central claim: the trigger is a STATE, not a MESSAGE

**An executor does not send anything when it finishes.** It commits to
its branch, stamps `status: verifying` and `built_by:` on the card, and
leaves a worktree on disk. That triple IS "I am finished."

Four consequences, each of which is why a message channel is the wrong
instrument for the HANDOFF:

1. **Neither end must be alive.** Claude finishes tonight; Codex
   verifies Friday. No socket does that.
2. **A crash loses nothing.** A commit survives; an in-flight message
   does not.
3. **A message is a claim; state is a fact.** This is ADR-017's whole
   thesis. If Claude *says* "done" while the suite is red, the message
   lies and the tree cannot.
4. **It stays hand-drivable (ADR-001).** Two humans with text editors
   can run this method. Two humans cannot open a socket to each other.

**What Codex needs to begin is already on disk when the commit lands:**
the card's spec sections, the branch and its tip, the commit it was cut
from, and the standing obligations. **None of it requires Claude to have
said anything.** The handoff completes itself.

## 4. Topology — three options, one answer

**(a) Executor hands off directly to the verifier. REJECT.** Three
independent defects: the executor would choose its own examiner; it
would pass context forward, which is precisely what the verifier must
not receive (§6); and an executor that crashes never hands off, so the
lane dies silently rather than loudly.

**(b) Architect polls and routes.** What happens today. Correct,
auditable, survives everything — and requires the architect awake.

**(c) The board computes what is owed; the architect approves. TAKE
THIS.** A card at `status: verifying`, with a live lane and no verdict
in `## Verdicts`, means the verifier is owed. That is arithmetic over
facts on disk, not a message anyone sent. It degrades to (b) exactly
when the app is closed, which is the property that makes it safe.

**The architect stays in the loop for role assignment**, because
choosing who examines whom is a policy decision (which model, is the
fence free, is the ceiling reached) and belongs in one place.
`orchestrator.md:19` already says propose and wait.

## 5. What Codex offers — NOW MEASURED (2026-08-20)

**Superseding §0's caveat**: the CLI was found — it ships INSIDE the
ChatGPT desktop app at
`/Applications/ChatGPT.app/Contents/Resources/codex` (arm64 Mach-O,
`codex-cli 0.147.0-alpha.1.2`). The earlier "not installed" claim was a
probe error: `command -v`, login-shell PATH and an app-bundle search
for `Codex.app` all miss a binary living in ChatGPT.app's Resources.
The human corrected it. `--version`, `--help`, `exec --help` and
`exec resume --help` are captured verbatim in
`docs/research/captures/codex-cli-*-2026-08-20.txt`; all four exit 0
and none spawns a turn.

Measured against those captures (published-docs claims that survived
are unmarked; corrections are bold):

| need | Claude Code (measured) | Codex (measured 0.147.0-alpha.1.2) |
|---|---|---|
| non-interactive | `-p` | `exec` subcommand |
| machine-readable stream | `--output-format stream-json --include-partial-messages --verbose` | `--json` (JSONL) |
| resume | `--resume <uuid>` | `exec resume <id>` or `--last` |
| model selection | **not passed, by decision** | `--model` / `-m` **exists** |
| permission model | **pattern-based** allowlist over command strings | **mode-based** sandbox (`--sandbox read-only`, `--full-auto`) |
| final message | `result` line | `--output-last-message FILE` |
| no session on disk | — | `--ephemeral` |
| event shape | `system` / `assistant` / `stream_event` / `result` | `TurnStarted` / `TurnCompleted` / `ItemStarted` / `ItemCompleted` |

**Three measured findings the published docs did not carry:**

1. **`codex exec` accepts `--dangerously-bypass-approvals-and-sandbox`
   and `--dangerously-bypass-hook-trust`.** These are the Codex
   spellings of the flag class the adapter table's standing bypass ban
   exists for. The ban iterates `ADAPTERS`, so a Codex entry inherits
   it automatically — but the ban's pattern must MATCH these spellings,
   and that is now checkable against a capture rather than a guess.
2. **Auth is `codex login` / `codex logout` at top level** — where
   Claude's is `claude auth login`. A recovery-advice string that works
   for one CLI is wrong for the other; T-082's class, cross-harness.
3. **`-C/--cd <DIR>` sets the working directory and `--add-dir`
   widens it** — the same pair of knobs whose absence/presence the
   Claude adapter's containment story rests on. `--skip-git-repo-check`,
   `--ephemeral`, `--ignore-user-config` and `--ignore-rules` also
   exist and each is a containment-relevant decision for the entry.

**THE DIFFERENCE THAT MATTERS MOST IS NOT THE FLAGS. IT IS WHAT A
DENIAL MEANS.** The docs state that in `exec` mode "approval requests
cause immediate failure unless policies are set to auto-approve."

So on the same event the two harnesses behave **oppositely**:

- **Claude degrades**: records the denial, the agent routes around it,
  the turn completes.
- **Codex terminates**: the turn dies.

A brief that works for Claude under a slightly-too-narrow policy will
*hard fail* for Codex. Any cross-harness dispatcher must treat the
permission policy as **per-adapter and load-bearing**, never as a shared
default.

### §5 Addendum 1 — the Codex SKILL form, measured 2026-09-08 (T-246)

**Cite this section by number.** T-241, T-242 and T-244 may state a
Codex claim only from here or from the captures it names.

**The one paragraph.** Codex's reusable-prompt unit is a *skill*, and
it is the same object as Claude's: a directory holding a `SKILL.md`
whose YAML frontmatter carries `name:` and `description:`, with
optional `scripts/`, `references/`, `assets/` and `agents/openai.yaml`
beside it. Codex injects a `<skills_instructions>` block listing every
discovered skill — name, description, and a source locator — into every
turn's prompt, so a skill is selected by the model from its
`description` and may also be invoked explicitly by the user with the
`$<name>` sigil (`$visualize`, `$template-creator` — the vendor's own
spelling), or picked from the composer's mention list and the slash
popup's "Skills" group. Skills are discovered at four locations, all
measured by planting probes and reading `codex debug prompt-input`:
`$CODEX_HOME/skills/<name>/` (user level, `~/.codex/skills`),
`<project>/.codex/skills/<name>/` and `<project>/.agents/skills/<name>/`
(both project level, and **neither needs a git repository nor a
`[projects.*] trust_level` entry**), and `<plugin>/skills/<name>/`
inside an installed plugin, which registers namespaced as
`<plugin>:<skill>` while the other three register under the bare
`name:`. `<project>/skills/<name>/` is **not** discovered. The ChatGPT
desktop app and this CLI **share one installation**: the app writes
`CODEX_HOME = "~/.codex"` and `CODEX_CLI_PATH =
"/Applications/ChatGPT.app/Contents/Resources/codex"` into the same
`~/.codex/config.toml` the CLI reads, and a terminal `codex mcp list` /
`codex plugin list` returns the app's own servers and plugin roster —
so there is one place to install, not two. On MCP: both accept a
server, registered with `codex mcp add <NAME> (--url <URL> | --
<COMMAND>...)` into `[mcp_servers.<name>]` in that same shared
`config.toml`, or shipped inside a plugin via `plugin.json`'s
`mcpServers` field or a companion `.mcp.json`; Codex can also *be* an
MCP server (`codex mcp-server`, stdio). **But a project-local
`.mcp.json` is NOT read** (measured), so an MCP surface onto
`npx supertaskr` is a user-level install step while a skill is a directory
a clone already carries.

**The card's fallback branch does not fire.** T-246 asked what to do
"IF no reusable-prompt mechanism exists on this machine's Codex
version". One exists, it is first-class, and it is shaped like
Claude's — so Supertaskr does not fall back to a pasted brief on the Codex
side, and D-X1's hand-driven path stays a *choice* rather than a
necessity.

**What this changes for the second adapter.** Nothing in §7's list is
retired — the event-schema work stands. What it adds is that the
*content* half of a cross-harness dispatch is now nearly free: one
`SKILL.md` body can be installed for Claude at
`.claude/skills/<name>/SKILL.md` and for Codex at
`.codex/skills/<name>/SKILL.md`, both repo-local, both discovered
without configuration. The per-vendor cost is the wrapper, not the
prose. The asymmetry that remains is MCP, which is user-level on the
Codex side.

**Provenance, against §0's rule.** This addendum is MEASURED, not read.
Every figure comes from running
`/Applications/ChatGPT.app/Contents/Resources/codex`
(`codex-cli 0.147.0-alpha.1.2`) or from reading the files it reads, on
2026-09-08, on Mac.lan; no model turn was spawned and nothing was
billed. The captures are
`docs/research/captures/codex-skill-form-2026-09-08.md` (the record,
including the disagreements and the gaps),
`codex-skill-discovery-probe-2026-09-08.txt` (the planted-probe
experiment with its negative control),
`codex-cli-plugin-help-2026-09-08.txt`, `codex-cli-mcp-help-2026-09-08.txt`
and `codex-cli-version-2026-09-08.txt`. **§0's sentence that the binary
is "not installed" is false as a present-tense claim** and survives
above only as the record of a probe error; §5's own opening already
supersedes it. **The five URLs in §10 were not consulted for any
sentence here.**

**Two gaps, stated rather than guessed.** The desktop app's GUI was
never opened — the app-side invocation finding is a read of the app
bundle's own message catalogue, not of a running composer, and someone
should confirm by eye that `$` opens the skill list. And precedence on
a name collision between a project skill and a user skill of the same
name was not measured.

## 6. The one thing that must be WITHHELD rather than transmitted

`method/roles/verifier.md:3` — the verifier receives "ONLY the task file
and the diff, **never the executor's reasoning**".
`method/roles/executor.md:14` — the executor appends implementation
notes "**to the task file**".

**Same file.** Every card this pipeline has ever verified has carried
the executor's reasoning into the verifier's hands, and a human cannot
un-read what they have read.

This matters *more* cross-harness, not less: independence is the entire
product you buy by putting Codex on the other side, and it is spent
before the review begins. **A program can simply not send that
section.** This is the single place in the pipeline where automating
beats the human practice outright rather than merely faster.

Evidence that the blindness is worth defending: T-029's rejection (a
latched auth status that would have relabelled a full disk as an expired
login), T-078's rejection, and T-073's verifier finding two passing
reverts of the guard its own card had just built. All three came from
attacking criteria, not from reading notes.

## 7. Where Supertaskr's design holds, and where it breaks

**Holds better than expected.** `AgentAdapter` is fully declarative —
`key`, `binary`, `min_major`, `spawn_args`, `resume_args`, `parse` — and
**`parse` is already a `ParseMode` enum**. The seam for a second event
schema exists. Codex's `exec` is just the first element of `spawn_args`;
its resume id is one argv element, which is exactly what
`SESSION_ID_SLOT` requires.

**Breaks in the runner's taxonomy, not the table — but more narrowly
than this document first claimed.** An earlier revision of this section
said `TurnError::ToolDenied`'s doc comment ("the turn DIED because a
tool it needed was REFUSED") is *provably mis-specified*. **That was
wrong, and T-081's executor refuted it rather than accepting it from a
brief.** The variant is only ever constructed for a turn the CLI itself
flagged `is_error`, so the sentence is true of every turn that reaches
it. What the 2026-08-19 capture falsifies is the **inference** — denial
implies death — not the doc comment.

The real gap is narrower and still real: **nothing in the taxonomy
represents a denial the turn SURVIVED.** Claude produces exactly that
(two denials, agent recovered, `is_error: false`, exit 0) and before
T-081 it reached nobody, because the names rode `stderr_tail` on
`ExitNonZero` — a variant a successful turn never constructs. T-081
adds `RunEvent::Denied` for the surviving case and leaves the fatal
variant's wording alone.

**The cross-harness consequence survives the correction intact**, and is
the thing to carry forward: on the same event Claude degrades and Codex
terminates (published §5), so *fatal-or-recoverable* is a **per-adapter
property**. Today it is not a field at all — it is an assumption
distributed across which variant gets constructed.

**So the real work of a second adapter is:**
1. a `ParseMode::CodexThreadEventV1` and its parser — new code, but the
   seam is designed for it;
2. a normalisation layer mapping both event vocabularies onto the
   runner's existing internal events;
3. **per-adapter denial semantics** — is a refusal fatal or recoverable
   — which today is an unstated assumption baked into one variant;
4. a decision on `--model`, which Codex accepts and Claude is
   deliberately never given (§9 D5).

## 8. What to measure first — cheap, and it unblocks everything

In order, each costing approximately nothing:

1. **`codex --version`, `codex --help`, `codex exec --help`,
   `codex exec resume --help`.** Zero model calls, exit codes only.
   This is what T-082 did for Claude and it settled a shipped defect.
   **Nothing in §5 should be built on until this is run**, and the
   output belongs in `docs/research/captures/` beside the Claude turn,
   because a `--help` capture is evidence and a memory of one is not.

   **Resolve the binary through a LOGIN shell before concluding it is
   absent.** `command -v codex` and `zsh -lic 'command -v codex'` are
   different questions, and the runner has a login-shell probe
   precisely because a non-login shell's PATH is not the user's. On
   this machine both came back empty on 2026-08-19, which is how §0's
   claim was established — but a future reader who tries only the
   first and finds nothing has not measured the same thing.
   `min_major` is why `--version` leads: the adapter refuses below a
   major version rather than guessing at flag semantics.
2. **One real `codex exec --json` turn on a throwaway prompt**, captured
   to a file — the Codex twin of `docs/research/real-cli-observation.md`.
   One turn answered three open questions for Claude and closed two
   parked cards.
3. **One denial, deliberately provoked**, to confirm §5's central claim
   that a refusal is fatal in `exec` mode. If it is NOT fatal, §7's item
   3 evaporates and the adapter gets much cheaper.

## 9. Decisions this pass does not make

- **D-X1 — does the app spawn Codex, or only assemble its brief?** The
  hand-driven path (assemble, human pastes) needs no adapter at all and
  works today. It is the whole of F-04's first slice and should probably
  ship before any second adapter exists.
- **D-X2 — `--model`: SHAPED by the cockpit-or-mirror ruling
  (rooms/cockpit-or-mirror.md, 2026-08-20).** `model@session` is intent
  on the card (D3: the app writes `builder:`/`verifier:`), enforced
  per-adapter where Supertaskr spawns (Claude stays unpassed per ADR-003;
  Codex `exec` accepts `-m`, measured), honoured by the human where
  they paste. No global rule; the adapter entry carries it.
- **D-X3 — one sandbox policy per ROLE or per ADAPTER?** §5 says the
  same policy cannot mean the same thing on both, so this cannot be a
  single shared constant.
- **D-X4 — rooms as the agent-to-agent channel.** Handoff is state
  (§3), but **disagreement has no channel today**: a verifier that wants
  to ask rather than reject has no sanctioned move, which is why
  disagreements become rejections. `docs/rooms/` is the right shape —
  a file, durable, async, human-joinable — and ARCHITECTURE's interface
  line already anticipates "thread appends". Needs turn-taking so two
  agents appending do not conflict.
- **D-X5 — does `review: independent` need a stronger definition?** It
  currently means "different models". If Codex verifies a Claude build
  but reads its implementation notes, the mark overstates what happened
  (§6).

## 10. Sources for §5

- https://deepwiki.com/openai/codex/4.2-headless-execution-mode-(codex-exec)
- https://github.com/openai/codex/issues/2288
- https://github.com/openai/codex/issues/10233
- https://www.developersdigest.tech/blog/codex-exec-ci-headless-guide
- https://codex.danielvaughan.com/2026/04/18/codex-cli-headless-batch-mode-automation/

**Every one of these is documentation about a binary that is not
installed on this machine. §8 step 1 supersedes all of them.**
