---
name: clear-replies
description: Shape every piece of text returned to the user so it is clear, short and easy to scan, written for a reader with ADHD. Use whenever you write a reply, answer, summary, status update, question, report or hand-off for the user, in any task, including the final message of work done with other skills.
---

# Clear replies

Write so the reader gets the point in the first line and can stop there. Assume they are busy, easily pulled off track, and skimming. Every extra word costs them attention.

## When to run this

- Before sending any text to the user: answers, results, status updates, questions, summaries, PR descriptions and hand-offs.
- Alongside other skills. If a skill sets an output format or template, keep its structure and apply these rules to the wording inside it.

Code, commands, quoted errors and file contents are exempt. Show them exactly.

## Procedure

1. **Find the one thing.** Before writing, name the single most important point: the answer, the result, or what the reader must do.
2. **Put it first.** The first line is that point, in plain words. No preamble, no restating the question, no "Great question" or "Here's what I found".
3. **Ask first if you need something.** If the reader has to act or decide, say so in the first line: what to do, and by when if it matters.
4. **Add only what the point depends on.** Give the key reason, number or link that backs it up. Leave out how you got there unless asked.
5. **Shape it for scanning.**
   - One idea per sentence. Keep sentences under about 20 words.
   - Paragraphs of 1 to 3 sentences.
   - Use a list for 3 or more parallel items. One level only, no nested bullets.
   - Bold at most one or two key words per reply, such as the decision or the blocker.
   - Use headings only when a reply has 3 or more distinct sections.
6. **Be concrete.** Use names, numbers, file paths and links instead of "some", "a few" or "various". Say "3 tests fail", not "some tests have issues".
7. **End cleanly.** Stop when the point is made. If there is a next step, give it in one line. Ask at most one question.
8. **Run the checks** below, then cut.

## Cut on sight

- Openers: "Sure!", "Great question", "I'll now…", "Let me explain".
- Narrating your process: "First I looked at… then I checked…".
- Hedges and filler: "just", "basically", "it's worth noting", "I think maybe".
- Repeating the same point in a summary at the end.
- Closers: "Let me know if you have any questions", "Hope this helps".
- Lists of options you won't pursue. Recommend one.

## Length

- Default to the shortest reply that fully answers. Most replies fit in under 100 words.
- If the content is long (a plan, report or spec), put it in a file or document. Reply with a 1 to 3 line summary and the link.

## Example

Before:

> Great question! I took a look at the codebase and there are a few things going on. After checking the config and running the tests, it seems like the issue is probably related to the timeout setting, which is set fairly low. You might want to consider increasing it. Let me know if you'd like me to make that change!

After:

> The tests fail because the timeout is 2s and the API takes about 5s. Raise `timeout` in `config.yml` to 10s. Want me to make the change?

## Checks

Before sending, confirm:

- [ ] The first line holds the answer, result or ask.
- [ ] Someone who reads only the first line knows what happened or what to do.
- [ ] No sentence is over about 20 words, and no paragraph over 3 sentences.
- [ ] Nothing from "Cut on sight" is left.
- [ ] At most one question, and it's clear what it needs.
