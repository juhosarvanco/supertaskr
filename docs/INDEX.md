# Index

<!-- GENERATED — do not edit by hand (T-293, ADR-024 decision 2).
     Regenerate:  npm run capabilities   (from tools/e2e/ — the same
                  command that regenerates the behaviour census)
     Currency:    npm run lint:docs      (the docs gate reds while the
                  committed index is stale against the documents below)
     Source: each document's own first heading, the sentence its
     opening paragraph uses to say what it is, and its section
     headings. No line here is typed by hand, so a line is false only
     while this file is stale — and stale is what the gate refuses. -->

The standing read is docs/STATE.md and this file. Everything else
reaches a seat through its brief's context pack.

**WHEN THE PACK DID NOT HAND YOU THE RULE, YOU HAVE TWO MOVES AND
NEITHER IS GUESSING.** Write the ask file your lane names
(`<scratch>/ask-<card id>.md`), park it and keep building; or open the
document below AT THE SECTION its line names and read that section.
An architect session once spent a working day rebuilding a belief
about `blocked_by` that the roadmap's own F-06 entry would have
corrected in a sentence (T-138).

What opening one COSTS is a measurement, not a figure kept here:
`wc -c` the paths below.

- **Roadmap** (`docs/ROADMAP.md`) — The contract: one present-tense paragraph per feature — capability now, what is next, card ids — and at most one new sentence per feature per merge, absorbed into the paragraph at the next edit. **Open it at:** Backbone · Milestones · Parked
- **Architecture** (`docs/ARCHITECTURE.md`) — The contract: which components exist, what each owns, the interface rules — one paragraph each, card ids carrying the stories. **Open it at:** System map · Components · Interfaces · Related decisions
- **Conventions** (`docs/CONVENTIONS.md`) — Compacted under ADR-019 (docs/rooms/governing-docs.md): every bullet is a RULE with its provenance citation and at most one worked example; the instance narratives — re-measurements, second examples, the story of a rule broken after it was written — live on the card or record the citation names. **Open it at:** Build & test · Gotchas
- **Capabilities** (`docs/CAPABILITIES.md`) — What this app does, one sentence per behaviour the e2e suite runs. **Open it at:** accelerators · blocker-retarget · boot-check-guard · brief-flush · brief · card-figures · +35 more
