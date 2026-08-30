---
id: T-018-s1
title: The picker-rearm test races its own sequence counter on a Linux runner — one sighting, on a docs-only diff, in the suite that owns the watcher
status: suggested
suggested_by: integrator nputer-4e @loop-sitting stamps push, CI run 33304351040 (2026-08-30)
touches: [app-shell]
---

`docs_watch::tests::picker_rearms_the_watcher_onto_the_new_root`
panicked on ubuntu-24.04 at `assertion failed: from_b.seq > picked.seq`
— the event sequence observed AFTER re-arming onto root B did not
exceed the `picked` event's sequence. The diff that triggered the run
(`1bcdb4c`) is four docs/tasks files: dispatch stamps and a preflight
ruling paragraph. Nothing in it touches the watcher, the runner, or
any Rust — the red is the TEST's own timing on that runner, the
inotify-cadence family T-153 documented (coalescing windows, fs-event
arrival order), one suite over. 199 of 200 lib bodies passed in the
same run; the rerun-as-measurement verdict is stamped beside this
sighting in the loop-sitting record's addendum.

One sighting. The ask, when promoted: read the assertion's two
sequence reads against the coalescing window's guarantees — whether
`picked.seq` can legitimately tie or lead when the pick lands inside
an in-flight debounce — and either derive the ordering the watcher
actually promises (and pin THAT) or make the test wait for the
convergence the CONVERGED state names. Joins `T-161` (stderr-drain)
on the push watch-list until then: two named intermittents, both
observation-side, neither a product defect on any evidence so far.
