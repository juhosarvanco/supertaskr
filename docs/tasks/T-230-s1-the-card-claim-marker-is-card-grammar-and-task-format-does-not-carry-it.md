---
id: T-230-s1
title: The CARD CLAIM marker is card GRAMMAR and method/tasks/TASK-FORMAT.md does not carry it — a mechanism exists that no card author is told about, and writing it down is a method version bump this lane's fence cannot reach
feature: F-06
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: executor claude-opus-5@subagent @T-230
blocked_by: []
touches: [method/]
builder:
verifier:
built_by:
verified_by:
review:
---

**Class parent: none.** The closest live cards are `T-160-s1` (the
preflight has no tripwire) and `T-160-s2` (a claim inside a block is
invisible), and neither owns this: both are about the COMMAND, and this
is about what a CARD MAY SAY.

T-230 added an opt-in marker to `brief.mjs --preflight`:

    CARD CLAIM (<tracked file>): "<quoted string>"

A card that writes one gets the quoted string checked against that file
at HEAD before a seat is paid for; a card that does not write one gets
its assertions reported as unchecked, exactly as before. **The mechanism
is live and the grammar is written down nowhere a card author reads.**
`method/tasks/TASK-FORMAT.md` is the file that says what a card may say —
its body sections, its fields, its criterion rules — and it does not
mention the marker. So the arm's whole value depends on authors
discovering it in a tooling module's source, which is the failure mode
this project already names: *a rule that depends on a reader remembering
has a failure mode while a construction does not*, and here the reader
cannot even remember, because nobody told them.

**WHY T-230's LANE COULD NOT DO IT.** The fence was three paths under
`tools/e2e`. `method/` is outside it, and the edit is not a one-line
addition either: docs/CONVENTIONS.md's WHAT A BUMP IS OWED FOR test (2)
is GRAMMAR — *"the change alters what a card, a room, a brief or a role
file may SAY"* — so documenting the marker in TASK-FORMAT is a METHOD
VERSION BUMP, which is a three-file commit whose third file is Rust
(`METHOD_SNAPSHOT_VERSION` in app/src-tauri/src/agent/kit.rs) plus the
METHOD EVAL GATE's result recorded in the bump's own commit message. A
fence able to do this honestly is `[method/, docs/CONVENTIONS.md,
app-agent]` at minimum.

**Disposition hint: promote, and ride it on the next method bump rather
than cutting a bump for it.** The marker costs nothing while
undocumented — no card is refused for lacking one — so this is a
capability nobody can use, not a defect that reds anything. What it
should NOT do is sit until somebody rediscovers the marker by reading
`card-preflight.mjs`.

**One drafting note for whoever takes it**, because it is the part a
reader will get wrong: the marker is read from the card's PROSE reading,
so an example written inside a fenced or indented block is deliberately
NOT a claim — that is what lets TASK-FORMAT document the form without
every copy of the documentation becoming a live claim about a file.
