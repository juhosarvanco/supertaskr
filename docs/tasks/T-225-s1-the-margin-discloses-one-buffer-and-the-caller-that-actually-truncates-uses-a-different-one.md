---
id: T-225-s1
title: The margin discloses ONE pipe buffer, and the caller that actually truncates uses a different number — `spawnSync`'s `maxBuffer` is 1 MiB by default and truncates with an `ENOBUFS` error nobody reads
feature: F-06
milestone: 4
priority: 3
size: S
status: building
blocked_by: []
touches: [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts]
suggested_by: executor claude-opus-5@subagent @T-225
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

**FOUND WHILE BUILDING T-225's DECISION 3, AND DELIBERATELY NOT BUILT
THERE.** That card's criterion is *"WHERE the brief approaches its
boundary it SHALL DISCLOSE the margin in its own output, the way the
graph budget already does"*, and one reference point is what the graph
budget discloses. A second reference is a design change to the
disclosure, not a completion of it.

**THE FACT.** `PIPE_BUFFER_BYTES` in `tools/e2e/scripts/dispatch-brief.mjs`
is 65,536 — one pipe buffer on this platform, and the FLOOR both readers
`tests/brief-flush.spec.ts` derives against share. It is the number
T-225's card is written around. **It is not the number that truncates a
`spawnSync` caller**: node's `spawnSync` defaults `maxBuffer` to 1 MiB
and, past it, returns the output TRUNCATED with an `error` field set to
`ENOBUFS` — a field most callers never read, at a status that looks
ordinary. So the two ceilings a caller can meet are an order of magnitude
apart and the disclosure names only the nearer one.

**WHY THIS IS WORTH A CARD RATHER THAN A COMMENT.** `--dispatch` at
T-225's own ref printed 85,818 bytes unfiltered, which is 131% of one
pipe buffer and 8% of the `spawnSync` ceiling. The filter T-225 landed
puts it near 30,000. **The next ceiling anybody meets on this command is
therefore the 1 MiB one**, and when they do, the disclosure will say
"UNDER" in large friendly letters.

**WHAT A FIX WOULD DECIDE.** Whether `marginRecs` takes a SET of named
reference points rather than one buffer — each with the caller it
belongs to, the way `brief-flush.spec.ts` already labels its derived
loss point with the reader it was measured against. That spec's own
sentence is the precedent: *"This is ONE reader's answer, never THE
boundary."* The disclosure currently makes the opposite implicit claim by
naming one number.

## CORROBORATION 2026-09-02 — verifier claude-opus-5@subagent @V-225, measured at `b5d015b`

This card says the disclosure names the wrong NUMBER. It also names the
wrong FAILURE, and that half is printed to every dispatcher who crosses
the line. The OVER arm emits, verbatim:

    output: 102752 of 65536 bytes (156.8%) - OVER by 37216: past one buffer the
    tail arrives only while the reader drains, and a caller collecting into a
    fixed buffer of that size receives a prefix with no error

Measured against the reader this repository actually uses —
`spawnSync(node, [brief.mjs, "--dispatch", "--full"], { maxBuffer: 65536 })`:

    stdout        102,752 bytes — the WHOLE answer, not a prefix
    status        null
    signal        SIGTERM
    error.code    ENOBUFS

So for that caller the clause is wrong in both of its claims: nothing is
truncated to a prefix, and the error is loud rather than absent. The
same command at Node's DEFAULT `maxBuffer` (1 MiB) returns all 102,752
bytes with `error: none` and `status: 0`.

The clause is true of a POSIX caller doing one `read()` into a 64 KiB
buffer, and that reading is defensible — but it is unqualified, in a
tool whose contract is that a figure never leaves it detached from its
source, and the repository's own named reader contradicts it. Whatever
this card does about the number, the sentence should either name the
caller it is true of or say what `spawnSync` actually does.

Independently derived: the ENOBUFS behaviour is in this verifier's
phase-1 ground truth, stamped at the base ref `5f193e6` as
`709f2046ab0f25f188a5425e86df8e6e6817ee67e96edfe6efa06ae12cbc08d3`
before this lane's first commit existed.

## TRIAGE, 2026-09-02 — promoted to `planned`, priority 3

The architect seat, at the stamp of T-225's merge (7435eae). The OVER
arm's sentence is false against `spawnSync` (the verifier's V-225
corroboration: `maxBuffer: 65536` returns the whole 102,752 bytes with
`ENOBUFS` and `SIGTERM`), and the executor concurred while correctly
declining to fix a producer in a pass scoped to F1. Criterion: the
margin's OVER arm SHALL describe what each named caller actually does
past the line, measured, and a body SHALL red when the sentence and the
measurement disagree. Fence is free now that T-225 has merged; T-239
serialises behind this card on dispatch-brief.mjs.

## Absorbs: T-225-s3 (2026-09-02)

`withMargin`'s UNSETTLED fallback is a branch no body drives. The same
file, the same block: the lane SHALL drive it with a planted
non-converging total and show the labelled honest answer printed, and
SHALL say whether the fixed point can fail to converge at any real
width or only at a planted one.
