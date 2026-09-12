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

## Revision of 2026-09-10 — decision A restated, D widened, F added (appended on the owner's yes)

**A, restated — one local repository, two branches, one public remote.** Development happens on a `dev` branch that holds everything: the code, the method's records (cards, checkpoints, rooms, decisions, research, the foundation files) where the tools read them, and a `backstage/` folder for material that is not a method record — business plans, design handoffs, commercial and personal notes. A `main` branch holds releases only: its first commit is the v1 initial commit with no history before it, and each later tag adds one commit. `main` is built from `dev` by the cut: the paths named in a checked-in exclusion manifest (the records, the foundation files, the backstage folder) are removed and the rest is squashed into one release commit. The public `supertaskr` repository receives `main` only; `dev` is pushed to a private repository as its backup and nowhere else. The public reader sees one repository and one clean history; the workshop keeps its whole history and loses nothing.

**What crosses, by the manifest's complement:** the method text and templates, the parser, the CLI, the app, the hooks the kit installs, the guide and reference, the README, the license, a changelog generated from the method version notes, and the decision records re-issued for a reader who was not in the room.

**D, widened — the front-stage pass.** Before every cut, a pass over the crossing tree: the forbidden-content keeper (the older product names, personal names and emails, home paths, secret shapes, the shape of a quoted message); the style rule for the crossing documents (decisions stated with their reasons and dates, never as quotes; the owner never named); the product suites run on the cut in a scratch clone to prove it stands alone; a verifier reading the cut as a stranger — every link resolving, no sentence assuming a record the reader cannot see. A one-time editorial pass on the decision records before the first cut. The cut script and the keeper are guard-class code with their own bench.

**F, added — the release checklist.** Before a tag, the owner walks the new features in the app and the CLI as a user would; the seat records the pass as a checkpoint naming the tag and the cut's hash. The tag follows the checkpoint, never precedes it. A pre-release tag serves outside testers when wanted.

**Contributions and issues** arrive on the public repository: an issue becomes a card here, filed with the issue's number and a paraphrase; a pull request is read as a diff, given a card and a fence, re-applied through the bench, and lands at the next tag with credit in the changelog.

**The cards this revision needs:** the exclusion manifest and the cut script (M, guard-class); the front-stage pass and its keeper (S, guard-class); the release checklist as a checkpoint template (S); the public README and contribution note (S); the backstage folder and the move of the business and design material (S, the owner's act with the seat's list). All after the second project passes, when the first cut is due.

## Rulings of 2026-09-10 (the owner, asked with options; appended on the owner's yes)

- **B, the license:** decided at the first cut; the published placeholder stays MIT until then.
- **C, the cadence:** tags the owner chooses until v1, the seat cutting and tagging when the release gate passes, a changelog generated per tag.
- **D, the record conventions and the front-stage pass:** open, pending more planning; the boundary is fixed — they apply only to what crosses to the public repository, and the private development repository keeps its working voice as it is.
- **E, the timing:** the first cut only at the v1 tag itself.
- **F, the release gate:** the owner's checklist recorded as a checkpoint, and every stable tag preceded by a pre-release tag for outside testers with at least one testing cycle between them; the automated gates run first and are recorded in the same checkpoint.

## @architect (claude-fable-5-1, the Claude seat) — 2026-09-12

On 2026-09-11 the development repository itself was made public, to clear the Actions
account block that had stopped every run since the previous evening. The room's revision A
of 2026-09-10 had placed development history on a private backup remote with only curated
releases public, and ruling E had set the first cut at the v1 tag. On 2026-09-12 the owner
ruled that the visibility change is recorded as an interim exception to revision A: the
permanent publication model, public development or a return to the private arrangement,
stays open in this room, and ruling E stands, the curated first release still waiting for
the v1 tag. No further visibility or history change is authorized by this entry.
