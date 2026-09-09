---
id: T-112-s11
title: "`Board.tsx`'s design note refuses I/O in as many words and NO gate holds it — a `readBrief` call planted in that file reds nothing, while the sibling refusal is kept mechanically by the fence"
feature: F-06
milestone: 4
size: S
priority: 9
status: suggested
suggested_by: "verifier claude-opus-5@subagent @T-112-s5, falsifier F1 at cbc24d4, 2026-09-09"
blocked_by: []
touches: [app/test/board-root.test.tsx, docs/architecture/components/]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding, measured at `cbc24d456370830360f4bd7ea3167d401ff1834a`

`T-112-s5`'s ruling refused two shapes, and the two refusals are kept by
completely different things — which nobody has written down, because from
inside a lane they look alike.

**Shape 1 — lift `openRef` to the shell — is kept MECHANICALLY.**
`app/src/App.tsx` and `app/src/genesis/BoardCrescendo.tsx` are C-05's
`app-shell`; the `[app-board]` fence does not reach them. A lane that
tried it would be refused by `--write-fence` before any suite ran. The
refusal has a keeper and the keeper fires early.

**Shape 2 — fetch in `Board.tsx` — is kept by PROSE ONLY.** That file is
squarely inside `[app-board]`. Falsifier **F1**, run in a detached
scratch worktree at the lane tip: plant C-15's `readBrief` in
`Board.tsx`, both an import and a call in the component body —

    +import { readBrief } from "@/lib/dispatch-store";
    ...
    +  void readBrief("T-001", "executor").catch(() => {});

`board-root.test.tsx`, `board-truth.test.tsx`,
`detail-assignment.test.tsx` and `architecture-dogfood.test.ts`:
**58 passed, 1 failed** — and the one failure is the relation-table pin
already red at that tip for the declaration `T-112-s5` added. **No NEW
body reds.** The file's own design note (*"this file makes no decision
about them"*) is the only thing standing between the composition root and
an `invoke`, and a design note is not a gate.

## Why this is worth a card rather than a shrug

The note has already done real work — it is the argument the architecture
sitting of 2026-08-31 used to refuse shape 2, and `T-112-s5` honoured it
without being made to. That is the good case. The bad case is a lane that
does not read the header, and nothing between it and `main` would notice.

## The shape that would work, and the one that would not

**Not a lint on `Board.tsx` by name.** A rule naming one file goes stale
the day the composition root moves, and it says nothing about why.

The declared graph already knows the answer. C-18 (`Board.tsx`) declares
`depends_on: [C-06, C-08, C-09, C-17]`; an import of C-15 from that file
is an **undeclared component edge**, and `arch drift --fail-on
undeclared` is the gating form that already exists and is deliberately
unwired while the registry carries live undeclared edges by design
(`docs/CONVENTIONS.md`, the `arch` bullet). This is the second card in
one lane to land on that same missing instrument — read it beside
`T-112-s7`, which found the mirror-image hole (an import with no
declaration reds nothing in-lane either). **Whoever picks either up should
pick up both**: one instrument answers both, and the reason it is unwired
is a real ruling that has to be dealt with rather than worked around.
