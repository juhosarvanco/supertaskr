---
id: T-265-s2
title: "The three root documents open with the lowercase identifier `supertaskr` where ADR-022 decision 1 gives prose a capital S — README, CLAUDE.md and AGENTS.md are read by people, and there is not one capital-S mention anywhere outside T-265's fence"
feature: F-01
milestone: 4
size: S
priority: 6
status: suggested
suggested_by: "executor claude-opus-5@subagent, at T-265's lane, 2026-09-08 — measured while ruling the case question T-264's verdict routed to this card"
blocked_by: []
touches: [README.md, CLAUDE.md, AGENTS.md]
builder:
verifier:
built_by:
verified_by:
review: independent
---

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
