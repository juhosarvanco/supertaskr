/** Finite machine proposals for PRODUCT changes during an owned new-project
 * interview. Captured bytes are data, not a write grant or a semantic claim
 * that a model's interpretation is the human's exact intended meaning.
 */
import {createHash} from "node:crypto";
import {parseDocument} from "yaml";
import {operationContent, operationDigest} from "./operation-record.mjs";

export const GENESIS_PRODUCT_PROPOSAL = "docs/plans/genesis-product-proposal.json";
export const GENESIS_PROPOSAL_LIMIT = 256 * 1024;
const ANSWER_LIMIT = 256 * 1024;
const ANSWER_CAPTURE_LIMIT = 1024 * 1024;
export class GenesisProposalFinding extends Error {
  /** @param {string} code */
  constructor(code) { super(`${code}: project configuration proposal is unavailable`); this.code = code; this.name = "GenesisProposalFinding"; }
}
/** @param {string} code @returns {never} */
function refuse(code) { throw new GenesisProposalFinding(code); }
/** @param {any} value @param {string[]} keys */
function shape(value, keys) { return value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).sort().join("\0") === [...keys].sort().join("\0"); }
/** @param {any} value */
function identifier(value) { return typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(value); }
/** @param {any} value */
function revision(value) { return typeof value === "string" && /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(value); }
/** @param {any} value */
function fingerprint(value) { return typeof value === "string" && /^sha256:[0-9a-f]{64}$/.test(value); }
/** @param {string|Uint8Array} value */
function hash(value) { return createHash("sha256").update(value).digest("hex"); }
/** @param {any} value */
function freeze(value) { if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); } return value; }
/** Bounded plain JSON, including settings delegated to the canonical parser.
 * @param {any} value */
function finite(value) {
  let nodes = 0;
  /** @param {any} item @param {number} depth */
  function visit(item, depth) {
    if (++nodes > 10000 || depth > 16) refuse("genesis-proposal-complexity");
    if (item === null || ["string", "boolean"].includes(typeof item) || typeof item === "number" && Number.isFinite(item)) return;
    if (!item || typeof item !== "object" || !Array.isArray(item) && ![Object.prototype, null].includes(Object.getPrototypeOf(item))) refuse("genesis-proposal-data");
    for (const child of Object.values(item)) visit(child, depth + 1);
  }
  visit(value, 0);
}
/** @param {Uint8Array} bytes */
function decode(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.byteLength > GENESIS_PROPOSAL_LIMIT) refuse("genesis-proposal-size");
  let text, value;
  try {
    text = new TextDecoder("utf-8", {fatal:true, ignoreBOM:true}).decode(bytes);
    value = JSON.parse(text);
    // JSON syntax is required first. YAML's strict mapping parser then detects
    // duplicate decoded keys, including escaped equivalents, before identity
    // can be taken from JSON.parse's last-member result.
    if (parseDocument(text, {uniqueKeys:true}).errors.length !== 0) refuse("genesis-proposal-json");
  } catch { refuse("genesis-proposal-json"); }
  finite(value);
  return value;
}
/** @param {any} value @param {number} limit */
function singleLine(value, limit) { return typeof value === "string" && value.trim() !== "" && value.length <= limit && !/[\x00-\x1f\x7f]/.test(value); }

/** Actual accepted user-message data, shared by finite PRODUCT and RECORDS
 * proposals. This never obtains answer text from a model proposal.
 * @param {any} context @param {readonly any[]} answers */
function capturedAnswers(context, answers) {
  if (!Array.isArray(answers) || answers.length > 1024) refuse("genesis-proposal-answers");
  const captured = new Map(); let answerBytes = 0;
  for (const answer of answers) {
    if (!shape(answer, ["turn", "text", "setupId", "sessionId", "originDigest"]) || !Number.isSafeInteger(answer.turn) || answer.turn < 1 || captured.has(answer.turn) ||
        typeof answer.text !== "string" || Buffer.byteLength(answer.text, "utf8") > ANSWER_LIMIT ||
        answer.setupId !== context.setupId || answer.sessionId !== context.sessionId || answer.originDigest !== context.originDigest) refuse("genesis-proposal-answer-origin");
    answerBytes += Buffer.byteLength(answer.text, "utf8");
    if (answerBytes > ANSWER_CAPTURE_LIMIT) refuse("genesis-proposal-answer-size");
    captured.set(answer.turn, {turn:answer.turn, text:answer.text, sha256:hash(Buffer.from(answer.text, "utf8"))});
  }
  return captured;
}
/** @param {Map<number,any>} captured @param {readonly any[]} refs @param {boolean} allowEmpty */
function referencedAnswers(captured, refs, allowEmpty) {
  if (!Array.isArray(refs) || (!allowEmpty && refs.length === 0) || refs.length > 1024) refuse("genesis-proposal-answer-refs");
  const referenced = [], seen = new Set();
  for (const ref of refs) {
    if (!shape(ref, ["turn", "sha256"]) || !Number.isSafeInteger(ref.turn) || seen.has(ref.turn) || !/^[0-9a-f]{64}$/.test(ref.sha256)) refuse("genesis-proposal-answer-refs");
    const actual = captured.get(ref.turn);
    if (!actual || actual.sha256 !== ref.sha256) refuse("genesis-proposal-answer-mismatch");
    seen.add(ref.turn); referenced.push({...actual});
  }
  return referenced;
}
/** Pure byte correlation, not semantic approval or a writer capability. The
 * producer chooses allowEmpty only for its owned stage0 continuation.
 * @param {{context:any,answers:readonly any[],refs:readonly any[],allowEmpty:boolean}} request */
