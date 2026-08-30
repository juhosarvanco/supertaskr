# Checkpoint: T-153-s8 lands — the capabilities census gets a keeper, and the health band caught this seat dropping a marker two rules depend on

Date: 2026-08-31. Seat: architect/integrator. Scope: T-153-s8 merge and
close under its own ceremony row (no verifier owed — the whole diff is
NOT-SHIPPED paths; integrator review recorded on the card); the executor's
correction to its own card; and `T-182`, filed from a band that could not
see its own remedy.

## What landed

`npm run capabilities:check` is a CI step. The census that had been fixed
by hand three times — twice in the preceding six hours — now has an
instrument that says so on every push.

**It is a three-file edit and the third file is the reason**:
`tools/e2e/tests/workflow-parity.spec.ts` derives its expectations from
`docs/CONVENTIONS.md`'s per-package command bullets in BOTH directions,
so a CI step that the doc does not list reds by name, and a documented
command with no step reds too. The lane added **two data entries and no
new assertion** — deliberately, because this card's ruling forbids a lane
spec body, and the existing parity bodies already bind both directions.

## THE EXECUTOR CORRECTED ITS OWN CARD, and the correction is better than the card

The card said the step must run after `npm ci` because the check needs
the package installed. **That is false and the lane measured it**: on an
uninstalled worktree `capabilities:check` answered CURRENT at exit 0.

The true constraint is subtler and lives a layer down: `capabilities.mjs`
resolves a templated test name's iterable by `await import()`ing a module
out of `tests/`, and modules there import `yaml`. **So the bare-checkout
property belongs to the SPEC TREE, not to the script** — and the edit
that would falsify it lands in a spec file, layers away from `ci.yml`,
where nobody editing the workflow would think to look. Placement chosen
on the real constraint: after `typecheck` (so a spec that will not
compile is named by `tsc` first), before the 250 MB browser download (a
stale census costs under a second).

All four exit codes produced deliberately and read unpiped — 0 CURRENT,
1 STALE naming `npm run capabilities` as the fix, 2 usage, 3 could-not-run
— so a stale census and a check that could not run differ in code AND
headline. `ci.yml` re-types no numbers.

## A defect found while running its own gates

`token-scan.spec.ts`'s seven-plant-target body pairs its sha256
assertions with **`git diff --quiet` carrying no range** — worktree
against index — so the lane's own uncommitted edit failed it while every
hash assertion passed. `.github/workflows/ci.yml` is one of the seven
targets, which is why the lane met it at all.

That is CONVENTIONS' own *"a diff with no range compares the working tree
to the INDEX"* hazard, sitting inside the body whose job is proving
restoration. Routed rather than fixed inside the lane; the tree is green
committed.

## T-182: THE BAND CAUGHT THIS SEAT

`npm run health` reported `triage/net-arrivals-per-window: 10 cards …
0 dispositioned` — **an hour after a sitting that dispositioned five.**
The band was right; its WINDOW had never moved. It measures since the
newest `Checkpoint:` commit, and **every checkpoint commit this seat
wrote tonight opened with a card id instead** (`T-140-s4 closed: …`,
`Standing triage sitting #5: …`), so the anchor stayed at yesterday
evening's `4e08d29`.

**The marker has a SECOND consumer**, which is what turns this from a
style slip into a card: CONVENTIONS' DISPATCH bullet reads the same
marker to name a lane's base. With it absent, "the newest `Checkpoint:`
commit" pointed a day into the past for the whole night.

**NOTHING WENT WRONG, AND THAT IS THE FINDING.** Every lane was cut from
its dispatch-stamp commit instead — permitted by the bullet's own reading
and gates-green each time. So both consumers degraded silently and
neither could say so. **The rule that PRODUCES the marker is written in
no file**; only the two rules that consume it are. Filed as `T-182`, and
**this checkpoint's own commit carries the prefix** — the practice
corrected in the same breath as the card.

## Gates

- `index --check` — **CURRENT**, 1,134,163 of 2,145,959 (52.9%),
  1,011,796 left. GRAPH REGEN does not fire: the whole diff is
  `docs/**`, `.github/` and `tools/e2e`, none of it in the walk.
- `npx vitest run` from lib/parser — **344 passed, exit 0**
- `npm test` from app/ — **1059 passed, 49 files, exit 0**
- `npm test` from tools/e2e — **335 passed, exit 0** (3.7m). Unchanged
  by design: the lane added parity DATA, not bodies.
- `typecheck` / `lint:tokens` / `lint:docs` — **0 / 0 / 0**
- **`capabilities:check` — 0 CURRENT (26,693 bytes)**, run here as a
  gate for the first time because it now is one.
- `npm run health` — **exit 3**, then re-run with `--readings` over this
  checkpoint's own captured output: `14 bands — 8 inside, 1 drifting, 0
  BREACHED, 1 unread, 4 UNKEPT`. **The one unread band is
  `suite/lib-seconds`, and it is unread honestly**: `cargo test` is not
  owed by this diff, and running it purely to fill a band would make the
  reading a performance rather than a measurement.
- **BOOT GATE — not owed** (no `app/src/**`, `app/src-tauri/**` or
  manifest). **METHOD EVAL GATE — not owed** (no `method/**`).

## Ceremony, ruled

The diff is entirely `docs/**`, `.github/` and `tools/e2e` — every one on
the NOT-SHIPPED side of CONVENTIONS' SHIPPED PARTITION — so the table's
row is *S, diff outside shipped code*: **no verifier owed.** The executor
flagged that it had stamped `verifying` only because the dispatch told it
to, and it was right to flag it. Closed `done` with the integrator review
above standing in place of a verdict, the same disposition `T-112-s3` and
`T-163-s4` took.

## One disclosure investigated and NOT reproduced

The lane's own suite disclosed *"fences are not disjoint: T-153-s8
tools/e2e against T-133 tools/e2e"*. Checked at this integration:
`git worktree list` holds three task branches (`T-112-s1`, `T-153-s8`,
`T-171`), `T-133` is `status: done` and holds no lane, and
`brief.mjs --task T-153-s8` derives all three live lanes correctly and
answers DISJOINT for all three pairs. **One sighting, not reproduced, no
live contention** — recorded rather than filed, and recorded rather than
dismissed.

## Board

`T-153-s8` done. **Five lanes have landed tonight**: `T-140-s4`,
`T-112-s3`, `T-177`, `T-172`, `T-153-s8`. Two remain in flight:
`T-112-s1` (blind verifier out) and `T-171` (executor). New on the
board: `T-182`.

## Owed after this record

- `T-182` and the `token-scan` range defect want dispositions at the next
  sitting.
- **@human's desk, untouched overnight as asked**: the FORM question, the
  steering split, the three permission questions.
