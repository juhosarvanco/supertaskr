/**
 * `supertaskr undo <card>` — THE SAFE UNDO (T-244, folded 2026-09-08 at
 * @human's word; GSD Core's safe undo, T-245's second pass).
 *
 * ── WHAT MAKES IT DERIVABLE, AND WHY IT IS STILL WORTH A COMMAND ─────
 * Everything this needs is already in the record: a card names its fence
 * in `touches:`, a lane's commits carry the card id by the executor's
 * own step 6, and the merge that landed the lane is a first-parent merge
 * on the integration branch. So the revert IS derivable by hand — and by
 * hand is exactly where it goes wrong, because the dangerous half is not
 * the revert. It is the question nobody asks first: **has anything
 * landed on this card's fence since?** A revert that silently undoes a
 * later lane's work is worse than no undo at all.
 *
 * So the shape is: derive the merge, derive the fence, LIST every later
 * merge that touched that fence, and REFUSE while any of them is
 * unnamed. `--force <sha>` does not mean "do it anyway" — it means "I
 * have read this specific later merge and I accept reverting under it",
 * and a `--force` naming a commit that is not one of them is a usage
 * error rather than a licence. A blanket override would put the refusal
 * back where it started: in somebody's memory.
 *
 * ── THE FENCE COMES FROM THE ONE EXPANSION ───────────────────────────
 * `.claude/hooks/expand-fence.mjs`, which is a pipe from stdin to the
 * parser's own `expandFence` and nothing else (lane-protocol rule 5:
 * "THE EXPANSION READS ONE SOURCE AND MUST NEVER GROW A SECOND"). When
 * it cannot run, this command says CANNOT RUN and stops. There is
 * deliberately no fallback: a weaker fence read would make the refusal
 * fail OPEN, which is the failure mode the whole command exists against.
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const EXIT = Object.freeze({ CLEAN: 0, FOUND: 1, USAGE: 2, CANNOT_RUN: 3 });

/** Where this file lives: `<package>/scripts/`. */
const here = path.dirname(fileURLToPath(import.meta.url));

/**
 * This checkout's repository root — the DEFAULT root every derivation
 * below takes, which is the dominant first-party helper signature in
 * this tree (`(root = repoRoot)`) and what makes the DOCS GATE see this
 * file as a derived reader of docs/tasks (the card's third criterion).
 */
export const repoRoot = path.resolve(here, "..", "..", "..");

/**
 * THIS repository's own board — the directory `cardFile` reads when no
 * other is named, and the site that makes this file a DERIVED READER of
 * docs/tasks to the docs gate (the card's third criterion).
 */
export const TASKS_DIR = path.join(repoRoot, "docs", "tasks");

/** The integration branch when none is named. docs/CONVENTIONS.md's lane bullet spells it. */
export const DEFAULT_BRANCH = "main";