export function captureGenesisAnswerReferences(request) {
  if (!shape(request,["context","answers","refs","allowEmpty"]) || typeof request.allowEmpty !== "boolean" ||
      !shape(request.context,["setupId","sessionId","originDigest","productRevision","recordsRevision"]) ||
      !identifier(request.context.setupId) || !identifier(request.context.sessionId) || !fingerprint(request.context.originDigest) ||
      !revision(request.context.productRevision) || !revision(request.context.recordsRevision)) refuse("genesis-proposal-context");
  return freeze(referencedAnswers(capturedAnswers(request.context,request.answers),request.refs,request.allowEmpty));
}

/** Bind the canonical project-settings validator at construction. No request
 * can choose another validator, profile, path or program. This is still only
 * detached candidate capture; the bank producer must independently revalidate
 * actual setup/session/root ownership and effect-boundary optimistic inputs.
 * @param {{validateSettings:(value:any)=>boolean}} configuration */
export function createGenesisProposalReader(configuration) {
  if (!shape(configuration, ["validateSettings"]) || typeof configuration.validateSettings !== "function") refuse("genesis-proposal-validator");
  return Object.freeze({
    /** `answers` must be actual accepted user message captures, obtained by the
     * trusted app/session reader. They cannot be populated from the proposal's
     * own claimed answer text. Their digests are derived here from actual bytes.
     * @param {{bytes:Uint8Array, context:{setupId:string,sessionId:string,originDigest:string,productRevision:string,recordsRevision:string},
     * answers:readonly {turn:number,text:string,setupId:string,sessionId:string,originDigest:string}[]}} request */
    capture(request) {
      if (!shape(request, ["bytes", "context", "answers"])) refuse("genesis-proposal-request");
      const context = request.context;
      if (!shape(context, ["setupId", "sessionId", "originDigest", "productRevision", "recordsRevision"]) ||
          !identifier(context.setupId) || !identifier(context.sessionId) || !fingerprint(context.originDigest) ||
          !revision(context.productRevision) || !revision(context.recordsRevision)) refuse("genesis-proposal-context");
      const captured = capturedAnswers(context, request.answers);
      const proposal = decode(request.bytes);
      const keys = ["version", "setupId", "sessionId", "originDigest", "proposalId", "bank", "expectedProductRevision", "expectedRecordsRevision", "answerRefs",
        ...(proposal?.bank === "identity" ? ["identity"] : ["settings"])];
      if (!shape(proposal, keys) || proposal.version !== 1 || !identifier(proposal.proposalId) || !["identity", "configuration"].includes(proposal.bank) ||
          proposal.setupId !== context.setupId || proposal.sessionId !== context.sessionId || proposal.originDigest !== context.originDigest ||
          proposal.expectedProductRevision !== context.productRevision || proposal.expectedRecordsRevision !== context.recordsRevision) refuse("genesis-proposal-context");
      const referenced = referencedAnswers(captured, proposal.answerRefs, false);
      if (proposal.bank === "identity") {
        if (!shape(proposal.identity, ["projectName", "oneLiner"]) || !singleLine(proposal.identity.projectName, 160) || !singleLine(proposal.identity.oneLiner, 512)) refuse("genesis-proposal-identity");
      } else {
        let accepted;
        try { accepted = configuration.validateSettings(proposal.settings); }
        catch { refuse("genesis-proposal-settings"); }
        if (accepted !== true) refuse("genesis-proposal-settings");
      }
      // Detach all caller objects/bytes and bind exact source bytes as well as
      // normalized JSON, so same ID plus changed spelling cannot be recaptured.
      return freeze({version:1, kind:"genesis-product-proposal", context:{...context}, proposal,
        sourceBase64:Buffer.from(request.bytes).toString("base64"), sourceSha256:hash(request.bytes), answers:referenced,
        digest:operationDigest({context, proposal, sourceSha256:hash(request.bytes), answers:referenced}),
        authority:"captured proposal data only; no root selection, semantic approval, or write authority"});
    },
  });
}

/** Exact replay identity helper; retaining an old operation must not capture a
 * corrected proposal or newly typed text under the original ID.
 * @param {any} original @param {any} candidate */
export function sameGenesisProposal(original, candidate) { return operationContent(original) === operationContent(candidate); }
