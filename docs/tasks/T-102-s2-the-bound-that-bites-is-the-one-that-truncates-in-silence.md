---
id: T-102-s2
title: The byte bound that actually bites is the one that truncates in silence, so making a bound honest costs the disclosure
status: suggested
suggested_by: executor claude-opus-5 @T-102
---

**`T-081-s4` said a byte bound above the log cap is a DEAD bound.
Measuring it for T-102 turned up the other half, which changes what
"fix it" means: the LIVE bounds are the ones that truncate WITHOUT
telling anyone.**

Every stream-borne string in `app/src-tauri/src/agent/runner.rs` travels
`bounded_stream_string`, which is
`docs_watch::sanitize_for_log(sessions::truncate_utf8(raw, N))`.

- `truncate_utf8` cuts at `N` **bytes** and appends nothing.
- `sanitize_for_log` cuts at `MAX_ECHO_LOG_CHARS` (**800** at `023ab3b`)
  **characters** and appends `…(truncated)`.

**So whichever cut happens first decides both the length AND whether the
user is told.** A bound BELOW the cap wins, and its truncation is
silent. A bound ABOVE the cap loses for ASCII, and the truncation it
inherits is marked.

Measured at `023ab3b`, through the real composition, in
`every_byte_bound_here_is_classified_against_the_log_cap_that_outranks_it`:

| constant | value | class | truncation |
|---|---|---|---|
| `MAX_DENIAL_BYTES` | 128 | LIVE | **silent** |
| `MAX_DENIAL_MESSAGE_BYTES` | 768 | LIVE | **silent** |
| `MAX_AUTH_MESSAGE_BYTES` | 2048 | advisory for ASCII | **marked** |

## Why this is a card and not a cleanup

`T-081-s4`'s natural repair — lower `MAX_AUTH_MESSAGE_BYTES` under the
cap so its doc comment's "hard stop" becomes true — **makes the constant
honest and takes the disclosure away in the same edit**. Today a
900-character CLI auth message reaches the user cut at 800 with
`…(truncated)` on the end; at `MAX_AUTH_MESSAGE_BYTES = 768` it would
reach them cut at 768 with nothing on the end. On the one string a
person reads when their login is refused, that is the wrong direction,
so T-102 corrected the COMMENT and left the constant at 2048, with the
reason recorded beside it.

**But that leaves the more interesting half unaddressed, and it is the
half nobody has looked at**: `MAX_DENIAL_MESSAGE_BYTES` (768) is a
deliberate choice to be the bound that bites, and what it bites is *the
CLI's own sentence explaining why it refused a tool* — a sentence a
person reads, cut mid-word, with no marker. The observed 2.1.226 maximum
is 419 bytes so nothing is cut today, which is exactly why this has
never been seen.

## Three dispositions, none free

1. **`truncate_utf8` gains an optional marker**, so a LIVE bound can
   disclose its own cut. Touches every caller — it is `pub` in
   `agent/sessions.rs` — so it wants a variant rather than a signature
   change.
2. **`bounded_stream_string` appends the marker itself** when
   `raw.len() > max`. One function, in `runner.rs`, inside `[app-agent]`
   — the cheapest — but it changes the BYTES of every bounded stream
   string, which several pins measure by exact length
   (`assert_eq!(tool_name.map(|n| n.len()), Some(128))` and the
   `denied-partial-fields` family), so it is a behaviour change with
   fixture consequences and cannot ride along on another card.
3. **Rule it deliberately: a NAME truncates silently, a SENTENCE
   truncates visibly**, and classify each constant by what it carries
   rather than by which number is smaller. This is probably the right
   answer — a marker inside a truncated tool identifier is noise — but
   it is a rule nobody has written and it splits the three constants
   two-to-one against the way they are currently grouped.

T-102 declined all three: inverting or extending the bound/escape
composition is a BEHAVIOUR change, which the card's own last criterion
routes to its own card rather than a clause. The classification, the
rule, and the marker asymmetry are all now written at the caps block in
`runner.rs` and asserted, so whoever takes this starts from a measured
position rather than from a hunch.
