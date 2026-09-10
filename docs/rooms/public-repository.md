---
type: debate
status: open
opened: 2026-09-10
question: How does supertaskr get a public repository that holds what a user needs and none of the personal or development material, and how does development go on in the open from there?
---

# The public repository — a history cut, then development in the open

## The question

@human (2026-09-10): "I want to plan how we will have a public repo for supertaskr just like superpowers has. I dont want our planning documents, task cards, our own foundation files etc to be there." And: "There are mentions of Omputer (that i dont want), nputer, my name, quotes of my messages to claude, records of brainstorming decisions made within days that might make me and the product look unprofessional. How will we deal with these and other too personal things in the repo?" The room was ruled "later" at the loop sitting and opened at @human's word the same day.

## What was measured

The repository is private today. The exposure is history, not files: the older product name appears 24 times, the owner's name 22, the owner's home path about 560 times, and every one of about 2,600 commits carries the owner's email. Records are never rewritten by this method's own rule, and a rewritten file stays in git history anyway. Superpowers (obra, read end to end at b36e082, docs/research/superpowers-loop-b36e082.md) develops in the open in one repository, with its plans and release notes inside it; it has no separate development repository. The private-plus-mirror model is the "source drop" pattern and carries a known cost: contributions arrive against a mirror nobody can merge.

## The proposed decision (A–E)

- **A — The model: a history cut.** The public `supertaskr` repository starts from one squashed, curated initial commit at the launch tag, holding the living tree only (the method text and templates, the parser, the CLI, the app, the hooks the kit installs, the guide and reference, the README, the license) and a fresh records directory. From that commit on, development happens in the open there, as superpowers does. This repository keeps the pre-history and is never published. Not the mirror; not open-everything.
- **B — The license: MIT**, matching the published placeholder package; Apache-2.0 is the alternative if a patent grant is wanted for the app. The seat recommends MIT for a method-and-tooling product whose adoption is the point.
- **C — The cadence: tags @human chooses until v1**, one release commit per tag with a changelog generated from the method version notes.
- **D — Records written for an audience, from the cut onward.** Rulings recorded as decisions with reasons and dates, never as quotes of the owner's messages; the owner appears as the owner, not by name; cards carry the measurement and the criteria, not the conversation. A forbidden-content keeper in CI — the rename keeper's second list: the older product name, personal names and emails, home paths, secret shapes, and the shape of a quoted chat message — over the living tree now and over the records after the cut. A public commit identity: a chosen author name and a no-reply address for everything after the cut. The private material that is not a method record (business, the design handoffs, anything commercial) moves to a private companion repository before the cut.
- **E — The timing: the cut is made when the second project passes** (T-304, v1's universality criterion), so what is published has been proven on a project that is not this one; a leak scan over the cut is the last gate before the push.

## What the room needs

@human — a ruling on A–E; then the seat files the cards: the forbidden-content keeper (S, guard-class), the record conventions in the method text (S), the private companion repository and the move of the business and design material (S, @human's act with the seat's list), and the cut itself (M: the manifest of the living tree, the squash, the leak scan, the first tag).
