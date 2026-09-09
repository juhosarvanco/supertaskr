---
id: T-287
title: A fence token naming a file that does not exist yet is a NEW-FILE reservation when its parent directory is tracked, not a DEAD FENCE ENTRY — narrow fences need it, since a card that adds a spec file today can only fence the whole tests directory
feature: F-04
milestone: 4
size: S
priority: 2
status: verifying
suggested_by: "the architect seat, 2026-09-09, applying @human's ruling E (narrow fences at triage): the dry run's preflight refused T-242's `tools/e2e/tests/interview-skill.spec.ts` and T-207's `.claude/hooks/checkpoint-gate.mjs` as DEAD FENCE ENTRIES"
blocked_by: []
touches: [tools/e2e/scripts/card-preflight.mjs, tools/e2e/tests/card-preflight.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
verified_by:
review: independent
---

## What was measured

The expander accepts any token with a slash or a dot as a path standing
for itself, tracked or not. The preflight then refuses the same token:
"DEAD FENCE ENTRY … expands to <path> and no tracked file is under it at
HEAD". The rule is right for a typo — a fence that reserves nothing
protects nothing — and wrong for the one case narrow fences need: a
card whose work is a NEW file. Today that card fences the directory
(`tools/e2e/tests`, `.claude/hooks`), and a directory token is held
against every lane that touches one file under it. Fifty planned cards
fence `tools/e2e` whole at the third sitting of 2026-09-09; the p1
interview card is one of them, blocked by four lanes that each hold one
spec file.

## Acceptance criteria

- WHEN a fence token names a path that is not tracked at HEAD AND its
  nearest tracked ancestor directory exists AND the token has a file
  extension THE preflight SHALL classify it as a NEW-FILE RESERVATION,
  print it as such with the ancestor it hangs from, and SHALL NOT refuse
  the card for it.
- WHEN a fence token names an untracked path whose nearest ancestor is
  also untracked, or a directory token with nothing under it, THE
  preflight SHALL keep refusing it as a DEAD FENCE ENTRY — the typo case
  is unchanged.
- WHEN a lane holding a NEW-FILE RESERVATION creates that file THE write
  hook SHALL allow it and refuse every other new file under the same
  directory; a body SHALL show the hook allowing the reserved name and
  refusing a sibling, seen red on a hook that lacks the rule.
- WHEN two cards reserve the same new file THE dispatch view SHALL treat
  the reservations as overlapping fences — one lane at a time — and a
  body SHALL pin it.
- WHEN the arm's step 3 runs on a card whose only untracked tokens are
  reservations THE dispatch SHALL proceed; a body SHALL show the
  preflight's exit unchanged by the reservation and changed by a dead
  entry.

## Implementation notes

Built at @ `8cd11020e631`, in `tools/e2e/scripts/card-preflight.mjs` and
`tools/e2e/tests/card-preflight.spec.ts` — the whole fence, nothing else
touched.

**The rule, and it is ONE function.** `newFileReservation(domain,
oracle)` in the preflight, exported, asked once per untracked fence
domain by the arm that used to raise `DEAD FENCE ENTRY`. It adds no
second expander: the domains it judges are the parser's own
`expandFence` output, and the tracked tree it judges them against is
`pathOracle`'s two sets, which that arm already held. Three verdicts —
already tracked, no file extension, parent directory untracked — and
everything else is a reservation carrying the parent it hangs from. The
finding, when it stays dead, now says WHICH of the three it was.

**Why the parent and not any ancestor.** A file a lane is about to write
is untracked by definition, so nothing about the token can be asked; only
about the ground it hangs from. The nearest ancestor is the parent, and a
path whose parent is untracked too is a claim about a tree the checkout
cannot see. `app/src-tauri/crates/nputer-index/tests/perf.rs` on `T-216-s7`
is that shape at this ref and stays dead.

**What it gives up, said rather than left to be found.** A filename TYPO
under a real directory is indistinguishable from a file about to be
written and now reads as a reservation. No reader of a tracked tree can
separate the two. It is bounded by what a reservation buys: the lane
manifest carries the exact path, so the write hook allows that one
spelling and refuses every sibling — a typo costs the lane its first
write and names itself, where the directory token it replaces permitted
the whole directory silently. The claim-class disclosure says this in the
`cannot` clause, and the pinned copy in the spec says it back.

**The write-time half needed no code at all, and that is measured rather
than assumed.** `buildLaneFence` copies `fence.paths` into the manifest
verbatim, and the expander reads a dotted token as a path standing for
itself whether or not it is tracked — so an exact untracked path reaches
the hook already, and the hook holds it by name. The body asserts the
manifest carries the reservation BEFORE it asks the hook anything, so a
dispatch step that ever started intersecting the fence against the
tracked tree reds here. Criteria three and four are therefore pins on
behaviour this card makes load-bearing, not new behaviour; no edit
outside the fence was needed and no ask was written.

**Measured on the live board at @ `8cd11020e631`**, over six hundred and
eighty-two cards, expanding every fence through the parser and
classifying every untracked domain with the shipped function: fourteen
tokens across three cards become reservations, ten tokens across seven
cards stay dead. Twelve of those fourteen are on `T-159-s1`, which is
done, and they are stale `docs/tasks/` card filenames rather than files
anybody will write — the trade-off above, in the wild. The two that
matter are the spec files on `T-261` and `T-275`, each of which had to
fence a directory for one file.

**What this does NOT unblock, against the card that says it would.**
`T-292` carries no dead fence entry at this ref at all — every token it
names is tracked — and its wait is its `blocked_by` on this card and
nothing else. `T-290` stays refused: its `docs/conventions/` is a
DIRECTORY token with nothing under it, which criterion two keeps dead by
name. `T-261` and `T-275` are in the same state, each holding one live
directory token beside a reservation that now passes. The follow-on is
filed as `T-287-s1`.

**The drill.** Three mutants of the classifier, the spec file run whole
at each: making every untracked domain dead again killed three bodies,
dropping the extension test killed four — including the pre-existing dead
entry body — and dropping the parent test killed two. Body counts and
exits are in the report. The write-hook body and the overlap body are
killed by no mutation of this file, because neither half is this file: the
control inside each is a board mutation instead — the directory fence
that permits the sibling, and the one-card board that reads `DISJOINT`.

## Verdicts

### 2026-09-09 — claude-opus-5@subagent (verifier, phase 2) — APPROVED WITH ASSIGNED CORRECTIONS

Tip judged `6ff8201107ac57e42db94d974512febc6abeed00`; base
`8cd11020e631f195952b4921c045a622b3df7809`. The bench is a detached
worktree, and its root is written INDENTED because a card's path arm hands
every prose token to `git check-ignore`, which answers 128 on an absolute
one — the very defect F-3 files, met here by the verdict that files it:

    /Users/ujju/Projects/nputer-V-T-287

attack set: sha256:ac5cc2d5c0faee9d9f7426f3d85134a1d511c52b529eff3199b33351d1751a6b (attack-set-T-287.md)
ground truths: sha256:ba5d72c69007ae40963cbe4e8dd8be590a609e9acf5bb548aae7521663a120bd (ground-T-287.md)
ground addendum: sha256:a6f1ca1d55af9d941f7dc817bae693211139aa5386a480bdefc9a4a3d9d6d8f7 (ground-T-287-addendum.md)

**THE FRAME I ACTUALLY HAD, said plainly.** Phase 1 was a separate,
tool-less spawn at the base and its set is hashed above; I re-verified all
three hashes before opening anything. Two departures to disclose. First,
**this brief carries no context pack** — it is hand-written by the seat,
which `method/roles/verifier.md` step 0 calls a dispatch fault; I read
`docs/CONVENTIONS.md` at the base and at the tip by the bullets I needed
(the gate list, the DOCS GATE, the suite battery) rather than end to end.
Second, **the brief's duties paragraph names the executor's report
inline** — its suite figures, its body count, its census figures and the
fact that `T-287-s1` was filed — so I held those claims before my findings
were written. I treated every one as a claim and re-measured it myself;
where my number differs from the report's I say so below.

## The fence, checked first and before anything was read for correctness

`git diff --name-status 8cd1102..6ff8201` is four paths and no more:

    M  docs/tasks/T-287-a-fence-token-…-not-a-dead-fence-entry.md
    A  docs/tasks/T-287-s1-a-directory-that-does-not-exist-yet-…-need-it.md
    M  tools/e2e/scripts/card-preflight.mjs
    M  tools/e2e/tests/card-preflight.spec.ts

All four are inside the fence. Nothing T-280 holds is touched
(`gate-run.mjs`, the gate-token and push-guard hooks, `docs-scan.mjs`,
`gate-run.spec.ts`, `push-guard.spec.ts`, CONVENTIONS); `fence.ts`,
`lane-fence.mjs`, `brief.mjs`, `dispatch-brief.mjs`, the hooks,
`docs/CAPABILITIES.md` and `docs/STATE.md` are all untouched. No other
card's frontmatter was moved. Method stamp `0.1.16` unmoved
(`git diff 8cd1102..6ff8201 -- method/` is empty). No dependency change.

## The suites, run whole at my own bench at the tip judged

    parser  exit 0  bodies 389   GREEN   ref 6ff8201
    app     exit 0  bodies 1171  GREEN   ref 6ff8201
    rust    exit 0  bodies 655   GREEN   ref 6ff8201  targets 18
    e2e     exit 0  bodies 821   GREEN   ref 6ff8201  (the FULL leg, not a scoped subset)

`card-preflight.spec.ts` alone: **56 passed** in 39.9s. Bodies 51 → 56;
**all 51 base body names are present at the tip and pass** — checked name
by name against the base file, not by count. The only deletions in the
spec diff are the `PINNED_CLAIM_CLASSES` prose, moved in lockstep with its
source, and the fixture's `otherTouches` default, which is preserved as
the fallback. No base body was deleted, renamed or weakened.

## The criteria, one at a time

**Criterion 1 — MET, and covered at each condition's own boundary.** Not
one happy-path body: condition A has a tracked-token verdict, condition B
has the untracked-ancestor verdict and the repository-root case, condition
C has the no-extension verdict. The render obligation is real — the body
asserts the ancestor substring `docs/architecture/components, which is
tracked`, and my mutant **M-C5** (drop the ancestor from the render string)
reds **exactly one** body. The non-refusal obligation is asserted as
`findings === []` rather than merely as exit 0, and my mutant **M-C4**
(let the reservation fall through to `raise`) reds **exactly two** — the
findings-count body and the arm's exit body. **M-C2** (remove the ancestor
check) reds **exactly two** — the two bodies that own condition B. Three
mutants, three tight kill sets, each landing at the site the property
lives.

