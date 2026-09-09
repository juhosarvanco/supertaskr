#!/usr/bin/env node
/**
 * THE GOLDEN CHECK — the pack's own tool, and the reason
 * `references/golden-lane.md` is a contract rather than an impression.
 *
 * A skill-driven turn and a hand-driven one must leave the same files.
 * This program compares what a turn actually landed against the golden,
 * **FIELD BY FIELD**. A prose claim that the files match is not the
 * check; this is.
 *
 * THE SPLIT IS THE SAME ONE `SKILL.md` KEEPS WITH `host-commands.md`:
 * the golden owns the FIELD SET, this program owns the COMPARISON. Every
 * field checked below is read out of `references/golden-lane.md`'s own
 * `GOLDEN>` lines at run time — nothing here carries a second copy of the
 * field list, because a rule with two statements is two chances to
 * disagree.
 *
 * ZERO DEPENDENCIES AND NO INSTALL, deliberately: it must answer against
 * a bare checkout, the way the token lint and the method evals do.
 *
 * GRAMMAR of a golden line — one field, one check kind, one optional
 * argument:
 *
 *     GOLDEN> <artifact>.<field> :: <kind> [argument]
 *
 * usage:
 *   node golden-check.mjs --repo <dir> [--root <repo root>] [--card <path>]
 *                         [--stamp <sha>] [--manifest <path>]
 *                         [--branch <ref>] [--worktree <dir>]
 *                         [--golden <path>]
 *   node golden-check.mjs --selftest [--golden <path>]
 *
 * EXIT CODES, the four house codes: 0 every supplied artifact matches ·
 * 1 the check HAS a verdict (a field differs) · 2 called wrong · 3 the
 * check COULD NOT RUN (the golden is unreadable, or carries no fields).
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const EXIT = Object.freeze({ CLEAN: 0, VERDICT: 1, USAGE: 2, CANNOT_RUN: 3 });

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_GOLDEN = path.join(HERE, "..", "references", "golden-lane.md");

/* ------------------------------------------------------------------ */
/* the golden: parse its GOLDEN> lines into fields                      */
/* ------------------------------------------------------------------ */

/**
 * @typedef {{ artifact: string, field: string, kind: string, arg: string, line: number }} Field
 */

/** @param {string} text @returns {Field[]} */
function parseGolden(text) {
  /** @type {Field[]} */
  const fields = [];
  text.split("\n").forEach((raw, i) => {
    // The KIND may carry digits (`hash40`); an earlier `[a-z-]+` silently
    // truncated it to `hash` and the field answered "unknown check kind",
    // which is a DIFF — so the baseline failed and said so. Kept as a
    // note because the failure mode is a grammar that half-matches.
    const m = raw.match(/^\s*GOLDEN>\s+([a-z]+)\.([A-Za-z0-9_-]+)\s+::\s+([a-z0-9-]+)\s*(.*?)\s*$/);
    if (!m) return;
    fields.push({ artifact: m[1], field: m[2], kind: m[3], arg: m[4], line: i + 1 });
  });
  return fields;
}

/* ------------------------------------------------------------------ */
/* small readers — each answers a value or throws a reason              */
/* ------------------------------------------------------------------ */

/** @param {string[]} args @param {string} cwd */
const git = (args, cwd) =>
  execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

/** The frontmatter block of a card, as an ordered list of [key, value]. */
function frontmatterPairs(text) {
  const lines = text.split("\n");
  if (lines[0] !== "---") return [];
  /** @type {[string, string][]} */
  const out = [];
  for (let i = 1; i < lines.length && lines[i] !== "---"; i += 1) {
    const m = lines[i].match(/^([A-Za-z_][A-Za-z0-9_]*):\s?(.*)$/);
    if (m) out.push([m[1], m[2]]);
  }
  return out;
}

/** Which frontmatter keys a commit's diff MOVED, and the card it touched. */
function stampFacts(repo, sha) {
  const files = git(["show", "--name-only", "--format=", sha], repo).split("\n").filter(Boolean);
  const subject = git(["show", "-s", "--format=%s", sha], repo).trim();
  const patch = git(["show", "--format=", "-U0", sha], repo);
  /** @type {Set<string>} */
  const moved = new Set();
  for (const line of patch.split("\n")) {
    if (!/^[+-][^+-]/.test(line)) continue;
    const m = line.slice(1).match(/^([A-Za-z_][A-Za-z0-9_]*):/);
    if (m) moved.add(m[1]);
  }
  /** @type {Map<string,string>} */
  const after = new Map();
  if (files.length === 1) {
    const text = git(["show", `${sha}:${files[0]}`], repo);
    for (const [k, v] of frontmatterPairs(text)) after.set(k, v.trim());
  }
  return { files, subject, moved, after };
}

