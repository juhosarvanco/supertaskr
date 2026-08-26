---
id: T-138
title: The read-first set has three spellings, its designated authority omits the product document, and that authority is in no component, no fence and no graph
feature: F-01
milestone: 4
priority: 3
size: M
status: building
blocked_by: [T-134]
touches: [CLAUDE.md, method/roles/orchestrator.md, method/roles/executor.md]
builder: claude-opus-5
verifier:
built_by:
verified_by:
review:
---

**@human, 2026-08-26**: *"Why did this error happen to you? Why did you
not know this about `blocked_by`? Every time I start a new architect
session, it needs to be thoroughly aware of the functionalities and
features of our app."*

**This card is the root cause, measured. It is not an apology; every claim
below is a command anyone can re-run.**

## The chain

An architect session spent a working day believing `blocked_by` was
broken. It is not — the parser reads it, the app resolves every id against
the model, done blockers render green with a tick, and dangling blockers
measure zero. **The capability that would have told it so is documented in
`docs/ROADMAP.md`**, whose F-06 entry says the tasks lens *"lays the
board's cards out in dependency waves over `blocked_by`, with a critical
path (the longest chain, CPM sense) and a worst blocker."*

**The session never opened `ROADMAP.md`, and it was following instructions.**

| where | what it says the session reads first |
|---|---|
| `CLAUDE.md` (root adapter) | `docs/STATE.md`, `docs/ARCHITECTURE.md`, `docs/CONVENTIONS.md` |
| `method/roles/orchestrator.md:6` | `docs/STATE.md`, **`docs/ROADMAP.md`**, `docs/tasks/` |
| `method/roles/executor.md` row 3 | *"the project's OWN root adapter file"* — i.e. **`CLAUDE.md` is the authority** |

**Three spellings. The method designates the one that omits the product
document. Neither of the other two references it.** `grep -c ROADMAP
CLAUDE.md` returns **0**.

## And the authority is unowned

- **`CLAUDE.md` is tracked by git and is NOT in the architecture graph** —
  183 indexed files at `15f0d7d` and it is not among them, because the
  indexer walks code extensions and it is a root `.md`.
- **No component's `paths:` claims it.**
- **No fence can name it today** — which is why this card is
  `blocked_by: [T-134]`: path-granular fences are what make
  `touches: [CLAUDE.md, …]` expressible at all. **This card is the first
  consumer of that mechanism.**

**So the file that decides what every session in this project knows is
governed by nothing.** It is not in the registry, not in a fence, not in
the graph, and no gate fires on it.

## What is missing is a KIND of document, not a line

Adding `ROADMAP.md` to one list would fix today's instance and not the
class. **All three read-first documents are METHOD-shaped**: `STATE` is
what is happening now, `CONVENTIONS` is how to work, `ARCHITECTURE` is
which components exist. **Not one of them says what the app DOES for a
person using it.**

`ROADMAP.md` is the closest thing and it is **intent-shaped prose about
features in the abstract**, maintained by hand. It happened to carry the
F-06 sentence that would have saved a day, and it might not have.

**Meanwhile a behavioural description of the product already exists and is
derived**: `tools/e2e/tests/` holds **23 spec files and 163 named
behaviours**, each one a sentence about what the app does, kept true by
running. **Nothing points any session at them.**

## @HUMAN'S DECISIONS — 2026-08-26

**DECIDED: the product-shaped entry is a GENERATED capabilities document,
not a hand-written one.** `tools/e2e/tests/` holds **163 named behaviours
across 23 spec files**, each a sentence about what the app does, **kept
true by running**. A document generated from them cannot drift. A
hand-maintained one would reproduce the exact failure this card exists to
record — `docs/ROADMAP.md` already carried the sentence that would have
saved a day, and it went unread because prose is something somebody has to
keep true.

**AND @HUMAN REFRAMED THE CARD'S CENTRAL QUESTION, CORRECTLY.** The
architect wrote this card as *"what should the read-first set be"*. @human
asked whether the set should differ by role — *"of course they need to
differ, they are different roles"* — and that is the better question.

