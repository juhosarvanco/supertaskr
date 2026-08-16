---
title: The front-door and genesis served-bundle probes belong in T-020's lane — and need a DEV-only shell harness first
status: suggested
suggested_by: verifier claude-opus-5 @T-026
---

Two deferred probes are now the same item, and they have a home.

- T-026's Verification line calls for a "served-bundle probe of the two
  front-door states"; the executor deferred it (headless session, port
  1420 owned by the human's live app) and offered
  `app/test/genesis-entry.test.tsx` — the real App, real store, real
  parser, only the IPC boundary mocked — as the substitute. Ruled an
  acceptable, honestly-recorded deferral at T-026's verdict.
- T-024-s1 records the same gap for the genesis lens: its served-bundle
  probe "could not exist until T-026 mounts the pane". T-026 has now
  mounted it (`GenesisScreen`'s `data-testid="genesis-pane-slot"`).

T-020 merged after T-026's branch point and is precisely the missing
machine: `tools/e2e`, Playwright, its own vite on 14520 with a config
that THROWS if the port is 1420, `reuseExistingServer: false`, fresh
page per test, fixtures applied through `window.__nputerDocsHarness`.
One lane addition discharges both probes.

**The blocker to name up front, because it is not free.** The dev
harness is snapshot-only:

    window.__nputerDocsHarness = { apply, getState }   // watcher-store.ts

`apply` is `applyDocsPayload`, which in a browser bundle always lands on
phase `"open"` — the board. There is no way from a served bundle to
reach `noProject`, `noDocs` with a probe, a `rejectedPick`, or
`genesis`, because those states are only ever produced by
`applyProjectStatus` / `reducePickOutcome`, both of which are behind the
Tauri branch. **The two front-door states T-026's Verification line names
are unreachable in a served bundle today** — so the deferral was not only
honest, it was over-determined: a browser would not have been enough.

Suggested shape (app-shell territory, small, DEV-only by the same
construction the docs harness already uses):

    window.__nputerShellHarness = {
      applyProjectStatus,        // noProject | noDocs(+probe) | open
      applyPickOutcome,          // cancelled | busy | noDocs | error
                                 // | picked | genesis
      getShell,
    };

...guarded exactly like `__nputerDocsHarness` (non-Tauri only), then
three specs in `tools/e2e`: the two-button front door, the "No plan in
&lt;folder&gt;" card with measured ○/✓ marks, and the genesis screen
full-bleed with T-024's lens in the slot. That is real-bundle, real-CSS,
real-layout coverage of the exact states jsdom cannot assemble — and it
also gives T-022's recents rows and T-027's split view a way in without
each inventing one.

Scope note: the harness is a test surface on the shell's own state, not
new IPC — no Tauri command, no new grant, nothing reachable from the
packaged app (the same `isTauri` gate that already fences
`__nputerDocsHarness`). Worth an explicit look at that gate during the
task, since it is the whole security argument.
