---
id: T-139-s2
title: The docs snapshot crosses IPC as JS SOURCE that the webview evals, not as a string it parses — and that shape is half of the stage T-139 measured as binding
status: parked
suggested_by: executor claude-opus-5 @T-139
---

Absorbs: T-139-s3 (Amnesty triage 2026-08-29 (triage seat)) — the same payload, the same measurement, and the same room: this card measures WHAT the delivery costs and that one measures WHAT BOUNDS IT, and the answer is nothing — MAX_FILE_BYTES x MAX_FILES is 2 GiB and no check anywhere sits on the product. It carries the figure that makes both cards concrete (372 files, 7 240 105 content bytes, graph.json 13.7% of it, exactly ONE collected file within 14% of the cap that governs all 372) and the shipped argument it already misleads — watcher-store.ts justifies an 8-second deadline with a 13x claim about a plausible tree while the bound is ~280x. Adding an aggregate cap is a new REFUSAL SURFACE and a design decision, which is precisely why it belongs in the room rather than in a lane.

**T-139 measured three stages and the IPC hop won: 2.374 ms of the
3.66 ms it costs to deliver the 989 181-byte `graph.json`, against
0.126 ms for the Rust-side read and 1.160 ms for `JSON.parse` plus
`parseGraph`.** The card predicted nobody knew which stage bound. Nobody
did, and the reason the winner wins is not its size.

**IT IS THE CHANNEL'S SHAPE.** Read at `13c736e` against tauri 2.11.5 in
`~/.cargo/registry`:

    event/mod.rs:130   EmitArgs::new -> payload: serde_json::to_string(payload)?
    event/mod.rs:194   emit_js_script -> format!("(function () {{ const fn = window['{}'];
                         fn && fn({{event: '{}', payload: {}}}, {ids}) }})()", … emit_args.payload …)
    webview/mod.rs:1975  self.eval(crate::event::emit_js_script(…))

So the serialized snapshot is spliced into a JS SOURCE STRING and handed
to `eval`. **The webview parses a megabyte-scale object literal with its
general JavaScript parser, not with the engine's JSON fast path.**
Measured on JavaScriptCore — the engine a macOS WKWebView actually runs,
via `/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc`,
with a DISTINCT source string per trial so the engine's source cache
cannot serve a cached parse:

    graph bytes   envelope bytes   eval (JSC)   JSON.parse of the same bytes
        989 181        1 099 576      1.76 ms                        0.92 ms
      1 998 275        2 203 801      3.70 ms                        1.92 ms
      7 996 914        8 807 860     14.54 ms                        7.38 ms

**Roughly HALF the webview's share of the hop is the channel rather than
the data**, at every size, linearly. A payload that crossed as a string
the listener parsed itself would give it back.

**THE REAL SNAPSHOT IS 7.5 MB, NOT 1 MB**, which is what makes this worth
a card rather than a footnote: `collect_docs_tree` over this repository
at `13c736e` returns 372 files and 7 240 105 content bytes, so the
`docs-changed` payload is 7 503 958 bytes and `graph.json` is 13.7% of
it. Interpolating the table above puts the whole snapshot's eval near
13–14 ms in JSC, of which roughly 6–7 ms is the shape.

**WHAT IS NOT CLAIMED HERE.** This is measured in a `jsc` shell and in
node, not inside a running WKWebView, so it is the ENGINE's cost and not
the app's wall clock — the real hop additionally pays a process boundary
and a main-thread hop this harness cannot see. It is also not a
correctness defect: nothing is wrong today, and 13 ms once per debounced
batch is not a user-visible stall. It is filed because the number is
non-obvious, because it is the stage a size limit would be set on, and
because the repair is a channel change nobody would think to look for
while reading `docs_watch.rs`.

**THE MEASUREMENT IS RE-RUNNABLE**: `node app/test/graph-budget-bench.mjs`
from the repository root prints the table above under both engines, and
its module doc explains every column. Whoever takes this should re-derive
at their own ref rather than quote these figures.

**Fence: `[app-shell]`** — `docs_watch.rs`'s emit site and
`watcher-store.ts`'s listener are both C-10. A change here is a change to
the shape of every event the app sends, so it wants a room before a lane.

Amnesty triage 2026-08-29 (triage seat): PARKED — docs/STATE.md already routes this card to a ROOM and that routing is right: the finding is measured to the microsecond and the DECISION is architectural. Tauri splices the serialized snapshot into a JS SOURCE STRING and hands it to eval, so the webview parses a megabyte-scale object literal with its general JavaScript parser rather than the engine's JSON fast path — measured on the engine a macOS WKWebView actually runs, with a distinct source string per trial, at roughly HALF the webview's share of the hop at every size, linearly. And the real snapshot is 7.5 MB rather than 1 MB, of which graph.json is 13.7%. The absorbed aggregate-cap finding is the same payload from the bounds side and wants the same ruling. RESURFACES: the room STATE says this card wants — it is the architect's to open, not a lane's, and both halves (the channel's shape, and whether the payload gets an aggregate bound at all) are refusal-surface decisions rather than mechanical ones.
