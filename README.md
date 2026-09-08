# opencode harness 配置仓库

存放我的 [opencode](https://opencode.ai) harness 配置：agents、skills、tools 以及全局配置文件，
目录结构与 `~/.config/opencode/` 一致（本仓库根目录即对应 `~/.config/opencode/`）。

## 目录结构

```
.
├── opencode.jsonc        # 全局配置（LSP / formatter / agent / mcp 等）
├── default_plus.txt      # 覆盖 plan / build agent 的基础提示词
├── agents/               # 自定义 agent 定义（director / actor / brainstorm 等）
├── skills/               # 技能库（见下表）
└── tools/                # 自定义工具（TypeScript，opencode plugin tool 格式）
```

## Skills

| Skill | 说明 |
|---|---|
| `adapt-drv` | 驱动适配与移植相关的工作流 |
| `c-style` | C 语言编码风格与规范 |
| `vscode-ref` | 通过 MCP 驱动 VS Code 的 API 与命令参考 |
| `wsl-interop` | WSL 调用 Windows 侧 exe 的回退链与修复模式 |

## Tools

自定义工具会被 opencode 自动加载，运行前需准备好对应环境变量：

| Tool | 依赖 |
|---|---|
| `deepsearch.ts` | `ZHIHU_ACCESS_SECRET`（知乎直答后端）、`DEEPSEEK_API_KEY`（DeepSeek 后端） |
| `zhihu_hot.ts` | `ZHIHU_ACCESS_SECRET` |
| `_zhihu.ts` | 共享库，知乎 API 封装（密钥从环境变量读取） |

## 部署

```bash
git clone https://github.com/axwhizee/my-harness-config.git
cp -r my-harness-config/{agents,skills,tools,opencode.jsonc,default_plus.txt} ~/.config/opencode/
# 或使用 symlink，便于后续 git pull 直接生效：
# ln -s ~/my-harness-config/skills ~/.config/opencode/skills
```

## 注意事项

- `opencode.jsonc` 中的 LSP 路径（msys2 clangd、nvm 下的 typescript-language-server 等）与
  `mcp.vscode.url`（WSL → Windows 的本地桥接端口）均为**机器特定配置**，换环境后请按实际路径调整。
- `agent.director` / `agent.actor` 在配置中处于 `disable` 状态，保留作为多 agent 编排的示例。
