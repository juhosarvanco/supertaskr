---
id: T-060-s1
title: A guard's own discriminating half was a way around the guard — the class needs a rule, not a fix
status: suggested
suggested_by: executor claude-opus-5 @T-060
---

**This happened to me while building T-060's criterion 6, and it is the
same accident T-047-s6 is about.** It is filed as a CLASS, not as a
defect: the specific instance is already fixed on this branch.

## What happened, measured

`the_configuration_that_reached_the_real_cli_now_resolves_to_typed_not_found`
has to prove that the guard is what refused — otherwise "typed
not-found" could just mean the fixture was broken. The obvious
discriminating half is: lift the guard, re-resolve, show it now reaches
the shell.

My first draft lifted the guard while `$SHELL` was still the
*failing* fixture — the one that answers the PATH question and fails
`command -v`, because that is T-047's verifier's exact configuration. So
resolution did what it is designed to do: fell through from
`login_shell_probe` to `which_on_path`, read **my own `PATH`**, found
the real `/opt/homebrew/bin/claude`, and executed it through
`probe_version`'s `Command::new`. The test failed on its last assertion
(`assert!(matches!(lifted, Err(NotFound)))`) precisely BECAUSE the
resolve had succeeded against the developer's machine:

    the_configuration_that_reached_the_real_cli_now_resolves_to_typed_not_found
      assertion failed: matches!(lifted, Err(ResolveError::NotFound { .. }))

No model ran and no tokens were spent — `--version` prints a banner —
but the mechanism is identical to the one that cost T-047's verifier the
finding, and it occurred **inside the test written to prove it cannot
occur.**

## Why it is a class and not a one-off

A guard test needs a discriminating half or it is worthless (this
project's own standing rule: *a gate nobody can pass is not a gate*).
But the discriminating half of a SAFETY guard is, by construction, a
deliberate removal of the safety — executed inside the suite, in the
same process as every other test, with whatever ambient environment the
developer has. **The stronger the guard, the more dangerous its own
discriminator.** Nothing in the method names this shape.

The same reasoning applies to every guard the project has and will
have: the ACL pin, the containment rules, the session-id character
class, `env_clear()`. Most are safe because their "lifted" behaviour
touches only fixtures. This one is not, because the thing it guards is
*the user's real machine*.

## The two things that fixed it here, both worth generalising

1. **The lifted arm must be pointed at a fixture, not merely
   started at one.** The shell used with the guard off now SUCCEEDS at
   `command -v` and names the planted binary, so the whole resolve
   stays inside the temp tree and the fallback that reads the real
   `PATH` is never reached. It also makes the lift window safe for any
   test running concurrently: the only `$SHELL` visible during it
   answers with a fixture path.
2. **A PRE-FLIGHT assert.** The body now asserts
   `real_cli_arms_forbidden()` before it resolves anything, so a guard
   that is already broken fails there — harmlessly — instead of two
   statements later on somebody's real CLI. This is also what makes the
   body safe to POISON-DRILL at all: without it, drilling the guard
   would reach the machine.

## The ask

A paragraph in `docs/CONVENTIONS.md` (or `method/`, if the architect
reads it as method rather than product): **when a test lifts a safety
guard to discriminate, the lifted arm must be proven to terminate in a
fixture, and the body must assert the guard's state before it exercises
anything.** One sentence each. It is cheap, and the alternative is that
every future guard's author rediscovers this the way I did.

Related but distinct from T-047-s6, which is about tests reaching the
real CLI **by forgetting a field**. This is about tests reaching it **by
doing exactly what a good test is supposed to do.**
