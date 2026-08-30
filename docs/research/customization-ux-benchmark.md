# Customization UX benchmark — how developer tools actually ship it

Swept 2026-08-30 for T-168, the card that gates every UI card in the
customization feature (docs/rooms/loop-customization.md, @human's
FORM-FIRST ruling). **Every claim below was read out of the tool's own
current documentation during this sweep and carries the URL it was read
from; nothing here is written from memory.** Where a page did not say a
thing, this file says NOT FOUND rather than filling the gap. Claims are
paraphrased with their identifiers (paths, key names, flags) kept
exact; the vendors' prose is theirs and is not reproduced here.

It is a RECORD of one day's reading, not a standing truth: re-verify
before quoting it into a decision made later, because every vendor here
ships continuously. The decision it feeds is
`docs/rooms/customization-form.md`; the lessons are numbered L-1…L-12
at the end so the brief can cite rather than restate them.

## The four schools

- **Config-file school** — the unit of customization is a file the
  developer edits; the tool discovers it by walking the filesystem.
- **In-app settings school** — the unit is a control in a settings
  surface; the store is the tool's own and the file, if any, is an
  implementation detail.
- **Hybrid school** — a settings surface that reads AND writes the same
  files a developer may edit by hand, or a dashboard whose settings a
  checked-in file overrides.
- **Enterprise policy distribution** — how an organization gets rules
  onto machines whose keyboards it does not own, and stops them being
  edited away.

Almost every tool here sits in more than one school. That is the first
finding: the schools are not products, they are LAYERS of one product.

## School 1 — the config file

### ESLint (flat config)

