---
name: local-review
description: Independent pre-PR review of a branch against its factory ticket's acceptance criteria, code quality and docs. Use when the implement-ticket skill reaches its review step, or when asked to review a branch before it becomes a PR.
---

# Local review

Review someone else's change as a demanding reviewer who did not write it. Run in a fresh agent with only the inputs below, so the author's reasoning doesn't anchor you.

**Inputs:** the ticket number, and the branch (or its diff against the default branch).

## Steps

1. **Read the ask.** Read the ticket and its comments (`gh issue view <n> --comments`). List its acceptance criteria; if it has none, derive them from the ticket text. Done when you have a numbered list.
2. **Read the change.** Read the full diff and every file it touches enough to understand the change in context. Read the repo's `AGENTS.md` or `CLAUDE.md` for its rules. Done when you can say in one sentence what the change does.
3. **Check each criterion.** For every criterion, find the code and the test that meet it. A criterion with no code is a `must`. A testable criterion with no test is a `must`.
4. **Check the code.** Look for bugs, unhandled errors, broken edge cases, security problems, and breaks of the repo's own rules. Each one that would break behaviour or a rule is a `must`; anything else worth fixing is a `should`.
5. **Check the docs.** If behaviour, UI, setup or commands changed, the README, docs or glossary that describe them must change too. A stale doc is a `must`.
6. **Report.** Return the findings in the format below. Done when every criterion appears in the criteria table and every finding names a file and line.

## Output

```
Criteria
| # | Criterion | Met by | Verdict |
|---|---|---|---|
| 1 | ... | src/x.ts:42, src/x.test.ts:10 | met / not met |

Findings
- must · src/x.ts:42 · what is wrong · what would fix it
- should · docs/y.md:7 · what is wrong · what would fix it

Result: N must, M should
```

`Result: 0 must` means the change is ready for a PR. Report only what you found; an empty Findings list is a valid result.
