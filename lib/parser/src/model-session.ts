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
 */
export function parseModelSession(value: string): ModelSession {
  const raw = value.trim();
  const at = raw.lastIndexOf('@');
  if (at === -1) {
    return { raw, model: raw, policy: 'default' };
  }
  const model = raw.slice(0, at).trim();
  const session = raw.slice(at + 1).trim();
  return {
    raw,
    model,
    session,
    policy: session === 'fresh' ? 'fresh' : 'resume',
  };
}
