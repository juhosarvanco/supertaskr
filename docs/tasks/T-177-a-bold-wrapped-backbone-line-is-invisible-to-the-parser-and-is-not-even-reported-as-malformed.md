---
id: T-177
title: A bold-wrapped backbone line is invisible to the parser AND is not reported as malformed — the generated project declared three features and the board rendered none of them, silently
feature: F-03
milestone: 4
priority: 7
size: S
status: verifying
blocked_by: []
touches: [lib-parser]
suggested_by: standing triage sitting #4 (2026-08-30), from @human's first-walk board session relayed by the outgoing integrator seat
builder: claude-opus-5@subagent
verifier:
built_by: claude-opus-5@subagent
verified_by: claude-opus-5@subagent
review: same-model
---

**MEASURED AT `b60b06d` AGAINST THE REAL FILE AND THE REAL REGEXES**,
not reasoned from the shapes:

    node -e '
    const rm=require("fs").readFileSync(
      "/Users/ujju/Projects/first-walk/docs/ROADMAP.md","utf8");
    const bullet=/^-\s+(F-\d+):\s*(.*)$/, malformed=/^-\s+F-/;
    let ok=0,mal=0,inv=0;
    for(const l of rm.split("\n")){
      if(bullet.test(l)) ok++;
      else if(malformed.test(l)) mal++;
      else if(/^-\s+\*\*F-\d+:/.test(l)) inv++; }
    console.log(ok,mal,inv); '        # -> 0 0 3

**Backbone lines matched: 0. Malformed lines reported: 0. Silently
invisible: 3.** @human's generated project declares F-01, F-02 and F-03
as `- **F-01: Open — one command puts the cursor in today's note.**`,
and `lib/parser/src/roadmap.ts`'s bullet regex requires the unwrapped
shape. Every task card in that project carries a `feature:` pointing at
a backbone slot the parser never created.

## THE SILENCE IS THE DEFECT, NOT THE STRICTNESS

`roadmap.ts` already has a second regex for exactly this job — the
malformed-line reporter `/^-\s+F-/`, which produces *"malformed backbone
line (expected '- F-NN: Name — description')"*. It does not fire here,
because `- **F-01:` does not match `^-\s+F-` either: the `**` sits
between the dash and the `F`. **So the one mechanism written to stop a
backbone line from disappearing quietly is defeated by the same two
characters that hide the line.** The reader gets no feature, no error,
and no reason — the board is simply shorter, which is `9c64cd8`'s
failure shape (CONVENTIONS, DOCS GATE) arriving in a generated project.

## Nobody promised the plain shape where the planner would read it

`method/docs-templates/ROADMAP.md` shows `- F-01: Capture — …` as an
EXAMPLE INSIDE AN HTML COMMENT — deliberately, because templates are
scaffolded verbatim and a bare example row would parse as a real feature
(T-030). `method/interview/decomposition.md` says *"walk the backbone
left to right"* and states no line grammar. So the shape is demonstrated
once, inside a comment, and never stated as a rule. A planner that
writes markdown emphasis into a heading-like bullet is doing the
ordinary thing.

## Three arms, of which arm 1 matches this project's own doctrine

1. **REPORT IT.** Widen the malformed detector so an emphasis-wrapped
   `F-NN:` bullet is a NAMED issue instead of a silent drop. This is the
   arm that matches the repository's standing preference — a signpost may
   go stale, silence may not — and it fixes the class rather than one
   spelling: any future decoration lands in the reporter.
2. **TOLERATE IT.** Strip surrounding emphasis before matching, so the
   bold form parses as the plain one. Closes @human's instance outright
   and widens the accepted grammar for every project, which is a call
   about the FORMAT and not only about the parser.
3. **PIN THE SHAPE UPSTREAM.** State the line grammar normatively where
   the planner reads it. This edits `docs-templates/ROADMAP.md`, a
   `KIT_FILES` entry — **shipped bytes, so a method version bump is
   owed** and the fence above does NOT reach it. Arm 3 is therefore not
   this card's to take alone; it rides a bump card, and `T-176` is the
   natural neighbour.

