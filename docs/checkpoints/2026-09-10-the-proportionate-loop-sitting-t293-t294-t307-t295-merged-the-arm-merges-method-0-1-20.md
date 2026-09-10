# Checkpoint: the proportionate-loop sitting — T-293, T-294, T-307 and T-295 merged; the standing read, CI in fifteen minutes, propose before recording, the arm merges; method 0.1.20; the loop and public-repository rooms ruled

Date: 2026-09-10 · Seat: the architect (Claude Fable 5.1 in the Claude desktop app) · Previous record: 2026-09-10-the-rename-sitting-….md

## What happened, in order

1. **The rulings.** The owner ruled the loop room A to I as amended and universality as a v1 acceptance criterion (ADR-024, the proportionate loop: three tiers, one standing read, the arm merges, the whole suite on a clock, Opus 5 for every subagent role, the process as settings, universality); thirteen cards filed in the order of landing (T-293 to T-305); the foundation-files standard ruled A to D (ADR-023); the public-repository room opened and ruled B to F (one local repository, the development branch with a backstage folder and an exclusion manifest, release commits from the v1 initial commit, a beta tag before the checklist; the license decided at the first cut; D open); a new rule endorsed and made method: the seat proposes a room or decision entry verbatim before recording it and appends only on a yes, entries paraphrase and date rulings and never quote the owner (T-307). The pruning sitting (T-306) parked with its wake on T-296 — the owner: keep going, no pass sooner.
2. **T-293 merged (c33052c4, method 0.1.18)** — the standing read is STATE plus a generated docs/INDEX.md; CLAUDE.md's five-document order retired; adapters name no docs paths. Its verdict's block was indented past the merge reader and drilled by hand (the fault T-295 lifts).
3. **T-294 merged (ed94c212)** — CI is a seven-job graph on the owed set (owed, checks, parser, app, native, four e2e shards, nightly-finding); concurrency group is the commit; the in-flight refusal retired; a records-only push grades in about four minutes, a code push in about fifteen. Shard 4 red once on the brief-flush margin guard (T-294-s5).
4. **T-307 merged (15ab5fa5, method 0.1.19)** — orchestrator.md 8b, ROOM-FORMAT.md and the decision template state the propose-before-recording rule once each; MF-11 holds it over entries dated on or after 2026-09-11 with the names derived from the repository's own commit identities; two assigned corrections (the quotation ceiling, the at-sign handle) re-drilled at the merge; CONVENTIONS gained the pointer bullet.
5. **T-295 merged (c0448568, method 0.1.20)** — `brief.mjs --merge <id>` performs the integrator's ritual in nineteen steps and stops with the merge staged; the widening on main ahead of the merge; corrections as each block's `old` text where the tree carries `new`; the re-drill; the bump as an explicit dial; the four cheap keepers; the message from the verdict's sentences; the two `## Meters` blocks appended to docs/checkpoints/meters.jsonl (the file begins at this merge). Five assigned corrections applied and re-drilled. The executor stamped before reading the seat's answers to its two asks (both answered in the file before the stamp); a fresh executor applied the granted remedy and re-stamped. The verifier measured that the verb refuses its own merge at the forbidden-spelling keeper on its own committed fixtures (T-295-s4) — this was the last merge by the seat's hand ritual.
6. **The rename's aftermath closed** — CI green on the runner since the ruling tip; the T-307 lane branch deleted on green; 182 merged lane branches from T-010 onward still stand locally (for the pruning sitting).
7. **The next lane.** T-296 (the three tiers) dispatched at 9dc05597 with merge.mjs and merge.spec.ts widened into its fence for criterion 4's second half; its own classifier would call it guarded, so it gets the blind two-spawn bench by the seat's hand for the last time; its executor asked at the start for the flush guard spec (a new `--bench` arm needs a NOT_AN_ARM entry) and the fence was widened again by fast path A at c4516354; phase 1 returned a 47K-character set with sixteen ground asks, taken at the base by script and sealed with the ground.

## Measured

| Figure | Value | Derive |
|---|---|---|
| Method version | 0.1.20 | `grep -o 'currently v0\.1\.[0-9]*' docs/CONVENTIONS.md` |
| Suites at the T-295 merge tip (the closing check) | parser 389 / app 1171 / rust 655 / e2e 896; the checkpoint's whole e2e run 896 passed (12.8m) | `.supertaskr/gate-verdict.json` at c0448568 |
| CI on the T-307 merge | green, 9 jobs, 14.5 min (run 34501862834) | `gh run list --commit 15ab5fa5` |
| Readings in docs/checkpoints/meters.jsonl | 2 (T-295: executor, verifier) | `wc -l docs/checkpoints/meters.jsonl` |
| Cards on the board | done 285 · planned 154 (+1 building) · parked 131 · suggested 160 | `brief.mjs --state` |
| Suggested cards filed this sitting | T-293-s4..s6, T-294-s1..s5, T-307-s1..s7, T-295-s1..s6, T-280-s1 corroboration | `git log --diff-filter=A --name-only -- docs/tasks` |
| The T-295 lane | executor about 477K tokens over 4 h 30 min (the report), the resumed executor 92K / 19 min, phase 2 326K / 32 min | the notifications' meters; the readings file |
| The T-307 lane | executor 309K / 90 min, phase 1 50K / 2 min, phase 2 302K / 45 min | the notifications' meters |
| The T-293 and T-294 lanes | phase 1 54K and 52K; T-293's fix pass 240K; phase 2 333K and 310K; the executors' figures are in the earlier window's notifications, not this ledger | the notifications' meters |

