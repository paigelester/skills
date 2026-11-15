---
name: build
description: Build one factory ticket's change in the working tree, meeting every acceptance criterion with the smallest change. Use as the build step of a factory run, or when asked to build or implement a ticket whose branch is already checked out.
---

# Build

You make the code change for one ticket. You end with every acceptance criterion met by code in the working tree, or with one question for the human. You don't commit, push or open a PR.

## Steps

1. **Understand.** Read the ticket's body and comments, and its parent ticket if it names one. Read the repo's `CLAUDE.md` or `AGENTS.md`, its glossary, and any decision records the ticket touches. Done when you have a numbered list of the acceptance criteria and each is a checkable statement. If the ticket has no criteria, or one can't be checked without guessing what the human wants, stop and ask.
2. **Read the code.** Read every file a criterion will change, and one nearby example of the same kind of change. Done when you can name the files you will touch and the pattern you will follow.
3. **Build.** Make the smallest change that meets every criterion, following the knowledge you were given and the repo's rules. Add or update tests where the repo's rules or the ticket ask for them. Update the docs that describe any behaviour, setup or command you changed. Done when every criterion has code that meets it.
4. **Check your own work.** Run the checks you were told the driver runs, and fix what fails. The driver runs them again and only its result counts, so this is to save a round, not to prove anything. Done when they pass, or you have fixed what you can.
5. **Answer.** Report in the required shape. Done when every criterion appears with the file and line that meets it.

When you are given **Rework**, an earlier attempt failed a gate. Fix exactly what it lists, keep every criterion met, and answer the same way.

## Answer

- `status`: `done`, or `needs-human` when you stopped to ask.
- `summary`: what changed and why, in two or three sentences, for the PR description.
- `commitMessage`: one line in the repo's commit style (read its commit rules; many repos enforce Conventional Commits).
- `criteria`: each acceptance criterion and where it is met, as `path:line`.
- `kind` and `question`: only with `needs-human`.

## Stop and ask

Stop as soon as the next step needs something only a human has, and answer `needs-human`:

- `kind: decision`: an unclear requirement, a trade-off the ticket doesn't settle, or a change outside the ticket's scope. Ask one question and give your recommended answer.
- `kind: blocked`: a secret, a service, a permission, or a command you aren't allowed to run. Name exactly what is missing.

Leave the work you have done in the working tree.
