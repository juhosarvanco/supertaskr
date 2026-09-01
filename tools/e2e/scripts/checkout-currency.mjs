#!/usr/bin/env node
/**
 * THE STALE-CHECKOUT CATCHER (T-216-s1) — the guard that runs WHERE THE
 * GUARD IS NOT.
 *
 * ── WHAT IT IS FOR ───────────────────────────────────────────────────
 * `.claude/settings.json` registers this project's `PreToolUse` hooks
 * PER CHECKOUT, and the harness loads the copy belonging to the checkout
 * the SESSION was started in. A session started in a stale checkout
 * therefore runs a stale registration — or none. The measured instance
 * (T-216's card, the integration seat on 2026-09-01, hours after `T-203`
 * landed the push gate): a session worktree hundreds of commits behind
 * whose `settings.json` registered only the `Edit|Write|NotebookEdit`
 * matcher and which carried no `push-guard-hook.mjs` at all. **Every
 * push that sitting was ungated**, and nothing said so.
 *
 * ── "REGISTERED" IS NOT A PROXY FOR "RUNS": TWO ARMS, NOT ONE ────────
 * There are TWO ways a checkout fails to consult the guard, and from
 * outside they are indistinguishable:
 *
 *     A. no Bash matcher registered at all      -> nothing is invoked
 *     B. matcher registered, hook FILE absent   -> node starts, exits 1
 *
 * Measured at this project's integration seat, `CLAUDE_PROJECT_DIR`
 * resolving correctly and only the `.mjs` missing — ONE fault, not two:
 * `exit = 1`, `cannot find module` on stderr. **THE PORTABLE HALF IS THE
 * EXIT CODE: 1 is not 2, so the harness does not block, and that holds
 * whatever the path, platform or node version.** The stderr byte count is
 * NOT portable and is deliberately not quoted here — two seats measured
 * two different numbers and both were right, because the message carries
 * the path. **A byte count carries its path the way a figure carries its
 * ref.** So arm B FAILS OPEN while looking fully configured, and a
 * catcher that read `.claude/settings.json` and found the registration
 * present would pass a checkout in arm B — the arm that survives an
 * inspection of the registration.
 *
 * `registrationArm` therefore answers BOTH: the `registration-missing`
 * finding is arm A and the `hook-absent` finding is arm B, and arm B is
 * checked by walking the REFERENCE's script list against the target's
 * DISK. The measured motivating instance is arm A; arm B is the one that
 * would otherwise be invisible.
 *
 * ── WHY IT CANNOT LIVE IN THE GUARD ──────────────────────────────────
 * A STALE guard runs, so it could announce itself. An ABSENT guard runs
 * nothing, and ABSENT is the half that was measured. Any announcement
 * added to `push-guard.mjs` is emitted only by the checkouts that
 * already carry it — exactly the checkouts that do not need it. So the
 * catcher is a PROGRAM RUN FROM A CURRENT VANTAGE that reads the
 * session's checkout as DATA. It needs no cooperation from the checkout
 * it judges: no hook installed there, no script present there, no
 * process started there. That is the whole shape of it.
 *
 * ── THE VANTAGE IS THIS FILE'S OWN CHECKOUT, NOT THE CURRENT DIRECTORY
 * `defaultVantage()` resolves against `import.meta.url`. A vantage taken
 * from `process.cwd()` would be whatever directory the shell happens to
 * sit in, which in this project's own dispatch shape is frequently the
 * stale side. The TARGET is `sessionCheckout()` — read that function for
 * the two signals it derives it from, and for the rejection that put it
 * there. When vantage and target resolve to one checkout the render says
 * so out loud: a checkout judging itself has answered a weaker question
 * than it looks like it answered.
 *
 * ── AND ONE CHECKOUT IS NOT THE WHOLE QUESTION: `sweep` IS ────────────
 * Every way of naming *the session's own checkout* can be wrong — an
 * environment variable a shell does not carry, a working directory the
 * seat moved, a flag nobody passed. `sweep` asks the question that needs
 * none of them: **which checkouts of this repository, on this machine,
 * load stale guards?** It reads git's own worktree administration, so
 * the session's checkout is in the answer by construction. That is the
 * construction this project's own rule prefers to a check.
 *
 * ── REACHABILITY IS NOT THE QUESTION, AND THAT IS MEASURED ───────────
 * From T-216-s1's card, at `06ca1c5`:
 *
 *     git merge-base --is-ancestor 4ec229c main   -> YES, ancestor
 *     git rev-list --count 4ec229c..main          -> 344
 *
 * **The motivating checkout PASSES an ancestry test against the tip.**
 * Being an ancestor of the integration tip is the DEFINITION of a stale
 * checkout, not a defect it has, so a catcher resting on *"is this HEAD
 * reachable from the tip?"* would answer FINE for the exact session whose
 * pushes went ungated all sitting. None of the three arms below asks it.
 * `guardSurfaceArm` asks the OPPOSITE containment over a DIFFERENT
 * commit — is the newest integration commit that touched the guard
 * surface contained in the TARGET's HEAD — which refuses that instance
 * and, unlike a raw commit distance, does not refuse a lane that is
 * merely a few commits behind on files no guard is made of.
 *
 * ── THE STALE-CLONE LIMIT, STATED HERE AND PRINTED AT EVERY RUN ──────
 * See `STALE_CLONE_LIMIT`. Every reference value this tool uses — the
 * integration tip, the reference registration, the guard-surface commit
 * — is read from the VANTAGE's refs. A WORKTREE shares its refs with the
 * repository it was cut from, so a query made from one consults the real
 * integration branch even when that worktree's own HEAD is ancient. A
 * stale CLONE does not: its `main` is its own stale copy, and this tool
 * run from one reports that clone's idea of current, which is the guard
 * asking the stale thing whether it is stale. The tool cannot repair
 * that from the inside, so it MEASURES the condition (`sharedRefs`) and
 * SAYS it, rather than inheriting it silently.
 *
 * ── MODES (the house exit contract) ──────────────────────────────────
 *   node tools/e2e/scripts/checkout-currency.mjs
 *   node tools/e2e/scripts/checkout-currency.mjs --checkout <path>
 *        [--vantage <path>] [--integration-ref <ref>] [--json]
 *
 *   0 CURRENT · 1 the catcher has a VERDICT (stale) · 2 called wrong ·
 *   3 the catcher COULD NOT RUN, or could not ask one of its questions.
 *
 * **THREE VERDICTS, NEVER TWO.** A question that could not be asked is
 * recorded as `unanswered` and exits 3 — it is never rounded down to
 * CURRENT. A catcher that answers "fine" when it means "I do not know"
 * is worse than one that refuses (`method/lane-protocol.md` rule 5,
 * applied to a different comparison).
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * The house exit contract — the SINGLE authority for these numbers, the
 * shape `docs-gate.mjs` and `index --check` already carry. Nothing else
 * in this file, and no npm script pointing at it, re-types one.
 */
