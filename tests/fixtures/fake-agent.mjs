#!/usr/bin/env node
// A stand-in for headless Claude Code in tests. FAKE_AGENT_SCRIPT names a JSON file:
//   { "build": [ { "write": {"a.txt": "x"}, "remove": ["b.txt"], "output": {...} }, ... ], "review": [ ... ] }
// Each call takes the next entry for its step (the last word of --name) and prints the same kind of
// stream a real session prints: an init line, tool uses, the structured answer, a usage reading, a result.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const file = process.env.FAKE_AGENT_SCRIPT;
const script = JSON.parse(readFileSync(file, "utf8"));
const args = process.argv.slice(2);
const step = args[args.indexOf("--name") + 1].split(" ").pop();
const emit = (event) => console.log(JSON.stringify(event));

let prompt = "";
process.stdin.on("data", (d) => (prompt += d));
process.stdin.on("end", () => {
  const turn = (script[step] ?? []).shift();
  (script.prompts ??= []).push({ step, prompt, settings: JSON.parse(readFileSync(args[args.indexOf("--settings") + 1], "utf8")) });
  writeFileSync(file, JSON.stringify(script, null, 2));
  const session = `fake-${step}-${script.prompts.length}`;
  emit({ type: "system", subtype: "init", session_id: session });
  if (!turn) {
    emit({ type: "result", is_error: true, result: `fake agent has no turn left for "${step}"`, session_id: session });
    process.exit(1);
  }
  if (turn.crash) process.exit(3);
  const content = [];
  for (const [path, text] of Object.entries(turn.write ?? {})) {
    mkdirSync(dirname(path) || ".", { recursive: true });
    writeFileSync(path, text);
    content.push({ type: "tool_use", name: "Edit", input: { file_path: path } });
  }
  for (const path of turn.remove ?? []) {
    rmSync(path, { force: true });
    content.push({ type: "tool_use", name: "Bash", input: { command: `rm ${path}` } });
  }
  content.push({ type: "tool_use", name: "StructuredOutput", input: turn.output });
  emit({ type: "assistant", message: { model: "fake-model", content }, session_id: session });
  if (turn.quota !== undefined) {
    emit({ type: "rate_limit_event", rate_limit_info: { unifiedWindows: { five_hour: { utilization: turn.quota, resetsAt: Math.floor(Date.now() / 1000) + 3600 } } } });
  }
  emit({ type: "result", is_error: false, total_cost_usd: 0.01, num_turns: 2, usage: { input_tokens: 100, output_tokens: 20 }, session_id: session });
});
