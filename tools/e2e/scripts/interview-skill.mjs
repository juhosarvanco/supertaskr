/**
 * interview-skill.mjs — generates `method/skills/supertaskr-interview/SKILL.md`
 * from the canonical interview sources (T-242, ADR-021 decision 3).
 *
 * ── WHY A GENERATOR AND NOT AN AUTHORED FILE ─────────────────────────
 * The card's contract is ONE interview in TWO LENSES: the app's runner
 * and a Claude Code session must consume the SAME bytes of the banks, so
 * the two cannot drift. A hand-written skill file would be a second copy
 * of the method, and a second copy of a rule is two chances to disagree
 * (T-057). So every normative byte in the generated file is COPIED, at
 * generation time, out of the file that already owns it:
 *
 *   · the banks + the normative banking map  method/interview/plan-interview.md
 *   · stage 8                                method/interview/decomposition.md
 *   · the resume + overwrite rules           method/roles/planner.md (two sections)
 *   · the governing-document templates       method/docs-templates/**
 *   · the root adapter files                 method/adapters/*.md
 *   · the task-card skeleton                 method/tasks/T-000-template.md
 *   · the kit root the seeds land at         app/src-tauri/src/agent/kit.rs
 *                                            (`KIT_REL_DIR` — the RUNNER'S
 *                                            own code, never restated here)
 *
 * Only the FRAMING — the prose that says in what order to do these
 * things, how to read a seed block, and what to say at the end — is
 * authored, and it is authored HERE, once.
 *
 * ── WHY THE FILE IS SELF-CONTAINED ───────────────────────────────────
 * The owner's ruling of 2026-09-14 (question 2): one generated SKILL.md,
 * ON THE CONDITION that it is genuinely self-contained — "copying the
 * banks alone is insufficient, the fresh-project demonstration must
 * complete the interview's whole file contract without the checkout or
 * the app". So the file carries its seed FILES too, as fenced blocks
 * labelled with the path each one lands at, and a fresh folder that has
 * only this one file can write the whole stage-0 contract from it.
 * `materialize` below is the machine reading of exactly the rule the
 * file's own prose gives a session, so the fresh-project body measures
 * the DELIVERED BYTES rather than a fixture that shares their source.
 *
 * ── WHAT DOES NOT RIDE, SAID RATHER THAN LEFT TO BE FOUND ────────────
 * `method/tasks/TASK-FORMAT.md` (53760 bytes at 5656a05) and
 * `method/roles/planner.md` whole. Both are deliberate: the app's own
 * discoverer caps one `SKILL.md` at 64 KiB
 * (`app/src-tauri/src/agent/skills.rs`, `MAX_SKILL_BYTES`), TASK-FORMAT
 * alone would breach it, and planner.md's step 4 points AT TASK-FORMAT —
 * so carrying planner.md whole would ship a pointer to a file the folder
 * does not have, which is the half-carried pack `kit.rs` already refuses.
 * The two sections the card's criterion 1 actually names (the resume rule
 * and the overwrite rule) ride verbatim instead, and the procedure spine
 * is the banking map's own, not a paraphrase of planner.md.
 *
 * MODES (the house exit contract — 0 clean · 1 the gate's verdict ·
 * 2 called wrong · 3 could not run):
 *    node scripts/interview-skill.mjs           regenerate the file
 *    node scripts/interview-skill.mjs --check   write nothing; exit 1 if
 *                                               the committed file differs
 *                                               from a fresh generation
 *    node scripts/interview-skill.mjs --stage   the `prepack` step: generate
 *                                               afresh, REFUSE if the committed
 *                                               file differs, and write the
 *                                               tarball's own copy under dist/
 *    node scripts/interview-skill.mjs --unstage the `postpack` step: remove it
 *
 * Output is DETERMINISTIC: no timestamp, no environment, sources read in
 * a fixed order — so `--check` is a byte comparison and a clean
 * regeneration is a 0-byte diff.
 */

import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const e2eRoot = path.resolve(here, "..");
const defaultRepoRoot = path.resolve(e2eRoot, "..", "..");

/** The four house exit codes. */
export const EXIT = Object.freeze({ CLEAN: 0, FOUND: 1, USAGE: 2, CANNOT_RUN: 3 });

/** The pack's directory name — and therefore `/supertaskr-interview`. */
export const SKILL_NAME = "supertaskr-interview";

