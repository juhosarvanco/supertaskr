---
id: T-041
title: Shell harness — the served bundle can reach every front-door state
feature: F-03
milestone: 3
priority: 5
size: M
status: building
blocked_by: []
touches: [app-shell, tools/e2e/]
builder: claude-opus-5
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-024-s1, T-026-s7. Triage 2026-08-16: the two deferred
served-bundle probes are ONE item with ONE blocker, and three planned
tasks are already writing cheques against it. T-024's Verification line
owed a "served-bundle probe rendering the dry-run fixture" that could
not exist (nothing mounted the pane); T-037 mounted it
(`data-testid="genesis-pane-slot"`, GenesisScreen.tsx:63), so that half
is now merely missing. T-026's Verification line owed a "served-bundle
probe of the two front-door states" and its verifier found the deeper
reason it was deferred: `window.__nputerDocsHarness` exposes only
`{ apply, getState }` (watcher-store.ts:458), and `apply` is
`applyDocsPayload`, which in a browser bundle always lands on phase
"open". `noProject`, `noDocs`+probe, `rejectedPick` and `genesis` are
produced ONLY by `applyProjectStatus`/`reducePickOutcome`, both behind
the Tauri branch — so those states are UNREACHABLE from a served
bundle today. The deferral was over-determined: a browser would not
have been enough.

Land before T-027. T-027, T-028 and T-029 each name a served-bundle
probe in their Verification lines and none of them can write one until
this exists. Serialize app-shell with T-042 and T-022 at dispatch.

## Acceptance criteria
- THE app SHALL expose a DEV-only `window.__nputerShellHarness`
  ({ applyProjectStatus, applyPickOutcome, getShell }) behind exactly
  the `!isTauri && import.meta.env.DEV` gate that already fences
  `__nputerDocsHarness` — a test surface over the shell's own state,
  never new IPC: no Tauri command, no new grant, nothing reachable
  from the packaged app. A test SHALL assert the Tauri path never
  defines it (that gate is the whole security argument and SHALL be
  looked at explicitly, not inherited).
- WHEN the lane drives the harness THE served bundle SHALL reach every
  shell phase the shipped app can reach — noProject, noDocs with a
  probe, rejectedPick, genesis, open — and `getShell` SHALL report the
  phase so a spec asserts on the phase rather than on a selector that
  could pass on a different screen.
- THE lane SHALL carry three tools/e2e specs against the real bundle
  and real CSS: the two-button front door; the "No plan in <folder>"
  card with its ○/✓ marks measured from the probe; and the genesis
  screen rendering T-024's lens with the `streak` fixture inside
  `genesis-pane-slot` — the probe T-024 could not write.
- THE lane SHALL run on its own vite on `NPUTER_E2E_PORT` (default
  14520) with `reuseExistingServer: false`; setting it to 1420 already
  throws at config load and that guard SHALL stay — no spec starts or
  contacts a server it does not own.
- THE existing suites SHALL be unchanged: app vitest, the 17 existing
  lane specs, and `npm run lint:tokens` all green; zero new tokens.

Verification: headless — `npx playwright test` from tools/e2e/, one
worker, retries 0, no skips, its own vite; plus the app suite. @human:
none — the visual judgments on these screens stay on the open session's
list; this task proves assembly, not taste.

## Implementation notes

## Verdicts
