---
id: T-246
title: Codex's skill form, measured — how a skill or prompt file is installed and invoked in the ChatGPT app's Codex and its CLI, captured verbatim on this machine before any Codex claim is made
feature: F-04
milestone: 4
size: S
priority: 1
status: done
suggested_by: "@human (2026-09-08): \"lets keep the focus on driving from the native apps\" — ADR-021 Addendum 1; the cross-harness plan's rule that a Codex claim is a hypothesis until captured"
blocked_by: []
touches: [docs/research/captures, docs/design/cross-harness-plan.md]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
verified_by: claude-opus-5@subagent
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

### 2026-09-08 — claude-opus-5@subagent — APPROVED

Blind verifier, phase 2, run on the bench `/Users/ujju/Projects/nputer-V-T-246`
detached at `6ae143139232742b65172aec0218ab5a2c4651f8`.

attack set: sha256:3218587e46287bc8003234de17f6ed7a0205feb94b6fb7685b774e0d09faeae1 (attack-set-T-246.md)
ground truth: sha256:5beee348749ec48fc110ea782de5c8f721af519ab6173ebf86013a4e31a0037d (ground-T-246.md)

FRAME: I read, in this order — (1) the card at the base ref `9d0e385`,
(2) the sealed phase-1 attack set, digest verified before opening,
(3) the dispatcher's base-ref ground truths, digest verified,
(4) `docs/STATE.md` and `docs/CONVENTIONS.md` at the tip, (5)
`method/roles/verifier.md` in full, (6) only then the diff and the
captures. **Two leaks, disclosed rather than hidden.** The very first
command I was given to run, `git checkout --detach 6ae1431`, printed the
lane tip's own commit SUBJECT, which is executor-authored prose stating
the findings ("a SKILL.md directory, the same shape as Claude's,
discovered repo-locally at .codex/skills and .agents/skills; the app and
the CLI share one ~/.codex; MCP is accepted by both but is user-level")
— so the conclusion reached me before the card did, and no discipline of
mine could have prevented it. Later, adjudicating the notes' base-ref
claim required `git log --oneline 9527a148..6ae1431`, which exposed
further commit subjects. I did not read the executor's report; the card's
Implementation notes I read only to enumerate claims, each of which I
then re-measured myself. Phase 1's no-tool property was kept BY
INSTRUCTION, because this harness cannot deny tools; its own frame
disclosure states no tool was called, and the dispatcher's header records
zero tool calls for that spawn.

**This is a MEASUREMENT card, so I judged it by re-running it, not by
reading it.** Everything below was re-derived at `6ae1431` on this
machine today.

**Reproduced, independently, at my own ref**

- `codex --version` → `codex-cli 0.147.0-alpha.1.2`, exit 0; matches the
  capture and ground truth G4. Binary sha256 `9f6748b4…06e481` matches G3.
- **All 13 help captures are byte-identical to live output**, each with
  its claimed exit 0. I extracted each recorded `$ codex …` command, ran
  it, and diffed: `TOTAL=13 MISMATCH=0`. The only delta before
  normalisation was the capture's own `[exit 0]` annotation line — which
  is the in-file exit code the record owes.
- `codex --help` is still byte-identical to the 2026-08-20 capture
  (`diff` exit 0), confirming the record's own claim that the version has
  not moved between sittings.
- **The discovery experiment reproduces with probe names of my own
  choosing** (`vprobe-*`, so I re-ran the experiment rather than re-read
  it). Negative control, empty directory: 0 occurrences of every name.
  Positive arm: `.codex/skills/<n>/` DISCOVERED, `.agents/skills/<n>/`
  DISCOVERED, bare `skills/<n>/` NOT discovered. I added a fourth
  falsifier the lane did not have — a never-installed name — which scored
  0 in both arms. The directory was not a git repository and had no
  `[projects.*]` trust entry. **The control is armed differently from the
  subject and it can fail**: the planted-but-undiscovered `skills/<n>/`
  arm is the discriminator, and it fired.
- Plugin-contributed skills render namespaced `<plugin>:<skill>` with
  `file:` locators under `~/.codex/plugins/cache/…` — verbatim as claimed.
- The `<skills_instructions>` definition block quoted in the record is
  verbatim correct against my own render.
- **The record's "five `.system` skills" is exact and non-obvious**: six
  directories under `~/.codex/skills/.system` carry a `SKILL.md`, but
  exactly five RENDER; `review-agent` does not. The claim was about
  rendering and it re-derives.
- `codex mcp list` → `node_repl` enabled, `computer-use` disabled, as
  claimed. `codex plugin list` → the nine installed-and-enabled plugins
  are exactly the roster the record names. `codex plugin marketplace
  list` → the three named marketplaces.
- **The `.mcp.json` negative reproduces**: I planted a `.mcp.json`
  declaring `vprobe-t246-mcp`, ran `codex mcp list` from that directory,
  exit 0, 0 occurrences — while both real servers still listed, which is
  the internal positive control proving the command worked.
- Every app-bundle string claim is present in `app.asar`
  (`composer.skillMentionList`, `composer.atMentionList.skills`,
  `composer.slashCommands.skillsGroup`, `No skills or apps found`,
  `$skill-creator`).
- Vendor quotations are verbatim-exact: `visualize`'s
  `agents/openai.yaml` `default_prompt`, and the `skill-installer` /
  `skill-creator` sentences.
- **All three recorded disagreements are real.** §0's "not installed"
  sentence is at line 17; §10 holds exactly five URLs; and the binary
  contains "installable bundle with skills plus commands" while the
  shipped `plugin-json-spec.md` has NO `commands` field though all 13
  fields the record lists are present.
- **Nothing was left on the machine.** No probe artefacts anywhere under
  `~/.codex`; `~/.codex/prompts` is still absent as at ground truth G8;
  `~/.codex/skills` predates the lane (Jul 28); and `config.toml` is
  unchanged at 4734 bytes, mtime Sep 7 16:17 — byte-for-byte the ground
  truth's reading. The record's "nothing was installed, enabled,
  disabled or written to `~/.codex/`" is corroborated externally.
- Security sweep: the attack set's exact grep over every added file
  returns only false positives (`di**sk-f**ull-read-access` matching
  `sk-`, a help line naming a bearer-token env var, and a pre-existing
  `SESSION_ID_SLOT` outside the added block). No key, token, session id
  or address. No `curl`/`wget`/`npx` and no model turn in any recorded
  command; no turn was spawned by me either.
- Scope: no path under `method/` or `app/`; no `*-2026-08-20.txt` capture
  modified; `T-241`/`T-242`/`T-244` untouched. The addendum is citable as
  **§5 Addendum 1**, correctly nested inside §5 and greppable by a stable
  name. App-surface claims are labelled as bundle-catalogue reads with
  the un-opened GUI stated as a gap — the arming collapse the role warns
  about did not happen: the shared-home finding rests on app-AUTHORED
  state in a file a terminal invocation would never produce.

**Gates at the lane tip, every exit read unpiped and every count read**

- docs gate on the seven changed paths: **exit 1** — FIRES, 7 paths are
  code inputs, naming three suites; "every live task card's frontmatter
  parses, with a legal status"; 0 frontmatter issues.
- `npx vitest run` from `lib/parser/`: **exit 0**, 16 files, **377 tests**.
- `npm test` from `app/`: **exit 0**, 51 files, **1163 tests**.
- `npm test` from `tools/e2e/` at `NPUTER_E2E_PORT=25246`: **exit 0**,
  **652 passed** (10.5m).

**Findings — four accuracy defects, none of which falsifies a
measurement, all recorded rather than waved past**

1. The addendum renders the app's write as `CODEX_HOME = "~/.codex"` in
   backticks. The file's actual bytes are
   `CODEX_HOME = "/Users/ujju/.codex"`; the tilde form appears **0**
   times in `config.toml` (`grep -c 'CODEX_HOME = "~/.codex"'
   ~/.codex/config.toml` → 0). The capture record gets this right; only
   the addendum abbreviates, inside backticks, where a dependent card
   might grep for it.
2. Record §5 introduces the `config.toml` block with "contains,
   verbatim". Every quoted line IS byte-present exactly once — so the
   sentence is true line-by-line — but the block silently elides
   `args = []`, `startup_timeout_sec = 120` and the nine env keys
   between `CODEX_HOME` (line 118) and `CODEX_CLI_PATH` (line 127), with
   no ellipsis marking the omission. Redacting those values is good
   practice; presenting the result as unbroken verbatim is the defect.
3. The addendum says the four locations were "all measured by planting
   probes and reading `codex debug prompt-input`". Two of the four — the
   user-level `~/.codex/skills` row and the plugin row — were measured by
   reading the rendering of PRE-EXISTING installs, not by planting. The
   record's own table states each row's method correctly; only the
   one-paragraph summary over-generalises the method.
4. The Implementation notes state the lane's base as
   `9527a1480b08c406ae2996d6841b9cf1f2baf08b`. The actual base is
   `9d0e385ac72c7b1c97172cf8bac94d7d7c502117`: `git merge-base 6ae1431
   9d0e385` → `9d0e385`, and `git log --oneline 9527a148..6ae1431`
   returns **15** commits, not one. A stated ref that does not resolve is
   the figure case this role's own closing section names.

**Why APPROVED rather than REJECTED.** All six acceptance criteria are
met and, unusually, every decisive claim survived being re-run by a
different seat with different probe names on the same machine. The
fallback branch correctly does not fire, and the addendum says so
explicitly. The four findings are prose-accuracy defects in supporting
text — a shorthand path, a missing ellipsis, an over-general method
sentence, a wrong base sha — and not one of them changes a finding or
would mislead a dependent card about the Codex skill form. They are
filed as `T-246-s1`, not folded into this verdict as blockers.

Gates re-run at MY OWN tip after this verdict and the suggested card were
written, per role step 7 — recorded in the commit that carries them.

