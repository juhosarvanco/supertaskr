---
id: T-073-s3
title: CONVENTIONS should carry the gotcha that ambient module declarations are program-global — a card specified an impossible option because it is not written down
status: suggested
suggested_by: executor claude-opus-5 @T-073
---

A knowledge gap that cost a measurement to close, and that will cost the
next session the same measurement unless it is written down.

**What happened.** T-073's first acceptance criterion offered two ways
to move T-028's node writes out of `app/src`'s reach: "a second ambient
file included only by a test-scoped tsconfig, **or** a `declare module`
block inside the one test that needs it". The second is not a way. It
was tried on the real tree before any design was chosen — write block
deleted from `app/test/node-builtins.d.ts` and written instead as a
`declare module "node:fs"` block at the bottom of
`app/test/crescendo-dom.test.tsx`, nowhere else — and the probe under
`app/src` importing `mkdirSync`/`writeFileSync` **still compiled at exit
0**. Ambient module declarations MERGE PROGRAM-WIDE; a `declare module`
block does not belong to the file that writes it. Only a program
boundary scopes an ambient declaration.

**The second half of the same measurement**, worth the same line: a file
with top-level imports or exports can only AUGMENT an ambient module,
never create one. The matching `declare module "node:os"` block in the
test failed with **TS2664** — "Invalid module name in augmentation,
module 'node:os' cannot be found" — because `node:os` had just been
removed from the ambient file. So the two halves of the card's option
fail differently: `node:fs` succeeded and leaked, `node:os` refused
outright.

**Why this is a CONVENTIONS bullet and not just a task note.** This repo
already keeps hard-won compiler and runtime facts in `## Gotchas` —
the Tauri v2 CSP-at-serve-time bullet, the ACL-grants-compile-to-code
bullet, the pointerdown-not-click bullet. Each exists because a session
lost time to a plausible wrong belief. This is the same shape: "put the
declaration next to the code that needs it" is exactly what a careful
engineer would try first, it produces no error, and the resulting guard
is silently vacuous. The proposed bullet, roughly:

> AMBIENT MODULE DECLARATIONS ARE PROGRAM-GLOBAL (T-073). A
> `declare module "node:fs"` block scopes to the PROGRAM, never to the
> file that writes it — putting it inside the one test that needs the
> writes declares them for `app/src` too, with no diagnostic. The only
> way to give tests a wider node surface than the frontend is a second
> tsconfig: `app/tsconfig.json` includes `["src",
> "test/node-builtins.d.ts"]` (reads only) and `app/tsconfig.test.json`
> adds `test/` (and with it `test/node-builtins-write.d.ts`).
> `npm run build` runs BOTH — `tsc && tsc -p tsconfig.test.json && vite
> build` — so narrowing the first program costs no test coverage.
> A file with top-level imports/exports can only AUGMENT an ambient
> module, never create one (TS2664).

**The wider lesson, offered without an ordinal.** This is the second
recorded instance of a CARD specifying something a faithful executor
would build wrong — T-057's was a criterion naming a positive the suite
already had, so the executor built a duplicate; this one is a criterion
naming a mechanism that cannot hold the property, so an executor who
took the offered shortcut would ship a guard that passes its own probe
only if the probe is run against the wrong program. Both are cheap to
catch the same way: measure the premise before building on it. Whether
that belongs in the taxonomy of test-body shapes or somewhere else is
triage's call — it is a property of CARDS, not of test bodies, so it may
want its own place entirely.
