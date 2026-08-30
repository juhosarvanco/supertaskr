---
id: T-167-s1
title: method/runtime/sessions-schema.md names nine keys and a genesis that loads skill packs writes a tenth — the code says "field-for-field per" a document that does not name the field
feature: F-03
milestone: 4
priority: 2
size: S
status: suggested
suggested_by: executor claude-opus-5@subagent @T-167
blocked_by: []
touches: [method/runtime]
builder:
verifier:
built_by:
verified_by:
review:
---

**FOUND BY T-167's LANE WHILE BUILDING ITS OWN THIRD CRITERION, ROUTED
RATHER THAN FIXED: `method/` is outside `app-agent`, and the bump
question this raises belongs to triage BEFORE dispatch (CONVENTIONS,
"what a bump is owed for" — a lane cannot decide it from inside its own
fence).**

## What the two sides say

`app/src-tauri/src/agent/sessions.rs`'s module header:
*"Field-for-field per `method/runtime/sessions-schema.md`."* That
document's JSON example carries exactly nine keys — `id`, `agent`,
`model`, `native_session_id`, `created`, `turns`, `tasks`, `roles`,
`status` — and the pin
`the_written_registry_matches_the_sessions_schema_field_for_field` in the
same file asserts all nine are present and that there are no others.

T-167's third criterion asks the session record to stamp WHICH skill
packs shaped the session, by name and content hash. That landed as
`SessionEntry.skills`, so a genesis run in a project that carries
`.claude/skills/` writes a TENTH key the schema does not name.

## Why it is not a red today, and why that is not the end of it

The field is `#[serde(default, skip_serializing_if = "Vec::is_empty")]`,
so a genesis with no packs writes the same nine keys it always wrote and
that pin is green with its assertions untouched — which is also T-167's
own byte-identity criterion. **The gap is only visible on a project that
HAS packs**, and there is no mechanical reader that will ever say so: the
pin walks the keys the SCHEMA names and asks whether the entry has them,
never the other direction, and its "no extra keys" arm is exercised by a
packless fixture.

So the disagreement is silent by construction, which is the class
CONVENTIONS' "a comment that restates a measured figure is a second
implementation" bullet is about, one category over.

## What the fix has to decide

1. **The document** — add the `skills` key to the schema's example and
   say what it holds (an array of `{dir, name, description, triggers,
   relPath, hash}`, camelCase on disk, absent when no packs loaded).
   Derive the shape from `SkillPack` in
   `app/src-tauri/src/agent/skills.rs` rather than transcribing this
   card, which will go stale.
2. **Whether a method version bump is owed**, which is the part a lane
   must not decide. Against test 1 (SHIPPED BYTES):
   `sessions-schema.md` is NOT in `KIT_FILES` — derive with
   `git grep -h 'rel: "' app/src-tauri/src/agent/kit.rs` — so it fails
   the shipped test. Against test 2 (GRAMMAR): the trigger is "a field, a
   status, a normative table, a contract row" for what *a card, a room, a
   brief or a role* may say, and `sessions.json` is none of those — it is
   runtime state, losable by charter. **The honest reading is that NO
   bump is owed and this is an editorial repair to an unshipped method
   file, which rides the next bump** — but the sentence "adds a field to
   a schema" is close enough to the grammar test that the call should be
   made at triage and written down, not left for the next reader to
   re-derive.

If the answer is that a bump IS owed, note that a bump is a three-file
commit whose third file is Rust (`METHOD_SNAPSHOT_VERSION` in
`app/src-tauri/src/agent/kit.rs`) plus a fourth thing that is not a file
(the method-eval `--bump` block), so the fence has to reach all of them
— `[method/runtime]` alone cannot take it.

## The pin to add with the fix

Whatever is decided, the asymmetry above is worth closing: the pin should
also assert the entry's keys are a SUBSET of what the schema names, so
the next field added without the document reds instead of passing. A
fixture with one loaded pack is four lines in that test module —
`skills::SkillPack` is constructible by hand, and
`agent/skills.rs`'s own tests show the shape.
