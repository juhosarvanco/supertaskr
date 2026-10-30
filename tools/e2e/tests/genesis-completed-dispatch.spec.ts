import { expect, test } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { completedGenesisFixture } from "./genesis-completed-fixture";
import { captureCompletedGenesisForDispatch } from "../scripts/genesis-bank-plan.mjs";
import { privateGit, putPrivate } from "./private-record-fixture";

test("actual sequential banks0 through8 establish an exact code-empty dispatch baseline without claiming suite GREEN", () => {
  test.setTimeout(1_200_000);
  const f = completedGenesisFixture(stage => process.stdout.write(`completed-genesis-fixture: bank ${stage} accepted\n`));
  try {
    expect(f.receipts.map(receipt => receipt.stage)).toEqual([0,1,2,3,4,5,6,7,8]);
    expect(f.receipts.slice(6).map(receipt => receipt.completedStage)).toEqual([6,7,8]);
    expect(existsSync(path.join(f.product, "src/first.py"))).toBe(false); expect(existsSync(path.join(f.product, "checks/test_first.py"))).toBe(false);
    const snapshot = () => [f.product, f.records].map(root => ({ head: privateGit(root, ["rev-parse", "HEAD"]), refs: privateGit(root, ["show-ref"]), index: readFileSync(path.join(root, ".git/index")) }));
    const before = snapshot(), baseline = captureCompletedGenesisForDispatch({ productRoot: f.product, tool: f.toolHandle, taskId: f.taskId });
    expect(baseline).toMatchObject({ kind: "initialized-code-empty", qualifiedSuiteBaseline: false, bank8: { stage: 8, completedStage: 8 }, revisions: { product: f.productRevision, records: f.recordsRevision }, card: { path: f.cardPath } });
    expect(baseline.productFiles.map((file: any) => file.path)).toEqual([".gitignore", "AGENTS.md", "CLAUDE.md", "supertaskr.yaml"]);
    expect(Object.isFrozen(baseline)).toBe(true); expect(snapshot()).toEqual(before);
    expect(() => captureCompletedGenesisForDispatch({ productRoot: f.product, tool: f.toolHandle, taskId: "T-999" })).toThrow(/genesis-dispatch-baseline-task/);
    putPrivate(f.product, "src/first.py", "# Actual untracked first code is not the initial empty baseline.\n");
    expect(() => captureCompletedGenesisForDispatch({ productRoot: f.product, tool: f.toolHandle, taskId: f.taskId })).toThrow(/genesis-dispatch-baseline-product-dirty/);
    privateGit(f.product, ["add", "src/first.py"]); privateGit(f.product, ["commit", "-qm", "First actual code ends initial baseline"]);
    expect(() => captureCompletedGenesisForDispatch({ productRoot: f.product, tool: f.toolHandle, taskId: f.taskId })).toThrow(/genesis-dispatch-baseline-product-changed/);
  } finally { f.cleanup(); }
});
