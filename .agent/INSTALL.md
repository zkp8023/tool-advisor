# Installing Tool Advisor

English | [简体中文](INSTALL.zh-CN.md)

## Prerequisites

- Node.js 18 or newer.
- Git installed and available on `PATH`.
- Network access to GitHub.
- One supported target: Codex, Claude Code, OpenCode, or direct CLI usage.

## Choose The Target

Identify the current agent, then follow exactly one branch below.

### Codex

Run:

```powershell
npx -y github:zkp8023/tool-advisor install --target codex
```

The installer clones or updates `tool-advisor` under a standard local Codex
marketplace, configures the selected knowledge vault, registers that marketplace,
and installs `tool-advisor@tool-advisor-local`. Restart Codex or start a new
thread after installation so the plugin is picked up.

### Claude Code

First install the native Claude Code plugin inside Claude Code:

```text
/plugin marketplace add zkp8023/tool-advisor
/plugin install tool-advisor@tool-advisor
```

Then configure the knowledge vault from the project where Claude Code should use
Tool Advisor:

```powershell
npx -y github:zkp8023/tool-advisor install --target claude-code --write-instructions --project-dir .
```

The native plugin is resolved through Claude Code's plugin marketplace. The CLI
step records the selected knowledge vault and writes a marked Tool Advisor block
to `CLAUDE.md` as a fallback rule.

### OpenCode

From the project where OpenCode should use Tool Advisor, run:

```powershell
npx -y github:zkp8023/tool-advisor install --target opencode --write-instructions --project-dir .
```

This records the selected knowledge vault and writes a marked Tool Advisor block
to `AGENTS.md`.

### Direct CLI

Use this branch only when no agent integration is needed:

```powershell
npx -y github:zkp8023/tool-advisor install --target cli
```

## Knowledge Vault Selection

If no knowledge vault path is provided, the installer first asks for an existing
local path. If the user leaves it empty, it asks whether to clone
`https://github.com/zkp8023/ai-knowledge-vault.git` under `~/.tool-advisor`.

For non-interactive installs, pass one explicit option:

```powershell
npx -y github:zkp8023/tool-advisor install --target <target> --vault-dir "D:\path\to\ai-knowledge-vault"
npx -y github:zkp8023/tool-advisor install --target <target> --clone-vault
```

For Claude Code or OpenCode, keep their instruction flags:

```powershell
npx -y github:zkp8023/tool-advisor install --target claude-code --write-instructions --project-dir . --vault-dir "D:\path\to\ai-knowledge-vault"
npx -y github:zkp8023/tool-advisor install --target opencode --write-instructions --project-dir . --clone-vault
```

The selected vault path is recorded in `<home>/.tool-advisor/config.json`. Tool
Advisor searches that vault's `AI Tools` directory first, whether it is the
user's own local path or the maintained GitHub vault cloned during setup.

## Verify

Ask the agent:

```text
Use Tool Advisor to recommend a browser automation tool.
```

For direct CLI verification, run:

```powershell
npx -y github:zkp8023/tool-advisor --query "浏览器自动化"
```

## Updating

Run the same target command again. Existing cloned checkouts are updated with
`git pull --ff-only`, Codex reinstalls `tool-advisor@tool-advisor-local`, and
marked instruction blocks are replaced in place.

For Claude Code, run `/plugin install tool-advisor@tool-advisor` again to update
the native plugin.

## Troubleshooting

- If `npx` is unavailable, install Node.js 18 or newer.
- If `git` is unavailable, install Git and reopen the terminal or agent session.
- If `codex plugin marketplace add` fails, make sure the `codex` CLI is available to the agent.
- If an instruction file already exists, the installer keeps existing content and only manages the marked Tool Advisor block.
