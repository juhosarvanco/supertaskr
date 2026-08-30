# Checkpoint: T-177 lands — a decorated backbone line is now a NAMED issue, and the verifier found the one thing no gate on this repository could have caught

Date: 2026-08-31. Seat: architect/integrator. Scope: T-177 merge and
close; one assigned correction performed and drilled at the merge; why
that correction is the most interesting thing in this record.

## What landed

`lib/parser/src/roadmap.ts`'s malformed-line reporter now looks past a
leading run of emphasis punctuation and **captures** it, so an
emphasis-wrapped feature bullet becomes a named issue that says which
characters hid the line. Written against the CLASS — `*`, `**`, `***`,
`_`, `__`, `~~` and mixtures — rather than the one spelling the card
quoted.

Measured against @human's real generated project (read-only, never
edited): three declared features that answered **0 matched, 0 reported,
3 silently invisible** now answer **0 matched, 3 NAMED issues** at lines
5, 9 and 13, each carrying its cause and a one-line remedy. That does not
by itself repair @human's board — it turns three silent drops into three
one-edit fixes, which is the honest claim and the one the executor made.

**ARM 2 (tolerate the bold form) DECLINED, with the reason measured
rather than asserted**: the emphasis in the real file wraps the first
SENTENCE, not the bullet, so stripping the leading run leaves a literal
`**` marooned mid-description and stripping every run silently deletes
emphasis the writer meant. Tolerating the shape means CHOOSING a new
grammar that ships to every generated project — arm 3's call on a method
bump, not an S card's from inside a lane. Zero bytes moved under
`method/`.

## THE FINDING THAT MATTERS: a property no gate here could have kept

The blind verifier wrote **55 attacks before opening the diff** (hashed
and timestamped, 48 in classes plus 7 mutants derived from the criteria
with the test file closed). Six survived contact; one became the assigned
correction, and it is worth the whole record:

**Its mutant M5 hoisted the new detector past the section guard** —

    -    if (!inBackbone) continue;
    +    if (!inBackbone && !/^-\s+[*_~]+\s*(?=F-)/.test(line)) continue;

— and **the suite stayed 343/343, exit 0. No body noticed.** The shipped
behaviour was correct (a decorated bullet under `## Parked` yields
nothing, verified directly against @human's real Parked section), but
nothing pinned it, and **no existing gate could have**: an `awk` over
every tracked `*.md` in this repository finds ZERO decorated `F-` bullets
outside a backbone section, so the live-tree smoke test is vacuous
against that mutation BY CONSTRUCTION, not by oversight. A reporter that
fired in every section would turn one silence into a page of badges, and
it would have arrived silently under any future refactor of the scan
loop.

**CORRECTION PERFORMED AND DRILLED AT THE MERGE.** The body the verdict
spelled out is added to `lib/parser/test/roadmap.test.ts` with the
reasoning above at its site. Committed FIRST, then drilled — a restore
cannot tell itself from a revert: under M5 the suite answers **1 failed
/ 343 passed**, and the failing body is the new one BY NAME. Restored
with `git restore --source=<commit> --staged --worktree` and proved by
sha256 against the committed blob: `1937d4320c049253…`, identical.

Two follow-ups the verifier recorded rather than filed, left for triage:
the class stops at the dash anchor (`* F-01:`, `+ F-01:`, `- <b>F-01:`
stay silent), and the issue message echoes the inert-BLANKED line, so a
bullet containing an inline code span reports with that span emptied.

## Gates

- `index --check` — **CURRENT**, regenerated at the merge:
  **1,134,667 of 2,145,959 bytes (52.9%), 1,011,292 left**, 199 files,
  2,419 symbols, 2,331 edges. GRAPH REGEN fires (a `.ts` outside docs/)
  and this time it is real, not a no-op — `lib/parser` is inside the
  walk.
- `npx vitest run` from lib/parser — **344 passed, exit 0** (343 + the
  correction's own body)
- `npx tsc --noEmit` / `npm run build` from lib/parser — **0 / 0**
- `npm run build` / `npm test` from app/ — **0** / **1059 passed, 49
  files, exit 0**. The app consumes this parser through
  `file:../lib/parser`, so this is the gate that matters most for a
  parser change and the executor correctly said it could not run it from
  inside its fence; the verifier ran it, and so did this seat.
- `npm test` from tools/e2e — **335 passed, exit 0** (3.6m)
- `lint:tokens` / `lint:docs` / `capabilities:check` — **0** /
  **0** / **0 CURRENT** (26,693 bytes — this diff moves no e2e spec, so the census does not move)
- `npm run health` — **exit 3, by design** — `14 bands — 7 inside, 0 drifting, 0 BREACHED, 3 unread, 4 UNKEPT`
- **BOOT GATE — not owed**: no `app/src/**`, `app/src-tauri/**` or
  manifest path in this merge's diff.
- **METHOD EVAL GATE — not owed**: zero bytes under `method/`.

## Board

`T-177` done, `verified_by: claude-opus-5@subagent`, `review:
same-model`. Both its worktrees removed — the lane's and the verifier's
scratch bench, which it deliberately did NOT share with the executor's
on the grounds that reusing the builder's bench weakens the independence
the seat exists for. That is the right instinct and is recorded so it
becomes practice.

`T-172` is APPROVED and awaiting this seat's merge — 34 attacks, zero
defects, six mutants all killed including one the executor never tried.

## Owed after this record

- **`T-172`'s merge owes a graph regen**: its verifier asked the graph
  rather than regenerating and reported the answer — `files +0 -0 ~7`,
  symbols 2067→2066, and the regen SHRINKS the graph by 504 bytes. A
  lane that hands headroom back.
- The two follow-ups above want a triage disposition.
- **@human's desk is untouched**, as asked overnight.
