---
title: Single-source the collector byte cap — MapView duplicates MAX_FILE_BYTES
status: suggested
suggested_by: verifier claude-fable-5 @T-012
---

Two constants now encode the same 1 MiB truth:

- `app/src-tauri/src/docs_watch.rs`: `MAX_FILE_BYTES: u64 = 1_048_576`
  (the collector's per-file cap — an oversized graph.json silently
  leaves the snapshot).
- `app/src/architecture/MapView.tsx`: `COLLECTOR_CAP_BYTES = 1_048_576`
  (the header hint's "over the snapshot cap" comparison against
  `IndexOutcome.graph_bytes`).

They agree today (verified at T-012's verdict). If the Rust cap ever
moves — T-003-s2's snapshot-scale-guard territory is adjacent — the
frontend comparison drifts silently and the header's cheap-honesty line
("indexed … · over the snapshot cap") starts lying in whichever
direction the caps diverge. Nothing else breaks: rendering degrades
exactly as designed either way, so this is a truthfulness blemish, not
a defect.

Options, smallest first: (a) carry the cap in the IndexOutcome payload
(`capBytes`) so the frontend compares against the Rust-side truth it
already trusts for `graph_bytes`; (b) assert the pair's equality in a
cargo test that greps the TS constant (ugly but zero-runtime); (c) fold
into T-003-s2/T-003-s3 when skip-visibility lands, where the cap
becomes visible payload anyway. (a) is one field and one line each
side.
