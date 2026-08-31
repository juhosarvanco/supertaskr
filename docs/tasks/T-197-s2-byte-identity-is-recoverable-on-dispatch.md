---
id: T-197-s2
title: --dispatch byte-identity is recoverable by normalising its fixed-width stamps, so the live arms could assert bytes rather than size
status: suggested
suggested_by: verifier claude-opus-5 @T-197-verify
---

T-197's notes record that `--dispatch` **cannot** satisfy the card's
"byte-identical" criterion **by construction**, because its lane rows
carry live `<- read <ISO timestamp> on <host>` provenance. Confirmed at
`ab873e0`: two whole invocations both measure 67,737 bytes and differ at
char 500.

**But the stamps are FIXED WIDTH.** Normalising them recovers byte
identity exactly:

    perl -pe 's/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/<TS>/g'

    raw:        file 67,737 / pipe 67,737, differ at char 500
    NORMALISED: identical

So the accurate statement is "not directly, without normalisation"
rather than "impossible by construction". The criterion is already MET
by the diff byte-for-byte on the deterministic `--audit` arm, and
driving the byte assertion through a tree-stamped arm is the better
choice — this is not a defect and T-197 should not be reopened for it.

**What is available if someone wants it**: `brief-flush.spec.ts`'s
margin-guard body currently asserts SIZE equality plus `unstampedLines`
on the live arms, and could assert normalised BYTES instead. That is
strictly stronger — size equality cannot see a same-length corruption in
the middle, which is one of the three mutant directions a truncation
body should survive. Low value while the synthesised body carries the
real proof; worth doing if the live-arm assertion ever becomes the
primary one.
