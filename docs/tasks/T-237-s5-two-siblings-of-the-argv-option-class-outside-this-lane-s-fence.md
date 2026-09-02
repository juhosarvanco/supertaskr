---
id: T-237-s5
title: Two siblings of T-237's argv-option class sit outside its fence — a card-authored `base:` reaches `git rev-parse` as a bare revision, and an argv array is not what stops a leading dash
feature: F-06
milestone: 4
priority: 3
size: S
status: suggested
suggested_by: executor claude-opus-5@subagent @T-237
blocked_by: []
touches: [tools/e2e/scripts/card-preflight.mjs, tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/card-preflight.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

**THE CLASS, NAMED BY THE FIX THAT FOUND IT.** T-237's security sweep
found one hole in its own diff and closed it: a value taken from an
external program's output and handed to a SECOND program as a positional
argument that program may read as an OPTION. `gh` reported a run's
`headSha`; `push-guard.mjs` passed it to `git diff` as a revision; a
`headSha` of `--output=<path>` would have been a flag, and **the argv
array does nothing to prevent that** — there is no shell involved and
never was, so quoting is not the mechanism. The repair was a shape check
plus a trailing `--`.

**A FIX NAMES ITS CLASS AND ITS SWEEP** (docs/CONVENTIONS.md), so the
sweep was run and is recorded here even though its findings are milder
than the original:

    git grep -nE 'spawnSync\("(git|cargo|gh)"' -- .claude tools/e2e/scripts

Twelve sites. Ten pass only values the calling file itself constructed.
**Two interpolate a revision that came from outside**, and both are
outside T-237's fence, which is why they are a card and not an edit:

* `tools/e2e/scripts/card-preflight.mjs`'s `refResolves(root, hash)` —
  `hash` reaches `git rev-parse --verify --quiet ${hash}^{commit}`, and
  it originates in a CARD's frontmatter, which is text a seat wrote.
* `tools/e2e/scripts/dispatch-brief.mjs`'s `resolveIntegrationRef` —
  same spelling, though its `rev` comes from an internal candidate list
  and its OUTPUT is already re-validated against `/^[0-9a-f]{40}$/`.

**THE SEVERITY IS LOWER AND SAYING SO IS PART OF THE FINDING.**
`git rev-parse` publishes no write-capable option, so a dash-leading
value there buys a wrong BOOLEAN — `refResolves` answering `false` for a
reason that is not "this ref does not resolve" — rather than a file
written somewhere the caller did not choose. That is a false negative in
a preflight, not an escape. It is filed because the CLASS is the finding:
the next site added to this family may call a subcommand that does have
one, and the discipline is cheapest to install while the class is still
named.

**A SCHEDULING FACT, RECORDED BECAUSE IT WAS TRUE AT FILING RATHER THAN
AS A `blocked_by`.** Both files this card touches were held by LIVE lanes
when it was written — `card-preflight.mjs` by T-230-s3 and
`dispatch-brief.mjs` by T-225 — so its fence overlaps theirs. That is the
orchestrator's own parallelisation rule to apply at dispatch, not a
dependency between the cards, and the lane list is derived rather than
quoted (docs/STATE.md, LANES). Re-derive before cutting.

## Acceptance criteria

- WHERE a value that did not originate in the calling file is passed to
  `git` as a revision THE caller SHALL shape-check it before the spawn,
  and the refusal SHALL name the value rather than reporting it as an
  unresolved ref.
- THE sweep above SHALL be re-run at the ref of the fix and its result
  recorded, including any site added since this card was filed — and the
  query SHALL be shown able to find something before its zero is
  written down (docs/CONVENTIONS.md, the POISON DRILL's proof clause).
- A body SHALL drive a dash-leading `base:` through `refResolves` and
  require the refusal to be distinguishable from an ordinary
  unresolvable ref.
- Verification: headless.
