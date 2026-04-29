# M1 共享基建功能审计报告

审计日期：2026-04-29

审计对象：`feature_list.json` 中 M1-001 至 M1-021 的验收项，以及当前仓库实现。

## 总体结论

M1 的核心包、设计 token、schema、prompt、安全检查、poster 基础渲染、UI stub 与 TypeScript 集成基础基本完成；但 M1 不能视为完全交付，因为全量验证链路仍有失败项，且若干手动/E2E 验收项尚未闭环。

- 完成：16 / 21
- 部分完成：5 / 21
- 缺失：0 / 21

主要阻塞项：

1. `pnpm test` 全量失败：`@cyberoracle/server` 配置了 `vitest run`，但没有测试文件，Vitest 以 code 1 退出。
2. `pnpm build:server` 失败：Next standalone 输出在 Windows 上复制 traced files 时创建 symlink 失败，报 `EPERM: operation not permitted, symlink`。
3. `packages/poster/fonts/` 不存在，M1-017 要求的 Noto Serif SC 字体子集未落盘；当前 poster 测试/预览依赖 Windows 系统字体 fallback。
4. `pnpm dev:web`、Web/Server HTTP endpoint、Tailwind token 可视化页面、Docker build、poster watch 模式均未完成自动化或本次可重复验证。
5. 应用层几乎没有实际 `@cyberoracle/*` 源码导入；目前主要验证的是配置解析，不是业务代码真实消费链路。

## 本次执行的验证命令

| 命令                                               | 结果         | 说明                                                                                                                             |
| -------------------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm typecheck`                                   | 通过         | 7 个 workspace、11 个任务全部成功。                                                                                              |
| `pnpm test`                                        | 失败         | `apps/server` 无测试文件导致 `@cyberoracle/server#test` 失败。core/tokens/ui 已通过；poster 在全量输出被 server 失败打断前启动。 |
| `pnpm --filter @cyberoracle/core test`             | 通过         | 9 个 test files，50 tests。                                                                                                      |
| `pnpm --filter @cyberoracle/tokens test`           | 通过         | 3 个 test files，35 tests。                                                                                                      |
| `pnpm --filter @cyberoracle/poster test`           | 通过         | 3 个 test files，10 tests。                                                                                                      |
| `pnpm --filter @cyberoracle/ui test`               | 通过         | 1 个 test file，5 tests。                                                                                                        |
| `pnpm --filter @cyberoracle/desktop typecheck`     | 通过         | Desktop TypeScript 检查通过。                                                                                                    |
| `pnpm build:web`                                   | 通过但有警告 | Next build 完成；ESLint 报 `Invalid Options: useEslintrc, extensions`。                                                          |
| `pnpm build:server`                                | 失败         | standalone trace copy 创建 symlink 失败，Windows `EPERM`。                                                                       |
| `pnpm --filter @cyberoracle/poster preview:poster` | 通过         | 生成 `packages/poster/preview-output.png`，大小约 10.5 KB。                                                                      |

## 功能逐项审计

