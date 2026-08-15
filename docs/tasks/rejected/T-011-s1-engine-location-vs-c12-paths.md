---
id: T-011-s1
title: Claim the derivation engine's location — C-12 paths vs app/src/lib/architecture/
status: rejected
suggested_by: executor claude-fable-5 @T-011
---

T-011 built the derivation engine in app/src/lib/architecture/ per its
dispatch (the T-004 selector pattern: pure model modules live in
app/src/lib/, as board-model.ts does for C-08). C-12's component file
declares `paths: [app/src/architecture/**]` (plan §6.1 as revised by
§0.0-3, "code arrives with T-011/T-012") — so the registry does not
claim the engine's actual files.

Consequence, measured: the committed graph predates the engine, so
nothing shows yet — but at the T-011 merge the integrator regenerates
graph.json (T-009-s1 standing practice) and the map's own engine
becomes its first D2 finding: `D2:unmapped` [derive.ts, glob.ts,
graph.ts] plus undeclared edges C-05→unmapped (the tests import the
engine) and unmapped→C-06 (the engine imports @nputer/parser). The
exact post-regen finding table is in T-011's implementation notes; the
dogfood fixture will need that table applied at the regen commit.

Architect options (ADR-004 — registry edits are yours):
(a) amend C-12's paths to add `app/src/lib/architecture/**` (and
    declare nothing new: C-12 already depends_on C-06), making the
    engine C-12 territory — one line, kills the D2 before it lands;
(b) keep C-12 = app/src/architecture/** and have T-012 relocate the
    engine there when the pane lands (code move, verifier re-run);
(c) accept the amber as a live demo until T-012 (ADR-013 makes drift
    a v1 feature; the map flagging its own engine is honest).
Option (a) before or at the T-011 merge keeps the dogfood fixture's
edit minimal (its D2/edge expectations then stay empty/unchanged
except the two new C-05→C-06 test-file edges).

Triage 2026-08-16 (architect): REJECTED — already resolved by T-012's
§2 amendments, which decided and shipped option (a): C-12's paths
gained app/src/lib/architecture/** (C-12-map-pane.md carries the
dated comment naming this suggestion), the engine claimed in place,
the predicted D2 never landed; the dogfood fixture reconciled at the
T-012 merge.
