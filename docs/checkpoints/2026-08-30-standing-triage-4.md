# Checkpoint: standing triage sitting #4 (2026-08-30, the new architect/integrator seat's first act, no merge)

The seat changed hands today and this is the incoming seat's first
sitting. **The suggested column is 14 -> 0.** No lane, no code: the
whole sitting is `docs/tasks/**` plus this record and `docs/STATE.md`.
Four cards were FILED by the sitting itself — two of them systemic
findings from @human's first-walk board session, relayed by the
outgoing seat and **re-derived here into a different shape than the one
that arrived**.

## The hand-off, and the signal that fired it

The takeover signal named in the incoming seat's briefing is MECHANICAL
and it fired during the ramp-up: at `b60b06d`
`git worktree list --porcelain | command grep '^branch refs/heads/task/'`
returns nothing, and both hand-off cards (`T-163-s4`, `T-025-s4`) are
`status: done` on a pulled main. The prior session's own record
(`2026-08-30-T-025-s4-the-three-tables-and-the-ledger-closes.md`) says
the same in as many words. Nothing in this sitting touches either lane's
work.

## What called it

    node scripts/brief.mjs --state          # from the e2e package
    command grep -l "^status: suggested" docs/tasks/T-*.md | wc -l

**Before: 14** at `b60b06d`. **After: 0.** The `triage/live-suggestions`
band (drift 20, breach 40, both in
`tools/e2e/scripts/health-bands.config.mjs`) was HEALTHY at 14 and called
nothing — this is the standing cadence running before the band has to,
the same disposition sitting #3 recorded.