export const EXIT = Object.freeze({ CLEAN: 0, FOUND: 1, USAGE: 2, CANNOT_RUN: 3 });

/** Where a checkout's hook registration lives, relative to its root. */
export const SETTINGS_REL_PATH = ".claude/settings.json";

/**
 * THE GUARD SURFACE — the paths whose currency decides whether a
 * checkout's guards are the ones the integration branch registers.
 *
 * It is `.claude` and deliberately not the transitive closure of what a
 * hook SPAWNS. `push-guard.mjs` resolves `tools/e2e/scripts/
 * push-checks.mjs` against its own URL, so a stale checkout's cheap
 * checks are stale too — and that closure is not derivable without
 * running the hooks, which is exactly what a catcher for an ABSENT guard
 * may not depend on. `.claude` is where REGISTRATION lives, it is what
 * the measured instance was missing, and a surface that can be read off
 * disk is worth more here than one that has to be executed. Stated
 * rather than left to be discovered.
 */
export const GUARD_SURFACE = Object.freeze([".claude"]);

/** The default integration branch this project's CONVENTIONS spells. */
export const DEFAULT_INTEGRATION_REF = "main";

/**
 * THE LIMIT, IN ONE SENTENCE, EXPORTED SO IT CANNOT DRIFT FROM THE
 * ARTIFACT THAT OWES IT (T-216-s1's third criterion).
 *
 * The card requires that where an ancestry query is used, this limit is
 * stated IN THE ARTIFACT and not only on the card. It is a constant
 * rather than a comment because a comment is not assertable, and this
 * file's keeper asserts that the render prints it.
 */
export const STALE_CLONE_LIMIT =
  "STALE-CLONE LIMIT: every reference value above was read from the VANTAGE's refs. " +
  "A worktree SHARES refs with the repository it was cut from, so this comparison is " +
  "against the real integration branch even when the judged checkout's HEAD is ancient. " +
  "A stale CLONE does not share refs: run from one, this tool consults that clone's own " +
  "stale `main` and reports its idea of current — the guard asking the stale thing whether " +
  "it is stale. Fetch first and pass --integration-ref origin/main, or run it from a " +
  "checkout that shares refs with the integration branch.";

/**
 * @typedef {object} Finding
 * @property {string} code    a stable, greppable name for WHY
 * @property {string} detail  the sentence the reader acts on
 */

/**
 * @typedef {object} Decision
 * @property {"current" | "stale" | "unknown"} verdict
 * @property {Finding[]} findings    refusals — each one a reason this checkout is stale
 * @property {Finding[]} unanswered  questions this run could not ask
 * @property {Record<string, string | number | boolean | null>} figures
 */

/**
 * @typedef {object} Registration
 * @property {string} event     the hook event, e.g. `PreToolUse`
 * @property {string} matcher   the harness's tool-name matcher, verbatim
 * @property {string} command   the command line, verbatim
 * @property {string[]} scripts repository-relative script paths the command names
 */

