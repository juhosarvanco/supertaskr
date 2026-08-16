---
title: ⌘O/⌘N are front-door-local — decide who owns accelerators before a second screen wants keys
status: suggested
suggested_by: executor claude-opus-5 @T-026
---

T-026 wired the design's advertised accelerators (⌘O opens a folder, ⌘N
starts an interview) as a `window` keydown listener inside `EmptyState`
(app/src/App.tsx), mounted and unmounted with the front door. That is
right for one screen and provably scoped (a DOM test asserts the
listener stops firing once the front door unmounts), but it is not an
architecture:

- The board has no ⌘O, though the header's "Open folder…" button is the
  same action — the accelerator advertised on the front door silently
  stops working the moment a project opens.
- There is no application menu, so nothing DISCOVERS the accelerators
  except the front door's `⌘O · ⌘N` hint; a Tauri menu would also give
  macOS users the standard Cmd-key surface they expect.
- The label is macOS-shaped (⌘) while the handler accepts Ctrl too, so
  Linux/Windows users get working keys with wrong labels — a small,
  standing lie that a platform-aware label or a menu would fix.
- T-027's split view will want keys of its own (send a turn, cancel),
  and two independent window listeners racing over modifier chords is
  how key handling rots.

Decide before the second screen wants keys: a small shell-level
accelerator registry (one listener, screen-scoped table) or a real Tauri
menu with accelerators (which moves the surface Rust-side and would want
an ADR-012 look, since a menu is a native surface). Not blocking —
today's listener is correct, tested, and confined.
