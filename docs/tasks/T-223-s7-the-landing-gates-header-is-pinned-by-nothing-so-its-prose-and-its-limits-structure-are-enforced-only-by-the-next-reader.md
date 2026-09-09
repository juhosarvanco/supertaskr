---
id: T-223-s7
title: "`landing-gate.mjs`'s header is pinned by NOTHING — the one paragraph a reader consults to decide how far to trust the gate, and its LIMITS list, are enforced only by the next reader"
feature: F-06
milestone: 4
size: S
priority: 4
status: suggested
suggested_by: "verifier claude-opus-5@subagent @V-T-223-s4, 2026-09-09"
blocked_by: []
touches: [tools/e2e/tests/landing-gate.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

CLASS PARENT: `T-223-s4` — but a DIFFERENT class from its sibling
`T-223-s6`. That card owns *another copy of the absolute lives
elsewhere*; this one owns *nothing reds when the header changes at all*.
**DISPOSITION HINT: promote.** Two lanes have now repaired the same
paragraph blind to each other and a third is filed; the cost of the pin
is one body and it is already written below.

## The measurement — a data drill nothing killed

At `7d95dabb84e8cff073cab298400c2474150f01f8`, `T-223-s4`'s verifier
applied five data mutants to `.claude/hooks/landing-gate.mjs`'s module
header **at once** and ran `SUPERTASKR_E2E_PORT=25223 npx playwright test
tests/landing-gate.spec.ts`:

- the newly bound premise clause **deleted**, restoring the absolute
  `T-223-s4` had just measured false;
- limit 6's class wording **reverted** to the single command;
- limit 6 **renumbered to `5.`**, leaving the list `1,2,3,4,5,5,7`;
- a lettered residue under limit 5 **collided**, `(f)` → `(g)`;
- limit 6's floor argument **mangled**.

    52 passed, exit 0.

The same suite kills a code mutant at once — flipping `judgePaths`'s
refusal gives **31 failed / 21 passed** — so the suite is not asleep. It
simply never reads this file's text.

## Why it cannot be pinned today, stated mechanically

`landing-gate.spec.ts` **imports** the hook as a module (line 31). A
`readFileSync` scan over `tools/`, `lib/` and `app/src/` finds **zero**
readers of `.claude/hooks/landing-gate.mjs` as text. So the header is
not unpinned by oversight; there is no reader to notice.

Grep, at both `542d941` and `7d95dab`, over `tools/e2e/tests`: `"own
COMMITS cannot move"` **0 hits**, `"HEAD names the lane branch"` **0
hits**, `"limit 6"` **0 hits**.

## THE BODY, AND ITS DEMONSTRATION IS ALREADY OWED AND ALREADY PAID

**The class is proven working on this board.**
`tools/e2e/tests/lane-fence.spec.ts:689` pins `lane-fence.mjs`'s header
exactly this way — a `readFileSync`, a `toContain` for the limit that
must be declared and a `.not.toContain` for the sentence a card deleted —
and it is green today. This card asks for the same shape on the file that
lacks it, not a new mechanism.

**And the proposed check was run where the property is ABSENT before it
was proposed.** Against the hook at the **base** `542d941`, where the
binding does not exist, it goes **RED** and both assertions fire:

    - the bound premise clause is not declared in the header:
      missing "WHILE `HEAD` NAMES THE LANE BRANCH"
    - the header still states the ABSOLUTE the measurement falsifies:
      "**`<integration>` is the ref the lane's own COMMITS cannot move**"

Against the **tip** `7d95dab` it is **GREEN**. It can fail, and it fails
for the right reason.

**TWO assertions, and the second is the load-bearing one.** A body that
only checks the bound clause is PRESENT survives a header that states
both the bound sentence and the old absolute somewhere else in the file —
which is the state this repository was actually in for the whole of
`T-223`'s life. The `.not.toContain` half is what makes it a guard rather
than a spelling test.

## AND THE STRUCTURAL HALF, which is the one concurrent lanes break

The list mutants above (`1,2,3,4,5,5,7`, a duplicated letter) survived
too, and this header is edited by **many lanes at once** — `T-224` took
limit 5's `(f)` the same night `T-223-s4` rewrote limit 6, in different
worktrees, neither seeing the other. That is precisely the arrangement a
structural check exists for. A second body should assert the LIMITS
headings are contiguous, uniquely numbered `1..N`, and that the lettered
residues under limit 5 are unique — three lines over a parse of the same
text the first body already reads.

**A CAUTION FOR WHOEVER BUILDS THIS.** Pin the PROPERTY, not the
paragraph. A body asserting the header's prose byte-for-byte would red on
every honest rewording and would be deleted within a month; a body
asserting *the sentence carries a checkable condition and does not carry
the retired absolute* survives rewording and still catches the regression
that matters. The mutant that must kill it is `T-223-s4`'s M1 — delete
the condition clause — and the mutant that must NOT is a rephrasing that
keeps it.
