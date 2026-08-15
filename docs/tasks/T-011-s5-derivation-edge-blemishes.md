---
title: Derivation edge-case blemishes — duplicate finding ids, self-edges, invisible dead file:-packages
status: suggested
suggested_by: verifier claude-fable-5 @T-011
---

Three small honest-but-rough behaviors probed during T-011
verification. None makes the map lie; each is a rendering or
completeness wart worth a deliberate decision:

1. **Duplicate component ids duplicate finding ids.** When the parser
   keeps both records of a duplicated id (its documented behavior, the
   duplicate-id issue flags it), derivation emits both — probe:
   two `D3:C-01` findings with the SAME id, and two C-01 nodes.
   "Stable finding ids" stop being unique exactly when the input is
   already broken; T-012 keying by finding id would collide. Cheapest
   fix: dedupe records by id at derive entry (first wins, matching
   §4.1's spirit) or suffix the finding id.
2. **Self depends_on draws a planned self-loop.** `C-01 → C-01` in
   depends_on yields a planned self-edge (observed self-edges are
   correctly suppressed). Either drop declared self-edges or leave to
   the renderer — today T-012 would draw a loop.
3. **A `file:`-dep package with a repo path but no importing edge is
   invisible.** The §6.6 join only fires per-edge, so a declared-but-
   unimported repo-internal package surfaces neither as an edge nor in
   D2. The indexer only emits referenced packages today, so this is
   unreachable with real graphs — recording it so the invariant is a
   decision, not an accident.
