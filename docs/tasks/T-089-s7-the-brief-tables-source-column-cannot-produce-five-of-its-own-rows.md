---
id: T-089-s7
title: Five of the brief contract's thirteen rows name a source that does not contain the row's content — and the card's own assembled brief silently goes somewhere else for four of them
status: suggested
suggested_by: verifier claude-opus-5 @T-089-verify
---

The dispatch-brief table in `method/roles/executor.md` is declared
normative and *"a program transcribes it as written"*. A program has the
**Assembled from** column and nothing else. Walked literally against a
real planned card (`T-096`, size S, `touches: [lib-parser]`) at `main`,
five rows cannot be transcribed off that column.

The evidence is not the walk — it is the card's own worked brief, which
does not obey its source column on four of the five and does not say so.

| row | column says | where the content actually is | the card's own brief went to |
|---|---|---|---|
| 3 read-first | `adapters/*.md` | the copied-to-root `CLAUDE.md`/`AGENTS.md` | *"Per `CLAUDE.md`"* |
| 4 the lane | `lane-protocol.md` + the integration branch | the project's CONVENTIONS | CONVENTIONS' spellings and `git worktree add` command |
| 6 setup | "the project's CONVENTIONS **build section**" | CONVENTIONS' **lane-protocol** section | *"(CONVENTIONS, lane bullet)"* |
| 11 deliverable | ceremony table + this role file | "whether to merge" is in neither | inferred correctly, unsourced |
| 12 the report | "this role file and the dispatching role's" | **nowhere** — `executor.md` step 6 is *"Commit… Set status… Stop."* | a bespoke list derived from the CARD |

Row 3 is the sharpest of the four, because `method/adapters/*.md` is the
KIT TEMPLATE directory: the files carry `<project name>` placeholders and
there are TWO of them (`CLAUDE.md`, `AGENTS.md`) with no selection rule.
An assembler that obeys the column transcribes the template's read-first
list, not the project's — identical here by luck, and not in general.

Row 12 is the one a program cannot rescue: the row is REQUIRED, its "if
absent" column says *"the work lands and the record does not"*, and its
named source contains no report specification at all.

## Three more the walk hit

- **The table never says which ROLE it is for.** Rows 4 (create the lane)
  and 11 (status to stamp on exit) are executor-only; a verifier brief
  assembled from these thirteen rows is wrong in two rows. The table
  lives in `roles/executor.md`, which is a hint, not a statement.
- **Row 5 cannot compute its own last column.** Disjointness across
  `[lib-parser]` (a slug) and `[method/, docs/CONVENTIONS.md]` (paths)
  needs the slug map at `docs/ARCHITECTURE.md` plus each component's
  `touch_slugs:`. Neither is named. And row 5's two named sources
  disagree today — the board says zero building, `git worktree list` says
  four live lanes — with the precedence rule living in CONVENTIONS, also
  unnamed.
- **Row 10 conflicts with governing rule 2.** Row 10 requires live
  environment facts (port holders, pids). Rule 2 says every figure
  carries *"the ref it was measured at"* and that a figure is *"a
  function of a tree"*. A pid is not, and rule 3's *"the repository
  wins"* cannot adjudicate one.

## And rule 4 has no second half

*"Nothing in the brief may be the only copy of itself"* mandates
redundancy and supplies no precedence for divergent copies. Live
instance in this very commit: the stamp rule is in `TASK-FORMAT.md` and
in `orchestrator.md` 5b, and the two already differ — TASK-FORMAT adds a
universal the tree falsifies, and orchestrator says *"cut the lane FROM
THAT COMMIT"* where TASK-FORMAT says only *"BEFORE the cut"*. Rule 4
needs a companion: **which copy is authoritative**, stated per rule.
The defensible split here is TASK-FORMAT for the FIELD and
orchestrator.md for the ACT, and neither file says so.

## What to do

Belongs with F-04's assembler card, because the assembler is the first
thing that will actually have only the column. Two arms:

1. **Fix the columns** — name the project's CONVENTIONS on rows 4, 6 and
   11; name the root adapter file (not the template dir) on row 3; give
   row 12 a real source by writing a report spec into `roles/executor.md`,
   which it needs anyway; name the slug map on row 5 and give it a
   precedence rule.
2. **Then hold it** — `T-089-s3`'s bidirectional parity check between the
   assembler's emitted components and the table's rows is the reader that
   makes a wrong column visible. A column check is the cheaper half: for
   each row, assert the named source path EXISTS and, where the row
   quotes, that the quoted string is in it.

Do not take arm 2 without arm 1: pinning the table as it stands pins four
wrong pointers.
