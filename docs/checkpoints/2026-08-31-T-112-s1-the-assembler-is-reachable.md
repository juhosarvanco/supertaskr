# Checkpoint: T-112-s1 lands — the app can finally reach the assembler it has contained since T-112, and two mutants that survived a blind verifier are now dead

Date: 2026-08-31. Seat: architect/integrator. Scope: T-112-s1 merge and
close; three assigned corrections performed and both surviving mutants
drilled dead; a STATE line this seat had been repeating, corrected by
the lane that disproved it.

## What landed

`dispatch_brief` is the eighteenth `#[tauri::command]`. The assembler
was built, proved and compiled into the binary at T-112 — twenty-eight
bodies under `cargo test` — and reachable from nothing but the test
harness, because registration lives in `lib.rs`, which T-112's fence did
not carry. That was the whole of this card and it is closed.

**No path crosses the boundary in either direction** (ADR-012): the
project root comes from `WatchState` the way `dispatch_lanes` and
`index_repo` take it, `task_id` is a KEY into a directory listing the
command has just taken rather than something joined onto a path, and
`role` is a closed enum so serde refuses a third spelling before a file
is opened. `acl_pin.rs` is a 0-file diff at the same 92-grant set,
re-derived at the lane's own ref.

## THE VERDICT: APPROVED WITH ASSIGNED CORRECTIONS — and two of them are the same lesson

**22 attacks and 6 mutants, written blind before the diff was opened; 2
survived contact.** Both survivors were things that were CORRECT and
that nothing could have noticed breaking — the shape this night has now
produced four times, by four different seats.

**Correction 1 — a bound nothing could poison.** The task-id length
guard sat inside the async command, which takes a `tauri::AppHandle` and
therefore cannot be driven by a unit test. The verifier's mutant turned
it into `if false` and **the entire cargo suite stayed green.** Moved
onto the seam (`dispatch_brief_at`), ahead of the project read so the
behaviour an over-long id already had is preserved, with a body that
asserts the refusal does NOT echo the id back and a positive control one
byte inside the bound. **Drilled at the merge: `if false` now fails that
body BY NAME, exit 101; restoration sha256-identical.**

**Correction 2 — a pin that read a tag instead of a field.** The wire
keeper asserted the variant tag and `assembledFrom` but neither
`roleFile` nor `cardPath`, the two fields `renderBrief` puts in the
copied brief's header. That is the same `rename_all_fields` gap the
executor had just found and fixed for `taskId` — **the pin that caught
one instance could not have caught the next two.** Both halves added
(camelCase present, snake_case absent). **Drilled: forcing `role_file`
snake_case on the wire now fails the keeper by name, exit 101;
restoration sha256-identical.**

**Correction 3** — an off-by-one in a comment over a fourteen-item list.

## The executor's own find, before any verifier arrived

`BriefOutcome` carried `rename_all` but not `rename_all_fields`, so
`NoSuchCard` emitted **`task_id`** while the TypeScript mirror declared
**`taskId`** — disagreeing since T-112 with nothing red, because the
wire pin asserted the variant tag and never a field. It fixed the
**class** (all four enums in `brief.rs`), swept for siblings — six
tagged declarations lack the attribute, exactly one carries a multi-word
inline field — and strengthened the pin. That is a defect found by
building next to it, not by looking for it.

## Criterion 3 is UNMET, ROUTED, and the routing was judged CORRECT

The card asked for `Board.tsx`'s `dispatch` and `brief` props to be
filled from the store. `App.tsx` is a 0-line diff, so it is unmet as
written — **and the fence excuse was not available and was not taken.**
The lane held `app-shell` and `app-dispatch`, could reach the files, and
deliberately did not, for two reasons it stated and the verifier
re-derived independently:

- `dispatch` needs a `DispatchReading`, which needs the join's
  classification; **`T-126-s2` is PARKED pending a ruling** and its
  three shapes are all refused. The lane corroborated that card rather
  than filing a duplicate — the verifier confirmed its edit there is a
  pure append, zero removed lines.
- even with the join, the shell cannot fill `brief`, because the
  open-card ref is `Board.tsx`'s own `useState` and `App.tsx` never
  learns it. **Filed as `T-112-s5`.**

The verifier checked the one alternative the lane did not take — a
constant `unavailable` reading — and found it refused by
`TaskDetailPanel`'s own pre-existing rationale. Routing accepted.

## A STATE LINE THIS SEAT HAD BEEN REPEATING IS FALSE, AND THE LANE DISPROVED IT

`docs/STATE.md` has said, in this seat's own words, *"`T-112-s1`
(registration — until it lands the drawer's brief block never
renders)"*. **It renders when a `DispatchReading` exists, and that is
`T-126-s2`'s, not this card's.** Registration was necessary and is not
sufficient. Corrected in STATE at this checkpoint, and named here
because the seat had relayed it three times.

## Gates

- `index --check` — **CURRENT**, regenerated at the merge: **1,136,484
  of 2,145,959 (53.0%), 1,009,475 left**, 199 files, 2,425 symbols,
  2,333 edges. `arch drift` unchanged at 2 undeclared / 0 unmapped — no
  new component edge, so the relation table did not move.
- `cargo test` — **256 passed, exit 0**, lib suite **8.03s** (inside
  `T-088-s4`'s green line)
- `npx vitest run` from lib/parser — **344 passed, exit 0**
- `npm run build` / `npm test` from app/ — **0** / **1062 passed, 49
  files, exit 0**
- `npm test` from tools/e2e — **335 passed, exit 0**
- `lint:tokens` / `lint:docs` / `capabilities:check` — **0 / 0 / 0
  CURRENT**
- **BOOT GATE — OWED AND RUN, exit 0**, port 17301 derived, lsof-read to
  zero rows before binding, both `[nputer]` lines observed. 1420 read
  with `lsof` only: zero rows.
- **HEALTH — 14 bands: 10 inside, 0 drifting, 0 BREACHED, 0 unread, 4
  UNKEPT**, exit 3 by design.

## THE HEALTH BANDS CONFIRMED T-182 BY CONSTRUCTION

Both drifts from the previous checkpoint are gone, and one of them
proves the diagnosis rather than merely improving:
`triage/net-arrivals-per-window` read 10 against a drift line of 9 all
night because its window anchors on the newest `Checkpoint:` commit and
this seat had written six records without that prefix. **The previous
checkpoint's commit carried it — and the band is inside at this one.**
The window advanced because the marker returned. `T-182` is filed and
now has its mechanism demonstrated, not just argued.

## Board

`T-112-s1` done, `verified_by: claude-opus-5@subagent`, `review:
independent`. Its lane worktree and BOTH benches removed — the
executor's and the verifier's, which the verifier deliberately did not
share on the ground that a bench carries build artefacts and a green
measured there could be someone else's leftovers.

**Six lanes landed tonight**: `T-140-s4`, `T-112-s3`, `T-177`, `T-172`,
`T-153-s8`, `T-112-s1`. New on the board from this lane: **`T-112-s5`**.
`T-126-s2` gained a corroboration and its un-park condition has fired.

In flight: `T-171` (blind verifier out — it found the interview's
liveness was three flags, none of them a fact about a turn) and `T-178`
(executor, the fixture teardown).

## Owed after this record

- **`T-126-s2`'s un-park condition has FIRED** and it wants a ruling
  before a fence — it is what stands between the registered command and
  a rendered brief.
- `T-112-s5` and the routed items want dispositions at the next sitting.
- **@human's desk, untouched overnight as asked.**
