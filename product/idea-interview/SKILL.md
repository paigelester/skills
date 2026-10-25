---
name: idea-interview
description: Interview the user one question at a time about a new idea (a game, an application or another product) until there is 95% confidence in what they actually want, challenging assumptions along the way. Use when asked to design or build something with little context, or when the user asks to be interviewed or grilled on an idea.
---

# Idea interview

Find out what the user really wants before anything is designed or built. Ask one question at a time, dig past the stated solution to the underlying intent, and challenge weak thinking. Stop only when you're 95% confident you understand the idea well enough to write its design document without guessing.

## When to use

- The user asks you to design or build something and gives little context ("make me a budgeting app", "I want a roguelike").
- The user asks to be interviewed, grilled or challenged on an idea.
- Any other skill needs a clear idea and doesn't have one.

## Rules

- **One question per message.** Never batch questions or add "also...". Wait for the answer before asking the next one.
- **Choose the question that reduces uncertainty most.** Go after the biggest gap, not the next item in a list.
- **Ask about intent, not just features.** When the user names a solution, ask what it's for. Keep asking "why" until you reach the real goal, usually within 2 to 3 levels.
- **Make it easy to answer.** Where it helps, offer 2 to 4 concrete options plus "something else", and say which you'd pick and why.
- **Challenge, don't agree by default.** After each answer, if any of these apply, raise one before moving on:
  - It's vague ("fun", "simple", "for everyone"): ask for a concrete example or measure.
  - It contradicts something said earlier: quote both and ask which wins.
  - It's an untested assumption the idea depends on: say so and ask what evidence exists.
  - Something similar already exists: name it and ask what would be different.
  - A simpler or cheaper version would meet the same goal: propose it.
  - The scope is far larger than the goal needs: say what could be cut.
  Be direct and specific. Don't soften challenges into compliments, and don't lecture: one sharp point, then the question.
- **Don't design yet.** Capture ideas the user raises, but keep the interview on understanding, not solutions.
- **No role-play.** Ask as yourself; don't adopt an interviewer persona.

## Procedure

1. **Restate the idea** in one sentence, then ask the first question. If the type isn't obvious, the first question is what kind of thing it is: a **game**, an **application** (web, mobile, desktop, service), or **something else** (say what).
2. **Interview to cover the areas below.** Core areas apply to every idea; then add the areas for its type.
3. **Track confidence.** After each answer, end your message with one status line:
   `Confidence: NN% · Biggest gap: <area>`
   Score each area 0 to 100% for how well you could write it without guessing, and use the lowest-scoring areas to decide the next question. Overall confidence is not an average: it can't be higher than the weakest area that matters.
4. **At 95%, play it back.** Write a short summary of the idea, area by area, including the decisions and trade-offs agreed, and anything explicitly out of scope. Ask: "Is this right? What's wrong or missing?"
5. **Correct and confirm.** If the user corrects anything, update the summary, lower confidence where needed and keep interviewing. Finish only when the user confirms the summary.
6. **Save the result** to `docs/design/<idea-slug>/interview.md` (or where the project's CLAUDE.md says): the confirmed summary, then the open questions and assumptions that remain, then the challenges raised and how each was resolved.

If the user says to stop early, save what you have and mark every area under 95% as `Unconfirmed`.

## Areas to cover

### Core (every idea)

- **Pitch:** what it is, in one or two sentences.
- **Intent:** why the user wants this; the real goal behind it (a problem to solve, an experience to create, something to learn, a business to start).
- **Audience:** who it's for, specifically. Who it's not for.
- **Value:** the problem it solves or the experience it gives; why someone would choose it over what exists.
- **Success:** how the user will know it worked, in observable terms.
- **Scope:** what the first version must include, and what's explicitly out.
- **Constraints:** platform, budget, time, skills, team size, technology, legal or content limits.
- **Risks and assumptions:** what has to be true for this to work.

### Game

- **Player fantasy:** what the player should feel or get to be.
- **Core loop:** what the player does minute to minute, and why it's satisfying to repeat.
- **Mechanics:** the main rules and actions; win, lose and fail states.
- **Progression:** what changes over a session and across sessions.
- **Setting and story:** world, tone, how much narrative.
- **Art and audio direction:** style, references.
- **Platform and controls.**
- **Session length and audience play habits.**
- **Monetisation**, if any.

### Application

- **Key capabilities:** what users must be able to do (what, not how).
- **Types of user and their goals:** including admins or other roles.
- **Main journey:** the path from first use to getting value.
- **Platforms and integrations:** devices, other systems, imports and exports.
- **Data and privacy:** what's stored, sensitive data, who can see what.
- **Quality needs:** performance, availability, accessibility, security, where they matter.
- **Business model**, if any.

### Other types

Use the core areas, then add 4 to 8 areas that a design document for that type would need, and tell the user which ones you added.

## Checks before finishing

- Every area that applies is at 95% or marked `Unconfirmed` with the reason.
- The user has explicitly confirmed the play-back summary.
- Every challenge raised has a recorded outcome: accepted, rejected with a reason, or still open.
