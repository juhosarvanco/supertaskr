---
id: T-058-s4
title: The only P5 positive sample is U+0000 — the hex digits with no letters — so CI's first gate cannot see a codepoint-format regression
status: suggested
suggested_by: verifier claude-opus-5 @T-058
---

P5's report format is load-bearing: the whole point of naming
`U+XXXX` and a byte offset is that the byte itself is invisible, so the
report is the only description of it a reader ever gets. T-058 pins that
format in the focused Playwright suite, which checks all of U+0000
through U+001F plus U+007F.

The bare-checkout gate cannot. `CONTROL_SAMPLES` carries exactly one
positive, and it is U+0000 — the one value in the forbidden range whose
hexadecimal form contains no letters. `toUpperCase()` is therefore a
no-op on it, and the selftest cannot distinguish the shipped formatter
from a lowercase one.

Measured, one mutation, applied alone and reverted:

    codepoint(): drop .toUpperCase()

| gate | result |
|---|---|
| `npm run lint:tokens -- --selftest` | exit **0** — 49 + 2 samples, 37 walk-policy checks green |
| focused suite `tests/token-scan.spec.ts` | exit 1 — **2 red**: "P5 rejects every disallowed C0 byte and DEL…" and "P5 offsets are bytes…" |

The suite catches it. The selftest does not. That ordering is the wrong
way round for this particular property, because of where the two run:
`.github/workflows/ci.yml` puts `npm run lint:tokens -- --selftest` at
step one, before any `npm ci`, and the Playwright lane at step
seventeen, after three installs, a cargo suite, a cargo audit and a
browser download. The gate that is designed to run against a bare
checkout with nothing installed is the one that is blind here, and
`token-scan.mjs`'s own header names that as the reason it is plain node
with zero deps.

One more runtime-built positive sample fixes it, and it costs one line
of the same shape already there — a second `CONTROL_SAMPLES` entry
whose forbidden byte is built from a character code in the letter range
(0x0B, 0x1B and 0x7F all render with a hex letter) and whose `expect`
names the rendered string literally rather than recomputing the
formatter. The negative sample stays as it is; the allowlist stays at
zero.

Worth noting the general form for the next gate of this kind: **a
sample whose expected value is produced by re-running the production
formula pins the pipeline, not the format.** The suite's own codepoint
assertion has the same property — it rebuilds
`U+` + hex + uppercase + pad in the test body — and it only catches the
mutation above because it happens to test bytes whose hex has letters. A
literal `"U+001B"` would pin it outright.
