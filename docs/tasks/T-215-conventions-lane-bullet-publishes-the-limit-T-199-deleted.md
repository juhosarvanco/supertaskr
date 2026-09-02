---
id: T-215
title: docs/CONVENTIONS.md's lane bullet still publishes the limit T-199 deleted — "a path outside the writing checkout is allowed in BOTH seats", and the sibling-lane hole "deliberately" left open
feature: F-06
milestone: 4
priority: 2
size: S
status: verifying
blocked_by: [T-199]
touches: [docs/CONVENTIONS.md]
suggested_by: "T-199's executor, which could not correct it: docs/CONVENTIONS.md is outside `touches: [.claude, tools/e2e]` AND was held by the live T-189 lane at dispatch"
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
review: independent
---

**A DOCUMENT THAT PUBLISHES A GUARD'S LIMITS IS PART OF THE GUARD**, and
two of the sentences it publishes stop being true the moment `T-199`
merges.

## The two sentences, verbatim

`docs/CONVENTIONS.md`, the lane bullet's *THE LIMITS, WRITTEN DOWN
BECAUSE A GUARD BELIEVED WIDER THAN IT IS IS WORSE THAN NO GUARD*
paragraph:

> A path OUTSIDE the writing checkout is allowed in BOTH seats, the
> manifest's domains being repository-relative: the scratchpad and a
> drill tree are reachable, and so is a sibling lane's own tree — that
> last one deliberately, because nothing separates an architect reaching
> into a lane from THAT LANE'S OWN EXECUTOR writing into it from a shell
> parked elsewhere.

After `T-199` the WRITING checkout is not a term in the rule at all. What
survives is narrower and is already written in
`.claude/hooks/lane-fence.mjs`'s limit 2: **a path in NO git checkout is
not judged.** The scratchpad and `/tmp` are still reachable; a drill tree
is reachable by limit 3 (detached), not by this one; **a sibling lane's
tree is NOT reachable any more** — it is judged by that lane's fence.

## Why it is a card and not a line in T-199's diff

