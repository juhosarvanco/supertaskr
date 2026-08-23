---
id: T-101-s2
title: denialLine lets a blank toolName through because it tests for null rather than for emptiness
status: suggested
suggested_by: verifier claude-opus-5 @T-101-verify
---

`denialLine` in `app/src/genesis/interview-model.ts` opens with

    const tool = denial.toolName ?? "a tool";

`??` catches `null` and `undefined` and nothing else, so a `toolName` of
`""` or `"   "` reaches the template and the row renders
`refused:  — <message>` with the tool name silently missing. The
neighbouring `message` branch does NOT have this hole — it uses
`.trim()` then `length === 0`, which is why the whitespace-only message
case renders correctly.

**Unreachable today, which is the only reason this is not blocking.**
The single producer is `denial_field` in
`app/src-tauri/src/agent/runner.rs`:

    .map(str::trim).filter(|s| !s.is_empty())

so an empty or whitespace-only `tool_name` is normalized to `None` at
the Rust boundary before it can become a `GenesisDenial`. Verified
against the runner's own fixtures (`runner.rs` ~2701, ~2706).

**Why it is still worth closing.** The function's own doc comment says
*"EVERY FIELD MAY BE MISSING AND NONE OF THEM MAY PRINT AS ONE"*, and an
empty string is a missing tool name by every meaning the comment
intends. The invariant that saves it lives in a different language, in a
different fence, three layers away, and nothing on the TypeScript side
records the dependency — `GenesisDenial.toolName` is typed
`string | null`, which permits `""`. A one-character change (`||` for
`??`) makes the renderer independent of the boundary's behaviour, and a
degenerate row with `toolName: ""` pins it.

The same class, same function, even less reachable: a message consisting
only of U+200B survives `.trim()` (the zero-width space is not
ECMAScript `WhiteSpace`) and renders a blank reason. Measured, not
theorized — `refused: WebFetch — <U+200B>`, 21 characters. Fold it into
the same fix if the fix touches the blank test at all.
