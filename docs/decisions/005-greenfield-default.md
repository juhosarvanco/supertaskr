# ADR-005: Greenfield is the default; archaeology is the variant

Date: 2026-08-14 · Status: accepted · Decided in: planning chat (human directive)

## Context
The product's main gist: idea → thorough plan → exact tasks. Existing
repos (Omputer) are the urgent personal case but not the thesis.

## Decision
`init` runs the planning interview by default; `--existing` runs
archaeology, which merges into the same decomposition stage. Both end
at the dispatchability test.

## Consequences
The interview is the front door and gets the polish budget. Archaeology
quality still matters (most real-world entries mid-life) but follows
the interview's structure, not the reverse.