/** @param {string} root @param {string[]} args @returns {{ ok: true, out: string } | { ok: false, err: string }} */
export function git(root, args) {
  const r = spawnSync("git", ["-C", root, ...args], { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  if (r.error !== undefined && r.error !== null) return { ok: false, err: r.error.message };
  if (r.status !== 0) return { ok: false, err: String(r.stderr ?? "").trim() || `git exited ${String(r.status)}` };
  return { ok: true, out: String(r.stdout ?? "") };
}

/**
 * The card file for one id, found by its own `id:` line rather than by
 * its filename — a slug is a convenience and the frontmatter is the fact.
 *
 * @param {string} id
 * @param {string} [dir] the board to read; THIS repository's when omitted
 * @returns {{ file: string } | { problem: string }}
 */
export function cardFile(id, dir = TASKS_DIR) {
  if (!existsSync(dir)) return { problem: `${dir} is not a directory` };
  const hits = readdirSync(dir)
    .filter((n) => n.endsWith(".md"))
    .filter((n) => {
      const text = readFileSync(path.join(dir, n), "utf8");
      return new RegExp(`^id: ${id}\\s*$`, "m").test(text);
    })
    .sort();
  if (hits.length === 0) return { problem: `no card in docs/tasks/ carries \`id: ${id}\`` };
  if (hits.length > 1) {
    return { problem: `${String(hits.length)} cards carry \`id: ${id}\`: ${hits.join(", ")}` };
  }
  return { file: path.join("docs", "tasks", /** @type {string} */ (hits[0])) };
}

/** The raw `touches:` tokens a card declares. @param {string} text @returns {string[]} */
export function touchesTokens(text) {
  const line = /^touches:\s*\[(.*)\]\s*$/m.exec(text);
  if (line === null) return [];
  return /** @type {string} */ (line[1])
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

/**
 * The fence a card reserves, through the project's ONE expansion.
 *
 * @param {{ root: string, id: string, file: string, tokens: string[] }} input
 * @returns {{ paths: string[] } | { problem: string }}
 */
export function expandFence(input) {
  const expander = path.join(input.root, ".claude", "hooks", "expand-fence.mjs");
  if (!existsSync(expander)) {
    return {
      problem:
        `${path.relative(input.root, expander)} is not in this project, and it is the ONE ` +
        "expansion a fence comparison may use — there is deliberately no weaker fallback",
    };
  }
  const r = spawnSync(process.execPath, [expander], {
    input: JSON.stringify({ touches: input.tokens, id: input.id, file: input.file }),
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
  });
  if (r.error !== undefined && r.error !== null) {
    return { problem: `the fence expander could not be started (${r.error.message})` };
  }
  if (r.status !== 0) {
    return {
      problem: `the fence expander exited ${String(r.status)} — ${String(r.stderr ?? "").trim() || "it said nothing"}`,
    };
  }
  /** @type {unknown} */
  let parsed;
  try {
    parsed = JSON.parse(String(r.stdout ?? ""));
  } catch {
    return { problem: "the fence expander printed no readable JSON" };
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { problem: "the fence expander printed no object" };
  }
  const paths = /** @type {Record<string, unknown>} */ (parsed)["paths"];
  if (!Array.isArray(paths) || !paths.every((p) => typeof p === "string")) {
    return { problem: "the fence expander's answer carries no `paths`" };
  }
  return { paths: /** @type {string[]} */ (paths) };
}

/** @param {string} p @param {readonly string[]} fence @returns {boolean} */
export function insideFence(p, fence) {
  return fence.some((domain) => p === domain || p.startsWith(`${domain.replace(/\/$/, "")}/`));
}

/**
 * @typedef {object} Merge
 * @property {string} sha
 * @property {string} subject
 */

/**
 * Every first-parent merge on `branch`, newest first.
 *
 * DELIBERATELY WITHOUT THEIR DIFFS. A diff per merge is a git process
 * per merge, and this repository's integration branch already carries
 * more than a hundred of them; the diffs that are actually needed are a
 * bounded set (the candidates, and the merges since the landing one), so
 * they are asked for one at a time by `pathsOf`.
 *
 * @param {string} root
 * @param {string} branch
 * @returns {{ merges: Merge[] } | { problem: string }}
 */
export function firstParentMerges(root, branch) {
  const log = git(root, ["log", "--first-parent", "--merges", "--format=%H%x1f%s", branch]);
  if (!log.ok) return { problem: `git log on ${branch} failed — ${log.err}` };
  /** @type {Merge[]} */
  const merges = [];
  for (const line of log.out.split("\n").filter((l) => l.length > 0)) {
    const [sha, subject] = line.split("\x1f");
    if (sha === undefined) continue;
    merges.push({ sha, subject: subject ?? "" });
  }
  return { merges };
}

/**
 * The paths ONE merge's own diff carried — `M^1..M`, the pair THE RANGE
 * RULE names for a merge that already exists.
 *
 * @param {string} root
 * @param {string} sha
 * @returns {string[]}
 */
export function pathsOf(root, sha) {
  const diff = git(root, ["diff", "--name-only", `${sha}^1`, sha]);
  return diff.ok ? diff.out.split("\n").filter((l) => l.length > 0) : [];
}

/**
 * The merge that landed this card.
 *
 * THE PRIMARY FACT IS THE LANE, not the card file: the side a merge
 * brought in carries a commit whose message names the card, which is the
 * executor's own step 6 rule and is true of every lane this method has
 * ever merged. The card file is the TIE-BREAKER, used only when more
 * than one merge answers to the first fact — a checkpoint touches every
 * card it stamps, so the file alone would be ambiguous by construction.
 * Where the two together do not single out exactly one merge this
 * REFUSES rather than taking the newest.
 *
 * @param {{ root: string, id: string, cardPath: string, merges: readonly Merge[] }} input
 * @returns {{ merge: Merge } | { problem: string }}
 */
export function landingMerge(input) {
  const named = input.merges.filter((m) => {
    const side = git(input.root, ["log", "--format=%s", `${m.sha}^1..${m.sha}^2`]);
    if (!side.ok) return false;
    return side.out.split("\n").some((s) => s.includes(input.id));
  });
  if (named.length === 0) {
    return {
      problem:
        `no first-parent merge on this branch merged a side whose commits name ${input.id} — ` +
        "the executor's own rule is that a lane's commits carry the card id, and without one " +
        "this command will not guess which merge landed the card",
    };
  }
  if (named.length === 1) return { merge: /** @type {Merge} */ (named[0]) };
  const alsoCarryingTheCard = named.filter((m) => pathsOf(input.root, m.sha).includes(input.cardPath));
  if (alsoCarryingTheCard.length === 1) {
    return { merge: /** @type {Merge} */ (alsoCarryingTheCard[0]) };
  }
  return {
    problem:
      `${String(named.length)} merges merged a side naming ${input.id}` +
      `${alsoCarryingTheCard.length > 0 ? `, ${String(alsoCarryingTheCard.length)} of them also carrying ${input.cardPath}` : ""}: ` +
      `${named.map((m) => `${m.sha.slice(0, 12)} ${m.subject}`).join(" | ")}. ` +
      "Name the one you mean with --merge <sha>.",
  };
}

/**
 * Every merge NEWER than `landing` on the same branch whose own diff
 * touched the card's fence.
 *
 * @param {{ root: string, merges: readonly Merge[], landing: Merge, fence: readonly string[] }} input
 * @returns {Merge[]}
 */
export function laterOnTheFence(input) {
  const at = input.merges.findIndex((m) => m.sha === input.landing.sha);
  if (at < 0) return [];
  // `merges` is newest first, so everything BEFORE the landing merge is later.
  return input.merges
    .slice(0, at)
    .filter((m) => pathsOf(input.root, m.sha).some((p) => insideFence(p, input.fence)));
}

/**
 * The verdict, given the later merges and what `--force` named.
 *
 * @param {{ later: readonly Merge[], forced: readonly string[] }} input
 * @returns {{ ok: true } | { refusal: string, code: number }}
 */
export function forceVerdict(input) {
  const laterShas = new Set(input.later.map((m) => m.sha));
  const unknown = input.forced.filter((f) => !laterShas.has(f));
  if (unknown.length > 0) {
    return {
      code: EXIT.USAGE,
      refusal:
        `--force named ${unknown.map((s) => s.slice(0, 12)).join(", ")}, which is not one of the ` +
        "later merges on this fence. --force is not a blanket override: it names the specific " +
        "later merge you have read and accepted.",
    };
  }
  const unnamed = input.later.filter((m) => !input.forced.includes(m.sha));
  if (unnamed.length > 0) {
    return {
      code: EXIT.FOUND,
      refusal:
        `REFUSED — ${String(unnamed.length)} merge(s) have landed on this card's fence since it ` +
        "was merged, and reverting it would revert across them:\n" +
        unnamed.map((m) => `  ${m.sha.slice(0, 12)}  ${m.subject}`).join("\n") +
        "\n  Read each one, then re-run naming it: " +
        unnamed.map((m) => `--force ${m.sha.slice(0, 12)}`).join(" "),
    };
  }
  return { ok: true };
}

/** @returns {string} */
export function usageText() {
  return [
    "usage: supertaskr undo <T-NNN> [--root <path>] [--branch <name>] [--merge <sha>]",
    "                     [--force <sha>]... [--dry-run]",
    "",
    "  Reverts the merge that landed one card (git revert -m 1), after listing every",
    "  later merge that touched the same fence. Refuses while one is unnamed.",
    "  exit: 0 reverted (or printed under --dry-run) · 1 refused, later merges stand ·",
    "        2 called wrong · 3 could not run",
  ].join("\n");
}

/**
 * @param {string[]} argv
 * @param {{ cwd?: string, out?: (s: string) => void, err?: (s: string) => void }} [io]
 * @returns {number}
 */
export function main(argv, io = {}) {
  const out = io.out ?? ((/** @type {string} */ s) => process.stdout.write(`${s}\n`));
  const err = io.err ?? ((/** @type {string} */ s) => process.stderr.write(`${s}\n`));
  const cwd = io.cwd ?? process.cwd();

  /** @type {string | undefined} */
  let id;
  let root = cwd;
  let branch = DEFAULT_BRANCH;
  /** @type {string | undefined} */
  let namedMerge;
  /** @type {string[]} */
  const forced = [];
  let dryRun = false;
  for (let i = 0; i < argv.length; i += 1) {
    const a = /** @type {string} */ (argv[i]);
    if (a === "--help") {
      out(usageText());
      return EXIT.CLEAN;
    }
    if (a === "--dry-run") {
      dryRun = true;
      continue;
    }
    if (a === "--root") {
      root = path.resolve(/** @type {string} */ (argv[++i] ?? cwd));
      continue;
    }
    if (a === "--branch") {
      branch = /** @type {string} */ (argv[++i] ?? DEFAULT_BRANCH);
      continue;
    }
    if (a === "--merge") {
      namedMerge = argv[++i];
      continue;
    }
    if (a === "--force") {
      const sha = argv[++i];
      if (sha === undefined) {
        err(`undo: --force takes the sha of the later merge you accept.\n${usageText()}`);
        return EXIT.USAGE;
      }
      forced.push(sha);
      continue;
    }
    if (a.startsWith("-")) {
      err(`undo: unknown flag ${a}.\n${usageText()}`);
      return EXIT.USAGE;
    }
    if (id !== undefined) {
      err(`undo: one card at a time — already given ${id}, then ${a}.\n${usageText()}`);
      return EXIT.USAGE;
    }
    id = a;
  }
  if (id === undefined) {
    err(`undo: name the card to undo.\n${usageText()}`);
    return EXIT.USAGE;
  }

  const card = cardFile(id, path.join(root, "docs", "tasks"));
  if ("problem" in card) {
    err(`undo ${id}: CANNOT RUN — ${card.problem}`);
    return EXIT.CANNOT_RUN;
  }

  const dirty = git(root, ["status", "--porcelain", "--untracked-files=no"]);
  if (!dirty.ok) {
    err(`undo ${id}: CANNOT RUN — ${dirty.err}`);
    return EXIT.CANNOT_RUN;
  }
  if (dirty.out.trim().length > 0) {
    err(
      `undo ${id}: CANNOT RUN — the working tree carries tracked changes. A revert on a dirty ` +
        `tree cannot be told from the changes already in it:\n${dirty.out.trimEnd()}`,
    );
    return EXIT.CANNOT_RUN;
  }

  const tokens = touchesTokens(readFileSync(path.join(root, card.file), "utf8"));
  if (tokens.length === 0) {
    err(`undo ${id}: CANNOT RUN — ${card.file} declares no \`touches:\`, so it has no fence to compare`);
    return EXIT.CANNOT_RUN;
  }
  const fence = expandFence({ root, id, file: card.file, tokens });
  if ("problem" in fence) {
    err(`undo ${id}: CANNOT RUN — ${fence.problem}`);
    return EXIT.CANNOT_RUN;
  }

  const listed = firstParentMerges(root, branch);
  if ("problem" in listed) {
    err(`undo ${id}: CANNOT RUN — ${listed.problem}`);
    return EXIT.CANNOT_RUN;
  }

  /** @type {Merge} */
  let landing;
  if (namedMerge === undefined) {
    const found = landingMerge({ root, id, cardPath: card.file, merges: listed.merges });
    if ("problem" in found) {
      err(`undo ${id}: CANNOT RUN — ${found.problem}`);
      return EXIT.CANNOT_RUN;
    }
    landing = found.merge;
  } else {
    const full = git(root, ["rev-parse", `${namedMerge}^{commit}`]);
    if (!full.ok) {
      err(`undo ${id}: CANNOT RUN — --merge ${namedMerge} does not resolve (${full.err})`);
      return EXIT.CANNOT_RUN;
    }
    const sha = full.out.trim();
    const hit = listed.merges.find((m) => m.sha === sha);
    if (hit === undefined) {
      err(`undo ${id}: CANNOT RUN — ${sha.slice(0, 12)} is not a first-parent merge on ${branch}`);
      return EXIT.CANNOT_RUN;
    }
    landing = hit;
  }

  /** @type {string[]} */
  const forcedFull = [];
  for (const f of forced) {
    const full = git(root, ["rev-parse", `${f}^{commit}`]);
    if (!full.ok) {
      err(`undo ${id}: --force ${f} does not resolve to a commit (${full.err})`);
      return EXIT.USAGE;
    }
    forcedFull.push(full.out.trim());
  }

  const later = laterOnTheFence({ root, merges: listed.merges, landing, fence: fence.paths });
  out(`undo ${id}`);
  out(`  card:   ${card.file}`);
  out(`  fence:  ${fence.paths.join(", ")}`);
  out(`  merge:  ${landing.sha.slice(0, 12)}  ${landing.subject}`);
  out(
    `  since:  ${String(later.length)} later merge(s) on this fence` +
      (later.length === 0 ? "" : `\n${later.map((m) => `    ${m.sha.slice(0, 12)}  ${m.subject}`).join("\n")}`),
  );

  const verdict = forceVerdict({ later, forced: forcedFull });
  if ("refusal" in verdict) {
    err(`undo ${id}: ${verdict.refusal}`);
    return verdict.code;
  }

  const command = `git -C ${root} revert -m 1 --no-edit ${landing.sha}`;
  if (dryRun) {
    out(`  --dry-run, nothing was run. The command is:\n    ${command}`);
    return EXIT.CLEAN;
  }
  const reverted = git(root, ["revert", "-m", "1", "--no-edit", landing.sha]);
  if (!reverted.ok) {
    err(`undo ${id}: the revert did not complete — ${reverted.err}\n  it was run as: ${command}`);
    return EXIT.FOUND;
  }
  out(reverted.out.trimEnd());
  out(`  reverted ${landing.sha.slice(0, 12)} with: ${command}`);
  return EXIT.CLEAN;
}

// THE SAME BOOTSTRAP `gate-run.mjs` USES, and for the same reason: this
// module is imported by `tests/cli.spec.ts` for its derivations, so its
// execution cannot be at module scope. The path-mismatch hazard the
// token lint's wrapper warns about does not reach here — `cli.mjs`
// spawns this file by its ABSOLUTE resolved path — and a hand run
// (`node scripts/undo.mjs T-NNN`) resolves the same way.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main(process.argv.slice(2)));
}
