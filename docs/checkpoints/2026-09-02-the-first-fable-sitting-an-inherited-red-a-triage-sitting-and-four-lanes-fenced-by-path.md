# Checkpoint: the first Fable sitting — an inherited red, a triage sitting, and four lanes fenced by path (2026-09-02, architect/integrator)

`43e776a..179a7cc` — 4 merges, 23 first-parent commits (53 in all),
75 files, +7,185/−2,262.

**Four cards landed, two more are in flight, and every one of the six
was dispatched with its fence narrowed to PATHS — the first time on this
board — with the disjointness guard proving every pair rather than a
seat asserting it.** The sitting opened on a red commit inherited from a
retired seat, on a second architect session holding the same checkout
unseen, and on twenty-seven suggestions the byte ceiling had frozen.
@human asked for the loop's weak spots and ruled *"apply all"*; the room
that answers is docs/rooms/loop-efficiency.md, thirteen items, three of
them retracted or corrected by measurement the same night.

## Merge

| card | merge | verdict |
|---|---|---|
| T-223 | `cf3c9bc` | APPROVED at `2561553` (+ step-7 addendum `79b14c7`), blind by the clock |
| T-230 | `e57c569` | APPROVED at `cb0b5ea`, blind by the clock |
| T-216-s4 | `af9e80d` | APPROVED at `7771c28` (+3 addenda, tip `2ae1eab`), blind by the clock |
| T-236 | `c596847` | REJECTED once at `dd0b1c9` (one citation), repaired by a FRESH seat at `fc0521b`, re-APPROVED at `8fd1b61` |
| T-225 | in flight | cut at `5f193e6` once T-223 freed the brief module |
| T-229 | in flight | cut at `179a7cc` once T-236 freed CONVENTIONS; carries bump v0.1.9 and three riders |

Every forecast was read from `git merge-tree --write-tree` with `$?`
first. T-223 and T-230: forecast and merge byte-identical except
`docs/CAPABILITIES.md`, regenerated INTO each merge commit for the test
names the lanes added (44961→45063, 45063→45893) — the integrator's
regeneration under the capabilities clause landed at `1cd2c8d`. T-216-s4:
forecast exit 1, CONFLICT on the card's own file only (add/add at the
end: main's FENCE WIDENED section against the lane's notes), resolved on
the lane's side with `touches:` byte-identical to main; census
45893→45968 into the merge; the graph regenerated in the closing commit
for the two Rust test files (files +0 −0, symbols 2495→2499,
1,166,334→1,167,474 bytes), so no fixture moved. T-236: forecast and merge
byte-identical, census CURRENT. **Every dispatch stamp preceded its cut;
no `status:` line conflicted anywhere.**

## Gates

    inherited  43e776a  e2e RED, brief.spec 11 bodies — one duplicated naming phrase, "PORT RULE:" — fixed at 85dda6d
    2489853  parser 349  app 1131  rust 631/18  e2e 535  GREEN   CI 33563960450 SUCCESS
    4018a7b  parser 349  app 1131  rust 631/18  e2e 535  GREEN   CI 33566291111 attempt 1 FAILURE (cargo picker-rearm, T-018-s2), attempt 2 SUCCESS
    aad0cf7  parser 349  app 1131  rust 631/18  e2e 535  GREEN   CI 33568942308 SUCCESS
    5f193e6  parser 349  app 1131  rust 631/18  e2e 547  GREEN   CI 33574070141 SUCCESS
    2dbf2dc  parser 349  app 1131  rust 632/18  e2e 548  GREEN   boot:check exit 0 on 16999, both [nputer] lines (T-216-s4's merge)
    179a7cc  parser 349  app 1131  rust 632/18  e2e 548  GREEN   CI at writing: in progress

DOCS GATE fired on every merge and named app, e2e and parser; all ran in
every battery. GRAPH REGEN fired on T-216-s4 alone and was asked, not
predicted: STALE by exactly the two files the lane edited, CURRENT after
the regeneration. BOOT GATE owed by T-216-s4's app/src-tauri paths and
run at `2dbf2dc`. METHOD EVAL owed by no merge (T-236's diff is docs/ and
tools/); the lane ran it anyway, exit 0.

**GRAPH, asked LAST**, after this record's final write, verbatim:

    [nputer-index] graph.json is CURRENT - ../../docs/architecture/graph.json matches a fresh index (1167474 bytes, 200 files, 2499 symbols, 2388 edges)
    [nputer-index]   budget:      1167474 of 2145959 bytes (54.4%) - 978485 left

**HEALTH BANDS** — a reporter, never a gate — read over the closing
battery's own captured output (the runner's `output.txt` files, not its
verdict log, which reads two bands UNREAD):

    health-bands: 14 band(s) — 7 inside, 2 drifting, 1 BREACHED, 0 unread, 4 UNKEPT
    exit 3   (designed while any band is unkept)

