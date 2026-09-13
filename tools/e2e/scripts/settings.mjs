#!/usr/bin/env node
/**
 * `npx supertaskr settings` — THE TERMINAL SURFACE OF THE PROCESS
 * SETTINGS (T-300, ADR-024 decision 6).
 *
 * ── WHAT THIS FILE IS, AND WHAT IT REFUSES TO BE ─────────────────────
 * Every switch of the loop is declared ONCE, in
 * `method/runtime/process-schema.yaml`, and the runtime template beside
 * it names the profile this project runs and the switches it departs
 * from. That schema is the ONE source four surfaces render — the arm,
 * this command, the app's settings screen and the skill — and none of
 * them is allowed to carry its own sentence about what a switch means.
 *
 * So this file HOLDS NO KNOWLEDGE OF THE LOOP. It parses nothing, it
 * resolves nothing and it validates nothing: the parser, the resolver,
 * the value sets, the floor and the constraints all live in the parser
 * library's `process-settings` module, and SINCE T-300-s6 this command
 * imports them through that library's own browser-safe entry rather than
 * through the dispatch arm's re-export of it. A second reader would be a
 * second chance to disagree with the arm about what this project's loop
 * is, and the disagreement would surface as a settings screen that says
 * one thing while the dispatch does another. Reading the library
 * DIRECTLY is that same guarantee with one hop fewer, and it is the
 * spelling the app's settings screen and the skill read it by too — the
 * arm stops being a place a surface reads the loop THROUGH, and goes
 * back to being one more reader of it.
 *
 * WHAT STILL COMES FROM THE ARM, AND WHY NEITHER OF THEM IS A READER.
 * Two symbols. `EXIT` is the house's exit vocabulary, which this command
 * spells nowhere of its own. `loadProcess` is the one function in this
 * repository that opens the schema and the template OFF DISK: the
 * library's module is browser-safe by construction and imports no node
 * builtin, so the file-reading half has to live where `node:fs` may be
 * imported, and a second copy of it here would be precisely the second
 * reader the paragraph above refuses. Everything it hands back — the
 * parsed schema, the resolved settings — is the library's own work.
 *
 * What is genuinely this command's own is three things:
 *
 *   1. THE RENDERING — one row per switch, in the schema's order, with
 *      the value it resolves to, its one-line `what`, and ONE measured
 *      column: the project's own band reading where the tree carries
 *      one, and the schema's `cost` labelled as the seat's ESTIMATE
 *      where it does not. The label is the point. A cost nobody has
 *      measured rendered in the same voice as a reading is a settings
 *      screen inviting a decision on a number that came out of a room.
 *   2. THE EDIT — `set <switch> <value>` writes a DEPARTURE into the
 *      template's `process:` section and keeps that section's shape:
 *      the profile line, the available line and every comment survive,
 *      because the section is method text a human wrote and this
 *      command is a settings editor, not a formatter. A value the
 *      constraints forbid is REFUSED by the schema's own machinery,
 *      naming both switches and both values, and NOTHING is written.
 *   3. THE REFERENCE — `reference` renders the chapter that documents
 *      this command, out of the schema, so the prose cannot go stale
 *      against the switches it describes. It is a function of the
 *      SCHEMA ALONE and never of the template: a page that moved every
 *      time somebody set a switch would red the currency body for a
 *      change that was not a documentation change.
 *
 * ── THE EXIT VOCABULARY, WHICH IS THE HOUSE'S ────────────────────────
 * 0 clean · 1 found · 2 called wrong · 3 could not run. A `set` this
 * command refuses is CALLED WRONG — the caller asked for a combination
 * the schema does not allow, and the tree is fine. A tree that
 * contradicts ITSELF is COULD NOT RUN: the arm refuses such a tree at
 * dispatch, and a settings screen that rendered it anyway would be the
 * one surface in the project pretending the loop is well defined.
 *
 * ── AND IT SETS `exitCode` RATHER THAN CALLING `process.exit()` ──────
 * The listing is tens of kilobytes and the ordinary way anyone reads
 * one is through a pager; `process.exit()` drops whatever stdout has
 * not drained. `brief.mjs`'s own foot carries the measurement, and
 * `tests/brief-flush.spec.ts` keeps the set of commands that still end
 * that way closed.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DOC_BUDGETS, repoRoot } from "./docs-scan.mjs";
import { EXIT, loadProcess } from "./dispatch-brief.mjs";
import { allBands } from "./health-bands.config.mjs";
import {
  cardMeters,
  dispatchStampSec,
  fmt,
  loopReadings,
  metersFromTree,
  recentCheckpoints,
} from "./health-bands.mjs";

/* ─────────────────────────────────────────────────────────────────────
 * THE LOOP, READ FROM THE PARSER LIBRARY'S BUILT BROWSER ENTRY
 * (T-300-s6).
 *
 * WHY BY PATH. `tools/e2e` is this repository's third npm package and
 * declares no dependency on the parser (ADR-011 family; its own manifest
 * says it imports neither app nor parser), so the parser's BUILT
 * browser-safe entry is loaded by relative path — the same spelling
 * `dispatch-brief.mjs` and `dispatch-order.mjs` already use, and the
 * same artefact `preflight.ts` asserts into existence for this package.
 *
 * WHY A DYNAMIC IMPORT RATHER THAN A STATIC ONE, AND IT IS MEASURED
 * RATHER THAN PREFERRED. Two things a static `from` would move, both of
 * them measured at this card's tip. A missing build would be refused by
 * the ESM LINKER, which runs over the whole graph before anything
 * evaluates — so `ERR_MODULE_NOT_FOUND` would print where the arm's loud
 * refusal naming the ADR-011 build order prints today, and the message
 * that tells a reader WHAT TO BUILD would never run. And `cli.mjs`'s
 * `packageEscapes` derives a verb's out-of-package reach from `from "…"`
 * specifiers alone, so a static import would make this verb refuse in an
 * installed copy through a path no other verb of the loop takes — a
 * change to this command's public behaviour, which the card forbids.
 *
 * AND THERE IS NO SECOND REFUSAL MESSAGE HERE ON PURPOSE. The static
 * import of `dispatch-brief.mjs` above is evaluated BEFORE this line, and
 * the arm loads the same file with a catch that names the build order —
 * measured at this card's tip: with both imports in place and no
 * `lib/parser/dist`, the ARM's message is the one that prints. A copy of
 * it here would be a refusal no arrangement can reach, which is the
 * shape of a guard nobody can show red.
 * ──────────────────────────────────────────────────────────────────── */

