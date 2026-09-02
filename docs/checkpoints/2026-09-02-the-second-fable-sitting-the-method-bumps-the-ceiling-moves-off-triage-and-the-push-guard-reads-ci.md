# The second Fable sitting: the method bumps, the ceiling moves off triage, and five lanes run at the ceiling

Checkpoint record, 2026-09-02, the architect seat (claude-fable-5-1), continuing the sitting whose first record is 2026-09-02-the-first-fable-sitting-…md. Written at the checkpoint commit (the commit whose subject opens `Checkpoint:` and carries this file); every figure carries its ref.

## Merges since the last checkpoint (4a9c68c)

| lane | base | tip | verdict | merge | census | graph | notes |
|---|---|---|---|---|---|---|---|
| T-229 (method v0.1.9 + 4 riders) | 179a7cc | 8def123 | APPROVED (0609951 on bench, merged as 2nd parent) | d641846 | CURRENT 45,968 | regen: kit.rs hash | card conflict resolved with the lane's copy (identical rider); one body name corrected at the merge (session-economics:365) |
| T-236-s1 (Rust brief reads by label) | 80ab11c | 8508b88 | APPROVED (fe26937 on bench, merged as 2nd parent) | 6caac6a | CURRENT | regen: brief.rs symbols 2499→2501 | rust 630 passed (lane counted ignored as 634) |
| T-225 (dispatch byte ceiling) | 5f193e6 | e086e1c | REJECTED at b5d015b on F1 (race asserted), fix pass f16f019, re-verified APPROVED | 7435eae | REGEN 45,968→46,543 (six names) | CURRENT | re-verdict folded from the bench copy byte-identical; T-225-s5 absorbed by the fix pass |
| T-230-s3 (quote arm: frontmatter scalars, escape, floor count) | f5bad14 | db7e04d | APPROVED (c06ecb0+bd27eb2 on bench, merged as 2nd parent) | 6ccfda4 | REGEN 46,543→46,946 (five names) | CURRENT | lane's e2e red proved the base's both ways (T-236-s5's cut after the base); T-230-s11 filed by the verifier; drill copy nd-T-230-s3 removed with the lane |
| T-237 (push guard reads CI) | 977697b | d0f04dc | APPROVED (75d2c6e on branch verdict/T-237 in the bench, merged as 2nd parent) | 44a95c3 | REGEN 46,946→48,112 (fifteen names) | CURRENT | the lane's security sweep found and fixed a bare-revision headSha in its own diff; verifier filed T-237-s6 (refspec push asks about HEAD's branch); from here a push during an in-flight run is refused by construction |

