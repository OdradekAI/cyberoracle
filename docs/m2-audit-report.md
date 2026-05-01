# M2 Web 端 MVP 功能审计报告

审计日期：2026-05-01

审计对象：`feature_list.json` 中 M2-001 至 M2-045 的验收项，以及当前仓库实现。

## 总体结论

M2 总体交付质量明显优于 M1。45 个 feature 在文件层面均有对应实现，全量 typecheck 通过，所有单测绿，4 个 Playwright E2E 文件存在且最近一次运行 `passed`。但 code review 发现 **1 处会破坏真实数据展示的高严重度缺陷**（M2-042 schema 字段不匹配，结果页对真实 SSE 数据始终回退到 stub），以及若干与验收 spec 的中度偏离。

- 完成（按文件 + 测试 + 验收 spec 严格对齐）：38 / 45
- 部分完成（文件存在但 spec 偏离 / 实现有缺陷）：7 / 45
- 缺失：0 / 45

主要发现：

1. **High** — `apps/web/src/app/result/[id]/page.tsx` 的 `buildSections` 字段名与 M2-001/M2-002 的 rich schema 不一致（用 `label/content` 而非 `name/body`，对 `overview`/`summary` 对象直接 `String(...)`），导致真实 SSE 完成事件到达时所有 mainLines 被丢弃、`overview/summary` 渲染为 `[object Object]`，最终被空 built 数组兜底回退到 STUB_SECTIONS。换言之，结果页**永远显示 stub 内容**，看起来"通过"是因为 stub 兜底，不是真在展示数据。
2. **Medium** — M2-021 SSE 缺少 `vlm_observe: done {data: observations}` 中间事件，规范要求的"观察阶段产物可见性"未实现，前端拿不到 stage-1 结构化结果。
3. **Medium** — M2-014 验收要求 `packages/core/prompts/fallback-soft.md`，仅有 `packages/core/src/fallbacks/index.ts`（JSON 硬编码在 TS 模块里）。功能等价但破坏了 prompt 文件统一管理约定。
4. **Medium** — M2-042 结果页 stub 定时器与 SSE 路径并行运行且互不取消：若 SSE 在 T+3500ms 之前完成，stub 会在 T+3500ms 覆盖真实数据；若 SSE 失败，stub 兜底正确。需要"SSE 已完成则取消 stub"互斥逻辑。
5. **Low** — `progress.md` Summary 表缺 M2-036..M2-042 行（Session 36-42 实际有完整记录），文档完整度问题，不影响实现。
6. **Low / 命名偏离** — M2-027/M2-029 spec 说 `.tsx`，实际是 `.ts`（plain TS class，非 React 组件）；M2-038 spec 说 `particles.ts`，实际是 `ambient-particles.ts`。功能正确，命名约定差异。
7. **Carryover from M1** — `pnpm build:server` 在 Windows 上仍受 standalone symlink EPERM 阻塞（M2 未在 scope 内修复，但未来 Docker/CI 阶段必须解决）。

## 本次执行的验证命令

| 命令                                   | 结果       | 说明                                                                                             |
| -------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `pnpm typecheck`                       | 通过       | 11/11 任务成功，0 错误，cache hit ratio 7/11。                                                   |
| `pnpm test`                            | 通过       | 9 任务全部成功，cache hit 5/9。poster 73 + server 31 + ui 5 + core/tokens（缓存命中）全部通过。  |
| `apps/web/test-results/.last-run.json` | passed     | Playwright 上次运行无失败用例（具体覆盖见 e2e/ 下 4 个 spec）。                                  |
| `pnpm build:web` / `pnpm build:server` | 未本次执行 | M1 审计已记录 server build 在 Windows symlink EPERM；M2 未声明修复，建议在 CI Linux 上单独验证。 |

## 功能逐项审计

### Core schemas / prompts / safety / fallbacks (M2-001 ~ M2-014)

