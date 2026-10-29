import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { blocks, materialize, renderSkill, SOURCE_INFO } from "../scripts/interview-skill.mjs";
import { WORKSPACE_ASSOCIATION_REL_PATH, WORKSPACE_BINDING_REL_PATH } from "../scripts/workspace.mjs";

const source = path.resolve(fileURLToPath(new URL("../../..", import.meta.url)));
test("the optional cold-start offer preserves mandatory correction of accepted test gaps", () => {
  const role = readFileSync(path.join(source, "method/roles/planner.md"), "utf8").replace(/\s+/g, " ");
  const step = role.slice(role.indexOf("5. Offer a cold-start test:"), role.indexOf("6. Commit the RECORDS genesis"));
  expect(step).toContain("fresh session reads only RECORDS docs/");
  expect(step).toContain("When the person accepts the test, every gap in its answer is a documentation bug: fix the docs and repeat until a cold session passes.");
  expect(step).toContain("The offer is optional and does not undo a completed bank or gate the finished board.");
  const interview = readFileSync(path.join(source, "method/interview/plan-interview.md"), "utf8").replace(/\s+/g, " ");
  expect(interview).toContain("When the person accepts the test, gaps in its answer are gaps in the docs — fix and repeat until a cold session passes.");
  expect(interview).toContain("The offer does not gate or undo the completed board.");
});

test("the delivered interview carries its actual canonical finite PRODUCT bank contract as read-only source", () => {
  const rendered = renderSkill(source);
  const carried = blocks(rendered).filter(block => block.path === "method/interview/genesis-product-proposal.md");
  expect(carried).toHaveLength(1); expect(carried[0]?.kind).toBe(SOURCE_INFO);
  expect(carried[0]?.content).toBe(readFileSync(path.join(source, "method/interview/genesis-product-proposal.md"), "utf8"));
});

function assertLegacySeed(text: string, root: string, marker: string, home: string) {
  mkdirSync(path.dirname(path.join(root, marker)), { recursive: true });
  const file = path.join(root, marker); writeFileSync(file, "malformed explicit role marker\n");
  expect(() => materialize(text, root)).toThrow("interview-seed-separated-workspace");
  expect(readFileSync(file, "utf8")).toBe("malformed explicit role marker\n");
  for (const absent of ["docs", "AGENTS.md", "CLAUDE.md", ".gitignore"]) expect(existsSync(path.join(root, absent)), absent).toBe(false);
  rmSync(file);
  symlinkSync(path.join(home, "absent-target"), file);
  expect(lstatSync(file).isSymbolicLink()).toBe(true);
  expect(() => materialize(text, root)).toThrow("interview-seed-separated-workspace");
  expect(existsSync(path.join(root, "docs"))).toBe(false);
  rmSync(file);
  const legacy = materialize(text, root);
  expect(legacy.written).toContain("docs/NORTH_STAR.md"); expect(legacy.written).toContain("AGENTS.md");
  expect(readFileSync(path.join(root, "docs/NORTH_STAR.md"), "utf8")).toBe(readFileSync(path.join(source, "method/docs-templates/NORTH_STAR.md"), "utf8"));
  expect(existsSync(path.join(root, "docs/plans/genesis-product-proposal.json"))).toBe(false);
}

test("legacy seed refuses explicit role markers before any scaffold effect and preserves affirmative-absence behavior", () => {
  const home = realpathSync(mkdtempSync(path.join(tmpdir(), "genesis-method-contract-")));
  const text = renderSkill(source);
  try {
    for (const marker of [WORKSPACE_BINDING_REL_PATH, WORKSPACE_ASSOCIATION_REL_PATH]) {
      const root = path.join(home, marker === WORKSPACE_BINDING_REL_PATH ? "product" : "records"); mkdirSync(root);
      assertLegacySeed(text, root, marker, home);
    }
  } finally { rmSync(home, { recursive: true, force: true }); }
});
