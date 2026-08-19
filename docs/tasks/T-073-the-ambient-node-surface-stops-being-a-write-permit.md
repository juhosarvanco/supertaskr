---
id: T-073
title: The ambient node surface stops being a write permit for app/src
feature: F-02
milestone: 4
priority: 32
size: S
status: planned
blocked_by: []
touches: [app-shell]
builder:
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-028-s6 (fourth triage, 2026-08-19). The suggestion file is
removed in the same commit as this card.

A GUARD THAT USED TO BE FREE, AND NO LONGER IS. `app/tsconfig.json`
reads `"include": ["src", "test"]`, so the ambient declarations in
`app/test/node-builtins.d.ts` are visible to **`app/src` as well as
`app/test`**. That file exists precisely because the app ships no
`@types/node`: a webview module that reaches for a node builtin used to
fail `tsc` by construction, and the declarations were deliberately
narrow — the whole `node:fs` surface was READ-ONLY. T-028 needed to
write a real decomposition into a temp project, so it extended the file
with `mkdtempSync`, `mkdirSync`, **`writeFileSync`**, `rmSync` and
`node:os`'s `tmpdir`. Legitimate, and the file's own comment scopes it
honestly. The side effect is that those write functions are now declared
for `app/src` too.

MEASURED, and re-verified live at `7282308` — the include line and the
write declarations are both unchanged. A four-line probe placed under
`app/src` importing `mkdirSync` and `writeFileSync` typechecks at exit
0 with zero diagnostics; against the same tree with only
`node-builtins.d.ts` reverted to its pre-T-028 content it fails with
TS2305 and TS2724 ("has no exported member named 'writeFileSync'. Did
you mean 'readFileSync'?").

WHY IT MATTERS, AND WHY IT IS SMALL. ADR-017's rule is that the spawned
planner writes and the app renders what lands. The type system used to
enforce half of that for free. What remains is `crescendo-dom.test.tsx`'s
sink sweep, which greps for the write calls but **only over
`app/src/genesis/`** — a write introduced anywhere else under `app/src`
would now pass `tsc` and pass every existing gate. Rollup would probably
complain about a node builtin in the webview bundle, but "probably" at
build time is not a red diagnostic at the seam. It is small because
nothing does this today: `git grep` over `app/src` for the write calls
returns nothing.

## Acceptance criteria
- THE write declarations SHALL LEAVE THE SHARED AMBIENT FILE — a second
  ambient file included only by a test-scoped tsconfig, or a
  `declare module` block inside the one test that needs it. `app/src`
  SHALL return to the read-only node surface it had, and the tests that
  legitimately write into a temp project SHALL keep compiling
  unchanged.
- THE RESTORATION SHALL BE PROVED BY A PROBE, not asserted: a file under
  `app/src` importing a write call SHALL be shown to RED the typecheck
  with the expected diagnostics, then removed, with the tree proved
  clean afterwards. A criterion that only says "tsc still passes" would
  pass with the hole open.
- THE SINK SWEEP SHALL WIDEN from `app/src/genesis/` to ALL of
  `app/src` — one `walk()` instead of one `readdirSync`, the same shape
  as the IPC command sweep beside it. **Both closers, not either**: the
  ambient split restores the free guard exactly, the sweep catches more
  than this one, and they are not alternatives.
- THE DIFF SHALL CARRY NO BEHAVIOUR CHANGE. Nothing under `app/src`
  writes today, so this is a guard restoration; if the widened sweep
  finds a real sink, that is a finding and SHALL be filed rather than
  quietly fixed inside this card.

Verification: headless — `npx tsc --noEmit` with the probe in and out,
app Vitest for the widened sweep. No Rust, no manifest, no IPC surface.

FENCE NOTE: TypeScript, tsconfig and tests only — **no Rust**. This card
holds `app-shell` only because the fence spans both halves of C-05; the
`app/src-tauri` half is untouched, so nothing in this diff can collide
with a Rust-only lane except through the fence's coarseness.

## Implementation notes

## Verdicts
