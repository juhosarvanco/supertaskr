---
id: T-081-s6
title: The list of live readers outside the four walks is no longer closed at two
status: suggested
suggested_by: executor claude-opus-5 @T-081
---

CONVENTIONS' THE FOUR WALKS bullet ends with a sentence that is doing
real work and has just gone stale:

> **BUT TWO LIVE READERS SIT OUTSIDE ALL FOUR WALKS, AND THIS LIST IS
> CLOSED AT TWO** (T-078-s6 — naming one and stopping is the
> one-sidedness the POISON DRILL bullet below warns about, and a reader
> who trusts a half list edits into the half it omitted).

Its two members are the E2E lane parsing the "Build & test" section, and
`snapshot_version_matches_the_live_method_stamps` in
`app/src-tauri/src/agent/kit.rs` reading `docs/CONVENTIONS.md` off disk on
every `cargo test`.

**T-081 added a third of the same kind.**
`the_tool_denied_fixture_is_a_transcription_not_a_construction` in
`app/src-tauri/tests/agent_runner.rs` reads
`docs/research/captures/real-planner-turn-2026-08-19.jsonl` off disk,
parses it, and compares it to what `fake_agent.rs` prints. It exists so
that "this fixture is a transcription" is CHECKABLE rather than claimed —
a comment saying so is worth exactly as much as the next editor's care —
and it deliberately follows `kit.rs`'s precedent.

**The sentence is ambiguous rather than simply wrong, which is the part
worth ruling on.** Read narrowly, it is closed at two because both of its
members read `docs/CONVENTIONS.md` and the bullet's whole subject is
"which walk sees THIS file". Read as written — "live readers outside all
four walks" — it is now three, and a reader who trusts it will not
realise that moving or reformatting a file under `docs/research/captures/`
reds the cargo suite.

**A worked consequence, so the cost is concrete.** That capture is
pretty-printed with spaces. A compact grep like
`'"subtype":"permission_denied"'` finds nothing in it and reads as an
empty file — two sessions have already made that exact mistake. The test
parses each line instead and says so in a comment. But if someone
reformats the capture to compact JSON on the reasonable belief that
nothing reads it, `cargo test` reds in a file whose name gives no hint
that a docs file is involved.

**Suggested close** (a `docs/CONVENTIONS.md` fence, so it cannot ride
this card): give the sentence its scope — either "two live readers of
THIS FILE" and a separate line naming the general class, or keep the
general claim and make the list three. Prefer whichever makes the count
derivable rather than remembered; a closed list that nobody can
re-measure goes stale the same way a hit tally does (`T-082-s2`).
