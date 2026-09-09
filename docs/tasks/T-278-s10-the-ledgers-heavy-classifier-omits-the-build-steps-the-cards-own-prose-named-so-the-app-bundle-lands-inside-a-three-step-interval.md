---
id: T-278-s10
title: "The ledger's heavy-step classifier omits every build command, so the app bundle the card's own prose named as a consumer lands inside a three-step interval and the graph gate's cargo build inside another — the readings are honest and the attribution is coarser than the sentence that asked for it"
feature: F-04
milestone: 4
size: S
priority: 4
status: suggested
suggested_by: "verifier claude-opus-5@subagent @T-278-s2, 2026-09-09, at b1c0a0c"
blocked_by: [T-278-s2]
touches: [.github/workflows/ci.yml, tools/e2e/tests/workflow-parity.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

T-278-s2's ledger is derived rather than listed, which is the right shape:
`diskLedgerProblems` classifies which steps owe a reading from the steps'
own text, so a heavy step added tomorrow without a reading reds instead of
going unattributed. The classifier is

    HEAVY_RUN  = /\b(apt-get install|npm ci|cargo test|cargo install|playwright install)\b/
    HEAVY_USES = /^actions\/(cache|setup-node)@/

Every entry is an INSTALL, a RESTORE or a test run. **No build command is in
it**, and three steps that write to the disk are therefore inside somebody
else's interval:

- `app build` (`npm run build`) — the app bundle. T-278-s2's own card body
  names it in the list of consumers: "installs three node trees, **builds
  the app bundle** and downloads Chromium". It sits between the reading
  after `app install` and the reading after the cargo suite, with `app
  suite` and `cargo test` in the same interval — three steps, one delta.
- `graph currency (supertaskr-index index --check)` — `cargo run -p
  supertaskr-index`, which BUILDS that binary on a cold target before it
  reports. It sits between the cargo-suite reading and the cargo-audit
  reading, sharing its interval with nothing else, so this one is only a
  naming gap rather than an attribution gap.
- `parser build` and `parser types`, in the interval after `parser
  install`.

NOTHING HERE IS WRONG. The readings that exist are honest, identical and
comparable, and the card's original prose is satisfied twice over — it
offered a job-start reading OR a per-heavy-step delta and the lane shipped
both. What this card carries is that the per-step arm is coarser than the
sentence that asked for it, in exactly the place that sentence named.

AND THE FIX IS NOT "ADD `npm run build` TO THE REGEX", which would be a
list wearing a derivation's clothes. The honest question is what the
classifier is FOR: it is a floor on coverage, and a floor that names
install-shaped commands cannot see a build. Either the classifier learns
the build shape by the same derivation it already uses, or the property
is restated as "every step between the checkout and the floor is followed
by a reading, except the ones argued in a table" — which is the shape
`CI_SEQUENCE` in the same file already uses for its divergences, and which
would make the exceptions the thing a reader reviews.

DECIDE IT WITH THE FIRST LEDGER IN HAND, not before. The first CI run after
T-278-s2 merges prints eleven readings, and the intervals themselves say
whether the app bundle is worth its own reading or is a rounding error
beside the browser download. That reading is T-278-s1's fourth and this card
waits on it, for the same reason T-278-s6 and T-278-s7 do.
