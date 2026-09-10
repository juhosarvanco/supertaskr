---
id: T-307
title: "The seat proposes before it records — an entry for a room or a decision record is shown to the owner in the conversation and appended only on the owner's yes; entries paraphrase a ruling with its date and never quote the owner, who appears as the owner; the method text states the rule once and an eval holds it"
feature: F-01
milestone: 4
size: S
priority: 2
status: done
suggested_by: "the owner, 2026-09-10: the seat had appended sections to rooms on its own judgment and quoted the owner's messages; the owner asked to be shown what will be added before it is added, endorsed the proposed-then-appended form as the right model, and asked for it as a rule"
blocked_by: []
touches: [method/roles/orchestrator.md, method/rooms/ROOM-FORMAT.md, method/docs-templates/decisions/000-template.md, tools/method-evals/, tools/e2e/tests/brief.spec.ts, docs/CAPABILITIES.md]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
verified_by: claude-opus-5@subagent
review: independent
---

## What was measured

On 2026-09-10 the architect seat appended six sections to one room on its own judgment and quoted the owner's chat messages in rooms and decision records; the owner later found the quotes unfit for a public reader and asked to be shown every addition first. From that moment the seat proposed each entry in the conversation and appended it only on a yes, paraphrasing rulings with their date — and the owner called that the right model and the language right. The rule lives today only in the seat's memory notes; nothing in the method states it and nothing holds it.

## Acceptance criteria

- WHEN the orchestrator's role file is read THE rule SHALL be stated once: an entry for a room or a decision record is proposed to the owner in the conversation, verbatim as it will be written, and appended only on the owner's yes; cards, checkpoints, STATE and the seat's own ledger are the seat's records and need no ask.
- WHEN a ruling is recorded in a room or a decision record THE entry SHALL paraphrase the ruling with its date and SHALL NOT quote the owner's message; the owner SHALL appear as the owner, never by name — stated once in ROOM-FORMAT.md and in the decision template.
- WHEN the method eval gate runs THE rule SHALL have an eval that fails on a room entry carrying a quoted message or a personal name, seen failing before it is believed.
- The method stamp SHALL be bumped at the merge (the role file and the templates are kit files); the one line pointing CONVENTIONS' records bullet at the rule is the integrator's write at the merge, outside this fence, so this lane can run beside T-295, which holds CONVENTIONS.

## Implementation notes

Built in the T-307 lane on `task/T-307-propose-before-recording`, base
`a00acf00bf6000d646c96218986032b599c2159c` (the dispatch stamp). Four
files: the rule stated ONCE in each of three method files, and one new
model-free eval holding the half a program can see. Every figure below
was re-derived in this lane; where a figure came from the card it is
named as such.

**Criterion 1 — the rule, once, in the orchestrator's role file.**
`method/roles/orchestrator.md` gains step `8b`, beside the step that
already says everything a seat decided goes into a file NOW. An entry
for a room or a decision record is PROPOSED to the owner in the
conversation, verbatim as it will be written, and appended only on the
owner's yes; cards, checkpoints, STATE and the seat's own ledger are the
seat's own records and need no ask. The step argues the split as VOICE
rather than importance, carries the sitting it was measured on, and
refuses a summary standing in for the text — the same distinction the
file already draws where an amendment reaches a verifier. It names the
ACT only and points at the two files that own the WORDING, so no
sentence is stated twice (T-057).

**Criterion 2 — the wording, once in each record format.**
`method/rooms/ROOM-FORMAT.md` gains two bullets in its Rules list: an
entry paraphrases the ruling and dates it, never quoting the owner's
message and never the owner's name (the owner appears as the owner);
and that rule looks FORWARD ONLY — entries written before a project
adopted it are records and are not restyled, re-quoted, redacted or
deleted to comply, which is the file's own append-only rule meeting the
case it did not anticipate. `method/docs-templates/decisions/000-template.md`
gains the same instruction as a filler's comment under `Decided in:`,
self-contained rather than pointing at ROOM-FORMAT: that file rides the
genesis kit and ROOM-FORMAT deliberately does not (derived from the
`KIT_FILES` table in `app/src-tauri/src/agent/kit.rs`, whose own doc
comment names the exclusion), so a pointer would be dead in every
scaffolded project.

