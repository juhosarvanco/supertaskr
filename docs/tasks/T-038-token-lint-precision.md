---
id: T-038
title: Token lint precision — a regex literal is not an arbitrary value, and neither is a variant
feature: F-02
milestone: 4
priority: 21
size: S
status: done
blocked_by: []
touches: [tools/e2e/]
builder: claude-opus-5
verifier:
built_by: claude-opus-5 @fresh
verified_by:
review: self-verified
---

Absorbs: T-020-s5, T-037-s1. (CLOSED at merge 2026-08-16 — the gate
is green; the paragraph below is kept as the record of what was wrong.)
**The gate WAS RED on main** —
`npm run lint:tokens` exits 1 against an untouched tree because
pattern P1 (`-\[[^]]`) matches a REGEX LITERAL at
`app/src/genesis/genesis-derive.ts:231`, not a Tailwind class. T-020's
own verifier predicted exactly this class ("P1 fires on regex literals
containing `-[`; `lib/parser/src/frontmatter.ts:35` is that shape,
safe only by scope") and the scope caught up when T-024 landed a
character class inside app/src. The second predicted class is still
loaded: P1 also fires on arbitrary VARIANTS (`data-[state=open]:`,
`group-[.peer]:`, `supports-[…]:`, `min-[600px]:`) which the T-020
plan §5 deliberately does NOT lint — safe today only because the
vendored `[&_svg]` has no preceding hyphen, so the next
`shadcn add <component>` reds the tree.

Consequence beyond the annoyance: the lint is CI's step 1, before
every install, so the standing "watch the first CI run" item aborts
before reaching any of the Linux evidence it exists to collect (the
T-018-s3 sentinel tests among it). A gate that cries wolf on a clean
tree also teaches its readers to route around it, which is how
enforcement mechanisms die.

## Acceptance criteria
- THE lint SHALL exit 0 on the current untouched tree, and the fix
  SHALL be precision — never the removal of a pattern, never an
  allowlist of files or lines (the zero-allowlist design in T-020 §5
  stands; a genuine future collision is a consultation, not an
  escape hatch).
- THE lint SHALL NOT report a match inside a regular-expression
  literal or a string that is not a class context — mechanism is the
  executor's call (a real tokenizer pass, a class-attribute-scoped
  scan, or an equivalent), recorded with its limits in the script's
  header so the next reader knows what it does and does not see.
- THE lint SHALL NOT report arbitrary VARIANTS (`data-[…]:`,
  `group-[…]:`, `supports-[…]:`, `min-[…]:`, `[&_svg]:` and the
  family) — they target selectors, not values, and the token
  mechanism still governs the utility half; the exclusion is recorded
  in T-020 §5 and SHALL become executable rather than incidental.
- THE lint SHALL still catch every true violation it caught before:
  the four patterns' positive cases (`p-[13px]`, `[color:red]`,
  `text-red-500`, `bg-(--x)`) SHALL each be re-proven by planting one
  and requiring file:line output with exit 1, and the `--selftest`
  sample set SHALL grow to carry the new negative cases (regex
  literal, each variant family) so the precision itself is pinned.
- WHEN the lint runs in CI THE step SHALL behave identically to the
  local command (one source of truth — the parity spec already binds
  the command string; confirm it still matches).

Verification: headless — `npm run lint:tokens` exit 0 on the tree,
`--selftest` green with the enlarged sample set, the four plant-and-
revert drills with output pasted, and the E2E lane (17/17) plus the
three repo suites unchanged. S-tier: executor + tests, orchestrator
merges.

## Implementation notes

