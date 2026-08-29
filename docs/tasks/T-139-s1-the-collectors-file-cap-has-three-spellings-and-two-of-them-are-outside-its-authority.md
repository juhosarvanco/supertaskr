---
id: T-139-s1
title: The collector's per-file cap has THREE spellings and only one of them is the authority — raising it in docs_watch.rs leaves the pane warning about a cap that no longer exists
status: parked
suggested_by: executor claude-opus-5 @T-139
---

T-139's card names two limits in two files. **There are three spellings of
the OUTER one**, derived at `13c736e` with `git grep -n
"1_048_576\|1048576" -- ':!docs'`:

    app/src-tauri/src/docs_watch.rs:66   const MAX_FILE_BYTES: u64 = 1_048_576;   <- the authority
    app/src/architecture/MapView.tsx:61  const COLLECTOR_CAP_BYTES = 1_048_576;   <- a restatement
    app/test/architecture-store.test.ts:215                          1_048_576    <- a test literal

**THE SECOND ONE IS LOAD-BEARING AND IT IS IN A DIFFERENT COMPONENT.**
`MapView.tsx:112` reads it to decide whether the header hint says
`· over the snapshot cap` after a manual index. So raising
`MAX_FILE_BYTES` in `docs_watch.rs` alone leaves the pane telling the
user their graph is over a cap that was raised out from under it, and
*lowering* it leaves the pane silent about a graph that is now being
dropped. Neither direction reds anything: nothing joins the two.

**IT IS A `T-057` DUPLICATION AND IT SPANS A FENCE.** `docs_watch.rs` is
C-10 (`app-shell`); `MapView.tsx` is C-12 (`app-map`). T-139's fence is
`[crate-index, app-shell]`, so this could not be repaired from inside
that lane, and the pin T-139 *did* build
(`docs_watch::tests::the_emit_budget_stays_below_the_collectors_file_cap`)
deliberately joins the two RUST constants and says nothing about the TS
one.

**THE SHAPE OF THE REPAIR IS THE SAME ONE T-139 USED**: the app crate can
see both `MAX_FILE_BYTES` and `nputer_index::IndexOptions`, so a Rust
constant is already the authority for the pair. What is missing is a
route to TypeScript. Three options, cheapest first:

1. **A test, not a mechanism.** `app/test/` can already read
   `docs_watch.rs` as text; a body that greps the constant out of the
   Rust source and compares it to `COLLECTOR_CAP_BYTES` reds the day
   either moves. Cheap, ugly, and honest about being a tripwire rather
   than a single source.
2. **Ship the cap in the snapshot.** `DocsSnapshot` already crosses IPC
   every time the tree changes; a `maxFileBytes` field makes the pane's
   warning a function of the collector that produced the payload rather
   than of a number compiled into the webview months earlier. This is
   the only option that is still right when two versions disagree.
3. **Delete the pane's copy** and render the warning from the snapshot's
   `skipped` list instead, which already carries
   `SkipReason::Oversize` for exactly this file. The hint stops being a
   prediction and becomes a report.

**Fence: `[app-shell, app-map]`** for 1 and 3; option 2 additionally
touches the snapshot shape, which is `app-shell`'s.

Amnesty triage 2026-08-29 (triage seat): PARKED — a T-057 duplication that SPANS A FENCE, which is why it survived T-139: docs_watch.rs is C-10 (app-shell) and MapView.tsx is C-12 (app-map), and the pin T-139 did build deliberately joins the two RUST constants and says nothing about the TS one. Both directions of the divergence are user-visible — raising MAX_FILE_BYTES leaves the pane warning about a cap that was raised out from under it, lowering it leaves the pane silent about a graph now being dropped — and neither reds anything, because nothing joins the two. RESURFACES: the next dispatch holding app-map and app-shell together. Option 2 (ship maxFileBytes in the DocsSnapshot, which already crosses IPC on every change) is the one that makes the pane's warning a function of the collector that produced the payload rather than of a number compiled into the webview months earlier; option 1 is a tripwire and honest about being one.
