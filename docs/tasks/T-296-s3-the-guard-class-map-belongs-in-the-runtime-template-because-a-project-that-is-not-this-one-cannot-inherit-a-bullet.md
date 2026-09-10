---
id: T-296-s3
title: "The guard-class map belongs in the runtime template rather than in this project's conventions — a project that is not this one inherits the method's classes and has nowhere to map them"
feature: F-01
milestone: 4
size: S
priority: 2
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-296, 2026-09-10"
blocked_by: [T-299]
touches: [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts, docs/CONVENTIONS.md]
builder:
verifier:
built_by:
verified_by:
review:
---

T-296 split the guard-class list the way this method splits every
project-specific spelling: the CLASSES are in `method/tasks/TASK-FORMAT.md`
because they are universal, and the PATHS are in docs/CONVENTIONS.md
because they are not. That split is right and the second half's HOME is
probably wrong.

ADR-024 decision 7 makes universality a v1 acceptance criterion and says
every mechanism reads its configuration from the runtime template. A
project that is not this one gets the method's seven classes and a
classifier that asks its conventions document for a bullet it has never
written — so the arm refuses to classify, correctly and unhelpfully, and
the project's own first dispatch is where it finds out. The runtime
template (`method/runtime/supertaskr.yaml`) already carries role and model
defaults and is the file the genesis fills in.

Blocked by the settings schema card, because the map is a settings entry
and landing it twice is the divergence this note is about. When it moves,
the conventions bullet becomes a citation of the template rather than the
map itself, and the keeper body reads the template.

## Acceptance criteria

- WHEN the arm classifies a card THE guard-class path map SHALL be read from the runtime template, and a project whose template names no map SHALL be refused with a sentence that names the template and the field.
- WHEN docs/CONVENTIONS.md is read THE guard-class bullet SHALL cite the template rather than carrying a second copy of the map.
