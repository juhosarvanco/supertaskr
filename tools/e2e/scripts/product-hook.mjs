/** Fixed installed optional-hook entry. A finite installer supplies --root
 * and this TOOL entry path. No hook/descriptor is installed by this module. */
import { readFileSync } from "node:fs";
import { isMain } from "../../../cli/is-main.mjs";
import { createConfiguredPushGuard, ANNOUNCED_ALLOW_CODES } from "../../../cli/push-guard.mjs";
import { createConfiguredPrePushGuard } from "../../../cli/pre-push-guard.mjs";

/** @param {string[]} argv */
export function main(argv) {
  const mode = argv[3];
  try {
    if (argv[0] !== "--root" || !argv[1] || argv[2] !== "--mode" || !["pre-tool", "pre-push"].includes(mode ?? "") ||
        mode === "pre-tool" && argv.length !== 4 || mode === "pre-push" && (argv.length !== 7 || argv[4] !== "--")) throw new Error("Expected --root <bound PRODUCT> --mode pre-tool, or --mode pre-push -- <remote> <URL>");
    const options = { productRoot: /** @type {string} */ (argv[1]) };
    let stdin = "", readable = true;
    try { stdin = readFileSync(0, "utf8"); } catch { readable = false; }
    /** @type {any} */ let decision;
    if (mode === "pre-tool") {
      /** @type {any} */ let payload;
      try { payload = JSON.parse(stdin); } catch { payload = {}; }
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) payload = {};
      decision = createConfiguredPushGuard(options).decide({
        ...(typeof payload.tool_name === "string" ? { toolName: payload.tool_name } : {}),
        ...(payload.tool_input && typeof payload.tool_input === "object" && !Array.isArray(payload.tool_input) ? { toolInput: payload.tool_input } : {}),
        cwd: typeof payload.cwd === "string" && payload.cwd ? payload.cwd : process.cwd(),
      });
    } else {
      decision = createConfiguredPrePushGuard(options).decide({ cwd: process.cwd(), stdin, stdinReadable: readable,
        remote: `${argv[5]} (${argv[6]})`,remoteName:/** @type {string} */(argv[5]),remoteUrl:/** @type {string} */(argv[6]) });
    }
    for (const notice of decision.notices ?? []) process.stderr.write(`${notice}\n`);
    if (decision.verdict === "block") { process.stderr.write(`${decision.code}: ${decision.reason}\n`); return mode === "pre-push" ? 1 : 2; }
    if (ANNOUNCED_ALLOW_CODES.includes(decision.code) || decision.code === "no-updates-proposed") process.stderr.write(`${decision.code}: ${decision.reason}\n`);
    return 0;
  } catch (error) {
    process.stderr.write(`hook-unavailable: ${error instanceof Error ? error.message : String(error)}\n`);
    return mode === "pre-push" ? 1 : 2;
  }
}
if (isMain(import.meta)) process.exitCode = main(process.argv.slice(2));
