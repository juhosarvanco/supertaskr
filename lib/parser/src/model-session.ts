import type { ModelSession } from './types.js';

/**
 * Parse a `model[@session]` value per TASK-FORMAT.md session syntax.
 *
 * Accepted forms:
 * - `codex`            -> model `codex`, policy `default`
 * - `codex@fresh`      -> model `codex`, session `fresh`, policy `fresh`
 * - `codex@S3`         -> model `codex`, session `S3`, policy `resume`
 * - `codex/gpt-5.2 @S3` (stamped form, space before `@`) -> model
 *   `codex/gpt-5.2`, session `S3`, policy `resume`
 *
 * Splits at the LAST `@` so model identifiers containing `@` keep working;
 * whitespace around either part is trimmed. This function does not
 * validate — empty model/session parts are returned as-is and rejected by
 * the task-level validator with a field-scoped issue.
 *
 * REPRESENTATIVE model, not the whole prose (T-030, absorbing the parser
 * half of T-024-s6). A real stamp is prose that HAPPENS to contain the
 * syntax: `claude-fable-5 @fresh (WIP through ad2716f) + claude-opus-5
 * @fresh ×2 (completion + rejection-fix sessions)` is one honest sentence
 * about a two-model build. Splitting it at the last `@` used to hand the
 * whole 59-character left half to `model`, and the board rendered a
 * 50-character "badge" from it. So `model` is now the LAST
 * whitespace-delimited token of the left half — the model that last
 * touched the work, which is what a badge is for — while `raw` keeps the
 * entire stamp verbatim for the detail panel. Nothing is dropped from the
 * model; the prose is preserved where there is room to show it.
 *
 * The compound stamp is accepted as LEGITIMATE prose, deliberately: the
 * alternative arms (a gate rejecting whitespace/`@`/`+` in the model half,
 * or a full delimited grammar) were ruled out at T-030's triage because
 * the first would flag stamps already standing in this repo's live tree
 * and the second would rewrite finished tasks' frontmatter.
 *
 * Known wart, pinned rather than papered over (see T-030-s1): when a
 * stamp's LAST `@` belongs to a trailing `@human` note —
 * `claude-fable-5 @fresh (2 passes) + @human (visual)` — the left half
 * ends in `+`, so the representative model is `+`. The rule is
 * mechanical by design (a smarter split is the delimited-grammar arm the
 * triage rejected); the display side bounds and titles badges
 * (T-031/T-032), and `raw` still carries the truth.
 *
 * `policy` reads the session's FIRST whitespace-delimited word instead of
 * demanding the whole session equal `fresh`, so an ANNOTATED fresh session
 * — `@fresh ×2 (build + rejection-fix sessions)`, `@fresh (2 passes)` —
 * reports `fresh` instead of the opposite. Eight stamps across six done
 * tasks in this repo reported `resume` for sessions that were plainly
 * fresh; nothing outside this module reads the field yet, which is exactly
 * why it had to be right before something starts believing it. `session`
 * itself keeps the full remainder — the annotation is data, not noise.
 */
export function parseModelSession(value: string): ModelSession {
  const raw = value.trim();
  const at = raw.lastIndexOf('@');
  if (at === -1) {
    // No session syntax at all: the whole value is the model identifier
    // (TASK-FORMAT.md's bare form). Nothing to be representative OF, so
    // this branch is deliberately untouched by the rule above.
    return { raw, model: raw, policy: 'default' };
  }
  const left = raw.slice(0, at).trim();
  const session = raw.slice(at + 1).trim();
  // `''.split(/\s+/)` is `['']`, so an empty left half stays the empty
  // model the task-level validator already rejects with a field issue.
  const tokens = left.split(/\s+/);
  const model = tokens[tokens.length - 1] ?? '';
  const firstWord = session.split(/\s+/)[0] ?? '';
  return {
    raw,
    model,
    session,
    policy: firstWord === 'fresh' ? 'fresh' : 'resume',
  };
}
