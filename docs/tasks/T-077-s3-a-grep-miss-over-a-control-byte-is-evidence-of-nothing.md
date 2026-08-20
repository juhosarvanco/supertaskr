---
id: T-077-s3
title: A grep MISS over a file carrying a control byte is evidence of nothing, and CONVENTIONS does not say so
status: suggested
suggested_by: executor claude-opus-5 @T-077
---

**MEASURED ON T-077's OWN FIRST COMMIT.** Two literal `0x00` bytes
landed in `app/src/lib/docs-model.ts` — a list-key separator written as a
raw byte rather than an escape. The file compiled, the type gate passed,
the app suite passed 839/839, and the app rendered correctly. What broke
was SEARCH:

    /usr/bin/grep -n "ordinal" app/src/lib/docs-model.ts
      -> Binary file app/src/lib/docs-model.ts matches
    grep -c "ordinal" app/src/lib/docs-model.ts
      -> (no output, exit 1)
    file app/src/lib/docs-model.ts
      -> data

The file contained the word four times. **The search did not report a
match it could not display — it reported NO MATCH, at exit 1**, which is
the same answer a genuinely absent string gives. Half an hour of this
lane went into mis-attributing a CSS change to the wrong file on the
strength of that exit code, and the mis-attribution was only caught
because the byte census in the poison drill's read-back looked at the
bytes instead of asking a searcher.

**THE GATE ALREADY KNOWS.** `npm run lint:tokens` exits **1** with
*"byte 9203: U+0000 [P5: literal control character (invisible to
binary-skipping searchers)]"*. P5's own `what` string names the exact
failure mode. So the repo is protected — **the gate is not the gap**.

**THE GAP IS IN THE ADVICE.** CONVENTIONS' *A CITATION NAMES A SYMBOL*
bullet is the paragraph a reader consults when a search comes back empty,
and it names exactly one cause for a false empty: *"`git grep` run from a
subdirectory silently scopes itself to that subdirectory and returns
nothing, which reads like a refutation rather than a miss."* That is one
of at least two. The other is this one, and it is worse in one specific
way: the subdirectory trap is fixed by re-running from the root, whereas
this one gives the same answer from anywhere, and the file it hides is by
construction a file somebody has just edited.

**Proposed close — one clause, in that bullet, beside the existing one.**
Something to the effect of: *a search that finds nothing in a file
somebody just wrote is not a refutation until the file is known to be
text; `file(1)` saying `data`, or grep saying `Binary file … matches`,
means every searcher in the pipeline has been lying, and the token lint's
P5 is the thing that answers.* Cite the mechanism, not this incident.

**A SECOND, SMALLER OBSERVATION, RECORDED RATHER THAN PROPOSED.** In this
harness `grep` resolves to a SHELL FUNCTION rather than to `/usr/bin/grep`
(`type grep` names a shell-snapshot file), and the function returned exit
1 with no output where the real binary printed `Binary file … matches`.
So the one signal that would have given the game away was swallowed
before it reached the transcript. That is an environment property rather
than a repo property and nothing in `docs/` should encode it — but any
rule written for the bullet above should describe the BYTES, never the
tool's message, because the message is not guaranteed to survive the
shell.
