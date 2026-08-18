---
title: One value import at the top of startup-screen.test.tsx silently turns 10 of its 15 tests into browser tests
status: suggested
suggested_by: executor claude-opus-5 @T-063
---

**Measured, not theorised — it happened to this executor mid-build and it
cost a full RED cycle to find.**

`app/test/startup-screen.test.tsx` decides everything it asserts from one
ordering property, held today by a comment and by nothing else:

    // The store decides `isTauri` at import time — set before App is loaded.
    (window as …).__TAURI_INTERNALS__ = {};
    const { default: App } = await import("../src/App");

T-063 needed `STARTUP_DEADLINE_MS` in that file. Adding the obvious

    import { STARTUP_DEADLINE_MS, type StartupFailure } from "../src/lib/watcher-store";

at the top loads the store BEFORE the assignment, so `isTauri` resolves
`false` and the whole file runs against a BROWSER shell. **10 of the
file's 15 tests went red**, with `expected 'browser' to be 'loading'` and
`expected [ 'Toggle theme' ] to deeply equal [ 'Toggle theme', 'trying…',
… ]` — the second of which is, exactly, the assertion whose comment reads
"Before T-050 this list was exactly ['Toggle theme']". The file's own
headline claim silently became a claim about a different runtime.

**The reason this deserves a file rather than a shrug: it went red, which
is the LUCKY case.** Ten failures are loud. A file that had happened to
assert only things true in both runtimes would have gone on passing while
testing nothing the task is about, and no gate anywhere would have said
so. `tsc` is happy, the lint is happy, and the failure is a property of
IMPORT ORDER, which no tool in this repo reads.

**Fixed locally the right way** — the type is imported with `import type`
(erased, loads nothing) and the value comes from a dynamic import beside
the `App` one, with the measurement written into the comment so the next
reader does not rediscover it. That protects this file. It protects no
other.

**The general shape.** Any test that must decide a module-level constant
before importing the module under test is one careless import away from
silently testing the wrong thing. In this repo that is at least
`startup-screen.test.tsx`, `shell-harness.test.ts` and
`startup-recovery.test.ts` (the last two use `vi.resetModules()` +
dynamic import inside helpers, which is the robust idiom and is why they
were unaffected).

**Closers.** (a) Make `startup-screen.test.tsx` use the `freshStore()`
idiom its two siblings use, so no top-level import of the store can
matter. Probably right, and probably 20 lines. (b) A cheap tripwire in
the file: assert `isTauriRuntime() === true` once in `beforeAll`, so the
whole file fails with one legible sentence instead of ten confusing ones.
Two lines, and it turns the lucky case into the guaranteed case. (c) Do
nothing and keep the comment — which is the status quo that just failed.

(b) alone would have saved the cycle that produced this file.
