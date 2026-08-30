---
id: T-167-s3
title: This workspace now carries two content-hash implementations — nputer-index's blake3 and the agent module's hand-rolled SHA-256 — because the first is pub(crate) behind a dependency the app crate does not declare
feature: F-03
milestone: 4
priority: 3
size: S
status: suggested
suggested_by: executor claude-opus-5@subagent @T-167
blocked_by: []
touches: [crate-index, app-agent]
builder:
verifier:
built_by:
verified_by:
review:
---

**FILED BY T-167's LANE AS THE STANDING COST OF ITS OWN DECISION 2,
so the choice is visible to whoever wants to revisit it rather than
buried in one card's notes.** Nothing here is broken; this is a
duplication with a reason, and the reason may not survive the next
reader's judgement.

## The two implementations

- `app/src-tauri/crates/nputer-index/src/hash.rs` — `content_hash`,
  `"blake3:" + 64 hex`, over raw file bytes. `pub(crate)`.
- `app/src-tauri/src/agent/skills.rs` — `sha256_hex`,
  `"sha256:" + 64 hex`, over raw file bytes. Hand-rolled, ~60 lines of
  pure `std`.

They compute the same KIND of thing for the same KIND of reason (this
file's bytes, identified later) in one cargo workspace.

## Why the second one exists

T-167 needed a content hash inside `app-agent`. Reaching the first would
have needed one of:

- `blake3` as a direct dependency of the app crate — edits
  `app/src-tauri/Cargo.toml`, outside T-167's fence, and adds a package
  to a crate whose whole discipline is zero new crates;
- `nputer-index::hash::content_hash` made `pub` — edits
  `crates/nputer-index/`, outside T-167's fence, and widens a crate's
  public surface to serve one caller;

and `sha2` being present TRANSITIVELY under tauri (observed in this
lane's `cargo build` output) is not a usable dependency either. The
precedent for hand-rolling rather than depending is in the same module:
`sessions::iso8601_utc` exists because §9 said zero new crates and
`chrono` was the alternative.

The implementation is pinned by the published vectors —
`sha256_matches_the_published_vectors` in `agent/skills.rs` checks the
empty string, `abc`, the 56-byte and the 112-byte messages — so this is
not an unverified crypto reimplementation; a wrong SHA-256 fails the
first vector.

## What a fix would decide

1. **Is one hash worth a widened surface?** Making
   `nputer_index::hash::content_hash` `pub` and having the agent module
   call it costs one `pub` and removes ~60 lines plus a vector test. It
   also means `.nputer/sessions.json` stamps carry a `blake3:` prefix,
   which is arguably BETTER — the same prefix the graph uses, so one
   reader learns one spelling.
2. **Or is two the right answer?** The two live in crates with different
   dependency policies on purpose (ADR-015: the indexer has no tauri
   dependency; the app crate takes no new packages), and a shared helper
   couples them for the sake of a function neither is short of.

**IF THE ANSWER IS ONE, THE STAMPS ALREADY WRITTEN MOVE.** The hash is
recorded in `.nputer/sessions.json`, which is runtime state losable by
charter, so nothing has to be migrated — but the fix should say so out
loud rather than leave a reader wondering whether old stamps became
unreadable.

The fence needs both `crate-index` and `app-agent`, and adding a direct
`blake3` dependency would need `app/src-tauri/Cargo.toml` besides —
derive whether that path is in the fence before dispatching.
