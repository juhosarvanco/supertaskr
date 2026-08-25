---
id: T-104-s2
title: The narrowed size-S ceremony row needs one sentence in CONVENTIONS naming which slugs ship, or it stays a rule of thumb forever
status: suggested
suggested_by: executor claude-opus-5 @T-104
---

T-104's ruling SIX narrowed the size-S ceremony row: **an S card touching
shipped code gets a verifier; an S card whose diff is docs, method or
tooling keeps self-integration.** The criterion asked for the boundary to
be "stated in terms a dispatcher can apply without judgement", with an
explicit IF/THEN: *IF the boundary cannot be made mechanical THEN say so
and give the dispatcher the rule of thumb plus the reason it is not a
gate.*

**The lane took the second arm, and the reason is structural rather than a
drafting failure.** `method/` is the generic, product-agnostic convention
— it may not name `app-shell`, `lib-parser`, `crate-index` or any other
nputer slug — so the ceremony table can state the RULE and the mechanism
(read it off the card's own `touches:`) but cannot draw the partition that
makes it decidable. `method/tasks/TASK-FORMAT.md` therefore says the
partition is the project's to supply, and that until it does, the
dispatcher applies a rule of thumb and the boundary is discipline rather
than enforcement.

**THE MISSING SENTENCE IS THIS PROJECT'S AND IT IS SHORT.** It belongs in
`docs/CONVENTIONS.md` beside the slug map, and it needs to say which of
this repository's slugs are code-bearing:

- **ship** — `app-shell`, `app-board`, `app-map`, `app-interview`,
  `app-agent`, `app-dispatch`, `lib-parser`, `crate-index`
- **do not** — `method/`, `docs/**`, `tools/e2e`, `.github/`

Two details make it worth writing carefully rather than quickly. First,
**`tools/e2e` is the interesting case**: it is real TypeScript that runs,
so "is it code?" answers YES while "does it ship?" answers NO — the ruling
means the second, and a sentence that says "code" will be misread within a
week. Second, **the registry already has a nearby field that is NOT this
one**: `non_code: true` on C-01 and C-11 marks components with nothing for
a walk to collect, which is a different axis from whether a component's
output reaches a user — C-16 is code and ships, C-01 is neither. Do not
reuse `non_code:` for this; either add a field or write the prose list.

Fence: `[docs/CONVENTIONS.md]`, and it pairs naturally with any other
CONVENTIONS card. **Until it lands, every size-S dispatch is one judgement
call that the ruling was written to remove**, which is the narrow sense in
which ruling SIX is the weakest of T-104's nine.
