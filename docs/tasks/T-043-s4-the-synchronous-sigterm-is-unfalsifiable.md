---
id: T-043-s4
title: genesis_cancel's "sends SIGTERM synchronously" has no body that can fail — deleting the synchronous killpg leaves the suite 60/60 green
status: suggested
suggested_by: verifier claude-opus-5 @T-043
---

Found by the T-043 adversarial verifier while sweeping for a third poison
that stays green, after the executor found two (P7 and P11). This is the
same shape as P11 before it moved: a claim in the acceptance criteria
whose distinguishing behaviour no assertion can observe.

The criterion reads: "`genesis_cancel` SHALL still return promptly, **send
SIGTERM synchronously**, and retain background escalation." The card's
evidence line 5 cites `tests/agent_runner.rs:1073` for all three.

**Drill, run inline at tip `677b46a`.** Delete the synchronous send from
`terminate_group_async` (`app/src-tauri/src/agent/runner.rs:1278`),
leaving the background thread untouched:

```rust
pub fn terminate_group_async(handle: &ChildHandle, grace: Duration) {
    #[cfg(unix)]
    {
        // Synchronously, before this returns: the cancel's whole promise.
-       signals::kill_group(handle.pid, signals::SIGTERM);
        let handle = handle.clone();
        std::thread::spawn(move || terminate_group_observing(&handle, grace));
    }
```

```
test result: ok. 60 passed; 0 failed; 1 ignored; 0 measured; 0 filtered out
M2_EXIT=0
```

**Green.** The reason is structural, not a missing test: the spawned
thread's very first act inside `terminate_group_polling` is
`signals::kill_group(pid, SIGTERM)`, so the child is signalled either way,
microseconds apart. `:1073` measures only that `cancel` RETURNS in under
300 ms (it measured 0 ms; it reds at 918 ms under P11) — it says nothing
about whether the signal preceded the return.

**The line is nevertheless load-bearing, in a way no test can reach.**
`std::thread::spawn` panics on failure. Under thread exhaustion the
synchronous send is the ONLY SIGTERM that goes out; without it the cancel
panics having signalled nothing. That is precisely why it should not be
deleted — and precisely why a body asserting it cannot be written cheaply.

**Recommendation: correct the claim rather than chase a test.** Either

- narrow the criterion to what is observable — "returns promptly and
  retains background escalation" — and record in the code comment that
  the synchronous send exists for the `spawn`-panics path, not for
  latency; or
- pin it at the only place it is distinguishable: a unit body that calls
  `terminate_group_async` against a fixture which records the SIGTERM
  arrival, and asserts the record exists BEFORE the call returns. That is
  a real race to write and would likely be flaky; naming the limitation
  is the better trade.

Either way the card's evidence line 5 currently over-claims: `:1073`
covers promptness and background escalation, not synchrony.

Suggested size S. It touches `app-agent` only, and is documentation plus
at most one small body.
