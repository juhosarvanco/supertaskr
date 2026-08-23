---
id: T-087
title: The app/src write guard admits two passing reverts and misses rmSync entirely — one --listFiles assertion closes all three
feature: F-02
milestone: 4
priority: 45
size: M
status: planned
blocked_by: []
touches: [app-shell, docs/CONVENTIONS.md]
builder:
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-073-s5, T-073-s4, T-073-s1, T-073-s2, T-073-s3 (fifth
triage, 2026-08-20). All five files removed in this commit.

**A safety guard with a measured side door.** T-073 split the ambient
node write declarations out of the app program so `app/src` code
cannot quietly reach `fs.writeFileSync` and friends. The include pin
that holds the split admits two measured reverts (T-073-s5):

1. **A comment placed before the include** beats the first-match regex
   the pin anchors on — the pin reads the wrong line and stays green.
2. **A triple-slash reference** (`/// <reference path="…">`) re-arms
   the write declarations program-wide with all three pinned facts
   green.

And independently (T-073-s4): the raw-markup sweep's `SINKS` list is
an unpinned inline array of eleven strings, and **`rmSync` matches
none of them** — so the combination "triple-slash reference + rmSync"
is a destructive filesystem call in `app/src` with **no gate at all**,
while `npm run build` and the whole app suite stay green.

**The fix is measured, not proposed**: one `tsc --noEmit --listFiles`
assertion — the program's actual file list must not contain the write
declarations file — kills all three reverts, because `--listFiles`
reports what the compiler actually consumed rather than what a regex
found in a config.

Folded siblings, each one criterion below: T-073-s1 (the raw-markup
sweep still walks only `src/genesis` — its own `readdirSync`, not the
whole of `app/src`), T-073-s2 (the TEST program deliberately keeps the
write grants; the ruling that this is intended must be written at the
split, not implied), T-073-s3 (the program-global ambient-declaration
gotcha belongs in CONVENTIONS — drafted text exists in the finding's
file history).

## Acceptance criteria

- THE include pin SHALL be replaced or augmented by a `--listFiles`
  assertion on the APP program: the write-declarations file absent
  from the consumed list. Both measured reverts SHALL be re-run and
  shown RED under it, texts read back.
- **`rmSync`, `rm`, `unlinkSync`, `unlink`, `truncateSync` and
  `cpSync` SHALL join the sweep's sink set, and the set SHALL gain a
  floor** — a derivation or a pinned count with its ref — so a sink
  leaving the list is a red, not a silence. State which floor and why;
  T-080-s8's family is the precedent that a hand list needs an
  authority.
- THE raw-markup sweep SHALL cover `app/src/**`, not `src/genesis`
  alone, or state at the sweep why the narrower walk is right.
- THE test program's retained write grants SHALL be stated as a
  decision at the split site, with the reason (tests write fixtures).
- CONVENTIONS SHALL gain the ambient-declaration gotcha (a `declare
  module` anywhere in a program is program-wide; the second program is
  the isolation mechanism), placed with the other program-shape
  gotchas.
- A pin SHALL prove the sweep floor by construction: remove one sink
  from the list and the floor reds; add a new destructive call to a
  scratch file and the sweep reds.

Verification: headless — app suite + build, the two reverts re-run RED,
the rmSync plant RED, poison texts read back, restores hash-proved at a
commit. The DOCS GATE fires on the CONVENTIONS edit — run what it owes.
@human: none.