| T-018-s2 (picker-rearm pin) | 69a8477 | 4e85b4d | APPROVED (3f7b43b+a4cca53 on bench; blindness DISCIPLINE-shaped) | ba764b2 | CURRENT | regen: docs_watch.rs hash | both hunks inside mod tests; the overtake admitted as designed; T-018-s5 (frontend consequence) and T-240 filed |
| T-236-s5 (row 4's three spellings by label, marker refuses on absence) | 69a8477 | b0d84eb | APPROVED (8bb2f46 on bench) | 3130bb8 | CURRENT | regen: brief.rs + arch_cmd.rs, edges +1 −1 | Path moved under cfg(test) (used at :225 — the trap the verifier stamped); cargo build zero warnings |

## Pushes and CI

| push | commits | battery | CI run | verdict |
|---|---|---|---|---|
| 37ac590 | (previous record) | | 33577276465 | success 01:13Z |
| d641846 | 6 (T-229 merge, T-230-s7, stamps, room 14) | battery 8: 349/1131/632/548 | 33581362016 | success 02:15Z |
| bfc879c | 9 (T-236-s1 merge, triage ×2, wave-4 stamp, room 15) | battery 9: 349/1131/634/548 | 33583149402 | success 02:43Z |
| d272558 | 8 (T-225 merge, triage, T-219 stamp) | battery 10: 349/1131/634/554 | 33584858300 | success 03:10Z |
| 7203db8 | T-230-s3 + T-237 merges, triage ×2, T-215 stamp | battery 11: 349/1131/634/574 | 33586598985 | success 03:38Z — the first push through the CI-reading guard |
| 43e0fe8 | T-018-s2 + T-236-s5 merges, T-219 widening, T-229-s2 close, room 16, T-018-s5/T-238 stamp | battery 12: 349/1131/639/574 | 33588471069 | in flight at this write; read it with `gh run view 33588471069` |

## Dispatches

- Wave 4 (one stamp 69a8477): T-018-s2 (docs_watch.rs, p2) and T-236-s5 (brief.rs + arch_cmd.rs, absorbing s6/s7). Both lanes cut before either was armed → both write-fence REFUSED on the other's missing manifest; serialised (room 15).
- T-219 (d272558, amended once: the card lacked `verifier:`/`review:` keys and a guard-class card is dispatched `review: independent` at the stamp).

## Triage at the stamps

- T-230-s8..s11: T-230-s7 promoted p2 M with its fence CORRECTED (brief.mjs named zero occurrences of the reader; card-preflight.mjs holds it — T-230-s10, the executor's finding), absorbing s8 (disclosure asserted against itself), s9 (six unescaped display sites, raise() subjects stay raw), s10, s11 (inline-comment strip); the wrap figure is estimator-dependent (2,386/364 vs 2,345/363).
- T-215 dispatched (42520e3) after an audit that first read the quoted sentences as absent — the compaction re-wrapped them; the limit is still published.

- T-229-s1..s5: s4 planned p3 absorbing s1 (ceiling checker reads the HOME; lane-protocol pointer), s2 planned as the integrator's checkpoint write (v0.1.8 → v0.1.9 at ARCHITECTURE.md:28, C-01-method.md:9), s3 held for @human (a model-in-loop runner spends tokens: model and budget per bump are rulings), s5 held.
- T-236-s5 planned p3 absorbing s6 (unused Path import — used in cfg(test) at :225, the trap) and s7 (lookbehind unpinned).
- T-230-s7 filed from V-T-230-s3's ground truth (wrapped quoted runs invisible: 2,386 runs on 364 of 448 cards).
- T-225-s1 planned p3 absorbing s3; s2 planned M p3; s4 the integrator's checkpoint write (CONVENTIONS/STATE send a seat to `--dispatch` for triage; it is `--full` now); s5 absorbed by the fix pass.
- Seventeen held promotions applied (the byte ceiling no longer binds): --dispatch 32,357 bytes, --full 101,063 at ae41f78; 118 planned, 3 suggested.

## Triage at T-237's stamp

- T-237-s1 the integrator's checkpoint write (the two bullets are arms now; NPUTER_CANCEL_CI); s2 planned p3 absorbing s4 (timeout unmeasured) and s6 (refspec target) behind T-238; s3 (workflow-parity keeper) and s5 (argv-option siblings in card-preflight/dispatch-brief) planned p3.

- T-229-s2 closed by the integrator's write (v0.1.9 at ARCHITECTURE.md:28 and C-01-method.md:9).
- T-219's fence widened by fast path A at 52eea31 (+ lane-fence.spec.ts) after its verifier measured two fixtures redding under a correct refusal; the executor had already routed them as T-219-s1, absorbed in the fence pass.

- T-018-s5 planned p2 (then dispatched with T-238 at a03259f; re-cut at 43e0fe8 after its preflight read the other lane's fence path as a criterion path); T-240 absorbed into T-238.

## Environment

- Worktrees removed after merge: nputer-T-229, V-T-229, nputer-T-236-s1, V-T-236-s1, nputer-T-225, V-T-225 (bench --force, only dirt the folded card).
- Stray untracked f.txt, g.txt at the repo root (present since the first record; not the seat's; left).
- Detached non-lane worktrees on the machine named stale by the sweep: nd-T-140-s4, nd-T-230-s3 (the lane's own drill copy, left standing by its executor), arch-verify, nputer-app (on purpose), V-s2-A, two .claude/worktrees.

## Seat metrics (tokens, minutes)

- T-229: exec 355K/55m, ver 354K/22m(+phase 1). T-236-s1: exec 296K/33m, ver 215K/27m. T-225: exec ~465K incl. fix pass, ver 375K+397K. T-230-s3: exec 352K/47m. T-237: exec 425K/91m. Phase-1 stamps: 131K–242K each.

## Hazards met

- perl frontmatter stamps assume keys exist: T-229 and T-225 carried no built_by/verified_by, T-219 no verifier/review — three cards, three silent no-ops caught by reading back.
- zsh: `${pipestatus[1]}` not PIPESTATUS.
- A verifier's phase-2 dispatch necessarily carries executor-derived specifics; every verifier this sitting named its blindness as clock-shaped except V-T-018-s2 (discipline-shaped: lane scratch filenames seen, none opened).

## Gates at this checkpoint (43e0fe8, the pushed tree)

- HEALTH BANDS, over battery 12's own runner captures: `health-bands: 14 band(s) — 8 inside, 0 drifting, 1 BREACHED, 1 unread, 4 UNKEPT`. The breach is `suite/e2e-seconds` again (drift at 234, breach at 312; the e2e leg read 574 passed (9.2m)) — it grew with every guard card this sitting and T-120-s2 (the browser/no-browser split, room item 2) is the remedy; the four UNKEPT and one unread bands await their keepers (T-156-s1/s2). Designed non-zero; never read as clean.
- BOOT GATE: `NPUTER_BOOT_PORT=16001 npm run boot:check` from tools/e2e exit 0, both `[nputer]` lines (project folder /Users/ujju/Projects/nputer, window "main" created).
- GRAPH: `index --check` CURRENT after the T-236-s5 regeneration (1,167,986 bytes, 200 files, 2,501 symbols, 2,388 edges).
- CENSUS: docs/CAPABILITIES.md CURRENT at 48,112 bytes (regenerated in four merge commits this sitting: T-225 six names, T-230-s3 five, T-237 fifteen).
- STATE regenerated from the template's contract, ROADMAP's F-02 and F-06 sentences appended, CONVENTIONS' two CI bullets and its triage sentence amended (T-237-s1 and T-225-s4 close in this commit).

## Next, with the reasoning

Live at this write: T-219 (fence pass after the widening), T-215 (CONVENTIONS' lane bullet), T-238 (the holder on disk, M), T-018-s5 (the picked reply's overtake guard). Then, as fences free: T-239 (the dispatch arm — after T-238 on brief.mjs, and it owns items 6, 13, 14, 15 and 16 of the room), T-230-s7 (four residuals of the quote arm, M), T-229-s4 (the ceiling's home), T-225-s1 (the margin's OVER sentence), T-237-s2 (three push-guard residuals, after T-238), T-237-s3, T-237-s5, T-120-s2 (the e2e split — promote it: the e2e-seconds breach is the one band that grows with every merge). Held for @human: T-229-s3 (a real model-in-loop runner spends tokens), the room itself.

## Where the seat was wrong this sitting, named

- Relayed facts: brief.mjs named for card-preflight.mjs's call sites (T-230-s3); three setup lines abbreviated (item 11); T-018-s5's triage WHEN clause named the already-safe interleaving (the verifier's ground truth caught it before any diff); T-215's audit first read the quoted sentences as absent because the compaction re-wrapped them.
- Ritual: two lanes cut before either was armed (item 15); fast path A's lane-side half sent as an instruction instead of written (item 16); a guard-class card stamped without `review: independent` because the key was absent (T-219, amended before any seat spawned).
