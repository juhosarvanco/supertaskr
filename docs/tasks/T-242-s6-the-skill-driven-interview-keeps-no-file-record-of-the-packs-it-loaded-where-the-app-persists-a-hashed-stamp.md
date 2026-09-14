---
id: T-242-s6
title: "The skill-driven interview keeps no file record of the organization packs it loaded, where the app persists a hashed stamp — so the two lenses agree about reading a pack and disagree about remembering it"
feature: F-04
milestone: 4
size: S
priority: 4
status: suggested
suggested_by: "verifier claude-opus-5@subagent @T-242, graded against the app's own stamping code while verifying criterion 7"
blocked_by: []
touches: [tools/e2e/scripts/interview-skill.mjs, tools/e2e/tests/interview-skill.spec.ts, method/skills]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

T-242's criterion 7 asks that the skill-driven interview load and stamp
organization skill packs "exactly as the app's does". The loading half
is delivered and measured: the delivered entry looks in the directory
the app's own discoverer reads, the surface is read out of the app's
module rather than restated, and the entry makes the same three
commitments the app's kickoff clause makes.

The stamping half is not the app's. The app calls `discover` once per
spawn and clones the result into its session registry entry, where each
pack is recorded with its directory, name, description, triggers, the
project-relative path of its file, and a `sha256:` over that file's raw
bytes. That record is a file and it outlives the run. What the delivered
entry asks for instead is that the session NAME each loaded pack in its
first turn — a sentence in a conversation that the same file's opening
paragraph correctly calls disposable.

So a folder interviewed through the app can be audited later for which
organization policy shaped its plan, and a folder interviewed through
the skill cannot. Nothing is wrong with the loading; what is missing is
a durable record with the same fields and the same hash.

The entry already seeds files under the runner's own kit root, so it
has a place to write one and a precedent for deriving the path rather
than typing it. The hash matters as much as the names: a pack that was
edited between the interview and the audit is exactly the case a
recorded name alone cannot answer.

## Acceptance criteria

- WHEN the skill-driven interview loads organization skill packs THE
  entry SHALL instruct the session to write a record carrying the same
  fields the app records, including a sha256 over each pack file's raw
  bytes, to a path derived from the app's own code rather than restated.
- WHEN a folder has been interviewed through either lens THE recorded
  fields SHALL be the same set, pinned by a body that reads the app's
  record shape out of the app's own source rather than a transcription
  of it.
- IF no pack is present THEN neither lens SHALL write an empty record,
  so the absence of a record means the absence of a pack.
- WHEN the behaviour census names this body THE name SHALL say what is
  recorded rather than that the two lenses stamp alike, until they do.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
