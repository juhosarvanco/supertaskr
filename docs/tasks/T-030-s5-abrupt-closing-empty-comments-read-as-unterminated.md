---
id: T-030-s5
title: "`<!-->` and `<!--->` are valid empty comments, but the roadmap scanner reads them as unterminated openers"
status: suggested
suggested_by: verifier claude-opus-5 @T-030
---

Small and bounded, filed because T-030's whole discipline is that the
parser must not disagree with the renderer about what is content.

`stripHtmlComments` looks for `-->` starting at `open + 4`, so the two
abrupt-closing empty-comment forms have no closer to find:

    ## Backbone            ## Backbone
    <!-->                  <!--->
    - F-01: Real — yes     - F-01: Real — yes

    both -> features []  + roadmap-error "unterminated HTML comment"

CommonMark (0.30 §6.6) accepts `<!-->` and `<!--->` as complete empty
comments, so a renderer shows F-01 and the parser does not. Every
other shape T-030 handles agrees with the renderer — including the
genuinely unterminated `<!--`, which CommonMark's HTML-block rule also
runs to end of document, which is why blanking to EOF there is right.
These two are the only divergence I could construct.

It is LOUD, which is why this is a suggestion and not a rejection: the
roadmap-error names the line, nothing is eaten silently, and the
flagging-not-hiding contract holds. No live exposure — `docs/ROADMAP.md`
has no `<!--` at all on this branch or on main@8dadb59, and the
scaffolded `method/docs-templates/ROADMAP.md` uses only well-formed
spans.

Fix, if promoted: treat `<!-->` and `<!--->` as complete spans before
searching for `-->`, i.e. check for the abrupt-closing forms at the
opener. Two lines and two pins in `lib/parser/test/roadmap.test.ts`.
Cheapest done alongside T-030-s2/s4's shared inert-span pass, which
has to make the same decision for both parsers anyway — folding it in
there is probably better than a standalone change.
