---
id: T-013-s4
title: The per-component churn figure is FILE EDITS, not commits — the design says commits, and the exact number needs a payload this card did not ship
status: parked
suggested_by: executor claude-opus-5 @T-013
---

The design bundle's map-behavior screen says the churn bar's width is
*"commits in 30 days as a share of the busiest component"*. What T-013
renders is the SUM over the component's churned paths of the commits
that touched each — **file edits**, which double-counts a commit that
touched four files in one component.

**WHY, EXACTLY.** `app/src-tauri/src/churn.rs` aggregates PER PATH
before the payload crosses IPC (`path -> commits, last_commit_ms`), so
the commit identities are gone by the time the TypeScript side knows
which component owns which path — and it has to be the TypeScript side,
because the component globs are parsed there (ADR-015). A distinct
per-component commit count is only derivable if the payload carries every
commit's whole path list, which on this repository is the same 97 KB git
prints and on a monorepo is 5 000 commits' worth of duplicated strings.

**WHAT WAS DONE INSTEAD**: nothing claims to be a commit count that is
not one. The node face, the legend and the panel all say **edits**; the
one figure that IS exact — the number of commits git walked in the
window — is counted Rust-side and appears in the legend as
`30d · N commits`. The divergence is in the WORD, and the bar's RANKING
is unaffected for any component whose files move together.

**IT IS NOT COSMETIC IN ONE CASE, WHICH IS THE REASON TO FILE IT**: a
component whose commits are broad (one commit touching thirty files)
outranks a component whose commits are frequent but narrow (thirty
commits touching one file each) by 30:30 — a tie under edits, and a
30:1 win for the second under commits. Those are opposite readings of
"what is still moving", and the bar currently gives the first.

Three arms, none free: (a) ship per-commit path lists and pay the
payload; (b) push the component globs Rust-side so the aggregation can
happen there — contradicts ADR-015 and forks the glob matcher; (c) keep
edits and say so, which is what this card did. Weigh (a) against the
payload size on a real monorepo before choosing.

**PARKED at the seventh triage (2026-08-24).** Unpark at the design pass that owns the map-behavior screen — the finding's own words: "Weigh (a) against the payload size on a real monorepo before choosing." Answer together with T-013-s6 in one pass.
