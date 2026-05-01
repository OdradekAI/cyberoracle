# Canvas 美术资源工程接入技术文档

更新时间：2026-05-01

本文说明如何把 `docs/canvas-art-assets` 生产出的美术资源整合进当前 Web 项目的 Canvas 首页。目标不是一次性重写现有 Canvas，而是在保留当前交互、状态机、命中检测和性能分级的前提下，把程序绘制逐步替换为高精度位图 sprite。

## 1. 当前项目现状

### 1.1 Web 入口

当前首页入口非常直接：

- `apps/web/src/app/page.tsx` 渲染 `CanvasStage`
- `apps/web/src/components/canvas/CanvasStage.tsx` 创建两层 canvas：
  - `bgCanvasRef`：背景层，约 10fps 更新
  - `mainCanvasRef`：主交互层，`requestAnimationFrame` 60fps 更新
- `CanvasStage` 里实例化所有互动对象：
  - `BackgroundLayer0`
  - `NeonSigns`
  - `OracleGirl`
  - `CrystalBall`
  - `TarotGroup`
  - `BaguaDiagram`
  - `PalmDiagram`
  - `FortuneSticks`
  - `CyberCat`
  - `PoetryScroll`
  - `AmbientParticles`
  - `ParticleBurst`

这套架构适合接入位图资产，因为对象边界和更新频率已经分层清楚。应该保留这套结构，把每个对象类内部的 procedural draw 替换为 `drawImage` + 少量程序化 VFX。

### 1.2 当前渲染方式

目前多数组件是 Canvas 程序绘制：

- `CrystalBall.ts` 用渐变、clip、粒子和文字绘制水晶球流程。
- `TarotGroup.ts` 用 rounded rect、文字和符号绘制塔罗牌。
- `BackgroundLayer0.ts` 绘制代码雨、远景粒子、halo。
- `OracleGirl.ts`、`CyberCat.ts`、`FortuneSticks.ts` 等也主要是形状/渐变绘制。

这意味着接入美术资源时不要先推翻交互逻辑。更稳妥的路线是：

1. 新增统一资源加载层。
2. 新增 asset manifest。
3. 每个现有 Canvas 类逐个读取资源并改为 `drawImage`。
4. 保留现有 hover、press、sequence、reduced-motion、hit registry。

### 1.3 当前命中检测限制

`HitRegistry` 当前只支持矩形 bbox，并且 `MAX_ELEMENTS = 20`。这对首轮接入够用，但和美术资源的真实形状有偏差：

- 水晶球、八卦盘更适合 circle hit。
- 猫、数据鱼更适合 ellipse hit。
- 机械臂适合多段 capsule 或直接无 hit。
- 塔罗、手相面板、卷轴适合 rect hit。

建议接入资源 manifest 时同步升级 hit 描述，但可以分两步做：第一阶段仍用 bbox，第二阶段支持 `circle | ellipse | rect | none`。

## 2. 已生成资源状态

### 2.1 Runtime 输出目录

当前可直接被 Next.js public 静态服务访问的资源在：

```text
apps/web/public/canvas-assets/
  backgrounds/
  characters/oracle/
  sprites/
  ui/
  vfx/
```

在浏览器中引用时，路径应写为：

```text
/canvas-assets/backgrounds/cyber-booth-bg-desktop.webp
/canvas-assets/sprites/crystal-orb.webp
/canvas-assets/characters/oracle/oracle-body.webp
```

不要在运行时代码中引用 `docs/canvas-art-assets/generated/raw/*`。`docs` 下的是生产源图、review 图和追溯资料，不应进入首屏加载链路。

### 2.2 Runtime 资源数量

当前已生成并导出的图片资源：

| 目录                 | 数量 | 用途                                                               |
| -------------------- | ---: | ------------------------------------------------------------------ |
| `backgrounds/`       |    6 | 桌面、平板、移动背景和 source                                      |
| `sprites/`           |   48 | 水晶球、塔罗、八卦、手相、猫、签筒、卷轴、机械臂、数据鱼、霓虹招牌 |
| `characters/oracle/` |   14 | 占卜师伪 Live2D 分层                                               |
| `ui/`                |    5 | 结果面板、按钮、tooltip、modal                                     |
| `vfx/`               |   12 | hover、press、reveal、粒子、scan-line                              |

合计：85 个 runtime 文件。

### 2.3 Harness 完成度

按 `art-assets-harness.json` 的图片类 `outputAssets` 统计：

