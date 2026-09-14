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

### 2026-09-14 — APPROVED WITH ASSIGNED CORRECTIONS — claude-opus-5@subagent

Verified on the GUARDED tier as a two-spawn bench. The attack set was
written at the base by a spawn holding no tools and no diff; this pass
holds tools and read the diff before the executor's report. Bench
worktree detached at the lane tip 6b0aa90aa5a2265bb3555ffbcfbfa7367ae448ee,
base 74dc490cc8f2e6cb2139955e8c6988518a416ed8.

SEALS, all re-computed on this bench and all matching:
sha256 4a953131710466d7bb286cc7bb3678e788a6bd41e9ff094a2bc247036047a504
the attack set; sha256
1f667579377b399227f089a88bb841f572d497ef76d8a1faa1b7e4ecfa4c9667 the
ground; sha256
b6644cd7246a5479d0db2306c6b846a05ca653c4d92f42bf85cf9135b70a9dc1 the
card at the base. The measurement transcript sealed beside the ground is
sha256 463a648aa9760306aacfed9931434758a84979121b72667e680320a3721fe13d.

WHOLE BATTERY AT THE TIP 6b0aa90a, one run, all four legs GREEN: parser
exit 0 over 454 bodies (raw `454 passed`), app exit 0 over 1171 (raw
`1171 passed`), rust exit 0 over 655 across 18 targets (18 `test result:
ok` lines), e2e exit 0 over 1102 (raw `1102 passed (16.9m)`). This is the
verifier's full leg, not the executor's 870-body narrowed scope.

#### A row per acceptance criterion

CRITERION 1 — a stated way to keep a planted instance, on the rename
class's model, a classifier rather than a path list. **MET.**
`FIXTURE_CLASSES` and `fixtureClassOf` in tools/e2e/scripts/merge.mjs,
stated there in prose and in docs/CONVENTIONS.md's merge-arm bullet. The
decision is a conjunction of the matched VALUE against an anchored
pattern and the SITE against a path or directory token, so the site is
necessary and not sufficient: I planted a value one character off the
enumerated one at the very file the table names and it refused, and a
different synthetic address inside the named directory refused. The
attack set pre-committed (P-0.1) that a decision keyed on path inside a
function fails this criterion however it is named; I armed that reading
as a mutant — the value test removed, leaving the site alone to decide —
and it reds 3 bodies. On the rename model: table-driven the way
`KEPT_CLASSES` is, and STRONGER than it, because the ground's own
measurement M2 records the rename classifier as per line and per file
while this one is per value. The executor disclosed that asymmetry and
filed T-295-s16 on it.

CRITERION 2 — refusal survives where no classification applies, with a
body showing it on a planted instance that is not a fixture. **MET.**
I compared the refusal text of every class between the base module and
the tip module over identical input: all 7 refusal strings are
BYTE-IDENTICAL, and the 6 substrings the ground's M15 records as pinned
survive in their own class's message. The attack set refused the cheap
reading of this criterion (P-0.2, A2.3): a refusal body that differs
from the allowed one only in WHERE the value sits passes under a path
list and proves nothing. The diff carries the stronger pairing — a
near-match credential and a near-match address at the SAME file the
table names, location held constant and only the value varied — and the
outside-the-site arrangement beside it. Short-circuiting (A2.6) is
closed both ways: I put the kept value ahead of the unkept one on a
single line and behind it, and both arrangements refuse while announcing
the kept one. The two machine-derived classes cannot be classified at
all, which a body asserts and which I re-measured at a named site.

CRITERION 3 — an exercised way through says so out loud, as
`--blocks-absent` does. **MET.** The step emits `NEWS — ` per kept file,
class and table entry, on stderr, in default output with no flag and no
verbosity dial — the same spelling and the same stream the ground's M3
records for the acknowledged drill, which is the one reference the
criterion names. The announcement carries the file, a count, the shape's
own description and the table entry that fired, and it REDACTS the value
for the reason the refusal does; a body asserts the absence of both
planted values from the text. The attack set flagged (A3.2) that an
announcement echoing the value would make the announcement a new
forbidden line — the build does not echo it. Nothing is announced on a
run that kept nothing (A3.3), asserted in the body's control arm and
re-measured here. The expectations are literals, not constants imported
from the implementation (A3.4). And the announcement is proven by a
DIFFERENT assertion than the decision is: my mutant at the announcement
site reds one body alone, disjoint from the set the decision mutants red
(A3.5).

