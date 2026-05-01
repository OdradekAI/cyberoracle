# 赛博玄学馆美术资源生产方案

本文面向美术新手，目标是把 `docs/inspiration.png` 的精细游戏美术风格拆成可生产、可配置、可上线的资源包。

## 1. 先理解：你要做的不是一张图，而是一套游戏资产

灵感图看起来是一张完整插画，但动态交互应用不能直接只用一张图。你需要把它拆成：

1. 背景底板：场景、远景灯牌、空间氛围。
2. 主角角色：占卜师半身，最好分层。
3. 互动道具：水晶球、塔罗、八卦、手相面板、猫、签筒、卷轴、机械臂。
4. UI/VFX：结果面板、辉光、波纹、粒子、扫描线、按钮边框。
5. 程序文字：所有重要中文最好由程序绘制，不要依赖 AI 图里的文字。

一句话：AI 或画师负责“精细材质”，Canvas 负责“让它动起来”。

## 2. 当前已有资源

目录：`docs/canvas-art-assets/raster/image2-concepts/`

| 文件                                     | 用途        | 现在能不能直接用             |
| ---------------------------------------- | ----------- | ---------------------------- |
| `cyberoracle-master-key-art.png`         | 主视觉参考  | 不建议直接上线，只做审美基准 |
| `cyberoracle-background-plate-v2.png`    | 背景底板    | 可以作为第一版背景           |
| `cyberoracle-prop-atlas.png`             | 道具图集    | 需要裁切、抠图、修边后使用   |
| `cyberoracle-oracle-character-sheet.png` | 角色设定    | 需要二次拆层或重画           |
| `cyberoracle-ui-vfx-atlas-v2.png`        | UI/VFX 参考 | 需要裁切成小贴图             |

已经有第一版裁切坐标：

- `docs/canvas-art-assets/raster/crop-guide.json`

这份坐标只能作为起点，最终仍要人工检查边缘和透明度。

## 3. 新手工具选择

免费优先：

- Photopea：https://www.photopea.com/  
  在线 Photoshop，适合裁切、抠图、导出 PNG/WebP。
- Krita：https://krita.org/  
  免费绘画软件，适合手工修边、补画。
- GIMP：https://www.gimp.org/  
  免费图像编辑，适合抠图和批处理。
- remove.bg：https://www.remove.bg/  
  快速抠图，适合猫、道具，但玻璃和半透明边缘要人工修。
- Upscayl：https://www.upscayl.org/  
  免费本地 AI 放大，适合把低分辨率 sprite 放大后再修。

付费或更专业：

- Photoshop：最稳的裁切、蒙版、修边工具。
- Clip Studio Paint：适合二次绘制角色和道具。
- Topaz Gigapixel：高质量放大。
- Aseprite：更偏像素，不是本项目首选。

## 4. 制作流程总览

```text
确定风格
  ↓
生成/收集 key art
  ↓
生成 background plate
  ↓
生成 prop atlas
  ↓
裁切每个道具
  ↓
抠透明背景
  ↓
修边和补画
  ↓
导出 PNG 原档 + WebP runtime
  ↓
写 manifest
  ↓
放进 Canvas 做动态
```

不要跳过“修边”。AI 生成图最大的问题不是整体不好看，而是局部边缘、半透明玻璃、文字、手指和复杂装饰容易脏。

## 5. 裁切规范

### 5.1 命名

统一小写 kebab-case：

```text
crystal-orb.png
crystal-orb-glow.png
tarot-card-01-front.png
tarot-card-01-back.png
bagua-dial.png
palm-panel.png
cyber-cat-body.png
cyber-cat-eyes-open.png
fortune-stick-love.png
poem-scroll.png
robo-arm-upper.png
```

不要用：

- `image1.png`
- `最终版.png`
- `new-new-final.png`
- 中文文件名

### 5.2 尺寸

| 类型       | 源文件建议      | runtime 建议         |
| ---------- | --------------- | -------------------- |
| 背景       | 2560px 宽或更高 | 1920px / 1280px WebP |
| 水晶球     | 1024px          | 512-768px WebP       |
| 塔罗单张   | 768px 高        | 256-384px 高 WebP    |
| 猫         | 1024px 高       | 512-768px 高 WebP    |
| 签筒/卷轴  | 768-1024px      | 384-768px WebP       |
| VFX 小贴图 | 512px           | 128-512px WebP/PNG   |

保留一份高清 PNG 源文件，不要只留压缩后的 WebP。

### 5.3 留白

每个 sprite 边缘留 8-24px 透明边距：

- 防止 glow 被裁掉。
- 防止旋转时切边。
- 防止 hover 放大时露出硬边。

