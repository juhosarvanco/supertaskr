---
id: T-037-s1
title: The token lint is RED on main today — CI's first run aborts at step 7, before any suite installs
status: suggested
suggested_by: executor claude-opus-5 @T-037
---

**This is T-020-s5's second class, arrived.** That suggestion says of
the regex-literal collision: *"app/src has none today; the repo's own
house style produces them freely … Any future widening of the walk (or
one regex landing in app/src) trips it."* One landed. T-024's
`stripHtmlComments` carries `/<!--[\s\S]*?(?:-->|$)/g`, and the lint's
P1 pattern (`-\[[^\]]` — a hyphen immediately followed by a bracket)
matches the `--[` inside it.

Measured, not inferred — in the UNTOUCHED main checkout at
main@f7fdf13, and byte-identically on this branch (so T-037 neither
caused it nor cures it):

    cd tools/e2e && node scripts/lint-tokens.mjs
    app/src/genesis/genesis-derive.ts:231: !--[\s\S]*?(?:--  [P1: arbitrary value (`p-[13px]` family — the T-001-s2 bypass)]

    lint-tokens: 1 violation — tokens live in app/src/styles/tokens.css; …
    → exit 1

    # same command in the T-037 worktree: identical stdout, exit 1.
    # `diff` of the two outputs: no difference.

`node scripts/lint-tokens.mjs --selftest` is still green (17 samples),
so the tool is working exactly as written — the pattern is what is
wrong, which is precisely T-020-s5's finding.

**Why this is sharper than "a known false positive".** The lint is a
CI GATE and it is nearly FIRST in the job. `.github/workflows/ci.yml`
runs `Token lint selftest` then `Token lint` (both
`working-directory: tools/e2e`) *before* the parser install, the app
install, the app build, the app suite, the cargo suite, `cargo audit`
and the Playwright lane — all steps of the SAME job, so a non-zero
exit fails the job and every later step is skipped.

The standing LAUNCH ITEM in docs/STATE.md is "watch the first CI run",
and that run is the gate that closes T-001/T-003's Linux halves,
exercises the three T-018 sentinel live tests (the inode-vs-path
evidence gap macOS cannot surface), feeds T-021-s1's macOS-derived ACL
pin, and makes T-026-s1's case-sensitivity divergence visible. As
things stand, that run stops at the token lint and reaches **none** of
them. Whoever schedules the first push should expect a red that says
nothing about the code under test.

**Scope, and what to decide.** The fix belongs to T-020-s5, which
already lists three candidates and does not need a fourth. What this
file adds is urgency and a narrowing:

- candidate **2** (strip `/…/flags` runs before scanning a line) is now
  the MINIMUM needed to unred the gate, and it is the cheap half;
- candidate **1** (require the bracket to sit in a value position — a
  match whose `]` is followed by `:` is a variant, not a value) is
  still the open design question, and it is the half that matters for
  the next `npx shadcn add`;
- candidate **3** (leave it, and say so in CONVENTIONS) is no longer
  available on its own: "consult before vendoring" does not describe a
  lint that is red on unmodified `main`.

Deliberately NOT fixed here: `tools/e2e/**` is outside T-037's fence
(the task touches app-shell only), the false positive lives over
`app/src/genesis/**` which T-037 must not modify, and hot-patching a
lint on a mount task would hide the finding rather than record it.
Triage should fold this into T-020-s5 rather than schedule it twice.
