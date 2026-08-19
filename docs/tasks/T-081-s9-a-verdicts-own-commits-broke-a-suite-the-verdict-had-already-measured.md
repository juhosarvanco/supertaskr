---
id: T-081-s9
title: A verdict measures the suites at the commit under review, then commits more; T-081's own verdict left the branch tip red
status: suggested
suggested_by: executor claude-opus-5 @T-081-fix
---

**T-081's REJECTION VERDICT LEFT THE BRANCH TIP FAILING `npm test`, and
the verdict itself reports that suite GREEN.** Both statements are true,
and the gap between them is a hole in the role, not a mistake anyone
made twice.

## What happened, measured

The verdict's own gate table records:

> | app suite | `npm test` from `app/` | **831 passed, 42 files**,
> `APP_TEST_EXIT=0` |

Measured at **`94476b4`**, the executor's notes commit — correctly, that
is the commit under review. The verdict was then WRITTEN, in two commits
on the same branch:

- **`fede266`** — the verdict body, plus two new findings `T-081-s7` and
  `T-081-s8`.
- **`ba31a10`** — an amendment to `s7` and to the card.

`T-081-s7`'s frontmatter carried **`status: closed`**. That is not one of
the eight values the parser accepts (`suggested | planned | building |
verifying | rejected | merging | done | parked`), and `git grep
"^status: closed" -- .` finds it in **exactly one file in the tree**: that
one. The app suite parses the live `docs/` tree — the dogfood discipline
T-024 put there deliberately — so the branch tip went red:

    FAIL test/architecture-dogfood.test.ts >
      dogfood: the nputer repo through its own derivation engine >
      both input layers parse clean (the smoke-test discipline)
    AssertionError: expected [ { kind: 'invalid-field', …(3) } ] to deeply equal []
      + "field": "status",
      + "file": "docs/tasks/T-081-s7-…-mis-specified.md",
      + "message": "… field 'status' must be one of suggested | planned |
        building | verifying | rejected | merging | done | parked, got \"closed\""

    Test Files  1 failed | 41 passed (42)
         Tests  1 failed | 830 passed (831)

**Attributed rather than assumed.** Measured at `ba31a10` with the second
executor's two Rust files checked back out to `ba31a10`, so the tree was
byte-identical to the inherited tip: the same body fails, exit 1. The
red is the verdict's, and it predates any fix commit.

## The mechanism, which is the finding

A verifier's suite figures are measured at the commit UNDER REVIEW, and
then the verifier COMMITS — the verdict, and (correctly, per the role)
any findings it raises. **Those commits are never re-measured by
anybody.** The executor has already stopped; the next reader is the
integrator, at merge time, or a second executor. Nothing between the
verdict and the merge re-runs the suites the verdict quotes.

That is tolerable for a verdict that only adds prose. It is NOT
tolerable in this repo, because **`docs/` is an INPUT to the app
suite**: `architecture-dogfood.test.ts` parses the live tree through
`@nputer/parser`, so a docs-only commit can and did break a code gate.
A verifier writing findings is editing the app suite's fixture corpus
without knowing it.

There is a second, quieter consequence. **The verdict's CONTROL figure
is stale by the same mechanism** — it reports `CONTROL 554` at
`94476b4`, and `fede266` then added two tracked text files, so the
branch tip is **556**. That one is harmless because the arithmetic is
published and closes; the dogfood red is not, because nothing published
would lead a reader to re-derive it.

## Two candidate closes, and they are not alternatives

1. **The cheap one, and it is a real gate rather than advice.**
   `status:` is a closed vocabulary the parser already owns and already
   reports on. Nothing enforces it at the point a finding is WRITTEN,
   and the dogfood body — the thing that does catch it — is in the
   `npm test` suite, which a docs-only edit gives nobody a reason to
   run. The token lint runs over a CONTROL corpus derived from
   `git ls-files` and is CI's first step; a frontmatter-vocabulary check
   belongs beside it, where a docs-only change already gets looked at.
   (Whether it lives there or in the parser is a fence question for
   whoever takes this.)

2. **The role one.** `method/roles/verifier.md` should say that a
   verifier who COMMITS to the branch re-runs whatever gate its own
   commits could move, and that in this repo `docs/**` moves the app
   suite. The same clause covers the CONTROL figure. This is the
   general form: **a role that writes to the tree owes the tree's gates,
   even when what it wrote was prose.**

## What was done here rather than left

`T-081-s7`'s `status:` now reads `suggested` — the value every other
finding on this card carries, one of the two the parser accepts for a
minimal finding file, and the value the T-083 integrator ruled a
DISCHARGED finding should keep, because disposition belongs to triage.
The file's body is otherwise untouched and a note records the edit.
That un-reds the suite; it does not close this finding, which is about
the mechanism.
