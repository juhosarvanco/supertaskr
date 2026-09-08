---
id: T-248-s1
title: Two tracked paths carry a space, so the DOCS GATE's own printed spelling fragments them — the gate over-fires on the head fragment and answers about a file that does not exist
feature: F-06
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: the T-248 executor, 2026-09-08, measured at d1603bb while deriving that card's own docs/ census
blocked_by: []
touches: []
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

## Implementation notes

## Verdicts
