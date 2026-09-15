---
id: T-330
title: "A change to the runtime template owes the whole battery because the owed-set derivation cannot place it, and two live-tree bodies froze the no-grant configuration: map the template to its consumers with the fail-closed fallback kept, move the settings-combination bodies to fixtures, keep a focused check against the real configuration, and prove the narrowed selection catches a configuration defect before any check is dropped"
feature: F-04
milestone: 4
size: M
priority: 1
status: suggested
suggested_by: "the architect seat on 2026-09-15, from the closing check of the dispatch grant's landing, on the Codex orchestrator's finding of the same day"
blocked_by: []
touches: [tools/e2e/scripts/gate-run.mjs, tools/e2e/tests/gate-run.spec.ts, tools/e2e/tests/cli.spec.ts, tools/e2e/tests/brief.spec.ts, docs/conventions/gates-and-the-push.md]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## The finding

Recording the owner's approved dispatch grant in `method/runtime/supertaskr.yaml` (a records change of a few lines, approved on 2026-09-15) cost the whole battery at the closing check and would have cost it again on the runner, for causes the derivation and the run itself name.

The owed-set derivation fails closed on the runtime template: the path lies under no package root, no spec reaches it through a static import, and it is not a document the docs gate maps, so the fallback selects all four suites. That is the conservative answer for an unplaceable input, not a finding that nearly every body reads the template. The template's actual consumers are the parser library's settings reader, the arm that reads the dispatch block and the roles, and the bodies that drive them.

Two bodies read the LIVE template and assert the no-grant state as a property of this project: "this project's template carries no grant" in the CLI spec and "this project's own tree is the explicit no-grant state" in the brief spec. Their own comments say they move on the day a migration grant is approved; that day came, and the approved configuration now contradicts them, so an ordinary configuration change reds bodies that froze yesterday's configuration.

The closing check measured a wider coupling than those two bodies: 35 bodies red, almost all of them fixture-driven rituals, because the fixtures seed their scratch roots by copying the LIVE runtime template, so the real grant judged every fixture dispatch and refused each fixture card by name as one the grant does not list. A fixture that inherits the project's configuration tests the project's configuration, not the behaviour it was written for.

## What would settle it

- The derivation places the runtime template with its actual consumers (the settings reader, the arm's grant and roles readers, the bodies that drive them), and the fail-closed whole-battery fallback stays for inputs that are genuinely unresolved.
- The behaviour of settings combinations, the no-grant state among them, is tested over controlled fixture templates, never over this project's live configuration; fixtures that copy the live template seed their own template instead (the roles and the switches they need, and the grant state each body is about); the no-grant coverage is kept in full on a fixture.
- A focused integration check reads the real template and validates the configured grant through the parser's reader (present, mode, recovery, revision, every card in the order carrying a blob that matches the card at the approval ref), so the approved configuration is checked rather than assumed.
- Before any check is dropped from the selection, a planted configuration defect (a wrong mode, a stale blob, a card missing from the map) is shown to be caught by the narrowed selection; the current checks stay intact until then.
- A records-only change (a card filed, a card re-triaged) exercises the parser, the board invariants and the consumers it actually affects, with a measured, short completion target recorded on this card when it lands.

## Implementation notes

The approved grant (revision 1, the owner's yes at 2026-09-15T07:22:18Z, validated through the parser's reader) is prepared as a commit and a patch in the evidence directory and lands with this card's merge, when the bodies and the fixtures have moved off the live template; until then the tree stays in the no-grant state and the express demonstration waits.

## Verdicts
