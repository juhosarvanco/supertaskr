---
id: T-248-s1
title: Two tracked paths carry a space, so the DOCS GATE's own printed spelling fragments them — the gate over-fires on the head fragment and answers about a file that does not exist
feature: F-06
milestone: 4
size: S
priority: 7
status: planned
suggested_by: the T-248 executor, 2026-09-08, measured at d1603bb while deriving that card's own docs/ census
blocked_by: []
touches: [tools/e2e/scripts/docs-gate.mjs, docs/CONVENTIONS.md, tools/e2e/tests/docs-input-gate.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

`docs-gate.mjs`'s header claimed this tree held no tracked path
containing a space. It holds two, and the DOCS GATE bullet's own
printed invocation — an UNQUOTED command substitution, which is
deliberate and correct for every other reason — word-splits them. T-248
corrected the false sentence inside its fence and could not reach the
behaviour; this card is the behaviour.

## The measurement

Derive the set at your own ref rather than trusting this card:

    git ls-files | grep " "

At `d1603bb` it returns two, both under `docs/design/claudedesign_handoff/`
and both ending `.dc.html`. Feeding the gate the docs corpus the
unquoted way reproduces the defect in one command:

    node tools/e2e/scripts/docs-gate.mjs $(git ls-files docs/)

The head fragment of each name is `docs/design/claudedesign_handoff/nputer`,
which **is** a `docs/` prefix, so `docsGate` counts it as a changed docs
path and the gate FIRES on a path that names no file. The tail fragments
(`app.dc.html`, `tokens.dc.html`) are accepted as repository-relative
paths that simply do not exist, and are silently judged as not-under-docs.

## Why it was invisible until now

The header argued the failure direction was loud rather than silent, and
that argument was the reason nobody checked the premise. It is only loud
since T-248: the injection scan READS the file behind each docs path, so
a fragment naming no file is now reported by name as one the scan could
not run on. Before that, the over-fire was a silent count.

## Acceptance criteria

- WHEN the gate is handed a path under `docs/` that names no file in the
  tree THE gate SHALL say so rather than counting it as a changed docs
  path — or SHALL argue in writing why a non-existent path is still a
  legitimate input (a merge diff naming a DELETED path is exactly that,
  and is the reason this is not simply "refuse it").
- WHEN the DOCS GATE bullet prints its one spelling THE spelling SHALL
  be correct for a tree containing a path with a space, or the bullet
  SHALL state the limitation with the derive command above beside it.
- The two shapes SHALL be told apart: a DELETED path in a real merge
  diff, and a FRAGMENT produced by word-splitting. They arrive
  identically today.
- WHEN the DOCS GATE bullet in CONVENTIONS prints the whole-tree
  invocation THE spelling SHALL be NUL-safe (`git ls-files -z` into an
  array, or the gate reading `-z` input itself), so the two tracked
  paths carrying a space reach the gate whole; the bullet SHALL carry
  the cwd beside the command.
- WHEN the gate is handed a fragment that names no tracked file THE
  gate SHALL refuse it as exit 2 (called wrong) naming the fragment,
  never answer about a file that does not exist.
- IF a tracked path with a space is handed whole THEN the gate SHALL
  answer for it exactly as for any other path — a body plants such a
  path in the fixture and reds on either failure.
- The header sentence that claimed the tree holds no such path SHALL
  say what is true, derived (`git ls-files | grep ' '`).
  (the four bullets above were moved from the triage block of 2026-09-08 on 2026-09-14)

## Design note of 2026-09-14 — open before dispatch

The deletion-versus-fragment distinction this card's criteria demand has no evidence source yet: docs-gate.mjs takes paths, never a diff or a range (its header leaves range ownership with the caller), so two identical missing-path strings cannot say which was a deleted path and which a word-split fragment. Before dispatch the card names an explicit evidence source and input contract for that distinction, preserving the caller's range ownership and both required outcomes; nothing here settles it.

## Implementation notes

## Verdicts

## Triage (2026-09-08, the wave sitting)

Promoted as filed: the gate's own printed invocation must survive a
tracked path with a space, F-06 milestone 4, S, p7, guard-class.

## The triage's criteria of 2026-09-08 (moved into the canonical section above on 2026-09-14)

The four bullets that stood here were moved whole into the canonical `## Acceptance criteria` section on 2026-09-14 (pile 2 batch 3a), so the readers count one section; nothing was reworded.
