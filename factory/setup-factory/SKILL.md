---
name: setup-factory
description: Set up a GitHub repo so the factory skills work in it (the `factory:*` labels in its issue tracker). Use after installing the factory skills, or when a factory skill finds a label missing.
---

# Setup factory

You end with the repo ready for the factory: GitHub Issues turned on and every `factory:*` label in place with the right colour and description. Only GitHub Issues is supported.

## Steps

1. **Check.** Run `bash scripts/setup.sh --check [owner/repo]` from this skill's folder. Without a repo it uses the current directory's GitHub repo. Done when it exits 0 (go to step 3) or lists what's missing.
2. **Set up.** If it stopped on `gh` sign-in or Issues being off, tell the human the exact fix it printed and stop. Otherwise run `bash scripts/setup.sh [owner/repo]`, which creates missing labels and corrects out-of-date ones. It never deletes a label. Done when it exits 0.
3. **Report.** Say the repo is ready, and what was set. Mention once that the repo can override which PRs need a human review by copying `merge-pr/review-categories.md` to `.factory/review-categories.md`. That file is optional. Done when the human has both lines.

The labels and what they mean are in the `factory-labels` skill.
