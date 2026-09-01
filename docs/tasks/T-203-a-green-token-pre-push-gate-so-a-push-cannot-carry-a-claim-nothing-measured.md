---
id: T-203
title: A GREEN-TOKEN PRE-PUSH GATE — commits stay fast and pushes become unlyable, because three commits landed tonight after a gate that had already failed
feature: F-06
milestone: 4
priority: 1
size: M
status: verifying
blocked_by: []
touches: [.claude, tools/e2e]
suggested_by: "the outgoing architect seat's fix plan (relayed 2026-08-31, approved in direction by @human); the instances are this seat's own, measured the same night"
builder:
review: independent
---

**`docs/CONVENTIONS.md` ALREADY SAYS IT**: *"an edit script's success is a
GATE, not a step — never chain a commit after one."* **This seat broke
that three times in one night**, twice with `&&` and once in a guarded
chain, each time reading the exit **after** the commit had already run.
The rule was written down, read, and quoted by the seat that broke it.

## What it cost, and none of it was theoretical

- A commit landed on a **`census exit=1`** — STATE stale against a newer
  record, twice.
- A commit landed on a **parser red** — a card stamped out of `suggested`
  without its four required fields.
- **`blocked_by: [T-190]` naming a card that did not exist reached CI and
  redded it**, because the gate that would have named the failing body
  was never asked.

`T-167-s8` established the shape that works: **a guard that refuses a
PUSH**, keyed on a command's own exit, with no escape hatch — and its
blind verifier then proved the guard fires against a real bare remote.
This card extends that shape from one gate to all of them.

## What to build

**`T-202`'s runner writes a VERDICT TOKEN**: the tree hash it ran
against, plus a per-suite exit code and body count.

**Pre-push refuses when the token is MISSING, STALE (its tree hash is not
HEAD's) or RED.** And it **unconditionally runs the cheap checks** that
cost seconds and caught real defects tonight:

- the **parser parse-check on changed cards** — this is the exact check
  that would have refused `blocked_by: [T-190]` and the missing-fields
  stamp, both of which reached a push;
- **record-newer-than-STATE** — `docs-protocol.md` rule 4, which fired
  twice tonight *after* the commit.

**Commits stay fast; pushes become unlyable.** That division is the
design: the cost of a full battery is paid once per push rather than once
per commit, and the token is what makes "I ran the gates" a fact rather
than a claim.

**A SECOND ARM RIDES THIS HOOK AND IS NOT THIS CARD: the LANDING GATE**
(`T-212`) — at a LANE push, the merge-base-to-tip diff intersected with
the card's expanded fence, refusing any out-of-fence path. Split to its
own card so this one stays dispatch-ready: that gate needs `T-209`'s
intersection and this card does not. One hook, two arms, two cards —
`T-207`'s own precedent, one artifact per meaning.

## What a fix decides

1. **Where the token lives.** It must not be committable — a token in the
   tree can be stale-but-matching after an amend. A runtime path like
   `.nputer/` (already gitignored by a file the tool writes) is the
   obvious candidate; argue it.
2. **What "stale" means against an amend or a rebase.** The tree hash is
   the honest key; say what happens when a commit is amended after a
   green run.
3. **Whether the cheap checks can ever be skipped.** `T-167-s8` shipped
   its guard with **no escape hatch** and argued why. Follow that unless
   there is a measured reason not to.

## Acceptance criteria

- A push SHALL be REFUSED when the verdict token is missing, when its
  tree hash does not match `HEAD`, or when any suite it records is red.
- THE cheap checks SHALL run on every push regardless of the token, and a
  body SHALL prove each one refuses its own measured instance —
  **an unresolvable `blocked_by`, and a record newer than STATE**.
- **A POSITIVE CONTROL SHALL prove a clean push is ALLOWED**; a guard
  that refuses everything is indistinguishable from one that works, which
  is `T-199`'s lesson and this project's most expensive one.
- THE guard SHALL be proved to FIRE end to end — a stale token, a real
  push attempt, and the remote ref asserted UNCHANGED — following
  `T-167-s8`'s three-arm shape rather than asserting a decision function's
  return value.
- **This card is GUARD-CLASS**: `review: independent` is owed and SHALL
  be set at dispatch. The one time this seat missed that, the verifier it
  should have had found three mutants that would have refused every push
  in the repository.
- Verification: headless.

## Read beside

`T-202` (which produces the token — this card is blocked on it),
`T-167-s8` (the guard whose shape this extends, landed and verified),
`T-212` (the landing gate, this hook's other arm), `T-209` (the
intersection that arm calls), and `docs/CONVENTIONS.md`'s
edit-script-is-a-gate bullet, which this card makes mechanical.

## Implementation notes — built on `task/T-203-lane`

**WHAT THE THREE DECISIONS WERE ANSWERED WITH.**

1. **Where the token lives** — `.nputer/gate-verdict.json`, the runtime
   directory T-154 already created with its self-ignoring `.gitignore`.
   The argument is the amend, and it is the one the card asked for: a
   token IN THE TREE can be stale-but-matching, because amending a commit
   to change a source file leaves the committed token intact and
   describing a tree that no longer exists — while its own presence in
   the tree changes the tree it would be compared against. `git
   check-ignore` is asked for this in a body, with a tracked path as the
   control, rather than the property being inferred from the path's
   spelling.
2. **What "stale" means** — the **tree hash**, `HEAD^{tree}`, recorded
   PER SUITE. An amend that changes only the message keeps the token
   valid (the suites graded that content, and the content has not moved);
   an amend or rebase that changes a file stales it. A rebase that
   reorders commits onto the same final tree keeps it valid, and that is
   a STATED LIMIT rather than an oversight — a tree hash cannot see
   history. Both directions are measured in one body.
3. **Whether the cheap checks can be skipped** — no, and no flag exists.
   `T-167-s8`'s argument held: the one candidate case had a one-command
   remedy, and a hatch for a case that already has a remedy is a hatch
   that gets used for every other case.

**A FOURTH DECISION THE CARD DID NOT NAME: the token must be COMPLETE.**
A token recording one suite is not a lie — it says exactly what it
measured. It is the READER that would lie, by accepting "the gates are
green" from a claim about a quarter of them. So the required set is the
whole graded registry and a token missing an entry is refused as
INCOMPLETE, naming the suites. The required list is held in the hook
(which may not import the registry — its matcher fires on every `Bash`
call in a session) and is COMPARED against `GRADED_SUITES` by a body, the
treatment `LANE_BRANCH_RE` and `GRAPH_REL_PATH` already get.

**THE TOKEN ARM FAILS CLOSED AND EVERY OTHER ARM IN THAT FILE FAILS
OPEN**, which is criterion 1 rather than drift, and the module header now
says so at the point a reader meets the old rule. A missing token is not
an unanswered question; it is the answer — nothing was measured — and a
guard that allowed there would pass its own subject. What still fails
open is the guard's inability to KEY the question: a checkout whose
`HEAD^{tree}` git will not name has no tree to compare against, so that
arm is announced and allowed, with a body driving both sides.

**A COST THAT ROSE, RECORDED RATHER THAN DISCOVERED.** `gitInvocations`
is a whitespace scanner whose own header records that `echo git push`
reaches the refusal. Under the graph arm that cost was bounded by a real
staleness the seat already owed. Under the token arm it is not: a stray
`git push` inside an unquoted string is refused whenever the battery has
not been run against HEAD's tree. The scanner is a landed guard's and was
neither widened nor narrowed here; the new cost is stated in the module
header so the next reader meets it in a comment rather than in a refusal.

**TWO SIBLING SPECS CHANGED, AND THAT IS THE GUARD BEING REAL.** A new
precondition on every push in this repository means every fixture that
drives a push must now express "the gates were run against this tree".
`push-guard.spec.ts`'s fixture plants a fresh green token by DEFAULT (a
fixture with none would refuse before the graph arm was ever reached, and
every graph body would have been measuring the token arm while reading as
though it measured the graph); `landing-gate.spec.ts` refreshes one at
the push rather than at fixture build, because its bodies commit in
between and the key is the tree.

