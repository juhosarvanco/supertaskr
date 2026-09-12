# Checkpoint: the Codex day and the restart — T-300 and T-303-s1 merged; ADR-025 recorded; the nine plan cards filed; T-311 dispatched; method 0.1.23 unchanged

Date: 2026-09-12 · Seat: the architect (Claude Fable 5.1 in the Claude desktop app) · Previous record: 2026-09-10-the-proportionate-loop-sitting-t293-t294-t307-t295-merged-the-arm-merges-method-0-1-20.md

## What happened, in order

1. **The Codex day, reviewed.** On 2026-09-11 the owner had given the orchestrator seat to a Codex session, which recovered the interrupted T-300 and T-301 lanes into a separate clone, built a Codex ownership fix (its T-303-s1), wrote a migration ADR and design, and left eighteen unpushed commits and a large T-301 candidate. The Claude seat's read-only review of its packet (the review, the seat contract and the room inventory of 2026-09-12, in the seat's scratch) found the architecture direction sound and twenty-one changes that owed a room; the Codex orchestrator's own proposal recommended restarting from de5805b1 with the recovery as input, which the owner took.
2. **The rulings.** The owner ruled on 2026-09-12: the loop's rules bind every seat alike; Claude-only repository writes until a Codex fence exists (superseded for the seat by ADR-025 and for lanes on demonstration); T-300 first, the shared reader extracted afterwards into the parser library; a journey check per feature; the app a mirror first for the settings; the current model configuration kept (Fable 5.1 the seat, Opus 5 every subagent); option A for the push check; the pruning class by class after T-303-s1; a standing rule-review sitting; rule 8 extended narrowly; the exploratory escapes-and-rework count; the compact handoff packet as the succession format; option B filed as a switch. Each is in the room that owns it.
3. **T-300 merged** 62d10db7: the terminal settings command, resumed by a fresh executor after the quota interruption, verified with two assigned corrections, the sixth merge through the verb (stopped at counts on T-295-s8's class, ruled through); T-300-s1..s5 filed. Pushed at cdbdafa0, CI green.
4. **The records** 0695da1b and 7a7c34d6: ADR-025 (one session contract for every child, in either harness) accepted; the room model-and-effort-settings opened as a debate with the Codex proposal kept under docs/design as its source; the seat and fence rulings appended to the cockpit and loop rooms; the loop room's three turns, the cockpit room's turn, the public-repository room's interim exception, the T-301 amendment; T-308, T-309, T-310 filed. CI green.
5. **T-303-s1 merged** 8cdebbce: the Codex ownership fix re-entered as a patch from the recovery clone, re-derived by the executor (a sentence the patch had broken restored; a body for the card's own opening sentence added), verified with two assigned corrections on a standard bench whose ground carried the seat's twelve base measurements, and the seventh merge through the verb — **the first clean run, no false stop**. Pushed at f7987bc8 with the nine plan cards, CI green.
6. **The nine cards filed** at f7987bc8 and repaired at a8103b8d: T-311 to T-316 (ADR-025's plan), T-317, T-300-s6, T-299-s6 (the settings track), drafted by the seat, reviewed twice by the Codex orchestrator, filed with their closing sections appended in a second commit after the omission was found. T-238-s1 and T-238-s4 annotated; T-301's second amendment appended.
7. **T-311 dispatched** at f608f5fa under the owner's standing authorization: guarded (method text), the executor and phase one on Opus 5, the bench set up.
8. **The pruning and rule-review batches prepared** in the seat's scratch for the owner's return: the T-306 proposal refreshed against the board (204 suggested cards; 335 named by the proposal; 20 new), and the four rulebook bullets added since the propose-before-recording release.

## Measured

| Figure | Value | Derive |
|---|---|---|
| Merges through the verb today | 2 (T-300 stopped at counts, ruled through; T-303-s1 clean) | `git log --first-parent --merges --since=2026-09-12 main` |
| Pushes today, all CI green | 4 (cdbdafa0, 0695da1b, 7a7c34d6, f7987bc8) | `gh run list --branch main --limit 6` |
| Whole e2e at the last push | 1022 passed at f7987bc8 | the closing check's gate-verdict line |
| Meters readings | 15 (T-300 and T-303-s1 added two each, executor and verifier) | `wc -l docs/checkpoints/meters.jsonl` |
| Subagent tokens today, approximate | T-300 executor 191K, verifier 237K; T-303-s1 executor 264K, phase 1 67K, verifier 300K | the notifications, in meters.jsonl |
| Escapes and rework baseline over nine cards | 22 correction bodies, 0 rejected benches, 4 to 6 confirmed escapes clustered in T-295 and T-296 | the seat's scratch table of 2026-09-12 |
| CONVENTIONS | 153,943 bytes, past its 146,878 warn line | `wc -c docs/CONVENTIONS.md` |
| Health bands | health-bands: 17 band(s) — 2 inside, 2 drifting, 6 BREACHED, 3 unread, 4 UNKEPT; exit 3 (the designed 3 while bands await keepers; the three readings-authority captures: the graph's budget line, cargo test's run, the whole e2e's summary 1022 passed (15.3m)) | `npm run health -- --readings <the checkpoint's captured output>` from tools/e2e/ |
| The graph, asked last | [supertaskr-index] graph.json is CURRENT - ../../docs/architecture/graph.json matches a fresh index (1198942 bytes, 201 files, 2561 symbols, 2453 edges) [supertaskr-index]   budget:      1198942 of 2145959 bytes (55.9%) - 947017 left | `cargo run -p supertaskr-index -- index --check --root ../..` from app/src-tauri/ |

## What was learned, and where it went

- The standard tier's sealed ground answered none of phase 1's measurements (T-296-s11) and the verifier's brief renders no context pack (T-296-s10): both filed; the seat took the measurements by hand into the ground's addendum for T-303-s1 and resealed.
- The counts gate's false stop (T-295-s8) recurred at T-300 and did not at T-303-s1.
- A card drafted in a batch can lose its closing sections and pass both the census and the preflight; a criterion may not name a path the fence does not cover; a new directory cannot be reserved in a fence. All three cost a commit today and are in the seat's memory.
- The recovery clone stays untouched as evidence by the owner's ruling; its remaining candidate pieces return as small cards.

## Next

T-311 to its bench and merge (guarded, the method bump to 0.1.24 at the merge); then, under the standing authorization and one lane at a time, T-317, T-312, T-313, T-314, T-300-s6, T-299-s6, T-315, T-316. The first pruning batch and the first rule-review sitting with the owner. T-301 resumes only after T-317, T-300-s6 and T-299-s6 land. The room model-and-effort-settings awaits the owner's eight rulings.
