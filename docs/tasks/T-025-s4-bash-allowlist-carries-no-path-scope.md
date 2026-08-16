---
id: T-025-s4
title: The Bash allowlist is the one grant cwd scoping does not cover — `cp` and `mkdir` reach the whole filesystem
status: parked
suggested_by: verifier claude-opus-5 @T-025
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
