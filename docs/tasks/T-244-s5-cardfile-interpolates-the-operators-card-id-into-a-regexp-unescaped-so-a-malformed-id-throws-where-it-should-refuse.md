---
id: T-244-s5
title: "`cardFile` interpolates the operator's card id into a `RegExp` unescaped, so a malformed id is an uncaught SyntaxError and a wildcard is a card lookup — `undo`/`merge` throw where they should refuse"
feature: F-01
milestone: 4
size: S
priority: 8
status: suggested
suggested_by: "verifier claude-opus-5[1m]@subagent, in T-244's verification bench (second pass, at 870c14e), 2026-09-09 — found by the security sweep on undo.mjs, which the fix pass moved"
blocked_by: []
touches: [tools/e2e/]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## What was measured

`tools/e2e/scripts/undo.mjs`'s `cardFile` — which `merge.mjs` imports and
shares — resolves a card by building a regular expression out of the
operator's own argument:

    return new RegExp(`^id: ${id}\\s*$`, "m").test(text);

The id is never escaped. `mentionsCard`, ten lines away in the same file,
DOES escape (`id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")`), which is what
makes the asymmetry visible.

Two consequences, both reproduced at `870c14e` on the verification bench:

**A malformed id is an uncaught `SyntaxError`, not a refusal.**

    $ node tools/e2e/scripts/undo.mjs 'T-((((((((((a' --root <fixture> --dry-run
    SyntaxError: Invalid regular expression: /^id: T-((((((((((a\s*$/m: Unterminated group
        at new RegExp (<anonymous>)
    exit=1

Every other bad input to these two verbs is a NAMED refusal on exit 3
with nothing spawned — the verifier's first pass recorded that as one of
the things the lane got right. This one path is a stack trace.

**And the card lookup is a REGEX, not an id.** On this repository's board
at the same ref, `cardFile("T-24.")` reports *10 cards carry `id: T-24.`*
and `cardFile("T-2[0-9][0-9]")` reports 74. Where the pattern matches
exactly one card, the verb proceeds having resolved a card the operator
did not name. Today that is blocked only by accident: `mentionsCard`
escapes, so the merge-subject lookup then fails to find the literal
pattern text and the verb refuses. The two lookups disagree, and the
disagreement happens to fail safe.

**A third, same class, at a site the fix pass added.** `runInstall`'s new
collision check does `readFileSync(to, "utf8")` on every existing
destination; where the destination is a DIRECTORY it throws `EISDIR`
uncaught. Measured with `.codex/prompts/seat.md` made a directory: exit
1, stack trace, no named refusal.

## Why this is filed as a suggestion and not a defect

Every value here comes from the operator's own command line; there is no
shell anywhere in these scripts; no probe of mine ever escaped an argv
array. The consequence is a crash or a refusal, never an escalation —
the same reasoning the first verdict applied to T-244-s4. It stops being
harmless the moment either verb is driven by the seat skill (T-241) or a
CI step rather than a hand, which is why it is written down.

## What would close it

Match the id LITERALLY — reuse the escape `mentionsCard` already
performs, or compare the parsed `id:` value rather than pattern-match the
text — and let `runInstall` treat an unreadable destination as a
collision to be named rather than a throw.

## The control, and it is the verifier's to check

The body: `cardFile("T-((((((((((a", <the real board>)` returns a
`{ problem }` and does not throw; `cardFile("T-24.", …)` reports **no
card**, not many; and — the positive control — `cardFile("T-244", …)`
still resolves to its one file.

**Run at `870c14e`, against the implementation that LACKS the property,
it FAILS**, and it fails on the very throw it exists to refuse:

    SyntaxError: Invalid regular expression: /^id: T-((((((((((a\s*$/m: Unterminated group

so its green would mean something. Run where the arrangement that decides
it is absent — a fixture board with no cards at all — the same body would
pass for the wrong reason, because every lookup returns *no card*
whatever the id; the real board, with `T-244` present to answer the
positive control, is what separates the control from a tautology.
