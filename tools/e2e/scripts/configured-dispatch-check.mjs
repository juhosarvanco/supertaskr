/** Fixed TOOL read-only check for retained configured effects. No lock,
 * transaction, child assignment, grant mutation or configurable program. */
import path from "node:path";
import { realpathSync } from "node:fs";
import { isMain } from "../../../cli/is-main.mjs";
import { captureConfiguredDispatchForRun, configuredDispatchSchema } from "./configured-dispatch.mjs";
import { loadInstalledRecordTool, requireInstalledRuntimeAssets } from "./records-check.mjs";
/** @param {string} code @returns {never} */
function refuse(code) { throw Object.assign(new Error(code), { code }); }
/** @param {string[]} argv */
export async function main(argv) {
  try {
    if (argv.length !== 4 || argv[0] !== "--root" || argv[2] !== "--attempt" || !path.isAbsolute(argv[1] ?? "") || !/^T-\d+(?:-s\d+)?-a\d+$/.test(argv[3] ?? "")) refuse("configured-dispatch-check-usage");
    const root = realpathSync(/** @type {string} */ (argv[1])), attempt = /** @type {string} */ (argv[3]), tool = loadInstalledRecordTool();
    requireInstalledRuntimeAssets(tool, ["tools/e2e/scripts/configured-dispatch-check.mjs", "tools/e2e/scripts/configured-dispatch.mjs", "tools/e2e/scripts/qualified-native.mjs", "tools/e2e/scripts/run-record.mjs", "cli/configured-native-reader.mjs"]);
    const { handle, source } = await captureConfiguredDispatchForRun(root, attempt, { tool });
    const schema = configuredDispatchSchema(handle);
    process.stdout.write(JSON.stringify({ status: "ready", capsuleDigest: source.capsuleDigest, permissionDigest: source.permissionDigest,
      toolManifestDigest: tool.manifestDigest, schema: { sha256: schema.sha256, text: schema.text } }) + "\n"); return 0;
  } catch (error) {
    const code = /** @type {any} */ (error).code;
    process.stdout.write(JSON.stringify({ status: "refused", code: typeof code === "string" && /^[A-Za-z][A-Za-z0-9_-]*$/.test(code) ? code : "configured-dispatch-check-unavailable" }) + "\n"); return 3;
  }
}
if (isMain(import.meta)) process.exitCode = await main(process.argv.slice(2));
