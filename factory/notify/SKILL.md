---
name: notify
description: Tell the human that a factory agent needs them or has done something, with the right label and link. Use whenever a factory agent needs a decision, is blocked, has opened a PR, or needs a human to review or merge a PR.
---

# Notify

One call from any factory agent session, so every ping looks the same and lands where the human looks. You end with the label set, a comment on GitHub that says what's needed, and the human pinged.

Labels and their commands are in the `factory-labels` skill. Read it first.

**Inputs:** the event (below), the ticket or PR number, and one line saying what's needed.

## Events

| Event | Label (on the ticket) | GitHub | The human does |
|---|---|---|---|
| `decision` | add `factory:agent-awaiting-human` | Ticket comment: one question with your recommended answer | Answers in the chat or on the ticket |
| `blocked` | add `factory:agent-blocked` | Ticket comment: exactly what's missing (secret, service, permission) | Fixes it, tells the agent to carry on |
| `pr-made` | none (the builder set `factory:in-review`) | Ticket comment: the PR link | Nothing, it's so they know |
| `review-needed` | none | Request the human's review on the PR; PR comment saying why a human must review (the category or risk) | Reviews in GitHub |
| `human-merge` | none | Request the human's review on the PR; PR comment saying why it can't auto-merge | Merges in GitHub |

## Steps

1. **Find the human.** The ticket's assignee; else the owner of the touched paths in `CODEOWNERS`; else the repo owner. Done when you have one GitHub login.
2. **Label and comment.** Set the event's label and post its comment, starting with `@<login>`, so GitHub notifies them. Done when both show on GitHub.
3. **Ping.** If your session has a push-notification tool, send the one line plus the link. Then make the one line, with the link, the last thing you say in the session, so the session waiting on the human shows it in the Claude app. Done when the ping is sent or the line is said.

When the reason is gone (the human answered, or the access arrived), remove the flag label in the same command that moves the ticket on.

## Commands (GitHub)

```bash
gh issue edit <n> --add-label factory:agent-awaiting-human     # raise a flag
gh issue comment <n> --body "@<login> ..."                     # ticket comment
gh pr edit <pr> --add-reviewer <login>                         # request review
gh pr comment <pr> --body "@<login> ..."                       # PR comment
```
