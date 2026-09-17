---
id: T-335
title: "A change confined to the parser's sources selects no end-to-end spec at all, including the two specs that statically import what those sources build, because the import edge lands on the gitignored built entry and no changed path can ever be that file: give the derivation the build relationship between a generated entry and its owning sources, keep the fail-closed answer where no relationship can be read, and prove the coupling with a range that moves a parser source alone"
feature: F-04
milestone: 4
size: S
tier: guarded
priority: 1
status: verifying
suggested_by: "the T-331 verifier bench on 2026-09-15, measured through the blessed runner on a range whose only changed path was a parser source; the behaviour is older than T-331 and that card's narrowing is what makes it reachable on the runner"
blocked_by: []
touches: [tools/e2e/scripts/gate-run.mjs, tools/e2e/tests/gate-run.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

## Filing provenance

Filed 2026-09-15 by the architect seat at T-331's merge, from the finding its verifier bench raised and could not repair inside that card's fence. The verifier drafted it under the identifier T-334; the seat reallocated it to T-335, because T-334 had already been allocated the same day to the resume-seat card the owner approved from the Codex orchestrator's lean-handoff bundle. Priority was raised from the draft's 2 to 1: this is a coverage hole that T-331's narrowing makes reachable on the runner, and it should not sit behind ordinary work.

Its fence shares `tools/e2e/scripts/gate-run.mjs` and `tools/e2e/tests/gate-run.spec.ts` with T-330, so the two run in sequence and never beside each other. The seat's intended slot is immediately after T-330. Preflight at promotion; no board preflight has been run against this card, which this project can only do once a card is a dispatch candidate.

Near-term exposure is bounded and was checked rather than assumed: the parser and app suites still run on such a push, and the whole battery runs nightly on main.

**THAT PREMISE WAS REFRESHED ON 2026-09-17 AND ONE HALF OF IT NO LONGER HOLDS.** When this card was filed, no card in the queue touched the parser's sources. T-312 does: its fence carries `lib/parser/src/model-session.ts` and its unit test. So the defect is reachable by queued work, and whoever schedules T-312 before this repair lands SHALL cover the affected consumers explicitly under existing verification rather than inferring safety. **Parity between the local derivation and the runner's establishes nothing here**, because both run the same derivation; two copies of one answer agreeing is not evidence the answer is complete.

## The finding

Two end-to-end specs import the parser library's built browser entry by
path, an edge T-317 introduced. The owed-set derivation walks that edge and
reaches the BUILT file, which `lib/parser/.gitignore` excludes from the tree.
A pushed range's changed paths come from git, so that built file can never be
among them, and the edge can therefore never contribute a selection. Its only
effect on the derivation was the fail-closed answer that T-331 removed.

Measured on the T-331 verifier bench through
`gate-run.mjs --owed-set --range`, on a prepared tree, over a real range whose
only changed path was `lib/parser/src/pure.ts`: the owed set is `app, parser`,
the end-to-end leg is narrowed, and it carries ZERO spec files. Neither
importer of the built entry is selected. `packageDependents` carries the edge
from the parser to the app and no edge to the end-to-end package, whose own
manifest still declares that it imports neither.

Until T-331 the planning job fell back to the whole battery on every push, so
the runner ran both specs regardless and this cost nothing. The narrowing is
correct and is that card's whole point; this is the one coupling the narrowing
leaves unrepresented, and it is the coupling that card studied.

The parser suite and the app suite still run on such a push, and the whole
battery runs nightly on main, so the exposure is bounded rather than open.

**WHY THE FAIL-CLOSED ANSWER IS WORTH KEEPING, measured 2026-09-16
off-index at `e4050bd2` over three probe commits that moved no branch,
index or worktree.** Under the machinery as it stands, a tracked file that
nothing reads and lies under no package root is UNPLACEABLE and takes the
whole battery with the end-to-end leg at 42 of 42 spec files; a
documentation file nothing reads still owes the end-to-end suite, because
the census, the index and the board-reading bodies walk that directory. So
THE LEAST EXPENSIVE OF THE MEASURED CASES STILL SELECTED ONE SUITE. Three
probes do not establish a floor for every tracked path and this note
claims none — it reports what the measured cases did. It is the context
for this card's second criterion: the fail-closed answer is not a
placeholder to be optimised away once the generated-entry relationship is
readable, it is what an unreadable relationship must still cost.

## What would settle it

The derivation reads the relationship between a generated entry and the
sources that produce it, through the owning package's own build configuration
rather than by rewriting a path, so that a change under a package's sources
reaches every spec importing that package's build output. Where no such
relationship can be read, the answer stays the fail-closed one and names the
input it could not place, exactly as it does today. A body proves the coupling
over a range that moves a parser source alone and requires both importers to
be selected, and a companion body requires the answer to stay fail-closed when
the relationship is unreadable.

## Acceptance criteria

- WHEN a pushed range changes only files under a graded package's own sources
  THE derivation SHALL select every spec file that reaches that package's
  generated entry through the static import graph.
- WHEN the relationship between a generated entry and its owning sources
  cannot be read THE derivation SHALL answer the whole battery and SHALL name
  the input it could not place.
- WHEN the derivation resolves a generated entry through its owning sources
  THE answer for a range that moves no source of that package SHALL be
  unchanged from the answer it gives today.

## Implementation notes

**A DESIGN NOTE, RECORDED 2026-09-17, AND DELIBERATELY NOT A CRITERION.**
Before adding a placement path, say here whether the settings consumer map
T-330 landed for the runtime template can carry the generated-entry
relationship as well, or why it cannot. The two answer different questions
— that map discovers runtime-file readers through path and constant
spellings, while this repair concerns a generated-output-to-source edge in
the import graph — so forcing one abstraction onto both is not obviously
right. The new path need not be independent of the existing ones; that is
a matter for the design rather than a constraint this card imposes. An
earlier draft proposed this as an acceptance obligation and it was
withdrawn to a note on review.

**THE ANSWER, RECORDED 2026-09-17 BY THE EXECUTOR BEFORE ANY PLACEMENT
PATH WAS ADDED: THE SETTINGS CONSUMER MAP CANNOT CARRY THIS, AND THE
REASON IS WHAT EACH MAP IS A MAP OF.** That map answers "which tracked
source files READ this path", over a comment-stripped corpus, by the
path's own spelling and by the identifiers a source binds to it. The
relationship this card needs is "which sources PRODUCE this path", and it
is not textual at all: nothing under the parser's own source root
mentions the built browser entry, and the tracked files that do mention
it are the two specs doing the importing. Pointed at a generated entry
the settings scan would return its IMPORTERS — which the import graph
already supplies — and never its producers, so the map would answer a
question this derivation had already answered while leaving the one it
could not answer untouched. The repair therefore adds an arm that reads
the owning package's own build configuration: the manifest's build script
names a TypeScript project, and that project declares where it emits to
and what it emits from. That arm composes with the import arm in the same
place the docs and settings maps compose, so the new path is not
independent of the existing ones — what it is not is the same map.

## Verdicts

### 2026-09-17 — APPROVED WITH ASSIGNED CORRECTIONS — claude-opus-5@subagent

Graded on a detached bench at `4e05c413`, node v22.22.0, over the diff
`f54e409feb85583ade9a2cc9500b507e1f152eb2..4e05c413`. Phase one's attack
set and my grounds were hash-checked against the copies under the
evidence directory before either was relied on; both matched.

**EVERY FIGURE BELOW CARRIES ITS ARRANGEMENT**, because on this card the
arrangement decides the answer. ARRANGEMENT A is a fresh worktree with
`lib/parser/dist` ABSENT. ARRANGEMENT B is the same tree after
`npm run build` in `lib/parser/`, so the built entry is present. My bench
carries no fence: `docs/CONVENTIONS.md` is 644 here and zero tracked
files are read-only.

#### The before and the after, both taken here rather than inherited

Real range `31d8212c^..31d8212c`, whose only changed path is
`lib/parser/src/fence.ts` — a parser source that is NOT the imported
build entry. Same tree, same arrangement B, the only difference being
which `gate-run.mjs` is in place:

| script | suites | leg | spec files |
|---|---|---|---|
| base `f54e409f` | `app, parser` | narrowed | **0** |
| tip `4e05c413` | `app, e2e, parser` | narrowed | **2** — `brief.spec.ts`, `cli.spec.ts` |

The census is 42, so 2 is a proper subset and phase one's pre-committed
REJECT on a leg-granular answer does not fire. In ARRANGEMENT A the same
range answers the whole battery under BOTH scripts, through the
pre-existing unresolved-edge sentence — a clean checkout was already
safe, and the hole was only ever reachable on a built tree.

#### AC1 — PROVEN

A1.1 and A1.10 disproved twice over. The comment-stripped T-335 region of
`gate-run.mjs` contains zero occurrences of `dist`, `src`, `parser`,
`.ts` or `.js` as literals — every such spelling in the diff is in prose.
And the generality control M6 said had to be built: I moved the parser's
declared roots on disk (`src` to `sources`, `dist` to `build`), changed
only `tsconfig.build.json` and the two import specifiers, rebuilt, and
`packageBuilds` followed the declaration to
`{src: lib/parser/sources, out: lib/parser/build}` while `deriveOwning`
still selected exactly the two importers, naming the configuration in its
`via` sentence. A1.2 disproved by planting a third, previously unknown
direct importer: selected automatically. A1.7 disproved twice — one
direct import reaches SIXTEEN files under the output root, and a planted
spec reaching the entry only through a helper was selected. A1.6
disproved: the diff changes zero manifests and the end-to-end package
still declares no dependencies. A1.11 satisfied by the table above.

**A1.8 is the one row the implementation passes and the BODY does not.**
The coupling is directory-granular, so a non-entry source behaves
identically — I measured that with `fence.ts`. But the body moves
`lib/parser/src/pure.ts` and only that, which is the build entry itself,
so it cannot tell this implementation from an entry-point-only one.
Correction 1.

#### AC2 — PROVEN, and the fail-closed branch is real

A2.2 was phase one's sharpest demand: a mutant making the unreadable case
answer something OTHER than the whole battery, with the body dying on it.
It exists and it does. Making the `generatedUnplaceable` branch in
`deriveOwed` unreachable kills the criterion-2 body ALONE — the other
three survive.

A2.6's three unreadability shapes all fire from DATA ON DISK through the
real CLI, in arrangement B, over the range above. Absent config,
malformed config, and — the shape phase one said implementations miss —
a valid config whose declared output root does not contain the entry.
Each answers the whole battery, and each NAMES `lib/parser/dist/pure.js`
with a different and correct reason: "could not be read", "is not
readable as JSON", "declares no output root that contains it". A2.4 is
not satisfied by any string; the sentence discriminates the cause.

A2.5 answered on the mechanism: `whole: true` produces the UNFILTERED
leg argv, identical to the registry's own, against a filtered argv when
the leg is narrowed. X7 satisfied — the body asserts the emitted set, and
uses the exit only on the `--owning` arm, where the exit does
discriminate.

**A2.3 stands as a body defect.** The criterion-2 body induces
unreadability by handing `generatedEntries` a synthesized `builds` input
with the parser's entry emptied. That is the stub shape phase one asked
me to refuse. The code is right — I proved all three disk shapes myself —
but the body leans on an injected value for the arm it exists to pin.
Correction 2.

#### AC3 — PROVEN, on a stronger reading than the body's own

I ran the base script and the tip script over SEVEN real ranges in
arrangement B and compared the COMPLETE owed set — suites, leg, `byPath`,
`unplaceable` and the fail-closed sentence, not the spec count alone.
Six are byte-identical: a lone app source (`app` only), a lone end-to-end
spec (exactly one spec file), `README.md` (whole battery, fail-closed),
two task cards (12 spec files each) and an eighteen-path range spanning
Rust and docs. The seventh is the parser source, which moves, and is the
one this arm exists to move. A3.3 is answered — the controls are narrow
and discriminating — and A3.4 with them, because the comparison was the
complete set.

A3.1 is a provenance note rather than a failure: the body's own
comparison is the same function with and without its new inputs, which
faithfully reproduces the base because the base had no such parameters,
but it is not a base-ref reading. Mine is, and it agrees. No golden
exists to regenerate, so A3.2 is moot.

#### Cross-cutting

**X6 is CLEARED.** The T-335 region executes nothing: zero dynamic
`import()`, `require()`, `eval`, `new Function`, `execSync` or
`spawnSync`. It opens exactly three inputs — a graded package's own
`package.json`, the TypeScript project that manifest's build script
names, and the tracked corpus from `git ls-files` through a pre-existing
helper that passes an argv array. All three are TRACKED, which is the
discriminator my grounds redirected this row to, and none lies under an
output root. The rejection of the source-map shortcut is real and was
available: `tsconfig.build.json` turns on `sourceMap` and
`declarationMap`, so the `sources` arrays exist on a built tree and were
declined anyway.

One finding against that clearance, and it is Correction 3:
`resolveTsconfig` follows an `extends` chain without containing the
resolved path to the repository root, so repository-authored content can
direct a read outside it. Read-only and JSON-only, but a crafted specifier
can surface a fragment of an out-of-tree file in the fail-closed sentence
this derivation prints into CI logs.

**X2 answered in the NEGATIVE, which the lane did not claim.** I built the
mutant phase one asked for: removing the source-root containment test in
`generatedEntries`, so the relationship is consulted for every changed
path. It kills the criterion-3 body ALONE and leaves criterion 1 green.
The two kill sets are therefore not contained, and criterion 3 is not a
restatement.

X1's DATA mutant is owed and passes. Altering the real declaration —
`rootDir` from its own value to a directory that does not exist — kills
all four bodies. The report argued a data mutant was not owed separately;
it is, and the property survives it.

X3: the fence holds exactly. The diff is three paths — the two in
`touches:` and this card. X4: the design note was written and I do not
grade it, honouring phase one's pre-commitment. X5: one behavioural
change maps to no criterion — four new diagnostic fields on
`owedForRange`'s `explain`, one of which (`generatedEntriesReached`) is
read nowhere at all. They are absent from `--owed-set` stdout, so nothing
observable at the CLI turns on them; noted, not charged.

#### The three expected reds, tested rather than accepted

I ran `push-guard.spec.ts` whole on this unfenced bench: **123 passed, 0
failed**, read off the failed count and not the last line, including all
three bodies named in the hand-off. That is the control the attribution
needed. Green at 644 and red at 444 confirms T-333's mechanism — the
second `copyFileSync` onto a destination the first left read-only — and
confirms these reds are the lane fence's, not this diff's.

#### What I measured, with exits

Arrangement B unless stated. `gate-run.spec.ts` whole: **89 passed, 0
failed**, exit 0, all four new bodies among them. `push-guard.spec.ts`
whole: 123 passed, 0 failed, exit 0. `typecheck` 0, `lint:docs` 0,
`lint:tokens` 0. `capabilities:check` **exit 1 — STALE by 531 bytes**,
119521 committed against 120052 fresh, exactly the figure the lane
reported. Seven base-versus-tip range comparisons, all exit 0. Six
mutants, each restored to a clean tree.

GRAPH REGEN verified on the mechanism rather than an exit code, as the
hand-off asked: `docs/architecture/graph.json` contains zero occurrences
of `tools/e2e`, none of the six new exported symbols, and — the control
that makes it scope rather than staleness — none of three PRE-EXISTING
exported symbols from the same file either. The regeneration produces
nothing for this diff.

The unconditional arm's cost is real but small: ~0.19s base against
~0.20-0.26s tip over three runs each on one range.

#### What the integrator owes at the merge

1. Regenerate `docs/CAPABILITIES.md` and `docs/INDEX.md` in the merge
   commit — `capabilities:check` is red by 531 bytes and both files are
   outside this lane's fence.
2. Nothing for the graph: verified inert above.
3. The three `push-guard.spec.ts` reds are T-333's and will reappear in
   any fenced lane. They are green on an unfenced tree.
4. Apply the three corrections below, each with its drill.

**ALL THREE CORRECTIONS CARRY A MUTANT BLOCK BELOW AND NONE OF THEM NEEDS
NONE**, correction 3 included: it is a hardening, but it is a hardening a
body asserts, so it is drillable and it is drilled. Each block was applied
from a pristine copy of `tools/e2e/scripts/gate-run.mjs` at `bab0e1a2`,
run against its own named body, and the file restored byte-identically
before the next. **Both anchor counts were checked for all three before
the run and each time the applier refused unless `old` matched EXACTLY
ONCE and `new` matched NOWHERE** — it printed `old x1 / new x0` for every
one. Each mutant made its named body, and only its named body, red.

#### Correction 1

```mutant
correction: Correction 1
file: tools/e2e/scripts/gate-run.mjs
spec: tools/e2e/tests/gate-run.spec.ts
body: a range that moves a parser SOURCE alone selects every spec that reaches the parser's built entry, over the live tree and a real range
message: criterion 1: tools/e2e/tests/brief.spec.ts reaches the parser's generated entry, so a parser source selects it
--- old
      byPackage[id].push({
        config: rel,
        src: path.posix.normalize(path.posix.join(dir, srcDir)).replace(/\/+$/, ""),
        out: path.posix.normalize(path.posix.join(dir, outDir)).replace(/\/+$/, ""),
      });
--- new
      const entrySources = Object.values(
        /** @type {Record<string, unknown>} */ (
          /** @type {Record<string, unknown>} */ (pkg ?? {})["exports"] ?? {}
        ),
      )
        .map((t) =>
          typeof t === "string" ? t : /** @type {Record<string, unknown>} */ (t ?? {})["import"],
        )
        .filter((t) => typeof t === "string");
      for (const target of entrySources) {
        byPackage[id].push({
          config: rel,
          src: path.posix
            .normalize(
              path.posix.join(
                dir,
                srcDir,
                String(target).replace(/^\.\//, "").replace(/^[^/]+\//, "").replace(/\.js$/, ".ts"),
              ),
            )
            .replace(/\/+$/, ""),
          out: path.posix.normalize(path.posix.join(dir, outDir)).replace(/\/+$/, ""),
        });
      }
```

The mutant is A1.8 written as a plausible implementation: the sources a
package builds are read as the ones its manifest's `exports` name. In
`gate-run.mjs` the `old` block occurs EXACTLY ONCE and the `new` block
occurs NOWHERE; both counts were checked by the applier before it wrote.

**AND THIS IS WHERE THE CORRECTION EARNS ITS PLACE.** Under the mutant the
declared source roots become `lib/parser/src/index.ts` and
`lib/parser/src/pure.ts`. A range moving `lib/parser/src/pure.ts` — the
path the body moved BEFORE this correction — still selects both
importers, so the body as it stood would have passed. A range moving
`lib/parser/src/fence.ts`, which is what it moves now, selects NEITHER,
and the body dies on "criterion 1: …/brief.spec.ts reaches the parser's
generated entry" with an empty received array.

#### Correction 2

```mutant
correction: Correction 2
file: tools/e2e/scripts/gate-run.mjs
spec: tools/e2e/tests/gate-run.spec.ts
body: a generated file no build configuration can place makes the owed set the WHOLE battery and the answer NAMES the file
message: absent: no output root read off disk contains the entry
--- old
      if (reading.problem !== undefined) {
        notes[id].push(reading.problem);
        continue;
      }
--- new
      if (reading.problem !== undefined) {
        notes[id].push(reading.problem);
        byPackage[id].push({ config: rel, src: `${dir}/src`, out: `${dir}/dist` });
        continue;
      }
```

The mutant is the silent pass wearing a fail-closed label: a package whose
project cannot be read gets an INVENTED relationship instead of a reported
inability, so the arm never fires. The `old` block occurs EXACTLY ONCE in
`gate-run.mjs` and the `new` block NOWHERE; both counts were checked
before the write.

Its power is the correction's: under the mutant a package whose project is
absent on disk yields a confident `src` and `out`, while the real tree's
own reading is untouched, so the body as it stood — which built its blind
case by hand — still passed. Only the disk-induced section dies.

#### Correction 3

```mutant
correction: Correction 3
file: tools/e2e/scripts/gate-run.mjs
spec: tools/e2e/tests/gate-run.spec.ts
body: the emit relationship is READ off the owning package's own build configuration, so a package that moves where it builds to moves this derivation with it
message: the climbing specifier is refused by name rather than opened
--- old
  if (rel === ".." || rel.startsWith("../") || path.posix.isAbsolute(rel)) {
--- new
  if (false && (rel === ".." || rel.startsWith("../") || path.posix.isAbsolute(rel))) {
```

The mutant disables the guard rather than deleting it, so BOTH anchors are
real text and the verb can count them: the `old` line occurs EXACTLY ONCE
in `gate-run.mjs` and the `new` line NOWHERE. With the guard inert the body
dies on "the climbing specifier is refused by name rather than opened".

The guard refuses BY NAME and returns the same shape an absent file
already returns, so no caller learns a new case and nothing about the
fail-closed contract changes. Note for the record that a `problem` raised
inside an `extends` chain does not propagate to the outer reading — the
outer file simply declares no `outDir` and fails closed correctly, which
is why this is a hardening rather than a defect in the answer.

#### The corrected tree, measured

`gate-run.spec.ts` whole after all three corrections: **89 passed, 0
failed**, exit 0. `typecheck` exit 0. Each mutant was applied from a
pristine copy, drilled, and the file restored byte-identically before the
next.