`docs/CONVENTIONS.md` is outside `T-199`'s `touches: [.claude,
tools/e2e]`, and at that lane's dispatch it was held by the live
**T-189** lane. Rule 5 says an executor whose work reaches outside its
own fence has found a dispatch error rather than a licence — so it was
routed, and this is the routing.

**THE DIVERGENCE REDS NOTHING**, which is why it needs a card rather
than a gate to catch it. `lane-fence.spec.ts` compares the hook's
LANE_BRANCH_RE and its carve-out set against this document, but nothing
compares the LIMITS prose against the code, so the two can drift in
silence — which is the shape of `T-199` itself one document over.

## Acceptance criteria

- The lane bullet's limits paragraph SHALL state the limits
  `.claude/hooks/lane-fence.mjs` actually holds after `T-199`, including
  the sibling-lane residue named as a residue rather than as a design.
- The dispatch brief's *"a PreToolUse hook enforces it"* sentence SHALL
  be true when printed (`T-199`'s fourth criterion) — say plainly that
  it is enforced only from the merge of `T-199` forward, because
  `.claude/settings.json` runs the hook out of `CLAUDE_PROJECT_DIR`,
  which is the DISPATCHING checkout and not the lane.
- CONSIDER whether the limits paragraph should be COMPARED against the
  hook's header the way the branch spelling already is, rather than kept
  in step by hand.
- Verification: headless.

## TRIAGE, 2026-09-01 — DISPOSITION IS **PROMOTE**, AND IT IS NOT APPLIED

Triaged at the architect seat this date. The finding is real, its
evidence reproduces, and its blocker has landed. **The disposition is
PROMOTE and the stamp still reads `suggested`** — held for one reason
that is not about this card:

**THE DISPATCH BRIEF HAS NO ROOM.** `brief.mjs --dispatch` emits 60,731
bytes against a 65,536-byte spawn buffer at `a014b81`. Promoting the
seven correct suggestions in this cluster costs **4,515 bytes** and
leaves **290** — inside the boundary that silently truncates, and the
same boundary that reddened a lane's own gate earlier in this window.
Four went through; this one is the arithmetic's remainder, not triage's.

**READ THIS AS A TOOL LIMIT, NEVER AS A VERDICT ON THE FINDING.** A card
held back by a byte ceiling looks identical on the board to one triage
declined, and that is the thing this paragraph exists to prevent. Filed
as `T-225`; when it lands, promote this card without re-triaging it.

**APPLIED, 2026-09-02, at the stamp of T-225's merge (7435eae):** the
byte ceiling that held this promotion no longer binds — `brief.mjs
--dispatch` answers what can START and `--full` is the triage view — so
the disposition above is now the stamp: `status: planned`.

## Implementation notes — 2026-09-02, executor claude-opus-5@subagent

**ONE FILE CHANGED: `docs/CONVENTIONS.md`, the LANE PROTOCOL bullet's
limits paragraph, rewritten from `decide`'s own header.** Nothing else in
the fence was touched, and the three findings below are routed, not
built.

### The paragraph, before and after

BEFORE (base `42520e3`, lines 1145–1162, **1,207 bytes**) — its two false
claims are the card's subject, quoted there verbatim: *"A path OUTSIDE
the writing checkout is allowed in BOTH seats … the scratchpad, a drill
tree and a sibling lane's own tree are all reachable, the last
deliberately."* It stated four limits (Bash, the writing checkout,
detached, unreadable manifest) plus the FAILS OPEN shape and the runtime
manifest.

AFTER (final, lines 1145–1184, **2,464 bytes**) — all EIGHT
limits, numbered `(1)`–`(8)` to match the header, the sibling-lane hole
named as a RESIDUE, and the enforcement claim scoped to the dispatching
checkout. The document as a whole moved **117,645 → 118,987 bytes**
(`wc -c`, at `42520e3` and the final tip).

### Every limit, and the header line it derives from

All line numbers are `.claude/hooks/lane-fence.mjs` at `42520e3` (that
file is unchanged in this lane).

| published as | derived from |
|---|---|
| (1) Bash-mediated writes stay protocol-covered | header `159` |
| (2) a path in NO git checkout is not judged, and since T-199 that is the WHOLE of it | header `165–188`; code `decide` → `findCheckoutRoot(path.dirname(abs))` undefined → `decline("not-a-repository")` at `1086–1091` |
| (2) it READ *outside the WRITING checkout* until T-199, and that left every lane write unjudged | header `175–181` |
| (2) THE RESIDUE: a sibling lane's tree is judged by THAT LANE's fence, and the hook has no term separating an architect from that lane's own executor | header `182–186`, and the same admission at `65–71` |
| (3) a DETACHED checkout is not judged at all — the poison drill and the human's app checkout | header `187–195`; code `laneLessVerdict` → `decline("not-judged-detached")` at `927–932` |
| (4) a live lane whose manifest this seat cannot read reserves nothing | header `196–200`; code `liveLanes` skip, and `decline("not-judged-lane-list")` at `948` |
| (5) it is ADVICE TO A COOPERATING HARNESS | header `201–204` |
| (6) the mid-integration window — POINTED AT, not restated, because the paragraph one above already carries it | header `205–217`; document lines `1137–1144` |
| (7) containment compares BYTES on a case-insensitive volume | header `218–229` |
| (8) a request with no readable path is the one question the writer's cwd answers | header `230–239`; code `noTargetVerdict` at `1015–1037` |
| every decline carries `judged: false` and speaks on stderr | header `140–157`; the four codes at `392–395` |
| FAILS OPEN in one shape; the manifest is a RUNTIME file | unchanged from the base paragraph |

**WHAT THE PARAGRAPH DELIBERATELY DOES NOT SAY.** The header's reasons
are not copied — one copy, per T-057, and the paragraph names the header
as the authority in its first sentence. Limit 6 is a pointer for the same
reason.

### Criterion two: the sentence is not in any assembler

`grep -rn "hook enforces"` over the whole tree at `42520e3` returns
**seven hits and every one is a card body** (`T-190`, `T-198`, `T-199`,
`T-204`, and this card). `grep -rn "PreToolUse" tools/e2e/scripts/`
returns source comments only — `brief.mjs:34`, `brief.mjs:283`,
`checkout-currency.mjs`, `lane-lock.mjs:16`. The generated brief this
lane was dispatched with carries no such sentence: it is the TYPED half
of the dispatch prompt, which `T-204` (status `planned`, unbuilt) exists
to derive. **So there is no assembler site to route to**, and the
criterion is satisfiable only inside this fence — which the new final
paragraph does, naming `${CLAUDE_PROJECT_DIR:-.}` from
`.claude/settings.json`, saying the binary a lane meets is the
DISPATCHER's copy, and scoping the claim to *from `T-199`'s merge forward
and only for a session started in a checkout carrying it*, with
`T-216-s1`'s arm-time catcher named as what asks.

### Criterion three (CONSIDER): yes, and it is routed as `T-215-s1`

The comparison earns a card, and the shape is on that card: not a prose
diff — both sides are prose and any re-wording would red — but the
DECLARED KEYS, exactly the treatment `LANE_BRANCH_RE` and
`INTEGRATION_SEAT_PATHS` already get in the same spec file
(`lane-fence.spec.ts:652` and `:1029`). The limit COUNT from the header's
numbered block against the count the page publishes, plus every declining
verdict code required to appear in the bullet; both are greppable
literals, the spec already `readFileSync`s the hook at `:542`, so the
fence is one file and no new export is needed.

### The reader measurement — the honest limit, with its positive control

**NOTHING READS THIS PARAGRAPH.** The DOCS GATE derives eleven readers of
`docs/CONVENTIONS.md`; a mutant of the new paragraph carrying the exact
falsehood this card exists to delete was run against the ten e2e ones:
**298 passed, exit 0** at `e47bf86`. `grep` for the paragraph's own
phrases across `tools/e2e/tests/` returns nothing.

**THE POSITIVE CONTROL SAYS THE READER FAMILY IS LIVE**, so the green
above is a coverage gap and not a dead harness: a one-word mutation of
the carve-out sentence at document line `1136`, which `:1029` DOES read,
reds by name — **1 failed / 52 passed, exit 1**, *"the hook's carve-outs
and the page's have drifted"*.

### Drills — one side only, read back with `git diff`, restored by hash

| drill | mutation | result |
|---|---|---|
| A (first pass) | the paragraph's limit-2 clause inverted back to *"a path OUTSIDE the writing checkout is allowed in BOTH seats … the last deliberately"*, document side only | **298 passed, exit 0** — the negative assertion |
| B | `docs/checkpoints` → `docs/checkpoint` in the carve-out sentence, document side only (the hook's `INTEGRATION_SEAT_PATHS` untouched) | **1 failed / 52 passed, exit 1**, body named |
| A (re-run on the FINAL compressed text) | same inversion | **298 passed, exit 0** |

Restoration proof, all three, `git restore --source=<commit> --staged
--worktree`: `git show e6098276…:docs/CONVENTIONS.md | shasum -a 256`
→ `14555eb5720d89cb68e9ab8ca372a720ca95bfd86b3380c9d7580d262a3c9ae9`,
equal to the worktree file (drills A-first and B); `git show
e47bf86e…:docs/CONVENTIONS.md | shasum -a 256` →
`f812fb3a481646e45e03946106c74975ddfccc13b83d81a6e48625f37bdd18e4`,
equal to the worktree file (drill A re-run, and the attribution control
below). `git status --short` empty after each.

### The byte budget that actually binds is the BULLET, not the document

**AND THE FIRST PASS BROKE IT.** `docs/CONVENTIONS.md`'s own ADR-019
budget is `landed 117502 / warn 146878 / fail 176253`, so the document had
~27 KB of headroom and the gate said *budgets hold* throughout. But
`brief.mjs --task T-215 --full` prints the LANE PROTOCOL bullet as ONE
line against a 65,536-byte spawn buffer:

| ref | paragraph | `--full` |
|---|---|---|
| `42520e3` (base) | 1,207 | 64,043 (measured by the dispatching seat) |
| `e609827` (first pass) | 5,326 | **68,031 — over by 2,495** |
| `e47bf86` | 2,573 | 65,195 — 341 under, at that moment's board |
| final tip | 2,464 | **66,265 — 729 OVER**, and the overflow is the board's not the paragraph's: `--dispatch` is 95,569 at the same ref, and `--role executor`, the arm that starts a session, is 50,457 |

The first pass was committed and then recompressed in `e47bf86` rather
than amended, so the drill hashes above stay resolvable. Growth over base is **+1,257 bytes** on the
bullet. The `--full` arm went over the buffer between those two
measurements while `docs/CONVENTIONS.md` did not change — other lanes
merged into main — which is the finding routed as `T-215-s4`: two lines
of that view are 22,485 of its 66,265 characters, and the fix is not to
shorten the rules. A published limit was NOT deleted to reclaim 729
bytes; the trims taken were wordiness only, and every one of the eight
limits, the residue and the enforcement claim survive.

### Attribution of the e2e leg's six reds — a SET, not a count

`gate-run.mjs e2e` reds at the tip: **559 bodies, 6 failed / 553 passed,
exit 1**. The same four spec files were then run with
`docs/CONVENTIONS.md` restored to its BASE bytes (`42520e3`, hash
`c84bea59…`) and the **identical six bodies** red — 6 failed / 86 passed:

- `card-preflight.spec.ts:719` — a discrepancy answers ONE and a preflight that could not run answers THREE
- `checkout-currency.spec.ts:852` — THE WIRING'S POSITIVE CONTROL
- `checkout-currency.spec.ts:953` — THE SWEEP AT ARM TIME
- `lane-lock.spec.ts:899` — the DISPATCH STEP arms it
- `session-economics.spec.ts:179` — the recommended seat is a function of the CARD
- `session-economics.spec.ts:365` — the advisory line is NOT a contract row

The first four are the base being behind main's `.claude/` (T-237's push
guard merged at `44a95c3` after this lane was cut), so `T-216-s1`'s
catcher fires `guard-surface-behind` at every `--preflight` /
`--write-fence`; the last two are the session-economics ref skew a lane
takes when siblings are cut on main after its base. **None of the six is
in the DOCS GATE's reader set for `docs/CONVENTIONS.md`**, and the
restored-to-base run is the measurement rather than the argument.

### Routed, not built

- **`T-215-s1`** — the limits paragraph is tracked BY HAND and nothing
  compares it to the hook's header. Fence
  `tools/e2e/tests/lane-fence.spec.ts`. This is criterion three's answer.
- **`T-215-s2`** — `lane-fence.mjs`'s header calls `no-path-to-judge`
  *limit 5* at line `144` while its own limits block and its runtime
  message both say limit 8. Fence `.claude/hooks/lane-fence.mjs`, outside
  this card's.
- **`T-215-s4`** — `brief.mjs --full` prints the LANE PROTOCOL bullet and
  lane-protocol rule 4 verbatim and is over its own buffer. Fence
  `tools/e2e/scripts/brief.mjs`.
- **`T-215-s3`** — the lane bullet publishes ONE fence layer and there are
  two: `T-210`'s physical read-only layer is named in this document only
  once, under the CAPABILITIES keeper bullet. In-fence by path but out of
  this card's ask, and it cannot be added without the `--full` budget
  above deciding its size.

### Where the brief was wrong

1. **The dispatch brief's row 4 base is `4a9c68cc…`; this lane's HEAD at
   the cut is `42520e372770c01c4ed1a8035fcfea4ce16a6a04`** (T-233's known
   defect, flagged in the message and confirmed here). Every figure above
   is stated at the lane's own refs.
2. **The message said the *"a PreToolUse hook enforces it"* sentence is
   "produced by the assembler (grep tools/e2e/scripts for it)".** It is
   not, at any ref in this tree — see criterion two above. There is no
   assembler site and nothing was routed to one.
3. **The message named eight reader specs; `docs-gate.mjs` names ELEVEN
   readers of `docs/CONVENTIONS.md`** — the eight plus
   `shell-frame.spec.ts`, `window-contract.spec.ts` and
   `app/src-tauri/src/agent/kit.rs` under `cargo test`. The gate's set was
   run, not the message's.
4. **The message pointed at `docs/CONVENTIONS.md`'s own byte budget.** The
   binding budget is `brief.mjs --full`'s spawn buffer via the LANE
   PROTOCOL bullet, which the document's budget does not see; the first
   pass passed the docs gate and still broke the arm.

### The four-suite battery, with the ref each leg was read at

`node tools/e2e/scripts/gate-run.mjs <leg>` from the lane root,
`NPUTER_E2E_PORT=15215`, COUNTS read from the `gate-verdict` line:

| leg | ref | verdict |
|---|---|---|
| parser | `fe2a3c6` | exit 0, **349 bodies**, 1 target, GREEN |
| app | `fe2a3c6` | exit 0, **1131 bodies**, 1 target, GREEN |
| rust | `fe2a3c6` | exit 0, **634 bodies**, 18 targets, GREEN — the DOCS GATE names `cargo test` for `docs/CONVENTIONS.md` through `app/src-tauri/src/agent/kit.rs`, so this leg is owed and was re-read whenever the document moved |
| e2e | `fe2a3c6` | exit 1, **559 bodies**, 6 failed / 553 passed, RED — the SAME SIX named above, base-attributed |

The e2e leg was read three times — `e47bf86`, `5fbb25d`, `fe2a3c6` —
with an identical failure SET each time, and identical to the run with
`docs/CONVENTIONS.md` restored to its base bytes. A SET, never a count.

## VERDICT

**APPROVED** — 2026-09-02, verifier `claude-opus-5@subagent`, judged at
tip `49f2e8cc1b360b1799fd0018849a63cd8580ae27` from the bench
`../nputer-V-T-215`, detached at the lane's base `42520e3`. Every figure
below was re-measured on that bench at that tip; where mine differs from
the notes' I give both.

**BLINDNESS: CLOCK-SHAPED, NOT DISCIPLINE-SHAPED.** Phase 1 reached this
seat before the lane's work existed. The attack set and the ground truth
were written and hashed at `2026-09-02T03:24:11Z` — `attack` sha256
`737bf62eb387c291797d7c54fd0738e29166f63fcf26563420ec790880915af5`,
`ground` sha256
`ea59b9c75c7453cee70038a88469ef625a885022ca0d306957b430c875df8aca` —
with no branch fetched and no note read. **The PHASE 2 message carried
executor-derived specifics** (mutant counts, suite figures, byte
figures), which roles/verifier.md requires me to disclose rather than
pretend away: it arrived after the seal, so the attack set is untainted,
and I re-measured every figure I quote here.

### The criteria

**Criterion 1 — MET.** All eight limits are published, numbered to match
the header, and I checked each against the header AND against `decide`
rather than against the header alone: (1) 159; (2) 165–186 and
`findCheckoutRoot(path.dirname(abs))` → `decline("not-a-repository")`;
(3) 187 and `laneLessVerdict`'s first branch; (4) 196 and `liveLanes`;
(5) 201; (6) pointed at, not duplicated — the mid-integration window
stands eight lines above at 1137–1144, so the T-057 copy was avoided;
(7) 218, stated exactly, including that the LANE arm has no such escape;
(8) 230 and `noTargetVerdict`, including the live hole that a lane
executor's cwd is the dispatching checkout so its unreadable request
takes the lane-less answer. *"Every decline carries `judged: false` and
speaks on stderr"* checks out at `DECLINE_CODES` (391–395) and
`lane-fence-hook.mjs:87–88`.
**The two false sentences are gone.** *"outside the WRITING checkout"*
survives only as a dated historical clause whose subject is the past, and
the drill tree has moved from limit 2 to limit 3, which is what the card
asked for in terms. **The residue is named as one** — the header's own
*"no term separating an architect reaching in from THE LANE'S OWN
EXECUTOR"* is carried across, and `deliberately` no longer attaches to
it anywhere in the bullet.

**Criterion 2 — MET, in-fence.** I sealed this in phase 1 before the
lane's work existed: **no assembler emits *"a PreToolUse hook enforces
it"* at any ref in this tree.** `grep -rn "PreToolUse"
tools/e2e/scripts/` returns source comments only; `grep -rn "hook
enforces"` returns card bodies only; `T-204`, which exists to derive the
typed half of the dispatch prompt, is `status: planned`. So the sentence
had no assembler site to be made true at, and the criterion was
satisfiable only here. The paragraph now scopes it to the DISPATCHING
checkout, names `${CLAUDE_PROJECT_DIR:-.}` — verified verbatim against
`.claude/settings.json`, where the fallback is `.`, the shell's cwd, and
never the lane — dates it from `T-199`'s merge (`a2b53e3`, 2026-08-31
22:19:35 +0300) forward, and conditions it on the checkout the SESSION
was started in with `T-216-s1`'s catcher named as what asks. That last
condition is the half a flat claim would have got wrong, and this bench
is its own proof: see the attribution below.

