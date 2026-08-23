---
id: T-070-s2
title: The READ is bounded now and the FILE still is not — transcript.jsonl grows forever and nothing rotates it
status: parked
suggested_by: executor claude-opus-5 @T-070
---

T-070 closed the read. It did not close the growth, and the card said so
in as many words — the file cap with rotate-aside was the OTHER of two
offered arms and this card took the first.

**WHAT IS STILL TRUE AT THIS BRANCH.**
`sessions::append_transcript` caps ONE LINE at `TRANSCRIPT_TEXT_CAP`
(256 KiB) and appends forever. Nothing rotates, truncates, compacts or
deletes `.nputer/genesis/transcript.jsonl`. A project interviewed over
weeks accumulates every half-turn of every session, and the only thing
that ever removes bytes is the user deleting `.nputer/`.

**WHAT T-070 CHANGED ABOUT THE COST, EXACTLY.** The arrival read is now
`sessions::read_transcript_tail`, which seeks from the end, so the
SCREEN no longer pays for the file. What remains is disk: bytes in the
user's project directory that nothing will ever read again — the tail
read reaches at most `MAX_REHYDRATED_LINES` lines back, so every line
older than that is write-only by construction, permanently.

**THE ARM.** A file cap with rotate-aside, following the
`sessions.json.corrupt` precedent already in this module: at append
time, if the file exceeds a cap, rename it to
`transcript.jsonl.<stamp>` (or simply aside, one generation) with a log
line and start a fresh one. The losable-by-charter property is preserved
either way — `docs/` is the only project truth and a rotated transcript
loses scrollback and nothing else — and the rotate-aside spelling is
what keeps "losable" from becoming "silently destroyed", which is the
distinction `load`'s corrupt-registry path already draws.

WHY IT WAS NOT TAKEN HERE: the card offers the two arms as
alternatives (`IF a file cap with rotate-aside is chosen INSTEAD`), and
the acceptance criterion the pins are written against is the READ. Doing
both would have put a write-path change, a new on-disk artefact and a
new failure mode into a card sized beside its sibling.

**SIZE S.** One clause in `append_transcript`, one constant, one unit
body in `agent/sessions.rs`, and a sentence in the module header.

**PARKED at the seventh triage (2026-08-24).** Unpark at the first real transcript measured above the tail read's own ceiling (52,428,800 bytes). Nothing reads those bytes today — write-only by construction.
