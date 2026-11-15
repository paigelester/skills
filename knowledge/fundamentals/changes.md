# Making a change

- **Smallest change that meets the ask.** Build what the ticket's criteria need and stop. No extra options, no "while I'm here" refactors, no code for a future that hasn't been asked for.
- **Stay in scope.** If the right fix needs work the ticket doesn't cover, say so and propose a follow-up ticket. Don't build it.
- **Follow what's there.** Find a nearby example of the same kind of change and match its structure, naming and style, even where you'd have chosen differently.
- **Delete rather than add.** Prefer removing code to adding a flag around it. Remove what your change makes dead: unused imports, parameters, files, docs.
- **Make it deterministic.** If something can be checked by a script with a pass or fail exit code, write the script and run it. Report its output; never judge a pass by reading code.
- **Docs move with behaviour.** When behaviour, setup or a command changes, the README, docs and glossary that describe it change in the same commit.
- **One commit, one purpose.** The commit message says what changed for someone using the thing, in the repo's commit style.
