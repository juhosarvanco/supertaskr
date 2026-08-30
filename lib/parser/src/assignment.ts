import type {
  AssignmentReading,
  AssignmentRole,
  ParseIssue,
  TaskRecord,
} from './types.js';

/**
 * THE ASSIGNMENT VERDICT (T-169) — D5's teeth on the read side.
 *
 * @human ruled D5 in their own words (docs/rooms/cockpit-or-mirror.md):
 * "Of course the models the human assigns to different tasks do those
 * tasks as assigned." Assignment is BINDING, not advisory. Where a spawn
 * path can force the model the adapter forces it; where it cannot — a
 * hand-pasted brief, an adapter whose CLI takes no model flag — nputer
 * VERIFIES instead, and this module is the verification. It derives, per
 * card, whether what the human ASSIGNED (`builder:` / `verifier:`) is
 * among what actually RAN (`built_by:` / `verified_by:`), from fields the
 * parser already reads. It decides nothing about blame: a disagreement is
 * reported as a disagreement, because WHY the fields disagree is a human
 * question.
 *
 * ────────────────────────────────────────────────────────────────────
 * THE EXACT COMPARISON RULE, STATED HERE BECAUSE THIS IS THE DEFINITION
 * SITE (T-169's first acceptance criterion demands it be stated, not
 * inferred from the code):
 *
 *   1. The comparison is on the MODEL half of `model@vehicle`, never on
 *      the whole value. The vehicle — `@subagent`, `@fresh`, `@S3`,
 *      `@T-169-verify`, a hand-driven app — is legitimate variation D5
 *      does not constrain, so `claude-opus-5@subagent` assigned and
 *      `claude-opus-5 @T-169` executed is the SAME model in two vehicles
 *      and is never a violation.
 *   2. Each side is reduced to the SET of models its value names, by
 *      `stampModels` below. A single-model value yields one member and
 *      the rule collapses to the exact string equality T-169's criterion
 *      describes; a value naming several yields several, because live
 *      stamps in this repository do (see the measured reason below).
 *   3. An EMPTY assignment constrains nothing: no `builder:` means the
 *      verdict is `unconstrained` whatever `built_by:` says. An empty
 *      EXECUTION field is likewise `unconstrained` here — an unstamped
 *      `done` card is its own, existing incompleteness (TASK-FORMAT's
 *      requiredness, the card preflight), not this verdict's to relitigate.
 *   4. A pair is HONOURED when every model the assignment names is
 *      SATISFIED by some model the execution names, and VIOLATED
 *      otherwise. `missing` carries exactly the assigned models nothing
 *      satisfies, and is non-empty if and only if the verdict is
 *      `violated`.
 *   5. One model SATISFIES another when the two strings are EQUAL, or
 *      when the executed one REFINES the assigned one at a `/` boundary:
 *      `builder: codex` is honoured by `built_by: codex/gpt-5.2`. The
 *      `/` is this convention's own vendor-or-CLI separator — types.ts
 *      gives `codex`, `claude-fable-5` and `codex/gpt-5.2` as the three
 *      shapes of one identifier — so a `/` refinement names the SAME
 *      agent at finer grain, and a human who assigned `codex` and got
 *      codex got what they asked for. The clause is exactly as narrow as
 *      its reason:
 *        · the boundary is `/` and ONLY `/`. No case folding, no bare
 *          prefix, no substring. `claude-opus-5-mini` never satisfies
 *          `claude-opus-5` — a rule that let it would be precisely the
 *          silent substitution D5 forbids.
 *        · it is ONE-DIRECTIONAL. Assigned `codex` is satisfied by
 *          executed `codex/gpt-5.2`; assigned `codex/gpt-5.2` is NOT
 *          satisfied by executed `codex`, because a stamp that does not
 *          name the version cannot testify that the assigned version ran.
 *      ITS EVIDENCE IS THIS PACKAGE'S OWN `valid-project` FIXTURE, which
 *      predates this card by four months and demonstrates the stamped
 *      form as `builder: codex@fresh` against `built_by: codex/gpt-5.2
 *      @S3` with zero issues expected. Without the clause the parser's
 *      canonical example of a correctly stamped done card becomes a D5
 *      violation, which is a statement about the convention nobody made.
 *
 * WHY A SET AND NOT `ModelSession.model` (the measured reason, derived
 * at bf274ed over this repository's own 347 cards): comparing the
 * `model` field `parseModelSession` already computes reports EIGHT
 * disagreements on the live board, and SIX of them are not disagreements
 * at all. That field is a REPRESENTATIVE model — documented in
 * model-session.ts as the last whitespace token of the half before the
 * LAST `@`, a deliberately mechanical rule with a pinned wart (T-030-s1).
 * Against a prose stamp it returns prose: `verified_by: claude-opus-5
 * @T-013-verify (re-verified @T-013-verify2, 2026-08-23)` yields the
 * model `(re-verified`, and comparing THAT against `verifier:
 * claude-opus-5` would have the board announce a violation on T-013,
 * T-081, T-084, T-085, T-110 and T-001 where the fields plainly agree.
 * The board would be lying about the human's own cards on the day it
 * shipped. So the rule reads every `model@vehicle` unit the value names
 * instead of one representative, and the six vanish — not by exception,
 * but because they were never disagreements.
 *
 * THE TWO CARDS THAT ARE NOT VIOLATIONS AND ARE WORTH NAMING: T-020 and
 * T-024 stamp `built_by: claude-fable-5 @fresh (WIP through …) +
 * claude-opus-5 @fresh (completion)` against `builder: claude-fable-5`.
 * The assigned model IS among the models the stamp names — it did the
 * work, and a second model finished — so the pair is `honoured` under
 * rule 4. That is deliberate and it is the honest reading of D5: the
 * ruling is against a model being SUBSTITUTED for the assigned one, and
 * a stamp that names both is the opposite of a substitution, being the
 * loudest possible disclosure of what happened. `executedModels` carries
 * the whole set, so a consumer that wants to say more about a shared
 * build has the fact without this module inventing a verdict for it.
 * ────────────────────────────────────────────────────────────────────
 */