const processPure = await import("../../../lib/parser/dist/pure.js");

/**
 * The schema's own vocabulary, and the two functions this command reads
 * the loop with: the LEDGER, which is every switch at the value this
 * project resolves it to, and the CONSTRAINT FINDINGS, which is the
 * judgement about a combination that this command does not hold.
 */
const { PROCESS_SCHEMA, RUNTIME_TEMPLATE, constraintFindings, processLedger } = processPure;

/** A refusal this command owns: the caller asked for something the schema does not allow. */
export class SettingsFinding extends Error {}

/**
 * The chapter this command generates, repository-relative.
 *
 * A PLAIN STRING JOINED TO THE ROOT AT THE CALL SITE, which is this
 * package's own idiom for a path under docs/ (`METERS_PATH` in
 * health-bands.mjs is the same shape). Spelled as a segmented
 * `path.join("docs", …)` it would be a docs-first site with no base,
 * which resolves against the PACKAGE directory rather than the
 * repository root — so the docs gate's silent-miss tripwire would report
 * this file as one it could not link, and be right to.
 */
export const REFERENCE_DOC = "docs/reference/15-settings.md";

/** The command's own usage, rendered into the reference so it is never typed twice. */
export const USAGE = [
  "usage: supertaskr settings                      list the profile and every switch",
  "       supertaskr settings set <switch> <value> write one departure into the template",
  "       supertaskr settings reference            print the reference chapter",
  "       supertaskr settings reference --write    write it to docs/reference/",
  "       supertaskr settings reference --check    exit 1 while the committed page is stale",
  "",
  "  --root <path>  the project to read; defaults to the checkout this script sits in",
  "",
  "  Every switch is declared ONCE, in method/runtime/process-schema.yaml, and this",
  "  command renders that file rather than restating it. Every row carries its LABEL —",
  "  operational, manual or declarative — and a declarative row is a RECORD rather than",
  "  a control, so `set` refuses one. exit codes: 0 clean · 1 found ·",
  "  2 called wrong · 3 could not run.",
].join("\n");

// ── the measured column ──────────────────────────────────────────────

/**
 * Each band's unit, by band id. Read off the band config rather than
 * spelled here: a band whose unit is re-argued moves this rendering in
 * the same commit, and a table here would keep printing the old one.
 *
 * @returns {Map<string, string>}
 */
