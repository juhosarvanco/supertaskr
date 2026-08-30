# .nputer/sessions.json — session registry

Runtime state, not project truth: lives in .nputer/, not docs/. Losing it
loses nothing about the project.

```json
{
  "sessions": [
    {
      "id": "S3",
      "agent": "codex",
      "model": "gpt-5.2",
      "native_session_id": "<id used for the CLI's resume flag>",
      "created": "2026-08-14T09:12:00+03:00",
      "turns": 41,
      "tasks": ["T-013", "T-017"],
      "roles": ["executor"],
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
      ]
    }
  ]
}
```

- `turns` drives the sediment warning (see nputer.yaml warn_after_turns).
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
- **WHICH KEYS AN ENTRY MAY LACK, because an example shows a full one
  and says nothing about the ordinary partial ones.** Three, each absent
  for the same reason — there was nothing to record: `skills` when no
  packs were loaded, `model` and `native_session_id` before the agent
  CLI's own init line has reported them (the shape every entry has
  between its first write and its first turn). An absent key means *not
  recorded*, never *empty*, and a reader treats the two alike. **The
  other six are always written.** So an entry carrying the nine keys
  above and no tenth means *no packs*, and one written before `skills`
  existed reads back unchanged.
