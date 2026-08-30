---
id: T-018-s2
title: The picker-rearm test races its own sequence counter on a Linux runner — one sighting, on a docs-only diff, in the suite that owns the watcher
status: parked
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

**PARKED at standing triage sitting #2 (2026-08-30, architect).** One sighting is a sighting, not a defect, and the loop-sitting record's own rerun-as-measurement verdict already stands beside it. Promoting it now would buy a lane to reason about a timing window from a single observation, which is the shape this project's own hazard list calls out: run the body alone before attributing anything to a diff.

**RESURFACES on either of two events, whichever comes first, and both are checkable by whoever meets them:**

1. **A SECOND sighting of `picker_rearms_the_watcher_onto_the_new_root` failing on `from_b.seq > picked.seq` in any run.** Two sightings make it a class; the seat that sees the second appends its run id here as a dated corroboration and unparks. Derive the history with `gh run list` against the runs since this park's date — this card does not carry a count, because a count here goes stale by the hour.
2. **`app-shell` is next dispatched.** That lane holds the watcher and its suite, so the ordering question — whether `picked.seq` may legitimately tie or lead when the pick lands inside an in-flight debounce — is one it can answer at no extra cost. The lane re-derives rather than trusting this body.

Joins `T-161` on the push watch-list until then: named intermittents, observation-side, no product defect on any evidence so far.

SECOND SIGHTING (2026-08-30, CI run on 2e4b76f — a docs-only diff again): same assertion, `from_b.seq > picked.seq`, same body. THE RESURFACING CONDITION IS MET. Promoted at this sighting: feature F-02, milestone 4, priority 5, size S, touches [app-shell] — the ask stands as filed (derive the ordering the watcher actually promises and pin THAT, or wait for the CONVERGED state). Two sightings, both on diffs that cannot touch the watcher; rerun-as-measurement pending on the second.