- 图片美术资源总数：90
- 已生成/已落盘图片资源：90
- 尚未生成的图片美术资源：0

仍未完成的是非图片交付项：

- `manifest.json`
- `manifest.schema.json`
- `manifest.responsive.json`
- `LICENSES.assets.md`
- `docs/canvas-art-assets/art-review/runtime-readiness-report.md`
- `ART-018` 的 9 个 `.ogg` 音效

这些不阻塞首轮视觉接入，但会影响最终 runtime readiness。

### 2.4 资源质量注意事项

当前 runtime sprite 是从 production sheet 首轮裁切并做暗底转透明。它们适合工程接入和视觉验证，但不是最终精修版。已知风险：

- 部分 sprite 边缘会带暗色 matte，需要在深色背景上优先使用。
- `bagua-dial-glow.webp` 和 `bagua-dial-gold-outline.webp` 首轮与主体同源，后续应精修成真正的 glow/outline 分离层。
- `oracle` 的眼睛、嘴、头发分层是首轮切片，能支撑假 Live2D，但需要人工校准 pivot。
- `scan-line.webp` 文件极小，是程序生成的简单可复用扫线。

## 3. 目标接入架构

### 3.1 保持现有四层架构

建议最终渲染架构保持为：

```text
Layer 0: Offscreen/static background
Layer 1: background canvas, low-frequency ambient
Layer 2: main canvas, interactive sprites
Layer 3: HTML overlay, forms/results/tooltips
```

映射到当前代码：

- `drawStaticBackground` 改为绘制背景位图到 OffscreenCanvas。
- `BackgroundLayer0` 保留代码雨、远景粒子、halo，但应降低亮度，避免抢水晶球焦点。
- `mainLoop` 继续按 z-order 调用对象 `draw`。
- `HTML overlay` 继续承载表单、结果文字、输入控件，重要中文不要烘进图片。

### 3.2 新增 AssetLoader

建议新增：

```text
apps/web/src/components/canvas/assets/
  asset-manifest.ts
  AssetLoader.ts
  SpriteEntity.ts
  draw-utils.ts
```

其中 `AssetLoader` 负责：

- 根据 manifest 预加载图片。
- 缓存 `HTMLImageElement` 或 `ImageBitmap`。
- 暴露 `get(id)`。
- 支持 preload tier：`P0 | P1 | P2 | lazy`。
- 支持失败 fallback：缺图时返回 null，不让主循环崩溃。

建议接口：

```ts
export type PreloadTier = 'P0' | 'P1' | 'P2' | 'lazy';

export interface RuntimeAsset {
  id: string;
  src: string;
  naturalSize: [number, number];
  anchor: [number, number];
  layer:
    | 'L0-background'
    | 'L1-neon'
    | 'L2-main'
    | 'L2-side'
    | 'L3-character'
    | 'L3-prop'
    | 'L4-vfx'
    | 'HTML-overlay';
  zIndex: number;
  preloadTier: PreloadTier;
  sourceReference?: string;
}
```

### 3.3 新增 SpriteEntity 基类

当前每个对象类自己计算位置和绘制。接入 sprite 后，建议引入轻量基类或工具函数，不要过度抽象。

核心能力：

```ts
drawSprite(ctx, image, {
  x,
  y,
  scale,
  rotation,
  alpha,
  anchor,
  width,
  height,
});
```

锚点含义：

- `[0.5, 0.5]`：中心点。
- `[0.5, 0.73]`：水晶球这类底座物体，交互中心略高，视觉落点在底部。
- `[0.5, 0.82]`：签筒，底部更稳定。

不要把锚点硬编码在 draw 函数里。锚点应来自 manifest，这样后续替换资源不需要改逻辑。

## 4. Asset Manifest 设计

### 4.1 Runtime manifest 路径

建议生成并提交：

```text
apps/web/public/canvas-assets/manifest.json
apps/web/public/canvas-assets/manifest.schema.json
apps/web/public/canvas-assets/manifest.responsive.json
```

也可以把 typed manifest 放在源码里：

```text
apps/web/src/components/canvas/assets/asset-manifest.ts
```

首轮建议使用 TypeScript manifest，因为能被 `tsc` 检查，改动更安全。等稳定后再同步导出 public JSON 给非 TS 工具消费。

### 4.2 Manifest 示例