// ── reading a registration ─────────────────────────────────────────────

/**
 * Repository-relative script paths a hook command names.
 *
 * This project spells every hook as
 * `node "${CLAUDE_PROJECT_DIR:-.}/.claude/hooks/<name>.mjs"`, so the
 * path is the segment after the interpolation. A command naming no
 * recognisable script yields the empty list, which the presence arm then
 * has nothing to check — an honest omission rather than a guess, and the
 * registration arm still compares the command itself.
 *
 * @param {string} command
 * @returns {string[]}
 */
export function hookScriptsIn(command) {
  /** @type {string[]} */
  const found = [];
  for (const m of command.matchAll(/\$\{CLAUDE_PROJECT_DIR[^}]*\}\/([^"'\s]+)/g)) {
    const rel = m[1];
    if (rel !== undefined && rel !== "") found.push(rel);
  }
  return found;
}

/**
 * Parse a `settings.json` text into the registrations it declares.
 *
 * @param {string} text
 * @returns {{ ok: true, entries: Registration[] } | { ok: false, why: string }}
 */
export function registrationOf(text) {
  /** @type {unknown} */
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    return { ok: false, why: `settings.json did not parse: ${errText(err)}` };
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, why: "settings.json is not a JSON object" };
  }
  const hooks = /** @type {Record<string, unknown>} */ (parsed)["hooks"];
  if (hooks === undefined) return { ok: true, entries: [] };
  if (hooks === null || typeof hooks !== "object" || Array.isArray(hooks)) {
    return { ok: false, why: "settings.json `hooks` is not an object" };
  }
  /** @type {Registration[]} */
  const entries = [];
  for (const [event, groups] of Object.entries(/** @type {Record<string, unknown>} */ (hooks))) {
    if (!Array.isArray(groups)) continue;
    for (const group of groups) {
      if (group === null || typeof group !== "object" || Array.isArray(group)) continue;
      const g = /** @type {Record<string, unknown>} */ (group);
      const matcher = typeof g["matcher"] === "string" ? g["matcher"] : "";
      const list = g["hooks"];
      if (!Array.isArray(list)) continue;
      for (const hook of list) {
        if (hook === null || typeof hook !== "object" || Array.isArray(hook)) continue;
        const h = /** @type {Record<string, unknown>} */ (hook);
        const command = typeof h["command"] === "string" ? h["command"] : "";
        if (command === "") continue;
        entries.push({ event, matcher, command, scripts: hookScriptsIn(command) });
      }
    }
  }
  return { ok: true, entries };
}

/**
 * Does a matcher select this tool name?
 *
 * The harness treats `matcher` as a regular expression over the tool
 * name, and an empty matcher matches everything. **This is the function
 * that makes the measured instance MECHANICAL rather than an argument
 * from silence**: `"Edit|Write|NotebookEdit"` does not select `Bash`, so
 * a checkout registering only that runs ZERO hooks on a `git push` — a
 * fact this function states and a keeper can drive, instead of being
 * inferred from a guard that printed nothing.
 *
 * A matcher that will not compile selects NOTHING and says so by
 * returning false; it is never treated as a wildcard.
 *
 * @param {string} matcher
 * @param {string} toolName
 * @returns {boolean}
 */
export function matcherSelects(matcher, toolName) {
  if (matcher === "" || matcher === "*") return true;
  try {
    return new RegExp(matcher).test(toolName);
  } catch {
    return false;
  }
}

/**
 * The hook commands a harness would run for one event and tool name —
 * the SELECTION, computed from a checkout's own settings text.
 *
 * @param {string} text  the checkout's `settings.json`
 * @param {{ event?: string, toolName: string }} of
 * @returns {string[]}
 */
export function hooksFor(text, { event = "PreToolUse", toolName }) {
  const read = registrationOf(text);
  if (!read.ok) return [];
  return read.entries
    .filter((e) => e.event === event && matcherSelects(e.matcher, toolName))
    .map((e) => e.command);
}

// ── git, asked from ONE side on purpose ────────────────────────────────

/**
 * @param {string} cwd
 * @param {string[]} args
 * @returns {{ status: number | null, out: string, err: string }}
 */
function git(cwd, args) {
  const r = spawnSync("git", ["-C", cwd, ...args], { encoding: "utf8" });
  return {
    status: r.error === undefined ? r.status : null,
    out: (r.stdout ?? "").trim(),
    err: r.error !== undefined ? String(r.error.message) : (r.stderr ?? "").trim(),
  };
}

/** @param {unknown} err */
function errText(err) {
  return err instanceof Error ? err.message : String(err);
}

/** The checkout THIS FILE lives in — never `process.cwd()`. @returns {string} */
export function defaultVantage() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
}

/**
 * The probe that says a directory is a checkout of THIS repository —
 * the same file `push-guard.mjs` asks the same question with, and a
 * keeper asserts the two constants are equal rather than trusting that
 * they stay so. A second copy with a checker is one fact checked twice;
 * without one it is two facts.
 */
