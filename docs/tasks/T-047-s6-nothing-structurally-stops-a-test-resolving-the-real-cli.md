---
id: T-047-s6
title: "\"No test can resolve the user's real CLI\" is a discipline claim, not a structural one — and it failed"
status: suggested
suggested_by: verifier claude-opus-5 @T-047
---

`tests/agent_runner.rs`'s module header says it plainly:

> every config here sets `probe_login_shell: false`, so no test can spawn
> a login shell or resolve the user's real CLI even by accident.

That is true of **that file, today**. It is not true of the crate, because
the property lives in a field every test has to remember to set:
`RunnerConfig::default()` ships `probe_login_shell: true` (`runner.rs:194`)
— production's value, correctly — and `..RunnerConfig::default()` is the
idiom every test in the suite uses.

**Reproduced, unintentionally, by the T-047 verifier.** A scratch probe set
`probe_login_shell: true` with `binary_override: None` and no cache entry,
in order to exercise the real login-shell channel with a controlled
`$SHELL`. The controlled shell answered the PATH question and failed the
`command -v claude` half, so `login_shell_probe` fell through to
`which_on_path`, which found the developer's **real `claude`** and spawned
it with the genesis planner prompt. The evidence is a session file the real
CLI wrote outside the repo:

    ~/.claude/projects/-private-var-folders-…-t047va-count-97806-…-project/
      4873202c-….jsonl   (17 kB)

**No model ran and no tokens were spent** — every assistant record in that
file is `"model":"<synthetic>"` with zero usage, because the spawned CLI
answered `API Error: 401 OAuth access token has been revoked` and exited.
That is luck, not a control: on a machine with a live login it would have
been a real turn against a real model, started by `cargo test`.

The repo already treats this as the sharp edge it is — the field's own doc
comment says `false` "forbids the login-shell probe entirely, so no suite
can spawn the user's shell or accidentally RESOLVE THE REAL CLI". The gap
is that nothing enforces it.

Options, cheapest first:

1. **A refusal the harness cannot forget.** Have `resolve_cli` refuse the
   login-shell/`which_on_path` arms when a guard variable is set
   (`NPUTER_NO_REAL_CLI=1`), and set it once for the whole suite — cargo
   already gives every test binary a shared environment, and the one
   env-gated real smoke can unset it deliberately. Turns "every test
   remembers" into "one place decides".
2. **Invert the default for the test profile.** A `#[cfg(test)]` default of
   `false` does not reach integration tests (they link the lib without
   `cfg(test)`), so this needs a feature flag — more machinery than (1) for
   the same guarantee.
3. **Assert it in the suite**: a test that reflects over nothing cannot
   check this, but a `RunnerConfig` constructor used by every test
   (`fn test_config()`) would make the safe value the path of least
   resistance. Weakest of the three, and the one that drifts.

(1). Blast radius: `runner.rs` (one guard), plus the suites' shared setup.
Worth doing before F-04, which adds more spawn sites and more test files
that will each have to remember. @human: the stray session file above is
outside the repo and was left in place rather than deleted — remove it if
you want it gone.
