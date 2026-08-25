---
id: T-102-s1
title: The log cap the runner's bounds are governed by is private, so the rule about it can be measured but never named
status: suggested
suggested_by: executor claude-opus-5 @T-102
---

**T-102 criterion 8 asked for a test that reds if EITHER file moves, and
the obvious spelling of it does not compile.**

`docs_watch::MAX_ECHO_LOG_CHARS` is a bare `const`, private to its
module (`app/src-tauri/src/docs_watch.rs`, line 74 at `023ab3b`). The
three byte bounds it outranks live in `app/src-tauri/src/agent/runner.rs`,
a SIBLING module, so nothing there can say

    assert!(MAX_DENIAL_MESSAGE_BYTES <= crate::docs_watch::MAX_ECHO_LOG_CHARS)

even though that is the rule the caps block now states in prose.

**WHAT T-102 DID INSTEAD, AND WHY IT IS NOT MERELY A WORKAROUND.** The
test DERIVES the cap from the other module's own public behaviour —
`sanitize_for_log("x" * 65536)` comes back as `cap` characters plus
`…(truncated)`, so subtracting the marker's length yields the cap — and
then asserts each constant's class through `bounded_stream_string`, the
composition that actually runs. **It was drilled in both directions and
reds in both** (T-102's M7 and M8): raise `MAX_DENIAL_MESSAGE_BYTES`
above the cap, exit 101; lower `MAX_ECHO_LOG_CHARS` under it, exit 101.

So the criterion is MET. This file is about the cost, which is real:

- the derivation is **five lines of ceremony** standing in for one
  comparison, and it carries its own failure mode — if
  `sanitize_for_log` ever stops appending a marker, the subtraction
  computes a wrong cap. T-102 guards that with an explicit
  `ends_with(MARKER)` assertion first, which is another line of
  ceremony for the same reason;
- **the marker string is now spelled in two files**, `docs_watch.rs`
  and `runner.rs`'s test, with nothing joining them;
- and a reader of `docs_watch.rs` gets no signal at all that another
  module's three constants are ordered against this one. The
  relationship is documented only on the far side.

## The fix, and why a lane could not take it

One token: `pub(crate) const MAX_ECHO_LOG_CHARS`. Then the caps block's
rule is assertable by NAME, the derivation and its guard go away, and a
`docs_watch` reader can be pointed at the constants that depend on it.

**T-102's fence is `[app-agent]`** — `app/src-tauri/src/agent/**`,
`app/src/lib/agent-store.ts`, `app/src-tauri/src/bin/fake_agent.rs` and
`app/src-tauri/tests/agent_runner.rs`. `app/src-tauri/src/docs_watch.rs`
is outside it, and widening a fence from inside a lane is the one repair
an executor may never make. **The fence this needs is whichever
component owns `app/src-tauri/src/docs_watch.rs`.**

Worth deciding rather than doing by reflex: widening a constant's
visibility to satisfy a test is a real (if small) API decision, and the
behavioural derivation is arguably the BETTER test — it measures the
composition rather than two integers, so it would survive
`sanitize_for_log` changing HOW it caps. The cheapest honest outcome may
be `pub(crate)` **plus** keeping one behavioural assertion, rather than
either alone.
