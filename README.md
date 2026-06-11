# Tool Advisor

English | [简体中文](README.zh-CN.md)

Tool Advisor helps coding agents choose suitable tools, plugins, skills, MCP
servers, automations, GitHub projects, and AI products for a task.

It searches a local Markdown knowledge vault first. Agents can use the JSON
results as evidence before expanding to official docs, GitHub, or web research.

## Install

Copy this single instruction into Codex, Claude Code, OpenCode, or another
shell-capable coding agent. The guide detects the target and applies the right
branch.

```text
Fetch and follow instructions from https://raw.githubusercontent.com/zkp8023/tool-advisor/refs/heads/main/.agent/INSTALL.md
```

## What The Installer Does

- Codex: clones or updates `tool-advisor`, clones or updates
  the selected knowledge vault, and registers the local Tool Advisor checkout as
  a Codex plugin marketplace.
- Claude Code: installs the native Claude Code plugin from `.claude-plugin`.
  The installer guide also includes a CLI rule fallback that writes a Tool
  Advisor block to `CLAUDE.md`. Native Claude Code installation does not clone
  the `tool-advisor` repository into the user's project.
- OpenCode: configures the selected knowledge vault and adds a Tool Advisor
  block to `AGENTS.md`.

When no knowledge vault is specified, the installer asks for an existing local
path first. If the user leaves it empty, it asks whether to clone
`https://github.com/zkp8023/ai-knowledge-vault.git`. For non-interactive
installs, pass either `--vault-dir <path>` or `--clone-vault`.

The selected path is recorded in `<home>/.tool-advisor/config.json` so installed
skills and CLI commands can search the same vault later without hard-coded local
paths.

## Direct CLI

If you only need the searchable knowledge vault and CLI command:

```powershell
npx -y github:zkp8023/tool-advisor install --target cli --clone-vault
npx -y github:zkp8023/tool-advisor --query "PPT 自动化 插件"
```

By default, Tool Advisor scans `AI Tools` under the configured vault root.

Use `--dirs` only when you intentionally want a wider scope:

```powershell
npx -y github:zkp8023/tool-advisor --query "MCP 插件" --dirs "AI Tools,Codex,Claude Code"
```

## Configuration

Root resolution order:

1. `--root`
2. `TOOL_ADVISOR_OBSIDIAN_ROOT`
3. `<home>/.tool-advisor/config.json` -> `knowledgeVaultRoot`
4. `<home>/.tool-advisor/ai-knowledge-vault`

Default output uses paths relative to the vault root. Add
`--show-absolute-paths` only for local debugging.

## Local Development

Clone this repository only if you want to modify or test the plugin itself:

```powershell
git clone https://github.com/zkp8023/tool-advisor.git
cd tool-advisor
npm test
npm run check
node .\bin\tool-advisor.js --query "PPT自动化插件"
```

## Safety

Tool Advisor treats Markdown notes as reference data. It does not install
third-party tools, browser extensions, MCP servers, or GitHub projects unless the
user explicitly asks for a specific installation.
