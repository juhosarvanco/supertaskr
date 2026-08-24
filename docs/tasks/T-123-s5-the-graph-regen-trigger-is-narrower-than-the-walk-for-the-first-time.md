---
id: T-123-s5
title: GRAPH REGEN's suffix trigger stops covering the walk the moment T-010 lands — a Rust-only diff moves the graph and the gate says NOT OWED
status: suggested
suggested_by: executor claude-opus-5 @T-123-rebuild
---

**This refutes the closing note of `T-010-s1`, and it is measured rather
than argued.** That note says:

> the GRAPH REGEN bullet cites this row … and its argument is unaffected
> … so the trigger is still deliberately wider than the walk. What
> changes is only which extensions the walk admits.

The first half is right about the direction it checks and silent about
the direction that matters. **"Wider than the walk" was a claim about
INCLUSION** — the trigger matches `tools/**/*.ts`, which `.nputerignore`
excludes, so the gate over-fires and over-firing is safe. It was never a
claim that the trigger's suffix list is a SUPERSET of the extensions the
walk admits. Until T-010 those two happened to coincide, because
`Lang::Rust` mapped to no extension. **They no longer do.**

CONVENTIONS' GRAPH REGEN bullet fires on

> `*.ts/*.tsx/*.js/*.jsx` outside docs/

and `IndexOptions::default().languages` is now `[Ts, Js, Rust]`. So `.rs`
is INDEXED and UNTRIGGERED. The bullet's own safety argument —
*"over-firing is the SAFE direction"* — is now false in the other
direction for one extension.

**MEASURED, on this lane, at the merged tree.** T-123's rebuild is a
three-file Rust diff (`docs_watch.rs`, `agent/mod.rs`,
`agent/sessions.rs`) plus five markdown files. Derived through the
prescribed pre-merge form against main `d64c673` (T-010's merge), then
`git archive`d to a scratch directory and indexed with the MERGED tree's
own indexer:

| tree | fresh index |
|---|---|
| main `d64c673` alone | 890866 bytes · 172 files · **1874** symbols · **1842** edges |
| main + this lane (`git merge-tree` tree `60bf4ce9…`) | 892093 bytes · 172 files · **1878** symbols · **1843** edges |

**Delta from three `.rs` files: +1227 bytes, +4 symbols, +1 edge, +0
files.** The trigger fires on **0 of this lane's 8 paths**.

(Both trees also report the committed graph STALE at 126 files / 1126
symbols. **That staleness is T-010's own and not this lane's** — GRAPH
REGEN puts the regen at the CHECKPOINT, and T-010's checkpoint has not
landed. The delta above is the honest measure of this lane's
contribution, taken as the difference between two FRESH indexes so the
outstanding regen cancels out of both sides.)

**WHY IT IS NOT URGENT TONIGHT AND IS URGENT SOON.** T-010's checkpoint
must regenerate anyway, and a regen taken after this lane merges absorbs
this delta for free. The exposure opens at the FIRST Rust-only lane that
merges *after* that checkpoint: its integrator derives GRAPH REGEN as NOT
OWED from the suffix table, skips the regen, and leaves the committed
graph stale with nothing red. The tripwires CONVENTIONS lists for the
retired hand-run do not catch it either — `index --check` is a written CI
step on a repository with **zero remotes**, so nothing executes it but a
human who decided to ask.

**WHAT SAVES IT MEANWHILE, AND WHY THAT IS NOT ENOUGH.** The same bullet
says **"ASK THE GATE INSTEAD OF PREDICTING"**, and an integrator who asks
gets the right answer in a second. But the trigger table is what tells
them whether they are *obliged* to ask; a gate row reading "NOT OWED — 0
of 8" is exactly the sentence that ends the enquiry. This lane asked only
because the dispatch brief explicitly told it to (*"a Rust-only change
does NOT match … but T-010's Rust extraction is in verification tonight
and may land before you, so ASK"*) — a brief-level instruction is not a
convention, and the next lane will not have it.

**THE FIX IS ONE CHARACTER CLASS**, and it belongs with `T-010-s1`'s
one-row edit because both live in the same neighbourhood of the same
file:

    at any merge whose diff touches `*.ts/*.tsx/*.js/*.jsx/*.rs` outside docs/

and the bullet's "wider than the walk" paragraph should say which
direction it means, so the next language the indexer learns produces a
review question instead of a silent gap. **Do not narrow the wording to
chase the walk** — the bullet's own warning against restating
`.nputerignore` still stands; this is the opposite move, keeping the
suffix list a superset of the extensions `Lang::for_extension` admits.

**Fence: `[docs/CONVENTIONS.md]`.** Outside T-123's
`touches: [app-shell, app-agent]`, so it is routed rather than made.
Related: `T-010-s1` (the FOUR WALKS row, same bullet's cited source, and
the note this finding corrects) and `T-010-s2` (the regen's fixture
reconciliation, which already anticipates that *"T-110 and T-123 may land
Rust of their own first"* — this file supplies T-123's actual figure).