/**
 * A model identifier's shape, for deciding whether a token found beside
 * an `@` is a model at all: starts alphanumeric, then alphanumerics and
 * the three separators live identifiers use (`codex/gpt-5.2`,
 * `claude-fable-5`, `claude-opus-5`). Deliberately narrow — it is what
 * REJECTS the prose that sits beside an `@` in a stamped sentence
 * (`(re-verified`, `+`), and every rejection makes the executed set
 * SMALLER, which can only make rule 4 stricter.
 */
const MODEL_ID = /^[A-Za-z0-9][A-Za-z0-9._/-]*$/;

/**
 * Every model a `model[@vehicle]` value names, in first-appearance order,
 * deduplicated.
 *
 * A value with NO `@` is a bare model identifier (TASK-FORMAT's bare
 * form) and is the whole trimmed string — the same branch
 * `parseModelSession` takes, and the reason `builder: claude-opus-5`
 * needs no special case.
 *
 * A value WITH `@` is scanned for every `@`, and the model for each is
 * the whitespace-delimited token immediately before it. This reads both
 * spellings the convention carries — the compact `codex@S3` and the
 * stamped `codex/gpt-5.2 @S3` with a space — because in both the token
 * ending where the `@` begins is the model.
 *
 * `@human` IS SKIPPED, and that is not a special case for a name: a
 * trailing `@human` note in a stamp (`claude-fable-5 @fresh (2 passes) +
 * @human (visual)`) is prose ABOUT human involvement, never
 * `model@vehicle` syntax — model-session.ts pins that exact stamp as the
 * wart that makes its representative model `+`. Skipping it keeps the
 * word before it (`+`, `under`) out of the executed set, which again
 * only tightens rule 4.
 *
 * The honest residual, named at the strength of its evidence: a bare
 * prose word sitting immediately before a real `@` — `under` in
 * `… APPROVED under @human's waiver` before the skip above removes it —
 * has an identifier's SHAPE, so a value could in principle admit a
 * spurious member. It can only widen the executed set, so it can only
 * ever turn a violation into an honoured pair, never the reverse; and
 * for it to matter, a card's assigned model would have to be spelled
 * exactly like an English word that a stamp happens to place before an
 * `@`. Zero of this repository's 227 constrained pairs are affected
 * (derived at bf274ed). A delimited stamp grammar would close it and is
 * the arm T-030's triage already rejected for rewriting finished cards.
 */
export function stampModels(value: string): string[] {
  const raw = value.trim();
  const found: string[] = [];
  if (!raw.includes('@')) {
    if (MODEL_ID.test(raw)) found.push(raw);
    return found;
  }
  for (let index = 0; index < raw.length; index++) {
    if (raw[index] !== '@') continue;
    // `@human` is a note about a person, not a vehicle a model ran in.
    if (/^human/i.test(raw.slice(index + 1))) continue;
    const before = raw.slice(0, index).trimEnd();
    const token = before.split(/\s+/).pop() ?? '';
    if (token !== '' && MODEL_ID.test(token) && !found.includes(token)) found.push(token);
  }
  return found;
}

/**
 * Does `executed` satisfy `assigned`? Rule 5's whole content, in one
 * place so the asymmetry cannot be read backwards: equality, or a `/`
 * refinement in the executed direction only.
 */
export function satisfiesAssignment(assigned: string, executed: string): boolean {
  return executed === assigned || executed.startsWith(`${assigned}/`);
}