- ESLint resolves configuration for a target file by looking in that
  file's directory and then searching up ancestor directories for an
  `eslint.config.*` file; the flat format uses ONE config per run
  rather than the old scattered cascade
  (https://eslint.org/docs/latest/use/configure/configuration-files).
- Within that config, later objects in the array override earlier ones
  on conflict — array order IS the precedence rule (same page).
- The docs recommend always pairing `extends` with a `files` key,
  warning that an extended config otherwise applies to everything
  (same page).
- Sharing is packaging: a shareable config is an npm package named
  `eslint-config-*` or `@scope/eslint-config`, exported from the
  module's `main` entry, consumed by importing it and adding it through
  `extends` (https://eslint.org/docs/latest/extend/shareable-configs).
- There is a first-party answer to "which config objects apply to this
  file": the config inspector, invoked as `--inspect-config`
  (configuration-files page).

**Does well.** Precedence is a total order a human reads top to bottom.
Distribution rides a registry that already has versions, ranges and a
lockfile: an org ships policy by publishing a package. The old cascade
was REMOVED on purpose — one file per run is legible where scattered
files were not.

**Breaks.** The merge is per-object, not per-rule, so "why is this rule
on" is a fold over an array rather than a lookup — which is why a
separate inspector had to exist. `extends` without `files` over-applies
silently, and the docs can only warn.

**Teaches nputer.** Layering is fine; UNREADABLE layering is not. With
four layers, "which layer set this" must be answerable by a command,
not by reading four files in order. And distribution can be someone
else's solved problem (L-3, L-7).

### Prettier

- Config resolution starts at the file being formatted and searches up
  the tree, stopping at the first config found; there is no global
  configuration (https://prettier.io/docs/configuration).
- The accepted spellings are many — a `prettier` key in `package.json`,
  `.prettierrc` in JSON or YAML, `.prettierrc.{json,yml,yaml,json5,js,
  ts,mjs,cjs,toml}`, `prettier.config.*` — in a documented precedence
  order (same page).
- Scoping is one mechanism: `overrides`, each entry carrying a `files`
  glob and optionally `excludeFiles` (same page).
- The project's stated position is that Prettier exists to end style
  debates, that more options would only move the debate to which
  options to use, and that "Option requests aren't accepted anymore"
  (https://prettier.io/docs/option-philosophy).

**Does well.** The strongest customization decision in this sweep is
Prettier's refusal to customize, stated as policy with a reason. It is
why Prettier configuration is not a subject anyone has to learn.

**Breaks.** Ten-plus file spellings for one concept is discoverability
debt paid to backwards compatibility. NOT FOUND on the configuration
page: any CLI for printing the resolved config for a file — so "which
config won" is unanswered where ESLint answers it.

**Teaches nputer.** Every customization point nputer opens is a debate
it hosts forever. The default answer to "should this be configurable"
is no, with a reason; the layering stack is for policy that genuinely
differs between organizations, not for taste (L-1).

### EditorConfig

- The search walks up from the edited file's directory through every
  parent, stopping at the filesystem root or at a file declaring
  `root = true` (https://editorconfig.org/); the spec states the same
  stop condition normatively (https://spec.editorconfig.org/).
- Conflicts resolve toward the edited file: properties from files
  closer to it take precedence, and within one file later sections win
  (both pages above).
- Section names are filepath globs in a gitignore-like syntax
  (https://editorconfig.org/).
- Support is split into a native tier and a plugin tier; VS Code and
  IntelliJ IDEA are in the plugin tier (same page).

**Does well.** `root = true` is the cleanest idea in this sweep: the
customization file declares where the search STOPS, so a project can
close its own boundary instead of inheriting a machine's accidents.

**Breaks.** The property vocabulary is tiny by design, so real projects
still need a second, per-tool config beside it — one concept, two
files, forever.

**Teaches nputer.** Give a layer the power to declare itself terminal
(L-11).

### Git's own configuration

- Files are read system (`$(prefix)/etc/gitconfig`), then global
  (`$XDG_CONFIG_HOME/git/config`, then `~/.gitconfig`), then local
  (`$GIT_DIR/config`), then worktree (`$GIT_DIR/config.worktree`), and
  the LAST value read wins (https://git-scm.com/docs/git-config).
- The worktree file is only consulted when the
  `extensions.worktreeConfig` extension is enabled (same page).
- Command-line `-c` and the `GIT_CONFIG_COUNT`/`GIT_CONFIG_KEY_<n>`/
  `GIT_CONFIG_VALUE_<n>` environment variables sit above every file,
  with `-c` beating the environment form (same page).
- Writes touch ONE layer: local by default, redirected with
  `--system`, `--global`, `--worktree` or `--file`, and only one file
  is ever changed at a time (same page).
- Provenance is first-class: `--show-origin` reports the origin type
  and the actual origin of each value, `--show-scope` reports which
  layer it came from (same page).
- Conditional inclusion exists as `includeIf.<condition>.path`, with
  the documented conditions `gitdir`, `gitdir/i`, `onbranch` and
  `hasconfig:remote.*.url` (same page).

**Does well.** It answers the provenance question directly, in the same
command that lists values, for every value. It also fixes the write
target explicitly rather than guessing scope. `includeIf` lets a
machine hold several policies and pick by context.

**Breaks.** The system layer is the WEAKEST, so a repository always
overrides the machine — git has no admin-wins tier at all. Any
enterprise guarantee on top of git config is a convention, not a
mechanism.

**Teaches nputer.** Two things, and they are different: a customization
system needs `--show-scope` from day one (L-4), and the DIRECTION of
the stack is a decision, not a default (L-12).

### Claude Code — settings, memory, rules, skills

The tool nputer's method already rides on, benchmarked at more depth.

- Four settings files plus managed sources: user
  `~/.claude/settings.json`, shared project `.claude/settings.json`,
  project-local `.claude/settings.local.json`, and managed
  `managed-settings.json` with its sibling delivery mechanisms
  (https://code.claude.com/docs/en/settings).
- The precedence is published as an ordered list, highest first:
  managed settings, command line, project local, shared project, user
  (same page).
- List-valued keys MERGE across files rather than one file winning, so
  a project can add without deleting the org's entries; three
  model-related keys are exempted because order or wholeness carries
  meaning (same page).
- Environment variables are deliberately NOT a level: which of a
  variable/key pair wins is decided per pair (same page).
- Instructions are a separate, non-enforcing surface: CLAUDE.md at
  managed-policy, user, project and local scope, all CONCATENATED into
  context rather than overriding each other, ordered filesystem-root
  down to the working directory
  (https://code.claude.com/docs/en/memory).
- The docs draw the guarantee line explicitly: memory files are
  context rather than enforced configuration, and a PreToolUse hook is
  the mechanism for blocking an action regardless of what the model
  decides (same page).
- Path-scoped rules are files with frontmatter: `.claude/rules/*.md`,
  loaded unconditionally unless they carry a `paths` glob list, in
  which case they load when matching files are touched (same page).
- Skills are folders: `~/.claude/skills/<name>/SKILL.md` personal,
  `.claude/skills/<name>/SKILL.md` project,
  `<plugin>/skills/<name>/SKILL.md` plugin
  (https://code.claude.com/docs/en/skills).
- Skill frontmatter is all-optional with `description` recommended; the
  documented fields include `name`, `description`, `when_to_use`,
  `disable-model-invocation`, `user-invocable`, `allowed-tools`,
  `disallowed-tools`, `model`, `effort`, `context`, `agent`, `hooks`
  and `paths` (same page).
- Discovery is progressive: project skills load from `.claude/skills/`
  in the launch directory and every parent to the repository root,
  while skills nested BELOW the launch directory load only once a file
  in that subdirectory is read (same page).

**Does well.** Three mechanisms with three separate guarantees, and the
docs say which is which: settings ENFORCE, memory GUIDES, hooks BLOCK.
Precedence is published rather than inferred. Merging lists is what
makes a shared layer additive instead of destructive.

**Breaks.** The docs' own honest limit: the session's settings-source
line confirms which files were read but not which file supplied each
key (settings page). A whole page exists for diagnosing configuration —
`/context`, `/status`, `/doctor`, `/permissions`, `/hooks`, `/mcp`, and
`claude --safe-mode` to load nothing
(https://code.claude.com/docs/en/debug-your-config).

**Teaches nputer.** Two large lessons. Separate the tiers by GUARANTEE
and say so out loud (L-2). And the explain surface is not a nicety
added late — the most file-first tool in this sweep needed seven
commands for it and still cannot answer per-key provenance (L-4).

### Agent Skills as an open format

- A skill is a folder holding a `SKILL.md` with `name` and
  `description` at minimum, optionally bundling `scripts/`,
  `references/` and `assets/` (https://agentskills.io).
- Loading is three-stage progressive disclosure — discovery (name and
  description only), activation (the full SKILL.md), execution
  (bundled files on demand) — so many skills cost little until used
  (same page).
- The format was developed by Anthropic and released as an open
  standard; the client showcase lists a large adopter set including
  Claude Code, Cursor, VS Code, GitHub Copilot, Gemini CLI, ChatGPT and
  Codex, OpenCode, Goose, Kiro, Amp and JetBrains Junie, each with its
  own linked instructions page (same page).

**Does well.** The unit of organizational customization is already
portable across vendors. An org writes its security skill once.

**Breaks.** The standard covers the FOLDER, not the wiring — when a
skill applies, whether it is advisory or binding, and who wins a
conflict are left to each client. The per-client instruction links are
the evidence: every vendor documents its own.

**Teaches nputer.** Adopt the format verbatim and spend the design
budget on the wiring, which is the part nobody standardized (L-7).

### Cursor rules

- Project rules live in `.cursor/rules` as `.mdc` files and are
  version-controlled; a plain `.md` file dropped there is ignored,
  because the rules system reads frontmatter
  (https://cursor.com/docs/rules).
- Four rule types are selected by three frontmatter fields
  (`alwaysApply`, `description`, `globs`): always applied, applied
  intelligently by description, applied to files matching globs, or
  applied manually by @-mention (same page).
- User rules are global preferences set in the app and apply across
  projects; Team Rules exist on Team and Enterprise plans, are created
  from the dashboard, apply to all members and take precedence over
  project and user rules (same page).
- Rules can be imported from GitHub repositories into
  `.cursor/rules/imported/<repoName>` (same page).
- Cursor reads `AGENTS.md` in the project root and in subdirectories,
  combining them with the more specific taking precedence (same page).
- The legacy root-level `.cursorrules` file is documented as legacy and
  slated for deprecation, with migration steps
  (https://cursor.com/help/customization/rules).

**Does well.** The three-field frontmatter is the tightest activation
vocabulary found: one file format, four behaviours, no separate
registry. Team Rules answer the org tier without inventing a new
artifact.

**Breaks.** Two surfaces disagree in emphasis about nested rule
directories — the main page shows folders inside `.cursor/rules` but
does not document per-subdirectory rule directories, while the help
page says nesting works and recommends against it. Team Rules
out-ranking project rules is the opposite direction from Claude Code's
project-over-user default.

**Teaches nputer.** Make activation DECLARED in the artifact rather
than configured elsewhere (L-7), and pick the stack's direction
deliberately (L-12).

### GitHub Copilot custom instructions

- Repository-wide instructions live at `.github/copilot-instructions.md`
  and apply to all requests in that repository's context
  (https://docs.github.com/en/copilot/how-tos/configure-custom-instructions/add-repository-instructions).
- Path-specific files are `NAME.instructions.md` within or below
  `.github/instructions`, scoped by an `applyTo` frontmatter glob; when
  both a matching path-specific file and a repository-wide file exist,
  BOTH are used (same page).
- An optional `excludeAgent` keyword restricts a file to particular
  tools (same page).
- Documented precedence: personal instructions, then repository, then
  organization last (same page).
- Organization instructions are written in natural language by an owner
  in the org's Copilot settings, and are supported only for a named
  subset of surfaces
  (https://docs.github.com/en/copilot/how-tos/configure-custom-instructions/add-organization-instructions).
- The support reference lists the instruction types and their paths,
  including agent instruction files named `AGENTS.md`, `CLAUDE.md` or
  `GEMINI.md`
  (https://docs.github.com/en/copilot/reference/custom-instructions-support).
- NOT FOUND: an enterprise tier of custom instructions above the
  organization (same reference; a direct enterprise how-to URL 404s).

**Does well.** Composition instead of override — the path-scoped file
adds to the repository file rather than replacing it — which is the
right default for policy that is cumulative.

**Breaks.** The org tier is LOWEST precedence and is authored in a web
form, so the organization's rule is the one most easily displaced and
the one least reviewable. That is the inverse of every enterprise
mechanism in School 4.

**Teaches nputer.** If the org layer is meant to bind, it cannot sit at
the bottom of the stack; if it is meant to advise, say so (L-2, L-12).

### AGENTS.md

- An open format positioned as a README for coding agents, placed at
  the repository root (https://agents.md/).
- Nested files in subprojects are supported, and the nearest file in
  the directory tree takes precedence (same page).
- The format is plain Markdown with no required schema (same page).
- The site lists a broad adopter set including OpenAI Codex, Google
  Jules, Factory, Aider, goose, opencode, Zed, Warp, VS Code, Devin,
  JetBrains Junie, Amp, Cursor, Gemini CLI, GitHub Copilot Coding
  Agent and Windsurf (same page). NOT FOUND: any completeness claim or
  "as of" date on that list.

**Does well.** Zero schema is why it spread. The precedence rule
(nearest wins) is one sentence and needs no tooling to understand.

**Breaks.** Zero schema is also why nothing can be enforced, queried or
validated: there is no field to ask "is this binding", no version, no
provenance. Claude Code's own docs treat it as an import target rather
than a native format (https://code.claude.com/docs/en/memory).

**Teaches nputer.** A format with no schema travels furthest and
guarantees least. nputer's cards, fences and gates are the schema, so
the org-pack format can afford to be plain (L-7).

## School 2 — the in-app settings surface

### VS Code's Settings editor

- Two editing surfaces are documented — a graphical Settings editor and
  a `settings.json` file — with the editor described as reviewing and
  modifying values stored in that file
  (https://code.visualstudio.com/docs/configure/settings).
- The scope list is explicit and ordered, later overriding earlier:
  Default, User, Remote, Workspace, Workspace Folder, then the
  language-specific equivalents in the same order, then Policy settings
  last and therefore highest (same page).
- User settings paths are documented per platform:
  `%APPDATA%\Code\User\settings.json`,
  `$HOME/Library/Application Support/Code/User/settings.json`,
  `$HOME/.config/Code/User/settings.json`; workspace settings live in a
  `.vscode` folder at the project root (same page).
- Modified settings are marked with a coloured bar and are listable
  with an `@modified` search filter (same page).
- Settings the UI cannot express surface an "Edit in settings.json"
  link, and `Preferences: Open User Settings (JSON)` /
  `Preferences: Open Workspace Settings (JSON)` open the file directly
  (same page).
- Settings Sync covers settings, keyboard shortcuts, user snippets,
  user tasks, UI state, extensions and profiles, authenticated by a
  Microsoft or GitHub account, and excludes machine-scoped settings by
  default (https://code.visualstudio.com/docs/configure/settings-sync).
- Enabling sync on a second machine offers merge, replace, or manual
  per-preference merge (same page).

**Does well.** The best-designed settings UI in this sweep, and its
quality comes from four honesty features: a published scope order, a
visible modified marker, a filter that lists exactly what you changed,
and an escape hatch to the file for anything the form cannot express.

**Breaks.** Scope is chosen by which editor tab you are in, which is
easy to get wrong; and NOT FOUND is a single sentence stating that the
Settings editor writes `settings.json` — it is documented by
implication (values "stored in" the file, plus the Edit-in-JSON links
and Open-JSON commands). This benchmark treats the write direction as
documented-by-implication, not verbatim.

**Teaches nputer.** A settings surface earns trust by showing what is
MODIFIED and by never being the only way to say something (L-4, L-5).

### JetBrains IDEs

- The Settings dialog covers global and project-specific settings, and
  project-scoped entries carry a dedicated icon
  (https://www.jetbrains.com/help/idea/settings-preferences-dialog.html).
- Project settings in the directory-based format are stored in `.idea`
  alongside the `.iml` file
  (https://www.jetbrains.com/help/idea/project.html).
- Some global settings can be copied to project level; the docs name
  code style configuration, inspection profiles, and the
  completion/auto-import exclusion list
  (https://www.jetbrains.com/help/idea/configure-project-settings.html).
- The docs enumerate what NOT to put under version control —
  `.idea/workspace.xml`, `.idea/usage.statistics.xml`,
  `.idea/dictionaries`, `.idea/shelf`, build-tool-generated
  `.idea/libraries`, `*.iml` and `.idea/modules.xml` in Maven/Gradle
  projects, `gradle.xml`, `*.iws`, and `out` (same page). NOT FOUND on
  that page: an affirmative list of files recommended TO share.
- The project code style scheme lives in `.idea/codeStyles` and is
  shared through VCS; IDE-level schemes live in the config directory
  and are not shared, and there can be only one project scheme
  (https://www.jetbrains.com/help/idea/configuring-code-style.html).
- Schemes can be exported as IntelliJ XML, Eclipse XML profile, or
  EditorConfig (same page); `.editorconfig` applies to its directory
  and below, on top of the project code style, with the closest file
  winning (https://www.jetbrains.com/help/idea/editorconfig.html).
- Personal settings sync is a JetBrains-Account-backed backup-and-sync
  feature, with manual export/import as a ZIP as the alternative
  (https://www.jetbrains.com/help/idea/sharing-your-ide-settings.html);
  the older Settings Repository is documented as deprecated and
  unbundled
  (https://www.jetbrains.com/help/idea/settings-tools-settings-repository.html).
- A Required Plugins settings page lets a project declare plugins it
  needs, with minimum and maximum versions
  (https://www.jetbrains.com/help/idea/settings-required-plugins.html).

**Does well.** The clearest statement in this sweep that a settings
store has TWO populations: the part that is the team's (code style,
inspection profiles — checked in) and the part that is the machine's
(window layout, caches — never checked in). The negative list is
maintained because getting it wrong produces merge conflicts.

**Breaks.** A settings dialog whose storage is a directory of XML
nobody reads means the share/do-not-share boundary has to be published
as prose and re-learned per project. The team half and the personal
half live in one dialog with only an icon to tell them apart.

**Teaches nputer.** Split the customization surface by WHOSE it is
before splitting it by what it configures — and make the split visible
in the storage path, not only in a doc (L-5, L-6).

### Linear

- Workspace settings are reached from the workspace name; members see
  settings about their own work while admins and owners additionally
  see administration surfaces (https://linear.app/docs/workspaces).
- Workspace-level configuration includes labels, custom project
  statuses, templates and integrations (same page); team-level
  configuration includes issue statuses and automations, labels,
  estimates, cycles and Triage (https://linear.app/docs/teams).
- Issue statuses are team-specific with a default set and order, and
  categories cannot be reordered
  (https://linear.app/docs/configuring-workflows).
- Templates exist at workspace and team level, and workspace templates
  cannot preset team-specific properties
  (https://linear.app/docs/issue-templates).
- Roles are Workspace Owner, Admin, Team Owner, Member and Guest, with
  several gated to paid tiers
  (https://linear.app/docs/members-roles); SAML and SCIM are configured
  under administration security on the Enterprise plan
  (https://linear.app/docs/saml-and-access-control).
- The public API is GraphQL with full mutation coverage of entities and
  webhooks (https://linear.app/docs/api-and-webhooks).
- NOT FOUND: any file-based, exportable or version-controlled
  configuration of workspace or team SETTINGS (same page and
  https://linear.app/developers/graphql); the documented export surface
  is data — issues, members, projects, initiatives, customer requests
  (https://linear.app/docs/exporting-data).

**Does well.** The two-level split (workspace / team) with a stated
rule about what the broader level may not preset is a clean layering
model, and role-gated visibility keeps the admin surface out of a
member's way.

**Breaks.** For nputer's purposes this is the school's limit case:
settings exist only in the app. There is no diff, no blame, no review,
no revert, and no way to ask "who changed the workflow and why" from
the same place the work lives. Configuration cannot travel with a
branch, be proposed by a contributor, or be tested before it lands.

**Teaches nputer.** A settings surface without a file underneath cannot
participate in review — which is disqualifying for a tool whose entire
premise is that the process is auditable (L-8, and the brief's
files-first argument).

## School 3 — the hybrid

### VS Code, the canonical hybrid

The Settings editor and `settings.json` are two views of one store, and
the details that make it work are listed above: published scope order,
modified marker, `@modified` filter, Edit-in-JSON escape hatch,
Open-JSON commands (https://code.visualstudio.com/docs/configure/settings).
The lesson is that the hybrid is not "a UI plus a file" — it is a UI
that CONCEDES the file is the store and gives you a door to it on every
setting it cannot render.

### Claude Code's hybrid half

- The `/config` menu writes settings files: user settings are written
  the first time an option stored there is changed, and
  `.claude/settings.local.json` is written the first time a standing
  permission approval is given
  (https://code.claude.com/docs/en/settings).
- The docs are explicit that the Config tab is not a view of the
  settings file's contents (same page).
- The documented trap: a standing "don't ask again" writes an `allow`
  rule to the LOCAL file, which does not outrank an `ask` rule from a
  project or managed file, so the click appears to do nothing (same
  page).
- The VS Code extension's approval card lets the user pick the
  destination file, including the project's shared file, which changes
  the rule for everyone; the CLI writes only to the local file (same
  page).

**Does well.** The destination picker is the single best hybrid detail
found: a UI that writes a file ASKS WHICH FILE, because the file is the
scope and the scope is the meaning.

**Breaks.** Writing at a layer a higher layer overrides produces a
click with no effect, documented as a common support case rather than
prevented. And a menu that is not a view of the file is a second model
of the same state.

**Teaches nputer.** If a surface ever writes a customization, the scope
is part of the act, and the surface must show the RESOLVED effect, not
the value it wrote (L-5, L-6).

### Cursor's in-app rule authoring

- Two documented in-app paths create a rule file for you — `/create-rule`
  in the agent, and Customize → Rules → Add Rule — both generating
  frontmatter and saving into `.cursor/rules`
  (https://cursor.com/docs/rules); the help page documents a
  command-palette "New Cursor Rule" entry
  (https://cursor.com/help/customization/rules).
- NOT FOUND: any documented command that turns an existing conversation
  into a rule file; the FAQ says only that you can ask the agent to
  create one (https://cursor.com/docs/rules).

**Does well.** The UI's job is reduced to SCAFFOLDING — it writes the
frontmatter, which is the part with a schema, and leaves the body to
prose. That is the correct division for a rule that is mostly text.

**Breaks.** Once created, the artifact is a file like any other, so the
UI has no continuing claim on it; there is no documented "which rules
fired" surface equivalent to ESLint's inspector.

**Teaches nputer.** A UI over prose rules can generate and route
honestly; it cannot own them (L-5).

### Netlify — the file overrides the dashboard

- `netlify.toml` normally sits at the repository root and specifies how
  a site is built and deployed
  (https://docs.netlify.com/build/configure-builds/file-based-configuration/).
- The precedence is stated as a headed callout: file-based
  configuration settings take precedence, and a UI setting is
  overridden when the file sets the same property, redirect or header
  (same page); the build-settings page repeats the rule independently
  (https://docs.netlify.com/build/configure-builds/overview/).
- The stated motive is reproducibility: a fork can create a site with
  no UI configuration, and configuration changes are tracked in version
  control (file-based-configuration page).
- Inside the file, precedence is by context specificity — a
  branch-specific context overrides less specific ones (same page).
- The one documented REVERSE recommendation is environment variables,
  where the UI is recommended over the file to avoid committing
  sensitive values and to gain scopes, audit-log tracking and API
  access (same page).
- NOT FOUND: any statement that the UI/file split confuses users; the
  split is framed as a precedence rule and a feature.

**Does well.** One sentence settles authority for the whole product,
and it is stated in a callout rather than buried. The exception is
principled: secrets are the one thing that must NOT be in the repo, so
the direction flips exactly there and the docs say why.

**Breaks.** The dashboard still accepts edits to settings the file will
override — the UI is not disabled where it has been superseded — so a
user can configure something that never takes effect.

**Teaches nputer.** Declare ONE authority sentence for the whole
system, and let a named, reasoned exception exist rather than pretending
none is needed (L-6, L-9).

### Vercel — the same shape without the sentence

- Project configuration is either dashboard settings or one file
  (`vercel.json`, `vercel.toml`, `vercel.ts`), and only one config file
  per project is allowed (https://vercel.com/docs/project-configuration).
- The file's settable properties are enumerated in a table (same page),
  and precedence is documented PER PROPERTY — the "this overrides the
  X in Project Settings" formula recurs for `buildCommand`,
  `devCommand`, `framework`, `ignoreCommand`, `installCommand`,
  `outputDirectory` and `regions`
  (https://vercel.com/docs/project-configuration/vercel-json).
- At least one property runs the other way: for the deprecated `alias`
  property, Project Settings win (same page).
- Some settings are dashboard-only by design — with Fluid compute
  enabled, memory cannot be set in the file (same page).
- The docs recommend against defining environment variables in the file
  (same page), and frame the dashboard/file distinction as scope: a
  dashboard override applies to all deployments, a file property to a
  specific deployment
  (https://vercel.com/docs/builds/configure-a-build).
- NOT FOUND: any single global precedence statement of Netlify's kind.

**Does well.** Per-property documentation is honest about a system that
genuinely is per-property, and the "all deployments vs this deployment"
framing is a real distinction the file/UI split can carry.

**Breaks.** With no blanket rule, every property is a separate thing to
learn, and at least one runs the opposite way. A user cannot form a
correct general belief about where authority lives.

**Teaches nputer.** The absence of one authority sentence is itself the
defect; per-case rules do not compose into understanding (L-6).

### JetBrains IDE Services — capturing settings from a real IDE

- Administrators collect settings from a working IDE with a dedicated
  action in the IDE Services plugin, producing JSON that is pasted into
  the web console
  (https://www.jetbrains.com/help/ide-services/collect-settings-from-ide.html).
- Developers can see what was pushed to them, listing the connected
  server, propagated configurations and plugins from the org repository
  (https://www.jetbrains.com/help/ide-services/explore-propagated-configurations.html).

**Does well.** The authoring UX for org policy is "configure one real
machine, then export" — the admin never writes the format by hand, and
the receiving developer has a page that says what arrived.

**Breaks.** The exported blob is machine-produced JSON pasted into a
console, so the org's policy is not a reviewable artifact in a
repository; there is no diff between version N and N+1 of a profile in
that flow.

**Teaches nputer.** Capture-from-a-working-instance is a real authoring
strategy for org packs (L-10) — but only if what it produces lands in
git as a diff (L-8).

## School 4 — enterprise policy distribution

### Claude Code managed settings

- Managed settings apply above every other level, with no user,
  project, local or `--settings` value overriding them, apart from
  named security-sensitive exceptions where a STRICTER lower value
  still counts (https://code.claude.com/docs/en/managed-settings).
- File delivery is a system directory per OS:
  `/Library/Application Support/ClaudeCode/managed-settings.json`
  (macOS), `/etc/claude-code/managed-settings.json` (Linux and WSL),
  `C:\Program Files\ClaudeCode\managed-settings.json` (Windows), with
  an optional `managed-settings.d/` drop-in directory (same page).
- The other mechanisms are an MDM or OS-level policy — a macOS
  configuration profile or a Windows `HKLM` registry value delivered
  through Jamf, Intune or Group Policy, read at startup and re-checked
  every thirty minutes — and server-managed settings fetched from the
  console (same page).
- Multiple managed sources do NOT merge by default: the first source
  carrying a policy key supplies the policy and the rest are skipped,
  unless `managedSourcesBehavior` is set to merge in the highest-ranked
  source (same page).
- The residual is published rather than hidden: a developer with local
  administrator rights can edit the managed source itself, which is why
  MDM tooling redeploys on a schedule (same page).
- Behavioural policy has its own channel — an organization-wide
  CLAUDE.md at the managed-policy path, or a `claudeMd` key inside
  `managed-settings.json` — and it cannot be excluded by individual
  settings, where ordinary ancestor files can be skipped with
  `claudeMdExcludes` (https://code.claude.com/docs/en/memory).
- The two channels are separated by a published table: technical
  enforcement (deny rules, sandbox, env, login restrictions) belongs in
  managed settings; code style, compliance reminders and behavioural
  instruction belong in managed CLAUDE.md, because instructions shape
  behaviour without being an enforcement layer (same page).
- Enterprise skills ride the same directory: an administrator removes
  one by deleting `.claude/skills/<name>/` inside the managed settings
  directory, for example under `/etc/claude-code/`
  (https://code.claude.com/docs/en/skills).

**Does well.** The enforcement tier is a DIFFERENT tier with a
different delivery path, a non-override rule, and an asymmetric
exception in the right direction: policy is a floor, and a stricter
local value is allowed to stand.

**Breaks.** Endpoint policy is only as strong as device management, and
the docs say so instead of claiming a guarantee they cannot make.

**Teaches nputer.** An enterprise tier is a distribution problem plus a
non-override rule, not a UI; and an honest tool publishes its bypass
(L-8, L-9).

### Plugin marketplaces as the distribution channel

- A marketplace is `marketplace.json` inside a `.claude-plugin/`
  directory at a repository root, listing plugins with `name`,
  `source` and `description` under an `owner`
  (https://code.claude.com/docs/en/plugin-marketplaces).
- A plugin bundles skills, commands, agents, hooks, MCP servers and LSP
  servers, declared in `.claude-plugin/plugin.json` or in the
  marketplace entry (same page).
- A project auto-registers a marketplace and enables plugins for the
  whole team through checked-in `.claude/settings.json` keys —
  `extraKnownMarketplaces` and `enabledPlugins` — taking effect when a
  teammate trusts the folder (same page).
- Administrators constrain the CHANNEL with `strictKnownMarketplaces`,
  an allowlist of marketplaces users may add, where an empty list
  blocks all of them (same page).

**Does well.** One channel serves all three audiences: an individual
adds a marketplace by hand, a project ships one in a committed file, an
enterprise allowlists which may exist at all. The unit of distribution
is a git repository, so versioning and review come free.

**Breaks.** Trust is bootstrapped by folder trust, and the file that
installs plugins is the same kind of file any contributor can open a PR
against.

**Teaches nputer.** nputer already HAS this channel — a git repository
of files, plus a board card per import for the audit trail. What it
lacks is the allowlist half (L-10).

### VS Code enterprise policies

- VS Code supports centrally managed policies that override user
  settings on managed devices, deployed through Intune, Active
  Directory Group Policy, or macOS MDM
  (https://code.visualstudio.com/docs/setup/enterprise).
- A policy overrides the setting value at ANY level — default, user and
  workspace (https://code.visualstudio.com/docs/enterprise/policies).
- Mechanism is per platform: Windows registry Group Policy via
  ADMX/ADML templates writing under
  `Software\Policies\Microsoft\VSCode`, and macOS `.mobileconfig`
  configuration profiles (same page).
- The reference documents roughly fifty named policies, including
  `AllowedExtensions`, `ExtensionsAutoUpdate`,
  `ExtensionGalleryServiceUrl`, `TelemetryLevel`, `UpdateMode`,
  `ChatAgentMode`, `ChatMCP` and `ChatAllowedMcpServers` (same page).
- The extension allowlist is an application-wide `extensions.allowed`
  setting selectable by publisher, extension id, version and platform;
  unlisted extensions are blocked and an already-installed blocked
  extension is disabled; the policy overrides any user-configured value
  (https://code.visualstudio.com/docs/enterprise/extensions).
- NOT FOUND: a default-profile or arbitrary-settings-enforcement
  mechanism — administrators can enforce only the named policies; the
  closest documented organizational default is preinstalling extensions
  on a machine image
  (https://code.visualstudio.com/docs/setup/enterprise).

**Does well.** The enforceable set is ENUMERATED. An administrator can
read what may be enforced, and a developer can read what may have been
done to them.

**Breaks.** That same enumeration is the ceiling: anything outside the
fifty policies is unenforceable, so the org's real rules mostly cannot
be expressed at all.

**Teaches nputer.** An enumerated policy vocabulary is honest and
bounded; an open-ended one is expressive and unverifiable. nputer must
choose which of its four layers is enumerable (L-2, L-11).

### JetBrains IDE Services

- IDE Services manages JetBrains IDE use across an organization, with
  IDE Provisioner delivering approved plugins, settings and tools
  (https://www.jetbrains.com/help/ide-services/product-description.html).
- Profiles specify what is available to users or groups — applications,
  plugins, VM options, IDE settings, Toolbox settings — every user has
  at least one, several can apply to one user, and everyone gets an
  organization-level Default profile
  (https://www.jetbrains.com/help/ide-services/configure-profiles.html).
- Settings are fetched from the server, applied at IDE start and
  re-checked hourly; with the Forced option an administrator can
  prohibit changing the value in the IDE, and local changes are
  overwritten every seven minutes, whereas without Forced the value is
  propagated once and local edits stand
  (https://www.jetbrains.com/help/ide-services/configure-settings-via-profiles.html).
- Plugin availability is controlled by rules named Allow, Block, Block
  (Forced), Block on Restart, Disable, Auto-install, Auto-install
  (Forced), Enable and Enable (Forced), and the docs name both an
  allowlist and a denylist strategy
  (https://www.jetbrains.com/help/ide-services/manage-available-plugins.html).

**Does well.** The Forced flag is the clearest expression in this sweep
of the difference between a DEFAULT and a RULE, and it is per setting
rather than per tier — an org can ship a hundred suggestions and three
laws through one channel.

**Breaks.** Enforcement is a seven-minute overwrite loop, so the
guarantee is eventual and silent: a developer's edit works for minutes
and then vanishes without a message the docs describe.

**Teaches nputer.** Per-entry advisory-versus-binding is the right
granularity for org packs — the loop-customization room's own open
question, answered by an existing product (L-2).

### GitHub CODEOWNERS and rulesets

- CODEOWNERS may live in `.github/`, the root, or `docs/`; if several
  exist, the first found in that order is used
  (https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners).
- Owners are automatically requested for review when a pull request
  modifies code they own, though not on draft pull requests until they
  are marked ready (same page).
- Enforcement is opt-in and lives elsewhere: a branch protection rule
  enables required review from code owners, and an approval from ANY of
  the owners satisfies it (same page).
- In rulesets, code-owner review is an option inside the
  require-a-pull-request rule rather than a standalone rule
  (https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets).
- Rulesets can be imported from JSON, documented explicitly for
  applying the same ruleset to multiple repositories or organizations
  (https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/creating-rulesets-for-a-repository,
  https://docs.github.com/en/organizations/managing-organization-settings/managing-rulesets-for-repositories-in-your-organization).
- Export is documented on the enterprise-cloud variant of the
  managing-rulesets page, and the exported JSON deliberately EXCLUDES
  the bypass list
  (https://docs.github.com/en/enterprise-cloud@latest/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/managing-rulesets-for-a-repository).
  Whether export is tier-limited was not resolved by this sweep.
- Organization-level rulesets are a paid-tier feature applying across
  an organization's repositories, forks owned by the org included, and
  push rules reach the entire fork network
  (https://docs.github.com/en/organizations/managing-organization-settings/creating-rulesets-for-repositories-in-your-organization).

**Does well.** The pattern nputer already relies on: the POLICY is a
committed file (CODEOWNERS), the ENFORCEMENT is a host-side rule, and
the two are separately readable. Policy travels as a reviewable diff;
enforcement travels as an admin setting.

**Breaks.** The file alone does nothing — CODEOWNERS without the
enforcement toggle is documentation. And the JSON export drops the
bypass list, so the exported policy is not the whole policy: the
exception list, which is the security-relevant half, does not travel.

**Teaches nputer.** Separate the RULE from its ENFORCEMENT and let each
live where it belongs (L-8); and when a policy is exported, say what
did not come with it (L-9).

### Terraform as the reference for drift

- `terraform plan` reads current remote state, compares configuration
  to prior state, and proposes actions that would make reality match
  the configuration
  (https://developer.hashicorp.com/terraform/cli/commands/plan).
- HashiCorp's tutorial names the concept: state can drift from real
  infrastructure, and Terraform compares state to reality on plan or
  apply
  (https://developer.hashicorp.com/terraform/tutorials/state/resource-drift).
- A `-refresh-only` planning mode exists to reconcile state with
  reality WITHOUT changing infrastructure (CLI page).

**Does well.** The strongest available answer to "the file is the truth
but reality moved": detect the divergence, name it, and offer a mode
that only reconciles the record.

**Breaks.** It requires a machine-readable model of reality; where
reality is prose or human behaviour, there is nothing to diff.

**Teaches nputer.** nputer already has this shape in F-06's
intent-versus-reality drift. A customization system whose truth is
files can offer the same: SAY when the running loop diverges from what
the layers declare (L-12).

## The cross-cutting disagreement worth naming

The tools do not agree on which end of the stack is strongest, and each
direction is deliberate.

- Git: the MACHINE layer is weakest — system, then global, then local,
  last-read wins — so a repository always overrides the machine, and
  there is no admin-wins tier at all
  (https://git-scm.com/docs/git-config).
- VS Code: the same specificity ordering, then INVERTED at the top by
  Policy settings, which override every scope including workspace
  (https://code.visualstudio.com/docs/configure/settings,
  https://code.visualstudio.com/docs/enterprise/policies).
- Claude Code: managed settings above everything, then command line,
  then project-local, then shared project, then user — so the ORG is
  strongest and the individual weakest
  (https://code.claude.com/docs/en/settings).
- Copilot custom instructions: the exact inverse — personal, then
  repository, then organization LAST
  (https://docs.github.com/en/copilot/how-tos/configure-custom-instructions/add-repository-instructions).
- Cursor: Team Rules take precedence over project and user rules
  (https://cursor.com/docs/rules).

Four tools, three directions. The direction is not discoverable from
first principles; it is a product decision that must be stated. That is
the single most decision-relevant finding in the sweep, and it maps
directly onto the loop-customization room's open question about who
wins when an org skill and project CONVENTIONS disagree.

## What this sweep did NOT evaluate

Stated so the brief is not read as resting on more than was done.

- **No hands-on use.** Everything is read from documentation. Nothing
  was installed, run or measured; a doc describing an aspiration reads
  identically to one describing shipped code.
- **No usability evidence.** No task times, no support-ticket volumes,
  no user studies. "Where it breaks" means "where the vendor's own docs
  describe a trap, a limit, or a silence", never "users were observed
  to fail".
- **No source reading.** Where a doc is silent this file records
  silence; it did not go to the repository to settle the question.
- **No pricing, licensing, or vendor-viability analysis**, and no
  accessibility review of any surface named.
- **Known unresolved points**, carried rather than smoothed: VS Code's
  docs never state in one sentence that the Settings editor writes
  `settings.json`; JetBrains publishes no affirmative list of `.idea`
  files to share; GitHub ruleset EXPORT was verified only on the
  enterprise-cloud doc variant; Copilot has no enterprise instruction
  tier that this sweep could find; Cursor's two doc surfaces disagree
  in emphasis about nested rule directories; the agents.md adopter list
  carries no date or completeness claim.
- **Thinly covered or skipped schools:** dotfile managers (chezmoi, GNU
  Stow), OS defaults systems, SaaS developer tools with database-backed
  team settings beyond Linear, the GitOps controller lineage beyond the
  one Terraform concept, and OpenTofu (every Terraform claim is from
  HashiCorp's own docs only).
- **A skewed vendor set.** Tools were chosen because they teach THIS
  decision — the ones nputer rides on and competes with — not by any
  sampling frame. Treat the sweep as an argument-supplier, not a market
  survey.
- **One reading, one day.** The claims are true of what was served on
  2026-08-30 and were not re-fetched.

## The lessons, numbered

- **L-1 — Refusing a knob is a design act.** Prettier is the only
  stated policy here for NOT growing configuration, and it names the
  failure mode: the debate moves from the style to the option.
- **L-2 — Separate the tiers by GUARANTEE and say which is which.**
  Enforce, guide, block are three promises; the tools that keep them in
  separate mechanisms can explain themselves. JetBrains puts the
  distinction on each entry (Forced), which is finer and better.
- **L-3 — Layers are cheap; unreadable layers are expensive.** Every
  layered tool here needed a separate tool to answer "which layer won".
- **L-4 — The explain surface is load-bearing, not a nicety.** It is
  the surface every file-first tool grew (`--show-origin`,
  `--show-scope`, `--inspect-config`, `/context`, `@modified`), and the
  place they still admit gaps.
- **L-5 — A UI that writes a file must name the file.** Scope is the
  meaning of a setting; choosing it silently chooses the meaning
  silently. Cursor's scaffold-the-frontmatter and Claude Code's
  destination picker are the two good forms.
- **L-6 — Show the RESOLVED effect, not the written value.** A write at
  a layer something above overrides is a click that does nothing, and
  three vendors here document that exact complaint.
- **L-7 — Adopt the format; spend the budget on the wiring.** The
  portable part (a folder with a SKILL.md, a Markdown AGENTS.md) is
  standardized. When a rule applies, whether it binds, and who wins a
  conflict are not — and that is the whole of the remaining design.
- **L-8 — Separate the RULE from its ENFORCEMENT.** CODEOWNERS is the
  model: policy is a reviewable committed file, enforcement is a
  host-side toggle, and each lives where it can be audited.
- **L-9 — Publish the bypass.** The strongest policy docs here name the
  hole — local admin rights, an export that drops the bypass list —
  rather than implying there is none.
- **L-10 — Constrain the channel, not the content.** Marketplace
  allowlists gate WHERE policy may come from and leave the policy
  itself as ordinary reviewable files.
- **L-11 — Let a layer declare itself terminal.** EditorConfig's
  `root = true` is the cheapest good idea in the sweep: a project can
  close its own boundary instead of inheriting the machine's history.
- **L-12 — The stack's DIRECTION is a decision to state, not derive.**
  Four tools here run three different directions, each on purpose. A
  system that does not publish its direction has not chosen one.
