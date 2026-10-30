/** Cold optional-hook policy reader. Only builtins and the pure token owner
 * load here; the fixed installed TOOL helper runs at token judgment time. */
import { spawnSync } from "node:child_process";
import { realpathSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validGateContext } from "./gate-token.mjs";
import {auditHookGitContext,captureOwnedPublicationHookEnvironment} from "./hook-git-context.mjs";

const POLICY_ENTRY = fileURLToPath(new URL("../tools/e2e/scripts/gate-policy.mjs", import.meta.url));
const PUBLICATION_ENTRY = fileURLToPath(new URL("../tools/e2e/scripts/qualified-publication-hook.mjs", import.meta.url));
/** @param {string} root @param {string} cwd @param {"pre-tool"|"pre-push"} mode */
function auditConfiguredHookContext(root,cwd,mode){return auditHookGitContext(root,cwd,mode,captureOwnedPublicationHookEnvironment(root,cwd,mode));}
/** @param {string} root */
export function configuredHeadRevision(root) {
  const result = spawnSync("git", ["-C", root, "rev-parse", "--verify", "HEAD^{commit}"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  const revision = result.stdout?.trim();
  return result.status === 0 && /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(revision ?? "") ? revision : undefined;
}
/** @param {string} code @param {string} detail @returns {{status:"refused",code:string,detail:string}} */
const refused = (code, detail) => ({ status: "refused", code, detail });
/** Git paths end in one protocol newline. Spaces belong to the path.
 * @param {string} cwd @param {string[]} argv */
function gitPath(cwd, argv, env=process.env) {
  const result = spawnSync("git", ["-C", cwd, "rev-parse", ...argv], { env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  if (result.error || result.status !== 0 || !result.stdout.endsWith("\n")) throw new Error("Git could not identify the selected checkout");
  return realpathSync(result.stdout.slice(0, -1));
}
/** @param {string} root */
function identity(root) {
  const state = statSync(root, { bigint: true });
  if (!state.isDirectory()) throw new Error("The selected Git directory is unavailable");
  return `${state.dev}:${state.ino}`;
}
/** @param {string} root @param {string} file */
function within(root, file) {
  const relative = path.relative(root, file);
  return relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}
/** Expected PRODUCT comes from a trusted installer/constructor, never stdin.
 * Scope includes linked worktrees sharing the exact physical Git common dir.
 * Capture is lazy so non-push hook calls do not need Git, a build or a TOOL.
 * @param {{productRoot:string}} options */
export function createConfiguredGateReader(options) {
  if (!options || Object.keys(options).join(",") !== "productRoot" || typeof options.productRoot !== "string" || !options.productRoot) throw new TypeError("A bound PRODUCT root is required");
  const expected = path.resolve(options.productRoot);
  /** @type {string|undefined} */
  let captured;
  /** @param {string} cwd @returns {{status:"refused",code:string,detail:string}|{status:"outside"}|{status:"selected",root:string}} */
  function scope(cwd) {
    try {
      const audited=auditConfiguredHookContext(expected,cwd,"pre-push");if(audited.status==="outside")return {status:"outside"};
      const env=audited.env;
      const root = realpathSync(expected), top = gitPath(root, ["--show-toplevel"],env), common = gitPath(root, ["--path-format=absolute", "--git-common-dir"],env), gitDir = gitPath(root, ["--absolute-git-dir"],env);
      if (top !== root) return refused("hook-product-root-invalid", "The bound PRODUCT must be the exact Git worktree root");
      const objects = realpathSync(path.join(common, "objects"));
      const now = { root, common, gitDir, objects, rootIdentity: identity(root), commonIdentity: identity(common), gitDirIdentity: identity(gitDir), objectIdentity: identity(objects) }, snapshot = JSON.stringify(now);
      if (captured !== undefined && captured !== snapshot) return refused("hook-product-origin-changed", "The bound PRODUCT repository incarnation changed");
      captured ??= snapshot;
      let actual;
      try { actual = gitPath(cwd, ["--show-toplevel"],env); }
      catch {
        const current = realpathSync(cwd);
        return within(root, current) ? refused("hook-product-scope-unavailable", "Git could not identify a checkout inside the bound PRODUCT") : { status: "outside" };
      }
      const actualCommon = gitPath(actual, ["--path-format=absolute", "--git-common-dir"],env);
      if (identity(actualCommon) !== now.commonIdentity) return { status: "outside" };
      if (identity(actual) !== now.rootIdentity) return refused("hook-related-worktree-unadapted", "This related worktree needs its original coordinator and paired authority; this hook stage supports the bound PRODUCT root only");
      return { status: "selected", root: actual };
    } catch (error) {
      return refused("hook-product-scope-unavailable", error instanceof Error ? error.message : String(error));
    }
  }
  /** Read only. An unavailable range requires the complete configured registry;
   * an unavailable configuration/TOOL never falls back to source CI.
   * @param {string} root @param {string} revision @param {string} [range] */
  function read(root, revision, range) {
    const selected = scope(root);
    if (selected.status !== "selected" || selected.root !== root) return selected.status === "refused" ? selected : refused("hook-product-outside", "This token does not belong to the bound PRODUCT family");
    try {
      const result = spawnSync(process.execPath, [POLICY_ENTRY, "--root", root, "--at", revision, ...(range === undefined ? [] : ["--range", range])], {
        cwd: root, env:auditConfiguredHookContext(expected,root,"pre-push").env, encoding: "utf8", timeout: 30_000, maxBuffer: 32 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"],
      });
      if (result.error || result.signal) return refused("hook-gate-policy-unavailable", result.error?.message ?? "The fixed TOOL helper did not finish");
      const value = JSON.parse(result.stdout);
      if (result.status !== 0) return refused(typeof value?.code === "string" ? value.code : "hook-gate-policy-unavailable", Array.isArray(value?.diagnostics) ? value.diagnostics.join("; ") : "The fixed TOOL helper refused");
      if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).some(key => !["status", "context", "owed", "rangeProblem", "privateCheck"].includes(key)) || value.status !== "ready" || !validGateContext(value.context)) throw new Error("The fixed TOOL helper returned an invalid requirement");
      const privateCheck = value.privateCheck;
      if (!privateCheck || Object.keys(privateCheck).sort().join(",") !== "details,recordsRevision,recordsRoot,status" || ![0, 1].includes(privateCheck.status) ||
          !Array.isArray(privateCheck.details) || privateCheck.details.some((/** @type {any} */ detail) => typeof detail !== "string") ||
          typeof privateCheck.recordsRoot !== "string" || !path.isAbsolute(privateCheck.recordsRoot) || !/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(privateCheck.recordsRevision)) throw new Error("The fixed TOOL helper omitted its committed private check");
      if (value.owed !== undefined && value.rangeProblem !== undefined) throw new Error("A range cannot be both derived and unavailable");
      if (value.rangeProblem !== undefined && (range === undefined || typeof value.rangeProblem !== "string" || !value.rangeProblem)) throw new Error("The range refusal is invalid");
      if (value.owed !== undefined) {
        const owed = value.owed;
        if (range === undefined || !owed || typeof owed !== "object" || Array.isArray(owed) || Object.keys(owed).some(key => !["suites", "e2e", "failClosed"].includes(key)) ||
            !Array.isArray(owed.suites) || new Set(owed.suites).size !== owed.suites.length || owed.suites.some((/** @type {any} */ id) => !value.context.required.includes(id)) ||
            !owed.e2e || Object.keys(owed.e2e).sort().join(",") !== "specs,whole" || typeof owed.e2e.whole !== "boolean" ||
            !Array.isArray(owed.e2e.specs) || owed.e2e.specs.some((/** @type {any} */ spec) => typeof spec !== "string" || !spec) || new Set(owed.e2e.specs).size !== owed.e2e.specs.length ||
            owed.failClosed !== undefined && typeof owed.failClosed !== "string") throw new Error("The fixed TOOL helper returned an invalid owed set");
        return { status: "ready", context: value.context, privateCheck, owed: { range, ...owed } };
      }
      if (range !== undefined && value.rangeProblem === undefined) throw new Error("The fixed TOOL helper omitted its range disposition");
      return { status: "ready", context: value.context, privateCheck, owedProblem: value.rangeProblem ?? "No push range is available; the whole configured registry is required" };
    } catch (error) {
      return refused("hook-gate-policy-unavailable", error instanceof Error ? error.message : String(error));
    }
  }
  /** Original paired publication authority is a separate fixed TOOL reader.
   * A normal route returns ordinary and follows every existing guard below.
   * @param {string} root @param {any} request */
  function publication(root,request){
    try{
      const audited=auditConfiguredHookContext(expected,root,request.mode);
      if(audited.status!=="selected"||audited.root!==root)return {verdict:"block",code:"hook-product-outside",reason:"The publication reader has no selected PRODUCT"};
      const result=spawnSync(process.execPath,[PUBLICATION_ENTRY,"--root",root,"--mode",request.mode],{cwd:root,env:audited.env,input:JSON.stringify(request),encoding:"utf8",timeout:60_000,maxBuffer:1024*1024,stdio:["pipe","pipe","pipe"]});
      if(result.error||result.signal||result.status!==0)throw new Error("The fixed publication reader did not finish");
      const value=JSON.parse(result.stdout);
      if(value?.status==="ordinary"&&Object.keys(value).join(",")==="status")return undefined;
      if(!value||Object.keys(value).sort().join(",")!=="code,reason,status,verdict"||value.status!=="decision"||!["allow","block"].includes(value.verdict)||typeof value.code!=="string"||typeof value.reason!=="string")throw new Error("The fixed publication reader returned invalid metadata");
      return {verdict:value.verdict,code:value.code,reason:value.reason};
    }catch(error){return {verdict:"block",code:/** @type {any} */(error)?.code??"hook-publication-unavailable",reason:error instanceof Error?error.message:String(error)};}
  }
  return Object.freeze({ scope, read, publication });
}
