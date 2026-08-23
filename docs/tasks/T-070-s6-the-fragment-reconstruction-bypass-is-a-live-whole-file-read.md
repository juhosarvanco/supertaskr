---
id: T-070-s6
title: The fragment-reconstruction bypass is a live whole-file read no source pin catches — disclosed, honestly bounded, and matching the T-080-s4 precedent
status: parked
suggested_by: verifier claude-opus-5 @T-070-verify
---

**MATERIALIZED BY THE INTEGRATOR FROM THE APPROVED VERDICT (T-070 merge
`740f0b7`), crediting the verifier who built and confirmed it.** The
second verdict raised this as its FINDING 2 (non-blocking), concurring
with the executor's own disclosure; it lived only in the card body, so
it is filed here as a file with legal frontmatter (the T-061 lesson).
The verifier RULED it honestly bounded and NOT a hole to reject on — it
is recorded so triage can size the residual, not because the merge left
a defect.

**THE BYPASS, BUILT AND CONFIRMED LIVE.** A reader inside
`app/src-tauri/src/agent/sessions.rs` that assembles the transcript path
from split fragments — `project_dir.join(".nputer").join("genesis")`,
`"transcript" + "." + "jsonl"`, joined — spells NONE of the three
censused forms, reads the whole file, and is wired onto the arrival path
through the `transcript_path` leaf. The verifier built exactly that and
the FULL SUITE stayed **358/0/3 exit 0** — a genuine live bypass the
six-arm `the_only_production_path_to_the_transcript_is_the_bounded_one`
does not catch. (The executor disclosed the same class and refused to
chase it; the verifier independently reproduced it.)

**WHY IT WAS RULED HONESTLY BOUNDED (verdict's three reasons).** (1) It
is disclosed in the notes in as many words — *"The bypass I could NOT
kill, and refuse rather than pretend … The honest boundary of a source
pin is stated here so the next reader does not over-trust it."* That is
the "say so" side of the disclosure dichotomy. (2) The threat model is
correct: the T-070 defect was an ACCIDENT (a whole-file read nobody
flagged), and the pin catches every accidental/ordinary shape
(V1/V3/V5/new-A/new-B); reaching this bypass takes DELIBERATE
fragment-splitting AND wiring through a leaf that has no business reading
a file — not an accident. (3) It matches the codebase's precedent for
disclosed residuals, `T-080-s4` (*"ONE HOLE REMAINS, NAMED RATHER THAN
PAPERED OVER"*). No pin fails OPEN on any benign input; the only
fail-open is under deliberate obfuscation, which a source pin cannot
close without an arms race that embrittles it against honest edits.

**THE STANDING QUESTION FOR TRIAGE.** This is the same shape as the
disclosed-residual family (`T-080-s4`, and `T-070`'s own honest limit):
a source pin defends the ORDINARY edit and the ACCIDENT, and its boundary
against deliberate obfuscation is stated rather than closed. The arm — if
one is ever wanted — is a read-boundary gate on the transcript reader in
the shape the registry got at T-039, not more census spellings. Sized
against that, not against the diff.

**PARKED at the seventh triage (2026-08-24).** Unpark at a second production reader of `transcript.jsonl`, or any ACCIDENTAL (non-obfuscated) bypass of the six-arm census. Verifier-ruled honestly bounded; T-080-s4 precedent.
