---
title: Pin the picker latch's panic-path release as a permanent test
status: suggested
suggested_by: verifier claude-fable-5 @T-021
---

T-021's `PickInFlight` (app/src-tauri/src/docs_watch.rs) releases the
single-flight latch via `Drop`, so the panic path — a pick pipeline
that unwinds mid-flight — releases today BY CONSTRUCTION. Verified
during T-021 verification with a catch_unwind probe (guard held,
closure panics, latch free after), then reverted with the other
probes.

No SHIPPED test drives that path: the three docs_watch concurrency
tests cover refusal, parked-rendezvous, and dropped-ack, all
non-panicking. If a future refactor replaces the RAII guard with
manual `store(false)` calls (say, to thread the latch across an async
boundary the guard cannot cross), the panic path would regress
silently — a picker that panicked once would answer `busy` to every
later pick until restart.

The pin is ~10 lines in docs_watch's tests: `begin_pick`, catch_unwind
a panicking holder, assert `begin_pick` succeeds after. Worth landing
whenever docs_watch.rs is next open.
