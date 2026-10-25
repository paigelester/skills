---
name: using-skills
description: Find and apply the right skill or workflow for the work at hand. Use at the start of every session and before starting any new task, request or change of direction, to decide which skills apply and in what order. Governs how all other skills are discovered and invoked.
---

# Using skills

Before doing any piece of work, check whether a skill covers it, and if one does, follow it. Skills hold the agreed procedure, checks and output format for a type of work; skipping them means redoing work to the wrong standard.

## When to run this

- At the start of every session, before the first task.
- Whenever a new request arrives, including follow-ups that change the kind of work (e.g. from "write requirements" to "review the code").
- When you're unsure how to approach a task, or about to improvise a procedure.
- When a skill you're following hands off to "the next step".

## Procedure

1. **Name the work.** Write one line describing what's being asked and what the output is (a document, code change, review, decision).
2. **List what's available.** Check the skills loaded in this session (their names and descriptions), then the skill index below.
3. **Match on the description.** A skill applies when its description covers the work, even partially. If there's even a moderate chance a skill applies, open it and read it before deciding it doesn't.
4. **Pick the order** when more than one applies:
   - Earlier lifecycle stages first (e.g. product before engineering before testing).
   - Process skills (framing, planning, scoping) before execution skills (writing, coding).
   - Verification and review skills last, and run independently of the author where possible.
5. **Say which skills you're using** in one line before starting, e.g. "Using idea-framing, then user-personas." If none applies, say so and say what you'll do instead.
6. **Follow the skill as written.** Use its steps, output format, file locations and end-of-skill checks. Don't skip checks or merge steps to save time. Where the project's CLAUDE.md or the user's instructions conflict with a skill, they win; note the deviation.
7. **Re-check at hand-offs.** When one skill finishes, come back to step 1 for the next piece of work rather than carrying on informally.
8. **Record gaps.** If the same kind of work keeps coming up with no skill for it, note it as a candidate skill for the skills repo.

## Rules

- Skills are procedures, not roles. Apply the steps; don't adopt a character or persona.
- A skill's description decides whether it applies, not how busy or simple the task seems. "This is quick" isn't a reason to skip one.
- Don't invent a skill name. Only invoke skills that exist in this session or the repo.
- If a task needs isolation (an independent review, a long research sweep), run that skill in a separate agent, give it the inputs, and ask for the skill's output format back.

## Skill index

Find the question that matches the work, then use the skill it points to.

```
Meta
  Starting a session or a new task? ───────────────→ using-skills
```

Each family's `README.md` has more detail on its skills.

## Workflows

Common chains of skills. Start at the first step that hasn't been done yet.

None yet.

Only list families and skills that exist in the repo. When adding a skill, add its question to the skill index (and to the workflows table if it joins a chain) in the same change.
