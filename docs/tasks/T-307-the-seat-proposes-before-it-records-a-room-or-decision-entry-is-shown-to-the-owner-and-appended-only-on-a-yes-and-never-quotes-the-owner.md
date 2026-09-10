---
id: T-307
title: "The seat proposes before it records — an entry for a room or a decision record is shown to the owner in the conversation and appended only on the owner's yes; entries paraphrase a ruling with its date and never quote the owner, who appears as the owner; the method text states the rule once and an eval holds it"
feature: F-01
milestone: 4
size: S
priority: 2
status: building
suggested_by: "the owner, 2026-09-10: the seat had appended sections to rooms on its own judgment and quoted the owner's messages; the owner asked to be shown what will be added before it is added, endorsed the proposed-then-appended form as the right model, and asked for it as a rule"
blocked_by: []
touches: [method/roles/orchestrator.md, method/rooms/ROOM-FORMAT.md, method/docs-templates/decisions/000-template.md, tools/method-evals/]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
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
