// Git, as the driver uses it. All paths are the repo's top level.
import { rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { must, run } from "./exec.mjs";

export const git = (repo, ...args) => must("git", args, { cwd: repo });
export const tryGit = (repo, ...args) => run("git", args, { cwd: repo });

export function topLevel(cwd) {
  const result = run("git", ["rev-parse", "--show-toplevel"], { cwd });
  if (result.code !== 0) throw new Error(`${cwd} is not inside a git repository.`);
  return result.stdout.trim();
}

export const currentBranch = (repo) => git(repo, "rev-parse", "--abbrev-ref", "HEAD");
export const head = (repo) => git(repo, "rev-parse", "HEAD");
export const isClean = (repo) => git(repo, "status", "--porcelain") === "";

/** The branch work starts from: the contract's, else what origin calls its default, else main. */
export function defaultBranch(repo, contract) {
  if (contract?.defaultBranch) return contract.defaultBranch;
  const ref = tryGit(repo, "symbolic-ref", "--short", "refs/remotes/origin/HEAD");
  if (ref.code === 0) return ref.stdout.trim().replace(/^origin\//, "");
  return "main";
}

/** The newest copy of the default branch git knows: origin's when there is one, else the local branch. */
export function defaultRef(repo, contract) {
  const branch = defaultBranch(repo, contract);
  return tryGit(repo, "rev-parse", "--verify", "--quiet", `origin/${branch}`).code === 0 ? `origin/${branch}` : branch;
}

/**
 * Git's id for the files as they are on disk right now, committed or not (ignored files left out).
 * A verify pass is stamped with this, so any later edit makes the pass stop matching. A commit of the
 * same files has this same tree id, which is why squashing keeps a pass valid.
 */
export function worktreeTree(repo) {
  const index = join(tmpdir(), `factory-index-${process.pid}-${Date.now()}`);
  const env = { GIT_INDEX_FILE: index };
  try {
    must("git", ["read-tree", "HEAD"], { cwd: repo, env });
    must("git", ["add", "-A"], { cwd: repo, env });
    return must("git", ["write-tree"], { cwd: repo, env });
  } finally {
    rmSync(index, { force: true });
    rmSync(`${index}.lock`, { force: true });
  }
}

export const headTree = (repo) => git(repo, "rev-parse", "HEAD^{tree}");

/** Every file that differs from `base`: committed, uncommitted and untracked. */
export function changedFiles(repo, base) {
  const tracked = git(repo, "diff", "--name-only", base).split("\n");
  const untracked = git(repo, "ls-files", "--others", "--exclude-standard").split("\n");
  return [...new Set([...tracked, ...untracked].filter(Boolean))].sort();
}

/**
 * Save everything on disk as a work-in-progress commit. Hooks are skipped on purpose: these commits only
 * keep work safe between steps and are squashed into one commit, which does run the hooks, before any PR.
 * Returns false when there was nothing to save.
 */
export function saveWork(repo, message) {
  if (isClean(repo)) return false;
  git(repo, "add", "-A");
  git(repo, "commit", "--no-verify", "-m", message);
  return true;
}
