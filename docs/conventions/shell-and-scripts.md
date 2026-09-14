# The shell, the scripts and the figures a script writes

The dialects this machine actually has, the way an edit script must be run, and why a line number is never a citation.

This file is one chapter of docs/CONVENTIONS.md, which is the INDEX:
it carries every bullet's opener verbatim beside the file the bullet
lives in. A program that reads a rule out of this document reads the
INDEX AND ITS CHAPTERS AS ONE TEXT — `conventionsText` in
tools/e2e/scripts/docs-scan.mjs assembles it, and the same assembly in
Rust is in app/src-tauri/src/dispatch/brief.rs. Never edit a bullet
here without asking what reads it.

- **AN EDIT SCRIPT'S SUCCESS IS A GATE, NOT A STEP** (`18d8166`): never
  chain a commit after a scripted edit — read the diff back FIRST.
  The history, the measurements and the argument this rule was cut
  from are in docs/reference/16-the-repository.md (T-290), verbatim.

- **A GATE READ THROUGH A PIPE REPORTS THE PIPE**, so a hard failure
  reads as a clean pass: `false | tail -1` exits 0, and `pipefail` is not
  on by default. **Redirect to a file, capture `$?`, THEN look.**
  Related and load-bearing:
  **there is no root `package.json`** — every script lives in
  `tools/e2e/`, `app/` or `lib/parser/`, so a bare `npm test` at the root
  fails in a way that looks like a suite result.
  The history, the measurements and the argument this rule was cut
  from are in docs/reference/16-the-repository.md (T-290), verbatim.

- **PASS THE DOCS GATE SEPARATE LITERAL PATHS.** zsh word-splits an
  unquoted COMMAND SUBSTITUTION but NOT a variable, so handing it a
  variable gives the gate every path as ONE argument and it answers
  *"1 path(s)"* — plausible, and wrong.

- **A LINE NUMBER IS A FIGURE** — a coordinate in a mutable object that
  fails SILENTLY, still pointing at a real line, just the wrong rule.
  **Cite a rule by its ORDINAL and its own capitals.**
  The history, the measurements and the argument this rule was cut
  from are in docs/reference/09-records.md (T-290), verbatim.

- **AND A DISTANCE TO A MOVING TIP CANNOT BE STATED AT ALL IN A DOCUMENT
  COMMITTED TO THAT TIP'S BRANCH** — with or without a ref, because
  **pinning is itself a commit and the commit moves the number**: a
  sentence measuring 348 shipped at 349, the delta being exactly the
  commit carrying it. **THREE FORMS SURVIVE: both endpoints pinned to
  fixed shas, the derive command with NO answer beside it, or
  omission.** A past reading bound to a named occasion is HISTORY and
  cannot go stale; a present-tense value can.
  So when you reach for a moving symbol, you are reaching for a
  tense, not a ref: say `currently` in words with NO figure beside it,
  or pin the sha and let the sentence be about that commit forever.
  The history, the measurements and the argument this rule was cut
  from are in docs/reference/09-records.md (T-290), verbatim.

- **THIS SHELL'S `grep` IS A SHIM.** It carries `-I` and REJECTS
  `--include`, so a habit-formed invocation fails on a flag that works
  everywhere else. Use `command grep`; sweep NULs with `perl -0777`.

- **NEVER TYPE A PATH YOU CAN DERIVE.** `find`, `git ls-files`, or the
  `scripts` block of the relevant `package.json` answers "where does this
  live" in one command.
  **And this bullet is
  itself pinned**: the runner is NAMED once in this file and a body
  requires exactly that, so cite it by description here rather than by
  filename.
  The history, the measurements and the argument this rule was cut
  from are in docs/reference/16-the-repository.md (T-290), verbatim.

- **FIT A BYTE-BANDED DOCUMENT IN ONE WRITE, NOT IN A LOOP.** Draft into
  a scratch file, `wc -c` it, cut to the target, THEN write —
  `docs/STATE.md` was once edited SEVEN times in one sitting to fit its
  warn line, every edit re-triggering the specs that read it. **And when
  it will not fit, the answer is not a smaller sentence**: a MECHANISM
  belongs in a governing document, a record takes the INSTANCE, and
  shaving words is how a rule ends up in neither (T-146, T-225).

- **RUN THE SUITE ONCE IN A BORROWED GIT ENVIRONMENT BEFORE YOU BELIEVE
  IT.** A local green proves it passes *on the machine that wrote it*,
  which is the weakest claim available. Five variables reproduce a
  runner's git environment — no global identity, no `init.defaultBranch`,
  nothing this developer configured years ago, and no identity git
  invented for itself:

      GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_SYSTEM=/dev/null \
        GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=user.useConfigOnly \
        GIT_CONFIG_VALUE_0=true npm test
  On a hostname carrying a dot git reads a domain
  and COMMITS, so the two-variable recipe answers GREEN here and
  reproduces no runner red; a runner's hostname carries none and git
  exits **128**, *"Please tell me who you are"*.
  `user.useConfigOnly=true` is git's own switch for *do not
  auto-detect*, and the `GIT_CONFIG_COUNT`/`KEY_0`/`VALUE_0` triple is
  how one key reaches every git a SUITE spawns (`-c
  user.useConfigOnly=true` is the spelling for a single command).
  **AND UNSET ANY `GIT_AUTHOR_*`/`GIT_COMMITTER_*` YOU CARRY** —
  measured: they outrank the switch and hand the commit an identity
  anyway.
  **DO NOT CLOBBER `HOME` TO GET
  THERE.**
  The history, the measurements and the argument this rule was cut
  from are in docs/reference/16-the-repository.md (T-290), verbatim.

- **PIN THE DEFAULT BRANCH IN EVERY GIT FIXTURE**: `git init -b main`,
  never bare `git init`. `init.defaultBranch` is MACHINE config — this
  developer's says `main`, the CI runner's says `master` — so an
  unpinned fixture builds a different repository on each, and the
  landing gate then resolves a different ref, judges a different range
  and reaches a different verdict.
  The history, the measurements and the argument this rule was cut
  from are in docs/reference/16-the-repository.md (T-290), verbatim.
