# Finite PRODUCT banks during separated genesis

The human conversation stays plain text. The planner's actual working
directory and edits stay in RECORDS. PRODUCT changes use the trusted setup
driver's finite bank service; a prompt or proposal grants no filesystem
authority. The service owns exact configuration parsing, paths, local
commits and recovery. It does not publish.

After a confirmed Q1 or Q5 bank, write the machine proposal to exactly
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
