---
id: T-073-s2
title: The restored guard holds in the app program only — the test program still declares the node writes for app/src, and no tsconfig can fix that
status: suggested
suggested_by: executor claude-opus-5 @T-073
---

The honest scope of what T-073 restored, recorded so a later reader does
not over-read the card.

**What T-073 restored.** `app/tsconfig.json` now includes
`["src", "test/node-builtins.d.ts"]`, so the program bare `tsc`
compiles — the first thing `npm run build` runs, and the app's whole
typecheck gate — sees only the READ-ONLY `node:fs`. A probe under
`app/src` importing `mkdirSync`/`writeFileSync` fails it with TS2305 and
TS2724, exit 2. That is ADR-017's free half, back.

**What it did not restore, and cannot.** `app/tsconfig.test.json`
includes `test/`, which pulls in `node-builtins-write.d.ts`. The test
files import `../src/App` and friends, so **every `app/src` file is in
the test program too** — and ambient module declarations merge
program-wide. Measured: the identical probe under
`tsc -p tsconfig.test.json` compiles at **exit 0**.

**No arrangement of tsconfigs closes this.** A file enters a TypeScript
program either through `include` or through an import from a file that
did; the tests must import the frontend to test it. So there is no
program that contains the tests and excludes `app/src`, and therefore no
program in which the writes are declared and `app/src` is absent.
Excluding the write declarations by `exclude` does not help either —
`exclude` filters `include`, it does not stop a file arriving by import
or by a triple-slash reference, and once the file is in the program its
`declare module` block is global again.

**Why this is probably fine, stated as the argument to accept rather
than as a fact.** The property that matters is "a write under `app/src`
fails A GATE", and it does: `npm run build` reds, and CI runs
`npm run build`. Nothing runs `tsc -p tsconfig.test.json` on its own.
The second closer — the sink sweep, widened by the same card to all 47
files under `app/src` — reds on the same probe regardless of which
program is compiled, and it catches shapes a type cannot see
(`writeTextFile` arriving through a Tauri plugin). Two gates, one
property, neither subsuming the other.

**WHAT WAS ALREADY CLOSED IN THE CARD, so triage does not re-open it.**
The sharper half of this finding — that nothing would notice
`app/tsconfig.json`'s include list being reverted to `["src", "test"]` —
was closed inside T-073 rather than filed, because a restoration nothing
holds is the very defect the card fixed. `crescendo-dom.test.tsx` now
pins the include list AND the declared surface of both ambient files.
The measurement that justified it: with the include line reverted, the
app suite runs **826 passed / 1 failed** and `npx tsc --noEmit` exits
**0** — the ONE failure is the new pin, and every other gate in the repo
is happy.

**What is left for triage.** Only the ruling: accept the asymmetry and
write the sentence into CONVENTIONS beside the other typecheck gotchas
(see `T-073-s3`, which proposes the neighbouring bullet), or decide the
test program deserves a mechanism of its own. This file recommends
accepting: the residual is reachable only by a command nothing runs.