| ID     | 状态     | 证据                                                                                                                                   | 审计意见                                                                                                                                                                 |
| ------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| M1-001 | 部分完成 | `apps/web/tailwind.config.ts`、`apps/web/postcss.config.mjs`、`apps/web/src/app/globals.css`、`packages/tokens/src/tailwind-preset.ts` | Tailwind/PostCSS/token preset 配置存在；但 `pnpm dev:web` 与 token-derived Tailwind 类可视化页面未在本次完成验证，按验收标准只能记为部分完成。                           |
| M1-002 | 完成     | `packages/core/vitest.config.ts`、`packages/core/src/__tests__/health.test.ts`                                                         | core Vitest 配置、health test、root test 集成均存在；定向 core 测试 50 tests 通过。                                                                                      |
| M1-003 | 完成     | `packages/poster/vitest.config.ts`、`packages/poster/src/__tests__/health.test.ts`                                                     | poster Vitest 配置与 React/plugin alias 基础可用；定向 poster 测试 10 tests 通过。                                                                                       |
| M1-004 | 部分完成 | `apps/server/Dockerfile`、`docker-compose.yml`                                                                                         | Dockerfile 是 deps/builder/runner 多阶段结构，compose server service 存在；但 Docker build 未验证，且 Dockerfile runner 复制 `packages/poster/fonts`，当前该目录不存在。 |
| M1-005 | 部分完成 | `package.json` 的 `dev:web`、`apps/server/src/app/api/health/route.ts`                                                                 | dev:web 脚本和 health route 存在；但本次未验证 3000/3001 HTTP 响应，也没有 Playwright/E2E 证据。                                                                         |
| M1-006 | 完成     | `packages/tokens/src/colors.ts`、`packages/tokens/src/__tests__/colors.test.ts`                                                        | brand/dark/poster/semantic colors 与 hex 测试完整。                                                                                                                      |
| M1-007 | 完成     | `packages/tokens/src/typography.ts`、`spacing.ts`、`borders.ts`、`animations.ts`、`index.ts`                                           | typography、spacing、radius、animation token 均已实现并有测试。                                                                                                          |
| M1-008 | 完成     | `packages/tokens/src/tailwind-preset.ts`、`packages/tokens/src/__tests__/tailwind-preset.test.ts`                                      | Tailwind preset 映射 colors/fontFamily/borderRadius/timing/duration，并通过测试。                                                                                        |
| M1-009 | 完成     | `packages/core/src/schemas/palm-reading.ts`、对应测试                                                                                  | PalmReadingResult schema 字段、类型导出、正反例测试完整。                                                                                                                |
| M1-010 | 完成     | `packages/core/src/schemas/face-reading.ts`、对应测试                                                                                  | FaceReadingResult schema 与测试完整。                                                                                                                                    |
| M1-011 | 完成     | `packages/core/src/schemas/daily-fortune.ts`、对应测试                                                                                 | DailyFortuneResult schema 与测试完整。                                                                                                                                   |
| M1-012 | 完成     | `packages/core/src/schemas/pipeline-event.ts`、对应测试                                                                                | PipelineEvent enum/status/data/error schema 与测试完整。                                                                                                                 |
| M1-013 | 完成     | `packages/core/prompts/vision-observe-palm.md`、prompt file 测试                                                                       | Prompt frontmatter、`---USER---` 分隔、变量模板与 JSON 输出约束存在。                                                                                                    |
| M1-014 | 完成     | `packages/core/src/prompts/loader.ts`、loader 测试                                                                                     | `loadPrompt`、`fillTemplate` 行为符合验收项，缺失变量保留原模板。                                                                                                        |
| M1-015 | 完成     | `packages/core/src/content-safety/blacklist.json`、`checker.ts`、测试                                                                  | 黑名单与 `checkContent` 行为完整，包含大小写不敏感匹配测试。                                                                                                             |
| M1-016 | 完成     | `packages/core/src/index.ts`、schemas/prompts/content-safety index、barrel exports 测试                                                | core barrel exports 完整；从 `@cyberoracle/core` 导入的测试通过。                                                                                                        |
| M1-017 | 部分完成 | `packages/poster/src/render/render-server.ts`、render-server 测试                                                                      | JSX -> PNG 渲染函数可用，PNG magic bytes 测试通过；但 `packages/poster/fonts/` 不存在，未满足 Noto Serif SC 字体子集加载要求。                                           |
| M1-018 | 完成     | `packages/poster/src/components/PosterLayout.tsx`、poster-layout 测试                                                                  | Props、cream/dark/gold 样式、divider、watermark、satori-compatible inline style 均有测试覆盖。                                                                           |
| M1-019 | 部分完成 | `packages/poster/scripts/preview.ts`、`packages/poster/package.json` scripts                                                           | `preview:poster` 能生成 PNG；`preview:poster:watch` 脚本存在但本次未验证 watch 行为。                                                                                    |
| M1-020 | 完成     | `packages/ui/src/index.ts`、`packages/ui/src/__tests__/exports.test.ts`、`packages/ui/package.json`                                    | 四个 UI stub named exports、peerDependencies、typecheck/test 均通过。                                                                                                    |
| M1-021 | 部分完成 | `pnpm typecheck`、`pnpm test`、`pnpm build:web`、`pnpm build:server` 输出                                                              | typecheck 通过，包级单测通过，web build 完成；但全量 test 失败、server build 失败、真实 app-level workspace imports 证据不足。                                           |

