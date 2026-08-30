# Room: team enablement — several developers, one repo, one board

Opened 2026-08-30 at @human's request, from the question: *if we want
nputer team-enabled — several developers with access to the same repo
and board — how much does it change what we are building now? Can the
team features come later, so nputer works for enterprise as well?*

## The assessment (2026-08-30, integrator nputer-4e)

**It changes very little now, and the team features can come later** —
because the coordination substrate is already git-mediated files
(ADR-014 and the method's founding bet). The board is parsed from
docs/tasks/, lanes are worktrees, fences are committed manifests,
checkpoints and rooms are records. Git is a distributed multi-writer
system with merge semantics, so a second developer participates TODAY
in follower mode: pull, cut a worktree, work a card, commit — the
watcher sees files and nputer is never told. The follower-first
ruling (rooms/cockpit-or-mirror.md) covers humans on other machines
by the same argument that covers agents that exist only as apps.

**What is genuinely single-machine is one rule, not the system.** The
lane list — the fence system's live authority — derives from
`git worktree list`, which is MACHINE-scoped. On one machine, "the
lane list outranks the board's status" (lane-protocol rule 7) is
true; across two machines neither sees the other's worktrees. The
escape hatch already exists: the dispatch stamp (`status: building`,
committed to the integration branch BEFORE the lane is cut,
roles/orchestrator.md 5b) travels through git and IS a distributed
claim. Team mode inverts one sentence — across machines the COMMITTED
STAMP is the authority and the local lane list is advisory — plus a
pull-before-dispatch discipline the T-160 preflight could enforce
mechanically. The provenance format anticipated this: machine-scoped
readings already stamp `read on <host>`, and lane-protocol rule 4
already legislates naming every surface's scope; a team adds "fleet"
as a third named scope. Evolution of existing law, not a rewrite.

**The rest maps cleanly.** Live multi-party coordination (@mentions,
shared sessions, a daemon) IS F-05, already sequenced later — the
decomposition sitting is parked as T-165 with this room on its
agenda. Identity is already data (`builder:`/`verified_by:` plus git
authorship). Enterprise access control rides the git host (org
permissions, branch protection, CODEOWNERS) and should never be built
here. Enterprise audit is the method's NATIVE OUTPUT — append-only
records, provenance-stamped figures, committed verdicts — nothing to
add.

## The two door-keeping invariants (cost nothing, start now)

1. Every claim that must bind across seats lives in a COMMIT, never
   in local state — the committed-first law (T-154/T-160) read as a
   team property.
2. No new code path treats machine-local state as global truth
   without stamping its scope — lane-protocol rule 4's discipline,
   applied at review to every new card.

## Open questions — this room's to close

- **The authority inversion**: exactly which sentence(s) in
  lane-protocol rule 7 and the dispatch ritual flip when seats span
  machines, and what does the preflight check to enforce
  pull-before-dispatch? (The one real design tension found.)
- **Fleet scope**: what is the third scope's derivation — how does a
  seat on machine A ask "which fences are held anywhere", and is the
  answer a git read (stamps) alone or does F-05's daemon carry it?
- **Concurrent integrators**: today one integrator seat holds the
  ceremony; two humans merging concurrently resolve through push
  contention. Is that enough, or does the checkpoint ceremony need a
  claim of its own?

RESOLUTION: none yet. Feeds T-165's F-05 decomposition sitting; rule
changes land in method/lane-protocol.md and the dispatch bullet with
this room cited.
