# State

Updated: 2026-08-18 by integrator (T-066 merged and checkpointed),
codex/gpt-5 @fresh

## Just completed

**T-066 — the errors stay visible without taking the board.** F-02,
milestone 4, size M, `touches: [app-shell, tools/e2e]`. Built and
independently verified by `codex/gpt-5 @fresh`, `review: independent`.
Approved branch tip **`0e925dd`**; merge **`56a5d72`**.

The parse-error details list remains outside `board-scroll`, preserving the
existing rule that a short diagnostic stays visible while the board moves.
It now carries the existing `max-h-48` spacing utility and
`overflow-y-auto`: short lists keep natural height with no inner overflow;
long lists stop at a 192px border box and expose every remaining row through
their own scroll region. No diagnostic, count, skipped-file reason or
last-valid-state wording changed.

The hostile sixty-error state is now part of the every-screen E2E sweep. At
1280×840, 1024×700 and 800×600, respectively, page and bounded column equal
the viewport, `window.scrollY` stays zero, the details list measures
1220/190 (`scrollHeight/clientHeight`) inside the 192px box, and
`board-scroll` keeps client heights **524 / 384 / 284** over its 5695px
content. The final diagnostic, final board card, wordmark and pane rail all
remain reachable.

## Integration truth

T-066 and main shared base **`59763f3`**. Main-before was clean checkpoint
**`af20b53`** and the approved worktree was clean at **`0e925dd`**. The two
sides had **zero changed-file intersections**: T-056's twelve checkpoint
paths and T-066's four paths were disjoint. The merge-tree was clean, and
the no-ff merge **`56a5d72`** has exactly those two commits as parents.
T-056's transcript identity work and its graph fixtures therefore remain
unchanged.

The merge changed two indexed files: `app/src/App.tsx` and
`app/test/shell-frame.test.tsx`. Regeneration moved only their hashes,
line counts and `App` range. Graph totals stay **115 files / 970 symbols /
1484 edges**. The required architecture dogfood and rendered-map fixtures
passed **17/17 unchanged**: no file, component relation, finding, node or
edge count moved. The graph was regenerated again after reconciliation and
the currentness gate passed.

Merged-main gates:

- parser build/types/full suite: **225/225**;
- app typecheck/build/full suite: **822/822**;
- bare Rust: **325 passed + 3 intentional ignores**;
- E2E typecheck/full lane: **83/83**, one worker, retries zero, no skips;
- token lint: **117 files**, selftest **49 samples + 14 policy checks**;
- boot gate: scratch port **17677**, both startup lines, exit 0;
- audit: **0 vulnerabilities / unchanged 17 allowed warnings** over 472
  locked crates with the existing 1,216-advisory database;
- graph current: **115 / 970 / 1484**, `index --check` exit 0.

The Rust evidence needs its environment attached. Two sandboxed runs each
timed out in the same twelve native watcher tests. Outside the filesystem
sandbox all 117 library tests passed immediately; that diagnostic run had
set `NPUTER_NO_REAL_CLI=1`, so two integration tests correctly rejected the
set variable because their contract proves the guard holds while UNSET.
The final documented bare `cargo test`, outside the watcher sandbox and with
the variable unset, passed all 325 tests. The ignored real-CLI/model smoke
did not run; the test-binary and doctest guards passed.

Poison discipline is **3/3 red** on merged main: the unit token assertion
required nonexistent `max-h-47`, the pathological every-screen arm required
page height `viewport + 1`, and the geometry body required a 191px box.
Restoration matches the merge commit exactly:
`shell-frame.test.tsx` **`6f58482a…`** and `shell-frame.spec.ts`
**`34af2ed2…`**, with empty diffs.

## In progress / broken right now

**T-055** is independently APPROVED at **`0fe81ac`** after executor tip
**`d5509cd`**. Its parser suite is 234/234 and all 127 live task section
objects were byte-identical. The build found a real ambiguity in T-055's own
prose: a bare tilde-fence marker inside a list is live CommonMark. Architect
ruling wrapped the literal as inline code, kept top-level unclosed-fence
behavior, made inline spans physical-line-local, and explicitly left
Markdown container semantics out.

No other task is building. T-066's clean worktree has been removed; its
branch is retained at the approved tip.

## Next up

1. Integrate independently approved T-055 from this checkpoint and re-derive
   its live-tree smoke against the newest docs.
2. Triage T-062-s4 and T-063-s2. T-057 and T-058 can now run concurrently;
   corrected T-043 overlaps shell and waits for that wave boundary.
3. Run the human-owned authenticated genesis below.

## Human-owned evidence and decisions

- **Real genesis run:** authenticate the supported CLI, then perform one
  timed end-to-end genesis on a toy idea, target <=30 minutes, with light and
  dark completion screenshots. No planner turn has succeeded against a real
  model on this machine.
- **Relaunch the desktop app.** A long-running process may predate T-051,
  T-063, T-062, T-060, T-056 and T-066.
- **Visual judgment:** decide whether the bounded shell and its internal
  board/map/error scrollbars feel right in both schemes.
- **Stray real-smoke directories:** the pre-existing
  `nputer-t025-realsmoke-*` directories remain a human delete-or-keep choice.
- **Repository remote:** there is still no remote. CI has never run on a real
  runner.

Milestone 3's implementation list is complete, but the milestone is not
claimed until the real timed genesis exists. Layout containment, test safety
and render efficiency do not prove an interview with a model that can
misunderstand the user.

## Health of the tree

At this checkpoint main contains T-066 merge `56a5d72` plus the checkpoint
records and regenerated graph. Parser, app, Rust, E2E, token lint, audit,
boot and graph-currentness gates are green. Security movement for T-066 is
zero: no dependency, manifest, lockfile, IPC command, capability grant,
environment allowlist, parser, Rust, real CLI or model movement.

## Open questions

- Should map wheel input pan, natively scroll, or choose one by axis?
- What gate owns event names spelled independently across Rust and
  TypeScript?
- Does the shared main worktree need a formal rule for what reaches a
  human's running app before a relaunch?
- Should the T-043 exit observer own a richer child handle, or coordinate
  with the worker that alone owns `Child`, to reap early without abandoning
  a resistant same-group descendant?
