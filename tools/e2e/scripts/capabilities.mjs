/**
 * capabilities.mjs — generates docs/CAPABILITIES.md from the e2e spec
 * names (T-138-s1, ADR-019).
 *
 * The product-shaped read-first entry is GENERATED, never written by
 * hand: a sentence assembled from a test name is kept true by running —
 * it is false the moment its body reds — while a hand-maintained
 * document reproduces the exact failure T-138 records.
 *
 * WHAT IT EXTRACTS, and the honest-omission rule that governs it:
 *  - every single-line `test("…")` literal;
 *  - every single-line `test(`…`)` template, with its enclosing
 *    `for (const X of …)` loop expanded when the iterable resolves to
 *    a LITERAL — an inline array, a same-file `const` array of strings
 *    or objects, a tuple array of [string, sameFileConstObject], or a
 *    named import from a `.mjs` this script can import;
 *  - whatever it CANNOT resolve is NAMED in the document, with its
 *    file, line, raw template and reason. A generated document that
 *    quietly omits is worse than prose that visibly goes stale
 *    (T-138-s1). No sentence is ever emitted with a guessed value.
 *
 * MODES (the house exit contract — 0 clean · 1 the gate's verdict ·
 * 2 called wrong · 3 could not run):
 *    node scripts/capabilities.mjs            regenerate the document
 *    node scripts/capabilities.mjs --check    write nothing; exit 1 if
 *                                             the committed document
 *                                             differs from a fresh
 *                                             generation, naming both
 *                                             censuses
 *
 * Output is DETERMINISTIC: no timestamp, files in alphabetical order,
 * tests in file order — so `--check` is a byte comparison and a clean
 * regeneration is a 0-byte diff.
 */

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const e2eRoot = path.resolve(here, "..");
const repoRoot = path.resolve(e2eRoot, "..", "..");
const testsDir = path.join(e2eRoot, "tests");
const outPath = path.join(repoRoot, "docs", "CAPABILITIES.md");

/** @typedef {{ file: string, line: number, raw: string, reason: string, count: number | null }} Omission */

/** Parse one array-literal body into entries (strings or flat objects). */
function parseArrayLiteral(body) {
  const entries = [];
  // String entries: "…" — tolerate escaped quotes.
  const stringOnly = body.replace(/\{[^}]*\}/g, "");
  const objectBodies = [...body.matchAll(/\{([^}]*)\}/g)].map((m) => m[1]);
  if (objectBodies.length > 0) {
    for (const objBody of objectBodies) {
      /** @type {Record<string, string | number>} */
      const obj = {};
      for (const kv of objBody.matchAll(/(\w+)\s*:\s*("(?:[^"\\]|\\.)*"|\d+)/g)) {
        const v = kv[2];
        obj[kv[1]] = v.startsWith('"') ? JSON.parse(v) : Number(v);
      }
      entries.push(obj);
    }
    return entries;
  }
  for (const s of stringOnly.matchAll(/"((?:[^"\\]|\\.)*)"/g)) entries.push(JSON.parse(`"${s[1]}"`));
  return entries;
}

/** Find `const NAME = [ … ]` in text and parse it; null if absent. */
function sameFileArrayConst(text, name) {
  const m = text.match(new RegExp(`const\\s+${name}\\s*=\\s*\\[`));
  if (!m) return null;
  const start = m.index + m[0].length - 1;
  let depth = 0;
  for (let i = start; i < text.length; i += 1) {
    if (text[i] === "[") depth += 1;
    if (text[i] === "]") {
      depth -= 1;
      if (depth === 0) return parseArrayLiteral(text.slice(start + 1, i));
    }
  }
  return null;
}

/** Find `const NAME = "…"` (a plain string) in text; null if absent. */
function sameFileStringConst(text, name) {
  const m = text.match(new RegExp(`const\\s+${name}\\s*=\\s*"((?:[^"\\\\]|\\\\.)*)"`));
  return m ? JSON.parse(`"${m[1]}"`) : null;
}

/**
 * Resolve an identifier imported by the spec. A `.mjs` target is
 * imported for real; anything else is a refusal, never a guess.
 */
