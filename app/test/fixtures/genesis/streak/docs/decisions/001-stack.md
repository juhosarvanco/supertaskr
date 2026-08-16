# ADR-001: Rust, stdlib-only, single static binary

Date: 2026-08-16
Status: accepted
Decided in: /plan interview Q5

## Context
streak needs a CLI that starts in under 50ms (success criterion 1),
installs as a file dropped into ~/bin, and reads/writes one plain-text
store. The founder's tooling history: runtime-dependent tools (Python,
Node) rot with version drift in dotfiles.

## Options considered
- Shell script — meets 50ms trivially; rejected: week/date arithmetic
  and malformed-line handling become untestable string glue.
- Python/Node — fastest to write; rejected: requires a runtime on
  every machine, the exact drift the founder is escaping.
- Go — static binary, fine fit; rejected only because it serves no
  learning goal, and motivation is part of this product's fuel.
- Rust — chosen.

## Decision
Rust, standard library only in v1 (no crates), compiled to a single
static binary. Learning Rust is an acknowledged PERSONAL goal accepted
at the cost of delivery speed — recorded so no session trades the
language away to "go faster".

## Consequences
- Distribution = copy one binary; no packaging work in milestone 1.
- No crates: date/week logic is hand-rolled and must be unit-tested.
- Slower founder velocity is expected and accepted; if it endangers
  the 8-week self-trial, that is a signal to surface, not hide.