/** Where the generated file is committed, from the repo root (POSIX). */
export const SKILL_REL = `method/skills/${SKILL_NAME}/SKILL.md`;

/**
 * The fence every embedded block uses.
 *
 * FOUR backticks, not three: an embedded source is free to contain a
 * three-backtick fence of its own, and the generator REFUSES rather than
 * emitting a block that would terminate early (see `assertFenceSafe`).
 */
export const FENCE = "````";

/** Info-string word for a block that is WRITTEN to disk at its path. */
export const SEED_INFO = "supertaskr-seed";

/** Info-string word for a block carried for READING, with no destination. */
export const SOURCE_INFO = "supertaskr-source";

/**
 * THE CLOSING LINE, in the words the owner's ruling 6 of 2026-09-14
 * gives it. It names the app's real control — `app/src/App.tsx` carries
 * the label "Open folder…" — because T-243 has not landed, so there is
 * no URL scheme and no folder argument to print, and a skill that
 * printed one would be printing an unimplemented command.
 */
export const CLOSING_LINE =
  "The project plan and the initial task board are saved in this folder. " +
  'To view them in Supertaskr, open the app and choose "Open folder…". ' +
  "The files can also be worked on in this coding-agent session.";

/** The empty directories stage 0 creates, from the banking map's row 0. */
export const EMPTY_DIRS = Object.freeze(["docs/decisions", "docs/tasks", "docs/rooms"]);

/** The line stage 0 ensures `.gitignore` carries, from the banking map's row 0. */
export const GITIGNORE_LINE = ".supertaskr/";

/**
 * The kit root the app's runner materializes into, READ OUT OF THE
 * RUNNER'S OWN CODE.
 *
 * The card's criterion 1 says the banked paths are "derived from the
 * runner's own code, never restated here", and this is that derivation:
 * a literal `".supertaskr/genesis/kit"` in this file would be a second
 * copy of `kit.rs`'s `KIT_REL_DIR`, and the two would drift the day
 * somebody moved it.
 *
 * @param {string} repoRoot
 * @returns {string}
 */
export function kitRelDir(repoRoot) {
  const rs = readFileSync(path.join(repoRoot, "app", "src-tauri", "src", "agent", "kit.rs"), "utf8");
  const m = /pub const KIT_REL_DIR: &str = "([^"]+)";/.exec(rs);
  if (m === null || m[1] === undefined) {
    throw new Error(
      "app/src-tauri/src/agent/kit.rs no longer declares KIT_REL_DIR in the shape this " +
        "generator reads it — the kit root is the RUNNER'S, so fix the read rather than " +
        "restating the path here (T-242 criterion 1).",
    );
  }
  return m[1];
}

/**
 * The include_str! source path `kit.rs` compiles in for one kit-relative
 * entry, as a repo-root-relative POSIX path.
 *
 * This is the app lens's half of the prompt-parity measurement: the
 * runner consumes THESE bytes, and the generated skill must consume the
 * same ones. Reading the table out of the Rust source is the precedent
 * `app/test/genesis-derive.test.ts` set — a body re-reads the method file
 * and asserts the table verbatim rather than trusting a transcription.
 *
 * @param {string} kitRs the text of app/src-tauri/src/agent/kit.rs
 * @param {string} rel   the kit-relative path, e.g. "interview/plan-interview.md"
 * @returns {string | null} repo-root-relative path, or null when the table has no such entry
 */
export function kitSourceFor(kitRs, rel) {
  const entries = [...kitRs.matchAll(/rel:\s*"([^"]+)"\s*,\s*content:\s*include_str!\(\s*"([^"]+)"/g)];
  for (const m of entries) {
    if (m[1] !== rel) continue;
    const raw = m[2] ?? "";
    // The path is relative to app/src-tauri/src/agent/ — the file the
    // macro sits in. Normalise it against that directory, then make it
    // repo-root-relative and POSIX.
    const abs = path.posix.normalize(path.posix.join("app/src-tauri/src/agent", raw));
    return abs;
  }
  return null;
}

/**
 * Refuse a source that would break out of its own fence.
 *
 * A block whose body carries a line of four-or-more backticks would end
 * the fence early and turn the rest of the method into prose the reader
 * silently mis-parses. Nothing in `method/` does today; this is the guard
 * that keeps it that way rather than a comment hoping so.
 *
 * @param {string} label
 * @param {string} body
 */