export const REPOSITORY_PROBE_REL_PATH = "app/src-tauri/crates/nputer-index/Cargo.toml";

/**
 * @typedef {object} SessionCheckout
 * @property {string} path
 * @property {"declared" | "derived"} source  how it was found, said out loud
 * @property {string} how                     the exact signal, for the render
 */

/**
 * WHICH CHECKOUT WAS THIS SESSION STARTED IN — derived, never declared by
 * the party under test, and never `process.cwd()` raw.
 *
 * ── WHY THIS FUNCTION EXISTS AT ALL, WHICH IS A REJECTION ─────────────
 * An earlier build read `CLAUDE_PROJECT_DIR` and nothing else. **That
 * variable is exported to HOOK commands and NOT to Bash tool calls**,
 * measured with a positive control in one session:
 *
 *     hook command     CLAUDE_PROJECT_DIR = <the project dir>
 *     Bash tool call   CLAUDE_PROJECT_DIR = UNSET   (env | grep -c => 0)
 *
 * The arming step is TYPED AT A SHELL, so in production the arm took its
 * "nothing was declared" branch every time and the only path that could
 * reach a STALE verdict was reachable from a fixture. A correct catcher
 * that is called and always declines is the same defect as one nothing
 * calls, one level up — which is this card's own subject, committed by
 * this card.
 *
 * ── THE TWO SOURCES, IN ORDER, AND WHY NEITHER IS A FLAG ──────────────
 * 1. `CLAUDE_PROJECT_DIR` — authoritative where it exists.
 * 2. The WORKTREE ROOT containing `cwd` — never raw `cwd`, and only when
 *    that root is a checkout of THIS repository. In production a
 *    session's shell starts in its own project directory, so this
 *    resolves to the thing in question; measured from a real session's
 *    shell, `git rev-parse --show-toplevel` returned that session's own
 *    worktree at the motivating commit.
 *
 * **A THIRD SOURCE — AN EXPLICIT FLAG THE RITUAL PASSES — IS DELIBERATELY
 * REFUSED, AND THE REASON IS THIS PROJECT'S OWN RULE POINTING AT IT.**
 * *A construction beats a check*: a flag fires only when a seat remembers
 * to pass it, and the fact it would be passing is exactly the fact the
 * seat working out of a stale checkout does not have. It asks the party
 * under test to declare the property under test. The sweep below is the
 * construction that needs nobody to remember anything.
 *
 * ── AND SOURCE 2 HAS A HOLE, WHICH THE SWEEP CLOSES RATHER THAN HIDES ─
 * A seat that types the arming step in some OTHER checkout gets a verdict
 * about that one — and if that other checkout is current, the answer is a
 * false reassurance in exactly the motivating instance's shape. This
 * function does not fix that and must not be read as fixing it. `sweep`
 * does, by judging every checkout of this repository on the machine.
 *
 * @param {NodeJS.ProcessEnv} [env]
 * @param {string} [cwd]
 * @returns {SessionCheckout | undefined}
 */
export function sessionCheckout(env = process.env, cwd = process.cwd()) {
  const declared = env["CLAUDE_PROJECT_DIR"];
  if (typeof declared === "string" && declared !== "") {
    return {
      path: path.resolve(declared),
      source: "declared",
      how: "CLAUDE_PROJECT_DIR, which the harness exports to hook commands",
    };
  }
  const top = git(cwd, ["rev-parse", "--show-toplevel"]);
  if (top.status !== 0 || top.out === "") return undefined;
  const root = path.resolve(top.out);
  if (!existsSync(path.join(root, REPOSITORY_PROBE_REL_PATH))) return undefined;
  return {
    path: root,
    source: "derived",
    how: "the worktree root containing this command's working directory, never the directory itself",
  };
}

/**
 * The absolute common git directory of a checkout — the thing WORKTREES
 * of one repository share and separate CLONES do not.
 * @param {string} root
 * @returns {string | null}
 */
function commonDirOf(root) {
  const r = git(root, ["rev-parse", "--path-format=absolute", "--git-common-dir"]);
  if (r.status !== 0 || r.out === "") return null;
  try {
    return path.resolve(r.out);
  } catch {
    return null;
  }
}

/**
 * Every checkout of this repository on this machine, read off git's own
 * worktree administration from the vantage.
 *
 * **THIS IS A FACT ON DISK, NOT A MEMORY** (`method/lane-protocol.md`
 * rule 7), and it is the whole reason the sweep cannot be defeated: it
 * needs no environment variable, no flag, no cwd and no cooperation from
 * any checkout in it. A session is started in a checkout of this
 * repository, so the session's checkout is in this list by construction —
 * whether or not anybody could name it.
 *
 * @param {string} vantage
 * @returns {{ path: string, head: string, branch: string }[]}
 */