**Criterion 3 — the eval, seen failing first.** `MF-11` in
`tools/method-evals/evals/mf-11-room-entries-paraphrase.mjs` reads every
room entry dated on or after a floor and refuses two shapes: a
quotation-mark-delimited run of four words or more attributed to the
owner or to `@human`, and a personal name. The corpus/`degraded`/
`control` shape of the suite is kept, so the positive control is exact.

- **THE FLOOR IS THE DAY AFTER THE RULE LANDS, AND THE CARD'S OWN VALUE
  WOULD NOT HOLD.** The card asked for entries dated on or after the day
  the rule lands, 2026-09-10. Measured in this lane: three rooms carry
  entries dated 2026-09-10 in exactly the shape the eval refuses, because
  the sitting that ASKED for the rule is the sitting that wrote them. A
  2026-09-10 floor therefore reds on the records the rule exists to
  protect — the one outcome the card forbids. The floor is `2026-09-11`,
  the first day whose entries are written under the rule, and the eval's
  header carries this argument.
- **THE NAMES ARE DERIVED, NEVER TYPED.** The owner's name is the string
  this tree must not gain another copy of, so the eval reads the
  repository's own commit identities and drops machine identities and
  any token the method's own product-agnostic text already uses as a
  word. That last filter is what keeps `verifier` and `claude` — both
  real author identities in this history — out of the set. At this ref
  the set is 4 tokens. An empty set is a CANNOT_RUN, never a pass.
- **THE CHECK CARRIES ITS OWN DISCRIMINATION PAIR**, because on the day
  this lands the in-scope set is EMPTY and an audit over zero entries is
  a green that means nothing. `check()` runs the same audit over two
  synthetic entries dated after the floor — one written the old way,
  which must be caught on both counts, and its paraphrased twin, which
  must come back clean — and FAILS saying so if the pair ever stops
  discriminating. The shape and the reason are `kit.rs`'s skill body's.
- Coverage at this ref: 16 rooms, 115 entries, 0 in scope, 4 identity
  tokens, the planted twin caught on 2 counts.

