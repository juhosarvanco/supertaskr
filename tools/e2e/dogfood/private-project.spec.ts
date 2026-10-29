import { BATTERY_SECONDS, LEG_SECONDS } from "../../../cli/push-guard.mjs";
import { cardAtDepth } from "../fixtures/criteria-contract";
import { cardLines, CRITERIA_HEADING as PREFLIGHT_RULE } from "../scripts/card-preflight.mjs";
import { optionalSection, CRITERIA_HEADING as ADVISORY_RULE } from "../scripts/session-economics.mjs";
import { frontmatterFields } from "../scripts/dispatch-brief.mjs";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { parse as parseYaml } from "yaml";
import { privateDogfoodContext } from "../scripts/private-dogfood.mjs";
import {
  BYTES_PER_TOKEN, INDEXED_DOCS, INDEX_DOC, INDEX_RULING, adapterNamedDocs,
  conventionsText, conventionsChapters, conventionsIndexText, docsIndexStale, liveTaskCards,
  ruledIndexedDocs, taskCardIssues, taskStatuses, trackedFiles,
} from "../scripts/docs-scan.mjs";
import { PROCESS_SCHEMA, parseProcessSchema } from "../scripts/dispatch-brief.mjs";
import { TIER_BUDGETS } from "../scripts/health-bands.mjs";
import { allBands } from "../scripts/health-bands.config.mjs";
import { CHECK_EXIT, CHECK_ARGV, GH_BIN, ghRunListArgv, ghRunViewArgv, RUN_LIST_REQUIRED_FIELDS, RUN_LIST_JSON_FIELDS, RUN_VIEW_JSON_FIELDS, GRAPH_REL_PATH, INDEX_CRATE_MANIFEST_REL_PATH, CHECK_DIR_REL_PATH } from "../../../cli/push-guard.mjs";
import { CARD_FILE_RE } from "../../../cli/landing-gate.mjs";
import { frontmatterLineOf, touchesLineOf, INTEGRATION_SEAT_PATHS, DECLINE_CODES } from "../../../cli/lane-fence.mjs";
import { touchesTokens } from "../../../cli/landing-gate.mjs";
import { limitsDrift, headerLimitNumbers, declineCodesInSource } from "../fixtures/lane-contract.mjs";
import { conventionsBullet } from "../scripts/docs-scan.mjs";
import { runChecks } from "../scripts/push-checks.mjs";
import { XS_CHANGED_LINE_BOUND, READINGS_PATH, PINNED_SENTENCE_FLOOR, FIXTURE_CLASSES } from "../scripts/merge.mjs";
import { VERBS } from "../scripts/cli.mjs";
import { cardBody, proseOnly, CENSUS_CLAIM } from "../scripts/card-figures.mjs";
import { readdirSync } from "node:fs";
import { DOC_BUDGETS } from "../scripts/docs-scan.mjs";
import { injectionLine, scanInjection } from "../scripts/docs-gate.mjs";
import {
  LEGACY_NAME, PRIVATE_SCAN_ROOTS, PRIVATE_SCAN_ROOT_FILES,
  carriesLegacy, scanCorpus, scanLegacy, scanCase, scanHomoglyphs,
} from "../scripts/rename-scan.mjs";

// Validation happens before any private read. Origins and exact product HEAD
// are rechecked by the shared entrypoint; missing/invalid selection refuses.
const { productRoot, recordsRoot } = privateDogfoodContext();
const readRecord = (rel: string) => readFileSync(path.join(recordsRoot, rel), "utf8");

test("the selected private board parses and retains the actual status vocabulary", () => {
  const cards = liveTaskCards(recordsRoot);
  expect(cards.length, "the actual private project has task cards").toBeGreaterThan(50);
  expect(taskCardIssues(cards, { statuses: taskStatuses(productRoot), parseYaml })).toEqual([]);
});

test("the selected project's indexed set is its actual ruling's own set", () => {
  const ruled = ruledIndexedDocs(recordsRoot);
  expect(ruled.length, `${INDEX_RULING.file} must name its governed set`).toBeGreaterThan(0);
  expect(INDEXED_DOCS.map(rel => path.basename(rel, ".md"))).toEqual(ruled);
});

test("selected private INDEX is current and names every actual conventions chapter", () => {
  expect(docsIndexStale(recordsRoot), "private checking/save must persist the current derivation").toBeNull();
  const index = readRecord(INDEX_DOC);
  for (const rel of conventionsChapters(conventionsIndexText(recordsRoot))) expect(index).toContain(`\`${rel}\``);
});

test("the selected standing read fits the original ceiling and the replaced actual order did not", () => {
  const adapter = readFileSync(path.join(productRoot, "AGENTS.md"), "utf8");
  const named = adapterNamedDocs(adapter);
  expect(named).toContain("docs/STATE.md");
  expect(named).toContain(INDEX_DOC);
  for (const rel of INDEXED_DOCS) expect(named).not.toContain(rel);
  const bytes = named.reduce((n, rel) => n + Buffer.byteLength(readRecord(rel)), 0);
  expect(Math.ceil(bytes / BYTES_PER_TOKEN)).toBeLessThan(10_000);
  const wasBytes = ["docs/STATE.md", ...INDEXED_DOCS].reduce((n, rel) => n + Buffer.byteLength(readRecord(rel)), 0);
  expect(Math.ceil(wasBytes / BYTES_PER_TOKEN)).toBeGreaterThan(10_000);
});

const RECORD_FLOORS: ReadonlyArray<readonly [string, number]> = [
  ["docs/checkpoints", 64], ["docs/rooms", 11], ["docs/tasks", 341], ["docs/research/captures", 5],
];
function filesCarrying(dir: string, needle: string): string[] {
  try {
    return execFileSync("git", ["-C", recordsRoot, "grep", "-l", "-i", "--", needle, "--", dir], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] })
      .split("\n").filter(file => file && file !== "docs/checkpoints/TEMPLATE.md");
  } catch (error) { if ((error as { status?: number }).status === 1) return []; throw error; }
}

test("the actual record trees retain their original pre-rename provenance floors", () => {
  for (const [dir, floor] of RECORD_FLOORS) expect(filesCarrying(dir, LEGACY_NAME).length, dir).toBeGreaterThanOrEqual(floor);
  expect(filesCarrying("docs/decisions", LEGACY_NAME).filter(file => !file.includes("/022-")).length).toBeGreaterThanOrEqual(12);
  expect(filesCarrying("docs/checkpoints", "a-string-no-record-has-ever-carried-t264")).toEqual([]);
  expect(carriesLegacy("nothing to see here")).toBe(false);
});