```json
{
  "id": "crystal-orb",
  "src": "/canvas-assets/sprites/crystal-orb.webp",
  "naturalSize": [290, 355],
  "anchor": [0.5, 0.73],
  "layer": "L2-main",
  "zIndex": 200,
  "preloadTier": "P0",
  "hit": {
    "type": "circle",
    "cx": 0.5,
    "cy": 0.36,
    "r": 0.31
  },
  "sourceReference": "docs/canvas-art-assets/generated/raw/p0-runtime-sprite-refinement-sheet-v1.png"
}
```

### 4.3 Preload tier 建议

P0 首屏必须加载：

- `backgrounds/cyber-booth-bg-desktop.webp`
- `backgrounds/cyber-booth-bg-mobile.webp`
- `sprites/crystal-orb.webp`
- `sprites/crystal-orb-base.png`
- `sprites/crystal-orb-glow.webp`
- `sprites/tarot-card-01-back.webp` 到 `tarot-card-05-back.webp`
- `characters/oracle/oracle-body.webp`
- `characters/oracle/oracle-head.webp`
- `ui/result-panel-frame.webp`
- `vfx/hover-halo-purple.webp`
- `vfx/press-ripple.webp`

P1 首屏后立即加载：

- 八卦盘、手相面板、猫、签筒、卷轴、霓虹招牌。
- `oracle` 的眼睛、嘴、手、头发、halo 分层。
- reveal 相关 VFX。

P2/lazy：

- 数据鱼 glow、机械臂分段、belly-up 猫彩蛋、额外粒子、移动专用 QA 参考不进入 runtime。

## 5. 分模块接入方案

### 5.1 背景

现状：

- `CanvasStage.drawStaticBackground` 绘制纯色、grid 和中心 glow。
- `BackgroundLayer0` 绘制 code rain、halos、particles。

改造：

1. 根据 viewport 选择背景：
   - `width / height < 0.75`：`cyber-booth-bg-mobile.webp`
   - `width < 1024`：`cyber-booth-bg-tablet.webp`
   - 其他：`cyber-booth-bg-desktop.webp`
2. 在 OffscreenCanvas 中用 cover 策略绘制背景。
3. 保留暗角和中心 focus overlay，但不要再画强 grid。
4. 背景层 `BackgroundLayer0` 的 code rain 应避开中心 60%，亮度降低到 `alpha <= 0.18`。

绘制规则：

```ts
// 伪代码
drawImageCover(ctx, bgImage, 0, 0, width, height);
drawVignette(ctx, width, height);
```

### 5.2 水晶球

现有类：`CrystalBall.ts`

建议替换顺序：

1. `crystal-orb-glow.webp` 先画，使用 `globalCompositeOperation = 'screen'` 或普通 alpha。
2. `crystal-orb-base.png` 或 `crystal-orb.webp` 画主体。
3. `crystal-orb-inner-mask.webp` 可作为内部 fog 的纹理层，继续叠加现有程序 fog。
4. `crystal-orb-glass-highlight.webp` 最后画，随时间做轻微旋转或 alpha 呼吸。
5. 现有粒子和四阶段 sequence 保留。

建议保留现有 sequence phase：

- `setup`：sprite scale 0.95 -> 1.0。
- `buildup`：glow alpha 提升，粒子 rate 提升。
- `climax`：叠 `white-flash-mask.webp` 和 `energy-ring.webp`。
- `resolution`：结果文字进入 HTML overlay 或 result panel，不写在球图上。

### 5.3 塔罗牌

现有类：`TarotGroup.ts`

改造：

- 卡背使用 `tarot-card-01-back.webp` 到 `tarot-card-05-back.webp`。
- 卡正面使用 `tarot-card-front-template.webp`。
- hover 使用 `tarot-card-glow.webp`。
- 翻牌动画继续用当前 `scaleX` 方案，只把 front/back 绘制换成 image。
- 卡面中文、含义、符号继续用 Canvas 或 HTML 画，不进入图片。

注意：

当前 `CARD_WIDTH = 48`、`CARD_HEIGHT = 72` 偏小，会浪费美术细节。建议改为响应式：

```ts
const cardHeight = Math.min(height * 0.13, 150);
const cardWidth = cardHeight * 0.58;
```

移动端要保证卡牌触控宽度至少 44px。

### 5.4 八卦盘

现有类：`BaguaDiagram.ts`

资源：

- `sprites/bagua-dial.webp`
- `sprites/bagua-dial-glow.webp`
- `sprites/bagua-dial-gold-outline.webp`

接入：

- 主体持续低速旋转，周期 20s。
- hover 时提升 outline alpha，并把旋转周期缩短到 8s。
- 命中区域用 circle，不要用完整 bbox。
- 亮度必须低于水晶球。

