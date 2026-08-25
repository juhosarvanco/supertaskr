---
id: T-104-s3
title: Two CONVENTIONS edits were routed to T-104 because it holds the FILE, and T-104 is forbidden the PARAGRAPH — a fence names paths, never paragraphs
status: suggested
suggested_by: executor claude-opus-5 @T-104
---

T-091's checkpoint routed two earned `docs/CONVENTIONS.md` edits to T-104
on the stated ground that **"T-104 holds `docs/CONVENTIONS.md`"**. That is
true — the fence is `[method/, docs/CONVENTIONS.md, app-agent]` — and it
is **not sufficient**, because T-104 carries a HARD sub-file prohibition
that no fence can express:

> **This card SHALL NOT edit the RANGE RULE bullet, its figures, its flip
> lists, or its command recipes.**

**Both routed edits land inside that bullet**, derived at `aea8b9e` where
it spans `docs/CONVENTIONS.md` lines **558–730**:

- **`T-091-s3`'s trigger-beside-the-ref clause** — the GRAPH REGEN flip
  figures it would annotate are at lines **667, 682, 686, 688 and 713**.
  That is the bullet's **flip list**, named in the prohibition explicitly.
- **The `bdada11` sharpening** — the sentence it would sharpen
  (*"a command substitution that swallows it hands you an EMPTY forecast
  wearing the costume of a clean gate"*) is at line **659**. That is one
  of the bullet's **command recipes**, also named explicitly.

So T-104 declined both and left them routed rather than dropping them
silently. **Neither is wrong and both should land** — this lane confirmed
the `bdada11` sharpening first-hand while obeying it (reading
`merge-tree`'s exit from `$?` BEFORE the substitution, exit 0, tree
`82e1194`), and T-091's own reader printed the trigger disclosure during
this lane's run, so the residue is live and observed rather than
theoretical.

## THE GENERAL FINDING, WHICH IS WORTH MORE THAN THE TWO EDITS

**A fence is a set of PATHS, and this project has begun writing
prohibitions at a finer grain than a path.** T-104's constraint is a
paragraph inside a file it otherwise owns; `T-091`'s own fence
(`[tools/e2e]`) is the mirror image — it was forbidden the file it was
writing a reader FOR. Whoever routes work by asking *"which lane holds
this path?"* will keep producing routings that are correct at the fence
and impossible at the card, and the failure is silent: the receiving lane
discovers it only after reading its own card closely.

**The cheap repair is at the routing seat, not in the fence format.** When
a checkpoint routes an edit into a held path, it should name the PARAGRAPH
or clause, and the holder's card should be read for sub-file constraints
before the routing is written down. A fence format that could express
"this file except that bullet" is a much larger change and is probably not
worth it for what is currently a handful of cases.

**Where these two should actually go**: any card whose fence includes
`docs/CONVENTIONS.md` and which carries **no** RANGE RULE prohibition —
which is every future CONVENTIONS card, since T-104's prohibition existed
only because T-091 was in flight and unintegrated. **T-091 has now merged
(`ca5fb96`, checkpoint `fc21899`), so the reason for the prohibition is
spent**; the next CONVENTIONS card can take both, and should re-run
`tools/e2e/tests/range-rule.spec.ts` afterwards to prove the roughly
thirty parsed figures still hold — it is 25 of 25 green today.