| ID     | 状态     | 证据 / 说明                                                                                                                                        |
| ------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| M2-001 | 完成     | `packages/core/src/schemas/palm-reading.ts` + 9 tests，rich schema 与 docs §五 一致。                                                              |
| M2-002 | 完成     | `packages/core/src/schemas/face-reading.ts` + 9 tests，含 3-4 mainLines + 5 face icons 校验。                                                      |
| M2-003 | 完成     | `packages/core/src/schemas/daily-fortune.ts` + 10 tests，ratings 1-5、lucky.number 0-9 边界覆盖。                                                  |
| M2-004 | 完成     | `packages/core/src/schemas/vision-observation.ts` + 11 tests，discriminatedUnion('valid')，palm/face 各自 reason enum 与 10 个 observation field。 |
| M2-005 | 完成     | `packages/core/src/prompts/loader.ts#expandIncludes` + 4 cases；多 include、缺失 include 错误均覆盖。                                              |
| M2-006 | 完成     | `_shared/safety-rules.md`、`_shared/tone-guidelines.md` + 13 tests（章节存在性、expandIncludes 解析）。                                            |
| M2-007 | 完成     | `packages/core/prompts/vision-observe-face.md` + 7 tests。                                                                                         |
| M2-008 | 完成     | `packages/core/prompts/reading-write-palm.md` + 12 tests，2 完整示例、icon 选择规则均覆盖。                                                        |
| M2-009 | 完成     | `packages/core/prompts/reading-write-face.md` + 12 tests，"特别强调" 4 项合规要点覆盖。                                                            |
| M2-010 | 完成     | `packages/core/prompts/daily-fortune.md` + 14 tests，4 模板变量替换覆盖。                                                                          |
| M2-014 | 部分完成 | `packages/core/src/fallbacks/index.ts` + 15 tests 行为正确；但 spec 还要求 `packages/core/prompts/fallback-soft.md`，**未创建**。                  |

### Server orchestration (M2-011 ~ M2-013)

| ID     | 状态 | 证据 / 说明                                                                                                                               |
| ------ | ---- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| M2-011 | 完成 | `apps/server/src/lib/vlm-client.ts` + 9 tests，Qwen→GLM→GPT-4o fallback、API key 不出现在日志、403 fallback 全部覆盖。                    |
| M2-012 | 完成 | `apps/server/src/lib/llm-stream-client.ts` + 8 tests，DeepSeek→Qwen-Plus→GPT-4o-mini，0-chunk 静默 failover + mid-stream 错误传播双路径。 |
| M2-013 | 完成 | `apps/server/src/services/reading-service.ts` + 11 tests，3 阶段流水线、status 三态返回、onChunk 透传。                                   |

### Server APIs (M2-020 ~ M2-024)

| ID     | 状态     | 证据 / 说明                                                                                                                                                                                                                                          |
| ------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M2-020 | 完成     | `apps/server/src/app/api/upload/route.ts` 实现 sharp+nanoid+webp，meta.json 写入；progress 记录 manual curl 5 个用例（valid/missing/invalid kind/invalid mime/face）通过。                                                                           |
| M2-021 | 部分完成 | `apps/server/src/app/api/analyze/route.ts` SSE 流可工作、`PipelineEventSchema` 校验存在；**但缺少 `vlm_observe:done {data:observations}` 中间事件**——只发 `vlm_observe:running` 后直接跳到 `llm_interpret:running`，前端拿不到 stage-1 结构化观察。  |
| M2-022 | 完成     | `apps/server/src/app/api/render-image/route.tsx` 正确选择 PalmReadingPoster/FaceReadingPoster；`@resvg/resvg-js` 在 next.config 双重外部化。`as any` 类型断言可接受。                                                                                |
| M2-023 | 完成     | `apps/server/src/app/api/result/[id]/route.ts` + `/image/route.ts`，404 + 410（>7 天 expiry）+ 7 天 cache header 均存在。                                                                                                                            |
| M2-024 | 部分完成 | `apps/server/src/app/api/daily/route.ts` 缓存读写、generateDaily、`getDailyFallback` 兜底均存在；但 `getDateContext` 中 `ganzhi = dateStr`、`solarTerm = ''` 是 placeholder 而非真实计算（依赖 LLM 推断），spec 要求"hardcode for MVP"——只算半实现。 |

### Poster (M2-015 ~ M2-019)

