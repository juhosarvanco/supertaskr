import { useEffect, useRef } from "react";

/**
 * The app's keyboard accelerators: ONE `window` keydown listener for the
 * whole app, and one table saying what each claimed chord does.
 *
 * T-026 mounted the ⌘O / ⌘N listener inside `EmptyState`, so it
 * registered when the front door mounted and unregistered when it left —
 * with a project open the board renders instead and the chords the front
 * door advertises reached nothing at all (found by @human, T-049). The
 * listener therefore moves UP, to the root component, and is REPLACED
 * rather than supplemented: a second `window` listener racing the first
 * over the same modifier chords is how key handling rots.
 *
 * Two pieces, deliberately separable:
 *
 * - `matchAccelerator` is PURE — the single answer to "which chords does
 *   this app claim?", so criterion 6's "no new preventDefault beyond the
 *   two chords already claimed" is a property of one function rather
 *   than a habit spread across components. It is also why the negative
 *   chords (bare `o`, ⌘⇧N, ⌥⌘O) can be pinned without a DOM at all.
 * - `useAccelerators` is the ONE registration. The table is read through
 *   a ref, so the listener is added once for the lifetime of the
 *   component that mounts it and re-registers for nothing — and a table
 *   whose entries change (or whose entries a screen omits) needs no new
 *   mechanism.
 *
 * T-027 absorbs this (T-026-s2's routing question folded into it): it
 * wants ONE screen-scoped accelerator table, and what it inherits here
 * is a table already read fresh on every render. Scoping by screen is
 * `useAccelerators(tableFor(screen))` — a change of ARGUMENT, not of
 * mechanism, and no second listener anywhere to reconcile first. An
 * accelerator a screen does not claim is simply absent from its table,
 * and an absent entry leaves the event completely alone (no
 * preventDefault), which is what lets one listener serve many screens
 * without lying about which keys the app has taken.
 *
 * Out of scope and recorded rather than forgotten (T-026-s2, T-027):
 * the ⌘-vs-Ctrl LABEL and a native Tauri menu both stay with T-022. The
 * handler has always accepted either modifier; only the rendered glyphs
 * are macOS-shaped.
 *
 * WHY THIS DIRECTORY. It follows `components/board/panel-dismissal.ts`
 * exactly — a listener-wiring module beside the components it serves,
 * not a component itself — and `app/src/components/shell/**` is already
 * C-05's declared territory (docs/architecture/components/C-05-app.md),
 * so the app's own keys are claimed by the app's own component.
 * `app/src/lib/` would NOT have been: its files are claimed one by one
 * by three different components (watcher-store.ts and docs-model.ts are
 * C-10's, agent-store.ts is C-14's, utils.ts and verdicts.ts are
 * C-05's), so a new file there is unclaimed territory until somebody
 * edits an architecture document. Measured rather than assumed: with
 * this module under `app/src/lib/`, a graph regen put it in the
 * `D2:unmapped` finding and grew the map an unmapped bucket, which
 * `app/test/architecture-dogfood.test.ts` asserts does not exist.
 */

/** A chord the app claims. */
export type AcceleratorId = "openFolder" | "startInterview";

/** Everything the matcher reads from a keydown event — a plain shape, so
 * the matcher can be exercised without constructing DOM events. */
export interface AcceleratorChord {
  key: string;
  metaKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
}

/**
 * Which accelerator this chord is, or `null` for every other key.
 *
 * The semantics are T-026's, unchanged and deliberately so: Command OR
 * Control (the label renders the design's macOS glyphs, the handler is
 * not that fussy), never with Alt or Shift, and only `o` / `n`.
 * Deliberately makes NO judgment about the event's target — ⌘O and ⌘N
 * are not text-editing keys, so they keep working while an input or
 * textarea has focus (criterion 6).
 */
export function matchAccelerator(event: AcceleratorChord): AcceleratorId | null {
  if (!(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) return null;
  switch (event.key.toLowerCase()) {
    case "o":
      return "openFolder";
    case "n":
      return "startInterview";
    default:
      return null;
  }
}

/**
 * What the current screen does with each claimed chord. An absent entry
 * means this screen does not claim that accelerator — the event is left
 * untouched rather than swallowed.
 */
export type AcceleratorTable = Partial<Readonly<Record<AcceleratorId, () => void>>>;

/**
 * Register THE app's keydown listener (mount this exactly once, at the
 * root). Everything the app does with a modifier chord goes through the
 * table this hook is handed; nothing else in the app may add a `window`
 * keydown listener for these chords — asserted in
 * test/accelerators.test.tsx, which enumerates every live keydown path
 * and requires exactly one of them to reach each command.
 */
export function useAccelerators(table: AcceleratorTable): void {
  // The live table, read at keypress time. Keeping it in a ref is what
  // makes "one listener, added once" true regardless of how often the
  // caller re-renders or re-builds its table.
  const latest = useRef(table);
  useEffect(() => {
    latest.current = table;
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      const id = matchAccelerator(event);
      if (id === null) return;
      const run = latest.current[id];
      if (run === undefined) return; // not claimed here: not ours to swallow
      event.preventDefault();
      run();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
