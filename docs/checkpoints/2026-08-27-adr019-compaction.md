# Checkpoint record: the ADR-019 compaction run (2026-08-27, direct execution)

Not a merge integration: phases 2–7 of docs/rooms/governing-docs.md,
executed directly on main at @human's explicit override (recorded in
the room), one commit per phase, self-verified. This record is the
INSTANCE archive of that run; the mechanisms live in the governing
documents and the protocol.

## The commits

    43560f5  Phase 2 — docs/CAPABILITIES.md generated (233 = runner's count)
    08aef1c  Phase 3 — STATE 69,837 -> 6,772 under a budget gate
    b17ecb6  Phase 4 — ROADMAP 81,470 -> 8,399
    a6491e6  Phase 5 — CONVENTIONS 99,212 -> 86,373, T-127-s5 discharged
    925a814  Phase 6 — ARCHITECTURE 133,682 -> 8,525
    06c35a9  Phase 7 — method/docs-protocol.md, bump 0.1.6 -> 0.1.7

Archive refs, recorded per ADR-019 §Scope: the pre-compaction ROADMAP
is `git show 08aef1c:docs/ROADMAP.md`, ARCHITECTURE is
`git show a6491e6:docs/ARCHITECTURE.md`, CONVENTIONS' cut narrative is
in `a6491e6^..a6491e6`, and STATE verbatim is this directory's
2026-08-27-backfill-STATE.md.

## The set, before and after

    four documents at the room's opening   382,136 bytes  (~153k tokens)
    four documents after phase 6           110,069 bytes  — a 71% cut
    plus generated docs/CAPABILITIES.md     18,133 bytes
    read-first set now                     128,202 bytes  (~51k tokens)

CONVENTIONS landed at 86,373 against its 48 KB target for a measured
reason: ~59 KB of it is spec-kept (Build & test via workflow-parity,
the RANGE RULE and its scoreboard via range-rule's CHECK_IDS, the DOCS
GATE bullet, the four dispatch-brief opener bullets) or card-owned
(POISON DRILL is T-092's seat, RANGE RULE is T-093's). The floor drops
when those cards land and when the lane spellings move to one
structured source.

## Corrections the run made in BOTH directions — the section that earns this record

- **Sub-question 3's premise was false by measurement**: the 31-merge
  scoreboard is SPEC-KEPT (`scoreboard-path-for-path`,
  `-byte-for-byte`, `-third-metric` are live range-rule CHECK_IDS), so
  "move the unguarded scoreboard narrative" was void and the RANGE
  RULE bullet stayed whole — the ruling's primary clause (keep
  spec-kept figures) won.
- **The architect's "failure is likely silent" refuted at the
  source**: `rawBullet` (range-rule.mjs) THROWS on a missing or
  duplicated opener and cross-checks docs-scan's collapsed spelling —
  the Law-2 keeper for all four dispatch-brief bullets already
  existed.
- **The room's "absorbing the queued seat edits" was over-broad**:
  T-092 and T-093 are planned cards with their own criteria, not edit
  lists; NOT absorbed. T-127-s5 and both stale denominators were.
- **Two keepers refused deletions and won**: brief.spec.ts:642 pinned
  STATE's `## Next up` heading through the compaction, and
  brief.spec.ts:439 forced the ARCHITECTURE slug-map block back as the
  checked signpost it is. Both restorations are the model working.
- **A phase-2 defect was caught late by its own discipline**:
  capabilities.mjs shipped without JSDoc under tools/e2e's typecheck —
  missed because the suite transpiles without typechecking, the exact
  trap CONVENTIONS documents. The rewrite's behaviour was proven
  identical by `capabilities:check` reporting CURRENT: a zero-byte
  diff.
- **One self-inflicted instance, stamped**: a `git checkout --` during
  the first budget drill restored the OLD committed STATE over the
  uncommitted rewrite; caught by `wc`, rewritten from context, drill
  re-run with unpiped exits (clean 0, poisoned 1, restored 0). The
  first drill's piped `$?` also read the tail's exit, not the gate's —
  the unpiped rule, self-applied after self-violating.
- **The identical-figures trap fired at phase 7 in its strongest
  form**: committed and fresh graphs both read
  `1020023 · 189 · 2152 · 2111` and the tree was STALE on kit.rs's
  content. ASK, NEVER PREDICT held.

## The run ledger

e2e: SEVEN full runs (ports 15998–16008, each lsof-read at zero rows
before the bind) — 233/233 at phases 2, 4, 6(second), 7; 232/233 at
phase 3 (the Next up heading pin) and phase 6 (the slug-map block);
229/233 at phase 5 first pass (four parity reds demanding the
CI-bullet clauses and the delta 3 -> 5) — every red a keeper doing its
job, every fix a co-move, never a loosening. Plus one filtered run
(the five CONVENTIONS-parsing specs, 119/119). cargo: twice, 518/0/4
over 18 result lines, exit 0 both. parser: three times, 314/314. app:
twice, 1013/1013. lint:docs: after every doc write, exit 0, four
budgets gated by the end. lint:tokens: twice, clean. index --check:
asked at phase 7, STALE on kit.rs, regenerated, CURRENT —
**1,020,023 of 1,040,000 bytes (98.1%), 19,977 left: T-139's raise is
nearly spent and @human's look on the next value is queued.**

## Dispositions

Discharged with closed_by lines (the T-081-s7 shape): `T-138-s1`
(phase 2), `T-133-s2` (phase 3), `T-127-s5` (phase 5), `T-138-s2`
(phase 7, on top of T-145's core fix). No card status was moved — the
discharge-then-triage rule holds. T-092 and T-093 remain planned at
CONVENTIONS' seat, their bullets left whole for them.

## Environment

Zero `task/` lanes for the whole run (derived at every phase, not
assumed). Port 1420 untouched — never probed, never bound. No
`npm ci`, no `cargo clean`, no `git add -A`; every commit named its
paths. The working tree's pre-existing modifications from before this
session were committed by their own author before phase 7's status
read; the `z` file was not this run's to touch.