| ID     | 状态 | 证据 / 说明                                                                                                                                       |
| ------ | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| M2-015 | 完成 | `packages/poster/src/primitives/{Box,Text,Card,SectionNumber,Divider,Tag}.tsx` + 20 tests；undefined style 防御实现到位。                         |
| M2-016 | 完成 | 12+ icons：HeartLine/BrainLine/LeafLine/Signpost/Wave/Mountain/River/Cloud/Lotus/CornerOrnament/Watermark/PalmDiagram + face 5 icons + 18 tests。 |
| M2-017 | 完成 | `PalmReadingPoster.tsx` + 8 tests，6 模块布局、watermark/QR/4 illustrations 均覆盖。                                                              |
| M2-018 | 完成 | `FaceReadingPoster.tsx` + 9 tests，5 face icons + 4 mainLines 覆盖。                                                                              |
| M2-019 | 完成 | `DailyFortuneCard.tsx` + 6 tests，ratings/lucky/advice/oneLine 视觉模块齐全。                                                                     |

### Web canvas (M2-025 ~ M2-041)

| ID     | 状态     | 证据 / 说明                                                                                                                                 |
| ------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| M2-025 | 完成     | `apps/web/src/components/canvas/CanvasStage.tsx` 4 层架构（OffscreenCanvas + bg + main rAF + HTML overlay），DPR 缩放正确。                 |
| M2-026 | 完成     | `hit-detection.ts` HitRegistry 类，bbox 命中 + cursor 回调 + 性能用例（1000 × 20 ≈ 1ms）。                                                  |
| M2-027 | 部分完成 | `CrystalBall.ts` 实现 idle + hover + 4-act sequence；spec 要求 `.tsx`，实际是 `.ts`。是 plain class 不是 React 组件，命名差异不影响功能。   |
| M2-028 | 完成     | 4-act 状态机内嵌于 `CrystalBall.ts`，setup/buildup/climax/resolution/done 时长与 spec 一致；通过 `setSequenceCallback` 与 TarotGroup 联动。 |
| M2-029 | 部分完成 | `TarotGroup.ts`（spec 同样标 `.tsx`）；5 卡 idle float / hover 3D / click flip / sibling dim 均实现。                                       |
| M2-030 | 完成     | `NeonSigns.ts`，4 个 sign + 预渲染 glow sprite + 8-12s 随机 glitch + reduced-motion 兜底。                                                  |
| M2-031 | 完成     | `BackgroundLayer0.ts`，code rain + 40 data particles + 4 distant halos + 0.2px 视差。                                                       |
| M2-032 | 完成     | `BaguaDiagram.ts` + HTML 八字面板（年/月/日/时 4 input + Escape/outside-click 关闭）。                                                      |
| M2-033 | 完成     | `PalmDiagram.ts` 3 line cycling + scan line + click→/upload?kind=palm。                                                                     |
| M2-034 | 完成     | `FortuneSticks.ts` 3 容器 shake + 弹簧物理 + 字符 reveal + 8 fortune pool。                                                                 |
| M2-035 | 完成     | `CyberCat.ts` 包含 idle 尾巴/眼睛/LED + click→`fortuneSticks.triggerDraw`。                                                                 |
| M2-036 | 完成     | `OracleGirl.ts` + speech bubble HTML overlay + 3s 自动消失。                                                                                |
| M2-037 | 完成     | `PoetryScroll.ts` 5 状态机（idle→hover→expanding→typing→complete）+ 4 hardcoded poems（spec 明确允许 stub）。                               |
| M2-038 | 部分完成 | `ambient-particles.ts` 文件名与 spec 的 `particles.ts` 不一致，行为正确（150-pool、tier-aware count、reduced-motion → 0）。                 |
| M2-039 | 完成     | `particle-burst.ts` 300-pool 复用、buildup 200 紫 / resolution 50 金、生命周期回收。                                                        |
| M2-040 | 完成     | `perf-tier.ts` WebGL renderer string 检测 + deviceMemory/hwConcurrency 阈值 + reduced-motion 强制 low + `window.__tierConfig` 调试通道。    |
| M2-041 | 完成     | `easter-eggs.ts` 子夜色温滤镜（hue-rotate 20deg/saturate 0.85）+ 10 击肚皮 + dev-only 节奏分层校验（13 元素跨 L0-L5）。                     |

### Web pages & E2E (M2-042 ~ M2-045)

