/**
 * INSTALLING THE PRE-PUSH GUARD (T-314) — the arm's half.
 *
 * The guard in `pre-push-guard.mjs` only runs if git has been told to run
 * it. This module is what tells git: it derives where this checkout's
 * hooks actually live, decides whether `core.hooksPath` can be pointed at
 * the tracked hooks directory without changing anything that is not this
 * checkout's, and performs it. `brief.mjs --take-seat` is the caller —
 * the seat is the one moment a session declares it is acting in an
 * integration checkout, which is exactly the population this hook is for.
 *
 * ── NOTHING HERE ASSUMES WHERE A CHECKOUT'S HOOKS ARE ────────────────
 * A LINKED WORKTREE'S HOOKS ARE NOT IN ITS OWN GIT DIRECTORY. `hooks` is
 * not on git's per-worktree path list, so `$GIT_DIR/hooks` resolves to
 * the COMMON directory and every worktree of a repository shares one
 * hooks directory and one `core.hooksPath` unless something scopes it.
 * A reader that assumed otherwise would report a linked worktree as
 * hook-free while the whole repository shared a live `pre-commit`, and
 * would then point `core.hooksPath` elsewhere and silently retire it.
 * So the location is asked of git — `rev-parse --git-path hooks` — and
 * the configuration is read WITH ITS SCOPE, never as a bare value.
 *
 * ── AND THE ROUTING OF OTHER WORKTREES IS PRESERVED, BY SCOPE ────────
 * `core.hooksPath` written at LOCAL scope is read by every worktree of
 * the repository. In a repository with lanes live that is not this
 * checkout's configuration to change, so the installer writes at
 * WORKTREE scope wherever `extensions.worktreeConfig` is already on, and
 * refuses BY NAME where turning it on would be the only way through.
 * Turning it on is a change to the SHARED configuration and it is not a
 * neutral one — git's own documentation requires `core.bare` and
 * `core.worktree` to be moved into the main worktree's own file when it
 * is enabled — so it is refused unless the caller says it was authorized,
 * and the refusal names the setting rather than describing it.
 *
 * ── A REFUSAL CHANGES NOTHING, AND THAT INCLUDES THE SEAT ────────────
 * Every refusal below is reached BEFORE anything is written: no git
 * configuration, no index operation, and — because the caller performs
 * this arm first — no holder record either. That ordering is the
 * amendment's, and it is the difference between a checkout that is
 * unguarded and knows it and a checkout that recorded a seat on the
 * strength of a guard that was never installed.
 *
 * ── THE MODE IS THE ARM'S TO SET AND THE INDEX IS NOT ITS TO TOUCH ───
 * The hook file is committed executable, so an ordinary checkout already
 * carries mode 755 and this arm has nothing to do. Where it does not —
 * a tree written by a tool that dropped the bit, a filesystem that lost
 * it — the arm sets it on the WORKING TREE FILE through its own process
 * and never through the index: `git update-index --chmod=+x` would stage
 * something, and an arm that stages is an arm that can carry a seat's
 * unrelated work into a commit. It stages nothing and preserves whatever
 * it finds staged.
 */

import { spawnSync } from "node:child_process";
import { chmodSync, readdirSync, realpathSync, statSync } from "node:fs";
import path from "node:path";
import { HOOK_DIR_REL_PATH, HOOK_FILE_NAME } from "./pre-push-guard.mjs";

/** The configuration key git reads to find a repository's hooks. */
export const HOOKS_PATH_KEY = "core.hooksPath";

/** The configuration key that makes a per-worktree config file live. */
export const WORKTREE_CONFIG_KEY = "extensions.worktreeConfig";

/**
 * EVERY NAME GIT TREATS AS A HOOK.
 *
 * Held here as a LIST because the question it answers is a negative one:
 * which files in the tracked hooks directory would become live the moment
 * `core.hooksPath` points at it. `pre-push` is this project's own and is
 * excluded by the caller, not by this constant — a constant that already
 * knew the answer could not be used to ask the question.
 *
 * From githooks(5). A name git adds later is a name this list does not
 * carry, which is a stated residual: the refusal it powers is a courtesy
 * to a repository that has other hooks, and its failure mode is that a
 * hook nobody in this project writes goes unmentioned.
 */