export function assertFenceSafe(label, body) {
  for (const line of body.split("\n")) {
    if (/^\s*`{4,}/.test(line)) {
      throw new Error(
        `${label} carries a line opening with four or more backticks, which would terminate ` +
          "its own fence in the generated skill. Raise FENCE in interview-skill.mjs (and the " +
          "reader in `blocks`) rather than trimming the method.",
      );
    }
  }
}

/**
 * Every file under a method directory, as POSIX paths relative to it.
 *
 * @param {string} dir
 * @param {string} [prefix]
 * @returns {string[]}
 */
export function walkRel(dir, prefix = "") {
  /** @type {string[]} */
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
    if (entry.name.startsWith(".")) continue;
    const rel = prefix === "" ? entry.name : `${prefix}/${entry.name}`;
    if (entry.isDirectory()) out.push(...walkRel(path.join(dir, entry.name), rel));
    else out.push(rel);
  }
  return out;
}

/**
 * One named section of a markdown file, heading line included.
 *
 * @param {string} md
 * @param {string} heading the exact heading line, e.g. "## Resume rule"
 * @returns {string}
 */
export function section(md, heading) {
  const start = md.indexOf(`\n${heading}\n`);
  if (start < 0) {
    throw new Error(
      `the section ${JSON.stringify(heading)} is gone from its source — the generator quotes ` +
        "method text by HEADING, so a renamed heading is a refusal rather than a silent omission",
    );
  }
  const from = start + 1;
  const rest = md.slice(from + heading.length);
  const end = rest.indexOf("\n## ");
  return (end < 0 ? md.slice(from) : md.slice(from, from + heading.length + end)).replace(/\s+$/, "");
}

/**
 * THE CANONICAL SOURCES, read once, in a fixed order.
 *
 * @param {string} repoRoot
 */
export function sources(repoRoot) {
  /** @param {string} rel */
  const read = (rel) => readFileSync(path.join(repoRoot, rel), "utf8");
  const templatesDir = path.join(repoRoot, "method", "docs-templates");
  const adaptersDir = path.join(repoRoot, "method", "adapters");
  return {
    kitRel: kitRelDir(repoRoot),
    planInterview: read("method/interview/plan-interview.md"),
    decomposition: read("method/interview/decomposition.md"),
    planner: read("method/roles/planner.md"),
    cardTemplate: read("method/tasks/T-000-template.md"),
    templates: walkRel(templatesDir).map((rel) => ({ rel, body: read(`method/docs-templates/${rel}`) })),
    adapters: walkRel(adaptersDir).map((rel) => ({ rel, body: read(`method/adapters/${rel}`) })),
  };
}

/**
 * THE SEED PLAN — every file the generated skill carries WITH a
 * destination, in the order it is written.
 *
 * The destinations are derived, never typed: the `docs/` tree is the
 * banking map's row 0 ("docs/ tree copied verbatim from docs-templates/")
 * applied to whatever `method/docs-templates/` really holds; the adapter
 * files land at the project root because the same row says "adapter files
 * at project root"; and the two interview files plus the card skeleton
 * land under the RUNNER'S OWN kit root, so a folder interviewed by this
 * skill and a folder interviewed by the app carry the same bytes at the
 * same paths.
 *
 * @param {ReturnType<typeof sources>} src
 * @returns {{ to: string, from: string, body: string }[]}
 */
export function seedPlan(src) {
  /** @type {{ to: string, from: string, body: string }[]} */
  const plan = [];
  for (const t of src.templates) {
    plan.push({ to: `docs/${t.rel}`, from: `method/docs-templates/${t.rel}`, body: t.body });
  }
  for (const a of src.adapters) {
    plan.push({ to: a.rel, from: `method/adapters/${a.rel}`, body: a.body });
  }
  plan.push({
    to: `${src.kitRel}/interview/plan-interview.md`,
    from: "method/interview/plan-interview.md",
    body: src.planInterview,
  });
  plan.push({
    to: `${src.kitRel}/interview/decomposition.md`,
    from: "method/interview/decomposition.md",
    body: src.decomposition,
  });
  plan.push({
    to: `${src.kitRel}/tasks/T-000-template.md`,
    from: "method/tasks/T-000-template.md",
    body: src.cardTemplate,
  });
  return plan;
}

/**
 * One fenced block.
 *
 * @param {string} info the whole info string after the fence
 * @param {string} body
 * @returns {string}
 */
function fenced(info, body) {
  assertFenceSafe(info, body);
  const withNewline = body.endsWith("\n") ? body : `${body}\n`;
  // No trailing newline: the caller's `join("\n")` supplies the line
  // break, and a blank line after a block is an explicit "" part. A
  // global whitespace collapse would reach INSIDE these blocks.
  return `${FENCE}${info}\n${withNewline}${FENCE}`;
}

/**
 * READ the blocks back out of a generated skill file.
 *
 * This is the machine form of the rule the file's own prose states to a
 * session, so what the fresh-project body materializes is what a reader
 * of the delivered file would write. It reads ONLY the text it is given:
 * no path, no checkout, no fallback — which is what makes a body built on
 * it a fresh-project body rather than one bridged through this tree.
 *
 * @param {string} text
 * @returns {{ kind: string, path: string, content: string }[]}
 */
export function blocks(text) {
  /** @type {{ kind: string, path: string, content: string }[]} */
  const out = [];
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? "";
    if (!line.startsWith(FENCE)) continue;
    const info = line.slice(FENCE.length).trim();
    const sp = info.indexOf(" ");
    const kind = sp < 0 ? info : info.slice(0, sp);
    if (kind !== SEED_INFO && kind !== SOURCE_INFO) continue;
    const rel = sp < 0 ? "" : info.slice(sp + 1).trim();
    const body = [];
    let j = i + 1;
    for (; j < lines.length; j += 1) {
      if ((lines[j] ?? "") === FENCE) break;
      body.push(lines[j] ?? "");
    }
    out.push({ kind, path: rel, content: body.length === 0 ? "" : `${body.join("\n")}\n` });
    i = j;
  }
  return out;
}

/**
 * MATERIALIZE the delivered file's stage-0 contract into a folder.
 *
 * Text in, files out — and nothing else reaches it. The empty
 * directories and the `.gitignore` line are the rest of the banking
 * map's row 0; an existing `.gitignore` is APPENDED to, never replaced,
 * because the row says "carrying `.supertaskr/`" and a folder may
 * already have one.
 *
 * @param {string} text the delivered SKILL.md's bytes
 * @param {string} targetDir
 * @returns {{ written: string[], dirs: string[] }}
 */
export function materialize(text, targetDir) {
  /** @type {string[]} */
  const written = [];
  for (const block of blocks(text)) {
    if (block.kind !== SEED_INFO) continue;
    const to = path.join(targetDir, ...block.path.split("/"));
    mkdirSync(path.dirname(to), { recursive: true });
    writeFileSync(to, block.content);
    written.push(block.path);
  }
  for (const dir of EMPTY_DIRS) {
    mkdirSync(path.join(targetDir, ...dir.split("/")), { recursive: true });
  }
  const ignore = path.join(targetDir, ".gitignore");
  const had = existsSync(ignore) ? readFileSync(ignore, "utf8") : "";
  if (!had.split(/\r?\n/).includes(GITIGNORE_LINE)) {
    writeFileSync(ignore, had === "" || had.endsWith("\n") ? `${had}${GITIGNORE_LINE}\n` : `${had}\n${GITIGNORE_LINE}\n`);
  }
  return { written, dirs: [...EMPTY_DIRS] };
}

/**
 * THE GENERATED FILE.
 *
 * @param {string} [repoRoot]
 * @returns {string}
 */
export function renderSkill(repoRoot = defaultRepoRoot) {
  const src = sources(repoRoot);
  const plan = seedPlan(src);
  // The two interview files are seeds AND the sections a session reads
  // inline, so they are emitted once, in place, rather than twice: a
  // second copy of the banks inside one file is the very duplication
  // this generator exists to refuse.
  const seedFor = (/** @type {string} */ from) => {
    const hit = plan.find((s) => s.from === from);
    if (hit === undefined) throw new Error(`the seed plan carries no entry from ${from}`);
    return hit;
  };
  const inlineBanks = seedFor("method/interview/plan-interview.md");
  const inlineDecomposition = seedFor("method/interview/decomposition.md");
  const tailSeeds = plan.filter((s) => !s.from.startsWith("method/interview/"));
  const resume = section(src.planner, "## Resume rule");
  const overwrite = section(src.planner, "## Never overwrite real content");
  const parts = [];

  parts.push(
    "---",
    `name: ${SKILL_NAME}`,
    // The cap the app's own discoverer applies TRUNCATES rather than
    // refuses (skills.rs, MAX_DESCRIPTION_CHARS), so a trigger clause
    // pushed past it vanishes in silence. kit.rs measures this.
    "description: Run the Supertaskr genesis interview in this folder and land a dispatchable " +
      "task board: the seven banks one question at a time, each answer written to disk as it " +
      "is confirmed, then decomposition into cards. Use when a folder has no plan yet, or the " +
      "user asks to plan or scope a new project.",
    "when: The user wants a new project planned — no docs/NORTH_STAR.md and no docs/tasks/ " +
      "board exists yet, or a genesis interview was started in this folder and stopped part " +
      "way through and should be resumed.",
    "---",
    "",
    "<!-- GENERATED - do not edit by hand (T-242, ADR-021 decision 3).",
    "     Regenerate:  npm run skill        (from tools/e2e/)",
    "     Currency:    npm run skill:check  (exit 1 when this file is stale)",
    "     Generator:   tools/e2e/scripts/interview-skill.mjs",
    "",
    "     Every block below is copied, byte for byte, out of the file that",
    "     owns it. Editing this file instead of its source makes the two",
    "     lenses of one interview disagree, which is the single thing this",
    "     file exists to prevent. -->",
    "",
    "# The genesis interview",
    "",
    "You run project genesis in THIS FOLDER: one interview, banked to disk",
    "as it happens, ending in a decomposed, dispatchable milestone 1. Your",
    "conversation is disposable; only what you bank exists.",
    "",
    "**THIS FILE IS THE WHOLE METHOD FOR THIS JOB.** It needs no checkout",
    "of Supertaskr, no installed app, and no network. Everything it tells",
    "you to copy is inside it, in a fenced block labelled with the path",
    "that block lands at.",
    "",
    "**ONE QUESTION AT A TIME, NEVER A WALL.** Shallow batch answers are",
    "the failure mode this interview exists to prevent. Challenge weak",
    "answers instead of transcribing them, and open such a turn with the",
    'literal prefix "pushing back:".',
    "",
    "**BANK AS YOU GO.** The moment an answer is confirmed, write the",
    "artifacts its stage names. Never batch the writing to the end: a kill",
    "at any stage must leave every earlier stage on disk. An answer is",
    'banked when the human confirms it - or when they skip ("skip", "you',
    'decide", no answer), in which case you bank your own best assumption',
    "marked `[?]`. A `[?]` item is resolved or roomed later, never silently",
    "deleted.",
    "",
    "## Harness coverage - read this before you claim anything about it",
    "",
    "This entry is delivered for **Claude Code only**. Codex support is",
    "**deferred and unverified for this entry**: the prompt-file route has",
    "not been measured for this interview and is not claimed proven, and",
    "nothing here narrows the product's provider-flexible goal - any agent",
    "that reads files can hold any role. If you are not running in Claude",
    "Code, say so plainly rather than reporting a coverage you did not",
    "measure.",
    "",
    "## 0. The scaffold - before any question",
    "",
    "Write the seed files this file carries. A seed block opens with a",
    `line of ${String(FENCE.length)} backticks followed by \`${SEED_INFO}\` and the path that`,
    "block lands at, relative to this folder, and ends at the next line",
    `that is exactly ${String(FENCE.length)} backticks; everything between those two lines is`,
    "the file, byte for byte. Copy them VERBATIM - the templates are",
    "scaffold-safe, their examples live in comments - and then:",
    "",
    `- create the empty directories ${EMPTY_DIRS.map((d) => `\`${d}/\``).join(", ")};`,
    `- ensure \`.gitignore\` exists and carries a \`${GITIGNORE_LINE}\` line (append if missing);`,
    "- `git init` if this folder is not a repository;",
    "- stamp `docs/STATE.md`: the Updated line filled in, In progress =",
    '  "genesis interview running - next stage: 1 (Q1)".',
    "",
    "**TWO SPELLINGS, BOTH ABOUT HOW YOU TOUCH THE DISK, NEITHER A NEW",
    "CAPABILITY.** Run `git` BARE, in your own working directory - that",
    "directory IS the project directory, so a directory-changing form",
    "(`git -C <dir> ...`) is redundant and agent runtimes commonly treat it",
    "as a different and more dangerous operation than its bare twin. Write",
    "files with your runtime's write tool, not with a shell redirect",
    "(`> file`): a redirect whose target the shell builds is the shape a",
    "command analyser refuses without reading. Both were measured on a live",
    "genesis, where three separate refusals each cost a turn of reasoning.",
    "",
    "## 1. Organization skill packs in this folder",
    "",
    "Before the first question, look for `.claude/skills/*/SKILL.md` in",
    "this folder. Each one that parses is an ORGANIZATION SKILL PACK: read",
    "it and follow its guidance where its conditions apply - it is the",
    "organization's own policy for this project. Name every pack you",
    "loaded, with its path, in your first turn, so the record says which",
    "policy shaped the plan. Their precedence against the method is NOT yet",
    "decided, so where a pack and this file conflict, SAY SO in your turn",
    "instead of choosing silently. A pack that does not parse - no",
    "frontmatter, no `name`, no `description` - is reported by its",
    "directory name and skipped, never absorbed and never a crash. Read",
    "them; write nothing into that directory. It is a READ surface: this",
    "entry got there because the user ran an install command, and nothing",
    "in the interview installs, moves or deletes anything under it.",
    "",
    "## 2. The interview - the banks",
    "",
    "The block below is `method/interview/plan-interview.md` - the same",
    "bytes the app's own runner compiles in for exactly this, which is what",
    "makes the two lenses one interview. Its banking map is NORMATIVE: a",
    "stage's artifacts are written the moment that stage's answer is",
    "banked. Where it names `roles/planner.md` for the driver contract, the",
    "resume rule and the overwrite rule, those two rules are in section 4",
    "of THIS file; where it names `docs-templates/`, those templates are",
    "the seed blocks at the end of this file.",
    "",
    "**IT IS ALSO A SEED**, so write it to disk at the path on its fence",
    "line as part of the scaffold - that is the kit path the app uses, so a",
    "folder interviewed here and a folder interviewed in the app carry the",
    "same file in the same place.",
    "",
    fenced(`${SEED_INFO} ${inlineBanks.to}`, src.planInterview),
    "",
    "## 3. Stage 8 - decomposition",
    "",
    "After Q7, run the decomposition below in this same session. Task cards",
    "use the skeleton carried as a seed block at",
    `\`${src.kitRel}/tasks/T-000-template.md\`; copy it per card and fill it in.`,
    "This block is a seed too - write it to disk at the path on its fence",
    "line.",
    "",
    "**WHERE THE STEP BELOW POINTS AT `tasks/TASK-FORMAT.md`, THAT FILE IS",
    "NOT HERE.** It is larger than this whole entry is allowed to be, so",
    "what rides instead is the card skeleton and the criteria rules the",
    "step states itself. Use them; do not go looking for the document, and",
    "do not invent what you imagine is in it. A project that later adopts",
    "the method whole gets it with the rest of the method.",
    "",
    fenced(`${SEED_INFO} ${inlineDecomposition.to}`, src.decomposition),
    "",
    "## 4. The resume rule, and never overwriting real content",
    "",
    "Both are quoted verbatim from `method/roles/planner.md`, the role this",
    "skill is the Claude Code lens of.",
    "",
    "**THE OVERWRITE RULE POINTS AT AN ARCHAEOLOGY FILE THAT IS NOT HERE",
    "EITHER, AND THAT IS THE ANSWER RATHER THAN A GAP.** Adopting a folder",
    "that already holds real work is not this entry's job. The rule's own",
    "instruction is the whole of what you do about it: stop, and ask the",
    "human, instead of writing over what is there.",
    "",
    fenced(`${SOURCE_INFO} method/roles/planner.md#resume-rule`, resume),
    "",
    fenced(`${SOURCE_INFO} method/roles/planner.md#never-overwrite-real-content`, overwrite),
    "",
    "## 5. After the board - the cold-start test and the commit",
    "",
    "Run the cold-start test the banks end with: a fresh session reads only",
    "`docs/` and explains the project back - vision, current state, next",
    "dispatch and why. Every gap in its answer is a documentation bug: fix",
    "the docs and repeat until a cold session passes. Then commit the",
    "genesis (task-sized commits during it are fine; at minimum one at the",
    "end). Before you end, the succession rule: anything you decided,",
    "noticed or intend that is not yet in a file goes into one NOW. Your",
    "successor may be a different model reading the folder cold - leave it",
    "a project, not a puzzle.",
    "",
    "## 6. When the interview ends",
    "",
    "Say exactly this, and then STOP:",
    "",
    `> ${CLOSING_LINE}`,
    "",
    "**Do not start a second interview.** Do not offer a command to open",
    "the app on this folder: there is none yet, and naming one would be",
    "naming a command that does not exist. The manual way above is the",
    "whole of it.",
    "",
    "## 7. The rest of the seed files",
    "",
    "One block per file, and the two blocks in sections 2 and 3 are seeds",
    "as well. The path on the fence line is where that file lands, relative",
    "to this folder; the bytes between the fences are the file. Write them",
    "exactly - no reflowing, no renaming, no summarising.",
    "",
  );

  for (const seed of tailSeeds) {
    parts.push(`### \`${seed.to}\``, "", `Verbatim from \`${seed.from}\`.`, "", fenced(`${SEED_INFO} ${seed.to}`, seed.body), "");
  }

  const text = `${parts.join("\n").replace(/\n+$/, "")}\n`;

  // THE ROUND TRIP, CHECKED HERE RATHER THAN HOPED FOR. Every block this
  // file emits must read back byte-identical through the same reader the
  // fresh-project body uses; otherwise the delivered file is a document
  // that LOOKS complete and materializes something else.
  const read = new Map(blocks(text).map((b) => [`${b.kind} ${b.path}`, b.content]));
  for (const seed of plan) {
    const got = read.get(`${SEED_INFO} ${seed.to}`);
    if (got !== (seed.body.endsWith("\n") ? seed.body : `${seed.body}\n`)) {
      throw new Error(
        `the seed block for ${seed.to} does not read back byte-identical - the generated skill ` +
          "would materialize something other than the method's own bytes",
      );
    }
  }
  return text;
}

