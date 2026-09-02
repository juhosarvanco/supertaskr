# The third Fable sitting: the landing gate learns to derive the card, five lanes at the ceiling, and the guard refuses its own dispatcher

Checkpoint record, 2026-09-02, the architect seat (claude-fable-5-1), continuing the sitting whose first two records are 2026-09-02-the-first-fable-sitting-… and 2026-09-02-the-second-fable-sitting-…. Written at the checkpoint commit; every figure carries its ref.

## Merges since the second checkpoint (6cc3890)

| lane | base | tip | verdict | merge | census | graph | notes |
|---|---|---|---|---|---|---|---|
| T-219 (a fence that CONTAINS docs/tasks is refused) | d272558 | 518da9d | REJECTED at 1bfe8f1 (empty fence startable with no lane live), fix pass, APPROVED (4663271 on bench) | 64fed70 | REGEN 48,112→48,201 | regen: lib/parser | fence widened by fast path A at 52eea31 (+ lane-fence.spec.ts); the lane-side half written by the seat (room 16); card conflict resolved with the lane's copy |
| T-018-s5 (the picked reply's overtake guard) | 43e0fe8 | 943731d | APPROVED (2eadc6f on bench) | c7e177b | CURRENT | regen | two docs_watch.rs comments renamed by the integrator, disclosed; the triage WHEN clause was the seat's error, corrected on the card by the lane |
| T-215 (CONVENTIONS' lane bullet: eight limits, the residue named) | 42520e3 | 49f2e8c | APPROVED (b9db423 on bench) | c8f69aa | CURRENT | none | docs-only; nothing reads the paragraph (T-215-s1 dispatched to close that) |
| T-229-s4 (the ceiling checker reads the HOME) | e4cd6d4 | 339b8d3 | APPROVED (c1d8732 on bench) | 89c7e2b | CURRENT | regen: select-board.test.ts | the FIRST merge whose second parent is the lane branch moved to the verdict commit, so the landing gate derives the card (room 17); method evals 0/0 on the merged tree |
| T-219-s3 (the dead own-card carve-out arm removed) | a7cc65b | 7129d90 | APPROVED (051e29f+821608c on bench; merged via the lane branch moved to the verdict) | f6e3924 | CURRENT | CURRENT | thirteen fence spellings, none selects the arm; the re-added arm survives 54-for-54 (the finding); the removal closes a forged-manifest escape; T-219-s5 absorbed into the live T-215-s1 (both files held there) |
| T-238 (the holder on disk) | a03259f | 7705ac4 | APPROVED (5cc296e; merged via the lane branch at the verdict) | ed6474e | REGEN 48,363→50,248 (twenty names) | CURRENT | identity = nearest harness ancestor pid+start, one derivation with depth an output, stable across six spellings; liveness by `ps`; the four guard-surface bodies judge a fixture vantage; the seat TAKEN on disk at 06:53Z (pid 65005); five residues filed as T-238-s1 |
| T-018-s6 (the startup pull's overtake guard) | 838e74b | 35e7d2e | APPROVED (4c1744e on bench; merged via the lane branch at the verdict) | f2a3ed0 | CURRENT | regen: files ~3, edges +5 −1 | one lifted predicate for every door; M8: a copied rule reds the moment it drifts; the app rebuilt after the merge (room 18); a zero-clock pick reply now answers not-overtaken, unreachable in production, disclosed |
| T-215-s1 (the limits keeper, + T-219-s5's sites) | 838e74b | 8debbfe | APPROVED (e4da7b4; merged via the lane branch at the verdict) | 7264d21 | REGEN 48,201→48,363 | CURRENT | the count read off the HONEST LIMITS block by its delimiters; codes in the bullet; kill sets disjoint both ways; the bullet grew 852 bytes, disclosed; T-215-s6 dispatched for the fourth T-219-s5 ask |
| T-229-s6 (the eval fixture writable under the lane's modes) | fafb6a7 | 90e14bd | REJECTED at 5ff00ab (MF-07 copied its subject with cpSync and inherited the 444 mode — the plain run regressed under a method fence, invisible in the widened lane: room 19), fix pass, APPROVED (1be55b3) | d2702e4 | CURRENT | CURRENT | makeWritable walk adds the owner-write bit over all four copy calls; MF-07 arms its own replica and asserts every file; both eval arms 0 on the merged tree |

## Pushes and CI

| push | commits | battery | CI run | verdict |
|---|---|---|---|---|
| a7cc65b | checkpoint 2, T-120-s2/T-229-s4 stamp, T-219 merge, triage + T-219-s3 stamp | battery 13: 363/1131/639/575 | 33592388134 | success 05:09Z |
| 838e74b | T-018-s5 + T-215 merges, triage, T-215-s1/T-018-s6 stamp | battery 14: app RED once (stale dist after merging app sources — room 18), green after `npm run build`: 363/1135/639/575 | 33593644395 | success ~05:28Z |
| fafb6a7 | room 17/18 + STATE hazards, T-229-s4 merge, triage + T-229-s6 stamp | battery 15: 363/1135/639/575 | 33595266224 | success 05:52Z |
| fb2a944 | T-229-s6 widening, T-219-s3 merge, T-219-s5 absorb, T-225-s1 stamp | battery 16: 363/1135/639/575 | 33597260790 | success 06:20Z |
| 47c8845 | T-018-s6 merge, T-018-s7 triage, T-237-s3 stamp | battery 17: 363/1141/639/575 | 33598546665 | success 06:40Z |
| d2702e4 | room 19, T-215-s1 + T-229-s6 merges, T-215-s6 stamp | battery 18: e2e RED 576/577 — checkout-currency:953 (the arm-time sweep) missed a temporary worktree T-238's verifier registered in the shared list mid-run; re-run alone green; the token guard REFUSED the push, correctly | not pushed | superseded by 763548c |
| 763548c | T-238 merge, T-238-s1, T-230-s7 + T-237-s2 stamp | battery 19: 363/1141/639/597 | 33602096600 | in flight at this write; read it with `gh run view 33602096600` |

**The guard refused its own dispatcher at 05:08Z**: a push attempted while run 33592388134 was in flight was REFUSED by construction, naming the run and `NPUTER_CANCEL_CI` — T-237 working as built. The same refusal printed the landing-gate finding that became room item 17: every merge this sitting had taken the verifier's detached bench commit as its second parent, so no lane branch pointed at it and the gate allowed those merges UNJUDGED. The seat moved all eight lane branches to their verdict commits after the fact, and T-229-s4 was the first merge done the right way round.

## Dispatches this stretch

T-219-s3 (a7cc65b, the dead carve-out arm), T-215-s1 + T-018-s6 (838e74b, one stamp), T-229-s6 (fafb6a7, the eval fixture's modes; fence widened by fast path A at fd103b0 to the whole tools/method-evals tree, both halves the seat's, after the verifier measured no suite covers fixture-root.mjs), T-225-s1 (fb2a944, the margin's OVER sentence), T-237-s3 (47c8845, the workflow keeper). T-219-s5 was absorbed into the live T-215-s1 by a card amendment written into both copies (the third fast-path-A this stretch). Two lanes cut serially each time (room 15 kept).

## Triage at the stamps

- T-219-s2/s3/s4: s3 dispatched p2; s4 planned p3 absorbing s2 (unresolvable and bare-dot fences).
- T-018-s6 dispatched p3; T-215-s1 dispatched p2 absorbing s3 and s5 with the fence widened to CONVENTIONS; T-215-s2 planned p3 behind T-219-s3; T-225-s2 absorbs T-215-s4 at p2 (fence + brief.mjs).
- T-229-s6 dispatched p3; T-229-s8 planned p4 absorbing s7.
- T-120-s2 promoted p11 → p2 (the e2e-seconds breach is the band that grows); it runs alone on tools/e2e in the first quiet window.
- T-229-s2 closed by the integrator's write (v0.1.9 at ARCHITECTURE.md:28, C-01-method.md:9).

## Environment

- Worktrees removed after merge: T-219 (+V), T-018-s5 (+V), T-215 (+V), T-229-s4 (+V).
- Stray f.txt ("one") and g.txt ("two"), 4 bytes each, mtime Sep 2 01:13 local, at the repo root, untracked and not ignored — not the seat's; two verifiers named them; left for @human.
- Every push through the CI-reading guard waited for the in-flight run.

## Seat metrics (tokens, minutes)

T-219: exec 495K/~65m over three passes, ver 311K. T-018-s5: exec 230K/42m, ver 189K/19m. T-215: exec 293K/79m, ver 278K (+ one stall on its own background monitor). T-229-s4: exec 192K/38m, ver 279K/41m. T-219-s3: exec 242K/45m. Phase-1 stamps 131K–210K each.

## Where the seat was wrong this stretch

- T-018-s5's triage WHEN clause named the already-safe interleaving (caught by the blind verifier before any diff).
- "The spec is free now" in T-219-s3's covering message: T-215-s1 already held it.
- Merged app sources without rebuilding the app before the battery (room 18).
- Seven merges with a detached second parent, unjudged by the landing gate (room 17).
- Fast path A's lane-side half sent as an instruction (room 16).

## Gates at this checkpoint (763548c, the pushed tree)

- HEALTH BANDS, over battery 19's own runner captures: at the pushed tree 763548c `health-bands: 14 band(s) — 5 inside, 2 drifting, 2 BREACHED, 1 unread, 4 UNKEPT` — the second breach was `docs-headroom/docs/STATE.md` (STATE at 8,421 bytes against an 8,465 warn line after the room-17/18 hazards landed, ROADMAP drifting at 12,131 against 12,252); content moved to this record and both were trimmed in this commit, after which the same readings give `health-bands: 14 band(s) — 5 inside, 2 drifting, 2 BREACHED, 1 unread, 4 UNKEPT` (the remaining drifts are STATE's headroom at 7,903 bytes, ROADMAP's, and triage/net-arrivals — this sitting filed cards faster than the window's line) `suite/e2e-seconds` is still the breach (the e2e leg read 597 passed (9.3m), 597 bodies after T-238's twenty); T-120-s2 at priority 2 is the remedy and runs alone on tools/e2e in the first quiet window. Designed non-zero; never read as clean.
- BOOT GATE: `NPUTER_BOOT_PORT=16001 npm run boot:check` from tools/e2e exit 0, both `[nputer]` lines, run after the T-018-s6 app merge.
- GRAPH: `index --check` CURRENT (2,504 symbols, 2,395 edges after the T-018-s6 regeneration).
- CENSUS: docs/CAPABILITIES.md CURRENT at 50,248 bytes (regenerated in three merge commits this stretch: T-219 one name, T-215-s1 three, T-238 twenty).
- THE SEAT: `.nputer/holder.json` records this session (pid 65005, started 23:52:34) since 06:53Z, taken with the arm T-238 built.
- STATE regenerated in this commit; ROADMAP's F-02 and F-06 sentences appended.

## Next, with the reasoning

Live at this write: T-225-s1 (the margin's OVER arm), T-237-s3 (verifying), T-215-s6 (which arm answers a card), T-230-s7 (the quote arm's four residuals), T-237-s2 (the push guard's three residuals). Then: T-120-s2 alone on tools/e2e as soon as those five land (every battery pays nine minutes for the e2e leg); T-239 (the dispatch arm — it now owns room items 6, 13, 14, 15, 16 and 17) after T-225-s1 frees dispatch-brief.mjs; T-225-s2 (the `--full` and `--task` arms past the buffer, p2); T-219-s4, T-229-s8, T-018-s7, T-238-s1. Held for @human: T-229-s3 (a real model-in-loop runner), the stray f.txt/g.txt, and the room.