**Criterion 2 — MET literally, and I checked it with the live token.**
Through the real CLI, same root, base CODE vs tip CODE:
`T-290` `docs/conventions/` is `exit 1` at both, DEAD at both. The
directory half and the untracked-parent half each carry their own
assertion, and the DEAD FENCE ENTRY message now names *which* half failed
rather than reusing the bare text — the attack set asked for exactly that
and got it.

**Criterion 3 — MET by existing behaviour, and the pin is a real pin, not
a tautology.** This was the likeliest place to fake the card and it was
not faked. The body imports and drives `decide` from
`.claude/hooks/lane-fence.mjs` — the program the harness actually runs —
not a stub written in the spec file. It first asserts that
`buildLaneFence`'s manifest carries the untracked path **verbatim**, which
is the load-bearing pre-existing fact the whole criterion rests on (I
confirmed it independently by reading `buildLaneFence`: it copies
`fence.paths` and filters on nothing). Its fixture fence holds the
reservation and **not** the parent directory, so the "refuses a sibling"
assertion is not vacuous. And it carries a genuine control whose arming
differs: the same work fenced the only way it could be fenced before this
card — the DIRECTORY — where the sibling **is** allowed.

**Criterion 4 — MET by existing behaviour, pinned through the real
dispatch view**, with a discriminating half (the identical board with one
reservation reads `DISJOINT`). I also checked the case the card does not
name and that phase 1 feared most: **a reservation against a parent
DIRECTORY token in another card.** Run through the real view myself:

    T-904 and T-903: OVERLAP — T-904 docs/architecture/components against
    T-903 docs/architecture/components/C-93-arrives-here.md, both reserve …

