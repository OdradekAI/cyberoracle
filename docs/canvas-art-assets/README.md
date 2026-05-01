# CyberOracle Canvas Game Art Assets

这是 `docs/inspiration.png` 对应的高精度游戏美术资源包。当前主线资源是 `raster/` 下的位图概念图、背景 plate、道具 atlas、角色 sheet 和 UI/VFX atlas。

旧的 SVG 占位素材已经移除，避免和最终美术资源混淆。

## 推荐阅读顺序

1. `IMAGE2_PRODUCTION_SPEC.md`：完整说明为什么用位图游戏资产、如何用 image2/AI 生成、如何达到交互 spec。
2. `DYNAMIC_EFFECT_TECH_PLAN.md`：把这些图做成动态交互应用的工程方案。
3. `ART_ASSET_PRODUCTION_PLAN.md`：面向美术新手的资源制作、裁切、抠图、配置和资源站方案。
4. `art-assets-harness.json`：按 harness/feature-list 风格整理的美术资源生产清单。
5. `generated/README.md`：按 harness 新生成的 raw art sheets 说明。
6. `generated/generated-art-assets-manifest.json`：新生成资源与 harness 的映射。
7. `raster/README.md`：本轮生成的位图资源清单。
8. `raster/raster-asset-manifest.json`：runtime 用途与资源角色。
9. `raster/crop-guide.json`：从 prop atlas 裁切互动 sprite 的第一版坐标。
10. `prompts/image2-prompts.jsonl`：可用 `gpt-image-2` CLI 批量重跑的 prompt。

## 当前目录结构

```text
docs/canvas-art-assets/
  ART_ASSET_PRODUCTION_PLAN.md
  DYNAMIC_EFFECT_TECH_PLAN.md
  IMAGE2_PRODUCTION_SPEC.md
  README.md
  art-assets-harness.json
  generated/
    README.md
    generated-art-assets-manifest.json
    raw/
      background-plate-v2.png
      interactive-prop-atlas-v2.png
      oracle-character-layer-sheet-v2.png
      ui-vfx-atlas-v2.png
      cyber-cat-sprite-sheet-v1.png
      neon-signage-atlas-v1.png
  prompts/
    image2-prompts.jsonl
  raster/
    README.md
    raster-asset-manifest.json
    crop-guide.json
    image2-concepts/
      cyberoracle-master-key-art.png
      cyberoracle-background-plate-v2.png
      cyberoracle-prop-atlas.png
      cyberoracle-oracle-character-sheet.png
      cyberoracle-ui-vfx-atlas-v2.png
  tokens/
    color-tokens.json
    motion-tokens.json
```

## 实现方向

不要用 Canvas 纯程序绘制来追求灵感图精细度。正确路线是：

- 背景、角色、道具、UI/VFX 使用高分辨率位图资源。
- Canvas 负责 `drawImage`、分层、状态机、hover/press、翻牌、粒子、遮罩和 reduced-motion。
- HTML overlay 负责结果面板、表单、按钮和分享操作。
