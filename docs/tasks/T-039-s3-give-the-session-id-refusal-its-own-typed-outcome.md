---
id: T-039-s3
title: Give the session-id refusal its own typed outcome when T-029 touches both sides of the wire
status: suggested
suggested_by: executor claude-opus-5 @T-039
---

T-039's two refusals are typed, but they ride existing arms rather than
their own:

- capture-side → `TurnError::MalformedStream { why }` (T-025-s6 proposed
  exactly this, and the `why` string names the rejection);
- registry-read side → `StartOutcome::Error { message }`.

Both are correct and both are slightly blunt. `MalformedStream` says
"the stream was not what the protocol needs", which is true but files an
attempted argv injection next to a truncated line; `Error { message }`
is the enum's catch-all, so the webview cannot tell "your runtime file
holds an unusable id — delete it" from "the registry could not be
written" without reading English.

The reason they were not given their own variants inside T-039 is
mechanical, not aesthetic: `app/src/lib/agent-store.ts` mirrors every
Rust variant by hand (`TurnErrorPayload`, `StartOutcomePayload`), and
T-039's fence is `app/src-tauri/src/agent/**`. A Rust variant with no
mirror is drift; a mirror is outside the fence. Better to leave one
honest string than half a type.

**Do it in T-029**, which touches both sides anyway (it renders the
resume choice and the hand-driven fallback). Shape:

    // Rust
    StartOutcome::SessionIdRejected { registry_path: String, why: String }
    TurnError::RejectedSessionId { why: String }

    // agent-store.ts
    | { kind: "sessionIdRejected"; registryPath: string; why: string }
    | { kind: "rejectedSessionId"; why: string }

with the store's reducer routing the first to a "your saved session is
unusable — start fresh" affordance rather than a generic error toast.
The rejection reason strings already exist and are already escaped
(`SessionIdRejection`'s `Display`); only the envelope changes.
