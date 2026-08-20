---
id: T-074-s1
title: P5's own label carries the over-generalisation this card just corrected — only U+0000 hides a file
status: suggested
suggested_by: executor claude-opus-5 @T-074
---

T-074 corrected the C0 check's comment in
`app/test/map-tasks-lens-dom.test.tsx`, which said a literal control byte
makes "every grep-based gate in this repo silently stop seeing that
file". The gates were never blinded — but the replacement clause the
fourth triage prescribed ("what IS blinded is the SEARCHER") is itself
too wide, and **the same too-wide sentence is live in three places inside
`tools/e2e/scripts/token-scan.mjs`**, which this card's fence could not
reach:

- `CONTROL_PATTERN.what` — `"literal control character (invisible to
  binary-skipping searchers)"`, the string PRINTED beside every P5 hit;
- the module header comment — *"against bytes that make binary-skipping
  searchers ignore a file"*;
- the selftest's evidence line — *"to binary-skipping tools
  (docs/CONVENTIONS.md)"*.

**MEASURED AT `e83ee1d`, 2026-08-20, over the whole byte set P5 rejects**
(`byte <= 0x08 || 0x0b || 0x0c || 0x0e..0x1f || 0x7f` — thirty values),
one planted byte at a time into a real 14,289-byte copy of
`app/src/architecture/map-layout.ts`:

| planted byte | `rg` over the directory | `/usr/bin/grep -rn` | `grep -rIn` | `file --mime` |
|---|---|---|---|---|
| **U+0000** | file DROPPED from the results; exit **1** when it is the only match | `Binary file … matches`, line suppressed, exit **0** | nothing, exit **1** | `charset=binary` |
| every other one of the thirty | the line, exit **0** | the line, exit **0** | the line, exit **0** | mostly `charset=binary`, sometimes `us-ascii` |

So exactly **one** of P5's thirty bytes hides a file from a searcher, and
even for that one the claim "returns no match at all and exits 1" holds
for ripgrep and for `grep -I` but NOT for plain `/usr/bin/grep`, which
exits 0 and says so.

**THE TWO HISTORICAL INCIDENTS SPLIT ON EXACTLY THAT LINE**, which is how
the generalisation was born. Derived from the tree rather than from the
prose: at `832edd6^`, `map-layout.ts` carried **one U+0003** (T-012's,
offset 14240) and `task-waves.ts` carried **two U+0000** (T-034's,
offsets 25269 and 25402). The commit message at `832edd6` found the NULs
first and generalised to "grep(1) treats it as BINARY" — true of the
NULs, false of the U+0003 in the same commit.

**NONE OF THIS WEAKENS P5.** Rejecting all thirty is right: `file(1)`
already calls most of them `data`, they are invisible in an editor, and a
literal separator byte in a string is a defect on its own terms. What is
wrong is only the REASON printed beside the hit. Remedy is one line per
site — say "invisible in the source, and a NUL additionally hides the
file from a binary-skipping searcher" — and it is deliberately not taken
here: `tools/e2e` is T-084's fence this week, and a one-line comment is
not worth crossing a live fence for.

**Ten sites carry the phrase** (`git grep -n "binary-skipping"` from the
ROOT: three in `token-scan.mjs`, six across the T-032 / T-034 / T-058
card bodies, plus T-074's own criterion). The card bodies are history and
need no upkeep under T-074's own ruling. The three in `token-scan.mjs`
are live.
