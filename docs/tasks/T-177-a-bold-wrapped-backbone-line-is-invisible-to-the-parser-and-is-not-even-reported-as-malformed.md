---
id: T-177
title: A bold-wrapped backbone line is invisible to the parser AND is not reported as malformed — the generated project declared three features and the board rendered none of them, silently
feature: F-03
milestone: 4
priority: 7
size: S
status: planned
blocked_by: []
touches: [lib-parser]
suggested_by: standing triage sitting #4 (2026-08-30), from @human's first-walk board session relayed by the outgoing integrator seat
builder:
verifier:
built_by:
verified_by:
review:
---

**MEASURED AT `b60b06d` AGAINST THE REAL FILE AND THE REAL REGEXES**,
not reasoned from the shapes:

    node -e '
    const rm=require("fs").readFileSync(
      "/Users/ujju/Projects/first-walk/docs/ROADMAP.md","utf8");
    const bullet=/^-\s+(F-\d+):\s*(.*)$/, malformed=/^-\s+F-/;
    let ok=0,mal=0,inv=0;
    for(const l of rm.split("\n")){
      if(bullet.test(l)) ok++;
      else if(malformed.test(l)) mal++;
      else if(/^-\s+\*\*F-\d+:/.test(l)) inv++; }
    console.log(ok,mal,inv); '        # -> 0 0 3

**Backbone lines matched: 0. Malformed lines reported: 0. Silently
invisible: 3.** @human's generated project declares F-01, F-02 and F-03
as `- **F-01: Open — one command puts the cursor in today's note.**`,
and `lib/parser/src/roadmap.ts`'s bullet regex requires the unwrapped
shape. Every task card in that project carries a `feature:` pointing at
a backbone slot the parser never created.

## THE SILENCE IS THE DEFECT, NOT THE STRICTNESS

`roadmap.ts` already has a second regex for exactly this job — the
malformed-line reporter `/^-\s+F-/`, which produces *"malformed backbone
line (expected '- F-NN: Name — description')"*. It does not fire here,
because `- **F-01:` does not match `^-\s+F-` either: the `**` sits
between the dash and the `F`. **So the one mechanism written to stop a
backbone line from disappearing quietly is defeated by the same two
characters that hide the line.** The reader gets no feature, no error,
and no reason — the board is simply shorter, which is `9c64cd8`'s
failure shape (CONVENTIONS, DOCS GATE) arriving in a generated project.

## Nobody promised the plain shape where the planner would read it

`method/docs-templates/ROADMAP.md` shows `- F-01: Capture — …` as an
EXAMPLE INSIDE AN HTML COMMENT — deliberately, because templates are
scaffolded verbatim and a bare example row would parse as a real feature
(T-030). `method/interview/decomposition.md` says *"walk the backbone
left to right"* and states no line grammar. So the shape is demonstrated
once, inside a comment, and never stated as a rule. A planner that
writes markdown emphasis into a heading-like bullet is doing the
ordinary thing.

## Three arms, and the first is this project's own doctrine

1. **REPORT IT.** Widen the malformed detector so an emphasis-wrapped
   `F-NN:` bullet is a NAMED issue instead of a silent drop. This is the
   arm that matches the repository's standing preference — a signpost may
   go stale, silence may not — and it fixes the class rather than one
   spelling: any future decoration lands in the reporter.
2. **TOLERATE IT.** Strip surrounding emphasis before matching, so the
   bold form parses as the plain one. Closes @human's instance outright
   and widens the accepted grammar for every project, which is a call
   about the FORMAT and not only about the parser.
3. **PIN THE SHAPE UPSTREAM.** State the line grammar normatively where
   the planner reads it. This edits `docs-templates/ROADMAP.md`, a
   `KIT_FILES` entry — **shipped bytes, so a method version bump is
   owed** and the fence above does NOT reach it. Arm 3 is therefore not
   this card's to take alone; it rides a bump card, and `T-176` is the
   natural neighbour.

**Arms 1 and 2 are not alternatives** — reporting the shape and
accepting the shape answer different questions, and taking 2 without 1
leaves the next decoration silent again.

## Acceptance criteria

- WHERE a `docs/ROADMAP.md` line declares a feature id in a shape the
  backbone reader does not accept, THE parser SHALL report a named issue
  rather than yielding no feature — and the body SHALL cover at least the
  emphasis wrap this card measured.
- IF arm 2 is taken THEN the tolerated set SHALL be stated in
  `roadmap.ts`'s own header, and a bare example row inside an HTML
  comment SHALL still yield no feature (T-030's property, which the
  widening must not break).
- THE fixture SHALL be the shape a real planner produced — the three
  lines above, not a hand-written imitation — and a positive control
  SHALL prove the body reds before the fix.
- THE lane SHALL NOT edit `method/docs-templates/ROADMAP.md`: it is a
  shipped `KIT_FILES` entry outside this fence, and arm 3 is routed.
- Verification: headless, `npx vitest run` from lib/parser/.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
<!-- verifier appends: date, model@session, APPROVED / REJECTED + failures -->