export function worktreesOf(vantage) {
  const r = git(vantage, ["worktree", "list", "--porcelain"]);
  if (r.status !== 0) return [];
  /** @type {{ path: string, head: string, branch: string }[]} */
  const found = [];
  /** @type {{ path: string, head: string, branch: string } | null} */
  let current = null;
  for (const line of r.out.split("\n")) {
    if (line.startsWith("worktree ")) {
      if (current !== null) found.push(current);
      current = { path: path.resolve(line.slice("worktree ".length)), head: "", branch: "" };
    } else if (line.startsWith("HEAD ") && current !== null) {
      current.head = line.slice("HEAD ".length);
    } else if (line.startsWith("branch ") && current !== null) {
      current.branch = line.slice("branch ".length);
    }
  }
  if (current !== null) found.push(current);
  return found;
}

/**
 * Judge EVERY checkout of this repository on this machine.
 *
 * The arm-time question is not really *"is MY checkout stale?"* — a seat
 * that could answer that reliably would not need this tool. It is
 * **"which checkouts on this machine load stale guards?"**, and that one
 * is answerable without knowing which of them a session is sitting in.
 * A DETACHED checkout is included on purpose: the measured instance was a
 * worktree nobody would have called a lane, and a session can be started
 * in any of them.
 *
 * @param {object} [options]
 * @param {string} [options.vantage]
 * @param {string} [options.integrationRef]
 * @returns {{ checkout: string, head: string, branch: string, decision: Decision }[]}
 */
export function sweep(options = {}) {
  const vantage = path.resolve(options.vantage ?? defaultVantage());
  const integrationRef = options.integrationRef ?? DEFAULT_INTEGRATION_REF;
  return worktreesOf(vantage).map((w) => ({
    checkout: w.path,
    head: w.head,
    branch: w.branch,
    decision: judge({ vantage, target: w.path, integrationRef }),
  }));
}

// ── the three arms ─────────────────────────────────────────────────────

/**
 * ARM 1 + 2 — REGISTRATION and PRESENCE.
 *
 * The reference is the integration branch's own `settings.json`, read
 * from the VANTAGE with `git show`. For every `(event, matcher, script)`
 * the reference registers, the target must register it too (arm 1) and
 * the script must EXIST on disk in the target (arm 2). Arm 2 iterates
 * the REFERENCE's script list rather than the target's, which is the
 * whole reason it works on the measured instance: a checkout that
 * registers nothing still gets every reference hook checked and reports
 * every one of them absent.
 *
 * @param {{ vantage: string, target: string, integrationRef: string }} o
 * @param {Finding[]} findings
 * @param {Finding[]} unanswered
 * @param {Record<string, string | number | boolean | null>} figures
 */
function registrationArm({ vantage, target, integrationRef }, findings, unanswered, figures) {
  const show = git(vantage, ["show", `${integrationRef}:${SETTINGS_REL_PATH}`]);
  if (show.status !== 0) {
    unanswered.push({
      code: "reference-registration-unreadable",
      detail:
        `could not read ${SETTINGS_REL_PATH} at ${integrationRef} from the vantage ${vantage}: ` +
        `${show.err || `git exited ${String(show.status)}`}. NOTHING about this checkout's ` +
        "registration was judged — that is an inability, not a pass.",
    });
    return;
  }
  const reference = registrationOf(show.out);
  if (!reference.ok) {
    unanswered.push({
      code: "reference-registration-unreadable",
      detail: `the reference ${SETTINGS_REL_PATH} at ${integrationRef} could not be parsed: ${reference.why}`,
    });
    return;
  }
  figures["referenceHooks"] = reference.entries.length;

  const settingsPath = path.join(target, SETTINGS_REL_PATH);
  /** @type {Registration[]} */
  let mine = [];
  if (!existsSync(settingsPath)) {
    figures["targetHooks"] = 0;
    if (reference.entries.length > 0) {
      findings.push({
        code: "settings-absent",
        detail:
          `the judged checkout has no ${SETTINGS_REL_PATH} at all, while ${integrationRef} ` +
          `registers ${String(reference.entries.length)} hook(s). Every guard this project ` +
          "registers is unregistered in the session started there.",
      });
    }
  } else {
    const read = registrationOf(readFileSync(settingsPath, "utf8"));
    if (!read.ok) {
      figures["targetHooks"] = null;
      findings.push({
        code: "settings-unreadable",
        detail:
          `the judged checkout's ${SETTINGS_REL_PATH} could not be read as a registration: ` +
          `${read.why}. A harness that cannot parse it registers nothing.`,
      });
    } else {
      mine = read.entries;
      figures["targetHooks"] = mine.length;
    }
  }

  for (const want of reference.entries) {
    const registered = mine.some(
      (have) =>
        have.event === want.event &&
        have.matcher === want.matcher &&
        want.scripts.every((s) => have.scripts.includes(s)),
    );
    if (!registered) {
      findings.push({
        code: "registration-missing",
        detail:
          `${integrationRef} registers ${want.event} matcher ${JSON.stringify(want.matcher)} -> ` +
          `${want.scripts.join(", ") || want.command}, and the judged checkout does not. ` +
          "A session started there runs that guard on nothing.",
      });
    }
    for (const script of want.scripts) {
      if (!existsSync(path.join(target, script))) {
        findings.push({
          code: "hook-absent",
          detail:
            `${integrationRef} registers ${script} and the judged checkout does not carry that ` +
            "file. An ABSENT hook cannot announce itself — this is the half the motivating " +
            "instance had.",
        });
      }
    }
  }
}

