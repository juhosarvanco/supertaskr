---
type: debate
task:
status: resolved
max_rounds: 2
---

# The gold standard for the foundation files — how each is created and kept, the way elite teams keep theirs


## Resolution

- **Question** — how is each foundation file created and kept, the way elite teams keep theirs, and why did CONVENTIONS swell?
- **Decision** — @human, 2026-09-09: *"Rule A–D as proposed."* A the standard (one line per file; same-order budgets; a template; a gate refusing record-class text in a living document) becomes ADR-023; B CONVENTIONS re-landed to it (T-290, after the rename sitting and T-287); C the docs gate as the content-class keeper and the genesis templates in the same shape (T-291); D section fences declined — the file stays the unit of ownership, a hot file is split (T-292 for dispatch-brief.mjs and brief.spec.ts).
- **Why** — the measurement: overlap is not the cause (one duplicated line in 283, none shared with another live document); content class is — rules carrying their history and argument, which ADR-019 assigns to the records, with no keeper refusing it, and a budget formula that legitimised a file twelve times its siblings. Path-based ownership is what every elite team runs; hunk-level fences cannot be enforced at write time.
- **Changed** — docs/decisions/023-the-foundation-files-standard.md (new); docs/tasks/T-290, T-291, T-292 (new); the section-fences question closed here; ADR-019's budget rule amended by ADR-023 (same order for every governing document).

## The question, as @human asked it (2026-09-09)

*"We need to have a gold standard model in supertaskr for the creation of each foundation file. All the files need to be created and maintained the same way elite professional software development teams do it. Currently the conventions has swelled way too large."* And, opening this room: *"yes"*.

## What the record already committed to

ADR-019 (docs/rooms/governing-docs.md): the governing documents carry RULES and TRUTH-DERIVERS only; RECORDS (cards, checkpoints, ADRs, room resolutions) are immutable and live elsewhere; living documents are REPLACED under byte budgets; the budgets are derived at each landing. The five files are born from method/docs-templates at genesis; the behaviour census is generated (T-138-s1); the docs gate enforces the budgets and the frontmatter; STATE is regenerated from a template at every checkpoint. That is most of the elite model already written down.

## What the measurement says (2026-09-09, at 6c7c7e6)

| file | bytes | its budget (landed / warn / fail) |
|---|---|---|
| docs/STATE.md | 8,248 | 6,772 / 8,465 / 10,158 |
| docs/ROADMAP.md | ~10 KB | 9,801 / 12,252 / 14,702 |
| docs/ARCHITECTURE.md | ~9 KB | 8,525 / 10,657 / 12,788 |
| docs/CONVENTIONS.md | 134,029 | 117,502 / 146,878 / 176,253 |

CONVENTIONS is two sections (Gotchas 98 KB, Build & test 35 KB) and 39 bullets, the largest twelve between 4 and 15 KB each. 61 code and spec files name it by path; the context pack reads its bullets by opener. Overlap is NOT the cause: of its 283 lines of 70+ characters, one is duplicated within the file, three share an opener (commands), and none appears verbatim in any other live document — "one home per fact" holds at the sentence level. The cause is CONTENT CLASS: a rule carries its case history, its measurements and its argument beside it (the record-class text ADR-019 says lives elsewhere), and nothing refuses that. The budget formula then legitimised a file twelve times the size of its siblings. Semantic overlap (two rules over one behaviour) has no keeper and was never measured; the standard's first pass finds it by the keeper each rule names.

## The model elite teams run (docs-as-code), in one line each

1. One document answers one question for one audience; the set is small and named.
2. Rules are short imperatives, each with its enforcer named; the "why" is a linked decision record.
3. History never lives in a living document; it lives in records nothing edits.
4. Explanation lives apart from rules (reference chapters), tutorials apart from both.
5. Every document has a template, an owner, a size budget of the same order as its siblings, and a gate in CI that refuses the budget and the content class.
6. What can be generated is generated and currency-checked, never hand-kept.
7. Ownership is by file; a hot file is split, never fenced by section.

## The proposed decision

A. **The standard, one line per file**: NORTH_STAR holds the why; ROADMAP the what per feature; ARCHITECTURE the components and their interfaces; CONVENTIONS the rules — each an imperative naming its keeper (the gate, spec or hook) and its card, with no history and no argument; STATE the now, regenerated; CAPABILITIES the census, generated; docs/reference the explanation; the records the history. Every file a budget of the same order (CONVENTIONS' re-derived from the rules-only text, not the forensic one), a template, and the docs gate refusing record-class text in a living document (a bullet naming a card id in prose past its first line, a measurement, a "ratified at", a date beside a sentence — the shapes the census can see).

B. **CONVENTIONS re-landed to the standard** (one L card, after the rename pause): the census of readers first; every bullet cut to its rule and its keeper; the forensics moved to the docs/reference chapter that owns the topic and to the cards that own the history; split into topic files under docs/conventions/ where the fence needs it (35 planned cards fence the file whole), with CONVENTIONS.md the index carrying each bullet's opener verbatim; the readers and the budgets re-pointed in the same commit; the stamp line untouched; every program-read sentence byte-identical (T-236's precedent).

C. **The keeper** (one S card, guard-class): the docs gate learns the content-class rule and refuses it; the genesis templates carry the same shape so a new project's files are born this way.

D. **Section fences declined**: the file stays the unit of ownership, as path-based ownership is everywhere else; a hot file is split (dispatch-brief.mjs and brief.spec.ts first — 17 and 12 planned cards behind them).

## @human — the ruling this room waits for

Rule A–D as proposed, or amend. On the ruling: A becomes ADR-023, B and C are filed, D closes the section-fences question in docs/rooms/version-planning.md's moves.
