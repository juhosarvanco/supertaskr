# North star

## Vision
A habit tracker that lives where its user already is: the terminal.
Marking a habit done is one typed command with no account, no phone,
no notification, no sync — and the record is a plain-text file the
user owns. When streak succeeds, logging a habit costs less attention
than sipping the coffee next to the keyboard.

## Users
One concrete user: a developer who works in a terminal all day and has
abandoned several phone habit apps. 7:40am, terminal already open,
meditation just finished: they type `streak done meditation` and get
on with work. Evenings, `streak week` for a one-glance check before
closing the laptop. Single-user, local, personal.

## Success criteria
1. `streak done <habit>` completes in under 50ms p95 on the founder's
   laptop (measured with `time`, warm filesystem) — logging never
   makes the user wait.
2. The founder logs ≥ 5 days/week for 8 consecutive weeks, evidenced
   by the store file itself (the product's own data is the metric).
3. `streak week` renders the whole week within one 80×24 terminal
   screen — a glance, never a scroll.

## Non-goals
- No notifications or reminders, in any form — being nagged is why the
  phone apps were abandoned.
- No sync service and no accounts, ever. The store is one plain-text
  file; moving it between machines is the user's dotfiles' problem.
- No social features: no sharing, no accountability partners.
- No streak-freeze / vacation mode — explicitly rejected at genesis
  ("a lie I'd tell myself"), not merely deferred.

## Riskiest assumption
<!-- The single belief that, if wrong, kills the project — plus the
     cheapest, earliest test of it. Interview Q6 banks here. -->

## Hard constraints
<!-- Q4 was skipped at the interview; every line below is a planner
     assumption marked [?] — resolve or room, never silently delete. -->
- [?] Platforms: macOS + Linux POSIX terminals. Windows is unpromised
  in v1 (the founding scene is a Unix terminal).
- [?] No deadline; the only clock is success criterion 2's 8-week
  self-trial.
- [?] Zero paid services or infrastructure — a local tool; the budget
  is the founder's spare time.
- [?] The store remains ONE human-readable plain-text file that a user
  could edit by hand; no session may trade it for a database.
