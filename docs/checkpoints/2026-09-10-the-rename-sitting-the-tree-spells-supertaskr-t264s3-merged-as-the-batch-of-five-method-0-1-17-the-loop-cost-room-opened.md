# Checkpoint: the rename sitting — the repository, the directory and the living tree spell supertaskr; T-264-s3 merged as the batch of five; method 0.1.17; the loop-cost room opened beside the superpowers reading

Date: 2026-09-10 · Seat: the architect (Claude Fable 5.1 in the Claude desktop app) · Previous record: 2026-09-09-the-third-sitting-….md

## What happened, in order

1. **The pause.** After T-285, T-280 and T-287 merged on 2026-09-09 (three merges, two of them approved with assigned corrections, the third after a rejection and a fix pass) and CI read green on 10f3676, the tree was quiet: no lane, no bench, no battery. The seat deleted the judged lane branches, removed four stale worktrees (arch-verify, V-s2-A, two under .claude/worktrees) and, at @human's ask, 24 scratch folders under Projects (about 14 GB; one held a two-commit fixture, nothing of the project).
2. **@human's two acts.** The GitHub repository renamed to juhosarvanco/supertaskr; the directory to supertaskr and the app checkout to supertaskr-app (the app stopped first).
3. **The seat's repair.** The remote re-pointed and fetched; the app checkout's worktree link repaired; the seat's memory copied to the renamed project's key with the push spelling updated; the instruments (the ledger, the merge ritual, the CI watch, the battery, the ask watcher) moved to the new scratchpad with paths rewritten; the census taken: 318 occurrences of the old name in 55 living files, records excluded.
4. **The batch lane.** T-264-s3 promoted to planned p1 as the class parent, absorbing T-264-s2, T-265-s1, T-265-s3 and T-269 with their criteria kept whole (ruling B of the backlog review); a first amendment commit half-applied because the seat committed on a crashed script's exit — reset before anything was pushed and redone with the exit checked; two CENSUS findings on the card's own order paragraph discharged by a dated PREFLIGHT RULING. Dispatched through the arm — which cut the lane at the OLD worktree spelling, because that spelling lives in CONVENTIONS' lane bullet and was one of the things the lane renamed. One ask, granted by fast path A during the lane: the component file C-07's name (bytes renamed by T-264, the name not).
5. **The bench.** Phase 1 tool-less at the base (27,624 chars, 14 ground asks answered by a script-taken addendum of 176 KB); phase 2 at the tip: APPROVED WITH ASSIGNED CORRECTIONS — cargo build green at all nine commits in a shared clone; the arm proven to parse the bullet, not restate it; the four living file names moved as renames with history; zero homoglyphs over 1,440 tracked text files; one correction with a mutant block (the token scan's CONTROL check derived from the tree) and one wording correction (the design handoff's heading says re-spelled, not verbatim).
6. **The merge** 2f1b0bf8: the census 318/55 → 46/10, every survivor held by a named ruling; the method bump 0.1.16 → 0.1.17 (the runtime template supertaskr.yaml, planner.md); the corrections re-drilled; the graph and census regenerated. The bump's pin test first failed on a build cache that still named the pre-rename directory in fifteen dependency build-script outputs — cleared; recorded as a hazard below. Battery84 on the merge: 4 of 4 legs green (e2e 845 bodies); pushed; this record's commit follows on the same tree and owes battery85. At this checkpoint: the boot gate boot exit=0, health health exit=3 (3 is designed while bands await keepers).
7. **The loop-cost room.** @human's question of 2026-09-09 ("would not pass the elite professional software developer test") measured: two size-S cycles of 2.5 h and 3.5 h, ~520K subagent tokens, a 61K-token standing read. The superpowers library (obra, b36e082) read end to end by a research seat from a pinned read-only clone at @human's approval; the record is docs/research/superpowers-loop-b36e082.md. The room docs/rooms/loop-cost-and-speed.md holds the comparison, the proposed process in its final form (three tiers, eight stages, budgets), decisions A–H and four amendments (phase 1 kept in the standard tier; Opus 5 for every subagent role by default with the model per role in the runtime template; regenerations by the arm at the merge; the whole suite nightly and at every checkpoint). Awaiting @human's ruling.
8. **The public repository.** @human asked how a public repo without the development records is achieved and about personal content in the records (an older product name, the owner's name, quotes, rapid decisions). The seat's assessment: the repository is private today; history, not files, is the exposure; the model that fits is a history cut — a curated squashed first commit at the launch tag, open development from then on, a forbidden-content keeper in CI, records written for an audience, a public commit identity — to be opened as its own room with the license and cadence decisions.

## Measured

| Figure | Value | Derive |
|---|---|---|
| The old name in the living tree, before / after | 318 in 55 files / 46 in 10 | `git grep -io nputer -- . ':!docs/checkpoints' ':!docs/rooms' ':!docs/tasks' ':!docs/decisions' ':!docs/research' \| wc -l` |
| Survivors, all held by a ruling | 16 lines in five classes + 14 in the scan's two self-excluded files | the keeper's table in tools/e2e/scripts/rename-scan.mjs |
| Method version | 0.1.17 | `grep -o 'currently v0\.1\.[0-9]*' docs/CONVENTIONS.md` |
| The lane's subagent tokens | executor ~351K, phase 1 ~53K, phase 2 ~351K | the notifications' meters |
| Suites at the merge tip | parser 389 / app 1171 / rust 655 / e2e 845 | battery84 |

## Hazards this sitting adds (the mechanism goes to STATE, the instance stays here)

- After a directory rename, cargo's dependency build-script outputs keep the old absolute path; `cargo clean -p <crate>` does not reach them. Remove `target/debug/build/<name>-*` for every `output` that names the old path, plus its fingerprint. Every checkout under the moved directory needs it, the human's app checkout included.
- The arm spells the lane path from CONVENTIONS' bullet at dispatch time: a lane that renames that spelling is cut at the old one, and the seat's merge ritual must be told the actual worktree path.
- A verifier's whole-suite run is at the executor's tip; its own correction body lands after it. The integrator's closing battery is the first whole run over that body — which is what caught the T-287 comment.
- A script that commits after a heredoc interpreter crashed commits a half-applied change; check the interpreter's exit before `git add`.

## Open, for @human

The loop-cost room (A–H as amended); the public-repository room (the history cut, the license, the cadence, the record conventions); T-266's items outside the repository (the npm placeholder, the domain, the mark, the App Store name); the pruning sitting; T-290 after T-287-s1 (a directory token with nothing under it cannot be reserved).
