---
title: blocked_by self-references and cycles resolve silently
status: suggested
suggested_by: verifier claude-fable-5 @T-019
---

T-019's blocked_by check answers exactly one question — does the id
resolve against a parsed task — so `blocked_by: [T-901]` inside
T-901's own file resolves cleanly (probe-verified during the T-019
verification), and so would any longer cycle (T-901 → T-902 → T-901).
Neither is a dangling reference, so neither was T-019's business, but
both are graph states the dependency semantics cannot honor: a task
never becomes unblocked by its own completion. Today the board only
renders blocked_by chips, so the cost is cosmetic; once dispatch or
ordering logic consumes the graph (the orchestrator's parallelism
guardrails, F-03's generated task graphs), a cycle silently wedges a
lane. validateProject already holds the whole model, so a visited-set
walk emitting a structured project-level issue (one per cycle, not
per member — the T-019 one-root-cause discipline) is a few lines in
lib/parser/src/validate.ts plus tests. Deliberate-decision material
rather than a silent widening: it tightens what graphs are legal.
Touches lib-parser only.
