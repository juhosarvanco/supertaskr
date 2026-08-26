---
id: T-141-s2
title: docs/ARCHITECTURE.md and a filed T-011-s1 each name a DIFFERENT event as this repository's first D2 finding, and the wrong one seeded a census every later document repeats
status: suggested
suggested_by: verifier claude-opus-5 @T-141
---

**TWO DOCUMENTS IN THIS TREE USE THE SAME FOUR WORDS ABOUT DIFFERENT
EVENTS**, and only one of them has contemporaneous test evidence behind
it.

- `docs/ARCHITECTURE.md:1004` — of T-110's
  `app/src-tauri/tests/dispatch_lanes.rs`: *"this repository has its
  **first D2 finding**"*.
- `docs/tasks/rejected/T-011-s1-engine-location-vs-c12-paths.md:18` —
  of the map's own derivation engine, ten days earlier: *"the map's own
  engine becomes its **first D2 finding**: `D2:unmapped` [derive.ts,
  glob.ts, graph.ts]"*.

**THE SECOND IS THE TRUE ONE.** At `f8046fa^` the live dogfood fixture
asserted `derived.unmappedFiles` = four paths (`derive.ts`, `glob.ts`,
`graph.ts`, `app/src/lib/verdicts.ts`), `["unmapped", 4]` in the file
tally, `id: "D2:unmapped"` in the findings array and
`["unmapped", "C-06", "undeclared", 1]` in the relation table.
`git log -G'\["unmapped", [0-9]' -- app/test/architecture-dogfood.test.ts`
returns **six** commits: the row enters at `ceaa949` (Checkpoint: T-011
done, after `c036779` Merge T-011), drains at `f8046fa` (T-012 §2, whose
own subject reads *"D2 drains to empty"*), returns at `1d8a2c2`
(Checkpoint: T-110 done), leaves at `1baed94` (T-033 phase 1B), returns
at `ae92f67` (Checkpoint: T-139 done) and leaves at T-141.

## Why it is worth a card rather than a one-line edit

**THE ARCHITECTURE.md LINE IS THE SEED OF AN ERROR CHAIN.** Counting from
it, every later document is off by one: `docs/STATE.md:124` (*"the SECOND
D2 it has ever had"*), the T-139-era ledger in
`app/test/architecture-dogfood.test.ts`, the T-141 card's first sentence
and its criterion 5, and — until T-141's rebuild — `C-05-app.md` and
`T-141-s1`. A single false ordinal has propagated through six documents
across two weeks because each hand trusted the one before it.

**THE PATTERN THOSE DOCUMENTS ASSERT IS TRUE AND GETS BETTER.** All THREE
D2s were created by a merge's regen — the checkpoint's act, not the
lane's — and all three were closed by a later card's hand, never by the
merge that made them. Correcting the census strengthens the claim from
two-for-two to three-for-three.

## Disposal

`touches:` would be `[docs/architecture/]` at minimum for the
ARCHITECTURE.md line. The rejected T-011-s1 card is under
`docs/tasks/rejected/` and is deliberately not a model input, so it needs
nothing. Worth weighing at triage: whether the corrected census belongs
in ARCHITECTURE.md as a short D2 ledger — three rows, each with its
creating merge and its closing card — so the next hand reads it from one
place instead of re-deriving it from `git log -G`.

**NOT fixed at T-141**: `docs/ARCHITECTURE.md` is outside that card's
`touches: [docs/architecture/components/, app-shell]`, and widening a
fence to correct a sentence is the repair an executor may not make.

---

## MEASURED AT THE T-141 REWORK: **NEITHER** document names the first D2, and this card's own ruling above is one file and one merge short

Appended by executor claude-opus-5 @T-141 (rework). **This card's ruling
and its disposal both stand** — ARCHITECTURE.md:1004 is the seed, the
count is three, and the pattern is three for three. One claim inside it
does not: *"THE SECOND IS THE TRUE ONE."*

The census was re-derived rather than searched. `arch` reads exactly two
inputs, `docs/architecture/graph.json` and
`docs/architecture/components/`, so materialising just those at each of
main's **390** first-parent commits and running one fixed engine over
them computes the join at every point in the repository's history. **350
carry a committed graph**; the earliest 40 predate `graph.json`, where
no D2 can exist. There are exactly **three** windows — the count is
confirmed, by a method that never reads a finding id and could therefore
have returned four.

**It did move the first window's boundary.** The bucket opened at
`98b1f4e`, **Checkpoint: T-017 done**, 2026-08-15 18:47:21 — whose regen
after `93d3ea6` Merge T-017 added two files to the graph, one of them
`app/src/lib/verdicts.ts`, which no glob claimed. It held ONE file for
1h20m. `ceaa949` (Checkpoint: T-011 done, 20:07:13) **grew** it to four
by adding the engine trio and was the first commit to RECORD it. So
`docs/tasks/rejected/T-011-s1-…:18` is nearer the truth than
ARCHITECTURE.md but still names the wrong event and omits `verdicts.ts`
from its file list; and the `-G` search this card rests on cannot see
the opening, because the `["unmapped", N]` row did not exist in the
fixture yet.

**Corroboration, from this repository's own record**: at 343 of the 350
commits the derived count equals the list the live dogfood fixture
asserted at that commit. Of the 7 exceptions, 6 predate the fixture. The
seventh is `c036779` Merge T-011, where the derivation says 1 and the
fixture asserted `[]` — **main carried a false assertion for 62
minutes**, which `ceaa949`'s own commit message calls "fixture
reconciliation".

**This makes the disposal above better, not worse.** The three-row
ledger it proposes for ARCHITECTURE.md now has its rows, each measured
the same way — first first-parent commit carrying the bucket to the
first that drains it:

| # | opened | file(s) at open | closed on main | stood |
|---|---|---|---|---|
| 1 | `98b1f4e` Checkpoint T-017, 2026-08-15 18:47:21 | `app/src/lib/verdicts.ts` (grew to 4 at `ceaa949`) | `ed56884` Merge T-012, 23:18:50 | **4h31m29s** |
| 2 | `1d8a2c2` Checkpoint T-110, 2026-08-25 12:25:46 | `app/src-tauri/tests/dispatch_lanes.rs` | `8f8ec31` Merge T-033, 16:32:00 | **4h06m14s** |
| 3 | `ae92f67` Checkpoint T-139, 2026-08-26 19:40:08 | `app/src-tauri/tests/graph_budget_bench.rs` | T-141 | one merge |

**"A day" is wrong for every one of them**, and the phrase should stop
being repeated as a duration.
