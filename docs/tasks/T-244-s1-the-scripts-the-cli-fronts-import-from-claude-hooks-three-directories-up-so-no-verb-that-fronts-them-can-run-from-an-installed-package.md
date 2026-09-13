---
id: T-244-s1
title: "The scripts the CLI fronts import `../../../.claude/hooks/*`, so every verb that fronts one of them dies with ERR_MODULE_NOT_FOUND in an installed package — `npx supertaskr` can front them only from a checkout"
feature: F-01
milestone: 4
size: M
priority: 2
status: planned
suggested_by: "executor claude-opus-5@subagent, in T-244's lane, 2026-09-09 — measured while proving `npx supertaskr` against an npm pack tarball"
blocked_by: [T-314]
touches: [tools/e2e/, .claude/hooks/, cli/README.md, cli/package.json, cli/supertaskr.mjs, cli/lane-fence.mjs, cli/gate-token.mjs, cli/expand-fence.mjs]
builder:
verifier:
built_by:
verified_by:
review: independent
---

Absorbs: T-244-s2 (2026-09-13, the pile-2 sitting; the owner's ruling of 2026-09-13 recorded the absorption and the owner's approval 2 of 2026-09-13 settled the two decisions below). The sibling's file is removed in the same commit as this line; its obligations sit in the criteria below tagged with their source, and its full text is kept under the absorbed heading. This card carried no criteria section until this commit — its obligations sat in the three prose sections kept below as history — so the canonical section is derived from them here, nothing invented. Blocked by T-314, which moves the push guard into `.claude/hooks/pre-push` and edits brief.mjs, both inside this fence.

## Ruled 2026-09-13 — the two decisions the sources reserved, and the bootstrap

- Module ownership (a): the three shared modules the hooks and the command both use — lane-fence, gate-token and expand-fence — become self-contained in the package as `cli/lane-fence.mjs`, `cli/gate-token.mjs` and `cli/expand-fence.mjs`, and the hooks under `.claude/hooks/` import them from there by a checkout-relative path; the hooks are not shipped inside the package. One import is inverted rather than a file duplicated.
- Package root (b): a root of its own, `cli/`, with `name: supertaskr`, its own version line, `files` and a bin at `cli/supertaskr.mjs`; `tools/e2e/` keeps its private package and is not renamed.
- The bootstrap: `cli/README.md` is created in this records commit with the owner-approved text, so that `cli/` is a tracked parent and every other new file above is an exact new-file reservation the lane writes. An npm package carries nothing above its root, so the scripts the command fronts under tools/e2e/scripts/ are reachable from the INSTALLED tarball only by a route the lane designs and the isolated body proves (a pack-time copy into the package, generated and untracked, or an equivalent); IF that route needs a further TRACKED new file THEN the lane names it by an ask before writing it — the fence above is complete for the files the ruling names and no other.
- The fence: `tools/e2e/` and `.claude/hooks/` (tracked directories), `cli/README.md` (tracked by this commit), and the five reservations named above.
- Neither dispatch nor publication is authorized by the ruling; the claim on the registry is the owner's (T-266).

## Acceptance criteria

