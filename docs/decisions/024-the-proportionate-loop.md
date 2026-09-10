# ADR-024: the loop is proportionate — three tiers chosen by the arm, one standing read, the arm merges, and the whole suite runs on a clock

Date: 2026-09-10 · Status: accepted · Decided in: docs/rooms/loop-cost-and-speed.md (@human: "Rule the loop room, A to I as amended: yes"; "Universality as a v1 acceptance criterion: yes") · Amends: the verifier's whole-run rule (T-262), the integrator's ritual, CLAUDE.md's reading order, the bench as two spawns for every card

## Context

Measured on 2026-09-09: a size-S card took 2.5 to 3.5 hours from dispatch to CI green and about 520K subagent tokens, with the build a fifth to a third of the cycle; every seat read 242,673 bytes of governing documents before working. The superpowers library, read end to end at b36e082, runs a proportionate process at 1.4K standing tokens and no fixed floor, and enforces nothing. The room ruled which of our fixed costs go and which keepers stay.

## Decision

1. **Three tiers, chosen by the arm from the card, never by judgment.** Bounded (XS inside a tracked fence, no guard-class path, no method text, a keeper already pinning the property): one executor, the keeper scoped, no bench. Standard (S and M outside guard-class and method text): the executor, phase 1 spawned by the arm beside the build, one verifier at the tip reading the diff before the notes with the rubric and data mutants. Guarded (any card touching hooks, gates, fences, the parser, the push and gate scripts or method text; every L): the blind two-phase bench with the seat's ground asks and the whole suites. Budgets: 20 min/80K, 75 min/310K, 100 min/450K. The guard-class path list is kept by a test; a diff that outgrows its size is bumped at merge.
2. **One standing read.** Every seat reads STATE and a one-line index of ROADMAP, ARCHITECTURE, CONVENTIONS and CAPABILITIES; everything else arrives through the pack.
3. **The arm merges; the seat rules and never edits code or method text.** The ritual, the corrections from the verdict's blocks, the re-drill scoped to the fix, the regenerations, the bump when method text moved, the cheap keepers (pinned-sentence, forbidden-content, secret and diff-size checks; the preflight on the card; the keeper green at the base before dispatch; meters into the bands) and the message are the arm's; returns to the seat are files and a line count.
4. **The whole suite runs on a clock, not per push.** The push, the bench (standard tier) and CI owe the range's owed set; the whole four suites run at every checkpoint and nightly in CI, a red there filed against the merge that caused it.
5. **Opus 5 for every subagent role by default**; the model per role is read from the runtime template and is the user's to change.
6. **The process is settings.** Profiles and switches in the runtime template's process section, rendered by the CLI, the app and the skill from one schema, with constraints and the project's measured costs.
7. **Universality is a v1 acceptance criterion.** Every mechanism reads its configuration from the runtime template; the CLI packages the scripts and hooks and the genesis installs them; a project that is not supertaskr, in another language, is taken through a whole card by the loop before v1 is called.

## Consequences

The bands (T-297) hold the budgets and are read at every checkpoint; a tier whose rejection rate falls to zero while CI reds rise is read as a soft verifier. The fence, the keeper specs, data mutants, the owed-set token and guard, the landing gate, the docs gate, the method stamp and the records stay by name. The cards land in the room's order: T-293, T-294, T-295, T-296, T-297, T-298, T-299–T-302, T-303, T-304.
