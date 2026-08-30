---
id: T-025-s4
title: The Bash allowlist is the one grant cwd scoping does not cover — `cp` and `mkdir` reach the whole filesystem, and the effective grant is the union of three tables of which one is reviewed
feature: F-03
milestone: 3
priority: 4
size: S
status: building
blocked_by: []
touches: [app-agent]
suggested_by: verifier claude-opus-5 @T-025
builder: claude-opus-5@subagent
verifier:
built_by:
verified_by:
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

## Verdicts Queues for the next standing sitting with this evidence.
