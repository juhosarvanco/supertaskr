# Checkpoint: the wave sitting of 2026-09-08 — the break lifted, five cards dispatched through the arm with two-spawn benches, four merged, one rejected and reworked, CI green again, the guide and the reference written (2026-09-08, the architect seat)

## Merge

The sitting opened at 9527a14 (the form sitting) with @human's words
*"lift the break, run T-239-s4 first and push, and if something is safe
to run in parallel, do that."* Five cards were dispatched at 09:13Z
through T-239's arm, each with its own lane, bench and port; every
fence pair was proved disjoint by the arm's expansion at dispatch (the
dispatch view at 9527a14 classed all five STARTABLE).

| card | base (stamp) | lane tip | verdict | merge | what landed |
|---|---|---|---|---|---|
| T-246 Codex's skill form, measured | 9d0e385 | 6ae1431 | APPROVED 7e7e188 | 2e3ea61 | five help captures, the cross-harness §5 addendum; docs-only |
| T-239-s4 the arm's git identity on CI | 0f6b37f | 50b83d4 | APPROVED 7b48de3 | a1bfb54 | the ritual fixture carries its own identity; CAPABILITIES 652→653; a .ts moved → graph asked, CURRENT |
| T-249 the secret read guard | 828621f | e41ebef | APPROVED 2fe99ba | 83712ed | lane-fence read arm (seven entries); integrator writes: settings matcher `|Read`, the CONVENTIONS read clause (+2,573 B), CAPABILITIES +10 −1 |
| T-247 the dependency-legitimacy gate | 5b92d70 | f6bc5c8 | APPROVED b000d82 | f4afa7d | landing-gate limit 7 closes, both arms, hermetic; CAPABILITIES +13 −1 |
| T-248 the injection scan on docs writes | d1603bb | 1c60da3 → rework 6970e37 | REJECTED 68c438b, then APPROVED 47cc34e | 6ffde74 | docs-gate.mjs's injection scan (J1–J7), advisory, each hit printed with file, line and pattern; 53 bodies; CAPABILITIES +11 −1 |

Every merge was `--no-ff --no-commit` after a `merge-tree --write-tree`
forecast read clean; the merge commits carry only the lane, the `done`
stamp, the census regen and (T-249) the verdict's three assigned
integrator writes, each named in the message. Ranges: each lane's own
pair `<base>..<tip>`; the integrator's pair `<merge>^1..<merge>`.

Between the merges, on main: the triage commits 8661fc2 and a714e99 (chapter Dispositions), the third version sitting (89a386b, T-258
and T-259 filed), T-257 filed (9f1174c), T-256 filed (8a74a74), the
guide (dc9b124, 2ccbc38), the reference (d62fa19), VERSIONS rows
(f8e2fb5).

## Gates

- DOCS GATE: run on every merge's paths through merge-lane.sh step 9 —
  FIRES each time (cards under docs/ are code inputs); the owed suites
  ran in the battery. On docs/reference/: FIRES (shell-frame and
  window-contract walk docs/), owed suite: e2e — run in the battery
  before the push.
- GRAPH: asked after every merge (`index --check --root ../..`):
  CURRENT at 2e3ea61, regenerated at a1bfb54 (a .ts moved; six dogfood
  pins re-derived), CURRENT at 83712ed and f4afa7d (tools/ and .claude/
  are index-excluded). Asked LAST after this record's final write: CURRENT (the wave's index
  line: 1188363 bytes, 201 files, 2542 symbols, 2441 edges at a714e99;
  re-asked at the checkpoint commit — see the commit's own line).
- CENSUS: regenerated in each merge commit that moved a spec name
  (a1bfb54, 83712ed, f4afa7d, 6ffde74).
- INJECTION SCAN (T-248, advisory, from 6ffde74 on): the docs gate's
  own census over the tree, stamped WITH ITS CWD (T-248-s4's ask):
  from the repo root,
  `paths=(${(0)"$(git ls-files -z docs/)"}); node tools/e2e/scripts/docs-gate.mjs "${paths[@]}"`
  — reading at a714e99: 3 hits over 777 paths (T-101:1398 a `you will
  now see` sentence, J2; T-221:303 a zero-width character, J4;
  T-248-s2:31 the phrase that card is about, J1) — data, not
  instructions; the T-248 lane's own census at 1c60da3 was 2 over 739 (the T-248 lane's own
  census at 1c60da3 was 2 hits over 739 paths; the triage run on three
  cards fired one advisory hit on T-248-s2:31, the card that quotes the
  phrase it is about — data, not an instruction).
