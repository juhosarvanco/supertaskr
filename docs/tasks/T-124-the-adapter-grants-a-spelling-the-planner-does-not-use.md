---
id: T-124
title: The adapter grants six bare Bash patterns and the planner spells them with a directory flag — the kit's own imperative surface is refused
feature: F-03
milestone: 4
priority: 6
size: M
status: building
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