### 5.5 手相面板

现有类：`PalmDiagram.ts`

资源：

- `sprites/palm-panel.webp`
- `sprites/palm-lines-glow.webp`
- `vfx/scan-line.webp`

接入：

- `palm-panel` 作为静态底。
- `palm-lines-glow` 做周期 alpha。
- hover 时绘制 `scan-line` 从上到下扫过。
- 点击仍触发现有 `/upload?kind=palm`。

### 5.6 猫

现有类：`CyberCat.ts`

资源：

- `cyber-cat-body.webp`
- `cyber-cat-eyes-open.webp`
- `cyber-cat-eyes-blink.webp`
- `cyber-cat-eyes-happy.webp`
- `cyber-cat-tail.webp`
- `cyber-cat-collar-glow.webp`
- `cyber-cat-belly-up.webp`

接入：

- 首轮可直接画 `cyber-cat-body.webp`，眼睛/尾巴分层延后。
- blink 逻辑：每 4-7s 切 `eyes-open` -> `eyes-blink` 120ms。
- hover：`eyes-happy` + collar glow alpha 提升。
- 彩蛋：继续使用现有 `EasterEggs`，触发后画 `cyber-cat-belly-up.webp`。

### 5.7 占卜师角色

现有类：`OracleGirl.ts`

资源：

```text
characters/oracle/oracle-body.webp
characters/oracle/oracle-head.webp
characters/oracle/oracle-front-hair.webp
characters/oracle/oracle-back-hair.webp
characters/oracle/oracle-eye-left-open.webp
characters/oracle/oracle-eye-left-closed.webp
characters/oracle/oracle-eye-right-open.webp
characters/oracle/oracle-eye-right-closed.webp
characters/oracle/oracle-mouth-neutral.webp
characters/oracle/oracle-mouth-smile.webp
characters/oracle/oracle-hand-left.webp
characters/oracle/oracle-hand-right.webp
characters/oracle/oracle-headgear-ring.webp
characters/oracle/oracle-accessories.webp
```

接入顺序：

1. 先用 `oracle-body.webp` 替换程序绘制角色整体。
2. 再加 `head`、`hands`，保持角色在水晶球后方。
3. 最后接入眼睛、嘴、头发和 halo 的微动。

推荐 z-order：

```text
back-hair
body
head
eyes/mouth
front-hair
hands
accessories
headgear-ring
```

角色要作为第二视觉焦点，不能覆盖水晶球中心。

### 5.8 签筒、卷轴、机械臂、数据鱼

现有类：

- `FortuneSticks.ts`
- `PoetryScroll.ts`
- 机械臂目前没有独立类，可先挂在 `CrystalBall` sequence 或新建 `RoboArm.ts`。
- 数据鱼可放进 `AmbientParticles` 或新建 `DataFishLayer.ts`。

资源：

- 签筒：`fortune-stick-love/career/money/single/glow.webp`
- 卷轴：`poem-scroll-closed/open/edge-glow/roller-left/roller-right.webp`
- 机械臂：`robo-arm-base/upper/lower/hand/joint-glow.webp`
- 数据鱼：`data-fish-small/large/glow.webp`

接入建议：

- 签筒保留三入口，hover 只提升 glow，不做大幅位移。
- 卷轴点击时从 closed 切 open，正文仍由 Canvas/HTML 绘制。
- 机械臂只在水晶球 sequence 的 `buildup` 和 `climax` 出现，避免常驻抢焦点。
- 数据鱼放到背景层低频移动，低端设备只画 1 条或不画。

### 5.9 UI/VFX

资源：

- UI：`result-panel-frame.webp`、`button-primary-frame.webp`、`tooltip-frame.webp`、`modal-backplate.webp`
- VFX：`hover-halo-purple.webp`、`hover-halo-gold.webp`、`press-ripple.webp`、`focus-ring.webp`、`white-flash-mask.webp`、`energy-ring.webp`、`gold-star.webp`、`purple-spark.webp`、`reveal-burst.webp`、`magic-dust.webp`

接入方式：

- Canvas 内的 hover/press 用 VFX sprite。
- HTML overlay 的结果面板可以用 CSS `background-image` 或普通 `<img>` 叠底。
- 结果文字必须由 HTML 渲染，便于可访问性、复制和后续分享。
- reduced-motion 下禁用 ripple expansion，只保留 alpha fade。

## 6. 响应式布局策略