**Criterion 3 (CONSIDER) — ANSWERED and routed as `T-215-s1`**, with the
right shape: compare DECLARED KEYS, not prose, and require the body's own
fixture positive control. A prose diff would have reddened on every
re-wording, which is the gate this project learns to ignore.

### What I ran, and what it says

| measurement | at `49f2e8c` |
|---|---|
| scope | ONE hunk in `docs/CONVENTIONS.md` (the fence) + five `docs/tasks/` files; **no path outside `docs/`** |
| `rawBullet`/`conventionsBullet` on THE LANE PROTOCOL | one bullet, no column-zero `- ` introduced; the two readers agree |
| `laneSpellings` | identical to base — `main`, `task/T-NNN-<slug>`, `../nputer-T-NNN`, the create command |
| `lane-fence.spec.ts:1029` regex | captures `` `docs/STATE.md` and `docs/checkpoints` `` — unmoved |
| `subBullet(…, "A FRESH WORKTREE…")` | found, exactly one |
| `gate-run.mjs` / `gate-verdict` occurrences | 1 / 1 |
| `wc -c docs/CONVENTIONS.md` | 118,987 — warn 146,878, headroom 18.99 %, above the 10 % drift line |
| `cargo test` from `app/src-tauri/` | **exit 0, 630 passed / 0 failed, 18 targets** (the notes say 634 bodies; my summation of `test result:` lines gives 630) |
| e2e `npm test` | **553 passed / 6 failed**, 559 bodies |
| `git merge-tree --write-tree main 49f2e8c` | **exit 0, no conflict**, at `main = e4cd6d4` (past the `6cc3890` named at dispatch — re-derived at my own ref). Main's CONVENTIONS moved at line ~205, a different region. I ran the pins on the MERGED tree too: all hold, 119,470 bytes. |

