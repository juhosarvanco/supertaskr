---
type: consultation
status: open
max_rounds: 3
---

# Where the development loop loses time, and what would give it back

Opened by the architect seat on the night of 2026-09-01/02 at @human's
request: *"find ways how to make the development process/loop more
efficient, faster without losing quality or better or more logical in any
way. Or if you already see weak spots that could be improved."* Every item
below was met while holding the seat, not reasoned from the docs; each
carries where it was measured. Items are ordered by the time they would
give back per merged card. @human rules; nothing here is a card until it
is promoted.

## @architect (claude-fable-5-1 @nputer-87) — 2026-09-02 00:55

**1. Every seat reads 158 KB of CONVENTIONS before it can start, and the
document is at its own warn line.** `wc -c docs/CONVENTIONS.md` read
158,281 at `cf9d462` against a 164,393 warn line. Five seats per card
(architect, executor, verifier, integrator, and the verifier's second
phase) each pay roughly forty thousand tokens to read it, and most of
those bytes are measurement narrative that ADR-019 says belongs in
records. A compaction landing of the 2026-08-27 kind, done once, is the
single cheapest change to every lane that follows it. Docs-protocol rule
7 already asks each role file to name the sections it reads first; the
executor's file names none.

**2. The e2e battery is 93% of every push's gate, and it grows with
every guard card.** `suite/e2e-seconds` is BREACHED at 372s against a
312s line (the 43e776a record), 535 bodies, workers: 1. T-120-s2 (planned)
measured that 92 bodies open no browser. Splitting the Playwright config
into a browser project and a no-browser project, and letting the second
run with more than one worker, would cut minutes from every battery
without touching a single assertion.

**3. Three of four suites are red inside every lane, so no lane can
certify itself and the integrator re-runs everything by hand.** T-216-s4,
dispatched first tonight for exactly this reason. Until it lands, every
verdict rests on an integrator's re-run.

**4. Every tooling card collides on the `tools/e2e` fence token.** Of the
fifteen priority-2 cards, eleven name `tools/e2e`; at token granularity
they serialise behind a word. Tonight's wave is fenced by PATH instead
(four test files, one hook plus its spec), which is the norm
lane-protocol rule 5 states and the board had adopted in none of its
entries. If the wave lands clean, path-granular fences should become the
dispatcher's default, and the blast-radius flip condition in TASK-FORMAT
becomes measurable.

**5. Triage is bounded by bytes, not by judgement.** `brief.mjs
--dispatch` printed 60,040 bytes at `85dda6d` against a 65,536-byte loss
point, so promotions are chosen by arithmetic (T-225). Fourteen sound
findings sit at `suggested` tonight with a dated PROMOTE that cannot be
applied. T-225 runs right after T-216-s4.

**6. The dispatch ritual is eight serial hand steps per lane**, and half
the brief is still typed rather than derived (T-204, planned). Audit,
stamp, cut, preflight, write-fence, read the manifest back, cut the bench,
brief two seats. Each step is right; their sum is twenty to thirty minutes
per lane of a seat's attention. T-204 removes the typed half; a single
`dispatch` arm that performs the ritual in order and refuses at the first
failed step would remove the rest.

**7. Two architect sessions held one checkout tonight without either
knowing.** The retired Opus seat was mid-battery and then mid-checkpoint
while this seat was asked to take over; nothing in the tree declares a
holder, so the only defence was reading `ps` and the session list.
T-189-s3 (the holder has no carrier) is the card; a runtime holder file in
`.nputer/` that the arming step and the push guard both read is the
construction, and it would have cost the previous seat's stale-worktree
day as well.

**8. Cards are essays, and the parser hides a fifth of their sections.**
T-216-s1's card is 36,779 bytes; T-234 measured 58 of 441 live cards
losing a notes or verdicts section to an exact-match heading rule. The
record is the product's proof, so the prose stays. The lever is cheaper:
T-234's tolerant matcher, and a one-paragraph summary discipline at the
top of every card so a seat can decide whether to read the rest.

