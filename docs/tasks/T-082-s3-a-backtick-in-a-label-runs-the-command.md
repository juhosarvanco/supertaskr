---
id: T-082-s3
title: A backtick inside a shell echo label executes the command the card forbids running
status: suggested
suggested_by: executor claude-opus-5 @T-082
---

**T-082's own executor accidentally started a real model turn while
building the card whose whole subject is that this happens.** It is
recorded here rather than buried, on the precedent STATE set for the 1420
bind probe: the rule is on the syscall, not the intent.

**THE MECHANISM.** The lane's hard rule is *no real model call, in any
suite, for any reason* — the CLI's command surface is read from `--help`,
which spawns no turn. The executor ran a labelled grep:

    echo "=== remaining `claude login` occurrences ===" && git grep …

The backticks were meant as markdown, the way every card in this repo
spells a command. In `sh`, `bash` and `zsh` they are COMMAND
SUBSTITUTION. The shell ran `claude login`, which — exactly as this card
documents — the CLI parses as a PROMPT, so a session started with the
word "login" as its first user message and the model's reply was
substituted into the echo. Evidence:
`~/.claude/projects/-Users-ujju-Projects-nputer-T-082/e1aa015a-9828-43b6-b485-42beb3f62c6c.jsonl`,
31 lines, 18:23:43Z–18:24:27Z, `USER TEXT: 'login'`, six assistant
messages, ~2,485 output tokens against a seven-day quota STATE records at
85% spent.

**WHY IT IS WORTH A CARD.** Three properties make this a class rather
than one clumsy command.

1. **The house style is the hazard.** This project spells every command
   in backticks, in prose, in cards and in commit messages. Copying that
   spelling into a shell label is the natural motion, and it is the one
   motion that executes.
2. **It is silent when the substitution succeeds.** Nothing errors. The
   output simply contains something nobody wrote, and a long tool result
   makes it easy to read as noise. Here it was legible only because the
   substituted text was an assistant's prose in the middle of a grep.
3. **It defeats the rule at the exact point the rule is being obeyed.**
   The executor had already read the CLI's surface with `--help` three
   times, correctly, and called no model. The violation arrived through a
   LABEL, not through a command anybody chose to run.

**THE FIX IS ONE SENTENCE AND BELONGS IN CONVENTIONS**, beside the PORT
RULE clause that already governs the hand rather than the lane: *never
put a backtick inside a shell string — quote command names with single
quotes, or omit them.* Single quotes suppress substitution in every shell
this repo uses; a heredoc quoted as `<<'EOF'` does too.

**ONE THING WAS LEARNED THAT NO `--help` COULD SHOW, and it is stated as
an accident rather than as a method:** this is the first direct
observation that `claude login` really does start a turn with "login" as
the prompt, rather than erroring. The card asserted it from the CLI's
argument grammar; the transcript now demonstrates it. Nobody should
reproduce it.
