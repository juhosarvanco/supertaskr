# Checkpoint: T-140-s4 lands — the graph leaves the docs collector, the budget is a derived 2,145,959, and the 410-byte hold on the code queue is over

Date: 2026-08-31. Seat: architect/integrator. Scope: T-140-s4 merge and
close; two verdict corrections performed and **one declined with
evidence**; the graph regenerated at the integration; the boot and
health gates this seat had been skipping, run.

## What @human's ruling actually bought

**Headroom went from 410 bytes to 1,011,549.** Read at the integration
ref with `cargo run -p nputer-index -- index --check --root ../..`:

    graph.json is CURRENT (1134410 bytes, 199 files, 2418 symbols, 2331 edges)
    budget: 1134410 of 2145959 bytes (52.9%) - 1011549 left

The four files that were truncating get their symbols back: **2,067 →
2,418 symbols**, and `docs_watch.rs` returns from 0. The alarm is silent
because there is nothing to alarm about, and `truncated_files` is back to
zero.

**THE SEQUENCING FINDING WAS THE WHOLE OF IT.** Raising the budget alone
would have bought 8,575 bytes — about ten files — and spent the gap that
keeps DEGRADATION (symbols thin out) in front of the CLIFF (the pane
receives no graph at all). That is exactly what `T-151` was rejected for
on 2026-08-30. Removing `graph.json` from the docs collector dissolves
the coupling rather than overruling that rejection, which is why the two
were one lane in one order.

## The number, and why it is not round

    natural untruncated size   1,134,406   budget set to 100,000,000, index --check ASKED
    first graph.json blob        122,853   head of the git log --reverse size series
    lifetime growth            1,011,553   1,134,406 - 122,853
    THE BUDGET                 2,145,959   natural + lifetime

In one sentence: **the budget binds again when the graph has grown by
everything it has grown since it first existed.** One measured quantity,
no free coefficient, and deliberately not rounded to 2 MiB — a round
number would be a picked number.

`check::WARN_HEADROOM_BYTES` re-armed 14,914 → **13,921**, with two
things now written at its site that were not there before: the last seven
growths were measured under a BINDING budget, so the mean is biased
downward — the safe direction, it fires early — and the constant no
longer sits under a second limit.

## The verdict: APPROVED WITH ASSIGNED CORRECTIONS

**54 attacks written blind from the contract before the diff was opened**,
51 found the work sound, 3 landed. The verifier ran every gate itself
rather than accepting reported numbers, and **it ran the boot gate the
executor could not** — port 14144, lsof'd to zero rows either side, both
`[nputer]` lines observed, exit 0.

Its mutant ledger: 5 killed, 2 survivors **explained rather than
excused** — a round-number budget survives because no test restates the
literal (correct doctrine), and the re-armed alarm constant survives
because its assertions are relative.

**Correction 1 — PERFORMED.** The budget's *"two independent framings
agree to within 7%"* justification is an algebraic near-identity:
`L / (P/68) = 68 × (L/P)`, so 68 is a factor of the left-hand side and
the comparison cannot disconfirm. **The number never rested on that
sentence**; the sentence is replaced by the algebra, and the alarm-unit
figure survives relabelled as a restatement in a second unit.

**Correction 2 — PERFORMED, and not as a new literal.** The card and
`lib.rs` both carried `1_134_409` / "three bytes" with no ref, and the
tip already disagreed. The card now states it ref-bound; `lib.rs` stops
transcribing a figure at all and names `index --check` as the authority.
That is the stronger fix and the one this project's doctrine asks for.

**Correction 3 — DECLINED, with a `git log` as the evidence.** The
finding read that `T-167-s6` was *"filed `status: planned` by an
executor, which TASK-FORMAT reserves to the architect"*. It was not:
`0815bb9` filed it as a suggestion, **`202904a` promoted it — standing
triage sitting #3, the architect seat** — and this lane only appended a
corroboration. The two cards it was compared against read `suggested`
because they are new and untriaged. **A declined correction is recorded,
never silently dropped**; the verifier's other 53 attacks are undiminished
by it.

## What the executor found that nobody asked for

- **A constant that would have started printing a FALSE sentence.**
  `COLLECTOR_CAP_BYTES` was a transcribed copy of the collector's cap;
  once the budget passed 1 MiB it would have printed *"· over the
  snapshot cap"* on every index of this repository. Worse than dead
  code — a wrong sentence on screen.
- **`graphSkip` became a `find` over a list that cannot contain its
  needle**, because the eligibility gate runs before the size gate.
