#!/usr/bin/env node
// A stand-in for the `gh` CLI in tests. It keeps issues, labels and PRs in the JSON file named by FAKE_GH_STATE
// and understands only the calls the driver makes.
import { readFileSync, writeFileSync } from "node:fs";

const file = process.env.FAKE_GH_STATE;
const state = JSON.parse(readFileSync(file, "utf8"));
const args = process.argv.slice(2);
const save = () => writeFileSync(file, JSON.stringify(state, null, 2));
const flag = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const flagAll = (name) => args.flatMap((a, i) => (a === name ? [args[i + 1]] : []));
const [area, action, target] = args;

if (area === "issue" && action === "view") {
  const issue = state.issues[target];
  if (!issue) {
    console.error(`issue ${target} not found`);
    process.exit(1);
  }
  console.log(
    JSON.stringify({
      number: issue.number,
      title: issue.title,
      body: issue.body,
      state: issue.state ?? "OPEN",
      url: `https://example.test/issues/${issue.number}`,
      labels: issue.labels.map((name) => ({ name })),
      assignees: (issue.assignees ?? []).map((login) => ({ login })),
      comments: (issue.comments ?? []).map((body) => ({ author: { login: "paige" }, body })),
    }),
  );
} else if (area === "issue" && action === "edit") {
  const issue = state.issues[target];
  issue.labels = issue.labels.filter((l) => !flagAll("--remove-label").includes(l));
  for (const l of flagAll("--add-label")) if (!issue.labels.includes(l)) issue.labels.push(l);
  if (flag("--add-assignee")) issue.assignees = ["paige"];
  save();
} else if (area === "issue" && action === "comment") {
  (state.issues[target].comments ??= []).push(flag("--body"));
  save();
} else if (area === "repo" && action === "view") {
  console.log("paige");
} else if (area === "pr" && action === "list") {
  const pr = state.prs.find((p) => p.head === flag("--head"));
  if (pr) console.log(pr.url);
} else if (area === "pr" && action === "create") {
  const pr = { title: flag("--title"), body: readFileSync(flag("--body-file"), "utf8"), base: flag("--base"), head: flag("--head"), url: `https://example.test/pull/${state.prs.length + 1}` };
  state.prs.push(pr);
  save();
  console.log(pr.url);
} else if (area === "label" && action === "list") {
  console.log(JSON.stringify(state.labels));
} else if (area === "label" && action === "create") {
  state.labels = state.labels.filter((l) => l.name !== target);
  state.labels.push({ name: target, color: flag("--color"), description: flag("--description") });
  save();
} else if (area === "label" && action === "delete") {
  state.labels = state.labels.filter((l) => l.name !== target);
  save();
} else {
  console.error(`fake gh: unsupported call: ${args.join(" ")}`);
  process.exit(1);
}
