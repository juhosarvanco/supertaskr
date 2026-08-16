---
id: T-049-s1
title: The lane can prove a chord was CLAIMED, never that it was OBEYED — and the header's two ways in are invisible to it
status: suggested
suggested_by: executor claude-opus-5 @T-049
---

Two instances of one root cause, found while writing T-049's
served-bundle spec. The DEV bundle the lane drives is deliberately NOT
the app: `isTauri` is false there, and the shell branches on it in two
different ways.

**(1) An accelerator's ACTION is unobservable in a browser.**
`runPicker` (watcher-store.ts) opens with `if (!isTauri || shell.picking)
return;`, so in the served bundle ⌘O calls `pickProjectFolder()` and that
function does nothing — correctly, since there is no IPC to call and no
native dialog to open. `tools/e2e/tests/accelerators.spec.ts` therefore
observes the only thing left: `event.defaultPrevented`, read by a witness
listener registered after the app's own. That is real evidence and it
reds against the pre-T-049 code on every screen — but it proves the app
CLAIMED the keypress, not that the claim reached a command. The
chord→command edge is proven in `app/test/accelerators.test.tsx` against
the real store with the IPC boundary mocked; nothing in the lane sees it.

**(2) The header's two ways in do not render in a browser at all.**
`{screen.screen === "board" && isTauriRuntime() && (…)}` gates BOTH
header buttons (`open-folder` since T-026, `header-start-interview` since
T-049), so the lane cannot pin the pairing against real CSS the way
`front-door.spec.ts` pins the front door's two-button row — order,
computed border colour, one-row layout. Its jsdom cover is real but it
runs against a DOM emulator, and the front-door precedent shows what the
lane adds. This also means the ONE screen where T-049's affordance is
visible is the one screen the served bundle cannot show.

Neither is a T-049 defect: both gates predate it and both are correct
about what a browser can do. What is new is that T-049 is the first task
whose whole subject lives behind them, and T-027 will be the second — it
adds keys AND a screen whose actions are all IPC.

Candidate remedies, cheapest first:

1. **Count attempts, DEV-only.** Have the store record command names it
   was ASKED for even when `!isTauri` short-circuits (a dev-only array
   beside `__nputerEchoes`, or a field on `ShellHarnessSnapshot`). A lane
   spec could then assert `⌘O → "pick_project_folder"` in the served
   bundle. Small, and it makes T-027's keys testable the same way.
   Cost: one more DEV-gated surface to audit (T-041's argument for a
   single gate applies — it should live in the same block).
2. **Render the header pair in browser mode, disabled**, with a title
   explaining why. Costs a visible change to the DEV bundle only, buys
   the lane the same real-CSS pinning the front door gets.
3. **Do nothing and say so**: record in CONVENTIONS that the lane covers
   what a browser can reach and that Tauri-gated affordances are
   jsdom-plus-@human territory, so nobody later mistakes a green lane for
   coverage of the shipped header.

Related: T-041-s4 (the DEV gate is flipped by an inherited env var, not
by a configured path) — same family of "the gate proves the configuration
it was handed".
