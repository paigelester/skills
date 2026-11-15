---
name: merge-pr
description: Decide whether a factory PR needs a human review or can auto-merge (category pre-filter, then risk), merge it or hand it to a human, and close out its ticket. Use when a factory PR is green and its threads are answered, when a factory PR has just been merged, or when asked to merge or land a PR.
---

# Merge a PR

You are the integrator. You end with the PR merged and its ticket closed out, or with the PR handed to a human to review and merge and a comment saying why. You merge only what the pre-filter and risk both allow.

Labels are in the `factory-labels` skill and pings are in the `notify` skill. Read both first.

**Inputs:** the PR number. The ticket is the issue its body closes (`Closes #<n>`).

If the PR is already merged (a human merged it), skip to step 6.

## Steps

1. **Read.** Read the PR (`gh pr view <pr> --json number,state,isDraft,mergeable,files,reviews,statusCheckRollup,body`), its ticket with comments (the routing plan is one of them), and the PR's full diff. Done when you have the changed files, the ticket's owner label and the routing plan's risk, or know there is no plan.
2. **Check the gates.** Every one must hold: not a draft; every check passed; no unresolved review thread; mergeable with no conflicts; the latest `review-implementation` report on the PR says `Result: 0 must`. If there is no report, run the `review-implementation` skill in a separate subagent on the PR and use its result. Done when every gate holds. When one fails, run the `fix-pr` skill for an agent-owned ticket, or comment on the PR which gate fails for a human-owned one, then stop.
3. **Pre-filter.** Take the category list from the repo's `.factory/review-categories.md`, or [`review-categories.md`](review-categories.md) beside this file when the repo has none. Give each changed file the first row it matches, by path or by its **Or when** judgement on the diff, with the file that decided it. The PR's category is the strictest one: **always** beats **risk** beats **no**, and a file matching no row is **always**. Done when every changed file has a row and the PR has one result.
4. **Risk.** Only when the pre-filter result is **risk**. Start from the routing plan's rating. Score it fresh with the rule in the `route-ticket` skill's risk step when there is no plan, or when the diff touches areas the plan's **Areas touched** doesn't list. Done when you have **low**, **medium** or **high** with its reasons.
5. **Decide and act.**
   - **Auto-merge** when the pre-filter says **no**, or says **risk** and risk is **low**. Merge with the repo's merge method (squash when it allows it) and delete the branch. Go to step 6.
   - **Human** otherwise. Use the `notify` skill with event `human-merge`, saying which file and category (or which risk reasons) need a human, then stop. Close-out runs again once they merge.
   Done when the PR is merged or the human has been notified.
6. **Close out.** Move the ticket from `factory:in-review` to `factory:closed` and add `factory:agent-merged` or `factory:human-merged` by who merged (the PR's `mergedBy`). Close the issue if merging didn't. Comment the merge commit on the ticket. If the ticket is a child, and every other child of its parent is closed, close the parent the same way. Done when the ticket (and any parent it finished) is closed with both labels.

Merging hands the change to the release workflow, which starts from `main`.

## Decision comment

Post this on the PR in step 5, whichever way it goes, so the reason is on record:

```markdown
## Merge decision

**Result:** auto-merge / human review (pre-filter <always|risk|no>, risk <low|medium|high|n/a>)

| File | Category | Human review |
|---|---|---|
| path/to/file | Agent instructions | always |
```

## Commands (GitHub)

```bash
gh pr merge <pr> --squash --delete-branch                    # merge (use --merge or --rebase if squash isn't allowed)
gh pr view <pr> --json mergedBy,mergeCommit                  # who merged, and the commit
gh issue edit <n> --remove-label factory:in-review --add-label factory:closed --add-label factory:agent-merged
gh api repos/{owner}/{repo}/issues/<n>/parent --jq .number   # the parent, if any
gh api repos/{owner}/{repo}/issues/<parent>/sub_issues --jq '.[] | [.number, .state] | @tsv'   # its children
```
