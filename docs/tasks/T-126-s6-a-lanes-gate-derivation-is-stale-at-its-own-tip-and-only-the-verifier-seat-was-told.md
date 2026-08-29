---
id: T-126-s6
title: A lane's gate derivation goes stale at its own last commit, and T-104 landed that rule in the verifier's role file only — the executor seat still says "name your ref", which the T-126 lane did while its DOCS GATE flipped from not-owed to owed
status: parked
suggested_by: integrator claude-opus-5 @T-126
---

The T-126 lane recorded its range and its standing-gate derivation at its
CODE commit `0fa83da` and then wrote a notes commit `cc49f81` carrying six
`docs/` files. **Its own DOCS GATE answer changed underneath it**, and the
lane's notes describe a diff that is not the diff the integrator gated on.
Measured at this merge, all four figures at their own refs:

| derived at | paths | `docs/` paths | GRAPH REGEN | BOOT GATE | DOCS GATE |
|---|---|---|---|---|---|
| `41900d6..0fa83da` (the lane's ref) | **3** | **0** | 3 — owed | 2 — owed | **NOT OWED** |
| `41900d6..de05430` (its tip) | **9** | **6** | 3 — owed | 2 — owed | **FIRES, 3 suites** |

**ONLY ONE OF THE THREE GATES MOVES, AND IT MOVES FROM SILENT TO OWED.**
GRAPH REGEN and BOOT GATE answer identically at both refs, so nothing in
the lane's own report looks wrong; the one gate whose trigger is `docs/`
is the one a lane's LAST commit is guaranteed to feed, because a lane's
last commit is almost always its notes and findings.

## This is not sloppiness and it is not new — it is one seat short

T-104's checkpoint found the identical shape one merge earlier ("THE
GATE'S ANSWER WAS CHANGED BY THE LANE'S OWN NEXT COMMIT") and named
ruling FIVE as the rule that catches it. **Ruling FIVE landed in
`method/roles/verifier.md`**, in the verifier's own voice:

> **Re-derive at your own tip, or name the ref you measured at.**

`method/roles/executor.md` asks for the two halves separately and joins
neither: line 48 wants *"Every standing gate — fired or not-owed, derived
from the diff, with the path count it was derived on"*, and line 50 wants
*"Every figure with its ref"*. **The T-126 lane obeyed both.** It named
`0fa83da` and stated its path count against it. What no line tells the
executor is that a gate derivation is not a figure — naming the ref makes
a COUNT honest, but a gate is a DECISION, and a decision recorded as "not
owed" at a ref one commit behind the tip reads as "not owed" full stop.

**And this lane could not have read the rule even in the verifier's
file.** Its code commit is timestamped 17:37 and T-104 merged at roughly
19:5x the same evening, so ruling FIVE was not on main when these figures
were measured. The recurrence is evidence about the RULE'S PLACEMENT, not
about this executor.

## What the fix probably is, stated as a shape rather than a patch

The executor's report is written into the card by the commit that IS the
lane's tip, so "re-derive at your own tip" is not literally performable
from inside that commit — this is the structural half, and it is why the
verifier's wording offers the two-branch escape. The executor's version
needs the same escape stated for a DECISION rather than a count: either
derive the gate set against the tree the tip WILL have (the
`merge-tree --write-tree` forecast already prescribed by the RANGE RULE,
which costs nothing extra), or record the gate as owed-at-my-ref and say
plainly that the integrator must re-derive. **The first is strictly
better**, because it is the same command the executor already runs for
its range, and its answer does not move when the notes commit lands.

## Fence

`[method/]` — **FREE**. One clause in `method/roles/executor.md`,
alongside the bullets at lines 48–52. It is the same file `T-108-s3` and
T-108's fence ruling are both waiting on, and the same fence `T-091-s4`
names, so a single lane could reasonably take all four.

Do not restate ruling FIVE's verifier wording; cite it. Two descriptions
of one rule is the failure `T-111`'s note about ruling NINE's two homes
already records.

Amnesty triage 2026-08-29 (triage seat): PARKED — the needle is live: method/roles/executor.md still asks for the two halves separately and joins neither — a gate derivation is not a figure, and "not owed" recorded at a ref one commit behind the tip reads as "not owed" full stop. The mechanism is structural rather than careless, and that is what makes it recur: the one gate whose trigger is docs/ is the one a lane's LAST commit is guaranteed to feed, because a lane's last commit is almost always its notes and findings. RESURFACES: the next method/ dispatch — T-159. It is ruling FIVE's missing second seat, and it belongs beside T-091-s4's predicted-tree lines and T-052-s5's steps-versus-rules vocabulary, all three of which are parked on the same vehicle.
