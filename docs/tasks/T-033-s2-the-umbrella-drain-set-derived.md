---
id: T-033-s2
title: The umbrella drain set, derived — and the card's premise about C-05 to C-13 and C-05 to C-14 is refuted at both rows
status: suggested
suggested_by: executor claude-opus-5 @T-033
---

T-033's criterion 1 wants the umbrella D1 findings drained *"registry
edits, dogfood fixture deltas, and graph regen in ONE change"*. Two of
those three are outside `touches: [docs/architecture/components/,
lib-parser, app-map]`: the fixture deltas live in `app/test/**`, which is
C-05's `app-shell` slug, held LIVE by T-123 at `338a7e2`, and the regen
is the integrator's at the checkpoint. So the drain was NOT built, and
this file carries the exact derived set so whoever holds the fence after
the ruling can apply it without re-deriving it — the `T-010-s2` shape.

## THE CARD'S PREMISE IS FALSE AT BOTH ROWS IT NAMES

The card says C-05→C-13 and C-05→C-14 are *"both created by C-05's
`app/test/**` umbrella reaching a child component's module"* and asks for
one ruling covering both. **Neither row is a pure test-umbrella row any
more**, derived from `arch drift --root ../..` at `25a9e2c`:

- **D1:C-05→C-13, 17 file edges — 5 of them are SOURCE**, not test:
  `app/src/App.tsx → app/src/genesis/interview-source.ts`, and
  `app/src/components/shell/GenesisScreen.tsx` → `BoardCrescendo.tsx`,
  `GenesisPane.tsx`, `InterviewChat.tsx` and `crescendo.ts`. T-027/T-028
  built the split view after that triage note was written.
- **D1:C-05→C-14, 8 file edges — 2 of them are Rust SOURCE**:
  `app/src-tauri/src/churn.rs → app/src-tauri/src/agent/runner.rs`
  (T-013's shared resolved-path gate) and `app/src-tauri/src/lib.rs →
  app/src-tauri/src/agent/mod.rs` (T-025's command registration). Both
  became visible when T-010 taught the walk `.rs`.

**Consequence for the ruling: the third option — "write down why umbrella
TEST edges do not count" — cannot drain either row.** Strip every
`app/test/**` edge from both and each still stands as a D1 on its source
edges alone. That option now drains exactly two rows, D1:C-05→C-06 (13
edges, all `app/test/*` → `lib/parser`) and D1:C-05→C-09 (3 edges, all
`app/test/*`), and thins two others. It is still a legitimate ruling —
it is just a much smaller one than the card believed.

## THE FULL LIVE SET AT `25a9e2c`, CLASSIFIED

14 findings: **11 D1 + 3 D3**; `undeclared=11`, `unmapped=0`,
`declared_only=3`, `ambiguous=0`, `dangling=0`; 34 relation rows tallying
**14 confirmed / 11 undeclared / 9 planned**; `drift_components=7`.

| finding | edges | class |
|---|---|---|
| D1:C-05→C-06 | 13 | test umbrella, PURE |
| D1:C-05→C-09 | 3 | test umbrella, PURE |
| D1:C-05→C-13 | 17 | MIXED — 5 source, 12 test |
| D1:C-05→C-14 | 8 | MIXED — 2 Rust source, 6 test |
| D1:C-05→C-07 | 1 | source only (`index_cmd.rs` → the crate's `lib.rs`) — this is `T-010-s4` |
| D1:C-08→C-05 | 4 | shared primitive (`lib/utils.ts` ×3, `lib/verdicts.ts`) |
| D1:C-09→C-05 | 2 | shared primitive (`utils.ts`, `verdicts.ts`) |
| D1:C-13→C-05 | 3 | shared primitive (`components/ui/button.tsx` ×3) |
| D1:C-13→C-06 | 1 | ordinary undeclared dependency |
| D1:C-13→C-08 | 1 | ordinary undeclared dependency |
| D1:C-13→C-14 | 5 | ordinary undeclared dependency |
| D3:C-01, D3:C-11 | — | non-code — see `T-033-s3` |
| D3:C-15 | — | honest not-yet-built, NOT permanent amber |

`T-008-s2` predicted only the first two shared-primitive rows; the live
set is three, and C-13→C-05 arrived with the genesis pane.

## THE MAXIMAL-DRAIN ARM, MEASURED RATHER THAN PREDICTED

Applied in a detached scratch worktree at `344a0d5` and read with the
lane's own binary via `arch drift --root <drill>` — four `depends_on`
lines, nothing else:

    C-05  [C-01, C-08, C-10, C-11, C-12]
       -> [C-01, C-06, C-07, C-08, C-09, C-10, C-11, C-12, C-13, C-14]
    C-08  [C-06, C-09, C-11]        -> [C-05, C-06, C-09, C-11]
    C-09  [C-06, C-08, C-11]        -> [C-05, C-06, C-08, C-11]
    C-13  [C-10, C-11]              -> [C-05, C-06, C-08, C-10, C-11, C-14]

Result, against the same committed graph (no regen needed — a
`depends_on` edit moves no indexed file):

- **findings 14 → 3**, `undeclared` **11 → 0**, `drift_components`
  **7 → 3**. The three survivors are D3:C-01, D3:C-11, D3:C-15.
- relation table stays **34 rows**; tally **14/11/9 → 25 confirmed /
  0 undeclared / 9 planned**.
- **THE DECLARED CYCLES ARE REAL AND NOTHING OBJECTS TO THEM.** C-05↔C-08,
  C-05↔C-09 and C-05↔C-13 all become declared two-way edges. `npx vitest
  run` from `lib/parser` is **264/264 at exit 0** with them live — the
  parser reports no cycle issue for `depends_on`, and `smoke.test.ts`'s
  zero-issues body stays green. T-008-s2's worry that declaring "would
  also close a C-05→C-08→C-09→C-05 declared cycle" is therefore a
  MODELLING objection, not a toolchain one: nothing in this repository
  will tell you about it, which is arguably the stronger reason to decide
  it deliberately.
- **THE WHOLE RECONCILIATION BURDEN IS IN `app/test/**`.** Under the
  drain, `npx vitest run test/architecture-dogfood.test.ts` reds **4 of
  10 bodies** — *THE FINDINGS*, *the full relation table*, *the T-009
  package.path seam*, *drift flags land on the right nodes* — while the
  whole `lib/parser` suite stays green. That matches the dogfood's own
  note that a `depends_on` edit moves that file only, and it means the
  drain needs a fence of `[docs/architecture/components/, app-shell]`
  at minimum, plus `app-map` if `map-dogfood-render.test.tsx`'s drift
  chips move (they will: C-05's chip reads `drift 5` today).

## SUGGESTED

Rule decision (1) (see `T-033-s1` — it was never recorded), then dispatch
the drain on a fence that holds `app/test/**`, at a moment when T-123 is
not holding it. If the ruling is accept-and-record instead, the same
table above is the record to paste into C-05's, C-08's, C-09's and
C-13's prose, and no fixture moves at all.