test("selected private prose retains the rename, case and homoglyph obligations", () => {
  const corpus = scanCorpus(recordsRoot, PRIVATE_SCAN_ROOTS, PRIVATE_SCAN_ROOT_FILES);
  expect(corpus.length).toBeGreaterThan(0);
  expect(scanLegacy(recordsRoot, corpus).filter(hit => hit.cls === null)).toEqual([]);
  expect(scanCase(recordsRoot, corpus)).toEqual([]);
  expect(scanHomoglyphs(recordsRoot, corpus)).toEqual([]);
});

test("the explicit private corpus reports every advisory hit without inventing hits", () => {
  const docs = trackedFiles(recordsRoot).filter(rel => rel.startsWith("docs/"));
  expect(docs.length).toBeGreaterThan(100);
  const hitFiles = docs.map(rel => ({ rel, hits: scanInjection(readRecord(rel)) })).filter(item => item.hits.length);
  expect(hitFiles.length).toBeGreaterThan(0);
  const script = path.join(productRoot, "tools/e2e/scripts/docs-gate.mjs");
  let output = "";
  try { output = execFileSync(process.execPath, [script, "--root", recordsRoot, ...hitFiles.map(item => item.rel)], { cwd: recordsRoot, encoding: "utf8" }); }
  catch (error) { output = String((error as { stdout?: string }).stdout ?? ""); }
  const expected = hitFiles.flatMap(item => item.hits.map(hit => injectionLine(item.rel, hit)));
  expect(output.split("\n").filter(line => line.startsWith("  injection  "))).toEqual(expected);
});

test("private STATE and template still point at the creation law rather than retouching records", () => {
  for (const rel of ["docs/STATE.md", "docs/STATE-template.md"]) expect(readRecord(rel)).not.toMatch(/re-touch|LATER edit to that record/i);
});

test("the shipped seat pack resolves its commands against the selected private authorities", () => {
  const script = path.join(productRoot, "method/skills/supertaskr-seat/scripts/host-command-check.mjs");
  const output = execFileSync(process.execPath, [script, "--repo", recordsRoot], { encoding: "utf8" });
  expect(output).toMatch(/HOST> commands (\d+) · resolved \1\b/);
});

function shippedSchema() { return parseProcessSchema(readFileSync(path.join(productRoot, PROCESS_SCHEMA), "utf8")); }

test("THE SCHEMA CARRIES EVERY ROW OF THE ROOM'S SWITCH INVENTORY AND EVERY ID ITS FLOOR NAMES", () => {
  // KILLED BY: a row of the room's table the schema never declared, a
  // floor id the schema declares as switchable, and a schema switch that
  // is neither a row of that table, a floor entry, nor named by another
  // switch's own constraint — which is the direction that catches a
  // switch invented here rather than ruled there.
  const room = readFileSync(path.join(recordsRoot, "docs", "rooms", "loop-cost-and-speed.md"), "utf8");
  const at = room.indexOf("## The switch inventory");
  expect(at, "the room no longer carries a switch inventory heading").toBeGreaterThan(-1);
  const body = room.slice(at);
  const rowIds = [...body.matchAll(/^\|\s*([a-z0-9_]+\.[a-z0-9_]+)\s*\|/gm)].map((m) => m[1] as string);
  expect(rowIds.length, "the room's table parsed to too few rows to be the inventory").toBeGreaterThan(30);
  const schema = shippedSchema();
  expect(
    rowIds.filter((id) => !schema.switches.has(id)),
    "the room ruled switch(es) the schema does not declare",
  ).toEqual([]);
  // THE FLOOR the room names in code spans, each declared and each floor.
  const floorAt = body.indexOf("The floor (no profile turns these off)");
  expect(floorAt, "the room no longer carries its floor sentence").toBeGreaterThan(-1);
  const floorSentence = body.slice(floorAt, body.indexOf("\n\n", floorAt));
  const floorIds = [...floorSentence.matchAll(/`([a-z0-9_]+\.[a-z0-9_]+)`/g)].map((m) => m[1] as string);
  expect(floorIds.length, "the floor sentence names no id at all").toBeGreaterThan(0);
  for (const id of floorIds) {
    const sw = schema.switches.get(id);
    expect(sw, `the floor names ${id} and the schema does not declare it`).toBeDefined();
    expect((sw as { floor: boolean }).floor, `${id} is floor in the room and switchable in the schema`).toBe(true);
  }
  // AND NOTHING WAS INVENTED. Every switch that is not floor is either a
  // row of that table or is named by another switch's constraint — the
  // second case is real: a constraint may name a setting the table
  // referred to without giving it a row of its own.
  const constrained = new Set<string>();
  for (const sw of schema.switches.values()) {
    for (const need of sw.needs) {
      const m = /=>\s*([a-z0-9_]+\.[a-z0-9_]+)\s*=/.exec(need);
      if (m?.[1] !== undefined) constrained.add(m[1]);
    }
  }
  expect(
    [...schema.switches.values()]
      .filter((sw) => !sw.floor && !rowIds.includes(sw.id) && !constrained.has(sw.id))
      .map((sw) => sw.id),
    "the schema declares switchable option(s) neither the room nor a constraint names",
  ).toEqual([]);
});

test("THE SCHEMA'S TWO COLUMNS MOVE EXACTLY WHERE THE ROOM'S OLD AND RULED COLUMNS MOVE", () => {
  // CORRECTION 2. The room's rows were compared to the schema's by ID in
  // both directions and their VALUES by nothing — and this project RUNS
  // the standard column, so a row transcribed into the wrong column is
  // this project's loop quietly differing from what the decision ruled,
  // with every other body green.
  //
  // NEITHER SIDE IS TYPED HERE, and no mapping between the room's prose
  // values and the schema's enum values is needed: the room's own table
  // says whether a row MOVED between its two columns, the schema's own
  // table says the same thing, and the two answers are compared as sets.
  const room = readFileSync(path.join(recordsRoot, "docs", "rooms", "loop-cost-and-speed.md"), "utf8");
  const table = room.slice(room.indexOf("## The switch inventory"));
  const rows = [...table.matchAll(/^\|\s*([a-z0-9_]+\.[a-z0-9_]+)\s*\|([^|]*)\|([^|]*)\|([^|]*)\|/gm)].map(
    (m) => ({ id: m[1] as string, old: (m[3] as string).trim(), ruled: (m[4] as string).trim() }),
  );
  expect(rows.length, "the room's table parsed to too few rows to be the inventory").toBeGreaterThan(30);
  const schema = shippedSchema();
  const roomMoved: string[] = [];
  const schemaMoved: string[] = [];
  for (const row of rows) {
    const sw = schema.switches.get(row.id);
    if (sw === undefined) continue;
    if (row.old !== row.ruled) roomMoved.push(row.id);
    if (sw.profiles.get("guarded-everything") !== sw.profiles.get("standard")) schemaMoved.push(row.id);
  }
  expect(roomMoved.length, "no row of the room moved at all, so this body compares nothing").toBeGreaterThan(0);
  expect(
    roomMoved.filter((id) => !schemaMoved.includes(id)),
    "the room ruled these switch(es) changed and the schema gives them one value in both columns",
  ).toEqual([]);
  expect(
    schemaMoved.filter((id) => !roomMoved.includes(id)),
    "the schema moves these switch(es) between its two columns and the room ruled no such change",
  ).toEqual([]);
});

