---
id: T-295-s4
title: "The forbidden-spelling keeper has no exemption for a committed test fixture, so a diff that adds one — a credential-shaped token or an example address in a spec's own planted instance — refuses the merge with no way through; the keeper refused T-295's own merge on the verifier's bench"
feature: F-04
milestone: 4
size: S
tier: guarded
priority: 1
status: verifying
suggested_by: "the T-295 verifier (phase 2), 2026-09-10, running the verb against its own card on a shared clone: it stopped at keeper:forbidden-spelling because merge.spec.ts's own keeper body plants an AWS-shaped token and an example address, and both are lines the diff adds"
blocked_by: [T-295]
touches: [tools/e2e/scripts/merge.mjs, tools/e2e/tests/merge.spec.ts, docs/CONVENTIONS.md]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

## What was measured

The verb was run against its own card on a `git clone --shared` under
the scratch directory, with the integration branch at the dispatch base
and the lane branch at the bench tip. It reached the second keeper and
stopped:

    merge T-295: stopped at keeper:forbidden-spelling (exit 1)

with two findings, both against the spec file that tests the keeper —
one line matching the AWS access key id shape and one carrying an
example address. Both are the keeper body's own PLANTED INSTANCES,
which criterion 4 required it to have.

The keeper is doing what its criterion says, so this is not a defect in
it. What it lacks is the concept the rename class already has: that
class rides `rename-scan.mjs`'s own classifier, so a spelling that file
KEEPS is kept here, which is what makes a keeper survive its second day.
The secret, address, home and name classes have no such notion, and a
merge that trips one has no way through but to edit the fixture.

In practice nothing is blocked today, because a merge of this card is
performed by the integration checkout's own script, which predates this
arm. The next card to commit a fixture of that shape is the one that
pays.

## Acceptance criteria

- WHEN a line the merge adds matches a forbidden spelling AND the line
  is a planted instance inside a spec that tests the keeper THE keeper
  SHALL have a stated way to keep it, on the rename class's own model —
  a classifier rather than a path list.
- WHEN no such classification applies THE keeper SHALL refuse as it does
  today, and a body SHALL show it refusing on a planted instance that
  is not a fixture.
- WHEN the way through is exercised THE step SHALL say so out loud, as
  `--blocks-absent` does for an absent block — a kept spelling is news,
  never silence.

## Amendment of 2026-09-13 — bounded fixture classification (proposed by the Codex orchestrator's queue review of 2026-09-13, approved by the owner on 2026-09-13)

Amendment proposed 2026-09-13 — bounded fixture classification. At this review's base the integration checkout runs the merge arm, and no corresponding fixture classification exists for the secret, address, home or name checks. The new classifier permits only explicitly synthetic keeper-test inputs under a stated recognition rule; a spec filename, a fixture comment or placement in a test directory alone does not qualify a value. The exception is per matched value and class, so keeping one synthetic instance does not suppress another unclassified forbidden value on the same line or in the same fixture block. Bodies cover an allowed synthetic keeper fixture, the corresponding value outside that fixture context, an unrecognized near-match and a mixed allowed-and-forbidden case. The last three retain the applicable refusal, and each allowed exception is announced. The classifier does not claim to prove an arbitrary credential-shaped value harmless merely because it appears in a test.

## Implementation notes

Built 2026-09-14 by claude-opus-5@subagent in lane T-295-s4, base
74dc490cc8f2e6cb2139955e8c6988518a416ed8.

THE SHAPE. `FIXTURE_CLASSES` in tools/e2e/scripts/merge.mjs is the
table, on `rename-scan.mjs`'s `KEPT_CLASSES` model and exported beside
`fixtureClassOf`. An entry is an id, the forbidden CLASS it covers, an
anchored pattern over the matched VALUE and a list of SITES. The
recognition rule is the conjunction and nothing else: a value is kept
only where one entry names both halves, so a spec filename, a comment
calling something a fixture and a test directory qualify nothing on
their own, and an arbitrary credential-shaped string is refused in
exactly the file whose one enumerated credential is kept. A `files`
token ending in a slash is a directory; the rest are whole paths from
the repository root. Three entries at this tip: the credential literal
this keeper's own spec plants, the addresses it plants, and the suite's
one fixture identity across tools/e2e/tests/.

WHY NO ENTRY COVERS home OR name. Both values are derived from the live
machine rather than from a shape, so a line carrying this seat's own
home directory carries it whatever file it sits in; there is no
synthetic instance of a fact about a disk. A home path stays forbidden,
which is what the redaction of 2026-09-13 already ruled. A body asserts
that no entry names either class.

