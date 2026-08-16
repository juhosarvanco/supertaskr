---
id: T-014-s3
title: The committed graph on main is STALE — the interim regen ritual was missed at the T-050 merge
status: suggested
suggested_by: executor claude-opus-5 @T-014
---

**This is a live defect on `main`, not a future risk.** Found by the
first thing T-014's `--check` was ever pointed at.

At `main` = `5927adc` (T-050's merge), `docs/architecture/graph.json` is
sha256 `815412de…`, 385,451 bytes — byte-identical to the graph
`docs/STATE.md` records the **T-049** integrator writing, and the last
commit to touch the file is `b3bfe45` (the T-049 checkpoint). T-050's
merge carried `app/src/App.tsx` and `app/src/lib/watcher-store.ts`
rewrites plus two new suites, so the CONVENTIONS interim rule
("at any merge whose diff touches `*.ts/*.tsx/*.js/*.jsx` outside
docs/, regenerate the committed graph") fired and was not run.

Both instruments agree, and they were run against each other in all
four states:

| tree | `nputer-index index --check` | `self_graph_is_current` (ignored) |
|---|---|---|
| main @ 5927adc | **exit 1 STALE** | **exit 101 FAILED** |
| a `git archive HEAD` copy, freshly indexed | exit 0 CURRENT | ok |
| that copy + one planted `.ts` | **exit 1 STALE**, names the file | **exit 101 FAILED** |
| that copy re-indexed | exit 0 CURRENT | ok |

The delta the gate prints (verbatim, and this is the whole point of the
failure tail): files **92 → 94** — adds `app/test/startup-recovery.test.ts`
and `app/test/startup-screen.test.tsx`, content-changed on
`app/src/App.tsx` (loc 487→623, symbols 6→8),
`app/src/lib/watcher-store.ts` (loc 659→841, symbols 40→45),
`app/test/shell-harness.test.ts` (loc 312→328) and
`app/test/watcher-store.test.ts` (loc 375→383); symbols 642 → 667;
edges 1038 → 1063 (+30 / −5); bytes 385,451 → 396,620.

**What the integrator must do**, and T-014 deliberately did not:
regenerate at the merge, per the rule that is still in force until the
CONVENTIONS retirement text in T-014's notes is applied. Note the
knock-on: the two new C-05 test files land under the `app/test/**`
umbrella, so `app/test/architecture-dogfood.test.ts`'s C-05 count moves
**42 → 44** and its file-count assertion **92 → 94**, and
`map-dogfood-render.test.tsx`'s `· 92 files` moves with it — derive the
rest from the added-file list before running anything, per the rule that
file already carries.

**The reason this is filed rather than just fixed**: it is the strongest
argument in the repo for T-014's own premise. Nineteen exercises of the
hand ritual are recorded in STATE; the twentieth was missed silently,
and nothing in the pipeline noticed until a program was pointed at it.
A gate that runs is worth more than a gate that is remembered.