Built by claude-opus-5 @fresh on branch `t038-lint-precision`, branch
point main@2a46887 (S-tier: executor + tests, no verifier follows).
**One file changed**: `tools/e2e/scripts/lint-tokens.mjs`
(+375 / −33). Zero diff to app/**, lib/parser/**, method/**,
docs/architecture/**, `.github/**` and every lockfile. No new
dependency — see "zero deps is structural" below.

### The mechanism, and why this one

**The four patterns are byte-identical to T-020's.** Nothing was
removed, weakened or allowlisted. What changed is the TEXT they are
applied to, plus one grammar rule applied to their hits.

**1. Context — a length-preserving mask.** A hand-written lexer walks
each file and replaces every character that is not string- or
template-literal TEXT with NUL: code, line comments, block comments and
regular-expression literals all go dark. Newlines and total length are
preserved, so `file:line` is still read straight off the offsets, and
the report string is cut from the RAW line at the same offsets (so the
output still reads `p-[13px]`). String delimiters survive the mask
because P2 anchors on the quote.

Why a mask and not a strip: a Tailwind class is ALWAYS string text and
a regex literal never is, so the whole false-positive family dies at
once — the `<!--[\s\S]` in genesis-derive.ts, the `/^---[ \t]*/m` in
frontmatter.ts that T-020's verifier predicted, and a third class
nobody had catalogued (below). Length preservation is what let the four
patterns stay untouched; it is asserted in code (`mask length != source`
throws) so a lexer bug is a loud crash, never a quiet miss.

**2. Variants — Tailwind's own grammar, made executable.** A bracket or
paren group immediately followed by `:` is an arbitrary VARIANT, not an
arbitrary value. The `:` is the separator between a selector-targeting
variant and the utility it modifies (`data-[state=open]:bg-primary`);
an arbitrary VALUE ends its utility (`p-[13px]`, `bg-(--brand)`).
Nesting counts, the search is line-bounded, and an unclosed group is
NOT treated as a variant — every uncertainty resolves toward reporting.
This is T-020-s5's candidate 1, and it covers the whole family in one
predicate rather than one name at a time, so `shadcn add dialog` /
`tooltip` / `popover` will not red the tree. The utility half is still
governed: `data-[state=open]:bg-red-500` is still a P3 hit (proven
below).

**Why no dependency, and why not the TypeScript compiler's own
scanner.** `typescript` is already a devDependency of tools/e2e, so a
real tokenizer pass was available for free — except that it is not
free. The token lint is CI's FIRST step, ahead of every `npm ci` in the
job (ci.yml: `Token lint selftest` → `Token lint` → `parser install` →
…), so it must run against a bare checkout with no node_modules at all.
Zero-deps is structural here, not taste; that reason is now recorded in
the script header so nobody "improves" it into a dependency. The cost
is that the lexer is a heuristic, which is why its limits are written
down rather than glossed.

**Honest limits (all recorded in the script header).**
- It is a LEXER, not a TS parser: strings, templates (incl. nested
  substitutions), comments, regex literals. Nothing about types, JSX
  structure or scope.
- Regex-vs-division is the classic previous-significant-character
  heuristic plus two JSX guards (`/` before `>` is a self-close; `/`
  after `<` is a closing tag) plus a hard rule that a regex must close
  on its own line or the slash is ordinary code. Both misreads are
  contained to ONE line; neither cascades.
- **The one measured false negative**: a braceless statement whose
  regex contains a quote, sharing a line with a real violation —
  `if (x) /["']/.test(y) && cls("p-[13px]");` is silent (the `)` before
  `/` reads as division, so the quote inside the regex opens a
  pseudo-string that swallows the class). Add braces and it fires. This
  shape does not occur in the tree and is a documented cost of the
  heuristic, not an allowlist.
- It scans EVERY string, not only class strings — it cannot tell
  `className="text-red-500"` from a URL containing the same token.
  Deliberate: criterion 2 offers "a real tokenizer pass" as a
  sufficient mechanism, and erring toward seeing MORE keeps the failure
  direction safe (a false positive is a one-line consultation; a false
  negative silently reopens the bypass the lint exists to close).
- A hard-coded breakpoint in variant position (`min-[600px]:`) is now
  invisible. T-020-s5 asked for that to be argued rather than assumed —
  argued in "the min-[…] question" below, and filed as T-038-s1.
- Zero allowlist survives intact: no file, line or comment can mute it.

### The min-[…] question, argued (T-020-s5 asked for this)

`min-[600px]:flex` compiles to `@media (width >= 600px) { .flex }` — a
media-query WRAPPER around a real, mapped utility. Nothing is silently
dead, which is the harm the tokens-only rule exists to prevent
(CONVENTIONS: "unmapped utilities are deliberately dead"). It is a
variant by Tailwind's grammar and by its output, and T-038's own
criterion names `min-[…]:` in the family that SHALL NOT be reported.
The residual concern is real but is a DIFFERENT rule: a hard-coded
breakpoint escapes `@theme --breakpoint-*` the way a hard-coded colour
escapes `--color-*`. That deserves its own pattern, argued on its own
evidence — filed as **T-038-s1**, not smuggled in under P1.

### Criteria → evidence

