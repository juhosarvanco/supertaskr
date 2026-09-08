---
id: T-265-s3
title: "`rename-scan.mjs`'s corpus is app/, lib/, tools/, .claude/, .github/ and five root files — every tree T-265 renamed is outside it, so a leftover identifier, a mis-cased name or a homoglyph in method/, docs/guide/, docs/reference/ or docs/business/ reds nothing"
feature: F-01
milestone: 4
size: S
priority: 5
status: suggested
suggested_by: "verifier claude-opus-5@subagent (phase 2), at T-265's bench, 2026-09-08 — measured with three mutants in a detached scratch worktree at 3589e0f, all three surviving every gate in the tree"
blocked_by: [T-224]
touches: [tools/e2e/scripts/rename-scan.mjs, tools/e2e/tests/identifier-rename.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## The finding

**Class parent: `T-264-s6`** (the records guard's floors are a content
count over a directory rather than a path pin). This card is the other
half of the same structure: the guard's CORPUS is as under-scoped as its
floors are over-scoped, and in the opposite direction.

`tools/e2e/scripts/rename-scan.mjs` declares

    SCAN_ROOTS = ["app/", "lib/", "tools/", ".claude/", ".github/"]
    SCAN_ROOT_FILES = [".gitignore", ".supertaskrignore", "AGENTS.md",
                       "CLAUDE.md", "README.md"]

and its own comment says why: *"exactly the trees T-264's first
acceptance criterion names"*. That was right for T-264. It means
`method/`, `docs/guide/`, `docs/reference/`, `docs/business/`,
`docs/NORTH_STAR.md`, `docs/ROADMAP.md`, `docs/VERSIONS.md` and
`docs/research/competitors.md` — **the whole of T-265's fence** — are
outside the corpus by construction. After T-265 lands, the rename is
complete and nothing in the tree holds the second half of it.

**Measured, not reasoned.** Three mutants planted in a detached scratch
worktree at `3589e0f`, each landing read back from `git diff -U0`, each
restored and the restoration proved by `shasum -a 256`:

| mutant | landing | lint:tokens | lint:docs | method-evals | verdict |
|---|---|---|---|---|---|
| leftover identifier | ``npx `@nputer/e2e` `` + `.nputerignore` added to `method/adapters/CLAUDE.md` | — | 0 | 0, 9 evals | **SURVIVED** |
| mis-cased name | `Supertaskr` → `SuperTaskr` in `docs/guide/the-model.md` | 0 | 0 | 0, 9 evals | **SURVIVED** |
| homoglyph | Cyrillic `С` (U+0421) for `S` in `docs/guide/README.md:3` | 0 | 0 | — | **SURVIVED** |

The adapter-template mutant is the sharpest of the three: `KIT_FILES`
materializes `method/adapters/CLAUDE.md` into every project genesis
scaffolds, so a leftover there ships the old name into somebody else's
repository and no gate in this one can see it.

**This is not hypothetical.** T-265's verifier found a real instance of
the second row while sweeping by hand — `docs/reference/14-versions.md`
spelled the CLI `` `npx Supertaskr` `` with a capital S inside a code
span, against ADR-022 decision 1's *"lowercase `supertaskr` as an
identifier"* — and it reached the tip because nothing could red on it.

## Acceptance criteria

- WHEN `scanCorpus` walks the tree THE roots SHALL include `method/` and
  the governing-document and prose trees T-265's `touches:` names, so
  that a survivor there is classified rather than unseen.
- WHEN a survivor in those trees is not one of the enumerated classes
  THE unclassified-survivor body SHALL red, naming the file and the line.
- WHEN the product name appears in prose or in an identifier anywhere in
  the corpus THE case SHALL be checked against ADR-022 decision 1 — a
  capital `S` inside a backtick code span or an identifier is a finding,
  as is a lowercase `s` opening a prose sentence (`T-265-s2` rules the
  second half).
- IF a name-shaped token carries a non-ASCII homoglyph THEN the scan
  SHALL red rather than pass it as an unrecognised word.
- The new classes SHALL each carry a mutant shown failing before the
  body is believed, planted where the arming is absent (verifier.md 2b).
- IF the enumerated survivor set must grow to keep the tree green THEN
  each addition SHALL name the ruling that holds it (ADR-022 decision 4,
  `T-264-s3`, `T-269`) rather than being added to silence a red.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
<!-- verifier appends: date, model@session, APPROVED / REJECTED + failures -->