## Merge

Four merges, each `--no-ff --no-commit` through the seat's ritual after the lane branch moved to the bench tip; each range's fence proved disjoint from every live lane at dispatch (T-295 and T-307 ran beside each other with disjoint fences; T-295's second ask widened brief-flush.spec.ts in on main at 9e34aaec, T-307's fence widened for the verifier's bodies at a9206644). The T-295 dry-run merge into main before the ritual: clean, no conflict.

## Gates

GRAPH REGEN — owed at T-307 and T-295 by the bump (kit.rs moved): regen exit 0, `index --check` CURRENT (1,198,942 bytes, 201 files, 2561 symbols, 2453 edges, 55.9 % of budget) after each; the dogfood pins 18 passed over 2 files each time; graph-budget-bench exit 0. BOOT GATE — not owed (nothing under app/src or the manifests moved). DOCS GATE — FIRES at every merge (9 to 11 paths under docs/ are code inputs), the four governing budgets holding, every live card's frontmatter parsing. METHOD EVAL GATE — exit 0 over 11 evals at T-307 and T-295 (integrator.md moved). METHOD STAMP — 0.1.18 → 0.1.19 (T-307) → 0.1.20 (T-295), the pin test 16 passed and the half-bump red by name each time.

GRAPH, asked LAST: [supertaskr-index] graph.json is CURRENT - ../../docs/architecture/graph.json matches a fresh index (1198942 bytes, 201 files, 2561 symbols, 2453 edges) [supertaskr-index]   budget:      1198942 of 2145959 bytes (55.9%) - 947017 left

HEALTH BANDS: `npm run health -- --readings <the checkpoint's captured output>` — health-bands: 14 band(s) — 3 inside, 2 drifting, 5 BREACHED, 0 unread, 4 UNKEPT; exit 3 (the designed 3 while bands await keepers; the three readings-authority bands read this time: the graph's budget line, cargo test's lib.rs run, the whole e2e's summary 896 passed (12.8m))

## Suites

The closing checks in T-280's form (`gate-run.mjs --owed-set --range origin/main..HEAD`): T-307's range at 15ab5fa5 parser 389 / app 1171 / rust 655 / e2e 870, every leg exit 0; T-295's range at c0448568 parser 389 / app 1171 / rust 655 / e2e 896, every leg exit 0. The verifier's range form at T-295's tip 9331fbc8: 389 / 1171 / 655 / 890. merge.spec.ts 26 passed with the corrections.

## Board

Movements at this ref: T-293, T-294, T-307, T-295 to done; T-296 to building (the dispatch stamp); T-306 parked with wake T-296; T-266 parked with wake 2026-10-01; the thirteen loop cards planned; nineteen suggested cards arrived (listed above). Nothing arrived outside the merges' ranges except the seat's records.

## Environment

At the checkpoint's clock: worktrees — the integration checkout on main, the app checkout detached on purpose, the T-296 lane at ../supertaskr-T-296 (port 15296) and its bench ../supertaskr-V-T-296 at the base (port 25296); the human's app on 1420 not running; the ask watcher armed on the live lanes.

## What the brief got wrong

- **The card's own criterion**: T-295's criterion 2 said the verb applies each correction's `new` text; the drill's precondition settles the opposite — a block's `old` text is the correction. Ruled in the ask file; the card was not rewritten.
- **The executor's report as a file**: the T-295 executor said the harness refused to write its report; the seat saved the message as the report the verifier reads.
- **An ask filed after the closing battery lands after the stamp**: the executor ended by protocol; the seat's grant went unread until a fresh spawn applied it (memory note; no method change).
- **The seat's own relay**: the seat told T-307's verifier that brief.spec.ts's role row pins a sentence orchestrator.md carries; it does not (the verifier measured it).

## Metrics (ADR-020)

- Rework cycles: T-293 one fix pass (positive controls) then approved with corrections; T-294 approved with six corrections; T-307 approved with two; T-295 approved with five after one resumed executor — no rejection this sitting.
- Tokens: T-307 — executor 308,847, phase 1 49,975, phase 2 302,003, sum about 661K; T-295 — executor 476,627 + 91,819 (resumed), phase 1 in the earlier window's notification, phase 2 326,477, sum about 895K plus phase 1; T-293 — phase 1 53,869, fix pass 239,663, phase 2 332,587 plus the executor; T-294 — phase 1 51,506, phase 2 310,331 plus the executor. The integrating seat is this session.
- Gate runtime: the T-307 closing check about 15 min (owed set, four legs); the T-295 closing check about 14 min; the T-307 CI run 14.5 min; the merge rituals about 20 min each by hand (T-295's the last).
- Cold start: this session is the same seat continued across a context compaction (no model switch); the compaction summary carried the state and the session resumed the T-307 merge at the step it stopped without asking; one gap: the phase 1 prompt shape had to be recovered from the transcript because no scratch file held it — a documentation bug the arm's rendering (T-296) closes.
- Drift incidents: 0.