async function importedValue(specText, specDir, name) {
  const m = specText.match(
    new RegExp(`import\\s*\\{[^}]*\\b${name}\\b[^}]*\\}\\s*from\\s*"([^"]+)"`, "s"),
  );
  if (!m) return { ok: false, reason: `\`${name}\` is neither defined in this file nor imported` };
  const target = m[1];
  if (!target.endsWith(".mjs")) {
    return { ok: false, reason: `\`${name}\` is imported from \`${target}\`, which this script does not execute` };
  }
  const mod = await import(pathToFileURL(path.resolve(specDir, target)).href);
  if (!(name in mod)) return { ok: false, reason: `\`${target}\` has no export \`${name}\`` };
  return { ok: true, value: mod[name] };
}

/** Substitute every ${expr} in a template against one iteration binding. */
function substitute(template, bindings) {
  let failed = null;
  const out = template.replace(/\$\{([^}]+)\}/g, (_, exprRaw) => {
    const expr = exprRaw.trim();
    const [head, ...props] = expr.split(".");
    let v = bindings[head];
    for (const p of props) v = v === undefined || v === null ? undefined : v[p];
    if (v === undefined || typeof v === "object") {
      failed = expr;
      return "";
    }
    return String(v);
  });
  return failed ? { ok: false, expr: failed } : { ok: true, text: out };
}

/**
 * Find the for-loop that ENCLOSES line i, or null. Two hazards this
 * must not fall for, both measured on the live tree: a `for` inside a
 * PREVIOUS test body whose block already closed before line i (an
 * assertion loop is not an enclosing loop), and a for-header whose
 * iterable spans multiple lines. The header is flattened by paren
 * depth; enclosure is proven by walking brace depth from the loop's
 * own `{` to line i and requiring it never to return to zero.
 */
