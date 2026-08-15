---
title: Give verdict blocks the notes body's overflow containment (unbroken-run parity)
status: suggested
suggested_by: verifier claude-fable-5 @T-017
---

T-017's notes disclosure renders its body inside an `overflow-x-auto`
container precisely so an unbroken preformatted run scrolls in place
instead of widening the panel. The verdict blocks the criterion points
at ("scrollable like verdicts") never received that treatment
themselves: VerdictBlock's text div
(app/src/components/board/TaskDetailPanel.tsx) is `font-mono text-sm
whitespace-pre-wrap` with no overflow container and no break utility.
Verdict text is file-derived exactly like notes — a long unbroken run
in a REJECTED repro (a path, a minified snippet, a URL) widens the
panel's scroll context into one panel-wide horizontal scrollbar (the
same mechanism T-017-s1 describes for the panel h2) while the notes
section directly below it scrolls neatly within its own box.

Suggest `overflow-x-auto` on the verdict text container, matching
NotesDisclosure, plus a board-truth-style class pin. Complements
T-017-s1's sweep (ghost provenance, panel header, chips, stamps —
that list does not include the verdict blocks); the two could land as
one commit. Touches app-board only; zero tokens.
