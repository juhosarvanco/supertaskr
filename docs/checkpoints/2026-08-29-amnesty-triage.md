# Checkpoint: amnesty triage (2026-08-29, integrator nputer-4e, direct pipeline)

The board's whole suggested column goes through one dispatched
architect sitting: 140 cards at `status: suggested` (derived at the
seat's base 47979ee), 0 remaining at its tip. From this merge, a
suggestion has three futures — promoted, parked with a resurfacing
condition, or rejected with its reasoning kept — and the arrivals
since queue for T-159's standing metabolism rules, not for a second
amnesty.

## Merge

Parents `0d82a60` (main) and `0a37448` (the sitting's tip, 8 batch
commits), `--no-ff` -> `cc5389b`. The merge's diff: **145 files, every
one under docs/tasks/** — and the path-overlap derive against main's
own motion since the base returned EMPTY, so the merge was
conflict-free by construction, not by luck. Tally as verified here:
**73 promoted** (57 by absorption — file removed, dated `Absorbs:`
line carrying the mechanism on the receiving card — and 16 new
planned), **62 parked** (each with a dated reason AND a resurfacing
condition), **5 rejected** (three of them discharges whose work
verifiably landed).

## The integrator's corrections, performed here

Both are one lesson — the sitting's own: a figure derived at one ref
is not a fact at another.

- **T-092-s2 DISCHARGED, not declined.** The triage promoted it on a
  280-byte CONVENTIONS warn headroom, correctly derived at its base —
  and ADR-019 Addendum 3 (`0d82a60`) landed BETWEEN base and merge,
  taking the card's own closing route two (an addendum raising the
  line with a measured reason). Re-derived at the merge ref: 110,342
  bytes against warn 137,928 — **headroom 27,586**. Moved to
  rejected/ with the full citation; `blocked_by` lifted on T-111-s10
  and T-147 with the derivation on their bodies; the CLASS (headroom
  that moved 12,323 -> 919 -> 280 -> 27,586 across four refs wants a
  band, not a card per excursion) routed to T-156 as a dated rider.
- **T-144 priority 7 -> 9.** The sitting's own collision fix
  (`0a37448`, 4 -> 7) checked the planned column and landed on
  `building` T-135's slot. Re-derived over ALL live statuses
  (planned, building, verifying): zero collisions after the move.

## Gates

- GRAPH REGEN: 0 of 145 paths carries an indexed suffix; ASKED anyway
  (slot below, last).
- BOOT GATE: 0 of 145 — not owed.
- DOCS GATE: `lint:docs` exit 0 — every live card's frontmatter
  parses with a legal status; all 4 governing budgets hold.
- capabilities:check: CURRENT (20,046 bytes) — no spec names moved.
- Census at `cc5389b` (derive: `brief.mjs --state`): flat 284,
  rejected/ 34; building 2 / done 113 / parked 113 / planned 52 /
  **suggested 4** — all four suggested are post-base arrivals
  (T-153-s1, T-154-s1/s2/s3), the metabolism's first queue.

GRAPH, asked LAST: after this record's final write — CURRENT,
1,020,023 bytes, exit 0.

## Suites (counts and exits, unpiped)

parser 314/314 exit 0 · e2e **258/258** exit 0 (port 16118, lsof zero
rows first) · cargo and app suites NOT OWED — 0 non-docs paths in the
diff, and the docs gate's derived readers for docs/tasks/** are the
suites that ran.

## Environment

Lanes after this checkpoint: `T-153-s2` only — its executor finished
during this integration (tip `5622db9`; ubuntu cargo green 3x on
draft PR #2, each run then stopping at the checkpoint-owned graph
regen) and its verifier was dispatched from this seat. The triage
worktree REMOVED, branch kept; the executor's detached drill worktree
(t153s2-drill) still stands with its logs. Port 1420 untouched; `z`
unmoved.

## What this integration observed, for the eval corpus

- The fence-ledger join printed `app-agent: FREE` while the live
  T-153-s2 lane holds it — `brief.mjs --state` joined branch
  `task/T-153-s2-...` to card T-153. The absorbed T-137-s11's class
  (receiver: T-143), live at this merge; STATE's never-read-FREE-as-
  a-verdict rule is the standing guard that held.
- The sitting missed two cards on their first pass (T-091-s2,
  T-137-s10) and caught both by re-listing the remaining set at every
  batch boundary — the re-listing rule is why the zero is honest.
- The integrator's own slip, stamped: edits made to T-092-s2 BEFORE
  its `git mv` were carried by the worktree but not by the index —
  `git mv` re-stages the OLD index entry, so the first checkpoint
  commit held the pre-discharge blob at `status: planned` while the
  discharge sat unstaged. Caught by reading the committed blob back
  (`git show HEAD:<path>`), fixed by amend before anything referenced
  the hash. The verify-the-committed-copy step is not ceremony.

## Standing questions routed, not judged

- T-139-s2's room (the eval'd megabyte IPC splice; whether the
  payload gets ANY aggregate bound) — a room, @human's or the
  architect's to open.
- The DISCHARGED-NOT-DECLINED encoding: three suggestions closed by
  ADR-019 phase commits have no card to carry an `Absorbs:` line and
  were recorded as REJECTED with explicit discharge reasoning
  (precedent T-001-s1). If the archive should read differently,
  T-159's metabolism text is the place to settle it.
- T-146 (largely answered by ADR-019; what survives is the card-corpus
  question) is a planning-pass call. T-145-s2's wording half rides
  T-159.
- T-159 now carries twelve parked riders; **T-152 is marked TAKE
  FIRST** — the only method-text finding with a measured, repeated
  cost (the same dispatch error twice, six hours apart, different
  hands).

## Metrics (ADR-020)

Rework cycles: **0** (two integrator corrections at merge, no
re-dispatch). Tokens, stamped from the meter: triage seat **477,081**
over 136 tool uses, 45.5 minutes — the fourth arc datapoint: 484k
(T-153, clean) / 573k (T-154, guard) / 795k (T-158, one rejection) /
477k for 140 dispositions ≈ **3.4k tokens per card**.
