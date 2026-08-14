---
id: T-001-s2
title: Lint guard for token-bypassing arbitrary values in app styles
status: suggested
suggested_by: verifier claude-fable-5 @T-001-verify
---

T-001's token mechanism disables Tailwind's color/font/text/spacing
namespaces, so scale utilities with no token behind them do not compile
(verified: `bg-red-500`, `text-4xl`, `font-serif` produce no CSS). But
Tailwind v4 arbitrary values bypass any theme config: a verifier probe
`p-[13px]` compiled to `padding:13px`, and `bg-[#f00]`-style literals
would compile the same way. The shipped source is clean today; nothing
mechanical stops the next component from smuggling literals in.

Suggest a cheap guard on the build/CI path — e.g. a script that fails on
`-\[[0-9#]`-shaped arbitrary values in `app/src/**/*.tsx` (allowlisting
token-derived forms like the `min(var(--radius-md),10px)` caps in the
vendored button, if kept), or eslint-plugin-tailwindcss's
no-arbitrary-value rule once the project adds linting. This turns
criterion 2 of T-001 from reviewed-by-hand into enforced-by-machinery.
Natural landing spot: T-006 (design language) or the first CI task.
