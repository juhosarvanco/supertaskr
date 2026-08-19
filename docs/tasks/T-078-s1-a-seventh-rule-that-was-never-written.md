---
id: T-078-s1
title: The rule T-078 was told to write "beside" does not exist either — sweep the done cards for lessons that live only in notes
status: suggested
suggested_by: executor claude-opus-5 @T-078
---

T-078's third criterion says the negative-control rule shall be added
"beside the constant-parametrisation rule T-063 produced, because they
are one lesson from two directions and a reader meeting one should meet
the other". **Measured before writing anything: that rule is not in
`docs/CONVENTIONS.md` and not in `method/`.** `git grep -i -E
"parametris|parametriz"` over both returns zero, and so does `git grep
"T-063"`. The lesson exists only inside T-063's own implementation
notes, where its verifier wrote *"A test parametrised by a constant
cannot pin that constant."* T-060-s2's ask says the same thing —
"T-063's drill produced …" — so the card faithfully transcribed a
suggestion that was itself describing a card's notes, not this file.

**So the card's own motivating failure has a further instance inside the
card.** T-078 exists because two rules everyone believed were written
were not; the criterion saying so was written beside a third one that
also was not. It is now written — the negative-control bullet states the
constant-parametrisation rule as its companion sentence, which is what
made the criterion's stated purpose ("a reader meeting one should meet
the other") actually true — but the fix here is one instance and the
shape is general.

**The ask is a SWEEP, not another rule.** Every done card's
`## Implementation notes` and `## Verdicts` are where this project's
verifiers write down what they learned, and nothing routes those lessons
anywhere a next session reads. Fifty-one done cards is a small enough
corpus to read once. The concrete question for each generalisable
sentence: is it in `docs/CONVENTIONS.md`, in `method/`, or nowhere? The
three found so far — the negative control, the guard lift, the
parametrised constant — were all "nowhere", and all three had been
believed written by at least one architect or verdict.

Worth pairing with the citation rule this card added: a lesson cited to
a card's notes is a lesson nobody will open. If a rule matters, it moves
to the file that governs; if it does not, saying so is also a decision.