### 6.1 坐标系统

建议建立设计坐标：

```ts
const DESIGN = { width: 1920, height: 1080 };
```

然后根据 viewport 计算：

```ts
const scale = Math.min(width / DESIGN.width, height / DESIGN.height);
const centerX = width / 2;
const centerY = height / 2;
```

桌面使用横向构图，移动端不要简单裁桌面图，应该用当前已生成的移动背景和 `mobile-touch-hitbox-validation-reference-v1.png` 做布局参考。

### 6.2 移动端重点

移动端必须保证：

- 水晶球可点区域不小于 56px。
- 卡牌、八卦、手相、猫、签筒之间 hitbox 不重叠。
- 结果面板不能盖住水晶球交互高潮。
- 角色可以缩小，但水晶球必须保持第一焦点。

建议移动端隐藏或弱化：

- 数据鱼数量。
- 机械臂常驻展示。
- 过密霓虹招牌。

## 7. 性能预算

当前导出的 WebP 大多较小，首屏图片预算可控。建议目标：

- P0 图片总量：小于 2MB。
- P0 + P1：小于 4MB。
- 单帧主 canvas `drawImage` 次数：高端不超过 80，中低端不超过 45。
- 背景层更新频率保持 10fps 左右。
- 低端设备禁用 heavy blur、glitch、多鱼、多粒子。

### 7.1 ImageBitmap 优先级

如果浏览器支持：

```ts
const bitmap = await createImageBitmap(image);
```

可以在 loader 里缓存 `ImageBitmap`。否则使用 `HTMLImageElement`。不要在每帧创建新 canvas、gradient 或 image object。

### 7.2 ShadowBlur 控制

现有代码大量使用 glow/gradient。接入位图后，应优先用预渲染 glow sprite，减少 `ctx.shadowBlur`。`perf-tier.ts` 里已有 `maxShadowBlur`，接入时应继续沿用。

## 8. 实施路线

### Phase 1：资源加载和背景替换

范围：

- 新增 `AssetLoader`
- 新增 typed manifest
- 替换 `drawStaticBackground`
- 确认背景 cover/crop 在桌面和移动端都正确

验收：

- 页面首屏不白屏。
- 背景无 404。
- resize 后背景仍填满。
- `prefers-reduced-motion` 不影响静态背景。

### Phase 2：P0 主交互替换

范围：

- `CrystalBall`
- `TarotGroup`
- `BaguaDiagram`
- `PalmDiagram`

验收：

- 水晶球仍是第一焦点。
- hover/press/sequence 状态仍有效。
- 塔罗翻牌不丢状态。
- 点击命中和视觉位置一致。

### Phase 3：P1 角色和侧边入口

范围：

- `OracleGirl`
- `CyberCat`
- `FortuneSticks`
- `PoetryScroll`
- `NeonSigns`

验收：

- 猫彩蛋仍可触发。
- 八字、手相、签筒、卷轴入口不互相遮挡。
- 角色层级在水晶球后方。

### Phase 4：VFX 和结果 UI

范围：

- `ParticleBurst` 使用 VFX sprite。
- HTML result panel 使用 UI frame。
- reduced-motion 降级。

验收：

- reveal 高潮 200ms flash 不刺眼。
- 结果文本可读。
- UI 图不承担中文正文。

### Phase 5：Manifest、音频、交付报告

范围：

- 生成 `manifest.json`
- 生成 `manifest.schema.json`
- 生成 `manifest.responsive.json`
- 生成 `LICENSES.assets.md`
- 补 `ART-018` OGG 音效
- 写 `runtime-readiness-report.md`

验收：

- manifest 可被 `JSON.parse`。
- 所有 src 文件存在。
- P0/P1 都有 anchor、hit、preloadTier。
- 音频只在用户授权/交互后播放。

## 9. QA 检查清单

### 9.1 自动检查

建议增加脚本检查：

- manifest 所有 `src` 是否存在。
- 所有图片文件名是否英文、kebab-case、无空格。
- WebP/PNG 是否可被 Pillow 或 browser decode。
- 透明图片四角 alpha 是否接近 0。
- P0 总大小是否超预算。

### 9.2 Playwright 视觉检查

建议保留两组截图：

- desktop：`1440x900`
- mobile：`390x844`

检查点：

- canvas 非空。
- 水晶球位于视觉中心附近。
- 首屏无异常拉伸。
- hover 后 cursor 为 pointer。
- reduced-motion 下动画减弱但画面仍完整。

### 9.3 人工美术检查

