#!/usr/bin/env node
/**
 * THE APP LAUNCHER (T-164) — one command opens @human's app worktree
 * fresh. Run it with no arguments:
 *
 *     bin/app-dev.mjs              (or: node bin/app-dev.mjs)
 *     bin/app-dev.mjs --dry-run    (print the derived plan, execute nothing)
 *
 * It carries the three-step ritual that used to live in a personal note,
 * IN THIS ORDER, stopping loudly at the first failure with the step named:
 *
 *   1. git -C <target> checkout --detach main   (LOCAL main; never fetches)
 *   2. lib/parser: npm ci if needed, then npm run build       (ALWAYS builds)
 *   3. app/:      npm install if needed
 *   4. app/:      npm run tauri dev
 *
 * WHY EACH STEP EXISTS, because a script that carries a ritual should
 * carry its reasons too:
 *
 *   - THE DETACHED CHECKOUT IS THE FEATURE (docs/CONVENTIONS.md, @human's
 *     ruling of 2026-08-25). The app's code cannot move on its own, so the
 *     pipeline may merge all night while the app stays up; the app still
 *     opens the integration checkout as its PROJECT, so code and watched
 *     folder are independent. Detaching at local `main` is how that
 *     worktree updates, when the human chooses.
 *   - THE PARSER REBUILD IS MANDATORY. `lib/parser/dist` is a build
 *     artifact no merge updates (docs/STATE.md's standing hazards), and
 *     app -> parser is a `file:` dependency npm installs as a SYMLINK, so
 *     the dist/ the running vite serves IS the parser's own directory.
 *     A merge that moved the parser reaches the app with nothing under
 *     `app/` in the diff — and an unbuilt parser fails with a TS2307
 *     about a module rather than with a word about the actual cause.
 *   - A MISSED INSTALL after a dependency-moving merge fails the same
 *     way: a message about modules, never about the merge. So the install
 *     is DERIVED here rather than remembered by a human.
 *
 * WHAT THIS SCRIPT WILL NOT DO:
 *
 *   - IT NEVER TOUCHES PORT 1420. It does not read it, bind it, connect
 *     to it or lsof it; `tauri dev` binds it itself, as it always has.
 *     (The e2e lane's boot check probes a port because it SPAWNS a second
 *     app beside the human's. This script IS the human's app; there is
 *     nothing to arbitrate, and a probe would be one more thing that can
 *     be wrong.)
 *   - IT WRITES NOWHERE OUTSIDE THE TARGET WORKTREE. No temp files, no
 *     caches, no state of its own — every write in a live run is git's,
 *     npm's or the build's, inside the target.
 *   - IT REFUSES A LANE AND IT REFUSES THE INTEGRATION CHECKOUT. This
 *     launcher exists so that USING the app never collides with lanes: a
 *     `task/` branch is a lane's fence and the integration checkout is
 *     where merges land. Detaching either at main would be a collision
 *     with somebody's work, so the refusal is a precondition — checked
 *     before anything executes, exit 3, with the reason.
 *
 * EXIT CODES (the four-code family docs/CONVENTIONS.md legends for this
 * project's other scripts, meaning the same things here):
 *   0  the run finished — for a live run, `tauri dev` exited 0
 *   1  a STEP FAILED; the failing step is named and nothing after it ran
 *   2  called wrong (an argument this script does not take)
 *   3  REFUSED before executing anything: a precondition does not hold
 *
 * PLATFORM: POSIX (this project runs on Darwin). Commands are spawned
 * without a shell, so `npm` is resolved from PATH by execvp.
 */

