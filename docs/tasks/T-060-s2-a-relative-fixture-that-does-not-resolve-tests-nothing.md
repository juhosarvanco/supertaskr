---
id: T-060-s2
title: A negative test whose fixture cannot resolve passes for the wrong reason — the "cannot pin a constant it is parametrised by" rule has a second face
status: suggested
suggested_by: executor claude-opus-5 @T-060
---

**Caught by a poison drill during T-060, on my own new test.** Fixed on
that branch; filed because the SHAPE is general and the project already
has a written rule one step away from it.

## What happened

T-060's criterion 3 is that a relative PATH element must produce no
executable candidate. The natural test is:

    assert_eq!(which_in("relbin", adapter), None);

It passed. It also passed with `which_in` reverted to its **pre-T-060
`is_executable_file` check** — i.e. with the vulnerability restored.

The reason: `relbin/claude` did not exist relative to the test process's
working directory, so the OLD check refused the candidate too, for a
completely different reason. The assertion was true under both
implementations and discriminated nothing. **Counting the assertions
would not have shown it; only mutating the producer did.**

The fix was to plant the fixture under the test's own working directory
(`target/`, gitignored, unique per pid+ms, removed after), assert it IS
reachable through a relative path, and only then assert the lookup
refuses it — so the single remaining difference between the two
implementations is the one under test.

## Why this belongs beside a rule the project already has

T-063's drill produced *"a test parametrised by a constant cannot pin
that constant"*. This is the same failure mode with a different
mechanism: **a NEGATIVE test whose fixture cannot succeed cannot
distinguish the reason it failed.** `assert_eq!(x, None)` is satisfied by
"refused for the right reason", "refused for the wrong reason" and "there
was nothing there" alike, and only the first is the property.

The generalisation is one sentence: **every negative assertion needs a
positive control that the fixture WOULD have succeeded** — and for a
path-shaped fixture that control has to be built the same way the
producer builds it, not merely written to look similar.

## The ask

A bullet in `docs/CONVENTIONS.md` under the testing gotchas, beside the
constant-parametrisation rule, because the two are the same lesson from
two directions and a reader meeting one should meet the other. Roughly:
*a test that asserts something is REFUSED must first prove the fixture
would otherwise have been ACCEPTED; otherwise it cannot tell refusal
from absence.*

Worth noting for whoever writes it: T-060 has a live worked example in
both directions in `app/src-tauri/src/agent/runner.rs` — the same body
now asserts the absolute spelling of the fixture directory resolves
BEFORE asserting every relative spelling does not.
