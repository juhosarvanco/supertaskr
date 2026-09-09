---
id: T-278-s5
title: "Four one-line edits neuter T-278's disk floor with every parity body still green — `&& false` inside the comparison, `continue-on-error`, a `shell:` override and a redirection, each measured at the verifier's bench"
feature: F-04
milestone: 4
size: S
priority: 13
status: suggested
suggested_by: "verifier claude-opus-5@subagent (phase 2) @T-278, 2026-09-09, at bench tip 4327aff"
blocked_by: []
touches: [tools/e2e/tests/workflow-parity.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

`diskGuardProblems` derives the disk pair's shape from the parsed step list and
reds on every mutation T-278 aimed at it — the step deleted, moved, the floor stale
in its name, the floor zeroed, the refusal removed, the `always()` dropped, and on
five more the verifier added. Four one-line edits it does not see, each MEASURED at
the bench with the landing read from `git diff` and the whole spec re-run:

| the edit, in `.github/workflows/ci.yml` | parity result |
|---|---|
| `if [ "$free_kib" -lt "$floor_kib" ] && false; then` | exit 0, 22 passed |
| `continue-on-error: true` on the floor step | exit 0, 22 passed |
| `shell: python` on the floor step | exit 0, 22 passed |
| `df -h . > /dev/null` and `df -h /tmp > /dev/null` | exit 0, 22 passed |

The first is the one that matters: the derivation asks whether the step's script
CONTAINS the token `exit 1`, and `&& false` leaves the token in place while making
it unreachable. Extracted through the YAML parser and run under `bash -e` with a
stub `df` reporting 900 MiB available, the mutated step exits **0** — a floor that
cannot fire, which is the shape this project's own rules refuse by name. The other
three are the same class from outside the script: a key that swallows the exit, a
key that changes what the script IS, and a redirection that keeps the substring the
derivation looks for while sending the reading nowhere. A fifth of the same family
is the `INFRASTRUCTURE_STEPS` entry T-278 added: any FUTURE step whose run begins
`df -h .` is exempted from the "nothing beyond the derived commands" body.

None of this is a defect in what T-278 landed — the file at that tip carries none of
these edits, the floor was proved to fire in both directions, and the criterion
asked the spec to pin the new step the way it pins the others, which it does (the
apt step survives the same `&& false`). These are the next one-line edits, and the
derivation already returns a `problems: string[]` that can absorb the three key-level
ones in about a dozen lines. The reachability one needs a different instrument: run
the step's own script against a stub `df` above and below the floor and assert the
two exits — the arm the executor ran by hand and nothing in the tree keeps.

Class parent: T-278. Disposition hint: promote at any lane that already holds
tools/e2e/tests/workflow-parity.spec.ts; its own drill is the four rows above,
applied to a copy of the step list the way the existing fixture body applies its six.
