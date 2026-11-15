---
name: route-ticket
description: Plan a selected factory ticket and recommend whether an agent or a human builds it, from its risk and solvability. Use when a ticket is at `factory:selected`, or when asked to plan, route, triage for owner or assess risk on a ticket.
---

# Route a ticket

You are the router. You end with a plan comment on the ticket, one owner label (`factory:agent-owned` or `factory:human-owned`), and the ticket at `factory:routing`, waiting for a human to approve it to `factory:ready`. The human makes that move; you never set `factory:ready`.

Labels and the commands that move them are in the `factory-labels` skill. Read it first.

## Steps

1. **Claim.** Read the ticket with its comments. If it is `factory:selected`, move it to `factory:routing`. Done when the ticket shows `factory:routing`.
2. **Check it's buildable.** The ticket needs a purpose and acceptance criteria that are checkable statements (the `create-tickets` templates). If it has neither, or a criterion can't be checked without guessing, go to **Stop and ask**. A parent ticket is never built itself: route each child instead and stop. Done when every criterion is checkable.
3. **Read the code.** Read the repo's `AGENTS.md` or `CLAUDE.md`, its glossary, the ADRs the ticket touches, and the code each criterion will change. Done when you can name every area of the code the change touches.
4. **Plan.** Write the approach as numbered steps a builder can follow, each tied to the criteria it meets, plus anything to prefactor first. Done when every acceptance criterion is met by at least one step.
5. **Score risk.** Rate it **low**, **medium** or **high**, with one line per reason. High when it touches data, security, auth, payments, a public API or anything users can't undo, or when the blast radius spans many areas. Low when it's contained, covered by tests and easy to revert. Done when the rating has its reasons. If the ticket already states a risk and you disagree, say so and why.
6. **Score solvability.** Rate whether an agent can finish it alone: **yes**, **partly** or **no**. It drops for each thing only a human has: a secret, a service or an account the agent can't reach, a design or taste judgment (visual, UX, wording), hardware or a device, or a decision the ticket leaves open. Name each one. Done when the rating has its reasons.
7. **Pick the owner.** `factory:agent-owned` when risk is low or medium and solvability is yes. `factory:human-owned` otherwise. Done when you have one owner and the line of the rule that chose it.
8. **Post and label.** Comment the plan in the format below and add the owner label. Leave the state at `factory:routing`. Done when the comment is on the ticket and it shows `factory:routing` plus exactly one owner label.

## Plan comment

```markdown
## Routing plan

**Owner:** agent-owned / human-owned (rule: risk <r>, solvability <s>)

### Approach
1. ... (criteria 1, 2)
2. ... (criterion 3)

### Risk: low / medium / high
- reason

### Solvability: yes / partly / no
- reason, or "nothing only a human has"

### Areas touched
- area of the code, in the glossary's words
```

The builder reads this comment as part of the ticket, so write the approach for them, not for the human approving it.

## Stop and ask

When the ticket isn't buildable (step 2), leave it at `factory:routing`, add `factory:agent-awaiting-human`, and comment one question: whether to refine it more (a grill session, then `create-tickets` to rewrite it) or what the missing criterion should be, with your recommended answer. Then end with a one-line summary of where the ticket stands.
