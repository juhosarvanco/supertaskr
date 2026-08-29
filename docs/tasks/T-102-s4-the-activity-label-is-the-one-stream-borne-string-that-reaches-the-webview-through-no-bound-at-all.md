---
id: T-102-s4
title: The runner's caps block heads itself with a universal that three of its own strings falsify — and the one that decides an auth affordance reaches the webview through no bound at all
feature: F-03
milestone: 4
priority: 15
size: M
status: planned
blocked_by: []
touches: [app-agent, app-shell]
suggested_by: verifier claude-opus-5 @T-102-verify
builder:
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-107-s5 (Amnesty triage 2026-08-29 (triage seat)) — the identical shape on a second field: found is read under MAX_LINE_BYTES (1 MiB) and rendered into the DOM with no display bound, and the card names error.message and cliNotFound.probed reaching the same screen the same way. It states the general form this card's criteria adopt — bound what is READ and, separately, bound what is SHOWN, with MODEL_MAX_LEN as the precedent that puts the display cap Rust-side.

Absorbs: T-102-s2 (Amnesty triage 2026-08-29 (triage seat)) — same block, and the classification this card's criteria now rule on: the LIVE bounds are the ones below the cap and they truncate in silence, MAX_DENIAL_MESSAGE_BYTES cuts the CLI's own refusal sentence mid-word with no marker, and the obvious repair to MAX_AUTH_MESSAGE_BYTES removes a disclosure a person reads.

Absorbs: T-102-s1 (Amnesty triage 2026-08-29 (triage seat)) — same block, same cap: MAX_ECHO_LOG_CHARS is private to docs_watch, so the caps rule can be measured through sanitize_for_log's behaviour and never asserted by name. One token (pub(crate)) plus the fence that reaches docs_watch.rs, which is why it could not be taken from inside [app-agent].

**PROMOTED at the amnesty triage, 2026-08-29, as the owner of the
runner's bounds class.** Four findings from three seats describe one
block of code, and they only make sense together: the caps block states
a universal, the universal is false, the string that falsifies it most
loudly is the one that now decides whether a user learns their login
failed, the bound that DOES bite truncates in silence, and the cap all
of it is ordered against is private to another module so the rule can be
measured but never named.

Absorbs: T-102-s1, T-102-s2, T-107-s5 (see the corroboration lines
below).

`RunEvent::Activity { label }` takes `content_block.name` off a
`tool_use` block and puts it on the wire with **no byte truncation and no
control-character stripping** — ceiling 1 MiB. The SAME JSON field, read
on the denial path, is `bounded_stream_string(_, MAX_DENIAL_BYTES)`: 128
bytes, control bytes escaped. One module, one field, two treatments, and
only one of them is written down. `T-107-s5` finds the identical shape on
`found` (the CLI's `--version` line, read under a 1 MiB cap and rendered
into the DOM with no display bound), and names two more paths — 
`error.message` and `cliNotFound.probed` — reaching the same screen the
same way. **The display boundary is the thing that is missing, and this
repository already has the precedent for it: `MODEL_MAX_LEN` drops an
over-long value with a log line rather than rendering it.**

## Acceptance criteria

- THE caps block's heading sentence SHALL be true of the strings it
  governs, or SHALL be narrowed to the strings it bounds — and the
  classes it currently has no name for (bounded by a DIFFERENT helper;
  bounded only by the other module's cap) SHALL be named.
- WHEN a stream-borne string reaches the webview THE bound it travels
  under SHALL be derivable from this module — `Activity`'s label
  included. IF bounding the label is taken THEN it SHALL happen once,
  BEFORE the `last_activity` compare, or two labels differing past byte
  128 collapse into one.
- THE display boundary SHALL be stated once for the family rather than
  per field, since `found`, `error.message` and `cliNotFound.probed`
  reach the same screen through it; the READ cap stays where it is.
- WHERE a bound truncates, the card SHALL rule what discloses and what
  does not — the measured asymmetry is that a bound BELOW
  `MAX_ECHO_LOG_CHARS` cuts silently and a bound above it inherits
  `…(truncated)`. `MAX_DENIAL_MESSAGE_BYTES` (768) is the live silent
  one, and what it cuts is the CLI's own sentence explaining a refusal.
  The rule proposed and not yet ruled: a NAME truncates silently, a
  SENTENCE truncates visibly.
- `MAX_AUTH_MESSAGE_BYTES` SHALL NOT be lowered under the cap merely to
  make its doc comment true — T-102 measured that this makes the
  constant honest and removes the disclosure in the same edit, on the
  one string a person reads when their login is refused.
- `MAX_ECHO_LOG_CHARS` SHALL become nameable from `runner.rs`
  (`pub(crate)`), and the behavioural derivation that stands in for the
  comparison today SHALL be kept beside the named one rather than
  replaced by it — it measures the composition, so it survives
  `sanitize_for_log` changing HOW it caps.
- THE pins SHALL include the dedupe case: two `tool_use` names identical
  for 128 bytes and different after SHALL emit TWO events. No fixture in
  `fake_agent.rs` drives that shape today.

## The record, kept verbatim

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

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