export function bandUnits() {
  /** @type {Map<string, string>} */
  const out = new Map();
  for (const band of allBands(DOC_BUDGETS)) out.set(band.id, band.unit);
  return out;
}

/**
 * THE PROJECT'S OWN READINGS FOR THE LOOP BANDS, off the tree.
 *
 * The loop bands are the ones a switch names, and they are read from
 * `docs/checkpoints/meters.jsonl` exactly the way `npm run health`
 * reads them — the same functions, so this command cannot report a
 * different number than the band report does.
 *
 * A TREE THAT CANNOT ANSWER GETS AN EMPTY MAP, NOT A THROW. A project
 * that adopted this method last week has no merges, no meters file and
 * possibly no git history; the honest rendering there is every switch
 * against the seat's estimate, which is exactly what an empty map
 * produces. Failing instead would make the LISTING — the one verb that
 * should work everywhere — the verb that needs a history.
 *
 * @param {string} root
 * @returns {Map<string, { value: number, derivation: string }>}
 */
export function treeReadings(root) {
  try {
    const { records, problems } = metersFromTree(root);
    // NO METERS, NO READINGS — AND NO GIT CALL EITHER. A tree with no
    // recorded meter cannot price a band whatever its history says, so
    // asking git about its checkpoints would be a subprocess whose
    // answer is discarded, and in a project that is not a checkout it
    // would be a subprocess that prints a fatal to stderr on the way to
    // being discarded.
    if (records.length === 0) return new Map();
    const cards = cardMeters({ records, dispatchedSec: (card) => dispatchStampSec(card, root) });
    const newest = recentCheckpoints(1, root)[0];
    return loopReadings({
      cards,
      sinceSec: newest === undefined ? null : newest.sec,
      problems,
    });
  } catch {
    return new Map();
  }
}

/**
 * @typedef {object} Measured
 * @property {"reading" | "estimate"} kind
 * @property {string} text
 */

/**
 * ONE SWITCH'S MEASURED COLUMN — a reading if the tree carries one for
 * a band this switch names, and the schema's cost labelled as the
 * seat's ESTIMATE otherwise.
 *
 * The first band that HAS a reading wins, and the ones that do not are
 * named beside it: a switch measured by three bands of which one has
 * been read is not "measured", and a reader deciding whether to turn it
 * off is owed the difference.
 *
 * @param {{ band: readonly string[], cost: string }} row
 * @param {Map<string, { value: number, derivation: string }>} readings
 * @param {Map<string, string>} units
 * @returns {Measured}
 */
export function measuredFor(row, readings, units) {
  for (const id of row.band) {
    const reading = readings.get(id);
    if (reading === undefined) continue;
    const unit = units.get(id);
    const unread = row.band.filter((b) => !readings.has(b));
    return {
      kind: "reading",
      text:
        `${id} = ${fmt(reading.value)}${unit === undefined ? "" : ` ${unit}`}` +
        (unread.length === 0 ? "" : ` (unread: ${unread.join(", ")})`),
    };
  }
  const measures = row.band.length === 0 ? "no band measures this yet" : `awaiting ${row.band.join(", ")}`;
  return { kind: "estimate", text: `the seat's estimate — ${row.cost} (${measures})` };
}

/**
 * @typedef {object} SettingsRow
 * @property {string} id
 * @property {string} value
 * @property {string} what
 * @property {boolean} floor
 * @property {boolean} overridden
 * @property {string} implementation  operational, manual or declarative — what makes the row true
 * @property {string} manualAction    the instruction on a manual row, and "" on every other
 * @property {string} profileValue   the value this switch takes under the profile itself
 * @property {Measured} measured
 */

/**
 * EVERY SWITCH, IN THE SCHEMA'S ORDER, as rows.
 *
 * The order is the ledger's, and the ledger is the PARSER LIBRARY'S
 * own read — built by asking for each switch by name rather than by
 * walking the resolution's map, so a switch the resolution lost is a
 * throw here exactly as it is at a dispatch. A settings screen that
 * quietly rendered one row fewer than the loop has is the failure this
 * borrows its way out of.
 *
 * @param {{ schema: import("../../../lib/parser/dist/pure.js").ProcessSchema, settings: import("../../../lib/parser/dist/pure.js").ProcessSettings, readings: Map<string, { value: number, derivation: string }>, units: Map<string, string> }} input
 * @returns {SettingsRow[]}
 */
