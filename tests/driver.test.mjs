// The driver end to end, against a real git repo with a fake GitHub and a fake agent.
import assert from "node:assert/strict";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { continueRun, pickReviews, startRun } from "../scripts/lib/driver.mjs";
import { summary } from "../scripts/lib/report.mjs";
import { CLEAN_REVIEW, DONE, makeWorld, quiet } from "./helpers.mjs";

const start = (world, extra = {}) => startRun({ cwd: world.repo, workflow: "implement", ticket: 12, say: quiet, ...extra });

test("an agent-owned ticket goes from ready to one squashed commit in an open PR", async () => {
  const world = makeWorld({ agent: { build: [{ write: { "feature.txt": "hello\n" }, output: DONE }], review: [{ output: CLEAN_REVIEW }] } });
  const state = await start(world);

  assert.equal(state.status, "done");
  assert.equal(state.pr, "https://example.test/pull/1");
  assert.deepEqual(world.issue().labels.sort(), ["factory:agent-owned", "factory:in-review"]);
  assert.equal(world.git("rev-parse", "--abbrev-ref", "HEAD"), "12-add-the-feature");
  assert.equal(world.git("rev-list", "--count", "origin/main..HEAD"), "1", "the PR is a single commit");
  assert.equal(world.git("log", "-1", "--format=%s"), "feat: add the feature");
  assert.match(world.git("log", "-1", "--format=%b"), /Closes #12/);
  assert.equal(world.git("rev-parse", "origin/12-add-the-feature"), world.git("rev-parse", "HEAD"), "the branch was pushed");
  assert.equal(state.verified.tree, world.git("rev-parse", "HEAD^{tree}"), "the verify pass is for exactly what was pushed");
  const pr = world.gh().prs[0];
  assert.equal(pr.base, "main");
  assert.match(pr.body, /Closes #12/);
  assert.match(pr.body, /`node check.mjs`: passed/);
  const report = summary(state);
  assert.match(report, /PR: https:\/\/example\.test\/pull\/1/);
  assert.match(report, /\| 1 \| It works \| feature\.txt:1 \|/);
  assert.match(report, /`node check.mjs`: passed/);
});

test("the run log records each step, the agent's usage and the checks", async () => {
  const world = makeWorld({ agent: { build: [{ write: { "feature.txt": "hello\n" }, output: DONE }], review: [{ output: CLEAN_REVIEW }] } });
  const state = await start(world);
  const events = world.events(state.id);

  assert.deepEqual(events.filter((e) => e.event === "step-end").map((e) => `${e.step}:${e.outcome}`), ["claim:passed", "build:passed", "verify:passed", "review:passed", "squash:passed", "pr:passed", "handoff:passed"]);
  const agent = events.find((e) => e.event === "agent" && e.skill === "build");
  assert.equal(agent.session, "fake-build-1");
  assert.equal(agent.cost, 0.01);
  assert.deepEqual(agent.tools, { Edit: 1 });
  assert.equal(events.find((e) => e.event === "check").command, "node check.mjs");
  assert.equal(events.at(-1).event, "run-end");
  for (const e of events) assert.ok(e.ts && e.run === state.id && e.repo === "site" && e.ticket === 12, "every line stands alone");
});

test("a failed check sends the failure back to build, and a must finding does too", async () => {
  const world = makeWorld({
    agent: {
      build: [
        { write: { "feature.txt": "hello\n", "bad.txt": "oops\n" }, output: DONE },
        { remove: ["bad.txt"], output: DONE },
        { write: { "feature.txt": "hello, fixed\n" }, output: DONE },
      ],
      review: [
        { output: { criteria: CLEAN_REVIEW.criteria, findings: [{ severity: "must", file: "feature.txt", line: 1, problem: "Wrong greeting", fix: "Say it properly" }] } },
        { output: { criteria: CLEAN_REVIEW.criteria, findings: [{ severity: "should", file: "feature.txt", line: 1, problem: "Could be friendlier", fix: "Add a wave" }] } },
      ],
    },
  });
  const state = await start(world);

  assert.equal(state.status, "done");
  const prompts = world.prompts();
  assert.deepEqual(prompts.map((p) => p.step), ["build", "build", "review", "build", "review"]);
  assert.match(prompts[1].prompt, /did not pass the "verify" step[\s\S]*bad\.txt must not exist/);
  assert.match(prompts[3].prompt, /did not pass the "review" step[\s\S]*must · feature\.txt:1 · Wrong greeting/);
  assert.equal(world.git("rev-list", "--count", "origin/main..HEAD"), "1", "three rounds of work are still one commit");
  assert.equal(existsSync(join(world.repo, "bad.txt")), false);
  assert.match(world.gh().prs[0].body, /0 must, 1 should[\s\S]*Could be friendlier/);
});

test("a builder gets the knowledge and may edit; a reviewer gets the rubric and may not", async () => {
  const world = makeWorld({ agent: { build: [{ write: { "feature.txt": "hello\n" }, output: DONE }], review: [{ output: CLEAN_REVIEW }] } });
  await start(world);
  const [build, review] = world.prompts();

  assert.match(build.prompt, /knowledge\/fundamentals\/clean-code\.md/);
  assert.match(build.prompt, /knowledge\/stacks\/typescript\.md/);
  assert.doesNotMatch(build.prompt, /knowledge\/rubrics\/code\.md/);
  assert.match(build.prompt, /Ticket #12: Add the feature!/);
  assert.equal(build.settings.permissions.defaultMode, "acceptEdits");
  assert.ok(build.settings.permissions.allow.includes("Bash(node check.mjs)"), "the builder may run the repo's checks");

  assert.match(review.prompt, /knowledge\/rubrics\/code\.md/);
  assert.match(review.prompt, /- feature\.txt/);
  assert.deepEqual(review.settings.permissions.deny, ["Edit", "Write", "NotebookEdit"]);
});

test("a gate that keeps failing stops the run and asks on the ticket", async () => {
  const bad = { write: { "bad.txt": "oops\n" }, output: DONE };
  const world = makeWorld({ agent: { build: [bad, bad, bad, bad, bad, bad] } });
  const state = await start(world);

  assert.equal(state.status, "waiting-you");
  assert.equal(state.wait.step, "verify");
  assert.equal(world.prompts().length, 6, "the first build plus five more rounds");
  assert.ok(world.issue().labels.includes("factory:needs-you"));
  assert.match(world.issue().comments.at(-1), /@paige \*\*Decision needed\*\*[\s\S]*failed 6 time/);
  assert.equal(world.gh().prs.length, 0, "nothing was pushed");
});

test("an agent that needs a decision flags the ticket, and the run carries on once answered", async () => {
  const world = makeWorld({
    agent: {
      build: [
        { output: { status: "needs-human", summary: "Stopped.", kind: "decision", question: "Blue or green? I'd pick blue." } },
        { write: { "feature.txt": "blue\n" }, output: DONE },
      ],
      review: [{ output: CLEAN_REVIEW }],
    },
  });
  const waiting = await start(world);
  assert.equal(waiting.status, "waiting-you");
  assert.ok(world.issue().labels.includes("factory:needs-you"));
  assert.match(world.issue().comments.at(-1), /Blue or green\? I'd pick blue\./);

  const done = await continueRun(waiting, { say: quiet });
  assert.equal(done.status, "done");
  assert.equal(world.issue().labels.includes("factory:needs-you"), false);
  assert.match(world.prompts()[1].prompt, /Blue or green/, "the second attempt sees the ticket's comments");
});

test("on a human-owned ticket the human is the build step and the same gates run on their work", async () => {
  const world = makeWorld({ labels: ["factory:ready", "factory:human-owned"], agent: { review: [{ output: CLEAN_REVIEW }] } });
  const waiting = await start(world);
  assert.equal(waiting.status, "waiting-human");
  assert.equal(waiting.wait.step, "build");
  assert.deepEqual(world.issue().labels.sort(), ["factory:human-owned", "factory:in-progress"]);

  world.write("feature.txt", "by hand\n");
  world.write("bad.txt", "oops\n");
  const failed = await continueRun(waiting, { say: quiet });
  assert.equal(failed.status, "waiting-human", "a failed check comes back to the human, not to an agent");
  assert.match(failed.wait.detail, /bad\.txt must not exist/);

  rmSync(join(world.repo, "bad.txt"));
  const done = await continueRun(failed, { say: quiet });
  assert.equal(done.status, "done");
  assert.equal(done.pr, undefined, "the human opens their own PR");
  assert.equal(world.gh().prs.length, 0);
  assert.equal(world.git("rev-list", "--count", "origin/main..HEAD"), "0", "the driver never commits a human's work");
  assert.deepEqual(world.prompts().map((p) => p.step), ["review"], "no build agent ran");
  assert.ok(world.issue().labels.includes("factory:in-progress"));
});

test("a run refuses to start when the contract doesn't meet the workflow's needs", async () => {
  const world = makeWorld({ contract: { commands: {} } });
  await assert.rejects(start(world), /needs "commands\.verify"/);
  assert.deepEqual(world.issue().labels, ["factory:ready", "factory:agent-owned"], "the ticket was not touched");
});

test("a run refuses a ticket that isn't ready, has no owner, or already has a run", async () => {
  const notReady = makeWorld({ labels: ["factory:refined", "factory:agent-owned"] });
  assert.match((await start(notReady)).stopped, /not at factory:ready/);

  const noOwner = makeWorld({ labels: ["factory:ready"] });
  assert.match((await start(noOwner)).stopped, /no owner label/);

  const twice = makeWorld({ labels: ["factory:ready", "factory:human-owned"] });
  await start(twice);
  await assert.rejects(start(twice), /already has a run/);
});

test("an unattended run pauses when the usage window is nearly spent", async () => {
  const world = makeWorld({
    contract: { limits: { pauseAtQuotaPercent: 80 } },
    agent: { build: [{ write: { "feature.txt": "hello\n" }, output: DONE, quota: 0.85 }], review: [{ output: CLEAN_REVIEW }] },
  });
  const state = await start(world);
  assert.equal(state.status, "paused-quota");
  assert.equal(state.wait.step, "review");
  assert.match(state.wait.reason, /85% of the 5-hour usage window/);
});

test("a run in a worktree belongs to the main repo, uses the worktree's branch and runs the setup commands", async () => {
  const world = makeWorld({
    contract: { commands: { setup: ["node --version"], verify: ["node check.mjs"] } },
    agent: { build: [{ write: { "feature.txt": "hello\n" }, output: DONE }], review: [{ output: CLEAN_REVIEW }] },
  });
  world.git("push", "origin", "main");
  const holding = join(world.root, "site-holding");
  world.git("worktree", "add", "-b", "12-in-a-holding", holding, "origin/main");
  const state = await startRun({ cwd: holding, workflow: "implement", ticket: 12, say: quiet });

  assert.equal(state.status, "done");
  assert.equal(state.branch, "12-in-a-holding");
  assert.equal(state.repoName, "site", "the run is filed under the repo, not the worktree's folder");
  assert.equal(world.gh().prs[0].head, "12-in-a-holding");
  const setup = world.events(state.id).find((e) => e.event === "setup");
  assert.equal(setup.command, "node --version");
  assert.equal(setup.exit, 0);
});

test("reviews are picked from the changed files by the contract's rules", () => {
  const contract = { reviews: [{ paths: ["app/**"], run: ["code"] }] };
  assert.deepEqual(pickReviews(contract, ["app/page.tsx"]), ["code"]);
  assert.deepEqual(pickReviews(contract, ["scripts/x.mjs"]), ["code"], "a file no rule covers still gets the code review");
  assert.deepEqual(pickReviews({}, ["a.ts"]), ["code"]);
});
