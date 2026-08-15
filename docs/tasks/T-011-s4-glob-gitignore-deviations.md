---
title: Name glob.ts's two deliberate gitignore deviations explicitly (and consider warning on the forms)
status: suggested
suggested_by: verifier claude-fable-5 @T-011
---

T-011 verification cross-checked the matcher against real
`git check-ignore` (60 rows): everything in the documented subset
agrees except two deliberate deviations plus one degenerate corner,
none present in the live registry (all 35 path lines are literals or
`dir/**`). The matcher's behavior is right for intent declaration; the
header just doesn't SAY where it departs from git:

1. **Negation below an excluded parent.** glob.ts implements pure
   last-match-wins (documented, unit-pinned, load-bearing: the
   C-01/C-02 carve-out fixture depends on it). git additionally
   refuses to re-include anything below an excluded directory, so
   `["app/**", "!app/test/**"]` un-claims here but stays ignored for
   git. The git rule is a traversal optimization that would make every
   subtree carve-out a silent no-op and fake D4s — the deviation is
   correct, but the header's "(gitignore last-match-wins)" reads as
   full git-negation equivalence. One sentence naming the dropped
   rule turns a latent surprise into a spec.
2. **Single-segment leading slash.** `/dist` is stripped to `dist`
   (T-008's chartered normalization) and thereby UNANCHORED — it
   claims every `dist` at any depth, where git anchors it to the
   root. Multi-segment `/a/b` is unaffected (anchored either way).
   An architect writing `/dist` with git's root-only intent silently
   over-claims. Options: document the consequence next to the strip
   rule, and/or have the component parser (C-06) warn on
   single-segment leading-slash patterns (`dist/**` is the anchored
   idiom the registry already uses everywhere).
3. Degenerate: `a//b` collapses the empty segment (≡ `a/b`); git
   matches nothing. Typo-forgiving, but worth one line or a warning.

Doc-only fix is S-sized inside glob.ts's header; the optional
parse-time warnings are lib-parser (C-06) territory.
