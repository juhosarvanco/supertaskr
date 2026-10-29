# .supertaskr/sessions.json — session registry

Runtime state, not project truth: lives in .supertaskr/, not docs/. Losing it
loses nothing about the project.

```json
{
  "sessions": [
    {
      "id": "S3",
      "agent": "claude",
      "model": "observed-provider-model",
      "native_session_id": "<id used for the CLI's resume flag>",
      "created": "2026-08-14T09:12:00+03:00",
      "turns": 41,
      "tasks": ["T-013", "T-017"],
      "roles": ["planner"],
      "status": "idle",
      "skills": [
        {
          "dir": "brand",
          "name": "brand",
          "description": "House voice and naming rules.",
          "triggers": "Use when naming anything user-facing.",
          "relPath": ".claude/skills/brand/SKILL.md",
          "hash": "sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
        }
      ],
      "genesis": {
        "id": "genesis-example",
        "origin": {
          "version": 1,
          "layout": "split",
          "associationId": "example-project",
          "product": {
            "root": {"path":"/example/code","device":"1","inode":"100"},
            "gitDirectory": {"path":"/example/code/.git","device":"1","inode":"101"},
            "commonDirectory": {"path":"/example/code/.git","device":"1","inode":"101"}
          },
          "records": {
            "root": {"path":"/example/notes","device":"1","inode":"200"},
            "gitDirectory": {"path":"/example/notes/.git","device":"1","inode":"201"},
            "commonDirectory": {"path":"/example/notes/.git","device":"1","inode":"201"}
          },
          "docs": {"path":"/example/notes/docs","device":"1","inode":"202"},
          "runtime": {"path":"/example/code/.supertaskr","device":"1","inode":"102"}
        },
        "planner": {
          "selection": {
            "role":"planner","requested":"claude-opus-5@subagent","harness":"claude","model":"claude-opus-5","vehicle":"subagent",
            "sessionPolicy":{"default":"fresh","warnAfterTurns":30}
          },
          "provenance": {
            "configurationDigest":"sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            "productRevision":"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            "toolManifestDigest":"cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc"
          },
          "executable": {
            "path":"/example/bin/claude","target":"/example/tool/claude","device":"1","inode":"300","mode":33261,"bytes":12345,
            "sha256":"sha256:dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
            "version":"2.1.226 (Claude Code)","loginPathDigest":null
          }
        }
      }
    }
  ]
}
```

- `turns` drives the sediment warning (see supertaskr.yaml warn_after_turns).
- The dashboard sessions pane renders this file; the card selector lists
  `agent — fresh` plus every idle registered session with its history.
- Killing a session = mark status dead; the project resumes from docs/.
- `skills` records WHICH organization skill packs shaped the session, by
  name and by content hash, so "which policy shaped this decision" is
  answerable later from the files alone. One element per pack that was
  actually loaded: `dir` (the pack's own directory name, its identity on
  disk), `name` and `description` (the pack's declared frontmatter,
  flattened to one line and capped), `triggers` (the pack's explicit
  trigger statement when it makes one, otherwise its description),
  `relPath` (project-relative POSIX path to the pack's file) and `hash`
  (`sha256:` followed by 64 lowercase hex over that file's RAW bytes).
  **The keys INSIDE a pack are camelCase — `relPath`, not `rel_path` —
  while the entry's own keys above are snake_case.**
- `genesis` is optional original-session provenance. Its native-issued `id`
  distinguishes sessions even if a losable registry later reuses `S1`. The
  `origin` captures physical PRODUCT/RECORDS roots, Git/common directories,
  RECORDS docs, PRODUCT runtime directory and association. It contains no current commit or transient
  selection sequence: legitimate local banks may advance history. These
  nested objects use camelCase; the enclosing registry remains snake_case.
  Data is mismatch detection, never authentication, a root selector or write
  permission. Native consumers compare it with independently resolved current
  physical context before resuming; an older absent value never acquires the
  currently selected private association by inference. It stays backend-only.
- `genesis.planner` records the canonical original requested role selection and
  its committed configuration/TOOL provenance, plus the fixed CLI resolver's
  original executable path, physical target identity, mode, size, byte digest,
  version and optional login-PATH digest. These nested keys are camelCase.
  The path is mismatch data and never an executable selector. The driver resolves
  the supported CLI independently on each start/resume/turn and compares it;
  changed identity or selection refuses. The original requested model remains
  separate from the enclosing `model` observed from the child's init line.
  `vehicle` is role metadata, never a native resume ID. Later accepted banks may
  advance the current configuration cut without rewriting original provenance.
  The executable observation neither authenticates a vendor nor measures its
  dependency closure. This optional value is absent in older records; a split
  planner cannot resume one by assigning the current model. Legacy unbound
  embedding records retain their existing behavior.
- **WHICH KEYS AN ENTRY MAY LACK, because an example shows a full one
  and says nothing about the ordinary partial ones.** Four, each absent
  for the same reason — there was nothing to record: `skills` when no
  packs were loaded, `model` and `native_session_id` before the agent
  CLI's own init line has reported them (the shape every entry has
  between its first write and its first turn), and `genesis` for a legacy
  entry without captured physical provenance. An absent key means *not
  recorded*, never *empty*, and a reader treats the two alike. **Every
  other key above is always written.** So an entry carrying the nine
  keys above and no tenth means *no packs*, and one written before
  `skills` existed reads back unchanged.
