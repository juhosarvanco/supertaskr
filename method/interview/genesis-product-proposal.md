# Finite banks during separated genesis

The human conversation stays plain text. The planner's actual working
directory and edits stay in RECORDS. PRODUCT changes use the trusted setup
driver's finite bank service; a prompt or proposal grants no filesystem
authority. The service owns exact configuration parsing, paths, local
commits and recovery. It does not publish.

## RECORDS proposal for every confirmed bank

The driver supplies a `supertaskr-bank-context-v1` JSON block with exact
setup/session IDs, origin digest, current input revisions, validated
settings and actual captured human answer references. Use that data;
do not infer it from the human's prose. Human conversation remains plain
text. A reference proves captured bytes and context, not the semantic
correctness of your interpretation.

After writing the finite artifacts named by the current banking-map row,
write exactly `docs/plans/genesis-bank-proposal.json` in RECORDS:

```json
{
  "version": 1,
  "setupId": "<driver supplied>",
  "sessionId": "<driver supplied>",
  "originDigest": "sha256:<driver supplied 64 lowercase hex>",
  "proposalId": "<one portable identifier for this bank>",
  "stage": 0,
  "expectedProductRevision": "<driver supplied full input commit>",
  "expectedRecordsRevision": "<driver supplied full input commit>",
  "answerRefs": [],
  "records": [{"path": "docs/STATE.md"}]
}
```

This is strict UTF-8 JSON: no duplicate or extra keys. Stage0 stamps the
already initialized STATE and proposes the pre-Q1 continuation before
asking Q1. It may use empty answerRefs. Stages1–8 use the actual driver
references for the human confirmations or skips that support that bank.
Updates and final approval notes still list the complete required stage
set, including unchanged artifacts. Stage8 requires STATE, ARCHITECTURE,
ROADMAP and at least one planned task. Preserve unchanged bytes and empty
lifecycle fields; listing a file grants no additional editing authority.
A STATE/ROADMAP-only final approval proposal cannot be banked. The
backend alone derives INDEX; never list INDEX, runtime files, verdicts,
completion evidence, source graphs or arbitrary PRODUCT paths.

Each records row is exactly `{path}` or `{path,sha256}`. Prefer the
path-only form: the backend measures and freezes exact observed bytes,
mode and SHA256. A supplied sha256 must be exact; do not invent a hash
or obtain extra tool permission to calculate it. The raw proposal and
actual file captures are frozen together before effects. Paths remain
relative to RECORDS and must belong to the finite stage; they grant no
filesystem authority.

Q1/Q5 also require the PRODUCT proposal below with the same proposalId,
input revisions and relevant captured answerRefs. Other stages have no
PRODUCT proposal. Decomposition creates only planned author data, with
empty lifecycle placeholders. Use usable role-qualified path scopes such
as `product::src/first.py` when no actual component registry is supplied;
a component name in architecture prose is not a registry or path grant.

A clarification or challenge without a confirmed bank writes no new
proposal. Do not claim a save from a working-file observation. Only an
exact accepted driver acknowledgement makes a separated bank durable;
an unchanged historical receipt is not a new bank or proof that drafts
are saved. Wait for that acknowledgement before treating the next bank's
committed bases as current.

## Additional finite PRODUCT proposal for Q1/Q5

For a confirmed Q1 or Q5 bank, write the machine proposal to exactly
`docs/plans/genesis-product-proposal.json` in RECORDS. The driver supplies
the original setup/session IDs, origin digest, current PRODUCT/RECORDS
input revisions, validated current settings and hashes of actual captured
human messages. Use those exact values. Do not invent another project
root, executable, profile, user Git identity or answer digest.

The file is strict UTF-8 JSON with no duplicate/extra keys. Its common
fields are:

```json
{
  "version": 1,
  "setupId": "<driver supplied>",
  "sessionId": "<driver supplied>",
  "originDigest": "sha256:<driver supplied 64 lowercase hex>",
  "proposalId": "<one portable identifier for this bank>",
  "bank": "identity",
  "expectedProductRevision": "<driver supplied full input commit>",
  "expectedRecordsRevision": "<driver supplied full input commit>",
  "answerRefs": [{"turn": 2, "sha256": "<driver supplied 64 lowercase hex>"}],
  "identity": {"projectName": "<banked name>", "oneLiner": "<banked one-liner>"}
}
```

Q5 uses `"bank":"configuration"` and replaces `identity` with
`settings`, the complete proposed canonical settings object based on the
validated current object supplied by the driver. The canonical settings
validator owns that shape. `names` is rename-keeper policy, not a project
label. The blank method runtime template remains reusable TOOL input;
configured project settings are committed at PRODUCT `supertaskr.yaml`.

This first proposal is a working-source capture. expectedRecordsRevision
names its INPUT base, not the impossible SHA of a future commit containing
that same proposal. Preserve this base and exact proposal bytes until the
driver acknowledges the bank. Keep ordinary RECORDS artifacts banked as
the interview runs; do not commit the proposal ahead of the driver's
capture. The driver reports a stale base rather than retargeting it.

Actual typed-message bytes/hashes correlate the proposal with its original
setup/session; they do not authenticate the model's interpretation of the
prose. A skip may still bank a marked assumption under the interview's
ordinary rule. The bank service validates finite data and current actual
authority before effects; the proposal itself authorizes none.

If a bank result is unknown, the driver retains its original operation ID
and captured intent for replay. Do not change that submitted intent or
request a fresh ID as a retry. A known zero-effect refusal may allow a new
proposal after the original refusal is recorded. An earlier accepted
receipt remains attached to the original bank even if current selection,
files or history later change.
