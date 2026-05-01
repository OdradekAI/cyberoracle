# Image2 Game Art Production Spec

## 结论

当前项目技术栈可以实现接近 `inspiration.png` 的效果，但前提是不要试图用纯 SVG 或程序化 Canvas 画出所有细节。

正确拆法是：

- **精细度**交给 AI/人工绘制的高分辨率位图素材。
- **动态和交互**交给当前 Canvas 2D 架构、命中区、状态机、粒子和 HTML overlay。
- **SVG**只适合符号、占位、debug hitbox、简单 UI 线框，不适合作为最终美术主资源。

本轮已在 `docs/canvas-art-assets/raster/image2-concepts/` 生成新的高精度位图资源，并保留上一版 SVG 作为实现参考/占位，不建议作为最终画面素材。

## 本轮产物

| 文件                                                            | 作用                                        |
| --------------------------------------------------------------- | ------------------------------------------- |
| `raster/image2-concepts/cyberoracle-master-key-art.png`         | 美术目标图，锁定“该长什么样”                |
| `raster/image2-concepts/cyberoracle-background-plate-v2.png`    | 空背景底板，适合做 L0/L1                    |
| `raster/image2-concepts/cyberoracle-prop-atlas.png`             | 道具图集，适合裁切成互动 sprite             |
| `raster/image2-concepts/cyberoracle-oracle-character-sheet.png` | 占卜师角色设定，适合后续拆 Live2D/Canvas 层 |
| `raster/image2-concepts/cyberoracle-ui-vfx-atlas-v2.png`        | 结果面板与 VFX 图集参考                     |
| `raster/crop-guide.json`                                        | 第一版道具裁切坐标和命中区建议              |
| `prompts/image2-prompts.jsonl`                                  | 可用 CLI `gpt-image-2` 重跑的 prompt 集     |

## 为什么上一版 SVG 不够

上一版 SVG 是工程友好的矢量占位资源，优点是轻、可缩放、可程序化调色；缺点是材质、笔触、环境密度、局部细节、角色表现都远低于灵感图。灵感图属于“高密度 2D 游戏概念图/宣传图”范畴，本质是位图绘制，不是图标系统。

如果目标是“逼真、贴近灵感图”，资源生产要改成游戏流程：

1. 出主视觉 key art。
2. 出无角色/无主道具背景 plate。
3. 出 prop atlas。
4. 手动或用 AI edit/inpaint 修每个道具。
5. 抠图/分层/导出 runtime sprite。
6. Canvas 做动态化。

## 推荐生产流程

### 1. 主视觉定风格

先用 `cyberoracle-master-key-art.png` 评估方向：角色、光照、场景密度、道具样式、颜色关系。

验收标准：

- 第一眼焦点必须是水晶球。
- 其次是占卜师脸和手。
- 9 个入口道具能被看出来，但不能抢主焦点。
- 画面不能像网页 banner，要像游戏活动主界面。

### 2. 生成背景 Plate

背景 plate 要“有细节但中间留空”。这张图用于 OffscreenCanvas 一次绘制，动态内容在上面叠。

建议处理：

- 将背景导出为 `webp`，桌面可用 1920 宽，移动可用 1280 宽。
- 在 Canvas 中叠加暗角，让中央水晶球更突出。
- 远景鱼、代码雨、灯牌呼吸不要烘焙死，交给程序做低频动画。

### 3. 生成并裁切 Prop Atlas

当前 `cyberoracle-prop-atlas.png` 已经把道具分开放置。使用 `raster/crop-guide.json` 作为第一版裁切框。

生产级处理建议：

- 裁切后用 Photoshop、Photopea、Krita 或 `rembg` 做透明背景。
- 对玻璃、水晶、鱼尾这类半透明边缘，优先人工修边，不要只依赖自动抠图。
- 每个 sprite 导出两份：`png` 保真版、`webp` runtime 版。
- 额外导出 glow mask：同一 sprite 高斯模糊后作为低成本发光层。

### 4. 角色资源

当前角色 sheet 更适合作为参考，不建议直接把整张 sheet 放进 runtime。要达到灵感图级别，可以走两条路：

- 低成本：裁切半身像，眼睛/嘴/手部局部用 Canvas 覆盖动画。
- 高质量：继续生成分层 PSD/Live2D 参考，拆出头发前后层、脸、眼、嘴、手、饰品、衣服、光环。

如果坚持 Canvas 2D，不用 Live2D 也可以做“假 Live2D”：

- 头发前层 `sin` 轻摆。
- 眼睛独立图层 4-7s 随机眨眼。
- 饰品独立图层延迟摆动。
- 身体整体 `translateY ±2px` 呼吸。
- 手部 hover 时发光屏幕增强。

### 5. UI/VFX

UI/VFX 图集主要给视觉方向。真正实现时建议：

- 结果面板：HTML overlay + CSS/PNG 边框九宫格。
- hover halo / press ripple / burst：Canvas 程序化更灵活。
- gold star particles：程序化粒子即可，贴图只做星形 sprite。
- scan line：Canvas 画线，比位图更省。

