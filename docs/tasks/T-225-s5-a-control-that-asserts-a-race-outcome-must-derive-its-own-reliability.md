---
id: T-225-s5
title: A CONTROL THAT ASSERTS A RACE OUTCOME MUST DERIVE ITS OWN RELIABILITY IN-RUN — `brief-flush.spec.ts` proves its SLOW reader cannot lose by itself and merely ASSUMES the same of its fast one, which is the asymmetry that made the fast arm an intermittent
feature: F-06
milestone: 4
priority: 3
size: S
status: suggested
blocked_by: []
touches: [tools/e2e/tests/brief-flush.spec.ts]
suggested_by: verifier claude-opus-5@subagent @V-225
builder:
verifier:
built_by:
verified_by:
review: independent
---

**Class parent: none — `T-225-s1` is a different class** (that one is
about the disclosure's buffer number and the sentence beside it; this is
about how a test body establishes that its own harness is trustworthy).

`brief-flush.spec.ts` now drives three readers, and it holds them to two
different standards. The SLOW reader's integrity is PROVEN, in-run, as
control one of its own body — the file's header explains exactly why
(*"a harness that drops data on a writer that dropped none would red this
body for its own reason and read as a finding"*), and it even records the
measurement that forced the design: a paused `child.stdout` delivered
397,312 of 524,400 bytes on its own. The FAST reader is held to no such
standard. It is used as a no-loss oracle by assertion.

V-225 rejected T-225 on the narrow instance — `| cat` failing to receive
all 524,400 bytes from a 200-write pre-fix writer, 1 of 25 runs on a
quiet machine and 16 of 25 under six busy cores — and the narrow fix is
to assert the DISCRIMINATION (`fast > slow`) rather than the maximum.
**This card is the class the narrow fix leaves behind**: `deriveLossPoint`
already shows the shape for one direction, taking the MIN of several
samples against a writer built to lose. The symmetric helper — take the
MAX of several samples against a writer built to arrive, and refuse the
run with a named message when even that falls short — would let any body
in this file use either reader as an oracle without re-litigating whether
it can be trusted today.

**The general rule, which is what is worth keeping**: where a body
asserts the OUTCOME of a race rather than a property, the assertion is a
fact about the machine, and CONVENTIONS already says a suite green here
and red there is measuring the machine. Either derive the outcome in-run
with a stated sample count, or assert only the ordering the argument
actually needs. This lane's own file contains one example of each, which
is what makes it the right place to put the helper.

**Disposition hint**: promote as a small card, ideally onto whatever lane
next opens `brief-flush.spec.ts` — it is a test-only change inside one
file, and the narrow F1 fix will already have touched the exact lines.
It is worth doing separately rather than folding into F1, because the
helper is the part that stops the next reader-based body repeating the
asymmetry.
