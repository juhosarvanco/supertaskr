---
id: T-293-s6
title: "The index's when-to-open half for CONVENTIONS resolves to a single 98,573-byte section, because that document has exactly two headings and no sub-headings — the one document where a vague pointer costs the most is the one the derivation can say least about"
feature: F-01
milestone: 4
size: S
priority: 4
status: parked
wake: T-290
suggested_by: "verifier claude-opus-5@subagent @T-293 (phase 2), measured at 6d904bf72ca0dc57cd674c419c898b7f3f8f293c"
blocked_by: []
touches: [tools/e2e/scripts/docs-scan.mjs, tools/e2e/tests/docs-input-gate.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

T-293's index gives each governing document a line whose second half says
where to open it, derived from that document's own section headings and
capped at six. Derive what that yields for the biggest document:

    grep -c '^## '  docs/CONVENTIONS.md      # 2
    grep -c '^### ' docs/CONVENTIONS.md      # 0

The line reads **Open it at:** Build & test · Gotchas. Measured at this
ref, Build & test is 39,575 bytes and Gotchas is 98,573 — so a seat told
to open the document at its section is told to open about 98 KB, roughly
24K tokens, which is the read the card was cut to remove.

**THE DERIVATION IS NOT AT FAULT AND MUST NOT BE BLAMED.** It reports
everything the document has; the other three lines are genuinely useful
(ARCHITECTURE names four sections, CAPABILITIES names six and counts the
other thirty-four). The gap is that CONVENTIONS' navigable structure is
its BULLET OPENERS, not its headings — which is the same corpus T-254's
context pack already indexes by opener to hand a lane its bullets.

**WHY IT MATTERS MORE THAN THE OTHER THREE.** The index's line is the
escape hatch for a seat the pack did not hand a rule, and CONVENTIONS is
the document that hatch is for. The ask file is the other move and stays
open; this is about making the second move worth taking.

## Acceptance criteria

- WHEN the index carries a line for a document whose sections are larger
  than some stated bound THE where-to-open half SHALL be derived from a
  finer structure that document really has — its bullet openers, the same
  ones the context pack already finds — rather than from its headings.
- THE bound SHALL be stated where it is applied and SHALL be a
  measurement of the document rather than a name in a list, so a document
  that gains headings stops taking the finer treatment on its own.
- A body SHALL red when a line's where-to-open half resolves to more than
  that bound, measured off the committed documents.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts

Parked 2026-09-13 (the pruning sitting (T-306), the owner's ruling of 2026-09-13): kept with a wake — wake T-290; the index's pointer resolves to a single 98,573-byte section until that document is re-landed with sub-headings.