Board, before -> after (`building` 1 -> 0 and `done` 151 -> 152 are the
prior session's T-025-s4 close landing between the two reads, not this
sitting's doing):

| | before | after |
|---|---|---|
| suggested | 14 | **0** |
| planned | 70 | 84 |
| parked | 122 | 126 |
| flat task files | 358 | 362 |
| in rejected/ | 41 | 41 |

## The tally — 14 dispositioned, 4 filed, 1 corroborated

**10 PROMOTED. 4 PARKED**, each with a condition somebody can check
without remembering the card. **0 absorbed, 0 archived** — nothing in
the fourteen was a duplicate of a live card or discharged by other work,
which is itself worth stating: this is the first sitting of the four
where every card survived its own needle-check.

| card | disposition |
|---|---|
| T-112-s1 | PROMOTED F-04 p5, as filed — the next code dispatch |
| T-112-s3 | PROMOTED F-04 p20 — dispatchable TODAY (`[tools/e2e]`) |
| T-112-s4 | PROMOTED F-02 p25, as filed |
| T-143-s6 | PROMOTED F-06 p22 — **the helper RULED IN**, reach re-derived |
| T-163-s5 | PROMOTED F-06, priority 20 -> 6 — dispatchable TODAY |
| T-167-s9 | PROMOTED F-03 p4 — **both triage questions RULED** |
| T-171 | PROMOTED F-03 p1, NARROWED to the terminal state, SPLIT |
| T-172 | PROMOTED F-03 p2, one acceptance correction |
| T-173 | PROMOTED F-03 p3 at size L — **the bump RULED, and it is bigger than the card thought** |
| T-174 | PROMOTED F-01 p12 — **shape 1 RULED** |
| T-112-s2, T-154-s3, T-159-s6 | PARKED — next method version bump |
| T-154-s4 | PARKED — **routed to @human**, one-line ratification |

**FILED BY THE SITTING**: `T-175` (the cold-start test's operational
owner — the split half of `T-171`), `T-176` (the shipped card template),
`T-177` (the bold backbone line), `T-178` (the fixture-teardown
intermittent). **CORROBORATED**: `T-161`, second CI sighting.

## THE SITTING'S PRINCIPAL FINDING: the queue is blocked, and not by the queue

**The graph has 410 bytes of headroom** (`wc -c docs/architecture/graph.json`
= 1,039,590 against the crate's 1,040,000 at `b60b06d`), so **every
promotion whose fence reaches indexed source is undispatchable until
@human rules `T-140-s4`.** That is eight of the ten promotions. The
sitting records the block on each card rather than lowering any
priority, because the cards are ready and the constraint is not theirs.

**TWO PROMOTIONS ARE DISPATCHABLE TODAY AND BOTH ARE `[tools/e2e]`**,
which `.nputerignore` excludes from the walk: `T-112-s3` (row 3 applies
the role file's reading step instead of printing beside it) and
`T-163-s5` (two live-checkout bodies grade an exit they accept either
way). Everything else waits on one word from @human.

## Three needle-checks that changed a disposition

1. **THE TEMPLATE FINDING ARRIVED POINTING AT THE WRONG FILE, AND THE
   RIGHT ONE IS WORSE.** The relay reported that
   `method/tasks/T-000-template.md` opens with an HTML comment above its
   frontmatter. It does not — at `b60b06d` it starts with `---`, and so
   does `../nputer-app`'s copy at `d5c4b65`. The comment exists only in
   the generated project, and
   `git -C /Users/ujju/Projects/first-walk log --follow -- docs/tasks/T-000-template.md`
   returns ONE commit, the genesis commit, which adds the comment and
   `status: rejected` together. **The planner wrote that file**, and it
   wrote it because the template it was given carries `status: planned`
   and parses as a live milestone-1 card wherever `docs/tasks/` is read.
   Both of its repairs are parse failures — flat `rejected` is a hard
   failure BY DESIGN here, and a leading comment defeats frontmatter
   detection outright. And underneath all three:
   `method/interview/plan-interview.md`'s stage-0 row says `docs/tasks/`
   is created EMPTY, so **nothing shipped tells the planner where the
   template goes.** Filed as `T-176` with three shapes and the bump
   question already derived (the template IS a `KIT_FILES` entry, so a
   bump is owed).
2. **THE BOLD BACKBONE IS NOT MERELY UNPARSED — IT IS UNREPORTED**, and
   that is the half that makes it a card. Measured against the real
   regexes at `b60b06d`: three declared features, **0 matched, 0
   reported malformed, 3 silently invisible**. `roadmap.ts` HAS a
   malformed-line reporter (`/^-\s+F-/`) and the two asterisks sit
   between the dash and the `F`, so the one mechanism written to stop a
   backbone line disappearing quietly is defeated by the same characters
   that hide it. Filed as `T-177`, with the arm order this repository's
   own doctrine implies: report first, tolerate second.
3. **`T-143-s6`'s ONE ARGUMENT AGAINST ITSELF DID NOT SURVIVE
   RE-DERIVATION.** The card declines its own helper on reach — *"two
   call sites is the threshold where a shared abstraction is a
   coin-flip"*. Counting at `b60b06d`,
   `command grep -n "lanes are in flight\|lanes are live" app/src/lib/board-model.ts`
   returns four further frozen-number sites (1307, 1329, 1359, 1370) in
   the same file, all inside `app-board`, all reachable from
   `lib-parser`. The reach is five or six sites in two packages, not two
   of four — so the helper is RULED IN, narrowed exactly as the card
   proposes (a number helper, never a sentence factory), with
   `tools/e2e`'s copy kept and the reason written in code.

## Four rulings taken at the seat, and one deliberately not

- **`T-167-s9`: its own page, and NO BUMP IS OWED.** `ls method/runtime/`
  answers two files and the layout is one page per FORMAT; a transcript
  section inside `sessions-schema.md` makes that file's name false. Both
  bump tests re-derived at `b60b06d` rather than inherited from
  `T-167-s1`: `KIT_FILES`' only `runtime/` entry is `nputer.yaml`, and a
  runtime key set is not card/room/brief/role grammar. Both fail.
- **`T-173`: a bump IS owed, and the card under-priced itself.**
  `interview/plan-interview.md` is a `KIT_FILES` entry (test 1 yes), AND
  its stage table is transcribed cell-by-cell into `BANKING_MAP`
  (`app/src/genesis/genesis-derive.ts:40`) with
  `every_cell_of_the_9_row_table_matches_plan_interview_md_verbatim`
  redding on any cell. So adding an intake stage is a method release plus
  a second-implementation reconciliation, not an interview change. Size
  raised to L and the fence widened to carry all three bump stamps.
- **`T-174`: shape 1 — ship what the shipped documents cite.** Shape 2
  forks a normative document, which is T-057's class by name. The gap is
  enumerable: five files (`lane-protocol.md` ×4 citations,
  `roles/orchestrator.md` ×2, `roles/verifier.md`, `roles/executor.md`,
  `docs-protocol.md`), against fourteen `KIT_FILES` entries;
  `interview/decomposition.md` is cited and already ships.
- **`T-175`: the cold-start test is OFFERED, never gated** —
  `T-171`'s open question 3. A completion gated on a SPAWN fails for
  reasons unrelated to the project's quality, which reproduces the exact
  stall @human hit one layer out.
- **NOT TAKEN — `T-154-s4`.** The three carve-outs are @human's own
  ruling; whether a fourth added from inside a lane joins them is not a
  seat's to decide on the ruling's behalf. Parked, routed, with the
  seat's recommendation written as a yes/no (KEEP IT, three re-derivable
  reasons) so @human answers a word rather than an essay.

## AND THE SITTING BROKE THE DOCS GATE'S ONE SPELLING, ON ITS OWN DIFF

Recorded because it is a live hazard in a shape `docs/CONVENTIONS.md`
does not name. The gate's printed recipe passes an UNQUOTED COMMAND
SUBSTITUTION, which zsh word-splits. This seat introduced a variable —
`PATHS=$(git status …)` then `docs-gate.mjs $PATHS` — and **zsh does not
word-split unquoted PARAMETER expansions**. The gate received all
nineteen paths as ONE argument and answered *"1 path(s) under docs/ are
code inputs"*: a plausible number, a wrong reading, exit 1 either way.
Re-run with a real array (`typeset -a P; P=(${(f)"$(…)"})`) it answers
**19**. The CONVENTIONS bullet's existing warnings cover the quoted-blob
and the `xargs` variants; **the variable variant is new, and the lesson
is the bullet's own: the ONE SPELLING is one spelling because every
variant of it has a different failure.** Routed as a suggestion? NO —
recorded here and left for the next sitting deliberately: it is a
hand-discipline sighting with one instance, and this project's own rule
is that a second instance is what earns a card.

## Gates

Run from the worktree this seat holds, exits read unpiped from a guarded
script file (the persisted-cwd trap), after the whole sitting was
written:

- **DOCS GATE, diff half** — `docs-gate.mjs` over all 19 changed paths:
  **exit 1, FIRES**, naming `npm test from app/`,
  `npm test from tools/e2e/`, `npx vitest run from lib/parser/`. All
  three were run, below. It also reports **every live task card's
  frontmatter parses, with a legal status** — the half that covers this
  sitting's 18 card rewrites — and governing-document budgets holding.
- `npx vitest run` from lib/parser/ — **336 passed, exit 0**
- `npm test` from app/ — **1060 passed, 49 files, exit 0**
- `npm test` from tools/e2e/ — **332 passed, exit 0** (3.6m)
- `npm run lint:docs` from tools/e2e/ — **exit 0**
- `npm run lint:tokens` from tools/e2e/ — **exit 0**
- `npm run typecheck` from tools/e2e/ — **exit 0**
- **GRAPH: NOT ASKED, and that is a deviation this record names rather
  than hides.** The sitting wrote `docs/**` only and `docs/` is excluded
  from the walk, so no indexed file moved — but the standing rule is ASK
  IT, never predict, and asking costs a multi-GiB cold cargo build in a
  worktree that has none. Sittings #2 and #3 recorded the same deviation
  for the same reason. The committed graph is unchanged at 1,039,590
  bytes by `wc -c`, which is a READ of the artefact and not the gate.
- **BOOT GATE: not owed** — no path under `app/src/**`,
  `app/src-tauri/**` or either manifest is in this diff.
- **METHOD EVAL GATE: not owed** — no `method/**` path in this diff.

## Owed after this record

- **@human — TWO items, one of them now blocking.** `T-140-s4` (the
  graph limit) is no longer a background item: at 410 bytes it holds
  eight of this sitting's ten promotions and every code dispatch behind
  them. `T-154-s4` is the new one and is a single word. The older items
  are unchanged and unhurried: milestone 3's closing word, the v1/v2/v3
  markup, `T-162-s1`, `T-169-s2`, M4, `T-025-s4`'s four routed
  questions, and `T-112`'s closing evidence.
- **THE NEXT METHOD RELEASE NOW HAS FIVE RIDERS, WHICH IS THE SITTING'S
  STRUCTURAL FINDING.** Three parked here name it as their resurfacing
  condition (`T-112-s2`, `T-154-s3`, `T-159-s6`), and two promotions owe
  a bump when they land (`T-173`, `T-176`), with `T-177`'s arm 3 a sixth
  if taken. `T-159`'s v0.1.8 was the last vehicle; the next one is worth
  cutting as a card rather than discovered by a lane that cannot reach
  all three stamps.
- **THE DISPATCHER — the two `[tools/e2e]` promotions are the only
  startable code work**, and they contend with each other on the same
  package: `T-112-s3` and `T-163-s5` cannot be two live lanes at once
  without one of them refusing at `--write-fence`.
- **`docs/CAPABILITIES.md` is untouched**: no spec file moved, so no
  behaviour sentence moved.

## Metrics (ADR-020)

Cards dispositioned: 14. Cards filed: 4. Corroborations appended: 1.
Rulings taken at the seat: 4. Rulings deliberately not taken: 2 (one
@human's, one held for a second instance). Rework cycles: 0. Preflight
refusals: **none run** — every promotion here is either graph-blocked or
awaiting a dispatcher, and `--preflight` is the DISPATCH step, run
against the card at the moment its lane is cut; running it now would
stamp a reading that the `T-140-s4` ruling will invalidate. Lanes before
and after: NONE. Tokens and wall clock: NOT DERIVABLE at this seat — no
meter was read, and this record refuses to invent them.
