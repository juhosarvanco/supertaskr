---
id: T-223-s3
title: "The disclosed-limit body survives a data mutant that empties the RANGE instead of widening the fence — both routes end in the same allow, and one merge-base assertion separates them"
status: done
feature: F-06
milestone: 4
priority: 3
size: S
blocked_by: []
touches: [tools/e2e/tests/landing-gate.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
verified_by: claude-opus-5@subagent
review: independent
suggested_by: verifier claude-opus-5@subagent @V-223
---

`landing-gate.spec.ts`'s *"THE DISCLOSED LIMIT, MEASURED: a lane moves
local `main` with `update-ref` and this gate follows it"* moves `main` to
a commit whose card is WIDER and asserts the push is then allowed, is not
an announced cannot-compare, and reaches the remote. **There is a second
route to that same allow, and the body's closing assertions do not
exclude it.**

## Measured, one side only, at `58c8001` in the verifier's bench

Data mutant, applied to the body's own fixture and read back from
`git diff -U0`:

    -  git(fx.root, "update-ref", "refs/heads/main", wide);
    +  git(fx.root, "update-ref", "refs/heads/main", laneTip);

`npx playwright test tests/landing-gate.spec.ts` → **24 passed, exit 0.
SURVIVES.**

## Why both routes end in an allow

Measured at the base `28924c7` against `laneLandingVerdict` directly, in
a throwaway repository, before this card's diff existed:

| `main` points at | verdict | code | reason |
|---|---|---|---|
| the widened commit | allow | `landing-gate-inside-the-fence` | `1 path(s), merge-base <the original main>` |
| the LANE TIP | allow | `landing-gate-inside-the-fence` | `0 path(s), merge-base <the lane tip>` |

Moving `main` onto the lane's own tip makes the merge-base the tip, so
`rangePaths` returns NOTHING and every path is trivially inside any
fence. The fence is never widened; the RANGE is emptied. Both are real
consequences of the same disclosed limit, and limit 6 in the hook's
header covers both — but the body's name says *the gate follows the moved
ref to a wider fence*, and that is the half it should be pinned to.

## The one-line strengthening, and it can fail

Add, immediately after the second push:

    expect(git(fx.root, "merge-base", "main", "HEAD").trim(),
      "the allow came from an EMPTIED range, not from a widened fence")
      .toBe(narrow);

Checked against the rule that a proposed control must be able to fail:
under the mutant above the merge-base is the lane tip, so the assertion
reds; in the body as written it is `narrow`, so it passes. It costs one
line and no new fixture.

**NOT A DEFECT IN THE DIFF THAT SHIPPED IT.** The companion data mutant —
making the moved-to commit's card NARROW instead of wide — kills that
body ALONE (1 failed / 23 passed), so it does bind to the fence declared
at the moved ref. This is a sharpening of a body that already
discriminates.

## TRIAGE, 2026-09-02 — PROMOTED, placement fields written at the seat

One `merge-base` assertion after the second push, shown able to fail
against the data mutant that empties the range — T-229's class at the
size of one line. Fence: the spec alone.

## BUILT, 2026-09-02 — the assertion landed and the card's own mutant was re-spelled

The one-line strengthening is in, immediately after the second push, with
the comment that says which route it excludes. Measured in this lane, one
side at a time, restored by sha256 between drills:

| drill | spec state | result |
|---|---|---|
| none (base `695954f`) | as shipped | 24 passed, exit 0 |
| none (tip) | with the assertion | 24 passed, exit 0 |
| RANGE-EMPTYING, as this card spells it (one line) | base | **1 failed / 23 passed** — and NOT at a closing assertion |
| RANGE-EMPTYING, re-spelled (two lines) | base | 24 passed, exit 0 — **SURVIVES**, as this card claims |
| RANGE-EMPTYING, re-spelled | tip | **1 failed / 23 passed**, killed BY NAME at the new assertion |
| companion NARROW card, as this card spells it | tip | 1 failed / 23 passed — but on `git commit` refusing an EMPTY commit |
| companion NARROW card, re-spelled `[tools/e2e, .claude]` | tip | 1 failed / 23 passed, killed at "the gate did not follow the moved ref" |

**THIS CARD'S MUTANT DOES NOT SURVIVE AS SPELLED, AND THE FINDING IT
NAMES IS STILL REAL.** The body carries, two lines below the `update-ref`,
a self-check on the mutation step itself —
`expect(git(fx.root, "rev-parse", "main").trim(), "\`git update-ref\` did
not move main").toBe(wide)` — so moving `main` to `laneTip` while leaving
that line naming `wide` reds THERE, at the bookkeeping, never reaching the
closing assertions this card is about. Verified against `58c8001` itself:
the body at that ref is byte-identical here, so the "24 passed, SURVIVES"
reading cannot have come from the one-line diff as printed. The faithful
DATA mutant moves the data and lets the mutation's own self-check follow
it, touching no assertion about the gate's behaviour:

    -  git(fx.root, "update-ref", "refs/heads/main", wide);
    -  expect(git(fx.root, "rev-parse", "main").trim(), "`git update-ref` did not move main").toBe(wide);
    +  git(fx.root, "update-ref", "refs/heads/main", laneTip);
    +  expect(git(fx.root, "rev-parse", "main").trim(), "`git update-ref` did not move main").toBe(laneTip);

That one survives the shipped body at 24 passed, exit 0, and the new
assertion kills it alone with its own message. The strengthening this card
asked for is exactly right; only the mutant's spelling was wrong.

**AND THE COMPANION MUTANT WAS PASSING FOR A REASON NOBODY MEASURED.**
Rewriting the moved-to card as `[tools/e2e]` writes the SAME BYTES the
fixture already committed on `main`, so `commit()` fails on an empty
commit and the body dies in its own setup — 1 failed / 23 passed, the
count this card reports, from a fixture crash rather than from the gate
refusing. Re-spelled as `[tools/e2e, .claude]` — still narrow against
`docs/ARCHITECTURE.md`, but a real edit — the push IS refused and the body
dies at "the gate did not follow the moved ref", which is the claim. The
new merge-base assertion passes first under that mutant, so it masks
nothing.

## VERDICT, 2026-09-02 — APPROVED — verifier claude-opus-5@subagent

### The blindness I had, stated because a later reader cannot tell them apart

**The CLOCK kind, not the discipline kind** (roles/verifier.md: phase 1
"may reach you before the work exists"). This bench was cut alongside the
lane and phase 1 was dispatched before any tip existed — there was no
diff to decline to read. The attack set and the ground truth were written
and **SEALED at `2026-09-02T12:10:34Z`**, before the executor reported:

    attack-V-T-223-s3.md   bfeaeec318ed8252e66e398e29424629c204458ddcfdc7b7abb18ef193ecb302
    ground-V-T-223-s3.md   b78a7cbdd0f924294b606f53b8c05c4c23156184de49181b02834923fbe636af

Both re-verified byte-unchanged after this verdict was written. My
brief's phase-1 duties named no executor-derived figure; the executor's
report reached me in the phase-2 message, after the seal.

### What the seal bought: two corrections PREDICTED, not discovered

My sealed ground reached, independently and before the lane reported,
**both** corrections the BUILT section above records:

- the card's one-line `update-ref` mutant is **DEAD at the base** — 1
  failed / 23 passed, red at the fixture self-check two lines below,
  never reaching a closing assertion;
- the companion `[tools/e2e]` mutant writes the bytes `main` already
  carries, so `commit()` fails on an EMPTY COMMIT and the body dies in
  its own setup — the count is right and the gate never ran.

A sealed pre-diff measurement agreeing with the lane's own is the
strongest evidence available that neither reading was shaped to fit the
other. **This is the seal earning its keep, and it is why the verdict
can be short about the things it agrees with.**

### The criteria, re-derived at `c4f3011` rather than adopted

| # | criterion | how it was answered |
|---|---|---|
| C1 | ONE assertion, immediately after the second push, the card's text | present verbatim, after `const followed = pushThroughGuard(…)`, ahead of the three closing assertions |
| C2 | the control CAN FAIL | drilled: reds under the range-emptying mutant **with its own message**; passes unmutated |
| C3 | the body still binds to the WIDENED FENCE | the corrected companion still kills it alone, at the same assertion |
| C4 | one line, no new fixture | no new `fixture()`, no new `test(`, no new helper, no new scratch root; 17 lines = a 4-line assertion and its comment |
| C5 | no test NAME moves | census byte-identical, below |
| C6 | fence: the spec alone | held, below |
| C7 | green at the tip | gates below; the one red attributed by name |
| C8 | the disclosed limit is not rewritten | the body's header comment and `.claude/hooks/landing-gate.mjs`'s limit 6 are untouched — a sharpening, not a closing |

Every pre-committed wrong term in my sealed attack set was checked and
**none is present**: not `.toBe(wide)`, not `.toBe(fx.cut)`, not a
re-statement of `rev-parse main === wide`, not a `.not.toBe(laneTip)`
inequality, not a missing `.trim()`, not a placement before the push,
not a new body, not a widened `touches:`, not an edit to
`docs/CAPABILITIES.md`, and none of the three closing assertions was
weakened or removed. No `.only`, no skip, no `retries` change.

### The drills — mine, at the tip, landing read from `git diff`, restore proved by sha256

| drill | result | WHERE it died |
|---|---|---|
| unmutated tip | **24 passed**, exit 0 | — |
| range-emptying, two-line (the faithful data mutant) | **1 failed / 23 passed** | **at the NEW assertion, by its own message** — *"the allow came from an EMPTIED range…"* |
| range-emptying, one-line (as this card first spelled it) | 1 failed / 23 passed | at the `update-ref` self-check — unchanged by this diff |
| companion, re-spelled `[tools/e2e, .claude]` | 1 failed / 23 passed | at *"the gate did not follow the moved ref"*, on the real `PUSH REFUSED` text |
| companion, as first spelled `[tools/e2e]` | 1 failed / 23 passed | on `git commit` refusing an empty commit, in fixture setup |

Restoration **5-for-5**: after every drill the object and the worktree
both hashed
`890d413a2798b11e089ca741268683c3ebb54020ff0c34343abdcad465a85876`.

**KILL-SET CONTAINMENT, which is the grading and not the count.** The
new assertion kills the range-emptying mutant and PASSES under the
companion; the three closing assertions kill the companion and NOT the
range-emptying mutant. **Neither set contains the other**, so the
addition is load-bearing rather than a restatement. And it dies at the
SITE the property lives: the mutant moves only which commit local `main`
names, and the assertion that reads exactly that relation is the one
that reds.

### The gates this verdict owes

The DOCS GATE, given the three literal paths in the merge's diff at main
`3676dd7`, **FIRES** and names three suites — `npx vitest run from
lib/parser/`, `npm test from app/`, `npm test from tools/e2e/`. It also
answers *"every live task card's frontmatter parses, with a legal
status"* and *"0 frontmatter issue(s) in the live tree"*, checked rather
than assumed on this verdict and on the card this lane files.

    gate-run parser   exit 0  bodies=372   GREEN  ref c4f3011
    gate-run app      exit 0  bodies=1141  GREEN  ref c4f3011
    gate-run e2e      exit 1  bodies=619   617 passed / 2 failed, ref c4f3011

### The e2e red, attributed by NAME at the base and never by count

Both failures are `session-economics.spec.ts` bodies and both carry ONE
cause: the brief refuses because `task/T-202-s1-solo-lock-whole-path-key`
holds a live worktree on this machine while no card at the checked-out
ref declares that id. That card was filed on `main` at `27a20ff`, AFTER
this lane's base — so any ref in this lane cannot carry it.

- at the tip `c4f3011`: **2 failed / 8 passed**
- at the base `695954f`, same machine state, diff ABSENT: **the SAME 2
  failed / 8 passed**
- at `main` `a7e38c2`, which DOES carry the card: **10 passed**
- and my sealed ground holds the whole lane at `695954f` at **619
  passed, exit 0**, measured before that worktree existed

Four readings, one conclusion: **this red is a live-environment fact,
not this diff.** It is the same class `c26a3b0` recorded, and it will
not survive the merge, because `main` already carries the card.

### One correction — recorded, not blocking, and not filed

The new comment's last sentence reads *"under the data mutant that moves
`main` to `laneTip` the whole body passes without this line and fails
here with it."* That is true of the **two-line** spelling only. The
one-line spelling — the one a future reader reaches for first, and the
one this very card first printed — reds at the `update-ref` self-check
and never reaches this assertion. The comment is the durable artefact
and it reproduces, in the spec, the ambiguity the lane diagnosed on the
card. **The precise form is "the data mutant that moves `main` to
`laneTip` AND lets the mutation's own self-check follow it".** Recorded
here rather than filed as a card: `T-223-s5` already carries the rule,
and a second card for one clause would be board noise.

### Security sweep (mandatory, step 3)

139 added lines across the three files. **No** import, require or
dependency added; **no** `execFileSync`, `spawnSync`, `fetch`, `http`,
`writeFileSync`, `rmSync` or `process.env` in the added lines; **no**
secret-shaped token. The assertion spends only `git()` and `expect`,
both already in scope in that body, and reaches no new input path, no
endpoint and no query. The other two added files are prose under
`docs/tasks/`. **Clean.**

### Fence, adjacency, and the census

- The diff is `tools/e2e/tests/landing-gate.spec.ts` plus two cards
  under `docs/tasks/`, derived with `git diff --name-only` rather than
  eyeballed. `touches: [tools/e2e/tests/landing-gate.spec.ts]` HELD;
  `docs/tasks/` is unfenceable by every manifest.
- **The census does not move.** The test names across
  `tools/e2e/tests/*.spec.ts`, read out of the git objects at both refs,
  are byte-identical — 590 lines,
  `91fc59ab71649ed4881bbccf15d96810652da924fb11b88df266943c2275e004` at
  `695954f` and at `c4f3011`. So `capabilities:check` is CURRENT and
  **the integrator is owed no `npm run capabilities` at the merge**,
  exactly as the card promised.
- `T-223-s5` parses clean, carries `suggested_by:`, and is correctly
  ROUTED rather than built: its subject is `method/roles/verifier.md`,
  outside this lane's fence. Its two sub-rules are the ones this seat
  reached independently.
- The card's claim that the body at `58c8001` is byte-identical is
  VERIFIED — the whole file at that ref hashes
  `a9ed692ffcf3fa1ad2e0a40ce6543c1cfc9f26138b6d5a8d23e3b26b08108b5f`,
  the same as at `695954f`.
- **The solo-lock collision (`T-202-s1`) did not bite this pass**: every
  `gate-run` here took the lock on the first attempt. No wait was
  needed and no key override was used.