## 用 gpt-image-2 批量重跑

本环境检查到 `OPENAI_API_KEY` 未设置，所以本轮使用了内置生图能力，并把成品复制到 `docs/`。如果你要走可控的 CLI `gpt-image-2`，设置好 key 后可以运行：

```powershell
python C:\Users\Luiz\.codex\skills\.system\imagegen\scripts\image_gen.py generate-batch `
  --input docs\canvas-art-assets\prompts\image2-prompts.jsonl `
  --out-dir docs\canvas-art-assets\raster\image2-cli-rerun `
  --concurrency 3 `
  --force
```

建议第一轮用 `quality=medium` 看方向，定稿再改 `prompts/image2-prompts.jsonl` 里的 `quality` 为 `high`。

## 如何找到或生产同级别游戏美术资源

### AI 生成

关键词要按“游戏资源管线”写，而不是“画一个 UI”：

- `premium 2D anime game background art`
- `gacha game event screen polish`
- `high-fidelity interactive prop atlas`
- `cyberpunk occult fortune-telling booth`
- `separated sprite atlas, generous spacing`
- `background plate, no main character, central area clear`
- `character sheet, expression insets, accessory details`
- `VFX atlas, hover halo, press ripple, reveal burst`

避免词：

- `flat vector`
- `simple icon`
- `minimal`
- `web UI mockup`
- `logo`
- `readable text`

### 外包或素材站

如果要找真人画师/资源，按这些包采购：

- `Key Art / Splash Art`：一张主视觉。
- `Environment Background Plate`：无角色背景。
- `Prop Sprite Atlas`：所有互动道具分层。
- `Character Bust + Expressions`：角色半身和表情。
- `UI/VFX Atlas`：面板、按钮、粒子贴图。

交付格式要求：

- PSD/Clip Studio 源文件，图层命名清楚。
- PNG transparent sprites。
- 2x runtime 尺寸，关键资产至少 2048px 长边。
- 单独 glow/emissive 层。
- 不要把文字烘焙进关键道具，文字由 HTML/Canvas 绘制。

## 如何达到交互 Spec 的细节

### 分层架构

```text
HTML overlay        结果弹窗、输入表单、分享按钮
Main Canvas 60fps   水晶球、塔罗、道具、角色、前景 VFX
BG Canvas 10fps     远景鱼、代码雨、霓虹呼吸
OffscreenCanvas     background plate、静态灯牌底图
```

### 状态机

每个互动元素至少有这些状态：

```ts
type VisualState =
  | 'idle'
  | 'hover'
  | 'press'
  | 'loading'
  | 'revealed'
  | 'disabled';
```

水晶球主流程单独用四幕：

```ts
type DivinationPhase =
  | 'idle'
  | 'setup'
  | 'buildup'
  | 'climax'
  | 'resolution'
  | 'done';
```

对应时间：

- setup：0-300ms，按下回弹、涟漪。
- buildup：300-2200ms，卡牌飞入、粒子加速、机械臂伸出。
- climax：2200-2400ms，200ms 冻结和白闪。
- resolution：2400-4500ms，选牌翻开、文字逐字浮现、金色星光。

### 素材和程序的分工

| 效果       | 资源负责             | Canvas 负责                |
| ---------- | -------------------- | -------------------------- |
| 背景精细度 | background plate     | 呼吸、视差、暗角、代码雨   |
| 水晶球质感 | orb sprite/glow mask | 内部雾气旋转、粒子、涟漪   |
| 塔罗牌细节 | card sprites         | hover 3D tilt、飞入、翻牌  |
| 八卦盘     | sprite               | 20s/8s 旋转、hover 金边    |
| 手相面板   | sprite               | 扫描线、三线依次点亮       |
| 猫         | sprite               | 眨眼、尾巴摆动、点击彩蛋   |
| 机械臂     | sprite 分段          | build-up 伸出、触碰球体    |
| 结果面板   | UI atlas / HTML      | 文本、按钮、状态、可访问性 |

### 性能策略

- 背景 plate 不要每帧重绘复杂滤镜。
- 高光和阴影优先用预烘焙 glow mask。
- 主循环只做 `transform/alpha/drawImage` 和少量粒子。
- 粒子按设备分档：低端 50，中端 120，高端 burst 300。
- `prefers-reduced-motion` 下关闭 glitch、爆发粒子、鼠标拖尾，保留核心点击和结果揭示。

## 下一步建议

1. 先用 `cyberoracle-background-plate-v2.png` + `cyberoracle-prop-atlas.png` 做一版静态拼图验证构图。
2. 从 prop atlas 裁出水晶球、5 张卡、八卦、手相、签筒、卷轴、猫、机械臂。
3. 把现有 Canvas 类从“程序画形状”改成“drawImage sprite + 程序动效”。
4. 最后补角色分层，不要一开始就做完整 Live2D。
