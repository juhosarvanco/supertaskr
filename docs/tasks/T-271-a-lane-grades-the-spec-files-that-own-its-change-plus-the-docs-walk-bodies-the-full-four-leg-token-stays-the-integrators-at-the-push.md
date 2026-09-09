---
id: T-271
title: "The EXECUTOR grades the spec files that own its change (owning = everything that reads the changed file, derived over imports) plus the docs-walk bodies while it iterates; the verifier's one run and the integrator's run before the push stay the full four legs"
feature: F-06
milestone: 4
size: S
priority: 29
status: verifying
suggested_by: "@human, 2026-09-09: \"We need to make changes like these faster and more token efficient\" → \"file the first two\"; measured on T-224's fix passes (each seat ran the full battery: ~11 min, the e2e leg ~10 of them, for a change in one hook and one spec)"
blocked_by: []
touches: [tools/e2e/scripts/gate-run.mjs, tools/e2e/tests/gate-run.spec.ts, docs/CONVENTIONS.md]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
verified_by:
review: independent
---

Every seat runs the whole four-leg battery, and the browser leg is ten
minutes of it, for changes whose owning spec runs in seconds. The docs
gate already derives which suites a diff owes; what is missing is a
graded reading NARROWER than a leg for lane seats, while the push keeps
its whole-battery token. The integrator's full run on merged main
before the push is what catches a cross-spec interaction, which is
that run's job and always was.

## Acceptance criteria

