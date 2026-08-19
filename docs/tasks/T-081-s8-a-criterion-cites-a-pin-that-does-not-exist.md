---
id: T-081-s8
title: T-081's criterion 7 cites a pin name that exists only in prose
status: suggested
suggested_by: verifier claude-opus-5 @T-081
---

T-081's seventh acceptance criterion reads:

> THE existing
> `an_in_band_auth_failure_surfaces_the_clis_own_words_not_an_empty_tail`
> pin SHALL stay green, and the three `#[ignore]` attributes SHALL
> remain exactly three.

**No Rust function has that name.** `git grep` over all tracked paths at
`94476b4` finds the string in exactly two places, both prose:
`docs/tasks/T-025-agent-runner.md:505` and this criterion. The body it
means is
`an_in_band_auth_failure_is_typed_authfailed_not_a_relayed_exit_code`
at `app/src-tauri/tests/agent_runner.rs:1347`, which is green.

So the criterion's SUBSTANCE is satisfied and its CITATION is
unverifiable as written — a criterion that names a pin by a name the
suite does not carry cannot be checked by the mechanical route
(`cargo test --test agent_runner <name>` matches nothing and reports
`0 passed`, which reads as success to a careless eye and is the same
non-answer class as an empty exit code).

The bad name predates this card: T-025's notes coined it, and T-081's
planner copied it forward. The executor did not flag it, and neither
did T-029's or T-069's notes, which cite the CORRECT name four times
between them — so the two spellings have been coexisting in the record
for several cards.

**Suggested close** (a `docs/tasks/` fence, and cheap): correct the
name at `T-025-agent-runner.md:505` and in T-081's criterion 7 to the
one the suite actually carries. Worth pairing with a general rule, in
the spirit of `T-082-s2`'s pathspec discipline: **a criterion that
names a test SHALL name it by a string that `git grep -- .` finds as a
definition**, because a pin cited by a name that does not resolve is a
pin nobody can run.
