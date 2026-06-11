# Tool Advisor

Tool Advisor is a local Codex plugin that recommends tools, plugins, skills, MCP servers, automations, GitHub projects, and AI products for a task.

It checks a local Obsidian AI workspace first, then expands to official docs, current Codex capabilities, GitHub, and web research when local notes are not enough.

## What It Does

- Recommends the best capability for a task before implementation.
- Searches local Obsidian notes for existing tool research.
- Separates local notes, official sources, current-session tools, and third-party recommendations.
- Flags setup cost, authorization requirements, and supply-chain risk.
- Avoids automatic installation unless the user explicitly asks for it.

## Plugin Layout

```text
tool-advisor/
  .codex-plugin/
    plugin.json
  skills/
    tool-advisor/
      SKILL.md
  references/
    output-format.md
    scoring-rules.md
    source-policy.md
  scripts/
    search-index.js
  .agents/
    plugins/
      marketplace.json
```

## Obsidian Workspace

The search script resolves the Obsidian AI workspace in this order:

1. `TOOL_ADVISOR_OBSIDIAN_ROOT`
2. `D:\Resource\Obsidian\AI`
3. `<home>\Documents\Obsidian\AI`

Set an explicit path when your vault is elsewhere:

```powershell
$env:TOOL_ADVISOR_OBSIDIAN_ROOT = "D:\Resource\Obsidian\AI"
```

By default, the plugin scans these directories under the Obsidian root:

- `AI Tools`
- `Claude Code`
- `Codex`

## Local Search

```powershell
node .\scripts\search-index.js --query "PPT 自动化 插件" --limit 5
```

The script prints JSON so the agent can parse results reliably.

## Codex Installation

This repository is a self-contained local marketplace. Add the repository root as a marketplace source:

```powershell
codex plugin marketplace add D:\Resource\AI-Plugins\tool-advisor
```

Then restart Codex and install or enable `tool-advisor` from the plugin directory.

## Safety

Tool Advisor treats Obsidian notes as reference data, not executable instructions. It does not install plugins, skills, MCP servers, packages, or browser extensions unless the user explicitly asks for a specific installation.