`pathsOverlap` is prefix-containment, so it holds. **The hazard does not
exist**: the many cards fencing `tools/e2e` whole still collide with a
narrow reservation underneath them.

**Criterion 5 — MET through the real CLI**, spawned as a process with the
exit read from the process, not a direct call to `preflight()`: exit 0
with a reservation and the reservation line still on stdout, exit 1 with a
dead entry.

## What I measured that the card does not claim

**The live census, re-derived at my own tip.** Over **683** cards:
**14 tokens across 3 cards** move from DEAD to RESERVATION
(`T-159-s1` ×12, `T-261`, `T-275`), and **10 tokens across 7 cards** stay
DEAD (`T-020`, `T-216-s4` ×3, `T-216-s7` ×2, `T-261`, `T-264`, `T-275`,
`T-290`). The report said 682 cards; I count 683 and note the difference
rather than adopt it.

**No planned card is unblocked by this change today, and that is worth
saying plainly.** `T-261` and `T-275` each gain a reservation and each
still carry a directory token that stays dead, so both remain refused;
`T-216-s7`'s parent is untracked, so it remains refused; and **ruling B's
`T-290` remains refused at step 3 after this card lands** — which is what
criterion 2 demands, so the diff is right and the card is not to blame.
The lane saw this itself and filed `T-287-s1` for it, naming all three
cards and arguing the discriminator honestly. That is the correct
disposition and I am not turning it into a correction.