水晶球和发光道具建议留更多，约 32-64px。

### 5.4 锚点

每个 sprite 都要记录 anchor：

- 水晶球：`[0.5, 0.73]`，中心偏下，因为底座也在图里。
- 塔罗牌：`[0.5, 0.5]`。
- 签筒：`[0.5, 0.82]`，底部站在桌面上。
- 猫：`[0.5, 0.78]`，身体落点。
- 机械臂：看伸出方向，通常在肩部/关节处。

anchor 是程序旋转、缩放、定位的基准，非常重要。

## 6. 抠图和修边教程

### 6.1 Photopea 快速流程

1. 打开 Photopea。
2. `File > Open` 选择 `cyberoracle-prop-atlas.png`。
3. 用矩形选择工具框出目标道具。
4. `Image > Crop` 或复制到新文件。
5. 用 `Select > Magic Cut` 初步抠图。
6. 放大到 200%-400% 检查边缘。
7. 用橡皮擦或蒙版修掉残留背景。
8. 半透明发光边不要全擦干净，保留自然柔边。
9. `File > Export As > PNG` 导出透明 PNG。
10. 再导出一份 WebP 给 runtime。

### 6.2 哪些地方必须手工修

- 水晶球玻璃边缘。
- 发光鱼的尾巴。
- 猫毛边缘和胡须。
- 占卜师头发。
- 机械臂小零件之间的暗缝。
- 卷轴流苏。
- 塔罗牌金色细线。

自动抠图很容易把这些区域抠坏。修边时宁可保留一点柔光，也不要切出锯齿。

### 6.3 Glow mask 怎么做

很多动效不应该实时 `shadowBlur`，可以提前做 glow mask：

1. 复制 sprite 图层。
2. 把复制层调成单色，比如紫色 `#A855F7` 或青色 `#22D3EE`。
3. 高斯模糊 12-32px。
4. 降低透明度到 40%-70%。
5. 单独导出为 `xxx-glow.png`。

运行时先画 glow，再画本体：

```text
draw glow, alpha 0.4-0.9
draw sprite, alpha 1
```

这样性能更稳，也更接近游戏资源做法。

## 7. 分层建议

### 7.1 水晶球

最低配置：

- `crystal-orb.png`
- `crystal-orb-glow.png`

更好配置：

- `crystal-orb-base.png`
- `crystal-orb-glass-highlight.png`
- `crystal-orb-inner-mask.png`
- `crystal-orb-glow.png`
- `crystal-orb-stand.png`

程序负责内部雾气、粒子、波纹。

### 7.2 塔罗牌

最低配置：

- `tarot-card-01-back.png` 到 `tarot-card-05-back.png`
- `tarot-card-front-template.png`

更好配置：

- 每张牌正反面独立。
- 牌面文字由程序写。
- 额外导出 `tarot-card-glow.png`。

### 7.3 猫

最低配置：

- `cyber-cat-body.png`

更好配置：

- `cyber-cat-body.png`
- `cyber-cat-eyes-open.png`
- `cyber-cat-eyes-blink.png`
- `cyber-cat-eyes-happy.png`
- `cyber-cat-tail.png`
- `cyber-cat-collar-glow.png`

如果能拆尾巴，就可以做更自然的摆动。

### 7.4 占卜师

最低配置：

- `oracle-bust.png`
- `oracle-eyes-open.png`
- `oracle-eyes-closed.png`

推荐配置：

- `oracle-body.png`
- `oracle-head.png`
- `oracle-front-hair.png`
- `oracle-back-hair.png`
- `oracle-eye-left-open.png`
- `oracle-eye-left-closed.png`
- `oracle-eye-right-open.png`
- `oracle-eye-right-closed.png`
- `oracle-mouth-neutral.png`
- `oracle-mouth-smile.png`
- `oracle-hand-left.png`
- `oracle-hand-right.png`
- `oracle-headgear-ring.png`
- `oracle-accessories.png`

这套能做“假 Live2D”。未来桌面端如果上 Live2D，需要画师直接交付 Live2D 分层 PSD。

### 7.5 机械臂

推荐拆成：

- `robo-arm-base.png`
- `robo-arm-upper.png`
- `robo-arm-lower.png`
- `robo-arm-hand.png`
- `robo-arm-joint-glow.png`

这样 buildup 时能让机械臂伸向水晶球，而不是整张平移。

## 8. Manifest 配置

每个 sprite 都需要配置基本数据。建议未来格式：

