---
id: T-022
title: Front door — recents, last-project persistence, override precedence
feature: F-02
milestone: 4
priority: 13
size: M
status: planned
blocked_by: []
touches: [app-shell]
builder:
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-006-s2, T-007-s1, and T-001-s1's override residual.
Triage 2026-08-15: one store, one precedence order.

Persistence coordination (triage 2026-08-16, T-026-s3): "the shell was
in genesis on <folder>" is NOT this task's to invent — T-029 owns it
and writes it into the runtime `.nputer/` registry. This task persists
recents + last project only, and CONSUMES that fact if T-029 has
landed. Accelerator discoverability (a native Tauri menu, the
Cmd-vs-Ctrl label) also lands here rather than in T-027 (T-026-s2).

Also absorbs: T-034-s3, T-049-s4 (triage 2026-08-17). Their suggestion
files are removed in the same commit as this line. The first grows the
persisted view-state seam this task already owns from three members to
four; the second is the accelerator question that belongs beside the
Cmd-vs-Ctrl label this card is already holding.

## Acceptance criteria
- THE app SHALL persist a recents list (app-config dir; last project
  = head) rendering the design's front-door recent rows (path + task
  stats), with ⌘O opening the picker — pure-lens holds: this is app
  preference state, never project truth.
- THE project resolution SHALL follow one precedence order, recorded
  and tested: explicit override (CLI arg/env) > persisted-valid last
  project > cwd walk-up > exe walk-up > None → front door.
- WHEN a persisted project no longer validates (moved, docs/ gone)
  THE app SHALL fall through to the next precedence step and surface
  a quiet note in the recents row (stale, not silently dropped).
- IF the config store is corrupt or unwritable THEN the app SHALL
  behave exactly as today (resolution without persistence; a parse
  chip note) — persistence is additive, never a new failure mode.
- THE PERSISTED VIEW-STATE SEAM HAS FOUR MEMBERS, NOT THREE. T-012
  shipped `overlay`, `selection` and `viewport` as session-ephemeral
  `useState` inside `MapView` with a note that this task absorbs them;
  T-034's criterion 1 repeated the ruling verbatim for `lens`, which
  is the fourth and **the one a user notices first, because it is the
  only one that changes what the pane is ABOUT rather than how it is
  tinted**. The list with today's homes: `lens` (`MapView.tsx`,
  default `architecture`), `overlay` (`MapView.tsx`, default
  `status`), `viewport` architecture (`MapView.tsx`, identity),
  `viewport` tasks (`TasksLens.tsx`, identity). **The two viewports
  are separate ON PURPOSE** — 192x66 nodes on a 216px pitch against
  240x58 cards on a 300px pitch, so one shared pan/zoom would
  teleport the reader on every switch; if they persist, they persist
  as two. And the bundle's list is LONGER than what exists (`pins`,
  `expandedComponentIds` and `selectedFilePath` belong to T-015 and
  T-013 and do not exist yet), so the precedence order SHALL be
  written such that adding them later is a ROW, not a redesign
  (T-034-s3).
- THE ACCELERATOR LAYOUT QUESTION SHALL BE RULED HERE, beside the
  Cmd-vs-Ctrl label this task already owns. `matchAccelerator`
  decides on `event.key.toLowerCase()` (`accelerators.ts:94`), which
  is the CHARACTER the layout produces rather than the physical key —
  so on a Russian layout the two chords report different characters
  entirely and are **not claimed and reach no command** (measured, 26
  chords against the real App and the real store), while the front
  door goes on advertising them. Same for Greek, Hebrew, Arabic, Thai
  and Dvorak. INHERITED, not introduced — T-026's handler read
  `event.key` the same way and T-049 kept its semantics byte for
  byte, deliberately and correctly, because a chord fix and a
  semantics change in one task is how you lose the ability to bisect
  either. The counter-argument is real: macOS menu accelerators are
  layout-FOLLOWING, so a user on a non-Latin layout may EXPECT the
  character-based behaviour. **Either answer is fine; the current
  state is the third one, where the app advertises a chord it cannot
  receive.** The `event.code` form is one line in one pure function,
  with a fallback to `event.key` so synthetic events and the existing
  unit table keep working. **Second, smaller, same function**: a
  keydown carrying `isComposing: true` with the Command modifier is
  CLAIMED today — the realistic case is benign, because composition
  normally reports a key name that is correctly not claimed, but the
  conventional guard is one clause and the pure matcher is where it
  belongs. Fold it into the same edit or rule it explicitly out of
  scope — either is better than it being unconsidered (T-049-s4).

## Implementation notes

## Verdicts
