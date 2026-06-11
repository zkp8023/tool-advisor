# Scoring Rules

Use a practical 5-point score for each candidate.

| Dimension | Weight | Meaning |
|-----------|--------|---------|
| Task fit | 35% | Solves the user's actual task with minimal workaround |
| Trust | 20% | Official, reputable, or already used by the user |
| Availability | 15% | Installed now, easy to install, or accessible through current tools |
| Cost | 10% | Setup effort, credentials, account linking, paid plans, runtime overhead |
| Risk | 20% | Security, privacy, supply-chain, permissions, or data exposure |

## Interpretation

- `4.5-5.0`：首选。直接推荐。
- `3.5-4.4`：可用备选。说明取舍。
- `2.5-3.4`：只在特定条件下考虑。
- `<2.5`：不推荐，除非用户明确要求探索。

## Tie Breakers

1. Prefer local or official capabilities over third-party tools.
2. Prefer tools requiring fewer credentials.
3. Prefer tools that keep user data local.
4. Prefer capabilities that integrate with Codex or the current workflow.
5. Prefer simple direct execution when no tool meaningfully improves the task.

## Red Flags

- Requires broad filesystem or account access unrelated to the task.
- Unmaintained repository with unresolved security issues.
- No license or unclear commercial terms.
- Requires uploading private data to an unknown service.
- Claims to support every model or every platform without documented adapters.
