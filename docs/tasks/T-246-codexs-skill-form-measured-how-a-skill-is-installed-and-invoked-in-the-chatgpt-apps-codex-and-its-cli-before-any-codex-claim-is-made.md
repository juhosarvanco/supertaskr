---
id: T-246
title: Codex's skill form, measured — how a skill or prompt file is installed and invoked in the ChatGPT app's Codex and its CLI, captured verbatim on this machine before any Codex claim is made
feature: F-04
milestone: 4
size: S
priority: 1
status: verifying
suggested_by: "@human (2026-09-08): \"lets keep the focus on driving from the native apps\" — ADR-021 Addendum 1; the cross-harness plan's rule that a Codex claim is a hypothesis until captured"
blocked_by: []
touches: [docs/research/captures, docs/design/cross-harness-plan.md]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
verified_by:
review: independent
---

## Why this card exists

ADR-021 makes the native agent apps the driver, and Addendum 1 makes
that the focus. On the Claude side the skill mechanism is measured
(this repository's own `.claude/` hooks and the T-167 discovery of
`.claude/skills/<name>/SKILL.md`). On the Codex side the record holds
only `codex --help`, `exec --help` and `exec resume --help` captures
from 2026-08-20 (docs/research/captures/); nothing about how a skill,
a slash command or a prompt file is installed and invoked in the
ChatGPT desktop app's Codex or in the CLI that ships inside it.
T-241 and T-242 cannot claim a Codex form until this exists.

## Acceptance criteria

- WHEN the card is built THE record SHALL gain captures, verbatim and
  dated, of: the Codex CLI's version; every command or file
  convention by which a reusable prompt or skill is registered (the
  binary's own `--help` output and the directories it reads, measured
  by running it, not by reading published docs); how such a prompt is
  invoked from the ChatGPT desktop app's Codex surface; and whether
  the app and the CLI read the same location.
- WHEN a published claim and a measurement disagree THE capture SHALL
  win and the disagreement SHALL be written down, the cross-harness
  plan's §5 way.
- WHEN the measurement is done THE cross-harness plan SHALL gain a
  §5 addendum stating the Codex skill form in one paragraph, and
  T-241/T-242 SHALL be able to cite it by section.
- IF no reusable-prompt mechanism exists on this machine's Codex
  version THEN the addendum SHALL say so and name the fallback (a
  pasted brief), and the cards SHALL ship the Claude form alone.
- **Added 2026-09-08 from the GSD Core read:** WHEN the Codex form is
  measured THE capture SHALL also record whether the ChatGPT app's
  Codex and the CLI accept an MCP server, and how — GSD ships a
  `gsd-mcp-server` over its command and state interface points, and one
  MCP surface onto `npx nputer`'s verbs and the parsed board may be the
  vendor-neutral driver ADR-021 Addendum 1 wants; T-241 and T-244 weigh
  it against per-vendor skills once this capture exists.
- Nothing under method/ or app/ moves; the docs gate SHALL be run.

## Implementation notes
<!-- executor appends before finishing -->

Built 2026-09-08 on `task/T-246-codex-skill-form`, base
`9527a1480b08c406ae2996d6841b9cf1f2baf08b`.

**The instrument that made this cheap.** `codex debug prompt-input`
renders the model-visible prompt as JSON and spawns no turn. Because
Codex injects a `<skills_instructions>` block listing every discovered
skill with its source locator, skill discovery is *directly
observable* for free. No model turn was spawned; nothing was billed;
nothing was installed or written under `~/.codex/`.

**The fallback branch does not fire.** A reusable-prompt mechanism
exists and is first-class: a `SKILL.md` directory, the same shape as
Claude's. So the "IF no mechanism exists ... pasted brief" criterion is
answered in the negative, and the addendum says so.

**Discovery was measured, not read** — three candidate project-local
paths planted in one scratch directory against a clean negative
control. `.codex/skills/<n>/` and `.agents/skills/<n>/` are discovered;
bare `skills/<n>/` is not; no git repo and no `trust_level` entry
needed. The arms and controls are in
`docs/research/captures/codex-skill-discovery-probe-2026-09-08.txt`.

**The app/CLI shared-home question answered itself in the app's own
writing**: `~/.codex/config.toml` carries an `[mcp_servers.node_repl]`
entry the desktop app wrote, declaring `CODEX_HOME = "~/.codex"` and
`CODEX_CLI_PATH` = the binary inside ChatGPT.app — the same binary
every command here ran against.

**MCP, the criterion added today**: both surfaces accept a server via
`codex mcp add <NAME> (--url <URL> | -- <COMMAND>...)` landing in the
shared `config.toml`, or inside a plugin via `mcpServers`/`.mcp.json`;
Codex can also *be* one (`codex mcp-server`). A project-local
`.mcp.json` is **not** read (measured). So for T-241/T-244: the skill
is repo-shippable, the MCP server is a user-level install.

**A false finding I caught and did not ship.** `codex plugin add
--help` appeared to print the root help. It was my own shell: zsh does
not word-split an unquoted `$var`, so `codex "plugin add" --help` was
read as a *prompt*. Re-run properly it behaves correctly. Nothing about
this reached the captures.

**Fence.** `npm install` from `app/` was refused (EACCES on
`app/package-lock.json`) — correctly, it is outside the fence. `npm ci`
is the non-mutating equivalent, exits 0, and leaves the lockfile
untouched; `git status` confirms only the fenced paths changed.

**Ceremony ruling, recorded rather than asked.** The diff is docs-only,
which the ceremony table's rule of thumb ("docs, method and tooling
self-integrate") routes to the cheapest row — no verifier owed, and the
blast-radius rungs are explicitly advisory. But the card was dispatched
carrying `verifier:` and `review: independent`, and this is a
MEASUREMENT card whose whole value is that its claims are re-runnable.
Stamped `verifying` rather than `done`: the cheaper stamp risks
skipping a guarantee, the dearer one costs one session, and the
worktree is worth keeping because "a worktree deleted before the
verdict destroys the only reproducible copy of what was measured" has
maximum force on a card that is nothing but measurement. This lane was
not declared the seat holder, so it merges nothing and removes nothing:
ready-to-merge, worktree standing.

## Verdicts
