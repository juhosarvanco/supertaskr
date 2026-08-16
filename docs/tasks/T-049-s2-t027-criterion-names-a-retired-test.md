---
id: T-049-s2
title: T-027's accelerator criterion names a test T-049 retired — reconcile it at the planning pass, before a builder goes looking
status: suggested
suggested_by: executor claude-opus-5 @T-049
---

T-027's last acceptance criterion (the T-026-s2 fold) reads:

> WHEN any screen registers a WINDOW-LEVEL accelerator THE app SHALL
> route it through ONE screen-scoped accelerator table rather than a
> second `window` keydown listener: T-026's front-door Cmd-O/Cmd-N move
> onto it unchanged (**their unmount-scoping test stays green**) and this
> screen's own keys join it …

The bolded parenthetical is now false, and it was made false on purpose.
T-026's `"stops listening once the front door is gone"`
(app/test/project-shell.test.tsx) asserted that the front door's listener
died with the front door — which is exactly the defect @human reported
("command + o and command + n are not working"). T-049 replaced that test
rather than keeping it, because after the fix it would have passed
VACUOUSLY: a component that never listens cannot stop listening. Its
replacement asserts the same concern mechanically and more strongly —
that `EmptyState` registers ZERO window keydown listeners, so nothing can
supplement the app's one — and the behaviour that matters (the chords
still reaching the right command with the front door gone) is asserted in
`app/test/accelerators.test.tsx` against the real App and the real store.

The rest of that criterion is untouched by T-049 and is if anything
easier now: there is ONE listener to absorb rather than two, its table is
already re-read on every render (so scoping by screen is a change of
argument, not of mechanism), and an accelerator a screen omits is left
completely alone — no preventDefault, nothing swallowed.

Why file this rather than edit T-027: its criteria are its own card's,
and T-027 is an L card owing a planning pass before dispatch. This is a
one-line reconciliation for that pass. Suggested wording:

> … T-026's front-door Cmd-O/Cmd-N are already on it (T-049 lifted them
> to `app/src/components/shell/accelerators.ts`; its "exactly one keydown
> path" tests stay green) and this screen's own keys join it …

Two smaller notes for the same pass, so they are not rediscovered:

- **The table lives beside the shell components, not in `app/src/lib/`.**
  Measured reason in the module header: `app/src/lib/`'s files are
  claimed one by one by three different components, so a new file there
  is unclaimed territory in the architecture graph (a regen put it in the
  `D2:unmapped` finding and grew the map an unmapped bucket, which
  `architecture-dogfood.test.ts` asserts does not exist).
  `app/src/components/shell/**` is already C-05's.
- **The ⌘-vs-Ctrl label and a native Tauri menu are still T-022's**, as
  T-026-s2 said. T-049 changed neither: the matcher accepts either
  modifier, and only the rendered glyphs are macOS-shaped.
