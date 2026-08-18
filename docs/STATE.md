# State

Updated: 2026-08-18 by integrator (T-055 merged and checkpointed),
codex/gpt-5 @fresh

## Just completed

**T-055 — one answer to "is this content?"** F-02, milestone 4, size M,
`touches: [lib-parser]`. Built and independently verified by
`codex/gpt-5.6 @fresh`, `review: independent`. Approved branch tip
**`0fe81ac`**; merge **`20c45d4`**.

C-06 now builds one position-preserving structural view before either
roadmap bullets or task section headings are recognized. Top-level backtick
and tilde fences, HTML comments (including CommonMark's abrupt empty forms),
and physical-line-local single-backtick spans are blanked without moving line
numbers or the original task section payloads. Comment-looking bytes inside
code stay inert; a genuine unclosed comment or fence runs through EOF.

The boundary is deliberately smaller than Markdown: indented code, other
HTML blocks, link definitions and container/list de-indentation remain named
non-goals. The implementation found and resolved its own live-corpus trap:
T-055's literal tilde marker is inline code, while T-020, T-030 and T-055 keep
their four real sections. All **127** live task section objects remained
byte-identical before and after the structural view.

## Integration truth

T-055 and main shared base **`59763f3`**. Main-before was clean checkpoint
**`b0dd4de`** and the approved worktree was clean at **`0fe81ac`**. Main had
17 changed paths from the base and T-055 had seven; their changed-file
intersection was empty. The read-only merge-tree was clean, and no-ff merge
**`20c45d4`** has exactly `b0dd4de` and `0fe81ac` as parents. T-056's
transcript-identity files and T-066's bounded-error files are byte-unchanged
across this merge.

The actual `b0dd4de..20c45d4` trigger set is six parser TypeScript files and
the task record. Graph regeneration therefore fires; boot does not, because
no `app/src/**`, `app/src-tauri/**` or manifest path moved. The two new indexed
files are `lib/parser/src/inert-spans.ts` and its test. Graph totals move
**115 / 970 / 1484 → 117 files / 982 symbols / 1502 edges**, and C-06's
mapped files move **23 → 25**. Every new non-package edge is C-06-internal:
the 32 component relations, ten findings, observed counts and drift flags are
unchanged. The live component registry did not move, so
`lib/parser/test/smoke.test.ts`'s exact component-ID pin remains unchanged.
The architecture dogfood and rendered-map fixtures pass **17/17**.

Merged-main gates:

- parser offline lockfile setup, build, types and full suite: **234/234**;
- app offline setup, typecheck/build and full suite: **822/822**;
- bare Rust with the real-CLI guard derived from the test process:
  **325 passed + 3 intentional ignores**;
- E2E typecheck and full lane: **83/83**, scratch port 17655, one worker,
  retries zero, no skips;
- token lint: **117 files**, selftest **49 samples + 14 policy checks**;
- audit, without fetching: **0 vulnerabilities / unchanged 17 allowed
  warnings** over 472 locked crates using the existing 1,216-advisory database;
- graph deterministic/current: repeat SHA-256 **`ee370494…`**,
  **568,598 bytes / 117 / 982 / 1502**, `index --check` exit 0;
- boot gate: **not triggered** by the main-before-to-merge diff.

The first E2E attempt stopped at the sandbox's localhost bind probe with
`EPERM`; it was rerun outside that boundary on scratch port 17655 and passed
83/83. No external network, real CLI or model call occurred. The ignored
real-CLI/model smoke did not run; the test-binary and doctest guards passed.

Poison discipline is **9/9 red** on merged main: four inert-span bodies, two
roadmap bodies and three task-section bodies failed in one run (**225 passed /
9 failed**). Restoration matches the approved merge exactly with empty diffs
and hashes `e65478b2…`, `7d265392…`, `6f128974…`; the restored suite passed
234/234.

## In progress / broken right now

No task is building. T-055's approved branch is retained.

## Next up

1. Triage T-062-s4 and T-063-s2.
2. Dispatch T-057 and T-058 concurrently from this checkpoint; corrected
   T-043 overlaps shell and waits for that wave boundary.
3. Run the human-owned authenticated genesis below.

## Human-owned evidence and decisions

- **Real genesis run:** authenticate the supported CLI, then perform one
  timed end-to-end genesis on a toy idea, target <=30 minutes, with light and
  dark completion screenshots. No planner turn has succeeded against a real
  model on this machine.
- **Relaunch the desktop app.** A long-running process may predate T-051,
  T-063, T-062, T-060, T-056, T-066 and T-055.
- **Visual judgment:** decide whether the bounded shell and its internal
  board/map/error scrollbars feel right in both schemes.
- **Stray real-smoke directories:** the pre-existing
  `nputer-t025-realsmoke-*` directories remain a human delete-or-keep choice.
- **Repository remote:** there is still no remote. CI has never run on a real
  runner.

Milestone 3's implementation list is complete, but the milestone is not
claimed until the real timed genesis exists. Parser structural truth, layout
containment, test safety and render efficiency do not prove an interview with
a model that can misunderstand the user.

## Health of the tree

At this checkpoint main contains T-055 merge `20c45d4` plus the checkpoint
records and regenerated graph. Parser, app, Rust, E2E, token lint, audit and
graph-currentness gates are green; the boot trigger is absent. Security
movement for T-055 is zero: no dependency, manifest, lockfile, IPC command,
capability grant, environment allowlist, filesystem write, network, Rust,
real CLI or model surface moved.

## Open questions

- Should map wheel input pan, natively scroll, or choose one by axis?
- What gate owns event names spelled independently across Rust and
  TypeScript?
- Does the shared main worktree need a formal rule for what reaches a
  human's running app before a relaunch?
- Should the T-043 exit observer own a richer child handle, or coordinate
  with the worker that alone owns `Child`, to reap early without abandoning
  a resistant same-group descendant?