/**
 * The two pairs D5 binds, and the FIELD SPELLINGS as they appear in
 * frontmatter — the names a message must use, because those are the
 * names the human reads on the card.
 */
export const ASSIGNMENT_PAIRS = [
  { role: 'builder', assignedField: 'builder', executedField: 'built_by' },
  { role: 'verifier', assignedField: 'verifier', executedField: 'verified_by' },
] as const satisfies readonly {
  role: AssignmentRole;
  assignedField: string;
  executedField: string;
}[];

/**
 * The per-card assignment verdict: one reading per pair, ALWAYS both, in
 * ASSIGNMENT_PAIRS order — a caller asking "what does this card say about
 * its verifier" gets an answer rather than an absence to interpret.
 * Pure: reads a record, returns readings, never throws.
 */
export function readAssignment(task: TaskRecord): AssignmentReading[] {
  return ASSIGNMENT_PAIRS.map(({ role, assignedField, executedField }) => {
    const assigned = role === 'builder' ? task.builder : task.verifier;
    const executed = role === 'builder' ? task.builtBy : task.verifiedBy;
    const base = { role, assignedField, executedField, file: task.file } as const;
    if (assigned === undefined || executed === undefined) {
      // Rule 3: an empty side constrains nothing. The raw values that DO
      // exist are still carried — absence of a verdict is not absence of
      // facts, and a consumer showing the pair wants both halves.
      return {
        ...base,
        verdict: 'unconstrained' as const,
        ...(assigned !== undefined ? { assigned: assigned.raw } : {}),
        ...(executed !== undefined ? { executed: executed.raw } : {}),
        assignedModels: assigned === undefined ? [] : stampModels(assigned.raw),
        executedModels: executed === undefined ? [] : stampModels(executed.raw),
        missing: [],
      };
    }
    const assignedModels = stampModels(assigned.raw);
    const executedModels = stampModels(executed.raw);
    // A side whose value names no model at all cannot be compared. It is
    // unreachable through parseTaskFile (an empty model half is already an
    // invalid-field there), so this is the standalone-caller guard: an
    // uncomparable pair reports `unconstrained` rather than a violation
    // manufactured out of a value nobody could read.
    const comparable = assignedModels.length > 0 && executedModels.length > 0;
    const missing = comparable
      ? assignedModels.filter((m) => !executedModels.some((e) => satisfiesAssignment(m, e)))
      : [];
    return {
      ...base,
      verdict: !comparable
        ? ('unconstrained' as const)
        : missing.length === 0
          ? ('honoured' as const)
          : ('violated' as const),
      assigned: assigned.raw,
      executed: executed.raw,
      assignedModels,
      executedModels,
      missing,
    };
  });
}

/**
 * The violations on one card, as parser issues — the shape that puts them
 * on the board through the surface parse errors already use, per card and
 * verbatim, rather than through a second channel that could disagree with
 * it (the T-057 one-rule-one-implementation discipline).
 *
 * THE WORD IS "DISAGREE" AND IT IS CHOSEN, not settled for. The parser
 * knows the two fields name different models. It does not know which is
 * right, whether a human re-assigned mid-flight, whether an adapter
 * ignored a flag, or whether somebody mistyped — so a message saying
 * "wrong model", "substituted" or "unauthorised" would claim knowledge
 * this module does not have. BOTH VALUES ARE IN THE SENTENCE, raw and
 * quoted, because the board's job here is to show the reader what the
 * card says and let them judge it.
 *
 * It carries `assignedField` and `executedField` rather than one `field`
 * deliberately: naming a single field would be naming the one at fault,
 * and which of them is at fault is exactly the human question.
 */
export function assignmentIssues(task: TaskRecord): ParseIssue[] {
  const issues: ParseIssue[] = [];
  for (const reading of readAssignment(task)) {
    if (reading.verdict !== 'violated') continue;
    const assigned = reading.assigned ?? '';
    const executed = reading.executed ?? '';
    issues.push({
      kind: 'assignment-violation',
      file: task.file,
      role: reading.role,
      assignedField: reading.assignedField,
      executedField: reading.executedField,
      assigned,
      executed,
      assignedModels: reading.assignedModels,
      executedModels: reading.executedModels,
      missing: reading.missing,
      message:
        `${task.file}: '${reading.assignedField}' assigns ${JSON.stringify(assigned)} but ` +
        `'${reading.executedField}' records ${JSON.stringify(executed)} — the fields disagree ` +
        `(${reading.missing.map((m) => `'${m}'`).join(', ')} ` +
        `${reading.missing.length === 1 ? 'is' : 'are'} not among the models the stamp names: ` +
        `${reading.executedModels.map((m) => `'${m}'`).join(', ')}). ` +
        `Assignment is binding (D5); WHY they disagree is a human question.`,
    });
  }
  return issues;
}
