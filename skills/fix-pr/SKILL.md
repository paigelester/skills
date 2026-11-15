---
name: fix-pr
description: Take an agent-authored factory PR from failing or commented to green with every review thread answered (fix, verify, push, reply, repeat). Use when a factory PR's checks fail, when it gets review comments, or when asked to fix, update or address feedback on a PR.
---

# Fix a PR

You are the author of the PR, working the two rework loops of the PR workflow: CI fails → fix + push, and review comments → fix + push. You end with every check green and every review thread answered, ready for the `merge-pr` skill, or with the ticket flagged and a question asked.

Labels are in the `factory-labels` skill and pings are in the `notify` skill. Read both first.

**Inputs:** the PR number. The ticket is the issue its body closes (`Closes #<n>`).

## Steps

1. **Read.** Read the PR (`gh pr view <pr> --json number,headRefName,body,reviews,statusCheckRollup`), its linked ticket with its comments, and the ticket's acceptance criteria. Check out the PR's branch at its latest commit. Done when you have the branch checked out and the criteria listed.
2. **Collect the work.** Wait for checks to finish (`gh pr checks <pr> --watch`). For each failing check, read its log and write the failure in one line. List every unresolved review thread (command below) and every review body that asks for a change, with its author. Done when you have one list holding every failing check and every unresolved thread. An empty list means you are done: go to step 6.
3. **Sort each item.** Each item is one of:
   - **fix**: in the ticket's scope, and you agree it's wrong.
   - **push back**: you disagree, and can say why in one line from the ticket, the code or the repo's rules.
   - **out of scope**: it asks for work the ticket doesn't cover. Answer it with a proposal to file a follow-up ticket (with the `create-tickets` skill), and don't build it.
   - **decision**: it needs something only a human can settle. Go to **Stop and ask**.
   Done when every item has one of the four.
4. **Fix.** Make the smallest change that resolves each **fix** item, with a test where the item is a bug. Run the repo's checks (`factory verify`, which runs the contract's `commands.verify`) until it exits 0. Commit in the repo's commit style and push. Done when the check exits 0 on your pushed commit.
5. **Answer.** Reply on every thread: for **fix**, the commit that fixed it; for **push back** and **out of scope**, your one-line reason. Resolve the threads you fixed that an agent opened; leave threads a human opened for that human to resolve. Then go back to step 2. Done when every thread from step 2 has your reply.
6. **Hand off.** Comment on the PR: what changed since the last round, and the check command's result. Then run the `merge-pr` skill on the PR. Done when the comment is posted and `merge-pr` has run.

After 3 rounds of steps 2 to 5 with items still left, go to **Stop and ask**.

## Stop and ask

Push what you have, leave the ticket at `factory:in-review`, and use the `notify` skill with event `decision` (one question, with your recommended answer) or `blocked` (a secret, service or permission you lack, named exactly). Then end with a one-line summary of where the PR stands.

## Commands (GitHub)

```bash
gh pr checks <pr> --watch                                   # wait for checks; non-zero exit if any failed
gh run view <run-id> --log-failed                           # failing steps' logs
gh api graphql -f query='query($o:String!,$r:String!,$n:Int!){repository(owner:$o,name:$r){pullRequest(number:$n){reviewThreads(first:100){nodes{id isResolved comments(first:20){nodes{databaseId author{login} path line body}}}}}}}' \
  -F o={owner} -F r={repo} -F n=<pr>                        # review threads
gh api repos/{owner}/{repo}/pulls/<pr>/comments/<comment-id>/replies -f body="..."   # reply on a thread
gh api graphql -f query='mutation($id:ID!){resolveReviewThread(input:{threadId:$id}){thread{isResolved}}}' -F id=<thread-id>   # resolve a thread
```
