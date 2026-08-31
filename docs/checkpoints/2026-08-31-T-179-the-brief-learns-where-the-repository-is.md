# Checkpoint: T-179 lands — the brief derives a lane path from the REPOSITORY instead of from whoever ran it, and the sweep found the half that actually writes

Date: 2026-08-31. Seat: architect/integrator. Scope: T-179 merge and
close under its own ceremony row (no verifier owed; integrator review on
the card and verified from the seat that caused the defect); the
capabilities census regenerated as routed.

## What was wrong, and it was live all night

`method/lane-protocol.md` rule 3: *"The worktree is a sibling directory,
never a path inside the repository."* `docs/CONVENTIONS.md` publishes the
spelling as the RELATIVE `../nputer-T-NNN`, and
`dispatch-brief.mjs` resolved it against **the checkout the command ran
in**. From the integration checkout that lands on the intended sibling;
from a nested worktree it lands inside `.claude/worktrees/` — and the row
printed it under the heading *"absolute, per lane-protocol rule three"*.

**The architect/integrator seat runs from a nested worktree by
construction in this harness**, so every brief it generated overnight
carried the wrong path. Four executors read it, four reported it
independently, and **none cut itself in the wrong place** — the
dispatching seat corrected each by hand. A discipline standing in for a
construction; this card makes it a construction.

## THE SWEEP FOUND THE WORSE HALF

Two members, both fixed, and the second is the one that matters:

- **row 4's `create:` command** — the row is the REPORT, the command is
  the ACT, and rule 3's own stated failure is a relative path in exactly
  that command.
- **`brief.mjs`'s `--write-fence`**, which resolved its argument the same
  wrong way **and then writes the fence manifest there.** A wrong path in
  a printed row is a reader's problem; a wrong path in the writer is a
  manifest in the wrong place. Seven non-members are recorded with the
  reason each is not one.

**This seat's own manifests were safe and the reason is worth stating**:
every `--write-fence` overnight was given an ABSOLUTE argument, so the
faulty resolution never applied, and each manifest was read back after
writing. Safe by two accidents rather than by the code.

## The choice of base, decided on properties rather than on the answer

Both candidates — git's own worktree listing, and the parent of
`--git-common-dir` — were measured from all three checkout shapes and
**both answered the same path.** So the lane chose on properties:

- the porcelain listing is **git's own contract** rather than a
  derivation from one;
- the `--git-common-dir` parent is **wrong** under `--separate-git-dir`,
  an exported `GIT_DIR`, and a bare repository;
- the listing says `bare` in one word, so **the refusal is reachable**;
- and `context()` **already reads it** — no new git call, and row 4's
  base now comes from the same text row 5's lane list does, so **the two
  rows cannot disagree.**

Refusal is wired in the command's own idiom (`NOT DERIVED — <reason>`
with its source) for an empty listing or a bare first entry, and
`insideRepository()` makes the row check itself against the rule its
heading cites. **The provenance stamp moved from a tree fact to a live
one**, correctly: where a repository sits on disk is not determined by a
commit.

## Verified at the merge from the seat that caused it

Run from this architect seat's own nested worktree, which emitted every
wrong brief overnight:

    worktree (absolute, per lane-protocol rule three):
      /Users/ujju/Projects/nputer-T-174
    create: git worktree add /Users/ujju/Projects/nputer-T-174 …

The sibling, character for character, and the create command now spells
it absolutely too.

## The lane caught its own over-reach

Substituting an absolute path into the UNSUBSTITUTED template line would
have put a LIVE stamp on a TREE fact — **this card's own defect facing
the other way** — so the substitution is guarded on a card actually
being named. Found by its own suite before the drill.

**And the sweep is mechanised rather than asserted**: the whole brief is
run twice over a nested fixture and 165 lines compared, with 2 movers
both allowlisted-with-reasons and both REQUIRED to move as positive
controls, 0 unexplained. Shown capable of failing twice over. The lane
also says plainly that the sweep alone is insufficient — `create:` was
equally wrong from both checkouts and did not MOVE — so the body pins
the value against a base derived from the fixture's layout, sharing no
constant with the producer.

## Gates

- `index --check` — **CURRENT**, 1,141,994 of 2,145,959; GRAPH REGEN
  fires by the letter and is a measured no-op (`tools/e2e` is outside
  the walk)
- `cargo test` — **256 passed, exit 0** (lib 8.04s)
- `npx vitest run` from lib/parser — **344 passed, exit 0**
- `npm test` from app/ — **1077 passed, exit 0**
- `npm test` from tools/e2e — **341 passed, exit 0** (+2, this lane's)
- `typecheck` / `lint:tokens` / `lint:docs` — **0 / 0 / 0**
- **`capabilities:check` — 0 CURRENT (27,333 bytes)**, regenerated at
  this checkpoint as the lane routed: two new test names, and the CI
  keeper would have redded otherwise. **Second checkpoint running that
  it has caught.**
- **HEALTH — 10 inside, 0 drifting, 0 BREACHED, 0 unread, 4 UNKEPT**
- **BOOT GATE / METHOD EVAL — not owed** (no `app/**` or `method/**`
  path)

## Ceremony, and a defect in this seat's dispatch summaries

`tools/e2e` reaches no `KIT_FILES` entry and no shipped slug, so the row
is *S, diff outside shipped code*: **no verifier owed**, and the lane
recorded that it did not take the self-integration half because the
dispatch withheld it. Closed `done` with this review in a verdict's
place.

**AND THE THIRD DISPATCH-SUMMARY DEFECT OF THE NIGHT, from this seat.**
`T-178` reported that the summary said `npm ci` from tools/e2e sufficed
when the suite needs the whole ADR-011 order; `T-161` reported that the
summary's fence was NARROWER than the written manifest; and both this
lane and `T-140-s9` report ROW 4's base naming a commit that is not the
lane's real base. **The pattern is one thing**: a summary written from
this seat's memory, standing beside a brief derived from the tree, and
the summary is the half that is wrong every time. The remedy is the same
as the blind-brief rule already in STATE — say less in the summary and
point at the derivation.

## Board

`T-179` done. **NINE LANES LANDED overnight.** In flight: `T-161` and
`T-140-s9`, both with blind verifiers out — and both, as it happens,
about properties nothing could detect breaking.

## Owed after this record

- **@human, untouched as asked**: the FORM question (reopened), the
  steering split, the three permission questions, and thirty seconds on
  the interview's new ending at a narrow width.
- Routed by this lane: `brief.mjs`'s `--audit` resolves against the
  checkout root while `health-bands-run.mjs` resolves a user-typed path
  against the CWD — two commands, one package, two bases for the same
  kind of argument. **Not a rule-3 question** (the audited file has no
  published spelling and no "repository" answer to prefer), so it is a
  CLI-convention decision for the architect rather than a defect.
