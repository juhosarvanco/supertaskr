# Room: loop customization and org-skills import

Opened 2026-08-30 at @human's directive: *build easy customization
for the SDLC loop — simple for everyone, per-stage deep (execution,
verification, integration, testing…) for professional hardcore
developers — and let organizations import skills (brand, security,
compliance, UX) into a project easily. Find the ultimate simple
UX for developers, organizations, and enterprises to customize the
loop.* Companion ruling, recorded in
docs/research/ai-native-sdlc-playbook-review.md: the AI-native SDLC
playbook is a MISSION-CRITICAL REFERENCE; deviations carry stated
reasoning at its level or better.

## The starting insight — the loop is ALREADY files

nputer's loop is not code to expose; it is files to layer. The
stages are method/ role files (executor, verifier, integrator,
architect) and protocols (lane, dispatch, drills, TASK-FORMAT); the
project's own law is docs/CONVENTIONS.md; per-card overrides exist
(`review: independent`); the kit (kit.rs KIT_FILES) already SHIPS
the loop into new projects at genesis. So customization is a
LAYERING question, and the natural stack, most-general first:

    method defaults  →  org skill packs  →  project CONVENTIONS
                     →  per-card overrides

Each layer overrides the one before it; every layer is
version-controlled files; the diff of a customization is readable in
a PR. This is the playbook's own model (managed settings → repo
`.claude/` → session) with nputer's method as the bottom layer.

## Design seeds for the sitting

1. **Adopt the playbook's skill format verbatim** —
   `.claude/skills/<name>/SKILL.md`, frontmatter with trigger
   conditions. Compatibility IS the import UX: an org's existing
   Claude skills (brand, security, compliance, UX) drop into a
   nputer project unchanged, distributed the ways they already are
   (marketplace, checked-in directories). nputer's job is only to
   WIRE them: genesis and spec-writing sessions load matching
   skills; seat briefs name which skills were active (provenance —
   the playbook logs skill versions, nputer stamps them per brief).
2. **Stage slots, not stage forks.** Each stage exposes named
   extension points (e.g. verifier: extra attack-set sources;
   executor: extra read-first docs; integrator: extra gate
   commands; testing: extra owed suites) that a skill or
   CONVENTIONS section can fill — the method files stay canonical,
   and a customization DECLARES itself instead of editing a role
   file. The hard version (edit method/ directly) remains available
   to experts, gated by the method-eval --bump obligation, which is
   the regression net the playbook wants over config changes.
3. **The simple UX is the interview.** nputer's genesis already
   asks questions and banks answers; the easy customization path is
   MORE INTERVIEW, not a settings screen: "does your organization
   have skills to import? point me at them" as a stage-0 question,
   and a board card generated for each imported pack so the import
   is auditable and reversible.
4. **Enterprise = the same files plus the git host** — managed
   skill packs arrive as protected directories (CODEOWNERS on
   .claude/skills/), non-negotiable gates stay hooks, and the
   team-enablement room's invariants apply unchanged.

## Open questions — this room's to close

- The override semantics: when an org skill and project CONVENTIONS
  disagree, who wins, and is the answer per-layer or per-skill
  (`advisory` vs `binding` in frontmatter)?
- Skill provenance in the ceremony: does a verdict RECORD which
  skills steered the build (the playbook logs versions; nputer's
  form would be a brief row + checkpoint line)?
- What is the smallest first slice — wire skills into genesis only
  (the playbook's Stage-2 quote is exactly this), before any
  per-stage slot exists?
- Does the fence system need a skills carve-out (`.claude/skills/`
  readable by every seat, writable by none but an import card)?

RESOLUTION: none yet. Decomposes at its own sitting (T-166's hook);
the smallest-first-slice question above is the sitting's opening
item.
