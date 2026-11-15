# Testing

- **A test must be able to fail.** It earns its place only if it would fail when the behaviour breaks. A bug fix comes with a test that fails before the fix and passes after it.
- **Test behaviour, not wiring.** Assert on what the code returns or does for its caller, not on which internal functions it called. A refactor that keeps behaviour should break no tests.
- **Put the logic where it's cheap to test.** Decisions live in plain functions (see Clean code), and those get the tests. Don't build elaborate mocks to reach logic buried in an edge.
- **Fake only what's outside.** Replace the network, the clock, the file system or another program. Don't mock your own code.
- **One reason to fail per test**, and a name that says the behaviour: "refuses to open a PR when the code changed after verify".
- **Cover the edges the ticket names** and the obvious ones: empty, one, many, the boundary value, the failure path.
- **Tests sit beside the code they test** and run with the repo's one test command. A test that needs manual setup doesn't count.
- **Never weaken a test to make it pass.** Don't delete, skip or loosen an assertion to get green. If the test is wrong, say why in the change.