**ATTRIBUTION OF THE SIX, MEASURED RATHER THAN ARGUED.** My own phase-1
baseline at the BASE, sealed before the diff existed, was 555 passed /
**4** failed. At the tip it is 553 / **6**. I did not take the notes'
attribution: I restored `docs/CONVENTIONS.md` to its base bytes
(`c84bea59…`) in my bench and re-ran the four spec files —
**6 failed / 86 passed, the identical six.** So none of the six is this
diff's. The first four are this bench being behind main on `.claude/`,
so `T-216-s1`'s catcher fires `guard-surface-behind`; the two
session-economics bodies are a live-environment fact I read out of the
failure text rather than inferring — `T-018-s5 holds a worktree … and no
live card declares that id`, which is a `git worktree list` walk finding
a sibling lane cut after this base. None of the six is in the DOCS GATE's
reader set for `docs/CONVENTIONS.md`.

**THE DRILLS, RE-RUN BY THIS SEAT RATHER THAN READ.** Subject: the new
paragraph's limit-2 clause replaced with the exact falsehood this card
deletes, landing read from `git diff` and not from the mutator, against
the ten e2e readers the DOCS GATE derives — **298 passed, exit 0.**
Positive control, armed where the subject's arrangement is ABSENT (the
limits paragraph untouched): one word of the carve-out sentence,
`docs/checkpoints` → `docs/checkpoint` — **1 failed / 52 passed, exit
1**, `:1029` red by name, *"the hook's carve-outs and the page's have
drifted"*. So the reader family is LIVE and this paragraph is simply
outside it: the change rests on review, not on a gate, which is exactly
what `T-215-s1` exists to close. Bench restored by hash after each
(`3e3a14a0…`), `git status` empty. The three restoration hashes the notes
give all verify: `14555eb5…`, `f812fb3a…`, base `c84bea59…`.

