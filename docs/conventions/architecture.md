# Components, slugs, walks and citations

Declaring a component, the shipped partition, the four walks over this tree, the guard classes, and what a citation names.

This file is one chapter of docs/CONVENTIONS.md, which is the INDEX:
it carries every bullet's opener verbatim beside the file the bullet
lives in. A program that reads a rule out of this document reads the
INDEX AND ITS CHAPTERS AS ONE TEXT — `conventionsText` in
tools/e2e/scripts/docs-scan.mjs assembles it, and the same assembly in
Rust is in app/src-tauri/src/dispatch/brief.rs. Never edit a bullet
here without asking what reads it.

- GUARD-CLASS PATHS, IN THIS PROJECT'S OWN SPELLING (T-296, ADR-024
  decision 1): `method/tasks/TASK-FORMAT.md` names the guard-class
  CLASSES and is product-agnostic, so the mapping onto this repository
  lives here, beside the slug map. The arm reads BOTH and refuses when
  they disagree, either way round: a declared class this bullet does not
  map, or a name mapped here the method never declared. A fenced path
  under any of these makes a card `guarded` whatever its size — the
  builder of a cage is not its inspector, and a one-line change to a
  guard can retire the guard in silence. Classes OVERLAP by design (a
  class says what a file DOES, and `.claude/` holds several kinds); the
  arm reports every class a path hits. A token ending in `*` is a PREFIX,
  and the blessed gate-runner is matched by that shape rather than by its
  filename BECAUSE THIS DOCUMENT NAMES THAT RUNNER EXACTLY ONCE and a
  body requires exactly that — which is also the honester statement, since
  what makes a file guard-class is being a gate runner. **THE MAP:**
  `agent-hooks`: `.claude/`;
  `gate-runners`: `tools/e2e/scripts/gate-*`,
  `tools/e2e/scripts/docs-gate.mjs`, `tools/e2e/scripts/push-checks.mjs`;
  `fences-and-locks`: `tools/e2e/scripts/lane-fence.mjs`,
  `tools/e2e/scripts/lane-lock.mjs`;
  `landing-and-push-guards`: `.claude/hooks/landing-gate.mjs`,
  `.claude/hooks/push-guard.mjs`, `tools/e2e/scripts/merge.mjs`;
  `parser`: `lib/parser/`;
  `method-text`: `method/`;
  `ci-workflow`: `.github/workflows/`.
  **KEPT BY A BODY, NOT BY A MEMORY**: the e2e suite derives this
  repository's guard-class CANDIDATES from the tree by a rule that never
  reads this map — every tracked file under `.claude/`,
  `.github/workflows/`, `method/` or `lib/parser/src/`, plus every
  tracked script under `tools/e2e/scripts/` whose own name carries
  `gate`, `guard`, `fence`, `lock`, `push` or `landing` — and reds
  naming any candidate no class covers.

