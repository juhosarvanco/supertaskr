---
id: T-247
title: The dependency-legitimacy gate — a dependency a lane adds must resolve on its registry and predate the card, so a hallucinated or typosquatted package cannot ride a merge into main
feature: F-06
milestone: 4
size: S
priority: 2
status: done
suggested_by: "@human ruling (2026-09-08, version sitting): \"approve the v1 five\" — the security layer GSD Core ships (its package-legitimacy gate) and nputer lacks (T-245, map conclusion 6)"
blocked_by: []
touches: [.claude/hooks/landing-gate.mjs, tools/e2e/tests/landing-gate.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
verified_by: claude-opus-5@subagent
review: independent
---

## Why this card exists

An agent that invents a package name is the supply-chain attack of
this era: the name gets registered by someone else, the next install
pulls it. GSD Core gates this at the write (its Package Legitimacy
Gate, docs/explanation/security-model.md layer 1). nputer's landing gate
has six disclosed limits and none of them looks at a lockfile. The
census (docs/CAPABILITIES.md) has no sentence about dependencies.

## Acceptance criteria

- WHEN a lane's diff adds or changes an entry in a lockfile or manifest
  the tree already uses (package-lock.json, package.json, Cargo.lock,
  Cargo.toml — derive the set from the tree, never list it here) THE
  landing gate SHALL resolve each added name on its registry and refuse
  the landing, naming the package, IF the name does not resolve.
- WHEN the added name resolves THE gate SHALL compare the package's
  first publication date with the card's `suggested_by` date and refuse
  IF the package is YOUNGER than the card, naming both dates — a
  package registered after the card was written is the attack's shape.
- IF the registry cannot be reached THEN THE gate SHALL refuse closed
  and say so (a guard that cannot verify never answers "safe" — the
  same rule GSD's isolation guard states in its own header).
- The refusal SHALL be a disclosed limit like the six before it, with
  its positive control: a fixture lockfile carrying a name that does
  not exist reds the body BY NAME.
- CAPABILITIES SHALL be regenerated; docs/VERSIONS.md's row SHALL be
  updated at the merge.

## Implementation notes
<!-- executor appends before finishing -->

Built on `task/T-247-dependency-legitimacy-gate`, cut at
`5b92d7071e98e79073da250a3493baf9352f18da`. Two files, both inside the
fence, plus this card.

**THE SHAPE.** `dependencyRefusals` is asked once per push at each of the
gate's two moments, over the range each arm already computes. It answers
a list of sentences, each naming its package, and any non-empty list
BLOCKS — `landing-gate-dependency-refused` on the lane arm,
`landing-gate-merge-dependency-refused` on the merge arm. The merge arm
is not decoration: it is the moment this card's own title names, and a
lane merged locally by the seat holding the integration checkout never
pushes its own branch at all.

**WHAT IS DERIVED AND WHAT CANNOT BE.** The card says "derive the
manifest set from the tree, never list it", and the split is exact. The
PATHS are derived — nothing in the hook names `app/package.json` or any
other instance; `manifestKindOf` keys on the BASENAME and the range
supplies the paths, so a manifest added anywhere tomorrow is judged with
no edit. The FORMATS cannot be, because a reader for a file shape is
code. So `MANIFEST_KINDS` maps basename to reader, and the spec body
*"every manifest and lockfile the live tree carries has a reader in this
gate"* measures the tree's own inventory against that map's keys with a
WIDER oracle (24 manifest basenames, several of which this tree does not
carry) — so a `go.mod` landing here reds a body instead of an ecosystem
going silently unjudged. Measured at `c9bb2b2`: 11 manifests tracked,
11 with readers, 4 formats, 2 registries.

**FAIL-CLOSED, AND WHY IT IS AFFORDABLE HERE.** This inverts the
fail-open contract `push-guard.mjs`'s header argues and the module's own
cannot-compare arm keeps. The inversion is priced in the header: a
cannot-compare about PATHS is unavoidable because every push has paths,
so halting on it halts the project — while a cannot-verify about
DEPENDENCIES is asked of nothing except a range that added one. The seat
inconvenienced by an unreachable registry is exactly the seat that just
added a package. The zero-cost path is MEASURED and not asserted: a
range whose paths carry no manifest basename spends no git call and no
spawn, and the body *"a range that changes no manifest asks the registry
nothing and reads no card"* counts both, with a positive control that
the same call over one manifest path does reach git.

**TWO ENTRIES THAT WOULD HAVE REFUSED THIS PROJECT'S OWN TREE**, both
found by running the readers over the live manifests rather than over
fixtures. `app/package.json` resolves `@nputer/parser` through
`file:../lib/parser` — npm has never heard of it, and a reader that took
every key would refuse nputer on its first real push. `Cargo.toml`'s
`nputer-index` is a `path` dependency with the same problem. And the two
cases pull in OPPOSITE directions, which is what decides the
accumulation rule: `serde` is `{ workspace = true }` under
`[dependencies]` and a real version under `[workspace.dependencies]`, so
a plain AND over occurrences drops it, while a plain OR over occurrences
keeps `nputer-index` and refuses it. The rule is AND within one
declaration, OR across declarations, keyed on the table as well as the
name. Both halves are asserted against the LIVE file.

**FOR THE VERIFIER.**
1. The registry base URL is an environment variable, and a lane can set
   it. It exists because the suite must stay hermetic while driving the
   REAL wired hook; it is limit 6's shape and takes limit 6's ruling.
   Attack it if you think that ruling does not carry over.
2. `MAX_DEPENDENCIES_PROBED = 50` is MY decision, not the card's. An
   unbounded network loop in a `PreToolUse` hook is a push that hangs; a
   lockfile regeneration adding more than 50 names refuses closed
   without probing any. That is a real refusal a legitimate `npm ci`
   could meet, and it is the judgement most worth attacking.
3. The Cargo readers are a hand-rolled TOML SUBSET — no parser fits the
   hook budget. A construct outside the subset reads as declaring
   nothing, which is a MISS, not a false refusal. The lockfiles are the
   tighter half and where the real coverage sits.
4. The age rule compares `YYYY-MM-DD` strings, so lexicographic order is
   chronological order and no timezone enters. A package published ON
   the card's own day is not younger than it.
5. A name that resolves is taken at the registry's word: no integrity
   hash, no ownership check. A typosquat registered two years ago is
   NOT caught, and the header says so.

**THE FIX THIS LANE MADE TO ITSELF, with its class and its sweep.** The
lane's first full battery came back RED on one body —
`token-scan.spec.ts`'s *"the gate distinguishes clean, found-something
and could-not-run"*, 663 passed and 1 failed — because this card had
written THREE LITERAL CONTROL BYTES into the hook (`U+0000` twice,
`U+001F` once), which the P5 rule bans as invisible to binary-skipping
searchers. The class is "a literal control byte where the escape was
meant", and one of the three hid a real defect rather than only a
spelling one: the Cargo accumulator's key was joined with a SPACE, and a
`target.'cfg(target_os = "linux")'.dependencies` header carries spaces
of its own, so `indexOf(" ")` would have split at the wrong boundary.
The sweep is the token lint over the whole tree — 1217 tracked text
files, now clean — and it was shown capable of failing by the run that
found these three.

**POISON DRILL — 3 for 3, drilled at `c9bb2b2`.** M1 (CODE) removed the
refusal from the `absent` branch: 2 bodies red. M2 (CODE) reversed the
age comparison: 4 bodies red. M3 (DATA, because the census body's
property IS data) removed `package-lock.json` from `MANIFEST_KINDS`: 9
bodies red. Each mutation was read back with `git diff` before its run;
each restore was `git restore --source=c9bb2b2 --staged --worktree` and
is proved by sha256, committed and worktree both
`f6d82d44199d491c30b55c3f59c41689c2480f36a0726899f887391d4766163e`.

**OWED AT THE MERGE, NOT DOABLE IN THIS LANE.**
`docs/CAPABILITIES.md` is STALE — `capabilities:check` exits 1,
committed 55273 bytes against a fresh generation of 56364 — because this
lane adds 12 spec names. The census is outside every lane's fence since
T-210 and the INTEGRATOR regenerates it in the merge commit (T-201).
`docs/VERSIONS.md`'s row is the card's fifth criterion and is also
outside the fence: the line is *"Security at the write (ruled
2026-09-08) … T-247/T-248/T-249 planned p2"*, and T-247's half of it
moves at the merge.

## Verdicts

### 2026-09-08 — claude-opus-5@subagent (blind verifier, phase 2) — APPROVED

Judged at `f6bc5c8` on the bench `/Users/ujju/Projects/nputer-V-T-247`,
detached at the lane tip, against the card AS COMMITTED AT THE BASE
`5b92d70`. Every figure below is re-derived at `f6bc5c8` unless it names
another ref.

attack set: sha256:90c099964b2d342a98e102c2f6700c6e5a2e7ff714df2342392a6bcccd41716b (attack-set-T-247.md)
ground truth: sha256:7c8185ae8cf7b2bfea85973bfe275c69f98267bf231458f7741b5efb1065cb62 (ground-T-247.md)

FRAME: I read, in this order — (1) the card at `5b92d70` via `git show`;
(2) the sealed phase-1 attack set, digest verified before opening it;
(3) the dispatcher's ground truths, digest verified; (4) `docs/STATE.md`,
`docs/ARCHITECTURE.md` and `docs/CONVENTIONS.md` at the tip (the last by
its landing-gate, test-command and four-suite sections); (5)
`method/roles/verifier.md` in full; (6) only then `git diff
5b92d70..f6bc5c8`. Phase 1 was a separate spawn and its no-tool property
was kept BY INSTRUCTION, because this harness cannot deny tools to a
subagent — it is a discipline reported, not a guarantee enforced. I did
not read the executor's report. **One leak, disclosed rather than
hidden**: `git log --oneline 5b92d70..f6bc5c8`, run for the commit list
at the diff-stat step, printed the two commit SUBJECTS, one of which
summarises the lane's own control-byte sweep and poison drill. I saw
that line before running my drill. I read the card's `## Implementation
notes` only AFTER my whole attack run was complete, and then solely to
verify its claims, each of which is checked below.

**THE CRITERIA, EACH ATTACKED LITERALLY.**

1. *Adds or changes an entry … resolve each added name … refuse, naming
   the package.* PASSES. The manifest set is genuinely DERIVED: the hook
   names no instance path, `manifestKindOf` keys on the basename, and the
   census body measures the tree's inventory against `MANIFEST_KINDS`
   with a 24-basename oracle. Graded with the DATA mutant `verifier.md`
   2b requires for a derivation guard — a tracked `pnpm-lock.yaml`
   planted at the bench root reds that body by its own message (*"the
   tree carries a manifest this gate has no reader for"*), exit 1. The
   code mutant that stops the derivation recursing (basename → root-only
   match) reds ELEVEN bodies. Add-versus-change separates correctly: a
   version-only bump of an existing name adds nothing, probes nothing and
   refuses nothing; a new key added, and a version line whose KEY is
   rewritten, each probe exactly the new name. Two non-resolving names in
   one lockfile produce TWO refusal lines, each naming its own package
   and its own reason — every offender, not the first.
2. *Compare FIRST publication with `suggested_by`, refuse if YOUNGER,
   naming both dates.* PASSES, including the boundary the card implies
   but does not spell: a package published ON the card's day is ALLOWED
   (`born > card_.date`, string-compared over `YYYY-MM-DD`), the day
   after is refused naming both dates. The two degenerate cards both
   refuse CLOSED with distinguishable text — no `suggested_by:` line at
   all, and a `suggested_by:` carrying no `YYYY-MM-DD`. The field names
   are right against the live services: `time.created` and
   `crate.created_at` are first publication (`left-pad` 2014-03-14 vs
   `time.modified` 2024-04-16; `serde` 2014-12-05 vs `crate.updated_at`
   2026-07-18).
3. *Registry unreachable → refuse closed and say so.* PASSES on all four
   shapes the attack set named plus two more: HTTP 429, HTTP 500, a 200
   carrying non-JSON, a 200 whose JSON lacks the date field, an
   unroutable port and a nonexistent host ALL answer `unreachable` and
   refuse. The refusal text is distinguishable from absence — `THE
   REGISTRY COULD NOT BE REACHED — …` versus `DOES NOT RESOLVE on its
   registry` — and only a 404 yields absence. Fail-open is killed: deleting
   the unreachable refusal reds the fail-closed body and nothing else.
4. *A disclosed limit like the six before it, with its positive control.*
   PASSES. Limit 7 sits inside the SAME numbered `WHAT THIS GATE CANNOT
   SEE` construct, in the same shape, and the count goes 6 → 7. It names
   three genuine residual gaps (four formats read by hand, the registry's
   word taken, the base URL an environment variable) rather than
   announcing the capability. The positive control is two-sided on ONE
   armed lane against ONE remote with only the committed content
   changing, and each side is separately killable — making a 404 read as
   resolved reds the refusal half only; making nothing ever resolve reds
   the allow half. The control's red is attributable to the NAME, not to
   the mechanism.
5. *CAPABILITIES regenerated; VERSIONS at the merge.* PASSES as DEFERRED,
   correctly: both files are outside this lane's fence and the lane
   touches neither. `npm run capabilities` on the bench produces exactly
   the 12 new sentences, one-to-one with the 12 new test names, plus the
   census line (55,273 → 56,364 bytes; `capabilities:check` exits 1 at
   the tip, as the notes say). `docs/VERSIONS.md` line 41 already carries
   the row whose T-247 half moves at the merge. I reverted the regen; the
   bench carries no CAPABILITIES change.

**SUITES, EVERY EXIT AND EVERY COUNT READ UNPIPED.**
`npx playwright test tests/landing-gate.spec.ts` — exit 0, **36 passed**
(24 at `5b92d70` + 12; `grep -c 'test("'` reports 25/37 because one line
is a `.test("Bash")` regex call). The same spec re-run with
`NPUTER_REGISTRY_NPM`/`_CRATES` pointed at an unroutable address — exit
0, 36 passed, which is the HERMETICITY PROOF: no body depends on the
live internet. The four suites: `npm test` from app/ exit 0, 1163 passed
in 51 files · `npx vitest run` from lib/parser/ exit 0, 377 passed in 16
files · `npm test` from tools/e2e/ exit 0, **664 passed** (matching the
regenerated census) in 9.7 m · `cargo test` from app/src-tauri/ exit 0,
635 passed / 0 failed / 4 ignored across the workspace. `npm run
lint:tokens` exit 0 (CONTROL 1217 tracked text files, clean) and
`--selftest` exit 0, so that gate was shown able to fail.

**POISON DRILL — FOURTEEN MUTANTS, EVERY LANDING READ FROM `git diff
--numstat`, NEVER FROM THE MUTATOR.** Thirteen killed, one survived.
Kill sets (body counts in brackets): derivation stops recursing [11] ·
404 read as resolved [2] · nothing ever resolves [5] · `time.created` →
`time.modified` [5] · card date → `new Date()` [1] · age comparison
inverted [4] · fail-open on unreachable [1] · LANE arm never refuses [4]
· MERGE arm never refuses [1] · age rule dropped [1] · every
`package.json` spec read as registry-bound [1] · tip set judged instead
of the added set [1] · unreadable manifest read as empty [1].
CONTAINMENT, not the count: the lane arm and the merge arm separate
cleanly (each mutant reds only its own arm's bodies), and the age body
and the positive-control body contain neither the other — dropping the
age rule reds the age body alone, while making a 404 resolve reds the
control alone. Three bodies whose kill sets look identical under the
broad derivation mutant are separated by their own aimed mutants. **The
survivor is the finding below.**

**SECURITY SWEEP (mandatory, step 3).** No new dependency: the diff adds
no import, and the probe uses only global `fetch` inside a `node -e`
child. No secrets, no credentials, no query strings. No authz surface.
A hostile package name cannot redirect the request: `encodeURIComponent`
collapses `../../etc/passwd`, `https://evil.example/x`, `%2e%2e`, `x?y=1`,
`x#f` and `@scope/name` each into ONE encoded path segment on the
configured host, and a name carrying a control byte or an empty name is
refused before any request is issued. Scoped npm names encode to
`%40scope%2Fname`, which the live registry answers 200 — so a lane adding
a scoped package is not falsely refused. The two environment overrides
are a real bypass a lane can reach, and they are DISCLOSED as limit 7
under limit 6's ruling; they fail CLOSED in every direction I could reach
(an override pointing nowhere refuses, it does not allow). The cap fails
closed too: 51 added names refuse without probing any, with a control
proving 50 probes all 50.

**FINDINGS THAT ARE NOT FAILURES** — filed as `status: suggested`, never
blocking, per step 6: `T-247-s1` (the cargo accumulation rule's AND half
is unmeasured and the `nputer-index` example both the header and the
notes cite to justify it is FALSE of this tree — `nputer-index` is
declared once, as a `path`, so a plain OR still excludes it; the inner
fold mutated AND → OR SURVIVES the whole spec at exit 0, 36 passed) ·
`T-247-s2` (the registry fixture answers every field and both registries
from one server, so neither first-publication-versus-latest nor the
per-manifest routing is measured — both verified correct by direct call
with two distinguishable loopback servers) · `T-247-s3` (limit 7 prices
three costs but not what the check SENDS).

**THE NOTES' OWN CLAIMS, EACH CHECKED RATHER THAN TAKEN.** 11 manifests
tracked and 11 with readers — TRUE at `f6bc5c8`. The hook's restore
sha256 `f6d82d44…4766163e` — TRUE, the file at the tip hashes to exactly
that. Zero literal control bytes in either lane file — TRUE. 1217 tracked
text files clean — TRUE. CAPABILITIES stale at 55,273 against 56,364 —
TRUE. The `serde` half of the accumulation argument — TRUE. The
`nputer-index` half — FALSE, and that is `T-247-s1`.

**COMMISSION LIST — every observable side effect this diff adds.**
- Outbound HTTPS GET to `registry.npmjs.org/<name>`, one per added npm
  name → criteria 1 and 2.
- Outbound HTTPS GET to `crates.io/api/v1/crates/<name>`, one per added
  crates name → criteria 1 and 2.
- One `spawnSync` child (`node -e`) per probed name, 8 s internal abort
  and a 20 s kill → the mechanism of criteria 1, 2 and 3.
- Two `git show <rev>:<path>` calls per changed manifest, plus one for
  the card, and ZERO of either when the range carries no manifest
  basename → criterion 1, and measured by its own body.
- Environment read `NPUTER_REGISTRY_NPM` → UNMAPPED by the card;
  disclosed as limit 7, fails closed, is a lane-reachable bypass under
  limit 6's ruling.
- Environment read `NPUTER_REGISTRY_CRATES` → UNMAPPED by the card, same
  disposition.
- Cap `MAX_DEPENDENCIES_PROBED = 50`, refusing rather than probing →
  UNMAPPED by the card; disclosed in the header as a decision rather than
  a limit; fails closed; has a body and a control.
- Static request header `user-agent: nputer-landing-gate` → UNMAPPED and
  UNDISCLOSED; the substance of `T-247-s3`.
- Two new block codes, `landing-gate-dependency-refused` and
  `landing-gate-merge-dependency-refused` → criteria 1–4.
- Sixteen new exported symbols from the hook, imported by the spec →
  criterion 4's control surface.
- Test-side only: one child HTTP listener on `127.0.0.1:0` per
  registry-driving body, and a temp directory per fixture → criterion 4.

**VERDICT: APPROVED.** Every acceptance criterion is met, each is driven
by at least one body that can fail, the two call sites are separately
load-bearing, the fail-closed inversion is real and the security sweep is
clean. The one surviving mutant and the two fixture gaps are recorded
above and filed as suggestions; none of them is a defect in what this
card asked for.

**STEP 7 — THE GATES MY OWN COMMIT COULD MOVE, RUN AT MY OWN TIP.**
`docs-gate.mjs` over the four card paths — exit 1, which is its FIRES
answer, naming `npm test` from app/, `npm test` from tools/e2e/ and
`npx vitest run` from lib/parser/ as owed, and reporting *"every live
task card's frontmatter parses, with a legal status"*: the three
suggestions and the amended card all parse. `npm run lint:docs` exit 0.
Re-run at my tip: `npx vitest run` from lib/parser/ exit 0, 377 passed ·
`npm test` from app/ exit 0, 1163 passed · `npm test` from tools/e2e/
exit 1, **663 passed and 1 failed**.

**AND THAT ONE RED IS NOT THIS LANE'S AND NOT MINE — ATTRIBUTED AT THE
BASE RATHER THAN GUESSED.** The body is `brief.spec.ts`'s *"THE ARM
LEAVES EXACTLY WHAT THE EIGHT HAND STEPS LEAVE, file for file"*. It was
GREEN in my own full run at `f6bc5c8` earlier in this pass (664 passed,
exit 0) and is RED now — so I re-ran it at `f6bc5c8` itself, with my
verdict absent, and it **reds there too**. The cause is `main` moving
under this bench during the pass: `main` is now `83712ed`, the merge of
sibling lane T-249, which touches `.claude/settings.json` and adds
`Read` to the `PreToolUse` matcher. `checkout-currency.mjs` therefore
answers STALE `[registration-missing]` for every checkout older than
that merge, this bench included; the dispatch arm's step 3 requires a
CLEAN preflight and stops on a FOUND, whatever the finding is about. It
is the ref-skew class `docs/STATE.md` already names (*"A BENCH OLDER
THAN A SIBLING LANE REDS session-economics by ref skew: attribute at the
base"*), reaching a second body. **The lane under review does not touch
`.claude/settings.json` and did not cause it, and neither did my
verdict** — a bisect that held the three suggestions out and committed
the verdict alone reds identically. The integrator should expect this
body green again once the merge target is current with `83712ed`; if it
is not, that is a finding about T-249's merge or about this body's
tolerance of a stale bench, and belongs to whoever holds that lane, not
to T-247.
