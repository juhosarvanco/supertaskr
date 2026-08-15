---
title: parseRoadmap is HTML-comment-blind — a commented-out backbone bullet parses as a real feature
status: suggested
suggested_by: executor claude-fable-5 @T-023
---

`parseRoadmap` (lib/parser/src/roadmap.ts) processes ROADMAP.md line by
line with no awareness of `<!-- -->` comments: any line inside a
multi-line comment that starts at column 0 with `- F-NN:` still matches
the backbone bullet regex and yields a real FeatureRecord (and a
column-0 `- F-` non-match inside a comment would even emit a
`roadmap-error` issue). T-023 dodged the trap for the kit by indenting
the example bullet inside docs-templates/ROADMAP.md's comment (indented
lines match neither regex) and pinning a "don't add bare example rows"
gotcha in docs/CONVENTIONS.md — but nothing protects a real project's
hand-written ROADMAP: a human commenting out a feature ("keep this for
later") at column 0 resurrects it as a phantom board column with no
issue raised. Confirmed against source at T-023 build time; the T-023
dry run's stage-0 parse proof only holds because of the template
indentation. Fix shape: strip HTML comments before the line loop (or
track comment state in it), plus a fixture pinning both the
commented-bullet and commented-malformed cases. lib/parser lane;
deliberately untouched by T-023 (parser is out of its boundary).
