# State

Updated: 2026-08-17 by integrator (T-030 merge), claude-opus-5 @fresh

## Just completed
T-030 (parser strictness pass — comment-blind roadmap, cycles,
filenames, id aliases, M, milestone 4, `lib-parser`, F-02) done and
merged. Built by `claude-opus-5 @fresh`, verified by
`claude-opus-5 @fresh`, `review: same-model`, **APPROVED first pass**.
Six rules, ten criteria, nine files under `lib/parser/` plus the one
`docs/CONVENTIONS.md` bullet criterion 1 requires.

**THE HEADLINE IS NOT WHAT THE CARD SAID.** Two of T-030's findings
came out sideways to the dispatch, and in both cases the card
UNDERSTATED the defect. Neither correction was taken on trust — the
verifier re-derived both against a separately-built branch-point parser
(`git archive 6ed97cf lib/parser`), and this merge re-derived the ones
it could cheaply re-derive again.

**(a) THE COMMENT-BLINDNESS RAN THE WRONG WAY ROUND TOO — and that
direction is worse.** The card described PHANTOM features: a commented
`- F-NN:` bullet parsing as a real board column (T-023-s1). True, and
fixed. But the inverse was also live and nobody had named it. A
commented-out `## Milestones` heading sitting mid-backbone ENDED the
backbone, so:

    ## Backbone
    - F-01: Real — first
    <!--
    ## Milestones
    -->
    - F-02: Real — second

parsed to **`[F-01]` only, with ZERO issues** on the old parser, and to
`[F-01@4, F-02@9]` on the new one. **A real, shipped feature vanished
from the board and nothing said so.** A dropped column is strictly
worse than a phantom one, and the asymmetry is the whole point: **a
phantom is visible, so someone eventually asks what it is; a dropped
column looks exactly like a column that was never written.** Both
directions are now closed by one mechanism — `stripHtmlComments` blanks
every `<!-- … -->` span to spaces before ANY line is matched, newlines
survive, so every `FeatureRecord.line` and every `:N:` in a message
stays truthful.

**The unterminated-opener behaviour was ruled RIGHT, for a better
reason than the notes gave.** An unclosed `<!--` blanks to end of file
AND emits a roadmap-error naming the opener's line — the one rule no
criterion asked for, and the builder flagged it for attack rather than
burying it. The notes justified it as "nothing after a broken opener
can become a phantom". The verifier's reason is stronger and worth
carrying: **CommonMark's HTML-block rule ALSO runs an unclosed `<!--`
to the end of the document.** So blanking to EOF is not the parser
inventing a reading — it is the parser AGREEING WITH THE RENDERER.
Doing it silently would have been the violation; the error is what
makes it legal under the flagging-not-hiding contract.

**(b) THE STAMP COUNT WAS UNDERCOUNTED, and the undercount is in the
card.** The card names SIX TASKS carrying a wrong `policy`. Measured by
parsing the live tree through both parsers and diffing every
`ModelSession` field: **NINE record fields change, `{builtBy 6,
verifiedBy 3}`, of which EIGHT are policy flips** — because **T-002 and
T-005 each carry a wrong stamp in BOTH `built_by` AND `verified_by`**,
and the card counted tasks rather than fields.

    T-001 built_by     policy resume → fresh
    T-002 built_by     policy resume → fresh
    T-002 verified_by  policy resume → fresh      ← the card missed this
    T-005 built_by     policy resume → fresh
    T-005 verified_by  policy resume → fresh      ← and this
    T-019 built_by     policy resume → fresh
    T-020 built_by     policy resume → fresh · model 59 → 13 chars
    T-024 built_by     policy resume → fresh · model 59 → 13 chars
    T-001 verified_by  policy unchanged (`human`) · model 34 → 1 char

**`raw` is byte-unchanged on all nine**, and on every distinct stamp in
the tree — which is what keeps the detail panel honest while the badge
gets short. `features` and `components` are byte-identical before and
after; there are ZERO diffs in any non-ModelSession field of any task.
Through the app's own `shortModelName` (transcribed from
`app/src/lib/board-model.ts`, which this branch does NOT touch): T-020
and T-024 `built_by` go **50 characters → `opus`**, T-001 `verified_by`
27 → `+`. **The longest rendered badge anywhere in the live tree is now
FIVE characters.** `codex/gpt-5.2 @S3` is byte-unchanged, as are
`codex`, `codex@fresh`, `human`, `claude-opus-5`, `claude-opus-5
@fresh`, `claude-opus-5 @resume` and `claude-fable-5 @fresh`.

**THE VERIFICATION'S OWN STANDARD, recorded because it sets a bar.**
The cycle detector is an iterative Tarjan SCC over `blocked_by` edges,
and the verifier did not stop at reproducing the pinned shapes:
- **Differential-fuzzed against brute-force reachability** (a node is
  in a cycle iff it reaches itself; SCCs by mutual reachability) over
  **3,000 random graphs containing 4,069 reference cycles — ZERO
  mismatches.** That is a correctness proof, not a liveness check.
- **Scale, past the 5,000-member pin**: a **50,000-member ring in
  224ms**, and a **50,000-deep ACYCLIC chain in 92ms** — the latter is
  the real stack-depth test, because it forces maximum DFS depth, and
  it is the reason "iterative" is load-bearing rather than stylistic.
  Dense graphs at 20 edges/node: 1ms/1ms/4ms for N=200/400/800, linear
  in edges.
- **The poison sweep was re-derived independently.** The verifier
  extracted the added `it(` declarations from `git diff -U0` by walking
  hunk headers (39: component 8, model-session 8, roadmap 9, validate
  14), injected its own throw into each, and got **197 total / 39
  failed / 158 passed — 39 poisoned, 39 red, zero vacuous, zero
  collateral** (grep for `AssertionError` in the verbose run returns
  nothing). Restored and confirmed byte-identical by `git hash-object`
  against `git rev-parse HEAD:<path>` for all ten test files.
- **One issue per SCC, not per ring**, upheld on argument: a
  figure-eight (T-901↔T-902 and T-901↔T-903) is ONE root cause, and
  reporting each ring would name T-901 twice — the exact anti-pattern
  the T-019 one-root-cause discipline forbids. Enumerating simple rings
  is also exponential, which no parser should be.

**THE FINDINGS, RANKED — the ranking is the verifier's.**

- **T-030-s3 IS THE URGENT ONE, and the verifier sharpened its
  mechanism into something worse than the title.** Zero-padding aliases
  TASK and FEATURE ids too (`T-01` vs `T-001`, `F-1` vs `F-01`) and only
  COMPONENT ids are checked. The sharp half: with only `T-001` present,
  `blocked_by: [T-01]` is a **LOUD `dangling-reference`**; add an
  unpadded `T-01` and **the SAME edge silently re-points to the new
  task, zero issues raised.** So introducing a hand-numbered sibling
  SILENTLY REWRITES AN EXISTING DEPENDENCY. That is a wrong answer in
  the dependency graph, not a missing warning — and it is the graph
  **T-034 is building the tasks-lens dependency waves over right now**.
  A wave computation would be confidently wrong with nothing on the
  board to say so. **Safe today only by accident**: all 90 live task ids
  are three digits wide and all 6 feature ids two, verified. Correctly
  out of scope for T-030 (criterion 4 scopes aliasing to the component
  set, and that is exactly what landed). **PROMOTE before T-034's waves
  ship, or before a genesis planner writes a backbone from an
  interview, whichever comes first.** The fix is cheap: the slot-
  grouping logic already exists and wants lifting to three call sites.