- BOOT GATE: not owed (no app source moved).
- CI: origin was RED at 9646618 (T-239-s4's cause). Pushed
  9646618→a1bfb54 after battery42; run on a1bfb54 **completed success
  (linux=success)** at 11:08Z. Main is GREEN on CI.
- HEALTH BANDS at a714e99 (`npm run health -- --readings
  battery43/readings-wave.txt`, the rust and e2e runners' own captures
  plus `index --check`): **14 band(s) — 7 inside, 2 drifting, 1
  BREACHED, 0 unread, 4 UNKEPT — exit 3** (designed). Drifting:
  docs-headroom/ROADMAP 6.20 % of the warn line; triage/oldest-
  suggestion-days 6.54. BREACHED: suite/e2e-seconds, 596 s against a
  312 s line set at 279 bodies — the band is stale by construction;
  filed as T-263 (planned, F-06 p26). UNKEPT: gate-seconds, cold-start,
  drift-incidents, rejection-rate (T-262 gives the last its keeper).

## Suites

battery42 on a1bfb54 (gate-run, 10:35–10:45Z): parser GREEN 3s · app
GREEN 8s · rust GREEN 24s · e2e GREEN 583s. battery43 on a714e99 (13:40–13:50Z): parser GREEN 2s · app GREEN 7s ·
rust GREEN 17s · **e2e RED 596s: 1 failed / 683 passed** — push-guard.spec
"the guard is wired into .claude/settings.json on the Bash matcher"
pinned the fence matcher's OLD literal `Edit|Write|NotebookEdit`, which
T-249's integrator write (83712ed) widened by `Read`; no lane ran that
spec against the new matcher (settings.json was outside T-249's fence).
The merge's own debris: repaired at this checkpoint (the body reads the
matcher as a set and requires the three write tools), re-run alone
green, and the closing battery below is the proof. The closing
battery on the checkpoint commit (the push's token) runs after this
record is written; its verdict is stamped in the seat ledger and in the
next record, never back into this one.

Per-lane figures as reported and re-measured by their verifiers:
T-239-s4 parser 377, app 1163, e2e 653, drill 5/5 (executor), eight
mutants (verifier); T-249 lane-fence 71/71, e2e 661, parser 377, app
1163, eleven mutants re-planted (verifier), 36 paths probed, 1,235
tracked files pass clean; T-247 landing-gate 36/36 (hermetic: 36/36
with registries unroutable), e2e 664, rust 635/4 ignored, fourteen
mutants thirteen killed; T-248 docs-input-gate 52/52 at the first
tip, seven mutants six killed (verifier), the break-after-first
mutant surviving = the rejection; rework at 6970e37: 53/53, the break
mutant and two more (after-the-push, reporter slice) die to the new
body alone; re-verification at 47cc34e: parser 377, app 1163, e2e
661/662 (the ref-skew red at the base, lane absent), docs-input-gate 53.

## Board

At this ref: T-246, T-239-s4, T-249, T-247, T-248 `done`; suggestions filed by the seats this wave: T-239-s5,
T-239-s6, T-246-s1, T-247-s1/s2/s3, T-248-s1/s2/s3/s4, T-249-s1/s2;
cards filed by the architect: T-256, T-257, T-258, T-259 (planned).
Derive: `brief.mjs --dispatch --full`.

## Environment

Seat pid 19232 (holder.json), taken 09:14Z. Lanes at dispatch:
../nputer-T-239-s4, -T-246, -T-247, -T-248, -T-249 with benches
../nputer-V-<id>; ports 15<card> (lanes) and 25<card> (benches). At
this record: every lane and bench of the wave removed; the standing
worktrees are the human's app checkout (../nputer-app), ../arch-verify,
../V-s2-A and two .claude/worktrees entries, none on a task branch
(`git worktree list`).
The human's app: not running on 1420 during the sitting (not probed
after 09:14Z).

## What the brief got wrong

- **The phase-1 frame.** This harness cannot deny tools to a subagent.
  Phase 1 was instructed to call none and to disclose its count; all
  five returned zero tools and every verdict discloses that the
  property was kept by instruction, not by construction (orchestrator
  5d's "where the driver cannot spawn twice, say so", applied to the
  tool grant).
- **Row 6 (setup)**: the tools/e2e preflight needs app/node_modules and
  lib/parser/dist; the brief's build order under-stated it (four seats
  reported it). `npm install` in app/ under a fence rewrites
  app/package-lock.json and is refused (EACCES) — `npm ci` is the
  spelling; CONVENTIONS line 23 says `npm install` → T-256 filed.
- **Row 5 (live lanes)**: the lane list in the briefs went stale as
  lanes merged during the wave; seats re-derived it.
- **T-239-s4's HOME-empty control** was inert on macOS (git
  auto-detects an identity when the hostname carries a dot); the
  ground truth `user.useConfigOnly=true` reproduces the runner (exit
  128) and the card's control was falsified before the diff was opened.
