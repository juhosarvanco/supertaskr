# Checkpoint: six lanes land, the ceremony earns its keep on a guard, and four seats independently find that an exit code is a summary of nothing

Date: 2026-08-31. Seat: architect/integrator. Scope: the night after the
eleven-lane tip — one triage sitting, one architecture sitting, six lanes
merged, ten cards filed, and an unusual number of this seat's own errors
caught by the work rather than by the seat.

## What landed

| card | what it bought | review |
|---|---|---|
| `T-162-s1` | @human's byte floor in ADR-019, `F` = 2 053 **derived** | self |
| `T-182` | the `Checkpoint:` subject rule, stated where a checkpoint is written | self |
| `T-142` | the positive-control rule extended to censuses | self |
| `T-184` | the store cannot arm flight for a settled turn, cannot strand a latch for ever, and disarms on `idle` | **independent** |
| `T-112-s4` | C-18's test-path gap discharged; the seam's real blocker identified | **independent** |
| `T-167-s8` | a push guard that refuses a stale graph, proved to fire on a real remote | **independent** |
| `T-186` | the index walk's four checks named for what they actually do | **independent** |
| `T-191` | the strand fixture repaired (integrator, at the merge) | — |

## THE NIGHT'S MOST REPEATED FINDING, REACHED BY FOUR SEATS FROM FOUR DIRECTIONS

**An exit code is a summary, and a summary of nothing is
indistinguishable from a summary of success.**

- **This seat**: ran the DOCS GATE as `npm run … | tail -n; echo $?` from
  the repository ROOT, where there is **no `package.json`**. Every run
  exited **254**; `$?` after a pipe is `tail`'s, so four consecutive
  readings said `exit=0`. Proved with a control both ways —
  `false | tail -1` → 0, with `pipefail` → 1.
- **`T-167-s8`**: two of its own mutants failed to mean what they said —
  one **open** (broken syntax, so RED over **zero bodies**), one
  **closed** (a bare repo inside the fixture root made a commit non-empty
  for an unrelated reason). *"Exit codes call both a kill; only the
  counts separate them."*
- **`T-186`**: two vacuous drill checks — a `diff` comparing two **empty**
  files exiting 0, and a duplicate-id check over an **empty corpus**.
  *"The failure wore the drill's own costume."*
- **`T-112-s4`**: read its first suite exit **through a pipe** and nearly
  shipped an intermittent that did not exist.

And a **third shape-TEN member**, found by `T-186` while re-measuring a
verdict: `cargo test -p <crate>` without `--no-fail-fast` **stops after
the first failing target**, so a crate-scope count silently describes one
target. It nearly turned its verifier's correct `5` into a wrong `4`. The
tell was arithmetic — the parts did not add up to the baseline.

**This checkpoint's own `cargo test` is run with `--no-fail-fast` because
of that finding**, which is the first time a lane's lesson changed the
integrator's gate command in the same night it was written.

## THE GUARD-CLASS RULE PAID FOR ITSELF ON THE FIRST CARD IT TOUCHED

`TASK-FORMAT` requires `review: independent` **set at dispatch** wherever
a card's SUBJECT is a guard — *"the builder of a cage is not its
inspector."* **This seat missed that on `T-167-s8`**, placing it on the
row for *S, diff outside shipped code*: correct about the DIFF,
incomplete about the SUBJECT. The lane read the clause more carefully
than the seat that dispatched it, refused itself the review, and stamped
`verifying` before the correction arrived.

The verifier it was then owed found what the size row would have shipped:
**three mutants of the guard's own `--root` constant surviving 25 passed
/ 0 failed.** Two would have **refused every push in the repository**;
one would have **allowed every push for ever**. The shipped code was
correct — the keeper used `toContain`, a substring search, so every
proper prefix passed.

The repair is **anchoring, not a wider substring**: commands extracted to
a list and matched whole, the working directory read from the bullet's
own marker, `--root`'s value asserted, and the check directory required
to carry the `Cargo.toml` that `-p` resolves against.

**`review: independent` is stamped LATE on that card and the card says
so.**

## THIS SEAT'S OWN ERRORS, EACH CAUGHT BY THE WORK

1. **A triage sitting absorbed a trigger that cannot be built.** Sitting
   #5 folded `T-181` into `T-167-s8` **without consulting ADR-019's
   Records clause**, which forbids a gate depending on
   `docs/checkpoints/` contents — restated in ~14 places and **already
   declined by four cards**. The verifier sharpened it past both
   readings: **the clause's verb is DEPEND, not READ.** Routed as
   `T-193`. *"A triage sitting that promotes a criterion is making a
   buildability claim"* — and the same sitting checked `cargo audit`
   against the tree while not checking this against `docs/decisions/`.
2. **A "blind line" inside one prompt is not a blind line.** Lane context
   sat below a line in the same message; an agent reads the whole prompt.
   **Three lanes and a verifier reported this independently.** Fix
   adopted: lane context goes in a SECOND message, after the attack set
   is saved. The related instruction telling executors to keep figures
   out of their notes is **withdrawn** — `executor.md`'s report spec
   wins, and blindness is the dispatcher's job.