/** The `## Verdicts` section of a card, as text. */
function verdictSection(cardText) {
  const lines = cardText.split("\n");
  const start = lines.findIndex((l) => /^##\s+Verdicts\s*$/.test(l));
  if (start < 0) return null;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i += 1) {
    if (/^##\s+/.test(lines[i])) {
      end = i;
      break;
    }
  }
  return lines.slice(start + 1, end).join("\n");
}

/* ------------------------------------------------------------------ */
/* the comparison — one function per check kind                         */
/* ------------------------------------------------------------------ */

/**
 * @typedef {{ ok: boolean|null, why: string }} Answer
 * `ok: null` means the artifact for this field was not supplied.
 */

/** @param {Field} f @param {any} ctx @returns {Answer} */
function check(f, ctx) {
  const skip = (what) => ({ ok: null, why: `no ${what} supplied` });

  switch (f.artifact) {
    case "stamp": {
      if (!ctx.stamp) return skip("--stamp");
      const s = ctx.stamp;
      switch (f.kind) {
        case "frontmatter-moved":
          return s.moved.has(f.field)
            ? { ok: true, why: `the stamp moves ${f.field}:` }
            : { ok: false, why: `the stamp does NOT move ${f.field}:` };
        case "frontmatter-may-move":
          return {
            ok: true,
            why: s.moved.has(f.field) ? `${f.field}: moved (allowed)` : `${f.field}: unmoved (allowed)`,
          };
        case "frontmatter-value": {
          const got = s.after.get(f.field);
          return got === f.arg
            ? { ok: true, why: `${f.field}: is ${f.arg}` }
            : { ok: false, why: `${f.field}: is ${JSON.stringify(got)}, golden says ${f.arg}` };
        }
        case "commit-one-file-under":
          return s.files.length === 1 && s.files[0].startsWith(f.arg)
            ? { ok: true, why: `one file, ${s.files[0]}` }
            : { ok: false, why: `${s.files.length} file(s): ${s.files.join(", ")}` };
        case "commit-subject-matches": {
          const re = new RegExp(f.arg);
          return re.test(s.subject)
            ? { ok: true, why: `subject matches /${f.arg}/` }
            : { ok: false, why: `subject ${JSON.stringify(s.subject)} does not match /${f.arg}/` };
        }
        case "frontmatter-unmoved-otherwise": {
          const allowed = new Set(ctx.stampAllowed);
          const extra = [...s.moved].filter((k) => !allowed.has(k));
          return extra.length === 0
            ? { ok: true, why: `nothing else in the frontmatter moved` }
            : { ok: false, why: `the stamp also moved: ${extra.join(", ")}` };
        }
        default:
          return { ok: false, why: `unknown check kind ${f.kind}` };
      }
    }

    case "manifest": {
      if (!ctx.manifest) return skip("--manifest");
      const keys = Object.keys(ctx.manifest);
      switch (f.kind) {
        case "json-key-ordered": {
          const want = Number(f.arg);
          return keys[want - 1] === f.field
            ? { ok: true, why: `key ${want} is ${f.field}` }
            : { ok: false, why: `key ${want} is ${JSON.stringify(keys[want - 1])}, golden says ${f.field}` };
        }
        case "json-key-count":
          return keys.length === Number(f.arg)
            ? { ok: true, why: `${keys.length} top-level fields` }
            : { ok: false, why: `${keys.length} top-level fields, golden says ${f.arg}` };
        case "json-token-key": {
          const toks = ctx.manifest.tokens;
          if (!Array.isArray(toks) || toks.length === 0)
            return { ok: false, why: `tokens[] is absent or empty` };
          const bad = toks.filter((t) => !Object.prototype.hasOwnProperty.call(t, f.field));
          return bad.length === 0
            ? { ok: true, why: `every tokens entry carries ${f.field}` }
            : { ok: false, why: `${bad.length} tokens entry/entries lack ${f.field}` };
        }
        case "json-token-key-count": {
          const toks = ctx.manifest.tokens ?? [];
          const bad = toks.filter((t) => Object.keys(t).length !== Number(f.arg));
          return bad.length === 0
            ? { ok: true, why: `every tokens entry carries exactly ${f.arg} fields` }
            : { ok: false, why: `${bad.length} tokens entry/entries do not carry ${f.arg} fields` };
        }
        case "equals-card-touches": {
          if (!ctx.cardText) return skip("--card");
          const want = ctx.cardText
            .split("\n")
            .find((l) => l.startsWith("touches:"));
          const got = ctx.manifest[f.field];
          return want !== undefined && got === want
            ? { ok: true, why: `the pair agrees: ${got}` }
            : {
                ok: false,
                why: `HALF-PERFORMED WIDENING — manifest ${JSON.stringify(got)} vs card ${JSON.stringify(want)}`,
              };
        }
        case "hash40":
          return /^[0-9a-f]{40}$/.test(String(ctx.manifest[f.field]))
            ? { ok: true, why: `${f.field} is a full hash` }
            : { ok: false, why: `${f.field} is ${JSON.stringify(ctx.manifest[f.field])}, not a 40-hex hash` };
        case "absolute-path":
          return path.isAbsolute(String(ctx.manifest[f.field] ?? ""))
            ? { ok: true, why: `${f.field} is absolute` }
            : { ok: false, why: `${f.field} is not an absolute path` };
        default:
          return { ok: false, why: `unknown check kind ${f.kind}` };
      }
    }

    case "lane": {
      switch (f.kind) {
        case "branch-matches": {
          if (!ctx.branch) return skip("--branch");
          const re = new RegExp(f.arg);
          return re.test(ctx.branch)
            ? { ok: true, why: `${ctx.branch} matches /${f.arg}/` }
            : { ok: false, why: `${ctx.branch} does not match /${f.arg}/` };
        }
        case "worktree-sibling": {
          // `--root` is the REPOSITORY ROOT the lane must be a sibling
          // of, and it is separate from `--repo` on purpose: `--repo` is
          // the checkout git objects are read from, and a lane checking
          // its own dispatch reads them from ITSELF rather than from the
          // integration checkout, which no seat but the integrator's may
          // run anything in.
          if (!ctx.worktree || !(ctx.root ?? ctx.repo)) return skip("--worktree");
          const wt = path.resolve(ctx.worktree);
          const repo = path.resolve(ctx.root ?? ctx.repo);
          const inside = wt === repo || wt.startsWith(repo + path.sep);
          const sibling = path.dirname(wt) === path.dirname(repo);
          return !inside && sibling
            ? { ok: true, why: `${wt} is a sibling of ${repo}` }
            : { ok: false, why: inside ? `${wt} is INSIDE the repository` : `${wt} is not a sibling of ${repo}` };
        }
        case "worktree-absolute": {
          if (!ctx.worktree) return skip("--worktree");
          return path.isAbsolute(ctx.worktree)
            ? { ok: true, why: `the worktree is spelled absolutely` }
            : { ok: false, why: `the worktree is spelled relatively — it resolves against the dispatching shell's cwd` };
        }
        default:
          return { ok: false, why: `unknown check kind ${f.kind}` };
      }
    }

    case "verdict": {
      if (ctx.verdict === undefined) return skip("--card");
      if (ctx.verdict === null) return { ok: false, why: `the card has no "## Verdicts" section` };
      // A lane before its verdict has the HEADING and nothing under it.
      // That is not a differing field, it is an artifact not yet landed
      // — so it SKIPS by name. A card with no heading at all is the
      // DIFF above, because the section is where the record goes.
      if (ctx.verdict.trim() === "")
        return { ok: null, why: `the card's ## Verdicts section is empty — no verdict landed yet` };
      switch (f.kind) {
        case "section-regex": {
          const re = new RegExp(f.arg);
          return re.test(ctx.verdict)
            ? { ok: true, why: `matches /${f.arg}/` }
            : { ok: false, why: `no match for /${f.arg}/` };
        }
        case "section-regex-line": {
          const re = new RegExp(f.arg, "m");
          return re.test(ctx.verdict)
            ? { ok: true, why: `matches /${f.arg}/ on a line of its own` }
            : { ok: false, why: `no line matches /${f.arg}/` };
        }
        case "section-regex-optional": {
          const re = new RegExp(f.arg, "m");
          return { ok: true, why: re.test(ctx.verdict) ? `present` : `absent (conditional field)` };
        }
        default:
          return { ok: false, why: `unknown check kind ${f.kind}` };
      }
    }

    default:
      return { ok: false, why: `unknown artifact ${f.artifact}` };
  }
}

