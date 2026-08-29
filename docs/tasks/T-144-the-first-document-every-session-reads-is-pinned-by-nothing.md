---
id: T-144
title: The root adapter is the first document every session reads, it exists in two copies that must agree, and nothing in the repository asserts they do
feature: F-06
milestone: 4
priority: 7
size: S
status: planned
suggested_by: architect claude-opus-5
blocked_by: []
touches: [tools/e2e, app-agent]
builder:
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-138-s3 (Amnesty triage 2026-08-29 (triage seat)) — the same set read by a third consumer, and wrong in BOTH directions today — verified live at this base: brief.mjs --task still lists docs/NORTH_STAR.md, which the adapter names only as a routing pointer, and still omits the product pointer entirely because tools/e2e/tests/ is not a docs/*.md path. Its repair (a) is the structural one this card's criteria carry: mark the set rather than pattern-match it, so a routing mention and a read-first entry differ by a boundary instead of by a regex's guess.

Absorbs: T-145-s1 (Amnesty triage 2026-08-29 (triage seat)) — the same family one directory over, with the measurement that turns the argument into a fact: the exact pre-T-145 defect restored on purpose passes a full green cargo suite, 18 result lines, zero failures. It supplies both properties this card's criteria adopt — the derived name-set comparison that catches omission AND invention, and the byte-identity of every file under method/adapters/ from line 2 on — and the reason a new file in that directory is not an escape.

**PROMOTED at the amnesty triage, 2026-08-29, as the owner of the
adapter-family class.** Three findings from three seats say the same
thing about the same family of files: **the documents whose entire job
is making sure a session is not ignorant are the documents with no pin
on them.**

Absorbs: T-145-s1, T-138-s3.

Needles re-checked at this base. The root pair is still asserted by
nothing about its CONTENT. The TEMPLATE is still read by nothing —
`kit.rs` `include_str!`s both adapter templates and asserts only that
the compiled bytes equal the same file on disk, which is true for any
content whatsoever, and `T-145-s1` MEASURED that: the exact pre-T-145
defect restored on purpose passes a full green `cargo test`, 18 result
lines, zero failures. And row 3 of every generated brief is still wrong
in both directions: `deriveReadFirst` still extracts with
`/\bdocs\/[A-Za-z0-9_./-]*\.md\b/g`, so a live `brief.mjs --task` run
at this base still lists `docs/NORTH_STAR.md` — which the adapter names
only as a ROUTING pointer — and still omits the product pointer
(`tools/e2e/tests/`) entirely, because it is not a `docs/*.md` path.

## Acceptance criteria

- THE two root adapters SHALL be asserted to agree, by content, by
  something `npm test` or `cargo test` runs. The asymmetry is the reason
  it matters: an edit to `AGENTS.md` at least moves a file the token
  scan touches, while an edit to `CLAUDE.md` alone moves a file NOTHING
  in this repository looks at — and Claude Code sessions are the
  population that reads it.
- EVERY file under `method/adapters/` SHALL be asserted byte-identical
  from line 2 on, so the template pair cannot diverge either.
- FOR each `method/adapters/*.md` THE set of `docs/<X>.md` paths the
  template names SHALL equal the set of `docs/<X>.md` files the method
  scaffolds, DERIVED on both sides — no document list and no tally
  written down anywhere, which is what keeps the pin from going stale
  the way the sentence it guards did. This catches OMISSION (T-145's own
  defect) and INVENTION (a dead path shipped into every new project).
- A NEW FILE UNDER `method/adapters/` IS NOT AN ESCAPE and the lane
  SHALL NOT try it: `the_snapshot_table_covers_every_method_scaffold_file`
  in `kit.rs` walks that directory and reds `cargo test` for any file
  not in `KIT_FILES`. The fence would permit the write; the suite
  forbids it.
- THE brief's row 3 SHALL stop reporting a routing mention as a
  read-first entry and SHALL stop dropping an entry that is not a
  `docs/*.md` path. IF the repair is the structural one — an explicit
  marked block in the adapter that the deriver reads, so intent is a
  boundary rather than a regex's guess — THEN it changes the adapter
  TEMPLATE too, which raises the method-bump question `T-145-s2` parks;
  the lane SHALL say which repair it took and route the bump rather than
  deciding it.

## What is true right now

`CLAUDE.md` and `AGENTS.md` at the repository root are **byte-identical**
— both `sha256 0f0393da7d997953…` at `692ed4d`. They are the same
document addressed to two different readers: Claude Code sessions open
`CLAUDE.md`, other agents open `AGENTS.md`.

**Nothing keeps them that way.**

- The string `CLAUDE` appears **zero times** in `tools/e2e` and
  `app/test`. Root `CLAUDE.md` is referenced by no test at all.
- `AGENTS.md` appears twice, and **neither reference is about its
  content**: `token-scan.spec.ts:113` lists it among the roots that must
  restore to an EMPTY DIFF after a token plant, and
  `token-scan.mjs:1221` asserts it is a member of CONTROL. Both are
  properties of the *scanner*, not of the *adapter*.
- No test, gate or lint asserts the two files agree.

## Why this is worth a card

The root adapter carries the **read-first set** — the sentence naming
which standing documents a session opens before doing anything. That
sentence was rewritten on 2026-08-26 precisely because an architect
session had spent most of a working day rebuilding a belief that
`ROADMAP`'s own `F-06` entry would have corrected (`T-138`).

So the document whose entire job is *making sure a session is not
ignorant* is the one document with no pin on it. **A silent divergence
here does not produce a red suite; it produces two populations of agents
following different instructions**, and the difference shows up as
inconsistent behaviour attributed to the model rather than to the file.

**The asymmetry is the sharp part.** An edit to `AGENTS.md` at least
moves a file the token scan touches. An edit to `CLAUDE.md` alone moves
a file **nothing in this repository looks at**, and Claude Code sessions
— the ones doing most of the work here — are exactly the population that
reads it.

## What this card does NOT claim

The two files are **not** currently divergent, and there is no evidence
they ever have been. This is a missing guard, not an incident. Do not
write it up as a defect that fired.

## The shape of a fix, not the fix

1. **Assert the two are byte-identical**, in the suite that already
   walks tracked files. One line, no new machinery, and it fails loudly
   the moment someone edits one copy. Cheapest and covers the asymmetry.
2. **Assert the read-first SET is what the role files expect.** Stronger
   and it is the property anyone actually cares about — but it needs the
   set to be extractable from the adapter's prose, and prose is what
   went stale in the first place.
3. **Generate one from the other** at a gate rather than checking them.
   A construction beats a check, which is this project's stated
   preference. Costs a build step on a file humans edit by hand, which
   is the reason to think twice.

**Arm 1 is the one to take first** — it is nearly free and it makes arms
2 and 3 optional rather than urgent.

**SCOPE ARM 1 TO THE ROOT PAIR ONLY.** There is a second adapter pair —
`method/adapters/CLAUDE.md` and `method/adapters/AGENTS.md`, the
templates a new project copies — and those two **legitimately differ by
one line**: `AGENTS.md`'s opening HTML comment names the tools it serves
("Codex CLI, Cursor, Gemini CLI etc.") and `CLAUDE.md`'s does not. A
check written as *"every adapter pair in the repository is
byte-identical"* fails on that pair on day one and gets weakened or
deleted rather than fixed. Compare the ROOT pair byte for byte; if the
templates are ever worth comparing, it is content-below-the-comment, and
that is `T-145`'s ground, not this card's.

## One caution for whoever takes it

**A test that reads one file and asserts a property of it can pass while
the other file is missing entirely.** Per `T-142`, prove the check can
fail: make the two differ in a scratch worktree, watch it RED, restore,
watch it GREEN. A comparison whose positive control is never run is the
same shape as a census on a field that does not exist.
