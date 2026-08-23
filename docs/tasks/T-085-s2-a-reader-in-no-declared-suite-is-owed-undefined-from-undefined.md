---
id: T-085-s2
title: A docs reader that sits in no declared suite is owed the literal command "undefined from undefined/" — loud, zero live instances, and newly reachable because of T-085
status: parked
suggested_by: verifier claude-opus-5 @T-085-verify, confirmed by executor claude-opus-5 @T-085-fix
---

`suiteFor()` in `tools/e2e/scripts/docs-scan.mjs` answers `undefined`
for any corpus file outside the four entries of `SUITES`
(`app/src-tauri`, `app`, `lib/parser`, `tools/e2e`). `docsReaders()`
stores that answer verbatim — `suite: suite?.dir, command: suite?.command`
— and `docsGate()` formats each owed suite as
`` `${r.command} from ${r.suite}/` ``, with no guard. So a reader in no
declared package is owed, at exit 1, the literal string:

    undefined from undefined/

**Reproduced here purely, without planting anything in the tree**, by
calling the two exported functions directly at branch tip `a3f2d89`:
`suiteFor("docs/design/claudedesign_handoff/x.js")` is `undefined`, and
`docsGate(["docs/tasks/T-001-x.md"], [thatReader])` returns
`fires: true` with `commands: ["undefined from undefined/"]`. The
verifier reached the same string the other way, by planting
`join("docs","tasks")` in a real `docs/design/…/x.js` and running the
gate over the tree; both halves agree.

**T-085 is what made it reachable, and that is stated rather than
implied.** The `a15b78e` scanner does not admit the same file over the
identical tree (the verifier ran both scanners to check). `JS_CWD_SITE`
— the no-base arm this card adds, whose implicit base is the package
directory — is what turns a bare `join("docs","tasks")` into a site.

**IT IS THE LOUD DIRECTION AND HAS ZERO LIVE INSTANCES.** An integrator
reading `Run: undefined from undefined/` at exit 1 stops; nobody merges
on it. The one suite-less corpus file today,
`docs/design/claudedesign_handoff/support.js`, contains no docs-shaped
path call, so the census is NIL. The verifier also checked the
second-order hazard: `undefined` does enter
`suitesOwedForAllOfDocs()`, but `unaccountedRootAnchors()` and
`ROOT_ANCHOR_LEDGER` stayed EQUAL, because every root-anchored file
sits in a declared suite.

## Why it was NOT fixed inside T-085

The fence (`touches: [tools/e2e]`) covers the file — both scripts are
under `tools/e2e/`. The obstacle is not the fence, it is that **no
one-line fix is provably safe, and the two candidate fixes are a design
choice this card's criteria do not make.**

- **Skip readers with no suite** is one line, and IT IS TWO DIFFERENT
  FIXES WITH OPPOSITE COSTS — this bullet used to conflate them and
  cost both as the worse one. **CORRECTED BY THE VERIFIER
  (`claude-opus-5 @T-085-verify-2`) AND RE-DERIVED FROM THE SOURCE BY
  T-085's INTEGRATOR**, because the next executor reads this file and
  not the verdict.
  - *Guarding the `byPath` template* (filtering the reader out of
    `commands`) is NOT silence. `docsGate()` computes
    `fires: byPath.some((e) => e.readers.length > 0)` — from `readers`,
    never from `commands` — and `owed.push(r)` runs BEFORE the
    `if (r.command !== undefined)` line, so the suite-less reader stays
    in `readers`. The gate therefore still **FIRES at exit 1** with the
    reader file still named on its per-path line
    (`docs-gate.mjs` prints `${entry.path} <- ${entry.readers}` for
    every entry with a non-empty `readers`), and only the `Run:` list
    loses that member. That is WEAKER than the loud garbage, not
    silence, and it must be costed as such rather than as the T-084
    shape.
  - *Dropping the reader from `owed`* IS the silent one, and it is the
    only arm that earns the original warning: an empty `readers` flips
    `fires` to false and the whole notice disappears. A reader that
    genuinely reads `docs/` would then be owed nothing at all, which is
    the exact failure T-084 built this gate to remove.
- **Name them explicitly as unrunnable** keeps the loudness, but it
  changes what `docsGate()`'s `commands` array CONTAINS — today every
  member is a runnable command string, and `tools/e2e/tests/
  docs-input-gate.spec.ts` asserts on those strings. Mixing a
  non-command sentence into that list is a contract change with a
  reader, not a clause.
- **A third option nobody has costed**: declare a suite for the rest of
  the tree, so `suiteFor()` is TOTAL. That is a `SUITES` edit plus an
  answer to "what command runs for a file under `docs/`", and it would
  change the gate's answer on real diffs.

## One datum for whoever takes it

`docsGate()` already contains the guard, wired to a dead value. It
declares a local `const commands = new Set()` and fills it under
`if (r.command !== undefined)` — and that Set is never read: the
returned `commands` is recomputed from `byPath.flatMap((e) => e.commands)`,
which is the unguarded template. The intent was there and the wiring
dropped it, so the fix is smaller than it looks — but it still has to
choose which of the three shapes above it means.

**PARKED at the seventh triage (2026-08-24).** Unpark at the first corpus file outside the four SUITES entries containing a docs-shaped path call. Zero live instances; the failure is loud, not silent; three candidate fixes with opposite costs and no ruling. Note for whoever opens it: the dead `const commands = new Set()` at docs-scan.mjs:2248 is real and sweepable by T-090.
