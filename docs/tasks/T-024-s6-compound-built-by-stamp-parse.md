---
title: Compound built_by stamps parse to a junk model and a wrong policy — multi-session builds need a grammar
status: suggested
suggested_by: verifier claude-opus-5 @T-024
---

T-024 is the project's first cross-model, multi-session build, so it is
the first task whose `built_by` names more than one model:

    built_by: claude-fable-5 @fresh (WIP through ad2716f) + claude-opus-5 @fresh ×2 (completion + rejection-fix sessions)

`parseModelSession` (`lib/parser/src/model-session.ts:18`) splits at the
**last** `@` and treats everything before it as the model name. Run
against the live stamp it returns:

    model   = "claude-fable-5 @fresh (WIP through ad2716f) + claude-opus-5"
    session = "fresh ×2 (completion + rejection-fix sessions)"
    policy  = "resume"

Two things are wrong, and only one of them is cosmetic.

**`policy: "resume"` is false.** Both sessions were `@fresh`. The flag
comes from `session === 'fresh'` (`model-session.ts:30`) — an exact
string match that any annotation defeats. The stamp says the opposite
of what happened, in the one field that encodes the fresh-vs-resume
provenance distinction. Nothing consumes `policy` today (zero readers
outside `model-session.ts`), so this is latent rather than visible —
which is exactly why it will be believed later.

**The `model` string is not a model name, and it renders.** Board and
map both switch from `builder` to `built_by` the moment a task is
done/merging (`board-model.ts:165-167`, `MapPanel.tsx:392-397`) — i.e.
at the integrator's stamp, not before. `shortModelName` then yields a
**50-character** badge:

    "fable-5 @fresh (WIP through ad2716f) + claude-opus"

rendered in a `font-mono text-xs` chip that carries no `truncate` and
no `max-w` (`ModelBadge.tsx:12`), and again in the map panel's task row
through the deliberate local twin `modelWord` (`MapPanel.tsx:361,426`),
where the chip is `shrink-0` and will push the row. The detail panel's
provenance row is the one honest surface — it prints `builtBy.raw`
verbatim (`TaskDetailPanel.tsx:279`), which is what the compound stamp
is actually good at. So T-024's card will look broken on the board the
day it merges, while the panel behind it reads correctly.

Nothing catches this: `modelField` (`task.ts:250`) rejects only an
empty model or an empty session, so the live-tree smoke gate's
`expect(result.issues).toEqual([])` passes on a stamp that parses to
nonsense.

**Not a regression, and not T-024's to fix.** The condition arrived
with the completion session's stamp in `09f772d`; the rejection-fix
session's `×2` edit is parse-shape-neutral — the pre-existing and
current stamps produce byte-identical `model`, `policy` and badge
(verified). The honesty of naming both builders is right and should be
kept. What is missing is a *form* for saying it.

Options, for an architect ruling rather than a drive-by fix:

1. **A stamp grammar for multi-session builds.** Define `built_by` as a
   delimited sequence of `model @session` entries (the narrative moving
   to the implementation notes, where T-024 already tells the story
   properly), and teach the parser to return a list. Most truthful,
   widest blast radius: `ModelSession` becomes `ModelSession[]` for this
   field and both badge sites choose a representative (last writer, or
   the count).
2. **A parser change alone.** Either tighten `parseModelSession` to
   raise a validation issue when the model half contains whitespace,
   `@` or `+` — which makes the live smoke gate fail loudly on the next
   compound stamp instead of accepting it — or relax `policy` to a
   prefix/word match so annotations stop flipping it to `resume`. The
   first is a gate, the second is a correctness patch; they are
   complementary, not alternatives.
3. **Accept and record.** Rule the compound stamp legitimate prose,
   keep `built_by` free-form, and fix only the surfaces: bound the two
   badges (the `truncate`/`min-w-0` answer T-017 established, and the
   same unbounded-text family as T-024-s4), and prefer `builder` when
   `built_by`'s model half is not a single clean token.

Whichever wins, it should land with T-019's parser-model-hygiene lane
(the owner of `ModelSession`) rather than in a feature branch, and it
wants a fixture pinning a compound stamp so the next cross-model build
does not rediscover this. Cross-model builds started this week; every
future one carries a stamp of this shape.
