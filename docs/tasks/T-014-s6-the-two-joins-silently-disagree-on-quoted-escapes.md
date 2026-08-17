---
id: T-014-s6
title: The Rust registry reader does not read quoted YAML escapes, so the two joins can disagree in silence — the one thing "refuse, don't guess" promised they could not do
status: suggested
suggested_by: verifier claude-opus-5 @T-014
---

T-014's `src/arch/registry.rs` argues for its own existence this way
(implementation notes, "the whole safety argument for a second reader
existing at all"):

> A second reader is dangerous when it can quietly disagree; this one
> either reads the same facts or stops the gate (exit 3).

**That claim is not exact, and the exception is reproducible.** Three
input classes make `nputer-index arch` exit 0 with a confident report
that disagrees with `@nputer/parser` + `deriveArchitecture` about which
component owns a file. None of them stops the gate.

Reproduced by running both engines over the same fixture trees — the
Rust join through `arch::model()`, the TypeScript one through
`parseProjectFromFiles` + `deriveArchitecture`, dumping identical fact
shapes and diffing.

**1. Double-quoted escape sequences (the sharp one — both sides succeed).**
`registry.rs::unquote` strips the surrounding quotes and returns the
inside verbatim; it never processes YAML's double-quoted escapes.
@nputer/parser does.

| `paths:` entry in the component file | Rust reads | TypeScript reads |
|---|---|---|
| `- "app/emoji-\U0001F600/**"` | `app/emoji-\U0001F600/**` | `app/emoji-😀/**` |
| `- "src/a.ts"` | `src/a.ts` | `src/a.ts` |
| `name: "A\tB"` | `A\tB` (literal backslash-t) | `A<TAB>B` |

The consequence at gate level, measured on a one-file fixture:

    $ nputer-index arch drift --root <fixture> --fail-on unmapped
    finding  D2  D2:unmapped  unmapped_files  files=1
      file  app/emoji-😀/y.ts
    verdict  DRIFT  --fail-on unmapped matched 1 finding(s)
    exit 1

...on a repo where the TypeScript engine maps that same file to `C-01`
and reports **no findings at all**. A CI gate reds a repo the app draws
as clean, and nothing in either output hints at why.

**2. A duplicate `paths:` key.** The reader's `get_or_insert_with` MERGES
the second block list into the first (`["nowhere/**", "src/**"]`) and
exits 0. @nputer/parser rejects the record (2 parse issues) and the
component vanishes from the model.

**3. A tab-indented list item.** `- \tsrc/**` is accepted by the Rust
reader (`paths: ["src/**"]`, exit 0); @nputer/parser rejects the record.

In (2) and (3) the polarity is inverted from the one the notes argue
for: the **hardened** parser is the one that refuses, and the second
reader is the one that guesses. Worse, the TypeScript refusal is LOUD —
those parse issues red `lib/parser/test/smoke.test.ts` (which requires
zero issues over the live docs tree) and light the board's parse-error
badge — while the Rust gate says 0 and prints a clean-looking table.

**Not live today, and that is the whole reason this is a suggestion and
not a rejection.** All eleven files in `docs/architecture/components/`
were checked mechanically: no quoted scalar carrying a backslash, no
tab in any frontmatter line, no duplicate top-level key. (The one
apostrophe, in `C-12-map-pane.md`, sits inside a ` #` comment both
readers strip.) Against the live registry and the committed graph the
two engines agree on **252 fact lines byte-for-byte** — every one of the
92 file→component assignments, all 28 relation rows, all 100 observed
file edges, all 9 findings. The divergence is latent, not current.

**The cheap close, and it restores the claim exactly as written.** Do not
implement YAML escapes — that is the fork ADR-015 forbids. REFUSE
instead: in `unquote`, if the scalar was quoted and its interior
contains a `\`, return `RegistryError::Malformed` ("quoted escape
sequences are not supported (refusing to guess)"). Same for a duplicate
top-level key, and for a list item indented with a tab. Three refusals,
a few lines each, and the reader is back to "reads the same facts or
stops the gate" — which is the property the second reader was allowed to
exist for.

Ranks above T-014-s2 (which asks where a permanent cross-engine pin
should live): s2 pins the agreement, but s6 is the class of disagreement
a pin over the LIVE registry would never catch, because the live
registry is clean. Whatever T-014-s1 decides about where the join
belongs, if a Rust registry reader survives the decision it should carry
these refusals.
