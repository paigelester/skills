# skills

My software engineer brain, in a form agents can run: workflows, step skills, scripts and knowledge. Claude Code and GitHub Issues only.

| Layer | Folder | Holds | Rule |
|---|---|---|---|
| Workflows | `workflows/` | `implement` | Owns order, gates and loop limits. Declares what a repo must provide. |
| Step skills | `skills/` | `build`, `review-code` | One job each. Never names the next step. |
| Scripts | `scripts/` | The driver (`factory`), verify, contract check, labels, run log | No judgment. Pass or fail. |
| Knowledge | `knowledge/` | Fundamentals, stacks, review rubrics | How I write and judge code. Loaded into steps, never run. |

`skills/` also holds the skills that don't have a workflow yet and are followed by hand: `create-tickets`, `route-ticket`, `fix-pr`, `merge-pr`, `notify`, `factory-labels`, `setup-factory`, plus `using-skills` and `clear-replies`.

## How a run works

The driver, not an agent, moves a run from step to step. It runs each skill step as a fresh headless Claude Code session, runs script steps itself, and checks every gate before the next step, so a step can't be skipped.

```
factory start implement 12

claim     ticket must be factory:ready with an owner; moves it to in-progress; makes the branch
build     agent-owned: a fresh agent builds it.  human-owned: the run waits for you (`factory next`)
verify    the driver runs the contract's checks and stamps a pass with the exact files it passed on
review    reviews picked from the changed files by the contract's rules, each a fresh agent
squash    the run's commits become one commit, with the repo's hooks running   (agent-owned)
pr        refused unless a verify pass is on record for exactly what is pushed  (agent-owned)
handoff   ticket moves to in-review, with the PR link
```

A failed check or a `must` review finding goes back to build, up to the workflow's loop limit. Then the run stops, flags the ticket `factory:needs-you` and says why in a comment. Agents never merge.

## Set up a repo

1. **Install the driver** on your machine, once, from a clone of this repo:

   ```bash
   npm link        # puts `factory` on your PATH, pointing at this clone
   ```

2. **Install the plugin** in Claude Code, once. It carries the skills, and loads the knowledge into every session in a repo that has a contract:

   ```
   /plugin marketplace add paigelester/skills
   /plugin install factory@paigelester-skills
   ```

3. **Write the repo's contract**, `.factory/contract.json`. The `setup-factory` skill does this with you. A repo can only use a workflow whose needs its contract meets:

   ```json
   {
     "$schema": "https://raw.githubusercontent.com/paigelester/skills/master/schemas/contract.schema.json",
     "factory": "1.0.0",
     "stacks": ["typescript", "nextjs"],
     "commands": {
       "verify": ["npm run lint", "npm run typecheck", "npm test", "npm run build"],
       "run": "npm run dev"
     },
     "workflows": ["implement"],
     "reviews": [{ "paths": ["app/**"], "run": ["code"] }],
     "limits": { "minutesPerRun": 60, "maxRuns": 2, "pauseAtQuotaPercent": 80 }
   }
   ```

   | Field | Means |
   |---|---|
   | `factory` | The factory version the repo targets. Its major.minor must match the installed one, so upgrading a repo is a deliberate step. |
   | `stacks` | Which `knowledge/stacks/` files load for build and review. |
   | `commands.verify` | Every check a change must pass. Only the driver's run of them counts. |
   | `workflows` | The workflows the repo turns on. |
   | `reviews` | Which reviews a change gets, by the paths it touches. A file no rule covers gets the `code` review. |
   | `limits` | Optional. Time per unattended run, runs at once, and the share of the 5-hour usage window at which unattended runs pause. |

4. **Check it and set up the labels:**

   ```bash
   factory check
   factory labels --fix
   ```

## Commands

```
factory check [workflow]              Check this repo's contract
factory start <workflow> <ticket>     Start a run for a ticket
factory next [run]                    Carry on this repo's waiting run
factory status [--all] [--json]       Show open runs (or every run)
factory stop <run>                    End a run
factory verify                        Run the contract's checks on the code as it is now
factory labels [--fix] [--prune]      Compare the repo's labels with the factory's
factory knowledge                     Print the knowledge this repo's contract loads
factory list                          Show the workflows, reviews and stacks the brain has
```

## Run logs

Every run writes to `~/.factory/runs/` (set `FACTORY_HOME` to move it):

- `<run>.jsonl`: the run log. One JSON event per line, appended as things happen: each step's start and end, each agent's session id, duration, cost, tokens, tools and skills used, each check's exit code, each loop and wait. Every line carries the run, repo, ticket and workflow.
- `<run>.json`: the run's state, which `factory next` carries on from.
- `<run>/`: each agent's prompt and answer, each check's full output, the review findings, the PR body.

Reopen any agent step with `claude --resume <session id>`.

## Changing the brain

- **A rule I keep repeating:** add it to the right file in `knowledge/`. See `knowledge/README.md`.
- **A new stack:** add `knowledge/stacks/<name>.md`.
- **A new review:** add `knowledge/rubrics/<name>.md` and a `skills/review-<name>/` step skill (`SKILL.md` plus `step.json`).
- **A new skill:** add `skills/<name>/SKILL.md`. The frontmatter `name` must match the folder. Wrap the `description` in double quotes if it contains `: ` or ` #`. Add its question to the index in `skills/using-skills/SKILL.md`.
- **A new workflow:** add `workflows/<name>.json`. See `workflows/README.md`.

Run `npm run verify` before committing. It checks the brain holds together (`scripts/check-brain.mjs`) and runs the driver's tests against a fake GitHub and a fake agent. CI runs the same on every pull request.

Bump the version in `package.json` and `.claude-plugin/plugin.json` together. A minor or major bump means every repo's contract has to be updated before its workflows run again.