/* ------------------------------------------------------------------ */
/* the run                                                              */
/* ------------------------------------------------------------------ */

/** @param {Field[]} fields @param {any} ctx */
function run(fields, ctx, label) {
  let differed = 0;
  let compared = 0;
  let skipped = 0;
  const lines = [];
  for (const f of fields) {
    const a = check(f, ctx);
    const name = `${f.artifact}.${f.field}`;
    if (a.ok === null) {
      skipped += 1;
      lines.push(`  SKIP ${name} — ${a.why}`);
    } else if (a.ok) {
      compared += 1;
      lines.push(`  OK   ${name} — ${a.why}`);
    } else {
      compared += 1;
      differed += 1;
      lines.push(`  DIFF ${name} — ${a.why}`);
    }
  }
  return { differed, compared, skipped, report: `${label}\n${lines.join("\n")}` };
}

/* ------------------------------------------------------------------ */
/* --selftest: degrade a COPY of each artifact and require a DIFF       */
/* ------------------------------------------------------------------ */

/**
 * A NEGATIVE ASSERTION NEEDS A POSITIVE CONTROL, applied to this checker.
 * Each case below hands the comparison an artifact that LACKS the
 * property and requires it to be caught; a case the checker passes is a
 * selftest failure, because a check nobody has watched fail is a claim.
 */
