# The standing gates with a merge-diff trigger

The boot gate, the docs gate and the method eval gate: what fires each, what it runs, and what it records.

This file is one chapter of docs/CONVENTIONS.md, which is the INDEX:
it carries every bullet's opener verbatim beside the file the bullet
lives in. A program that reads a rule out of this document reads the
INDEX AND ITS CHAPTERS AS ONE TEXT — `conventionsText` in
tools/e2e/scripts/docs-scan.mjs assembles it, and the same assembly in
Rust is in app/src-tauri/src/dispatch/brief.rs. Never edit a bullet
here without asking what reads it.

- BOOT GATE (T-046, ratified at the 2026-08-16 triage on T-040-s1 +
  T-020-s3): at any merge whose diff touches `app/src-tauri/**`,
  `app/src/**` or either manifest (app/package.json,
  app/src-tauri/Cargo.toml) — **and "the merge's diff" is the PAIR OF
  COMMITS THE RANGE RULE above names, which is a DIFFERENT pair before
  the merge exists than at it** (that bullet carries this gate's oldest
  worked example, T-027, and the twelve merges on which the wrong pair
  changed a gate's answer, eight of them this gate's). Then run the boot
  check — `SUPERTASKR_BOOT_PORT=<free scratch port> npm run boot:check` from
  tools/e2e/ — and RECORD the result (exit code, both `[supertaskr]` lines)
  in the checkpoint; the four exit codes are legended in the tools/e2e
  commands bullet under "Build & test" above. IF the check cannot run
  THEN say so LOUDLY in the checkpoint, naming the reason and the exit
  code — a skipped gate is news, never silence. It exists because
  `cargo run` is the ONE command this pipeline never issues: T-040, a
  one-line manifest regression that stopped the app launching at all,
  passed an executor, an adversarial verifier and an integrator, each of
  whom ran `cargo test`, `cargo build` and three full suites — all
  perfectly happy with two binaries. THE EXECUTOR RUNS IT TOO, on the
  same trigger, before handing off (T-046 criterion 6): a red the
  executor's own fence forbids fixing is still news, cheaper at build
  time than after a merge — file it as a suggestion and say so in the
  notes. Running it is NOT screen control (@human ruling 2026-08-16):
  the app opens and closes its own window; nothing is clicked, typed
  into, screenshotted, or read off the screen.

