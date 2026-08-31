---
id: T-142-s1
title: "The `lint:docs` alias runs the DOCS GATE's CENSUS mode, which names no owed suite and exits 0 — so the one command whose name sounds like the general question is the one that cannot answer it"
status: suggested
suggested_by: executor claude-opus-5 @T-142
blocked_by: []
touches: [tools/e2e, docs/CONVENTIONS.md]
---

**Class parent: `T-142`** (a query ran, produced no error, returned an
answer shaped like the one you wanted, and answered a different
question). **Disposition hint: PROMOTE** — this is the first instance
of that class whose subject is a SHIPPED instrument rather than a
hand-written query, and it is the only one that has cost a red CI run
on main.

## The instance, measured at `1b35e01`

An architect seat set `blocked_by: [T-190]` naming a card that existed
only inside another lane, ran `npm run lint:docs`, read

> `docs-gate: every live task card's frontmatter parses, with a legal status.`

— which is **true** — pushed, and CI reddened in the PARSER suite:
`blocked_by names 'T-190' but no task in the model declares it`
(`lib/parser/test/smoke.test.ts`). Fixed on main at `8df0dcc`.

The seat's own reading was that the gate could not have caught it.
**Re-derived at this ref, that is false**, and the correction is the
finding:

- `npm run lint:docs` is `node scripts/docs-gate.mjs --census`. It
  exits **0**, prints the frontmatter sentence, and prints **no FIRES
  line and no owed suite at all** (`grep -c FIRES` over its output = 0).
- The DOCS GATE **proper**, fed the RANGE RULE's pair, exits **1
  (FIRES)** on a `docs/tasks/*.md` path and names
  `npx vitest run from lib/parser/`, listing
  `lib/parser/test/smoke.test.ts` BY NAME.

## Why it is worth a card rather than a hazard line

`T-090` (done) argued the DOCS GATE is deliberately NOT an npm script
and recorded that `tools/e2e/package.json` carried **exactly four**.
Re-derived here it carries **nine**, and `lint:docs` — added since — is
an alias for the census half. So the repository grew exactly the
affordance T-090 argued against, pointed at the mode that cannot answer
the gate's question, under the name most likely to be reached for.

Two exit-0 meanings now collide: the gate's contract reserves 0 for
*nothing owed*, and the census returns 0 for *I was not asked*.

## Shape of a fix, not the fix

Rename or re-scope the alias so the name states which half it runs, or
have `--census` print one line saying it computed no owed-suite verdict
and that the gate's diff form is the instrument for that. **Not** a new
gate: the instrument that catches this already exists and works.
