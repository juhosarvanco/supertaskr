# Archaeology — adopting an EXISTING project (supertaskr init --existing; greenfield interview is the default path)

For repos with history (e.g. months of work in one long session). Run once,
by a fresh session. The code is ground truth; any session dump or old
CLAUDE.md is memory-of-memory — trust the code where they disagree.

1. Inputs: the repo, git log, existing docs/CLAUDE.md, and (optional) a
   final state-dump from the old long-lived session.
2. Draft the full docs/ set from evidence:
   - ARCHITECTURE.md from the actual code structure
   - decisions/ mined from git history and code comments (date them)
   - STATE.md from what visibly works, what is half-built, what is broken
   - ROADMAP.md: reconstruct the backbone; put everything unfinished into
     candidate tasks
3. Mark every uncertain claim with `[?]` — do not paper over gaps.
4. Interview the human ONLY about the `[?]` items. Their corrections are
   precisely the tacit knowledge that lived only in their head and the old
   session; now it is on disk.
5. Cold-start test (same as /plan). When a cold session passes, the old
   mega-session is obsolete — not abandoned, extracted.
5b. After the cold-start test passes, run interview/decomposition.md on the reconstructed backbone — existing repos need exact tasks too.
6. First dispatched task should be small and low-stakes: you are debugging
   the process, not the process plus a hard feature.