export function settingsRows(input) {
  const { schema, settings, readings, units } = input;
  return processLedger(schema, settings).map((row) => {
    const sw = schema.switches.get(row.id);
    return {
      id: row.id,
      value: row.value,
      what: row.what,
      floor: row.floor,
      overridden: row.overridden,
      implementation: row.implementation,
      manualAction: row.manualAction,
      profileValue: sw === undefined ? row.value : (sw.profiles.get(settings.profile) ?? row.value),
      measured: measuredFor(row, readings, units),
    };
  });
}

/**
 * THE LISTING — the profile, then every switch with its state, its
 * one-line explanation and its measured column.
 *
 * @param {{ loaded: import("./dispatch-brief.mjs").LoadedProcess, rows: readonly SettingsRow[] }} input
 * @returns {string}
 */
export function renderSettings(input) {
  const { loaded, rows } = input;
  const { schema, settings } = loaded;
  const floors = rows.filter((r) => r.floor).length;
  const departures = rows.filter((r) => r.overridden);
  /** @type {string[]} */
  const out = [
    `profile: ${settings.profile} — ${schema.profiles.get(settings.profile) ?? ""}`,
    `available: ${settings.available.join(", ")}`,
    `${String(rows.length)} switch(es), ${String(floors)} of them FLOOR (no profile turns them ` +
      `off), ${String(departures.length)} departure(s) from the profile`,
    `declared once in ${PROCESS_SCHEMA}; this project's section is in ${RUNTIME_TEMPLATE}`,
    "",
  ];
  for (const row of rows) {
    const marks = [
      row.floor ? "FLOOR" : "",
      row.overridden ? `DEPARTURE — ${settings.profile} is ${row.profileValue}` : "",
    ].filter((m) => m !== "");
    // THE LABEL RIDES IN A BRACKET OF ITS OWN, AFTER THE MARKS (T-299-s6).
    // `FLOOR` and `DEPARTURE` say what this PROJECT has done with the row;
    // the label says what the row IS, which is a different question and the
    // one that decides whether editing it is worth anything. Its own
    // bracket is also what keeps the marks bracket the string it has always
    // been, so a reader — and a body — that matches on `[FLOOR` or on a
    // whole `[DEPARTURE — …]` still reads what it read before.
    out.push(
      `  ${row.id} = ${row.value}${marks.length === 0 ? "" : `  [${marks.join("; ")}]`}` +
        `  [${row.implementation}]`,
    );
    out.push(`      ${row.what}`);
    // AND A MANUAL ROW CARRIES ITS INSTRUCTION BESIDE THE VALUE. The label
    // alone tells a reader the setting does nothing by itself; the action
    // is the half that tells them what does.
    if (row.manualAction !== "") out.push(`      manual action: ${row.manualAction}`);
    out.push(`      measured: ${row.measured.text}`);
  }
  out.push("");
  out.push(`  ${USAGE.split("\n")[1] ?? ""}`);
  return out.join("\n");
}

// ── the edit ─────────────────────────────────────────────────────────

/**
 * @typedef {object} SetPlan
 * @property {string} id
 * @property {string} value
 * @property {boolean} remove   true when the value IS the profile's own, so the departure goes
 * @property {string} was
 */

/**
 * WHAT `set` WOULD DO, and every refusal it owes, DECIDED BEFORE
 * ANYTHING IS WRITTEN.
 *
 * Five mistakes, each reported as itself: an id the schema does not
 * declare, a FLOOR switch, a DECLARATIVE row — one nothing reads, so a
 * departure would move the template and change nothing else — a value
 * outside that switch's own set, and a
 * combination the constraints forbid. The last is not this file's
 * judgement — it is `constraintFindings`, the PARSER LIBRARY'S own,
 * run over the settings the write WOULD produce, so the refusal names
 * both switches and both values in the schema's own words, and a
 * constraint added to the schema is enforced here the day it lands.
 *
 * SETTING A SWITCH TO THE PROFILE'S OWN VALUE REMOVES THE DEPARTURE
 * rather than writing one. The template's section names the profile and
 * the departures ONLY, and a departure that departs from nothing is a
 * line that will read as a decision to the next person to open the
 * file.
 *
 * @param {{ schema: import("../../../lib/parser/dist/pure.js").ProcessSchema, settings: import("../../../lib/parser/dist/pure.js").ProcessSettings, id: string, value: string }} input
 * @returns {SetPlan}
 */
