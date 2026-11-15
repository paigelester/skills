# Review categories

The pre-filter `merge-pr` runs before risk. Each changed file gets one category; the PR takes the strictest one any file has (**always** beats **risk** beats **no**). A file that fits no row is **always**.

A repo overrides this whole list with its own `.factory/review-categories.md` in the same format. Copy this file there and edit it; rows aren't merged.

**Paths** are globs matched against the changed file's path. **Or when** is the part an agent judges from the diff, for changes paths can't catch. A file matches a row when either column matches. Check rows top to bottom and stop at the first match.

| Category | Paths | Or when | Human review |
|---|---|---|---|
| Agent instructions | `**/SKILL.md`, `**/skills/**`, `AGENTS.md`, `CLAUDE.md`, `**/AGENTS.md`, `**/CLAUDE.md`, `.claude/**`, `.agents/**`, `hooks/**`, `**/prompts/**`, `skills-lock.json` | The change edits text an agent reads as instructions (a prompt string, a system message, an agent's config) | always |
| Factory rules | `.factory/**`, `**/factory-labels/scripts/**` | The change edits how the factory decides, labels or merges | always |
| CI and release | `.github/**`, `electron-builder.yml`, `**/release*`, `**/*.entitlements*` | The change edits build, signing, deploy or release steps | always |
| Security and access | `**/auth/**`, `**/*secret*`, `**/*permission*`, `**/*policy*`, `.env*` | The change touches login, tokens, permissions, secrets handling or input from outside the app | always |
| Data | `**/migrations/**`, `**/*schema*` | The change alters stored data's shape, or deletes or rewrites what users saved | always |
| Legal and store | `LICENSE*`, `**/PRIVACY*`, `**/privacy*`, `**/store-listing/**`, `**/fastlane/**` | The change edits licences, credits, privacy or data-safety text, or store copy | always |
| Dependencies | `package.json`, `package-lock.json`, `**/package.json`, `**/*.lock`, `**/requirements*.txt`, `**/go.mod`, `**/Cargo.toml` | A dependency is added, removed or moved a version | always |
| Public API | | The change alters something other code or users call: an exported interface, a CLI flag, an endpoint, a file format | always |
| UI and wording | `**/renderer/**`, `**/*.css`, `**/*.html` | The change alters what users see or read | risk |
| Tests only | `**/*.test.*`, `**/*.spec.*`, `**/__tests__/**`, `**/test/**`, `**/tests/**` | | risk |
| Trivial | | The change is only typos, comments, formatting or docs wording, with no change to behaviour or meaning | no |
| Docs | `**/*.md`, `docs/**` | The change edits what docs say, beyond wording | risk |
| Code | `src/**`, `lib/**`, `scripts/**` | Any other change to how the app behaves | risk |