- WHEN `npx supertaskr` fronts a script that imports the hooks' shared modules three directories up (brief.mjs imports lane-fence.mjs; lane-lock.mjs and checkout-currency.mjs import gate-token.mjs and lane-fence.mjs) THE verb SHALL run from an installed package rather than die with a module-not-found before any argument is read, by the shape ruled above, and this card's fence reaches `.claude/hooks/`, which T-244's did not. (from T-244-s1's finding and its "what a fix would have to decide")
- THE lane SHALL build the ruled shape only — the three shared modules under `cli/`, the hooks importing from there, the package rooted at `cli/` — and SHALL make the scripts the command fronts reachable from the installed tarball by a route the isolated body below proves; the claim on the registry is the owner's (T-266) and nothing here publishes; the registry lookup of 2026-09-09 (`npm view supertaskr version` answered E404, `react` the control) is dated history, not a present-tense claim. (absorbed from T-244-s1 and T-244-s2)
- WHEN the ruled shape lands THE body in cli.spec.ts that packs the package and installs the tarball into a scratch project SHALL run independent of the Supertaskr checkout's files and of undeclared sibling packages — an isolated installation (a temp directory outside the checkout, no `NODE_PATH`, no workspace link) whose installed path and its dependencies are checked, with the control that a dependency missing from the package FAILS rather than resolving from the checkout — and SHALL show `npx supertaskr status --root <the project>` answering rather than refusing, and `packageEscapes` over brief.mjs returning the empty list, with the positive control that it does NOT return empty at the base. (absorbed from T-244-s1)
- WHEN `npm pack` runs in `cli/` THE tarball's package.json SHALL read `"name": "supertaskr"`, carry no `private` flag and its own version line (not the e2e lane's), and the same isolated body SHALL install THAT tarball. (absorbed from T-244-s2)
- THE third-harness property T-244 built and cli.spec.ts measures SHALL be untouched. (absorbed from T-244-s1)
- WHEN the import is inverted THE hooks under `.claude/hooks/` SHALL still run in a fresh checkout with nothing installed and nothing built (the rule their own headers state and T-244-s1's rationale relies on), keeping both their allowed and their refused outcomes without a package installation or a build becoming a prerequisite; covered by the existing hook checks, extended where the changed imports require it. (from T-244-s1's rationale and the shared modules' headers)

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

## Absorbed from T-244-s2 — The CLI ships inside `@supertaskr/e2e` (private) because T-244's fence named `tools/e2e/`, so the package a user would install is the e2e lane's — the name `supertaskr` is free at 2026-09-09 and nothing yet claims it (kept whole)

Title as filed: "The CLI ships inside `@supertaskr/e2e` (private) because T-244's fence named `tools/e2e/`, so the package a user would install is the e2e lane's — the name `supertaskr` is free at 2026-09-09 and nothing yet claims it"

Filed as: status suggested, priority 6, size M, touches [tools/e2e/], suggested_by "executor claude-opus-5@subagent, in T-244's lane, 2026-09-09 — the fence T-244 was dispatched with named tools/e2e/, and the criteria named tools/e2e/bin/ and tools/e2e/scripts/cli.mjs as the creation targets".

### The finding (T-244-s2)

T-244 built `npx supertaskr` inside `tools/e2e/`, because that is where
its fence and its named creation targets put it. The consequence is that
the package carrying the `supertaskr` bin is `@supertaskr/e2e`, whose
`package.json` says `"private": true` and whose description is the
real-input E2E lane. `npm pack` and a local install work — T-244's spec
proves them on every run — but the artefact is honestly the wrong one to
publish: its name is the lane's, its `private` flag is the lane's, and
its version is the lane's.

The name is not the obstacle. Re-derived at this ref: `npm view
supertaskr version` answers `E404 Not Found` (2026-09-09T00:07Z,
Mac.lan), with `npm view react version` answering `19.2.8` at exit 0 as
the control that the query can answer otherwise. **The name is free and
unclaimed.**

### What a fix would decide (T-244-s2)

Where the published package's ROOT lives, which T-244 could not choose:

- a package root of its own (`cli/`, or the repository root) with its own
  `name: supertaskr`, its own version line, `files` and `bin`, importing
  the scripts rather than re-hosting them; or
- keeping `tools/e2e/` as the root and renaming the package, which makes
  the e2e lane and the shipped CLI one artefact — a claim ADR-011's
  three-standalone-packages shape argues against.

Whichever wins, the claim on the registry is @human's (T-266 is the
checklist), and nothing here publishes.

### How to know it is fixed (T-244-s2)

`npm pack` in the chosen root yields a tarball whose `package.json` reads
`"name": "supertaskr"` and carries no `private` flag, and the existing
body in `tools/e2e/tests/cli.spec.ts` installs THAT tarball and runs
`npx supertaskr` against it.

## Implementation notes

## Verdicts
