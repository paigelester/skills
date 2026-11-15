---
name: implement-ticket
description: Take one agent-owned factory ticket from ready to an open pull request (build, verify, review, PR, labels). Use when told to implement, build or pick up a ticket or issue, including unattended patrol runs.
---

# Implement a ticket

You are the builder on the agent path of the implement workflow. You end with an open PR linked to the ticket and the ticket at `factory:in-review`, or with the ticket flagged and a comment saying exactly what you need. A human merges; you never merge.

Labels and the commands that move them are in the `factory-labels` skill. Read it first.

## Steps

1. **Claim.** Read the ticket with its comments. If it is still `factory:ready`, move it to `factory:in-progress`. Done when the ticket shows `factory:in-progress`.
2. **Understand.** Read the repo's `AGENTS.md` or `CLAUDE.md`, its glossary and any ADRs the ticket touches. Write the ticket's acceptance criteria as a numbered list in your working notes; if it has none, derive them from the ticket text. Done when every criterion is a checkable statement. If you can't make one checkable without guessing what the human wants, go to **Stop and ask**.
3. **Build.** Work on the branch you were given, or create `<ticket-number>-<slug>` from the latest default branch. Make the smallest change that meets every criterion, with tests where the repo has them. Commit in the repo's commit style. Done when every criterion has code (and a test, where testable) that meets it.
4. **Verify.** Run the repo's own check command (the one its `AGENTS.md` names, e.g. `npm run verify`). Fix and re-run until it exits 0. Done when the command exits 0 on your last commit. Report its output; never judge a pass by reading code.
5. **Review.** Run the `review-implementation` skill in a separate subagent, passing the ticket number and your branch's diff against the default branch. Fix every finding marked `must`, then go back to step 4. Done when a review returns no `must` findings. After 3 review rounds with `must` findings left, go to **Stop and ask**.
6. **Open the PR.** Push the branch and open a ready-for-review PR. Title in the repo's commit style. Body: `Closes #<n>`, what changed, how each acceptance criterion is met, the check command's result, and any `should` findings you left. Use the repo's PR template if it has one. Done when the PR exists and links the ticket.
7. **Hand off.** Move the ticket from `factory:in-progress` to `factory:in-review` and comment the PR link. Done when the ticket shows `factory:in-review`.

## Stop and ask

Stop as soon as the next step needs something only a human has. Leave the ticket at `factory:in-progress`, push what you have, and:

- **A decision** (unclear requirement, a trade-off the ticket doesn't settle, a change outside the ticket's scope): add `factory:agent-awaiting-human` and comment one question with your recommended answer.
- **Access** (a secret, a service, a permission, a command you're not allowed to run): add `factory:agent-blocked` and comment exactly what is missing.

Then end the session with a one-line summary of where the work stands. Unattended, nobody answers in the terminal, so the comment is where the human sees it.
