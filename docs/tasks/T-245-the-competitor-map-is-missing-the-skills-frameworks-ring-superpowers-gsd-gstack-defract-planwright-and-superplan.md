---
id: T-245
title: The competitor map is missing the skills-frameworks ring — Superpowers, GSD Core, gstack, defract, PlanWright and the npm superplan — and the narrowed claim has not been checked against any of them
feature: F-01
milestone: 4
size: M
priority: 2
status: planned
suggested_by: "@human (2026-09-08): \"Can you check those out and see if they are already better than us, or can we compete\" — and \"do it\" on the seat's finding that none of them is on docs/research/competitors.md"
blocked_by: []
touches: [docs/research/competitors.md, docs/business/marketing.md]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## What was found (read 2026-09-08 on Juhos-MacBook-Pro.local; re-derive, registries move)

docs/research/competitors.md is dated August 2026 and names agentplane
as "the nearest architectural neighbour nputer has anywhere". It does
not mention any of these, read through the GitHub API on 2026-09-08:

| project | maker | stars | shape |
|---|---|---|---|
| obra/superpowers | Jesse Vincent, Prime Radiant | 282,947 | auto-triggering skills: brainstorm → worktree → plan → subagent per task with two-stage review → TDD → review → finish; official Claude and Codex plugin marketplaces; 14 harnesses; commercial support |
| open-gsd/gsd-core (gsd-build/get-shit-done archived at 64,580) | community, ex-TÂCHES | 9,217 | discuss → plan (researcher, planner, plan-checker) → execute in fresh-context waves → verify (verifier reads the executors' summaries; UAT walk) → ship; `.planning/` with PROJECT/REQUIREMENTS/ROADMAP/STATE.md; model profiles; cross-AI plan review |
| garrytan/gstack | Garry Tan, YC | 132,009 | 23 role skills: office hours (6 forcing questions), CEO/eng/design review, review, QA in a real browser, OWASP+STRIDE audit, ship, land-and-deploy, canary, retro, memory, freeze (one-directory edit lock) |
| defract (defract.dev) | a small company | app, open beta | desktop app, local-first, BYO Claude: story → HTML mockups → architecture → parallel worktree agents → review → release; pitches itself as "the app instead of a skills stack" |
| planwright.tools | a startup, org created 2026-05 | 7 | "planning and acceptance control plane" for teams shipping with coding agents; signed decisions; per-seat pricing |
| npm `superplan` | unknown | published 2026-05 | "contract compiler plus local mission-control board for Claude Code and Codex workers" |

`gh api repos/<owner>/<repo> --jq '.stargazers_count'` is the derive
command for every star figure; the shapes are read from each README.

The seat's reading at the sitting, to be CHECKED by this card rather
than transcribed: they are ahead as products (distribution, install,
breadth, ceremony), they have converged on nputer's structure
(file-based state, fresh-context seats, plans naming files and
criteria, non-overlapping waves, STATE.md and ROADMAP.md by name), and
the narrowed claim of conclusion 1 still excludes every one of them —
none has a verifier DENIED the builder's reasoning, none returns a
BINDING verdict, none enforces a fence at the WRITE, none keeps a
record with derivations and bands. Two things the map counted as ours
are not unique in kind: the planning interview (GSD's new-project,
gstack's office hours) and the fresh-context executor.

## Acceptance criteria

- WHEN the map is revised THE document SHALL gain a ring for the
  skills frameworks and the agent apps (the six above at minimum), each
  entry stating maker, license, star count WITH its derive command and
  read date, install form, harness count, and where it stops short of
  the narrowed claim — clause by clause, the way agentplane's entry
  does.
- WHEN conclusion 1 is re-checked THE document SHALL say, per project,
  which of the four clauses (different model · denied the builder's
  reasoning · binding · a file in the repo) it fails, or SHALL revise
  the claim if one passes all four — never leave the claim standing
  unchecked.
- WHEN the steal list is revised THE document SHALL name what these
  projects do that nputer does not (a quick path for small changes,
  auto-triggering skills, browser QA, a security audit, deploy and
  canary, retro, cross-session memory, per-agent model cost profiles,
  PR bodies from the plan, a UAT walk), each as a candidate for
  docs/VERSIONS.md's UNRULED section — filed there, not ruled here.
- WHEN marketing.md's positioning is touched THE change SHALL be
  limited to pointing at the map's new ring; the "why us" comparison
  is a separate decision (@human, 2026-09-08 sitting).
- The docs gate SHALL be run on both paths; no governing document
  moves under this card.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
