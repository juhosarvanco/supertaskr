---
id: T-246-s1
title: Four accuracy defects in the Codex skill-form prose — a shorthand path inside backticks, a verbatim block with no ellipsis, an over-general method sentence, and a base sha that does not resolve
feature: F-04
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: verifier claude-opus-5@subagent @T-246
blocked_by: []
touches: [docs/design/cross-harness-plan.md, docs/research/captures]
builder:
verifier:
built_by:
verified_by:
review: independent
---

T-246's measurements all reproduce — a second seat re-ran every capture
byte-for-byte and re-planted the discovery probe under different names —
but four sentences of the surrounding PROSE state things the tree does
not bear out. None changes a finding; each is a line to fix, and each is
the kind of small false literal a dependent card later greps for and
does not find.

## Why this card exists

The T-246 verdict (2026-09-08) approved the lane and recorded these four
rather than blocking on them. They are collected here so the fix is one
pass over two files instead of four separate corrections.

## Acceptance criteria

- WHEN the §5 Addendum 1 paragraph names the app's write THE text SHALL
  render it as `CODEX_HOME = "/Users/ujju/.codex"`, the bytes the file
  actually holds, or SHALL mark the tilde form as an abbreviation —
  because `grep -c 'CODEX_HOME = "~/.codex"' ~/.codex/config.toml`
  returns 0 and the addendum presents it inside backticks.
- WHEN `docs/research/captures/codex-skill-form-2026-09-08.md` §5
  introduces the `config.toml` block as "contains, verbatim" THE block
  SHALL carry an ellipsis, or a sentence saying it is an extract, at each
  omission: `args = []` and `startup_timeout_sec = 120` are dropped from
  the table, and nine env keys sit between `CODEX_HOME` (line 118) and
  `CODEX_CLI_PATH` (line 127). Every quoted line IS byte-present, so the
  fix is the elision marker, not the content — and the other env VALUES
  SHALL stay redacted.
- WHEN the addendum summarises how the four discovery locations were
  established THE sentence SHALL NOT say all four were measured "by
  planting probes": the user-level `~/.codex/skills` row and the plugin
  row were measured by reading the rendering of pre-existing installs.
  The capture's own table already states each row's method correctly and
  is the model for the fix.
- WHEN the T-246 Implementation notes state the lane's base THE sha
  SHALL be `9d0e385ac72c7b1c97172cf8bac94d7d7c502117`, not
  `9527a1480b08c406ae2996d6841b9cf1f2baf08b` — `git merge-base 6ae1431
  9d0e385` returns `9d0e385`, and `git log --oneline 9527a148..6ae1431`
  returns 15 commits.
- Nothing under method/ or app/ moves; the docs gate SHALL be run and the
  suites it names SHALL be run.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