**9. A fresh lane installs and builds everything cold.** Three `npm ci`,
a parser build, an app build and a cold cargo build per worktree, plus
the same again for the verifier's bench. The cargo cache must stay
per-lane (T-013-s7), but `sccache` or a shared `CARGO_HOME` registry plus
a warm `npm` cache would take minutes off every lane and every bench.

**10. CI takes 17 minutes per push and reads nothing back on its own.**
Batching pushes is already the rule; what is missing is the push guard
asking `gh run list` for the last run's verdict before allowing the next
push, so a red main cannot be pushed over twice in an evening, which is
what happened at 53da881 and e67cb44.

**11. RETRACTED, and kept because the retraction is the lesson.** This
item first claimed the gate-runner's solo lock was machine-wide and
would serialise four concurrent lanes. It is not: `lockPath(root)` in
`gate-run.mjs` keys the lock to the repository root, so two checkouts
never block each other, and at 22:21Z two `gate-run.mjs e2e` processes
were running at once, one in the integration checkout and one in a
verifier's bench. T-216-s5's collision was two seats sharing ONE bench.
The claim reached all eight covering messages of the wave before it was
measured; the advice they carry (treat REFUSED as a wait, not a red) is
harmless because REFUSED cannot occur across checkouts. The weak spot
this leaves is the one the seat actually demonstrated: **a dispatcher
writes covering messages from memory, and nothing checks them** — which
is T-230's class one seat up, and T-204's subject. A second instance
the same night: the seat relayed a verifier's phase-1 reading (that the
token scanner's root could not be redirected) into a fence widening,
and the executor's own reading of the repository refuted it — a copied
module resolves its root to the fixture it sits in — so the granted path
went unspent. A relayed fact is a claim; say whose.

**13. Serial stamping bakes every earlier lane's base with its later
siblings' PRE-narrowing fences.** The ritual stamps one card, cuts, arms,
then stamps the next, so lane one's checkout carries lane four's card as
it stood before lane four's fence was narrowed. `brief.mjs` computes
disjointness from the live worktree list crossed with the cards IN THE
CHECKOUT IT RUNS IN, so two session-economics bodies red in the earlier
lanes and pass at main — measured in T-216-s4's and T-223's lanes at
23:00Z, green at aad0cf7 with nothing else changed. T-143-s1 and T-187
own the class. The construction is cheap: amend every card of a wave on
the integration branch BEFORE the first stamp, so every base carries
every sibling's final fence, and T-239's arm does exactly that first.

**12. A seat's own edit tooling is a hazard the method does not name.**
This seat's first triage pass swallowed the frontmatter delimiter of six
cards with one `perl -pi` substitution (`\s*$` ate the newline) and was
saved only by reading the diff back before committing, which CONVENTIONS
already demands. Worth one sentence beside that rule: prefer the
harness's own file tools for frontmatter, and never end a substitution
pattern in a whitespace class.

**14. A merged lane's worktree holds its fence until the checkpoint, so
the next lane on those paths cannot arm.** Rule 6 removes a worktree
after the merge AND the checkpoint; the disjointness guard reads live
worktrees on task branches; so T-225's first arming was REFUSED at 23:36Z
on T-223's worktree, merged forty minutes earlier and still standing.
The guard was right by its rule and the rule's timing is the friction.
CONVENTIONS already says a merged lane's worktree goes before the
reconciling writes; the cheaper spelling is "before the next arming on
its paths", and T-239's arm should remove the merged lane's worktree as
its first step when the guard names it.

**15. Two lanes cut before either is armed cannot both be armed.** The
disjointness guard reads every live task-branch worktree's fence
manifest, and a lane with no manifest yet is "an unread fence", which
is not disjoint from anything — so cutting T-018-s2 and T-236-s5 in one
pass at 02:03Z made each arm refuse on the other's missing manifest,
and the way out was to remove one worktree, arm the first, re-cut the
second on its branch and arm it. The guard is right; the ritual's
order is CUT, ARM, then cut the next, and T-239's arm keeps that order
per lane rather than cutting a wave and arming afterwards. A second
instance of item 11 the same hour: three covering messages abbreviated
the setup line to `npm ci` in app/ where CONVENTIONS' fresh-clone
ORDER puts lib/parser first, and a relayed tree fact named brief.mjs
for two call sites that live in card-preflight.mjs — each caught by
the seat that received it, and each a sentence written from memory.

