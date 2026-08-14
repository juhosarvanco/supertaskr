# ADR-003: Shell out to agent CLIs; never touch the inference bill

Date: 2026-08-14 · Status: accepted · Decided in: planning chat

## Context
Model-agnosticism is a hard requirement; third-party layers that proxy
model APIs inherit margin problems and platform risk (see
docs/research/competitors.md graveyard).

## Options considered
Direct API integration per provider vs spawning/resuming the user's
own installed agent CLIs (claude, codex, gemini, ollama) with role
prompts.

## Decision
The CLI only spawns and resumes the user's agent CLIs. New agent
support = one adapter entry. Nputer never holds API keys or proxies
tokens.

## Consequences
Vendors maintain the hard parts; their improvements lower our cost.
Limitation accepted: we control sessions only as far as each CLI's
resume/headless flags allow.
