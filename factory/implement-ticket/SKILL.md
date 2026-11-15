---
name: implement-ticket
description: "Implement one factory ticket: build, verify and review it, then open a PR when the agent owns it. Use when told to implement, build or pick up a ticket or issue."
---

# Implement a ticket

You build one factory ticket. The ticket's owner label decides how you finish:

- `factory:agent-owned`: you end with an open PR linked to the ticket and the ticket at `factory:in-review`.
- `factory:human-owned`: you end with a reviewed branch, and the developer opens the PR.

Either way, if you need something only a human has, you end with the ticket flagged and a comment saying exactly what you need. You never merge.

## Requirements

- The `setup-factory` skill has run, so the `factory:*` labels exist. The commands that move them are in the `factory-labels` skill.
- The repo has a verification contract: the checks every change must pass (for example linters, tests, builds, license checks). Without one, go to **Stop and ask**.

## Steps

### 1. Claim

If the ticket is `factory:ready`, move it to `factory:in-progress` and assign it to the account you're running as (`gh issue edit <n> --add-assignee @me`).

Done when the ticket shows `factory:in-progress` and that assignee.

### 2. Understand

Read the ticket's body, comments and attachments, and its parent ticket if it has one. Read the repo's `AGENTS.md` or `CLAUDE.md`, its glossary and any ADRs the ticket touches.

Done when you know every acceptance criterion on the ticket and each is a checkable statement.

If the ticket has no criteria that exists, or one can't be checked without guessing what the human wants, go to **Stop and ask**.

### 3. Build

Work on the branch you were given, or create `<ticket-number>-<slug>` from the latest default branch. Make the smallest change that meets every criterion, following the repo's docs and code examples on how to implement it.

Done when every criterion has code that meets it.

### 4. Verify

Verify your uncommitted work from step 3 yourself. Run every check in the repo's verification contract. Fix and re-run until every check passes. Each fix must keep every acceptance criterion met.

Done when every check passes on your latest changes and every criterion is still met. Report each check's output; never judge a pass by reading code.

If you can't make every check pass while keeping every criterion met, go to **Stop and ask**.

### 5. Review

Run the `review-implementation` skill in a separate subagent, passing the ticket number and your uncommitted work. Fix every finding marked `must`, then go back to step 4.

Done when a review returns no `must` findings.

After 3 review rounds with `must` findings left, go to **Stop and ask**.

If the ticket is `factory:human-owned`, stop here: tell the developer the branch is ready for their PR, with each criterion and how it is met, each verification check's result and any `should` findings left.

### 6. Open the PR (`factory:agent-owned` only)

Commit your work in the repo's commit style, then push the branch and open a ready-for-review PR. Title in the repo's commit style. Body: `Closes #<n>`, what changed, how each acceptance criterion is met, each verification check's result, and any `should` findings you left. Use the repo's PR template if it has one.

Done when the PR exists and links the ticket.

### 7. Hand off (`factory:agent-owned` only)

Move the ticket from `factory:in-progress` to `factory:in-review`, then use the `notify` skill with event `pr-made`.

Done when the ticket shows `factory:in-review` and the ticket has the PR link.

From here the PR workflow takes over: `fix-pr` when checks fail or comments arrive, `merge-pr` once it's green.

## Stop and ask

Stop as soon as the next step needs something only a human has. Leave the ticket at `factory:in-progress`, push what you have, and use the `notify` skill:

- **A decision** (unclear requirement, a trade-off the ticket doesn't settle, a change outside the ticket's scope): event `decision`, one question with your recommended answer.
- **Access** (a secret, a service, a permission, a command you're not allowed to run): event `blocked`, naming exactly what is missing.

Then end with a one-line summary of where the work stands.
