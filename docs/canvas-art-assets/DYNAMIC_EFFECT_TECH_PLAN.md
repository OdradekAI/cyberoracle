# 赛博玄学馆 Canvas 动态效果技术方案

本文说明如何把 `raster/image2-concepts/` 里的高精度位图资源做成动态、可交互的游戏化 Canvas 应用。本文只规划技术路线，不要求现在改代码。

## 1. 目标判断

结论：当前项目技术栈可以实现接近 `docs/inspiration.png` 的动态效果，但实现方式必须从“程序画图”切换为“高精度位图 sprite + Canvas 调度”。

当前项目已经具备的基础：

- `apps/web` 使用 Next.js 14 + React + TypeScript。
- 首页直接挂载 `CanvasStage`。
- Canvas 已经拆成背景 canvas 和主 canvas。
- 已有 `OffscreenCanvas` 预渲染静态背景的思路。
- 已有 `HitRegistry` 做命中检测。
- 已有 `CrystalBall`、`TarotGroup`、`NeonSigns`、`BackgroundLayer0` 这些实体雏形。
- 已有水晶球点击后的 `idle/setup/buildup/climax/resolution/done` 状态机。

主要短板：

- 画面精细度来自程序绘制的渐变、线条、文字和简单几何，无法达到灵感图的材质密度。
- 背景、角色、道具、UI 面板还没有被当作“游戏资产”加载和分层。
- 现有实现更像动态 demo，不是完整的 sprite runtime。
- 后续需要注意中文文本编码和字体渲染，避免运行画面出现乱码。

## 2. 推荐架构

保持现有 Canvas 方向，但把渲染职责调整为下面结构：

```text
HTML overlay
  结果弹窗、表单、上传、分享按钮、无障碍文本

Main Canvas 60fps
  角色、道具、水晶球、塔罗、点击反馈、前景 VFX

Background Canvas 10-20fps
  背景 plate、远景霓虹、代码雨、远景鱼、低频粒子

OffscreenCanvas
  静态背景 plate、预烘焙辉光、暗角、固定装饰
```

运行时不要每帧重新绘制复杂美术。每帧主要做这些轻量操作：

- `drawImage(sprite, x, y, w, h)`
- `ctx.globalAlpha`
- `ctx.translate/rotate/scale`
- 少量粒子圆点和线条
- 预烘焙 glow mask 的叠加
- 简单遮罩和裁切

## 3. 资源到 runtime 的映射

| 当前资源                                 | runtime 用法    | 备注                                                 |
| ---------------------------------------- | --------------- | ---------------------------------------------------- |
| `cyberoracle-background-plate-v2.png`    | L0/L1 背景底图  | 优先转 WebP，OffscreenCanvas 绘制一次                |
| `cyberoracle-prop-atlas.png`             | 裁成独立 sprite | 水晶球、塔罗、八卦、手相、猫、签筒、卷轴、机械臂、鱼 |
| `cyberoracle-oracle-character-sheet.png` | 角色分层参考    | 需要二次生成或手工拆层，不建议整张直接上 runtime     |
| `cyberoracle-ui-vfx-atlas-v2.png`        | 裁 UI/VFX 贴图  | 面板框、辉光、星光、扫描线、爆发环                   |
| `cyberoracle-master-key-art.png`         | 视觉验收基准    | 不建议直接当最终可交互背景                           |

建议未来 runtime 目录：

```text
apps/web/public/canvas-assets/
  backgrounds/
    cyber-booth-bg@1x.webp
    cyber-booth-bg@2x.webp
  sprites/
    crystal-orb.webp
    crystal-orb-glow.webp
    tarot-card-01.webp
    tarot-card-01-back.webp
    bagua-dial.webp
    palm-panel.webp
    cyber-cat-body.webp
    cyber-cat-eyes-open.webp
    cyber-cat-eyes-blink.webp
    fortune-stick-love.webp
    fortune-stick-career.webp
    fortune-stick-money.webp
    poem-scroll.webp
    robo-arm-upper.webp
    robo-arm-lower.webp
  vfx/
    halo-soft.webp
    ripple-ring.webp
    gold-star.webp
    scan-line.webp
  manifest.json
```

现在先保留在 `docs/` 里做生产规格，等实现阶段再复制到 `public/`。

## 4. 核心技术模块

### 4.1 AssetLoader

后续需要一个统一加载器，负责：

- 预加载所有首屏 sprite。
- 解码图片后缓存 `HTMLImageElement` 或 `ImageBitmap`。
- 区分首屏必需资源和延迟资源。
- 失败时回退到低保真占位图。

建议首屏必需：

- 背景 plate
- 水晶球
- 5 张塔罗背面
- 猫
- 三个签筒
- 八卦
- 手相面板
- 基础 VFX

角色分层和复杂 UI 可以延迟加载。

### 4.2 SpriteEntity

每个可动画对象都应该统一成类似数据结构：

