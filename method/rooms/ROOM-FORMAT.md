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
- Two unresolved back-and-forths on the same point → escalate to @human.
- Nothing in a room changes code. Rooms change docs and task files only.