参考文件：

- `docs/canvas-art-assets/art-review/contact-sheet-key-art.png`
- `docs/canvas-art-assets/art-review/static-composite-desktop.png`
- `docs/canvas-art-assets/art-review/static-composite-mobile.png`
- `docs/canvas-art-assets/art-review/static-composite-contact-sheet.png`

检查原则：

- 第一焦点：水晶球。
- 第二焦点：占卜师脸和手。
- 入口可读：塔罗、八卦、手相、猫、签筒、卷轴。
- 背景不能抢焦点。
- 中文和结果正文由 Canvas/HTML 渲染，不烘进图片。

## 10. 风险和处理策略

### 10.1 首轮裁切边缘不完美

风险：暗底转透明导致边缘带暗边。

处理：

- 先在深色背景接入验证。
- 对 P0 资源优先人工精修 alpha。
- glow 层不强求透明边缘极干净，主体层必须更干净。

### 10.2 资源尺寸和布局不匹配

风险：sprite 原始裁切大小不一致，直接 draw 会错位。

处理：

- manifest 必须记录 `naturalSize`、`anchor`、`defaultPlacement`。
- 所有 draw 都基于 anchor，不以左上角定位。
- 每个模块单独做 viewport snapshot。

### 10.3 当前文字存在编码问题

现有代码里有一些 mojibake 字符串。美术接入不应扩大这个问题。

处理：

- 美术资源不包含中文正文。
- 结果、按钮、表单文案后续单独修复编码和 i18n。
- UI frame 只做视觉容器。

### 10.4 交互对象超过 HitRegistry 上限

当前 `MAX_ELEMENTS = 20`，如果后续把机械臂、数据鱼、每个 UI 按钮都注册为 hit，可能超过上限。

处理：

- P0/P1 入口注册 hit，装饰和 ambient 不注册。
- 如果需要更多可点对象，把 `MAX_ELEMENTS` 提到 40，并增加按 zIndex 倒序命中。

## 11. 推荐最小代码改动顺序

1. 新增 `asset-manifest.ts`，只登记背景和水晶球。
2. 新增 `AssetLoader.ts`，在 `CanvasStage` 初始化时 preload P0。
3. 背景改为 `drawImageCover`，保留现有 background effects。
4. `CrystalBall` 改为 image layers，但保留 sequence 和 particles。
5. `TarotGroup` 改为 image card front/back。
6. 接 `BaguaDiagram` 和 `PalmDiagram`。
7. 接 `CyberCat` 和 `OracleGirl`。
8. 接 UI/VFX。
9. 写 public manifest/schema/responsive manifest。
10. 做 Playwright screenshot QA。

这条路线每一步都有可见结果，也能在任何阶段回退到程序绘制 fallback。

## 12. 当前资源接入优先级

最高优先级：

- `backgrounds/cyber-booth-bg-desktop.webp`
- `backgrounds/cyber-booth-bg-mobile.webp`
- `sprites/crystal-orb.webp`
- `sprites/crystal-orb-glow.webp`
- `sprites/crystal-orb-glass-highlight.webp`
- `sprites/tarot-card-*-back.webp`
- `sprites/tarot-card-front-template.webp`

第二优先级：

- `characters/oracle/oracle-body.webp`
- `characters/oracle/oracle-head.webp`
- `sprites/bagua-dial.webp`
- `sprites/palm-panel.webp`
- `sprites/cyber-cat-body.webp`
- `sprites/fortune-stick-*.webp`
- `sprites/poem-scroll-*.webp`

第三优先级：

- `ui/*.webp`
- `vfx/*.webp`
- `sprites/data-fish-*.webp`
- `sprites/robo-arm-*.webp`
- `characters/oracle` 的细分表情/头发/饰品层

## 13. 完成定义

美术资源真正整合完成，不只是文件存在，而是满足：

1. Runtime manifest 完整。
2. Canvas 首页使用位图背景和 P0/P1 sprite。
3. 所有核心交互入口仍可点击、hover、press。
4. 桌面和移动端截图通过视觉验收。
5. reduced-motion 和低端 perf tier 有降级。
6. 重要中文文本由程序渲染。
7. 资源 license 和来源有记录。
8. P0/P1 首屏体积在预算内。

当前资源已经足以开始 Phase 1 到 Phase 3 的工程接入。建议下一步从 `AssetLoader + background + CrystalBall` 开始做一条 tracer bullet，把静态背景和核心球体跑通后，再批量替换其他对象。