```ts
type VisualState =
  | 'idle'
  | 'hover'
  | 'press'
  | 'loading'
  | 'revealed'
  | 'disabled';

interface SpriteEntity {
  id: string;
  imageId: string;
  x: number;
  y: number;
  anchorX: number;
  anchorY: number;
  scale: number;
  rotation: number;
  alpha: number;
  zIndex: number;
  hitShape: 'rect' | 'circle' | 'ellipse' | 'none';
  state: VisualState;
}
```

这样水晶球、塔罗、猫、签筒都能复用一套 hover/press/idle 基础逻辑。

### 4.3 Timeline

现有水晶球已经有四幕状态机，建议扩展成可复用时间轴：

```text
0-300ms      setup       点击反馈，水晶球内陷回弹，第一圈波纹
300-2200ms   buildup     卡牌飞入，粒子增多，机械臂伸出，环境光向中心收束
2200-2400ms  climax      200ms 凝滞，白闪，选中卡牌
2400-4500ms  resolution  翻牌，结果文字逐字出现，金色星光
```

关键点：不要把这段做成普通 loading。用户要看到“仪式正在发生”。

### 4.4 HitRegistry 继续保留

当前 `HitRegistry` 方向正确。后续从 `crop-guide.json` 或 runtime `manifest.json` 生成 hitbox：

- 水晶球：circle
- 塔罗：rect
- 八卦：circle
- 手相面板：rect
- 猫：ellipse
- 签筒：rect
- 卷轴：rect

命中区域可以比视觉区域稍大 8-12px，让交互更舒服。

## 5. 各元素动态方案

### 5.1 背景 plate

资源：`cyberoracle-background-plate-v2.png`

动态方式：

- 背景本体不动或做极小视差，移动量不超过 8px。
- 叠加暗角，保证中心水晶球最高亮。
- 远景霓虹用低频 alpha 呼吸，周期 4-8s。
- 远景鱼用单独 sprite 慢速横移，速度 8-20px/s。
- 代码雨继续程序绘制，透明度控制在 20%-45%。

注意：背景不能抢过中心。边缘霓虹峰值亮度不要高过水晶球谷值。

### 5.2 水晶球

资源：

- `crystal-orb-large` 裁切 sprite
- 额外导出 `crystal-orb-glow`
- 额外导出内部雾气 mask 或直接程序绘制

动态：

- idle：整体 `scale 1.00-1.015` 呼吸，周期 2s。
- hover：`scale 1.05`，glow alpha 增强，球内雾气跟随鼠标偏移。
- press：50ms 内 `scale 0.95`，随后回弹。
- buildup：内部雾气旋转加速，底座粒子增多。
- climax：冻结 200ms。
- resolution：选中卡牌飞到球前，球体亮度回落。

实现重点：

- 水晶球外观用位图，内部光雾和粒子用程序。
- 玻璃高光可以用半透明白色渐变或单独高光 sprite。
- 低端设备关闭内部雾气旋转，只保留 alpha 呼吸。

### 5.3 塔罗牌

资源：

- 5 张牌背
- 5 张牌正面，或一张正面模板 + Canvas 绘制牌名/结果
- glow mask

动态：

- idle：每张错峰上下浮动 4px，轻微旋转 ±2 度。
- hover：当前牌上移 12px，放大 1.1，其他牌暗化到 70%。
- click：300ms 翻牌，使用 `scaleX` 从 1 到 0 再到 1。
- buildup：5 张牌依次飞向水晶球上方，形成牌阵。
- climax：非选中牌降到 20% alpha，选中牌高亮。

建议：卡牌的图案细节用位图，不要用 Canvas 画复杂纹样。

### 5.4 八卦盘

资源：`bagua-dial`

动态：

- idle：20s 一圈，低速旋转。
- hover：8s 一圈，金色描边或 glow alpha 增强。
- click：进入八字输入 overlay。

技术上只需要 `rotate`，不要重绘八卦线条。

### 5.5 手相面板

资源：`palm-panel`

动态：

- idle：面板自身轻微呼吸。
- hover：掌纹三条线依次亮起。
- scan：一条横向扫描线从上到下移动，约 1.2s。
- click：进入上传手掌照片流程。

掌纹发光可以用程序线条叠在位图上，也可以额外导出 `palm-lines-glow.webp`。

### 5.6 猫和签筒

资源：

- 猫身体
- 猫眼睛开/闭/特殊表情，最好单独图层
- 三个签筒
- 单支飞出的签

动态：

- 猫 idle：身体上下 2px，尾巴摆动如果没有分层就只做整体轻微旋转。
- 猫眨眼：每 4-8s 随机一次，用眼睛贴图切换。
- 猫 hover：头部轻微倾斜，眼睛发亮。
- 猫 click：签筒晃动，飞出一支签，弹出签文。
- 签筒 idle：筒内光柱 alpha 呼吸。
- 签筒 hover：对应标签发亮，筒身上移 4px。

如果暂时没有分层猫，就先做整体 transform，不要硬画尾巴骨骼。

### 5.7 卷轴和机械臂

卷轴：

- idle：边缘金色流光。
- hover：展开 5%-10%，提示可点。
- click：展开到结果面板，文字由 HTML overlay 或 Canvas 绘制。

机械臂：