## Code review 发现的问题

### Critical / High

1. **Server test script 破坏全量测试门禁**
   - 现象：`pnpm test` 因 `apps/server` 无 test files 失败。
   - 风险：M1-021 的“pnpm test passes”未满足，CI 会失败。
   - 建议：为 server 添加最小 health route/API 测试，或将 server 的测试脚本改为不会因空测试失败的显式策略；更推荐补测试。

2. **Server standalone build 在 Windows 失败**
   - 现象：`pnpm build:server` 报 `EPERM: operation not permitted, symlink`。
   - 风险：M1-004 Docker runner 依赖 standalone 输出，Windows 本地无法稳定验证 server build。
   - 建议：确认 Windows 开发者是否启用 Developer Mode/管理员权限；或调整 Next standalone/pnpm symlink 策略并在 CI Linux 环境验证 Docker build。

3. **Poster 字体资产缺失**
   - 现象：`packages/poster/fonts/**` 无文件；Dockerfile 也尝试复制该目录。
   - 风险：中文海报渲染在非 Windows 环境或容器内可能失败，M1-017 验收项未满足。
   - 建议：运行并修复 `pnpm fonts:prepare` 产物，确保字体文件纳入可部署资源策略；测试应覆盖没有系统字体 fallback 的路径。

### Medium

4. **E2E/手动验收项未自动化**
   - 涉及：M1-001、M1-005、M1-019。
   - 风险：Tailwind token 实际渲染、双服务启动、watch 模式无法在回归中证明。
   - 建议：补 Playwright/curl smoke test，至少覆盖 `/` 与 `/api/health`。

5. **ESLint 与 Next build 的配置不兼容**
   - 现象：web/server build 都输出 `ESLint: Invalid Options: useEslintrc, extensions`。
   - 风险：当前 web build 仍完成，但 lint 阶段实际异常，后续可能升级为阻塞。
   - 建议：升级/调整 Next ESLint 配置，移除 ESLint 9 不再支持的选项来源。

6. **应用层 workspace import 仍停留在配置层**
   - 现象：`apps` 下搜索到的 `@cyberoracle/*` 主要在 Vite/Tailwind 配置，未见业务源码真实导入 core/poster/ui/tokens。
   - 风险：M1-021 的跨包集成验证偏浅，未来真正消费包时仍可能暴露 bundler/runtime 问题。
   - 建议：补一个 web/server/desktop 的最小 import smoke test 或示例页面，验证实际编译链路。

### Low

7. **Desktop 目前是最小 Vite React shell**
   - 现象：typecheck 通过，但 `src-tauri` 未见实现证据。
   - 风险：不直接阻塞 M1 feature_list 中已列项，但与 CLAUDE.md 项目概览的 Tauri 2.0 目标仍有差距。

## 建议修复顺序

1. 为 `apps/server` 添加 health route 测试，使 `pnpm test` 通过。
2. 准备 `packages/poster/fonts/` 并让 poster 渲染测试使用项目字体，而不是系统 fallback。
3. 解决 `pnpm build:server` 的 Windows symlink/standalone 问题，或在 Linux CI 上建立 Docker build 证明。
4. 补 `pnpm dev:web` smoke/E2E：验证 web 3000 与 server 3001 `/api/health`。
5. 修复 Next/ESLint 9 配置警告。
6. 增加 app 源码层的 workspace import smoke，避免 M1-021 只验证配置文件。

## 结论

M1 的共享基础代码已具备继续推进 M2 的大部分条件，但按 `feature_list.json` 的验收标准，当前 M1 仍是“部分完成”。建议先修复全量测试、server build、poster 字体与 E2E smoke 后，再将 M1 标记为完全完成。