- DOCS GATE (T-084 — the third standing gate, and the one the two above
  exclude BY CONSTRUCTION): at any merge whose diff touches a path under
  `docs/` that a code suite READS, run the suites that read it, and
  RECORD which and their results in the checkpoint. **"The merge's diff"
  is the PAIR OF COMMITS THE RANGE RULE names**, the same pair both
  gates above take, and a different pair before the merge exists than at
  it. `docs/` IS A CODE INPUT and neither trigger above can see it:
  GRAPH REGEN fires on `*.ts/*.tsx/*.js/*.jsx` OUTSIDE docs/, BOOT GATE
  on `app/src/**`, `app/src-tauri/**` or a manifest, so a commit whose
  whole diff is `docs/tasks/*.md` matches NEITHER — and it has redded a
  suite twice, `9c64cd8` (two card titles opening with a backtick, both
  cards silently unparseable, four scroll-containment bodies red) and
  `fede266` (a `status:` outside the parser's vocabulary, the app suite
  at 830 of 831 on a diff of ONE markdown file, T-081-s9), **both found
  three layers from the cause by somebody who was not looking**: the
  failure mode is a red that arrives detached from its edit and gets
  attributed to whatever lane is nearest.
  RUN IT — from the repo root, and this is THE ONE SPELLING, character
  for character the same string `tools/e2e/scripts/docs-gate.mjs`'s own
  header prints (T-057: a recipe in two places is two chances to
  disagree, and for six weeks these two disagreed):

      TREE=$(git merge-tree --write-tree <main tip> HEAD)   # read $? FIRST
      node tools/e2e/scripts/docs-gate.mjs $(git diff --name-only <main tip> "$TREE")

  It is fed the RANGE RULE's own path list and deliberately computes no
  range of its own. Exit 0 nothing owed, 1 the gate HAS a verdict
  (suites owed, or a live card the parser will refuse, or the
  root-anchor account and the tree disagree), 2 called wrong, 3 the gate
  could not run — the same four codes `index --check` and `boot:check`
  use.
  **THERE IS NO `xargs` IN THAT SPELLING AND THAT IS THE POINT** (T-090,
  absorbing T-061-s3; BSD measured at `9b03ae6` against `/usr/bin/xargs`,
  the GNU piped column on ubuntu-24.04 by CI runs 33259394002 and
  33260414204, read in by T-153-s6). A pipe through `xargs` destroys two
  of the four codes, in the direction the codes exist to prevent, and
  DIFFERENTLY on the two platforms. THE MATRIX, each code produced
  deliberately and read from `$?` on an unpiped command:

  | the gate means | `$(…)` form, BSD | `$(…)` form, GNU | piped, BSD | piped, GNU |
  |---|---|---|---|---|
  | 0 nothing owed | **0** | **0** | 0 | 0 |
  | 1 has a verdict | **1** | **1** | 1 | **123** |
  | 2 called wrong | **2** | **2** | **1**, or **0** on an empty list | **123**, and **123** on an empty list |
  | 3 could not run | **3** | **3** | **1** | **123** |

  Under BSD the pipe HIDES a failed range as a clean gate (every utility
  exit collapses to **1**, and on EMPTY input the utility is never
  invoked so the pipeline exits **0**); under GNU the IDENTITY of the
  codes is destroyed instead, 1, 2 and 3 all arriving as 123, because
  GNU `xargs` RUNS the utility on empty input and maps the gate's own
  refusal at 2 to 123 — where this table, filled in from BSD, once
  predicted 0. `tools/e2e/scripts/xargs-dialect.mjs` PROBES the dialect
  at run time, two observables and never `process.platform`, so the
  bodies that execute the piped column read the column for the dialect
  they measured; the `$(…)` column has no `xargs` process in it at all.
  **AN EMPTY PATH LIST IS EXIT 2, NOT EXIT 0** (T-084-s6), and the `$(…)`
  form is what makes that reachable: a FAILED range substitutes to zero
  arguments. THREE MORE SHAPES REACH EXIT 2, each once answered "not
  owed" at 0: an argument that is EMPTY or BLANK (`"$(git diff …)"` on a
  failed range is a list of length ONE, T-064-s7); an argument carrying
  NEWLINES (the same quoting on a range that SUCCEEDED, T-064-s7); and a
  path resolving OUTSIDE this repository, which is what `../../docs/…`
  typed from tools/e2e/ used to mean (T-101-s3). A `./`-prefixed or
  ABSOLUTE spelling is normalised and answered; a PLAIN relative path
  away from the repo root is refused as ambiguous.
  **`npm run lint:docs` FROM tools/e2e IS THE NAMED FORM AND CI'S STEP**
  (T-090), AND IT BUYS HALF — the WHOLE-TREE half, judging NO diff,
  because a workflow has no "merge's diff" to be handed; both incidents
  above are in that half. THE DIFF HALF IS STILL A RITUAL: nothing but
  the integrator running the two lines above makes a merge answer for
  the suites it owes. **AND ITS EXIT 0 MEANS *I WAS NOT ASKED*, NEVER
  *NOTHING OWED*** (T-142-s1): read its LAST LINE, which names the half
  it answered. IF it cannot run THEN say so LOUDLY in the checkpoint,
  naming the reason and the exit code.
  `tools/e2e/tests/docs-input-gate.spec.ts` is the enforcing copy and
  runs inside the lane.
  THE READER SET IS DERIVED FROM THE TREE, NEVER LISTED — a hand list is
  the defect T-058 and T-080 each spent a card on — and **THE
  DERIVATION'S AUTHORITY IS `tools/e2e/scripts/docs-scan.mjs`'s OWN
  `THE DERIVATION` HEADER, NOT THIS PARAGRAPH** (T-162 corrected a
  superseded wording here; T-085 subsumed the old two-halves rule under
  ONE containment test so that a docs path written relative to a PACKAGE
  directory is SEEN). The SHAPE is two arms — a DOCS SITE, a
  path-forming call whose docs-shaped literal RESOLVES inside this
  repository's docs/; or a CALL SITE, a call that HANDS the repository
  root to a first-party function which spends it on a docs path
  (`lib/parser/test/smoke.test.ts` calls `parseProject(repoRoot)` and
  spells no docs path; with the literal arm alone a ROADMAP edit owed
  the e2e lane while the parser suite went red unnamed, T-084). Fixture
  readers stay out by the same test — `lib/parser/test/files.test.ts`
  resolves OUTSIDE `<root>/docs`. **A file that does BOTH and cannot be
  linked is REPORTED, never dropped**, and the reporting arm follows
  IMPORTS as well as local bindings. **NO COUNT IS TRANSCRIBED INTO THIS
  BULLET** — the census it once carried was green and wrong:
  `node tools/e2e/scripts/docs-gate.mjs --census` from the repo root
  prints the site census, the reader set with the arm that found each,
  the root-anchor classification and the residual, and cannot be stale
  because it is not written down.
  **AND SINCE T-271 THIS READER MAP IS ALSO THE SCOPED LEG'S OWN
  DERIVATION.** When an EXECUTOR grades narrower than a leg (the blessed
  runner's own bullet above, its `--owning` form), the docs-walk bodies a
  changed docs path owes come from THIS map — the runner reuses it and derives no
  second one, which is T-057's rule applied where it would have bitten
  hardest — composed with the runner's own static import graph, because a
  reader here may be a SCRIPT rather than a body and the spec that owns
  THAT is the one importing it. **THE NARROWING IS THE EXECUTOR'S
  ALONE**: the verifier's one run is the full four legs, and the
  integrator runs the full battery last, on merged main before the push.
  THE FOUR SUITES the derived readers sit in, listed so a reader knows
  the shape and re-derivable so nobody quotes them: `npm test from app/`
  (the two dogfood bodies), `npx vitest run from lib/parser/` (its own
  live-tree bodies), `npm test from tools/e2e/` (two specs that walk the
  whole of docs/, graph and all) and `cargo test from app/src-tauri/`
  (docs/CONVENTIONS.md on every run, plus the component registry).
  THE TRIGGER IS WIDE AND THE ANSWER IS NARROW, deliberately: EVERY path
  under docs/ reaches a reader (two lane specs walk all of it), so
  narrowing the TRIGGER would be a lie, and what is proportional is the
  ANSWER — at `c4c15c8` ONE command for `docs/rooms/*.md`, TWO for this
  file, THREE for a flat task card, **the answer's SHAPE and not its
  census** (T-086). Ask the gate; do not predict.
  THE OTHER HALF IS THE FRONTMATTER, asked of the WHOLE TREE and not
  only of the diff: every live flat `docs/tasks/T-*.md` must parse, and
  its `status:` must be in the parser's vocabulary, which the gate READS
  out of `lib/parser/src/types.ts` rather than restating (T-057) — one
  status vocabulary, honoured here with no edit when a ninth is added
  there. It names the FILE, the FIELD and the near miss.
  `.supertaskrignore` IS UNTOUCHED AND THAT IS DELIBERATE: it excludes
  docs/ because the graph is CODE-derived, so `index --check` is not the
  gate that missed this; the exclusion is asserted in the spec so "we
  decided" cannot be mistaken for "we forgot".
  The history, the measurements and the argument this rule was cut
  from are in docs/reference/10-gates.md (T-290), verbatim.

- METHOD EVAL GATE (T-155, ADR-020 decision 2 — the FOURTH standing gate,
  and the one the three above exclude BY CONSTRUCTION): at any merge whose
  diff touches `method/**`, OR ADDS A LINE MATCHING THE CITATION GRAMMAR
  (`attack set: sha256:<hex> (<file>)`) under `docs/tasks/` — a verdict
  landing, the merge `MF-10` was built for — run the model-free eval set
  and RECORD its exit in the checkpoint. **"The merge's diff" is the PAIR OF COMMITS THE
  RANGE RULE names**, the same pair all three gates above take, and a
  different pair before the merge exists than at it.
  DERIVE THE HOLE RATHER THAN TAKING IT ON FAITH — match a
  `method/**`-only diff against the three triggers: GRAPH REGEN wants a
  code suffix OUTSIDE docs/, BOOT GATE wants `app/src/**`,
  `app/src-tauri/**` or a manifest, the DOCS GATE wants a path under
  `docs/`. A method-only diff matches NONE of them. The method files ARE
  pinned — `app/src-tauri/src/agent/kit.rs` compiles a subset of method/
  into the genesis kit and reds on a byte drift — but **A BYTE PIN AND A
  TESTED EFFECT ARE DIFFERENT CLAIMS**: a rewrite of a role file
  satisfies the pin by being committed, and changes what every session
  produces.
  RUN IT — from the repo root, and this is THE ONE SPELLING, character
  for character the same string `tools/method-evals/run.mjs`'s own header
  prints:

      node tools/method-evals/run.mjs

  Exit 0 nothing owed · 1 the suite HAS a verdict · 2 called wrong · 3 the
  suite COULD NOT RUN — the same four codes `index --check`, `boot:check`,
  the token lint, the DOCS GATE and `brief.mjs` use. The AUTHORITY is the
  frozen `EXIT` object in tools/method-evals/lib/exit.mjs, which the
  runner IMPORTS rather than re-typing the numbers. ZERO DEPENDENCIES
  AND NO INSTALL: like the token lint it reads no `node_modules`
  anywhere, so it answers against a bare checkout.
  THE TWO SETS ARE TWO COSTS, NOT TWO STYLES. `--set model-free` is
  deterministic, spends no tokens, and is the half THIS trigger owes.
  `--set model-in-loop` samples a nondeterministic process, so its
  verdict is a PASS RATE against a declared threshold; it is owed at a
  METHOD VERSION BUMP and on schedule, never per-commit (the first gotcha
  of this section). **A REPLAYED MODEL-IN-LOOP RUN IS NOT A
  MEASUREMENT**: the replay runner's pass rate is 1.00 by construction,
  and every result line and the `--bump` block name the RUNNER for
  exactly that reason. THE POSITIVE CONTROL IS PART OF THE SUITE AND IS
  RUN, NEVER ASSUMED: `--selftest` degrades each eval's own contract on
  a COPY and requires the eval to detect it — A NEGATIVE ASSERTION NEEDS
  A POSITIVE CONTROL applied to the checker.
  IT IS NOT IN "Build & test" ABOVE, DELIBERATELY, AND THE REASON IS
  MECHANICAL: `deriveExpectedSteps` in
  tools/e2e/tests/workflow-parity.spec.ts reads EXACTLY the
  `run from <dir>/:` bullets that section carries and reds by name on a
  fifth, so exposing the command there is a two-package edit — that spec
  plus ci.yml — which T-155's fence reached neither of; the command lives
  beside the gate it serves. Wiring it into CI is `T-155-s1`, and until
  that lands this gate is a written ritual with one tripwire. IF the
  suite cannot run THEN say so LOUDLY in the checkpoint, naming the
  reason and the exit code — a skipped gate is news, never silence.
  **THE
  BOUNDARY RUNS THROUGH `method/`, SO THE DIRECTORY NAME ANSWERS
  NOTHING**: DERIVE which paths from `KIT_FILES` at your own ref and run
  `cargo test` when your diff hits one; widening this gate's trigger to
  fire cargo stays that card's.
  The history, the measurements and the argument this rule was cut
  from are in docs/reference/10-gates.md (T-290), verbatim.