/**
 * WHICH SKILLS THE PACKAGE MAY CARRY, and it is a DERIVED rule rather
 * than a list.
 *
 * The installer copies exactly one file per skill — `SKILL.md` — so a
 * pack whose `SKILL.md` points at references and scripts BESIDE IT
 * (`method/skills/supertaskr-seat/` is five files) cannot travel through
 * it whole: every "see the file beside this one" would resolve to
 * nothing in the folder it landed in. Inside a checkout that is already
 * the shipped behaviour and a user can read the rest off the tree; into
 * a FRESH FOLDER it would be a new dead pointer this card created. So
 * the staging carries the packs that are ONE FILE, names the ones it
 * skipped and why, and nobody has to remember a list.
 *
 * @param {string} repoRoot
 * @returns {{ carried: string[], skipped: { name: string, files: number }[] }}
 */
export function stagePlan(repoRoot) {
  const root = path.join(repoRoot, "method", "skills");
  /** @type {string[]} */
  const carried = [];
  /** @type {{ name: string, files: number }[]} */
  const skipped = [];
  if (!existsSync(root)) return { carried, skipped };
  for (const entry of readdirSync(root, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
    if (!entry.isDirectory()) continue;
    const files = walkRel(path.join(root, entry.name));
    if (!files.includes("SKILL.md")) continue;
    if (files.length === 1) carried.push(entry.name);
    else skipped.push({ name: entry.name, files: files.length });
  }
  return { carried, skipped };
}

/**
 * STAGE the tarball's own copy — generated at pack time from the
 * canonical sources, never copied off the committed artifact.
 *
 * The generated skill is written from `renderSkill`'s own bytes, and the
 * committed file is then REQUIRED to match them: a pack of a stale tree
 * refuses rather than shipping two different files under one name.
 *
 * @param {string} repoRoot
 * @param {string} stageRoot the package's staging root (…/dist)
 * @param {string} generated the freshly generated skill text
 * @returns {{ staged: string[], skipped: { name: string, files: number }[] }}
 */
export function stage(repoRoot, stageRoot, generated) {
  const { carried, skipped } = stagePlan(repoRoot);
  /** @type {string[]} */
  const staged = [];
  for (const name of carried) {
    const rel = `method/skills/${name}/SKILL.md`;
    const to = path.join(stageRoot, ...rel.split("/"));
    mkdirSync(path.dirname(to), { recursive: true });
    // The entry this card generates is staged from the GENERATION, not
    // from the file on disk; any other one-file pack is staged from its
    // own bytes, which are its only source.
    writeFileSync(to, rel === SKILL_REL ? generated : readFileSync(path.join(repoRoot, rel), "utf8"));
    staged.push(rel);
  }
  return { staged, skipped };
}

/**
 * @param {readonly string[]} argv
 * @param {{ repoRoot?: string, stageRoot?: string, out?: (s: string) => void, err?: (s: string) => void }} [io]
 * @returns {number}
 */
export function main(argv, io = {}) {
  const repoRoot = io.repoRoot ?? defaultRepoRoot;
  const stageRoot = io.stageRoot ?? path.join(e2eRoot, "dist");
  const out = io.out ?? ((/** @type {string} */ s) => process.stdout.write(`${s}\n`));
  const err = io.err ?? ((/** @type {string} */ s) => process.stderr.write(`${s}\n`));
  const MODES = ["--check", "--stage", "--unstage"];
  const unknown = argv.filter((a) => !MODES.includes(a));
  if (unknown.length > 0) {
    err(
      `interview-skill.mjs: unknown argument ${JSON.stringify(unknown[0])} - ` +
        `usage: interview-skill.mjs [${MODES.join("|")}]`,
    );
    return EXIT.USAGE;
  }
  if (argv.includes("--unstage")) {
    rmSync(stageRoot, { recursive: true, force: true });
    out(`interview-skill.mjs: removed the pack staging at ${stageRoot}.`);
    return EXIT.CLEAN;
  }
  /** @type {string} */
  let text;
  try {
    text = renderSkill(repoRoot);
  } catch (e) {
    err(`interview-skill.mjs: CANNOT RUN - ${e instanceof Error ? e.message : String(e)}`);
    return EXIT.CANNOT_RUN;
  }
  const target = path.join(repoRoot, ...SKILL_REL.split("/"));
  const committed = existsSync(target) ? readFileSync(target, "utf8") : null;
  if (argv.includes("--stage")) {
    if (committed !== text) {
      err(
        `interview-skill.mjs: REFUSED to pack - ${SKILL_REL} is stale against a fresh ` +
          "generation, so the tarball and the tree would carry two different files under one " +
          "name. Run `npm run skill` from tools/e2e/ and commit the result first.",
      );
      return EXIT.FOUND;
    }
    const { staged, skipped } = stage(repoRoot, stageRoot, text);
    for (const rel of staged) out(`interview-skill.mjs: staged ${rel} for the tarball.`);
    for (const s of skipped) {
      out(
        `interview-skill.mjs: NOT staged - method/skills/${s.name}/ is ${String(s.files)} files and ` +
          "the installer carries one per skill, so a fresh folder would get dead pointers.",
      );
    }
    if (staged.length === 0) {
      err("interview-skill.mjs: nothing was staged - the tarball would carry no skill at all.");
      return EXIT.CANNOT_RUN;
    }
    return EXIT.CLEAN;
  }
  if (argv.includes("--check")) {
    if (committed === text) {
      out(`interview-skill.mjs: ${SKILL_REL} is current (${String(Buffer.byteLength(text))} bytes).`);
      return EXIT.CLEAN;
    }
    err(
      `interview-skill.mjs: STALE - ${SKILL_REL} differs from a fresh generation ` +
        `(committed ${committed === null ? "absent" : `${String(Buffer.byteLength(committed))} bytes`}, ` +
        `generated ${String(Buffer.byteLength(text))} bytes).\n` +
        "  Run `npm run skill` from tools/e2e/ and commit the result.\n" +
        "  THE COMMON CAUSE IS A METHOD BUMP: `--bump` rewrites the version stamp in\n" +
        "  method/interview/plan-interview.md, which this file carries verbatim.",
    );
    return EXIT.FOUND;
  }
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, text);
  out(
    `interview-skill.mjs: wrote ${SKILL_REL} (${String(Buffer.byteLength(text))} bytes)` +
      `${committed === text ? " - unchanged" : ""}.`,
  );
  return EXIT.CLEAN;
}

if (process.argv[1] !== undefined && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  // `process.exitCode`, never `process.exit()` (T-216-s1): a command that
  // ends at process.exit drops whatever stdout has not drained, which is
  // invisible to a file and to a TTY and silent to a pipe.
  process.exitCode = main(process.argv.slice(2));
}