| ID     | 状态                     | 证据 / 说明                                                                                                                                                                                                                                                                                                                                                                                |
| ------ | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| M2-042 | 部分完成（含高严重 bug） | `apps/web/src/app/result/[id]/page.tsx` 存在；EventSource 监听 + 进度条 + 海报预览 + export 按钮齐全。**关键缺陷**：`buildSections` 用 `label/content` 字段名（与 M2-001 schema 的 `name/body` 不符），对 `overview`/`summary` 对象直接 `String(...)` 得到 `[object Object]`，最终 `built.length===0` 落入 STUB_SECTIONS 兜底——结果页对真实数据展示无效。同时 stub 与 SSE 路径并行无互斥。 |
| M2-043 | 完成                     | `apps/web/src/lib/history-db.ts` Dexie 表 + 自动剔除超 20 条；`/history` 页面 + 4 Playwright 用例（empty/save/clear/click→navigate）。                                                                                                                                                                                                                                                     |
| M2-044 | 完成                     | `/share/[id]/page.tsx` 含 sticky CTA + iframe；`/download/page.tsx` 3 平台按钮 disabled+"即将上线"；SEO 元数据存在。                                                                                                                                                                                                                                                                       |
| M2-045 | 部分完成                 | `apps/web/e2e/e2e-journey.spec.ts` + history/share-download/smoke 共 4 spec，最后一次运行 passed；但 spec 验收要求 "Lighthouse perf ≥80 / LCP ≤2.5s / JS gzip ≤220KB"，进度文档与测试文件**未提供 Lighthouse 数字证据**，只有"canvas renders in 413ms"这种粗糙度量。                                                                                                                       |

## Code review 发现的问题

### Critical / High

1. **结果页对真实 schema 数据的展示是坏的（事实上始终 stub 兜底）**
   - 文件：`apps/web/src/app/result/[id]/page.tsx`
   - 现象：`buildSections(data)` 检查 `d.overview`、`d.mainLines[i].label`、`d.summary`，但 M2-001 / M2-002 已把 schema 改成 `overview:{heading,body}`、`mainLines[].name + .body`、`summary:{heading,body,illustration}`。
   - 影响：当 `/api/analyze` SSE 真的回传 `complete:done` 事件时：
     - `String(d.overview)` → `"[object Object]"`，进入 built。
     - `mainLines.forEach` 全部 `l.label && l.content` 判定失败，被全部丢弃。
     - 因为 `built.length === 0` 触发 fallback：`setSections(STUB_SECTIONS)`，UI 永远展示硬编码的"总览/事业运/感情运/财运" stub。
   - 当前 E2E 之所以 pass，是因为目前没有真实 LLM 流量、stub 路径自始至终被正确渲染——一旦 M3 接入真实 server，这条链路立刻坏。
   - 建议修复：把 `buildSections` 改成读 `overview.body`、`mainLines[i].name + .body`、`summary.body`，并对 `auxiliary/temperament/disclaimer` 做同样映射。强烈建议直接复用 `@cyberoracle/core` 的 `PalmReadingResult` 类型 + Zod 解析，而不是手写字段名。

2. **结果页 SSE 与 stub 并行，无互斥**
   - 同文件，`useEffect` 内同时 `setTimeout(simulateResult, 100)` 与 `new EventSource(...)`，二者状态机无 cancel。
   - 风险：SSE 在 T<3500ms 完成后，stub 的最后 setTimeout（T+3500）仍会触发 `setSections(STUB_SECTIONS)`，覆盖真实数据。
   - 建议：在 SSE 进入 `complete:done` 时 `clearTimeout` 全部 stub timer，或加 `if (resultData) return;` 守卫。

### Medium

3. **M2-021 SSE 缺少 `vlm_observe:done` 中间事件**
   - `apps/server/src/app/api/analyze/route.ts` 只 send `vlm_observe:running` → `llm_interpret:running`，从未发 `vlm_observe:done {data: observations}`。
   - 影响：客户端无法在中段拿到结构化的观察数据；spec 提到此事件是为了支撑前端"观察阶段产物可见"。
   - 建议：在 reading-service 内部把 stage-1 结果暴露出来（多一个 onObservation 回调），或者在 reading-service 调用方先单独跑 stage-1 再启动 stage-2 流。

