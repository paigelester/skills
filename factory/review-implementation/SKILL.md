---
name: review-implementation
description: Independent review of an implementation against its factory ticket's acceptance criteria, code quality and docs, whoever wrote it (agent or human) and wherever it runs (locally, in the cloud, or one agent checking another's work). Use when the implement-ticket skill reaches its review step, or when asked to review a branch, diff or PR for a ticket.
---

# Review an implementation

Review someone else's change as a demanding reviewer who did not write it. Run in a fresh agent with only the inputs below, so the author's reasoning doesn't anchor you. The author may be a developer or an agent; review both the same way.

**Inputs:** the ticket number, and the change: uncommitted work in a working tree, a branch, or a PR.

You report; you don't fix. Whoever asked for the review (the developer, or the agent that built it) decides what to change.

## Steps

1. **Read the ask.** Read the ticket's body, comments and attachments (`gh issue view <n> --comments`), and its parent ticket if it has one. List its acceptance criteria. Done when you have a numbered list. If the ticket has no criteria, report that as a `must` and stop.
2. **Read the change.** Get the full change against the default branch, including uncommitted and untracked files (`git diff <default>` plus `git status --short` for new files, or `gh pr diff <pr>`), and read every file it touches enough to understand the change in context. Read the repo's `AGENTS.md` or `CLAUDE.md` for its rules. Done when you can say in one sentence what the change does.
3. **Check each criterion.** For every criterion, find the code that meets it, plus anything the repo's docs require with it (such as tests). A criterion with no code is a `must`. Anything the repo's docs require that's missing is a `must`.
4. **Check the code.** Look for bugs, unhandled errors, broken edge cases, security problems, and breaks of the repo's own rules. Each one that would break behaviour or a rule is a `must`; anything else worth fixing is a `should`.
5. **Check the docs.** If behaviour, UI, setup or commands changed, the README, docs or glossary that describe them must change too. A stale doc is a `must`.
6. **Report.** Return the findings in the format below to whoever asked. When the change is an open PR, also post the report as a PR review (`gh pr review <pr> --comment --body-file report.md`), so the author's `fix-pr` and the `merge-pr` gate can read it. Done when every criterion appears in the criteria table, every finding names a file and line, and, for a PR, the review is posted.

## Output

```
Criteria
| # | Criterion | Met by | Verdict |
|---|---|---|---|
| 1 | ... | src/x.ts:42 | met / not met |

Findings
- must · src/x.ts:42 · what is wrong · what would fix it
- should · docs/y.md:7 · what is wrong · what would fix it

Result: N must, M should
```

`Result: 0 must` means the change is ready to commit and open a PR (or, for an open PR, ready to merge from the review's side). Report only what you found; an empty Findings list is a valid result.
