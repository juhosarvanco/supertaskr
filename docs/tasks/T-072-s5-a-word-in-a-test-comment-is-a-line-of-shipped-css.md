---
id: T-072-s5
title: A word in a test comment is a line of shipped CSS, and nothing in the repo knows it
status: suggested
suggested_by: executor claude-opus-5 @T-072
---

**MEASURED, ON THIS CARD, BY ACCIDENT.** T-072's diff touches
`app/src/genesis/**` and `app/test/**` and adds not one class name. Its
first build emitted `index-C0CllKeP.css` at **43.98 kB** where the base
tree emits `index-CwYF5FQb.css` at **43.95 kB** — a **27-byte** growth in
the SHIPPED stylesheet with no styling change anywhere.

The whole delta is one rule: **`.isolate{isolation:isolate}`**. Derived
by extracting every selector from both stylesheets and taking the set
difference — one selector added, none removed. Its source is the bare
word `isolate`, written once, in a **comment**, in
`app/test/interview-model.test.ts`. At the base tree that word appears
**nowhere** under `app/src` or `app/test`; `git grep -nw isolate e83ee1d
-- app/src app/test` is empty.

**THE MECHANISM.** `app/src/index.css` says `@import "tailwindcss"` with
no `@source` directive, so Tailwind v4's automatic source detection scans
the Vite root — `app/` — minus what `.gitignore` excludes. That includes
**`app/test/**`, which ships no byte to the bundle**. Tailwind extracts
candidate strings from raw text without parsing it, so prose is
indistinguishable from a `className`, and any English word that happens
to name a utility becomes a rule. `isolate` is one; so are `grid`,
`table`, `hidden`, `block`, `inline`, `fixed`, `static`, `visible`,
`italic`, `truncate`, `container`, `underline`, `capitalize` and a good
deal of ordinary vocabulary.

**WHY IT IS MORE THAN 27 BYTES.** CONVENTIONS' UI bullet says *"unmapped
utilities are deliberately dead"* — the enforcement is that they are
ABSENT from the emitted stylesheet, so a `className` reaching for one
does nothing. A comment that emits the rule makes that utility LIVE, and
the rule it weakens is one nothing tests. It also breaks the only cheap
signal an integrator has: STATE quotes CSS content hashes across merges
precisely because *"the CSS hash did not move"* is the honest form of
"zero new tokens" (T-081's checkpoint says so in as many words). A hash
that moves on a comment makes that signal unreadable in the direction it
matters.

**T-072 DODGED IT RATHER THAN SHIPPING IT**, deliberately: the sentence
was reworded, `git grep -nw isolate` over `app/src app/test` is empty
again, and the final build's stylesheet is **`cmp`-identical to the
base's**, exit 0. Dodging is not a fix — the next writer does not know
the trap exists, and the trap is in the vocabulary.

**Three closes, in increasing cost.**

1. **A `@source` directive** in `app/src/index.css` naming `./src` (and
   `index.html`) so Tailwind stops scanning `app/test` at all. One line,
   and it also stops the E2E lane's own fixtures from contributing. This
   is almost certainly the right answer: `app/test` contributes no
   markup and never should.
2. **A tripwire beside the build** — the built stylesheet's byte size or
   its selector set pinned against a recorded value, so an unexplained
   growth reds instead of being noticed by whoever happens to compare
   two build logs. `app/test/window-manifest.test.ts` already reads the
   built CSS off disk and would be the natural host.
3. **Both**, which is the only combination that also catches a stray
   utility introduced from `app/src` itself.

**IT IS THE `T-084` FAMILY WITH A NEW MEMBER.** That card is *"docs/ is a
code input and neither standing gate knows it"*. This is the same shape
one directory over: **`app/test` is a STYLESHEET input**, the four walks
table in CONVENTIONS does not describe the Tailwind scan at all, and the
scan is a fifth walk with its own authority (`app/src/index.css` plus
`.gitignore` plus Tailwind's own extractor). Whoever adds the row should
add the walk, not just the incident.
