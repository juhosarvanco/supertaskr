# Checkpoint: the night sitting of 2026-09-09 — under @human's night mandate the seat merged T-219-s6, T-205-s1, T-153-s3, T-205-s4, T-223-s4, T-112-s5 and T-229-s10, rejected T-244 once and re-verified its fix pass, cut T-241, T-167-s13 and the rest, pushed four times with CI green twice and red twice on a full runner disk

## Merge

@human's words at bedtime: *"keep dispatching, I'm heading to bed to sleep. please keep working until i wake up."* and *"Feel free to dispatch any L cards if they are the kind that dont need my decision making. Keep dispatching in the right priority order until the morning."* Every lane below was cut and merged on that mandate; no product decision was taken (T-173 stays; T-205-s6's directory awaits @human's word). One usage limit interrupted five agents at 02:40Z; the seat re-spawned three of them after the reset at 02:52Z.

| card | base | tip | verdict | merge | what landed |
|---|---|---|---|---|---|
| T-219-s6 (S, lib/parser) | 90038e9 | e74c12c | APPROVED WITH ASSIGNED CORRECTIONS 7821c08 (claude-fable-5-1@subagent) | e06fa33 | an interior dot segment in a fence token RESOLVED lexically (the card's remedy, not the brief's); a fence that arms nothing is not startable; correction C1 (the reserves-nothing clause gains `unusable.length === 0`) performed at the merge with its body; T-219-s7…s10 suggested |
| T-205-s1 (M, tools/method-evals) | 6dd44a6 | faf1b69 | APPROVED WITH ASSIGNED CORRECTIONS 1596331, battery daad821 (claude-fable-5-1@subagent) | 8d5b5cc | verdict-digest.mjs + MF-10: the attack-set digest comparison is RUN (VERIFIED / REFUSED 1 / UNAVAILABLE 3); six corrections performed (two CONVENTIONS bullets, 10-gates' MF census, the MF-10 patch with VM5/6/10/11 drilled, the note on T-205-s6, the card's routes); T-205-s14, s15, T-276, T-277 |
| T-153-s3 (S, the index crate) | bcc833f | a007884 | APPROVED WITH ASSIGNED CORRECTIONS 5f34683 (claude-opus-5@subagent; the merge message names 0aa74be, the verifier's first verdict commit) | 683cd60 | the walk skips any directory carrying cargo's CACHEDIR.TAG by its first 43 bytes; corrections: a FIFO named CACHEDIR.TAG can no longer hang the walk (metadata before open; the body's bounded wait, red alone at 20 s under the weakened guard), the signature's offset pinned; T-111-s11 discharged; T-153-s17…s19 |
| T-205-s4 (S, tools/method-evals) | 52fdbc3 | 0bf398c | APPROVED WITH ASSIGNED CORRECTIONS 4619425, foot 6782fdf (claude-opus-5@subagent) | 370fff2 | MF-02 resolves LETTERED sub-step citations (26 → 34 examined, 8 lettered); MF-09's shasum conjunct scoped to the grammar bullet (the absorbed T-205-s7); corrections: the GAP bound with ARM 4 (drilled under --selftest — the control arms run there, not in the plain check), `review: independent` stamped at the merge on a guard-class card dispatched with the field empty (176 cards carry an empty `review:`); T-205-s16…s20 |
| T-223-s4 (S, the landing gate's header) | 542d941 | 7d95dab | APPROVED 2be001d, foot 0165d6c (claude-opus-5@subagent) | a6355bb | the narrowed sentence bound to its premise (WHILE HEAD NAMES THE LANE BRANCH), limit 6 over the class of ref writes, both measured at the base by the dispatcher and at the tip by both seats; T-211's card retracts beside its struck clause; comment-only; the repair is enforced by no body (T-223-s7); T-223-s6 |
| T-112-s5 (M, app-board) | f34be88 | cbc24d4 | APPROVED WITH ASSIGNED CORRECTIONS f57802a, foot 0d7b310 (claude-opus-5@subagent) | 2d6d354, repaired at 1476100 | shape 3 as ruled: the drawer asks dispatch_brief for its own card; C-09 → C-15 declared (43 → 44 edges, ACYCLIC); the brief prop the seam (board-truth.test.tsx byte-identical); corrections: the gate-on-asking body (A-M8 red alone), the `live` flag documented as redundancy (T-112-s10 holds the pin question); the two T-211 pins reconciled at the merge — the relation table's row and its tally 33 → 34, the map's 45 → 46; the seat's comment ate the tally's comma and the merge went in red for four minutes; T-112-s7…s11 |
| T-229-s10 (S, one app test) | 900fbfa | cf7c176 | APPROVED e9f0ee4, battery 01dd8cd (claude-opus-5@subagent; 30 mutants, neither kill set containing the other) | 5775ac0 | the tsconfig include pin reads the parsed JSONC with the key's uniqueness asserted (shape EIGHT); the card's own decoy-plus-widening pair green against the base body across 1163 bodies and red against the new one; T-229-s11…s13 |
| T-244 (L, `npx supertaskr`) | b679f0a | f809cd9 → fix pass 870c14e | REJECTED a6d5c1d (claude-opus-5@subagent: R1 undo fails open on an unusable fence token — 99 of 253 done cards; R2 substring merge match; R3 HEAD mutated; R4 an unfalsifiable precondition; R5 two surviving mutants; R6 a pin in prose; the 3b sweep clean; T-244-s4) → the executor's fix pass in place (31/31 drill, e2e 737) → the second pass in flight at this write | — | live |
| T-241 (M, method/ + kit.rs by fast path A) | 21f5325 | 8f02281, b2cdc65 | — | — | live: the skill pack committed by the first executor (silent from 00:00Z, stopped at 02:27Z); a continuation cut off by the limit; a second continuation in flight |
| T-167-s13 (S, the index crate) | 098cfe1 | c51b7ba | phase 2 in flight (the first cut off by the limit) | — | live: apply_budget returns its dropped set; the WHICH FILES list; ADR-014 ruled against a schema member; T-167-s14 |

No merge-tree forecast was taken (merge-lane.sh merges `--no-ff --no-commit` and reads the merge's own output); every merge auto-merged; the integrator writes named in each message; the fences never overlapped (the arm's `--write-fence` refuses an overlap; T-241's grant of kit.rs re-derived against the live fences).

## The ask channel by hand, and the grants

- T-205-s1 (22:12Z): four asks REFUSED as grants (CONVENTIONS and docs/reference inside T-265's live fence, tools/e2e inside T-224's); 2/3/4a performed as corrections at its merge; 1 → T-205-s6 (planned p66, @human confirms `docs/benches/`).
- T-241 (23:44Z): app/src-tauri/src/agent/kit.rs GRANTED by fast path A (99b9a75; manifest and lane card AGREE) after the closing battery and push; the method version bump ruled the integrator's at the merge (CONVENTIONS in T-244's live fence).
- T-112-s5 (01:07Z): the dogfood fixtures REFUSED per T-211; the seat re-derived the pins at the merge.
- SendMessage is disabled in this harness: the ask file was the only channel, and it worked three times.

## Gates

- GRAPH: regenerated at T-219-s6's merge (and again at 9298efb after correction C1 moved two parser files — the push guard caught the stale graph), at T-153-s3's (after the FIFO correction), at T-112-s5's (five indexed files; and again at the repair), at T-229-s10's; CURRENT at every push.
- CENSUS: regenerated where spec names moved (T-224's body; none of the night's seven moved an e2e spec).
- DOCS GATE: FIRES at every merge (cards are code inputs) — the batteries below discharged it.
- METHOD EVAL GATE: run at T-205-s1's, T-205-s4's, T-223-s4's and T-229-s10's merges (a citation line lands under docs/tasks each time): 10 evals, exit 0 each.
- BOOT GATE: owed by T-112-s5 (app sources) — run by the lane (SUPERTASKR_BOOT_PORT=15113, exit 0) and by the executors of T-153-s3 (15154) and T-223-s4; battery48's own boot check exit 0 at the rename checkpoint.
- HEALTH BANDS at 5775ac0 (`npm run health -- --readings battery53/readings-night.txt`, the parser, rust and e2e runners' captures plus `index --check`'s): `health-bands: 14 band(s) — 4 inside, 4 drifting, 2 BREACHED, 0 unread, 4 UNKEPT`, exit 3 (designed: four bands await keepers). The two BREACHES: suite/e2e-seconds (696 s against a band set at 279 bodies — T-263 re-bands it) and triage/live-suggestions (51 cards above the 40 breach line — the night's 27 arrivals; a triage sitting is DUE at the morning). STATE 5.3 % and ROADMAP 3.1 % of their warn lines (drifting), oldest suggestion 7.1 days, net arrivals 24 since the rename checkpoint.

## Suites

battery49 on e06fa33: 389/1163/639/706 GREEN. battery50 on 8d5b5cc: 389/1163/639/706 GREEN. battery51 on 683cd60: 389/1163/645/706 GREEN. battery52 on a6355bb: 389/1163/645/706 GREEN. battery53 on 5775ac0: 389/1171/645/706 GREEN. Every lane's own legs at its tip and every verifier's once at its tip are on the cards. The closing battery on this checkpoint commit (the push's token) runs after it.

## CI

8d5b5cc (run 34293830022) SUCCESS; 683cd60 (34296661753) SUCCESS; a6355bb (34300080330) FAILED twice — ENOSPC on the runner both times: the arm's fence write (first run) and its bench cut (the re-run, `fatal: cannot create directory at '.claude/hooks': No space left on device`) in brief.spec's eight-hand-steps body, and the docs harness in six shell-frame/window-contract bodies; the same tree GREEN locally (battery52). T-278 filed; its fence (ci.yml + workflow-parity.spec.ts) sits inside T-244's live fence, so the workflow fix waits for T-244's landing. 5775ac0's run: in flight at this write (pushed 02:53Z); its watcher deletes the four merged branches on green and its conclusion is the ledger's, then the next record's. **Main is red on CI on the runner's disk, not on the tree, since a6355bb.**

## Board

Since the rename checkpoint (f83f7f1): planned 156 → 149; building 3 → 3 (T-244, T-241, T-167-s13); done 255 → 262 (T-219-s6, T-205-s1, T-153-s3, T-205-s4, T-223-s4, T-112-s5, T-229-s10); suggested 24 → 51 — filed by the lanes and their verifiers: T-219-s7…s10, T-205-s14…s20, T-153-s17…s19, T-223-s6…s7, T-112-s7…s11, T-229-s11…s13, T-244-s1…s4 (in the lane), T-276, T-277; by the seat: T-278; parked 129. T-205-s6 planned p66. Every one of the 27 new cards owes triage its `touches:` (limit 5(a): a new id inside a range).

## Environment

At the record's write (~03:00Z): lanes T-244 (870c14e, bench at 870c14e with the second pass live), T-241 (b2cdc65 + an untracked scripts/ dir from the cut-off continuation; the second continuation live), T-167-s13 (c51b7ba, bench at c51b7ba with phase 2 live); the other benches and lanes removed; branches of the merged lanes deleted after each judged, green push (T-112-s5's, T-205-s4's, T-223-s4's and T-229-s10's kept until 5775ac0's CI is read); the killed verifier's two scratch worktrees under the scratchpad removed; the strays (../arch-verify, ../V-s2-A, two .claude/worktrees entries, ../nputer-app on purpose) untouched.

## What the brief got wrong

- The seat merged T-224 while its third verifier's battery still ran and removed the bench under it (the verdict file read as the finish); a bench stands until the verifier's NOTIFICATION — the rule held for every later merge tonight (memory note).
- The push guard refused the first night push twice over: the graph one correction stale (C1 landed after the ritual's regen step) and three merges unjudged (their branches deleted before the push). Regenerated; branches recreated and deleted after CI; merge-lane.sh gained steps 11–12.
- Two verifiers spawned without a `model` argument ran on claude-fable-5-1 while the stamps said claude-opus-5; the stamps were corrected to the seat that verified (the parser's assignment census refuses a mismatch); every later spawn passed `model: "opus"`.
- T-244's and T-241's first arms stopped at the preflight: a fence token for a file the card itself creates is a DEAD entry; the fences were re-cut on their existing parents and the two stamps reverted, not rewritten.
- T-219-s6's brief asked for REFUSAL where the card asks for RESOLUTION; the executor followed the card.
- The seat's own T-274 fence (`docs/tasks`) redded the parser census at three lanes' bases; attributed in their ground truths, fixed on main at ab00399.
- The T-112-s5 merge was committed with a red body and a stale graph (the seat's scripts commit unconditionally; the seat's comment ate a tally's comma); repaired at 1476100 within minutes; memory note; merge-lane.sh step 12.
- The T-153-s3 merge message names the first verdict commit (0aa74be) where the second parent is the verifier's final 5f34683; the T-205-s4 message calls T-205-s17…s19 unwritten where the merge carries them.
- GNU `timeout` is absent on this machine: a drill run through it exited 127 and was redone without it.
- T-241's first executor went silent at 00:00Z with a shell call that never returned and was stopped at 02:27Z; nothing in the harness told the seat.
- The usage limit at 02:40Z killed five agents mid-work (two verifiers, three executors); the seat re-spawned the verifiers and one executor fresh after the reset — the two executors that were only polling for verdicts were not, since a merge is the seat's and a fix pass gets a fresh seat.

## Metrics (ADR-020)
- Rework cycles: T-244 1 (REJECTED a6d5c1d → the fix pass in place, T-273's route by hand); every other lane 0.
- Tokens (the notifications' meters): T-219-s6 executor 387,220 · phase 2 247,406; T-205-s1 executor 338,645 · phase 2 288,997; T-153-s3 executor 360,276 · phase 2 266,635; T-205-s4 executor 229,607 · phase 2 265,091; T-223-s4 executor 216,751 · phase 2 221,660; T-112-s5 executor 331,215 · phase 2 253,691; T-229-s10 executor 197,082 · phase 2 230,324; T-244 phase 2 (first) 312,426, its executor's meter lost to the limit; the seven phase 1s 50,977–66,829 each; the seat: not derivable here.
- Gate runtime: battery49 ~14 min, battery50 ~12, battery51 ~13, battery52 ~13.5, battery53 ~12; the closing battery in the next record.
- Cold start: none; one compaction at 22:00Z before the sitting.
- Drift incidents: 2 — the stale graph at e06fa33 (caught by the push guard) and the red merge 2d6d354 (caught by the seat within minutes).

## Dispositions
- Seven cards done; T-244, T-241 and T-167-s13 live for the morning; T-244's second verdict, T-241's report and T-167-s13's verdict land by their watchers and merge in that order, each with its own battery and push.
- T-278 (the runner's disk) filed suggested p10; promote and dispatch as soon as T-244 lands (its fence frees ci.yml's parity spec).
- The morning's triage owes the 27 new suggested cards their `touches:`, T-205-s6's directory awaits @human, T-266 stays @human's, T-173 stays.
- Process rulings written tonight as memory notes, not as method text (the method is T-241's and T-268's to carry): a bench stands until the verifier's notification; pass the subagent model explicitly; re-ask the graph after every integrator correction and keep the lane branch until the push; gate the merge commit on the counts.
