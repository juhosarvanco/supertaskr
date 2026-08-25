---
id: T-079
title: A motion utility without motion-safe is a lint hit
feature: F-02
milestone: 4
priority: 37
size: S
status: building
blocked_by: [T-058]
touches: [tools/e2e]
builder: claude-opus-5
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-028-s4 (fourth triage, 2026-08-19). The suggestion file is
removed in the same commit as this card.

TAILWIND EMITS A BARE RULE FOR EVERY ANIMATION UTILITY ALONGSIDE THE
GATED ONE, and both are in the shipped sheet — measured in
`app/dist/assets/`: the reduced-motion media block carries the
`motion-safe:` variants, and the ungated class sits outside it for every
motion utility this app has. Using the ungated one is a ONE-CHARACTER
MISTAKE that compiles, paints, and ignores the user's accessibility
setting silently. Nothing red-flags it: not `tsc`, not the token lint
(its patterns are about arbitrary values and default-palette utilities),
not the DOM suites, and not the lane, because a spec that does not
emulate reduced motion sees no difference.

TODAY THE TREE IS CLEAN and T-028 pinned its own corner: a
character-exact sweep over `app/src` asserting that its entrance utility
never appears un-prefixed, hand-written, inside a test belonging to one
task. **The property is general and the guard should be too.** Prior art
for why it is worth it: T-006 introduced one motion-safe utility and
T-012 another, three tasks apart, both correct by hand with nothing
enforcing it. Every T-028-shaped task adds a fourth chance to get it
wrong.

## Acceptance criteria
- THE token lint SHALL gain a pattern: inside a string literal, a class
  token matching an animation utility that is not immediately preceded
  by `motion-safe:` or `motion-reduce:` is a hit. Zero dependencies,
  same shape as the existing patterns, and the scanner already walks and
  masks exactly the right text.
- **THE PATTERN IS P6, NOT P5.** T-058 claims P5 for the control-byte
  rule, and this card is `blocked_by: [T-058]` for that reason. It lands
  in the extracted `scripts/token-scan.mjs`, not in the unconditional
  wrapper.
- **IT BELONGS TO THE TOKEN CORPUS, NOT THE CONTROL CORPUS.** This is a
  Tailwind rule and SHALL NOT be applied to prose, parser or Rust files
  — T-058's fourth criterion is explicit that token rules stay off the
  CONTROL corpus, and a motion utility named in a design document is not
  a violation.
- IT SHALL carry its own POSITIVE AND NEGATIVE selftest samples like
  every other pattern, and the allowlist SHALL stay ZERO. Per T-078's
  shape-five clause, the positive sample SHALL be reachable by the
  coverage floor T-080 adds rather than being a sample that can be
  deleted silently.
- T-028'S HAND-WRITTEN SWEEP SHALL BE KEPT OR EXPLICITLY RETIRED IN
  WRITING. Two gates over one property is not automatically duplication
  — T-058's own ruling on the standing control-byte check is the
  precedent, and the reasoning there (one fast and scoped, one running
  against a bare checkout) SHALL be applied here rather than assumed.

Verification: headless — `npm run lint:tokens`, the selftest, and a
planted bare motion utility shown RED then reverted with the restoration
proved by hash rather than by a clean `git status`.

## Implementation notes

**P6 lands in `tools/e2e/scripts/token-scan.mjs` and the tree stays
clean.** Lint exit 0 at `TOKEN 131 / CONTROL 639` files; selftest exit 0
at 65 TOKEN + 4 CONTROL samples, 87 walk-policy checks, 9 evidence-floor
checks — from 49 / 4 / 71 / 8 at the base `25a9e2c`. Both corpora counts
are PRINTED and pinned by nothing; derive them at your own ref.

### THE CARD'S OWN PREMISE IS WRONG, AND THE CONCLUSION SURVIVES IT

