# ADR-001: Build nputer with nputer

Date: 2026-08-14 · Status: accepted · Decided in: planning chat (human directive)

## Context
The product needed a first real project; Omputer archaeology was the
planned pilot, but the human chose to build the tool first.

## Options considered
Pilot on Omputer first (more evidence, delays the product) vs bootstrap
on itself (dogfooding from task one, evidence and product in one run).

## Decision
Nputer's own development is nputer's first project, run by hand until the
CLI exists. Omputer archaeology follows as the second project.

## Consequences
Every friction is a bug report AND a feature spec; docs/ doubles as the
living demo; the overhead we feel is data. The convention must stay
usable with zero tooling — this decision depends on it.