WHY merge.mjs IS A SITE ON THE CREDENTIAL ENTRY. The table has to spell
the value it keeps, and a table naming a forbidden value refuses itself.
`rename-scan.mjs` meets the same problem and answers it by excluding its
own files WHOLE; this answers it per value, so one enumerated literal is
kept there and every other forbidden value in that file is refused as it
is anywhere else. This lane's own merge is the worked example in both
directions: the table line and the kept planted values in the spec are
lines this merge ADDS, and the values the bodies expect REFUSED are
assembled from pieces at run time because spelling one whole would
refuse this lane's own merge.

PER MATCHED VALUE AND PER CLASS. `forbiddenSpellingReport` replaces the
per-line boolean with every value a shape matched on the line, asks the
table about each, and refuses when any one is unkept. One finding per
file per class is unchanged. `forbiddenSpellingFindings` stays as the
findings half so every caller and body written against it reads what it
always read.

THE ANNOUNCEMENT. The report's `kept` half carries one line per file,
class and fixture class with a COUNT and no value, redacted for the
reason the refusal is; the step prints each as `NEWS — ` on stderr and
walks on, the spelling an acknowledged drill uses.

DOCUMENTATION. docs/CONVENTIONS.md's merge-arm bullet gains the
recognition rule, the admission rule for an address entry, the
home-and-name exclusion, the per-value scope and the announcement. The
existing body comparing that bullet's figures against the program gains
the pin, so the sentence and the table cannot drift apart.

FIGURES, all at the lane tip unless named otherwise. tools/e2e
typecheck exit 0. merge.spec.ts 46 bodies pass in 4.4s, of which 4 are
new (42 at the base). The docs gate FIRES for docs/CONVENTIONS.md and
names `cargo test from app/src-tauri/` and `npm test from tools/e2e/`;
`lint:docs` exit 0; docs/CONVENTIONS.md is 168060 bytes against a
146878-byte warn line and a 176253-byte fail line, and the warn was
already standing at the base at 166550 bytes. The card preflight exits
0. BOOT GATE is NOT OWED: the diff touches no path under app/src-tauri/
or app/src/ and neither manifest. GRAPH REGEN fires at the merge on the
two .mjs and .ts files; no file was added, moved or renamed, so no
component moved. `capabilities:check` reports the census STALE at the
lane tip, 102360 bytes committed against a 102875-byte generation — the
4 new bodies — and the regeneration belongs to the merge, after the
corrections, because docs/CAPABILITIES.md and docs/INDEX.md are outside
this card's fence.

THE OWED SET AT THE GRADED TIP, derived by the blessed gate-runner
over the range from the base to 100725ca and run ONCE (T-279): the
range moves 7 paths and owes all four legs, the end-to-end leg narrowed
to the 17 spec files those paths own. Every leg GREEN at ref 100725ca —
parser exit 0 over 454 bodies, app exit 0 over 1171, rust exit 0 over
655 across 18 targets, e2e exit 0 over 870 across those 17 specs. The
scoped `--owning` reading for the two fenced code paths is a subset of
that e2e scope and was NOT run a second time, which is what T-279 asks.

THE KEEPER OVER THIS LANE'S OWN DIFF, which is the card's own subject
answered against the card's own merge. The 768 added lines of the range
carry 3 file-and-class pairs the keeper judges. At the tip: 0 findings
and 3 announced exceptions — one credential in
tools/e2e/scripts/merge.mjs under `keeper-fixture-credential`, 2 more in
tools/e2e/tests/merge.spec.ts under the same class, and 4 addresses
there under `suite-fixture-identity`. Under the base rule, with the two
shape constants unchanged across the diff, the same added lines give 3
findings and stop the merge.

POISON DRILL, 5 mutants, each run against the whole of merge.spec.ts,
each restored and the restore proved by sha256 against the pre-drill
digest 8cc97d853261a187f5514df95c355d823d44992998c55ed68d30e0258629ed75.
The site check removed: 4 bodies red, including two that predate this
card. The value pattern removed: 3 red. The exception made per line
rather than per value: the near-match body red, alone. The
announcement dropped from the step: the end-to-end body red, alone. A
DATA mutant moving an address entry to a deliverable domain: 4 red. No
mutant survived.

### In-fence follow-through

None. Everything this card's criteria and its amendment name is in the
three fenced files at this tip.

## Verdicts

Promoted 2026-09-13 (the pruning sitting (T-306), the owner's ruling of 2026-09-13): to planned at priority 1 — the forbidden-spelling keeper has no fixture exemption and STATE names it as the thing stopping the merge arm on planted fixtures today. Not dispatched by this sitting.
