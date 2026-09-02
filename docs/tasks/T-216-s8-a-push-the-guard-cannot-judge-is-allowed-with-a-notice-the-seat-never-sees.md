---
id: T-216-s8
title: A push the guard cannot judge is ALLOWED with a notice the seat never sees — a `cd <dir>;` before the push turned a STALE-token refusal into a silent allow, and an unverified tree reached origin
feature: F-06
milestone: 4
size: S
priority: 2
status: verifying
suggested_by: the architect seat, measured by probing the hook with the pushed command line, 2026-09-02
blocked_by: []
touches: [.claude/hooks/push-guard.mjs, tools/e2e/tests/push-guard.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

## The finding, measured

At 10:53Z the seat pushed a2335c6 with a token minted at 5af76ff (a
different tree). Probing the hook afterwards with the two spellings:

- `git push origin main` — PUSH REFUSED: the verdict token is STALE
  against HEAD's tree (exit 2). Correct.
- `cd /Users/ujju/Projects/nputer; git push origin main 2>&1 | grep …`
  — the exact line the seat ran — NOTHING ABOUT THIS PUSH WAS JUDGED:
  "a `cd` reaches this push through a separator that is not `&&`", the
  token, graph, board and fence ALL UNVERIFIED, exit 0, allowed.

The guard's own rule (T-216) reads only what the text DETERMINES and
declines to guess a working directory after a `;`. That is right. What
is wrong is the VERDICT on the undetermined case: an allow. A PreToolUse
hook's stdout on exit 0 is not shown to the seat, so the notice reached
nobody, and a tree no battery had graded went to origin. The one arm in
the file that "refuses on an ABSENCE" is the token arm — and this
spelling routed around it by making the token unreadable rather than
stale.

## What is asked

A command whose text contains a push the guard cannot place SHALL be
REFUSED (exit 2) with the same remedy the notice already spells —
`git -C <checkout> push` — not allowed with a notice. The refusal names
the separator it could not read past. The three determinable spellings
(`-C`, `cd <literal> &&`, an unmoved working directory) are unchanged.
A command with no push in it is unchanged.

## Acceptance criteria

- The exact command line above is refused by name, and the refusal text
  contains the `git -C` remedy.
- `cd <dir> && git push`, `git -C <dir> push` and a bare `git push`
  with a fresh token are still allowed; with a stale token the bare form
  is still refused as STALE (the existing body).
- A positive control demonstrated failing: the mutant that restores the
  allow on the undetermined case reds exactly the new body.
- No other arm's verdict moves: the existing push-guard bodies are green
  at the tip, and the drill kill sets are disjoint from theirs.

## TRIAGE, 2026-09-02 — filed `planned`, priority 2, behind T-228 by fence

Filed by the seat that pushed the tree. The evidence is a probe, not a
reading, so it is planned at once — but T-228 holds the whole `.claude`
directory until it lands, and the arm refused this lane on that shared
path. The seat had stamped it `building` and cut a lane before deriving
that; the lane was removed unarmed. Dispatch at T-228's merge; T-238-s1
shares the fence and waits behind this card.

## BUILT, 2026-09-02 — the lane's record

Base `2f813e8`. `push-repository-unresolved` is a `block` at exit 2,
carrying `git -C <the checkout being pushed> push` and naming the
construct it could not read past; it leaves `ANNOUNCED_ALLOW_CODES`
because it is no longer an allow. `push-repository-unresolved-outside`
is untouched — still a silent allow, T-216's sixth criterion.

**THE THIRD CRITERION IS MET IN THE STRONG FORM, BY A DIFFERENT MUTANT
THAN THE ONE THE CARD NAMES, AND THE CARD'S OWN MUTANT DOES NOT HAVE
THAT PROPERTY.** *Restore the allow* (`block(` → `allow(`) reds FOUR
bodies, not one: the new body and the three that had to change with the
verdict. It could not have redded only the new body — a body asserting
`exit 0` on this arm cannot survive the arm refusing. The mutant that
reds EXACTLY the new body is a different one, aimed at what only that
body reads: replace the separator's own sentence in `pushCwds` with a
generic *"the working directory at the push is not determined by the
text"*. 1 failed / 85 passed, and the failure is the new body.

Five drills, all one-side (the code, never an assertion), each read back
with `git diff` and restored by sha256 against `89cf296`, measured over
`push-guard.spec.ts`'s 86 bodies:

| mutant | what it changes | kills |
|---|---|---|
| A | `block(` → `allow(` on the undetermined case | 4 — the new body + the three changed |
| B | the `git -C …` remedy line dropped from the refusal | 2 — the new body + *a spelling this guard cannot read* |
| C | the separator's sentence replaced by a generic one | **1 — the new body, and nothing else** |
| D | the code put back into `ANNOUNCED_ALLOW_CODES` | 2 — the census body + *an unresolvable push outside* |
| F | the separator check accepts ANY separator | 3 — the separator body, the new body, the resolver table |

## Attribution owed by the dispatch: the holder body's intermittent

*"a lane holds no seat, so a holder record in one refuses nothing"* —
red under the whole e2e suite on a loaded machine, green alone, filed at
`T-238-s1`'s absorbed `T-229-s11`. **NOT CHANGED HERE**: it is a
different arm from this card's. The attribution, derived rather than
reproduced:

The recorded failure is the control's OR — `control.verdict === "block"
|| notices.includes("SEAT")`. Enumerate the states that satisfy NEITHER
half and the answer is small: `held` blocks, `dead` and `unknown` each
emit a sentence carrying `SEAT`, and `mine` is unreachable (the composed
session's pid is `process.ppid` and the record's is `process.pid`). So
the body can only red through a SILENT allow — `not-a-repository`,
`not-this-repository`, holder `vacant`, or holder `not-integration` —
and **every one of those four is reached only through an
errno-swallowing filesystem probe**: `existsSync` (which returns `false`
for EMFILE and EACCES exactly as it does for ENOENT) at
`readHolder`'s own first line and at `decideWith`'s indexer-manifest
check, and a bare `try/catch` around `statSync`/`readFileSync` in
`gitDirOf`/`headRefIn`. Under the peak descriptor and process pressure of
the full suite — which is precisely the condition the card's table
records, six concurrent Playwright processes — a probe that answers
"not here" for a file that IS there turns a load artifact into a verdict.

**AND IT EXCLUDES THE OBVIOUS SUSPECT.** `decideWithSeat` seams `check`,
`cheap`, `gh` and the session identity but NOT `readProcess`, so
`identityAlive` spawns a real `ps`; that spawn failing is the reading of
the host everyone looks at first. It is not this failure: every state a
failed `ps` can produce is `dead` or `held`, and both satisfy the OR.
A failed `ps` would red the NEXT assertion, `control.code`, which is not
the one recorded.

**THE CHEAPEST NEXT STEP IS NOT A FIX**: put `d.code` and the notices
into the two assertions' own messages, so the next red attributes itself
instead of costing another lane this derivation.
