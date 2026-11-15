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

// Frontmatter is YAML, but every skill uses only flat `key: value` lines, so
// this checks that subset strictly instead of pulling in a YAML parser. A plain
// (unquoted) value that YAML would reject or misread, such as one containing
// ": " or " #", is reported with the fix: wrap the value in double quotes.
const PLAIN_START = /^[-?:,\[\]{}#&*!|>'"%@`]/;

function parseFrontmatter(skillDir) {
  const file = `${skillDir}/SKILL.md`;
  const text = readFileSync(join(root, file), "utf8");
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
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
  const { fields, problems } = parseFrontmatter(skillDir);
  errors.push(...problems);
  const name = fields.name;
  if (!fields.description) errors.push(`${skillDir}/SKILL.md has no description in its frontmatter`);
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
