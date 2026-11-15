# Knowledge

How I write, judge and think about software. Workflows and skills load these files; nothing here is run.

| Folder | Holds | Loaded when |
|---|---|---|
| `fundamentals/` | What holds in every language: making a change, clean code, errors, testing | Always, for build and review, and at the start of any session in a repo with a contract |
| `stacks/` | What differs per language or framework | The repo's contract names the stack in `"stacks"` |
| `rubrics/` | What each review checks, section by section | That review runs |

A more specific file overrules a more general one: a stack overrules the fundamentals, and a repo's own `CLAUDE.md` or `AGENTS.md` overrules both.

The builder and the reviewer read the same files, so work is judged by the standard it was built to.

## Changing it

These files are a first version. When a correction to an agent is a rule rather than a one-off, add it to the right file in a pull request on this repo. Keep each rule one or two lines: what to do, and why when it isn't obvious.

## Adding a stack or a review

- **Stack:** add `stacks/<name>.md`. A contract can then list `<name>` in `"stacks"`.
- **Review:** add `rubrics/<name>.md` and a `skills/review-<name>/` step skill. A contract can then ask for `<name>` in a `"reviews"` rule.