/**
 * ARM 3 — GUARD-SURFACE CURRENCY, and the arm that is NOT reachability.
 *
 * From the vantage: which integration-branch commit last touched the
 * guard surface? Then: is THAT commit contained in the target's HEAD?
 *
 * **Read the direction.** The trap this card names is
 * `merge-base --is-ancestor <targetHead> <tip>`, which answers YES for
 * every stale checkout because that is what stale MEANS. This arm asks
 * `merge-base --is-ancestor <guardCommit> <targetHead>`: the target's
 * HEAD must CONTAIN the newest change to the guard surface. The
 * motivating instance fails it — a HEAD 344 commits behind cannot
 * contain a guard change made in those 344 — while a lane cut from a
 * recent checkpoint whose `.claude` has not moved passes, which a raw
 * commit distance would not. **A count would refuse every lane and teach
 * the project to ignore this tool; a content-history question refuses
 * the checkouts whose GUARDS are actually old.**
 *
 * Both queries run IN THE VANTAGE, with the target's HEAD passed as a
 * value — so no answer comes from the stale side. What the vantage must
 * therefore have is the target's HEAD OBJECT: worktrees share one object
 * store, separate clones may not, and where it is missing this arm says
 * UNANSWERED rather than clean (see `STALE_CLONE_LIMIT`).
 *
 * @param {{ vantage: string, target: string, integrationRef: string, targetHead: string }} o
 * @param {Finding[]} findings
 * @param {Finding[]} unanswered
 * @param {Record<string, string | number | boolean | null>} figures
 */
function guardSurfaceArm({ vantage, target, integrationRef, targetHead }, findings, unanswered, figures) {
  const known = git(vantage, ["cat-file", "-e", `${targetHead}^{commit}`]);
  if (known.status !== 0) {
    unanswered.push({
      code: "target-head-not-in-vantage",
      detail:
        `the vantage ${vantage} does not have the judged checkout's HEAD ${targetHead} as an ` +
        "object, so the guard-surface question could not be asked from this side at all. " +
        "This is the stale-clone shape: fetch it, or run from a checkout sharing refs.",
    });
    return;
  }
  const surface = git(vantage, ["rev-list", "-1", integrationRef, "--", ...GUARD_SURFACE]);
  if (surface.status !== 0 || surface.out === "") {
    unanswered.push({
      code: "guard-surface-commit-unknown",
      detail:
        `no commit touching ${GUARD_SURFACE.join(" ")} could be found on ${integrationRef} from ` +
        `${vantage}: ${surface.err || "the walk returned nothing"}. The guard-surface question ` +
        "went unasked.",
    });
    return;
  }
  const guardCommit = surface.out.split("\n")[0] ?? "";
  figures["guardSurfaceCommit"] = guardCommit;

  const behind = git(vantage, ["rev-list", "--count", `${targetHead}..${integrationRef}`]);
  figures["commitsBehind"] = behind.status === 0 ? Number(behind.out) : null;

  const contains = git(vantage, ["merge-base", "--is-ancestor", guardCommit, targetHead]);
  if (contains.status === 0) return;
  if (contains.status !== 1) {
    unanswered.push({
      code: "guard-surface-containment-unknown",
      detail:
        `asking whether ${targetHead} contains ${guardCommit} neither confirmed nor denied ` +
        `(git exited ${String(contains.status)}): ${contains.err || "no output"}. An exit that ` +
        "is not 0 or 1 is the instrument failing, never a verdict.",
    });
    return;
  }
  const distance = figures["commitsBehind"];
  findings.push({
    code: "guard-surface-behind",
    detail:
      `the judged checkout ${target} is at ${targetHead}, which does NOT contain ${guardCommit} — ` +
      `the newest ${integrationRef} commit touching ${GUARD_SURFACE.join(" ")}. It is ` +
      `${distance === null ? "an unknown number of" : String(distance)} commit(s) behind ` +
      `${integrationRef}. The hooks a session started there loads are older than the ones this ` +
      "project registers. NOTE: this is NOT the reachability question — that one answers " +
      "\"fine\" here, because being an ancestor of the tip is what stale MEANS.",
  });
}

// ── the decision ───────────────────────────────────────────────────────

/**
 * Judge one checkout's guard currency from a vantage that is not it.
 *
 * @param {object} [options]
 * @param {string} [options.vantage]        the checkout supplying every reference value
 * @param {string} [options.target]         the checkout under judgement
 * @param {string} [options.integrationRef] the integration branch, resolved in the vantage
 * @returns {Decision}
 */