**Arms 1 and 2 are not alternatives** — reporting the shape and
accepting the shape answer different questions, and taking 2 without 1
leaves the next decoration silent again.

## Acceptance criteria

- WHERE a `docs/ROADMAP.md` line declares a feature id in a shape the
  backbone reader does not accept, THE parser SHALL report a named issue
  rather than yielding no feature — and the body SHALL cover at least the
  emphasis wrap this card measured.
- IF arm 2 is taken THEN the tolerated set SHALL be stated in
  `roadmap.ts`'s own header, and a bare example row inside an HTML
  comment SHALL still yield no feature (T-030's property, which the
  widening must not break).
- THE fixture SHALL be the shape a real planner produced — the three
  lines above, not a hand-written imitation — and a positive control
  SHALL prove the body reds before the fix.
- THE lane SHALL NOT edit `method/docs-templates/ROADMAP.md`: it is a
  shipped `KIT_FILES` entry outside this fence, and arm 3 is routed.
- Verification: headless, `npx vitest run` from lib/parser/.

## Implementation notes

**2026-08-31, executor claude-opus-5@subagent, lane
`task/T-177-backbone-reported` at `/Users/ujju/Projects/nputer-T-177`,
base `fbeac77`, commit `72e232d`. ARM 1 ONLY — arm 2 declined with a
measured reason below, arm 3 untouched.**

### What moved, in one sentence

