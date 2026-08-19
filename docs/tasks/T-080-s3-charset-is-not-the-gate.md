---
id: T-080-s3
title: The `file --mime` charset sees U+0000 and misses most of the C0 range, so it is not a substitute for the gate
status: suggested
suggested_by: executor claude-opus-5 @T-080
---

Session briefs and several verdicts carry the standing rule "check files
with `file --mime` and read the charset", and T-058's record legitimately
uses `charset=binary` as evidence — for U+0000. **The heuristic does not
generalise, measured at `fef8870`**: one runtime-built U+000B appended to
`tools/e2e/tests/token-scan.spec.ts` left `file --mime` reporting
`text/x-java; charset=utf-8`, unchanged, while `lint:tokens` reported it
correctly at `byte 9977: U+000B` and exited 1. The same plant into two
other files behaved the same way. So a `charset=utf-8` result is NOT
evidence that a file is free of P5 bytes; it is evidence about NUL and
little else, and the C0 range P5 rejects is 00-08, 0B, 0C, 0E-1F and 7F.
This matters because the charset check is the one agents run by hand
when they cannot run the lane, and it is being read as the cheap version
of the gate. The cheap version of the gate is the gate: `npm run
lint:tokens` needs no `node_modules` and runs against a bare checkout.
Worth correcting wherever the rule is written down, alongside the
existing note that plain `file(1)` calls a `.spec.ts` "text/x-java" and
JSON "JSON data".