### Findings — none blocking

1. **`"the hook FAILS OPEN in exactly one shape"` IS FALSE; THERE ARE
   TWO.** `checkout-currency.spec.ts:387` measures the second in its own
   name: registration complete, `CLAUDE_PROJECT_DIR` resolving
   CORRECTLY, only the hook `.mjs` absent → node starts, exits 1, and 1
   is not 2, so nothing refuses the write. `checkout-currency.mjs`'s
   header calls it *"ONE fault, not two"*, while the published sentence
   requires *"both wrong at once"*. The sentence is carried VERBATIM from
   the base — this lane did not author it — so it is not a rejection
   under the pre-commitment I sealed before seeing the diff. But it is
   this card's own class, in the paragraph this card exists to correct,
   and it survived an audit of all eight limits. Filed as **`T-215-s5`**.
2. **`T-215-s1`'s second criterion cannot be met inside its own fence.**
   It requires every declining verdict code to appear in the lane bullet.
   Measured at this tip: `not-a-repository`, `not-judged-detached`,
   `not-judged-lane-list`, `no-path-to-judge`, `unreadable-request`,
   `held-by-a-live-lane` and `outside-the-fence` each occur **0** times
   in `docs/CONVENTIONS.md`. Satisfying it needs a write to that file,
   outside `touches: [tools/e2e/tests/lane-fence.spec.ts]` — rule 5's
   shape, to be settled at triage rather than discovered in the lane.
