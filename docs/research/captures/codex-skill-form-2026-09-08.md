# Capture: Codex's skill form, measured on this machine (2026-09-08)

The record for T-246. Everything below was produced by RUNNING the
binary that ships inside the ChatGPT desktop app, or by reading the
files that binary reads. **No claim here is taken from OpenAI's
published documentation**, which is what §5 of
docs/design/cross-harness-plan.md was originally built on and what its
2026-08-20 addendum began to replace. Where a published claim and a
measurement disagree, the measurement is recorded as the fact and the
disagreement is written down (§ "Where published claims and the
measurements disagree").

- binary: `/Applications/ChatGPT.app/Contents/Resources/codex`
- version: `codex-cli 0.147.0-alpha.1.2` (`codex --version`, exit 0)
- host: Mac.lan; date: 2026-09-08
- **No model turn was spawned and nothing was billed.** Every command
  was a `--help`, a local listing, or `codex debug prompt-input`, which
  renders the prompt without sending it. Every one exited 0.
- Nothing was installed, enabled, disabled or written to
  `~/.codex/`. Every probe was planted in a scratch directory.

Companion captures, verbatim, same date:
`codex-cli-version-2026-09-08.txt`, `codex-cli-plugin-help-2026-09-08.txt`,
`codex-cli-mcp-help-2026-09-08.txt`, `codex-skill-discovery-probe-2026-09-08.txt`.
The 2026-08-20 set (`codex-cli-help-*`, `codex-cli-exec-help-*`,
`codex-cli-exec-resume-help-*`) still stands: `codex --help` at this
ref is **byte-identical** to the file captured then (`diff` exit 0), so
the version has not moved between the two sittings.

## 1. The instrument, and why the answer is a measurement rather than a reading

`codex debug prompt-input [PROMPT]` — "Render the model-visible prompt
input list as JSON" — prints exactly what would be sent to the model
and stops. It costs nothing and it makes skill discovery *directly
observable*, because the rendered prompt carries a
`<skills_instructions>` block listing every skill Codex found, each
with a source locator. That block is Codex's own definition of the
mechanism, quoted verbatim:

> A skill is a set of instructions provided through a `SKILL.md`
> source. Below is the list of skills that can be used. Each entry
> includes a name, description, and source locator. `file` locators are
> on the host filesystem, `environment resource` locators are owned by
> an execution environment, `orchestrator resource` locators are opaque
> non-filesystem resources, and `custom resource` locators use their
> provider's access mechanism.

Entries render as `- <name>: <description> (file: <absolute path>)`,
and a skill contributed by a plugin renders namespaced as
`- <plugin>:<skill>: ...`.

## 2. What a skill IS, on disk

A directory containing `SKILL.md`, whose YAML frontmatter carries
`name:` and `description:` — **the same shape as Claude's
`.claude/skills/<name>/SKILL.md`** (T-167). Optional siblings observed
in the shipped skills: `scripts/`, `references/`, `assets/`, and
`agents/openai.yaml` (per-agent interface metadata). Only `SKILL.md` is
required; the vendor's own `skill-creator` calls the rest "optional
bundled resources".

The `description` is load-bearing and not decorative: it is the entire
text the model sees before deciding to open the skill, which is why
every shipped one is written as a "use when / do not use when" clause.

## 3. Where a skill may live — every location, measured

| location | scope | discovered? | how measured |
|---|---|---|---|
| `$CODEX_HOME/skills/<name>/SKILL.md` (`~/.codex/skills`) | user | YES | the five `.system` skills there render in `<skills_instructions>` with `file:` locators under `~/.codex/skills/.system/` |
| `<project>/.codex/skills/<name>/SKILL.md` | project | YES | planted probe, negative control clean |
| `<project>/.agents/skills/<name>/SKILL.md` | project | YES | planted probe, negative control clean |
| `<project>/skills/<name>/SKILL.md` | project | **NO** | planted probe, not discovered |
| plugin `<plugin>/skills/<name>/SKILL.md` | installed plugin | YES, namespaced `<plugin>:<skill>` | the installed roster renders from `~/.codex/plugins/cache/<marketplace>/<plugin>/<version>/skills/` |

The probe arms, their controls and the verbatim registration lines are
in `codex-skill-discovery-probe-2026-09-08.txt`. Two facts from it that
matter for shipping a skill inside a repository:

- **Project-local discovery needs neither a git repository nor a
  `[projects."<path>"] trust_level` entry** in `~/.codex/config.toml`.
  The probe directory had neither.
- A project skill registers under its **bare `name:`**, in the same
  namespace as the user-level skills — so a project skill named
  `nputer` and a user skill named `nputer` collide by construction.
  Precedence between the two was NOT measured (see § Gaps).

`$CODEX_HOME/skills` is also what the vendor's own tooling names. The
shipped `skill-installer` skill's description, verbatim: "Install Codex
skills into $CODEX_HOME/skills from a curated list or a GitHub repo
path." Its body adds: "Installs into `$CODEX_HOME/skills/<skill-name>`
(defaults to `~/.codex/skills`)." The shipped `skill-creator` says it
will "place it in `$CODEX_HOME/skills` (or `~/.codex/skills` when
`CODEX_HOME` is unset) so Codex can discover it automatically."