- 最好拆成上臂、下臂、手爪三段。
- buildup 的 1800-2200ms 伸向水晶球。
- 触碰瞬间触发水晶球波纹和全局冻结。

如果只有整张机械臂 sprite，也可以先用 `translateX` 伸出，后续再拆层。

### 5.8 占卜师角色

短期低成本：

- 使用半身角色 sprite。
- 叠加眼睛开/闭图层。
- 整体上下浮动 2px。
- 头饰光环单独旋转。
- 点击角色显示寄语气泡。

中期质量方案：

- 让 AI 或画师输出分层 PSD。
- 拆出：身体、脸、前发、后发、左右眼、嘴、手、饰品、光环、衣服高光。
- Canvas 做“假 Live2D”：局部图层错峰位移和旋转。

长期桌面端方案：

- Tauri 客户端走 Live2D。
- Web 首页只保留轻量 Canvas 角色。

## 6. 实施路线

### M0：美术生产准备

产出：

- 从 prop atlas 裁出首批 sprite。
- 抠透明背景。
- 导出 PNG 原档和 WebP runtime 版本。
- 建立 `manifest.json`，记录 anchor、hitbox、layer、scale。

验收：

- 静态拼图能接近灵感图构图。
- 中心水晶球、卡牌、猫、签筒、八卦、手相、卷轴都可独立摆放。

### M1：静态 sprite 替换

目标：

- 背景 plate 替换程序背景。
- 水晶球、塔罗、八卦、猫、签筒从程序绘制替换为 `drawImage`。
- 保留现有命中检测和状态机。

验收：

- 首屏即使不动，也像游戏主界面，而不是程序 demo。

### M2：核心占卜四幕

目标：

- 水晶球点击完整四幕。
- 塔罗飞入、冻结、选中、翻开。
- 粒子爆发和白闪。
- 结果 overlay 出现。

验收：

- 静音录屏也能看出“开始、酝酿、高潮、揭晓”。

### M3：9 个交互入口

目标：

- 水晶球、塔罗、猫、三个签筒、八卦、手相、卷轴都可 hover/click。
- 每个入口都有不同反馈，不是所有东西都同样闪。

验收：

- 不看说明，用户能自然发现至少 3 个入口。

### M4：角色、声音、彩蛋

目标：

- 占卜师假 Live2D。
- 猫眨眼和点击彩蛋。
- 基础音效。
- reduced-motion 降级。

验收：

- 中端手机保持 30fps。
- 桌面端 60fps。
- 关闭动效后仍能完成核心流程。

## 7. 性能预算

| 项目           | 目标                                |
| -------------- | ----------------------------------- |
| 首屏图片总量   | WebP 后 3-5MB 内                    |
| 首屏加载       | 2.5s 内可交互                       |
| 主循环         | 桌面 60fps，中端手机 30fps          |
| 常驻粒子       | 低端 40，中端 100，高端 160         |
| 爆发粒子       | 低端 80，中端 180，高端 300         |
| 同屏 blur/glow | 尽量用预烘焙贴图，不实时大面积 blur |

图片尺寸建议：

- 背景：1920 宽 WebP，移动端可 1280 宽。
- 水晶球：512-768px。
- 塔罗：单张 256-384px 高。
- 猫：512-768px 高。
- UI/VFX 小贴图：128-512px。

## 8. 验收方法

技术验收：

- Playwright 截图桌面和移动端。
- 录制 10s 动画，每 0.5s 抽帧检查主次亮度。
- 检查 hover 响应小于 100ms。
- 检查 `prefers-reduced-motion`。
- 模拟慢网，确认背景和核心道具优先出现。

美术验收：

- 眯眼看画面，第一焦点必须是水晶球。
- 第二焦点是占卜师脸和手。
- 其余入口可识别但不抢主焦点。
- 截图和 `docs/inspiration.png` 并排比较：光照密度、材质密度、色彩层次不能差一个等级。

## 9. 风险和建议

| 风险               | 对策                                                     |
| ------------------ | -------------------------------------------------------- |
| AI 图里文字不可控  | 关键文字不要烘焙进贴图，运行时用 Canvas/HTML 绘制        |
| 抠图边缘脏         | 半透明玻璃、鱼尾、头发必须手工修边                       |
| 图片太大           | PNG 保留源文件，runtime 用 WebP；首屏只加载 P0/P1        |
| 所有元素都在闪     | 用频率、相位、亮度分层；边缘元素永远弱于中心             |
| Canvas 代码膨胀    | 先抽 `AssetLoader`、`SpriteEntity`、`Timeline`，再扩元素 |
| Web 和桌面目标混淆 | Web 做试玩和分享，桌面端未来承接 Live2D 和长期陪伴       |

## 10. 最小可行版本

如果只做第一版，优先顺序如下：

1. 背景 plate。
2. 水晶球 sprite + hover + click 四幕。
3. 5 张塔罗 sprite + 飞入 + 翻牌。
4. 粒子和白闪。
5. 结果 overlay。
6. 猫或签筒作为第一个彩蛋入口。

做到这里，产品就会从“会动的网页”进入“有游戏主界面质感”的阶段。