- A CITATION NAMES A SYMBOL, NOT A LINE (fourth triage, 2026-08-19):
  line numbers drift downward under later merges while the finding's
  substance reproduces, so a stale line reads as "this was fixed". Cite
  a path plus a FUNCTION, TEST or CONSTANT name — what survives merges
  and what a reader can search for. Search from the repo ROOT:
  `git grep` run from a subdirectory silently scopes itself there and
  returns nothing, which reads like a refutation rather than a miss.
  And CITE THE SHAPE, NOT THE TALLY — a hit count is a line number by
  another name.
  **THIS BULLET IS ONE OF THE TWO THAT GOVERN THE HAND** rather than the
  lane's tooling. The other is the PORT RULE's `lsof` clause, and the
  DISTINCTION IS STATED THERE, in the sentence beginning *"The rule
  above governs the LANE's tooling"*; the hand's remaining rules are
  gathered HERE, because a hand rule filed among tooling rules is a rule
  nobody applies (T-093).
  **A MISS IS NOT A REFUTATION, AND THERE ARE AT LEAST THREE CAUSES.**
  An empty result is the answer you were hoping for, which is precisely
  why it is the one to distrust. Each cause is stated as a MECHANISM and
  never as a tool's message, because the message is not guaranteed to
  survive the shell: this harness resolves `grep` to a SHELL FUNCTION
  carrying `-I`. IF another cause is found THEN it joins this list.
  **ONE, THE SCOPE** — the `git grep`-from-a-subdirectory sentence
  above.
  **TWO, A CONTROL BYTE IN THE FILE.**
  WHAT TO RUN NEXT:
  `file(1)`, which says `data`, and then `npm run lint:tokens` from
  tools/e2e, which needs no `node_modules` and names the byte and its
  offset at exit 1.
  **THREE, A HARD WRAP ACROSS THE PHRASE.** Every governing document
  here is wrapped at about 70 columns, so a phrase search is a search
  for a line break you did not choose: the head of a wrapped sentence
  is found at exit 0, and the needle one word past the break returns
  nothing at exit 1. THIS CLAUSE TYPES NO NEEDLE, because writing one
  here would satisfy the search it is about — **and the wrap point
  moves** with every reflow, which is why the rule describes the WRAP
  and never a needle. WHAT TO RUN NEXT: shorten the needle until it
  cannot span a break, or search the COLLAPSED text, the way every
  mechanical reader of this file does before it matches.
  **`file --mime` IS NOT THE CHEAP VERSION OF THE GATE**:
  `charset=binary` is legitimate evidence for U+0000 and for almost
  nothing else — one U+000B planted into this file left `file --mime`
  reporting `text/plain; charset=utf-8` UNCHANGED and both greps still
  finding the needle, while `npm run lint:tokens` named the byte and
  exited 1. THE C0 SET P5 REJECTS IS `scanControlSource` in
  tools/e2e/scripts/token-scan.mjs — READ IT THERE, never transcribed
  into prose. The cheap version of the gate IS the gate.
  **A COMMENT THAT RESTATES A MEASURED FIGURE IS A SECOND
  IMPLEMENTATION** (of T-074's six corrections exactly ONE had a
  mechanical reader, in a different npm package from the comment it
  contradicted). SO WHERE A FIGURE IS ASSERTED SOMEWHERE, CITE THE
  ASSERTION BY NAME INSTEAD OF RESTATING ITS VALUE: *"the lens takes the
  rest; `interview.spec.ts`'s `the split is 640 + the lens at >=1024`
  measures it"* cannot go stale, because the only thing it claims is
  that a test exists. **THE GATE FOR THIS IS REFUSED IN WRITING**: a lint
  that grepped comments for digit runs would fire constantly on prose
  that is fine, and the honest narrow version — flag a comment quoting a
  figure in the same file as an assertion of a DIFFERENT value — is
  worth a prototype only if a sixth instance turns up.
  The history, the measurements and the argument this rule was cut
  from are in docs/reference/09-records.md (T-290), verbatim.

- This project was planned in a long chat session before the folder
  existed; the chat is NOT the record — if it isn't in this folder,
  it didn't happen (succession rule).

