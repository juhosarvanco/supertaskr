---
title: Land T-024's dry-run fixture from the surviving scratch tree, not the notes — five files are not byte-verbatim in T-023's attachment
status: suggested
suggested_by: verifier claude-fable-5 @T-023
---

T-023's implementation notes attach the dry-run tree as evidence and
tell the integrator "its full content is preserved above"; T-024's
criteria then land that tree as a test fixture "from these notes".
Verification diffed the notes' quotes against the executor's actual
produced tree (still alive at the session scratchpad, streak/, git
commit b18a33c) and found the "verbatim" claim is byte-exact for only
2 of the 5 key files: NORTH_STAR.md and ROADMAP.md match to the byte.
The other attachments diverge from the true tree in non-parse-relevant
ways: decisions/001-stack.md was restructured (real file has
Context / Options considered / Decision / Consequences headings and
bullets; the notes flatten them to labeled prose), CONVENTIONS.md's
quote drops the template's 3-line header comment, T-002's quote drops
the two template section comments (the "(both template-empty)" aside
stands in for them), ARCHITECTURE.md's mermaid block is paraphrased
into a parenthetical (fence-free notes) and its status comment is
dropped, and T-001/T-003 are disclosed summaries, not quotes. Every
byte the parser or T-024's genesis-derive model reads (frontmatter,
headings, [?] markers, backbone bullets) IS preserved — verification
re-derived parseProject = 3 tasks / 4 features / 0 issues from the
notes alone — so T-023's evidence stands; this is about fixture
fidelity, not the verdict. Action: harvest the fixture for T-024
directly from the surviving scratch tree while it exists (byte-true,
includes the stage-4 kill point reconstructable from its git history
plus the transcript), or, if it is lost first, reconstruct from the
notes and record the five documented divergences at the fixture.
Lane: T-024 (app-interview); no method/ or parser change implied.
