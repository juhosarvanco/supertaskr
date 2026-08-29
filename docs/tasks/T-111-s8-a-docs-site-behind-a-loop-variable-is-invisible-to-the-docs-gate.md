---
id: T-111-s8
title: A docs site behind a loop variable is invisible to the DOCS GATE's scanner — the same read, written two ways, is a derived reader one way and an unargued root anchor the other
status: parked
suggested_by: executor claude-opus-5 @T-111
touches: [tools/e2e]
---

Absorbs: T-091-s2 (Amnesty triage 2026-08-29 (triage seat)) — the same scanner blind spot stated first and from the other direction — only the zero-argument spelling is seen, so a reader that passes the repository root as a variable is invisible. This card is the survivor because it carries the measured cost: four bodies red in docs-input-gate.spec.ts and the hand-run gate exiting 1 on a CODE-ONLY path list, which is the one thing three of those bodies exist to forbid.

**MEASURED IN THIS LANE, BY WALKING INTO IT.** Two spellings of the same
read, in the same file, on the same tree, at `59fb69a` and `88d4b7a`.

    // INVISIBLE to docs-scan.mjs
    for (const dir of ["docs/tasks", "docs/architecture/components"]) {
      for (const name of readdirSync(join(REPO_ROOT, dir))) {
        files.push({ path: dir + "/" + name, content: readRepo(dir + "/" + name) });
      }
    }

    // DERIVED by docs-scan.mjs
    for (const name of readdirSync(join(REPO_ROOT, "docs/tasks"))) {
      files.push({ path: `docs/tasks/${name}`, content: readRepo(`docs/tasks/${name}`) });
    }

The first form reads exactly the same files. The literals
`"docs/tasks"` and `"docs/architecture/components"` are right there in the
source. **The scanner cannot resolve them because they reach the join
through a loop variable**, so `siteDocsPrefix` produces nothing and the
file lands in `rootAnchoredFiles()` as `unclassified` rather than
`derived`.

## What that cost, exactly

`app/test/select-board.test.ts` holds the repository root, reads three
paths under `docs/`, and was reported as forming NO docs path the scan
could link. It therefore entered `unaccountedRootAnchors()` — the residual
`ROOT_ANCHOR_LEDGER` exists to argue file by file — and:

- `tools/e2e/tests/docs-input-gate.spec.ts` went **4 failed / 38 passed**;
- **the hand-run gate exited 1 on a CODE-ONLY path list**
  (`node tools/e2e/scripts/docs-gate.mjs app/src/main.tsx`), which three of
  those four bodies exist to forbid: *"0 is still reachable, or the gate is
  just a red light."*

Rewritten in the second form: **exit 0, 15 derived readers across 4
suites** (up from 14 — this suite is a real reader and the gate now says
so), root-anchor account back to **6**, spec **42/42**.

## Why the ledger was NOT the right repair, and why this is still a finding

The obvious fix is a `ROOT_ANCHOR_LEDGER` entry saying *"reads docs/ and
the scanner cannot see it"*. **That would have been a lie by placement**:
the ledger's own header says it records files that hold the root and form
no linkable docs path, most of which *"do not read docs/"*. Arguing a real
reader into a list of non-readers converts a scanner gap into a permanent
exception — and the ledger is in `tools/e2e`, outside T-111's fence, so
the lane could not have written it anyway.

**The right repair was to write the read in the shape that is true**, and
it is what landed. But the gap remains for the next file:

1. **THE FAILURE DIRECTION IS THE UNSAFE ONE.** A read the scanner cannot
   see is a suite the gate does not name, so a `docs/` edit ships without
   the suite that reads it being run. That is the failure the DOCS GATE
   exists to prevent, arriving through the gate's own blind spot.
2. **IT FAILS LOUDLY HERE ONLY BY LUCK.** It made a noise because the file
   also held the root, which put it in the root-anchor account. **A file
   that reads docs/ through a loop variable and does NOT hold the root
   makes no noise at all** — no ledger, no residual, no red.
3. **The near-identical file next door does it right by accident.**
   `architecture-dogfood.test.ts` uses the literal form, so the class has
   never fired before.

## Three arms

1. **Resolve a single-assignment loop variable over an array of string
   literals.** Narrow, mechanical, and covers this exact shape. It is the
   one that would have caught this file.
2. **Report the shape instead of resolving it.** A file holding the root
   whose source contains a docs-shaped literal that produced NO linkable
   site is a distinct, reportable kind — louder than `unclassified` and
   cheaper than resolving. It generalises past loop variables to every
   indirection the scanner will meet later.
3. **Say it in the scanner's header.** `docs-scan.mjs` already carries
   seven numbered properties about what the scan does and does not claim;
   an eighth naming the literal-at-the-join requirement costs a paragraph
   and tells the next author which spelling to use.

**Arms 2 and 3 together are the recommendation.** Arm 1 alone buys one
shape and leaves the class; arm 2 is the tripwire `unlinkedSites()` already
is for the package-relative class, applied to this one.

Fence `[tools/e2e]`. Read beside `T-085`, whose retraction is the other
half of the same residual.

Amnesty triage 2026-08-29 (triage seat): PARKED — the INSTANCE is discharged — T-111's lane rewrote the read in the visible form and the gate went to exit 0 with the reader count rising by one, because that suite is a real reader and the gate now says so. The SCANNER GAP is untouched: the same read, written two ways, is a derived reader one way and an unargued root anchor the other, and the literals are right there in the source. The card's refusal of the obvious repair is the part worth keeping — a ROOT_ANCHOR_LEDGER entry would have been a lie by placement, arguing a real reader into a list of non-readers and converting a scanner gap into a permanent exception. RESURFACES: the next tools/e2e dispatch. T-139-s4 names a third axis of the same census (a reader attributed to the suite that owns its DIRECTORY rather than to one that runs it) and should be read with it.
