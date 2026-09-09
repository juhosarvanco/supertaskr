---
id: T-280-s6
title: "A manifest that will not PARSE is read as a package with no dependencies, so a broken package.json silently drops a cross-package edge from the owed set"
feature: F-06
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "verifier claude-opus-5@subagent @T-280 phase 2 (fresh, after the fix pass), 2026-09-09, measured at 4d2d952 on the bench ../nputer-V-T-280"
blocked_by: [T-280]
touches: [tools/e2e/scripts/gate-run.mjs, tools/e2e/tests/gate-run.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

`packageDependents` reads each package root's `package.json` for
`file:` specifiers and catches every failure the same way:

    try { pkg = JSON.parse(readFileSync(...)); } catch { continue; }

Its comment states the case it was written for and that case is
correct: **"A MANIFEST THIS CANNOT READ CONTRIBUTES NO EDGE AND IS NOT
AN ERROR"** — `app/src-tauri` is a Cargo workspace with no
`package.json` at all, so the ENOENT arm is the normal path and must
stay. What the one catch cannot tell apart is ENOENT from a manifest
that EXISTS and will not parse, and the two deserve opposite answers:
absent means "this package declares no npm dependencies", unreadable
means "this derivation does not know what this package depends on".

Measured at the lane tip, same range both times, the range being a
single change under `lib/parser/`:

    manifests intact                  -> suites ["app", "parser"]
    app/package.json replaced with
    `{ this is not json`              -> suites ["parser"]

The parser-to-app edge — the one T-280's own criteria name, the reason
a parser change owes the app suite — vanishes without a word, and
`failClosed` stays empty, so nothing downstream can tell.

**NOT REACHABLE AT A PUSH TODAY, and the reason is worth writing down
rather than re-deriving.** Both routes to a broken manifest are already
closed by other arms:

- the corruption is IN the range, and then `app/package.json` places
  under the app root and the push owes app anyway (measured: the range
  containing the corruption still derives `["app", "parser"]`);
- the corruption is in the WORKING TREE, and then `writeToken` records
  `dirty: true` and `judgeToken` refuses the token as `token-unkeyed`
  (measured: a modified tracked manifest gives `dirty recorded: true`).

So this is a latent shrink rather than a live one — which is exactly the
kind that survives, because nothing fires while it is latent.

The fix is to split the catch: an ENOENT contributes no edge as it does
now, and any other failure lands the path on the derivation's
`unplaceable` list with the manifest named, so the owed set becomes the
whole battery and the token says why. The body is a discrimination over
a bare fixture tree of the shape the existing
`file:` dependency body already builds: a root with NO manifest owes
nothing extra (the control, which must keep passing), and a root whose
manifest is present and malformed makes the answer the whole battery.
