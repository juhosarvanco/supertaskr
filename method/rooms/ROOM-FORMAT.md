# Room thread format

One file per thread: `docs/rooms/<topic-slug>.md`. Rooms produce
clarifications and decisions — never code. The dashboard renders threads as
chat; the daemon routes @mentions to headless agent sessions. Works
identically by hand: append your turn, run the mentioned role yourself.

```yaml
---
type: consultation        # consultation | debate | project
task: T-014               # optional link
status: open              # open | resolved | escalated | closed-no-decision
max_rounds: 3             # bound; hitting it escalates to the human
---
```

## Resolution — closing a room

When a conclusion is reached, whoever closes the room (the role whose
turn concluded it, the architect during triage, or the human) must:

1. Set status: resolved in the frontmatter.
2. Insert a `## Resolution` section IMMEDIATELY after the frontmatter —
   the one permitted edit above the turns — containing:
   - **Question** — what this room existed to settle, one line
   - **Decision** — what was decided, one line
   - **Why** — the arguments that carried it, and the rejected
     alternatives with the reason each lost
   - **Changed** — which files were updated as a result (task IDs,
     ADR numbers, doc sections), with links
3. Update the pointers: remove the room from STATE.md open questions;
   if the room was a debate, the Resolution is the draft of its ADR.

**Readers read the Resolution and stop.** The turns below are the
archive — consulted only when the reasoning itself is being questioned
or a premise behind the decision has changed. A new session must never
need to replay a conversation to inherit its conclusion.

Rooms that die without a conclusion get closed too: status
escalated (handed to the human, with both positions summarized) or
closed-no-decision (with one line on why it went nowhere). An open room
nobody is in is a lie about the project's state — the architect closes
stale rooms during triage.

## Turn format

```
## @verifier (claude-fable-5 @S1) — 2026-08-14 10:32
Token refresh races the logout path — spec doesn't say which wins. @planner
```

A turn addressed with @role triggers that role's next turn. @human pauses
the thread for you. Every participant appends; nothing is ever edited.

## The question entry — a decision the coordinator may not make

A coordinator working while the owner is away meets decisions it does
not hold. It does not stop the loop for them and it does not settle
them: it appends a QUESTION ENTRY to the relevant room, in its own
voice, and continues every card that does not depend on it.

```
## @orchestrator (<model> @<session>) — <date> — QUESTION Q-001 (pending)

**QUESTION — not a ruling.** <what has to be decided, and why nothing
here can decide it> (<the ref it was found at>)

Cards held: T-401, T-402
State: pending
```

- **THE MARKER IS THE POINT AND IT IS NOT DECORATION.** A room is read
  by people who were not in the conversation. An entry that reads as a
  settled thing IS a settled thing to them, so a question that lost its
  marker would be the seat putting a decision in the owner's mouth —
  the exact failure the entry rule above exists against, arriving from
  the other direction.
- **THE ID IS HOW EVERYTHING ELSE FINDS IT.** `Q-` and at least three
  digits, unique in the project. The dispatch order names it on every
  card the entry holds, and the lane cut REFUSES those cards by the
  same state — so an id a reader cannot tell from prose is a hold
  nothing can lift.
- **THE CARDS HELD ARE NAMED IN THE ENTRY AND NOWHERE ELSE.** A card
  gains no field: the link lives here, and a card that stops depending
  on the question is released by editing this entry. Every card the
  entry does not name continues.
- **RESOLVING IT IS AN APPEND, AND THE RESOLUTION CARRIES ITS
  EVIDENCE.** `State: resolved <date> — <what settled it, and where>`.
  A state that changed with nothing behind it is the seat settling a
  decision it does not hold.
- **AND IT IS NEVER THE RULING ENTRY.** When the owner rules, the
  ruling is proposed verbatim and appended on their yes, exactly as
  every other entry recording what the owner settled is
  (roles/orchestrator.md 8b). The question entry is the seat asking;
  the ruling entry is the owner answering, and one never becomes the
  other by being edited.

## Thread types

**consultation** — a working session hits ambiguity and asks instead of
guessing. If the answer changes the spec, the answering role updates the
task file / docs in the same turn and says so in the thread.

**debate** — for decisions. Two rules that counteract model agreeableness:
(1) independent first: both positions are written BEFORE either sees the
other's (the moderator collects, then reveals); (2) assigned disagreement:
one participant is explicitly instructed to argue against. Bounded rounds;
the product is stress-tested options for the human, never a consensus.
The resolution becomes an ADR that links the thread.

**project** — the standing room. The human broadcasts here; any active
session may post status worth surfacing.

## Rules

- Turns are append-only and are the audit trail for ADRs. The
  Resolution section is the single exception: inserted once, at close,
  above the turns.
- **AN ENTRY PARAPHRASES THE RULING AND DATES IT.** Where a turn or a
  Resolution records what the owner settled, it says what was settled
  and when, in the room's own words — never a quotation of the owner's
  message, and never the owner's name: the owner appears as the owner.
  A room is read by people who were not in the conversation and, once a
  project's repository is open, by people who are not in the project. A
  pasted message reaches them stripped of everything that made it make
  sense, and a name reaches them as a person rather than as the role
  that ruled. The seat shows the entry to the owner before appending it
  — roles/orchestrator.md owns that act; this bullet owns the wording.
- **AND THAT RULE LOOKS FORWARD ONLY.** Entries written before a
  project adopted it are RECORDS: they are not restyled, re-quoted,
  redacted or deleted to comply. This is the append-only rule above
  meeting the case it did not anticipate — an archive somebody tidied
  is an archive nobody can cite.
- Two unresolved back-and-forths on the same point → escalate to @human.
- Nothing in a room changes code. Rooms change docs and task files only.
