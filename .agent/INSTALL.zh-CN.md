# 安装 Tool Advisor

[English](INSTALL.md) | 简体中文

## 前置条件

- Node.js 18 或更新版本。
- 已安装 Git，且 Git 在 `PATH` 中可用。
- 可以访问 GitHub。
- 使用 Codex、Claude Code、OpenCode，或只使用 CLI。

## 选择目标

先识别当前 agent，然后只执行下面一个分支。

### Codex

运行：

```powershell
npx -y github:zkp8023/tool-advisor install --target codex
```

安装器会 clone 或更新 `tool-advisor`，配置选定知识库，并把本地 checkout 注册为
Codex 插件市场。安装后重启 Codex，然后在 Plugins 中启用或安装 `tool-advisor`。

### Claude Code

先在 Claude Code 内安装原生插件：

```text
/plugin marketplace add zkp8023/tool-advisor
/plugin install tool-advisor@tool-advisor
```

然后在希望 Claude Code 使用 Tool Advisor 的项目中配置知识库：

```powershell
npx -y github:zkp8023/tool-advisor install --target claude-code --write-instructions --project-dir .
```

原生插件由 Claude Code 插件市场解析。CLI 步骤会记录选定知识库，并向
`CLAUDE.md` 写入带标记的 Tool Advisor 规则块作为兜底。

### OpenCode

在希望 OpenCode 使用 Tool Advisor 的项目中运行：

```powershell
npx -y github:zkp8023/tool-advisor install --target opencode --write-instructions --project-dir .
```

这会记录选定知识库，并向 `AGENTS.md` 写入带标记的 Tool Advisor 规则块。

### 直接使用 CLI

只有不需要 agent 集成时才使用这个分支：

```powershell
npx -y github:zkp8023/tool-advisor install --target cli
```

## 知识库选择

如果没有显式传入知识库路径，安装器会先要求输入已有本地路径。用户留空时，才会询问是否 clone
`https://github.com/zkp8023/ai-knowledge-vault.git` 到 `~/.tool-advisor`。

非交互安装时需要显式指定其中一种：

```powershell
npx -y github:zkp8023/tool-advisor install --target <target> --vault-dir "D:\path\to\ai-knowledge-vault"
npx -y github:zkp8023/tool-advisor install --target <target> --clone-vault
```

Claude Code 或 OpenCode 需要保留对应的规则写入参数：

```powershell
npx -y github:zkp8023/tool-advisor install --target claude-code --write-instructions --project-dir . --vault-dir "D:\path\to\ai-knowledge-vault"
npx -y github:zkp8023/tool-advisor install --target opencode --write-instructions --project-dir . --clone-vault
```

选定的知识库路径会记录到 `<home>/.tool-advisor/config.json`。Tool Advisor 会优先搜索这份配置指向的 `AI Tools`，无论它是用户自己的本地路径，还是安装时 clone 的维护版 GitHub 知识库。

## 验证

询问 agent：

```text
Use Tool Advisor to recommend a browser automation tool.
```

也可以直接用 CLI 验证：

```powershell
npx -y github:zkp8023/tool-advisor --query "浏览器自动化"
```

## 更新

再次运行相同目标命令即可。已 clone 的 checkout 会通过 `git pull --ff-only` 更新，带标记的规则块会被原地替换。

Claude Code 原生插件可再次运行 `/plugin install tool-advisor@tool-advisor` 更新。

## 排错

- 如果 `npx` 不可用，安装 Node.js 18 或更新版本。
- 如果 `git` 不可用，安装 Git 后重新打开终端或 agent 会话。
- 如果 `codex plugin marketplace add` 失败，确认 agent 环境里可以调用 `codex` CLI。
- 如果项目里已经有规则文件，安装器会保留原内容，只管理带标记的 Tool Advisor 规则块。
