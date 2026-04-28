<p align="center">
  <strong>赛博玄学馆 · CyberOracle</strong>
</p>

<p align="center">
  AI 驱动的玄学解读 — 手相、面相、今日运势 & 桌面占卜伙伴
</p>

<p align="center">
  <a href="./README.md">English</a> ·
  <a href="#技术栈">技术栈</a> ·
  <a href="#快速上手">快速上手</a> ·
  <a href="#项目结构">项目结构</a> ·
  <a href="#许可证">许可证</a>
</p>

---

## 关于

**赛博玄学馆** 将中国传统命理美学与现代 AI 技术融合，打造一款娱乐性的性格洞察体验产品。

上传手掌或面部照片，通过视觉模型（VLM）观察 + 语言模型（LLM）撰写的双阶段 AI 管线，
生成一张精美的解读长图卡片 — 风格简洁极简、细线条、圆角卡片，整体高端质感。

项目同时提供 **网页端** 和 **桌面端**，桌面端内置 Live2D 占卜师角色"星子"，
支持早晨问候、闲时陪伴、被点击反应、速召唤问答等交互。

## 技术栈

| 层级 | 技术方案 |
|---|---|
| 工程管理 | pnpm workspaces + Turborepo |
| 网页端 | Next.js 14 (React 18) |
| 桌面端 | Tauri 2.0 + Vite + React 18 |
| API 服务 | Next.js Route Handlers (standalone Docker) |
| AI 管线 | VLM（视觉观察）→ LLM（解读撰写），流式 JSON |
| 长图渲染 | satori + resvg (JSX → SVG → PNG) |
| 桌面伙伴 | PixiJS 6 + pixi-live2d-display |
| 样式系统 | Tailwind CSS v3 + 设计 token |
| 编程语言 | TypeScript 5.7+, Rust 1.82+ |

## 项目结构

```
cyberoracle/
├── apps/
│   ├── web/             # Next.js 网页端
│   ├── server/          # API 服务（Next.js Route Handlers）
│   └── desktop/         # Tauri 桌面客户端（Vite + React）
├── packages/
│   ├── core/            # Prompt、Schema、业务逻辑
│   ├── poster/          # satori 长图模板
│   ├── ui/              # 跨端共享 React 组件库
│   └── tokens/          # 设计 token
├── docs/                # 架构设计文档
├── scripts/             # 构建与开发工具脚本
└── .github/             # CI 工作流 & Issue/PR 模板
```

## 快速上手

### 系统要求

- **Node.js** 22+（推荐使用 [nvm](https://github.com/nvm-sh/nvm) 或 [volta](https://volta.sh)）
- **pnpm** 9+（`corepack enable && corepack prepare pnpm@9.12.0 --activate`）
- **Rust** 1.82+（仅桌面端构建需要，[安装指南](https://rustup.rs)）

### 安装

```bash
git clone https://github.com/OdradekAI/cyberoracle.git
cd cyberoracle
nvm use               # 切到 Node 22
pnpm install          # 安装所有依赖
```

### 配置环境变量

```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/server/.env.example apps/server/.env.local
```

### 常用命令

| 命令 | 说明 |
|---|---|
| `pnpm dev` | 启动所有 app |
| `pnpm dev:web` | 仅 web + server |
| `pnpm dev:desktop` | 仅 desktop + server |
| `pnpm typecheck` | 全仓类型检查 |
| `pnpm lint` | 全仓代码检查 |
| `pnpm test` | 全仓测试 |
| `pnpm format` | Prettier 格式化 |
| `pnpm clean` | 清理构建产物与缓存 |

### 桌面端开发

```bash
pnpm dev:server                                        # 终端 1：启动后端
pnpm --filter @cyberoracle/desktop tauri:dev           # 终端 2：启动客户端
```

> 桌面端需要先运行 `tauri init` 初始化 Rust 侧代码（src-tauri/），详见 [Tauri 项目骨架文档](./docs/4Tauri项目骨架.md)。

## 文档

详细的架构设计文档在 [`docs/`](./docs) 目录：

1. [Monorepo 工程骨架](./docs/1Monorepo工程骨架.md) — 工程化配置详解
2. [satori 长图组件](./docs/2satori长图组件.md) — JSX → SVG → PNG 渲染管线
3. [Live2D 集成完整示例](./docs/3Live2D集成完整示例.md) — PixiJS + Live2D 接入
4. [Tauri 项目骨架](./docs/4Tauri项目骨架.md) — Rust 端完整代码骨架
5. [完整 Prompt 文件](./docs/5完整Prompt文件.md) — Prompt 工程化体系

## 参与贡献

欢迎贡献代码。提交 PR 前，请先开 Issue 讨论你的改动方案。

## 许可证

Copyright 2026 OdradekAI

基于 [Apache License 2.0](./LICENSE) 许可证开源。详见 [LICENSE](./LICENSE)。

---

<p align="center">
  <sub>由 <a href="https://github.com/OdradekAI">OdradekAI</a> 用心构建</sub>
</p>