THE AMENDMENT OF 2026-09-13 — bounded classification. Met on every row
but one. Only explicitly synthetic inputs are permitted, under a
recognition rule stated in the fenced document; a spec filename, a
fixture comment and placement in a test directory qualify nothing alone;
the exception is per matched value and per class, which a mutant making
it per line reds; the four bodies the amendment names are present with
independent arrangements. The row that is NOT yet kept is the last one —
the amendment forbids claiming an arbitrary credential-shaped value
harmless for sitting in a test, and the table AS SHIPPED does not claim
it, but the guard that is supposed to keep the NEXT entry honest does
not enforce the half of the rule that would prevent the claim. That is
correction 1 below, and it is the only thing standing between this diff
and a clean approval.

#### Correction 1 — the admission body keeps the literal-not-shape half of its own recognition rule

THE FINDING. The recognition rule says a table entry names the value "by
an anchored pattern, a literal and never a shape" — in
tools/e2e/scripts/merge.mjs's own paragraph, in docs/CONVENTIONS.md's
merge-arm bullet, and in the comment on the body at
tools/e2e/tests/merge.spec.ts, which says of a shape pattern that it
"would claim an arbitrary credential-shaped value harmless for sitting
in a test, which the card's amendment forbids in as many words" and then
says "This is the body that keeps it." It does not keep it. The body
asserts that the pattern is anchored at both ends, that the entry names
a site, that no site is one of four spellings of the whole tree, that no
entry covers a machine-derived class, and — for address entries only —
that every domain the pattern spells is one the standards reserve. An
anchored CLASS SHAPE satisfies every one of those.

THE MEASUREMENT. I added an entry to the table the way a later card
would add one — a bearer-token class shape over the suite's own spec
tree — and ran the whole of merge.spec.ts: 46 passed, exit 0, NO BODY
RED. The same for a credential class shape over a scripts directory: 46
passed, exit 0, no body red. With either entry in place the keeper
answers an ARBITRARY value of that class at that site with 0 findings
and 1 announced exception. That is the amendment's own prohibition,
reached one entry after this one.

WHY IT IS A CORRECTION AND NOT A REJECTION. The three entries this diff
ships are literals and the table as built is sound; I re-ran the keeper
over this lane's whole 788-line diff and it answers 0 findings and 3
announced exceptions, where the base module over the identical added
lines answers 3 findings and stops the merge. The criteria are met. What
is missing is one assertion in a body whose own comment already promises
it, and the executor's paragraph already commits to a body being the
keeper of the admission rule rather than the paragraph.

THE FIX, and the block below carries it: the same body reads each
entry's pattern source, takes the anchors off, splits an outer
alternation, and requires every alternative to be a literal whose only
escape is an escaped dot. I validated the predicate before assigning it
— it passes all 4 alternatives the 3 shipped entries spell, and it reds
a credential class shape, a bearer-token class shape, a private-key
block shape, a local-part wildcard at a reserved domain, a dot wildcard,
and the shape branch of an alternation that mixes a shape with a
literal. I did not extend the block to the breadth of a `files` token:
with the pattern held to a literal, a broad site keeps exactly one
enumerated value and stays bounded, and widening the site rule is an
argument the card did not have.

BOTH READINGS, on this bench and at the tip the figures above name. The
body is GREEN against the implementation carrying the property — the
table as this diff ships it — at 46 passed. It is RED against an
implementation lacking it: with a bearer-token class shape added over
the suite's own spec tree, 45 passed and this body alone red, exit 1;
with a credential class shape added over a scripts directory, the same.
Both of those mutants SURVIVED the body as the lane wrote it, at 46
passed and exit 0, which is the shortfall the block repairs.