The problem statement above says Tailwind *"emits a bare rule for every
animation utility alongside the gated one … the ungated class sits
outside it for every motion utility this app has."* **Measured on a
freshly built `app/dist/assets/index-C86RloYb.css` (45 061 bytes,
byte-identical to the bundle STATE records at T-010's checkpoint), that
is false for two of this app's four animation utilities.**
`animate-map-teal-wipe` and `animate-card-rain` have NO bare rule in the
sheet. Tailwind v4 emits utilities STRICTLY ON DEMAND from scanned
candidates; a `@theme` key or an `@utility` block emits nothing by
itself. The two that DO carry a bare ungated rule
(`animate-status-pulse`, `board-rain`) carry it because a TEST FILE
writes the bare literal — routed as `T-079-s2`, with the four-row table
and the control that settles the mechanism.

**THE DEFECT IS UNCHANGED AND THE STATEMENT OF IT IS SHARPER.** Writing
`className="animate-status-pulse"` still compiles, still paints and
still ignores `prefers-reduced-motion` in silence — not because a paired
rule was lying in wait, but because the ungated candidate MINTS ITS OWN
RULE on the spot. That is strictly worse for a reviewer: the sheet is
downstream of the mistake, so no amount of reading `dist/` finds it.
Only a source-level gate does, which is this card.

### P6, AND WHY IT MATCHES NAMES RATHER THAN A SHAPE

Two lookbehinds and no variant-chain walk, over MASKED text. `:` is
deliberately NOT excluded from the first — that is exactly where an
ungated utility hides behind `data-[state=open]:` or
`[&_svg:not([class*='size-'])]:`, T-038's "a variant never excuses the
utility it modifies" now applied to P6, and it holds for the NESTED
variant a chain-parsing regex misses. `isVariant` needed no change: the
match is the bare utility and carries no group, so it reaches the same
"no group inside the match — never a variant" branch P3 does.

**THE NAME LIST IS A MEASUREMENT, NOT A PREFERENCE.** A bare
`animate-\w+` shape reds this tree in six places, none of them a
violation, and the allowlist must stay ZERO:

| site | shape | why a shape rule is wrong |
|---|---|---|
| `app/test/genesis-pane-dom.test.tsx` ×4 | `"[class*=animate-status-pulse]"` | an attribute SELECTOR applies no class — closed by excluding `=` |
| `app/test/map-view-dom.test.tsx:219` | `"animate-status" + "-pulse"` | the tree's own assembled-name hygiene idiom; `animate-status` names no utility — closed by the name list |
| `app/test/map-visuals.test.ts:260` | `"animate-"` | a bare prefix names nothing — closed by requiring a name |

Reporting the second shape would push authors toward writing the full
literal, which is precisely the minting hazard `T-079-s2` documents.
"A class token MATCHING AN ANIMATION UTILITY" is this card's own
wording, and a documented name constant is `PALETTE`/`COLOR_PREFIXES`'
established shape in the same file.

**The staleness a list buys is closed loudly.** `motionFloorChecks()`
derives every animation this tree DECLARES from the tracked `.css`
files — `--animate-<name>:` theme keys and `@utility <name>` blocks whose
body animates — and reds the selftest unless each is in
`MOTION_UTILITIES` or argued into `MOTION_UTILITIES_OUT`. Two lists that
must agree, the `MUST_TOKEN_COVER` / `MUST_CONTROL_COVER` shape one rung
up. It is ONE-DIRECTIONAL by design and must stay so: `bounce`, `ping`,
`pulse`, `spin` come from Tailwind core and `in`/`out` from
`tw-animate-css`, and none is declared anywhere here. **THE RESIDUAL
HOLE IS NAMED IN THE CODE RATHER THAN PAPERED OVER** — deleting one of
those six loses its coverage with no tree fact to red against;
`status-pulse`, `map-teal-wipe` and `spin` are held by samples besides,
`card-rain` by the derived floor (proved as M5 below).

### WHERE THE CARD WAS WRONG, BEYOND ITS PREMISE

**Criterion 1 says "not IMMEDIATELY preceded by `motion-safe:` or
`motion-reduce:`". The repository takes the wider read.** Tailwind
variants compose, so `motion-safe:group-hover:animate-spin` and
`group-hover:motion-safe:animate-spin` compile to the same rule in the
same `@media` block; the literal spelling would report a correctly gated
class, and a false positive under a zero allowlist is how a gate gets
weakened later. P6's second lookbehind accepts the gate ANYWHERE in the
token's variant chain and cannot cross whitespace or a quote into the
next token. Both spellings are pinned as samples, with
`"motion-safe:animate-spin animate-ping"` pinning the non-crossing half.

### CRITERIA 2 AND 3

P6, not P5 — the gap in `TOKEN_PATTERNS` is deliberate and commented
where a reader meets it, because T-058 owns P5 for the control-byte rule
and a number a checkpoint has quoted is not reused. P6 is a member of
`TOKEN_PATTERNS` and is reached only by `scanSource`, so it is
STRUCTURALLY incapable of touching CONTROL: `lintTree` applies
`scanControlSource` alone to the tracked corpus. **This card's own file
is the proof** — it spells `animate-status-pulse` a dozen times and
CONTROL is clean at 639 files.

### CRITERION 4 — THE SHAPE-FIVE GUARD, PROVED BY DELETION

The evidence floor generates one row per member of `TOKEN_PATTERNS`, so
adding P6 to the PRODUCTION list makes the floor demand a P6 positive
with no line written for it: the floor grew 8 → 9 on its own. Proved
rather than asserted — deleting ALL FIVE P6 positive samples gives
**exit 1**, `selftest FAIL: evidence floor — P6 has a positive sample
(0)`. The lane pin at `tools/e2e/tests/token-scan.spec.ts` reads
`TOKEN_PATTERNS.length + 4` and moved with it.

### CRITERION 5 — T-028'S SWEEP IS KEPT, AND THE REASON IS MEASURED

T-058's precedent (one gate fast and scoped, one running against a bare
checkout) applies and was not merely assumed — but a stronger reason was
measured on top of it. **P6 cannot see `board-rain` at all.** It is an
`@utility` whose BODY animates, so its class name carries no `animate-`
prefix and nothing in the token marks it as a utility. Adding bare
custom-utility names to P6 reds `app/test/genesis-mount.test.tsx:506`,
where `"board-rain"` is a needle searched for in built JS — a false
positive under a zero allowlist. So `board-rain` sits in
`MOTION_UTILITIES_OUT` with its reason, the derived floor forces any
future animating `@utility` to be argued the same way, and **T-028's
character-exact sweep is the ONLY guard over that name.** Retiring it
would have opened a hole in the same commit that closed one.