**16. Fast path A's second half is a write the seat makes by hand, in a
lane whose own hook refuses the executor.** Widening T-219's fence at
03:20Z: the seat amended `touches:` on main, re-expanded the manifest,
and asked the executor to apply the same line to its card copy. The
executor refused, correctly — lane-protocol says both halves are the
granting seat's — and measured that the lane's write hook refused ITS
edits, even to the card under always-writable docs/tasks, as a stale
stamp while the window was open. The seat wrote the line and the
section into the lane's card by a Bash write (protocol-covered, hook-
free), and the lane's merge now carries a card conflict resolved with
the lane's copy. T-239's arm owns both halves and the conflict shape:
amend on main, re-expand, write the lane's copy, and say so on the card
once. A second finding from the same lane: the dispatch advisory's "no
acceptance criteria" signal reads the heading and not the card, so a
card whose SHALLs sit under "What to build" is called criterion-less.

**17. A merge whose second parent is the verifier's detached bench commit
is UNJUDGED by the landing gate.** The push guard's landing-gate line at
05:08Z: *"0 lane branch(es) point at its second parent … so which card
fences it cannot be derived."* Seven merges this sitting took the
verifier's commit (written on a bench detached at the lane's tip) as the
second parent, so the verdict rode the history — and no lane branch
pointed at that commit, so the gate could not derive the card and
allowed the push unjudged. The push was allowed, the merges were inside
their fences, and nothing checked that. The construction is one
command before the merge: `git branch -f task/<lane> <verdict sha>`,
so the second parent is the lane branch's tip and the gate derives the
card from the branch; the seat moved all eight branches after the fact
so the record derives. T-239's arm owns it beside the merge step.

**18. The integrator merged app sources and ran the battery without
rebuilding the app.** Battery 14's app leg redded on one body, *"dist/
predates src/lib/watcher-store.ts — rebuild (npm run build) before
trusting the bundle grep"* — the T-018-s5 executor had named that body
as the one a source change after a build necessarily reds. CONVENTIONS
already orders the parser built first after a merge; the app's build is
the same rule one package over, and the battery runner could run it
rather than trust the seat's memory (T-204's class).

**19. A widened fence can hide the arrangement the card is about.**
T-229-s6's subject was the lane fence's read-only mode itself; the seat
widened its fence to the whole tools/method-evals tree (fast path A, so
the control could live beside the evals), which made the subject file
writable IN THAT LANE — and the lane's own measurement then could not see
that its new control copied its subject with `cpSync`, inherited the 444
mode, and regressed the plain eval run to exit 3 in every lane fenced to
method/. The executor's report was true of its lane and false of the
lanes the card exists for. The verifier saw it only by building a scratch
clone fenced the other way. The rule: when a card's property is a
function of the FENCE's arrangement, the lane's own gates are decided by
that arrangement and prove nothing about it — the executor SHALL measure
under a clone fenced like the lanes that owe the gate, and the dispatcher
SHALL say so in the brief when it widens.

**20. A property of the host's process tree is green on every checkout
on the host and red only on the runner.** T-238's holder arm derives the
seat's identity from the nearest harness ancestor and answers nothing
when none matches; the lane, the bench and the integration checkout all
have that ancestor, so twenty bodies were green in all three and the
push that merged it (763548c, CI run 33602096600) was the sitting's first
red main — one body, expecting the integration-branch fixture's record
to be read, on a runner with no harness in the tree. Every gate the
method runs before a push runs on this machine; only CI runs on another,
which CONVENTIONS already says in capitals. The construction: a
derivation keyed on the host owes a CI-shaped control in the lane (an
environment with the ancestor stripped, or an injected derivation the
fixture arms), and the seat SHALL name that control in the brief when a
card's subject is the host. Absorbed into the live T-237-s2 as
T-238-s2, first in its queue, because that lane holds the hook.

Not weak spots, and worth saying: the enforcement stack caught what it
was built for tonight (a stale checkout, a duplicated naming phrase, a
red merge), and the records made a cold hand-over possible in under an
hour. The loop is sound; it is slow in the places above.