import { spawnSync } from "node:child_process";
import { existsSync, realpathSync, statSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

/** The authority on this script's exit codes, frozen beside the script. */
const EXIT = Object.freeze({ OK: 0, FAILED: 1, USAGE: 2, REFUSED: 3 });

/**
 * THE ONE PLACE THE APP WORKTREE'S PATH COMES FROM. One environment
 * variable, one stated default — no second source, no config file, no
 * argument, so there is never a question of which of two answers won.
 */
const ENV_VAR = "SUPERTASKR_APP_WORKTREE";
const DEFAULT_TARGET = path.join(homedir(), "Projects", "supertaskr-app");
const DEFAULT_TARGET_SPELLING = "~/Projects/supertaskr-app";

const USAGE = `usage: bin/app-dev.mjs [--dry-run]

Opens the app worktree fresh: detach at local main, rebuild lib/parser,
install what is missing, start tauri dev. No other arguments.

  --dry-run   print the derived plan and execute none of it
  --help      this text

  ${ENV_VAR}   the app worktree to open
              (default: ${DEFAULT_TARGET_SPELLING})`;

// ── derivation helpers ───────────────────────────────────────────────

/** Read-only git. Never inherits stdio, so it can never look like a step. */
function git(args, cwd) {
  const r = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (r.error) return { ok: false, code: null, out: "", err: String(r.error) };
  return {
    ok: r.status === 0,
    code: r.status,
    out: (r.stdout ?? "").trim(),
    err: (r.stderr ?? "").trim(),
  };
}

/**
 * Compare paths by their REAL selves. On this platform `/tmp` is a
 * symlink to `/private/tmp`, and git and the environment do not always
 * agree on which spelling they hand back — two spellings of one directory
 * would make the integration-checkout refusal miss.
 */
function realOrSelf(p) {
  try {
    return realpathSync(path.resolve(p));
  } catch {
    return path.resolve(p);
  }
}

function stamp(ms) {
  return new Date(ms).toISOString();
}

/**
 * INSTALL-IF-NEEDED, DERIVED — this is the function the criterion means,
 * and the derivation is stated here where it decides rather than in a
 * comment somewhere else.
 *
 * Needed when either holds:
 *   (a) `node_modules` is absent — nothing is installed, so everything is;
 *   (b) `package-lock.json` is NEWER than `node_modules/.package-lock.json`,
 *       which is the marker npm itself writes at the end of an install. A
 *       lockfile that a `git checkout` just moved is newer than that
 *       marker, which is exactly the "dependency-moving merge" case this
 *       script exists to stop failing silently.
 *
 * Where the marker is absent but node_modules is not (an install from a
 * very old npm, or a hand-made directory), the directory's own mtime is
 * the fallback marker and the answer says so.
 *
 * IT IS RE-DERIVED AFTER THE CHECKOUT IN A LIVE RUN. Step 1 can move both
 * lockfiles, so a decision taken before it would be a decision about the
 * wrong tree; the plan printed up front says so in as many words.
 */
function installDecision(pkgDir) {
  const nodeModules = path.join(pkgDir, "node_modules");
  const lock = path.join(pkgDir, "package-lock.json");
  const marker = path.join(nodeModules, ".package-lock.json");

  if (!existsSync(nodeModules)) {
    return { needed: true, why: `node_modules absent at ${nodeModules}` };
  }
  if (!existsSync(lock)) {
    return {
      needed: false,
      why: `node_modules present and there is no package-lock.json at ${lock} to be newer than it`,
    };
  }
  const markerPath = existsSync(marker) ? marker : nodeModules;
  const markerLabel = existsSync(marker)
    ? "node_modules/.package-lock.json"
    : "node_modules/ (mtime; npm's own marker is absent)";
  const lockMs = statSync(lock).mtimeMs;
  const markerMs = statSync(markerPath).mtimeMs;
  const needed = lockMs > markerMs;
  return {
    needed,
    why:
      `package-lock.json ${stamp(lockMs)} is ` +
      `${needed ? "NEWER than" : "not newer than"} ` +
      `${markerLabel} ${stamp(markerMs)}`,
  };
}

// ── preconditions ────────────────────────────────────────────────────

function refuse(headline, target, reason, fix) {
  process.stderr.write(
    `\napp-dev: REFUSED — ${headline}\n` +
      `  target: ${target}\n` +
      `  reason: ${reason}\n` +
      (fix ? `  fix:    ${fix}\n` : "") +
      `  nothing was executed.\n\n`,
  );
  return EXIT.REFUSED;
}

/**
 * Everything that must hold before a single step runs. Returns either
 * `{ refusal: <exit code> }` — already printed — or the derived facts the
 * plan is built from. Every check here is a READ.
 */
function derive() {
  const raw = process.env[ENV_VAR];
  let target;
  let source;
  if (raw === undefined) {
    target = DEFAULT_TARGET;
    source = `${ENV_VAR} unset -> default ${DEFAULT_TARGET_SPELLING}`;
  } else if (raw.trim() === "") {
    return {
      refusal: refuse(
        `${ENV_VAR} is set but empty`,
        "(none)",
        "an empty value is a mistake, not a request for the default — falling back silently is how a launcher opens the wrong tree",
        `unset ${ENV_VAR} to use ${DEFAULT_TARGET_SPELLING}, or set it to a path`,
      ),
    };
  } else {
    const v = raw.trim();
    // A `~/…` that reached us unexpanded came from a quoted config line,
    // not from a shell. Expand it rather than looking for a directory
    // literally named `~`.
    target = v === "~" || v.startsWith("~/") ? path.join(homedir(), v.slice(1)) : path.resolve(v);
    source = `${ENV_VAR}=${v}`;
  }

  if (!existsSync(target)) {
    return {
      refusal: refuse(
        "the app worktree does not exist",
        target,
        `no such path (${source})`,
        `create it with: git -C <the integration checkout> worktree add --detach ${target} main`,
      ),
    };
  }
  if (!statSync(target).isDirectory()) {
    return {
      refusal: refuse("the app worktree is not a directory", target, `${source} names a file`, null),
    };
  }

  const top = git(["rev-parse", "--path-format=absolute", "--show-toplevel"], target);
  if (!top.ok) {
    return {
      refusal: refuse(
        "the app worktree is not a git worktree",
        target,
        `git rev-parse --show-toplevel failed there${top.err ? `: ${top.err}` : ""}`,
        null,
      ),
    };
  }
  if (realOrSelf(top.out) !== realOrSelf(target)) {
    return {
      refusal: refuse(
        "the path is inside a worktree rather than being one",
        target,
        `its toplevel is ${top.out} — pointing at a subdirectory would detach a tree the variable does not name`,
        `set ${ENV_VAR}=${top.out} if that is the worktree you meant`,
      ),
    };
  }

  // THE INTEGRATION CHECKOUT is the repository's MAIN worktree, and that
  // is a structural fact rather than a branch name: every linked worktree
  // shares one common git dir, which lives inside the main worktree.
  const common = git(["rev-parse", "--path-format=absolute", "--git-common-dir"], target);
  if (!common.ok) {
    return {
      refusal: refuse(
        "the repository's main worktree could not be derived",
        target,
        `git rev-parse --git-common-dir failed${common.err ? `: ${common.err}` : ""}`,
        null,
      ),
    };
  }
  const mainWorktree = path.dirname(common.out.replace(/\/$/, ""));
  if (realOrSelf(mainWorktree) === realOrSelf(target)) {
    return {
      refusal: refuse(
        "that is the integration checkout itself",
        target,
        "merges land there and a human runs gates there; detaching it at main would collide with whatever the pipeline is doing",
        `point ${ENV_VAR} at the app worktree (default ${DEFAULT_TARGET_SPELLING}), created with: git -C ${target} worktree add --detach ${DEFAULT_TARGET} main`,
      ),
    };
  }

  // A LANE is a checkout on a `task/` branch. A DETACHED head is not a
  // lane — which is the whole reason the app worktree is detached.
  const branch = git(["symbolic-ref", "--quiet", "--short", "HEAD"], target);
  const attached = branch.ok ? branch.out : null;
  if (attached && attached.startsWith("task/")) {
    return {
      refusal: refuse(
        "the app worktree is a lane",
        target,
        `HEAD is on branch ${attached} — that is a lane's fenced checkout, and detaching it at main would throw away the work it holds`,
        `point ${ENV_VAR} at the app worktree (default ${DEFAULT_TARGET_SPELLING})`,
      ),
    };
  }

  const mainRef = git(["rev-parse", "--verify", "--quiet", "refs/heads/main"], target);
  if (!mainRef.ok) {
    return {
      refusal: refuse(
        "there is no local main branch to detach at",
        target,
        "this script detaches at LOCAL main and never fetches — it must not decide on its own that the remote's main is what you meant",
        "update main in the integration checkout first",
      ),
    };
  }

  const parserDir = path.join(target, "lib", "parser");
  const appDir = path.join(target, "app");
  for (const [dir, label] of [
    [parserDir, "lib/parser"],
    [appDir, "app"],
  ]) {
    if (!existsSync(path.join(dir, "package.json"))) {
      return {
        refusal: refuse(
          "the target does not look like a supertaskr worktree",
          target,
          `${label}/package.json is missing`,
          null,
        ),
      };
    }
  }

  const head = git(["rev-parse", "--short", "HEAD"], target);
  return {
    target,
    source,
    toplevel: top.out,
    mainWorktree,
    attached,
    head: head.ok ? head.out : "(unreadable)",
    mainSha: mainRef.out.slice(0, 12),
    parserDir,
    appDir,
  };
}

// ── the plan ─────────────────────────────────────────────────────────

function printPlan(f, dryRun) {
  const parser = installDecision(f.parserDir);
  const app = installDecision(f.appDir);
  const w = (label, value, src) =>
    `  ${label.padEnd(14)}${value}${src ? `  <- ${src}` : ""}\n`;

  let out = `\napp-dev: THE DERIVED PLAN${dryRun ? " (--dry-run: nothing below will run)" : ""}\n`;
  out += w("target", f.target, f.source);
  out += w("toplevel", f.toplevel, "git rev-parse --show-toplevel, in the target");
  out += w("main worktree", f.mainWorktree, "dirname of git rev-parse --git-common-dir — NOT this target, so not the integration checkout");
  out += w("HEAD", `${f.attached ? `on branch ${f.attached}` : "detached"} at ${f.head}`, "git symbolic-ref --short HEAD / git rev-parse --short HEAD");
  out += w("local main", f.mainSha, "git rev-parse --verify refs/heads/main — detaching happens at THIS, never at a remote");
  out += `\n`;
  out += `  step 1  RUN   git -C ${f.target} checkout --detach main\n`;
  out += `  step 2  ${parser.needed ? "RUN  " : "SKIP "} npm ci           (lib/parser)  <- ${parser.why}\n`;
  out += `  step 3  RUN   npm run build     (lib/parser)  <- always: lib/parser/dist is a build artifact no merge updates\n`;
  out += `  step 4  ${app.needed ? "RUN  " : "SKIP "} npm install      (app)        <- ${app.why}\n`;
  out += `  step 5  RUN   npm run tauri dev (app)\n`;
  out += `\n`;
  out += `  install decisions above are derived AT THE CURRENT CHECKOUT; step 1 can\n`;
  out += `  move both lockfiles, so a live run RE-DERIVES each one immediately\n`;
  out += `  before its own step and prints the reason it decided on.\n`;
  out += `  port 1420: never read, never probed, never bound — tauri dev binds it.\n`;
  out += `  writes: only inside ${f.target}.\n\n`;
  process.stdout.write(out);
}

// ── execution ────────────────────────────────────────────────────────

function runStep(n, label, cmd, args, cwd) {
  process.stdout.write(`\napp-dev: STEP ${n} — ${label}\n         ${cmd} ${args.join(" ")}   (cwd ${cwd})\n\n`);
  const r = spawnSync(cmd, args, { cwd, stdio: "inherit" });
  const code = r.error ? null : r.status;
  if (r.error || code !== 0) {
    process.stderr.write(
      `\napp-dev: STEP ${n} FAILED — ${label}\n` +
        `  command: ${cmd} ${args.join(" ")}\n` +
        `  cwd:     ${cwd}\n` +
        `  exit:    ${r.error ? String(r.error) : code}\n` +
        `  no step after this one ran; the app was NOT started.\n\n`,
    );
    return false;
  }
  return true;
}

function main(argv) {
  let dryRun = false;
  for (const a of argv) {
    if (a === "--dry-run") dryRun = true;
    else if (a === "--help" || a === "-h") {
      process.stdout.write(`${USAGE}\n`);
      return EXIT.OK;
    } else {
      process.stderr.write(`app-dev: unknown argument ${JSON.stringify(a)}\n\n${USAGE}\n`);
      return EXIT.USAGE;
    }
  }

  const f = derive();
  if (f.refusal !== undefined) return f.refusal;

  printPlan(f, dryRun);
  if (dryRun) {
    process.stdout.write("app-dev: --dry-run, so nothing above was executed.\n\n");
    return EXIT.OK;
  }

  if (!runStep(1, "detach the app worktree at local main", "git", ["-C", f.target, "checkout", "--detach", "main"], f.target)) {
    return EXIT.FAILED;
  }

  const parser = installDecision(f.parserDir);
  process.stdout.write(`\napp-dev: step 2 ${parser.needed ? "RUNS" : "SKIPPED"} (re-derived after step 1) <- ${parser.why}\n`);
  if (parser.needed && !runStep(2, "install lib/parser", "npm", ["ci"], f.parserDir)) return EXIT.FAILED;

  if (!runStep(3, "rebuild lib/parser", "npm", ["run", "build"], f.parserDir)) return EXIT.FAILED;

  const app = installDecision(f.appDir);
  process.stdout.write(`\napp-dev: step 4 ${app.needed ? "RUNS" : "SKIPPED"} (re-derived after step 1) <- ${app.why}\n`);
  if (app.needed && !runStep(4, "install app", "npm", ["install"], f.appDir)) return EXIT.FAILED;

  if (!runStep(5, "start tauri dev", "npm", ["run", "tauri", "dev"], f.appDir)) return EXIT.FAILED;

  return EXIT.OK;
}

process.exit(main(process.argv.slice(2)));
