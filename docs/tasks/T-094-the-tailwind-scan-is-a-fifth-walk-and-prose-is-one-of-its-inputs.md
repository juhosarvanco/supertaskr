---
id: T-094
title: The Tailwind content scan is a FIFTH walk nothing describes, prose inside it is an input to the shipped bundle, and a leaked rule is live in the tree today
feature: F-02
milestone: 4
priority: 50
size: M
status: planned
blocked_by: []
touches: [app-shell, docs/CONVENTIONS.md]
builder:
verifier:
built_by:
verified_by:
review:
---

> **DRAFTER'S NOTE — remove before landing.** Both folded findings
> describe leaks that were DODGED or FIXED before landing. **The tree
> carries a live one right now**, found while verifying this card, and
> it is better evidence than either historical instance because nobody
> planted it and nobody noticed. It also SHARPENS the mechanism in one
> direction and BOUNDS it in another — the scan may reach
> `app/src-tauri/**`, and a candidate followed by a comma appears not to
> extract. Both are measured below and both are criteria rather than
> claims.

Absorbs: T-077-s2, T-072-s5 (sixth triage, 2026-08-20). Both files
removed in this commit.

**`app/src/index.css` says `@import "tailwindcss"` with no `@source`
directive** (verified at `4d2f03c`: `grep -n "@source"` over that file
returns nothing), so Tailwind v4's automatic source detection scans the
Vite root — `app/` — minus what `.gitignore` excludes. **Tailwind
extracts candidate strings from raw text without parsing it, so prose is
indistinguishable from a `className`**, and any English word that names
a utility can become a rule in the shipped stylesheet.

## Two historical instances, and why the obvious remedy is a narrowing rather than a fix

**T-072-s5, 27 bytes.** T-072's first build emitted a stylesheet 27
bytes larger than the base with no styling change anywhere in the diff.
The whole delta was `.isolate{isolation:isolate}`, derived by selector
set-difference across two builds — one selector added, none removed —
and its source was the bare word `isolate`, written once, in a COMMENT,
in `app/test/interview-model.test.ts`. T-072 dodged it by rewording; the
final stylesheet was `cmp`-identical to the base's.

**T-077-s2, 583 bytes, and it is T-072-s5's own third option arriving
with an instance.** T-077's first commit shipped `.ordinal` and with it
the entire `font-variant-numeric` machinery — `--tw-ordinal`,
`--tw-slashed-zero`, `--tw-numeric-figure`, `--tw-numeric-spacing`,
`--tw-numeric-fraction` all added to the `*` initial block — from a
local identifier in `modelIssueRows` plus the word twice in the doc
comment above it. **43.95 kB → 44.53 kB.** Attributed rather than
guessed: three builds off one tree (full HEAD, HEAD minus the new test
file, base source), selector sets extracted and differenced, the two
HEAD variants byte-identical, then bisected file by file; renaming the
identifier restored the stylesheet to `cmp`-identical with main's.

**That is why `@source ./src` is a narrowing, not the close.** It stops
Tailwind scanning `app/test`, and it would not have caught T-077's leak:
`app/src` is the tree `@source ./src` points AT, and it must be scanned,
because that is where real class names live. **The leak is not "Tailwind
scans the wrong directory"; it is "Tailwind cannot tell a class name
from an English word, and one of the trees it must scan is full of
English."**

## The live instance, measured at `4d2f03c`

The working tree's built stylesheet —
`app/dist/assets/index-CwYF5FQb.css`, **43,950 bytes**, built
2026-08-20 15:45, the exact artifact STATE names at the T-084
checkpoint, and gitignored by `app/.gitignore:11` so it is a local build
rather than a committed one — contains:

    .lowercase{text-transform:lowercase}

**No file under `app/src` can account for it.** `git grep -nw lowercase
-- app` returns exactly four tracked files, none of them under
`app/src`: three Rust doc comments
(`app/src-tauri/crates/nputer-index/src/graph.rs`,
`.../src/hash.rs`, `app/src-tauri/src/agent/adapter.rs` — two of them
the phrase "64 lowercase hex") and one TypeScript comment in
`app/test/architecture-dogfood.test.ts`. `app/index.html` has none.
**So the shipped stylesheet carries a rule whose only possible sources
are a test comment and three Rust doc comments** — and if it is the Rust
ones, the fifth walk reaches `app/src-tauri/**`, which nobody has ever
described as a stylesheet input.

