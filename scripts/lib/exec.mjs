// Running other programs. Every outside command goes through here so tests can swap `gh` and the agent for fakes.
import { spawn, spawnSync } from "node:child_process";

/**
 * The command line for an outside tool. `FACTORY_GH_CMD` and `FACTORY_AGENT_CMD` hold a JSON array
 * (for example ["node", "tests/fixtures/fake-gh.mjs"]) that replaces the real program in tests.
 */
export function toolCommand(envName, fallback) {
  const override = process.env[envName];
  return override ? JSON.parse(override) : [fallback];
}

/** Run a program to completion and capture its output. Never throws on a non-zero exit. */
export function run(command, args, { cwd, env, input } = {}) {
  const [program, ...first] = Array.isArray(command) ? command : [command];
  const result = spawnSync(program, [...first, ...args], {
    cwd,
    env: env ? { ...process.env, ...env } : process.env,
    input,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    windowsHide: true,
  });
  if (result.error) return { code: 1, stdout: "", stderr: String(result.error.message) };
  return { code: result.status ?? 1, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
}

/** Run a program and throw with its output when it fails. Returns trimmed stdout. */
export function must(command, args, options) {
  const result = run(command, args, options);
  if (result.code !== 0) {
    const name = (Array.isArray(command) ? command : [command]).concat(args).join(" ");
    throw new Error(`${name} failed (exit ${result.code}): ${(result.stderr || result.stdout).trim()}`);
  }
  return result.stdout.trim();
}

/** Run one line through the shell, as a person would type it, with both output streams captured together. */
export function runShell(line, { cwd, env, timeoutMs } = {}) {
  return new Promise((resolve) => {
    const started = Date.now();
    const child = spawn(line, { cwd, env: env ? { ...process.env, ...env } : process.env, shell: true, windowsHide: true });
    let output = "";
    let timedOut = false;
    child.stdout.on("data", (d) => (output += d));
    child.stderr.on("data", (d) => (output += d));
    const timer = timeoutMs
      ? setTimeout(() => {
          timedOut = true;
          child.kill();
        }, timeoutMs)
      : null;
    const finish = (code) => {
      if (timer) clearTimeout(timer);
      resolve({ code: timedOut ? 124 : (code ?? 1), output, seconds: Math.round((Date.now() - started) / 1000), timedOut });
    };
    child.on("error", (err) => {
      output += String(err.message);
      finish(1);
    });
    child.on("close", finish);
  });
}
