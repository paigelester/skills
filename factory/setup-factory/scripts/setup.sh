#!/usr/bin/env bash
# Sets up a GitHub repo for the factory skills. Usage: setup.sh [--check] [owner/repo]
# --check reports what's missing and changes nothing. Without a repo, gh uses the
# repo of the current directory. Exit 0 = the repo is ready; 1 = something is missing.
set -euo pipefail
check=false
if [ "${1:-}" = "--check" ]; then check=true; shift; fi
repo_args=()
if [ $# -gt 0 ]; then repo_args=(--repo "$1"); fi
gh_repo() { gh "$@" ${repo_args[@]+"${repo_args[@]}"}; }

if ! gh auth status >/dev/null 2>&1; then echo "gh isn't signed in. Run: gh auth login"; exit 1; fi
if ! issues=$(gh repo view ${1:+"$1"} --json hasIssuesEnabled --jq .hasIssuesEnabled 2>/dev/null); then
  echo "Can't read the repo on GitHub. Pass owner/repo, or run from a clone of a GitHub repo."; exit 1
fi
if [ "$issues" != "true" ]; then echo "GitHub Issues is turned off for this repo. Turn it on in Settings > General > Features."; exit 1; fi

# name|colour|description
labels='factory:new|ededed|Just created
factory:refining|c5def5|Being refined
factory:refined|bfd4f2|Purpose, acceptance criteria, tests and risk set
factory:selected|bfdadc|Chosen to work on
factory:routing|d4c5f9|Plan made; picking agent or human
factory:ready|0e8a16|Approved to build
factory:in-progress|fbca04|Being built
factory:in-review|1d76db|PR open and under review
factory:merged|5319e7|On main
factory:closed|cccccc|Done
factory:reopened|e99695|Regression, back to refining
factory:agent-owned|006b75|An agent builds it
factory:human-owned|0052cc|A developer builds it
factory:blocked|b60205|Waiting on another ticket
factory:agent-awaiting-human|d93f0b|Agent needs a decision
factory:agent-blocked|b60205|Agent stopped: no access, secret or service
factory:wont-do|ffffff|Rejected, reason recorded
factory:agent-merged|5319e7|Merged automatically by an agent
factory:human-merged|5319e7|Merged by a person
factory:bug-reproduced|f9d0c4|Bug confirmed, evidence attached
factory:bug-not-reproduced|f9d0c4|Could not reproduce, more detail needed'

existing=$(gh_repo label list --limit 500 --json name,color,description --jq '.[] | "\(.name)|\(.color)|\(.description)"')
missing=0
while IFS='|' read -r name colour description; do
  if grep -qxiF "$name|$colour|$description" <<< "$existing"; then continue; fi
  if $check; then
    echo "missing or out of date: $name"; missing=$((missing + 1))
  else
    gh_repo label create "$name" --color "$colour" --description "$description" --force >/dev/null
    echo "set: $name"
  fi
done <<< "$labels"

if $check && [ "$missing" -gt 0 ]; then echo "$missing factory labels need setting up. Run without --check."; exit 1; fi
echo "Repo is ready for the factory."