- DECLARING A COMPONENT moves THREE live-registry fixtures, not two
  (T-024-s5, ratified at the 2026-08-16 second triage after the
  omission cost T-024 a rejection): `lib/parser/test/smoke.test.ts` (the
  exact id array over this repo's live docs/ tree),
  `app/test/architecture-dogfood.test.ts` (ids, declared count,
  findings, the relation table, drift/declaredOnly) and
  `app/test/map-dogfood-render.test.tsx` (rendered node + edge counts).
  Reconcile all three, changed never loosened. A MERGE REGEN alone moves
  only the two app fixtures — the parser pin holds unless the REGISTRY
  itself changed.
  **MOVING A `touch_slugs:` FIELD IS A DIFFERENT EDIT AND MOVES A
  DIFFERENT SET** (`T-163-s3`). DERIVE that set, never transcribe it:
  `node tools/e2e/scripts/docs-gate.mjs docs/architecture/components/C-NN-*.md`
  names the owed SUITES at your own ref, and it names more suites than
  the two the three fixtures above live in; **the three above can all
  be GREEN while other bodies in those same suites red** (T-163 measured
  it moving one field), so run each suite the gate names IN FULL. One
  consumer sits outside every suite: docs/ARCHITECTURE.md's prose slug
  BLOCK copies this field and must move with it — `brief.mjs --task`
  compares the two and says in one line whether they agree at your ref.

- THE SHIPPED PARTITION, IN SLUGS (T-147 — the sentence
  method/tasks/TASK-FORMAT.md's ceremony boundary asks each project to
  state beside its slug map, so a size-S card's ROW is read off
  `touches:` rather than judged; the map is docs/ARCHITECTURE.md's
  block and its authority is each component's own `touch_slugs:`).
  **SHIPPED — every registry SLUG, and no list of them here**:
  `git grep -h '^touch_slugs:' docs/architecture/components/` prints
  the set at your own ref. **EVERY EMPTY LINE IN IT IS A COMPONENT NO
  SLUG CAN FENCE**, and each is why the SHIPPED clauses below do not
  stop at the slug set —
  `git grep -l '^touch_slugs: \[\]' docs/architecture/components/`
  names those components at your own ref, and THE COUNT IS NOT WRITTEN
  HERE because it has already moved once (`T-163-s3`). A slug is the
  usual SPELLING of "does it ship?", never the question itself — the
  question is whether the bytes REACH the product.
  **SHIPPED — any bare `method/` path that REACHES a `KIT_FILES` entry**
  (`git grep -h 'rel: "' app/src-tauri/src/agent/kit.rs`), because the
  kit materializes those bytes VERBATIM into every project this system
  creates. Here the METHOD is the product, so the rule of thumb's
  premise — "`method/` is product-agnostic" — is false, and its
  conclusion drops the verifier from the highest-blast-radius bytes we
  ship (T-145 repaired the adapter every new project inherits, took no
  verifier under the fallback, and its drill measured `cargo test` GREEN
  with the defect restored). REACHES, not equals — a fence is a blast
  radius, so `[method/roles/]` ships (it may write `planner.md`) and
  `[method/roles/executor.md]` does not; narrow the fence and the
  ceremony narrows with it.
  **SHIPPED — a bare path into the `paths:` of a SLUGLESS component
  whose bytes REACH the built app** (T-163, @human's architecture
  ruling of 2026-08-30, which took C-11's `touch_slugs:` to `[]`; the
  FIELD is the authority — `grep -h '^touch_slugs:'
  docs/architecture/components/C-11-design-tokens.md`). A design-tokens
  change enters a lane as `touches: [app/src/styles]` or
  `[app/src/assets]` — its own bare PATH, in the spelling C-11's body
  publishes — and it SHIPS by the same REACHES test: `app/src/index.css`
  (C-05, slug `app-shell`) `@import`s `./styles/tokens.css` and
  `./styles/fonts.css`, and `fonts.css` `url()`s
  `../assets/fonts/*.woff2`, so those bytes are compiled into every
  build. **READING AN EMPTY `touch_slugs:` AS "NOT SHIPPED" IS THE TRAP
  THIS CLAUSE CLOSES**: the ruling removed a fence SPELLING, not a byte
  from the bundle — and it does NOT generalise to every empty line; C-01
  is slugless too, and its `method/**` ships only as far as the clause
  above says. Ask each slugless component's territory the REACHES
  question separately.
  **NOT SHIPPED — every bare path no SHIPPED clause above reaches**:
  `docs/**`, `.github/`, `tools/e2e` (YES to "is it code?", NO to "does
  it ship?" — the case this rule exists to settle), and the `method/`
  files the kit leaves behind, `lane-protocol.md` and
  `roles/integrator.md` among them. **`non_code:` IS A DIFFERENT AXIS
  AND IS NEVER SUBSTITUTED**: C-11 is `non_code: true`, claims NO slug,
  and ships anyway — neither field is the shipped-ness test.

- THE FOUR WALKS — which one sees this file? (T-078, closing an open
  question every integrator was re-deriving.) This repo walks its own
  tree FOUR different ways and no two of them agree. The AUTHORITY column
  is where each answer actually lives; read THAT rather than trusting the
  row, which is a signpost and cannot be a gate.

  | walk | authority (the file that decides) | what it sees |
  |---|---|---|
  | the GRAPH — `supertaskr-index` | `.supertaskrignore`, plus `Lang::for_extension` and `walk_root` in app/src-tauri/crates/supertaskr-index/src/{graph,walk}.rs | `.ts .tsx .mts .cts .js .jsx` **and, since T-010, `.rs`** anywhere not ignored; `.git` and node_modules hard-skipped whatever the ignore files say; symlinks skipped outright |
  | lint TOKEN — P1–P4 **and P6**, over MASKED source | `TOKEN_ROOTS`, `TOKEN_EXTENSIONS`, `SKIP_DIRS`, `TOKEN_EXCLUDED_FILES` in tools/e2e/scripts/token-scan.mjs | `.ts .tsx .mjs` under app/src, app/test, tools/e2e, minus the two lint implementation files by NAME |
  | lint CONTROL — P5, over RAW bytes | `git ls-files -z` minus `SKIP_DIRS` minus `CONTROL_BINARY_EXTENSIONS`, same file (T-058) | every TRACKED first-party text file — docs, method, .github, Rust, both lockfiles, dotfiles and extensionless fixtures included |
  | the PARSER's live docs | lib/parser/src/project.ts, pinned by lib/parser/test/smoke.test.ts | docs/tasks/`T-*.md` and docs/architecture/components/`C-*.md`, both FLAT and non-recursive, plus docs/ROADMAP.md |

  WHAT THAT MEANS AT A DIFF: a new `.ts` under tools/ is seen by TOKEN
  and CONTROL and NOT by the graph (tools/ is `.supertaskrignore`d); a new
  `.rs` is seen by CONTROL AND BY THE GRAPH, and it is a CODE INPUT to
  `cargo test` besides (T-010, `T-010-s1`).
  A new
  `.md` under docs/ is seen by CONTROL, and by the PARSER only if it is
  a flat task card or component file. THIS FILE is seen by CONTROL only
  — the parser never reads it — **but live readers sit OUTSIDE all four
  walks and this file is one of the things they read, so an edit here
  can red a suite no row above can see** (T-078-s6, replaced at T-086: a
  reader list cannot be closed by prose). **WHICH READERS IS A
  DERIVATION, NEVER A SENTENCE**:
  `node tools/e2e/scripts/docs-gate.mjs --census` from the repo root
  prints every derived reader with its suite, and the same gate run on
  your own diff — the DOCS GATE bullet below carries the one spelling —
  prints the suites your edit OWES. Run one of them before you hand
  off; do not count from this page. Two mechanisms stay named as
  SHAPES: the E2E lane parses the "Build & test" section (an edit to a
  command bullet can red workflow-parity.spec.ts), and the CARGO suite
  reads this file off disk on every run —
  `snapshot_version_matches_the_live_method_stamps` in
  app/src-tauri/src/agent/kit.rs asserts the
  `currently v<METHOD_SNAPSHOT_VERSION>` stamp in the FIRST gotcha
  above against a Rust `const`, so the method version is an ENFORCED
  PIN and a `[docs/CONVENTIONS.md, method/]` fence cannot carry a
  format bump (T-078-s3). AND THE COUNTS ARE PRINTED, NEVER PINNED:
  `npm run lint:tokens` reports both corpora on every run — DERIVE THE
  COUNT AT YOUR OWN REF (T-078-s4).
  The history, the measurements and the argument this rule was cut
  from are in docs/reference/10-gates.md (T-290), verbatim.