export function setPlan(input) {
  const { schema, settings, id, value } = input;
  const sw = schema.switches.get(id);
  if (sw === undefined) {
    throw new SettingsFinding(
      `settings set: \`${id}\` is not a switch ${PROCESS_SCHEMA} declares, so no surface could ` +
        "explain it and the arm would never read it. Run `supertaskr settings` for the switches " +
        "this project has.",
    );
  }
  if (sw.floor) {
    throw new SettingsFinding(
      `settings set: \`${id}\` is FLOOR — no profile turns it off (${sw.what}). The floor is the ` +
        "set the room ruled a project may not refine, so this is refused rather than written.",
    );
  }
  // A DECLARATIVE ROW IS A RECORD AND NOT A CONTROL, SO THE WRITE IS
  // REFUSED (T-299-s6, the card's third criterion). Nothing reads such a
  // row's value and no instruction is addressed to a seat by it, so a
  // departure written here would move the template and change nothing
  // else — which is worse than changing nothing, because the template
  // would then say this project had made a decision it has not made.
  //
  // THE CODE IS IN THE MESSAGE AND THE EXIT IS THE HOUSE'S. The card's
  // amendment of 2026-09-13 rules this a finding CODE at the existing
  // refusal exit rather than a fifth exit: the caller asked for something
  // the schema does not allow, which is what CALLED WRONG already means,
  // and a new exit would fork this verb's vocabulary from every other.
  if (sw.implementation === "declarative") {
    throw new SettingsFinding(
      `settings set: declarative — \`${id}\` is a DECLARATIVE row: nothing reads its value and ` +
        "no instruction is addressed to a seat by it, so a departure written here would move " +
        `${RUNTIME_TEMPLATE} and change nothing else. That is not the same as the behaviour ` +
        "being absent — what the row describes lives in code or in CI configuration that never " +
        `consults ${PROCESS_SCHEMA}, and moving it means moving that. NOTHING was written. Run ` +
        "`supertaskr settings` for each row's label: an operational row is the one this command " +
        "can change.",
    );
  }
  if (!sw.values.includes(value)) {
    throw new SettingsFinding(
      `settings set: \`${value}\` is not one of \`${id}\`'s values (${sw.values.join(", ")}).`,
    );
  }
  /** @type {import("../../../lib/parser/dist/pure.js").ProcessSettings} */
  const next = {
    profile: settings.profile,
    available: settings.available,
    values: new Map(settings.values),
    overridden: new Set(settings.overridden),
  };
  const was = settings.values.get(id) ?? "";
  const profileValue = sw.profiles.get(settings.profile) ?? "";
  const remove = value === profileValue;
  next.values.set(id, value);
  if (remove) next.overridden.delete(id);
  else next.overridden.add(id);
  const findings = constraintFindings(schema, next);
  if (findings.length > 0) {
    throw new SettingsFinding(
      `settings set: \`${id}\` = \`${value}\` is a combination ${PROCESS_SCHEMA} forbids, so ` +
        `NOTHING was written:\n  - ${findings.join("\n  - ")}`,
    );
  }
  return { id, value, remove, was };
}

/** A scalar YAML would read back as something other than this string. */
const YAML_BOOLISH = /^(?:y|n|yes|no|on|off|true|false|null|~)$/i;

/** A scalar a YAML reader takes as a bare string, unquoted. */
const YAML_BARE = /^[A-Za-z][A-Za-z0-9_.-]*$/;

/**
 * ONE VALUE, SPELLED SO A RE-READ GIVES BACK THE SAME STRING.
 *
 * `off` and `on` are the whole reason this exists: they are two of this
 * schema's commonest values and both are BOOLEANS to a YAML reader, so
 * a toggle written bare comes back as `false`, fails its own value set
 * and takes the tree to the refusal `loadProcess` keeps for a project
 * that contradicts itself — written by the command whose job was to
 * keep it consistent. The schema's own rows quote them for this reason.
 *
 * @param {string} value
 * @returns {string}
 */
export function yamlScalar(value) {
  if (YAML_BARE.test(value) && !YAML_BOOLISH.test(value)) return value;
  return JSON.stringify(value);
}

/**
 * @typedef {object} SwitchesBlock
 * @property {number} at        the line index of the `switches:` key
 * @property {number} insertAt  where a new entry goes
 * @property {Map<string, number>} entries  override id → its line index
 */

