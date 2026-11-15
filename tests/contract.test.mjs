import assert from "node:assert/strict";
import { test } from "node:test";
import { contractProblems, unmetNeeds } from "../scripts/lib/contract.mjs";
import { matchesGlob } from "../scripts/lib/glob.mjs";

const good = {
  factory: "1.0.0",
  stacks: ["typescript", "nextjs"],
  commands: { verify: ["npm test"], run: "npm run dev" },
  workflows: ["implement"],
  reviews: [{ paths: ["app/**"], run: ["code"] }],
  limits: { minutesPerRun: 60, maxRuns: 2, pauseAtQuotaPercent: 80 },
};

test("a well-formed contract has no problems", () => {
  assert.deepEqual(contractProblems(good, "1.0.0"), []);
  assert.deepEqual(contractProblems(good, "1.0.7"), [], "a patch release needs no contract change");
});

test("the contract must target the installed factory version", () => {
  assert.match(contractProblems(good, "1.1.0")[0], /targets factory 1\.0\.0 but 1\.1\.0 is installed/);
  assert.match(contractProblems({ ...good, factory: "one" }, "1.0.0")[0], /"factory" must be the factory version/);
});

test("each wrong field is named with what it should be", () => {
  const problems = contractProblems(
    { ...good, stacks: ["cobol"], workflows: ["deploy"], commands: { verify: [] }, reviews: [{ paths: ["app/**"], run: ["vibes"] }], limits: { costPerRun: 5, maxRuns: 0 } },
    "1.0.0",
  ).join("\n");
  assert.match(problems, /Stack "cobol" has no knowledge file/);
  assert.match(problems, /Workflow "deploy" does not exist/);
  assert.match(problems, /"commands\.verify" must be a list of commands/);
  assert.match(problems, /the "vibes" review, which does not exist yet/);
  assert.match(problems, /"limits\.costPerRun" is not a limit/);
  assert.match(problems, /"limits\.maxRuns" must be a number above 0/);
});

test("a workflow's needs are checked against the contract", () => {
  assert.deepEqual(unmetNeeds(good, "implement"), []);
  assert.match(unmetNeeds({ ...good, commands: {} }, "implement")[0], /needs "commands\.verify"/);
  assert.match(unmetNeeds({ ...good, workflows: [] }, "implement")[0], /doesn't turn on the "implement" workflow/);
});

test("path patterns: * stays in a folder, ** crosses folders", () => {
  assert.ok(matchesGlob("app/page.tsx", "app/**"));
  assert.ok(matchesGlob("app/cv/page.tsx", "app/**"));
  assert.ok(!matchesGlob("apps/page.tsx", "app/**"));
  assert.ok(matchesGlob("a.test.ts", "**/*.test.*"));
  assert.ok(matchesGlob("src/deep/a.test.ts", "**/*.test.*"));
  assert.ok(!matchesGlob("src/a.ts", "**/*.test.*"));
  assert.ok(matchesGlob("README.md", "README.md"));
  assert.ok(!matchesGlob("docs/README.md", "*.md"));
  assert.ok(matchesGlob("app\\page.tsx", "app/**"), "Windows separators are accepted");
});
