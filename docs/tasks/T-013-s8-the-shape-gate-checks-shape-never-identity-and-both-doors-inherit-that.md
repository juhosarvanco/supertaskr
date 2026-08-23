---
id: T-013-s8
title: The resolved-path gate checks SHAPE and never IDENTITY, so a $SHELL pointing inside the opened project still executes — and a caller-side one-liner closes it for the git door without touching the shared gate
status: suggested
suggested_by: verifier claude-opus-5 @T-013-verify2
---

**Raised as F7 on T-013's second (APPROVED) verdict and materialized
here by the integrator, crediting the verifier.** It arrived as verdict
body text on the card; a finding a triage can act on has to be a file.

The verifier did not accept T-013's refusals. Two batteries, fourteen
variants, one execution:

- **Battery A — the pure seam** (`resolve_git_from`, no process env
  mutated), over search paths `:REAL`, `.:REAL`, `./:REAL`, `:.:REAL`,
  `REAL:`, `relbin:REAL`, `:` and `.` alone, plus login-shell answers
  `git`, `./git` and `<proj>/bin/../git`. Every one resolved
  `/usr/bin/git`, none of them under the project, and every child `PATH`
  came back with **zero** relative or empty elements.
- **Battery B — end to end through `churn_at`**, with a real fake `git`
  planted in the opened project and the process `PATH`/`SHELL` actually
  poisoned. Shell-script fake and `cc`-compiled fake, an absolute PATH
  element equal to the project directory, a symlink in an absolute PATH
  dir whose target is in the project, a traversal `SHELL`, and no usable
  login shell at all: **thirteen of fourteen refused**, including every
  variant of the break demonstrated in the first verdict.

**The one that executed is `$SHELL` pointing at a fake `zsh` INSIDE the
project.** `login_shell()` requires absolute + `file_name() ∈ {zsh,
bash, sh}` + executable, and `<project>/zsh` satisfies all three, so
`login_shell_git()` runs it.

## Why it is filed rather than blocking

**It is not new and it is not this card's.** `login_shell()` is
byte-unchanged from main-before; the CLI resolver has run `$SHELL -l -c`
through it since T-060; and the pointer comes from the PARENT
environment, never from the project — a user whose `$SHELL` points into
a repository is already running the attacker's login shell. What T-013
changes is FREQUENCY, not reachability: churn probes on every map mount
where genesis probed only on an interview.

A second residual from the same root: **an absolute PATH element equal
to the project directory selects `<project>/git`** — measured
`UNDER_PROJECT=true` in the pure seam. The verifier could not reach it
end to end, because `resolve_git` consults the login shell's `command -v
git` first and that absolute answer wins; it becomes reachable exactly
when the login-shell probe cannot answer, which is the documented
GUI-launch case. Honest strength: real in the core, masked on a machine
with a working login shell.

Both are the residual `validate_resolved_binary`'s own doc comment
already records — *"an absolute, traversal-free path named `claude`
pointing at an attacker's binary still passes. The gate checks SHAPE and
never IDENTITY"* — inherited deliberately along with the standard.
**The point of T-013's fix is that the project lost its PRIVILEGED
position**: `current_dir(root)` no longer participates in resolution at
all, so what is left is the generic "whoever can write to a directory on
your PATH wins", true of every program on the machine.

## The remedy, and the part that must NOT be done

**Do not close this inside the shared gate.** Closing either residual in
`validate_resolved_program` would make the two doors diverge, which is
the exact thing the T-013 refactor exists to prevent (T-057: a rule with
two implementations is two chances to disagree).

One **caller-side** hardening is available, and it is available only to
this caller because only this caller knows the project root: **refuse a
resolved `program` that `starts_with(root)`.** One line, no divergence,
and it would have refused both (a) and (b). The verifier recommended it
and did not require it.

The general half is worth a sentence somewhere durable: a SHAPE gate is
not an IDENTITY gate, and every door that adopts the standard adopts
that limit with it. `docs/CONVENTIONS.md` already carries the two
adjacent rules (A NEGATIVE ASSERTION NEEDS A POSITIVE CONTROL, LIFTING A
SAFETY GUARD TO DISCRIMINATE) and has no clause naming this one.