`suite/e2e-seconds` BREACHED at **426s** against a 312s line, up from
372s: 548 bodies now, thirteen of them this sitting's. `docs-headroom`
on STATE drifts at 2.74% before this regeneration; **CONVENTIONS is
INSIDE its band for the first time since its re-landing** (headroom
29,373 bytes after T-236). `triage/live-suggestions` drifts at 33: the
sitting's triage took it from 27 to 17, and the wave's lanes and
verifiers filed sixteen — the band is doing its job, and triage at the
stamp is the next seat's first duty.

## THE INHERITED RED, AND WHAT IT WAS

The retired seat's checkpoint commit `43e776a` moved two rules from STATE
into CONVENTIONS and closed one with "the PORT RULE: same class, same
remedy". `range-rule.mjs`'s `rawBullet` requires exactly one bullet to
carry "PORT RULE:" — the phrase the brief's row 10 spends — so every arm
of `brief.mjs` exited 3 and eleven brief.spec bodies went red, two of
them only in fixtures cloned from the committed tree. One colon. Fixed at
`85dda6d` with the class and the sweep in the commit message; the
mechanism was already written beside the CHECKPOINT subject rule.

## TWO ARCHITECT SESSIONS HELD ONE CHECKOUT

At arrival a second session, "Take the architect seat on Opus 5", was
mid-battery and then mid-checkpoint in the same integration checkout,
visible only through `ps`, the e2e port and the harness's session list.
No write was made until @human retired it; its last handoff corrected
this seat's belief that `43e776a` was green. T-238 (planned) gives the
holder a record on disk; room item 7 carries the account.

## THE TRIAGE SITTING

27 suggestions to 17 at `2489853`. T-201 closed at the seat, absorbing
T-218 and T-216-s2 with one CONVENTIONS sentence: the census regeneration
is the integrator's, in the merge commit. T-197-s1, T-167-s12, T-167-s11
and T-189-s2 absorbed; T-227 and T-189-s4 archived as corroborations of
T-219 and T-174; T-197-s2 declined; T-226 parked with a condition;
fifteen held at PROMOTE with their rulings written so no lane has to
make them. **T-235 gained its second instance INSIDE the sitting** —
three cards stamped `rejected` in place reddened the parser over a tree
the docs gate called clean — and its third from T-216-s4's lane, where
two-level suffix ids did the same. T-018-s2's promotion, declared in
prose on 2026-08-30 and never stamped, was applied at `4c26c8a` after its
class reddened main a third time; the re-run read green.

## THE WAVE, FENCED BY PATH

T-216-s4 (five files, then six), T-223 (three), T-230 (three), T-236
(three), T-225 (six), T-229 (six): every pair DISJOINT by the guard's own
computation, three of them inside `tools/e2e`, which at token granularity
would have serialised behind one word. The cost surfaced at once —
**serial stamping bakes every earlier lane's base with its later
siblings' PRE-narrowing fences**, so two session-economics bodies
reddened in the first two lanes by ref skew and passed at main (room
item 13; T-143-s1 and T-187 own the class). Remedy for the next wave:
amend every card's fence on the integration branch before the first
stamp. **And the guard refused T-225's first arming on T-223's still-live
merged worktree** holding the brief module — rule 6 kept, the rule
working; the worktree went, the lane armed.

**Blind by the clock, five times.** Every verifier's bench was cut with
its lane; every attack set was hashed before a diff existed; every
verdict says so. One verifier re-stamped against an amended card by path
and declared its own finding an input to the contract it judged; one
found its own drill mis-invoked and recorded the correction on the card.

**Fast path A, once, and unspent.** T-216-s4's fence gained the token
scanner on a verifier's reading that its root could not be redirected;
the executor read the repository, found a copied module resolves to the
fixture it sits in, and left the granted path with a zero diff. The
construction — two agreeing files on disk — made the grant harmless.

**One rejection, one citation.** T-236's compaction (160,043→117,505
bytes, −26.6%, the one-third bar honestly missed with the pins accounted
in ADR-019 addendum 6) cited T-089 for a census that T-110-s2 holds. A
fresh seat re-derived the finding by grep, swept all thirteen added
citations (twelve hold, one residual named), and the verifier re-drilled
where the repair landed.

## Board

**455 flat cards: done 205 · parked 123 · planned 92 · suggested 33**,
44 in rejected/, derived at `179a7cc`. Filed this sitting by the seat:
T-236, T-237, T-238, T-239 (planned, from the room). By lanes and
verifiers: T-223-s1/s3/s4, T-230-s1…s6, T-216-s6/s7/s8, T-236-s1…s4,
plus T-225's and T-229's when they report.

## Environment

Stamped at their clocks, re-derived never:

- Port 1420: no listener at any read tonight; the human's app was not
  running.
