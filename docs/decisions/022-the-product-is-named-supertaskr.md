# ADR-022: the product and the method are named Supertaskr

Status: ratified. Date: 2026-09-08. Decider: @human ("Supertaskr it is.
without the e.", 2026-09-08, in docs/rooms/naming.md, RULED section).
Provenance: docs/rooms/naming.md (the 2026-08-14 resolution for
"nputer", the 2026-09-03 reopening for "Supertasker", the sweeps of
2026-09-03 and 2026-09-08), the form sitting record of 2026-09-03 in
docs/checkpoints/ (the rename measured: size L across three areas, the
identifier classes named), this sitting's record. Amends nothing ruled
elsewhere; the method's content (ADR-001, ADR-002) is unchanged.

## Context

"nputer" (computer minus "co") was chosen on 2026-08-14 as a working
name. On 2026-09-03 @human proposed "Supertasker" and swept it: npm and
PyPI free, `.app`/`.dev` unregistered, EUIPO and USPTO empty, but the
`.com` taken, the App Store developer name taken, and two live consumer
marketplaces carrying the name. "Supertask" was tried and is dead (npm
and PyPI taken, a US task app, an agent product at supertask.ai). On
2026-09-08 @human ruled the spelling without the e. The seat swept it
the same day (the table in the room): npm, PyPI and the GitHub names
free; `supertaskr.com` registered by someone and idle; `.app`, `.dev`,
`.io`, `.ai` with no DNS record; the trademark search for the new
spelling not yet run.

## Decision

1. **The name is Supertaskr**, one word, capital S in prose, lowercase
   `supertaskr` as an identifier. It names the product (the skill, the
   CLI, the mirror app) and the method (the kit in method/).
2. **The identifier spellings the rename lands** (T-264): the runtime
   directory `.supertaskr/`; the project config `supertaskr.yaml`; the
   ignore file `.supertaskrignore`; the environment prefix
   `SUPERTASKR_*`; the CLI `npx supertaskr`; the packages `supertaskr`,
   `@supertaskr/parser`, `@supertaskr/e2e`; the app's product name and
   bundle identifier `dev.supertaskr.app`; the crates `supertaskr`,
   `supertaskr_lib`, `supertaskr-index`; the CI workflow and the hooks'
   own names where they carry the word.
3. **Records are not rewritten.** Checkpoint records, decision records
   older than this one, card bodies, verdicts and room histories keep
   "nputer": they are records of what happened (ADR-019, docs-protocol
   law 3). Governing documents, the method, the guide, the reference,
   the templates and the adapters are replaced with the new name.
4. **The order**: the identifier rename (T-264, size L, @human's
   dispatch approval) lands before T-244 packages the CLI and before any
   outside user holds a `.nputer/` directory; the prose rename (T-265)
   follows it; the remote, the npm names, the domains and the mark are
   @human's (T-266 is the checklist, with the seat's one write: the
   remote URL after the repository is renamed).

## Consequences

- Every path this repository's own tooling derives from the name moves
  in one lane, because a hook reads what a script writes what the app
  reads: the three-area split measured on 2026-09-03 (app + e2e; method
  + kit + evals; tooling + CI) is a size, not a dispatch plan, and T-264
  fences all three areas. No other lane runs beside it.
- Until T-264 lands, "nputer" stays the working spelling in every file a
  program reads; a half-renamed tree is worse than either whole.
- `supertaskr.com` being taken is accepted: `.app`/`.dev` are the
  developer-native homes and `getsupertaskr.com` is the SaaS pattern.
- The trademark search for the new spelling is a gate before any public
  launch, not before the rename.
