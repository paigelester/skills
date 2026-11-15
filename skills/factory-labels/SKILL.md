---
name: factory-labels
description: The `factory:*` ticket labels of the agent software factory and how to move a ticket between them. Use whenever you read, label, comment on or hand off a factory ticket.
---

# Factory labels

A factory ticket's place is its labels. Exactly one **state** label is on an open ticket at a time; **owner** and **flag** labels sit beside it. Moving a ticket means removing the old state label and adding the new one in the same command.

Labels say where a ticket rests. What happens inside a step (refining, routing, verifying, a review round) is in the factory run log, and closing is GitHub's own state.

## States

| Label | Means | Set by |
|---|---|---|
| `factory:new` | Just created | Whoever files it |
| `factory:refined` | Purpose, acceptance criteria, acceptance tests and risk set | Refiner |
| `factory:selected` | Picked to work on next; starts routing | Human |
| `factory:ready` | Approved to build | Human |
| `factory:in-progress` | Being built | The driver, when a run claims it |
| `factory:in-review` | PR open and under review | The driver, once the PR exists |

A finished ticket is closed on GitHub: merged work closes it as completed, a rejected ticket is closed as not planned with the reason in a comment, and a regression reopens it.

## Owners

| Label | Means |
|---|---|
| `factory:agent-owned` | An agent builds it |
| `factory:human-owned` | A developer builds it |

## Flags

Add a flag beside the state label, with a comment saying why. Remove it when the reason is gone.

| Label | Means |
|---|---|
| `factory:needs-you` | An agent needs a decision or access. The comment asks one question, or names exactly what is missing |
| `factory:blocked` | Waiting on another ticket (name it) |

## Commands (GitHub)

```bash
gh issue view <n> --json number,title,body,labels,comments          # read
gh issue edit <n> --remove-label factory:refined --add-label factory:selected   # move state
gh issue edit <n> --add-label factory:needs-you                      # raise a flag
gh issue comment <n> --body "..."                                    # say why
gh issue close <n> --reason "not planned" --comment "..."            # reject, with the reason
```

## Setting up a repo

If a label is missing, the repo isn't set up. Use the `setup-factory` skill.
