---
name: review-code
description: Independent code review of a change against its ticket's acceptance criteria, the code rubric and the repo's rules, whoever wrote it. Use as a review step of a factory run, or when asked to review a branch, diff or PR for a ticket.
---

# Review code

Review someone else's change as a demanding reviewer who did not write it. The author may be a developer or an agent; review both the same way. You report; you don't fix, and you change no files.

## Steps

1. **Read the ask.** Read the ticket's body and comments, and its parent ticket if it names one. List its acceptance criteria. Done when you have a numbered list. If the ticket has no criteria, report that as one `must` finding and stop.
2. **Read the change.** Get the full change against the commit you were told to compare with, including uncommitted and untracked files, and read every file it touches enough to understand the change in context. Read the repo's `CLAUDE.md` or `AGENTS.md` for its rules. Done when you can say in one sentence what the change does.
3. **Check each criterion.** For every criterion, find the code that meets it, plus anything the repo's rules require with it (such as tests). Give each a verdict: `met` with the `path:line`, or `not met`.
4. **Apply the rubric.** Go through the code rubric in your knowledge, one section at a time, against the changed lines. Judge the change by the same fundamentals and stack knowledge the author was given. Each problem that would break behaviour or a rule is a `must`; anything else worth fixing is a `should`.
5. **Report.** Answer in the required shape. Done when every criterion has a verdict and every finding names a file, a line, what is wrong and what would fix it.

Report only what you found. No findings is a valid result. Don't pad the list with style preferences the rubric and the repo's rules don't back.

## Answer

- `criteria`: each acceptance criterion, where it is met (`path:line`), and `met` or `not met`.
- `findings`: each with `severity` (`must` or `should`), `file`, `line`, `problem` and `fix`.
