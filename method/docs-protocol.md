# Docs protocol

The governing documents carry what a session must LOAD; the records
carry what HAPPENED. This file is the generic contract; each project's
ratifying decision record names its own budgets, template locations
and gate. (First ratified as Supertaskr's ADR-019, from the room
docs/rooms/governing-docs.md, where the measurements live.)

1. **Three kinds of fact, three keepers.** Every sentence in a
   governing document (the state, roadmap, architecture and
   conventions files, however the project names them) is a RULE, a
   TRUTH or a RECORD. RULES — how to work — are kept by version and
   gates, and live in the governing documents as the rule, the why (a
   sentence or two), the authority that enforces it, and the task ids
   that proved it. TRUTHS — what is true now — are kept by programs: a
   governing document carries the derive command, or a GENERATED
   document with a currency check, never a bare transcribed figure.
   RECORDS — what happened, stamped at a ref — are kept by
   immutability, in task cards, checkpoint records and decision
   records, and never enter the governing documents.
2. **A figure needs a keeper.** A number appears in a governing
   document only if a program re-derives it, a generator with a
   currency check emits it, or it is ref-stamped in an immutable
   record. Otherwise write the command that derives it, never the
   number.
3. **Governing documents are replaced; records are appended.** A stale
   sentence in a governing document is REPLACED by the current one
   plus a citation to the card or record that holds the history — the
   old text stays reachable in version control at the ref the
   replacing commit names. Correction-in-place with full history
   preserved is the rule for RECORDS, where it is absolute: a record
   is written once and never edited.
4. **The state document is regenerated, not accreted.** At every
   checkpoint the integrator FIRST writes one append-only checkpoint
   record (docs/checkpoints/, on the project's committed template) —
   the merge's ranges, gates, suites, board deltas, environment facts
   and what the brief got wrong — and then REGENERATES the state
   document from the project's template, IN THE SAME COMMIT, under a
   byte budget a gate enforces. The record keeps the INSTANCE; the
   state document keeps the MECHANISM. **What obliges the regeneration
   is the record's CREATION, never its every later touch.** Records are
   APPEND-ONLY rather than write-once (law 3), so an amendment to a
   record already checkpointed with its regeneration owes no second
   one; a gate that compares the state document against a record's
   LATEST touch charges a commit whose only content is a clock, and
   every lane cut between the amendment and that commit inherits a red
   it did not cause and cannot fix. **But an amendment that changes a
   FACT or a HAZARD the state document summarises still updates it** —
   that half is a rule of CONDUCT, kept by the integrator and not by a
   program, because no gate can tell which appended line changed the
   state of the world. No suite, gate or generator may ever DEPEND on
   the checkpoint records.
5. **The lesson once.** A recurring pattern earns one rule, one
   provenance citation and one worked example in a governing document;
   further instances are stamped in checkpoint records only.
6. **Budgets are tripwires, not the cut.** The project declares byte
   TARGETS for its governing documents; gate values are DERIVED at
   each document's compaction landing (warn ≈ landed × 1.25, fail ≈
   landed × 1.5) and recorded in the ratifying decision record with
   the measurement. When the gate warns, content moves to a record or
   a card — a hazard is never deleted to fit.
7. **Each role's file names the sections that role reads first**, so
   the reading cost is paid where it earns its keep.
8. **Every machine ships with the condition under which it RETIRES.**
   A gate, a keeper, a hook, a health band, a generated document —
   anything standing that costs something on every run — is introduced
   together with the sentence saying when it stops being worth that
   cost, written while the reasons are fresh and not left for a later
   argument. **Without that sentence a method only ACCRETES**: every
   machine was justified by an incident, no machine has a stated end,
   and the inventory grows until running it is the work. **Promotion
   and demotion, both.** A machine whose incident class is still live
   gets PROMOTED — made cheaper, made earlier, made mechanical; a
   machine whose class has gone quiet for the interval its own
   condition names gets DEMOTED to a discipline or removed, and the
   removal is recorded with the same weight as the arrival. **THE
   HEALTH INDICATORS ARE WHAT NOTICE THE QUIET.** A class that has
   stopped firing looks exactly like a class nobody is watching, and a
   band with a stated range is the cheapest way to tell those apart —
   which is why a retirement condition is written as an OBSERVATION
   ("no instance of this class in N integrations") rather than as a
   date. **The precedent generalised here is one interim rule that
   carried its retirement condition from birth and met it**, and whose
   removal cost a line because the condition was already on the page.

## Where the trust went

**Trust is not eliminated by any of this; it is RELOCATED — to fewer
points, each NAMED and each RECORDED.** A method built on files,
derivations and gates can be described as removing the need to trust
anybody, and that description is false in a way worth being exact
about: a system nobody believes they have to check is the one that
fails quietly.

What is actually trusted, and nothing here pretends otherwise:

- **The SEATS.** That a verifier stayed blind, that an executor
  re-derived rather than transcribed, that a triage seat read the
  finding it disposed of. Each is a discipline a role file states and
  no program confirms.
- **The PROVENANCE MARKS.** A ref stamp, a `suggested_by`, a
  `built_by`, an unverified label — each is a CLAIM by the hand that
  wrote it. They are enormously useful and they are not evidence.
- **The HUMAN GATES.** Wherever a project routes an act to a person,
  the guarantee is that person's attention, and it is spent whether or
  not it was paid.

**Writing the list down is the point.** Two things follow that do not
follow from a claim of zero trust: a reader can ASK how each named
point is protected, and no future description of this method can
honestly claim there is none. **Where a machine can take over a trusted
point, that is a promotion under law 8** — the list is meant to get
shorter, and a shorter list is a measurable result rather than a
slogan.
