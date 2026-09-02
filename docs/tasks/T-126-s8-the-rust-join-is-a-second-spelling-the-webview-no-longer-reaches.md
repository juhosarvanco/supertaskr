---
id: T-126-s8
title: The Rust join is a second spelling of a rule the webview no longer reaches — `T-126-s2` put the shipping join in TypeScript and left `join_lanes` compiled, cargo-tested and unreachable, held to the TS one by a source-text pin
feature: F-04
milestone: 4
size: S
priority: 4
status: suggested
suggested_by: "T-126-s2's executor, which built the ruled shape and found the disposition of the Rust half was a decision the ruling did not take"
blocked_by: []
touches: [app-dispatch, app-shell]
builder:
verifier:
built_by:
verified_by:
review: independent
---

**THE RULING SAID WHERE THE JOIN GOES AND NOT WHAT HAPPENS TO THE ONE
IT LEFT.** The 2026-08-31 architecture sitting ruled `T-126-s2`'s shape 3
— *"THE JOIN GOES TO TYPESCRIPT — after, and only after, the dispatch
view model has a test path"* — and that is what `T-126-s2` built. It did
not say `join.rs` is deleted, and an executor may not take an unruled
architecture decision from inside a lane, so the Rust join is still
there. This card is the decision, filed rather than taken.

## What is true at `T-126-s2`'s tip, measured rather than remembered

- `dispatch::join::join_lanes` has **no non-test caller**. `git grep -n
  'join_lanes'` over `app/src-tauri/src` returns its own definition, one
  `mod.rs` doc sentence, one `lib.rs` doc sentence and
  `lanes.rs`'s source sweep asserting the string `pub fn join_lanes` is
  present. No `#[tauri::command]` delivers it.
- `join.rs` is nonetheless **depended on**: `brief.rs` calls
  `super::join::LaneScanRefusal::of(other)` and its `sentence()`. So the
  module cannot simply go; the REFUSAL type would have to move or be
  duplicated, and duplicating it is what this whole family is about.
- Its `#[cfg(test)]` bodies still run under `cargo test` — one pin per
  state, the four refusal sentences pinned whole, and the
  `a_row_carries_the_readers_five_lane_fields_and_the_same_json`
  serialization keeper. Deleting the join deletes those too.

## The three dispositions, and none of them is free

1. **Delete `join_lanes` and keep `LaneScanRefusal`.** The smallest
   change that removes the duplicate rule. It costs the Rust pins on the
   four states — which are, today, the ONLY place the classification is
   proved against a real fixture directory rather than a hand-built
   scan, because `join.rs`'s own header insists on it (*"EVERY BODY BELOW
   DRIVES THE REAL READER OVER A REAL FIXTURE DIRECTORY … never a
   hand-built `LaneScan` value. A join proved against a fiction is
   proved against the fiction."*). The TypeScript bodies are all
   hand-built values, so this trade is a REAL loss of evidence and not
   a tidy-up.
2. **Keep both and keep the pin.** What `T-126-s2` shipped:
   `the_rust_join_and_this_one_spell_one_rule` in
   `app/test/dispatch-store.test.ts` reads `join.rs`'s source and
   requires `IN_FLIGHT_STATUSES`, `DISPATCH_STATES` and the four refusal
   sentences to agree. It closes the VOCABULARY drift and closes nothing
   else: a swapped `classify` arm in Rust is invisible to it, and is
   `cargo test`'s to catch — which it does.
3. **Keep both and pin the BEHAVIOUR, not only the vocabulary.** A
   golden-corpus keeper: the same scan and board through both joins,
   compared. Expensive across the language boundary and it is the same
   question `T-110-s3` already carries for the reader's vocabulary.

## Why this is a ruling and not a preference

Whichever is chosen decides whether this project's answer to "one rule,
two languages" is *delete one* or *pin both* — and it has now met that
question three times (`T-110-s3` for the reader's vocabulary, `T-033-s11`
for `non_code`'s two engines, this card for the join). A per-instance
answer is how two engines came to disagree about one registry.

## Fence

`[app-dispatch]` for `join.rs` and `brief.rs`; **plus `[app-shell]`**,
because `lib.rs`'s `dispatch_lanes` doc comment names
`dispatch::join::join_lanes` in the sentence explaining why the command
does not join, and that sentence is falsified by disposition 1.
