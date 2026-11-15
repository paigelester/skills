# Clean code

- **Names say what a thing is for.** Use the words in the repo's glossary. A name that needs a comment to explain it is the wrong name. No abbreviations a new reader would have to look up.
- **A function does one thing**, at one level of detail, and its name says what. If you need "and" to describe it, split it.
- **Keep logic away from the edges.** Code that decides things should not also read files, call the network or draw the screen. Put decisions in plain functions that take values and return values, so they can be tested without setup.
- **No duplication of knowledge.** One rule lives in one place. Two pieces of code that look alike but change for different reasons are not duplication; leave them apart.
- **No abstraction before the third use.** Don't add an interface, a base class, a config option or a helper for a single caller.
- **Comments say why, not what.** Explain a constraint, a trade-off or a trap the code can't show. Delete comments that restate the code, and never leave commented-out code.
- **Make wrong states hard to write.** Prefer types and data shapes that can't hold an invalid combination over checks scattered through the code.
- **Short, flat control flow.** Return early instead of nesting. Keep a function short enough to read without scrolling.
- **No magic values.** A number or string with meaning gets a name.
