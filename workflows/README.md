# Workflows

A workflow is a JSON file the driver (`scripts/factory.mjs`) runs one step at a time. It owns the order, the gates and the loop limits. Step skills and scripts know nothing about what comes next.

```json
{
  "name": "implement",
  "needs": ["commands.verify"],
  "steps": [{ "id": "verify", "script": "verify", "onFail": "build", "maxLoops": 5 }]
}
```

| Field | Means |
|---|---|
| `needs` | Dot paths that must be filled in the repo's `.factory/contract.json`, or the workflow refuses to start |
| `steps[].id` | The step's name in the run log |
| `steps[].script` | A script step: plain code in `scripts/lib/driver.mjs`, no agent |
| `steps[].skill` | A skill step: `skills/<name>/` run as a fresh agent |
| `steps[].then` | A script that runs on the agent's answer, straight after a skill step |
| `steps[].human` | The owner label for which a person does this step instead (`human-owned`) |
| `steps[].only` | The owner label this step is for; skipped otherwise |
| `steps[].onFail` | The step to go back to when this one fails |
| `steps[].maxLoops` | How many times this step may fail before the run stops and asks |

## Workflows

- `implement`: claim → build → verify → review → squash → PR → hand-off.
