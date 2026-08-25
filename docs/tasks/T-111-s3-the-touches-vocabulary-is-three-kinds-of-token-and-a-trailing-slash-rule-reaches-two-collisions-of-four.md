---
id: T-111-s3
title: The touches vocabulary is three kinds of token, and the trailing-slash rule T-111 prescribes reaches two of its four collisions — the card's own example is one it misses
status: suggested
suggested_by: executor claude-opus-5 @T-111
---

**T-111's criterion 3 says `touches` tokens SHALL be normalised "at
minimum a trailing-slash rule", and names three examples: `tools/e2e`
beside `tools/e2e/`, `method/` beside `method`, and "one card carries a
bare `docs`". The first two collide under that rule. THE THIRD DOES NOT,
and it is the one the card offers as evidence that the vocabulary is
broken.**

Censused from `docs/tasks/*.md` frontmatter at `e04f5b3` — **124 cards
carry a `touches:` list, 19 distinct RAW tokens**:

      4  '.github/'          21  'app-agent'        12  'lib-parser'
      1  '.nputerignore'      9  'app-board'         1  'method'
      1  'ci'                 2  'app-dispatch'      7  'method/'
      1  'docs'              13  'app-interview'    20  'tools/e2e'
     18  'docs/CONVENTIONS.md' 12 'app-map'          7  'tools/e2e/'
      6  'docs/architecture/components/'
      1  'docs/tasks/'       55  'app-shell'
      5  'crate-index'

## What a trailing-slash rule reaches, and what it does not

**REACHED — two groups, 35 cards:**

    tools/e2e (20) + tools/e2e/ (7)  -> 27 cards
    method    (1)  + method/    (7)  ->  8 cards

19 raw tokens become 17. That is the whole yield of the prescribed
minimum.

**NOT REACHED — two more, and both are on the same card:**

    'docs' vs 'docs/CONVENTIONS.md' (18), 'docs/architecture/components/' (6), 'docs/tasks/' (1)
    'ci'   vs '.github/' (4)

`docs` normalises to `docs`; `docs/tasks/` normalises to `docs/tasks`.
They are different strings, so a trailing-slash fence reports a card
holding `docs` as disjoint from all 25 cards holding a path UNDER `docs/`
— **the exact failure the criterion opens by describing.** `ci` and
`.github/` name one thing and share no substring at all.

## The vocabulary is THREE kinds of token, not one with a spelling problem

That is why one string rule cannot close it:

1. **Component SLUGS** — `app-shell`, `app-board`, `app-agent`,
   `app-map`, `app-interview`, `app-dispatch`, `lib-parser`,
   `crate-index`. Eight, resolved through the component files'
   `touch_slugs:`. **These need EXPANSION, not normalisation** — see
   `T-111-s1`, where two slugs that are different strings share a
   component.
2. **PATHS** — `docs/CONVENTIONS.md`, `docs/architecture/components/`,
   `docs/tasks/`, `docs`, `method/`, `method`, `tools/e2e`, `tools/e2e/`,
   `.github/`, `.nputerignore`. Ten. These need a trailing-slash rule
   **and a prefix rule**: `docs` CONTAINS `docs/tasks/`, and containment
   is overlap.
3. **NEITHER** — `ci`. One card. It is not a slug (no component claims
   it), not a path (nothing at the repository root is named `ci`), and
   the four cards that mean the same thing spell it `.github/`.

**ONE CARD CARRIES THREE OF THE FOUR PROBLEMS AT ONCE**, and it is the
fixture criterion 3 asks for — *"driven from the live board's own tokens
rather than a synthetic pair"*:

    T-054-retire-the-interim-graph-rule.md
    touches: [docs, method, tools/e2e, ci]        status: done

It collides with the seven `method/` cards, collides with the seven
`tools/e2e/` cards, carries a bare `docs` that a trailing-slash rule
cannot reconcile with the 25 cards fenced under `docs/`, and carries `ci`
which no rule can reconcile with `.github/` at all. It is `done`, so it
is stable, and it is a better single fixture than the `tools/e2e` pair
the card names.

## What this asks for

- **The normalisation function's pin should use T-054**, not a synthetic
  pair. `tools/e2e` vs `tools/e2e/` is the easy half and it is the only
  half the card's named fixture exercises.
- **The function needs a documented CEILING on what it claims.** If it is
  a trailing-slash rule, then it must say in terms that `docs` and
  `docs/tasks/` are reported disjoint and that this is known-wrong, so a
  reader does not conclude the vocabulary is reconciled. A normalisation
  that silently misses two of four collisions while the card says the
  vocabulary is normalised is worse than none.
- **`ci` wants a ruling, not code.** One card, `done`. Either it is a
  typo for `.github/` and is corrected in place, or the vocabulary
  admits free-text tokens and the fence says what it does with one it
  cannot resolve. **A token the fence cannot resolve must not be
  silently treated as disjoint from everything** — that is a fence
  reporting "no overlap" when it means "I do not know", which is the
  class of defect `T-110`'s five typed refusals exist to prevent one
  layer down.
- **Validation belongs upstream of the frontier.** The decomposition
  plan already recorded that the vocabulary is "undeclared, unvalidated,
  and collides by spelling" on 2026-08-19; it has been true for six
  days and every dispatch since has been judged by eye. A `touches:`
  token that resolves to neither a slug nor an existing path is a
  parser-level issue kind (C-06, `lib-parser`), not something each
  consumer re-derives — which is T-057's rule applied to a vocabulary
  rather than to a function.