```json
{
  "id": "crystal-orb",
  "src": "sprites/crystal-orb.webp",
  "glow": "sprites/crystal-orb-glow.webp",
  "naturalSize": [768, 768],
  "anchor": [0.5, 0.73],
  "layer": "L2-main",
  "hit": {
    "type": "circle",
    "cx": 0.5,
    "cy": 0.36,
    "r": 0.31
  },
  "defaultTransform": {
    "xRatio": 0.5,
    "yRatio": 0.58,
    "scaleDesktop": 1,
    "scaleMobile": 0.72
  }
}
```

新手理解：

- `src`：图片在哪里。
- `anchor`：图片的“脚”或“中心”在哪里。
- `layer`：画在第几层。
- `hit`：鼠标点击区域。
- `defaultTransform`：默认放屏幕哪里。

## 9. AI 生成资源的方法

### 9.1 生成顺序

不要一上来就生成很多单独小图。顺序应该是：

1. 生成主视觉 key art，确定风格。
2. 生成无角色背景 plate。
3. 生成 prop atlas，所有道具分开放。
4. 针对单个不满意道具重新生成。
5. 生成角色 sheet。
6. 生成 UI/VFX atlas。
7. 裁切和人工修边。

### 9.2 Prompt 写法

写 prompt 时要像给游戏美术外包下单，而不是像“画一张网页图”。

好关键词：

```text
premium 2D anime game art
cyberpunk occult fortune telling booth
high fidelity prop sprite atlas
separated objects with generous spacing
transparent background preferred
game UI VFX atlas
emissive glow, glass material, metallic details
no readable text, symbols only
front view, clean silhouette
```

避免关键词：

```text
flat vector
simple icon
minimal
web UI mockup
logo
low detail
readable Chinese text
```

原因：AI 生成文字容易错，重要文字应该由程序绘制。

### 9.3 可直接复用的 prompt 模板

背景 plate：

```text
Premium 2D anime game background plate, cyberpunk occult fortune telling booth at night, neon purple and cyan lighting, dense futuristic city details, hanging lanterns, holographic signs, wet reflective table, central area intentionally clear for a crystal orb and character overlay, no main character, no readable text, high fidelity environment art, game event screen polish, 16:9.
```

道具 atlas：

```text
High fidelity 2D game prop sprite atlas for a cyberpunk occult fortune telling game, separated objects with generous spacing on a dark plain background: glowing crystal orb on mechanical base, five ornate tarot cards, neon bagua yin-yang dial, holographic palm reading panel, cyber black cat, three fortune stick jars, ancient AI poem scroll, segmented robotic arm, two holographic data fish, premium gacha game asset quality, emissive purple cyan gold glow, clean silhouettes, no readable text.
```

角色 sheet：

```text
Anime cyberpunk fortune teller character sheet, white hair oracle girl, mysterious gentle expression, purple eyes, mechanical halo headpiece, occult talisman accessories, black and violet outfit, front bust view plus expression insets, separated details for eyes hair hands accessories, premium Live2D-ready game character design, clean layer-friendly shapes, no readable text.
```

UI/VFX atlas：

```text
Game UI and VFX atlas for cyberpunk occult fortune telling app, transparent-style assets on dark background: result panel frame, neon tooltip frame, hover halo, press ripple, reveal burst, gold star particles, scan line, energy ring, purple cyan gold color palette, premium 2D game polish, clean separated assets, no readable text.
```

### 9.4 使用当前 prompt 文件

已有文件：

- `docs/canvas-art-assets/prompts/image2-prompts.jsonl`

如果本地配置了 `OPENAI_API_KEY`，可以用 CLI 重新批量生成：

```powershell
python C:\Users\Luiz\.codex\skills\.system\imagegen\scripts\image_gen.py generate-batch `
  --input docs\canvas-art-assets\prompts\image2-prompts.jsonl `
  --out-dir docs\canvas-art-assets\raster\image2-cli-rerun `
  --concurrency 3 `
  --force
```

建议流程：

- 第一轮用中等质量看方向。
- 选中方向后提高质量。
- 每次只改 1-2 个关键词，否则不知道是哪句话起了作用。
- 生成结果不要马上上线，必须裁切和修边。

## 10. 素材网站

### 10.1 游戏资产

- itch.io Game Assets：https://itch.io/game-assets  
  适合找 sprite、UI、VFX，有免费也有付费。
- Unity Asset Store：https://assetstore.unity.com/  
  适合找 VFX、UI、背景参考。注意 Web 项目使用授权。
- Unreal Marketplace / Fab：https://www.fab.com/  
  更偏 3D，但可找概念参考和 VFX。
- GameDev Market：https://www.gamedevmarket.net/  
  游戏 UI、道具包较多。
- CraftPix：https://craftpix.net/  
  2D 游戏素材包，质量参差但适合学习拆包结构。