**Measured, and it is a third disagreement the architect had not found**:
`method/roles/executor.md` row 3 declares ONE read-first set for *"every
session in this project"*, sourced from the root adapter — **while the
role files already name different sets of their own.** So the project runs
two competing models at once, which is this card's own subject one layer
down.

**AND THE PER-ROLE DIFFERENCE IS DELIBERATE IN AT LEAST ONE SEAT.** A
verifier is kept blind to the executor's reasoning on purpose — that
blindness is what `T-104`'s ruling SEVEN identifies as the property that
makes a same-model verdict sharp. **A single universal list is therefore
not merely inconvenient for that seat; it is wrong for it.**

**THE EVIDENCE SAYS THE OTHER SEATS ARE NOT THE PROBLEM.** On 2026-08-25/26
the pipeline produced **16 merges and 100 done cards**, with two
rejections (`T-111`, `T-132`) that each caught a real defect and were each
fixed and re-approved. **Executors, verifiers and integrators repeatedly
caught the ARCHITECT's errors** — a fabricated citation, a stale figure
carried into a brief, a wrong ignore-rule, a claim of novelty that was
already written down. **The failing seat was the dispatching one, and its
list is the one that omitted the product document.**

So this card SHALL NOT speculatively re-cut the other three lists. It
SHALL reconcile the ONE-list/PER-ROLE contradiction, fix the seat that
demonstrably failed, and **change another seat's list only where there is
evidence that seat needed it.**

## Acceptance criteria

- **THE THREE SPELLINGS SHALL BECOME ONE, and the reconciliation SHALL
  name which is authoritative.** `executor.md` row 3 already rules the
  adapter authoritative — **so either the adapter gains what the role file
  has, or the role file stops carrying a competing list.** Two lists that
  agree today drift tomorrow (T-057).
- **THE SET SHALL INCLUDE A PRODUCT-SHAPED ENTRY**, and the card SHALL say
  what makes it product-shaped rather than adding a filename. **A session
  that has read the set SHALL be able to answer "what does this app do
  for a user" without opening source.**
- **THE 163 NAMED BEHAVIOURS SHALL BE EVALUATED AS THAT ENTRY, not
  assumed to be it.** They are derived and cannot go stale, which is the
  property `ROADMAP.md` lacks — **and they are 163 sentences, which is a
  reading cost a session pays every time.** Rule on it with the count
  measured at your own ref, and if the answer is "summarise them", say
  who keeps the summary true.
- **`CLAUDE.md` SHALL BE GIVEN AN OWNER**, or this card SHALL state
  plainly that it deliberately stays unowned and why. **A file the method
  designates as authoritative and the registry does not know about is the
  gap this card exists to name** — leaving it is a decision, not a
  default.
- **NO GATE SHALL BE BUILT BY THIS CARD.** Whether an unowned authority
  should fail a check is a real question and a separate one; **`T-136` was
  rejected today for gating a defect that did not exist**, and the lesson
  is to measure before mechanising.
- **THE READING COST SHALL BE STATED.** Every document added to the
  read-first set is paid for by every session forever. **Say what the set
  costs now and what it costs after** — the ceremony measurement in
  `T-131` exists because nobody had ever priced this project's overheads.

Verification: headless. **`CLAUDE.md` is read by `app/test/interview-chat-dom.test.tsx`** — derived, not assumed — so `npm test` from `app/` is owed and the reason SHALL be stated. `npx vitest run` from `lib/parser/` and `npm test` from `tools/e2e/` per the DOCS GATE's own answer; run it **directly, never through `xargs`**, and note **exit 3 is GATE COULD NOT RUN**. Exits **unpiped from `$?`**, counts derived (Playwright prints `Running N tests`; cross-check it). **This card may add no test body** — if so, say so explicitly rather than leaving the drill silent. **Build `lib/parser` before any app suite.** **Ports are machine-wide while lane-protocol rule 4 partitions by CHECKOUT (`T-132-s6`)** — explicit port, re-probed immediately before binding. **@human: one look at the final read-first set**, because what every future session is required to read is a judgement about their time, not a mechanical fact.