/**
 * THE `switches:` BLOCK OF THE TEMPLATE'S `process:` SECTION, located
 * rather than reconstructed.
 *
 * The section is method text: a human wrote its comments and its
 * ordering, and an editor that round-tripped it through a YAML emitter
 * would hand back a file with every comment gone and call it the same
 * document. So the edit is a LINE edit — one line replaced, removed or
 * inserted — and everything else in the file survives byte for byte.
 *
 * @param {readonly string[]} lines
 * @returns {SwitchesBlock}
 */
export function switchesBlock(lines) {
  const sectionAt = lines.findIndex((l) => /^process:\s*(?:#.*)?$/.test(l));
  if (sectionAt === -1) {
    throw new SettingsFinding(
      `${RUNTIME_TEMPLATE} carries no \`process:\` section, so this project names no profile to ` +
        "depart from. Nothing was written.",
    );
  }
  let at = -1;
  let insertAt = -1;
  /** @type {Map<string, number>} */
  const entries = new Map();
  for (let i = sectionAt + 1; i < lines.length; i += 1) {
    const line = /** @type {string} */ (lines[i]);
    if (line.trim() === "") continue;
    if (line.trimStart().startsWith("#")) {
      // A COMMENT INSIDE THE BLOCK IS CONTENT AND A BLANK LINE IS NOT.
      // The insertion point is the last line that carries something, so
      // an entry lands under the block's own prose and the file keeps
      // its trailing newline — a `switches:` block ending in a comment
      // and a newline is the shape this method's template ships.
      if (at !== -1) insertAt = Math.max(insertAt, i);
      continue;
    }
    if (!/^\s/.test(line)) break;
    const indent = line.length - line.trimStart().length;
    if (indent <= 2) {
      if (at !== -1 && indent === 2) break;
      if (/^\s*switches:/.test(line)) {
        at = i;
        insertAt = i;
      }
      continue;
    }
    if (at === -1) continue;
    const m = /^\s*([A-Za-z0-9_.-]+):/.exec(line);
    if (m !== null) entries.set(/** @type {string} */ (m[1]), i);
    insertAt = i;
  }
  if (at === -1) {
    throw new SettingsFinding(
      `${RUNTIME_TEMPLATE}'s \`process:\` section carries no \`switches:\` key, so there is no ` +
        "block to write a departure into. Add `  switches:` under `process:` and run this again; " +
        "nothing was written.",
    );
  }
  return { at, insertAt, entries };
}

/**
 * THE TEMPLATE, EDITED — one line, and the file's shape kept.
 *
 * @param {string} templateYaml
 * @param {SetPlan} plan
 * @returns {string}
 */
export function editTemplate(templateYaml, plan) {
  const lines = templateYaml.split("\n");
  const block = switchesBlock(lines);
  const existing = block.entries.get(plan.id);
  const entry = `    ${plan.id}: ${yamlScalar(plan.value)}`;
  if (existing !== undefined) {
    if (plan.remove) return [...lines.slice(0, existing), ...lines.slice(existing + 1)].join("\n");
    return [...lines.slice(0, existing), entry, ...lines.slice(existing + 1)].join("\n");
  }
  if (plan.remove) return templateYaml;
  const after = block.insertAt + 1;
  return [...lines.slice(0, after), entry, ...lines.slice(after)].join("\n");
}

// ── the reference ────────────────────────────────────────────────────

/**
 * THE REFERENCE CHAPTER, GENERATED FROM THE SCHEMA AND FROM NOTHING
 * ELSE.
 *
 * A function of the SCHEMA ALONE, deliberately: the page says what the
 * switches ARE, not what this project has them set to, so `settings
 * set` never stales it and the currency body reds for exactly one
 * reason — a schema that changed and a page nobody regenerated.
 *
 * @param {import("../../../lib/parser/dist/pure.js").ProcessSchema} schema
 * @returns {string}
 */
export function renderReference(schema) {
  const floors = [...schema.switches.values()].filter((s) => s.floor);
  // THE LABEL COUNTS, DERIVED FROM THE ROWS AND NEVER TYPED (T-299-s6).
  // How many of the loop's switches are executable controls is the first
  // thing a reader of this page wants and the last thing a sentence
  // typed here would keep true.
  /** @param {string} want @returns {number} */
  const labelled = (want) => [...schema.switches.values()].filter((s) => s.implementation === want).length;
  /** @type {string[]} */
  const out = [
    "# 15 — Settings",
    "",
    "<!-- GENERATED — do not edit by hand (T-300, ADR-024 decision 6).",
    "     Regenerate:  node tools/e2e/scripts/settings.mjs reference --write",
    "     Currency:    tools/e2e/tests/cli.spec.ts compares the committed page",
    "                  against a fresh generation, so a schema edit nobody",
    "                  regenerated reds the end-to-end suite.",
    `     Source: ${PROCESS_SCHEMA}, and nothing else. Every sentence below`,
    "     is a field of that file; none of it is typed here, and none of it",
    "     depends on what this project has its own switches set to. -->",
    "",
    `The loop's own switches, at schema version ${String(schema.version)}: ` +
      `${String(schema.switches.size)} of them under ${String(schema.profiles.size)} profiles, ` +
      `${String(floors.length)} of which are FLOOR — no profile turns them off.`,
    "",
    `Each row says what makes it true: ${String(labelled("operational"))} are OPERATIONAL — the ` +
      `arm reads them and changing the value changes what it does — ${String(labelled("manual"))} ` +
      "are MANUAL, where a person or a seat performs what the row names and the row carries that " +
      `instruction, and ${String(labelled("declarative"))} are DECLARATIVE: a record rather than ` +
      "a control, read by nothing and addressed to nobody, so editing one alone changes nothing. " +
      "A declarative row is not an absent behaviour — what it describes lives in code or in CI " +
      "configuration that never consults this schema.",
    "",
    "## The command",
    "",
    "```",
    USAGE,
    "```",
    "",
    "## The profiles",
    "",
  ];
  for (const [id, what] of schema.profiles) out.push(`- **\`${id}\`** — ${what}`);
  out.push("");
  out.push("## The switches");
  out.push("");
  for (const sw of schema.switches.values()) {
    out.push(`### \`${sw.id}\``);
    out.push("");
    out.push(sw.what);
    out.push("");
    out.push(`- **effect** — ${sw.effect}`);
    out.push(`- **type** — ${sw.type} of ${sw.values.map((v) => `\`${v}\``).join(" · ")}`);
    out.push(
      `- **needs** — ${sw.needs.length === 0 ? "nothing" : sw.needs.map((n) => `\`${n}\``).join(" · ")}`,
    );
    out.push(`- **floor** — ${sw.floor ? "yes; an override that turns it off is refused" : "no"}`);
    out.push(`- **reads** — \`${sw.reads}\``);
    out.push(
      `- **band** — ${sw.band.length === 0 ? "no band measures this yet" : sw.band.map((b) => `\`${b}\``).join(" · ")}`,
    );
    out.push(`- **cost** — ${sw.cost}`);
    out.push(`- **implementation** — ${sw.implementation}`);
    if (sw.manualAction !== "") out.push(`- **manual action** — ${sw.manualAction}`);
    out.push(
      `- **profiles** — ${[...sw.profiles].map(([p, v]) => `\`${p}\`: \`${v}\``).join(" · ")}`,
    );
    out.push("");
  }
  return `${out.join("\n").trimEnd()}\n`;
}

/**
 * ONE WRITE, AND A REFUSED ONE SAID RATHER THAN THROWN.
 *
 * A lane's own worktree is `chmod a-w` outside its fence (the lane
 * lock), and this command's ONE write goes to method text — so the
 * commonest place anybody will run `set` is a tree where the file is
 * deliberately not writable. A stack trace there reads as a bug in this
 * command; the truth is that the fence held, and the message says so.
 *
 * @param {string} abs
 * @param {string} text
 * @param {(s: string) => void} err
 * @returns {number | null} an exit code when the write was refused, null when it landed
 */
function write(abs, text, err) {
  try {
    writeFileSync(abs, text);
    return null;
  } catch (e) {
    err(
      `supertaskr settings: ${abs} could not be written — ` +
        `${e instanceof Error ? e.message : String(e)}. Nothing was changed. In a lane worktree ` +
        "a file outside the card's own fence is held read-only on purpose.",
    );
    return EXIT.CANNOT_RUN;
  }
}

// ── the runner ───────────────────────────────────────────────────────

/**
 * @param {string[]} argv
 * @param {{ stdout?: (s: string) => void, stderr?: (s: string) => void, readings?: Map<string, { value: number, derivation: string }> }} [io]
 * @returns {number}
 */
export function main(argv, io = {}) {
  const out = io.stdout ?? ((/** @type {string} */ s) => process.stdout.write(`${s}\n`));
  const err = io.stderr ?? ((/** @type {string} */ s) => process.stderr.write(`${s}\n`));
  let root = repoRoot;
  /** @type {string[]} */
  const rest = [];
  for (let i = 0; i < argv.length; i += 1) {
    const a = /** @type {string} */ (argv[i]);
    if (a === "--root") {
      root = path.resolve(argv[i + 1] ?? "");
      i += 1;
      continue;
    }
    if (a === "--help" || a === "-h") {
      out(USAGE);
      return EXIT.CLEAN;
    }
    rest.push(a);
  }

  /** @type {import("./dispatch-brief.mjs").LoadedProcess | null} */
  let loaded = null;
  try {
    loaded = loadProcess(root);
  } catch (e) {
    err(`supertaskr settings: ${e instanceof Error ? e.message : String(e)}`);
    return EXIT.CANNOT_RUN;
  }
  if (loaded === null) {
    err(
      `supertaskr settings: ${root} carries no ${PROCESS_SCHEMA} with a \`process:\` section in ` +
        `${RUNTIME_TEMPLATE}, so this project declares no switches to render. A tree that ` +
        "predates the settings is not a misconfiguration — it has nothing to show.",
    );
    return EXIT.CANNOT_RUN;
  }

  const verb = rest[0];
  if (verb === undefined) {
    const readings = io.readings ?? treeReadings(root);
    out(renderSettings({ loaded, rows: settingsRows({ ...loaded, readings, units: bandUnits() }) }));
    return EXIT.CLEAN;
  }

  if (verb === "reference") {
    const text = renderReference(loaded.schema);
    const abs = path.join(root, REFERENCE_DOC);
    if (rest.includes("--write")) {
      const refused = write(abs, text, err);
      if (refused !== null) return refused;
      out(`supertaskr settings: ${REFERENCE_DOC} written, ${String(Buffer.byteLength(text))} bytes.`);
      return EXIT.CLEAN;
    }
    if (rest.includes("--check")) {
      const committed = existsSync(abs) ? readFileSync(abs, "utf8") : "";
      if (committed === text) {
        out(`supertaskr settings: ${REFERENCE_DOC} is a current generation of ${PROCESS_SCHEMA}.`);
        return EXIT.CLEAN;
      }
      err(
        `supertaskr settings: ${REFERENCE_DOC} is STALE against ${PROCESS_SCHEMA} — it is ` +
          `${String(Buffer.byteLength(committed))} bytes and a fresh generation is ` +
          `${String(Buffer.byteLength(text))}. ` +
          "Run `supertaskr settings reference --write` and commit what it wrote.",
      );
      return EXIT.FOUND;
    }
    out(text);
    return EXIT.CLEAN;
  }

  if (verb === "set") {
    const id = rest[1];
    const value = rest[2];
    if (id === undefined || value === undefined || rest.length > 3) {
      err(`supertaskr settings set: takes exactly a switch and a value.\n\n${USAGE}`);
      return EXIT.USAGE;
    }
    /** @type {SetPlan} */
    let plan;
    try {
      plan = setPlan({ schema: loaded.schema, settings: loaded.settings, id, value });
    } catch (e) {
      err(e instanceof Error ? e.message : String(e));
      return EXIT.USAGE;
    }
    const abs = path.join(root, RUNTIME_TEMPLATE);
    const before = readFileSync(abs, "utf8");
    /** @type {string} */
    let after;
    try {
      after = editTemplate(before, plan);
    } catch (e) {
      err(e instanceof Error ? e.message : String(e));
      return EXIT.USAGE;
    }
    if (after === before) {
      out(`supertaskr settings: \`${id}\` is already \`${value}\`; ${RUNTIME_TEMPLATE} unchanged.`);
      return EXIT.CLEAN;
    }
    const refused = write(abs, after, err);
    if (refused !== null) return refused;
    out(
      plan.remove
        ? `supertaskr settings: \`${id}\` is \`${value}\` under \`${loaded.settings.profile}\`, so ` +
            `the departure was REMOVED from ${RUNTIME_TEMPLATE} rather than written — that ` +
            "section names the profile and the departures only."
        : `supertaskr settings: \`${id}\` ${plan.was} -> ${plan.value}, written into ` +
            `${RUNTIME_TEMPLATE} as a departure from \`${loaded.settings.profile}\`.`,
    );
    return EXIT.CLEAN;
  }

  err(`supertaskr settings: \`${verb}\` is not a subcommand of this verb.\n\n${USAGE}`);
  return EXIT.USAGE;
}

if (process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}
