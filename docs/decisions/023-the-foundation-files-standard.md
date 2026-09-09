# ADR-023: the foundation files hold one class of content each, at one order of size, born from a template and kept by a gate

Date: 2026-09-09 · Status: accepted · Decided in: docs/rooms/foundation-files-standard.md (@human: "Rule A–D as proposed") · Amends: ADR-019 (the budget rule)

## Context

ADR-019 made the governing documents carry rules and truth-derivers only and sent the records elsewhere, under byte budgets derived at each landing. It held for four of the five files. docs/CONVENTIONS.md grew to 134 KB against siblings under 10 KB — not by duplication (one repeated line in 283; none shared with another live document) but by content class: each rule carrying its case history, measurements and argument, which no gate refused, under a budget formula that grew with the file. 35 planned cards fence the file whole. The seat measured this at the third sitting of 2026-09-09 and the room above ruled the model elite teams run: docs-as-code.

## Decision

1. **One class of content per file.** NORTH_STAR holds the why. ROADMAP the what, per feature. ARCHITECTURE the components and their interfaces. CONVENTIONS the rules — each an imperative that names its keeper (the gate, spec or hook that enforces it) and the card that made it, with no history and no argument. STATE the now, regenerated from its template at every checkpoint. CAPABILITIES the census, generated. docs/reference the explanation. The records (cards, checkpoints, ADRs, room resolutions) the history, appended and never edited.
2. **One order of size.** Every governing document's budget is of the same order as its siblings'; CONVENTIONS' is re-derived from its rules-only text at T-290's landing, not from the forensic one. A budget grows only with a ruling, never with the file.
3. **A template and a gate.** Each file is born from method/docs-templates in this shape, and the docs gate refuses record-class text in a living document — a card id argued in prose past a rule's first line, a measurement, a "ratified at", a date beside a sentence — the shapes its census can see (T-291).
4. **Ownership is by file.** A fence names files; a hot file is split into modules or topic files (T-292, and CONVENTIONS' own split under T-290). Section fences are declined.

## Consequences

T-290 re-lands CONVENTIONS to this standard after the rename sitting; T-291 gives the gate its keeper and the templates their shape; T-292 splits the two hottest modules. Until T-290 lands, CONVENTIONS' current budget stands and its band reads drifting, which is the honest reading. The pack (T-254) keeps reading bullets by opener; after the split it reads them across the topic files.
