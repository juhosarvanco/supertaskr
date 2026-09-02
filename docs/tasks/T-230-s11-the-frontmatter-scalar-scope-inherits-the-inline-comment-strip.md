---
id: T-230-s11
title: The new frontmatter scalar scope inherits frontmatterFields' inline-comment strip, so a scalar is truncated at the first space-hash and any quoted assertion after it is dropped with no sighting and no count
feature: F-06
milestone: 4
priority: 4
size: S
status: suggested
suggested_by: verifier claude-opus-5@subagent @T-230-s3-verify, phase 2 at db7e04d, 2026-09-02
blocked_by: []
touches: []
builder:
verifier:
built_by:
verified_by:
review: independent
---

`T-230-s3` opened the frontmatter as a scope for the `quotes` arm's
unmarked report, and took its values from `frontmatterFields`
(`tools/e2e/scripts/dispatch-brief.mjs`) rather than re-parsing the
block — which is the right call and exactly what T-057 asks for. What
comes with it is that function's `stripInlineComment`, which cuts a
scalar at the first occurrence of a space followed by a hash and returns
the head.

**SO A FRONTMATTER ASSERTION AFTER THAT POINT IS INVISIBLE TO ALL THREE
READERS, IN THE ONE PLACE THIS CARD'S PARENT EXISTS TO LIGHT UP.**
Measured at `db7e04d` with both controls printed, driving the exported
readers directly:

    title: the fix for issue <hash>12 says "a real claim"

`frontmatterScalars` returns the value `the fix for issue`, and
`unmarkedQuotes` reports nothing — no listing, no sighting, and not a
unit in `below the quote floor`. The run is not dropped for being short
and not missed for spanning a wrap; it is gone before the needle
scanner sees it.

**IT IS REACHABLE ON THE LIVE BOARD AND COSTS NOTHING THERE TODAY.**
Five frontmatter scalar lines across the flat cards carry a space-hash
at `db7e04d` — `T-007`'s `size:` line, whose hash opens a genuine YAML
comment and is rightly stripped, and four `suggested_by:` lines reading
`standing triage sitting <hash>4`. **None of the five carries a quoted
run after the cut**, so the board loses nothing at this ref; the class
is live and the instance is not.

**WHY IT IS A SUGGESTION AND NOT A FINDING AGAINST `T-230-s3`.** The
strip belongs to a function outside that card's fence, reusing it was
the correct choice, and the `cannot` line makes no completeness claim
about the scalar read. The honest repair is one of two and they are not
the same size: teach the scalar reader that a hash inside a QUOTED
scalar is not a comment (YAML's own rule, and the wrapper is already
unwrapped one step later), or state the truncation in the `cannot` line
the way the hard wrap is now stated. **The second is a one-line edit and
closes the disclosure half immediately**, which is the shape `T-230-s3`
itself used for the gap it did not repair.

Derive the reachability at your own ref, controls first:

    for f in docs/tasks/T-*.md; do awk '/^---$/{n++; if(n==2) exit; next}
      n==1 && /^[A-Za-z_][A-Za-z0-9_]*:.* #/ {print FILENAME": "$0}' "$f"; done
