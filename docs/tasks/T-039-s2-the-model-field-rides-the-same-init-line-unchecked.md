---
id: T-039-s2
title: The `model` field rides the same init line unchecked and unbounded into `.nputer/sessions.json`
status: suggested
suggested_by: executor claude-opus-5 @T-039
---

T-039 validates `session_id` from the CLI's `system`/`init` line. The
same line carries `model`, and `classify_line` reads it into
`TurnOutcome::model` (`runner.rs`, the `StreamLine::Init` arm), from
where it is written verbatim into `.nputer/sessions.json`'s `model`
field at settle time.

It is a much smaller hole than the session id was, and it is not
nothing:

- it never reaches argv and never becomes a path, so there is no
  injection class here;
- serde escapes it into JSON, so a newline or a terminal escape cannot
  forge a line in the file;
- but it is **unbounded** — the only cap is `MAX_LINE_BYTES` (1 MiB per
  stream line), so a hostile or broken CLI can put ~1 MiB of anything
  into a registry file that is otherwise a few hundred bytes, on every
  turn;
- and it is **recorded truth** the user is meant to be able to read:
  T-029's resume affordance and the sessions pane render it.

The fix is a cap and a shape, in the same place the session id is
checked: a length bound in the low hundreds of bytes, printable ASCII
plus the handful of characters model names actually use. It was left out
of T-039 deliberately rather than folded in silently — that task's
criteria are about the id, and widening a security task's scope by
sympathy is how fences stop meaning anything.

Worth doing when T-027 or T-029 next touches the registry: one function
call, one unit row, and the same "loud, never coerced" discipline
(record the CLI's model as unknown rather than truncating a name into
something that reads like a real one).
