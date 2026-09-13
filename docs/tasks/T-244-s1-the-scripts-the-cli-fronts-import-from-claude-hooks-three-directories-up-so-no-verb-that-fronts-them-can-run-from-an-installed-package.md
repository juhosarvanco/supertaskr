---
id: T-244-s1
title: "The scripts the CLI fronts import `../../../.claude/hooks/*`, so every verb that fronts one of them dies with ERR_MODULE_NOT_FOUND in an installed package — `npx supertaskr` can front them only from a checkout"
feature: F-01
milestone: 4
size: M
priority: 2
status: planned
suggested_by: "executor claude-opus-5@subagent, in T-244's lane, 2026-09-09 — measured while proving `npx supertaskr` against an npm pack tarball"
blocked_by: []
touches: [tools/e2e/]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## The finding

`npx supertaskr status` was run against a tarball produced by `npm pack`
and installed into a scratch project that is not this repository. It did
not print a refusal; it printed a stack trace:

    Cannot find module '<project>/node_modules/.claude/hooks/lane-fence.mjs'

`tools/e2e/scripts/brief.mjs` imports `../../../.claude/hooks/lane-fence.mjs`
and `lane-lock.mjs` imports `../../../.claude/hooks/gate-token.mjs`. Three
directories up from `tools/e2e/scripts/` is this repository's root inside a
CHECKOUT and is `node_modules/` inside an installed copy, where nothing of
the sort exists. The import is at module scope, so the failure happens
before any argument is read: no verb that fronts one of those scripts can
run from an installed package at all.

T-244 closed the SYMPTOM rather than the cause. `cli.mjs`'s
`packageEscapes` derives the relative imports that leave the package,
checks them against the filesystem, and refuses with the house's CANNOT
RUN (3) naming the absent files — so a user gets a sentence instead of a
stack trace. What it cannot do from inside T-244's fence is make the
scripts reachable.

## What a fix would have to decide

Two shapes, and the choice is an architecture question rather than a
lane's:

1. **Ship the hooks inside the package** — add `.claude/hooks/` to the
   package's `files` and resolve them package-relative. Cheap, and it
   makes `.claude/hooks/` part of a published surface, which is a claim
   about who owns those files.
2. **Make the shared modules self-contained** — move what
   `lane-fence.mjs`, `gate-token.mjs` and `expand-fence.mjs` export into
   the package and have the hooks import from there. This is the
   direction the dependency budget already argues for
   (`.claude/hooks/` runs with nothing installed), and it inverts one
   import rather than duplicating a file.

Either way the fence has to reach `.claude/hooks/`, which T-244's did
not — which is why this is a card and not a fix.

## How to know it is fixed

`tools/e2e/tests/cli.spec.ts` already installs a packed tarball into a
scratch project and runs `npx supertaskr` there. Extend that body: after
the install, `npx supertaskr status --root <the project>` answers rather
than refusing, and `packageEscapes` over `brief.mjs` returns the empty
list — the positive control being that it does NOT return empty today.

Promoted 2026-09-13 (the pruning sitting (T-306), the owner's ruling of 2026-09-13): to planned at priority 2 — every CLI verb that fronts a hook dies with a module-not-found in an installed package; absorbs T-244-s2's packaging half. Not dispatched by this sitting.
