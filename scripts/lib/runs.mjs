// Runs on disk. Each run has three things in the runs folder:
//   <id>.jsonl  the run log: one JSON event per line, appended as things happen (what Botalot watches)
//   <id>.json   the run's state: where it is, so `factory next` can carry on
//   <id>/       its files: the ticket, each agent's prompt and answer, each check's output
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { factoryHome, runsDir } from "./paths.mjs";

/** Statuses a run can rest in. Only `running` has a live process. */
export const OPEN_STATUSES = ["running", "waiting-human", "waiting-you", "paused-quota"];

export function newRunId(repo, ticket, now = new Date()) {
  const stamp = now.toISOString().replace(/[-:]/g, "").replace("T", "-").slice(0, 15);
  return `${basename(repo)}-${ticket}-${stamp}`;
}

export const statePath = (id) => join(runsDir(), `${id}.json`);
export const logPath = (id) => join(runsDir(), `${id}.jsonl`);

export function runDir(id) {
  const dir = join(runsDir(), id);
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function saveState(state) {
  mkdirSync(runsDir(), { recursive: true });
  state.updatedAt = new Date().toISOString();
  writeFileSync(statePath(state.id), JSON.stringify(state, null, 2));
}

export function loadState(id) {
  if (!existsSync(statePath(id))) throw new Error(`There is no run "${id}".`);
  return JSON.parse(readFileSync(statePath(id), "utf8"));
}

export function allStates() {
  if (!existsSync(runsDir())) return [];
  return readdirSync(runsDir())
    .filter((n) => n.endsWith(".json"))
    .map((n) => JSON.parse(readFileSync(join(runsDir(), n), "utf8")))
    .sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1));
}

/** Append one event to the run log. Every event carries the run, repo, ticket and workflow, so a line stands alone. */
export function logEvent(state, event, fields = {}) {
  mkdirSync(runsDir(), { recursive: true });
  const line = { ts: new Date().toISOString(), run: state.id, repo: state.repoName, ticket: state.ticket, workflow: state.workflow, event, ...fields };
  appendFileSync(logPath(state.id), JSON.stringify(line) + "\n");
}

/** Whether the process that owns a running run is still alive. A run whose process died is not really running. */
export function isAlive(state) {
  if (state.status !== "running" || !state.pid) return false;
  try {
    process.kill(state.pid, 0);
    return true;
  } catch {
    return false;
  }
}

/** The latest subscription usage reading, written whenever an agent step reports one. Null when none is live. */
export function readQuota(now = Date.now()) {
  const path = join(factoryHome(), "quota.json");
  if (!existsSync(path)) return null;
  try {
    const quota = JSON.parse(readFileSync(path, "utf8"));
    const fiveHour = quota.fiveHour;
    if (!fiveHour || fiveHour.resetsAt * 1000 <= now) return null;
    return quota;
  } catch {
    return null;
  }
}

export function writeQuota(quota) {
  mkdirSync(factoryHome(), { recursive: true });
  writeFileSync(join(factoryHome(), "quota.json"), JSON.stringify({ ...quota, readAt: new Date().toISOString() }, null, 2));
}
