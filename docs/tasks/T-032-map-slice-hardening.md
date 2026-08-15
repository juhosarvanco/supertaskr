---
id: T-032
title: Map-slice hardening — resolver guard, derivation blemishes, loop third leg, key hygiene
feature: F-06
milestone: 4
priority: 16
size: M
status: planned
blocked_by: []
touches: [crate-index, app-map, app-shell]
builder:
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-009-s2, T-011-s4 (the glob.ts header half; the parse-time
warning lives in T-030), T-011-s5, T-011-s6, T-012-s2, T-012-s3,
T-012-s4. Triage 2026-08-16: seven verifier/executor-probed edges of
the milestone-2 pipeline (indexer → graph → derivation → layout →
emit loop), none a defect today, each a truthfulness or determinism
wart worth pinning while the context is fresh. app-shell touch is
index_cmd.rs + docs_watch.rs only — serialize with the shell-lane
queue at dispatch; crate-index touch serializes with T-010/T-014.

## Acceptance criteria
- THE resolver SHALL treat any `<ascii-scheme>:` specifier except
  `node:` as unresolved(unsupported) — no more deterministic-but-junk
  package nodes for `file:`/`blob:`/`npm:`/`jsr:` — one guard in
  is_unsupported (or a package_ref reject) plus a unit row; the
  closed reason taxonomy unchanged (T-009-s2).
- THE derivation SHALL dedupe component records by id at derive entry
  (first wins, §4.1's spirit) so finding ids stay unique under
  duplicate-id input; declared self-edges (C-01 → C-01) SHALL be
  dropped rather than drawn as planned self-loops; the
  invisible-`file:`-dep-package invariant SHALL be pinned by test or
  recorded in derive.ts's header as a decision (T-011-s5).
- THE app suite SHALL gain a tripwire test walking app/src/** and
  asserting no import specifier matches /^node:/ and none of the five
  names node-builtins.d.ts declares — webview purity as a pinned
  test, not a convention (T-011-s6).
- THE loop-termination story SHALL gain its third leg: after the
  proven silent window, a real source change plus re-index produces
  EXACTLY one more emit whose graph.json content carries the change,
  then provable silence again — appended to
  reindex_emits_once_then_never_again or a sibling in index_cmd.rs
  (the T-012 verifier's reverted live probe, ~35 lines) (T-012-s2).
- THE IndexOutcome payload SHALL carry the collector's cap
  (`capBytes`) from the Rust constant, and MapView SHALL compare
  graph_bytes against it — the duplicated COLLECTOR_CAP_BYTES
  constant dies; the header hint cannot drift from the Rust truth
  (T-012-s3 option a).
- THE layoutKey SHALL join its component and edge lists with an
  unused divider (U+0003), and deriveArchitecture SHALL strip/escape
  C0 control characters when deriving inferred pseudo-component ids;
  a unit probe SHALL pin layoutKey inequality for a crafted
  near-collision pair (T-012-s4).
- THE glob.ts header SHALL name its two deliberate gitignore
  deviations (pure last-match-wins vs git's no-re-include-below-
  excluded-parent; single-segment leading-slash stripping ⇒
  unanchored) and the `a//b` empty-segment collapse — spec, not
  latent surprise (T-011-s4).

## Implementation notes

## Verdicts