export function judge(options = {}) {
  const vantage = path.resolve(options.vantage ?? defaultVantage());
  const session = options.target === undefined ? sessionCheckout() : undefined;
  const target = path.resolve(options.target ?? session?.path ?? process.cwd());
  const integrationRef = options.integrationRef ?? DEFAULT_INTEGRATION_REF;

  /** @type {Finding[]} */
  const findings = [];
  /** @type {Finding[]} */
  const unanswered = [];
  /** @type {Record<string, string | number | boolean | null>} */
  const figures = {
    vantage,
    target,
    integrationRef,
    targetSource: options.target !== undefined ? "given" : (session?.source ?? "fallback"),
    selfJudged: path.resolve(vantage) === path.resolve(target),
  };

  const vantageCommon = commonDirOf(vantage);
  if (vantageCommon === null) {
    return {
      verdict: "unknown",
      findings,
      unanswered: [
        {
          code: "vantage-not-a-checkout",
          detail: `${vantage} is not a git checkout, so it can supply no reference value.`,
        },
      ],
      figures,
    };
  }
  const targetCommon = commonDirOf(target);
  if (targetCommon === null) {
    return {
      verdict: "unknown",
      findings,
      unanswered: [
        {
          code: "target-not-a-checkout",
          detail: `${target} is not a git checkout, so there is no HEAD to judge.`,
        },
      ],
      figures,
    };
  }
  figures["sharedRefs"] = vantageCommon === targetCommon;

  const tip = git(vantage, ["rev-parse", "--verify", `${integrationRef}^{commit}`]);
  if (tip.status !== 0) {
    unanswered.push({
      code: "integration-ref-unresolved",
      detail:
        `${integrationRef} does not resolve in the vantage ${vantage}: ` +
        `${tip.err || `git exited ${String(tip.status)}`}.`,
    });
  } else {
    figures["integrationTip"] = tip.out;
  }

  const head = git(target, ["rev-parse", "--verify", "HEAD"]);
  if (head.status !== 0) {
    unanswered.push({
      code: "target-head-unresolved",
      detail: `HEAD does not resolve in ${target}: ${head.err || `git exited ${String(head.status)}`}.`,
    });
  } else {
    figures["targetHead"] = head.out;
  }

  registrationArm({ vantage, target, integrationRef }, findings, unanswered, figures);
  if (tip.status === 0 && head.status === 0) {
    guardSurfaceArm({ vantage, target, integrationRef, targetHead: head.out }, findings, unanswered, figures);
  }

  const verdict = findings.length > 0 ? "stale" : unanswered.length > 0 ? "unknown" : "current";
  return { verdict, findings, unanswered, figures };
}

/** The exit code a decision earns. @param {Decision} d @returns {number} */
export function exitFor(d) {
  if (d.verdict === "stale") return EXIT.FOUND;
  if (d.verdict === "unknown") return EXIT.CANNOT_RUN;
  return EXIT.CLEAN;
}

/**
 * The lines a run prints. The stale-clone limit is printed on EVERY run,
 * whatever the verdict — a limit disclosed only when it bites is a limit
 * the reader meets for the first time in a wrong answer.
 *
 * @param {Decision} d
 * @returns {string[]}
 */
export function render(d) {
  const lines = [];
  lines.push(`checkout-currency: ${d.verdict.toUpperCase()}`);
  lines.push(`  judged   ${String(d.figures["target"])}`);
  lines.push(`  from     ${String(d.figures["vantage"])}`);
  lines.push(
    `  against  ${String(d.figures["integrationRef"])} @ ${String(d.figures["integrationTip"] ?? "unresolved")}`,
  );
  lines.push(`  HEAD     ${String(d.figures["targetHead"] ?? "unresolved")}`);
  for (const key of ["commitsBehind", "guardSurfaceCommit", "referenceHooks", "targetHooks"]) {
    if (key in d.figures) lines.push(`  ${key.padEnd(8)} ${String(d.figures[key])}`);
  }
  if (d.figures["selfJudged"] === true) {
    lines.push(
      "  NOTE: the vantage and the judged checkout are the SAME directory. A checkout " +
        "comparing itself against its own refs answers a weaker question than this looks " +
        "like; point --checkout at the session's own project directory.",
    );
  }
  if (d.figures["sharedRefs"] === false) {
    lines.push(
      "  NOTE: the vantage and the judged checkout do NOT share a git object store, so this " +
        "is the stale-clone shape the limit below describes.",
    );
  }
  for (const f of d.findings) lines.push(`  STALE [${f.code}] ${f.detail}`);
  for (const f of d.unanswered) lines.push(`  UNANSWERED [${f.code}] ${f.detail}`);
  if (d.verdict === "stale") {
    lines.push(
      "  A session started in this checkout loads the registration above. Start the session " +
        "in a current checkout, or bring this one forward, BEFORE the sitting — an absent " +
        "guard cannot announce itself at the push it failed to guard.",
    );
  }
  lines.push(`  ${STALE_CLONE_LIMIT}`);
  return lines;
}

