# ADR-009: Null-prototype objects for maps keyed by untrusted input

Date: 2026-08-14 · Status: accepted · Decided in: T-002 verification
(REJECTED verdict + fix; record in docs/tasks/T-002-task-parser.md)

## Context
The parser preserves unknown frontmatter keys verbatim (archaeology
rule). A crafted `__proto__:` key assigned onto a plain object hit the
inherited setter: the value became the object's PROTOTYPE — invisible
to enumeration, silently dropped from the record, and spoofable
inherited state for downstream checks. The fix sweep found a sibling
in the same file (a heading-lookup map read inherited truthy values
for `## __proto__` / `## constructor`). A competent builder session
and 38 tests missed both — this was the project's first REJECTED
verdict.

## Options considered
Blocklist `__proto__`/`constructor`/`prototype` keys — rejected:
drops or mutates data (violates preserve-verbatim) and variants are
easy to miss. Map everywhere — fine, but object shapes are natural
for JSON-ish records. Null-prototype objects — chosen.

## Decision
Any collection keyed by strings the project does not author
(frontmatter keys, body headings, ids or names read from files) is
built as a null-prototype object (`Object.create(null)`) or a `Map`
— never a plain object literal.

## Consequences
Untrusted keys land as own enumerable data properties; nothing is
inherited, nothing silently vanishes. This constrains every component
that consumes file content — C-02 CLI, C-04 daemon, C-05 app
(rendering `extra`) — not just lib-parser. Verifiers sweep diffs for
computed-key writes to plain objects. Cost: null-prototype objects
lack `hasOwnProperty` etc. — use `Object.hasOwn` / `Object.entries`.