## 4. How a skill is INVOKED

Two affordances, both measured, neither requiring a model turn to
observe:

1. **The `$<name>` sigil.** This is the vendor's own spelling. From the
   shipped `visualize` plugin's `agents/openai.yaml`, verbatim:
   `default_prompt: "Use $visualize to create an interactive visual
   when a chart, map, diagram, simulation, 3D model, data explorer, or
   UI preview would make the result easier to understand or adjust."`
   The shipped `template-creator` skill's own description says "Use
   when the user invokes $template-creator". The ChatGPT desktop app's
   bundle contains the literal `$skill-creator` in the same usage.
2. **Selection from the composer.** The desktop app's bundle carries
   the message ids `composer.skillMentionList.*` (default message for
   the empty state: "No skills or apps found"),
   `composer.atMentionList.skills` ("Skills") and
   `composer.slashCommands.skillsGroup` ("Skills") — so skills are
   offered in the app's mention list AND as a group inside the slash
   command popup. The CLI's TUI carries the matching string "Type / to
   open the command popup; Tab autocompletes slash commands." and a
   settings surface enumerating "Instructions, Skills, MCP servers,
   Agents, Hooks, Slash commands, Memory, Chat sessions".

A skill is also **auto-selected**: it does not require the sigil at
all. The `<skills_instructions>` block is injected into every turn's
prompt, so the model chooses a skill from the `description` text. The
sigil is the explicit form, not the only form.

**A skill is not a slash command.** They are separate categories in
both surfaces' own settings vocabulary; skills merely also *appear*
under the slash popup's "Skills" group.

## 5. Do the ChatGPT app and the CLI read the same location? YES — and the app is the writer

This is the strongest measurement in the capture, because the evidence
is the app's own writing in the file the CLI reads.
`~/.codex/config.toml` contains, verbatim:

    [mcp_servers.node_repl]
    command = "/Applications/ChatGPT.app/Contents/Resources/cua_node/bin/node_repl"

    [mcp_servers.node_repl.env]
    CODEX_HOME = "/Users/ujju/.codex"
    CODEX_CLI_PATH = "/Applications/ChatGPT.app/Contents/Resources/codex"

The desktop app registered a server whose command is an app-bundle
binary, and declared in that entry that `CODEX_HOME` is `~/.codex` —
the directory holding the very file — and that the CLI is the binary
inside its own bundle, which is the binary every command in this
capture was run against. Three further confirmations, all measured:

- `codex mcp list` run from a terminal lists the app's own servers
  (`node_repl` enabled, `computer-use` disabled).
- `codex plugin list` run from a terminal lists the app's installed
  plugin roster (`documents`, `pdf`, `spreadsheets`, `presentations`,
  `template-creator`, `browser`, `computer-use`, `visualize`,
  `github`), and `~/.codex/config.toml` holds the matching
  `[plugins."<name>@<marketplace>"]` enablement entries.
- `config.toml`'s `notify` key points at the app's Computer Use client.

**Consequence for nputer: there is one place to install, not two.** A
skill written to `~/.codex/skills/<name>/` is reachable from the CLI
and from the desktop app's Codex surface, because they are the same
installation.

## 6. MCP — the criterion added 2026-09-08. Both accept one; Codex can also BE one

Measured from `codex-cli-mcp-help-2026-09-08.txt` (8 commands, all exit 0):

- **Registering a server**: `codex mcp add [OPTIONS] <NAME> (--url <URL> | -- <COMMAND>...)`
  — stdio by way of a trailing `-- <COMMAND>...`, or streamable HTTP by
  `--url`. `--env <KEY=VALUE>` (stdio only), `--bearer-token-env-var`,
  `--oauth-client-id` and `--oauth-resource` (HTTP only).
- **Managing servers**: `codex mcp list | get | add | remove | login | logout`.
- **Where they live**: `~/.codex/config.toml`, as `[mcp_servers.<name>]`
  with `command`, `args`, `startup_timeout_sec`, `enabled` and an
  `[mcp_servers.<name>.env]` table. Measured directly in the live file.
- **A plugin may ship one**: `plugin.json`'s `mcpServers` field is
  either a path to a companion `.mcp.json` or an inline object of
  server configs. The shipped `computer-use` plugin's `.mcp.json` is
  the worked example, with `command`, `args`, `cwd` and `env_vars`.
