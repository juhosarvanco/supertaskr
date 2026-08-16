---
id: T-049-s3
title: The accelerator hook's four advertised mechanism properties are unpinned — every one of them can be deleted with 503/503 still green
status: suggested
suggested_by: verifier claude-opus-5 @T-049
---

T-049's tests pin what the accelerators DO (which chords, which
command, from which screen, exactly one path) and pin it hard — a
mutation battery against `matchAccelerator` and the wiring killed seven
of eleven mutants, several of them loudly (swapping the two commands
reds 13 tests; dropping `preventDefault` reds 11; accepting Shift reds
2 across two files; a wrong command on the new header button reds 2;
dropping its `disabled={shell.picking}` reds 4).

What is NOT pinned is the hook's own MECHANISM — the four properties
`app/src/components/shell/accelerators.ts`'s header advertises, and the
four T-027 is told in T-049-s2 it can build on. Each was deleted in
turn; each left `npx vitest run` at **503 passed (503)** and `tsc`
clean:

1. **The unmount cleanup.** Delete `return () => window.removeEventListener("keydown", onKeyDown);`
   → green. Nothing anywhere asserts that the hook stops listening when
   its host unmounts. This is the one property T-026's retired
   `"stops listening once the front door is gone"` was actually
   reaching for, in the form that survives T-049: the RETIRED test,
   re-pointed at `project-shell.test.tsx`'s own
   `FrontDoorWithAccelerators` wrapper (mount the production hook,
   unmount it, press ⌘O, assert nothing fires), would have killed this
   mutant and would not have been vacuous. Cheapest fix in the repo:
   two lines in the file that already has the wrapper.
2. **"An absent entry is left completely alone."** Move
   `event.preventDefault()` ABOVE the `if (run === undefined) return;`
   → green. Today `App` always supplies both entries, so the mutant is
   unobservable; the moment T-027 hands a screen a PARTIAL table, this
   is the difference between a screen politely declining a chord and
   the app silently swallowing a key it does not handle. It is exactly
   the property the module says "lets one listener serve many screens
   without lying about which keys the app has taken", and it is the
   property T-027 will lean on hardest.
3. **The table is re-read on every render.** Delete the
   `useEffect(() => { latest.current = table; })` refresh → green. The
   card's whole argument for why T-027's absorption is "a change of
   ARGUMENT, not of mechanism" rests on this, and a stale-closure
   regression here would be invisible today (the table's two entries
   close over module-level store functions, so a frozen table still
   works) and load-bearing tomorrow.
4. **"Added once, removed once."** Change the registration effect's
   deps from `[]` to `[table]` → green. The listener would then be torn
   down and re-added on every render of `App`, which rebuilds its table
   every render. Still exactly one listener at any instant — so the
   enumeration test cannot see it — but the "registers for nothing"
   claim is unpinned.

None of these is a T-049 defect: every acceptance criterion is about
observable behaviour and every one is met and drilled. They are the
seam between "the accelerators work" and "the accelerator MODULE is a
thing T-027 can extend safely", and T-049 is the task that created the
module. Four small tests in `app/test/accelerators.test.tsx` (or one
`accelerators-hook.test.tsx` with a throwaway host component) close all
four; (1) and (2) are the two that would bite.

One smaller note for whoever writes them: `accelerators.test.tsx`'s
`trackKeydownPaths` comment says it records "every live keydown
listener in the app, whichever target it is on", but it patches
`window` and `document` only (its own `where` type says so). Measured:
a second handler on `document.body` that calls `preventDefault` is
still caught — by the per-chord claim count, which is the complementary
instrument — but a `document.body` handler that runs a command WITHOUT
claiming the chord is caught by neither, and a `window.onkeydown`
PROPERTY handler is invisible to the enumeration by construction (it
never reaches `addEventListener`; in jsdom it does not fire at all, so
the gap cannot even be demonstrated there). Both are narrow and neither
is reachable from anything in the tree today — every keydown listener
in `app/src` goes through `addEventListener` on `window` or `document`
(`accelerators.ts`, `panel-dismissal.ts`, `MapView.tsx`'s ⌘F). Worth a
one-line comment correction more than a test.