**THREE OF THIS REPOSITORY'S OWN TRIPWIRES FIRED ON THIS WORK AND ALL
THREE WERE RIGHT.** `brief-flush.spec.ts` caught `push-checks.mjs` ending
at `process.exit()` after writing (fixed to `process.exitCode`, not
argued into the exempt list); `git-fixture.spec.ts` caught the new
`gate-run.spec.ts` fixture committing without spreading
`NO_BACKGROUND_MAINTENANCE`; and the new placement check itself caught
`landing-gate.spec.ts`'s fixture cards carrying `status: building` with
none of the four fields the parser requires — cards the parser would
refuse, standing in for cards it would not.

**ONE IMPLEMENTATION, NOT TWO** (T-057): the record-newer-than-STATE
derivation MOVED from `docs-gate.mjs` into `docs-scan.mjs` as
`staleStateRecords` and both readers now call it, which is the treatment
`DOC_BUDGETS` got at T-156 for the identical reason. A body asserts the
gate calls the shared derivation rather than carrying its own.

### Owed at the merge, outside this lane's fence

- **`docs/CAPABILITIES.md` REGENERATION.** `npm run capabilities:check`
  exits 1 — committed **36,429** bytes against a fresh generation of
  **38,897** bytes, measured at this lane's tip. The regeneration is the
  integrator's step and lands in the merge commit (the practice at
  `8422407`, `4cb2313`, `a2b53e3`, `75093ce`); `docs/CAPABILITIES.md` is
  outside `[.claude, tools/e2e]`.
- **`docs/CONVENTIONS.md` gets no bullet for this gate.** The BLESSED
  GATE-RUNNER bullet still describes the runner without its token, and
  nothing in that file yet tells a seat that a push now needs one. Routed:
  the file is outside this fence.
- **`docs/STATE.md`'s hazard line is now false.** It reads *"NOTHING
  GATES THE PUSH YET (T-203/T-216 open)"*. Routed for the same reason.
- **The docs gate's own STATE-staleness reporting has no body.** The
  poison drill's M7 killed two bodies in `push-checks.spec.ts` and
  `push-guard.spec.ts` and NONE in `docs-input-gate.spec.ts` — the check
  was untested where it already lived, and this card moved it rather than
  covering that half. Pre-existing, named rather than silently inherited.

## `review: independent` SET AT FILING, not left for a dispatch to remember

**A pre-push gate — its job is to REFUSE a push.**

`method/tasks/TASK-FORMAT.md` requires this field **set at dispatch** for
a guard-class card. This seat has now missed that three times running —
including on the card immediately after a verifier assigned *"flagged so
the next dispatch sets it"* as a correction.

**So it is set here, at filing, where the judgement is already being
made.** `T-204`'s refusal 3 will make it mechanical; until that lands,
setting it early is the only thing between the rule and a fourth miss.