```mutant
correction: Correction 1 — the admission body keeps the literal-not-shape half of its own recognition rule
file: tools/e2e/tests/merge.spec.ts
spec: tools/e2e/tests/merge.spec.ts
body: the fixture table's admission rule is kept by this body — every entry names a VALUE and a SITE, and no entry can reach the machine's own facts
message: names the VALUE and not its SHAPE
--- old
    expect(entry.pattern.source.startsWith("^"), `${entry.id} is anchored at its start`).toBe(true);
    expect(entry.pattern.source.endsWith("$"), `${entry.id} is anchored at its end`).toBe(true);
    // AND THE PATTERN NAMES THE VALUE RATHER THAN ITS SHAPE, which is
    // the half of the recognition rule an anchored SHAPE satisfies while
    // defeating it: a class pattern anchored at both ends keeps EVERY
    // credential of that class at every site the entry names, which is
    // the claim the card's amendment forbids in as many words. Read off
    // the pattern's own source — anchors off, an outer alternation split
    // — and every alternative has to be a literal whose only escape is
    // an escaped dot.
    const bareSource = entry.pattern.source.replace(/^\^/, "").replace(/\$$/, "");
    for (const alternative of (/^\(\?:(.*)\)$/.exec(bareSource)?.[1] ?? bareSource).split("|")) {
      expect(
        /^(?:[A-Za-z0-9@_%+-]|\\\.)+$/.test(alternative),
        `${entry.id} names the VALUE and not its SHAPE`,
      ).toBe(true);
    }
    expect(entry.files.length, `${entry.id} names at least one site`).toBeGreaterThan(0);
--- new
    expect(entry.pattern.source.startsWith("^"), `${entry.id} is anchored at its start`).toBe(true);
    expect(entry.pattern.source.endsWith("$"), `${entry.id} is anchored at its end`).toBe(true);
    expect(entry.files.length, `${entry.id} names at least one site`).toBeGreaterThan(0);
```

#### The controls I armed, and what each killed

Ten mutants, each run against the whole of tools/e2e/tests/merge.spec.ts
on this bench, each restored, every restore proved by sha256 against the
pre-drill digests
8cc97d853261a187f5514df95c355d823d44992998c55ed68d30e0258629ed75 for
merge.mjs and
6f4dc14368dbd577c1ff8ce60037a4cfee4de4a6ee0a3d566e8e437cd907123c for
merge.spec.ts.

- site test removed — 4 red, two of them bodies that predate this card.
- value pattern removed, the path-list build — 3 red.
- the step's announcement dropped — 1 red, and a different body from any
  the decision mutants reach.
- keep-everything — 7 red, including every refusal body.
- keep-nothing — 3 red, including the allowed-fixture body and the
  end-to-end one.
- the exception made per line — 1 red, the per-value body alone.
- an address entry moved to a deliverable domain — 4 red.
- the credential entry's literal swapped for its class shape — 1 red,
  and that kill is INCIDENTAL: the near-match body catches it only
  because its planted near-match happens to share that class and that
  site. The two mutants that remove the incidental coverage — a class
  shape added for a class no near-match body exercises, at a site no
  body probes — BOTH SURVIVE. That pair is the evidence for correction 1
  and the block below kills both.

CONTROL 1 OF THE ATTACK SET, SUBSTITUTED AND SAID SO. The attack set
asked for the new bodies run against the base implementation, and ruled
that the control fails if it reds for an import error rather than for
the property. It would: the new bodies call a function the base module
does not export, so the spec cannot load at all. I substituted the
control that isolates the property with the arming differing at exactly
the implementation — the base module and the tip module over the
IDENTICAL added lines of this lane's own diff, 3 findings against 0
findings and 3 announcements — and I confirmed the two shape constants
are unchanged across the diff, which is what rules out the attack set's
A1.7, a keeper weakened rather than a value kept.

#### Notes, none of them assigned

- X-1 DISSOLVES. The card says the merge that matters is done by a
  script that predates this arm, so every criterion could pass unused.
  The ground's M5 records that there is one merge program in the tree and
  the keeper is shared code, and I reproduced the card's own stop and its
  repair end to end over the lane's real diff. The card's "in practice
  nothing is blocked today" no longer holds, and the diff is exercised.
