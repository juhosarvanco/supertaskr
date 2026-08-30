---
id: T-140-s7
title: Two files T-140-s1 added are unclaimed territory, because C-05 and C-12 name their paths ONE BY ONE and the registry is outside that lane's fence — a D2 the next regen will report, predicted rather than discovered
status: rejected
suggested_by: executor claude-opus-5 @T-140-s1
closed_by: da4d28b
---

Standing triage sitting #3, 2026-08-30 (architect seat): **REJECTED —
DISCHARGED, NOT DECLINED**, and it is the good kind: the card PREDICTED
a D2 before the regen that would report it, and the integrator claimed
both files in that same regen's own commit so the D2 never arrived.
`da4d28b` — *"…the verifier's predicted D2 pre-empted by claiming both
files in the regen's own commit, and eleven dogfood pins re-derived with
their reasons"*.

**VERIFIED AT THIS SITTING'S BASE `@ 51fa31c0964c` RATHER THAN TAKEN ON
THE STAMP'S WORD**, one command, both files:

    command grep -rn 'arch_cmd\|map-rollup' docs/architecture/components/

    C-05-app.md:45   - app/src-tauri/src/arch_cmd.rs   # T-140-s1's rollup/detail commands,
    C-12-map-pane.md:21 - app/test/map-rollup.test.ts  # T-140-s1's suite, claimed with arch_cmd.rs

Both lines carry the one-line reason this card asked for, in the style
of their neighbours, and both went in as ADDITIONS to the existing
enumerations — so the routing question the card left open ("or route
them differently and say why") was answered the way the card's own
C-05/C-12 precedent recommended, with `arch_cmd.rs` staying on the IPC
surface beside `churn.rs`. The three live-registry fixtures moved with
them in the same commit, which is the part the card warned would be the
expensive half.

Recorded here rather than as an absorption because the resolver is the
integration commit that regenerated the graph and no task card exists to
carry an `Absorbs:` line — the case TASK-FORMAT names as forcing this
wording.

**PREDICTED BY THE LANE THAT CAUSES IT, before the regen that reports
it.** `T-140-s1` adds five indexed files. Three land inside an existing
glob and are claimed:

    app/src-tauri/crates/nputer-index/src/rollup.rs  -> C-07  (app/src-tauri/crates/nputer-index/**)
    app/src/lib/architecture/rollup.ts               -> C-12  (app/src/lib/architecture/**)
    app/src/architecture/rollup-source.ts            -> C-12  (app/src/architecture/**)

**Two do not, and neither could be fixed by that lane:**

    app/src-tauri/src/arch_cmd.rs   — C-05's territory
    app/test/map-rollup.test.ts     — C-12's territory

## Why they are unclaimed, and it is not an oversight in either place

`C-05-app.md` names `app/src-tauri/src/*.rs` file by file
(`lib.rs`, `main.rs`, `acl_pin.rs`, `churn.rs`, `index_cmd.rs`) rather
than by glob, and `C-12-map-pane.md` names its `app/test/map-*` files one
by one. **Both spellings are deliberate and both carry their reasons in
their own component files** — C-05's "WHY THE TEST DIRECTORY IS NOT A GLOB
HERE" block records that the `app/test/**` catch-all was removed at T-149
because the glob engine normalises `app/test/**` to a DOMAIN and cannot
express "all of these except those", so a routed file stayed claimed by
both. Nothing here proposes reopening that; the price of the enumeration
is exactly this: **a new file in either directory is unclaimed until
somebody adds a line.**

And `T-140-s1` could not add it. Its fence manifest expands through
`crate-index + app-map + app-shell` to the ~60 paths that EXISTED when the
manifest was written; `docs/architecture/components/**` is in no lane's
fence by construction (declaring is the integrator's, and CONVENTIONS'
DECLARING-A-COMPONENT bullet is why).

## What the next regen will report

A `D2` finding with two files, on a repository whose
`architecture-dogfood.test.ts` currently pins **"THE D2 IS GONE, RETIRED
BY A DECLARATION THAT COST NO EDGE"**. So the checkpoint that regenerates
the graph will see the D2 return, and the dogfood array will move with it.
**That movement is this card, arriving on schedule — not a new defect.**

## What this card would do

Add the two lines, in the same style and with the same one-line reason the
neighbouring entries carry:

    C-05-app.md    - app/src-tauri/src/arch_cmd.rs   # T-140-s1: the map channel's seam
    C-12-map-pane.md  - app/test/map-rollup.test.ts  # T-140-s1: the rollup + pull pins

**Then reconcile the THREE live-registry fixtures**, not two
(CONVENTIONS' DECLARING-A-COMPONENT bullet — `lib/parser/test/smoke.test.ts`,
`app/test/architecture-dogfood.test.ts`, `app/test/map-dogfood-render.test.tsx`),
changed and never loosened. Adding a PATH to an existing component does
not move the id array in the parser fixture, but it does move the file
counts and the D2/D3 rows in the two app fixtures, and the bullet's
warning is about exactly this class of edit.

**Or route them differently and say why** — `arch_cmd.rs` is a channel
serving C-12's pane from C-05's IPC surface, and the C-05/C-12 split for
`churn.rs` (a map data command living in C-05) is the settled precedent
this followed. Whoever disposes of this card should read C-05's "T-010
settlement" block before assuming the obvious answer is the right one.
