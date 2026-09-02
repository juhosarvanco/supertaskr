---
id: T-239
title: THE DISPATCH RITUAL IS EIGHT HAND STEPS AND ONE ARM COULD PERFORM THEM IN ORDER, REFUSING AT THE FIRST FAILED STEP — the order is law, every step has a command, and only the seat's memory joins them
feature: F-06
milestone: 4
priority: 3
size: M
status: verifying
blocked_by: []
touches: [tools/e2e/scripts/brief.mjs, tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts, tools/e2e/tests/brief-flush.spec.ts, docs/CONVENTIONS.md]
suggested_by: "the architect seat, 2026-09-02 — item 6 of docs/rooms/loop-efficiency.md; measured across the four lanes dispatched that night, each cut by hand in the order orchestrator 5b and 5c prescribe"
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

**EVERY STEP IS RIGHT AND THEIR SUM IS TWENTY MINUTES OF A SEAT'S
ATTENTION PER LANE.** Stamp `building` on the integration branch and
commit; cut the worktree from that commit as a sibling with an absolute
path; run `--preflight`; run `--write-fence` against the worktree; read
the manifest back; cut the verifier's bench, detached, at the same base;
assemble the brief to a file; derive the lane's port and scratch stem
from the card number. Each step has a command today; the ORDER is law
(orchestrator 5b, 5c; the serial-ritual bullet in CONVENTIONS); nothing
joins them but the dispatching seat, which is the seat that inverted
the order on 2026-09-01 (T-226) and cut four worktrees before arming
any (T-209's refusal).

T-204 generates the PROMPT; this card performs the RITUAL. They meet at
the end: the arm's last line is the covering message T-204 assembles.

## The arm

`brief.mjs --dispatch-lane T-NNN --slug <slug>` [--executor <seat>
--verifier <seat>], run from the integration checkout by the holder,
performs the steps above IN ORDER and refuses at the first that fails,
leaving the tree as it found it where it can: a failed preflight after
the stamp reverts nothing (the stamp is a fact about the card, T-226)
but removes no worktree it did not cut; a failed `--write-fence` after
the cut removes the worktree it just cut and says so. Every refusal
names the step, the command it ran, and its exit — the four house codes.

## Acceptance criteria

- WHEN the arm succeeds THE tree SHALL be exactly what the eight hand
  steps leave: the stamp commit on the integration branch, the lane
  worktree on its branch at that commit, the manifest in the lane, the
  bench detached at that commit, the brief file, and one printed block
  of lane facts (branch, worktree, base hash, bench, port, scratch stem,
  brief path) — a body SHALL compare the arm's result with a hand-run
  ritual on a fixture, file for file.
- IF any step fails THEN THE arm SHALL stop at that step, name it with
  its command and exit, and SHALL NOT perform a later step; a body per
  step SHALL prove the stop.
- THE arm SHALL refuse to cut a lane whose card is not stamped
  `building` on the integration branch (T-226's parked refusal, taken
  here), and SHALL refuse to run in a checkout that is not the
  integration checkout.
- THE port and scratch stem SHALL be DERIVED from the card number by the
  spelling CONVENTIONS publishes, never typed.
- THE arm SHALL write nothing the eight steps do not already write, and
  the READ arms of `brief.mjs` SHALL remain reads (the existing body
  *THE COMMAND IS A READ* stays green).
- Verification: headless.
- **Guard-class: `review: independent`, set at filing.**

## Read beside

orchestrator 5b and 5c, the CONVENTIONS serial-ritual and E2E PORT
bullets, T-204 (the prompt half), T-226 (the refusal this absorbs),
T-209 (the disjointness guard the arm calls), T-233 (the base row the
arm makes true by construction), and docs/rooms/loop-efficiency.md
item 6.

## Implementation notes

**THE ARM IS `brief.mjs --dispatch-lane <T-NNN> --slug <slug>`**
(`[--executor <seat>] [--verifier <seat>] [--scratch <dir>] [--dry-run]`),
and it is the THIRD writing arm of a command whose header used to say
there were two — the count was amended in the same commit, because
nothing reads that header but a person and it was about to be false.

**THE SPLIT IS THE ONE `brief.mjs` ALREADY PUBLISHES.** The DERIVATION —
`dispatchLanePlan`, the spellings, `stampCard`, `stampVerdict`,
`manifestVerdict`, `createLaneArgv` — is pure and lives in
`dispatch-brief.mjs`; the RUNNER, `runDispatchLane`, is the one function
in that module that acts, and it acts only through the `DispatchIo` it is
handed. That is what makes a `--dry-run` a plan and nothing else, and it
is what lets one body per step drive a REAL failure at that step without
cutting eight worktrees.

**THE ORDER IS `DISPATCH_STEPS` AND IT IS WRITTEN DOWN ONCE**: stamp and
commit (and read the stamp back out of the commit), cut the lane at that
commit, preflight, write the fence, read the manifest back, cut the bench
detached, assemble the brief to a file, derive the port and the scratch
stem and prove the port free. Every refusal names the step, the command
it ran and its exit in the four house codes; every worktree THIS RUN cut
is removed and named; the stamp is never taken back (T-226).

**FOR THE VERIFIER, THE FOUR PLACES A CHOICE WAS MADE:**

1. **THE SUB-COMMANDS ARE THIS COMMAND RE-ENTERED**, never the copy in
   whatever `--root` names. A dispatch that ran a different
   implementation from the one it was asked of is the stale-checkout
   split `checkout-currency.mjs` exists to catch. It also means a fixture
   root needs no built parser.
2. **STEP SEVEN ACCEPTS `FOUND` AND EVERY OTHER STEP DOES NOT.** Code 1
   from the brief means "assembled and found something" and the document
   is on disk; from the preflight it means claims that no longer hold,
   and from the fence it means no manifest was written. The `FOUND` brief
   is announced, not swallowed.
3. **STEP EIGHT PROBES THE PORT** because the bullet it derives the port
   from says "`lsof` to zero rows before binding". `lsof` answers 1 over
   no rows, so the ROWS are the verdict and its exit is recorded in the
   detail rather than reported as the step's.
4. **THE BENCH SPELLING DID NOT EXIST** and is published in this commit
   (`../nputer-V-T-NNN`, detached), read back out of the lane bullet
   rather than typed. The stale ritual clause beside the fence bullet —
   "derive the brief, PREFLIGHT the card, write the fence, stamp and cut",
   an order no seat could perform — is CORRECTED there rather than argued
   beside.

**THE POISON DRILLS.** Eleven mutants, each landing read back with
`git diff` and each restored by `shasum -a 256`: mis-report the stopping
step (kills 9 — the eight per-step bodies and the stamp read-back, and
**0 of the 40 bodies `brief.spec.ts` already had**, measured over the
whole spec); a stamp anchored on a missing key becomes a no-op (1); the
manifest read-back accepts anything (1); the port base typed instead of
read (1); the create command assembled from memory (1); the brief written
under a defaulted name (1); the dry run performs the ritual (1); a dial
accepted and ignored (1); the not-integration refusal dropped (1); the
arm list one excuse short (1, and it names the flag); and a flag added to
`brief.mjs` that nothing announces (1, the producer-side half of the
same coverage body).

**THE FENCE WAS WIDENED TWICE AND NEITHER TIME BY ME**:
`docs/CONVENTIONS.md`, because orchestrator 5b requires a new command's
SPELLING to be published there; and `tools/e2e/tests/brief-flush.spec.ts`,
because its arm-coverage body derives `brief.mjs`'s own `FLAGS` literal
and reds by name on a flag nothing announces — six new flags, so six
`NOT_AN_ARM` entries, `--dispatch-lane` as a writer and the five dials as
its modifiers.

**THE TWO E2E REDS AT THIS REF ARE REF SKEW AND ARE NAMED**:
`session-economics.spec.ts`'s *"the recommended seat is a function of the
CARD"* and *"the advisory line is NOT a contract row"* both require
`brief.mjs --task` to answer 0, and it answers 1 because the board READ
AT THIS REF is not fence-disjoint: `T-205-s8`'s card here is the
`suggested` one carrying `touches: [tools/e2e]`, a fence that contains
every other tools/e2e lane's. At main's tip that card reads `building`
with `touches: [tools/e2e/tests/session-economics.spec.ts]` (the triage
commit landed two minutes after this lane's base), and the board is
disjoint. Nineteen overlap findings were measured in this lane and eleven
name no T-239 file at all. **It is worth saying which way this cuts**:
the arm this card builds reads the stamp back out of the commit and
refuses a card the integration branch does not carry as `building`, so it
would have refused that dispatch — the red is a point in the arm's
favour, and `T-205-s8`'s own lane is closing the class.

**WHAT IS ROUTED AND NOT BUILT**: `T-239-s1` (the arm's last line is
T-204's covering message and nothing assembles one yet), `T-239-s2` (the
scratch DIRECTORY is defaulted where only the file name is published) and
`T-239-s3` (the bench is cut and left unbuilt).
