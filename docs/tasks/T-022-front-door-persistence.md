---
id: T-022
title: Front door — recents, last-project persistence, override precedence
feature: F-02
milestone: 4
priority: 13
size: M
status: planned
blocked_by: []
touches: [app-shell, app-interview]
builder:
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-123-s2 (2026-09-13, pile 2 batch 2, the owner's approval of 2026-09-13). Its wake — the first card touching the board header, T-111 or T-112 — has OCCURRED, both done; the fold records that rather than fulfilling it. The sibling's file is removed in the same commit as this line; its obligation sits below tagged with its source, and its full text is kept under the absorbed heading. app-interview joins the fence for InterviewChat's auto-start comment; app-board is added only if the ruled control lives in the board's own header.

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
- WHEN the open project registers an interview session THE board header's "Start an interview" affordance SHALL reach genesis through the zero-argument door (`start_genesis_here`, which reads the open project) rather than the native folder dialog and a re-pick of the folder already open; the label or a second control for that case is a design decision recorded on this card BEFORE the dispatch stamp, and `InterviewChat`'s auto-start comment, which leans on the label's wording, SHALL be updated with it. (absorbed from T-123-s2; its wake has occurred: T-111 and T-112 are done)

## Absorbed from T-123-s2 — Getting back into your own interview costs a native dialog and a re-pick of the folder you already have open (kept whole)

Title as filed: "Getting back into your own interview costs a native dialog and a re-pick of the folder you already have open"

Filed as: status parked, priority None, size None, touches None, wake None, suggested_by executor claude-opus-5 @T-123.

T-123 makes the route exist. This is about what it costs to walk it, and
about a button whose label is now wrong for the case it serves.

**MEASURED BY READING THE TREE AT `8558352`, symbols named.** The board
header's affordance is `App.tsx`'s `data-testid="header-start-interview"`
and its handler is `pickGenesisFolder()` — `watcher-store.ts`'s wrapper
over the `pick_genesis_folder` command, which **opens the native
dialog**. So a user in @human's reproduction, sitting on the board of the
folder their interview just planned, gets back in by:

1. clicking **"Start an interview"**, then
2. re-choosing, in a native file dialog, the folder that is already open.

Only then does `apply_genesis_folder` run, see the registry, and route to
genesis. It works — that is what T-123 built — but the second step asks
the user to re-answer a question the app already knows the answer to.

**THE ZERO-ARGUMENT DOOR ALREADY EXISTS AND IS NOT WIRED HERE.**
`start_genesis_here` (`lib.rs`) takes no path: it reads
`state.genesis_target()`, which is *the open project* whenever no
rejected pick is pending, and hands it to the same
`apply_genesis_folder`. The front door's *"Start an interview here"*
button uses it; the board header does not. Wiring the header to it —
conditionally or outright — is a one-handler change in `App.tsx` and
needs no new command, no new grant and no payload movement.

**AND THE LABEL IS NOW WRONG FOR THIS CASE.** On a folder that registers
an interview, that button no longer starts one; it takes you back to one.
`InterviewChat`'s own auto-start comment leans on the label —
*"the user's action that reached this screen was literally 'Start an
interview'"* — so whoever changes the wording should read that comment
with it.

**WHY T-123 DID NOT DO IT.** `app-shell` is inside T-123's fence, so
this is scope rather than reach: no acceptance criterion names the board
header, and criterion 1 is satisfied by the route existing. It is also
genuinely a DESIGN question (does the header show a different label when
the open project registers a session? does it show a second control?)
rather than a mechanical follow-through, and T-050's *"no reachable
screen is a dead end"* is already satisfied without it.

**FENCE**: `[app-shell]` for the handler and the label;
add `app-board` if the answer is a new control in the board's own
header rather than a change to the shell's.

### PARKED — eleventh triage, 2026-08-26 (T-123-s2)

Real and still true; not now. **UN-PARK WHEN:** the first card touches the board header — `T-111` or `T-112`. Cheap and true (`start_genesis_here` exists and takes no path), but a design question about a label with no forcing event.

## Implementation notes

## Verdicts