| criterion | evidence |
|---|---|
| exit 0 on the untouched tree; precision, never removal, never an allowlist | obligation 1 below. `git diff` of the patterns: **zero** — `makePatterns()` is character-identical to main. No file/line/comment mute exists anywhere in the script (grep: no `eslint-disable`-style hatch, no path list). |
| no match inside a regex literal or a non-class string context | obligation 1 + the differential (122 files, 11 old-only hits, 0 new-only) + 7 regex/comment negatives in `--selftest`; mechanism and limits recorded in the script header |
| no match on arbitrary variants | obligation 4 (five real variants planted in vendored button.tsx → silent; the same five under main's script → 5 hits) + 12 variant negatives in `--selftest` |
| every true violation still caught | obligation 3 (four plant-and-revert drills, one per pattern, each `file:line` + exit 1) + 12 positives in `--selftest`, including two where a variant and a value share a line |
| CI step identical to the local command | the invocation is untouched (`npm run lint:tokens` → `node scripts/lint-tokens.mjs`; CI adds `--selftest`), so workflow-parity.spec.ts still binds it — test 14 green in the 17/17 lane run. **No `.github/` diff was needed.** |

### Proof obligations

**1. Exit 0 on the untouched tree.** Same tree, both scripts (`git
stash` / `stash pop` around the run):

    === BEFORE (branch point, script as on main) ===
    app/src/genesis/genesis-derive.ts:231: !--[\s\S]*?(?:--  [P1: arbitrary value (`p-[13px]` family — the T-001-s2 bypass)]

    lint-tokens: 1 violation — tokens live in app/src/styles/tokens.css; …
    EXIT=1

    === AFTER (T-038 script, same tree) ===
    lint-tokens: clean (36 files scanned under app/src)
    EXIT=0

**2. `--selftest` green, enlarged.** 17 samples → **43**, all green.
The 26 new ones: 3 positives pinning that precision did not cost
detection (an interpolated value `` `p-[${n}px]` ``; a variant + value
on one line; a variant + palette utility on one line), 1 negative for a
CSS var read in string context, 6 negatives for regex literals (the
genesis line verbatim, the frontmatter.ts:35 shape T-020 predicted, a
regex spelling P1, one spelling P2, one spelling P3+P4, and one whose
quote would open a pseudo-string without regex recognition), 1 for
division-is-not-a-regex, 2 for comments (line + block), and 13 for the
variant families — `data-[…]`, `group-[…]`, `supports-[…]`,
`min-[…]`/`max-[…]`, `has-[…]`, `peer-[…]`, `aria-[…]`, `not-[…]`,
`in-[…]`, `nth-[…]`, the paren form `supports-(--x):`, the vendored
nested `[&_svg:not([class*='size-'])]:` verbatim, an interpolated
variant, and the stock `data-[side=top]:`/`data-[state=closed]:` pair
the next `shadcn add` brings in.

**3. Four plant-and-revert drills**, one per pattern, planted into a
real className (`app/src/components/shell/PaneRail.tsx:38`), each
reverted with `git checkout` and re-run clean:

    app/src/components/shell/PaneRail.tsx:38: p-[13px]      [P1: arbitrary value …]        EXIT=1 → reverted → clean, EXIT=0
    app/src/components/shell/PaneRail.tsx:38: flex [color:red]  [P2: arbitrary property …] EXIT=1 → reverted → clean, EXIT=0
    app/src/components/shell/PaneRail.tsx:38: text-red-500  [P3: default-palette utility …] EXIT=1 → reverted → clean, EXIT=0
    app/src/components/shell/PaneRail.tsx:38: bg-(--x)      [P4: v4 var shorthand …]       EXIT=1 → reverted → clean, EXIT=0

**4. The variant class, proven both directions.** Five stock-shadcn
variants planted into the vendored `app/src/components/ui/button.tsx:20`
cva string — `data-[state=open]:bg-accent data-[side=top]:opacity-90
group-[.peer]:hidden supports-[display:grid]:grid min-[600px]:flex`:

    T-038 script:  lint-tokens: clean (36 files scanned under app/src)   EXIT=0
    main's script: 5 × "[P1: arbitrary value …]" on button.tsx:20 (+ the standing genesis hit) → 6 violations, EXIT=1

So the class was real, not hypothetical. Then, on the SAME line:

    + p-[13px]                    → button.tsx:20: p-[13px]  [P1: …]                      EXIT=1
    bg-accent → bg-red-500        → button.tsx:20: data-[state=open]:bg-red-500  [P3: …]  EXIT=1

The variant is skipped; the value and the utility half are not.
Reverted; `git status --porcelain app/` empty.

**5. Every new sample actually executes** — four mutation drills, each
reverted, the script byte-restored afterwards (`diff` against a
pre-mutation copy: identical):

| mutation | selftest |
|---|---|
| `isVariant()` → `false` | EXIT=1, **13** samples red (every variant family + the two mixed-line positives gaining a spurious P1) |
| `maskSource()` → `src` | EXIT=1, **7** samples red (the regex negatives + both comment negatives) |
| `regexEnd()` → `-1` | EXIT=1, **1** sample red — the quote-bearing regex, which is the one pinned by regex recognition rather than by the mask alone |
| one negative's `expect: []` → `["P1"]` | EXIT=1, 1 failure, named |

**6. Suites** (all run in this worktree at branch point main@2a46887):

| suite | result |
|---|---|
| lib/parser `npx vitest run` | **159 passed** (10 files) — baseline |
| lib/parser `npx tsc --noEmit` | clean |
| app `npm run build` | ✓ built |
| app `npm test` (after the build) | **468 passed** (26 files) — baseline |
| app/src-tauri `cargo test` | **139 passed, 0 failed, 2 ignored** — baseline |
| tools/e2e `npm run typecheck` | clean |
| tools/e2e `npx playwright test` | **17 passed** (4.7s), headless, incl. workflow-parity 14 (the command-string binding) |

**7. Fence.** `git diff --stat` → `tools/e2e/scripts/lint-tokens.mjs |
408 ++++----` (375 insertions, 33 deletions), one file, plus this task
file and T-038-s1/s2.
`git status --porcelain` shows nothing under app/**, lib/parser/**,
method/**, docs/architecture/**, `.github/**` or any lockfile. Every
transient plant was reverted with `git checkout` and re-verified.
Nothing bound or contacted port 1420; the lane used its own 14520; the
boot-check script was not run; no model calls.

### The differential — the strongest single piece of evidence

A scratch harness (not committed) ran main's line-based scan and the
new masked scan over **every .ts/.tsx in the repo — 122 files**, well
past the 36 the lint walks, and diffed the hit sets:

    files=122  both=0  OLD-only=11  NEW-only=0

Zero NEW-only hits: precision cost nothing anywhere in the repo. All 11
OLD-only hits are false positives, and they include a **third collision
class nobody had catalogued** — TypeScript LABELED TUPLES:

    app/test/architecture-derive.test.ts:57  [P2]  specs: [id: string, spec: ComponentSpec][],
    app/test/board-truth.test.tsx:47         [P2]  type Field = [key: string, value: string | number];
    lib/parser/src/frontmatter.ts:35         [P1]  const close = /^---[ \t]*(?:\r?\n|$)/m.exec(rest);
    app/src/genesis/genesis-derive.ts:231    [P1]  return text.replace(/<!--[\s\S]*?(?:-->|$)/g, "");
    …9 labeled-tuple hits in all, across 6 files

`type Field = [key: string, value: string]` is ordinary TS that P2
reads as `[color:red]`. It has not landed in app/src yet; it is one
`type` alias away, and it is now dead by mechanism rather than by luck.

A second harness checked the opposite direction — that the mask is not
hiding real classes: of **558** Tailwind-token occurrences in app/src
(`flex`, `grid`, `rounded-lg`, `text-sm`, `gap-N`, …), exactly **3**
were masked away, and all 3 are inside doc comments. 555/555 in-string
class tokens survive.

### Adversarial probes (scratch fixture, not committed)

A hostile .tsx exercised the lexer's landmines; each behaved as
required: regex after `=>` silent but `() => "text-red-500"` caught ·
regexes containing quotes silent · `/a/.test("p-[13px]")` catches the
STRING · division does not swallow the class after it · JSX comments,
line comments and doc blocks silent · `<span className="text-[0.8rem]"
/>` caught (the `/>` guard) · a class after `</div>` on the same line
caught · an apostrophe in JSX text (`don't`) does not hide the
className beside it (it scans MORE, never less) · unterminated string
resyncs at the next line · escaped quote inside a class string caught ·
`` `p-[${n}px]` `` caught · `` `data-[state=${s}]:flex` `` silent ·
generic arrow `<T,>` caught. The single failure found is the
braceless-if-with-a-quoted-regex shape recorded under limits above.

### Carried out of this build

- **Triage encoding gap for the INTEGRATOR (not mine to fix — outside
  the `tools/e2e/` fence):** the dispatch commit 3fe4d92 says T-038
  absorbs T-037-s1 and removed T-020-s5's file, but
  `docs/tasks/T-037-s1-token-lint-is-red-on-main.md` is still on main —
  it arrived afterwards with T-037's merge (2a46887). Per CONVENTIONS'
  suggestion-triage encoding it should be `git rm`'d at this merge.
- Suggestions filed: **T-038-s1** (breakpoint variants are now
  invisible — if breakpoints should be tokens, that is its own rule),
  **T-038-s2** (the scan can now safely widen past app/src — the reason
  it could not, the frontmatter.ts regex, is gone).

## Verdicts