- **T-030-s2** — the roadmap parser is comment-blind now but still
  **FENCE-blind**: a fenced `- F-99:` example row parses as a real
  feature (tilde fences too), and a fenced malformed row still emits
  `roadmap-error`. The verifier added the matching half: **a fenced
  `## Milestones` also ENDS the backbone**, so fence blindness drops
  real features exactly the way comment blindness did. Proposes one
  shared inert-span pass for both parsers.
- **T-030-s4 (NEW, and sharp).** `parseRoadmap` and `splitSections` now
  **DISAGREE about what content is** — they AGREED before this task,
  both blind. A commented-out `## Verdicts` in a task body still
  fabricates a section and truncates the previous one. The useful part
  is the trap it records for s2's shared pass: **this very card
  contains six `<!--` openers, all inside inline code, the last
  unterminated**, so applying the roadmap strip to task bodies would
  **eat this card's own `## Verdicts` section** — measured, four
  sections becoming three. **The inert-span pass must treat inline code
  as inert and must scan code spans BEFORE comment openers; s2's
  proposed shape names neither.**
- **T-030-s5** — `<!-->` and `<!--->` are complete empty comments in
  CommonMark but read here as unterminated openers. **Loud, so the
  contract holds**, and it is the only renderer divergence the verifier
  could construct.