- NO AMBIENT BYPASS. The table and its reader are referenced from the two
  fenced files and nowhere else; there is no environment variable, no
  flag and no marker comment, and the wholesale keeper toggle in the
  process schema is the inherited one. The decision is a pure function of
  the diff and committed content, identical over repeated calls.
- NO NORMALIZATION SKEW. The rule is asked with the EXACT substring the
  shape matched, anchored, so the matcher and the rule cannot disagree —
  a case variant and a value carrying a zero-width character are both
  refused. A sibling directory sharing a prefix with a named directory
  does not inherit it.
- BACKTRACKING IS NOT THIS DIFF'S. Moving the address shape from one match
  to every match costs 0.3ms against 1.0ms over this lane's 788
  added lines. On a line built to bait the address shape the base and the
  tip are within 2 percent of each other, so the exposure is the shape's
  and predates the diff.
- THE STEP-LEVEL MIXED CASE HAS NO BODY. The step prints the
  announcements before it prints the findings, so a run that keeps one
  value and refuses another says both; only the function-level bodies
  cover that pairing. Worth a sentence in a later card rather than a
  correction.
- THE DOC COMMENT ON THE REPORT says every value a shape matched is
  asked separately. True of the credential and address classes; the two
  machine-derived classes still pass a single value. No behavioural
  consequence, because neither can ever be kept.
- THE CENSUS IS STALE BY CONSTRUCTION at this tip — 4 bodies added — and
  the regeneration belongs to the merge. The executor said so and I
  confirm the figure below at my own tip.
- THE CARDS THE EXECUTOR FILED are accurate against what I measured.
  T-295-s15's subject is live already: the address entry naming the two
  values this keeper's spec plants matched NOTHING in this lane's diff,
  because those lines are already in the tree rather than added by it.

#### Postscript — the step-7 readings, at MY OWN tip 1ccb9e6b

A figure measured at the commit I was sent is stale at the tip my verdict
and my correction created, so the whole battery was run again after the
correction body and the filed card were committed.

WHOLE BATTERY at 1ccb9e6bda0e130a1401139a1735b88bd1dc606e, all four legs
GREEN, exit 0: parser 454 bodies (raw `454 passed`), app 1171 (raw `1171
passed`), rust 655 across 18 targets (18 `test result: ok` lines), e2e
1102 (raw `1102 passed (17.3m)`). Identical counts to the reading at the
lane tip, which is the reading I expect: the correction adds assertions
inside a body that already existed, so it moves no body count. The
push-guard body that reds when two hook runs straddle a minute boundary
(T-314-s5) did not fire in either run.

CENSUS — STALE BY CONSTRUCTION, reported and NOT regenerated on this
bench. `capabilities:check` at my tip: committed 102360 bytes against a
fresh generation of 102875, exit 1 — the 4 bodies this diff adds. The
figure is byte-for-byte the executor's at the lane tip, which confirms
the correction adds no body. docs/CAPABILITIES.md is outside this card's
fence and the merge regenerates it.

GRAPH — `index --check` at my tip answers CURRENT: graph.json matches a
fresh index at 1228940 bytes over 203 files, 2626 symbols and 2505
edges, and the budget line reads 1228940 of 2145959 bytes (57.3%) with
917019 left. The graph does not index tools/e2e, which is why a diff of
this shape moves it not at all.

THE COMMITS THIS BENCH CARRIES, in order after the lane tip: the verdict
at acc97980; the correction body at 36a0a400, in
tools/e2e/tests/merge.spec.ts, the file the block names; and T-295-s17
filed at 1ccb9e6b. The spec the verdict names is inside this card's own
fence, so the merge needs no widening on the integration branch before
it lands.

FILED FROM THIS PASS — T-295-s17: the keeper announces a kept spelling
to stderr and nowhere else, so a merge that exercised an exemption
commits no trace of having done so; the ledger holds a step id, a title
and an exit, and the merge message is written from the verdict's own
sentences. Criterion 3 is met as written and as referenced — that card
is about the record, not the step.
