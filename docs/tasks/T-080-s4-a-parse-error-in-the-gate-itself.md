---
id: T-080-s4
title: Exit 3 cannot cover a parse error in the gate's own two files
status: parked
suggested_by: executor claude-opus-5 @T-080
---

T-080 gives `lint:tokens` a third exit code — 0 clean, 1 the gate ran
and found something, 3 the gate could not run — with a total catch in
the wrapper, so every throw out of the scanner lands on 3. **One
could-not-run mode escapes it, and it is the one the gate is most likely
to hit**: a syntax error in `lint-tokens.mjs` or `token-scan.mjs`
themselves. Measured at `fef8870`, planting one runtime-built control
byte into the wrapper produced `SyntaxError: Decimals with leading zeros
are not allowed in strict mode` at exit **1** — the module never linked,
so its own `try` never ran. That is the collapse T-080 exists to fix,
surviving in the narrow case where the gate's own source is the damaged
file, and CONTROL covers both files precisely because that damage is
expected to be possible. Closing it needs a shape the card did not
contemplate: either a tiny outer launcher whose only job is to
`await import()` the wrapper inside a try (which reintroduces the "which
file is the real entry point" question T-046 argued about), or a CI step
that treats exit 1 with empty stdout as a could-not-run. Neither is
obviously right, which is why this is a suggestion and not a defect
against the build. The measured fact is small and should be written into
the CONVENTIONS legend when T-078 gains its second row: **exit 1 with no
findings on stdout is still ambiguous**.

**PARKED at the fifth triage (2026-08-20).** Unpark at the repo's first GitHub push (CI becomes a real gate), or if the entry-point/launcher question is reopened. The documentation half is already discharged in CONVENTIONS.