- **Row 13 from the verifiers**: two leaks self-disclosed (a `git log`
  printing lane subjects after the verdict; `git checkout --detach`
  printing the tip's subject at bench setup → `--quiet` adopted mid-
  wave); the T-247 verifier's pre-diff must-ALLOW column was wrong
  about `.env.example`.
- **The T-247 race** (integrator's own): the executor "finished" while
  waiting on its own e2e monitor; a continuation seat was spawned, the
  original resumed on its own, two seats shared the lane and the
  continuation's e2e held port 15247 → the continuation was stopped and
  its orphaned playwright/vite tree killed by pid. Memory note
  rewritten: an agent re-fires on its own; never spawn a continuation
  into a live lane.
- **merge-lane.sh** (integrator's own): perl `'"$BB"'` ate `@subagent`
  (array interpolation) → `$ENV{BB}`; card selection by `ls | head -1`
  stamped T-249-s1 instead of T-249 → selection by the `id:` line.
- **The read guard's scope**: it screens reads in every checkout, not
  only in lanes — beyond criterion 1's letter in the safe direction,
  accepted by the verifier; the integrator's expectation of exit 0
  outside a lane was wrong.

## Metrics (ADR-020)

- Rework cycles: T-246 0 · T-239-s4 0 · T-249 0 · T-247 0 · T-248 1
  (REJECTED 68c438b for one missing test body; a fresh executor closed
  it at 6970e37; a fresh phase 2 approved at 47cc34e).
- Tokens: read off the subagent meters at each seat's end —
  phase-1 benches 49,615 (T-247) · 54,242 (T-246) · 58,906 (T-239-s4)
  · 52,410 (T-249) · 65,833 (T-248); executors T-247 261,933 (original,
  to its first stop) + continuation (not separately metered) · T-248
  510,714 · T-239-s4, T-246 and T-249 executors: not copied into the
  ledger at the time (their notifications carried the meter; the ledger
  did not), so not derivable here; phase-2 verifiers T-249 186,461
  · T-247 262,762 · T-248 232,711 · T-248 rework executor 234,751 · T-248 re-verifier 217,416 · T-246/T-239-s4 phase 2: not read off a meter (their notifications carried no usage line); the architect
  seat: not derivable here — this session's own meter is not readable
  from the seat.
- Gate runtime: battery42 on a1bfb54 — parser 3s, app 8s, rust 24s,
  e2e 583s = 618s; battery43 on a714e99 — 2s + 7s + 17s + 596s = 622s
  (the machinery/gate-seconds reading); the closing battery on the
  checkpoint commit is stamped in the ledger, not here (the record is
  written before it runs).
- Cold start: no model or session switch this sitting (one session,
  compacted once at ~10:45Z; resumed from the summary without asking
  a question; gaps: none that needed the human).
- Drift incidents: 0 (no verdict or room caught a NORTH_STAR or
  ARCHITECTURE contradiction this window).

## Dispositions

Done: T-246, T-239-s4, T-249, T-247, T-248 (built_by/verified_by
claude-opus-5@subagent; review independent, with the frame disclosure
above). Suggested this wave (untriaged,
triage owed at the stamp): T-239-s5, T-239-s6, T-246-s1, T-247-s1,
T-247-s2, T-247-s3, T-248-s1, T-248-s2, T-248-s3, T-248-s4, T-249-s1,
T-249-s2. Rules applied by name: orchestrator 5b (stamp before cut),
5c (bench at the cut), 5d (two spawns, frame disclosed); lane-protocol
rule 4 (seat held), rule 6 (worktrees removed after merge); integrator
step 1 (forecast vs tree), step 3 (record first, STATE regenerated);
TASK-FORMAT lifecycle (rejected → fresh executor).

## Dispositions — addendum after the triage commit 8661fc2

Triage at the stamp for the four merged lanes' trains: T-256 absorbs
T-239-s5; T-239-s6 planned (F-04 m4 S p9); T-246-s1 planned (F-01 m4 S
p16, docs-only); T-249-s1 planned (F-04 m4 S p5, guard-class, absorbing
T-249-s2); T-260 planned (F-04 m4 S p10, guard-class, absorbing
T-247-s1/s2/s3). Five files removed, five Absorbs: lines written.
T-248's train at a714e99: T-248-s1 planned (F-06 m4 S p7), T-248-s2
planned (F-06 m4 S p10, absorbing T-248-s3), T-248-s5 planned (F-06
m4 S p25); T-248-s4 DISCHARGED at this checkpoint — its ask, the census
command stamped with its cwd, is met in the Gates section above; the
file moves to rejected/ in the checkpoint commit naming this record.
Also filed this sitting from the GSD agent-reference reading (02669dc):
T-261 planned (F-04 m4 S p9), T-262 planned (F-01 m4 S p17); the
coincidental-reliance rule folded into T-258.
