#!/usr/bin/env bash
# Creates or updates every factory:* label in a GitHub repo. Usage: create-labels.sh [owner/repo]
# Without a repo, gh uses the repo of the current directory. Exit 0 = every label exists.
set -euo pipefail
repo_args=()
if [ $# -gt 0 ]; then repo_args=(--repo "$1"); fi

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

count=0
while IFS='|' read -r name colour description; do
  gh label create "$name" --color "$colour" --description "$description" --force ${repo_args[@]+"${repo_args[@]}"} >/dev/null
  count=$((count + 1))
done <<< "$labels"
echo "$count factory labels in place."
