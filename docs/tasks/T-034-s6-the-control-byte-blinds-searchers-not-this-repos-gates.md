---
id: T-034-s6
title: The control byte blinds SEARCHERS, not this repo's gates — T-034's notes and s5 overstate the blast radius
status: suggested
suggested_by: verifier claude-opus-5 @T-034
---

T-034's finding is real, its fix is right, and the standing C0 gate is
worth keeping. This is about the **stated mechanism**, which is wrong on
two of the three things it names — and it matters because the claim is
the whole argument for **T-034-s5**, and because a durable note that
misidentifies which mechanism failed will send the next reader to
harden the wrong thing.

## What T-034's notes claim

> `file(1)` calls such a source *data* and **`grep(1)` treats it as
> BINARY** — which means the no-innerHTML gate I had just written,
> `lint:tokens`, and every CI grep **silently stop seeing that file**.

## What is actually true, reproduced

Planted into `app/src/architecture/TasksLens.tsx`, in the same file, at
the same time: a raw-HTML sink (`d.innerHTML = t`) **and** a literal
`U+0000`. `file(1)` duly reported `data`. Then:

| mechanism | how it reads | blinded? |
|---|---|---|
| the no-innerHTML gate (`map-tasks-lens-dom.test.tsx`) | `readFileSync(f,"utf8")` + regex | **NO — it caught the violation** |
| `lint:tokens` (`tools/e2e/scripts/lint-tokens.mjs`) | `readFileSync(f,"utf8")` | **NO — it caught 2 planted arbitrary values** |
| the no-innerHTML gate (`genesis-pane-dom.test.tsx`) | `readFileSync(f,"utf8")` | **NO** (same shape) |
| CI (`.github/workflows/ci.yml`) | — | **VACUOUS — the workflow contains zero greps** |
| `/usr/bin/grep -n` | BSD grep | line text suppressed; **still matches, exit 0** |
| `/usr/bin/grep -q` / `-l` | BSD grep | **fires normally** — an exit-code gate still works |
| `ugrep`/`rg` with `-I` | skips binary files | **TOTAL — no match, exit 1** |

**There is not one shell-`grep`-based gate in this repository.** Every
gate — both no-innerHTML gates, `lint:tokens` — reads through Node's
`readFileSync(…, "utf8")`, where a NUL is just `\u0000` in a string and
regex matching is unaffected.

## So what IS the hazard, and it is a real one

The blinded party is the **searcher**, not the gate:

- `ugrep`/`ripgrep` with `-I` (skip binary) return **no match at all,
  exit 1** — not "binary file matches", *nothing*. **This is the mode
  Claude Code's own `Grep` tool runs in**, and it is how essentially
  every agent and most humans search this tree.
- In a method where agents audit the repo by grepping it (which is what
  this project *is*), a single byte can make a file unsearchable to
  every future session while every gate stays green and every suite
  stays green. That is worth exactly the alarm T-034 raised — just
  aimed at the right target.

## The mechanism reproduced itself while this file was being written

Worth recording, because it is the strongest possible evidence for the
half of T-034's account that IS right. Writing the two paragraphs above
— which quote `\u0000` and `\u0003` as prose — landed **three literal
control bytes** in these two suggestion files (`U+0000` at offset 2014
here, `U+0003` at offsets 982 and 1906 in **T-034-s7**), and `file(1)`
immediately called both markdown files `data`. The verifier caught it
only by running the same C0 scan on its own output before committing.

That is now **six** instances in one task's blast radius — three the
builder hit, three the verifier hit — none of which any test, compile
or gate would have noticed. The escape-lands-as-character failure is
real, frequent, and completely silent. It is the finding worth keeping;
the "which gate goes blind" half is the part to correct.

## What to change

1. **T-034's notes** — replace the "the no-innerHTML gate, `lint:tokens`
   and every CI grep stop seeing that file" sentence with the table
   above. (Recorded in T-034's verdict meanwhile.)
2. **T-034-s5** — its conclusion (lift the C0 check into `lint:tokens`)
   is still right, but for a different reason: not "because the gates
   are blind" (they are not) but **because the tree must stay
   searchable**, and `lint:tokens` is the one check that already walks
   every `.ts`/`.tsx` under `app/src`. Note s5 already concedes
   lint-tokens "survives" — its bullet list contradicts its own lede,
   and the lede is the half that is wrong.
3. Keep the standing gate exactly as it is. It works, it names
   codepoint and offset, and it is proven by planting.