function enclosingLoop(lines, i) {
  for (let j = i - 1; j >= Math.max(0, i - 40); j -= 1) {
    if (!/^\s*for\s*\(const\s+/.test(lines[j])) continue;
    // Flatten the header until its parenthesis closes.
    let header = "";
    let paren = 0;
    let started = false;
    let headerEnd = j;
    for (let k = j; k < Math.min(lines.length, j + 8); k += 1) {
      for (const ch of lines[k]) {
        if (ch === "(") {
          paren += 1;
          started = true;
        }
        if (ch === ")") paren -= 1;
      }
      header += `${lines[k]} `;
      if (started && paren === 0) {
        headerEnd = k;
        break;
      }
    }
    const fm = header.match(/for\s*\(const\s+(\[[^\]]*\]|\w+)\s+of\s+([\s\S]+?)\)\s*\{?\s*$/);
    if (!fm) continue;
    // Enclosure: from the loop's opening brace, depth must stay > 0
    // through the end of line i-1.
    const tail = lines.slice(headerEnd, i).join("\n");
    const braceAt = tail.indexOf("{");
    if (braceAt === -1) continue;
    let depth = 0;
    let open = true;
    for (let c = braceAt; c < tail.length; c += 1) {
      if (tail[c] === "{") depth += 1;
      if (tail[c] === "}") depth -= 1;
      if (depth === 0) {
        open = false;
        break;
      }
    }
    if (!open) continue;
    return {
      binding: fm[1].replace(/\s+/g, " ").trim(),
      expr: fm[2].replace(/\s+as\s+const\s*$/, "").replace(/\s+/g, " ").trim(),
    };
  }
  return null;
}

/** Extract sentences and omissions from one spec file. */
async function extractFile(fileName) {
  const filePath = path.join(testsDir, fileName);
  const text = readFileSync(filePath, "utf8");
  const lines = text.split("\n");
  /** @type {{ line: number, sentences: string[] }[]} */
  const found = [];
  /** @type {Omission[]} */
  const omissions = [];

  for (let i = 0; i < lines.length; i += 1) {
    const literal = lines[i].match(/^\s*test\(\s*"((?:[^"\\]|\\.)*)"/);
    if (literal) {
      found.push({ line: i + 1, sentences: [JSON.parse(`"${literal[1]}"`)] });
      continue;
    }
    const tpl = lines[i].match(/^\s*test\(\s*`([^`]*)`/);
    if (!tpl) continue;
    const raw = tpl[1];
    const lineNo = i + 1;

    const loop = enclosingLoop(lines, i);

    if (!loop) {
      // A standalone template: resolve each ${IDENT} from same-file or imported consts.
      /** @type {Record<string, unknown>} */
      const bindings = {};
      let reason = null;
      for (const ph of raw.matchAll(/\$\{([^}]+)\}/g)) {
        const name = ph[1].trim().split(".")[0];
        if (bindings[name] !== undefined) continue;
        const local = sameFileStringConst(text, name);
        if (local !== null) {
          bindings[name] = local;
          continue;
        }
        const imp = await importedValue(text, testsDir, name);
        if (imp.ok) bindings[name] = imp.value;
        else reason = imp.reason;
      }
      if (reason) {
        omissions.push({ file: fileName, line: lineNo, raw, reason, count: 1 });
        continue;
      }
      const sub = substitute(raw, bindings);
      if (sub.ok) found.push({ line: lineNo, sentences: [sub.text] });
      else omissions.push({ file: fileName, line: lineNo, raw, reason: `\`\${${sub.expr}}\` did not resolve`, count: 1 });
      continue;
    }

    // A loop-expanded family: resolve the iterable to literal values.
    let values = null;
    let reason = null;
    let knownCount = null;
    if (loop.expr.startsWith("[")) {
      // Inline array — of strings, or of [string, IDENT] tuples.
      const tuples = [...loop.expr.matchAll(/\[\s*"((?:[^"\\]|\\.)*)"\s*,\s*(\w+)\s*\]/g)];
      if (tuples.length > 0) {
        knownCount = tuples.length;
        values = [];
        for (const t of tuples) {
          const label = JSON.parse(`"${t[1]}"`);
          const objText = text.match(new RegExp(`const\\s+${t[2]}\\s*=\\s*\\{([^}]*)\\}`));
          if (!objText || /\w+\s*\(|\w+\.\w+/.test(objText[1])) {
            reason =
              `\`${t[2]}\` is not a literal object` +
              (objText ? " — its fields are computed at run time" : "");
            values = null;
            break;
          }
          values.push([label, parseArrayLiteral(`{${objText[1]}}`)[0]]);
        }
      } else {
        values = parseArrayLiteral(loop.expr.slice(1, -1));
      }
    } else if (/^\w+$/.test(loop.expr)) {
      values = sameFileArrayConst(text, loop.expr);
      if (!values) {
        const imp = await importedValue(text, testsDir, loop.expr);
        if (imp.ok && Array.isArray(imp.value)) values = [...imp.value];
        else reason = imp.ok ? `\`${loop.expr}\` is not an array` : imp.reason;
      }
    } else {
      reason = `the iterable \`${loop.expr}\` is an expression, not a name or literal`;
    }

    if (!values || values.length === 0) {
      omissions.push({
        file: fileName,
        line: lineNo,
        raw,
        reason: reason ?? `the iterable \`${loop.expr}\` did not resolve`,
        count: knownCount,
      });
      continue;
    }

    const sentences = [];
    let failedExpr = null;
    for (const v of values) {
      /** @type {Record<string, unknown>} */
      const bindings = {};
      const destructured = loop.binding.match(/^\[\s*(\w+)\s*,\s*(\w+)\s*\]$/);
      if (destructured && Array.isArray(v)) {
        bindings[destructured[1]] = v[0];
        bindings[destructured[2]] = v[1];
      } else {
        bindings[loop.binding] = v;
      }
      const sub = substitute(raw, bindings);
      if (!sub.ok) {
        failedExpr = sub.expr;
        break;
      }
      sentences.push(sub.text);
    }
    if (failedExpr) {
      omissions.push({
        file: fileName,
        line: lineNo,
        raw,
        reason: `\`\${${failedExpr}}\` did not resolve against the iterable's literal entries`,
        count: values.length,
      });
    } else {
      found.push({ line: lineNo, sentences });
    }
  }

  found.sort((a, b) => a.line - b.line);
  return { sentences: found.flatMap((f) => f.sentences), omissions };
}

