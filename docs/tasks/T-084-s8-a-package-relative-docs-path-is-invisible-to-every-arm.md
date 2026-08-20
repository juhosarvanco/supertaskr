---
id: T-084-s8
title: A docs path expressed relative to a PACKAGE directory reads this repo's docs/ and is invisible to the site scan, the tripwire and the root-anchor account
status: suggested
suggested_by: verifier claude-opus-5 @T-084-verify2
---

`ROOT_ANCHOR_LEDGER`'s doc comment in `tools/e2e/scripts/docs-scan.mjs`
states the premise the whole account rests on:

> A file that holds this repository's root is the only kind of file that
> CAN read this repository's docs/.

**That is a universal and it is false.** Planted at `fda5c92` and
measured:

    app/test/zz-falsifier-a.test.ts
      const TASKS = resolve("../docs/tasks");   // from app/, this IS <root>/docs/tasks
      export const count = readdirSync(TASKS).length;

    app/test/zz-falsifier-b.test.ts
      const TASKS = path.join(process.cwd(), "..", "docs", "tasks");

    rootAnchoredFiles()      -> 24, unchanged: NEITHER is anchored
    docsReaders()            -> 11, unchanged: neither is derived
    unlinkedFiles()          -> [], neither reported
    unaccountedRootAnchors() -> 6, unchanged

Both read this repository's `docs/tasks` off the live tree and escape
every arm in silence — which is the one outcome this card exists to
remove.

**The cause is an interaction between the two halves of the site rule.**
The first half requires the first LITERAL segment to be `docs`, which is
what correctly keeps `tools/e2e/fixtures/shell.ts` out. But
`resolve('<rel>')` against the PACKAGE DIRECTORY is already one of
`ROOT_FORMS` — `evalBase` evaluates it — so the scanner understands the
base perfectly well and discards the site only because the literal opens
with `..` rather than with `docs`.

**It is absent from the tree today, and one character from an idiom that
is not.** `resolve("../` and `resolve('../` return zero hits across all
first-party source, so the ledger's 24 and its residual 6 are correct at
this ref. But the package-dir form is established here —
`resolve("dist/assets")`, `resolve("test/fixtures/genesis")`,
`resolve("src-tauri/tauri.conf.json")` appear nine times across five
files in `app/test` alone. A sixth that reaches for `../docs/tasks` is
an ordinary thing for someone to write.

**Two arms, and the first is free.**

1. **Correct the sentence.** The mechanism supports a bound over files
   that NAME the root, not over files that CAN read docs/. One clause,
   and it stops the account claiming more than it derives.
2. **Widen `docsSites` to resolve the literal before judging it.** A
   path-forming call whose base evaluates to a directory inside the
   repository and whose resolved path lands under `<root>/docs` is a
   site, whatever its first literal segment is. That subsumes the
   `docs`-first rule rather than replacing it: `shell.ts` still resolves
   to `app/test/fixtures/genesis/streak/docs`, which is NOT under
   `<root>/docs`, so it stays out for a better reason than its spelling.
   `files.test.ts` stays out unchanged, since its base is a fixtures
   directory. Wants both existing discriminator samples re-pinned against
   the new rule, plus a positive for the `..` form.

Arm 2 is the one that closes the silence; arm 1 is what should happen
regardless, because a false universal in the file that defines the
account is worse than a named limit.
