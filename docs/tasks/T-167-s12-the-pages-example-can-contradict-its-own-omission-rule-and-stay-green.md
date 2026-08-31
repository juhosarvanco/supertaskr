---
id: T-167-s12
title: The transcript page's example can contradict the page's own omission rule and stay green — the pin reads its KEYS and never its VALUES
feature: F-03
milestone: 4
priority: 4
size: S
status: suggested
suggested_by: verifier claude-opus-5@subagent @T-167-s9
blocked_by: []
touches: [app-agent]
builder:
verifier:
built_by:
verified_by:
review:
---

**FOUND WHILE VERIFYING T-167-s9, NOT A FAILURE OF IT.** That card asked
for a field SET compared in both directions, and it got one — this is a
strictly additional line, offered because it has a mechanical remedy where
the seam it belongs to mostly does not.

## What is unheld

`transcript_line_keys` in `app/src-tauri/src/agent/sessions.rs` guards the
parsed example with three asserts, and the third carries this message:

> the page's example must be the MACHINE-ASSEMBLED half-turn, which is the
> only line that carries every key

**The assert behind that sentence checks `keys.contains("machine")` —
membership, never the value.** So the page's example can be edited to
`"machine": false` and the guard still passes: the key set is unchanged,
`against_the_schema` compares key sets, and nothing in the tree reads the
literal.

Measured at `07831da` in a detached verifier bench, one side only, the
mutation read back before the run and the restoration proved by sha256
(`6914ba86…`): `"machine": true` → `"machine": false` in
`method/runtime/transcript-schema.md`'s fenced example →
`cargo test --lib` **exit 0, 261 passed / 0 failed**, unchanged from
baseline.

## Why the value is not decoration

The page's own rule two paragraphs down says `machine` is OMITTED when it
is false. **So a line spelling `"machine": false` is one the writer can
never produce** — the example would be illustrating a wire state that does
not exist, in the one file whose whole job is to say what the wire
carries. The comment above the guard already claims the example is the
machine-assembled half-turn; today that claim is the comment's and not the
assert's, which is CONVENTIONS' *a comment that restates a measured figure
is a second implementation* one category over.

## The remedy is one line, and its shape matters

    assert_eq!(example["machine"], true, "…");

on the PARSED example rather than on the written line — the body already
asserts `machine["machine"] == true` about the writer's output, and that
is a different object. Pick the anchor deliberately: this is the page's
side of the comparison, not the writer's.

## A FULLER ALTERNATIVE, AND THE CHOICE BETWEEN THEM IS TRIAGE'S

The one-line remedy closes the value. **A second EXAMPLE OBJECT on the
page closes more**, and it is the shape T-167-s1 already used one level
up (its packed and packless arms, both derived from one document). Add
the TYPED half-turn — four keys, no `machine` — as a second fenced
example, and have the typed arm derive its expected set from THAT example
instead of from `schema` minus the hard-coded `vec!["machine"]`.

What it buys, in the order that matters:

1. **The omission rule stops being held twice.** Today the page states it
   in prose and the test transcribes it as a literal, so the two can
   disagree in silence — measured at `07831da`: inverting the page's rule
   to *omitted when it is true* / *absent means machine-assembled* leaves
   `cargo test --lib` at **261 passed / 0 failed, exit 0**.
2. **Both objects then get both directions**, so a page edited without
   its second example reds by name.
3. It removes the last transcription in a pin whose whole subject is that
   a transcription is a second implementation.

What it costs, said plainly: `json_example` takes the FIRST fenced block,
so a second example needs the reader to pick its block by an ANCHOR
rather than by position — which is the shape CONVENTIONS' poison-drill
catalogue asks for anyway (narrow the haystack, and make the anchor's own
uniqueness assertable). **And it does NOT close the prose seam**: the
camelCase paragraph and every other sentence on the page stay unheld
either way.

**Neither shape is chosen here.** The one-liner is cheap and closes one
measured hole; the second example is a redesign of the pin's expected
side and closes the transcription too. That is a scope call, and scope
calls belong to triage before dispatch.

## What it does NOT fix, stated so the next reader does not over-read it

The page's PROSE stays unheld either way, which T-167-s9's own drill D
measured (49 of 60 lines deletable, every gate green) and which this
verifier extended: the omission rule can be INVERTED — *omitted when it is
true*, *absent means machine-assembled* — with `cargo test --lib` at
261/0 and exit 0. **That seam has no cheap mechanical remedy and this card
does not claim one.** This card closes the one instance that does.

## Acceptance criteria

- WHEN `method/runtime/transcript-schema.md`'s example carries
  `"machine": false` THEN `cargo test` from app/src-tauri SHALL red,
  naming the page and the value.
- THE new assertion SHALL be shown able to fail, by the drill above,
  with the restoration proved by sha256.
- THE existing guards and both comparison directions SHALL be unchanged.
- Verification: headless, the app crate's own `cargo test`.
