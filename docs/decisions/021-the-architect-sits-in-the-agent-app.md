# ADR-021: the architect sits in the user's agent app; nputer ships as a skill, a CLI and a mirror

Status: ratified. Date: 2026-09-03. Decider: @human ("Lets move forward
with what you just said", 2026-09-03, on the architect seat's
recommendation of the same sitting — both quoted in
docs/rooms/cockpit-or-mirror.md, RE-RULED section).
Provenance: docs/rooms/cockpit-or-mirror.md (ruled 2026-08-20 "both —
follower first, cockpit next"; re-ruled for v1 2026-09-03), the fourth
Fable sitting record in docs/checkpoints/ (the evidence), the
2026-09-03 sitting record beside it. Amends ADR-008 for the technical
first user; shapes F-05; answers the cross-harness plan's D-X1.

## Context

The 2026-08-20 ruling made the two postures one system observed from
two chairs, with the repo unable to tell the difference, and ordered
the follower before the cockpit. The wave of 2026-09-02 was that
ruling tested for real: the whole loop — triage, dispatch, blind
verification, merge, push, CI — ran from the Claude desktop app, the
app spawned nothing, the board was a mirror the seat glanced at, and
every load-bearing piece of nputer was a file, a script or a gate
(the cards, the fences, the dispatch view, the push guard, the holder
record, the batteries). @human, 2026-09-03: *"You anyway need to go to
the Claude or Codex to follow the subagent sessions work and maybe it
is easier to control the models etc from the Claude/Codex desktop apps
or terminal. So maybe the best place to run the process is from the
Claude or Codex apps. Should we move the interview also to Claude or
Codex as a skill or in other format?"*

## Options considered

1. **Build the cockpit** — F-05's in-app orchestrator conversation
   and an in-app spawn path. Rejected for v1: it rebuilds what the
   vendor apps already own and keep improving (the conversation,
   model choice, subagent spawning, permissions, compaction,
   billing); ADR-003's bet is that vendors maintain the hard parts;
   a spawn path covers only CLIs while the follower posture covers
   agents that exist only as apps; and a chat that shells out
   headlessly is a worse chat than the one the user is typing into.
2. **The architect sits in the agent app; nputer is a skill, a CLI
   and a mirror.** Chosen.
3. **Both, cockpit next** — the 2026-08-20 order. Superseded for v1:
   the cockpit is not before v2, and then only on evidence that a
   user wants it.

## Decision

1. The architect conversation lives in the user's agent app (Claude
   Code, Codex). nputer does not host it in v1.
2. For the technical first user nputer is three things: a **skill**
   per agent that holds the seat (the cold-start read, the dispatch
   view, cut a lane, spawn builder and blind verifier, fold the
   verdict, merge, push — the architect's hand work, with T-239's
   one-command arm underneath so a Codex architect runs lanes through
   a shell command); nputer's **CLI** (C-02: the scripts under
   tools/e2e/scripts and the indexer, packaged as `npx nputer`); and
   the **app as the mirror** (board, lanes, map, health), openable on
   a folder from outside.
3. The interview ships as ONE interview in two lenses: a skill in the
   agent app, and the app's split view. One prompt, one file contract
   — ADR-017 already makes chips come from the watcher seeing files,
   so a skill-driven interview with the app open beside it IS the
   split view with the vendor holding the chat half. The app's guided
   interview is the later non-coder layer (ADR-006, layer 2); the
   F-03 runner hardening is that layer's asset.
4. F-05's in-app orchestrator conversation and any in-app spawn path
   leave v1. Rooms and resolutions stay files under the method; the
   registry pane waits.
5. The property to defend is unchanged: a skill-driven turn and a
   hand-driven one produce identical files. Conversations belong to
   the vendor; facts belong to nputer.

## Consequences

- ADR-008's "the app is the front door" holds for the mirror and for
  the non-coder layer; for the technical first user the front door
  is the agent app's slash command. NORTH_STAR success criterion 2
  keeps both mechanisms ("the app's interview or `npx nputer init`"):
  the skill is the second one's form. Its tripwire is re-read:
  routing around the APP is fine; routing around the FILES is the
  failure, and the files were not routed around.
- Codex's slash-command form is unmeasured on this machine (only its
  `exec` flags are captured): the Codex form is a prompt file until
  measured, by the cross-harness plan's own rule. `ADAPTERS` stays at
  one entry — no spawn adapter is needed under this ruling.
- Cut at this sitting, PLANNED and NOT dispatched under @human's
  standing instruction of 2026-09-02: T-241 (the seat skill), T-242
  (the interview skill), T-243 (the app opens on a folder from
  outside), T-244 (`npx nputer`, size L — dispatch needs approval).
- The v1 function inventory is recorded in
  docs/rooms/version-planning.md (sitting of 2026-09-03), the
  charter is checked in at
  docs/research/beyond-the-playbook-charter.md with a version column.
