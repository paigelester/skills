---
name: setup-factory
description: Set up a repo so factory workflows can run in it (its `.factory/contract.json` and the `factory:*` labels on GitHub). Use after installing the factory plugin, when `factory check` fails, or when a factory skill finds a label missing.
---

# Setup factory

You end with the repo ready for the factory: a contract that passes `factory check`, and every `factory:*` label in place on GitHub. Only GitHub Issues is supported.

`factory` below is the driver: `node <skills repo>/scripts/factory.mjs`. Run it from the repo being set up.

## Steps

1. **Check the contract.** Run `factory check`. Done when it passes (go to step 3) or lists what's wrong.
2. **Write or fix the contract.** `.factory/contract.json` says what the repo provides. Fill it from the repo itself, never from guesses:
   - `factory`: the installed version (`factory --help` prints it).
   - `stacks`: the stacks the repo uses, from the names `factory list` prints.
   - `commands.verify`: every check a change must pass (lint, format check, type check, tests, build), read from the repo's `package.json` scripts, `Makefile` or CI workflow. Run each one and keep only commands that exist and exit 0 on a clean checkout. If one fails on a clean checkout, tell the human instead of leaving it out quietly.
   - `commands.run`: the command that runs the app, if there is one.
   - `workflows`: the workflows to turn on, from `factory list`.
   - `reviews`: which reviews a change gets by the paths it touches, using only the reviews `factory list` prints.

   Add `"$schema"` pointing at the skills repo's `schemas/contract.schema.json` for editor help. Done when `factory check` passes and `factory verify` passes on a clean checkout.
3. **Set up the labels.** Run `factory labels`. If it reports missing labels, run `factory labels --fix`, which creates missing labels and corrects out-of-date ones. If it stopped on `gh` sign-in or Issues being off, tell the human the exact fix and stop. Done when it reports no missing labels.
4. **Report.** Say the repo is ready, what the contract turns on, and what was set. If `factory labels` listed retired labels, say so and that `factory labels --prune` deletes them: that takes them off every ticket, so it is the human's call. Done when the human has those lines.

The labels and what they mean are in the `factory-labels` skill.
