# ADR-002: Files are the shared brain; local-first

Date: 2026-08-14 · Status: accepted · Decided in: planning chat

## Context
Sessions and models cannot share context; a coordination substrate was
needed. Category research later showed cloud-dependent competitors
dying and stranding users.

## Options considered
Live inter-agent channels / shared context service vs markdown files
in the repo as the only coordination layer.

## Decision
All state lives in files in the repo. No cloud component, no accounts,
no state outside the folder. Every session is disposable; the
succession guarantee (swap any role's model/session anytime, zero
loss) follows from this.

## Consequences
Dashboard must be a pure lens; daemon holds no state; killing anything
is safe. Constraint accepted: no cross-device sync without the user's
own git remote.
