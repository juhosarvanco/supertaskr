# .nputer/genesis/transcript.jsonl — the genesis transcript

Runtime state, not project truth: lives in .nputer/, not docs/. Losing it
loses a chat rehydration and nothing about the project. It is one of the
two runtime files under .nputer/ — sessions-schema.md next door documents
the other — and both are losable by charter (ADR-017 clause 4).

ONE JSON OBJECT PER LINE, appended and never rewritten. A line is one
protocol HALF-turn, so a completed exchange is TWO lines carrying the
same `turn`: the user's and the planner's. The example below is one such
line, expanded across several rows for reading; on disk it is a single
line with no interior newlines.

```json
{
  "turn": 7,
  "role": "user",
  "text": "You are the planner. KIT ROOT: /…",
  "atMs": 1755000000000,
  "machine": true
}
```

- `turn` — the exchange this half-turn belongs to, counting from 1. Two
  lines share it; a reader that wants exchanges groups by it rather than
  by position.
- `role` — `"user"` or `"planner"`, the half of the protocol this line
  is. It is the SPEAKER, never a claim about who typed the text: see
  `machine` below.
- `text` — the half-turn's FINAL text, never a stream delta; deltas are
  not banked here at all. An over-long text is TRUNCATED to the writer's
  cap rather than dropped, so a line is always well-formed and a huge
  planner turn still leaves a record. **The cap is a constant in the
  writer (`TRANSCRIPT_TEXT_CAP`) and is deliberately not transcribed
  here** — a number in this file would have no keeper, and the property a
  reader needs is *truncated, not dropped*.
- `atMs` — when the half-turn was banked, Unix epoch MILLISECONDS.
- `machine` — this half-turn was ASSEMBLED BY THE APP rather than typed
  by the human: a kickoff, or a resume nudge. It rides `role: "user"`
  because it genuinely is the user half of the protocol, so the file
  stays a complete protocol record; the flag is what lets a rehydrated
  chat decline to draw it in the human's own bubble without recognising
  machine text BY READING IT.

- **EVERY KEY HERE IS camelCase — `atMs`, never `at_ms`** — while the
  session registry's entry keys next door are snake_case. **The two
  runtime files do not share one convention, and neither does
  `sessions.json` internally**, where a registry entry is snake_case and
  the pack object nested inside it is camelCase. So the spelling is a
  property of the OBJECT and not of the directory, a reader cannot infer
  it from having read the other file, and each object's own page is where
  it has to be written down.
- **WHICH KEY A LINE MAY LACK, because the example shows a full one and
  says nothing about the ordinary partial ones.** Exactly one: `machine`
  is OMITTED when it is false, so an ordinary typed half-turn carries the
  other four keys and no fifth. **Absent means *not machine-assembled* —
  never *unknown*** — and a reader compares against `true` rather than
  testing presence. That is also why a transcript written before the flag
  existed reads back correctly rather than ambiguously. **Every other key
  above is always written.**