- **Two of its own drills came back GREEN, and it said so.** Lifting the
  symlink guard — then lifting the canonical-prefix check as well —
  leaves both symlink bodies passing, because a third containment layer
  holds them up. Neither test can detect the loss of the guard it is
  named after. Pre-existing, routed as `T-140-s9`.
- **It could not commit the graph it regenerated** — outside its fence by
  design — so it left the branch carrying new pins and an old graph and
  said exactly that. The integrator regenerated at the merge; that is the
  standing division of labour and `T-140-s8` asks whether it should be.

## Gates at the integration

- `npx vitest run` from lib/parser — **336 passed, exit 0**
- `npm run build` from app/ — **exit 0**
- `npm test` from app/ — **1059 passed, 49 files, exit 0**
- `cargo test` from app/src-tauri — **250 passed, 1 FAILED, exit 101 —
  ATTRIBUTED, NOT ABSORBED.** The failure is
  `docs_watch::tests::startup_arm_watches_the_initial_root` and the lib
  suite's own runtime was **16.21s**, above `T-088-s4`'s documented red
  threshold of 14.6s. That hazard's own diagnostic was followed rather
  than a `cargo clean` reached for: **re-run alone the same body passes
  in 1.27s, exit 0**. Two lanes were building and this seat had just run
  a full cargo build — the contention condition the hazard describes. No
  `cargo clean`, per the hazard's instruction that lanes may be building.
- `npm run lint:tokens` / `npm run lint:docs` from tools/e2e — **0 / 0**
- `index --check` — **CURRENT**, figures above, asked again after the
  correction edits (which touched an indexed file and moved nothing,
  being comments)
- **BOOT GATE — RUN AND PASSED, exit 0.** Port 14145, derived from the
  card id, lsof-read to ZERO ROWS before binding and after. Both lines
  observed: `[nputer] project folder: /Users/ujju/Projects/nputer` and
  `[nputer] window "main" created`; process tree stopped on SIGTERM with
  no orphan. **1420 was read with `lsof` and nothing else and answered
  ZERO ROWS** — @human's app is down, which is a live-environment fact
  and not a licence: the read is still the only permitted question.
- **HEALTH BANDS — exit 3, the DESIGNED answer, and it caught this
  seat.** `14 bands — 6 inside, 0 drifting, 1 BREACHED, 3 unread, 4
  UNKEPT`. Exit 3 because three bands could not be read, and 3 outranks
  a breach: a partial run is not a claim about the tree. **The BREACH is
  `docs-headroom/docs/STATE.md`, and it is this seat's own** — STATE was
  over its warn line twice tonight and this seat deferred trimming it
  both times. Repaired in this same commit by moving content into this
  record, which is the contract's own remedy (`a hazard is never deleted
  to fit`). The 4 UNKEPT bands remain `T-156-s1`/`s2`'s and are named on
  every run.

## The seat's own correction, recorded because it is a practice failure

**This seat had run neither the boot gate nor the health bands at any
checkpoint tonight**, across four records. The boot gate FIRES on this
merge by its own trigger (`app/src-tauri/**` and `app/src/**`), and the
health bands are owed at EVERY checkpoint by `T-156` — including the
`Cold start:` and `Drift incidents:` markers, which the method assigns to
the session every time precisely because a denominator that collects
only successes is worse than no band. Both are run here and both are
added to this seat's standing checkpoint sequence. The earlier records
stand as written; this is the correction, not a rewrite of them.

## Board

`T-140-s4` done, `verified_by: claude-opus-5@subagent`, `review:
independent` honoured — executor, blind verifier and integrator all
distinct seats. Worktree removed BEFORE the corrections, per the guard's
limit 6. New on the board from the lane: **`T-140-s8`** (a card that
moves the emit budget cannot commit the graph its own change
regenerates) and **`T-140-s9`** (the triple-guarded symlink refusal that
no test can poison). `T-167-s6` gained a corroboration: the health band
still carries T-139's 15,751 while the crate now says 13,921, and its
drift arm may have stopped discriminating.

## In flight at this record

Three lanes: `T-112-s3` (building), `T-172` (building), and **`T-177`
(BUILT and green — 343 parser tests, 7-for-7 drill, arm 2 declined with
a measured reason)**, awaiting this seat's integrator pass.

## Owed after this record

- **@human, and untouched by this seat overnight**: the FORM question,
  REOPENED 2026-08-31 (the ruled asymmetric answer leaves every authoring
  act a file edit, and @human wants customization without opening files);
  the STEERING SPLIT; and the three permission questions that want a
  watched genesis run rather than an opinion.
- **The queue is UNBLOCKED**: with 1,011,549 bytes of headroom, every
  promotion whose fence reaches indexed source is dispatchable again.