3. **The `--full` overflow, and a pre-commitment I tested and dropped.**
   Blind, I pre-committed that `--full` over 65,536 would be
   REJECT-level. It did not survive the tree. `--full` is the TRIAGE
   view; the dispatch spelling CONVENTIONS publishes is `--task T-NNN`,
   **50,501** bytes here. The margin block prints FIRST by design so a
   truncated reader is told. `--dispatch --full` is **120,123** at this
   ref, and `T-225-s2` was already filed on `--task --state --full` at
   74,439. So the condition is pre-existing, known and routed, and this
   lane's contribution (64,043 → **66,309** on my bench; the notes say
   66,265, and the delta is live board rows, so that figure carries a
   HOST as well as a ref) is correctly routed as `T-215-s4`. Trimming
   wordiness rather than deleting a published limit is this document's
   own rule applied — a hazard is never deleted to fit.
4. **Minor, the notes' own figures.** The paragraph is lines **1145–1183**
   at this tip (1184 is the next bullet) and `sed -n '1145,1183p' | wc -c`
   is **2,549**, not 2,464.
5. **Minor.** Limit 2's header text also names the unrelated-repository
   consequence — *"it IS a checkout, so it is rooted and asked, and its
   own lane list — empty — allows the write"*, a JUDGED allow rather than
   a decline. The published (2) omits it. Not false, since *"in NO GIT
   CHECKOUT AT ALL"* excludes it by construction, but it is the one part
   of limit 2 the by-hand tracking dropped.

**Two things the lane got right that the dispatch got wrong**, and it
found both independently of me: there is no assembler site for criterion
2, and the binding budget is `--full`'s buffer rather than the document's
ADR-019 budget. I had sealed both in phase 1; the convergence is
evidence, not contamination.
