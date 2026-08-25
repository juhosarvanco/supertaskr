---
id: T-102-s4
title: The Activity label is the one stream-borne string that reaches the webview through no bound in the runner at all, and T-102's new caps rule says otherwise
status: suggested
suggested_by: verifier claude-opus-5 @T-102-verify
---

**T-102 wrote a rule for every byte bound in `runner.rs` and headed it
with a universal. The universal is false, and the counterexample is the
very block type T-102 just made load-bearing.**

Measured at `935a78d` in a fresh detached worktree, read from the source
rather than from a comment.

## The sentence

`app/src-tauri/src/agent/runner.rs`, the caps block header added by
T-102:

> Every stream-borne string in this module reaches the app through
> `bounded_stream_string`, which is
> `docs_watch::sanitize_for_log(sessions::truncate_utf8(raw, N))`

`T-102-s2` repeats it in the same words.

## What the tree says

`bounded_stream_string` has exactly **three** production call sites, all
on the denial path — `denial_field` (tool name, `MAX_DENIAL_BYTES` 128),
the `permission_denied` line's message (`MAX_DENIAL_MESSAGE_BYTES` 768),
and one more denial field at the same bound. A fourth string,
`AuthFailed`'s message, travels the identical composition written out
inline at the construction site with `MAX_AUTH_MESSAGE_BYTES`. **Those
four are the whole of it.** Three stream-borne strings falsify the
sentence, and they fall into two classes the new LIVE / ADVISORY scheme
has no name for:

| string | byte bound in this module | `sanitize_for_log` | ceiling that actually applies |
|---|---|---|---|
| `RunEvent::Activity { label }` | **none** | **none** | `MAX_LINE_BYTES`, **1 MiB** |
| `RunEvent::TextDelta { text }` | `cap_text` → `MAX_EVENT_TEXT` 32 KiB | none | 32 KiB |
| `TurnError::ToolDenied { terminal_reason }` | none | yes | the cap alone, 800 chars |

`terminal_reason` is the "no bound here, the other file's cap is the only
one" class. `TextDelta` is the "bounded here by a DIFFERENT helper" class.

## THE ONE WORTH A CARD IS THE `Activity` LABEL

`Emitter::activity` takes the label straight from `classify_line` and
puts it on the wire:

    pub fn activity(&self, turn: u32, label: String) {
        (self.sink)(RunEvent::Activity { seq: self.next(), turn, label });
    }

No byte truncation, **and no control-character stripping**. The label is
`content_block.name` (or `message.content[].name`) off a `tool_use`
block, defaulting to `"tool"`. Nothing between `classify_line` and the
webview caps it.

**THE ASYMMETRY IS THE ARGUMENT, BECAUSE IT IS THE SAME FIELD.** A
`tool_use` block's `name`, read on the DENIAL path, is
`bounded_stream_string(_, MAX_DENIAL_BYTES)` — 128 bytes and control
bytes escaped. The same field, read on the ACTIVITY path, is neither.
One module, one JSON field, two treatments, and only one of them is
written down.

## WHY IT IS NEWLY RELEVANT RATHER THAN MERELY OLD

The path predates T-102 and this is **not a regression** — the verifier
confirmed `emitter.activity` is byte-unchanged across the diff and did
not charge it to that lane. What changed is that `StreamLine::Activity`
now has a SECOND consumer: it sets `evidence_after_auth_status`, so a
`tool_use` block is load-bearing for whether a user is told their login
failed. A block type that decides an auth affordance deserves the same
bound as a block type that names a refused tool.

## Three dispositions, none free

1. **Bound and strip it like its twin** —
   `emitter.activity(req.turn, bounded_stream_string(&label, MAX_DENIAL_BYTES))`.
   Cheapest, and it makes the caps-block universal true for this string.
   Costs one thing worth naming: `last_activity.as_deref() != Some(label)`
   dedupes on the label, so bounding must happen once, before the compare,
   or two labels differing past byte 128 collapse into one.
2. **Correct the sentence only** — narrow it to *every stream-borne
   string THIS BLOCK BOUNDS*, and add the third class to the scheme so
   `terminal_reason` has a name. Honest, cheap, and leaves the 1 MiB
   label live.
3. **Both**, which is the shape the `CLOSED AT TWO` lesson argues for: a
   universal in prose is what nothing can check, so the repair that lasts
   is the one that makes a test able to say it.

## The pin, if 1 or 3 is taken

A body driving a `tool_use` whose `name` is 200 bytes of mixed control
characters, asserting the emitted `Activity` label is 128 bytes with the
controls escaped — and the DEDUPE case beside it, two labels identical
for 128 bytes and different after, asserting **two** events. The second
is what makes disposition 1 safe rather than merely tidy, and no fixture
in `fake_agent.rs` drives either shape today.
