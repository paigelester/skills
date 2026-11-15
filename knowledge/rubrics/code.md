# Code review rubric

Go through each section against the changed lines. A problem that would break behaviour, lose data, open a security hole or break one of the repo's own rules is a `must`. Anything else worth fixing is a `should`.

## Does it do what was asked

- Every acceptance criterion is met by code you can point to.
- Nothing the ticket didn't ask for has been added (see Making a change: smallest change, stay in scope). Out-of-scope work is a `should`: propose a follow-up ticket.

## Is it correct

- Edge cases: empty, one, many, the boundary value, missing or malformed input.
- Failure paths: what happens when the file, network call or other program fails (see Errors). A swallowed error is a `must`.
- State and timing: anything that can run twice, out of order or at the same time.
- Nothing that worked before the change is broken by it.

## Is it safe

- Input from outside is checked before use. No injection into shell commands, SQL, HTML or file paths.
- No secrets, tokens or personal data in code, logs, messages or tests.
- Nothing users can't undo happens without a check.

## Is it tested

- The repo's rules on tests are met. A bug fix has a test that fails without the fix.
- Tests would fail if the behaviour broke (see Testing). A test that can't fail, or one weakened to pass, is a `must`.

## Is it clean

- Judge by the fundamentals and stack knowledge the author was given, not by personal taste.
- Names, structure and style match the code around it.
- No dead code, leftover debugging, or commented-out code.

## Are the docs right

- If behaviour, UI, setup or commands changed, the README, docs or glossary that describe them changed too. A stale doc is a `must`.