**Criterion 4 — the stamp does not move in this lane.** `method/` is
touched, so the method version is owed a bump — and its three copies
(`app/src-tauri/src/agent/kit.rs`'s `METHOD_SNAPSHOT_VERSION`,
docs/CONVENTIONS.md's gotcha stamp and changelog, and
`method/interview/plan-interview.md`'s output heading) are all outside
this fence, as is the one CONVENTIONS line pointing its records bullet
at this rule. Both are the integrator's write at the merge. The lane's
own reading of the bump obligation is in the block below; the eval
bullet forbids transcribing it, so the integrator runs it again at its
own ref.

### The drills — one mutant per new body, seen red, restored, hashed

**Mutant 1 (on disk, through the gate's own spelling): the floor.**
`MF-11`'s protection of the records IS the floor, so the mutant moves it
back to `2026-08-01` and brings the real rooms into scope.

    before  sha256 2ee79adb268f01651af0ebb68bcd5135477b253fd51cf0d40e6bce36553ddf8a
    mutant  export const FLOOR = "2026-08-01";
    run     node tools/method-evals/run.mjs   ->  exit 1
            ..........F  11 model-free eval(s)
            MF-11: 29 finding(s) in 75 entr(ies) dated on or after 2026-08-01
            28 of them QUOTES findings across 10 rooms, 1 a NAMES finding
            in the oldest room, on a name written in 2026-08-14 prose
    restore cp back; sha256 2ee79adb268f01651af0ebb68bcd5135477b253fd51cf0d40e6bce36553ddf8a
    run     node tools/method-evals/run.mjs   ->  exit 0

The mutant is worth more than a synthetic red: it shows the check live
against the real rooms, detecting the exact shape the card describes on
real data, and it shows that the floor — not luck — is what keeps the
records green.

**Mutant 2 (the planted entry the card asked for).** A scratch room with
one entry dated after the floor, quoting a ruling and naming the owner
with a token from the derived set, and its paraphrased twin. Driven
through the eval's own exported audit over an in-memory corpus, which is
the same code path `check()` runs:

    PLANTED      entries=2 inScope=2 findings=2  (one QUOTES, one NAMES)
    PARAPHRASED  entries=2 inScope=2 findings=0

**Mutant 3 (the suite's own positive control).**
`node tools/method-evals/run.mjs --selftest` exits 0 with
`MF-11  a new dated room entry quoting the owner's message is detected:
1 finding(s) name it`.

### Gates, derived from this diff rather than remembered

- METHOD EVAL GATE — FIRES (`method/**`). `node tools/method-evals/run.mjs`
  exit 0, 11 model-free evals; `--selftest` exit 0, 11 positive controls.
- GRAPH REGEN — NOT OWED. The diff carries no `.ts/.tsx/.js/.jsx/.rs`
  file; the one new source file is `.mjs`, which the index crate's own
  `lang_extension_allowlist_is_exact` excludes from the walk by name,
  and `docs/architecture/graph.json` holds no `.mjs` path at this ref.
- BOOT GATE — NOT OWED. Nothing under `app/src/`, `app/src-tauri/` or
  either manifest.
- DOCS GATE — FIRES through the four cards under `docs/tasks/`; the
  whole-tree half (`npm run lint:docs` from tools/e2e) exits 0 and every
  live card's frontmatter parses.

### For the integrator

The bump obligation, measured in this lane and NOT to be transcribed
(the METHOD EVAL GATE bullet's own instruction — run it again at the
merge ref):

    Method evals: model-free exit 0, model-in-loop exit 3.
    Corpus: 11 model-free, 4 model-in-loop.
    Runner: NONE
    THE MODEL-IN-LOOP SET DID NOT RUN, so this bump is NOT gated on it.

### Filed, and deliberately not done here

- `T-307-s1` — the METHOD EVAL GATE fires on a `method/**` diff while
  MF-11's subject is `docs/rooms/`, so a room entry can land in a
  docs-only commit with nothing running the eval. Every file that would
  fix it is outside this fence.
- `T-307-s2` — an entry written after the rule but carrying no date is
  invisible to the date cascade, and it is the entry an evading seat
  would write. Disclosed in the eval's header.
- `T-307-s3` — the rule's own three STATEMENTS have no mechanical
  reader; MF-11 holds the entries. The card asked for one eval with one
  contract, so a second claim inside it was refused.

## Verdicts

### 2026-09-10 — APPROVED WITH ASSIGNED CORRECTIONS — claude-opus-5@subagent (verifier, phase 2)

Judged at `b78f9f507aba638617462ea284d5c02913360977` (the status stamp),
against the base `a00acf00bf6000d646c96218986032b599c2159c`, on the bench
worktree `supertaskr-V-T-307`, detached. The code-and-notes commit beneath
the stamp is `05081fdbcb8c76cc41b68bd830d10c31c241170e`.

**THE THREE SEALED INPUTS, verified by sha256 before anything else was
opened:**

- attack set `b11446dcb6b1e90d39ded249404003f6937c4873df6918d5830362b902488591`
- ground truths `da9b83a2724aaa5da034cd4e2ed448833c30cc58a07b19d29f4b600a51418aec`
- ground addendum `64bf66d15ecc6129852acdcba5eff0660cff9d5f54261aec73d07c04ab9b2eb1`

**THE FRAME I ACTUALLY HAD, and it is weaker than two spawns in one
respect that I have to name.** Phase 1 was a separate tool-less spawn and
its return was hashed before mine began, so the attack set was written
against the card at the base and nothing else — that half of the
construction held. My own brief is hand-written by the seat and carries
NO CONTEXT PACK, which the verifier role calls a dispatch fault; where
that role then says to read the conventions document whole, I read it by
section instead, and I say so rather than claim the standing read. **And
the brief's duties named executor-derived specifics above the line**: it
told me the floor's value and its reason, that the names are derived from
commit identities, the token count, that an empty set is a CANNOT_RUN,
that `check()` carries a discrimination pair, and the coverage triple —
all before I opened the diff. So on those figures I was a corroborator
and not an independent finder, and I say which is which below: the
re-derivations that go past what I was told are the floor's own
counter-measurement, the quotation census, and the two escapes I assign
corrections for.

**PACK GAP.** No pack existed, so every rule this pass leaned on was
found by hand. The one the executor names — the method version bump
gotcha — I confirm is absent from anything I was handed.

## The fence census — clean

Eight paths, and not one outside the fence: the three method files, the
new eval, this card, and three new suggestion cards. `docs/CONVENTIONS.md`
is byte-identical base to tip (blob `6e8c915f`). All nine of T-295's fence
blobs at the tip match the sealed ground list exactly. No room, no
decision record, no other role file, and nothing at all under `app/`, so
`kit.rs` and `KIT_FILES` are untouched — and none was owed, because the
lane added no new file under the templates directory. The method stamp
does not move: both places that spell `0.1.18` lie outside the diff.
House bans over the 805 added lines: no provenance arrow, no absolute
path in any prose, and `rename-scan.mjs` exits 0 over the tree.

## The four criteria

**AC-1 — MET, and it survives every adversarial reading I brought.** The
rule is stated once: a grep for its markers over the whole method tree
returns one hit, in step `8b`. It carries the channel in as many words —
proposed to the owner IN THE CONVERSATION — which was the attack set's
named assigned-correction trigger and is the one that mattered most, since
a rule that lets a seat "propose" into a file it writes itself is the
original failure wearing compliance. It carries VERBATIM AS IT WILL BE
WRITTEN, and then goes past the criterion: a proposal is the text and
never a description of it. The no-ask half names all four record kinds and
closes with a phrase admitting no reading — ask nobody. The inversion I
came to plant is not available: append happens only on a yes, never in the
absence of an objection.

**AC-2 — MET, with one qualification I file rather than assign.** Both
files state paraphrase, date, no quotation of the owner's message, and the
owner as the owner, once each. The date is actionable for a decision
record and for a room TURN, whose heading carries one by format. It is NOT
actionable for a `## Resolution`, which the new bullet names explicitly:
that section's four sub-fields hold no date and the frontmatter above it
has no dated field. Filed as T-307-s5.

On drift: there is none today, and the structure is better than I expected
to find. The role file and the room format point at each other by name,
and I measured that this pointing is MECHANICALLY HELD — rotting either
pointer reds MF-04 with the dangling target named. The decision template
stands alone, and it has to: the kit table ships it and deliberately
excludes the room format and every role file but the planner's, so a
pointer would be dead in every scaffolded project. That is the right call.
What remains is that nothing catches a SEMANTIC drift between the two
wordings — softening the room format's clause alone leaves the whole gate
green — which is the lane's own T-307-s3, correctly filed.

**AC-3 — MET, and the two things that would have made it a rejection both
hold.** The eval is `MF-11`. It is model-free: no client, no fetch, and
its only subprocess is a git read passed as an argument vector, never a
shell string. Rooms are read with the filesystem. I planted a room file
whose name carries a semicolon, a command substitution, backticks and an
ampersand: it was SCANNED — the run reported 17 rooms and 116 entries —
and nothing executed, no marker appeared.

- The false-positive guards, which I had pre-committed to treating as
  reject-grade, both PASS: an entry citing a backticked command beside a
  quoted document title is clean, and so is a paraphrase carrying a short
  quoted artifact name. This matters more than it reads: a check that
  reddens on honest entries teaches a seat to delete true content.
- The positive control is real and I ran it rather than taking the word
  for it. Shipped, the selftest shows this eval detecting its plant.
  Neutered so its audit can only return nothing, it reddens BOTH ways —
  the ordinary check reddens through the discrimination pair inside
  `check()`, and the selftest reddens on its control. That is the
  criterion's "seen failing before it is believed", met twice over.
- It is not a fixture-only eval dressed as a live one. With no plant the
  live run is 16 rooms, 115 entries, 0 in scope, 0 findings, exit 0; with
  the same entry appended to a live room the gate exits 1 and names that
  file. The pair is the disproof, and it comes out the right way.

**AC-4 — MET.** The stamp does not move here and the bump reading is on
the card, flagged not transcribable.

## The floor — the deviation is right, and here is the counter-measurement

The card asked for a floor on the day the rule lands. I re-derived what
that value does, because a floor is the only thing standing between this
eval and the records the method says are never rewritten. **Set to the
card's own value, MF-11 exits 1 with six findings across three rooms,
every one of them on an existing record.** Set to the day after, zero. The
live distribution behind that: 115 entries, 40 of them undated, 22 dated
on the day the rule lands, 9 the day before. And with no floor at all the
eval produces thirty findings including two that name a real person in the
oldest room. The deviation is not a liberty taken; the instructed value
produces precisely the outcome the card forbids, and the eval's own header
carries the measurement rather than asserting the conclusion.

The floor's PLACEMENT is right too. It is a constant in this repository's
own eval, and the kit template carries no date, no name, no product name,
no address and no path — I scanned it, and I scanned the base version to
be sure the defect was not already there. That is exactly where a project
fact belongs and exactly where it must not be.

## Where the names live, and what that costs

Nothing types a name. The set is derived at run time from the
repository's own commit identities, filtered of machine identities and of
every token the product-agnostic method text already uses as a word, held
in memory, never written to disk and never committed. Four tokens at this
ref. An empty set is a refusal to run rather than a pass, which is the
right failure direction. One residue, filed as an observation and not a
defect: a finding message prints the token it matched, so the day the name
half fires it puts a person's name into gate output. It cannot fire today,
because nothing is in scope.

## What the eval does NOT hold, said plainly

Six one-side mutants on the method prose — deleting the rule from each of
the three files, softening the naming clause, inverting the ask, removing
the no-ask half — leave the whole eval gate at exit 0. The method text is
held by the reader's eye and by MF-04's PATH check on the two pointers,
and by nothing else. I state that here so that a green gate is never read
as evidence that those three paragraphs say what they should. The lane
found this itself and filed it.

I also could not reproduce the spec pin I was warned about. Changing the
role file's reading step by one word left the brief spec at 86 of 86
passing: the reader that derives that row keys on a sentence this
particular role file does not carry. There was no hazard here for the lane
to check, and the warning should not be relayed again as fact.

## THE TWO ASSIGNED CORRECTIONS

Both are ESCAPES of the eval — an entry that carries exactly what the rule
refuses and comes back clean — and neither is visible to the eval's own
positive control, because that control plants the one shape the check
already sees. Each is measured on this repository's own data, not on a
case I invented. Each is committed on this bench as a body in the brief
spec, run RED against the eval as it landed and GREEN against the
corrected eval, with the site restored and proved by sha256
`764c7c2a632010a5e485fc1c9a64ad98e9fbad2f811b4912b4d3eaf48a0ebf9a`.

**C1 — a quotation longer than the matcher's ceiling walks past the
eval.** The quoted-run pattern bounds the run at six hundred characters.
Short runs are exempted deliberately and for a good reason; long ones were
exempted by accident, and the long one is the shape the rule exists for —
the subject of this whole card is a pasted chat message. **This is not
hypothetical: I ran the same matcher over the live rooms and decision
records and found 44 quotations of exactly the refused shape, one of them
already 614 characters long.** Written tomorrow, that entry would pass.
The bound buys nothing — the character class is negated and bounded either
way, so there is no backtracking to guard against. RED: the body below
fails with the message it names. GREEN: it passes, and the boundary cases
beside it — the short quotation still caught, the paraphrase still clean —
pass with it, so the probe is not one that flags everything.

**C2 — a leading at-sign takes an entry past BOTH halves at once.** The
name half skips any whitespace token carrying an at-sign, which is right
for an address and wrong for a handle: a handle is the name, spelled the
way a chat spells it. And the quote half cannot cover for it, because the
attribution set holds roles and never a name. So an entry attributing a
ruling to the owner by handle, dated in scope, quoted at length, produces
no finding at all — one character in the attribution greens the whole
eval, and it is one character away from the shape this repository's own
rooms already use. The fix strips a leading at-sign before the machine-fact
test, which leaves an address skipped and a path skipped. RED and GREEN as
above, with the arming absent twice over in the same body: the bare name
was always caught, and an address is still treated as a machine fact.

Both bodies red ALONE — 1 failed, 87 passed, each time, in the whole spec
file — with the message each block names.

```mutant
correction: C1 the quotation ceiling exempts the long pasted message
file: tools/method-evals/evals/mf-11-room-entries-paraphrase.mjs
spec: tools/e2e/tests/brief.spec.ts
body: T-307 C1 — MF-11 refuses a quotation attributed to the owner HOWEVER LONG it is
message: a long quoted run walks past MF-11
--- old
const QUOTED = /"([^"]+)"|“([^”]+)”/g;
--- new
const QUOTED = /"([^"]{1,600})"|“([^”]{1,600})”/g;
```

```mutant
correction: C2 a leading at-sign takes an entry past both halves
file: tools/method-evals/evals/mf-11-room-entries-paraphrase.mjs
spec: tools/e2e/tests/brief.spec.ts
body: T-307 C2 — MF-11 refuses an entry that attributes a ruling to the owner by HANDLE
message: takes the entry past BOTH halves of MF-11
--- old
    const token = raw.startsWith("@") ? raw.slice(1) : raw;
    if (token.includes("/") || token.includes("@") || token.includes(".")) continue;
--- new
    const token = raw;
    if (raw.includes("/") || raw.includes("@") || raw.includes(".")) continue;
```

Two corrections, two mutant blocks.

## The suites, at the tip I was sent, through the blessed runner

    parser  exit 0   389 bodies  1 target    GREEN
    app     exit 0  1171 bodies  1 target    GREEN
    rust    exit 0   655 bodies  18 targets  GREEN
    e2e     exit 0   868 bodies  1 target    GREEN
    method evals            exit 0  11 model-free
    method evals --selftest exit 0  11 positive controls
    brief spec alone        exit 0  86 passed

Every figure the executor reports, re-measured here at my own tip rather
than transcribed, and every one matches. At the base the eval corpus is 10
and exits 0; at the tip it is 11 and exits 0, with every base eval
accounted for and the two figures that moved explained by the diff — the
method cross-reference count rises by one because the new pointers resolve,
and the card count rises by three.

## Findings handed on, not corrections

- The eval reads rooms only. The decision template carries the same
  wording rule and nothing reads it — T-307-s4.
- A Resolution is named by the rule and has nowhere to put a date —
  T-307-s5.
- The eval is quotation-mark-shaped: a blockquoted message and a reported
  one both pass — T-307-s6.
- The ACT is stated only in files the genesis kit does not ship, so a
  scaffolded project gets the wording and never learns to ask; and the
  template's new comment uses a word for the owner that no shipped kit
  file uses. This card's fourth criterion calls the role file a kit file
  and it is not one — T-307-s7.
- An entry carrying no date is invisible; the trigger that runs this eval
  does not fire on a rooms-only commit; nothing holds the rule's own three
  statements. All three were found and filed by the lane itself, as
  T-307-s2, T-307-s1 and T-307-s3, and I confirm each independently.

## Why this is an approval

The card asked for restraint and got it. The rule is stated once, in the
smallest place that can hold it, with the other two files carrying only
the wording and pointing back — and the pointing is mechanically held
rather than promised. The eval reads the real tree rather than arguing
with a fixture it shipped; its positive control fails when it should; its
scope is stated in its own text; it refuses to pass on an empty audit; and
where the card's own instruction would have made it red on records the
method protects, the lane measured that, said so, and deviated with the
measurement attached. The two corrections are escapes at the edges of a
check that is sound in the middle.
