# Checkpoint: rulings sitting (2026-08-30, @human with integrator nputer-4e)

Seven decisions @human had queued were made in one sitting — every one
in the direction the evidence recommended — and each landed in its
proper home the same morning. This record is the instance; the rulings
themselves live where rulings live (the room, the cards, the board).

## The rulings and where they landed

1. **ADR-019 budget RE-LANDING: approved** (over raise-the-lines-only
   and keep-absorbing). Filed as `T-162`, priority 1, planned at
   filing — the T-160 precedent. ROADMAP's band was BREACHED at under
   2% headroom after six one-night re-breaches; CONVENTIONS drifting
   with the seat held. `T-156-s1` is the first consumer of the new
   runway and unblocks when T-162 lands.
2. **C-11 split: approved, split first** (over dispatching T-112
   as-is). Filed as `T-163`, priority 2: design tokens leave the
   component both `app-board` and `app-shell` expand through; T-112's
   collision surface drops ~19 -> 1. The not-independent ledger row
   and its spec pin are two-sided-derived, so the fence stays out of
   tools/e2e.
3. **T-140-s1 payload shape: ruled in the card's favour** — rollup at
   rest, file detail pulled for what is on screen. PROMOTED to
   planned (F-06, priority 2, `blocked_by: [T-135]`); the density
   measurements are its acceptance evidence.
4. **T-151: REJECTED by the ruling it asked for** — moved to
   rejected/ with the dated reasoning. Its own framing conceded it:
   the raise buys ~10 files; T-140's shape removes the wall.
5. **T-154-s2 guard scope: lane-less seats' writes are IN SCOPE.**
   PROMOTED as a guard-class card, `review: independent`, with the
   carve-outs stated as criteria (docs/tasks/ unfenceable, a card's
   own file, the integration seat's ordinary writes).
6. **D3: ruled NARROW YES** — the app may stamp card frontmatter and
   append to record-class locations; the four governing documents and
   method/ are out of bounds (RULE/TRUTH tiers, ADR-019). Recorded in
   rooms/cockpit-or-mirror.md; ROADMAP's two open-ruling mentions
   corrected, net byte-negative. D5 stays open.
7. **T-025-s2 real smoke: RUN NOW — and it ran.** The 2026-08-16
   revoked-auth park reason is measured STALE. First real planner
   turn this project has ever observed: native session registered,
   real deltas ("I'll start by reading the planner role definition."),
   `Read`/`Bash`/`Read` through the allowlist, no denial. The harness
   hung up on it — `wait_for`'s fixture-calibrated 20 s deadline
   panicked mid-turn, then cancelled CLEANLY (reaped 550 ms, no
   SIGKILL: the failure path passing a test it was never given).
   Carded as `T-025-s5` (promoted at filing, priority 1); the
   measurement is stamped on T-025-s2 with its new resurfacing
   condition. The `z` file resolved itself: gone from the tree before
   the sitting opened.

## Preflights (T-160's ritual, every promoted or filed card)

`T-154-s2`, `T-162`, `T-163`, `T-025-s5` CLEAN; `T-140-s1` correctly
NOT STARTABLE on its declared T-135 blocker — the tool refusing a
dispatch that cannot land, which is what it is for.

## Integrator's own slips, stamped

The four-suite chain was written with the persisted-cwd defect (line
three inheriting `app/` instead of `tools/e2e/`) **three consecutive
times** — twice caught only after backgrounding, a third time pasted
identically after naming the defect — before the chain moved into a
script file with guarded `cd`s. The T-143 record called this class
"a mechanical hazard a wrapper could remove"; the wrapper now exists
(session scratchpad, `run-suites.sh`) and this is its origin story.
The first chain also read piped exits (`| tail` then `$?`) — both
defects in one line, both against rules this file's own suites pin.

## Suites (exits unpiped, via the script, this checkout, after 7525239)

parser 315/315 exit 0 · app 1015/1015 exit 0 (after both builds) ·
e2e **320 passed** exit 0 (`NPUTER_E2E_PORT=14791`, lsof zero rows
before binding) · cargo exit 0 (all test-result blocks ok) ·
lint:docs exit 0 before the commit · graph asked LAST: **CURRENT**
(1,022,964 bytes, 189 files; floor line printing ~918 files).

## Metrics (ADR-020)

Rework: 0. Seats paid: none — integrator direct, one real model turn
(~21 s) spent on the smoke by @human's ruling. Lanes after: THREE to
dispatch from this checkpoint — `T-162` (alone on the e2e seat),
`T-163`, `T-025-s5`, fences pairwise disjoint, all Opus. `T-160-s4`
and `T-156-s1` queue behind T-162. Port 1420 untouched.