function selftest(fields) {
  const dir = mkdtempSync(path.join(tmpdir(), "golden-selftest-"));
  const repo = path.join(dir, "repo");
  mkdirSync(path.join(repo, "docs", "tasks"), { recursive: true });
  const cardRel = "docs/tasks/T-000-selftest.md";
  const good = [
    "---",
    "id: T-000",
    "status: building",
    "touches: [method/]",
    "builder: a@b",
    "verifier: c@d",
    "review: independent",
    "---",
    "",
    "## Verdicts",
    "",
    "### 2026-01-01 — c@d — APPROVED",
    "",
    "attack set: sha256:" + "a".repeat(64) + " (attack-set-T-000.md)",
    "Blindness: two spawns, phase 1 held no file tools.",
    "",
  ].join("\n");
  writeFileSync(path.join(repo, cardRel), good);

  const env = { ...process.env, GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_SYSTEM: "/dev/null" };
  const g = (args) =>
    execFileSync("git", args, { cwd: repo, encoding: "utf8", env, stdio: ["ignore", "pipe", "pipe"] });
  g(["init", "-b", "main"]);
  g(["config", "user.email", "selftest@example.invalid"]);
  g(["config", "user.name", "golden selftest"]);
  // the BEFORE state: a planned card, no seats
  writeFileSync(
    path.join(repo, cardRel),
    good.replace("status: building", "status: planned").replace("builder: a@b", "builder:").replace("verifier: c@d", "verifier:"),
  );
  g(["add", "-A"]);
  g(["commit", "-q", "-m", "file T-000"]);
  writeFileSync(path.join(repo, cardRel), good);
  g(["add", "-A"]);
  g(["commit", "-q", "-m", "T-000: dispatch stamp — status: building, builder: a@b, verifier: c@d"]);
  const sha = g(["rev-parse", "HEAD"]).trim();

  const manifest = {
    version: 1,
    writtenAt: "2026-01-01T00:00:00.000Z",
    writtenFrom: repo,
    ref: "0".repeat(40),
    taskId: "T-000",
    branch: "refs/heads/task/T-000-selftest",
    worktree: path.join(path.dirname(repo), "repo-T-000"),
    card: cardRel,
    touchesLine: "touches: [method/]",
    paths: ["method"],
    excluded: [],
    alwaysWritable: ["docs/tasks"],
    tokens: [{ raw: "method/", normalized: "method", kind: "path", components: [], paths: ["method"] }],
  };
  const cardText = readFileSync(path.join(repo, cardRel), "utf8");
  const base = () => ({
    repo,
    stamp: stampFacts(repo, sha),
    stampAllowed: fields
      .filter((f) => f.artifact === "stamp" && /^frontmatter-(moved|may-move)$/.test(f.kind))
      .map((f) => f.field),
    manifest: JSON.parse(JSON.stringify(manifest)),
    cardText,
    verdict: verdictSection(cardText),
    branch: manifest.branch,
    worktree: manifest.worktree,
  });

  // the control arm must PASS first — a selftest whose baseline already
  // fails proves nothing about the degradations below.
  const baseline = run(fields, base(), "baseline (undegraded)");
  const cases = [
    [
      "a stamp that moves a FOURTH frontmatter field",
      () => {
        const c = base();
        c.stamp.moved.add("priority");
        return c;
      },
    ],
    [
      "a stamp landing on status: planned",
      () => {
        const c = base();
        c.stamp.after.set("status", "planned");
        return c;
      },
    ],
    [
      "a stamp commit touching two files",
      () => {
        const c = base();
        c.stamp.files = [cardRel, "docs/STATE.md"];
        return c;
      },
    ],
    [
      "a stamp commit whose subject names neither the card nor a dispatch",
      () => {
        const c = base();
        // NOT "Dispatch T-000 — some prose": that is the PRE-ARM hand
        // spelling, which the golden's subject line deliberately admits.
        // A control has to lack the property, not wear another spelling
        // of it.
        c.stamp.subject = "wip: tidy up the board";
        return c;
      },
    ],
    [
      "a manifest missing a top-level field",
      () => {
        const c = base();
        delete c.manifest.excluded;
        return c;
      },
    ],
    [
      "a manifest whose top-level fields are REORDERED (same set, keys 1 and 2 swapped)",
      () => {
        const c = base();
        const m = c.manifest;
        const swapped = {};
        const keys = Object.keys(m);
        [keys[1], keys[0]] = [keys[0], keys[1]];
        for (const k of keys) swapped[k] = m[k];
        c.manifest = swapped;
        return c;
      },
    ],
    [
      "a tokens entry missing one of its five fields",
      () => {
        const c = base();
        delete c.manifest.tokens[0].components;
        return c;
      },
    ],
    [
      "a HALF-PERFORMED WIDENING — the manifest widened, the card not",
      () => {
        const c = base();
        c.manifest.touchesLine = "touches: [method/, app/src-tauri/src/agent/kit.rs]";
        return c;
      },
    ],
    [
      "a lane worktree INSIDE the repository",
      () => {
        const c = base();
        c.worktree = path.join(repo, "worktrees", "T-000");
        return c;
      },
    ],
    [
      "a branch that is not a task branch",
      () => {
        const c = base();
        c.branch = "refs/heads/feature/T-000";
        return c;
      },
    ],
    [
      "a verdict with no attack-set digest line",
      () => {
        const c = base();
        c.verdict = (c.verdict ?? "").split("\n").filter((l) => !l.startsWith("attack set:")).join("\n");
        return c;
      },
    ],
    [
      "a verdict with no word — neither APPROVED nor REJECTED",
      () => {
        const c = base();
        c.verdict = (c.verdict ?? "").replace(/APPROVED/g, "looks fine to me");
        return c;
      },
    ],
    [
      "a verdict that discloses no blindness at all",
      () => {
        const c = base();
        c.verdict = (c.verdict ?? "").split("\n").filter((l) => !/[Bb]lind/.test(l)).join("\n");
        return c;
      },
    ],
    [
      "a card with no ## Verdicts section at all",
      () => {
        const c = base();
        c.verdict = null;
        return c;
      },
    ],
    [
      "a manifest ref that is a short sha rather than a full hash",
      () => {
        const c = base();
        c.manifest.ref = "0f3e7ae";
        return c;
      },
    ],
    [
      "a lane worktree spelled RELATIVELY",
      () => {
        const c = base();
        c.worktree = "../repo-T-000";
        return c;
      },
    ],
  ];

  // An EMPTY `## Verdicts` section is not a degradation — a lane before
  // its verdict legitimately has one — so it is asserted to SKIP rather
  // than to be caught, and the assertion is here beside the cases that
  // must be caught so the two are never confused.
  const emptyVerdict = run(fields, { ...base(), verdict: "\n" }, "an empty ## Verdicts section");
  const emptyVerdictOk = emptyVerdict.differed === 0 && emptyVerdict.skipped > 0;

  const out = [];
  out.push(`golden fields loaded: ${fields.length}`);
  out.push(
    `baseline: ${baseline.compared} compared, ${baseline.differed} differed, ${baseline.skipped} skipped`,
  );
  let failures = baseline.differed > 0 ? 1 : 0;
  if (baseline.differed > 0) {
    out.push(`  FAIL the undegraded baseline already differs — the degradations below prove nothing`);
    out.push(baseline.report);
  }
  let caught = 0;
  for (const [name, make] of cases) {
    const r = run(fields, make(), name);
    if (r.differed > 0) {
      caught += 1;
      out.push(`  CAUGHT  ${name} (${r.differed} field(s) differed)`);
    } else {
      failures += 1;
      out.push(`  MISSED  ${name} — the check PASSED an artifact that lacks the property`);
    }
  }
  out.push(`degradations: ${cases.length} · caught ${caught} · missed ${cases.length - caught}`);
  if (emptyVerdictOk) {
    out.push(`  SKIPPED an empty ## Verdicts section (${emptyVerdict.skipped} field(s)) — a lane before its verdict is not a defect`);
  } else {
    failures += 1;
    out.push(
      `  FAIL an empty ## Verdicts section was graded rather than skipped (${emptyVerdict.differed} differed, ${emptyVerdict.skipped} skipped)`,
    );
  }
  console.log(out.join("\n"));
  return failures === 0 ? EXIT.CLEAN : EXIT.VERDICT;
}

