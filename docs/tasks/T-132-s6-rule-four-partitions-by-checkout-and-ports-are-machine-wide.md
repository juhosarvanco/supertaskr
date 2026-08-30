---
id: T-132-s6
title: Rule 4 partitions by CHECKOUT and a default port is machine-wide — two lanes obeying it perfectly still collided, and the guard that caught it is the only reason anyone knows
status: parked
suggested_by: architect claude-opus-5
---

**Observed live at T-133's merge, hours after `T-132` landed the rule.**

## What happened

A third `tools/e2e` invocation exited **1 with zero bodies**. Cause,
derived rather than guessed: lane port **14520** was held by
`node …/nputer-T-135/app/…/vite`, **pid 14611, started 27 seconds
earlier**.

**Nobody broke rule 4.** T-135 ran its dev server inside its own
worktree, which is exactly what the lane protocol asks. T-133's
integrator ran a suite in the integration checkout, which rule 4 now
permits for the integrator seat. **Both hands were correct and they
still collided**, because:

> rule 4 partitions by **CHECKOUT** — *"…against that checkout, whatever
> seat you sit in"* — **and a default port number is machine-wide.**

**The guard behaved perfectly**: it detected, refused loudly, named the
remedy, and never took the port. The re-run at an explicit port was
green. **That is the only reason this is a finding rather than a
mystery** — an exit 1 with zero bodies is otherwise indistinguishable
from a harness failure.

## Why it is a gap rather than an incident

`T-128` names four shared surfaces and `T-128-s1` added the checkout's
test runner as a fifth. **All five are partitioned by location** — an
index, a ref namespace, a directory, a board, a checkout. **A port is
partitioned by NUMBER, on the machine**, and no rule this project has
written reaches it.

**The isolation everyone reasons about is the worktree**, and the
worktree is precisely the thing that does not help here. Two lanes with
disjoint fences, disjoint trees, disjoint indexes and disjoint runners
share exactly one namespace: the port space.

**AND THE POPULATION IS GROWING.** The project runs more lanes
concurrently than it used to, each may start a dev server or a boot
gate, and the default is a constant. **The collision probability rises
with parallelism while every written rule stays satisfied.**

## What the record already contains

The discipline exists in practice and is stated nowhere as a rule:
sessions have been **`lsof`-reading a port, then bind-probing it, then
re-probing immediately before the bind**, because *proving a port free
NOW reserves nothing* — measured earlier the same session, when an
integrator lost a port between its probe and its use.

**So the remedy is already invented and only the rule is missing.**

## The shape of a fix, not the fix

Three arms, cheapest first, none ruled:

1. **Name the port space as a shared surface** in the same place the
   other five are named, with the existing probe-then-re-probe
   discipline attached. Prose — and `T-131` argues prose does not bind.
2. **Derive the port from the lane** rather than defaulting it, so two
   lanes cannot pick the same number by construction. **A construction
   beats a check**, which is this project's own stated preference; the
   lane id or the worktree path are both available and both stable.
3. **Refuse loudly on a held port and say who holds it.** Already built
   for the e2e harness and already working — **the finding is that it is
   one harness's behaviour rather than a rule**, so the boot gate, the
   dev server and any future runner each re-invent it or do not.

**Arm 2 is the one with precedent**: the project already derives a
scratch worktree's name from its lane, for the same reason.

## One caution for whoever takes it

**A port check that cannot tell a live holder from an absent one is not
a check** — the standing rule for the live-product detector applies
unchanged, and it comes with its positive-control requirement: prove the
check lets the ordinary case through as well as stopping the collision.
And **`lsof` only**: never connect, never bind to test, because taking a
port for a microsecond is still taking it.

Amnesty triage 2026-08-29 (triage seat): PARKED — docs/STATE.md already carries this as a standing hazard with the discipline attached — pass an explicit port and lsof-read it at zero rows immediately before binding, because a probe reserves nothing — so every session is briefed and the guard that caught the live collision behaved perfectly. What is missing is the CONSTRUCTION: arm 2, deriving the port from the lane so two lanes cannot pick the same number, which is this project's own stated preference and has precedent in how scratch worktree names are already derived. It is held rather than promoted because T-120-s2 is now planned over the same file and its criteria explicitly forbid moving the port probe. RESURFACES: the merge of T-120-s2, after which resolveLanePort's neighbourhood is free and arm 2 is a small construction; arm 1 (naming the port space beside the other five shared surfaces) rides T-159. The caution stands whoever takes it: lsof only, never connect and never bind to test, and the check owes a positive control.