async function generate() {
  const files = readdirSync(testsDir)
    .filter((f) => f.endsWith(".spec.ts"))
    .sort();
  /** @type {{ topic: string, sentences: string[] }[]} */
  const sections = [];
  /** @type {Omission[]} */
  const omissions = [];
  for (const f of files) {
    const r = await extractFile(f);
    if (r.sentences.length > 0) sections.push({ topic: f.replace(/\.spec\.ts$/, ""), sentences: r.sentences });
    omissions.push(...r.omissions);
  }
  const extracted = sections.reduce((n, s) => n + s.sentences.length, 0);
  const named = omissions.reduce((n, o) => n + (o.count ?? 0), 0);
  const namedNote = omissions.some((o) => o.count === null) ? " at least" : "";

  const out = [];
  out.push("# Capabilities");
  out.push("");
  out.push("<!-- GENERATED — do not edit by hand (T-138-s1, ADR-019).");
  out.push("     Regenerate:  npm run capabilities        (from tools/e2e/)");
  out.push("     Currency:    npm run capabilities:check  (exit 1 when stale)");
  out.push("     Source: tools/e2e/tests/*.spec.ts — the test names ARE the");
  out.push("     sentences; a sentence here is false the moment its body reds,");
  out.push("     and nobody has to keep it true by hand. -->");
  out.push("");
  out.push("What this app does, one sentence per behaviour the e2e suite runs.");
  out.push("");
  out.push(
    `Census: **${extracted + named}${namedNote} behaviours** — ${extracted} extracted ` +
      `sentences + ${named}${namedNote} named-not-extracted (listed at the end) — across ` +
      `${files.length} spec files. Cross-check against the runner's own \`Running N tests\` header.`,
  );
  for (const s of sections) {
    out.push("");
    out.push(`## ${s.topic}`);
    out.push("");
    for (const sentence of s.sentences) out.push(`- ${sentence}`);
  }
  if (omissions.length > 0) {
    out.push("");
    out.push("## Not extracted — named rather than dropped");
    out.push("");
    out.push("A generated document that quietly omits is worse than prose that");
    out.push("visibly goes stale (T-138-s1). These behaviours run in the suite");
    out.push("and are not sentence-expanded here:");
    out.push("");
    for (const o of omissions) {
      out.push(
        `- \`${o.file}:${o.line}\` — ${o.count === null ? "an unknown number of" : o.count} ` +
          `behaviour(s) from \`test(\\\`${o.raw}\\\`)\`: ${o.reason}.`,
      );
    }
  }
  out.push("");
  return out.join("\n");
}

const args = process.argv.slice(2);
const check = args.includes("--check");
if (args.some((a) => a !== "--check")) {
  console.error("capabilities: usage — node scripts/capabilities.mjs [--check]");
  process.exit(2);
}

try {
  const fresh = await generate();
  if (!check) {
    writeFileSync(outPath, fresh);
    console.log(`capabilities: wrote ${path.relative(repoRoot, outPath)} (${Buffer.byteLength(fresh)} bytes)`);
    process.exit(0);
  }
  let committed = null;
  try {
    committed = readFileSync(outPath, "utf8");
  } catch {
    console.error("capabilities: STALE — docs/CAPABILITIES.md does not exist; run npm run capabilities");
    process.exit(1);
  }
  if (committed === fresh) {
    console.log(`capabilities: CURRENT (${Buffer.byteLength(fresh)} bytes)`);
    process.exit(0);
  }
  console.error(
    `capabilities: STALE — committed ${Buffer.byteLength(committed)} bytes, ` +
      `a fresh generation is ${Buffer.byteLength(fresh)} bytes; run npm run capabilities`,
  );
  process.exit(1);
} catch (err) {
  console.error(`capabilities: GATE COULD NOT RUN — ${err instanceof Error ? err.message : String(err)}`);
  process.exit(3);
}
