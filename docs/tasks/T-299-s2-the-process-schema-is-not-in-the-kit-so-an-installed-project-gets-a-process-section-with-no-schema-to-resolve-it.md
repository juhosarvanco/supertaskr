---
id: T-299-s2
title: "The process schema is not in the kit, so a project the genesis installs gets a process: section in its runtime template and no schema to resolve it against — the arm reads null and runs the pre-settings loop in silence"
feature: F-04
milestone: 4
size: S
priority: 2
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-299, measured at 689a66c3cf99c1963d170d9e47734746cdcf708a, 2026-09-10"
blocked_by: []
touches: [app/src-tauri/src/agent/kit.rs, method/README.md, tools/e2e/scripts/token-scan.mjs]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

The kit embeds the runtime template by NAME, one entry per file, and
T-299 added a second file beside it that nothing embeds. So a project
the genesis installs receives `runtime/supertaskr.yaml` carrying a
`process:` section that names a profile, and receives no
`process-schema.yaml` for that profile to be a column OF.

What happens then is the quiet half. The arm's loader returns null when
either file is missing, on purpose: a tree that predates the settings is
not a misconfiguration, and refusing every dispatch in such a tree would
be worse than running the behaviour that tree already had. But an
INSTALLED project is not such a tree — it has the section and not the
schema — and it will run the pre-settings loop while its own template
says it runs a profile. The brief prints a line saying the process could
not be read, which is the only signal.

Three places name the runtime template one file at a time and each needs
the second: the kit's embed list, the method README's repo-layout block,
and the token scan's control-file list.

## What a fix looks like

Embed the schema beside the template, name it in the layout block, and
add it to the control list. Then tighten the loader's tolerance: a tree
carrying a `process:` section and NO schema is a misconfiguration and
should say so louder than a line in a brief, while a tree carrying
neither stays tolerated exactly as it is now.

## Acceptance criteria

- WHEN the kit is copied into a project THE schema SHALL be copied with
  the runtime template, and a body SHALL assert both are present.
- WHEN a tree carries a process section and no schema THE arm SHALL
  report that as a misconfiguration rather than as an absent section.
- WHEN a tree carries neither THE arm SHALL keep running the loop it ran
  before the settings existed.
