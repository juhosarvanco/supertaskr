---
id: T-031-s4
title: C-05 claims `app/test/**` for app-shell, and thirteen lanes fenced without app-shell have edited it
status: suggested
suggested_by: executor claude-opus-5 @T-031
---

Deriving T-031's fence turned up a disagreement between the component
registry and this project's unanimous practice, and it is worth a
ruling because the fence is derived from the registry and a fence is
the thing a verifier checks a diff against.

**THE CLAIM.** `docs/architecture/components/C-05-app.md` lists
`app/test/**` in its `paths:` and carries `touch_slugs: [app-shell]`.
ARCHITECTURE's paragraph under the slug table says the component
files' own `touch_slugs:` is THE AUTHORITY and the prose line is only a
signpost. Read strictly, every file under `app/test/` is app-shell
territory, and no card fenced `[app-board]` or `[app-interview]` may
add a test.

**THE PRACTICE.** Derived at `765362e` by walking every merge commit on
main, resolving each to its card and reading that card's `touches:`:
**42 merges touch `app/test/**`, and 13 of them are lanes whose fence
does not contain `app-shell`** — T-005, T-011, T-019, T-024, T-029,
T-034, T-046, T-056, T-070, T-072, T-081, T-097, T-101. Two of those
touch no app slug at all (T-046 is `[tools/e2e/, docs/CONVENTIONS.md]`).
Re-derive rather than quoting: for each merge M, `git diff --name-only
M^1 M | grep '^app/test/'` against the card's `touches:`.

So the operative rule is not written down anywhere: **a test file
follows the COMPONENT IT EXERCISES, not the directory it lives in.**
Nothing states it, nothing enforces it, and thirteen lanes have relied
on it. T-031 relied on it too — its criteria demand pins in
`board-truth.test.tsx`, `select-board.test.ts`,
`select-task-detail.test.ts` and `genesis-pane-dom.test.tsx`, all four
under `app/test/`, and the alternative reading makes the card
unbuildable in its own fence.

**WHY IT MATTERS BEYOND TIDINESS.** The same derivation is what routes
`app/src/lib/verdicts.ts` — also C-05's, also `app-shell` — and there
the practice does NOT contradict the registry: `git log --all --
app/src/lib/verdicts.ts` returns exactly ONE commit, T-017's, and
T-017's fence was `[app-board, app-shell]`. Zero counterexamples. So a
lane deriving its fence today has to reach opposite conclusions about
two paths the registry treats identically, on evidence the registry
does not carry (see `T-031-s1`, which is that criterion NOT built).
A fence rule with one written form and two lived forms is a rule a
verifier cannot apply.

**ARMS, for an architect rather than a drive-by fix.**

1. **Say it in ARCHITECTURE.** One sentence next to the slug-table
   paragraph: a test file's slug is the slug of what it exercises, and
   `app/test/**` in C-05's `paths:` is an ownership statement about the
   package, not a fence. Cheapest, changes no file the fixtures read,
   and makes thirteen merges retroactively legible.
2. **Narrow C-05's glob.** Replace `app/test/**` with the harness and
   config files it really owns. Most honest, most expensive: moving a
   path between components is the CONVENTIONS gotcha that "DECLARING A
   COMPONENT moves THREE live-registry fixtures", and it would leave
   most of `app/test/` unmapped territory, which the map reports.
3. **Rule that the fence is about `app/src/**` and Rust only**, tests
   riding along with whatever they test. Same content as arm 1, stated
   as a fence rule rather than a registry note.

Arm 1 is the one this finding recommends. What it should NOT do is
leave the question implicit for a fourteenth lane: this is the second
finding this session about the slug map being partly prose
(`T-089-s7`'s row-5 finding, riding T-104).