test("TIER_BUDGETS TRANSCRIBES ADR-024 DECISION 1 — pinned to the ruling that produced it", () => {
  // The §AUTHORITIES discipline pointed at a RULING instead of a tool.
  // These six numbers are the owner's, and the failure they are pinned
  // against is the quiet one: a budget edited beside the parse while the
  // decision record still reads the old pair, after which every band
  // reports against a limit nobody ruled.
  const adr = readFileSync(path.join(recordsRoot, "docs/decisions/024-the-proportionate-loop.md"), "utf8");
  expect(adr).toContain("Budgets: 20 min/80K, 75 min/310K, 100 min/450K");
  expect(TIER_BUDGETS).toEqual({
    bounded: { minutes: 20, tokens: 80000 },
    standard: { minutes: 75, tokens: 310000 },
    guarded: { minutes: 100, tokens: 450000 },
  });
  // The order is the ADR's own tier sentence, bounded then standard then
  // guarded, and the table keeps it so the two can be read side by side.
  expect(Object.keys(TIER_BUDGETS)).toEqual(["bounded", "standard", "guarded"]);
});

test("THE CHECKPOINT TEMPLATE QUOTES BOTH LOOP BANDS BY ID, WITH THE COMMAND THAT DERIVES THEM", () => {
  // Criterion 2's first half lives entirely in DATA — two lines of prose
  // in docs/checkpoints/TEMPLATE.md — and at 3294c349 nothing in the
  // tree kept it: `Cycle band:` and `Token band:` appeared in exactly
  // one file each, the template itself, and no body, gate or generator
  // read them. A criterion whose whole delivery is an unkept paragraph
  // is satisfied by good intentions until somebody edits the paragraph.
  // This is the project's own standing hazard — a second copy of a list
  // drifting from the first — so the pin is on the BAND IDS, which is
  // what actually drifts when a band is renamed.
  const template = readFileSync(path.join(recordsRoot, "docs/checkpoints/TEMPLATE.md"), "utf8");
  expect(template).toContain("`Cycle band:`");
  expect(template).toContain("`Token band:`");
  for (const id of ["loop/cycle-budget-used", "loop/token-budget-used"]) {
    expect(template, `the checkpoint template must name ${id}`).toContain(id);
    expect(allBands(DOC_BUDGETS).map((b) => b.id)).toContain(id);
  }
  // THE DERIVE COMMAND IS QUOTED, and it is the one that actually
  // prints these bands. RUN VERBATIM at 3294c349 from tools/e2e/, it
  // emitted `loop/cycle-budget-used: 160.27 % of the tier's budget` with
  // its derivation — a figure a checkpoint can paste.
  expect(template).toContain("npm run health");
});

test("THE CONVENTIONS CARRY THE ADMISSION RULE ONCE, AT THE LOOP'S OWN SECTION", () => {
  // THE CARD'S SEVENTH CRITERION, the conventions half: ONCE, and at the
  // loop's section rather than in a bullet of its own — the dispatch
  // block is already declared in the settings bullet, and a second bullet
  // about the same block is the duplication this project's compaction
  // rule exists against.
  //
  // KILLED BY: the rule written twice, the rule written in a bullet that
  // is not the loop's, and a pause whose shape and location the document
  // does not state.
  const text = conventionsText(recordsRoot);
  const anchor = "THE PROCESS IS SETTINGS, AND EVERY SWITCH IS DECLARED ONCE";
  expect(text.split(anchor).length - 1, "the loop's settings bullet is written more than once").toBe(1);
  const marker = "EVERY ADMISSION THE ARM MAKES IS BOUND TO THE GRANT'S";
  expect(text.split(marker).length - 1, "the admission rule is written more than once").toBe(1);
  const bullet = text.slice(text.indexOf(anchor));
  const nextBullet = bullet.indexOf("\n- ");
  const section = nextBullet === -1 ? bullet : bullet.slice(0, nextBullet);
  expect(section.includes(marker), "the admission rule does not sit in the loop's own section").toBe(true);
  for (const owed of [
    "ADMISSION COMES BEFORE THE",
    "THE LEDGER IS THE RUN RECORDS AND THERE IS",
    "A\n  PAUSE IS A RECORD IN THE RUNTIME DIRECTORY",
    ".supertaskr/pause.json",
    "new-work",
    "SUCCESSOR COORDINATOR INHERITS THE GRANT FROM THE\n  BLOCK",
  ]) {
    expect(section, `the loop's section does not carry: ${owed}`).toContain(owed);
  }
});

test("T-322 C7 — THE CONVENTIONS CARRY THE HOST KEEP-AWAKE RULE ONCE, AT THE LOOP'S OWN SECTION, WITH ITS DERIVE COMMAND", () => {
  // THE CARD'S SEVENTH CRITERION, the conventions half. ONCE and at the
  // loop's section, on T-324's own argument one card later: the loop is
  // declared there and a second bullet about the same loop is the
  // duplication this project's compaction rule exists against.
  //
  // KILLED BY: the rule written twice; the rule written in a bullet that
  // is not the loop's; a keep-awake sentence with no DERIVE command,
  // which is a rule nobody can check; and the two command spellings
  // living in the role file instead, where a product-agnostic document
  // would carry a project's own path.
  const text = conventionsText(recordsRoot);
  const anchor = "THE PROCESS IS SETTINGS, AND EVERY SWITCH IS DECLARED ONCE";
  const marker = "THE HOST MUST STAY AWAKE OR THERE IS NO LOOP";
  expect(text.split(marker).length - 1, "the keep-awake rule is written more than once").toBe(1);
  const bullet = text.slice(text.indexOf(anchor));
  const nextBullet = bullet.indexOf("\n- ");
  const section = nextBullet === -1 ? bullet : bullet.slice(0, nextBullet);
  expect(section.includes(marker), "the keep-awake rule does not sit in the loop's own section").toBe(
    true,
  );
  for (const owed of [
    "caffeinate -i -t",
    "DERIVE\n  WHETHER IT IS HELD",
    "pmset -g assertions",
    "brief.mjs --since",
    "brief.mjs --await-until",
    "## Repair ledger",
  ]) {
    expect(section, `the loop's section does not carry: ${owed}`).toContain(owed);
  }
});

