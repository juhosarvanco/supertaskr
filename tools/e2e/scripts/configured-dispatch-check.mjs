/** Fixed TOOL read-only check for retained configured effects. No lock,
 * transaction, child assignment, grant mutation or configurable program. */
import path from "node:path";
import { realpathSync } from "node:fs";
import { isMain } from "../../../cli/is-main.mjs";
import { validConfiguredDispatchCapsule } from "../../../cli/configured-native-reader.mjs";
import { captureConfiguredDispatch, configuredDispatchEffectContext } from "./configured-dispatch.mjs";
import { loadInstalledRecordTool, requireInstalledRuntimeAssets } from "./records-check.mjs";
import { loadQualifiedReservations, readRecord } from "./run-record.mjs";
import { validateQualifiedNative } from "./qualified-native.mjs";
import { operationContent } from "./operation-record.mjs";
/** @param {string} code @returns {never} */
function refuse(code) { throw Object.assign(new Error(code), { code }); }
/** @param {string[]} argv */
export async function main(argv) {
  try {
    if (argv.length !== 4 || argv[0] !== "--root" || argv[2] !== "--attempt" || !path.isAbsolute(argv[1] ?? "") || !/^T-\d+(?:-s\d+)?-a\d+$/.test(argv[3] ?? "")) refuse("configured-dispatch-check-usage");
    const root = realpathSync(/** @type {string} */ (argv[1])), attempt = /** @type {string} */ (argv[3]), tool = loadInstalledRecordTool();
    requireInstalledRuntimeAssets(tool, ["tools/e2e/scripts/configured-dispatch-check.mjs", "tools/e2e/scripts/configured-dispatch.mjs", "tools/e2e/scripts/qualified-native.mjs", "tools/e2e/scripts/run-record.mjs", "cli/configured-native-reader.mjs"]);
    await loadQualifiedReservations();
    const rec = readRecord(root, attempt), retained = rec.native?.qualified?.origins?.configuredDispatch;
    if (!validConfiguredDispatchCapsule(retained)) refuse("configured-dispatch-required");
    // This validator performs structural/retained checks; it never invokes
    // this helper or the effect phase policy, avoiding recursive reads.
    validateQualifiedNative(root, rec, false);
    const q = rec.assignment.qualified;
    const handle = captureConfiguredDispatch({ authorityRoot: root, projectId: q.projectId, revisions: q.revisions, taskId: q.taskId, legacyTokenMap: q.legacyTokenMap, tool });
    const context = configuredDispatchEffectContext(handle, rec.assignment);
    if (operationContent(context.capsule) !== operationContent(retained)) refuse("configured-dispatch-original-changed");
    const latest = readRecord(root, attempt);
    if (latest.permission.digest !== rec.permission.digest || operationContent(latest.native?.qualified?.origins) !== operationContent(rec.native?.qualified?.origins)) refuse("configured-dispatch-retained-changed");
    process.stdout.write(JSON.stringify({ status: "ready", capsuleDigest: retained.digest, permissionDigest: rec.permission.digest,
      toolManifestDigest: tool.manifestDigest, schema: context.schema }) + "\n"); return 0;
  } catch (error) {
    const code = /** @type {any} */ (error).code;
    process.stdout.write(JSON.stringify({ status: "refused", code: typeof code === "string" && /^[A-Za-z][A-Za-z0-9_-]*$/.test(code) ? code : "configured-dispatch-check-unavailable" }) + "\n"); return 3;
  }
}
if (isMain(import.meta)) process.exitCode = await main(process.argv.slice(2));
