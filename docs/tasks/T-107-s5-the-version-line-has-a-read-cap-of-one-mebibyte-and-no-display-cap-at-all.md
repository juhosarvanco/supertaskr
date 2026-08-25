---
id: T-107-s5
title: The CLI version line has a READ cap of one mebibyte and no DISPLAY cap at all, and the registry's model field already shows what the other half looks like
status: suggested
suggested_by: verifier claude-opus-5 @T-107-verify
---

**NOT A FAILURE, NOT T-107's, AND NOT BLOCKING ITS VERDICT** — it was
surfaced by that card's mandatory security sweep and is filed rather than
folded, because the site it names is older than the card and shared by
three notices.

**THE CAP DISCIPLINE HAS BOTH HALVES EVERYWHERE EXCEPT HERE.** This
project bounds what it READS (`MAX_LINE_BYTES`, `TRANSCRIPT_TEXT_CAP`,
the docs collector's `MAX_FILE_BYTES`) and, separately, bounds what it
SHOWS — `MODEL_MAX_LEN` is a DISPLAY boundary that drops an over-long
`model` with a log line rather than rendering it. `found` has the first
and not the second.

Traced end to end at `55909bb`:

- `probe_version` (`app/src-tauri/src/agent/runner.rs:924`) reads the
  child's stdout through `handle.take(MAX_LINE_BYTES as u64)` and returns
  `output.stdout.lines().next()?.trim().to_string()`.
- `MAX_LINE_BYTES` is `1024 * 1024` (`runner.rs:66`) — **one mebibyte.**
- `finish` (`runner.rs:831`) puts that whole line into
  `ResolveError::Unsupported { found: line.clone() }`, which becomes
  `StartOutcome::UnsupportedVersion { found }`.
- It reaches the DOM as a bare text child at
  `app/src/genesis/InterviewChat.tsx:732`.

**THERE IS NO INJECTION HERE AND THAT IS THE POINT** — T-107's sweep
confirmed the value is a text node with no markup, attribute or URL path,
and React escapes it. The residual is a LAYOUT and legibility question:
a `claude` on `PATH` that prints a megabyte on its first `--version` line
puts a megabyte of `break-words` mono into one `<span>`, and the notice
that was supposed to help becomes the thing that is wrong.

**THE EXPOSURE IS PRE-EXISTING AND WIDER THAN ONE FIELD.** `found` was
already rendered by `noticeSentence`'s `unsupportedVersion` arm before
T-107; that card moved the same typed field into a different element and
widened nothing. **The same unbounded shape reaches the same screen
through at least two more paths** — `error.message` (untyped by
construction) and `cliNotFound.probed` — so a fix belongs at the display
boundary shared by all three, not at this one field.

**WHY IT IS SMALL.** The precedent already exists in this repository and
it is a display-side truncation with a stated rule, not a new cap
constant: bound what the notice renders, say that it was truncated, and
keep the full value out of the DOM. The read cap stays where it is.

**WHOSE FENCE.** The display boundary is `app/src/genesis/**`
(`app-interview`, C-13) if it lands frontend-side; a Rust-side truncation
would be `app/src-tauri/src/agent/**` (`app-agent`, C-14). **Which side
owns a display cap is the first question this card has to answer**, and
`MODEL_MAX_LEN`'s precedent puts it Rust-side, beside the value's own
boundary — which would make this `app-agent` and not this pane at all.

**READ IT WITH `T-123-s9`**, which names the neighbouring hole from the
other direction: that one is a READ with no cap, this one is a read WITH
a cap and no display boundary behind it. Neither subsumes the other, and
a single card that states the discipline in both halves would close both.
