# State

Updated: 2026-08-18 by architect/integrator (T-056 merged),
codex/gpt-5 @fresh

## Just completed

**T-056 — the transcript stops re-rendering itself.** F-03, milestone 3,
size S, `touches: [app-interview]`. Built and self-verified under the S-task
path by `codex/gpt-5 @fresh`. Branch tip **`cde8c13`**; merge **`bac62d7`**.

The optimization holds BOTH histories T-056 now has. Live `GenesisTurn`
objects already preserved identity through `upsertTurn`; T-029's rehydrated
history did not, because `rehydrate` rebuilt every banked turn during render.
The merged code caches that projection by the immutable transcript payload
array's identity, memoises `PlannerTurn` on the turn object, and sends stage
state only to the current turn. A new turn still moves the former current
turn into history once, and changed text/status/activity/error/truncation or
callbacks still render.

The measurement was corrected before it became record. The same 21-update,
10k-character script ran with six completed live turns and with six
rehydrated turns, five warmups plus 30 measured StrictMode runs. Before, each
historical turn executed **42 times** in both cases; after, each executed
**zero**, while the current seventh stayed at 42. Summed React Profiler
`actualDuration` median moved **4.442→0.791 ms** live and **4.522→0.665 ms**
rehydrated. Temporary instrumentation and its file are absent from the merge.

The task fence held: three C-13 source files, three existing app tests and the
card. No new test file, no `agent-store.ts`, tools/e2e, shell, Rust or parser
task diff. The task's three changed test bodies were each poisoned red and
restored byte-identically.

## Integration truth

T-056 was cut from architect checkpoint **`59763f3`** and merged no-ff with a
clean preflight tree **`27bc9aff…`**. Its indexed TypeScript triggered graph
regeneration. The existing `interview-resume-dom.test.tsx` gained two direct
C-05→C-13 file edges (`interview-model.ts`, `interview-turns.tsx`), so the
dogfood relation moved **15→17** without a new file, component or finding.
The fixture was reconciled, then the graph regenerated again as required.

Merged-main gates:

- parser build/types/full suite: **225/225**;
- app typecheck/build/full suite: **822/822**;
- Rust, rerun alone: **325 passed + 3 intentional ignores**;
- E2E: **82/82**, one worker, retries zero;
- token lint: **117 files**, selftest **49 samples + 14 policy checks**;
- boot gate: scratch port **17671**, both startup lines, exit 0;
- audit: **0 vulnerabilities / unchanged 17 allowed warnings**;
- graph current: **115 files / 970 symbols / 1484 edges**, `index --check`
  exit 0.

The first Rust run overlapped Playwright and boot and produced twelve watcher
timeouts. It was not hidden: the exact unmodified suite reran alone and all
325 tests passed. T-056 changes no Rust or watcher file; this is scheduling
evidence for future integrators, not a product failure.

## In progress / broken right now

**T-066** is independently APPROVED at **`0e925dd`** after executor tip
`13b3f22`. It caps the parse-error details list at the existing `max-h-48`
token and gives it vertical auto overflow. The verifier reproduced the old
1376px page / 30px board at all three viewports, then measured page==viewport,
details 1220/190 and board clients 524/384/284 after the fix. Integration and
graph regeneration are next.

**T-055** executor tip **`d5509cd`** is under fresh verification. Its parser
suite is 234/234 and all 127 live task section objects were byte-identical.
The build found a real ambiguity in T-055's own prose: a bare tilde-fence
marker inside a list is live CommonMark. Architect ruling wrapped the literal
as inline code, kept top-level unclosed-fence behavior, made inline spans
physical-line-local, and explicitly left Markdown container semantics out.

No other task is building. T-056's worktree remains only until this checkpoint
is committed, then is removed with its branch retained.

## Next up

1. Commit this T-056 checkpoint and remove its clean worktree.
2. Integrate approved T-066 from the checkpoint, run full merged-main gates,
   regenerate graph/fixtures, rewrite this snapshot, remove its worktree.
3. If T-055 is approved, integrate it next. It is `lib-parser` only and does
   not collide with T-056 or T-066, but its live-tree smoke must be re-derived
   against the newest checkpoint.
4. Triage T-062-s4 and T-063-s2. Once T-066 releases shell/e2e, corrected
   T-057 and T-058 can run concurrently. Corrected T-043 overlaps shell and
   waits for that wave boundary.
5. Run the human-owned authenticated genesis below.

## Human-owned evidence and decisions

- **Real genesis run:** authenticate the supported CLI, then perform one
  timed end-to-end genesis on a toy idea, target <=30 minutes, with light and
  dark completion screenshots. No planner turn has succeeded against a real
  model on this machine.
- **Relaunch the desktop app.** A long-running process may predate T-051,
  T-063, T-062, T-060 and this wave.
- **Visual judgment:** decide whether the bounded shell and its internal
  board/map/error scrollbars feel right in both schemes.
- **Stray real-smoke directories:** the pre-existing
  `nputer-t025-realsmoke-*` directories remain a human delete-or-keep choice.
- **Repository remote:** there is still no remote. CI has never run on a real
  runner.

Milestone 3's implementation list is complete, but the milestone is not
claimed until the real timed genesis exists. Test safety and render efficiency
do not prove an interview with a model that can misunderstand the user.

## Health of the tree

At this checkpoint main contains T-056 merge `bac62d7` plus the pending
checkpoint changes. Parser, app, isolated Rust, E2E, token lint, audit, boot
and graph-currentness gates are green. Security movement for T-056 is zero:
no dependency, manifest, lockfile, IPC command, grant, environment allowlist,
real CLI or model movement.

## Open questions

- Should map wheel input pan, natively scroll, or choose one by axis?
- What gate owns event names spelled independently across Rust and TypeScript?
- Does the shared main worktree need a formal rule for what reaches a human's
  running app before a relaunch?
- Should the T-043 exit observer own a richer child handle, or coordinate with
  the worker that alone owns `Child`, to reap early without abandoning a
  resistant same-group descendant?
