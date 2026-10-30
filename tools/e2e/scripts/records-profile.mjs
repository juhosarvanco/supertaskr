/** Shared pure ordinary text eligibility and profile. No committed reader, binding or
 * candidate capture is loaded merely to classify a path. */
import {isTaskFilePath,isComponentFilePath} from "../../../lib/parser/dist/pure.js";
import {INDEX_DOC,INDEX_RULING} from "./docs-scan.mjs";
import {RecordReaderFinding} from "./records-finding.mjs";
/** @param {string} code @param {string} detail @returns {never} */
function refuse(code,detail){throw new RecordReaderFinding(code,detail);}
/** @param {any} value @returns {any} */
function freeze(value){if(value&&typeof value==="object"){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
/** @param {string} relativePath */
function chapterPath(relativePath) { return /^docs\/conventions\/[a-z0-9-]+\.md$/.test(relativePath); }
/** Explicit ordinary text classes; a safe path alone is never eligibility.
 * Templates and generated/private authority inputs retain their own exclusions.
 * @param {string} relativePath */
export function ordinaryRecordTextPath(relativePath) {
  if (relativePath === INDEX_DOC || relativePath === INDEX_RULING.file || relativePath === "docs/CAPABILITIES.md") return false;
  return isTaskFilePath(relativePath) || isComponentFilePath(relativePath) || chapterPath(relativePath) ||
    /^docs\/(?:NORTH_STAR|STATE|STATE-template|ROADMAP|ARCHITECTURE|CONVENTIONS|VERSIONS|future)\.md$/.test(relativePath) ||
    /^docs\/(?:architecture|rooms|decisions|plans|reviews|checkpoints|design|guide|reference|research|business|benches)\/(?:[\p{L}\p{N}_][\p{L}\p{M}\p{N} ._-]*\/)*[\p{L}\p{N}_][\p{L}\p{M}\p{N} ._-]*\.md$/u.test(relativePath);
}
/** Explicit blank-method profile, selected by an installed service. It is not
 * inferred from an absent ruling or offered as a weaker per-save switch. */
export const GENERIC_RECORD_PROFILE = freeze({ version: 1, kind: "generic", indexInputs:
  ["docs/ROADMAP.md", "docs/ARCHITECTURE.md", "docs/CONVENTIONS.md"], budgets: {} });
/** @param {any} profile */
export function normalizeRecordProfile(profile) {
  if (profile === undefined) return freeze({ version: 1, kind: "dogfood" });
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) refuse("records-profile-invalid", "explicit profile must be a mapping");
  if (profile.version === 1 && profile.kind === "dogfood" && Object.keys(profile).sort().join(",") === "kind,version") return freeze({ ...profile });
  if (Object.keys(profile).sort().join(",") !== "budgets,indexInputs,kind,version" || profile.version !== 1 || profile.kind !== "generic" ||
      !Array.isArray(profile.indexInputs) || profile.indexInputs.length < 3 || new Set(profile.indexInputs).size !== profile.indexInputs.length ||
      profile.indexInputs.some((/** @type {any} */ file) => typeof file !== "string" || !ordinaryRecordTextPath(file)) ||
      GENERIC_RECORD_PROFILE.indexInputs.some((/** @type {string} */ file) => !profile.indexInputs.includes(file)) ||
      !profile.budgets || typeof profile.budgets !== "object" || Array.isArray(profile.budgets)) refuse("records-profile-invalid", "generic profile declares its complete required records inputs and budgets");
  for (const [file, budget] of Object.entries(profile.budgets)) {
    const b = /** @type {any} */ (budget);
    if (!ordinaryRecordTextPath(file) || !b || typeof b !== "object" || Object.keys(b).sort().join(",") !== "fail,warn" ||
        !Number.isSafeInteger(b.warn) || !Number.isSafeInteger(b.fail) || b.warn < 0 || b.fail < b.warn) refuse("records-profile-invalid", "invalid candidate byte budget");
  }
  return freeze(JSON.parse(JSON.stringify(profile)));
}