/* ------------------------------------------------------------------ */
/* argv                                                                 */
/* ------------------------------------------------------------------ */

function main(argv) {
  /** @type {Record<string,string|boolean>} */
  const opt = {};
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (!a.startsWith("--")) return usage(`unexpected argument ${JSON.stringify(a)}`);
    const key = a.slice(2);
    if (key === "selftest") opt[key] = true;
    else {
      const v = argv[i + 1];
      if (v === undefined || v.startsWith("--")) return usage(`--${key} wants a value`);
      opt[key] = v;
      i += 1;
    }
  }

  const goldenPath = String(opt.golden ?? DEFAULT_GOLDEN);
  let goldenText;
  try {
    goldenText = readFileSync(goldenPath, "utf8");
  } catch (err) {
    console.error(`golden-check: CANNOT RUN — ${goldenPath} is unreadable: ${err.message}`);
    return EXIT.CANNOT_RUN;
  }
  const fields = parseGolden(goldenText);
  if (fields.length === 0) {
    console.error(
      `golden-check: CANNOT RUN — ${goldenPath} carries no GOLDEN> field lines, so the comparison would be vacuous`,
    );
    return EXIT.CANNOT_RUN;
  }

  if (opt.selftest) return selftest(fields);

  const repo = opt.repo ? path.resolve(String(opt.repo)) : null;
  if (!repo) return usage("--repo is required (or --selftest)");
  if (!existsSync(repo)) {
    console.error(`golden-check: CANNOT RUN — ${repo} does not exist`);
    return EXIT.CANNOT_RUN;
  }

  /** @type {any} */
  const ctx = {
    repo,
    root: opt.root ? path.resolve(String(opt.root)) : repo,
    stampAllowed: fields.filter((f) => f.artifact === "stamp" && /^frontmatter-(moved|may-move)$/.test(f.kind)).map((f) => f.field),
  };
  try {
    if (opt.stamp) ctx.stamp = stampFacts(repo, String(opt.stamp));
    if (opt.manifest) ctx.manifest = JSON.parse(readFileSync(String(opt.manifest), "utf8"));
    if (opt.card) {
      ctx.cardText = readFileSync(path.resolve(repo, String(opt.card)), "utf8");
      ctx.verdict = verdictSection(ctx.cardText);
    }
    if (opt.branch) ctx.branch = String(opt.branch);
    if (opt.worktree) ctx.worktree = String(opt.worktree);
  } catch (err) {
    console.error(`golden-check: CANNOT RUN — ${err.message}`);
    return EXIT.CANNOT_RUN;
  }

  const r = run(fields, ctx, `golden: ${goldenPath}`);
  console.log(r.report);
  console.log(
    `golden fields: ${fields.length} · compared ${r.compared} · differed ${r.differed} · skipped ${r.skipped}`,
  );
  if (r.compared === 0) {
    console.error(
      "golden-check: CANNOT RUN — zero fields were compared; supply at least one artifact (--stamp / --manifest / --card / --branch / --worktree)",
    );
    return EXIT.CANNOT_RUN;
  }
  return r.differed === 0 ? EXIT.CLEAN : EXIT.VERDICT;
}

function usage(why) {
  console.error(`golden-check: ${why}`);
  console.error(
    "usage: golden-check.mjs --repo <dir> [--card <path>] [--stamp <sha>] [--manifest <path>] [--branch <ref>] [--worktree <dir>] [--golden <path>]",
  );
  console.error("       golden-check.mjs --selftest [--golden <path>]");
  return EXIT.USAGE;
}

process.exit(main(process.argv.slice(2)));
