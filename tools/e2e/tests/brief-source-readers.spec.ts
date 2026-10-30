import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { contractSourceFromFiles, methodReferences } from "../scripts/dispatch-brief.mjs";
import { conventionsText, conventionsTextFromSource } from "../scripts/docs-scan.mjs";

const executor = readFileSync(new URL("../../../method/roles/executor.md", import.meta.url), "utf8"), verifier = readFileSync(new URL("../../../method/roles/verifier.md", import.meta.url), "utf8");

test("captured METHOD contract lookup preserves own, unique fallback and ambiguous/missing refusals without source-root lookup", () => {
  const files = [{ path: "method/roles/executor.md", content: executor }];
  expect(contractSourceFromFiles("executor", executor, [])).toMatchObject({ own: true, rel: "method/roles/executor.md" });
  expect(contractSourceFromFiles("verifier", verifier, files)).toMatchObject({ own: false, rel: "method/roles/executor.md", md: executor });
  expect(() => contractSourceFromFiles("verifier", verifier, [])).toThrow(/no other role file/);
  expect(() => contractSourceFromFiles("verifier", verifier, [...files, { path: "method/roles/second.md", content: executor }])).toThrow(/2 role files carry/);
});

test("captured METHOD references reuse canonical grammar and actual membership without opening unlisted files", () => {
  const text = "Read ../lane-protocol.md, tasks/TASK-FORMAT.md, tasks/TASK-FORMAT.md and nonexistent.md.";
  expect(methodReferences(text, "method/roles/executor.md", ["method/lane-protocol.md", "method/tasks/TASK-FORMAT.md"])).toEqual([
    { rel: "method/lane-protocol.md", spelling: "../lane-protocol.md" }, { rel: "method/tasks/TASK-FORMAT.md", spelling: "tasks/TASK-FORMAT.md" },
  ]);
  expect(methodReferences(text, "method/roles/executor.md", [])).toEqual([]);
});

test("captured and filesystem CONVENTIONS share exact splice and all missing, reordered, unmentioned and leftover refusals", () => {
  const root = mkdtempSync(path.join(tmpdir(), "brief-conventions-source-"));
  const index = "# Conventions\n\n## Build & test\n  - docs/conventions/python.md — PYTHON CHECK: use the configured argv.\n", chapter = "# Python\n\n- PYTHON CHECK: use the configured argv.\n  Build the first sources before executing tests.\n";
  const files = new Map([["docs/conventions/python.md", chapter]]), reads: string[] = [];
  const source = { read(file: string) { reads.push(file); const text = files.get(file); if (text === undefined) throw Error("Captured chapter missing"); return text; }, paths: () => files.keys() };
  try {
    mkdirSync(path.join(root, "docs/conventions"), { recursive: true }); writeFileSync(path.join(root, "docs/CONVENTIONS.md"), index); writeFileSync(path.join(root, "docs/conventions/python.md"), chapter);
    expect(conventionsTextFromSource(index, source)).toBe(conventionsText(root)); expect(reads).toEqual(["docs/conventions/python.md"]);
    files.clear(); expect(() => conventionsTextFromSource(index, source)).toThrow(/Captured chapter missing/);
    files.set("docs/conventions/python.md", chapter.replace("PYTHON CHECK:", "DIFFERENT CHECK:")); expect(() => conventionsTextFromSource(index, source)).toThrow(/next bullet/);
    files.set("docs/conventions/python.md", chapter); files.set("docs/conventions/unknown.md", "# Unknown\n"); expect(() => conventionsTextFromSource(index, source)).toThrow(/points at nowhere/);
    files.delete("docs/conventions/unknown.md"); files.set("docs/conventions/python.md", chapter + "\n- SECOND CHECK: never silently lost.\n"); expect(() => conventionsTextFromSource(index, source)).toThrow(/does not point at/);
    expect(conventionsTextFromSource("# Single-file conventions\n\n## Gotchas\nNone declared.\n", { read() { throw Error("No chapter may be opened"); }, paths: () => [] })).toContain("None declared.");
  } finally { rmSync(root, { recursive: true, force: true }); }
});
