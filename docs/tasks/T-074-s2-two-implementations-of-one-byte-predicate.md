---
id: T-074-s2
title: The C0 check and P5 are the same byte predicate written twice, and nothing checks that they agree
status: suggested
suggested_by: executor claude-opus-5 @T-074
---

Noticed while correcting the C0 check's comment (T-074), and deliberately
NOT acted on: T-058's sixth criterion ordered that check preserved
exactly, and T-074's own criterion repeats the order. So this is a
finding, not a change.

**THE TWO PREDICATES ARE BYTE-FOR-BYTE IDENTICAL TODAY.**

- `app/test/map-tasks-lens-dom.test.tsx`, the body *"no source file in
  the pane carries a literal C0 control character"*: rejects
  `code < 32 && !legal.has(code)` where `legal = {9, 10, 13}`, plus
  `code === 127`.
- `tools/e2e/scripts/token-scan.mjs`, `scanControlSource`: rejects
  `byte <= 0x08 || byte === 0x0b || byte === 0x0c ||
  (byte >= 0x0e && byte <= 0x1f)`, plus `byte === 0x7f`.

Enumerate both and they are the same thirty values. **And the corpora
NEST**: P5's CONTROL corpus is every tracked first-party text file
(`git ls-files` minus `SKIP_DIRS` minus `CONTROL_BINARY_EXTENSIONS`, with
`MUST_CONTROL_COVER` requiring `.ts` and `.tsx` covered COMPLETELY),
which strictly contains the `app/src/architecture/**` tree the test
walks. So since T-058 the standing check has been a second implementation
of a repo-wide gate over a subset of its corpus — T-057's *"a rule with
two implementations is two chances to disagree"*, arrived at by
accretion: the test is T-034's and predates P5 by weeks.

**THE DUPLICATION IS NOT THE PROBLEM; THE SILENCE IS.** The two would
disagree without anything going red — widen `legal` in one and the other
still holds the line, narrow it in one and nothing notices. They read
differently too, and that difference is real rather than cosmetic: the
test reads `readFileSync(file, "utf8")` and inspects UTF-16 code units,
so its reported offset is a STRING index; `scanControlSource` refuses
anything but a `Buffer` precisely so its offset is a true BYTE offset
(T-058's verifier proved that distinction with a multi-byte prefix). The
two therefore report the same hit at different numbers.

**THREE REMEDIES, cheapest first, none of them deletion.**
1. One assertion in the app test that its own legal set is `{9, 10, 13}`
   plus `127`, with a comment naming `scanControlSource` as the other
   copy — a tripwire on ONE side, no cross-package import.
2. The test asserts what the FILE says rather than what it believes:
   read `token-scan.mjs` and derive the byte set from it, the way
   `workflow-parity.spec.ts` derives CI's steps from CONVENTIONS. Costs
   a cross-package read.
3. Retire the app-side check and let P5 own it, which is the honest
   single-owner answer and is EXPLICITLY REFUSED for now by T-058's sixth
   criterion — it works, it names codepoint and offset in the pane's own
   terms, and it is proven by planting.

The verdict on which belongs to triage. Recorded here because the fence
that forbids touching the check is the same fence that would forbid
fixing the drift the day it appears.
