---
id: T-098
title: The boot guard's "never names 1420" is a substring test over a port the test does not choose — 1 in 8192, observed failing once
feature: F-02
milestone: 4
priority: 54
size: S
status: planned
blocked_by: []
touches: [tools/e2e]
builder:
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-046-s4 (sixth triage, 2026-08-20). That file is removed in
this commit.

**Observed failing, once, during T-082's integration at `7a37b37` — not
reproduced from reasoning.** In
`tools/e2e/tests/boot-check-guard.spec.ts`, the body that proves the
port override reaches the probe asks the OS for an ephemeral port
(`server.listen(0, "127.0.0.1", …)`), holds it, and requires the boot
check to abort naming **that** port rather than 1420. The intent is
exactly right and the guard is worth having. The spelling is
`expect(stderr).not.toContain("1420")` — **a substring test against a
number the test does not choose** (verified live at `4d2f03c`, beside
its own `expect(port).not.toBe(DEFAULT_TAURI_PORT)`, which is the
structured form done correctly two lines up).

The OS handed it **61420**. `"61420".includes("1420")` is true, so the
assertion failed on a run where the boot check had behaved perfectly:
the abort message names port 61420 and never mentions 1420 as a port at
all. A re-run passed 6/6 immediately.

**Measured, not estimated.** The macOS ephemeral range is 49152–65535 =
16384 ports; exactly **two** of them carry `1420` as a substring —
**51420** and **61420**. The flake rate is **2/16384 ≈ 0.0122%, about 1
in 8192 runs** of this one body. The assertion has been in place since
T-046 (`9b2832b`) and this is its first observed failure, which is
consistent with the rate.

**Why it is a card rather than a shrug.** It is the archive's **poison
shape one inverted**. The catalogued shape is *the matcher moved, the
value stayed* — a `toContain` needle still a substring of a changed
value, an assertion that keeps passing when it should fail. Here a
`not.toContain` needle is a substring of a legitimately DIFFERENT value:
the same defect producing the opposite symptom, **a check that is right
about the intent and wrong about the mechanism**, invisible until an
input hits the narrow band that exposes it. The catalogue does not yet
name that direction.

**The sweep was run and it found no habit — recorded because the
negative result is part of the finding.** At `22e3786`: 53
string-literal `not.toContain` assertions across `tools/e2e/tests` and
`app/test`, and **exactly one** with a haystack carrying a value the
test does not author — this one. Every other haystack is a class string,
a DOM subtree, or a process output the repository itself produces.
**That tally has already moved** — the same pattern reads 60 across 23
files at `4d2f03c` — which is why the finding is the SHAPE and not the
number: *the value came from outside the repository*, and the OS is the
only such source in the suite.

Two candidates were checked against live code and both are **defensible,
not defects**, recorded so nobody re-checks them: the `map-lens` needle
in the map-lens body is a deliberate FAMILY prefix (the test asserts the
header retains no trace of T-034, so matching `map-lens-*` is the
intent), and the `border-warning` needle's haystack is `nodeVisual()`'s
own output, which cannot contain the colliding class from another
component — fragile only if `nodeVisual` ever emits a
`border-warning-*` variant, which is worth a comment rather than a
change.

**Two lower-risk relatives sit in the same file**, four lines up from
the defect: `not.toContain("free")` and `not.toContain("ABORT")`, both
substring tests over prose. The prose is the repository's own and a
change to it is deliberate, so they are worth a glance rather than a
rewrite — but *"port is free"* and *"freed"* both red the first one.

## Acceptance criteria

- **THE PORT ASSERTION SHALL COMPARE THE THING IT MEANS**: that the
  abort names `${port}`, and that `DEFAULT_TAURI_PORT` does not appear
  **as a port token** — delimiter- or word-boundary-anchored — rather
  than as any substring of the message.
- **THE FLAKE SHALL BE REPRODUCED DETERMINISTICALLY AND SHOWN GREEN
  UNDER THE FIX**: drive the assertion's own text with a message naming
  port 61420 (and 51420) and require the new form to pass where the old
  one failed. A fix for a 1-in-8192 event that is only argued is not
  measured.
- **THE OLD FORM SHALL BE SHOWN RED against the same input**, so the
  change is proven to be a change.
- **THE "OS-ASSIGNED SO NEVER SOMEBODY ELSE'S" PROPERTY SHALL SURVIVE.**
  Rejecting the two colliding ports at selection time is NOT sufficient
  on its own — it leaves a substring test standing for the next reader —
  and pinning the port is refused outright, because that property is why
  the body is safe beside a live app.
- IF the two sibling prose assertions in the same file are left as they
  are THEN a comment SHALL say why (the haystack is the repository's own
  output), so "we decided" cannot be read as "we forgot".
- **THE INVERTED SHAPE SHALL BE OFFERED TO THE TAXONOMY** rather than
  numbered here: a `not.toContain` whose needle is a substring of a
  legitimately different value is shape one's other direction, and the
  ordinal belongs to the taxonomy pass so a number is minted once.
- NO CRITERION SHALL be met by widening the assertion into
  `not.toContain` over a shorter needle — that trades one substring trap
  for a smaller one.

Verification: headless — `npm test` and `npm run typecheck` from
tools/e2e with counts and exits, on a scratch port that is never 1420
and is bind-probed on all four stacks first; `lsof -nP -iTCP:1420
-sTCP:LISTEN` is the ONLY command used to learn anything about 1420, and
it is never bind-probed. POISON DRILL on the changed assertion, one side
only, mutated text read back with `git diff` before the run, restore
proved by sha256 against the drill's own commit. @human: none.
