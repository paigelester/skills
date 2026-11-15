---
name: create-tickets
description: Turn work someone wants done into factory tickets, sized to fit: one ticket for simple work, a parent with child tickets for big work. Use after a grill session, when asked to file, write or create tickets or issues, or when another workflow (bug triage, exploratory testing, upgrades, tech debt, crash reports) needs to file one.
---

# Create tickets

You turn what someone wants into tickets a builder can pick up without asking anything. You end with every ticket filed on GitHub, refined ones at `factory:refined` and the rest at `factory:new`, and a list of what you filed with links.

Refining happens here, not in a later step. Most of the time you work from a grill session, so the purpose, acceptance criteria and risk are already in the conversation: write them down. Labels and the commands that move them are in the `factory-labels` skill. Read it first.

## Steps

1. **Gather.** Collect everything you know about the work: the grill session or conversation, any issue, spec or file the caller named (read issues with their comments), and the repo's `AGENTS.md` or `CLAUDE.md`, glossary and ADRs for the area. Done when you can say in one sentence what the work changes for whom.
2. **Size it.** The work is **small** if one PR built in one fresh session could do all of it: one behaviour, one area of the code. Anything bigger is **big**. Done when you have called it small or big and can say why in a line.
3. **Draft.** Write each ticket in the template for its type (below). Small work is one ticket. Big work is a **parent** that says what the whole delivers, plus **children** that are vertical slices: each one a complete, verifiable path through every layer it needs, small by the step 2 test, with the other children that block it named. Done when every ticket has every field its type needs, and every acceptance criterion is a checkable statement.
4. **Check for fog.** A ticket is **fuzzy** if you can't write one of its criteria as a checkable statement without guessing what the person wants, or if its scope edge (what's in, what's out) is undecided. List each fuzzy ticket with the gap in one line. Done when every ticket is marked clear or fuzzy.
5. **Ask, only what's needed.** Skip this step entirely when the work is small and clear: a bug with its steps, a "do this" task. Otherwise put one round of questions to the person, numbered, each with your recommended answer:
   - For big work, show the breakdown (title, blocked by, what it delivers per child) and ask whether the split and blocking edges are right.
   - For each fuzzy ticket, name the gap and ask whether they want to refine it more now (run a grill session on just that ticket, using the `grilling` skill where it is installed, then come back to step 3) or file it as it is at `factory:new`.
   Done when the person has answered every question. If nobody can answer (an unattended workflow called you), make no assumptions: file big work as one ticket at `factory:new` with a comment proposing the split, and file fuzzy tickets at `factory:new` with a comment listing each gap.
6. **File.** Create the parent first, then the children in dependency order (blockers first), so each "Blocked by" can name a real issue number. Label each clear ticket `factory:refined` and each ticket left fuzzy `factory:new`; the parent gets `factory:refined` once every child is filed. Link each child under its parent as a sub-issue. Done when every ticket exists, has exactly one state label and every child appears under its parent.
7. **Report.** List each ticket as `#<n> <title> (<state label>)`, children indented under their parent. Done when the list matches what's on GitHub.

## Ticket templates

Every ticket starts with its type line, then the fields for that type. Titles are short and say the outcome, in the repo's glossary vocabulary. Leave file paths and code out unless they encode a decision prose can't (a schema, a state machine), since they go stale.

```markdown
**Type:** bug

## What happens
Steps to reproduce, numbered.

## Expected vs actual
Expected: ...
Actual: ...

## Environment
Version, OS, device, browser: whatever the bug depends on.

## Acceptance criteria
- [ ] The steps above give the expected result
- [ ] A test fails before the fix and passes after it

## Risk
low / medium / high, and why in a line.
```

```markdown
**Type:** task

## Why
What this unblocks or fixes (CI, tech debt, security, an upgrade).

## Scope
In: ...
Out: ...

## Acceptance criteria
- [ ] ...

## Risk
low / medium / high, and why in a line.
```

```markdown
**Type:** feature

## User story
As a <who>, I want <what>, so that <why>.

## Acceptance criteria
- [ ] ...

## Acceptance tests
How each criterion is shown to work: the test, or the check a person runs.

## Risk
low / medium / high, and why in a line.
```

A **parent** uses its children's type template, with a `## Children` section listing each child as `- [ ] #<n> <title>`, filled in as you file them. Each child adds `## Parent` (`#<n>`) and `## Blocked by` (issue numbers, or "None") after its type line.

Risk is how bad it is if this goes wrong: high when it touches data, security, payments, auth, or something users can't undo; low when it's contained and easy to revert.

## Commands (GitHub)

```bash
gh issue create --title "..." --body-file body.md --label factory:refined      # file a ticket; prints its URL
gh api repos/{owner}/{repo}/issues/<parent>/sub_issues \
  -F sub_issue_id="$(gh api repos/{owner}/{repo}/issues/<child> --jq .id)"     # link a child under its parent
gh issue edit <parent> --body-file parent.md                                   # update the parent's Children list
```
