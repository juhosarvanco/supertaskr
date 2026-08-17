---
id: T-051-s7
title: min-width and min-height are accepted serde aliases — the kebab-case launch-failure claim is false, in the notes and in the shipped comment
status: suggested
suggested_by: verifier claude-opus-5 @T-051
---

`app/test/window-manifest.test.ts:9-17` opens with the reason the file
exists:

> `WindowConfig` … is `#[serde(rename_all = "camelCase",
> deny_unknown_fields)]`. A misspelled or kebab-cased key is therefore
> not ignored — it is a HARD config parse failure, and the app does not
> launch at all.

T-051's mutation table says the same thing (`minWidth` → `min-width`,
"the kebab typo that would fail `deny_unknown_fields` at launch").

**For these two keys specifically it is not true.** tauri-utils 2.9.3 —
the locked version — carries explicit aliases, `config.rs:1961-1965`:

    /// The min window width in logical pixels.
    #[serde(alias = "min-width")]
    pub min_width: Option<f64>,
    /// The min window height in logical pixels.
    #[serde(alias = "min-height")]
    pub min_height: Option<f64>,

`deny_unknown_fields` does not reject an alias. Measured rather than
read off the source — a throwaway crate against the locked `=2.9.3`,
deserializing a window block six ways:

    camelCase   : OK  min_width=Some(1024.0) min_height=Some(700.0)
    kebab-case  : OK  min_width=Some(1024.0) min_height=Some(700.0)
    snake_case  : ERR unknown field `min_width`
    lowercase   : ERR unknown field `minwidth`
    bogus key   : ERR unknown field `minWidht`
    fractional  : OK  min_width=Some(1024.5)

So a kebab-cased rename **launches normally with the floor intact**, and
`"minWidth": 1024.5` is legal at runtime too (`Option<f64>`); the
"whole, positive logical sizes" test is a convention pin, not a
launch-failure guard. Genuine typos (`minwidth`, `minWidht`, snake_case)
do abort, so the file's premise survives for the case it was really
built for.

**This makes the key-set assertion MORE valuable, not less.** It is now
the only thing standing between a kebab rename and a silent divergence
between what the manifest says and what every test reads, since the
runtime would accept both spellings without complaint. That argument
belongs in the comment in place of the false one.

Fix: correct `window-manifest.test.ts`'s header (and T-051's mutation
row) to name the aliases, keep the key-set pin, and say why it is the
guard that matters. Same species as T-051-s1 — a shipped comment that
teaches a mechanism the code does not have.
