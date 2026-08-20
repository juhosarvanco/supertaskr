---
id: T-084-s5
title: The disposition ruling landed in CONVENTIONS because a method version bump needs a Rust file — TASK-FORMAT.md should carry it
status: suggested
suggested_by: executor claude-opus-5 @T-084
---

T-084 answered the vocabulary question its card raised: **"resolved by
other work" is not a fourth triage move and `closed` is not a ninth
status** — it is a DISPOSITION, disposition belongs to triage, and a
discharged finding keeps `status: suggested` with the discharge recorded
in its own body until triage promotes, parks or rejects it.

That ruling is now enforced in code — `DISPOSITION_RULING` in
`tools/e2e/scripts/docs-scan.mjs`, printed at the point of failure and
pinned by `tools/e2e/tests/docs-input-gate.spec.ts` — and written in
`docs/CONVENTIONS.md`'s suggestion-triage bullet, which is the bullet
that already enumerates the three moves.

**It is NOT in `method/tasks/TASK-FORMAT.md`, which is where the
encoding is ratified**, and that is a fence consequence rather than a
judgement: `touches: [docs/CONVENTIONS.md, tools/e2e]` cannot reach
`method/`, and CONVENTIONS' first gotcha makes a `method/` format change
a version bump whose third file is Rust —
`METHOD_SNAPSHOT_VERSION` in `app/src-tauri/src/agent/kit.rs`, asserted
against this repo's own CONVENTIONS on every `cargo test` (T-078-s3).

**Two readings, and triage should pick one.** Either the ruling is a
CLARIFICATION of the existing three moves, in which case it belongs in
TASK-FORMAT.md as prose and needs no version bump at all; or it is a new
normative sentence, in which case it is v0.1.6 and carries the Rust
const and the CONVENTIONS stamp with it. The first looks right — nothing
about the three moves changed — but it is triage's call, not an
executor's.
