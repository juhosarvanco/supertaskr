---
id: T-020-s5
title: Token lint P1 fires on dash-prefixed arbitrary VARIANTS and on regex literals — the plan's recorded variant exclusion is only half-implemented
status: suggested
suggested_by: verifier claude-opus-5 @T-020
---

T-020 plan §5 records an exclusion in so many words: *"arbitrary
VARIANTS (`[&_svg]:…`) are deliberately not linted — they target
selectors, not values (the token mechanism still governs the utility
half)"*. The shipped P1 pattern is `/-\[[^\]]/` — a hyphen immediately
followed by a bracket — and it implements that exclusion only for the
variant family whose bracket does NOT follow a hyphen. Every OTHER
arbitrary variant fires it. Re-derived against
tools/e2e/scripts/lint-tokens.mjs, one file per line, verbatim output:

    app/src/hostile.tsx:10: data-[state=open]:bg-accent  [P1: arbitrary value …]
    app/src/hostile.tsx:11: group-[.peer]:hidden  [P1: arbitrary value …]
    app/src/hostile.tsx:12: supports-[display:grid]:grid  [P1: arbitrary value …]
    app/src/hostile.tsx:13: min-[600px]:flex  [P1: arbitrary value …]
    app/src/hostile.tsx:2: /foo-[abc]/g  [P1: arbitrary value …]
    app/src/hostile.tsx:3: /task-[0-9]  [P1: arbitrary value …]

The tree passes today, so nothing is broken — the vendored
ui/button.tsx carries exactly three `[&_svg…]` variants and they are
the one variant shape P1 cannot see. That is luck, not design, and it
runs out on the next vendoring: `data-[state=open]:`,
`data-[side=top]:` and friends are stock shadcn output on Dialog,
DropdownMenu, Tabs, Accordion, Popover and Tooltip. The first person
to `npx shadcn add dialog` gets a red lint on unmodified upstream
code, and the zero-allowlist rule (correct for `p-[13px]`) leaves them
only two moves: hand-edit vendored code, or come back here.

Second class, same pattern: a regex literal containing `-[` is a P1
hit. app/src has none today; the repo's own house style produces them
freely — lib/parser/src/frontmatter.ts:35 is `/^---[ \t]*(?:\r?\n|$)/m`,
which is exactly this shape and is only safe because the scan is
scoped to app/src. Any future widening of the walk (or one regex
landing in app/src) trips it.

Three candidate fixes, none decided here:

1. **Narrow P1 to a value position** — require the bracket contents to
   look like a VALUE rather than a variant, e.g. reject the match when
   the closing `]` is followed by `:` (every arbitrary variant ends
   `]:`; no arbitrary value does). One predicate, no allowlist, and it
   restores the plan's recorded exclusion for the whole variant
   family. Costs the ability to catch `min-[600px]:` — which is a
   breakpoint value in variant clothing, so the exclusion should be
   argued rather than assumed.
2. **Skip regex literals** — strip `/…/flags` runs before scanning a
   line. Cheap and safe for the P1 collision; does nothing for
   variants.
3. **Leave it, and say so in CONVENTIONS**: "vendored shadcn arriving
   with `data-[state=…]` variants is a consultation" — which is the
   zero-allowlist rule applied honestly, but it puts a stop-and-consult
   gate on a routine `npx shadcn add`.

Whichever is chosen, the selftest's negative samples should gain the
variant shapes it currently misses (`data-[state=open]:bg-accent`,
`supports-[…]:`, `group-[…]:`) so the decision is pinned in code and
not re-litigated. Today the eight negatives happen to contain only the
one variant form that already passes.
