---
id: T-058-s1
title: The CONTROL corpus is 521 files, but only 13 of its 18 suffix classes are pinned — 109 files can leave the gate silently
status: suggested
suggested_by: verifier claude-opus-5 @T-058
---

T-058 ships the CONTROL corpus as a DENY list: `git ls-files -z`, minus
`SKIP_DIRS`, minus `CONTROL_BINARY_EXTENSIONS`. That is the right shape
and the header argues it well — an allowlist of text suffixes "would
silently omit the next first-party text format". Measured on the branch
tip, the deny list is exact: 539 tracked files, 18 binary assets
excluded, **521 in CONTROL, and zero tracked files under a skip
directory**.

The gap is one rung up. `CONTROL_BINARY_EXTENSIONS` is itself the
policy, and almost nothing pins it. The selftest's walk policy names
ten tracked text formats plus `AGENTS.md`, `lib/parser/src/index.ts`
and both lint implementation files; the Playwright spec adds
`lib/parser/src/index.ts` and a `docs/` non-emptiness check. Everything
else in the corpus is held only by the six root-non-emptiness rows,
which survive losing any one suffix as long as the root keeps a single
file of some other suffix.

Measured by removing each suffix class in turn and re-evaluating every
committed assertion (file pins + root non-emptiness):

| suffix | files | one line in CONTROL_BINARY_EXTENSIONS |
|---|---|---|
| `.md` | 248 | DETECTED (`docs/ROADMAP.md`) |
| `.ts` | 125 | DETECTED (`lib/parser/src/index.ts`) |
| **`.tsx`** | **46** | **SILENT** |
| **`.rs`** | **44** | **SILENT** |
| `.json` | 23 | DETECTED |
| **(no extension)** | **10** | **SILENT** |
| `.mjs` | 5 | DETECTED |
| `.html` | 3 | DETECTED |
| **`.js`** | **3** | **SILENT** |
| `.css` | 3 | DETECTED |
| `.toml` | 2 | DETECTED |
| **`.jsx`** | **2** | **SILENT** |
| **`.cts`** | **2** | **SILENT** |
| `.yml` | 1 | DETECTED |
| `.lock` | 1 | DETECTED |
| **`.mts`** | **1** | **SILENT** |
| **`.txt`** | **1** | **SILENT** |
| `.yaml` | 1 | DETECTED |

**Eight suffix classes, 109 of 521 files (20.9%), leave the gate with
nothing red.** Confirmed by execution, not only by analysis: adding
`".rs"` to `CONTROL_BINARY_EXTENSIONS` drops all 44 Rust files and
leaves `npm run lint:tokens -- --selftest` at exit 0 (49 + 2 samples,
37 walk-policy checks green), `npm run lint:tokens` at exit 0, and the
focused suite at 5 passed.

The two largest silent classes are exactly the ones the architect's
2026-08-18 ruling named out loud: "app/parser Rust and TypeScript".
`.rs` is 44 files and `.tsx` is 46 — the app's entire UI tree, which is
where nine of the thirteen historical reproductions landed.

The fix is small and matches the shape the module already uses for
TOKEN. `MUST_TOKEN_COVER` exists precisely because "a policy that
quietly drops a tree has to fail against something that did not move
with it". CONTROL has no such second list. A `MUST_CONTROL_COVER` of
suffix classes — or a check that every suffix present in `git ls-files`
minus the binary set is present in the corpus — would close it, and the
selftest already has the corpora in hand when it runs.

Not filed against the build: every criterion in T-058 is met and the
shipped corpus is correct today. This is about what stops it drifting.