- `f.txt` and `g.txt` (4 bytes each, "one", "two") appeared at the
  integration checkout root at 2026-09-02 01:13:00 +0300 during the
  verifiers' phase-1 window — a seat's shell drifted into this checkout;
  LEFT in place as evidence (integrator rule 4). This seat's own shell
  drifted twice the same way, caught by reading "not found" back.
- The retired session's worktree `.claude/worktrees/adoring-nash-028cf4`
  at 4ec229c remains and is named STALE by every arm-time sweep; not this
  seat's to remove. `../arch-verify` holds an untracked T-141 card file,
  author unknown; left.
- Worktrees removed after their merges and before this record's writes:
  T-223's lane, bench and the executor's drill bench; T-230's lane and
  bench; T-216-s4's lane and bench; T-236's lane, bench and drill.
- The gate-runner's lock is per checkout (`lockPath(root)`); two e2e runs
  were measured live at once at 22:21Z, one here and one in a bench.

## What the brief got wrong

- **The dispatch note for T-230 asserted a grep this seat never ran**
  ("absent", `grep -c` 0): the sentence is present in different casing at
  CONVENTIONS line 190 (`grep -ic` 1). Corrected on main at `74c40cf`,
  relayed to both seats, retracted on the card by the lane. Orchestrator
  5b's audit failed at the seat that had just read the rule.
- **Eight covering messages carried a false sentence** — the
  gate-runner's lock is per checkout, not machine-wide; room item 11
  retracted with the measurement.
- **A relayed verifier fact drove an unneeded fence widening** (above).
- **The `\s*$` perl stamp** collapsed frontmatter lines twice — six cards
  in triage, three lines on T-216-s4's close — both caught by reading the
  diff back, once after a local commit; now a memory note and room item
  12. A card-name glob that matched five files sent one closing stamp to
  nothing; caught on the same readback.
- **The brief's row 4 base** named the red checkpoint commit for every
  lane (T-233); every covering message overrode it.
- **"Exactly four bodies red from the arming"** was five (the P6 plant)
  in every lane that measured it.

## Metrics (ADR-020)

- **Rework cycles:** T-223 0, T-230 0, T-216-s4 0, T-236 1 (one citation);
  T-225 and T-229 open.
- **Tokens:** read off the harness's per-seat usage as each notification
  arrived, in thousands — executors: T-216-s4 430, T-223 399, T-230 377,
  T-236 577 (Fable) + 228 (fix pass); verifiers, both phases: T-216-s4
  469, T-223 176+274, T-230 220+409, T-236 257+356 (+re-verdict inside
  the same seat); the triage reader 124; T-225 and T-229 open — about
  3.7M so far. The integrating seat's own meter is not exposed; the
  harness's remaining-budget counter fell from about 15.00M at arrival to
  about 14.69M at this write.
- **Gate runtime:** six batteries at the integration checkout, each
  7m20s–7m40s warm; the closing one at `179a7cc`: e2e **426s**, rust
  ~14s, app ~7s, parser ~2s — about **450s**, `machinery/gate-seconds`'
  reading this window. Plus one boot check (~7s warm) and six
  `index --check` reads.
- **Cold start:** a MODEL SWITCH (Opus 5 to Fable 5.1) and a session
  switch at once. The incoming seat explained the project, the state and
  the next dispatch from the folder alone; the two gaps were
  live-environment facts no document could hold — the second session and
  the red commit's undiagnosed body — and both are now written (T-238,
  this record). Passed, with those two named as the cost.
- **Drift incidents:** **0.** No work contradicted NORTH_STAR or
  ARCHITECTURE; every method-text change rode a card.

## Dispositions

Stamped done: T-201, T-223, T-230, T-216-s4, T-236. Promoted: T-018-s2.
Parked: T-226. Archived: T-227, T-189-s4 (absorbed), T-197-s2 (declined).
Absorbed with files removed: T-218, T-216-s2, T-197-s1, T-167-s12,
T-167-s11, T-189-s2. Filed planned: T-236, T-237, T-238, T-239. Stamped
building: T-225, T-229. Rules applied by name: orchestrator 5b, 5c;
lane-protocol rules 4, 5, 6 and fast path A; integrator step 3's
repair-versus-file test (the census and the graph repaired, T-235's
instances filed); TASK-FORMAT's fresh-executor rule on the rejection.

## Next

T-225 and T-229 land; then T-237, T-238, T-239 and T-120-s2 as fences
free, the fifteen held promotions once T-225's filter lands, and the
triage the wave's sixteen suggestions are owed — at the stamp, not in a
sweep. The next wave's fences are amended before its first stamp.

## @human's desk

Unchanged and nobody else's: the FORM (reopened), the STEERING SPLIT
(T-180 parked), T-025-s4's three permission questions, T-162-s1's byte
floor, T-131, and @human's eye on the interview's ending at a narrow
width. **New and worth one look**: docs/rooms/loop-efficiency.md — the
weak spots you asked for, applied in priority order tonight where a lane
could carry them, with items 11 and 12 retracted or corrected by
measurement before morning.
