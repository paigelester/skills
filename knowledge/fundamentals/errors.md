# Errors

- **Fail loudly and early.** Check inputs where they enter the system and stop with a clear message. Don't carry a bad value deeper and fail somewhere unrelated.
- **Never swallow an error.** An empty `catch`, or one that only logs and carries on as if nothing happened, hides the bug. Handle it, or let it reach something that can.
- **Catch only what you can handle**, at the place that knows what to do about it. Don't wrap every call just in case.
- **An error message says what happened, to what, and what to do next.** "Can't read `.factory/contract.json`: it is not valid JSON" beats "Invalid input".
- **Don't use errors for ordinary outcomes.** "Not found" or "nothing to do" is a normal result; return it as a value.
- **Trust inside, check at the boundary.** Validate what comes from users, files, the network and other programs. Don't re-check values your own code just produced.
- **Never leak secrets.** No tokens, passwords or personal data in messages, logs or commits.
