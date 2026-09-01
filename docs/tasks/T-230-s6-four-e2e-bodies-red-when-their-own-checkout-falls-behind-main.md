---
id: T-230-s6
title: Four e2e bodies assert their own checkout is CURRENT, so they red on the clock rather than on the tree — every lane that outlives a merge inherits it
status: suggested
feature: F-06
milestone: 4
priority: 3
size: S
blocked_by: []
touches: [tools/e2e]
review: independent
suggested_by: "verifier claude-opus-5@subagent @V-230, 2026-09-02 — measured while attributing a mid-drill red at 90dfe53; NOT a defect in T-230"
---

**THIS IS NOT `T-230`'s AND NOTHING IN THAT DIFF CAUSES IT.** It is
recorded because it cost this seat a re-run to attribute and will cost
the next one the same.

Four bodies in the e2e lane fail once the checkout THE SUITE IS RUNNING
IN falls behind main, because the session-checkout catcher reports STALE
into output they read:

- `checkout-currency.spec.ts` — *THE WIRING'S POSITIVE CONTROL: the same
  arming step says CURRENT for a current checkout, and adds no finding*
- `checkout-currency.spec.ts` — *THE SWEEP AT ARM TIME: the arming step
  RUNS it, and names every checkout git reports*
- `card-preflight.spec.ts` — *a discrepancy answers ONE and a preflight
  that could not run answers THREE*
- `lane-lock.spec.ts` — *the DISPATCH STEP arms it — `brief.mjs
  --write-fence` is the one event, and a widening is the same event
  again*

Measured on 2026-09-02 in a detached verifier bench: the same four bodies
were GREEN in a full four-suite battery earlier that night (e2e exit 0,
546 bodies, at `90dfe53`) and RED a couple of hours later **with the tree
byte-identical and clean, at that same commit**. The cause is in their own
output — `verdict: stale … the judged checkout is at <sha>, which does NOT
contain 33e50b8a — the newest main commit touching .claude. It is 14
commit(s) behind main.` Main had advanced under the bench while sibling
lanes merged. Two trees, one clock: `90dfe53` and a verdict commit on top
of it both fail the same four.

**The property is a time bomb rather than a flake.** Nothing about the
checkout changed; the reference it is judged against moved. Every lane
and every verifier bench is a checkout cut at a base, so any of them that
outlives one merge inherits three reds that read exactly like a
regression, arrive detached from their cause, and get attributed to
whatever diff is nearest — which is the failure `docs/CONVENTIONS.md`'s
DOCS GATE bullet was written about, one layer over.

**What a fix decides**: whether a body that asserts CURRENT about its own
checkout belongs in a suite at all, or whether it wants a fixture whose
vantage it controls — the way the same spec's stale-fixture bodies
already do. The two sweep bodies already build fixtures for the stale
case; it is the CURRENT case that reaches for the live checkout, and that
is the half no lane can hold still.