- WHEN an EXECUTOR runs `gate-run.mjs e2e --owning <changed paths…>`
  THE runner SHALL derive the spec files that own those paths — every
  spec that reads the changed file, directly or through imports
  (derived from the same static import graph the map is built from,
  never from the spec's name alone), plus the docs-walk bodies when a
  docs path moved — and grade ONLY those, with the same refusals (zero bodies, parts ≠
  baseline, a pipe, the wrong cwd) and a verdict line that names the
  subset and its body count — never the leg's name alone.
- WHEN a VERIFIER runs the owed suites THE runner SHALL NOT accept the
  scoped form: the verifier's one run (T-262: once, at its own tip) is
  the full four legs, so the whole battery still runs before every
  verdict; and the integrator's run on merged main before the push is
  the full four legs (the token). AMENDED 2026-09-09 at @human's
  question ("Is it sure that this doesn't make bugs more likely?"):
  as first filed the scoped form applied to both lane seats, which
  would have moved a cross-spec red — the class T-264's executor found
  four of by running everything — from the lane to merged main, where
  the answer is the revert play. Scoping the executor's iterations
  keeps the time saved where suites run most often and loses no run
  that stands before a verdict or a push.
- WHEN the subset verdict is written THE token SHALL NOT be minted from
  it: a lane's subset run writes a `scoped` verdict the push guard
  refuses as a token, so a push still owes the integrator's full
  battery on the pushed tree.
- WHEN the owning-spec derivation cannot name a spec for a changed path
  THE runner SHALL refuse the scoped run (exit 2, naming the path) and
  say the full leg is owed — never grade nothing.
- WHEN CONVENTIONS' DOCS GATE and BLESSED RUNNER bullets are read THE
  spelling SHALL say which seats run the scoped form and that the
  integrator runs the full battery last; the executor's and verifier's
  briefs (row 7) SHALL carry the scoped spelling.
- A body SHALL show the scoped run red on a planted defect in the
  owning spec's subject and green on the pristine hook; a second body
  SHALL show the push guard refusing a `scoped` verdict as the token.

## Implementation notes (executor, 2026-09-09, lane task/T-271-scoped-e2e-leg-by-spec-file from cc41ff3)

**What moved.** `tools/e2e/scripts/gate-run.mjs` gains an owning-spec
derivation and one CLI arm; `tools/e2e/tests/gate-run.spec.ts` gains ten
bodies; `docs/CONVENTIONS.md` gains the spelling in two bullets.

**The derivation, and why it is shaped this way.** `owningSpecs` is a
PURE function of three named inputs — `changed`, `reach` (the static
import graph) and `docsReadersByPath` — so T-280 can hand it a
DIFF-derived path set without touching the rule, which is what that
card's blocker asked for. `specFiles`/`specReach` are the readings;
`deriveOwning` composes them; `scopedSuite`/`scopeVerdict` render. A
spec OWNS a path when it IS that path, when it reaches it over static
imports, or, for a docs path, when the DOCS GATE's OWN reader map
(`docs-scan.mjs`) names a reader that this spec is or reaches. The two
arms COMPOSE rather than duplicate: `docs/CONVENTIONS.md` is read by
`tools/e2e/scripts/cli.mjs`, which is not a body, and the spec that owns
THAT is the one importing it. Nothing reads a spec's NAME; the fixture
in the new bodies makes that measurable rather than asserted, with a
stem-sharing stranger whose one body always fails.

**Every failure ends at a refusal, and only in one direction.** An
unplaceable path, an unresolvable import edge, an empty path list, a leg
that is not `e2e`, a derivation that named no spec — all exit 2, naming
the cause and saying THE FULL e2e LEG IS OWED, before anything is
spawned and before a token is written. The scoped form can be wrong by
running too MUCH; it may not be wrong by running too little.

**The token.** The subset's verdict word is `SCOPED-GREEN` or
`SCOPED-RED`, written under the leg's own `e2e` key. `judgeToken`
accepts exactly the string `GREEN`, so the existing shape rules already
refuse it — NO EDIT TO `.claude/hooks/gate-token.mjs` WAS NEEDED, and a
body pins the refusal in both words with a four-green control that must
pass first. A scoped run therefore POISONS a stale green rather than
leaving one standing.

**The read cost, measured at cc41ff3 before the first edit** (per file,
`wc -c` over exactly the slices opened):

    brief-T-271.txt                    52604   whole
    docs/tasks/T-271-….md               3574   whole
    docs/STATE.md                       8322   whole
    docs/ROADMAP.md                    11878   whole
    docs/ARCHITECTURE.md                9300   whole
    docs/CAPABILITIES.md                4996   the gate-run section
    docs/CONVENTIONS.md                12110   two bullets, by heading
    tools/e2e/scripts/gate-run.mjs     42107   whole
    tools/e2e/tests/gate-run.spec.ts   12972   header, CLI and pin bodies
    .claude/hooks/gate-token.mjs       11426   writeToken and judgeToken
    tools/e2e/scripts/docs-scan.mjs    13599   six slices, by symbol
    tools/e2e/tests/docs-input-gate…    5886   the three bullet-pin bodies
    tools/e2e/tests/cli.spec.ts         2901   the two CONVENTIONS bodies
    tools/e2e/scripts/cli.mjs           1602   the gate verb entry
    tools/e2e/scripts/range-rule.mjs    2422   parseDocsGateRecipe
    tools/e2e/preflight.ts              2549   the port rule
    playwright.config/package/tsconfig  4727   whole
    TOTAL BEFORE THE FIRST EDIT       202975

A further 17453 bytes were read AFTER the first edit while checking the
row-7 question and the document's pins (`dispatch-brief.mjs` 5665,
CONVENTIONS' tools/e2e command bullet 1521, `docs-scan.mjs`
`conventionsBullet` 1865, this spec's token helpers 8402) — 220428 in
all. **The CONTEXT PACK is what made this affordable**: 13631 bytes of
docs/CONVENTIONS.md were opened out of 131472, 10.4 per cent, and every
bullet opened was one the pack named.

**The byte band, recorded.** `docs/CONVENTIONS.md` moved 131472 to
133574 bytes against ADR-019's landed 117502 / warn 146878 / fail
176253; the docs gate prints `governing-document budgets hold — 4 gated,
0 awaiting their compaction landing`. Headroom under the warn line is
13304 bytes. NO CUT WAS MADE and the reason is stated rather than
assumed: the band holds with room, and a hand cut in this document is a
compaction (T-236's shape) where more than twenty bodies pin exact
strings — a size-S card is the wrong vehicle for it.

**A pack limit worth knowing about.** The BLESSED GATE-RUNNER bullet is
now 1603 bytes flattened against `dispatch-brief.mjs`'s
`PACK_TRANSCRIPTION_LIMIT` of 2000. Under it, the pack transcribes the
bullet VERBATIM and every assembled brief carries this card's spelling —
verified by assembling an executor brief in the lane. Over it, the pack
would cite it by address instead and the briefs would stop carrying the
words. 397 bytes of margin. T-271-s1 owns that.

**What this lane could NOT do, and it is outside the fence.** Ten spec
names were added, so `docs/CAPABILITIES.md` is STALE until
`npm run capabilities` runs from tools/e2e/ — THAT IS OWED IN THE MERGE
COMMIT and this lane's fence does not reach that file.

**Suggestions filed:** T-271-s1 (row 7 does not carry the runner's
spelling and the pack's margin is 397 bytes), T-271-s2 (`judgeToken`
calls a scoped entry "RAN AND FAILED"), T-271-s3 (no verifier brief can
be assembled at this ref), T-271-s4 (the docs census cannot see a reader
that goes through `docs-scan.mjs` itself), T-271-s5 (the scoped leg
still pays for the dev server).

## The suites, measured at 2069d22 with the tree clean (added without re-running)

Run ONCE, at the code-and-notes commit, per T-279's rule. This section
was written in a LATER commit and NOTHING WAS RE-RUN to write it.

    gate-run.spec.ts direct (SUPERTASKR_E2E_PORT=15271)  exit 0   56 passed, 14.5s reported, 15s wall
    gate-run.mjs parser                                  exit 0   bodies=389  GREEN   3s
    gate-run.mjs app                                     exit 0   bodies=1171 GREEN   8s
    gate-run.mjs e2e --owning tools/e2e/scripts/gate-run.mjs
                                                         exit 0   bodies=56   SCOPED-GREEN  14s
    gate-run.mjs e2e (the full leg)                       exit 0   bodies=774 GREEN   853s wall (14m13s; the reporter says 14.2m)

**THE COMPARISON THIS CARD EXISTS FOR: 774 bodies in 853 s, against 56 bodies in 14 s for the one spec that
owns this lane's runner change. **Sixty-one times faster, and it is the
same instrument** — same registry entry, same cd guard, same zero-body
and parts-do-not-sum refusals, same verdict line. Taken over this
lane's WHOLE diff (all nine changed paths, docs and code together) the
derivation names **13 of the 39 spec files** and takes 1.65 s to say so,
with nothing unplaceable — so even the widest reading of this card's own
change is a third of the leg. The full leg ran here beside another
lane's browser suite throughout, which the e2e-seconds band would read
as contention rather than as the suite.**

The scoped verdict line, whole:

    gate-verdict suite=e2e exit=0 bodies=56 targets=1
    ref=2069d22484dbffe99508db8d3978de432369f007 verdict=SCOPED-GREEN
    scope=tools/e2e/tests/gate-run.spec.ts
    reason=ok over 1 owning spec(s) for 1 changed path(s) — NOT the leg, and not a token

and the derivation it printed first:

    gate-run: tools/e2e/scripts/gate-run.mjs is owned by
      tools/e2e/tests/gate-run.spec.ts — imports it, directly or transitively

**The fixed cost, since the leg is now narrow enough for it to matter:**
14s wall, 13.4s inside the reporter's own window, 12.4s summed over the
56 bodies — so the dev server, node's start and the derivation together
are about 1.6s, roughly 11 per cent, on a warm worktree. T-271-s5 was
FILED claiming that share was "the larger half" and CORRECTED to this
measurement before the lane closed.

**`cargo test` was NOT run** and the reason is named: a fresh worktree
with no `target/`, and three other lanes driving browser suites on this
machine throughout. The docs gate names the rust leg because
`app/src-tauri/src/agent/kit.rs` reads docs/CONVENTIONS.md — it reads
the one line carrying "formats are version-bumped", the method version
stamp, which this diff does not touch. It is owed at the merge.

**`npm run capabilities:check` exits 1, STALE — committed 65947 bytes
against a fresh generation of 67017.** Ten spec names were added. The
regeneration is owed IN THE MERGE COMMIT and that file is outside this
lane's fence. The check wrote nothing, verified by `git status`.
