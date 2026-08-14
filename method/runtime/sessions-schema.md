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
      "status": "idle"
    }
  ]
}
```

- `turns` drives the sediment warning (see nputer.yaml warn_after_turns).
- The dashboard sessions pane renders this file; the card selector lists
  `agent — fresh` plus every idle registered session with its history.
- Killing a session = mark status dead; the project resumes from docs/.