- **A project-local `.mcp.json` is NOT read.** Measured: a `.mcp.json`
  declaring `probe-t246-mcp` was planted in a scratch directory and
  `codex mcp list` run from that directory did not list it (exit 0,
  zero occurrences). A repository cannot hand Codex an MCP server by
  dropping a file in its root the way it can hand it a skill.
- **Codex can be the server rather than the client**: `codex mcp-server`
  — "Start Codex as an MCP server (stdio)".

So the vendor-neutral driver ADR-021 Addendum 1 wants is available on
both sides here, but it is a **user-level installation**
(`codex mcp add`, landing in `~/.codex/config.toml`), not something a
cloned repository configures for itself. That asymmetry is the finding
T-241 and T-244 have to weigh: **the skill is repo-shippable; the MCP
server is not.**

## 7. Plugins — the packaging layer above a skill

A plugin is a directory with `.codex-plugin/plugin.json` and,
optionally, `skills/`, `hooks.json`, `.mcp.json`, `apps`, `scripts/`
and `assets/`. Measured field guide (from the shipped
`plugin-creator`'s `references/plugin-json-spec.md`): `name`, `version`,
`description`, `author`, `homepage`, `repository`, `license`,
`keywords`, `skills` (path), `hooks` (path), `mcpServers` (path OR
inline object), `apps` (path), `interface` (presentation metadata,
including `defaultPrompt`).

Plugins are installed from a **marketplace**, which is a
`marketplace.json` under `.agents/plugins/`. Three are configured on
this machine (`codex plugin marketplace list`): `openai-primary-runtime`,
`openai-bundled`, `openai-curated`. The vendor's own scaffold documents
two self-hosted destinations, both measured as text on disk:

- personal marketplace: `~/.agents/plugins/marketplace.json`
- **repo/team marketplace: `<repo-root>/.agents/plugins/marketplace.json`**,
  with the plugins themselves under `<repo-root>/plugins/`

`codex plugin add` installs only "from a configured marketplace
snapshot" — `codex plugin add <PLUGIN>@<MARKETPLACE>` or
`<PLUGIN> --marketplace <MARKETPLACE>`. There is no
`codex plugin add <path>`. So shipping nputer as a *plugin* costs a
marketplace file plus an install step; shipping it as a *skill* costs a
directory.

## 8. Where published claims and the measurements disagree

1. **cross-harness-plan §0 said the Codex binary is "not installed and
   not on the login-shell PATH on this machine".** Already superseded
   on 2026-08-20 and re-confirmed today: the binary is at
   `/Applications/ChatGPT.app/Contents/Resources/codex` and runs. §0's
   sentence is still on the page as a historical record of the probe
   error; it is false as a present-tense claim and the §5 addendum
   below says so.
2. **cross-harness-plan §10 lists five external sources for §5 and says
   "§8 step 1 supersedes all of them".** That is now doubly true: §8
   step 1 ran on 2026-08-20 and the present card ran the skill and MCP
   half. Nothing in this capture came from those five URLs, and none
   was consulted.
3. **The `commands` component has no manifest field.** The binary
   contains the plugin vocabulary sentence "Plugin -> installable
   bundle with skills plus commands, tools, MCP config, hooks, assets,
   apps, or marketplace metadata", and both surfaces show a "Slash
   commands" settings category — but the shipped `plugin-json-spec.md`
   field guide on this machine lists **no `commands` field**
   (`skills`, `hooks`, `mcpServers`, `apps`, `interface` only). Where
   the prose and the shipped spec disagree, the shipped spec is what
   this version's scaffold writes, so a plugin cannot be assumed to
   carry slash commands. Recorded rather than resolved.
4. **No disagreement was found on the skill mechanism itself.** The
   published shape (a `SKILL.md` directory) and the measured shape
   agree exactly. This is worth stating plainly because the card's
   fallback branch — "IF no reusable-prompt mechanism exists" — does
   **not** fire: one exists, it is first-class, and it is the same
   shape as Claude's.

## 9. Gaps — what was NOT measured, recorded rather than guessed

- **The desktop app's GUI was never opened.** §4's app-side finding is
  a static read of the app bundle's own message catalogue, not an
  observation of a running composer. Someone should confirm by eye that
  typing `$` in the app's composer opens the skill list. This needs the
  human or a screen-driving seat, so it is filed as a gap, not a claim.
- **Precedence on a name collision** between a project skill
  (`.codex/skills/x`) and a user skill (`~/.codex/skills/x`) was not
  measured — only that both namespaces are flat and therefore
  collidable.
- **`.codex/skills` vs `.agents/skills` priority**, if they differ, was
  not measured; both were discovered in the same run.
- **Whether a skill actually FIRES** — that a planted skill changes a
  turn's behaviour — was not measured, because it needs a model turn
  and the card forbids spending one. Discovery is measured; execution
  is not.
- **`codex exec`'s skill behaviour** was not separately measured; the
  probe used the default (TUI) prompt assembly path.
