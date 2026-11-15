---
name: factory-labels
description: The `factory:*` ticket labels of the agent software factory and how to move a ticket between them. Use whenever you read, label, comment on or hand off a factory ticket, or set up the labels in a repo.
---

# Factory labels

A factory ticket's state is its labels. Exactly one **state** label is on an open ticket at a time; **owner** and **flag** labels sit beside it. Moving a ticket means removing the old state label and adding the new one in the same command.

## States

| Label | Means | Set by |
|---|---|---|
| `factory:new` | Just created | Whoever files it |
| `factory:refining` | Being refined | Refiner |
| `factory:refined` | Purpose, acceptance criteria, acceptance tests and risk set | Refiner |
| `factory:selected` | Chosen to work on | Human |
| `factory:routing` | Plan made; risk and solvability pick agent or human | Router |
| `factory:ready` | Approved to build | Human |
| `factory:in-progress` | Being built | The builder (or the patrol that claims it) |
| `factory:in-review` | PR open and under review | The builder, once the PR exists |
| `factory:merged` | On `main` | Merger |
| `factory:closed` | Done | Merger |
| `factory:reopened` | Regression, back to refining | Anyone |

## Owners

| Label | Means |
|---|---|
| `factory:agent-owned` | An agent builds it |
| `factory:human-owned` | A developer builds it |

## Flags

Add a flag beside the state label, with a comment saying why. Remove it when the reason is gone.

| Label | Means |
|---|---|
| `factory:blocked` | Waiting on another ticket (name it) |
| `factory:agent-awaiting-human` | The agent needs a decision (ask it as one question) |
| `factory:agent-blocked` | The agent stopped: no access, secret or service (name what's missing) |
| `factory:wont-do` | Rejected, reason recorded |
| `factory:agent-merged` / `factory:human-merged` | Who merged it |
| `factory:bug-reproduced` / `factory:bug-not-reproduced` | Bug triage result |

## Commands (GitHub)

```bash
gh issue view <n> --json number,title,body,labels,comments          # read
gh issue edit <n> --remove-label factory:ready --add-label factory:in-progress   # move state
gh issue edit <n> --add-label factory:agent-awaiting-human           # raise a flag
gh issue comment <n> --body "..."                                    # say why
```

## Setting up a repo

`bash scripts/create-labels.sh [owner/repo]` (from this skill's folder) creates or updates every label above. Exit 0 = all labels exist.