4. **M2-014 缺少 `fallback-soft.md` prompt 文件**
   - 实现把 fallback JSON 硬编码在 `packages/core/src/fallbacks/index.ts`，破坏了"prompt-related 内容统一在 .md + frontmatter"的约定（M1 起的工程纪律）。
   - 建议：将 fallback JSON 抽到 `packages/core/prompts/fallback-soft.md`，loader 可加 `loadJsonPrompt('fallback-soft')` 解析。

5. **M2-024 `ganzhi` 用日期占位**
   - `getDateContext` 把 `ganzhi` 直接设成 `dateStr`，`solarTerm` 留空。
   - 当前测试环境无 LLM key 时直接走 fallback，掩盖了"LLM 看不到真实干支"的事实；接入 LLM 后会得到不准确的干支推断。
   - 建议：在 M3 之前接入 `lunar` 或 `lunar-typescript` 做真实换算，或给 prompt 显式说明"LLM 自行推断"——任选其一并注释清楚。

6. **大量 `catch {}` 静默吞错**
   - `analyze/route.ts` 写结果文件失败、`daily/route.ts` LLM 全链路失败、result page SSE/EventSource 异常等多处都是裸 `catch`。
   - 风险：production 环境下 LLM/磁盘失败无观测、无告警。
   - 建议：至少加 `console.error` 或预留 logging hook；后续接 OpenTelemetry/Sentry 时单独迭代。

### Low

7. **`progress.md` Summary 表缺 7 行**
   - Summary 表跳过了 M2-036..M2-042，但 Session 36-42 实际在文档里完整存在。
   - 影响：仅文档完整度问题。

8. **`.ts` vs `.tsx` 命名偏离 + 文件名差异**
   - M2-027/M2-029 spec 写 `.tsx`，实际是 `.ts`（plain class，非 JSX）。
   - M2-038 spec 写 `particles.ts`，实际是 `ambient-particles.ts`。
   - 影响：仅命名约定差异，运行时无影响。建议下次 milestone 起以"实际命名"反向更新 feature spec。

9. **M2-022 `as any` 类型断言**
   - `<PalmReadingPoster data={stored.result as any} />` 把磁盘读出的 result JSON 强转为 poster 期望的类型，未走 schema 校验。
   - 风险：如果 `/api/analyze` 写入了非法 JSON，render 端不会预先报错，而是走到 satori/resvg 时崩溃。
   - 建议：在读取 results JSON 后先用 `PalmReadingResultSchema` / `FaceReadingResultSchema` safeParse，失败返回 422。

10. **从 M1 继承的 `pnpm build:server` Windows 失败**
    - M2 未在 scope 内、本次也未重测；保持 M1 audit 中的同等结论。Linux/Docker 应单独验证。

## 建议修复顺序

1. **修复 M2-042 result page 的 schema 字段映射 + stub 互斥**——这是 M2 真实数据展示的入口，否则 M3 接入 LLM 后立刻反爆。
2. **补 M2-021 `vlm_observe:done` 事件**——保持前端契约稳定。
3. **补 M2-014 `fallback-soft.md`** 或在 progress.md 显式记录"调整为 TS 模块"的偏离。
4. **M2-024 干支换算策略落地**（接 lunar lib 或显式让 LLM 生成）。
5. **M2-022 render-image 加 schema safeParse**。
6. **替换 `catch {}` 静默吞错为带日志的 catch**，至少 server 三个写盘 + result page SSE 异常。
7. **补 Lighthouse / LCP / 包体证据**——M2-045 的 PRD §12.1 性能预算未给出实测数据。
8. **重置或删除 `apps/web/test-results/` 残留**——`.last-run.json` 不应入库（已在 git status 中作为 untracked 出现）。

## 结论

M2 是一次相对扎实的交付：所有 45 个 feature 的代码骨架与单测都到位，Canvas 系统、Poster 模板、Server 流水线三大支柱完整可跑，typecheck/test/E2E 三层质量门均绿。但需要立即关注 result page 的 schema 字段错配——它使整个"真实 SSE → UI 展示"路径事实上没被覆盖到，目前是 stub 兜底在维持 E2E 通过。修复上面列出的 1-2 项之后，可以放心进入 M3 桌面端 / Live2D / 真实 LLM 接入阶段。
