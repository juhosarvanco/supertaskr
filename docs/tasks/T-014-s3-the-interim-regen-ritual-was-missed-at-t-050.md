---
id: T-014-s3
title: The regen rule says "with the merge" but the house shape lands it in the checkpoint, so every merge commit is briefly stale
status: suggested
suggested_by: executor claude-opus-5 @T-014
---

**Read the correction first.** T-014's executor initially concluded the
interim regen ritual had been SKIPPED at the T-050 merge. That was
wrong, and the wrong version is recorded here because the correction is
the useful part. The ritual ran. It ran one commit later than the rule's
own wording, and that one commit is the finding.

**What is actually true, measured.** The CONVENTIONS interim rule
(T-009-s1) ends: "...and commit `docs/architecture/graph.json` **with
the merge**." The house shape STATE describes is **merge → checkpoint**,
two commits, and the regen lands in the second one:

| commit | what it is | `nputer-index index --check` |
|---|---|---|
| `5927adc` | Merge T-050 | **exit 1 — STALE** |
| `db8da6c` | Checkpoint: T-050 done | **exit 0 — CURRENT** |

At `5927adc` the committed graph is sha256 `815412de…` / 385,451 bytes —
byte-identical to the graph STATE records the **T-049** integrator
writing. At `db8da6c` it is `a6ede920…` / 396,620 bytes and matches its
tree exactly. The `#[ignore]`d `self_graph_is_current` agrees with
`--check` at both commits (101 then 0).

**Why the one-commit window is not academic.** `main` points at the
merge commit for as long as it takes to write the checkpoint, and
anything that branches or measures in that window inherits a graph that
does not match its tree. T-014's own dispatch is the worked example: it
said "branch from main" and predicted `--check` would be green; the
branch was cut at `5927adc` and inherited the stale graph, so
`self_graph_is_current` is red on the T-014 branch through no fault of
the branch. Four sibling tasks were dispatched the same night. Every
gate any of them runs against the committed graph in that window is
measuring a stale file, and nothing tells them so.

There is also a genuine ordering reason the regen CANNOT simply move
into the merge commit, and it is why this is a question rather than a
bug: the T-050 checkpoint edits
`app/test/architecture-dogfood.test.ts` and
`map-dogfood-render.test.tsx`, both of which are INDEXED files, so the
final regen must run after those fixture edits (the ceaa949 ordering
lesson, held twelve times). A regen committed with the merge would be
stale again the moment the fixtures were reconciled. The rule's wording
and the ordering discipline genuinely pull against each other.

**Candidate resolutions, for triage.**

(a) **Reword, don't restructure**: the rule says "with the merge",
should say "in the merge's checkpoint, after the fixture
reconciliation" — describing what integrators already correctly do, and
removing the appearance of a missed step. Cheapest, and it is what the
GRAPH GATE bullet drafted in T-014's notes should say.

(b) **Make the window visible**: the checkpoint already records the
regen; the merge commit could say "graph regenerated in the following
checkpoint" so a session branching at a merge commit knows what it
inherited.

(c) **Dispatch-side**: brief executors to branch from the last
CHECKPOINT rather than from the merge. Cheap, and it would have made
T-014's dispatch prediction ("--check green today") come true.

Whichever way it goes, the GRAPH GATE that replaces this rule should
name the checkpoint explicitly, because `--check` makes the window
observable for the first time — the previous instrument was a
`#[ignore]`d test nobody ran on a branch.
