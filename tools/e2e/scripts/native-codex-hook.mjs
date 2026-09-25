/**
 * Portable command-hook adapter for the T-315-s1 native bridge.
 *
 * Codex invokes project hooks with the parent session cwd. That cwd locates
 * the checkout holding T-311 records; it never selects a worker resource or
 * fence. `handleNativeEvent` routes by the callback's native agent identity.
 */

import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { findCheckoutRoot } from "../../../.claude/hooks/lane-fence.mjs";
import { handleNativeEvent } from "./native-codex.mjs";

/** @param {any} event @param {string} reason */
function blockingOutput(event, reason) {
  if (event?.hook_event_name === "PostToolUse") return { decision: "block", reason };
  if (event?.hook_event_name === "PreToolUse") {
    return {
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: reason,
      },
    };
  }
  return { systemMessage: reason };
}

export function main() {
  /** @type {any} */
  let event = null;
  try {
    event = JSON.parse(readFileSync(0, "utf8"));
    const root = findCheckoutRoot(process.cwd());
    if (typeof root !== "string") throw new Error("native-codex: hook cwd is not inside the checkout holding run records");
    const result = handleNativeEvent(root, event);
    if (result.output !== null) process.stdout.write(`${JSON.stringify(result.output)}\n`);
    return 0;
  } catch (error) {
    const reason = `NATIVE HOLD: hook authority or checker is unreadable: ${error instanceof Error ? error.message : String(error)}`;
    process.stdout.write(`${JSON.stringify(blockingOutput(event, reason))}\n`);
    return 0;
  }
}

const entry = process.argv[1];
if (entry !== undefined && import.meta.url === pathToFileURL(entry).href) process.exitCode = main();
