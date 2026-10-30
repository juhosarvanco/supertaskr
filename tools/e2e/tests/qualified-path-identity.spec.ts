import { existsSync, readFileSync, realpathSync, renameSync } from "node:fs";
import { pathToFileURL } from "node:url";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { loadInstalledRecordTool } from "../scripts/records-check.mjs";
import { privateGit, privateRecordFixture, putPrivate } from "./private-record-fixture";

test("actual installed qualified capture and worker measurement preserve real roots ending in two spaces", async () => {
  const f = privateRecordFixture();
  try {
    const product = path.join(f.dir, "new-code  "); renameSync(f.product, product);
    const bindingFile = path.join(product, ".supertaskr/workspace.json"), binding = JSON.parse(readFileSync(bindingFile, "utf8"));
    putPrivate(product, ".supertaskr/workspace.json", JSON.stringify({ ...binding, productRoot: product }));
    putPrivate(f.records, "docs/tasks/T-910-first.md", "---\nid: T-910\ntitle: Actual padded project root\nfeature: F-01\nmilestone: 1\npriority: 1\nsize: M\nstatus: planned\ntouches: [product::src/first.ts]\n---\n\n## Acceptance criteria\n\n- WHEN planned THE first source file SHALL retain its actual repository identity.\n");
    privateGit(f.records, ["add", "docs/tasks/T-910-first.md"]); privateGit(f.records, ["commit", "-qm", "Authored first-file scope"]);
    const tool = loadInstalledRecordTool(f.manifestPath); expect(tool.package.name).toBe("supertaskr");
    const installed = await import(pathToFileURL(path.join(f.tool, "dist/tools/e2e/scripts/qualified-reservation.mjs")).href);
    const request = { authorityRoot: product, projectId: "external-python", taskId: "T-910", legacyTokenMap: {}, revisions: { product: privateGit(product, ["rev-parse", "HEAD"]), records: privateGit(f.records, ["rev-parse", "HEAD"]) } };
    const captured = installed.captureQualifiedInputs(request);
    expect(realpathSync(product)).toBe(product); expect(product.endsWith("  ")).toBe(true);
    expect(captured.authorityRoot).toBe(product); expect(captured.receipt.productRoot).toBe(product); expect(captured.fence.usable).toBe(true);
    expect(captured.fence.repositories.product).toEqual({ filesystemRoot: product, gitCommonDirectory: realpathSync(path.join(product, ".git")) });
    expect(captured.fence.paths).toMatchObject([{ role: "product", filesystemRoot: product, domain: "src/first.ts" }]);
    expect(installed.measureQualifiedWorker(product)).toMatchObject({ filesystemRoot: product, gitCommonDirectory: realpathSync(path.join(product, ".git")), gitDirectory: realpathSync(path.join(product, ".git")) });
    const worker = path.join(f.dir, "new-worker  "); privateGit(product, ["worktree", "add", "--detach", worker, request.revisions.product]);
    expect(installed.measureQualifiedWorker(worker)).toMatchObject({ filesystemRoot: worker, gitCommonDirectory: realpathSync(path.join(product, ".git")) });
    const scope = installed.deriveQualifiedScope({ version: 1, ...request, attempt: "T-910-a1", receipt: captured.receipt,
      workers: [{ role: "product", checkout: worker, base: request.revisions.product }] });
    expect(scope.workers[0].identity.filesystemRoot).toBe(worker); expect(scope.fence.repositories.product.filesystemRoot).toBe(product);
    expect(existsSync(path.join(product, "src"))).toBe(false); expect(existsSync(product.trimEnd())).toBe(false);
    expect(() => installed.captureQualifiedInputs({ ...request, authorityRoot: product.trimEnd() })).toThrow(/qualified-location/);
  } finally { f.cleanup(); }
});
