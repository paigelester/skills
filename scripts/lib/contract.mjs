// The repo contract: what a repo must say about itself before a workflow will run in it.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { BRAIN_VERSION } from "./paths.mjs";
import { loadWorkflow, reviewNames, stackNames, workflowNames } from "./brain.mjs";

export const CONTRACT_FILE = ".factory/contract.json";

export const DEFAULT_LIMITS = { minutesPerRun: 60, maxRuns: 2, pauseAtQuotaPercent: 80 };

const isStrings = (v) => Array.isArray(v) && v.every((s) => typeof s === "string" && s.trim());

/** Read the contract in `repo`. Returns `{ contract, problems }`; `contract` is null when it can't be read. */
export function readContract(repo) {
  const path = join(repo, CONTRACT_FILE);
  if (!existsSync(path)) return { contract: null, problems: [`${CONTRACT_FILE} is missing. This repo has no contract with the factory.`] };
  try {
    return { contract: JSON.parse(readFileSync(path, "utf8")), problems: [] };
  } catch (err) {
    return { contract: null, problems: [`${CONTRACT_FILE} is not valid JSON: ${err.message}`] };
  }
}

/** Every way the contract's own shape is wrong. An empty list means it is well formed. */
export function contractProblems(contract, brainVersion = BRAIN_VERSION) {
  const problems = [];
  if (!contract || typeof contract !== "object" || Array.isArray(contract)) return ["The contract must be a JSON object."];

  if (typeof contract.factory !== "string" || !/^\d+\.\d+\.\d+$/.test(contract.factory)) {
    problems.push(`"factory" must be the factory version this repo targets, such as "${brainVersion}".`);
  } else if (majorMinor(contract.factory) !== majorMinor(brainVersion)) {
    problems.push(`The contract targets factory ${contract.factory} but ${brainVersion} is installed. Upgrade the repo's contract, or install the matching version.`);
  }

  if (!isStrings(contract.stacks)) problems.push(`"stacks" must be a list of stack names. Known stacks: ${stackNames().join(", ")}.`);
  else for (const s of contract.stacks) if (!stackNames().includes(s)) problems.push(`Stack "${s}" has no knowledge file. Known stacks: ${stackNames().join(", ")}.`);

  if (!isStrings(contract.workflows) || contract.workflows.length === 0) problems.push(`"workflows" must list the workflows this repo turns on. Workflows: ${workflowNames().join(", ")}.`);
  else for (const w of contract.workflows) if (!workflowNames().includes(w)) problems.push(`Workflow "${w}" does not exist. Workflows: ${workflowNames().join(", ")}.`);

  const commands = contract.commands;
  if (commands !== undefined && (typeof commands !== "object" || Array.isArray(commands) || commands === null)) problems.push(`"commands" must be an object.`);
  else if (commands) {
    if (commands.verify !== undefined && (!isStrings(commands.verify) || commands.verify.length === 0)) problems.push(`"commands.verify" must be a list of commands, each one a check every change must pass.`);
    if (commands.setup !== undefined && !isStrings(commands.setup)) problems.push(`"commands.setup" must be a list of commands that get a fresh checkout ready to run the checks.`);
    if (commands.run !== undefined && typeof commands.run !== "string") problems.push(`"commands.run" must be the one command that runs the app.`);
  }

  if (contract.reviews !== undefined) {
    if (!Array.isArray(contract.reviews)) problems.push(`"reviews" must be a list of { paths, run } rules.`);
    else
      contract.reviews.forEach((rule, i) => {
        if (!rule || !isStrings(rule.paths) || !isStrings(rule.run)) return problems.push(`"reviews[${i}]" needs "paths" (path patterns) and "run" (review names).`);
        for (const r of rule.run) if (!reviewNames().includes(r)) problems.push(`"reviews[${i}]" asks for the "${r}" review, which does not exist yet. Reviews: ${reviewNames().join(", ")}.`);
      });
  }

  if (contract.limits !== undefined) {
    if (!contract.limits || typeof contract.limits !== "object") problems.push(`"limits" must be an object.`);
    else
      for (const [key, value] of Object.entries(contract.limits)) {
        if (!(key in DEFAULT_LIMITS)) problems.push(`"limits.${key}" is not a limit. Limits: ${Object.keys(DEFAULT_LIMITS).join(", ")}.`);
        else if (typeof value !== "number" || !(value > 0)) problems.push(`"limits.${key}" must be a number above 0.`);
      }
  }

  if (contract.allow !== undefined && !isStrings(contract.allow)) problems.push(`"allow" must be a list of extra shell commands an agent may run.`);
  if (contract.defaultBranch !== undefined && typeof contract.defaultBranch !== "string") problems.push(`"defaultBranch" must be a branch name.`);
  if (contract.mcp !== undefined && typeof contract.mcp !== "boolean") problems.push(`"mcp" must be true or false: whether agent steps load this machine's MCP servers.`);
  return problems;
}

/** What `workflow` needs that the contract doesn't provide. A need is a dot path such as "commands.verify". */
export function unmetNeeds(contract, workflowName) {
  const problems = [];
  if (!contract.workflows?.includes(workflowName)) problems.push(`The contract doesn't turn on the "${workflowName}" workflow. Add it to "workflows".`);
  for (const need of loadWorkflow(workflowName).needs ?? []) {
    const value = need.split(".").reduce((v, key) => v?.[key], contract);
    const empty = value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0);
    if (empty) problems.push(`The "${workflowName}" workflow needs "${need}" in the contract.`);
  }
  return problems;
}

/** The whole check: read, shape, then each workflow's needs (one workflow, or all the repo turns on). */
export function checkContract(repo, workflowName) {
  const { contract, problems } = readContract(repo);
  if (!contract) return { contract, problems };
  problems.push(...contractProblems(contract));
  if (problems.length === 0) {
    for (const w of workflowName ? [workflowName] : contract.workflows) problems.push(...unmetNeeds(contract, w));
  }
  return { contract, problems };
}

export function limits(contract) {
  return { ...DEFAULT_LIMITS, ...(contract.limits ?? {}) };
}

function majorMinor(version) {
  return version.split(".").slice(0, 2).join(".");
}
