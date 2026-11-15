// Reading the brain: its workflows, step skills and knowledge files.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { BRAIN } from "./paths.mjs";

/** The factory:* labels, as name, colour and description. The ticket's place, its owner, and two flags. */
export const LABELS = [
  ["factory:new", "ededed", "Just created"],
  ["factory:refined", "bfd4f2", "Purpose, acceptance criteria, tests and risk set"],
  ["factory:selected", "bfdadc", "Picked to work on next; starts routing"],
  ["factory:ready", "0e8a16", "Approved to build"],
  ["factory:in-progress", "fbca04", "Being built"],
  ["factory:in-review", "1d76db", "PR open and under review"],
  ["factory:agent-owned", "006b75", "An agent builds it"],
  ["factory:human-owned", "0052cc", "A developer builds it"],
  ["factory:needs-you", "d93f0b", "The agent needs a decision or access; the reason is in the comment"],
  ["factory:blocked", "b60205", "Waiting on another ticket"],
];

/** Labels from before the cut to 10. `factory labels --prune` removes them; nothing else touches them. */
export const RETIRED_LABELS = [
  "factory:refining",
  "factory:routing",
  "factory:merged",
  "factory:closed",
  "factory:reopened",
  "factory:agent-awaiting-human",
  "factory:agent-blocked",
  "factory:wont-do",
  "factory:agent-merged",
  "factory:human-merged",
  "factory:bug-reproduced",
  "factory:bug-not-reproduced",
];

function names(dir, suffix) {
  const path = join(BRAIN, dir);
  if (!existsSync(path)) return [];
  return readdirSync(path)
    .filter((n) => n.endsWith(suffix))
    .map((n) => n.slice(0, -suffix.length))
    .sort();
}

export const workflowNames = () => names("workflows", ".json");
export const stackNames = () => names("knowledge/stacks", ".md");
export const fundamentalNames = () => names("knowledge/fundamentals", ".md");

/** A review exists when it has both a rubric and a `review-<name>` step skill. */
export function reviewNames() {
  return names("knowledge/rubrics", ".md").filter((n) => existsSync(join(BRAIN, "skills", `review-${n}`, "step.json")));
}

export function loadWorkflow(name) {
  const path = join(BRAIN, "workflows", `${name}.json`);
  if (!existsSync(path)) throw new Error(`There is no "${name}" workflow. Workflows: ${workflowNames().join(", ")}`);
  return JSON.parse(readFileSync(path, "utf8"));
}

/** A step skill: its instructions (SKILL.md without frontmatter) and its machine part (step.json). */
export function loadStepSkill(name) {
  const dir = join(BRAIN, "skills", name);
  const stepPath = join(dir, "step.json");
  if (!existsSync(stepPath)) throw new Error(`"${name}" is not a step skill: skills/${name}/step.json is missing`);
  const text = readFileSync(join(dir, "SKILL.md"), "utf8");
  return {
    name,
    instructions: text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "").trim(),
    step: JSON.parse(readFileSync(stepPath, "utf8")),
  };
}

/**
 * The knowledge files a step loads, most general first, so a more specific file can overrule an earlier one.
 * `wanted` holds "fundamentals", "stacks" (the contract's stacks) or a path such as "rubrics/code".
 */
export function knowledgeFiles(wanted, contract) {
  const files = [];
  for (const item of wanted) {
    if (item === "fundamentals") for (const n of fundamentalNames()) files.push(`knowledge/fundamentals/${n}.md`);
    else if (item === "stacks") for (const n of contract?.stacks ?? []) files.push(`knowledge/stacks/${n}.md`);
    else files.push(`knowledge/${item}.md`);
  }
  return files.filter((f) => existsSync(join(BRAIN, f)));
}

export function readKnowledge(wanted, contract) {
  return knowledgeFiles(wanted, contract)
    .map((f) => `<!-- ${f} -->\n${readFileSync(join(BRAIN, f), "utf8").trim()}`)
    .join("\n\n");
}