**And the mechanism has a boundary the folded findings do not state.**
The bare word `ordinal` sits in `app/test/architecture-dogfood.test.ts`
(added at `5edb1c8`, T-076's checkpoint, well before this build) and
`.ordinal` is **absent** from the same stylesheet, while `ordinal` is a
real utility in the installed `tailwindcss@4.3.3`. The two words are in
the SAME FILE and the same build. The visible difference is the
following character — `lowercase` ends a line, `ordinal` is followed by
a comma. **So "any English word leaks" is too strong and "app/test
leaks" is too narrow**; the extractor's candidate boundaries decide, and
this card should establish that by construction rather than by argument.

**Why it is more than bytes.** CONVENTIONS' UI bullet says *"unmapped
utilities are deliberately dead"* — the enforcement is that they are
ABSENT from the emitted stylesheet, so a `className` reaching for one
does nothing. A comment that emits the rule makes that utility LIVE, and
the rule it weakens is one nothing tests. It also breaks the only cheap
signal an integrator has: STATE quotes CSS content hashes across merges
precisely because *"the CSS hash did not move"* is the honest form of
"zero new tokens". A hash that moves on a comment makes that signal
unreadable in the direction it matters.

**Nothing in the repo would have failed.** With `.ordinal` live in the
shipped bundle, 839/839, the token lint, the type gate and the boot
check were all green; it was found because a build log happened to be
compared against a baseline four commits earlier.

## Acceptance criteria

- **THE BUILT STYLESHEET'S SELECTOR SET SHALL BE PINNED, not its byte
  size** — a size moves for legitimate reasons and reads as noise, while
  a new selector reds BY NAME, which is what tells the next author
  whether they added a token or a vocabulary word. The host is
  `app/test/window-manifest.test.ts`, which already reads the built CSS
  off `dist/assets` and already refuses a stale `dist/`.
- **THE PIN SHALL BE DERIVED WHERE IT CAN BE AND EXPLICIT WHERE IT
  CANNOT**, and it SHALL state which. A recorded list is a hand list —
  T-058 and T-080 each spent a card on that — so the recorded set needs
  an authority: at minimum, a check that every recorded selector is
  reachable from a `className` in `app/src`, so a PROSE-sourced selector
  is a red rather than a row.
- **THE LIVE `.lowercase` LEAK SHALL BE ATTRIBUTED BY MEASUREMENT, not
  by reasoning**, using T-077-s2's own method: build, extract the
  selector set, remove one candidate source at a time, rebuild,
  difference. THE ANSWER SHALL BE STATED — `app/test`, `app/src-tauri`,
  or both — because it decides whether the fifth walk reaches the Rust
  tree.
- **THE EXTRACTOR'S BOUNDARY SHALL BE ESTABLISHED BY CONSTRUCTION**:
  plant the same utility word in a comment in each candidate tree
  (`app/src`, `app/test`, `app/src-tauri`), once followed by whitespace
  and once followed by a comma, rebuild, and record which produce a
  rule. `ordinal` versus `lowercase` in one file is the observation this
  criterion exists to explain; do not ship the explanation as a guess.
- IF `@source` is added THEN it SHALL be argued as a NARROWING and not
  as the close, and the tripwire SHALL land regardless — T-077's leak
  came from the tree `@source ./src` points at.
- **THE FOUR WALKS TABLE SHALL GAIN THE FIFTH WALK**, with its AUTHORITY
  column filled the way the other four are: `app/src/index.css` plus
  `.gitignore` plus Tailwind's own extractor. THE ROW SHALL SAY THE
  SENTENCE THAT WOULD HAVE STOPPED BOTH INCIDENTS — **prose inside the
  scanned trees is an input to the shipped bundle** — and the row's
  "what it sees" SHALL be whatever the boundary criterion measured, not
  what this card assumed.
- IF the fifth walk turns out to reach `app/src-tauri/**` THEN
  CONVENTIONS SHALL say so plainly, because that is the one tree every
  reader in this repository assumes cannot affect the frontend bundle.
- **NO CRITERION HERE IS SATISFIED BY A BYTE-SIZE ASSERTION.** A size
  pin cannot name what changed, and naming is the whole point.

Verification: headless — `npm run build` and `npm test` from app/ with
counts and exits stated, the selector-set pin green, and the POISON
DRILL on it: plant a utility word in a comment in each scanned tree,
rebuild, require the pin RED and read the emitted rule back before
restoring; then remove one recorded selector and require the floor RED.
Restores proved by sha256 at the drill's own commit, per-path rather
than `git checkout --`. State the built CSS's byte size and content hash
before and after, at their refs. @human: none — no screen moves, and the
one visual question (does any real utility change) is answered by the
selector diff.
