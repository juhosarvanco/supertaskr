# ADR-011: file: dependency for app → parser; no root workspace yet

Date: 2026-08-14 · Status: accepted · Decided in: T-003 build,
recorded at integration (rationale in
docs/tasks/T-003-watcher-live-reload.md, flagged there as
ADR-territory rather than decided)

## Context
T-003 created the first inter-package dependency: app/ (C-05)
consumes lib/parser (C-06) in the webview. ARCHITECTURE had
anticipated "no root workspace until a task needs one (T-003 wires
app → parser)" — the obvious reading being that T-003 would
introduce that workspace. Meanwhile CONVENTIONS documents each
package's suite as verbatim per-package commands (`npm ci` run from
lib/parser/ and from app/), and every builder/verifier session runs
them exactly as written.

## Options considered
Root npm workspace — rejected for now: npm does not walk UP from a
workspace member directory, so `npm ci` run inside lib/parser/ or
app/ — the CONVENTIONS-verbatim commands — would have silently
broken, forcing a repo-wide install-story migration inside an
unrelated watcher task. Publishing the parser to a registry —
rejected: absurd overhead at two local packages. `file:../lib/parser`
dependency — chosen: npm symlinks it, the lockfile records the link,
and both packages' documented commands keep working verbatim.

## Decision
app/ depends on `"@nputer/parser": "file:../lib/parser"`. Each
package keeps its own package.json, lockfile, and node_modules; no
root workspace. Accepted, documented cost: build ORDER — the
parser's `npm ci` + `npm run build` must run before app/ installs or
builds (missing dist/ fails with a clear TS2307), and vite needs
`server.fs.allow` for the symlink's real path. The webview imports
only the parser's browser-safe `./pure` subpath; the root entry
stays node-only.

## Consequences
Fresh clones and future CI build parser-then-app (order recorded in
CONVENTIONS Build & test). Revisit when a THIRD package appears or
CI wants a single install — a root workspace becomes the right move
at that point, but the migration must update CONVENTIONS'
per-package commands in the same change, because they break silently
otherwise (the exact trap that made file: the right call here).

## Addendum
The decision above stands unamended; this section records the
revisit its own Consequences called for.

Addendum (2026-08-16, T-020): the third package arrived — tools/e2e,
the real-input E2E lane. Revisit outcome: still no root workspace.
The trigger's substance was dependency wiring; tools/e2e imports
neither package (it drives the app over HTTP + the dev harness), so
a workspace would buy a shared install for three disjoint trees at
the cost of migrating every CONVENTIONS-verbatim command — the trap
this ADR names. CI installs per-package in CONVENTIONS order.
Revisit again when a package must IMPORT another beyond the existing
file: edge, or CI install time becomes the constraint.
