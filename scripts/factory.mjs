#!/usr/bin/env node
// The factory command line. Run it from inside the repo you are working in.
import { BRAIN_VERSION, runsDir } from "./lib/paths.mjs";
import { knowledgeFiles, readKnowledge, reviewNames, stackNames, workflowNames } from "./lib/brain.mjs";
import { CONTRACT_FILE, checkContract, readContract } from "./lib/contract.mjs";
import { continueRun, startRun, stopRun } from "./lib/driver.mjs";
import { runShell } from "./lib/exec.mjs";
import { topLevel, worktreeTree } from "./lib/git.mjs";
import { OPEN_STATUSES, allStates, isAlive, loadState } from "./lib/runs.mjs";
import { summary } from "./lib/report.mjs";
import { syncLabels } from "./lib/tickets.mjs";

const HELP = `factory ${BRAIN_VERSION}

  factory check [workflow]              Check this repo's contract (${CONTRACT_FILE})
  factory start <workflow> <ticket>     Start a run for a ticket, e.g. factory start implement 12
                [--owner human|agent]   Override the ticket's owner label
  factory next [run]                    Carry on this repo's waiting run (after your step, or an answer)
  factory status [--all] [--json]       Show open runs (or every run)
  factory stop <run>                    End a run
  factory verify                        Run the contract's checks on the code as it is now
  factory labels [--fix] [--prune]      Compare the repo's labels with the factory's; create or remove them
  factory knowledge [--hook]            Print the knowledge this repo's contract loads
  factory list                          Show the workflows, reviews and stacks the brain has

Run logs are in ${runsDir()}`;

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith("--")));
const words = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--owner");
const option = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const [command, ...rest] = words;

const fail = (message, code = 1) => {
  console.error(message);
  process.exit(code);
};

/** How a finished or resting run maps to an exit code: 0 fine, 2 it needs the human, 1 it stopped on a problem. */
function exitFor(state) {
  console.log(`\n${summary(state)}`);
  if (state.status === "done" || state.status === "waiting-human") return 0;
  if (state.status === "waiting-you" || state.status === "paused-quota") return 2;
  return 1;
}

function waitingRunHere(id) {
  if (id) return loadState(id);
  const repo = topLevel(process.cwd());
  const open = allStates().filter((s) => s.repo === repo && OPEN_STATUSES.includes(s.status) && !isAlive(s));
  if (open.length === 0) fail("This repo has no run waiting to be carried on.");
  if (open.length > 1) fail(`This repo has ${open.length} waiting runs. Name one:\n${open.map((s) => `  ${s.id} (#${s.ticket}, ${s.status})`).join("\n")}`);
  return open[0];
}

const commands = {
  async check() {
    const repo = topLevel(process.cwd());
    const { problems } = checkContract(repo, rest[0]);
    if (problems.length) fail(`The contract does not pass:\n${problems.map((p) => `- ${p}`).join("\n")}`);
    console.log(`The contract passes for ${rest[0] ? `the "${rest[0]}" workflow` : "every workflow it turns on"} (factory ${BRAIN_VERSION}).`);
  },

  async start() {
    const [workflow, ticket] = rest;
    if (!workflow || !/^\d+$/.test(ticket ?? "")) fail("Usage: factory start <workflow> <ticket number>");
    const owner = option("--owner");
    if (owner && !["human", "agent"].includes(owner)) fail("--owner is human or agent.");
    const state = await startRun({ cwd: process.cwd(), workflow, ticket: Number(ticket), owner: owner ? `${owner}-owned` : undefined });
    process.exit(exitFor(state));
  },

  async next() {
    const state = await continueRun(waitingRunHere(rest[0]));
    process.exit(exitFor(state));
  },

  async status() {
    const states = allStates().filter((s) => flags.has("--all") || OPEN_STATUSES.includes(s.status));
    if (flags.has("--json")) return console.log(JSON.stringify(states, null, 2));
    if (states.length === 0) return console.log(flags.has("--all") ? "There are no runs." : "No runs are open. `factory status --all` shows finished ones.");
    for (const s of states) {
      const status = s.status === "running" && !isAlive(s) ? "running (its process has gone; `factory next` carries it on)" : s.status;
      console.log(`${s.id}  #${s.ticket}  ${s.workflow}  ${s.owner ?? "?"}  ${status}${s.wait ? `  at ${s.wait.step}` : ""}${s.pr ? `  ${s.pr}` : ""}`);
    }
  },

  async stop() {
    if (!rest[0]) fail("Usage: factory stop <run>");
    const state = stopRun(loadState(rest[0]));
    console.log(summary(state));
  },

  async verify() {
    const repo = topLevel(process.cwd());
    const { contract, problems } = readContract(repo);
    if (!contract) fail(problems.join("\n"));
    if (!contract.commands?.verify?.length) fail(`The contract has no "commands.verify".`);
    let failed = 0;
    for (const command of contract.commands.verify) {
      const r = await runShell(command, { cwd: repo });
      console.log(`${r.code === 0 ? "passed" : `FAILED (exit ${r.code})`}  ${command}  ${r.seconds}s`);
      if (r.code !== 0) {
        failed++;
        console.log(r.output.slice(-3000).trim(), "\n");
      }
    }
    console.log(failed ? `${failed} check(s) failed.` : `Every check passed on ${worktreeTree(repo)}.`);
    process.exit(failed ? 1 : 0);
  },

  async labels() {
    const repo = topLevel(process.cwd());
    const report = syncLabels(repo, { fix: flags.has("--fix"), prune: flags.has("--prune") });
    for (const name of report.set) console.log(`set: ${name}`);
    for (const name of report.pruned) console.log(`removed: ${name}`);
    const missing = report.missing.filter((n) => !report.set.includes(n));
    const retired = report.retired.filter((n) => !report.pruned.includes(n));
    if (missing.length) console.log(`Missing or out of date: ${missing.join(", ")}. Run \`factory labels --fix\`.`);
    if (retired.length) console.log(`Retired labels still on the repo: ${retired.join(", ")}. \`factory labels --prune\` deletes them (it also takes them off every ticket).`);
    if (missing.length) process.exit(1);
    if (!retired.length) console.log("The repo's labels match the factory's.");
  },

  async knowledge() {
    // As a SessionStart hook this must never fail or speak when there is nothing to say: a repo without a
    // contract, or a session the driver itself started (which already has its knowledge in the prompt).
    const hook = flags.has("--hook");
    try {
      if (hook && process.env.FACTORY_RUN) return;
      const { contract } = readContract(topLevel(process.cwd()));
      if (!contract) return hook ? undefined : fail(`This repo has no ${CONTRACT_FILE}.`);
      const wanted = ["fundamentals", "stacks"];
      if (!hook) console.log(`Files: ${knowledgeFiles(wanted, contract).join(", ")}\n`);
      else console.log("How Paige writes and judges code. Follow it for any code you write or review in this repo. The repo's own rules overrule it.\n");
      console.log(readKnowledge(wanted, contract));
    } catch (err) {
      if (!hook) throw err;
    }
  },

  async list() {
    console.log(`Workflows: ${workflowNames().join(", ")}\nReviews:   ${reviewNames().join(", ")}\nStacks:    ${stackNames().join(", ")}`);
  },
};

if (!command || flags.has("--help") || command === "help") console.log(HELP);
else if (!commands[command]) fail(`"${command}" is not a factory command.\n\n${HELP}`);
else commands[command]().catch((err) => fail(err.message));
