---
id: T-247
title: The dependency-legitimacy gate — a dependency a lane adds must resolve on its registry and predate the card, so a hallucinated or typosquatted package cannot ride a merge into main
feature: F-06
milestone: 4
size: S
priority: 2
status: verifying
suggested_by: "@human ruling (2026-09-08, version sitting): \"approve the v1 five\" — the security layer GSD Core ships (its package-legitimacy gate) and nputer lacks (T-245, map conclusion 6)"
blocked_by: []
touches: [.claude/hooks/landing-gate.mjs, tools/e2e/tests/landing-gate.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
verified_by:
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
