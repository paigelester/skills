// The words a run leaves behind: the prompt each agent gets, the PR body, and the summary printed at the end.
import { readKnowledge } from "./brain.mjs";

/** The prompt for one agent step: the step skill, the knowledge it loads, then this run's inputs. */
export function stepPrompt({ state, step, skill, contract, ticket, extra = "" }) {
  const parts = [
    `You are one step of a factory run. Do this step and nothing after it: a driver program runs the other steps, commits your work and opens the PR. Do not commit, push, change branches, or edit the ticket. Give your answer in the required structured shape when you are done.`,
    `# Step: ${step.id}\n\n${skill.instructions}`,
  ];
  const knowledge = readKnowledge(skill.step.knowledge ?? [], contract);
  if (knowledge) parts.push(`# Knowledge\n\nHow this work is done and judged. A later file overrules an earlier one, and the repo's own rules (its CLAUDE.md or AGENTS.md) overrule them all.\n\n${knowledge}`);

  const inputs = [
    `# Inputs`,
    `- Run: ${state.id}`,
    `- Branch: ${state.branch}`,
    `- Compare against: ${state.base} (the commit this work started from)`,
    `- Checks the driver runs after this step: ${(contract.commands?.verify ?? []).map((c) => `\`${c}\``).join(", ")}`,
    ``,
    `## Ticket #${ticket.number}: ${ticket.title}`,
    ``,
    ticket.body.trim() || "(the ticket has no body)",
  ];
  if (ticket.comments.length) {
    inputs.push(``, `### Comments`);
    for (const c of ticket.comments) inputs.push(``, `**${c.author}:**`, c.body.trim());
  }
  parts.push(inputs.join("\n"));
  if (extra) parts.push(extra);
  if (state.rework) parts.push(`# Rework\n\nAn earlier attempt did not pass the "${state.rework.from}" step. Fix exactly what is below, and keep every acceptance criterion met.\n\n${state.rework.detail}`);
  return parts.join("\n\n");
}

const checkLine = (r) => `- \`${r.command}\`: ${r.exit === 0 ? "passed" : `failed (exit ${r.exit})`} in ${r.seconds}s`;

function criteriaTable(criteria) {
  if (!criteria?.length) return "_No criteria were reported._";
  const cell = (s) => String(s ?? "").replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
  return ["| # | Criterion | Met by |", "|---|---|---|", ...criteria.map((c, i) => `| ${i + 1} | ${cell(c.criterion)} | ${cell(c.metBy)} |`)].join("\n");
}

export function findingLine(f) {
  return `- ${f.severity} · ${f.file}${f.line ? `:${f.line}` : ""} · ${f.problem} · ${f.fix}`;
}

/** The body of the PR an agent-owned run opens. */
export function prBody(state) {
  const should = (state.reviewed?.findings ?? []).filter((f) => f.severity === "should");
  return [
    `Closes #${state.ticket}`,
    ``,
    `## What changed`,
    ``,
    state.build?.summary ?? "",
    ``,
    `## Acceptance criteria`,
    ``,
    criteriaTable(state.build?.criteria),
    ``,
    `## Verification`,
    ``,
    ...(state.verified?.results ?? []).map(checkLine),
    ``,
    `## Review`,
    ``,
    `Reviews run: ${(state.reviewed?.reviews ?? []).join(", ") || "none"}. Result: 0 must, ${should.length} should.`,
    ...(should.length ? [``, ...should.map(findingLine)] : []),
    ``,
    `Factory run \`${state.id}\`.`,
    ``,
    `🤖 Generated with [Claude Code](https://claude.com/claude-code)`,
  ].join("\n");
}

/** What the driver prints when a run stops, whatever the reason. */
export function summary(state) {
  const lines = [`Run ${state.id}: ${state.status}`];
  const add = (...more) => lines.push(...more);
  if (state.status === "done") {
    if (state.pr) add(`PR: ${state.pr}`);
    else if (state.owner === "human-owned") add(`Branch ${state.branch} passed every gate. It is ready for your PR.`);
    if (state.build?.criteria?.length) add("", criteriaTable(state.build.criteria));
    if (state.verified) add("", "Verification:", ...state.verified.results.map(checkLine));
    const should = (state.reviewed?.findings ?? []).filter((f) => f.severity === "should");
    if (state.reviewed) add("", `Review (${state.reviewed.reviews.join(", ")}): 0 must, ${should.length} should`, ...should.map(findingLine));
  } else if (state.wait) {
    add(state.wait.reason);
    if (state.wait.detail) add("", state.wait.detail);
    if (state.status === "waiting-human") add("", "Run `factory next` when you have done it.");
    if (state.status === "waiting-you") add("", "Run `factory next` once it is answered or fixed.");
    if (state.status === "paused-quota") add("", "Run `factory next` after the usage window resets.");
  } else if (state.stopped) add(state.stopped);
  return lines.join("\n");
}
