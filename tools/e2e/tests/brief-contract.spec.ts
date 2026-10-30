import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { assembleContractRowSet, contractRows, render, roleSpecificRows, treeProv, unstampedLines, value } from "../scripts/dispatch-brief.mjs";

const md = readFileSync(new URL("../../../method/roles/executor.md", import.meta.url), "utf8");
const contract = { md, rel: "method/roles/executor.md", own: true };
const provenance = (via: string) => treeProv("a".repeat(40), via);

test("the shared brief frame assembles the actual normative row set with every source and provenance intact", () => {
  const rows = contractRows(md), findings: string[] = [];
  const derivers = new Map(rows.map(row => [row.key, () => [value(`Actual ${row.key} observation`, provenance(`actual ${row.key} owner`))]]));
  const assembled = assembleContractRowSet({ rows, contract, roleRel: contract.rel, derivers, provenance, findings }), text = render(assembled.recs);
  expect(findings).toEqual([]); expect(assembled.orphaned).toEqual([]);
  expect(text.match(/^ROW /gm)).toHaveLength(rows.length); expect(unstampedLines(text)).toEqual([]);
  for (const row of rows) {
    expect(text).toContain(`ROW ${row.n} — ${row.label}`); expect(text).toContain(`assembled from: ${row.source}`);
    expect(text).toContain(`Actual ${row.key} observation`); expect(text).toContain(`actual ${row.key} owner`);
  }
});

test("a renamed normative label has neither a positional fallback nor a silently orphaned deriver", () => {
  const rows = contractRows(md), derivers = new Map(rows.map(row => [row.key, () => [value(row.key, provenance(row.key))]]));
  const renamed = { ...contract, md: md.replace("**Commands**", "**Changed commands**") }, changedRows = contractRows(renamed.md), findings: string[] = [];
  const assembled = assembleContractRowSet({ rows: changedRows, contract: renamed, roleRel: contract.rel, derivers, provenance, findings }), text = render(assembled.recs);
  expect(changedRows.map(row => row.key)).not.toEqual(rows.map(row => row.key)); expect(findings).toHaveLength(1); expect(findings[0]).toContain("Changed commands");
  expect(assembled.orphaned).toHaveLength(1); expect(assembled.orphaned[0]).toContain('"commands"'); expect(text).toContain("NOT DERIVED");
});

test("role-specific substitution stays derived from the same actual METHOD table", () => {
  const rows = contractRows(md), findings: string[] = [], derivers = new Map(rows.map(row => [row.key, () => [value(row.key, provenance(row.key))]]));
  const assembled = assembleContractRowSet({ rows, contract: { ...contract, own: false }, roleRel: "method/roles/verifier.md", derivers, provenance, findings }), text = render(assembled.recs);
  expect(findings).toEqual([]); expect(assembled.orphaned).toEqual([]);
  expect(text.match(/role-specific: this row/g)).toHaveLength(roleSpecificRows(md).length);
  expect(text).toContain("method/roles/verifier.md"); expect(unstampedLines(text)).toEqual([]);
});
