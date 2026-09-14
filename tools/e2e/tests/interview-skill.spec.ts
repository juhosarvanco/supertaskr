import { execFileSync } from "node:child_process";
import {
  chmodSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { repoRoot } from "../preflight";
import {
  CARRIED_SKILLS_ROOT,
  EXIT as CLI_EXIT,
  HARNESSES,
  VERBS,
  main as cliMain,
  packageRoot,
  runInstall,
  shippedSkills,
  skillSourceRoot,
} from "../scripts/cli.mjs";
import {
  CLOSING_LINE,
  EMPTY_DIRS,
  FENCE,
  GITIGNORE_LINE,
  SEED_INFO,
  SKILL_NAME,
  SKILL_REL,
  SOURCE_INFO,
  blocks,
  kitRelDir,
  kitSourceFor,
  main as skillMain,
  materialize,
  renderSkill,
  seedPlan,
  sources,
  stagePlan,
  walkRel,
} from "../scripts/interview-skill.mjs";
import { removeGitFixture } from "./git-fixture";

/**
 * `/supertaskr-interview` — THE INTERVIEW SKILL'S OWN SPEC (T-242, F-03).
 *
 * ── WHAT THIS FILE IS FOR ────────────────────────────────────────────
 * ADR-021 decision 3 ships the interview as ONE interview in TWO LENSES:
 * the app's runner and a Claude Code session. The card's contract is
 * therefore almost never "the skill works" — it is a RELATION between
 * two things that must not drift, so most bodies here are comparisons:
 *
 *   · the committed `method/skills/supertaskr-interview/SKILL.md` against
 *     a fresh generation, byte for byte (criterion 2);
 *   · every embedded block against the file that owns those bytes, so a
 *     hand edit to the artifact is a red rather than a second copy;
 *   · the skill's banks against the bytes `kit.rs` compiles in for the
 *     app's runner, with a control that reds when EITHER path is pointed
 *     at a different file (criterion 3);
 *   · the file contract a FRESH FOLDER ends up holding against the
 *     method tree's own scaffold set (criterion 1).
 *
 * ── AND THE PROOF THAT A FRESH FOLDER GETS IT IS A FRESH FOLDER ──────
 * One body packs this package with `npm pack`, installs the tarball into
 * a scratch project in the system temp directory that is NOT this
 * repository, runs `supertaskr install` there, and materializes the
 * interview's whole stage-0 file contract out of the DELIVERED BYTES.
 * The card forbids the shortcut by name — *"the source never bridged by
 * copying files into a fabricated method/skills/ inside the fixture"* —
 * so that body asserts the fixture has no `method/skills/` at all, and
 * its control runs the same installer against a package that carries
 * nothing and requires it to REFUSE.
 *
 * Nothing is published: packaging is approved by the owner's ruling 4 of
 * 2026-09-14 and publishing stays @human's (T-266).
 */

/** The scratch trees this file builds, removed in a teardown that cannot red a body. */
const FIXTURE = "interview-skill.spec.ts";

/** @returns a scratch directory that looks like a genesis-created project and is NOT this repo. */
function scratchProject(): string {
  const root = mkdtempSync(path.join(tmpdir(), "supertaskr-skill-"));
  mkdirSync(path.join(root, "docs"), { recursive: true });
  mkdirSync(path.join(root, "method"), { recursive: true });
  return root;
}

/** The committed artifact, read off this checkout at body time. */
function committed(): string {
  return readFileSync(path.join(repoRoot, ...SKILL_REL.split("/")), "utf8");
}

/** `app/src-tauri/src/agent/kit.rs`, the app lens's own source. */
function kitRs(): string {
  return readFileSync(path.join(repoRoot, "app/src-tauri/src/agent/kit.rs"), "utf8");
}

/**
 * A MINIMAL TREE the generator can run against — `method/` and the one
 * Rust file it reads the kit root out of, and nothing else.
 *
 * This is how a control gets made: the generator is pointed at a tree
 * whose SOURCES differ, and the output has to differ with them. Copying
 * the real method tree keeps the control honest — the mutation is the
 * only difference between it and the arrangement under test.
 */
function generatorFixture(): string {
  const root = mkdtempSync(path.join(tmpdir(), "supertaskr-gen-"));
  cpSync(path.join(repoRoot, "method"), path.join(root, "method"), { recursive: true });
  const kit = path.join(root, "app/src-tauri/src/agent");
  mkdirSync(kit, { recursive: true });
  writeFileSync(path.join(kit, "kit.rs"), kitRs());
  return root;
}

test("the committed interview skill is a fresh generation, byte for byte, and a changed source moves it", () => {
  const generated = renderSkill(repoRoot);
  expect(
    committed(),
    `${SKILL_REL} is stale. It is GENERATED: run \`npm run skill\` from tools/e2e/ and commit ` +
      "the result. The common cause is a method bump — `--bump` rewrites the version stamp in " +
      "method/interview/plan-interview.md, which this file carries verbatim.",
  ).toBe(generated);

  // The command's own `--check` half answers the same question through
  // the house exit contract, because that is what CI runs.
  const said: string[] = [];
  expect(
    skillMain(["--check"], { repoRoot, out: (s) => said.push(s), err: (s) => said.push(s) }),
    "`--check` is CLEAN against a current tree",
  ).toBe(0);
  expect(said.join("\n")).toContain("is current");

  // THE CONTROL, and it is what makes the comparison above a reading: a
  // one-line change to a CANONICAL SOURCE must move the generated bytes.
  // Without it "the committed file equals a fresh generation" would also
  // be true of a generator that ignored its sources entirely.
  const fixture = generatorFixture();
  try {
    const template = path.join(fixture, "method/docs-templates/NORTH_STAR.md");
    // A lane's out-of-fence files are read-only in this worktree and
    // `cpSync` preserves the mode, so the control makes its own copy
    // writable before it mutates it.
    chmodSync(template, 0o644);
    writeFileSync(template, `${readFileSync(template, "utf8")}\n<!-- the control's own line -->\n`);
    const moved = renderSkill(fixture);
    expect(moved, "CONTROL FAILED: a changed template left the generated skill unchanged").not.toBe(
      generated,
    );
    expect(moved, "and the change is the one that was made").toContain("the control's own line");

    const ctl: string[] = [];
    expect(
      skillMain(["--check"], { repoRoot: fixture, out: (s) => ctl.push(s), err: (s) => ctl.push(s) }),
      "and `--check` over that tree is the gate's verdict, not CLEAN",
    ).toBe(1);
    expect(ctl.join("\n")).toContain("STALE");
  } finally {
    removeGitFixture(fixture, FIXTURE);
  }
});

test("every embedded block is the owning file's own bytes, so the artifact carries no second copy", () => {
  const text = committed();
  const src = sources(repoRoot);
  const emitted = new Map(blocks(text).map((b) => [`${b.kind} ${b.path}`, b.content]));
  expect(emitted.size, "the artifact carries blocks at all").toBeGreaterThan(0);

  // THE SEEDS: each one's bytes are the method file's bytes. The
  // expectation comes from the METHOD TREE and the produced bytes from
  // the ARTIFACT, so the two do not move together.
  for (const seed of seedPlan(src)) {
    const got = emitted.get(`${SEED_INFO} ${seed.to}`);
    expect(got, `${SKILL_REL} carries no seed for ${seed.to}`).toBeDefined();
    expect(got, `the seed for ${seed.to} is not ${seed.from}'s own bytes`).toBe(
      readFileSync(path.join(repoRoot, seed.from), "utf8"),
    );
  }

  // THE QUOTED SECTIONS: the planner's two rules, quoted rather than
  // paraphrased — the card's criterion 1 names them by name.
  const planner = readFileSync(path.join(repoRoot, "method/roles/planner.md"), "utf8");
  for (const [key, heading] of [
    [`${SOURCE_INFO} method/roles/planner.md#resume-rule`, "## Resume rule"],
    [`${SOURCE_INFO} method/roles/planner.md#never-overwrite-real-content`, "## Never overwrite real content"],
  ] as const) {
    const got = emitted.get(key);
    expect(got, `${SKILL_REL} carries no block for ${heading}`).toBeDefined();
    expect(planner, `${heading} is quoted verbatim from planner.md`).toContain(String(got).trimEnd());
  }

  // AND THERE IS NOTHING ELSE IN THE PACK. One generated file, no second
  // authored copy — the card's criterion 2, measured on the tree.
  const packDir = path.join(repoRoot, "method/skills", SKILL_NAME);
  expect(walkRel(packDir), "the pack is one generated file").toEqual(["SKILL.md"]);
  expect(
    readdirSync(path.join(repoRoot, "tools/e2e/scripts")).filter((n) => n === "interview-skill.mjs"),
    "and exactly one generator writes it",
  ).toEqual(["interview-skill.mjs"]);
});

test("both lenses read the same bytes of the banks, and repointing either one reds it", () => {
  const rel = "interview/plan-interview.md";
  const appSource = kitSourceFor(kitRs(), rel);
  expect(appSource, "kit.rs compiles in a source for the banks").toBe(
    "method/interview/plan-interview.md",
  );
  const appBytes = readFileSync(path.join(repoRoot, String(appSource)), "utf8");

  // The SKILL lens: the block the delivered file lands at the kit root,
  // which is the same kit-relative path the app's table uses.
  const skillBytes = new Map(blocks(committed()).map((b) => [b.path, b.content])).get(
    `${kitRelDir(repoRoot)}/${rel}`,
  );
  expect(skillBytes, "the delivered skill seeds the banks at the kit root").toBeDefined();
  expect(
    skillBytes,
    "THE TWO LENSES HAVE DRIFTED: the app's runner and the skill no longer consume the same " +
      "bytes of the banks, which is the one property this card exists to keep",
  ).toBe(appBytes);

  // THE CONTROL, both ways round. The card asks for a control that reds
  // "when EITHER path is pointed at a different file", so both are
  // repointed — at `decomposition.md`, a real method file, so what the
  // control changes is the SOURCE and not the readability of it.
  const other = readFileSync(path.join(repoRoot, "method/interview/decomposition.md"), "utf8");
  const repointedApp = kitRs().replace(
    'rel: "interview/plan-interview.md",\n        content: include_str!("../../../../method/interview/plan-interview.md"),',
    'rel: "interview/plan-interview.md",\n        content: include_str!("../../../../method/interview/decomposition.md"),',
  );
  expect(repointedApp, "the control really rewrote the table").not.toBe(kitRs());
  expect(
    readFileSync(path.join(repoRoot, String(kitSourceFor(repointedApp, rel))), "utf8"),
    "CONTROL FAILED: the app lens was repointed and the comparison still passed",
  ).not.toBe(skillBytes);
  expect(
    other,
    "and the repointed app lens really reads the other file",
  ).toBe(readFileSync(path.join(repoRoot, String(kitSourceFor(repointedApp, rel))), "utf8"));

  // The SKILL lens repointed: the same delivered file with the banks
  // block's body replaced by another method file's.
  const repointedSkill = committed().replace(appBytes, other);
  expect(repointedSkill, "the control really rewrote the delivered file").not.toBe(committed());
  const repointedSkillBytes = new Map(blocks(repointedSkill).map((b) => [b.path, b.content])).get(
    `${kitRelDir(repoRoot)}/${rel}`,
  );
  expect(
    repointedSkillBytes,
    "CONTROL FAILED: the skill lens was repointed and the comparison still passed",
  ).not.toBe(appBytes);
});

test("the delivered file states the seed rule its own reader applies", () => {
  // A session follows the PROSE; `materialize` follows the PARSER. If the
  // two ever disagree, everything measured through the parser is measured
  // about a document nobody reads that way. So the prose's statement of
  // the rule is derived from the same constants the parser uses.
  const text = committed();
  const scaffold = text.slice(text.indexOf("## 0."), text.indexOf("## 1."));
  expect(scaffold, "the scaffold section names the seed marker").toContain(SEED_INFO);
  expect(scaffold, "and says how long the fence is").toContain(`${String(FENCE.length)} backticks`);
  expect(scaffold, "and names the empty directories the banking map's row 0 creates").toContain(
    `${EMPTY_DIRS[0]}/`,
  );
  expect(scaffold, "and the gitignore line").toContain(GITIGNORE_LINE);
  // Every fence in the file is the one the parser looks for, opened and
  // closed — an unbalanced fence would swallow the rest of the document.
  const fences = text.split("\n").filter((l) => l.startsWith(FENCE));
  expect(fences.length % 2, "every block is opened and closed").toBe(0);
  expect(
    fences.filter((l) => l === FENCE).length,
    "half the fence lines are bare closers",
  ).toBe(fences.length / 2);
});

test("the closing line is the owner's, names a control the app really has, and offers no command", () => {
  const text = committed();
  const ending = text.slice(text.indexOf("## 6."), text.indexOf("## 7."));
  expect(ending, "the closing line is quoted in the section that ends the interview").toContain(
    CLOSING_LINE,
  );
  expect(ending, "and it is offered as the thing to SAY").toContain("Say exactly this");
  expect(ending, "no second interview").toMatch(/[Dd]o not start a second interview/);

  // IT NAMES A CONTROL THAT EXISTS. T-243 has not landed, so there is no
  // URL scheme and no folder argument; the manual way is the app's own
  // labelled control, and the label is read off the app rather than
  // remembered.
  const appSource = readFileSync(path.join(repoRoot, "app/src/App.tsx"), "utf8");
  const label = /"(Open folder[^"]*)"/.exec(appSource)?.[1];
  expect(label, "the app carries a labelled folder control").toBeTruthy();
  expect(CLOSING_LINE, "the closing line names the app's own label").toContain(String(label));

  // AND IT PRINTS NO UNIMPLEMENTED COMMAND. Every `supertaskr <word>` the
  // whole file spells has to be a verb this package really has — and as
  // delivered it spells NONE, which is the card's criterion 6 in its
  // strongest form: there is no open-the-folder command yet, so the file
  // offers no command rather than a plausible-looking one.
  const verbs = new Set(VERBS.map((v) => v.verb));
  const commands = (md: string): string[] =>
    [...md.matchAll(/`supertaskr ([a-z][a-z-]*)/g)].map((m) => m[1] ?? "");
  const unimplemented = commands(text).filter((v) => !verbs.has(v));
  expect(unimplemented, "the delivered file offers a command that does not exist").toEqual([]);
  expect(commands(ending), "and the closing section offers no command at all").toEqual([]);

  // THE CONTROL, run where the arrangement is ABSENT: the same checker
  // over a file that DOES name one must report it. Without this, "no
  // unimplemented command" would also be true of a checker that matched
  // nothing at all.
  const invented = text.replace(CLOSING_LINE, "Run `supertaskr open-this-folder` to see it.");
  expect(invented, "the control really rewrote the closing line").not.toBe(text);
  expect(
    commands(invented).filter((v) => !verbs.has(v)),
    "CONTROL FAILED: an invented command passed the check above",
  ).toEqual(["open-this-folder"]);
});

test("Codex is described as deferred and unverified rather than claimed", () => {
  const text = committed();
  const section = text.slice(text.indexOf("## Harness coverage"), text.indexOf("## 0."));
  expect(section, "the entry says which harness it was delivered for").toContain("Claude Code only");
  expect(section, "Codex is named").toContain("Codex");
  expect(section, "as deferred").toMatch(/deferred/);
  expect(section, "and unverified").toMatch(/unverified/);
  expect(section, "and the product goal is not narrowed by it").toMatch(/provider-flexible/);
  // The claim that must NOT appear anywhere in the delivered file: that
  // the prompt-file route is proven for this entry.
  expect(text, "nothing claims the Codex route is measured").not.toMatch(
    /Codex[^.\n]*\b(supported|proven|measured|verified)\b/i,
  );
});

test("organization skill packs are loaded and stamped the way the app's discoverer does", () => {
  const text = committed();
  const section = text.slice(text.indexOf("## 1. Organization"), text.indexOf("## 2."));

  // THE SURFACE IS THE APP'S, read out of the app's own module rather
  // than typed here — a second spelling of `.claude/skills` is exactly
  // the drift this card is about.
  const skillsRs = readFileSync(path.join(repoRoot, "app/src-tauri/src/agent/skills.rs"), "utf8");
  const dir = /pub const SKILLS_REL_DIR: &str = "([^"]+)";/.exec(skillsRs)?.[1];
  const file = /pub const SKILL_FILE: &str = "([^"]+)";/.exec(skillsRs)?.[1];
  expect(dir, "skills.rs declares the surface").toBeTruthy();
  expect(section, "the skill looks where the app looks").toContain(`${String(dir)}/*/${String(file)}`);

  // AND THE SAME THREE COMMITMENTS THE APP'S KICKOFF CLAUSE MAKES: name
  // each pack, follow it where its conditions apply, and SURFACE a
  // conflict rather than resolving an open question.
  expect(section, "each pack is named in the turn — that is the stamp a file-only record keeps").toMatch(
    /[Nn]ame every pack you\s+loaded/,
  );
  expect(section, "and followed where its conditions apply").toContain("where its conditions apply");
  expect(section, "and a conflict is surfaced, not chosen silently").toContain("instead of choosing silently");
  expect(section, "a malformed pack is reported by its directory and skipped").toMatch(
    /directory name and skipped/,
  );
  // T-167's READ SURFACE STANDS: the interview writes nothing there.
  // The app half of this is measured in Rust —
  // `agent::skills::tests::discovery_writes_nothing_into_the_skills_directory` —
  // and this is the skill half, in the delivered bytes.
  expect(section, "and the interview writes nothing into it").toMatch(/write nothing into that directory/);
  expect(skillsRs, "the Rust body that measures the app half is still there").toContain(
    "fn discovery_writes_nothing_into_the_skills_directory",
  );
});

test("the installer's source root is the project's when it ships skills and the package's otherwise", () => {
  // Inside this checkout nothing moved: the live tree wins, which is the
  // property that keeps T-242 from changing what `supertaskr install`
  // does for anyone working in a Supertaskr repository.
  expect(skillSourceRoot(repoRoot), "a checkout installs its own tree's skills").toBe(repoRoot);
  expect(shippedSkills(repoRoot), "and this tree ships both packs").toContain(SKILL_NAME);

  const project = scratchProject();
  const carried = mkdtempSync(path.join(tmpdir(), "supertaskr-carried-"));
  try {
    const dir = path.join(carried, "method/skills", SKILL_NAME);
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, "SKILL.md"), committed());
    expect(skillSourceRoot(project, carried), "a fresh folder installs what the package carried").toBe(
      carried,
    );
    // AND WHEN NEITHER SHIPS ANYTHING it answers the project root, so the
    // refusal names a path a user would look at.
    const empty = mkdtempSync(path.join(tmpdir(), "supertaskr-empty-"));
    try {
      expect(skillSourceRoot(project, empty)).toBe(project);
    } finally {
      removeGitFixture(empty, FIXTURE);
    }
  } finally {
    removeGitFixture(project, FIXTURE);
    removeGitFixture(carried, FIXTURE);
  }
});

test("install is explicit: identical is a no-op, differing is refused without --force, --dry-run writes nothing", () => {
  const project = scratchProject();
  const carried = mkdtempSync(path.join(tmpdir(), "supertaskr-carried-"));
  try {
    const dir = path.join(carried, "method/skills", SKILL_NAME);
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, "SKILL.md"), committed());
    const dest = path.join(project, ".claude/skills", SKILL_NAME, "SKILL.md");
    const io = (said: string[]) => ({
      projectRoot: project,
      out: (s: string) => said.push(s),
      err: (s: string) => said.push(s),
      carriedRoot: carried,
    });

    // --dry-run: the plan is printed and NOTHING is written.
    let said: string[] = [];
    expect(runInstall(["--harness", "claude", "--dry-run"], io(said))).toBe(CLI_EXIT.CLEAN);
    expect(said.join("\n")).toContain("NOT written");
    expect(existsSync(dest), "a dry run wrote nothing").toBe(false);

    // The real install.
    said = [];
    expect(runInstall(["--harness", "claude"], io(said))).toBe(CLI_EXIT.CLEAN);
    expect(readFileSync(dest, "utf8"), "the delivered bytes land unchanged").toBe(committed());
    expect(said.join("\n"), "and the source is disclosed because it is not this folder").toContain(
      "carried by this package",
    );

    // IDENTICAL IS A NO-OP: re-running over its own output is clean and
    // the file does not move.
    const before = statSync(dest).size;
    said = [];
    expect(runInstall(["--harness", "claude"], io(said))).toBe(CLI_EXIT.CLEAN);
    expect(statSync(dest).size).toBe(before);
    expect(readFileSync(dest, "utf8")).toBe(committed());

    // DIFFERING IS REFUSED, and the refusal writes nothing.
    writeFileSync(dest, `${committed()}\n<!-- somebody's edit -->\n`);
    const edited = readFileSync(dest, "utf8");
    said = [];
    expect(runInstall(["--harness", "claude"], io(said)), "a differing destination is refused").toBe(
      CLI_EXIT.FOUND,
    );
    expect(said.join("\n")).toContain("REFUSED");
    expect(readFileSync(dest, "utf8"), "and the edit survived the refusal").toBe(edited);

    // --force overwrites it, which is what makes the refusal a CHOICE.
    said = [];
    expect(runInstall(["--harness", "claude", "--force"], io(said))).toBe(CLI_EXIT.CLEAN);
    expect(readFileSync(dest, "utf8")).toBe(committed());
  } finally {
    removeGitFixture(project, FIXTURE);
    removeGitFixture(carried, FIXTURE);
  }
});

test("no verb but install writes into a harness directory, so opening a folder installs nothing", () => {
  // T-167's read surface, the CLI half. The app half is measured in Rust
  // (`agent::skills::tests::discovery_writes_nothing_into_the_skills_directory`):
  // discovery is the only thing an OPEN does, and it writes nothing. Here
  // the question is the command line — every other verb is driven with a
  // stubbed spawn and the harness directories must never appear.
  const project = scratchProject();
  try {
    for (const entry of VERBS) {
      if (entry.verb === "install") continue;
      cliMain([entry.verb, "--root", project], {
        cwd: project,
        stdout: () => {},
        stderr: () => {},
        spawn: (() => ({ status: 0, signal: null, error: undefined })) as never,
      });
    }
    for (const harness of HARNESSES) {
      expect(
        existsSync(path.join(project, harness.dir)),
        `${harness.id}: a verb other than install created ${harness.dir}`,
      ).toBe(false);
    }
    // THE POSITIVE CONTROL: the arrangement that IS supposed to write
    // does, so the absences above are about the other verbs and not about
    // a fixture nothing could ever write into.
    const carried = mkdtempSync(path.join(tmpdir(), "supertaskr-carried-"));
    try {
      const dir = path.join(carried, "method/skills", SKILL_NAME);
      mkdirSync(dir, { recursive: true });
      writeFileSync(path.join(dir, "SKILL.md"), committed());
      expect(
        runInstall(["--harness", "claude"], {
          projectRoot: project,
          out: () => {},
          err: () => {},
          carriedRoot: carried,
        }),
      ).toBe(CLI_EXIT.CLEAN);
      expect(existsSync(path.join(project, ".claude/skills", SKILL_NAME, "SKILL.md"))).toBe(true);
    } finally {
      removeGitFixture(carried, FIXTURE);
    }
  } finally {
    removeGitFixture(project, FIXTURE);
  }
});

test("the pack staging carries the one-file entry and names the pack it will not carry", () => {
  const plan = stagePlan(repoRoot);
  expect(plan.carried, "the generated entry is carried").toContain(SKILL_NAME);
  // AND THE RULE IS DERIVED, not a list: every pack it skipped is skipped
  // because it is more than one file, which is a fact about the tree.
  for (const skipped of plan.skipped) {
    expect(
      walkRel(path.join(repoRoot, "method/skills", skipped.name)).length,
      `${skipped.name} was skipped, so it must really be more than one file`,
    ).toBeGreaterThan(1);
  }
  for (const name of plan.carried) {
    expect(
      walkRel(path.join(repoRoot, "method/skills", name)),
      `${name} is carried, so it must really be one file`,
    ).toEqual(["SKILL.md"]);
  }
  expect(CARRIED_SKILLS_ROOT.startsWith(packageRoot), "the staging lives inside the package").toBe(true);
});

test("a fresh folder receives the entry from a packed tarball and materializes the whole file contract", () => {
  test.setTimeout(300_000);
  const project = scratchProject();
  const packDir = mkdtempSync(path.join(tmpdir(), "supertaskr-skillpack-"));
  try {
    writeFileSync(
      path.join(project, "package.json"),
      `${JSON.stringify({ name: "a-genesis-project", version: "0.0.0", private: true }, null, 2)}\n`,
    );
    // NOTHING IS PUBLISHED — packaging is approved (the owner's ruling 4
    // of 2026-09-14) and publishing stays @human's (T-266).
    const packed = execFileSync("npm", ["pack", "--pack-destination", packDir], {
      cwd: packageRoot,
      encoding: "utf8",
    })
      .trim()
      .split("\n")
      .at(-1);
    expect(packed, "npm pack named a tarball").toBeTruthy();

    // THE TARBALL CARRIES THE GENERATED FILE (criterion 5).
    const listed = execFileSync("tar", ["-tzf", path.join(packDir, String(packed))], {
      encoding: "utf8",
    }).split("\n");
    const inside = `package/dist/${SKILL_REL}`;
    expect(listed, `the tarball must carry ${inside}`).toContain(inside);

    execFileSync(
      "npm",
      ["install", "--no-audit", "--no-fund", "--offline", path.join(packDir, String(packed))],
      { cwd: project, encoding: "utf8" },
    );

    // THE SOURCE IS NEVER BRIDGED. The card forbids it by name: nothing
    // fabricates a method/skills/ inside the fixture, and the scratch
    // project's own method/ is empty.
    expect(
      existsSync(path.join(project, "method", "skills")),
      "the fixture must not fabricate a method/skills/ — the entry has to arrive in the tarball",
    ).toBe(false);

    execFileSync("npx", ["supertaskr", "install", "--harness", "claude"], {
      cwd: project,
      encoding: "utf8",
    });
    const delivered = path.join(project, ".claude/skills", SKILL_NAME, "SKILL.md");
    expect(existsSync(delivered), "the entry landed in the harness's own directory").toBe(true);
    const deliveredText = readFileSync(delivered, "utf8");
    expect(deliveredText, "byte for byte what this tree generated").toBe(committed());

    // THE MATERIALIZATION, out of the DELIVERED BYTES and nothing else.
    materialize(deliveredText, project);

    // AND THE CONTRACT RESOLVES. The expectation is derived from the
    // METHOD TREE — every docs template and every adapter — so a
    // generator that dropped one leaves this expectation standing.
    for (const rel of walkRel(path.join(repoRoot, "method/docs-templates"))) {
      const landed = path.join(project, "docs", ...rel.split("/"));
      expect(existsSync(landed), `docs/${rel} is missing from the interviewed folder`).toBe(true);
      expect(readFileSync(landed, "utf8"), `docs/${rel} is not the method's own bytes`).toBe(
        readFileSync(path.join(repoRoot, "method/docs-templates", rel), "utf8"),
      );
    }
    for (const rel of walkRel(path.join(repoRoot, "method/adapters"))) {
      const landed = path.join(project, rel);
      expect(existsSync(landed), `${rel} is missing from the project root`).toBe(true);
      expect(readFileSync(landed, "utf8")).toBe(
        readFileSync(path.join(repoRoot, "method/adapters", rel), "utf8"),
      );
    }
    for (const dir of EMPTY_DIRS) {
      expect(statSync(path.join(project, ...dir.split("/"))).isDirectory(), `${dir}/ exists`).toBe(true);
    }
    expect(
      readFileSync(path.join(project, ".gitignore"), "utf8").split("\n"),
      "the runtime directory is ignored",
    ).toContain(GITIGNORE_LINE);
    // The kit-root files, at the RUNNER'S own path.
    const kitRoot = kitRelDir(repoRoot);
    for (const [rel, from] of [
      [`${kitRoot}/interview/plan-interview.md`, "method/interview/plan-interview.md"],
      [`${kitRoot}/interview/decomposition.md`, "method/interview/decomposition.md"],
      [`${kitRoot}/tasks/T-000-template.md`, "method/tasks/T-000-template.md"],
    ] as const) {
      const landed = path.join(project, ...rel.split("/"));
      expect(existsSync(landed), `${rel} is missing`).toBe(true);
      expect(readFileSync(landed, "utf8")).toBe(readFileSync(path.join(repoRoot, from), "utf8"));
    }

    // THE POSITIVE CONTROL, run where the arrangement is ABSENT: the same
    // installer, against a package that carried nothing, REFUSES — so the
    // delivery above is about the tarball's payload and not about an
    // installer that would have found the file anywhere.
    const bare = mkdtempSync(path.join(tmpdir(), "supertaskr-bare-pkg-"));
    const other = scratchProject();
    try {
      const said: string[] = [];
      expect(
        runInstall(["--harness", "claude"], {
          projectRoot: other,
          out: (s) => said.push(s),
          err: (s) => said.push(s),
          carriedRoot: bare,
        }),
        "CONTROL FAILED: an installer with nothing to install reported success",
      ).toBe(CLI_EXIT.CANNOT_RUN);
      expect(said.join("\n")).toContain("Nothing was written");
      expect(existsSync(path.join(other, ".claude")), "and it wrote nothing").toBe(false);
    } finally {
      removeGitFixture(bare, FIXTURE);
      removeGitFixture(other, FIXTURE);
    }
  } finally {
    removeGitFixture(project, FIXTURE);
    removeGitFixture(packDir, FIXTURE);
  }
});
