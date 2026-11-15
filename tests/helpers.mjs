// A throwaway world for driver tests: a git repo with a contract and a remote, a fake GitHub and a fake agent.
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { must } from "../scripts/lib/exec.mjs";
import { BRAIN_VERSION } from "../scripts/lib/paths.mjs";

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

export const DONE = { status: "done", summary: "Adds the feature.", commitMessage: "feat: add the feature", criteria: [{ criterion: "It works", metBy: "feature.txt:1" }] };
export const CLEAN_REVIEW = { criteria: [{ criterion: "It works", metBy: "feature.txt:1", verdict: "met" }], findings: [] };

/**
 * Build the world and point the driver at it through the environment. `ticket` is the labels on issue 12;
 * `agent` is the fake agent's script; `contract` overrides fields of a contract whose one check fails
 * while a file named bad.txt exists.
 */
export function makeWorld({ labels = ["factory:ready", "factory:agent-owned"], agent = {}, contract = {} } = {}) {
  const root = mkdtempSync(join(tmpdir(), "factory-test-"));
  const origin = join(root, "origin.git");
  const repo = join(root, "site");
  const git = (...args) => must("git", args, { cwd: repo });

  must("git", ["init", "--bare", origin]);
  must("git", ["symbolic-ref", "HEAD", "refs/heads/main"], { cwd: origin });
  must("git", ["clone", origin, repo]);
  git("config", "user.name", "Test");
  git("config", "user.email", "test@example.test");
  git("config", "core.autocrlf", "false");
  git("checkout", "-b", "main");
  mkdirSync(join(repo, ".factory"));
  writeFileSync(
    join(repo, ".factory", "contract.json"),
    JSON.stringify({ factory: BRAIN_VERSION, stacks: ["typescript"], commands: { verify: ["node check.mjs"] }, workflows: ["implement"], ...contract }, null, 2),
  );
  writeFileSync(join(repo, "check.mjs"), `import { existsSync } from "node:fs";\nif (existsSync("bad.txt")) { console.error("bad.txt must not exist"); process.exit(1); }\nconsole.log("ok");\n`);
  git("add", "-A");
  git("commit", "-m", "chore: start");
  git("push", "-u", "origin", "main");
  git("remote", "set-head", "origin", "main");

  const ghState = join(root, "gh.json");
  writeFileSync(ghState, JSON.stringify({ issues: { 12: { number: 12, title: "Add the feature!", body: "## Acceptance criteria\n- [ ] It works", labels, comments: [] } }, prs: [], labels: [] }));
  const agentScript = join(root, "agent.json");
  writeFileSync(agentScript, JSON.stringify(agent));

  process.env.FACTORY_HOME = join(root, "home");
  process.env.FACTORY_GH_CMD = JSON.stringify([process.execPath, join(fixtures, "fake-gh.mjs")]);
  process.env.FACTORY_AGENT_CMD = JSON.stringify([process.execPath, join(fixtures, "fake-agent.mjs")]);
  process.env.FAKE_GH_STATE = ghState;
  process.env.FAKE_AGENT_SCRIPT = agentScript;

  return {
    root,
    repo,
    git,
    gh: () => JSON.parse(readFileSync(ghState, "utf8")),
    issue: () => JSON.parse(readFileSync(ghState, "utf8")).issues[12],
    prompts: () => JSON.parse(readFileSync(agentScript, "utf8")).prompts ?? [],
    events: (id) => readFileSync(join(root, "home", "runs", `${id}.jsonl`), "utf8").trim().split("\n").map((l) => JSON.parse(l)),
    write: (path, text) => writeFileSync(join(repo, path), text),
  };
}

export const quiet = () => {};