CORROBORATION (Amnesty triage 2026-08-29, triage seat) — T-137-s9 is a SECOND instance of this card's class, in a different file and diagnosed from scratch weeks apart: tools/e2e/tests/brief.spec.ts joined the MACHINE-wide `git worktree list` to the CHECKOUT's card index, so the body reddened in every older lane the moment a newer lane was cut, with a positive control in the same tree (204/204 at 19:21, 204/1 at 19:53, nothing changed but a sibling worktree). A port number and a worktree list are machine-scoped; a card index, a fence and a graph are checkout-scoped. NOTHING NAMES THE CLASS, and a convention bullet that did would have made both diagnoses a lookup — which is why the residual belongs at this seat rather than on either instance.

**RE-PARKED WITH A NEW CONDITION, AND THE SCOPE IS NOW ONE ARM (2026-08-30, `T-159-s1`, the card triage promoted to write T-159's rider stamps).** The T-159 half of the old note FIRED and was taken; the T-120-s2 half has NOT, and re-stamping the whole card under the same sentence is the shelf `method/tasks/TASK-FORMAT.md` names. Re-derived at `51fa31c`:

- **ARM 1 IS TAKEN IN A BETTER FORM THAN IT ASKED FOR, AND THE CARD'S LITERAL ASK HAS NO SITE.** *"Name the port space as a shared surface in the same place the other five are named"* presumes an enumeration in `docs/CONVENTIONS.md`; `command grep -in 'surface' docs/CONVENTIONS.md` returns **3 rows at `51fa31c`** (`:542` a webview surface, `:1337` a board that got shorter, `:2102` a DEV-gated surface) and **none is the list** — the five live only on T-128's cards. What landed instead is `method/lane-protocol.md:159-180`, inside rule 4 itself, where the class belongs: *"AND THIS RULE PARTITIONS BY CHECKOUT, WHICH IS NOT THE ONLY WAY A LANE CAN COLLIDE … Some surfaces are scoped by the MACHINE instead"*, naming the same five location-scoped surfaces beside the machine-scoped ones, carrying BOTH observed instances, and ending on this card's own arm-2 preference — *"NAME THE SCOPE OF EVERY SURFACE YOU DEPEND ON — machine or checkout — and where the answer is machine, DERIVE the value from the lane rather than defaulting it. A construction beats a check."*
- **THE CORROBORATION IS DISCHARGED WITH IT.** T-137-s9's ask was that NOTHING NAMES THE CLASS; rule 4 now does, and it names T-137-s9's own instance — a check that joined a MACHINE-scoped list to a CHECKOUT-scoped one and reddened every older lane the moment a newer lane was cut — beside the port one.
- **ARM 3 IS SUBSTANTIALLY TAKEN TOO, WHICH THE OLD NOTE DID NOT ANTICIPATE.** Its finding was that refuse-loudly is *"one harness's behaviour rather than a rule"*; the same rule-4 text now states it as a rule — *"ask the operating system — never by connecting, never by binding to test, because taking a port for a microsecond is still taking it"* — with this card's own caution that proving a port free NOW reserves nothing.

**WHAT SURVIVES IS ARM 2 ALONE: DERIVE THE PORT FROM THE LANE.** Still unbuilt and still checkable in one command — `tools/e2e/preflight.ts:21,28-29`, `resolveLanePort()` reads `NPUTER_E2E_PORT` and falls back to the constant **14520**, a machine-wide number DEFAULTED rather than derived, which is exactly the construction the method text now recommends and the code does not perform. The 1420 refusal beside it is arm 3, not arm 2.

**NEW RESURFACING CONDITION, and it is a pair rather than a single card, because the old one bet everything on one card surviving triage.** Whichever comes first: **(a) the merge of `T-120-s2`** — `status: planned`, `touches: [tools/e2e]` at this ref, still the card whose criteria forbid moving the port probe, which is why this waits on its MERGE and not on its lane; or **(b) the next dispatch whose fence reaches `tools/e2e/preflight.ts`**, since that is the only file arm 2 has to change and any lane holding it can perform the construction inside its own fence. **The falsifier is one line and needs no memory of this card**: if `resolveLanePort()` no longer defaults to a constant, this arm is done and the card is closed. The caution stands for whoever takes it — `lsof` only, never connect and never bind to test, and the check owes a positive control.