`lib/parser/src/roadmap.ts`'s malformed-line reporter now looks past a
leading run of emphasis punctuation and NAMES that run as the cause:

    const emphasis = /^-\s+([*_~]+)\s*(?=F-)/.exec(line)?.[1];
    if (emphasis !== undefined || /^-\s+F-/.test(line)) {

The run is CAPTURED rather than merely detected, because the message has
to tell a writer which characters hid their line. The accepted grammar
is unchanged; what changed is that refusing a line is now audible. The
header states all of this, including the boundary — the reporter matches
the inert-blanked view, so its reach stops where T-055's inert pass
starts.

### The class, and why the fix is written against it

THE CLASS: *a line-start detector defeated by decoration sitting between
the bullet marker and the id.* Not "the `**` spelling" — `[*_~]+` covers
`*`, `**`, `***`, `_`, `__`, `~~` and any mixture, so the next decoration
lands in the reporter instead of teaching this lesson again. Decoration
AFTER the id (`- F-01**: …`) was already covered by the plain arm and is
noted in the header rather than re-fixed.

SWEEP A — other line-start id detectors in `lib/parser/src/**`:
`command grep -rn '\^-' lib/parser/src/*.ts` returns four hits and
**exactly one is a detector of this shape** (roadmap.ts's own pair, now
fixed). `frontmatter.ts:35`'s `/^---[ \t]*/m` is a delimiter, and
`roadmap.ts:99`'s `/^\s*-\s/` is a continuation guard. **No sibling
exists; nothing else was owed and nothing else was changed.** The sweep
is shown capable of failing by the four hits it did return.

SWEEP B — is any decorated `F-` bullet live inside a `## Backbone`
section in this repository? `git ls-files -z '*.md' | xargs -0 awk` over
the whole tracked tree, backbone-scoped: **ZERO**. Shown capable of
failing against a PLANTED hit written to a scratch file, which it found.
This is why the smoke test stays green — see the gate below.

SWEEP C — any `- **F-` bullet in `app/` or `tools/` fixtures, which is
the path by which a parser change could move app behaviour:
`git grep -n -- '- \*\*F-' -- app tools lib` → **ZERO**.

### Measured, before and after, against @human's real project

READ-ONLY against `/Users/ujju/Projects/first-walk` (its `git status`
verified clean after; nothing in it was edited):

| | features | issues |
|---|---|---|
| card's measurement at `b60b06d` | 0 | 0 (3 silently invisible) |
| this lane at `72e232d` | 0 | **3, each named and located** |

    docs/ROADMAP.md:5: malformed backbone line (expected '- F-NN: Name —
    description') — markdown emphasis ('**') sits between the bullet and
    the feature id, which the backbone reader does not accept; unwrap the
    id and put the emphasis inside the description: - **F-01: Open — …

…and the same at `:9` and `:13`. The reader now gets the cause, the
remedy and the offending line, which is the whole distance between a
shorter board and a fixable one.

### ARM 2 — DECLINED, and the reason is measured rather than asserted

The card leaves arm 2 optional and calls it *"a call about the FORMAT
and not only about the parser"*. It is declined here. Four reasons, the
first of which is the one that decided it:

1. **THERE IS NO OBVIOUS TOLERANT PARSE, because the emphasis does not
   wrap the bullet — it wraps the first SENTENCE, with more prose after
   it.** Both candidate strippings were run against the real F-01 line
   (probe kept in the session's scratch) and neither produces something
   a writer would sign:
   - strip the LEADING run only → `description` = *"one command puts the
     cursor in today's note.`**` Run … "* — a literal `**` marooned mid-
     description;
   - strip EVERY run → the emphasis the writer put in their own prose is
     silently deleted.
   Both then swallow the entire four-line paragraph into `description`,
   when the writer's evident intent was that the bolded sentence IS the
   one-line summary. Tolerating the shape therefore means *choosing* a
   new grammar (does bold delimit the summary? does the em dash still
   split? what becomes of the trailing text?) — and that choice would
   ship to every project nputer ever generates.
2. **That choice is not an S-card's to make inside a lane.** It is
   exactly the kind of format ruling this project routes to a room or to
   @human, and arm 3 — stating the grammar where the planner reads it —
   is the place where a format decision belongs, on a method version
   bump, parser and shipped template moving together.
3. **Arm 1 alone satisfies the card's core criterion and is
   self-correcting**: the writer sees a named issue, unwraps one line,
   and the document then means exactly what it says. Tolerance would
   leave two spellings of one grammar live forever.
4. **Taking arm 2 would have hollowed out arm 1's own fixture.** The
   three real lines the card requires as evidence would parse silently
   as features, and the reporter's only remaining coverage would be
   decorations nobody has ever observed. The measured defect deserves
   the measured assertion.

Consequence stated plainly, because it is a cost and not a nil: **this
does not by itself repair @human's first-walk board** — it turns three
silent drops into three named issues the writer can clear with one edit
per line. Closing the instance outright is arm 3's job.

**ARM 3 confirmed untouched**: `git show --stat 72e232d` names two files,
both under `lib/parser/`. `method/docs-templates/ROADMAP.md` has zero
bytes moved in this lane.

### Acceptance criteria, one by one

1. *A feature id in a shape the reader does not accept SHALL report a
   named issue rather than yielding no feature, covering at least the
   emphasis wrap.* **MET** — `roadmap-error`, one per declaration, the
   emphasis named; and the coverage is the class, not the wrap alone
   (five distinct runs pinned, each with its own run named back).
2. *IF arm 2 is taken THEN the tolerated set SHALL be in the header, and
   T-030's property SHALL survive.* **Arm 2 NOT taken**, so the first
   clause is not owed and the header says so in as many words ("there is
   no tolerated set"). **T-030's property is pinned anyway, deliberately**
   — a body proves a DECORATED example row inside an HTML comment (both
   the multi-line and the one-line form) still yields no feature AND no
   issue, because the widening could have broken it and "it can't" is
   not a measurement. Drill M4 shows that body reds if the reporter
   reaches past the inert pass.
3. *The fixture SHALL be the shape a real planner produced, and a
   positive control SHALL prove the body reds before the fix.* **MET,
   both halves.** The fixture is lines 1–20 of
   `first-walk/docs/ROADMAP.md` copied byte for byte, proved
   BYTE-IDENTICAL by a probe that re-reads the real file and compares
   (`IDENTICAL: true`, 20 lines) rather than by eye. POSITIVE CONTROL:
   the seven new bodies were written and run BEFORE the source was
   touched — **4 failed / 29 passed, exit 1**, the four being the ones
   that assert the defect (the three others are guards that already
   held, and each got its own mutation instead).
4. *The lane SHALL NOT edit `method/docs-templates/ROADMAP.md`.* **MET**
   — see arm 3 above. Arm 3 stays routed to a bump card (T-176 is the
   card's named neighbour).
5. *Verification: headless, `npx vitest run` from lib/parser/.* **MET** —
   all three gates below ran headless in this lane; nothing was launched,
   no port was bound, port 1420 untouched.

### Gates — every command with its exit, read UNPIPED from a guarded script

Run from a guarded script file (`cd <abs> || exit 91`), never pasted:

| command (from `lib/parser/`) | exit | result |
|---|---|---|
| `npm ci` | 0 | fresh worktree installed, 0 vulnerabilities |
| `npx vitest run` | **0** | **16 files, 343 passed / 343** |
| `npx tsc --noEmit` | **0** | clean |
| `npm run build` | **0** | dist/ emitted |

Re-run unchanged after the drill and after the frontmatter stamps. The
suite count moves 336 → 343: seven new bodies, zero existing bodies
changed or deleted.

**THE SMOKE TEST IS THE ONE THAT MATTERED and it is GREEN**: it parses
this repository's live `docs/` tree and requires zero issues. It stays
zero because this repo's own backbone is six plain bullets (`awk` over
the `## Backbone` section: `F-01`…`F-06`, no decorated bullet anywhere),
and SWEEP B found no decorated backbone bullet in the whole tracked tree.
The widened detector reports nothing about this project's own ROADMAP —
checked, not assumed.

### POISON DRILL — 7-for-7, at the commit, in a detached scratch worktree

Drilled at `72e232d` (committed FIRST — a restore cannot tell itself from
a revert), in a DETACHED scratch worktree with its stem DERIVED from the
lane id, cut at a short root: `/private/tmp/nd-T-177`, its own installed
`node_modules`, its own driver and log files under one stem. The lane
worktree was never dirtied — `git status` clean throughout — and the
scratch was removed afterwards. No cargo, so the `CARGO_TARGET_DIR` arm
of the rule is not owed. Scratch baseline before mutating: 343/343,
exit 0. After all seven restores: 343/343, exit 0, scratch clean.

Every mutation is ONE SIDE ONLY, applied by a mutator that REFUSES unless
the target occurs exactly once and that prints the mutated TEXT read back
out of the file (not a substitution count), and every restore is
`git restore --source=72e232d --staged --worktree` — both sides named —
proved by sha256 against `git show 72e232d:<path>`.

| # | side | mutation | exit | bodies red | named-kill |
|---|---|---|---|---|---|
| M1 | code | detector reverted to `/^-\s+F-/` (the pre-fix condition) | 1 | 4 | 4/4 |
| M2 | code | the emphasis cause clause neutralised to `''` | 1 | 2 | 2/2 |
| M3 | code | `(?=F-)` lookahead dropped — reports every bold bullet | 1 | 1 | 1/1 |
| M4 | code | reporter reads the RAW line, not the inert-blanked one | 1 | 1 | 1/1 |
| M5 | assertion | expected run array `'*'` → `'**'` | 1 | 1 | 1/1 |
| M6 | assertion | `.not.toContain('markdown emphasis')` → `.toContain(…)` | 1 | 1 | 1/1 |
| M7 | code | `close()` removed from the malformed arm | 1 | 1 | 1/1 |

**7-for-7: every mutant died, every named body reded, no mutant
survived.** Every one of the seven new bodies is killed by at least one
mutation — M1→bodies 1,2,3,7 · M2→2,3 · M3→4 · M4→5 · M5→3 · M6→6 ·
M7→7 — so no new assertion is vacuous. Restoration sha256, identical on
both sides at every one of the seven cycles:

    src/roadmap.ts        1937d4320c049253855d72aa72d309bacc0be409ab20c994a0aa2bdd18b1effb
    test/roadmap.test.ts  93cd8b88e2abe3a617c49359b122b33b780b6ecde9d72f574debed8b6381b7d0

No body was found unpoisonable.

### Standing gates, DERIVED from this lane's own diff

Diff at `72e232d` + the frontmatter/notes commit: `lib/parser/src/roadmap.ts`,
`lib/parser/test/roadmap.test.ts`, this card.

- **GRAPH REGEN — FIRES.** Two `*.ts` files outside `docs/`. Owed at the
  merge, and it is the integrator's: this lane must not regenerate or
  trust `CURRENT` from inside a worktree (STATE's standing hazard), and
  `T-140-s4`'s merge is what ends the 410-byte hold.
- **DOCS GATE — FIRES.** This card lives under `docs/tasks/`, which the
  parser's own smoke test reads. Discharged as far as this lane can
  reach: `npx vitest run` was re-run AFTER the frontmatter stamps and the
  notes, still 343/343 exit 0. The gate's full reader set is
  `tools/e2e`'s to derive and is outside this fence.
- **BOOT GATE — NOT OWED.** No `app/src-tauri/**`, no `app/src/**`,
  neither manifest.
- **METHOD EVAL GATE — NOT OWED.** No `method/**` byte moved (arm 3).
- **AUDIT GATE** declares no merge-diff trigger, so it is not one of these.

### The app depends on this parser — said, not assumed

`app/` consumes `@nputer/parser` through `file:../lib/parser`, so a
parser change CAN move app behaviour, and the app suite is outside this
fence: **it was neither run nor edited from this lane.** The honest
statement of the risk:

- **No app or e2e FIXTURE can change**: SWEEP C found zero `- **F-`
  bullets under `app/` and `tools/`, and SWEEP B found zero decorated
  bullets inside any `## Backbone` section in the whole tracked tree, so
  no fixture the app suite reads produces a new issue.
- **The app's live rendering DOES change, and that is the point**: on a
  user's project with a decorated backbone the diagnostics surface will
  now show named `roadmap-error`s where it showed nothing. That is the
  card's intent, not a regression.
- Nothing else in the issue pipeline moved: no new `kind`, no new field,
  no change to `ParseIssue`'s shape — a `roadmap-error` with a longer
  message, which every consumer already handles.

Routed rather than done here: an app-side check of the diagnostics
surface under three simultaneous `roadmap-error`s is `app-shell`'s fence,
not this one, and the verifier or the integrator owns whether it is owed.

### Where the brief was wrong

Both already filed; recorded again because a brief nobody contradicts is
a brief that gets copied.

- **ROW 4 names the worktree as
  `/Users/ujju/Projects/nputer/.claude/worktrees/nputer-T-177` — a path
  INSIDE the repository**, which is exactly what `lane-protocol.md` rule
  three forbids and what the same row quotes in full three lines later.
  The real lane, and the one the fence manifest names, is the sibling
  `/Users/ujju/Projects/nputer-T-177`. Filed as **T-179**. The lane
  reported the real path rather than moving itself, per that rule.
- **ROW 3's read-first list names `docs/ROADMAP.md`**, which
  `method/roles/executor.md` step 1 subtracts. The role file wins:
  ROADMAP was NOT read as a ramp-up document. It was of course read as
  DATA — this repository's backbone and @human's, which is this card's
  entire subject. Filed as **T-112-s3**, in flight.
- Not a defect, a re-derivation: the brief's ROW 4 base
  `4e08d293b0fcd14ce437840dc93cf9cff80d4635` is not this lane's base.
  The lane was cut at `fbeac77`, the integration tip the same row names,
  and `fbeac77`'s own gates are green — 343/343 at the base's parser
  suite, measured here.

### Ceremony and what this lane did NOT do

Per the dispatching seat's instruction: `status: verifying`,
`built_by: claude-opus-5@subagent`, verifier fields left empty for the
verifier. **NOT merged, NOT pushed, main untouched, no worktree removed**
— the lane worktree stands so the verifier has the reproducible copy of
what was measured. Nothing was installed or run in
`/Users/ujju/Projects/nputer`. Port 1420 was never touched.

## Verdicts
<!-- verifier appends: date, model@session, APPROVED / REJECTED + failures -->

**2026-08-31 · claude-opus-5@subagent · blind verifier seat ·
APPROVED WITH ASSIGNED CORRECTIONS.**

Measured at `966ff56` (lane `task/T-177-backbone-reported`, base
`fbeac77`). One correction assigned, from a drill survivor; two
follow-ups and one accuracy note recorded below, none blocking.

**The two follow-ups are written out here rather than filed as
`status: suggested` cards** (roles/verifier.md step 6). Deliberate, and
named so it is a choice and not an omission: this seat's brief scoped
it to the verdict, and adding two new frontmatter blocks to a tip whose
live-tree parse I have just measured at ZERO issues buys a re-
verification for no gain. Both are specified below in enough detail to
file without re-deriving them; the integrator owns whether they become
cards.

### The blindness, stated so it is auditable

Phase 1 read ONLY: this card at `fbeac77`, `docs/CONVENTIONS.md`,
`docs/STATE.md`, `method/roles/verifier.md`, `roadmap.ts` +
`inert-spans.ts` at `fbeac77`, and @human's real
`first-walk/docs/ROADMAP.md` (read-only; not edited, not staged). The
diff, the commits and the Implementation notes were opened only after
the attack set was written to disk and hashed: **55 binding attacks**
(48 in classes A–H, plus seven mutants derived from the criteria with
the test file closed), `sha256
a7a510cd50c36295e35d866ae8e6cea0e58f526fe64bdb59abb258053efb3394`,
written 2026-08-31 00:34 local, before the first `git diff`. **The
brief kept the two phases separate and named no executor-derived
figure**, so nothing above the line had to be disclosed as broken.

### Gates, run by this seat, exits read UNPIPED from guarded scripts

| from | command | exit | result |
|---|---|---|---|
| `lib/parser/` | `npm ci` | 0 | fresh lane install, 0 vulnerabilities |
| `lib/parser/` | `npx vitest run` | **0** | **16 files, 343/343** |
| `lib/parser/` | `npx tsc --noEmit` | **0** | clean |
| `lib/parser/` | `npm run build` | **0** | dist/ emitted |
| `app/` | `npm install` | **0** | 0 vulnerabilities |
| `app/` | `npm run build` | **0** | typecheck + frontend build |
| `app/` | `npm test` | **0** | **49 files, 1060/1060** |

**THE APP SUITE WAS THE GAP AND IT IS CLOSED.** `app/` consumes this
parser through `file:../lib/parser`; the executor named the risk
honestly and left the suite unrun because it sat outside its fence.
This seat is not fenced, so it ran it: **1060/1060, exit 0.** The
parser change moves no app behaviour. Neither named intermittent
(`T-161`, `T-178`) appeared; no cargo was built, port 1420 untouched.

### What survived contact — the three that matter

**1. ASSIGNED CORRECTION — the reporter's backbone scoping is CORRECT
but UNPINNED.** My mutant M5 hoists the new detector past the section
guard:

    -    if (!inBackbone) continue;
    +    if (!inBackbone && !/^-\s+[*_~]+\s*(?=F-)/.test(line)) continue;

**The suite stays 343/343, exit 0. No body notices.** The shipped
behaviour is right — I measured it directly: a `- **F-02: Deferred —
later**` under `## Parked` yields zero issues, and so do @human's real
Parked bullets. But nothing pins it, and **no existing gate could
catch it**: the live-tree smoke test cannot, because an `awk` over
every tracked `*.md` finds ZERO decorated `F-` bullets outside a
backbone section anywhere in this repository. A reporter that fires in
every section instead of the backbone is the failure mode that turns
one silence into a page of badges, and it would arrive silently under
any future refactor of the scan loop.

CORRECTION, performable without re-deriving anything — add one body to
`lib/parser/test/roadmap.test.ts`, in the T-177 describe block:

    it('the reporter is backbone-scoped: a decorated F- bullet under another heading is not an issue', () => {
      const content = [
        '## Backbone',
        '- F-01: Real — the only feature here',
        '',
        '## Parked',
        '- **F-02: Deferred — bold, and none of the backbone scan business**',
        '',
      ].join('\n');
      const { features, issues } = parseRoadmap(content, FILE);
      expect(issues).toEqual([]);
      expect(features.map((f) => f.id)).toEqual(['F-01']);
    });

Re-run `npx vitest run` from `lib/parser/` (expect 344/344) and confirm
the body reds under the M5 edit above. No source change is owed — the
code is already correct.

**2. SUGGESTED, not blocking — the class stops where the dash anchor
does.** `[*_~]+` genuinely covers the class it claims: `*`, `**`,
`***`, `_`, `__`, `~~` and every mixture I threw at it, including
nonsense runs like `~*_`, each reported with its own run named back.
But five neighbours stay silent drops: `- <b>F-01:` (HTML emphasis),
`* F-01:` and `+ F-01:` (other list markers), `* **F-01:` (both axes),
and `  - **F-01:` (indented). Criterion 1's floor is *"at least the
emphasis wrap this card measured"* and that floor is cleared, and
`roadmap.ts`'s header states its set precisely rather than overclaiming
— so this is a follow-up, not a failure. The last three were already
silent on `fbeac77`; the lane did not regress them, it declined to
widen past its own stated set. Worth a card because a project that
writes `*` list markers throughout still gets total silence.

**3. SUGGESTED, not blocking — the echoed line is the inert-BLANKED
one.** The message ends `: ${line.trim()}`, and `line` comes from the
blanked view, so @human's own F-01 reports as

    … description: - **F-01: Open — one command puts the cursor in today's note.** Run       ;

where the file says ``Run `note`;``. Inherited from the base malformed
arm rather than introduced here — but T-177's fixture is the first case
where it actually bites, because a real planner's line carries inline
code. A card should echo the raw line.

### The criteria, attacked one at a time

- **C1 (report the class, cover at least the emphasis wrap): MET,
  beyond the floor.** Nine decoration shapes I constructed that the
  card never names all report, each naming its own run.
  Over-reporting holds too: `- **bold prose**` is silent, `-**F-01:`
  (not a list item) is silent, and `- **F-eature**` reports exactly as
  the plain arm already did for `- F-eature` — symmetric with base, not
  a new looseness.
- **C2 (arm 2's clause): NOT OWED, arm 2 declined — and the decline is
  MEASURED, not asserted.** Both candidate strippings were run against
  the real F-01 line, and the reasons are concrete: the emphasis wraps
  the first *sentence*, not the bullet, so a leading-run strip maroons a
  literal `**` mid-description and a strip-all deletes the writer's own
  prose emphasis, and either way the four-line paragraph is swallowed
  into `description`. **T-030's property was pinned anyway, which was
  the right call**: I confirmed a decorated example row inside an HTML
  comment (multi-line and one-line), inside a ``` fence, and inside an
  inline code span all yield no feature AND no issue, and an
  unterminated comment yields exactly one issue, not two. My mutant M6
  points the detector at the raw line and that body reds — the property
  is measured, not assumed.
- **C3 (real fixture + positive control): MET, both halves, proved
  independently.** I re-read
  `/Users/ujju/Projects/first-walk/docs/ROADMAP.md` and confirmed
  `real.startsWith(fixture)` — **861 bytes byte-identical**, em dashes,
  straight apostrophes and inline code spans intact, with the three
  declarations at lines 5, 9 and 13 exactly as the body asserts. The
  positive control I re-derived myself: my M1 reverts the detector to
  `/^-\s+F-/` and **four bodies red**.
- **C4 (do not edit `method/docs-templates/ROADMAP.md`): MET.**
  `git diff --stat fbeac77..HEAD -- method/` is **empty**. Arm 3
  untouched and still routed.
- **C5 (headless `npx vitest run`): MET.** Nothing launched, no port
  bound.

### My poison drill — 6 killed, 1 survivor

Seven mutants of my own, derived from the criteria before the test file
was open; one side only, each read back with `git diff` before running,
each restored with `git restore --source=966ff56 --staged --worktree`
and proved by `sha256 1937d4320c049253855d72aa72d309bacc0be409ab20c994a0aa2bdd18b1effb`
against the committed blob — identical at all seven cycles. Drilled in
a DETACHED scratch worktree at `/private/tmp/nv-T-177` with its own
`node_modules`; baseline 343/343 exit 0, and 343/343 exit 0 after the
last restore.

| # | mutation (code side) | exit | red | verdict |
|---|---|---|---|---|
| M1 | detector deleted — base behaviour restored | 1 | 4 | KILLED |
| M2 | class narrowed to the one quoted spelling `**` | 1 | 1 | KILLED |
| M3 | `close()` removed from the reporting arm | 1 | 1 | KILLED |
| M4 | named run replaced by a constant `'**'` | 1 | 1 | KILLED |
| M5 | detector hoisted past the backbone guard | **0** | **0** | **SURVIVED** |
| M6 | detector reads the RAW line, not the blanked view | 1 | 1 | KILLED |
| M7 | reported line number off by one | 1 | 4 | KILLED |

Six of the seven new bodies are killed by a mutant I chose without
reading them, and the distribution is not degenerate — M2, M3, M4, M6
each kill a DIFFERENT single body, so the seven are not seven spellings
of one assertion. M7 also reds a pre-existing body, which is the right
coupling. The one survivor is finding 1 above. The executor's own drill
was 7-for-7 on a different seven and its claims are accurate as stated;
the scoping property is simply one none of its mutants probed, which is
what a blind second set is for.

### Security sweep

- **ReDoS: CLEAR, measured.** `/^-\s+([*_~]+)\s*(?=F-)/` has no nested
  quantifier and `\s` is disjoint from `[*_~]`, so backtracking is
  linear. A backbone line of 60,000 `*` with no `F-` — worst case for
  the lookahead — parses in **1.67 ms** (1,000 → 0.06 ms; 5,000 → 0.38
  ms; 20,000 → 0.92 ms: linear, not quadratic).
- **No dependency added**, no lockfile or `package.json` churn: the
  whole lane is three files.
- **No new `ParseIssue` kind, field or shape** — a `roadmap-error` with
  a longer message, which every consumer already handles. Verified by
  the app suite rather than by reading: 1060/1060.
- No secrets, no new input path beyond file content already parsed, no
  unsafe default: a non-matching line yields `undefined` through `?.`
  and the arm simply does not fire.

### Scope

Three files, all inside the fence: `lib/parser/src/roadmap.ts`,
`lib/parser/test/roadmap.test.ts`, this card. Zero bytes under
`method/`. This repository's own `docs/ROADMAP.md` untouched — its
backbone is six plain bullets, `F-01`…`F-06`, so the smoke test's zero
is genuine and not a dodge. I re-ran the executor's sweep myself with
an `awk` first shown capable of finding a PLANTED decorated row:
**zero decorated backbone bullets in the whole tracked tree.**

One accuracy note, the figure case rather than a defect: the notes'
SWEEP C quotes `git grep -n -- '- \*\*F-' -- app tools lib` → ZERO,
which at the tip returns **8** — every one of them the lane's own new
bytes in `lib/parser`. Restricted to the sweep's actual subject,
`-- app tools`, it is zero, which I confirmed. The claim's substance
holds; the number went stale the moment the fixture was committed.

### Gate re-run at MY OWN tip

This verdict and the two frontmatter stamps are prose that the parser's
own smoke test reads, so `npx vitest run` from `lib/parser/` was re-run
AFTER writing them: exit and count recorded in the report accompanying
this verdict. `verified_by` and `review: same-model` stamped;
`status: verifying` left for the integrator; `verifier:` left as
dispatch wrote it. **NOT merged, NOT pushed, no worktree removed** —
the drill scratch at `/private/tmp/nv-T-177` is detached (STATE: a
detached entry is not a lane) and left standing for audit; the
integrator may clear it with
`git worktree remove /private/tmp/nv-T-177`.