**The byte ceiling (T-225's 65,536).** The **dispatch answer is
byte-identical** at base and tip — 134,234 bytes both — so reservations
are confined to `--preflight` output and the multiplicative growth phase 1
feared does not occur. `--preflight` grows: +4,950 bytes worst case
(`T-159-s1`, 12 reservations) and +2,827 on `T-292`, which gains no
reservation at all and pays only the fixed cost of the new disclosure
prose. Both cards were already over the floor at the base (83,604 and
71,536), the figure is a disclosed floor rather than a cut, and nothing is
newly breached.

**No second expander.** The classifier consumes `token.paths` — the
parser's own expansion — and asks only its own two questions of
`pathOracle`'s sets. It re-derives nothing about slug-vs-path, inspects no
raw token text, and calls no git per token. Nothing in the new code path
reaches a shell.

**The security sweep, run rather than reasoned.** Every climbing token
below never reaches the classifier — `fence.ts`'s `DOT_DOMAIN` refuses
them upstream as UNUSABLE — and they are written INDENTED for F-3's
reason, since `git check-ignore` answers 128 on a token that climbs out
of the repository exactly as it does on an absolute one:

    ../outside.ts   a/../../outside.ts   lib/../../x.ts   ..   .

Globs (`*`, `?`, `[`, `]`, `!`) are refused upstream likewise. `.supertaskr` holds no tracked
file, so **a lane cannot reserve the manifest the hook reads** — the
self-widening fence is closed, and closed for a real reason. Gitignored
paths (`node_modules/x.js`, `dist/out.js`, `lib/parser/dist/x.js`) all
fall dead on the parent rule. One real finding is below.

## FINDINGS

**F-1 (assigned correction 1) — the extension is read off the basename,
and nothing pins it.** The implementation is CORRECT: it reads
`leaf.lastIndexOf(".")`. But moving that read to the whole domain
(`domain.lastIndexOf(".")`) leaves **all 56 bodies green**. The gap is
reachable, not theoretical: `app/.vscode` is a tracked directory in this
repository whose name carries a dot, so `app/.vscode/settings` — a
directory token — flips from DEAD to RESERVED under the mutant. Phase 1
named this the single most likely implementation slip, because the
expander's own predicate is stated over the whole token and an implementer
copying it inherits the bug. Body committed; block below.

**F-2 (assigned correction 2) — a leading dot is not an extension, and
nothing pins that either.** `dot <= 0` is a deliberate, correct choice
(`.gitignore` is a dotfile, not a `.gitignore`-extensioned file), and
weakening it to `dot < 0` also leaves **all 56 bodies green**. The class is
live on this board: `T-020` and `T-264` carry `.nputerignore` in exactly
this shape, and `T-287-s1` is the card that will have to argue about it —
so the rule that card must move is currently untested. Body committed;
block below. One body carries F-1 and F-2 both; two corrections, two
blocks, one body, and the counts are stated so no shortfall is implied.

**F-3 (finding — suggested card `T-287-s2`, filed, not a correction) — an
absolute path at the filesystem root classifies as a reservation.**
the classifier answers `{ reserved: true, parent: "" }` for a token this
verdict must itself write indented —

    newFileReservation("/evil.ts", oracle)

— because `lastIndexOf("/") === 0` makes
`parent` the empty string — the very sentinel the genuine repository-root
case uses — so the parent check is skipped and the render says the token
hangs off "the repository root, which is tracked". **I did not make this a
REJECT, and the reason is a measurement rather than a judgement call.** It
is unreachable through the arm: a card whose fence names an absolute path
makes the preflight THROW first, in `ignoredTokens`, where `git
check-ignore` exits 128 — and it throws **identically at the base**, on
code this diff does not touch. So no card can be dispatched on it, no
manifest can carry it, and nothing the hook permits is widened; the
default posture that a wrongly-widened token is REJECT-class is rebutted
here by the fact that the widening cannot be reached. It is a latent
defect in a newly exported helper, and it becomes live the moment that
throw is fixed or another consumer calls the helper. The throw is also
WIDER than the misclassification — `git check-ignore` answers 128 on a
CLIMBING token too, so a card whose prose merely mentions one takes the
arm down, which this very verdict did until the tokens above were
indented. All of it is in the card.

**Notes, neither correction nor card.** A brace glob
(`tools/e2e/tests/{a,b}.spec.ts`) is not in `fence.ts`'s `GLOB_CHARS` and
becomes a reservation on a literal braced filename; it grants nothing the
hook can cash and the remedy is out of this fence. A newline inside a
token forges a line in the rendered preflight; the base's own
`fence <raw> reserves tracked files:` line is equally unescaped, so the
class is pre-existing and the new line adds one more site, at a
reachability YAML flow sequences make very low.

## The corrections, as blocks

```mutant
correction: the file extension is read off the BASENAME, never the whole token
file: tools/e2e/scripts/card-preflight.mjs
spec: tools/e2e/tests/card-preflight.spec.ts
body: the file extension is read off the BASENAME, and a leading dot is not one
message: a dotted DIRECTORY made the leaf look extended
--- old
  const dot = leaf.lastIndexOf(".");
--- new
  const dot = domain.lastIndexOf(".");
```

```mutant
correction: a leading dot is not a file extension
file: tools/e2e/scripts/card-preflight.mjs
spec: tools/e2e/tests/card-preflight.spec.ts
body: the file extension is read off the BASENAME, and a leading dot is not one
message: a dotfile's own leading dot was counted as an extension
--- old
  if (dot <= 0 || dot === leaf.length - 1) {
--- new
  if (dot < 0 || dot === leaf.length - 1) {
```

Both readings recorded by my own hand on this bench: the body is **GREEN**
against the implementation carrying the property (57 passed with the body
added at the tip) and **RED** against each implementation lacking it —
mutant one, `1 failed / 56 passed`, only this body; mutant two,
`1 failed / 56 passed`, only this body. Each kill set is a single body and
lands at the site the property lives.

## Verdict

**APPROVED WITH ASSIGNED CORRECTIONS.** The fence held, every base body
survived by name, all four suites are green at the tip judged, and all
five criteria are met — two of them by pre-existing behaviour that the
lane pinned honestly, against the real hook and the real dispatch view,
with the arming actually differing in both. The two corrections are
boundaries the implementation already gets right and the suite could not
see; the one defect I found cannot be reached from a card and is filed as
its own work.