export const GIT_HOOK_NAMES = Object.freeze([
  "applypatch-msg",
  "pre-applypatch",
  "post-applypatch",
  "pre-commit",
  "pre-merge-commit",
  "prepare-commit-msg",
  "commit-msg",
  "post-commit",
  "pre-rebase",
  "post-checkout",
  "post-merge",
  "pre-push",
  "pre-receive",
  "update",
  "proc-receive",
  "post-receive",
  "post-update",
  "reference-transaction",
  "push-to-checkout",
  "pre-auto-gc",
  "post-rewrite",
  "sendemail-validate",
  "fsmonitor-watchman",
  "p4-changelist",
  "p4-prepare-changelist",
  "p4-post-changelist",
  "p4-pre-submit",
  "post-index-change",
]);

/** The suffix git's own shipped examples carry, which are never live. */
export const SAMPLE_SUFFIX = ".sample";

/**
 * @typedef {object} Ran
 * @property {number | null} status
 * @property {string} stdout
 * @property {string} stderr
 * @property {string} [problem]
 */

/**
 * Run git in `root`.
 *
 * @param {string} root
 * @param {string[]} argv
 * @returns {Ran}
 */
export function runGit(root, argv) {
  /** @type {ReturnType<typeof spawnSync>} */
  let out;
  try {
    out = spawnSync("git", ["-C", root, ...argv], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 8 * 1024 * 1024,
    });
  } catch (err) {
    return {
      status: null,
      stdout: "",
      stderr: "",
      problem: `git could not be started (${err instanceof Error ? err.message : String(err)})`,
    };
  }
  if (out.error !== undefined && out.error !== null) {
    return { status: null, stdout: "", stderr: "", problem: `git could not be started (${out.error.message})` };
  }
  return {
    status: out.status,
    stdout: String(out.stdout ?? ""),
    stderr: String(out.stderr ?? ""),
  };
}

/** The real path of `p`, or `p` resolved, when it cannot be realpathed.
 * @param {string} p @returns {string} */
function real(p) {
  try {
    return realpathSync(p);
  } catch {
    return path.resolve(p);
  }
}

/** Is `p` a file this process could execute? @param {string} p @returns {boolean} */
function executable(p) {
  try {
    return (statSync(p).mode & 0o111) !== 0;
  } catch {
    return false;
  }
}

