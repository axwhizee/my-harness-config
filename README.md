# My Skills

A collection of agent skills for LLM coding assistants (opencode / Claude Code style `SKILL.md` format).
LLM 编码助手的技能集合，每个 skill 占据一个独立目录。

## Skills

| Skill | Description |
| --- | --- |
| [adapt-drv](adapt-drv/) | Layered design specification for embedded module driver libraries. Use when designing driver libraries for new peripheral modules (LCDs, sensors, etc.). 嵌入式外设驱动库的分层设计规范。`SKILL.md` / `SKILL_zh.md` 提供中英双语版本。 |
| [c-style](c-style/) | C code style guide (LLVM-based, token-efficient). Always applied when editing, writing, or reviewing C code (`.c` / `.h`). `SKILL.md` / `SKILL_zh.md` 提供中英双语版本。 |
| [wsl-interop](wsl-interop/) | Fallback chain and fix patterns for calling Windows `.exe` tools from WSL when direct interop fails. 从 WSL 调用 Windows 程序失败时的排查与回退方案。 |
| [zhihu](zhihu/) | Zhihu Open Platform skill: search Zhihu & the web, hot list, Zhihu Direct Answer (知乎直答), and read the signed-in user's own content / follows / favorites via the official `zhihu-cli`. 知乎开放平台技能（含 CLI 封装与 HTTP API / OAuth / MCP 参考文档）。 |

## Layout

Each skill lives in its own directory following the standard skill format:

```
<skill-name>/
├── SKILL.md        # skill definition (frontmatter: name + description)
├── SKILL_zh.md     # optional Chinese version
├── references/     # optional reference docs, loaded on demand
└── scripts/        # optional helper scripts
```

## Installation

Copy the desired skill directory into your agent's skills path, e.g.:

```bash
# opencode
cp -r <skill-name> ~/.config/opencode/skills/

# Claude Code
cp -r <skill-name> ~/.claude/skills/
```

## Author

Axwhizee
