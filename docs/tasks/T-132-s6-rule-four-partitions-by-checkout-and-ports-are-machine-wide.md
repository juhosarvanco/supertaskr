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
