#!/usr/bin/env node
// Checks that the brain holds together: every skill is well formed, every workflow only names steps that
// exist, every piece of knowledge a step loads is there, and the version is the same everywhere.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { BRAIN, BRAIN_VERSION } from "./lib/paths.mjs";
import { workflowNames } from "./lib/brain.mjs";
import { SCRIPT_NAMES } from "./lib/driver.mjs";

const errors = [];
const read = (path) => readFileSync(join(BRAIN, path), "utf8");
const readJson = (path) => {
  try {
    return JSON.parse(read(path));
  } catch (err) {
    errors.push(`${path} is not valid JSON: ${err.message}`);
    return null;
  }
};
const folders = (path) => readdirSync(join(BRAIN, path), { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);

// Frontmatter is YAML, but every skill uses only flat `key: value` lines, so
// this checks that subset strictly instead of pulling in a YAML parser. A plain
// (unquoted) value that YAML would reject or misread, such as one containing
// ": " or " #", is reported with the fix: wrap the value in double quotes.
const PLAIN_START = /^[-?:,\[\]{}#&*!|>'"%@`]/;

function parseFrontmatter(file) {
  const match = read(file).match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!match) return { fields: {}, problems: [`${file} has no frontmatter between --- lines`] };
  const fields = {};
  const problems = [];
  match[1].split(/\r?\n/).forEach((line, i) => {
    const where = `${file} frontmatter line ${i + 2}`;
    if (!line.trim() || line.trimStart().startsWith("#")) return;
    const kv = line.match(/^([A-Za-z0-9_-]+):(?:\s+(.*?))?\s*$/);
    if (!kv) return problems.push(`${where} is not a \`key: value\` line: ${line}`);
    const [, key, raw = ""] = kv;
    if (key in fields) problems.push(`${where} repeats the key "${key}"`);
    let value = raw;
    if (raw.startsWith('"')) {
      if (!/^"(?:[^"\\]|\\.)*"$/.test(raw)) problems.push(`${where}: "${key}" opens a double quote it doesn't close cleanly`);
      else value = JSON.parse(raw);
    } else if (raw.startsWith("'")) {
      if (!/^'(?:[^']|'')*'$/.test(raw)) problems.push(`${where}: "${key}" opens a single quote it doesn't close cleanly`);
      else value = raw.slice(1, -1).replace(/''/g, "'");
    } else if (PLAIN_START.test(raw) || raw.includes(": ") || raw.includes(" #") || raw.endsWith(":")) {
      problems.push(`${where}: "${key}" isn't valid unquoted YAML (it has ": ", " #" or a special first character); wrap the value in double quotes`);
    }
    fields[key] = value;
  });
  return { fields, problems };
}

// Skills: skills/<name>/SKILL.md, named after its folder. A step skill also has a step.json.
const stepSkills = new Set();
for (const folder of folders("skills")) {
  const file = `skills/${folder}/SKILL.md`;
  if (!existsSync(join(BRAIN, file))) {
    errors.push(`skills/${folder} has no SKILL.md`);
    continue;
  }
  const { fields, problems } = parseFrontmatter(file);
  errors.push(...problems);
  if (!fields.description) errors.push(`${file} has no description in its frontmatter`);
  if (fields.name !== folder) errors.push(`${file} has name "${fields.name}", expected "${folder}"`);

  const stepFile = `skills/${folder}/step.json`;
  if (!existsSync(join(BRAIN, stepFile))) continue;
  stepSkills.add(folder);
  const step = readJson(stepFile);
  if (!step) continue;
  if (step.output?.type !== "object") errors.push(`${stepFile} needs "output": a JSON Schema object for the agent's answer`);
  for (const k of step.knowledge ?? []) {
    if (k === "fundamentals" || k === "stacks") continue;
    if (!existsSync(join(BRAIN, "knowledge", `${k}.md`))) errors.push(`${stepFile} loads knowledge "${k}", but knowledge/${k}.md is missing`);
  }
}

// Reviews: a rubric and a review-<name> step skill, always together.
const rubrics = readdirSync(join(BRAIN, "knowledge", "rubrics")).filter((n) => n.endsWith(".md")).map((n) => n.slice(0, -3));
for (const r of rubrics) if (!stepSkills.has(`review-${r}`)) errors.push(`knowledge/rubrics/${r}.md has no skills/review-${r}/ step skill`);
for (const s of stepSkills) if (s.startsWith("review-") && !rubrics.includes(s.slice(7))) errors.push(`skills/${s} has no knowledge/rubrics/${s.slice(7)}.md`);

// Workflows: each step is a script or a skill that exists, and every jump lands on a step.
for (const name of workflowNames()) {
  const file = `workflows/${name}.json`;
  const workflow = readJson(file);
  if (!workflow) continue;
  if (workflow.name !== name) errors.push(`${file} has name "${workflow.name}", expected "${name}"`);
  const ids = (workflow.steps ?? []).map((s) => s.id);
  if (ids.length === 0) errors.push(`${file} has no steps`);
  if (new Set(ids).size !== ids.length) errors.push(`${file} repeats a step id`);
  for (const step of workflow.steps ?? []) {
    const where = `${file} step "${step.id}"`;
    if (Boolean(step.script) === Boolean(step.skill)) errors.push(`${where} needs exactly one of "script" or "skill"`);
    if (step.script && !SCRIPT_NAMES.includes(step.script)) errors.push(`${where} names the script "${step.script}", which doesn't exist. Scripts: ${SCRIPT_NAMES.join(", ")}`);
    if (step.then && !SCRIPT_NAMES.includes(step.then)) errors.push(`${where} names the script "${step.then}" in "then", which doesn't exist`);
    if (step.skill && !stepSkills.has(step.skill)) errors.push(`${where} names the skill "${step.skill}", which has no skills/${step.skill}/step.json`);
    if (step.onFail && !ids.includes(step.onFail)) errors.push(`${where} goes to "${step.onFail}" on a fail, which isn't a step`);
    for (const key of ["human", "only"]) if (step[key] && !["agent-owned", "human-owned"].includes(step[key])) errors.push(`${where} has "${key}": "${step[key]}"; it must be agent-owned or human-owned`);
  }
}

// One version, everywhere it is written down.
const pluginVersion = readJson(".claude-plugin/plugin.json")?.version;
if (pluginVersion !== BRAIN_VERSION) errors.push(`.claude-plugin/plugin.json is version ${pluginVersion} but package.json is ${BRAIN_VERSION}`);

if (errors.length) {
  console.error(errors.map((e) => `- ${e}`).join("\n"));
  process.exit(1);
}
console.log(`The brain holds together: ${folders("skills").length} skills (${stepSkills.size} step skills), ${workflowNames().length} workflow(s), ${rubrics.length} review(s), version ${BRAIN_VERSION}.`);
