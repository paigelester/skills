# skills

Reusable agent skills for software projects, grouped into families (`<family>/<skill-name>/SKILL.md`).

## Install into a project

Skills install with the [`skills` CLI](https://github.com/vercel-labs/skills) (Node.js 22.20+). Run it from the root of the project that should use them.

Pick skills interactively. Skills are grouped by family, and selecting a family selects every skill in it:

```bash
npx skills add paigelester/skills
```

Install everything without prompts, for every agent the CLI supports:

```bash
npx skills add paigelester/skills --all
```

Other useful forms:

```bash
# See what's available, grouped by family
npx skills add paigelester/skills --list

# Specific skills, specific agents, no prompts
npx skills add paigelester/skills --skill using-skills -a claude-code -a cursor -y

# Everything, but only for some agents
npx skills add paigelester/skills --skill '*' -a claude-code -a github-copilot -a cursor -a codex -y

# Install for your user instead of the project
npx skills add paigelester/skills -g
```

Keep installed skills current with `npx skills check` and `npx skills update`.

Always install `using-skills` (the `meta` family). It tells the agent how to find and apply the others.

### Supported agents

Claude Code (`.claude/skills/`), GitHub Copilot, Cursor and Codex (`.agents/skills/`) all work, along with the [other agents the CLI supports](https://github.com/vercel-labs/skills/blob/main/docs/agents.md), including Gemini CLI, OpenCode, Cline, Windsurf, Roo Code, Kiro, Amp and Goose.

### Claude Code plugin marketplace

The same manifest makes this repo a Claude Code plugin marketplace, with one plugin per family:

```
/plugin marketplace add paigelester/skills
/plugin install meta@paigelester-skills
```

## Adding a skill

1. Create `<family>/<skill-name>/SKILL.md`. The frontmatter `name` must match the folder name and be unique across all families.
2. Add the skill's path to its family's plugin in `.claude-plugin/marketplace.json`, creating the family's plugin entry if it's new.
3. Add the skill's question to the index in `meta/using-skills/SKILL.md`.
4. Run `node scripts/check-manifest.mjs`. CI runs the same check on every pull request.
