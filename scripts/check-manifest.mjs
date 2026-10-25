#!/usr/bin/env node
// Checks that .claude-plugin/marketplace.json lists every skill in the repo,
// under the plugin named after its family folder, so `npx skills` groups it.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const manifestPath = join(root, ".claude-plugin", "marketplace.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const errors = [];

function findSkills(dir) {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...findSkills(path));
    else if (entry.name === "SKILL.md") found.push(relative(root, dir).split(sep).join("/"));
  }
  return found;
}

function frontmatterName(skillDir) {
  const text = readFileSync(join(root, skillDir, "SKILL.md"), "utf8");
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return match?.[1].match(/^name:\s*["']?([^"'\r\n]+?)["']?\s*$/m)?.[1];
}

const listed = new Map();
for (const plugin of manifest.plugins ?? []) {
  for (const raw of plugin.skills ?? []) {
    const path = raw.replace(/^\.\//, "").replace(/\/$/, "");
    if (listed.has(path)) errors.push(`${path} is listed more than once`);
    listed.set(path, plugin.name);
    if (!existsSync(join(root, path, "SKILL.md"))) errors.push(`${path} is listed under "${plugin.name}" but has no SKILL.md`);
  }
}

const names = new Map();
for (const skillDir of findSkills(root)) {
  const parts = skillDir.split("/");
  if (parts.length !== 2) errors.push(`${skillDir} should be at <family>/<skill-name>/SKILL.md`);
  const [family, folder] = parts;
  const plugin = listed.get(skillDir);
  if (!plugin) errors.push(`${skillDir} is missing from marketplace.json (add it to the "${family}" plugin)`);
  else if (plugin !== family) errors.push(`${skillDir} is listed under "${plugin}", expected "${family}"`);
  const name = frontmatterName(skillDir);
  if (!name) errors.push(`${skillDir}/SKILL.md has no name in its frontmatter`);
  else if (name !== folder) errors.push(`${skillDir}/SKILL.md has name "${name}", expected "${folder}"`);
  if (names.has(name)) errors.push(`skill name "${name}" is used by both ${names.get(name)} and ${skillDir}`);
  names.set(name, skillDir);
}

if (errors.length) {
  console.error(errors.map((e) => `- ${e}`).join("\n"));
  process.exit(1);
}
console.log(`marketplace.json lists all ${names.size} skills.`);