/**
 * The sweep's lines: one per checkout, stale ones named in full.
 *
 * @param {ReturnType<typeof sweep>} results
 * @returns {string[]}
 */
export function renderSweep(results) {
  const stale = results.filter((r) => r.decision.verdict === "stale");
  const lines = [
    `checkout-currency SWEEP: ${String(stale.length)} of ${String(results.length)} checkout(s) ` +
      "of this repository load STALE guards",
  ];
  for (const r of results) {
    const codes = r.decision.findings.map((f) => f.code).join(", ");
    lines.push(
      `  ${r.decision.verdict.toUpperCase().padEnd(7)} ${r.checkout} @ ${r.head.slice(0, 7)}` +
        `${codes === "" ? "" : ` — ${codes}`}`,
    );
  }
  if (stale.length > 0) {
    lines.push(
      "  A SESSION STARTED IN ANY CHECKOUT ABOVE MARKED STALE RUNS THE GUARDS THAT CHECKOUT " +
        "CARRIES, WHICH ARE NOT THE ONES THIS PROJECT REGISTERS. This list is read off git's " +
        "own worktree administration, so it needs nothing declared and no checkout's " +
        "cooperation — which is why it still names a checkout no environment variable could.",
    );
  }
  return lines;
}

// ── the CLI ────────────────────────────────────────────────────────────

const USAGE =
  "usage: node tools/e2e/scripts/checkout-currency.mjs [--checkout <path>] " +
  "[--vantage <path>] [--integration-ref <ref>] [--sweep] [--json]";

/**
 * @param {string[]} argv  the arguments after the script name
 * @param {(line: string) => void} [out]
 * @param {(line: string) => void} [err]
 * @returns {number} the exit code
 */
export function main(argv, out = (l) => process.stdout.write(`${l}\n`), err = (l) => process.stderr.write(`${l}\n`)) {
  /** @type {Record<string, string>} */
  const opts = {};
  let json = false;
  let wantsSweep = false;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--json") {
      json = true;
      continue;
    }
    if (arg === "--sweep") {
      wantsSweep = true;
      continue;
    }
    if (arg === "--checkout" || arg === "--vantage" || arg === "--integration-ref") {
      const value = argv[i + 1];
      if (value === undefined || value.startsWith("--")) {
        err(`checkout-currency: ${arg} needs a value\n${USAGE}`);
        return EXIT.USAGE;
      }
      opts[arg] = value;
      i += 1;
      continue;
    }
    err(`checkout-currency: unknown argument ${JSON.stringify(arg)}\n${USAGE}`);
    return EXIT.USAGE;
  }

  if (wantsSweep) {
    try {
      const results = sweep({
        ...(opts["--vantage"] === undefined ? {} : { vantage: opts["--vantage"] }),
        ...(opts["--integration-ref"] === undefined
          ? {}
          : { integrationRef: opts["--integration-ref"] }),
      });
      const stale = results.filter((r) => r.decision.verdict === "stale");
      if (json) out(JSON.stringify(results, null, 2));
      else for (const line of renderSweep(results)) (stale.length === 0 ? out : err)(line);
      return stale.length === 0 ? EXIT.CLEAN : EXIT.FOUND;
    } catch (e) {
      err(`checkout-currency: SWEEP COULD NOT RUN — ${errText(e)}.`);
      return EXIT.CANNOT_RUN;
    }
  }

  /** @type {Decision} */
  let decision;
  try {
    decision = judge({
      ...(opts["--vantage"] === undefined ? {} : { vantage: opts["--vantage"] }),
      ...(opts["--checkout"] === undefined ? {} : { target: opts["--checkout"] }),
      ...(opts["--integration-ref"] === undefined
        ? {}
        : { integrationRef: opts["--integration-ref"] }),
    });
  } catch (e) {
    err(
      `checkout-currency: COULD NOT RUN — ${errText(e)}. Exit ${String(EXIT.CANNOT_RUN)} means ` +
        `the catcher did not finish; it is NOT a claim about the checkout (exit ${String(EXIT.FOUND)} is).`,
    );
    return EXIT.CANNOT_RUN;
  }

  if (json) out(JSON.stringify(decision, null, 2));
  else for (const line of render(decision)) (decision.verdict === "current" ? out : err)(line);
  return exitFor(decision);
}

// `process.exitCode`, NEVER `process.exit()` — brief-flush.spec.ts's
// standing sweep over this directory, and the reason it exists: a command
// that ends at `process.exit()` drops whatever stdout has not drained,
// invisibly to a file and to a TTY and silently through a pipe. The guard
// on `process.argv[1]` is what keeps `import`ing this module
// side-effect-free, which is how its keeper drives `judge` directly
// instead of only through a subprocess.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}