### 10.2 插画和外包

- ArtStation：https://www.artstation.com/  
  找高质量参考和画师。
- Behance：https://www.behance.net/  
  找 UI/VFX、游戏视觉参考。
- Fiverr：https://www.fiverr.com/  
  找海外画师，适合小额试单。
- Upwork：https://www.upwork.com/  
  找长期自由职业者。
- 米画师：https://www.mihuashi.com/  
  国内约稿平台，适合角色和立绘。

### 10.3 图标、UI 和灵感

- Figma Community：https://www.figma.com/community  
  找 UI 框架和霓虹风参考。
- LottieFiles：https://lottiefiles.com/  
  可找动效灵感，但本项目核心还是 Canvas。
- Pinterest：https://www.pinterest.com/  
  找 moodboard，但注意版权，只做参考。

### 10.4 音效

- Freesound：https://freesound.org/  
  免费音效，注意 CC 授权。
- Sonniss GDC bundles：https://sonniss.com/gameaudiogdc  
  游戏音效包。
- ZapSplat：https://www.zapsplat.com/  
  UI、魔法、机械音效较多。
- Kenney Assets：https://kenney.nl/assets  
  免费游戏素材，风格偏简洁，可用于占位。

## 11. 外包下单清单

如果找画师，不要只说“帮我画一张赛博算命图”。应该这样拆：

```text
项目：赛博玄学馆互动 Canvas 游戏界面
风格：参考 docs/inspiration.png，紫/青/品红霓虹，2D anime game art，精细材质

需要交付：
1. 16:9 主视觉 key art，3840x2160
2. 无角色背景 plate，3840x2160
3. prop atlas：水晶球、5 张塔罗、八卦、手相面板、猫、3 个签筒、卷轴、机械臂、鱼
4. 角色半身分层 PSD：身体、头、头发、眼睛、嘴、手、饰品、光环
5. UI/VFX atlas：面板框、辉光、波纹、星光、扫描线

格式：
- PSD/Clip Studio 源文件
- 透明 PNG sprites
- 单独 glow/emissive 图层
- 不要把重要文字烘焙进图里
- 图层命名英文，清晰可读
```

验收时检查：

- 是否有源文件。
- 是否真分层，而不是一张图塞进 PSD。
- 是否有透明 PNG。
- 是否有足够边距。
- 是否有版权说明和商用授权。

## 12. 还需要补充什么

当前缺少的生产级资源：

- 已抠透明背景的水晶球 sprite。
- 水晶球 glow mask 和玻璃高光层。
- 5 张塔罗的正反面 runtime 图。
- 八卦盘透明 sprite。
- 手相面板透明 sprite 和掌纹 glow 层。
- 猫的分层：身体、眼睛、尾巴、颈圈 glow。
- 三个签筒透明 sprite 和单支飞签。
- 卷轴展开前/展开后两态。
- 机械臂分段 sprite。
- 占卜师分层半身。
- UI 结果面板九宫格边框。
- 粒子小贴图：星光、菱形光、烟雾点。
- 音效：hover、press、翻牌、水晶球启动、结果揭晓、猫叫、机械臂。

## 13. 新手每日工作流

第一天：

- 看 `inspiration.png` 和 `cyberoracle-master-key-art.png`，确定喜欢哪种构图。
- 用 `cyberoracle-background-plate-v2.png` 做背景候选。
- 从 `cyberoracle-prop-atlas.png` 裁出水晶球和 5 张塔罗。

第二天：

- 抠水晶球、塔罗、八卦、猫。
- 导出透明 PNG。
- 做 glow mask。

第三天：

- 抠签筒、卷轴、手相面板、机械臂。
- 检查所有边缘。
- 建立第一版 manifest。

第四天：

- 做一张静态拼图，把所有 sprite 摆回接近灵感图的位置。
- 和灵感图并排看焦点是否一致。
- 调整尺寸和亮度。

第五天：

- 补缺失资源。
- 生成第二轮 AI 单体道具。
- 开始交给工程做 sprite 动态接入。

## 14. 最重要的审美规则

- 中心水晶球永远最亮。
- 占卜师脸和手是第二焦点。
- 猫和签筒是可爱入口，但不能抢主角。
- 背景要密，但中心要干净。
- 重要文字不要用 AI 图生成。
- 每个可点物体都要有 idle 微动，但振幅不能超过 5%。
- 画面同时最多 1-2 个地方强闪。
- 所有 glow 都要服务焦点，不是平均撒满全屏。

做完这些，哪怕你不是专业美术，也能用 AI + 修边 + 规范导出，做出明显高于普通网页插画的游戏化美术资产。