Two gates over the `animate-` family is likewise not duplication: the
samples run against a BARE CHECKOUT as CI's first step, and the new lane
body plants a real bare utility into `app/src` and proves the wrapper
reds with its `motion-safe:` twin on the line above untouched.

### THE POISON DRILL — six producer mutations, all red, all restored

Detached scratch worktree `drill-T-079` at `b0b886d`, driver and results
files per-lane named, every mutation read back with `git diff` BEFORE the
run, every restore proved by sha256 against
`b666643df6477cb0319b490375e99e454a8d105e21176be57055c02cde5c1dbf`.
ONE SIDE ONLY — every mutation edits the producer, never a sample.

| # | producer mutation | selftest | lint over the tree |
|---|---|---|---|
| M1 | `animate-` → `anXmate-` in P6's source | **1**, 14 failures | 0 — the tree has no violation to miss |
| M2 | the gate alternation neutered | **1**, 13 failures | **1**, 9 TOKEN — every correctly gated site |
| M3 | `=` dropped from the first lookbehind | **1**, 1 failure | **1**, 4 TOKEN — the exact four selector sites |
| M4 | the CSS derivation blinded (`.css` → `.cssx`) | **1**, `tracked CSS declares motion utilities (0)` | 0 |
| M5 | `card-rain` dropped from `MOTION_UTILITIES` | **1**, `declared motion utility card-rain … is matched by P6 or argued out` | 0 |
| M6 | start boundary narrowed to quotes only | **1**, 4 failures | 0 |

**M1 IS THE ONE WORTH READING TWICE.** A P6 that matches NOTHING leaves
the lint at exit 0 over a clean tree — the tree cannot tell you the gate
broke. Only the selftest can, which is the whole argument for CI running
it as a separate first step.

**M5 IS THE SHAPE-FIVE CLOSURE ONE LEVEL UP.** Deleting `card-rain`
removes its own per-name floor row, and the run still reds — against the
row derived from `app/src/index.css`, which did not move with it.

**M6 ANSWERS THE SHAPE-SIX QUESTION WITH A MUTANT.** Narrowing the start
boundary to "immediately after a quote" leaves all nine per-name floor
rows GREEN — every one scans `"animate-<name>"`, which starts after a
quote — and reds four SAMPLES that carry a whitespace or variant
boundary. The samples are therefore not duplicates of the floor rows:
they kill a mutant the floor rows cannot.

### THE VERIFICATION CLAUSE, RUN BY HAND

A bare `animate-status-pulse` planted into `app/src/genesis/GenesisPane.tsx`
with its `motion-safe:` twin on the line above: lint **exit 1**, ONE hit
reported at the bare line and nothing at the gated one, restored with
sha256 `7e2989f6…` identical before and after — proved by hash, never by
a clean `git status`. The lane body at
`tools/e2e/tests/token-scan.spec.ts` runs the same shape against
`app/src/architecture/MapNode.tsx` on every `npm test`.

### THE SUITES' OWN HYGIENE

Every new body assembles the utility name (`animate-status${"-"}pulse`)
rather than spelling it, so the spec guarding against a minted ungated
candidate does not mint one. The rebuilt bundle is byte-identical to
main's — `index-C86RloYb.css` 45 061 and `index-DEkJr3K8.js` 526 423 —
which is the check that this held.

## Verdicts
