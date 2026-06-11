# Tool Advisor

[English](README.md) | 简体中文

Tool Advisor 帮助编码 agent 为任务选择合适的工具、插件、skill、MCP
server、自动化、GitHub 项目和 AI 产品。

它会先搜索本地 Markdown 知识库。agent 可以把 JSON 结果作为证据，再按需扩展到官方文档、GitHub 或网页研究。

## 安装

把这一条指令复制到 Codex、Claude Code、OpenCode 或其它能运行 shell 的编码
agent 中。统一安装说明会识别目标并执行对应分支。

```text
Fetch and follow instructions from https://raw.githubusercontent.com/zkp8023/tool-advisor/main/.agent/INSTALL.md
```

## 安装器会做什么

- Codex：把 `tool-advisor` clone 或更新到标准本地 Codex marketplace 下，配置选定知识库，注册该 marketplace，并安装 `tool-advisor@tool-advisor-local`。
- Claude Code：通过 `.claude-plugin` 安装 Claude Code 原生插件。安装说明里也保留 CLI 规则兜底方案，可向 `CLAUDE.md` 写入 Tool Advisor 规则块。Claude Code 原生安装不会把 `tool-advisor` 仓库 clone 到用户项目里。
- OpenCode：配置选定知识库，并向 `AGENTS.md` 添加 Tool Advisor 规则块。

如果没有指定知识库，安装器会先要求输入已有本地路径。用户留空时，才会询问是否 clone
`https://github.com/zkp8023/ai-knowledge-vault.git`。非交互安装需要显式传入 `--vault-dir <path>` 或 `--clone-vault`。

安装器会把选定路径记录到 `<home>/.tool-advisor/config.json`，这样后续 skill 和 CLI 可以继续搜索同一个知识库，而不是依赖硬编码的本机路径。

## 直接使用 CLI

如果你只需要可搜索的知识库和 CLI 命令：

```powershell
npx -y github:zkp8023/tool-advisor install --target cli --clone-vault
npx -y github:zkp8023/tool-advisor --query "PPT 自动化 插件"
```

默认情况下，Tool Advisor 会扫描配置知识库根目录下的 `AI Tools`。

只有在明确想扩大范围时才使用 `--dirs`：

```powershell
npx -y github:zkp8023/tool-advisor --query "MCP 插件" --dirs "AI Tools,Codex,Claude Code"
```

## 配置

知识库根目录解析顺序：

1. `--root`
2. `TOOL_ADVISOR_OBSIDIAN_ROOT`
3. `<home>/.tool-advisor/config.json` -> `knowledgeVaultRoot`
4. `<home>/.tool-advisor/ai-knowledge-vault`

默认输出使用相对于知识库根目录的路径。只有本地调试时才建议添加 `--show-absolute-paths`。

## 本地开发

只有当你想修改或测试插件本身时，才需要 clone 当前仓库：

```powershell
git clone https://github.com/zkp8023/tool-advisor.git
cd tool-advisor
npm test
npm run check
node .\bin\tool-advisor.js --query "PPT自动化插件"
```

## 安全说明

Tool Advisor 把 Markdown 笔记视为参考数据。除非用户明确要求安装某个具体项目，否则它不会安装第三方工具、浏览器扩展、MCP server 或 GitHub 项目。
