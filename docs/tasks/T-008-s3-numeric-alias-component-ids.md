---
title: Flag numerically-equal component ids (C-05 vs C-005) as aliases
status: suggested
suggested_by: verifier claude-fable-5 @T-008-verify
---

`^C-\d{2,}$` admits zero-padded aliases: C-05, C-005 and C-0005 are
distinct strings, so two files declaring C-05 and C-005 parse as two
different components with no duplicate-id issue — yet the C-namespace
(ARCHITECTURE.md table, plan §0.0-8) plainly intends one slot per
number. compareComponentIds already treats them as numerically tied
(it falls back to string order, so behavior stays total and
deterministic — verified), but the registry would silently carry two
nodes for one architectural slot.

Suggestion: at set level, emit a structured warning when two DIFFERENT
id strings share the same numeric value (reuse or sibling the
duplicate-id kind, e.g. message "numerically equal ids C-05 and C-005
— zero-padding aliases one slot"). Cheap (the comparator's digit
extraction already exists), collect-don't-throw like everything else,
and it closes the one crack in the identity gate the verifier probes
found. Not a T-008 failure: no criterion requires numeric
canonicalization, the live registry has no aliases, and behavior on
aliases today is deterministic — this is hardening for agent-written
registries.
