/**
 * Verdict-history derivations (T-006 panel presentation; T-017 card-face
 * count): pure, total functions over the raw `## Verdicts` markdown,
 * which stays VERBATIM — these only decide entry splits, tints, and
 * counts, never rewrite text.
 *
 * Own module (T-017): the panel's tinting (task-detail.ts) and the
 * board's `rejected ×N` face count (board-model.ts, T-006-s3) must share
 * ONE classifier — a count that disagreed with the tint would be a lie —
 * and task-detail already imports from board-model, so the shared family
 * lives here to keep the dependency graph acyclic.
 */
import { blankInertSpans } from "@supertaskr/parser/pure";

/** One verdict-history entry, VERBATIM, with a derived tint. */
export interface VerdictEntry {
  /** Which block tint the entry takes; "note" is the neutral fallback. */
  kind: "approved" | "rejected" | "note";
  /** The entry's full text, exactly as written in the task file. */
  text: string;
}

const VERDICT_DATE = /^(?:#{1,6}[ \t]+)?\d{4}-\d{2}-\d{2}\b/;

/**
 * Split raw `## Verdicts` markdown into entries at date-headed
 * paragraphs (the convention's verdict form: `2026-08-15 — who (role):
 * VERDICT …`). The tint comes from the verdict word in the entry's
 * first paragraph, FIRST match wins (T-006-s4): convention verdicts
 * lead with the verdict word after the role colon, so when one header
 * paragraph carries both words — `APPROVED — the REJECTED repro no
 * longer reproduces` — the earlier word is the honest read; testing
 * REJECTED categorically first mislabeled that entry. Text stays
 * verbatim — the panel is a reading surface, never a summary (T-005).
 * Unheaded text and inert Markdown fold into neutral entries. Plain or
 * Markdown date headings can start a real verdict; raw text still renders.
 */
export function verdictEntries(raw: string): VerdictEntry[] {
  const blocks: { raw: string[]; visible: string[] }[] = [];
  const visible = blankInertSpans(raw).content.split("\n");
  let current: { raw: string[]; visible: string[] } | undefined;
  for (const [index, line] of raw.split("\n").entries()) {
    const structural = visible[index] ?? "";
    if (VERDICT_DATE.test(structural.trim()) || current === undefined) {
      current = { raw: [], visible: [] };
      blocks.push(current);
    }
    current.raw.push(line);
    current.visible.push(structural);
  }
  return blocks
    .map((block) => ({ text: block.raw.join("\n").trim(), structural: block.visible.join("\n").trim() }))
    .filter(({ text }) => text !== "")
    .map(({ text, structural }) => {
      const firstParagraph = structural.split(/\n\s*\n/, 1)[0] ?? "";
      const rejected = firstParagraph.search(/\bREJECTED\b/);
      const approved = firstParagraph.search(/\bAPPROVED\b/);
      const kind =
        !VERDICT_DATE.test(firstParagraph) || rejected === -1 && approved === -1
          ? ("note" as const)
          : approved === -1 || (rejected !== -1 && rejected < approved)
            ? ("rejected" as const)
            : ("approved" as const);
      return { kind, text };
    });
}

/**
 * How many REJECTED entries a task's verdict history carries — the
 * card face's `rejected ×N` (T-006-s3), derived from the SAME
 * classifier as the panel's tint so face and panel can never disagree.
 * Absent section counts as zero.
 */
export function rejectedVerdictCount(verdicts: string | undefined): number {
  if (verdicts === undefined) return 0;
  return verdictEntries(verdicts).filter((entry) => entry.kind === "rejected").length;
}
