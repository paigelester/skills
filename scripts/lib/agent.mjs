// One agent step: a fresh headless Claude Code session that gets a prompt and must answer in a set shape.
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import { toolCommand } from "./exec.mjs";

/**
 * Run the agent and collect what the run log needs. Resolves with:
 *   ok, output (the structured answer), session, seconds, cost, tokens, model, tools ({name: count}),
 *   skills (names it invoked), quota (latest usage reading, if the session reported one), error
 * `permissions` is { edits, tools, bash }: whether file edits are accepted, the tools allowed without asking,
 * and the shell command patterns allowed without asking. Anything else is denied, since nobody is there to ask.
 */
export function runAgent({ cwd, prompt, schema, permissions, settingsPath, name, runId, timeoutMs, model, mcp = false }) {
  // Permissions go in a settings file rather than on the command line, so patterns with spaces survive any shell.
  writeFileSync(settingsPath, JSON.stringify({ permissions: agentPermissions(permissions) }, null, 2));
  const args = [
    "-p",
    "--output-format", "stream-json",
    "--verbose",
    "--permission-prompts", "none",
    "--settings", settingsPath,
    "--json-schema", JSON.stringify(schema),
    "--name", name,
  ];
  // A step doesn't load the machine's MCP servers unless the repo's contract asks: they add tens of thousands
  // of tokens to every step, and most repos' work never touches them.
  if (!mcp) args.push("--strict-mcp-config");
  if (model) args.push("--model", model);

  const [program, ...first] = toolCommand("FACTORY_AGENT_CMD", "claude");
  const started = Date.now();
  const seen = { session: null, output: null, tools: {}, skills: [], quota: null, result: null, model: null };

  return new Promise((resolve) => {
    const child = spawn(program, [...first, ...args], { cwd, env: { ...process.env, FACTORY_RUN: runId }, windowsHide: true });
    let buffer = "";
    let stderr = "";
    let timedOut = false;
    const timer = timeoutMs ? setTimeout(() => ((timedOut = true), child.kill()), timeoutMs) : null;

    child.stdout.on("data", (chunk) => {
      buffer += chunk;
      let newline;
      while ((newline = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, newline).trim();
        buffer = buffer.slice(newline + 1);
        if (line) readEvent(line, seen);
      }
    });
    child.stderr.on("data", (d) => (stderr += d));
    child.stdin.on("error", () => {});
    child.stdin.end(prompt);

    const finish = (code, spawnError) => {
      if (timer) clearTimeout(timer);
      if (buffer.trim()) readEvent(buffer.trim(), seen);
      const result = seen.result ?? {};
      const output = seen.output ?? result.structured_output ?? null;
      let error = null;
      if (spawnError) error = `Could not start the agent: ${spawnError}`;
      else if (timedOut) error = "The agent ran out of time and was stopped.";
      else if (result.is_error) error = `The agent ended with an error: ${String(result.result ?? result.subtype ?? "unknown").slice(0, 500)}`;
      else if (code !== 0) error = `The agent exited with code ${code}. ${stderr.trim().slice(-500)}`;
      else if (!output) error = "The agent finished without giving its answer in the required shape.";
      const usage = result.usage ?? {};
      resolve({
        ok: !error,
        error,
        timedOut,
        output,
        session: seen.session,
        seconds: Math.round((Date.now() - started) / 1000),
        cost: result.total_cost_usd ?? null,
        tokens: { input: (usage.input_tokens ?? 0) + (usage.cache_creation_input_tokens ?? 0) + (usage.cache_read_input_tokens ?? 0), output: usage.output_tokens ?? 0 },
        turns: result.num_turns ?? null,
        model: seen.model,
        tools: seen.tools,
        skills: [...new Set(seen.skills)],
        quota: seen.quota,
      });
    };
    child.on("error", (err) => finish(1, err.message));
    child.on("close", (code) => finish(code));
  });
}

/** Claude Code permission settings for a step: what runs without asking, and what is refused outright. */
export function agentPermissions({ edits, tools, bash }) {
  return {
    defaultMode: edits ? "acceptEdits" : "default",
    allow: [...tools, ...bash.map((c) => `Bash(${c})`)],
    deny: edits ? [] : ["Edit", "Write", "NotebookEdit"],
  };
}

/** Fold one line of the session's stream into what we've seen so far. Lines that aren't JSON are ignored. */
function readEvent(line, seen) {
  let event;
  try {
    event = JSON.parse(line);
  } catch {
    return;
  }
  if (event.session_id) seen.session = event.session_id;
  if (event.type === "assistant") {
    if (event.message?.model) seen.model = event.message.model;
    for (const block of event.message?.content ?? []) {
      if (block.type !== "tool_use") continue;
      if (block.name === "StructuredOutput") {
        seen.output = block.input;
        continue;
      }
      seen.tools[block.name] = (seen.tools[block.name] ?? 0) + 1;
      if (block.name === "Skill" && block.input?.skill) seen.skills.push(block.input.skill);
    }
  } else if (event.type === "rate_limit_event") {
    const windows = event.rate_limit_info?.unifiedWindows ?? {};
    const quota = {};
    if (windows.five_hour) quota.fiveHour = { usedPercent: Math.round(windows.five_hour.utilization * 100), resetsAt: windows.five_hour.resetsAt };
    if (windows.seven_day) quota.sevenDay = { usedPercent: Math.round(windows.seven_day.utilization * 100), resetsAt: windows.seven_day.resetsAt };
    if (quota.fiveHour || quota.sevenDay) seen.quota = quota;
  } else if (event.type === "result" || "total_cost_usd" in event) {
    seen.result = event;
  }
}