3. **A forward `blocked_by` reference redded CI.** And the first
   diagnosis was wrong: `T-142`'s lane measured that `npm run lint:docs`
   is `docs-gate.mjs --census`, whose exit 0 means *"I wasn't asked"* —
   **the gate proper names the exact body that reddened.** The
   instrument existed, worked, and was never asked. Routed as
   `T-142-s1`; `T-090`'s "exactly four" npm scripts now stand at nine.
4. **Stamped a card `suggested` → `done` without its four required
   fields**, redding the parser — a finding `T-184`'s lane had reported
   **hours earlier and this seat had read.** Recorded rather than amended
   away, because the point is that a finding read attentively and acted
   on within the hour still did not bind.
5. **Ran a full cargo suite beside a verifier's bench**, producing a
   `startup_arm` red. Attributed by `T-088-s4`'s own three-step protocol
   (lib suite **15.64s**, above the 14.6s red line → body ALONE **1.27s**
   → no reflexive `cargo clean`, a verifier was using the cache) and
   confirmed by this checkpoint's quiet run.

## FIVE CARD-ID COLLISIONS, AND THE ANSWER IS AN ALLOCATOR

`T-186` corrected its own first fix with its second collision: deriving
an id against the integration tip **cannot work**, because a live lane's
card is **absent from main by construction**. A scratch port is seeded by
the card id the lane already holds; **a new id has no seed.**

**So no construction is available to a lane, and only the dispatching
seat can allocate.** Adopted. `T-196`'s id came from this seat rather
than from either lane — the remedy applied one card later. And the
backstop matters because `git merge-tree` reports **no conflict** for two
cards sharing an `id:` under different filenames.

## Gates

- **`cargo test --no-fail-fast` — 18 targets, 601 passed, 0 failed,
  exit 0**
- `npx vitest run` (lib/parser) — **344**, `npm test` (app) — **1094**,
  `npm test` (tools/e2e) — ****366****, all exit 0
- `lint:docs` / `lint:tokens` / `capabilities:check` — **0 / 0 / 0**;
  CAPABILITIES regenerated **27,333 → 29,053 bytes**
- **GRAPH REGEN — owed, run, CURRENT**: 1,148,046 of 2,145,959 (53.5%),
  199 files, 2,446 symbols, 2,363 edges
- **BOOT GATE — owed and run, exit 0** on derived port **25389**; 1420
  read with `lsof` only, zero rows
- **METHOD EVAL — not owed** (no `method/` path)
- **HEALTH — **9 inside, 1 drifting, 0 BREACHED, 0 unread**, 4 UNKEPT. The three previously-unread bands cleared by feeding `--readings`; the drift is `docs/STATE.md` at 8.82%, left there deliberately (see below).**

## ⚠ CI STOPPED STARTING, AND IT IS NOT THE TREE

Run `33350903739` on `dc94810` failed **three times**, each in **2–4
seconds with ZERO steps and no log blob** (`BlobNotFound`). Ruled out:
the workflow file (untouched, parses, green 30 minutes earlier on the
same file), the tree (the battery above), and transience (three identical
attempts). **What remains is a GitHub-side startup failure, most likely
exhausted Actions minutes** — unconfirmable from here, because the
billing endpoint refuses this token, which is correct.

**Two pushes tonight did get green CI** (`5574af3`, and `c05a1bb`
covering the `T-184` and `T-112-s4` merges plus the graph regen). The
`T-167-s8` and `T-186` merges are confirmed by the LOCAL battery alone,
and this record says so rather than letting a board imply otherwise.

## Owed after this record

- **@human**: the Actions quota; the byte-floor divergence `T-162-s1`
  routed (its derivation rule and its motivation name different files,
  and one reading makes the ruling a no-op); the **FORM**; the
  **STEERING SPLIT**; `T-025-s4`'s three permission questions; thirty
  seconds on the interview's ending at a narrow width; and `T-131`, which
  now has fresh counter-evidence — three lanes where a blind verifier
  caught what the executor's own drill did not.
- **A triage sitting with TWELVE cards**, deliberately not held here.
  Two of them (`T-193`, `T-189`) want a ruling rather than a fence.
  **`T-190` is the one with a consumer waiting** — `T-126-s2`'s
  `blocked_by` names it and the F-04 seam does not move until it lands.
- **A compaction landing** for `docs/STATE.md` (drifting) and
  `docs/CONVENTIONS.md` (+16,434 bytes in a day, half its band).
  ADR-019's §3, and @human's call.

## `docs/STATE.md` IS LEFT DRIFTING ON PURPOSE

At **8.82%** of its warn line against a 10% drift line. This seat
tightened it three times tonight and then stopped, because continuing
meant **deleting load-bearing content to hit a number** — which is the
move `T-142`'s lane refused for `CONVENTIONS.md` an hour earlier on the
same reasoning, and the move ADR-019's compaction rule exists to prevent.

No gate is red: the census exits 0 and the budgets hold. **The remedy is
a compaction landing, which is a deliberate act with its own ceremony and
resets a band @human owns.** Recorded rather than improvised.
