---
id: T-265-s2
title: "The three root documents open with the lowercase identifier `supertaskr` where ADR-022 decision 1 gives prose a capital S — README, CLAUDE.md and AGENTS.md are read by people, and there is not one capital-S mention anywhere outside T-265's fence"
feature: F-01
milestone: 4
size: S
priority: 3
status: planned
suggested_by: "executor claude-opus-5@subagent, at T-265's lane, 2026-09-08 — measured while ruling the case question T-264's verdict routed to this card"
blocked_by: []
touches: [README.md, CLAUDE.md, AGENTS.md, app/src-tauri/tauri.conf.json]
builder:
verifier:
built_by:
verified_by:
review: independent
---

Absorbs: T-264-s4 (2026-09-14, the owner's approval of 2026-09-14, pile 2 batch 3a, after the Codex orchestrator's review), under the owner's ruling 4 of 2026-09-13 (productName and the window title take the capital S): app/src-tauri/tauri.conf.json joins this fence. Supersession of 2026-09-14: the sentence below saying those two configuration strings are T-264-s4's and stay there is superseded — they are this card's now.

## The finding

ADR-022 decision 1 is one sentence with two halves: **"one word, capital
S in prose, lowercase `supertaskr` as an identifier"**. T-264 moved the
identifiers and, correctly for its own scope, moved these three
documents' prose to the identifier spelling as well — its fence was the
identifier pass and the case question was explicitly left open
(`T-264-s4`, whose verdict says "the ruling is T-265's").

**T-265 rules it: prose takes the capital S**, and the rule has a plain
test — a string a PERSON reads is prose; a string a PROGRAM resolves is
an identifier. The kit's own templates now read `the Supertaskr
convention`; the copies at this repository's root still read `the
supertaskr convention`, so the template and its de-placeholdered copy
disagree on the one word the template exists to carry.

**Measured at `37c5432`**, `git grep -c 'Supertaskr'` over `app`, `lib`,
`tools`, `.github`, `.claude`, `README.md`, `CLAUDE.md` and `AGENTS.md`
returns **nothing at all** — not one capital-S mention exists outside
T-265's fence. The three occurrences here are the documents; the two in
`app/src-tauri/tauri.conf.json` are `T-264-s4`'s and stay there.

- `README.md:1` — the `# supertaskr` heading, this repository's front page.
- `CLAUDE.md:1` and `CLAUDE.md:30` — the heading and
  "runs on the supertaskr convention".
- `AGENTS.md:1` and `AGENTS.md:30` — the same two.

None of it is a program-read string: no script greps these headings, and
the adapter sentence is addressed to a reading agent.

## Acceptance criteria

- WHEN a person opens `README.md`, `CLAUDE.md` or `AGENTS.md` THE
  product name in prose SHALL be `Supertaskr`, and every identifier they
  quote — `.supertaskr/`, `npx supertaskr`, `@supertaskr/parser`,
  `supertaskr-index` — SHALL stay lowercase.
- WHEN the root adapters are compared with their templates
  (`method/adapters/CLAUDE.md`, `method/adapters/AGENTS.md`) THE
  convention sentence SHALL differ only in the project-specific
  substitutions the template's placeholders name, and not in the case of
  the product's name.
- The suites the docs gate names for the changed paths SHALL run green,
  and `npm run lint:tokens` SHALL stay clean over both corpora.
- IF a body anywhere greps one of these strings THEN it moves in the
  same commit; derive that set at your own ref rather than trusting this
  sentence.

Promoted 2026-09-13 (the pruning sitting (T-306), the owner's ruling of 2026-09-13): to planned at priority 3 — the three root documents open with the identifier spelling, and T-264-s9's own card says this card owns those sites. Not dispatched by this sitting.
- WHEN this is ruled THE `productName` and window `title` in
  `app/src-tauri/tauri.conf.json` SHALL carry the ruled spelling, and
  the bundle identifier SHALL stay `dev.supertaskr.app` whatever the
  ruling — an identifier is lowercase under decision 1 either way.
- IF the ruling is that they are prose THEN this card SHALL be absorbed
  into `T-265` rather than dispatched on its own, because a two-string
  edit does not earn a lane beside the pass that owns the question.
  (the bullets above are absorbed whole from T-264-s4, pile 2 batch 3a, 2026-09-14; the whole child contract)
- Clarification of 2026-09-14: the absorbed bullet above that routes this work into T-265 is discharged by this authorized consolidation into T-265-s2, the follow-up carrying the remaining prose work — T-265 is done and is not reopened, and no further absorption is ordered; the configuration spelling requirement and the unchanged bundle identifier remain active criteria.

## Absorbed from T-264-s4 — The app's productName and window title landed as the lowercase IDENTIFIER `supertaskr`, and ADR-022 decision 1 gives prose a capital S — the two strings a user actually reads are the prose pass's, not the identifier pass's (kept whole; 2 spelling(s) of the pre-rename identifier redacted to "the pre-rename identifier" — the sanctioned edit, named here)

Title as filed: "The app's productName and window title landed as the lowercase IDENTIFIER `supertaskr`, and ADR-022 decision 1 gives prose a capital S — the two strings a user actually reads are the prose pass's, not the identifier pass's"

Filed as: status suggested, priority 6, size S, touches [app/src-tauri/tauri.conf.json], wake None, suggested_by executor claude-opus-5@subagent, at T-264's lane, 2026-09-08 — decided at the tauri.conf.json edit and routed rather than guessed.

### The finding (T-264-s4)

**Class parent: `T-264`**, and the question it could not answer from
inside its own scope. ADR-022 decision 1: *"one word, capital S in
prose, lowercase `supertaskr` as an identifier"*. Decision 2 lists
*"the app's product name and bundle identifier `dev.supertaskr.app`"*
among the IDENTIFIERS, and gives the exact spelling only for the bundle
id. Decision 4 orders the identifier rename (T-264) before the prose
rename (T-265).

`app/src-tauri/tauri.conf.json` carried `"productName": "the pre-rename identifier"` and
`"title": "the pre-rename identifier"` — both lowercase — and T-264 moved them to
`"supertaskr"`, which is the faithful identifier-level rename and
changes the case of nothing. **But those two strings are the two the
user reads**: the window's title bar and the bundle's name in Finder and
in the installer. If they are prose, they take the capital S and the
edit belongs with `T-265`.

**IT IS A RULING, NOT A MEASUREMENT**, which is why it is filed rather
than taken: nothing in the tree can decide whether a window title is
prose, and a lane that decided it by itself would be a lane making a
naming ruling from inside a mechanical rename.

### T-264-s4's acceptance criteria as filed (absorbed into the criteria above)

- WHEN this is ruled THE `productName` and window `title` in
  `app/src-tauri/tauri.conf.json` SHALL carry the ruled spelling, and
  the bundle identifier SHALL stay `dev.supertaskr.app` whatever the
  ruling — an identifier is lowercase under decision 1 either way.
- IF the ruling is that they are prose THEN this card SHALL be absorbed
  into `T-265` rather than dispatched on its own, because a two-string
  edit does not earn a lane beside the pass that owns the question.

### T-264-s4's Implementation notes (as filed, empty)
<!-- executor appends before finishing -->

### T-264-s4's Verdicts (as filed, empty)
<!-- verifier appends: date, model@session, APPROVED / REJECTED + failures -->

## Implementation notes

## Verdicts