/** Does `p` exist at all? @param {string} p @returns {boolean} */
function present(p) {
  try {
    statSync(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * @typedef {object} HookSite
 * @property {string} toplevel       the checkout's own working-tree root
 * @property {string} hookDir        the tracked hooks directory, absolute
 * @property {string} hookFile       the `pre-push` file inside it
 * @property {string} activeHooksDir where git looks for hooks with no override
 * @property {string} [configured]   the `core.hooksPath` value, when set
 * @property {string} [configuredScope] the scope it was set at
 * @property {boolean} worktreeConfig whether per-worktree config is live
 * @property {number} worktrees      how many worktrees this repository has
 */

/**
 * Where this checkout's hooks live, and what is configured, asked of git.
 *
 * @param {string} root
 * @param {typeof runGit} [git]
 * @returns {{ site: HookSite } | { problem: string }}
 */
export function hookSite(root, git = runGit) {
  const top = git(root, ["rev-parse", "--show-toplevel"]);
  if (top.status !== 0 || top.stdout.trim() === "") {
    return { problem: top.problem ?? `\`git rev-parse --show-toplevel\` failed in ${root} (${top.stderr.trim()})` };
  }
  const toplevel = top.stdout.trim();
  const active = git(root, ["rev-parse", "--git-path", "hooks"]);
  if (active.status !== 0 || active.stdout.trim() === "") {
    return { problem: active.problem ?? `\`git rev-parse --git-path hooks\` failed (${active.stderr.trim()})` };
  }
  // `--git-path` answers relative to the checkout when git was invoked
  // inside it, which is what `-C root` did — so it is resolved against
  // that same directory and never against this process's cwd.
  const activeHooksDir = path.resolve(root, active.stdout.trim());

  // THE VALUE AND ITS SCOPE IN ONE READING. A value without its scope
  // cannot tell a local override from one this checkout inherited from
  // the machine's global configuration, and the refusal has to name
  // WHERE the seat should go to look.
  const read = git(root, ["config", "--show-scope", "--get", HOOKS_PATH_KEY]);
  /** @type {{ configured: string, configuredScope: string } | Record<string, never>} */
  let where = {};
  if (read.status === 0) {
    const line = read.stdout.split("\n").find((l) => l.trim() !== "") ?? "";
    const tab = line.indexOf("\t");
    where = {
      configuredScope: tab === -1 ? "unknown" : line.slice(0, tab).trim(),
      configured: (tab === -1 ? line : line.slice(tab + 1)).trim(),
    };
  } else if (read.status !== 1) {
    // Exit 1 is `not set`, which is the ordinary case. Anything else is
    // git failing to answer, and an unanswered configuration question
    // must not read as "unset".
    return {
      problem:
        read.problem ??
        `\`git config --get ${HOOKS_PATH_KEY}\` exited ${String(read.status)} (${read.stderr.trim()})`,
    };
  }

  const wt = git(root, ["config", "--get", WORKTREE_CONFIG_KEY]);
  const worktreeConfig = wt.status === 0 && /^true$/i.test(wt.stdout.trim());
  const list = git(root, ["worktree", "list", "--porcelain"]);
  const worktrees =
    list.status === 0 ? list.stdout.split("\n").filter((l) => l.startsWith("worktree ")).length : 0;

  return {
    site: {
      toplevel,
      hookDir: path.join(toplevel, HOOK_DIR_REL_PATH),
      hookFile: path.join(toplevel, HOOK_DIR_REL_PATH, HOOK_FILE_NAME),
      activeHooksDir,
      ...where,
      worktreeConfig,
      worktrees,
    },
  };
}

/**
 * Is `configured` this checkout's own tracked hooks directory?
 *
 * A RELATIVE `core.hooksPath` IS RESOLVED THE WAY GIT RESOLVES IT — git
 * runs hooks from the top level of the working tree, so a relative value
 * is relative to THAT and not to whatever directory a reader happens to
 * sit in.
 *
 * @param {HookSite} site
 * @returns {boolean}
 */
export function pathIsOurs(site) {
  if (site.configured === undefined) return false;
  const resolved = path.isAbsolute(site.configured)
    ? site.configured
    : path.resolve(site.toplevel, site.configured);
  return real(resolved) === real(site.hookDir);
}

/**
 * The non-sample files in the hooks directory an unset `core.hooksPath`
 * makes live.
 *
 * @param {string} dir
 * @returns {string[]}
 */
export function activeHooks(dir) {
  /** @type {string[]} */
  let names;
  try {
    names = readdirSync(dir);
  } catch {
    return [];
  }
  return names.filter((n) => !n.endsWith(SAMPLE_SUFFIX) && present(path.join(dir, n))).sort();
}

/**
 * Git-hook-named files in the tracked hooks directory OTHER than ours.
 *
 * Pointing `core.hooksPath` at a directory makes EVERY git hook name in
 * it live at once, so a file called `post-checkout` that nobody meant as
 * a hook would start running at every checkout the moment this arm
 * succeeded.
 *
 * @param {string} dir
 * @returns {string[]}
 */
export function foreignHookNames(dir) {
  /** @type {string[]} */
  let names;
  try {
    names = readdirSync(dir);
  } catch {
    return [];
  }
  return names.filter((n) => n !== HOOK_FILE_NAME && GIT_HOOK_NAMES.includes(n)).sort();
}

/**
 * @typedef {object} Plan
 * @property {"install" | "already-installed" | "nothing-to-install" | "refuse"} action
 * @property {string} code
 * @property {string} detail
 * @property {HookSite} [site]
 * @property {"local" | "worktree"} [scope]  where the value would be written
 * @property {string} [value]                what would be written
 * @property {boolean} [enableWorktreeConfig] whether the shared switch is owed
 * @property {boolean} [chmod]               whether the mode must be set
 */

/**
 * What installing the hook in `root` would take, and whether it can be
 * done without changing anything that is not this checkout's.
 *
 * NOTHING IS WRITTEN HERE. The split is deliberate: a caller can print
 * this plan, refuse on it, or perform it, and the refusals are testable
 * without a repository ever being modified.
 *
 * @param {object} input
 * @param {string} input.root
 * @param {boolean} [input.authorizeSharedConfig]
 * @param {typeof runGit} [input.git]
 * @returns {Plan}
 */
export function hookInstallPlan({ root, authorizeSharedConfig = false, git = runGit }) {
  const read = hookSite(root, git);
  if ("problem" in read) {
    return {
      action: "refuse",
      code: "hook-site-underivable",
      detail:
        `where this checkout's hooks live could not be derived from git (${read.problem}), and a ` +
        "hooks path written on a guess would point at a directory nobody established",
    };
  }
  const site = read.site;

  // THE FILE FIRST — AND ITS ABSENCE IS NOT A REFUSAL. A checkout that
  // does not carry the hook has nothing to install and nothing to be
  // refused about: it is simply UNGUARDED, which is exactly what the
  // card asks the seat verbs to REPORT. Refusing here would make the
  // seat unobtainable in every checkout older than this card — including
  // the ones a seat most needs to be able to take in order to update
  // them — and a guard whose arrival makes the tooling unusable is a
  // guard somebody reverts.
  if (!present(site.hookFile)) {
    return {
      action: "nothing-to-install",
      code: "hook-file-absent",
      site,
      detail:
        `${HOOK_DIR_REL_PATH}/${HOOK_FILE_NAME} is not in this checkout, so there is no guard to ` +
        "install and nothing configured would run one — this checkout is UNGUARDED, and updating " +
        "it to a tree that carries the hook is what closes that",
    };
  }

  // ALREADY OURS IS NOT AN INSTALL, and it is asked before the two
  // refusals below: a checkout this arm has already pointed at its own
  // hooks must not then be refused for the foreign names or the active
  // hooks it was pointed past on the run that succeeded.
  if (pathIsOurs(site)) {
    return {
      action: executable(site.hookFile) ? "already-installed" : "install",
      code: executable(site.hookFile) ? "hook-already-installed" : "hook-mode-owed",
      site,
      scope: site.configuredScope === "worktree" ? "worktree" : "local",
      value: /** @type {string} */ (site.configured),
      chmod: !executable(site.hookFile),
      detail:
        `${HOOKS_PATH_KEY} already points at this checkout's ${HOOK_DIR_REL_PATH} ` +
        `(${String(site.configured)}, set at ${String(site.configuredScope)} scope)` +
        (executable(site.hookFile) ? "" : `, and ${HOOK_FILE_NAME} is not executable`),
    };
  }

  if (site.configured !== undefined) {
    return {
      action: "refuse",
      code: "hooks-path-elsewhere",
      site,
      detail:
        `${HOOKS_PATH_KEY} is already set to ${JSON.stringify(site.configured)} at ` +
        `${String(site.configuredScope)} scope, which is not this checkout's ${HOOK_DIR_REL_PATH}. ` +
        "Repointing it would silently retire whatever that directory holds, so nothing was " +
        "changed — resolve it there and take the seat again",
    };
  }

  const live = activeHooks(site.activeHooksDir);
  if (live.length > 0) {
    return {
      action: "refuse",
      code: "active-hooks-present",
      site,
      detail:
        `this repository's hooks directory ${site.activeHooksDir} already holds live hook(s) — ` +
        `${live.join(", ")} — and an unset ${HOOKS_PATH_KEY} is what makes them live. Pointing ` +
        "the path elsewhere would deactivate every one of them without saying so, so nothing was " +
        "changed",
    };
  }

  const foreign = foreignHookNames(site.hookDir);
  if (foreign.length > 0) {
    return {
      action: "refuse",
      code: "foreign-hook-names",
      site,
      detail:
        `${HOOK_DIR_REL_PATH} carries file(s) with git hook names other than ${HOOK_FILE_NAME} — ` +
        `${foreign.join(", ")} — and pointing ${HOOKS_PATH_KEY} at that directory would make every ` +
        "one of them live at once. Nothing was changed",
    };
  }

  // ── WHICH SCOPE, AND THE ONE THAT IS NOT THIS CHECKOUT'S TO PICK ──
  // WORKTREE scope is read by this worktree alone, so it is the only
  // scope that can be written in a repository with lanes live without
  // changing their routing. LOCAL scope is read by every worktree — safe
  // exactly when there is only one.
  if (site.worktreeConfig) {
    return {
      action: "install",
      code: "hook-installable-worktree",
      site,
      scope: "worktree",
      value: site.hookDir,
      chmod: !executable(site.hookFile),
      detail:
        `${WORKTREE_CONFIG_KEY} is already on, so ${HOOKS_PATH_KEY} can be written at WORKTREE ` +
        `scope and read by this checkout alone — the other ${String(Math.max(site.worktrees - 1, 0))} ` +
        "worktree(s) keep the routing they have",
    };
  }
  if (site.worktrees <= 1) {
    return {
      action: "install",
      code: "hook-installable-local",
      site,
      scope: "local",
      value: site.hookDir,
      chmod: !executable(site.hookFile),
      detail:
        `this repository has one worktree, so ${HOOKS_PATH_KEY} at LOCAL scope routes nothing but ` +
        "this checkout",
    };
  }
  if (!authorizeSharedConfig) {
    return {
      action: "refuse",
      code: "shared-config-change-needed",
      site,
      enableWorktreeConfig: true,
      detail:
        `this repository has ${String(site.worktrees)} worktrees and ${WORKTREE_CONFIG_KEY} is off, ` +
        `so the only way to set ${HOOKS_PATH_KEY} here is at LOCAL scope — which every one of those ` +
        `worktrees would read — or by turning ${WORKTREE_CONFIG_KEY} on, which is a change to the ` +
        "SHARED configuration and requires core.bare and core.worktree to be moved into the main " +
        "worktree's own config file. Neither is this checkout's to make unauthorized: nothing was " +
        "changed, no seat was recorded, and this checkout is UNGUARDED",
    };
  }
  return {
    action: "install",
    code: "hook-installable-authorized",
    site,
    scope: "worktree",
    value: site.hookDir,
    enableWorktreeConfig: true,
    chmod: !executable(site.hookFile),
    detail:
      `${WORKTREE_CONFIG_KEY} will be turned ON — a SHARED configuration change, authorized by the ` +
      `caller — so that ${HOOKS_PATH_KEY} can then be written at WORKTREE scope and the other ` +
      `${String(Math.max(site.worktrees - 1, 0))} worktree(s) keep the routing they have`,
  };
}

/**
 * @typedef {object} Installed
 * @property {"installed" | "already-installed" | "unguarded" | "refused"} state
 * @property {string} code
 * @property {string} detail
 * @property {string} [scope]
 * @property {string} [value]
 * @property {boolean} [modeSet]
 */

/**
 * Perform the plan.
 *
 * THE ORDER IS MODE THEN CONFIGURATION, and it matters: a `core.hooksPath`
 * pointing at a file git cannot execute is a hook git reports as an error
 * at every push, which is worse than no hook at all. A mode that could
 * not be set therefore refuses BEFORE anything is configured.
 *
 * @param {object} input
 * @param {string} input.root
 * @param {boolean} [input.authorizeSharedConfig]
 * @param {typeof runGit} [input.git]
 * @param {(p: string, mode: number) => void} [input.chmod]
 * @returns {Installed}
 */
export function installHook({ root, authorizeSharedConfig = false, git = runGit, chmod = chmodSync }) {
  const plan = hookInstallPlan({ root, authorizeSharedConfig, git });
  if (plan.action === "refuse") {
    return { state: "refused", code: plan.code, detail: plan.detail };
  }
  if (plan.action === "nothing-to-install") {
    return { state: "unguarded", code: plan.code, detail: plan.detail };
  }
  const site = /** @type {HookSite} */ (plan.site);
  let modeSet = false;
  if (plan.chmod === true) {
    try {
      const mode = statSync(site.hookFile).mode;
      chmod(site.hookFile, mode | 0o111);
      modeSet = true;
    } catch (err) {
      return {
        state: "refused",
        code: "hook-mode-unsettable",
        detail:
          `${HOOK_DIR_REL_PATH}/${HOOK_FILE_NAME} is not executable and its mode could not be set ` +
          `(${err instanceof Error ? err.message : String(err)}). Nothing was configured: a hooks ` +
          "path pointing at a file git cannot execute reds every push with an error about the " +
          "hook rather than about the tree",
      };
    }
    if (!executable(site.hookFile)) {
      return {
        state: "refused",
        code: "hook-mode-unsettable",
        detail:
          `${HOOK_DIR_REL_PATH}/${HOOK_FILE_NAME} is still not executable after its mode was set, ` +
          "so nothing was configured",
      };
    }
  }
  if (plan.action === "already-installed") {
    return {
      state: "already-installed",
      code: plan.code,
      detail: plan.detail,
      ...(plan.scope === undefined ? {} : { scope: plan.scope }),
      ...(plan.value === undefined ? {} : { value: plan.value }),
      modeSet,
    };
  }
  if (plan.enableWorktreeConfig === true && !site.worktreeConfig) {
    const on = git(root, ["config", "--local", WORKTREE_CONFIG_KEY, "true"]);
    if (on.status !== 0) {
      return {
        state: "refused",
        code: "worktree-config-unsettable",
        detail:
          `${WORKTREE_CONFIG_KEY} could not be turned on (${on.problem ?? on.stderr.trim()}), so ` +
          `${HOOKS_PATH_KEY} was not written either and nothing was changed`,
      };
    }
  }
  const scope = plan.scope === "worktree" ? "--worktree" : "--local";
  const wrote = git(root, ["config", scope, HOOKS_PATH_KEY, /** @type {string} */ (plan.value)]);
  if (wrote.status !== 0) {
    return {
      state: "refused",
      code: "hooks-path-unwritable",
      detail: `\`git config ${scope} ${HOOKS_PATH_KEY}\` failed (${wrote.problem ?? wrote.stderr.trim()})`,
    };
  }
  return {
    state: "installed",
    code: plan.code,
    detail: plan.detail,
    scope: /** @type {string} */ (plan.scope),
    value: /** @type {string} */ (plan.value),
    modeSet,
  };
}

/**
 * @typedef {object} Guarded
 * @property {boolean} guarded
 * @property {string} detail
 * @property {string} [configured]
 * @property {string} [scope]
 */

/**
 * Is this checkout's pre-push guard actually live?
 *
 * THREE THINGS HAVE TO BE TRUE AT ONCE and a reader that checked one of
 * them would report a guarded checkout that is not: the hook file has to
 * be there, git has to be pointed at it, and git has to be able to
 * execute it. The seat verbs print this whatever they then do, because a
 * checkout without the hook is UNGUARDED and that is news at the one
 * moment a session is declaring it works there.
 *
 * @param {string} root
 * @param {typeof runGit} [git]
 * @returns {Guarded}
 */
export function hookStatus(root, git = runGit) {
  const read = hookSite(root, git);
  if ("problem" in read) {
    return { guarded: false, detail: `UNGUARDED — this checkout's hook site could not be derived (${read.problem})` };
  }
  const site = read.site;
  const stamp = {
    ...(site.configured === undefined ? {} : { configured: site.configured }),
    ...(site.configuredScope === undefined ? {} : { scope: site.configuredScope }),
  };
  if (!executable(site.hookFile)) {
    return {
      guarded: false,
      ...stamp,
      detail: `UNGUARDED — this checkout carries no ${HOOK_DIR_REL_PATH}/${HOOK_FILE_NAME}`,
    };
  }
  if (!pathIsOurs(site)) {
    return {
      guarded: false,
      ...stamp,
      detail:
        `UNGUARDED — ${HOOKS_PATH_KEY} ` +
        (site.configured === undefined
          ? `is unset, so git runs ${site.activeHooksDir} and this checkout's pre-push guard never runs`
          : `is ${JSON.stringify(site.configured)} at ${String(site.configuredScope)} scope, which is not this checkout's ${HOOK_DIR_REL_PATH}`),
    };
  }
  if (!executable(site.hookFile)) {
    return {
      guarded: false,
      ...stamp,
      detail: `UNGUARDED — ${HOOK_DIR_REL_PATH}/${HOOK_FILE_NAME} is not executable, so git cannot run it`,
    };
  }
  return {
    guarded: true,
    ...stamp,
    detail: `guarded — git runs ${HOOK_DIR_REL_PATH}/${HOOK_FILE_NAME} at every push from this checkout`,
  };
}