- **T-030-s1** — the representative-model rule leaves a literal `+` on
  T-001's `verified_by` (`claude-fable-5 @fresh (2 passes) + @human
  (visual)` → model `+`, badge 27 chars → 1). Pinned in the suite as a
  known wart rather than papered over, four arms costed, and arm (b)
  rejected on measurement rather than taste. Right call to defer — the
  grammar arm is the honest fix and the triage explicitly ruled it out.

**THE NARROW ESCAPE, RECORDED VERBATIM BECAUSE IT IS A LIVE TRAP.**
One rule is a plausible edit away from flagging real content:

> **Any `<!--` in `docs/ROADMAP.md` that is not closed — inside a
> fence, indented as quoted evidence, or in inline code — blanks the
> rest of the file and drops every feature after it.**

**Re-reproduced first-hand at this merge, in all three positions,
against the real `docs/ROADMAP.md`: 6 features → 1 in every case**, each
with exactly one `roadmap-error` naming the opener's line. It escapes
today **only** because ROADMAP.md contains no `<!--` at all (checked:
zero occurrences), and **the house style of indenting quoted evidence
does NOT protect against it** — indentation was the mitigation for the
column-0 anchor, and an unterminated opener does not care about
columns. **The moment anyone documents the comment convention INSIDE
ROADMAP.md the way CONVENTIONS.md now does, the roadmap loses its
tail** — loudly, but it loses it. That is s4/s5 territory and the
reason both were filed rather than left as verdict prose.

**WHAT ELSE WAS RULED, briefly.** `T-banana.md` declaring `id: T-901`
is flagged by a new `filename-id-missing` kind and keeps its id;
id-LESS files stay free-form beyond the `T-` prefix, which protects a
shape TASK-FORMAT.md permits rather than one the tree depends on (the
live tree has no id-less task file at all). The numeric-alias
normalization strips zeros as TEXT, not through `Number()` — verified
that `Number()` genuinely fuses `9007199254740993` and
`9007199254740992`, and the parser correctly does NOT alias those while
still aliasing `C-09007199254740993` with `C-9007199254740993`.
`invalid-field` was REUSED for the `/dist` warning rather than getting
its own kind — flagged by the builder, ACCEPTED by the verifier (the
criterion says "warn", `paths: []` already rides that kind, the record
and the pattern survive verbatim, the app consumes issues generically).
And the one FLIPPED pin was ruled legitimate and STRENGTHENING: the old
`it('skips id-less suggestions and filenames that encode no id')`
asserted two things, one of which the criterion inverts; the
replacement keeps both outer assertions, swaps in a HARDER input
(`T-banana-idea.md` with no declared id — the shape that must stay
silent), and the flipped assertion did not vanish, it moved into a
dated block that pins it positively plus three more rejected basenames.
**Coverage strictly increases. Changed, never loosened.**

**SUITES ON MERGED MAIN**, all four re-derived here first-hand, fresh
installs, ADR-011 order:
- lib/parser `npm ci` (0 vulnerabilities) + `npm run build` clean +
  `npx tsc --noEmit` clean + `npx vitest run` **197/197 (10 files)** —
  the forecast 159 + 38 net new, confirmed by arithmetic and by run.
  Re-run AFTER the fixture edit and the final regen: still **197/197**.
- app `npm install` (0 vulnerabilities), `npx tsc --noEmit` clean,
  `npm run build` exit 0 (**253 modules**), `npx vitest run`
  **535/535 (32 files)** — **DERIVED, not assumed**: the dispatch
  offered 507 or 535 and the answer is 535, because main took T-050's
  +28 after this branch point. Re-run after the fixture edit and the
  final regen: **535/535**.
- app/src-tauri bare `cargo test` **217 passed + 3 ignored, 0 failed**,
  exit 0, **zero compiler warnings**, summed across **11 test binaries**
  (105 / 0 / 0 / 32+1 / 68 / 3 / 7 / 0+1 / 2+1 / 0 / 0) — **NOT piped
  through `tail`**. Unmoved, as a branch with zero Rust must be.
- tools/e2e `npm ci` + `npm run typecheck` clean +
  `NPUTER_E2E_PORT=14542 npm test` **40/40 in 9.8s**, headless, one
  worker, retries 0, no skips · `npm run lint:tokens` **clean, 38
  files**. **+4 over the branch roles' 36**, which is T-050's
  `startup-recovery.spec.ts` and not anything of T-030's.

**THE zsh `PIPESTATUS` TRAP BIT AGAIN, and the discipline caught it
again.** `${PIPESTATUS[0]}` after the piped `cargo test` came back
**EMPTY** (zsh spells it `$pipestatus`, lowercase and 1-indexed). The
command was simply re-run **unpiped** with the exit code taken from
`$?` on a redirect to a file — **exit 0** — and the per-binary counts
summed from the file. This is the fourth checkpoint to record that
trap. It costs one re-run every time and it has never yet produced a
wrong number, because the rule "never pipe the suite through `tail`"
already forces the honest form.

**A BUILD-ASSET NOTE THAT IS THE OPPOSITE OF T-050's.** The CSS is
byte-stable — `index-RXeeD2qB.css` at **41.30 kB, the same
content-hashed name T-049's and T-050's merges built**, which is
unremarkable here because this branch writes zero bytes under
`app/src`. **The JS moved anyway**: `index-ChZ8PwVH.js` **448.55 kB**
against T-050's `index-DYl_93aj.js` 445.14 — **+3.41 kB from a branch
with no app source in it at all.** That is the parser's six new rules
arriving in the app bundle through the `file:../lib/parser` symlink,
and it is the cleanest single piece of evidence that a C-06-only change
really does ship into C-05.

**BOOT GATE (T-046): DID NOT FIRE — stated explicitly, not silently
skipped**, per the CONVENTIONS bullet's "a skipped gate is news, never
silence". The trigger is a diff touching `app/src-tauri/**`,
`app/src/**` or either manifest (`app/package.json`,
`app/src-tauri/Cargo.toml`). **This merge's full changed set — branch
plus checkpoint — is TWENTY files: nine under `lib/parser/`, six under
`docs/tasks/`, plus `docs/CONVENTIONS.md`, `docs/ARCHITECTURE.md`,
`docs/STATE.md`, `docs/architecture/graph.json`, and EXACTLY ONE file
under `app/`: `app/test/architecture-dogfood.test.ts`.** That last one is
under `app/test/`, **not** `app/src/`, and the rule names `app/src/**`
— so no limb of the trigger is touched and the gate correctly stays
dormant. **Both branch roles also declared it untriggered in as many
words** rather than going quiet, which is the third consecutive clean
exercise of that limb. Nothing was spawned; no scratch port was used
for a boot check.

**1420 WAS NEVER BOUND, CONTACTED OR SIGNALLED.** It was OBSERVED with
`lsof` only: the human's vite is **pid 64249** holding `[::1]:1420`,
**the same pid T-050's checkpoint recorded**, with one established
connection to their webview — so their app has NOT been restarted since
the last merge. The e2e lane ran on scratch port **14542**, chosen
after probing 14542/14543/14544 free and deliberately avoiding
**14520** (T-045's tonight), **14531** (T-030's builder) and **14577**
(T-030's verifier). `lsof -nP -iTCP:14542` after the lane: **empty**.

**THE SHARED-WORKING-TREE SIDE EFFECT, SIXTH INSTANCE — AND A NEW
FACE.** The previous five arrived through the git index, through Rust
(rebuild + restart), through HMR on app source (twice), and once
through the keyboard. **This one arrives through a LINKED DEPENDENCY'S
BUILD OUTPUT.** The mechanism is confirmed present, not guessed:
`app/node_modules/@nputer/parser` is a real symlink to `../lib/parser`;
the package's `exports` resolve `.` to `./dist/index.js`; and
`app/vite.config.ts` explicitly adds `../lib/parser` to `server.fs.allow`
with a comment saying vite "resolves through the symlink to the real
path". **This merge ran `npm run build` in `lib/parser/`, rewriting
`dist/` at 02:21 today** — the exact files the human's running vite
serves for `@nputer/parser`. **So the model badges on their live board
very likely changed under them from a 50-character run to `opus`.**
Stated at the confidence it deserves: **the mechanism is verified, the
outcome on their screen was NOT observed** (no screen control), and
whether vite pushed it by HMR or their window needs a reload is
unknown. Recorded as a sixth data point on the open question below,
and it is the first one whose trigger is not a file under `app/`.

STANDING INTEGRATOR PRACTICE (T-009-s1, the ratified CONVENTIONS
interim regen rule; retires when T-014's `nputer index --check` becomes
the gate) — **TWENTY-FIRST** exercise, and it is the **FIRST in which
the graph MOVED and not one fixture assertion did**.
- **Trigger present**: the diff carries `*.ts` outside docs/
  (`lib/parser/src/**` and `lib/parser/test/**`). The plain ignored
  self-check was **RED BEFORE the regen** (exit **101**,
  `NPUTER_UPDATE_GOLDEN` confirmed UNSET at the shell), which is the
  rule earning its place rather than being assumed.
- **Delta, enumerated from the raw graph** and cross-checked by an
  **independent re-derivation written against the registry globs**
  rather than run through the app's own `derive.ts`: files **94 → 94
  (UNCHANGED — no new file nodes)**, symbols **667 → 670**, edges
  **1063 → 1069** (8 added, 2 removed). **Nothing added, nothing
  removed**: T-030's new tests EXTENDED the four existing test files
  rather than adding any, so C-06 gains no node. The branch forecast
  this exactly.
- **The three new symbols are all UNEXPORTED top-level functions** —
  `stripHtmlComments` (roadmap.ts), `blockedByCycles` (validate.ts),
  `anchoredIdiomFor` (component.ts) — re-confirming that this graph
  records unexported symbols.
- **THE TWO "REMOVED" EDGES ARE NOT REMOVALS, and this is worth
  knowing before someone reads a remove/add pair as churn.** They are
  two IMPORT edges whose `symbols` list WIDENED, which the graph models
  by value rather than by identity: `validate.ts→types.ts` gains
  `TaskRecord`, and `model-session.test.ts→index.ts` gains
  `parseProjectFromFiles`. **No module PAIR became connected**, so the
  branch's "no new import edges" forecast is right in substance and
  only looks wrong in the raw edge diff.
- **NO APP FIXTURE MOVED, and that was DERIVED before anything was
  run** — from the added/changed-file list, per the standing rule,
  because this fixture has bitten four merges the other way. The
  derivation, in the order it was made: (1) the file SET is unchanged
  and the globs are unchanged, **so the file→component mapping cannot
  have moved** whatever the glob semantics are — confirmed by an
  independent re-derivation giving **94 → 94, byte-identical per
  component (C-05 44, C-06 21, C-08 10, C-09 3, C-10 2, C-12 11, C-13
  2, C-14 1), zero unclaimed, zero ambiguous**; (2) the registry was
  swept and **`lib/parser/**` (C-06) is the ONLY pattern among all 41
  globs that can match a `lib/parser` path**, so **all ten changed
  edges are C-06-INTERNAL by construction** — every one was classified
  and every one is C-06→C-06; (3) therefore no cross-component pair
  count can move, and none did. Findings, the 28-row relation table and
  the 13/6/9 tally are byte-unchanged, D2 empty, the unmapped node
  still gone, `derived.issues` still `[]`.
- **THE GENERAL RULE, now derived once and written into the fixture
  header so the next lane uses it rather than rediscovering it: a
  lib/parser-only change is structurally incapable of moving either app
  fixture unless it ADDS or REMOVES a file, or the REGISTRY changes.**
  T-031 and T-032 are next in this lane; both are parser/badge work.
- **ONE fixture edit, and it is COMMENT-ONLY**:
  `app/test/architecture-dogfood.test.ts` gains its twenty-first
  reconciliation block, recording all of the above. **The block exists
  precisely BECAUSE nothing moved** — a green fixture after a regen
  must not be read as "the regen was a no-op", which is the failure
  mode this header has always guarded against from the other side.
  `app/test/map-dogfood-render.test.tsx` is **deliberately untouched**:
  its comment log tracks the FILE COUNT, which held at 94, so a
  "94 → 94" entry would be noise in a log whose whole purpose is to
  chronicle the number in the assertion below it.
- **`lib/parser/test/smoke.test.ts` did NOT move**, verified rather
  than assumed: T-030 declares no component and changes no registry
  file, so the T-024 three-fixtures rule does not fire in its registry
  form. Re-ran lib/parser after the regen: **197/197**.
- **Order per ceaa949, FOURTEENTH hold.** The fixture edit went in
  BEFORE the final regen (the fixture is itself indexed — and the final
  graph proves it, carrying the block's own new loc: dogfood **920 →
  977**). Then regenerated **TWICE** for byte-identity: sha256
  **`f80c1ba7e929ec71f18d01d21aee733bd1561d330a99fea70388ac1655b0f3ad`**,
  **398,546 bytes**, identical both runs (`cmp` clean). Then the
  **plain (non-golden) ignored self-check** with `NPUTER_UPDATE_GOLDEN`
  confirmed UNSET: `self_graph_is_current ... ok`, **exit 0**. Then the
  app suite re-run after the fixture edit: **535/535**.

**No model call was made anywhere in this merge.** The env-gated
`#[ignore]` smoke was NOT run (one of the 3 ignored). No screen
control, no screenshots, no OS input injection, nothing read off the
screen. No boot check was spawned, because the gate did not fire.

**THE MERGE WAS CLEAN AND THE OVERLAP WAS PROVED EMPTY, not assumed.**
Merge commit **`59558de`**, merge-base **`6ed97cf`**, sixteen files.
Both changed-file sets were enumerated and `comm -12` is **EXACTLY ZERO
FILES** (16 branch files against 23 main-side files). `git merge-tree
--write-tree` was run FIRST and answered a single tree with zero
conflict markers; **the merged tree hash reproduced that prediction
exactly — `b3d639d1c9a6e23563fae4a9c8d42695a62e1f54`.**

**THE CONVENTIONS COLLISION DID NOT MATERIALIZE — and the next lane
owes the reconciliation, not this one.** The dispatch flagged that
**T-045 is verifying a branch that ALSO edits `docs/CONVENTIONS.md`**.
Checked before merging: **T-045 has NOT merged** (`main..t045-gates` is
six commits, none of them on main), so `docs/CONVENTIONS.md` was not in
main's changed set and there was nothing to reconcile. **Both edits
were enumerated anyway, so whoever merges T-045 does not have to
re-derive it**: T-030 rewrites the **genesis-kit bullet in `##
Gotchas`** (the T-023-s1 trap note, +13/−3 around line 134); T-045
rewrites the **CI bullet in `## Build & test`** (the four CI
divergences, +22/−7 around line 70). **Different bullets, roughly sixty
lines apart, no shared hunk — T-045's merge should be clean too, but it
should still run `merge-tree` first rather than trusting this note.**
One live interaction to know about: `tools/e2e/tests/workflow-parity.
spec.ts` **PARSES `docs/CONVENTIONS.md`** and asserts every suite
command is a workflow step. T-030's edit is in Gotchas, touches no
command bullet, and that spec **passed here (40/40)** — but T-045's
edit is in exactly the section that spec reads, which is by design and
is that task's own subject.

INTEGRATOR JUDGMENT CALLS, recorded.
- **CONVENTIONS: the branch's edit was VERIFIED ACCURATE HERE, not
  taken from the verdict.** Criterion 1 requires it, and the claim it
  makes is bounded correctly. Checked three ways: (1) `parseRoadmap` is
  applied to the roadmap file ALONE — `docs-model.ts` gates it on
  `path === ROADMAP_FILE`, and the parser's own entry points reach it
  only through `parseRoadmapFile(roadmapFile)`; (2) of the six things
  under `method/docs-templates/` (ARCHITECTURE, CONVENTIONS,
  NORTH_STAR, ROADMAP, STATE, decisions/), **only ROADMAP.md is a model
  input at all** — the rest are snapshot prose no line scanner reads —
  so "the examples no longer have to be indented to stay invisible"
  does not over-reach; (3) the pin it cites is real —
  `roadmap.test.ts` carries `it('the scaffolded template shape parses
  to zero features and zero issues')`. **One thing checked because it
  could easily have gone stale and did not**: the template's OWN
  parenthetical says "a **bare** example row would parse as a real
  feature", and that sentence is **still true** — a bare (uncommented)
  row still parses as real, which is exactly what T-030 does not
  change. The templates stay comment-wrapped regardless, which the
  bullet says in as many words.
- **ARCHITECTURE: EDITED, one clause, C-06's row.** That cell is a
  per-task running record in the same idiom as C-05's — it already
  names T-002, T-003, T-008 and T-019 — and **T-030 is the first
  substantive C-06 change since T-019**, so leaving it unwritten would
  have made the row's own convention lie by omission. It now names the
  comment strip (both directions), one issue per SCC, and that the
  three new kinds are additive and consumed generically. **What was
  checked and deliberately NOT changed**: C-06's status stays
  `verified`; and, applying the T-050 lesson that "a document which
  enumerates a key set has committed to maintaining it", the whole file
  was swept for an enumeration of parser ISSUE KINDS — **there is
  none**, so the three new union members make nothing stale anywhere in
  ARCHITECTURE.md.
- **ROADMAP: NOT edited, and the test comes out the way it did for
  T-041, T-047 and T-048.** Milestone 3's Progress line enumerates
  **what a user can do**, and T-030 adds no user capability — it is a
  correctness fix. There is also **no milestone-4 section to write it
  into**, and writing parser internals into milestone 3's genesis
  narrative would overstate it. The one arguably user-visible effect
  (badges reading `opus`) is a rendering correction, not a capability.
  **And the genesis flow's SHIPPED behaviour is unchanged**, checked
  rather than assumed: the template's example row is BOTH indented and
  comment-wrapped, so the old column-0 anchor never matched it — T-030
  removes a LATENT trap that the templates were already bent around,
  not a live defect a user could have hit.
- **NO NEW ADR (three-prong).** (a) An ADR charters a DECISION between
  live alternatives with a cross-component blast radius. Every choice
  here is LOCAL to C-06 and already argued in the card: SCC-not-rings
  (argued and pinned), iterative-not-recursive (a stack-safety
  implementation detail), `invalid-field` reuse (a within-parser
  channel choice, flagged and ruled), and the representative-model rule
  — whose arm the triage **already ruled inside this task's own body**
  ("T-024-s6's ARM IS RULED HERE"). **The one behaviour that could have
  read as an invention is the opposite of ADR-worthy**: blanking an
  unterminated `<!--` to EOF is CONFORMANCE to CommonMark's HTML-block
  rule. No cross-component contract moved — the three new `ParseIssue`
  members are ADDITIVE and the app consumes issues generically (no
  exhaustive switch anywhere; re-verified by the app build and
  535/535). (b) **Prong two is NOT vacuous here, unlike T-050's** —
  this branch really does touch `lib/parser/`, so the four ADRs
  governing C-06 were each checked rather than dismissed. **ADR-009 is
  the one this diff could actually have violated, and it holds in the
  STRONGEST form**: T-030 introduces six new structures keyed by
  untrusted input — `order`, `fileOf`, `edges`, `index`, `low` in the
  cycle detector and `bySlot` in the alias grouping — and **every one
  is a real `Map`, not an object**, so `__proto__` and `constructor`
  are ordinary keys with no inherited setter to hit; two independent
  probes assert `Object.prototype` stays unpolluted. ADR-002 holds (all
  state in files, no cloud). ADR-011 holds (zero manifests, zero
  lockfiles; the per-package `npm ci` commands were run verbatim from
  `lib/parser/` and `app/` and both worked). ADR-015 holds (parsing
  stays in TypeScript; nothing moved to Rust). ADR-014 holds (the graph
  was regenerated because the rule fired, proved deterministic across
  two runs, and proved current by the indexer's own plain self-check).
  **And the native/manifest surfaces are an EMPTY SET, verified as a
  set rather than by eye**: the full changed-file list restricted to
  `method/`, `capabilities/`, `app/src-tauri/` and every
  `Cargo.toml`/`Cargo.lock`/`package.json`/`package-lock.json`/
  `tsconfig*.json`/`vite.config.ts`/`vitest.config.ts`/
  `tauri.conf.json`/`.nputerignore` returns **0 files** — so ADR-012
  held (no native surface moved, zero grants touched, the 92-grant set
  unmoved and still green under `cargo test`), ADR-003 held (no model
  call anywhere) and ADR-017 held (no write path changed — the app is
  still a lens). (c) Prong three: the durable calls live in the task
  file's criteria→evidence map, its seven proof obligations, and the
  verifier's independent re-derivations — including the two places the
  record now says the CARD was wrong and by how much.

## Overnight grants — SECOND autonomous run (human, 2026-08-17 night)
Given via question card while awake, before sleeping. Standing until
revoked:
1. **MILESTONE 3 TO COMPLETION.** Review + apply T-027's planning pass,
   dispatch its build, then T-028 and T-029 as they unblock —
   INCLUDING sequencing T-042 first if the planning pass concludes it
   must land before T-027 (its criterion 4 decides where the docs
   change log lives, and T-027 is the second consumer). **T-042 was so
   sequenced and is building now; T-027 dispatches after it merges.**
2. **THREE MILESTONE-4 LANES IN PARALLEL**, all disjoint from T-027's
   app-interview + app-shell: **T-030** (parser strictness, lib-parser),
   **T-045** (the gates cover the rules, tools/e2e), **T-034** (map
   tasks lens, app-map). **T-030 IS DONE AND MERGED — this checkpoint.
   T-034 is building; T-045 is verifying.**
3. **THIRD TRIAGE APPLIED** — read-only analyst drafts, architect
   reviews and applies. Docs-only, reversible, one diff to read.
   Tasks NEWLY CREATED by triage still do NOT dispatch without the
   human.
UNCHANGED by this grant: a second REJECTED on any task parks that lane
for the human; @human judgments are never self-answered; no screen
control beyond the ruled boot check; port 1420 is the human's.

## In progress / broken right now
**FOUR TASKS ARE `building`** (the parser re-parse confirms the count),
all in their own worktrees, all disjoint from each other and from this
merge:
- **T-042** — genesis switch truthfulness, worktree `../nputer-t042`
  (`docs_watch.rs` + `watcher-store.ts`). **Sequenced AHEAD of T-027
  under grant 1** — its criterion 4 decides where the docs change log
  lives and T-027 is the second consumer. **T-027 dispatches after
  T-042 merges.**
- **T-034** — map tasks lens, worktree `../nputer-t034`
  (`app/src/architecture/`). **This is the lane T-030-s3 aims at**: it
  builds dependency waves over the very `blocked_by` graph whose edges
  can silently re-point. See the finding above — s3 wants promoting
  before those waves ship.
- **T-014** — `nputer index --check` binary, worktree
  `../nputer-t014` (`crates/nputer-index/`). Its card now reads
  `building` (it read `planned` at T-050's checkpoint, which that
  checkpoint flagged as an owed dispatch stamp — **that debt is
  settled**). It matters here for one specific reason: **it is the
  named retirement trigger for the T-009-s1 interim regen rule this
  checkpoint just exercised for the twenty-first time.**
- **T-045** — the gates cover the rules, worktree `../nputer-t045`
  (`tools/e2e/` + `.github/` + `docs/CONVENTIONS.md`). **VERIFYING**;
  its card still reads `building`, which is normal — the card flips at
  merge. **It carries the CONVENTIONS edit enumerated above.**

None of the four worktrees was entered by this merge. The only
cross-lane reads were of git REFS from the main checkout
(`git log main..t045-gates`, `git diff` against that ref), which is
read-only and touches no worktree.

**THE SHARED-INDEX HAZARD, and it did not recur.** `git diff --cached
--stat` was checked before **both** commits and the staged set was
exactly this session's each time. The house shape here is clean:
**merge → checkpoint**, two commits.

The t030 worktree is removed and its branch KEPT — **32 task branches
merged now**, `t001-app-shell` through `t050-recover`. Main tree clean;
all four suites green; the token lint green; the committed graph
current and proved so by the plain self-check rather than by
assumption. The parser re-parses the whole live tree at **0 issues**:
**90 tasks**, tally **33 done / 14 planned / 9 parked / 30 suggested /
4 building**, 6 features, 11 components. (Tasks rise by six since
T-050's checkpoint — T-030's five suggestion files plus T-051's card,
which main took separately.) **That zero-issue re-parse is now a
stronger statement than it was yesterday**: it is the FIRST one made by
a parser that checks cycles, filenames and id aliases, and it was
independently re-derived by the verifier against main@8dadb59's
eighty-five task files before this branch ever saw them.

**NO STANDING SECURITY GATE.** T-025-s6 closed at T-039 and nothing
replaced it. The sharpest open set is still app-agent's, untouched by
this merge: **T-047-s5** (two doors, one standard, only one guarded —
~5 lines), **T-047-s6** (nothing structurally stops a test resolving
the real CLI — the one that has already fired), **T-047-s4** (`$SHELL`
picks the program, and a comment in the code is now false), and
**T-047-s1** (the cache that saves zero spawns). Beside them the
process-hygiene pair stands: **T-046-s1** (the unsignalled process
group, on the human's own port) and **T-041-s4** (the one env-var path
that would package a DEV harness).

LAUNCH ITEM, carried forward — **watch the first CI run** (T-020). At
the repo's first push (`git remote -v` is still empty), confirm in
order: the ubuntu apt/webkit2gtk set installs; the three `uses:` SHA
pins resolve; playwright-on-Linux runs the lane — **now 40 tests**,
whose most platform-sensitive are the ones measuring REAL CSS in
Chromium-on-Linux (**if anything goes red there, look at the font and
colour assertions in `front-door.spec.ts` and `genesis-screen.spec.ts`
first**), plus T-048's three-viewport sweep, which asserts EXACT pixel
equality between `document.scrollHeight` and the viewport at 800x600,
1024x768 and 1280x720 — a Linux scrollbar-gutter or default-font
difference shows up there before anywhere else and should be read as a
platform difference to file, not a regression, unless the pane's region
also stops scrolling. **T-049's Linux exposure to watch**:
`accelerators.spec.ts` presses `Meta+o` / `Meta+n` in real Chromium and
asserts `defaultPrevented`; on Linux the Meta key is not the platform
accelerator and the app deliberately accepts Control too, so if that
spec reds there, read it as a key-mapping difference to file before
touching the matcher — and note it would be the first evidence about
T-049-s4's territory that anyone has. **T-050's MILD one**:
`startup-recovery.spec.ts` includes a case that reads the failure
card's computed colours from the real sheet in BOTH schemes, so it
joins the CSS-sensitive group above; its other three drive the shell
harness and are platform-neutral. **T-030 adds NO Linux exposure** —
it ships no spec and no CSS, and its whole surface is a pure library
under `cargo`-free, browser-free unit test. Then: `cargo audit` behaves
as it does locally; and **the xvfb `tauri dev` boot prints both
`[nputer]` startup lines** — the FIRST exercise of the boot check on
Linux, and the only place T-046's override's Linux behaviour will ever
be observed (CI deliberately sets no `NPUTER_BOOT_PORT`, so the
override path stays Linux-unverified by design). AND (T-018-s3 fold)
the THREE T-018 SENTINEL LIVE TESTS inside the ubuntu `cargo test`
step — replaced-wholesale and deleted-recreated docs/. They
discriminate only where inotify watches INODES; macOS FSEvents watches
paths and was accidentally resilient, which is why T-018's replace-half
evidence is mechanism-only today. Green there CLOSES that gap; red
there is a real reconcile gap macOS could never surface, and gets filed
immediately. This run also closes T-001/T-003's Linux halves, and
carries T-026-s1 (the plan probe's exact-case match) and T-021-s1 (the
ACL pin is macOS-derived). The ubuntu `cargo test` step also runs the
`agent_runner` integration tests — **32 + 1 ignored** — which spawn
real child processes and send real signals; T-047's newest plant files,
refuse paths and assert on executable bits, so a Linux permissions or
`/bin/sh` difference would show up there first. Watch it, and watch for
the unnamed `agent_runner` flake there too.

## Next up (1–4)
1. **@human — THE VISUAL SESSION IS STILL OPEN, and one thing on it
   moved WITHOUT any app code changing.** The app is RUNNING on 1420 as
   this checkpoint lands — **vite pid 64249, the SAME pid T-050's
   checkpoint recorded, so you have not restarted it since.**
   - **NEW, AND THE ONLY T-030 ITEM: the model badges on your board
     should have got short.** This merge wrote zero bytes under
     `app/src`, but it rebuilt `lib/parser/dist/`, which your vite
     serves through the `@nputer/parser` symlink — so **T-020's and
     T-024's cards should now read `opus` where they read a
     50-character run**, and **T-001's verified-by badge should read
     `+`**. If they still show the long strings, reload the window; the
     mechanism is confirmed but HMR through a linked dependency was not
     observed. **The judgment that is yours: `+` is honest but ugly**
     (it is what is left of `claude-fable-5 @fresh (2 passes) + @human
     (visual)`), and it is filed as **T-030-s1** with four fixes
     costed. Is a bare `+` acceptable on a card face, or does that
     suggestion get promoted?
   - **THE HEADER'S DENSITY, T-049's item, still open** — the board
     header's right group is `Open folder… | Start an interview |
     Toggle theme`, three equal outline buttons where the front door
     gives its primary an ink pill, so **"Start an interview", the
     capability milestone 3 is named after, looks exactly like "Toggle
     theme"**. Separator? Emphasis? Or is quiet right? Two more: the
     header pair carries **no `⌘O · ⌘N` hint** while the front door does
     (and the startup screen does too — so the chords are advertised in
     two places out of three); and **neither group wraps or truncates**,
     so at a narrow window that row has nowhere to go. (Also: the header
     says `Open folder…`, the front door and the startup screen say
     `Open a folder…`. Same verb, two registers.)
   - **T-050's TWO OPEN JUDGMENTS, unchanged and still yours.** If you
     ever see "waiting for the first docs snapshot…" again, tell us what
     the screen looks like now — it should carry `Try again`, `Open a
     folder…`, `Start an interview` and a `⌘O · ⌘N` hint. **Does the
     failure copy read right**, and **does retry belong on that screen
     or in the header?**
   - **AND T-050's WARNING, which still matters more than the copy —
     T-050-s2.** If you land on the failure screen and escape it with
     **"Open a folder…" rather than "Try again"**, you reach a board
     with real content that is **silently dead**: no `docs-changed`
     handler was ever registered and picking does not re-subscribe.
     **Use "Try again" — that route is proven live.**
   - **The startup screen's own composition** — the first screen in the
     app to put four controls in one wrapping row with a hint beside
     them, reusing the front door's verbs without its layout. Worth an
     eye beside the header item: same question in two places.
   - **The frame at 800x600, T-048's item, still open.** The pane
     scrolls inside a fixed header and heading, and the artifact list
     gets 286px of the 858px it wants at the size the app actually
     opens. The measurement says the frame holds; **whether it holds
     ENOUGH list to be useful is an eye judgment only you can make.**
   - **THE COMPOSITION QUESTION, still the ONLY framing item left and
     still T-027's.** T-024 drew the pane as the **RIGHT HALF of a split
     view**; until T-027 it sits **full-width inside T-026's card
     frame**. Does its `bg-sidebar` ground read right framed by a
     `bg-card` bordered box, and does the **five-across backbone grid**
     hold at full width when it was drawn for a half-width pane?
     **This is the question T-027's planning pass waits on** (item 2).
   - **T-024's pane, light AND dark**: built/forming/slot card contrast
     in dark, the warm writing-row border, the five type sizes that
     moved 0.5–1px, the substituted footer right slot
     (`stage ~4 · constraints`).
   - **T-026's front door, light AND dark**: the two-button row and the
     "No plan in &lt;folder&gt;" card against the design's `open a
     folder` screen — button sizes/inks, the checklist ○/✓ (the ✓ rides
     `--review-disc`, whose dark value #4ecf9e is a token-family
     derivation, not measured from a dark mockup), the card's 10px vs
     the design's 12px radius, and whether the footnote reads as a
     footnote. **Read T-048-s4 before T-048-s3** — s3 says the "Start an
     interview here" button falls below the fold at 800x600 and **that
     conclusion is wrong**; the button and the footnote both measure
     clear of the fold, and what spills is padding and 15px of painted
     card edge.
   - **The at-a-glance amber judgment** (T-012 criterion 5's human
     half — drift stroke vs building/verifying fills, BOTH schemes,
     incl. composed building+drift; the dogfood hero renders it live).
     C-05's drift count reads **4**.
   - **The launch-shot re-judgment** (T-006's pending screenshot
     predates the rail — light + dark now include it).
   - **The T-023 dry-run conversational quality judgment** (did the two
     "pushing back:" challenges actually challenge; true cold-context
     evidence still arrives with T-029).
   - **T-026-s4's question**: point the app at a folder whose `docs/`
     holds files but no plan (a lone ARCHITECTURE.md). It renders
     **through the lens** now, as the pane's own `docs/ · 0 files
     written` scaffold with `expected` placeholder rows and north star
     `forming…`. Judge whether THAT reads right over a non-empty docs/.
   - **The real picker flows on the real screen** — the standing T-007
     checklist, still @human because native dialogs are unreachable from
     a browser harness and tauri-driver has no macOS. What remains is
     the native half — "Start an interview" → native dialog → a
     docs-less folder lands on the genesis screen; "Start an interview
     here" on a folder the app just refused; a folder that already has a
     plan → the board, not genesis. (T-049-s1 records why the served
     bundle can prove a chord was CLAIMED but never that it was OBEYED.)
   - **The `tauri dev` quit-the-app orphan check** (from T-025). Start a
     `hang`-scenario genesis in a scratch project, quit the app, confirm
     no orphan — **and watch for T-025-s7's ~5 s main-thread hang on
     quit**, which is expected, harmless, and worth confirming is only
     ~5 s.
   - **The T-047-s6 stray, a decision not a look.**
     `~/.claude/projects/-private-var-folders-…-t047va-count-97806-…-project/`
     (one .jsonl, 17,128 bytes, zero-token synthetic records). Outside
     the repo and deliberately not deleted. **Delete it or keep it — the
     call is yours.**
   - **ONE REAL OBSERVED PLANNER TURN, on an authenticated machine** —
     still the biggest unobserved thing in the project. This machine's
     `claude` OAuth token is revoked, so no model call has ever gone
     through the runner. Two questions ride on it: does the kickoff land
     a real planner in stage 0, and is the six-pattern Bash allowlist
     sufficient for a real stage-0 scaffold (which is what T-025-s4
     needs before it can narrow `Bash(cp:*)` / `Bash(mkdir:*)` safely).
     **T-025-s2 carries the exact command.**
   - **A Linux run** — the "watch the first CI run" item above.
   - **A PRIORITY CALL, not a screen action.** The next triage now has
     **five** kinds to rank. **CORRECTNESS-OF-RECORD, which is new and
     has a DEADLINE the others do not: T-030-s3.** A silently
     re-pointing `blocked_by` edge is a wrong answer in the dependency
     graph **T-034 is building waves over right now** — rank it against
     T-034's own schedule, not against the rest of this list.
     Observability: **T-050-s3** (a stranded startup writes nothing to
     the log — the reason that investigation could not name a cause).
     Process/spawn hygiene: T-046-s1, T-047-s6 (the only one that has
     already fired), T-047-s5 (~5 lines). Layout/scroll: T-048-s2 (the
     map canvas clips — silent graph loss the day anything bounds it),
     s1 (two scroll models, T-027's), s5 (the floor, one line). Reach:
     T-049-s4 (chords dead on every non-Latin layout while the UI
     advertises them) and s3 (four advertised mechanism properties, none
     pinned). And **T-050-s2** (the silently-dead board), the one that
     can bite a user without warning.
2. MILESTONE 3 (T-023…T-029 + T-039 + T-041 + T-047 + T-048 + T-049 +
   T-050, ADR-017). **What holds the milestone is now BOTH the human and
   a merge, in this order:**
   (a) **T-042 must merge, then T-027 dispatches** — that sequencing was
   taken under grant 1 because T-042's criterion 4 decides where the
   docs change log lives and T-027 is the second consumer.
   (b) **T-027's planning pass ALSO waits on the human's split-view
   verdict** (item 1) — it builds the LEFT half of a composition whose
   whole design question is what the open visual session is judging.
   `blocked_by` [T-024 ✓, T-025 ✓, T-026 ✓] has been satisfied since
   T-025 merged. **T-027 also inherits T-047-s3** (a read boundary on
   `model` at the first site that renders it), **T-048-s1** (the two
   scroll models, which only a composition decision can collapse), and
   **T-049-s2** — its accelerator criterion literally says "(their
   unmount-scoping test stays green)" and T-049 made that false on
   purpose, so the criterion needs a one-line rewording before it
   dispatches, plus **T-049-s3** (the four unpinned mechanism properties
   it is about to lean on).
   (c) **T-029 is UNGATED but not unblocked** — its `blocked_by` is
   still `[T-027]`, and T-028's is too.
   The milestone is NOT claimed: the first slice delivers hand-driven
   genesis, the runner exists and is hardened at four boundaries, but no
   agent loop has ever run against a real model.
3. OVERNIGHT DISPATCH GRANTS (human, 2026-08-16 night): the app-shell
   lane queue was T-021 → T-026 → T-025 → T-022; T-021, T-026 and T-025
   are all DONE, so the standing grant's next named item is **T-022**
   (M, milestone 4, `blocked_by: []`), with T-027 ahead of it in
   milestone order but held for the visual verdict and for T-042.
   **app-agent is FREE** — T-047 merged — which unblocks **T-043**'s
   "serialize behind T-039 on app-agent" condition outright;
   **app-shell is FREE** (T-050 merged); **lib-parser is FREE AGAIN as
   of this merge**, which matters because **T-031 and T-032 both sit in
   that lane and both inherit halves T-030 deliberately left them**
   (T-024-s6's board-badge half is T-031's, its map-badge half and
   T-011-s4's glob.ts header half are T-032's). Triage: APPLY granted —
   but tasks NEWLY created by triage (T-041…T-051) do NOT dispatch
   without the human. Unchanged method rules: a second REJECTED on any
   task parks that lane for the human; @human judgments are never
   self-answered.
4. SUGGESTION BACKLOG — **39 open files: 9 parked + 30 suggested.**
   **T-030 contributes FIVE — three from the builder, two from the
   verifier — and they do not rank together.**
   **Untriaged (30)**: the five T-030 cards — **s3** (PROMOTE FIRST, and
   against T-034's clock rather than against this list: zero-padding
   aliases task and feature ids, and a `blocked_by: [T-01]` edge
   silently RE-POINTS the moment an unpadded sibling appears), **s2**
   (still fence-blind — a fenced `- F-99:` parses as real and a fenced
   `## Milestones` ends the backbone), **s4** (the two parsers now
   disagree about what content is, and the shared fix must treat inline
   code as inert or it eats T-030's own card), **s5** (`<!-->` is a
   valid empty comment read as an unterminated opener — loud, so the
   contract holds), **s1** (the representative rule leaves a literal
   `+`) — plus the three T-050 cards (**s2** FIX FIRST of that set: a
   board reached after a failed subscribe is not live, **s3** a startup
   failure never reaches the log, **s1** a hanging startup is not a
   rejection — conclusion right, one mechanism sentence wrong and the
   correction is in T-050's record) — plus the four T-049 cards
   (**s4** `event.key` makes the chords silently dead on every
   non-Latin layout, **s3** the hook's four advertised mechanism
   properties are each deletable with the suite green, **s2** T-027's
   accelerator criterion names a test T-049 retired — one-line
   reconciliation, cheapest thing on this list, **s1** the lane sees a
   browser, not the app) — plus the five T-048 cards (**s2** the map
   canvas clips instead of scrolling, **s4** the s3 CORRECTION — read it
   BEFORE s3, **s1** two scroll models, **s3** the no-plan card
   overflows at 800x600, **s5** the bounded frame's floor) — plus the
   six T-047 cards (**s5** the probed path skips the gate, **s6**
   nothing structurally stops a test resolving the real CLI, **s4**
   `$SHELL` picks the program, **s1** retire the cache, **s2** the flag
   table is a version snapshot, **s3** the model has no read boundary,
   home T-027) — plus **T-041-s2** (the wire shape is pinned in Rust and
   mirrored by hand in TS with nothing comparing them), **T-041-s4**
   (`NODE_ENV`, not `--mode`, flips the DEV gate), **T-046-s1** (the
   unsignalled process group), **T-046-s4** (the overlay's blind spot),
   **T-046-s2** (`checkJs` — its worked example is wrong and the
   correction is IN the file), **T-046-s3** (nothing gates the packaged
   build — read with s4 and T-041-s4: all three are "a gate proves the
   configuration it was handed, not the one that ships"), and
   **T-039-s3** (give the session-id refusal its own typed outcome; home
   is T-029).
   **The nine parked, unchanged**, all blocked on something only the
   world can provide: T-003-s2 (a real project near the ~25 MB knee),
   T-008-s1 (F-04/F-05 layout), T-018-s1 (a Windows lane), T-021-s1 and
   T-026-s1 (both await the first Linux run), T-025-s2 (@human, one
   command on an authenticated machine), T-025-s4 (gated by s2),
   T-025-s3 (nputer.yaml is F-04 era; its count fix rides T-043),
   T-038-s1 (no responsive call site yet — T-048 is the first task to
   measure the app at six viewport sizes, so s1's claim is weaker than
   it was).
   Triage-born tasks standing ready and un-dispatched: **T-043** (kill
   path — its serialization condition is SATISFIED and app-agent is
   free; T-047-s4 nominates it as a home), **T-044** (shell pins cover
   their surface), **T-051** (a window the split fits in). T-042 left
   this list — it is building now.
   Milestone-4 queue after F-03: T-010, T-013, T-015, T-022, T-031…
   T-033, T-035, T-044. (T-014, T-034, T-042 and T-045 are in flight;
   **T-030 is done**.)

## Open questions
- **Does the BOOT GATE rule retire, and when?** Carried forward
  unchanged. T-009-s1's sibling rule names its retirement (T-014's
  `nputer index --check`, **now building**); BOOT GATE names none in
  CONVENTIONS, and `.github/workflows/ci.yml` already invokes the boot
  check on ubuntu while dormant. Does it retire at the repo's first
  push, or only when a macOS gate exists too? Left for a triage. **FIVE
  exercises in, unchanged by this merge — T-030 is the third
  consecutive branch to declare it UNTRIGGERED rather than skip it
  silently, which is the bullet's "a skipped gate is news, never
  silence" working on its quiet limb.** Worth noting when the
  retirement question is taken: the rule has now been correctly SILENT
  as often as it has fired, and neither behaviour has needed amending.
- **Should `method/` name the class of CONVENTIONS-level pipeline
  gates?** Unchanged: there are TWO gates with the shape trigger →
  command → record, one of which binds the executor, and
  `method/roles/executor.md` still says only "run the test commands from
  CONVENTIONS.md until green". Ask ONCE when a THIRD lands, or when the
  executor rule proves noisy. A method version bump, not an ADR.
- **Does the shared main working tree need a rule?** Carried forward
  and **now with a SIXTH data point that is a new KIND rather than a new
  instance**. The first was the git INDEX (T-046's merge lost its house
  shape to a shared index; the fix that works is social — "the pen is
  yours" — plus `git diff --cached --stat` before every commit, done
  twice here). The second was the WORKING TREE via Rust: an app-agent
  merge REBUILDS and RESTARTS the app the human is reviewing. The third
  (T-048) was the same tree via **HMR** — no restart, same pid, but the
  screen under review changed without a signal. The fourth (T-049)
  sharpened that: the merge changed what the KEYBOARD does. The fifth
  (T-050) replaced the exact screen the human had photographed.
  **The sixth is this merge's, and every previous one was triggered by
  a file under `app/`. This one was not.** T-030 wrote ZERO bytes under
  `app/src` and still very likely changed their live board, because
  rebuilding `lib/parser/dist/` rewrites the files their vite serves
  through the `@nputer/parser` symlink. **So the blast radius of "a
  merge can change the screen under review" is wider than the previous
  five suggested: it includes any package the app links by `file:`.**
  All six faces are recorded and none is written down anywhere but
  here. Method/process, so the architect's (ADR-004).
- **When does spawn hygiene become an ADR?** Unchanged from T-047's
  ruling: three C-14-local rules exist and a charter was argued against,
  because T-047-s5 proves the cached and probed doors hold DIFFERENT
  standards today. **The moment to write it is when s5 lands** — that is
  when there is a single rule to charter — which is a nearer, sharper
  trigger than "a second component spawns agents at F-04".
- **Does a verifier's remedy belong in an acceptance criterion?**
  Carried forward, and **T-030 is the FOURTH data point and the
  cleanest yet on the "properties, not shapes" side.** T-041's verifier
  filed a fix in s1's note 1; the architect promoted it into T-048's
  criterion 3 as a prescription; **it was wrong, and the task nearly
  required its own bug.** T-049 supplied the counter-example: its
  criterion 5 named a MECHANISM to prove rather than a remedy to build.
  T-050 was the third: criterion 1 named PROPERTIES and prescribed no
  shape, which is precisely why a continuation session could find the
  committed code satisfied only two of three. **T-030's criteria name
  BEHAVIOURS ("SHALL ignore HTML-comment content", "one issue per
  cycle, not per member") and deliberately do NOT name mechanisms** —
  and the builder chose SCC-based Tarjan, a shape no criterion
  mentions, which the verifier then differential-fuzzed against
  brute-force reachability and upheld on its own merits. **A criterion
  naming "detect simple rings" would have forbidden the better
  answer.** Two candidate rules, both cheap and both now four-times
  evidenced: a criterion that names a specific remedy SHALL carry an
  "or a demonstrably better equivalent" hatch, or a remedy inherited
  from a suggestion SHALL be written as a hypothesis to test rather
  than a shape to build. The architect's call (ADR-004).
- **When a task retires a test, who owns the property it was reaching
  for?** Carried forward from T-049, and **T-030 supplies the best
  positive example so far.** T-026's "stops listening once the front
  door is gone" was retired CORRECTLY — it would have been vacuously
  green forever — but the property underneath it is pinned nowhere.
  Candidate rule, one line in TASK-FORMAT: a task that deletes or
  replaces an existing test SHALL name, for each assertion dropped,
  either its new home or its suggestion id. **T-030 did exactly that
  without being asked**: it FLIPPED a pin whose assertion the criterion
  inverts, kept both outer assertions, swapped in a harder input, and
  **moved the flipped assertion into a dated block that pins it
  positively** plus three more cases — so nothing was dropped, only
  relocated and strengthened, and the verifier confirmed coverage
  strictly increases. T-050's rename-not-retire was the previous good
  case. **Two clean examples now exist; the rule is describing
  behaviour the lane already has.** Method version bump, the
  architect's call.
- **What does the pipeline owe a task whose builder vanishes
  mid-flight?** Carried forward from T-050, unanswered. That was the
  first case and it came out WELL, but by virtue rather than by rule:
  the continuation re-derived every obligation first-hand and
  **reported that the code it inherited did not meet criterion 1**.
  Nothing in `method/` asks for that. The candidate rule is narrow: a
  session that inherits committed work it did not write SHALL say so in
  the notes and SHALL mark which measurements it re-ran versus
  inherited. Method version bump, the architect's call (ADR-004).
- **NEW: should a card's own numbers be treated as a claim to verify
  rather than a brief to implement?** T-030 is the sharpest instance
  yet. Its card asserted two specific quantities — "a FIFTY-character
  badge" and "SIX live stamps report the opposite of what happened" —
  and **the builder measured both rather than transcribing them**,
  finding that the fifty was exact at the RENDERED badge but 59 at the
  `model` field, and that six TASKS is **eight wrong stamps across nine
  changed fields** because two tasks carry a wrong stamp in both
  `built_by` and `verified_by`. The verifier then re-derived both
  independently and confirmed the corrections. **Neither error would
  have shown up as a red test** — the criteria would have been "met"
  by code that fixed six stamps and left two, because nothing pins a
  count the card invented. The candidate rule is one line: a numeric
  claim in a card body is EVIDENCE TO REPRODUCE, and a task that
  reproduces it differently SHALL record the corrected number in the
  notes rather than silently satisfying the criterion. Cheap, and it
  generalises past parsers. Method version bump, the architect's call
  (ADR-004).
