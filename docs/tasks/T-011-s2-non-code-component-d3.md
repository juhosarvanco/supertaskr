---
title: D3 declared_only permanently flags non-code components (C-01, C-11) on the TS-only graph
status: suggested
suggested_by: executor claude-fable-5 @T-011
---

The derivation's D3 (declared_only: globs match no indexed file) fires
today for C-01 (method/ — markdown only), C-07 (Rust — indexer language
lands T-010), C-11 (styles/assets — css and fonts), C-12 (map pane —
code lands T-012). C-07 and C-12 are honest "not built/indexed yet" and
will clear on their own. C-01 and C-11 are STRUCTURAL: their territory
will never contain indexer-walkable code, so their amber is permanent
noise — the exact failure mode plan §10 wants driven to zero before
launch ("the repo should reach zero drift").

Options for the architect: (a) accept the permanent amber as honest
(the reality layer genuinely doesn't see them); (b) a component-file
field (e.g. `non_code: true` or reusing `layer:` vocabulary) that
downgrades D3 to informational for such components — parser (C-06) +
derivation (this engine) each a small additive change; (c) widen the
indexer's language set someday so css/md become reality-layer citizens.
The derivation deliberately computes the honest finding today and takes
no position; deciding is registry/format territory (ADR-004).