test("each verb sourced from docs/CONVENTIONS.md quotes a command that document really carries", () => {
  // Whitespace-normalised on both sides, because the document WRAPS: a
  // command spanning two lines is the same command, and a body that
  // compared raw bytes would be measuring the line width.
  const flat = conventionsText(recordsRoot).replace(/\s+/g, " ");
  let checked = 0;
  for (const entry of VERBS) {
    // T-290: a verb's source names the CHAPTER its rule lives in now,
    // and docs/CONVENTIONS.md is the index over those chapters. BOTH
    // spellings name this project's conventions, and this body reads the
    // SPLICED document either way — a filter that knew only the old one
    // would have left the `checked` floor below to catch a body that had
    // quietly stopped checking anything.
    if (!/docs\/CONVENTIONS\.md|docs\/conventions\//.test(entry.source)) continue;
    const quoted = [...entry.source.matchAll(/`([^`]+)`/g)].map((m) => (m[1] ?? "").replace(/\s+/g, " "));
    expect(quoted.length, `${entry.verb}'s source quotes at least one command`).toBeGreaterThan(0);
    for (const command of quoted) {
      expect(
        flat.includes(command),
        `${entry.verb} cites \`${command}\`, which this project's conventions must carry`,
      ).toBe(true);
      checked += 1;
    }
  }
  expect(checked, "this body really checked something").toBeGreaterThan(5);
  // NOT VACUOUS: a command the document does not carry is caught.
  expect(flat.includes("npm run definitely-not-a-command")).toBe(false);
});

test("every command the skills' own cards name is a verb this package exposes", () => {
  // THE DERIVATION THE CRITERION ASKS FOR, and it replaces a list typed
  // into this file: the verb set is read off T-241's and T-242's cards,
  // which are where the skills' command lines live until the skills do.
  const cards = readdirSync(path.join(recordsRoot, "docs", "tasks"))
    // The two PARENT cards only: a sub-card (T-241-s3-…) is a finding filed
    // under the parent, not a skill card, and T-241's merge landed five of
    // them — this body redded battery57 on 8bf42b0 by counting them.
    .filter((n) => /^T-24[12]-(?!s\d+-)/.test(n))
    .map((n) => readFileSync(path.join(recordsRoot, "docs", "tasks", n), "utf8"))
    // THE SPEC PART ONLY — the text before the card's implementation notes
    // and verdicts. Those sections name whatever a lane and its verifier
    // RAN (T-241's name the pack's own golden-check.mjs and
    // host-command-check.mjs, which are the pack's scripts and not verbs
    // this package owes); the criteria are where the skills' command
    // lines live.
    .map((c) => c.split(/\n## (?:Implementation notes|Verdicts)\b/)[0] ?? c);
  expect(cards.length, "both skill cards were found, and no sub-card").toBe(2);
  const quoted = cards.flatMap((c) => [...c.matchAll(/`([^`\n]+)`/g)].map((m) => m[1] ?? ""));
  const commands = quoted.filter((q) => /\.mjs\b/.test(q));
  expect(commands.length, "the cards really name commands").toBeGreaterThan(0);

  // EXACT MEMBERSHIP, NEVER A SUBSTRING. A mutant that repointed the
  // `evals` verb at `gate-run.mjs` survived a `toContain("run.mjs")`
  // check, because one script's name is inside another's — the same
  // class the verifier's R2 found in `undo`'s id matching.
  const files = new Set(
    VERBS.flatMap((v) =>
      v.target.kind === "script" || v.target.kind === "project" ? [v.target.file] : [],
    ),
  );
  const arms = new Set(
    VERBS.flatMap((v) =>
      v.target.kind === "script" || v.target.kind === "project"
        ? [...v.target.args, ...(v.positionalFlag === undefined ? [] : [v.positionalFlag])]
        : [],
    ),
  );
  for (const command of commands) {
    const script = /([\w./-]*[\w-]+\.mjs)/.exec(command)?.[1] ?? "";
    expect(script, `${command} names a script`).not.toBe("");
    expect(
      files.has(script) || files.has(path.basename(script)),
      `${command} is reachable — some verb's target IS ${script}, exactly`,
    ).toBe(true);
    const arm = /\s(--[a-z-]+)/.exec(command)?.[1];
    if (arm !== undefined) expect(arms.has(arm), `and its arm ${arm} is reached`).toBe(true);
  }
  // NOT VACUOUS: a command no verb fronts is not silently reachable.
  expect(files.has("definitely-not-a-script.mjs")).toBe(false);
  expect(files.has("tools/method-evals/run.mjs"), "the evals target is exact").toBe(true);
});

test("the case for arm two is a RATIO and this body re-derives it", async () => {
  let digitRuns = 0;
  let censusClaims = 0;
  for (const entry of liveTaskCards(recordsRoot)) {
    const prose = proseOnly(cardBody(entry.content));
    digitRuns += (prose.match(/\d+(?:[.,]\d+)?/g) ?? []).length;
    CENSUS_CLAIM.lastIndex = 0;
    censusClaims += (prose.match(CENSUS_CLAIM) ?? []).length;
  }
  expect(digitRuns, "the corpus carries digit runs in bulk").toBeGreaterThan(1000);
  expect(censusClaims, "and the census claim is not vacuous").toBeGreaterThan(0);
  expect(
    censusClaims * 100,
    `census claims ${censusClaims} against digit runs ${digitRuns} — a bare-figure lint fires ` +
      "orders of magnitude more often, which is the over-fire trap docs/CONVENTIONS.md names " +
      "against itself under DOCS GATE",
  ).toBeLessThan(digitRuns);
  // A RELATION, NOT A TALLY (docs/CONVENTIONS.md: CITE THE SHAPE, NOT THE
  // TALLY). Both counts move with every merge; the two orders of
  // magnitude between them are the argument, and they are what a later
  // hand proposing arm one has to overturn.
});

test("locating a card by its FILENAME agrees with its frontmatter id, over the whole board", () => {
  const dir = path.join(recordsRoot, "docs", "tasks");
  let cards = 0;
  const disagreed: string[] = [];
  for (const name of readdirSync(dir)) {
    if (!name.endsWith(".md")) continue;
    cards += 1;
    const text = readFileSync(path.join(dir, name), "utf8");
    const declared = (frontmatterLineOf(text, "id") ?? "").replace(/^id:/, "").trim();
    const named = CARD_FILE_RE.exec(`docs/tasks/${name}`)?.[1];
    if (declared !== named) disagreed.push(`${name}: id=${declared} filename=${String(named)}`);
  }
  expect(cards, "no cards under docs/tasks/ — this body measured nothing").toBeGreaterThan(200);
  expect(disagreed, "a card's filename no longer carries its id, so this gate would fence the wrong card").toEqual([]);
});

test("every live card's `touches:` line is the one shape this gate reads", () => {
  const dir = path.join(recordsRoot, "docs", "tasks");
  let declared = 0;
  const unreadable: string[] = [];
  for (const name of readdirSync(dir)) {
    if (!name.endsWith(".md")) continue;
    const line = touchesLineOf(readFileSync(path.join(dir, name), "utf8"));
    if (line === undefined) continue;
    declared += 1;
    if ("problem" in touchesTokens(line)) unreadable.push(`${name}: ${line}`);
  }
  expect(declared, "no card declares a `touches:` line").toBeGreaterThan(100);
  // The day a card is written as a block sequence this reds, and the
  // reader is extended DELIBERATELY rather than guessing at the shape.
  expect(unreadable, "a live card's `touches:` is not the flow sequence this gate reads").toEqual([]);
});

test("the carve-out set this hook holds is the one docs/CONVENTIONS.md publishes", () => {
  // UNNESTED, for the reason the branch-spelling body gives: a nested
  // `f(g(root))` hides this file from the DOCS GATE's reader derivation
  // while it really does read the document.
  const conventions = conventionsText(recordsRoot);
  const bullet = String(conventionsBullet(conventions, "THE LANE PROTOCOL"));
  const sentence = /never a lane's to veto — exactly (.*?), no more/.exec(bullet);
  expect(sentence, "the lane bullet no longer publishes this seat's standing writes").not.toBeNull();
  const published = [...((sentence as RegExpExecArray)[1] ?? "").matchAll(/`([^`]+)`/g)].map(
    (m) => m[1] as string,
  );

  // The constant and the page are two copies the design could not avoid
  // — the hook cannot parse a document on every keystroke — so they are
  // COMPARED rather than trusted, exactly as the lane-branch spelling is.
  // A red here names both sides and says which is which, not which is right.
  expect(published, "the hook's carve-outs and the page's have drifted").toEqual([
    ...INTEGRATION_SEAT_PATHS,
  ]);
  expect(INTEGRATION_SEAT_PATHS.length, "the published set is empty, so this proves nothing").toBe(2);
});

test("the limits this hook declares are the limits docs/CONVENTIONS.md publishes", () => {
  // UNNESTED ON PURPOSE, for the reason the two bodies above give: a
  // nested `f(g(root))` would hide this file from the DOCS GATE's
  // reader derivation while it really does read the document.
  const bullet = String(conventionsBullet(conventionsText(recordsRoot), "THE LANE PROTOCOL"));
  const hookSource = readFileSync(path.join(productRoot, "cli/lane-fence.mjs"), "utf8");

  // THE ANTI-VACUITY HALF FIRST. Every complaint below is a NEGATIVE
  // assertion, and a header with no limits or an empty declining set
  // satisfies all of them at once.
  expect(
    headerLimitNumbers(hookSource).length,
    "the hook declares no numbered limits, so this body proves nothing",
  ).toBeGreaterThan(0);
  expect(
    DECLINE_CODES.length,
    "the hook's declining set is empty, so this body proves nothing",
  ).toBeGreaterThan(0);

  // THE AUTHORITY IS THE EXPORTED FROZEN SET, and the text reader that
  // makes the planted control possible is bound to it here rather than
  // trusted. Only ONE of these codes is written inside the HONEST
  // LIMITS block, so grepping the header for them would be checking a
  // different thing from the one the hook can actually return.
  expect(
    declineCodesInSource(hookSource),
    "the source reader and the module's own DECLINE_CODES disagree",
  ).toEqual([...DECLINE_CODES]);

  expect(limitsDrift(hookSource, bullet), "the limits have drifted").toEqual([]);
});

test("the bound, the floor and the readings path this file computes are the ones docs/CONVENTIONS.md publishes", () => {
  // T-057's discipline, applied to the three figures T-295 INVENTED: a
  // rule with two statements is two chances to disagree, and every one
  // of these is stated twice by construction — once as a constant a
  // program enforces and once as a sentence a seat reads. The XS bound
  // is a number the tier work (T-296) will read out of the document, the
  // readings path is what T-297's bands will open, and the
  // pinned-sentence floor is what a seat has to know to predict a
  // refusal. This body is the only thing that compares them.
  //
  // IT IS ALSO WHAT MAKES THIS FILE A DERIVED READER OF docs/ TO THE
  // DOCS GATE, which is not a side effect but the point: a spec that
  // asserts a document's sentence is a spec the docs gate must run when
  // that document moves.
  const conventions = conventionsText(recordsRoot);
  expect(conventions, "the verb is spelled in the document").toContain(
    "node tools/e2e/scripts/brief.mjs --merge <T-NNN>",
  );
  expect(conventions, "the XS bound is STATED, in words, as this file computes it").toContain(
    "exceeds FORTY changed lines",
  );
  expect(XS_CHANGED_LINE_BOUND, "and forty is what the program enforces").toBe(40);
  expect(conventions, "the readings file is named where T-297 will look for it").toContain(
    READINGS_PATH,
  );
  expect(conventions, "and the pinned-sentence floor is stated too").toContain(
    "thirty\n  characters is the floor",
  );
  expect(PINNED_SENTENCE_FLOOR, "as the program spells it").toBe(30);
  // AND THE FIXTURE CLASSIFIER'S RECOGNITION RULE IS STATED THERE TOO
  // (T-295-s4), because the way through a keeper is the half of it a
  // seat has to be able to read before it plants anything. The document
  // names the table by the name the program exports, and the program
  // names the table's own file — a sentence and a symbol, twice stated.
  expect(conventions, "the recognition rule is stated, and it is BOTH halves").toContain(
    "names BOTH the value",
  );
  expect(conventions, "and the exception's scope with it").toContain("PER\n  MATCHED VALUE AND PER CLASS");
  expect(conventions, "under the name the program exports").toContain("`FIXTURE_CLASSES`");
  expect(FIXTURE_CLASSES.length, "which is a table the program carries").toBeGreaterThan(0);
  // AND THE INTEGRATOR'S ROLE FILE STATES THE WIDENING AS A STEP OF THE
  // MERGE, beside the re-drill (T-281-s10's third criterion).
  const integrator = readFileSync(path.join(productRoot, "method", "roles", "integrator.md"), "utf8");
  expect(integrator).toContain("THE WIDENING IS A STEP OF THIS MERGE, BESIDE THE DRILL");
  expect(integrator, "and it says WHY it comes before the merge").toContain("FIRST PARENT");
});

test("this repository's own board passes every cheap check, over a board proved non-empty first", () => {
  // NOT A TAUTOLOGY, because every body above proves the checks can fail.
  // This is the one that would red if a lane pushed a dangling blocker or
  // an unregenerated STATE into the tree — the same claim the guard makes
  // at a push.
  //
  // THE CORPUS IS COUNTED BEFORE IT IS JUDGED, which is this repository's
  // instance 5 ("a comparison over an empty corpus reports agreement and
  // measures nothing"). A `runChecks` that walked zero cards would return
  // zero findings and read exactly like a clean board. These two reads
  // are also what LINK this file into the docs gate's reader derivation:
  // the checks really do read docs/tasks and docs/checkpoints off the
  // live tree, so a change there really does owe this suite.
  const cards = readdirSync(path.join(recordsRoot, "docs/tasks")).filter(
    (f) => f.startsWith("T-") && f.endsWith(".md"),
  );
  expect(cards.length, "the live board is empty, so the judgement below is vacuous").toBeGreaterThan(
    20,
  );
  const records = readdirSync(path.join(recordsRoot, "docs/checkpoints")).filter((f) =>
    f.endsWith(".md"),
  );
  expect(records.length, "no checkpoint record, so the STATE half is vacuous").toBeGreaterThan(0);

  expect(runChecks(recordsRoot).map((f) => f.message)).toEqual([]);
});

test("the paths this guard holds resolve in this repository's own tree", () => {
  expect(existsSync(path.join(recordsRoot, GRAPH_REL_PATH))).toBe(true);
  expect(existsSync(path.join(productRoot, INDEX_CRATE_MANIFEST_REL_PATH))).toBe(true);
  expect(existsSync(path.join(productRoot, CHECK_DIR_REL_PATH))).toBe(true);
});

test("the four exit codes are docs/CONVENTIONS.md's, not this hook's", () => {
  const bullet = conventionsBullet(conventionsText(recordsRoot), "app/src-tauri (C-05 Rust half");
  expect(bullet, "no app/src-tauri bullet in docs/CONVENTIONS.md").toBeDefined();
  const legend = /exit (\d) current, (\d) STALE, (\d) usage, (\d) the gate could not run/.exec(
    String(bullet),
  );
  expect(legend, "the Rust bullet no longer legends index --check's four codes").not.toBeNull();
  const [, current, stale, usage, couldNotRun] = legend as RegExpExecArray;
  expect({
    CURRENT: Number(current),
    STALE: Number(stale),
    USAGE: Number(usage),
    COULD_NOT_RUN: Number(couldNotRun),
  }).toEqual({ ...CHECK_EXIT });
});

test("the check this guard runs is the command docs/CONVENTIONS.md publishes", () => {
  // ── ANCHORED, NOT SUBSTRING — poison shape EIGHT in its PREFIX form ──
  // This body used to assert `expect(bullet).toContain('cargo ' + argv)`,
  // and a substring search over the doc PASSES FOR EVERY PROPER PREFIX of
  // the published command. Three mutants of the `--root`/cwd mechanism
  // survived it, and two of them would have refused EVERY push in this
  // repository while the third would have allowed every push for ever:
  //
  //     --root ..        `… --check --root ..`   is a prefix of `… ../..`
  //     --root  (bare)   `… --check --root`      is a prefix of it too
  //     CHECK_DIR_REL_PATH -> "docs"             was asserted by nothing
  //
  // A guard misconfigured either way produces silence or universal
  // refusal, and neither is distinguishable from success by looking at
  // the guard — which is this card's own thesis one layer up. So the
  // command is matched as a WHOLE ELEMENT of the bullet's command list,
  // and the working directory is READ OUT of the bullet rather than
  // merely existing somewhere in the tree.
  const bullet = String(conventionsBullet(conventionsText(recordsRoot), "app/src-tauri (C-05 Rust half"));
  // Collapse the hard wrap first: every governing document here is
  // wrapped at ~70 columns, so a phrase match is a search for a line
  // break nobody chose (docs/CONVENTIONS.md, A CITATION NAMES A SYMBOL).
  const collapsed = bullet.replace(/\s+/g, " ");

  const published = [...collapsed.matchAll(/`([^`]+)`/g)].map((m) => m[1]);
  expect(published.length, "the bullet publishes no backticked commands").toBeGreaterThan(0);
  // `toContain` over an ARRAY is exact element equality — a prefix is not
  // an element, which is the whole repair.
  expect(published, `no EXACT published command equals the one this guard runs`).toContain(
    `cargo ${CHECK_ARGV.join(" ")}`,
  );

  // The directory is the bullet's own `run from <dir>/:` marker.
  const runFrom = /run from ([^\s:]+)\/:/.exec(collapsed);
  expect(runFrom, "the bullet no longer carries a `run from <dir>/:` marker").not.toBeNull();
  expect(CHECK_DIR_REL_PATH).toBe((runFrom as RegExpExecArray)[1]);
  // And that directory is the cargo workspace the command resolves `-p`
  // against — a second, independent way for `docs` to die.
  expect(existsSync(path.join(productRoot, CHECK_DIR_REL_PATH, "Cargo.toml"))).toBe(true);

  // The `--root` is the false-red the bullet warns about at length, and
  // its VALUE is what the two surviving mutants moved.
  expect(CHECK_ARGV).toContain("--root");
  expect(CHECK_ARGV[CHECK_ARGV.indexOf("--root") + 1]).toBe("../..");
});

test("the two commands this arm runs are the ones docs/CONVENTIONS.md publishes", () => {
  // THE AUTHORITY IS THE DOCUMENT, not this file — the treatment
  // `CHECK_ARGV` gets against the Rust bullet, applied to the bullet
  // that already told every seat to read CI by hand.
  const bullet = String(conventionsBullet(conventionsText(recordsRoot), "AND THEN READ IT"));
  const published = [...bullet.replace(/\s+/g, " ").matchAll(/`([^`]+)`/g)].map((m) => String(m[1]));
  expect(published.length, "the bullet publishes no backticked commands").toBeGreaterThan(0);
  const subcommands = published
    .filter((c) => c.startsWith(`${GH_BIN} `))
    .map((c) => c.split(/\s+/).slice(1, 3).join(" "));
  expect(subcommands, "the bullet no longer names `gh run list`").toContain("run list");
  expect(subcommands, "the bullet no longer names `gh run view`").toContain("run view");

  // And this guard runs those two, with the branch and the id as
  // ELEMENTS rather than as text spliced into a command.
  expect(ghRunListArgv("main").slice(0, 2)).toEqual(["run", "list"]);
  expect(ghRunListArgv("main")).toContain("main");
  expect(ghRunViewArgv("4242").slice(0, 3)).toEqual(["run", "view", "4242"]);
  expect(ghRunListArgv("main")).toContain("--json");
  expect(ghRunViewArgv("4242")).toContain("--json");

  // The field split this arm's strictness is spent on: every REQUIRED
  // field is asked for, and the required set is the small one.
  for (const field of RUN_LIST_REQUIRED_FIELDS) {
    expect(RUN_LIST_JSON_FIELDS, `${field} is required but never asked for`).toContain(field);
  }
  expect([...RUN_LIST_REQUIRED_FIELDS].sort()).toEqual(["conclusion", "databaseId", "status"]);

  // MEASURED AGAINST THE REAL `gh` ON 2026-09-02, and pinned because the
  // obvious code gets both wrong: `run list` publishes NO `jobs` field —
  // a failing step is only readable through `run view` — and `updatedAt`
  // is not a clock, so it is not asked for at all.
  expect(RUN_LIST_JSON_FIELDS, "`gh run list --json` has no `jobs`").not.toContain("jobs");
  expect(RUN_VIEW_JSON_FIELDS).toContain("jobs");
  expect(RUN_LIST_JSON_FIELDS, "`updatedAt` moves while a run is still running").not.toContain(
    "updatedAt",
  );
  expect(RUN_LIST_JSON_FIELDS).toContain("startedAt");
});

/**
 * THE CARDS THAT SPELL THE CRITERIA HEADING AT ANOTHER DEPTH, measured
 * over `docs/tasks/` at `71b52a01125d` with the rule the body below
 * applies — the nine cards of one planning batch, which were drafted in
 * one document and inherited its depth, and one card whose only heading
 * of that name is a verifier's per-criterion table.
 *
 * **IT IS AN EXCLUSION, NOT AN EQUALITY.** A card named here is allowed
 * to be where it is, so a repair that takes one back to depth two leaves
 * this body green, while a card that is NOT named reds by name. The
 * owner ruled on 2026-09-13 that the cards still open here are repaired
 * on the integration branch with no criteria text changed, and a body
 * that required the reading to EQUAL this list would red on exactly that
 * repair — the list is a measurement of what was already written, never
 * a judgement about what should be.
 *
 * **AND IT IS NOT A LICENCE EITHER.** A pinned set that has stopped
 * pinning anything is a permission nobody notices, so the body below
 * requires at least one of these ids to still be on the board at another
 * depth: when the last one is repaired this reds, and what it asks for
 * is the deletion of the list rather than its extension.
 */
const KNOWN_OFF_DEPTH = [
  "T-229-s4",
  "T-299-s6",
  "T-300-s6",
  "T-311",
  "T-312",
  "T-313",
  "T-314",
  "T-315",
  "T-316",
  "T-317",
];


test("the two readers agree about the criteria section on every live card", () => {
  // THE CORPUS IS THE MEASUREMENT. The fixtures above prove the rule; the
  // board is where a disagreement actually cost something, and it is the
  // only input that can surprise this pair.
  const dir = path.join(recordsRoot, "docs", "tasks");
  const disagreed: string[] = [];
  let read = 0;
  for (const name of readdirSync(dir)) {
    if (!name.endsWith(".md")) continue;
    read += 1;
    const text = readFileSync(path.join(dir, name), "utf8");
    const advisory = optionalSection(text, ADVISORY_RULE) !== null;
    const preflight = cardLines(text).hasCriteria;
    if (advisory !== preflight) {
      disagreed.push(`${name}: advisory=${String(advisory)} preflight=${String(preflight)}`);
    }
  }
  expect(read, "no cards under docs/tasks/ — this body measured nothing").toBeGreaterThan(200);
  expect(
    disagreed,
    "a card whose criteria section one reader finds and the other does not — the two rules have " +
      "drifted apart again",
  ).toEqual([]);
});

test("the task format names ONE depth for a card's sections, and the board spells the criteria heading there", () => {
  const md = readFileSync(path.join(productRoot, "method", "tasks", "TASK-FORMAT.md"), "utf8");

  // THE DOCUMENT IS THE AUTHORITY AND THE NUMBER COMES OUT OF IT. A body
  // that greps for a sentence is satisfied by the sentence; this one
  // takes the depth the document NAMES in words, checks it against the
  // depth the document's own block SPELLS, and then measures the board
  // against that one number. Move either statement and this reds.
  const named = /WRITTEN AT DEPTH ([A-Z]+)/.exec(md);
  expect(named, "the task format no longer names the depth its sections are written at").not.toBeNull();
  const words: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4 };
  const depth = words[String(named?.[1])];
  expect(depth, `the task format names a depth this body cannot read: ${String(named?.[1])}`).toBeGreaterThan(0);
  const spelled = /^(#+) Acceptance criteria\b/m.exec(md);
  expect(spelled, "the body-sections block no longer spells the criteria heading").not.toBeNull();
  expect(
    String(spelled?.[1]).length,
    "the block and the sentence beside it name different depths, so a card cannot obey both",
  ).toBe(depth);

  /** The depth a card spells its criteria heading at, or undefined. */
  const depthOf = (text: string): number | undefined => {
    const heading = cardLines(text).lines.find((l) => PREFLIGHT_RULE.test(l.text.trim()));
    if (heading === undefined) return undefined;
    return String(/^(#+)/.exec(heading.text.trim())?.[1]).length;
  };

  // POSITIVE CONTROL, RUN BEFORE THE LOOP IS TRUSTED: the reading tells
  // the two depths apart on a planted card. A loop whose reader answered
  // the same thing for every card would report an empty set forever.
  expect(depthOf(cardAtDepth("##")), "the reading cannot see depth two").toBe(2);
  expect(depthOf(cardAtDepth("###")), "the reading cannot see depth three").toBe(3);

  const dir = path.join(recordsRoot, "docs", "tasks");
  const off: string[] = [];
  let read = 0;
  for (const name of readdirSync(dir)) {
    if (!name.endsWith(".md")) continue;
    const text = readFileSync(path.join(dir, name), "utf8");
    const at = depthOf(text);
    if (at === undefined) continue;
    read += 1;
    if (at !== depth) off.push(String(frontmatterFields(text).id ?? name));
  }
  expect(read, "no card on this board carries a criteria heading — nothing was measured").toBeGreaterThan(200);
  expect(
    off.filter((id) => !KNOWN_OFF_DEPTH.includes(id)).sort(),
    "a card spells its criteria heading at a depth the task format does not name, and it is not one " +
      "of the cards measured when that depth was written down — one reader will see its criteria and " +
      "another will not",
  ).toEqual([]);
  expect(
    off.length,
    "every card pinned above has been repaired, so this list now permits a depth nobody spells: " +
      "delete it and the exclusion with it rather than leaving a licence behind",
  ).toBeGreaterThan(0);
});

test("the two readers open the criteria section in the SAME PLACE, and not merely both somewhere", () => {
  // THE CORPUS BODY ABOVE COMPARES TWO BOOLEANS, and both readers
  // answering "there IS a section" is not both readers answering the SAME
  // section. What the card asks for is the same CRITERIA, and the site is
  // where that is decided: the heading rule is one object now, but the two
  // readers still reach it through different prose models — the preflight
  // blanks fenced and deeply indented lines before it looks, this one
  // reads the card as it is written — so a card carrying the heading
  // inside a quotation AND again as its own section passes the boolean
  // comparison while the two stand in different places.
  //
  // THE READING IS DRIVEN THROUGH EACH READER'S OWN ENTRY POINT. A body
  // that re-derived the advisory site with a `findIndex` of its own would
  // be asserting about its own copy of the rule, and no mutant planted in
  // the module could reach it.
  const firstLine = (text: string): string =>
    text
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l !== "") ?? "";

  const dir = path.join(recordsRoot, "docs", "tasks");
  const apart: string[] = [];
  let seen = 0;
  for (const name of readdirSync(dir)) {
    if (!name.endsWith(".md")) continue;
    const text = readFileSync(path.join(dir, name), "utf8");
    const lines = cardLines(text).lines;
    const at = lines.findIndex((l) => l.scope === "criteria");
    const advisory = optionalSection(text, ADVISORY_RULE);
    if (at < 0 && advisory === null) continue;
    seen += 1;
    if (at < 0 || advisory === null) {
      apart.push(`${name}: one reader found a section and the other did not`);
      continue;
    }
    const preflight = firstLine(
      lines
        .slice(at + 1)
        .map((l) => l.text)
        .join("\n"),
    );
    if (preflight !== firstLine(advisory)) {
      apart.push(`${name}\n  preflight: ${preflight}\n  advisory : ${firstLine(advisory)}`);
    }
  }
  expect(
    seen,
    "no card on this board carries a criteria section — nothing was measured",
  ).toBeGreaterThan(200);
  expect(
    apart,
    "the two readers open the criteria section in different places on ONE card, so they collect " +
      "different criteria from it however much their heading rule agrees",
  ).toEqual([]);

  // THE POSITIVE CONTROL, RUN WHERE THE ARMING IS ABSENT. Every card above
  // answers `x === x`, and a reading that could not tell two sites apart
  // would report an empty list forever. So the same reading is put to a
  // card built to split them — the heading quoted in a fence before the
  // card's own section — and BOTH halves are shown: the boolean comparison
  // the body above makes is GREEN on this card, and this one is not.
  const fence = "`".repeat(3);
  const quoting = [
    "---",
    "id: T-904",
    "---",
    "",
    "The summary paragraph.",
    "",
    `${fence}markdown`,
    "## Acceptance criteria",
    "",
    "- WHEN a card QUOTES the task format THE quotation SHALL not be read as its criteria.",
    fence,
    "",
    "## Acceptance criteria",
    "",
    "- WHEN the card is read THE reader SHALL find this one.",
    "",
  ].join("\n");
  expect(
    optionalSection(quoting, ADVISORY_RULE) !== null && cardLines(quoting).hasCriteria,
    "the control card does not pass the boolean comparison, so it demonstrates nothing",
  ).toBe(true);
  const controlLines = cardLines(quoting).lines;
  const controlAt = controlLines.findIndex((l) => l.scope === "criteria");
  const controlPreflight = firstLine(
    controlLines
      .slice(controlAt + 1)
      .map((l) => l.text)
      .join("\n"),
  );
  const controlAdvisory = firstLine(String(optionalSection(quoting, ADVISORY_RULE)));
  expect(controlPreflight, "the reading cannot see the preflight's section").toContain(
    "SHALL find this one",
  );
  expect(controlAdvisory, "the reading cannot see the advisory reader's section").toContain(
    "SHALL not be read as its criteria",
  );
  expect(
    controlPreflight === controlAdvisory,
    "the reading answers the same for two different sections, so the loop above measures nothing",
  ).toBe(false);
});

test("the selected project declares its run-record home and adapter verb", () => {
 const conventions=conventionsText(recordsRoot);
 expect(conventions, "this project spells no home for its run records").toContain(".supertaskr/runs/");
 expect(conventions, "the project's bullet does not name the verbs a seat types").toContain("--run");
});

test("docs/CONVENTIONS.md records the accepted bypass, the public check and T-310 — the fifth criterion, pinned", () => {
  // KILLED BY: a DATA mutant. This criterion's whole property lives in
  // PROSE, and prose no body reads is deletable tomorrow over a green
  // suite — which is why the three other CONVENTIONS bullets this file
  // depends on are pinned above. This one was not, and every clause below
  // is one the card names in its own words.
  const bullet = String(
    conventionsBullet(conventionsText(recordsRoot), "THE PUSH IS JUDGED BY GIT ITSELF SINCE T-314"),
  );
  expect(bullet.length, "an empty bullet would satisfy every assertion below").toBeGreaterThan(500);

  // (i) THE LIMITATION, ITS DATE, AND BOTH SPELLINGS OF THE BYPASS.
  expect(bullet, "the v1 procedural limitation is not recorded").toContain("CLOSED BY PROCEDURE");
  expect(bullet, "the owner's acceptance is not dated").toContain("2026-09-12");
  expect(bullet, "`--no-verify` is not named as the bypass").toContain("--no-verify");
  expect(bullet, "a push from a checkout the hook was never installed in is the other bypass").toContain(
    "never installed",
  );

  // (ii) WHAT STILL CHECKS, WHICH IS NOT THIS HOOK AND NOT THIS MACHINE.
  expect(bullet, "the runner's owed set is not recorded as the public check").toContain(
    "THE RUNNER'S OWED SET ON THE PUSHED RANGE REMAINS THE PUBLIC CHECK",
  );

  // (iii) WHAT WOULD CLOSE IT, AND WHOSE CARD THAT IS.
  expect(bullet, "the separate proposals are not named").toContain("T-310");
  expect(bullet, "and what they are is not said").toContain("A PROTECTED RECEIVING GATE");
});

test("the cost table is docs/CONVENTIONS.md's own two figures, and the notice's minutes are its arithmetic", () => {
  // THE AUTHORITY IS THE DOCUMENT, not this file — the treatment
  // CHECK_ARGV gets against the Rust bullet. Both figures live in one
  // bullet, so one read answers both.
  const bullet = String(conventionsBullet(conventionsText(recordsRoot), "THE BLESSED GATE-RUNNER (T-202):"));
  expect(bullet, "the browser leg's own published figure").toContain(
    "ten of the battery's eleven minutes",
  );
  expect(bullet, "and what the document says the other three cost").toContain(
    "other three legs are seconds each",
  );

  expect(BATTERY_SECONDS).toBe(11 * 60);
  expect(LEG_SECONDS.e2e).toBe(10 * 60);
});
