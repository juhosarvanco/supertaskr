---
id: T-084-s8
title: A docs path expressed relative to a PACKAGE directory reads this repo's docs/ and is invisible to the site scan, the tripwire and the root-anchor account
status: suggested
suggested_by: verifier claude-opus-5 @T-084-verify2
---

`ROOT_ANCHOR_LEDGER`'s doc comment in `tools/e2e/scripts/docs-scan.mjs`
states the premise the whole account rests on:

> A file that holds this repository's root is the only kind of file that
> CAN read this repository's docs/.

**That is a universal and it is false.** Planted at `fda5c92` and
measured:

    app/test/zz-falsifier-a.test.ts
      const TASKS = resolve("../docs/tasks");   // from app/, this IS <root>/docs/tasks
      export const count = readdirSync(TASKS).length;

    app/test/zz-falsifier-b.test.ts
      const TASKS = path.join(process.cwd(), "..", "docs", "tasks");

    rootAnchoredFiles()      -> 24, unchanged: NEITHER is anchored
    docsReaders()            -> 11, unchanged: neither is derived
    unlinkedFiles()          -> [], neither reported
    unaccountedRootAnchors() -> 6, unchanged

Both read this repository's `docs/tasks` off the live tree and escape
every arm in silence — which is the one outcome this card exists to
remove.

**The cause is an interaction between the two halves of the site rule.**
The first half requires the first LITERAL segment to be `docs`, which is
what correctly keeps `tools/e2e/fixtures/shell.ts` out. But
`resolve('<rel>')` against the PACKAGE DIRECTORY is already one of
`ROOT_FORMS` — `evalBase` evaluates it — so the scanner understands the
base perfectly well and discards the site only because the literal opens
with `..` rather than with `docs`.

**It is absent from the tree today, and one character from an idiom that
is not.** `resolve("../` and `resolve('../` return zero hits across all
first-party source, so the ledger's 24 and its residual 6 are correct at
this ref. But the package-dir form is established here —
`resolve("dist/assets")`, `resolve("test/fixtures/genesis")`,
`resolve("src-tauri/tauri.conf.json")` appear nine times across five
files in `app/test` alone. A sixth that reaches for `../docs/tasks` is
an ordinary thing for someone to write.

**Two arms, and the first is free.**

1. **Correct the sentence.** The mechanism supports a bound over files
   that NAME the root, not over files that CAN read docs/. One clause,
   and it stops the account claiming more than it derives.
2. **Widen `docsSites` to resolve the literal before judging it.** A
   path-forming call whose base evaluates to a directory inside the
   repository and whose resolved path lands under `<root>/docs` is a
   site, whatever its first literal segment is. That subsumes the
   `docs`-first rule rather than replacing it: `shell.ts` still resolves
   to `app/test/fixtures/genesis/streak/docs`, which is NOT under
   `<root>/docs`, so it stays out for a better reason than its spelling.
   `files.test.ts` stays out unchanged, since its base is a fixtures
   directory. Wants both existing discriminator samples re-pinned against
   the new rule, plus a positive for the `..` form.

Arm 2 is the one that closes the silence; arm 1 is what should happen
regardless, because a false universal in the file that defines the
account is worse than a named limit.

---

## 2026-08-20 — INTEGRATOR: the shape is NOT absent, and the consequence is measured (claude-opus-5 @T-084-integrate)

**"It is absent from the tree today" is false, and I falsified it at the
merge commit `e8c4ab7` rather than reasoning about it.** `status:`
stays `suggested` — disposition belongs to triage, which is this merge's
own ruling — but a finding whose stated premise is wrong is the exact
class this card exists to retire, so the record is corrected here.

THE LIVE INSTANCE, one, and it runs on bare `cargo test`:

    app/src-tauri/tests/agent_runner.rs:1761
      let capture = Path::new(env!("CARGO_MANIFEST_DIR"))
          .join("../../docs/research/captures/real-planner-turn-2026-08-19.jsonl");

`the_tool_denied_fixture_is_a_transcription_not_a_construction` is a
plain `#[test]`, not `#[ignore]`d, and it compares five fields of this
repository's live capture against the fake agent's output. Its own doc
comment says what it is in as many words: *"This adds a THIRD live
reader outside CONVENTIONS' four walks."*

**WHY THE PROBE MISSED IT, which is the sharper half.** The verdict
searched for `resolve("../` and `resolve('../` — the JavaScript
spelling — and this tree writes the Rust one, `.join("../../docs/…")`
off `CARGO_MANIFEST_DIR`. That is the SAME failure the second verdict
had already confessed one section earlier about `perf.rs`: a probe
narrower than the claim it was asked to support. Twice on one card, in
opposite spellings.

**THE CONSEQUENCE IS BLOCKING 1's OWN SHAPE, SURVIVING THE FIX, ON A
FIFTH PREFIX.** One field mutated in that capture (`tool_use_id`, both
occurrences, substitution count 2, the mutated text read back with
`git diff` before anything ran):

    node tools/e2e/scripts/docs-gate.mjs docs/research/captures/…jsonl
      -> EXIT 1, and it owes exactly ONE command:
         npm test from tools/e2e/
    npm test from tools/e2e/   -> 121/121   E2E_EXIT=0        GREEN
    cargo test --no-fail-fast  -> 351 passed / 1 failed / 3 ignored,
                                  CARGO_EXIT=101              RED
      the_tool_denied_fixture_is_a_transcription_not_a_construction
      denial 0: `tool_use_id` is not what the capture says it is

Restored by byte copy from `git show e8c4ab7:<path>`, proved by an empty
per-path `git diff` and sha256 back to
`273a3d33593a53614101489b9cd3e9574010beae3830a60f43a8e65f74da47ac`;
`cargo test` back to 352/0/3 at exit 0. **The restore was per-path and
never `git checkout --`**, because the working tree carried the
checkpoint's own uncommitted edits at the time (`T-072-s1`).

**So an integrator who obeys the gate can still merge a red tree** —
the rejection's finding, reproduced verbatim against the APPROVED tip.
Arm 2 is therefore not a hardening, it is the close; and arm 1's
sentence is not merely over-broad, it is contradicted by a file in the
same repository.

**Two figures re-derived at `e8c4ab7`, because both moved.** The
package-dir form in `app/test` is **21 hits across 9 files**, not nine
across five — and one of them, `map-dogfood-render.test.tsx:26`, is
already a bare `resolve("..")`. The escaping shape itself is **1**, not
0. Neither number is worth transcribing again; the derivation is a
six-line script over `git ls-files`.
