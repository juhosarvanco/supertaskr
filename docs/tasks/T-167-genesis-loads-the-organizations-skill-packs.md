---
id: T-167
title: Genesis loads the organization's skill packs — the playbook's own SKILL.md format discovered in the opened project, carried into the kickoff, and stamped into the session record
feature: F-03
milestone: 4
priority: 2
size: M
status: building
blocked_by: []
touches: [app-agent]
suggested_by: "@human ruling (2026-08-30, loop-customization sitting): two-track sitting approved — track 1, wire skills into genesis, is form-independent engineering and proceeds"
builder: claude-opus-5@subagent
verifier:
built_by:
verified_by:
review:
---

**FILED AT THE LOOP-CUSTOMIZATION SITTING (2026-08-30), planned at
filing on @human's ruling.** The playbook's Stage-2 sentence made
real: *"Claude takes the accepted intent and produces a requirements
and design spec, guided by the organization's skills for brand,
security, compliance, and UX."* This card is the smallest slice the
room named — genesis only, no per-stage slots, no UI — and it is
deliberately FORM-INDEPENDENT plumbing: whatever @human rules on the
customization form (T-168's brief), skills discovered from files are
the substrate both forms share.

## Acceptance criteria

- WHEN a genesis session starts THE runner SHALL discover skill packs
  in the OPENED project at `.claude/skills/<name>/SKILL.md` — the
  playbook's format, adopted verbatim: frontmatter with name,
  description, and trigger conditions; body with the guidance. A pack
  that fails to parse is REPORTED by name and skipped, never a crash
  and never silently absorbed.
- THE kickoff assembly SHALL carry the discovered skills into the
  planner's context the way it already carries the kit — and the
  seat SHALL derive where that assembly lives rather than trusting
  this card's guess; the fence is `app-agent`, and if the true
  assembly point sits outside it, STOP and record (the T-163
  criterion-1 precedent).
- THE session record SHALL stamp WHICH packs were loaded, by name and
  content hash — the provenance half, D5's sibling: "which policy
  shaped this decision" must be answerable later from files alone.
- WHEN no packs exist THE behaviour SHALL be byte-identical to today
  — measured, not assumed: the existing genesis tests green unchanged
  is the pin.
- GUARD RULES: a fixture pack that must appear in the assembled
  kickoff (positive control), a malformed pack that must be reported
  and skipped, and a no-packs run proven identical — pinned in the
  cargo suite, mutants disposed per the POISON DRILL bullet.
- THE skills directory is a READ surface: nothing in this card writes
  into `.claude/skills/`, and D3's narrow ruling is untouched.

## Fence note at filing

`touches: [app-agent]` — disjoint from every queued card at filing
(derive at dispatch). The e2e seat is NOT held by this card.

PREFLIGHT RULING (2026-08-30): the finding "STALE PATH .claude/skills" is RULED ACCEPTABLE — `.claude/skills/<name>/SKILL.md` names a RUNTIME surface in the OPENED project (the project genesis is run against: a temp directory in the smoke, a fixture directory in tests), never a tracked path in this repository. This repository deliberately has no such directory today, and the card creates none here; the criteria's third bullet already states the read-only nature of the surface. The preflight cannot know an opened-project path from a repo path, which it says honestly in its cannot-rows — this ruling is the missing knowledge, dated.
