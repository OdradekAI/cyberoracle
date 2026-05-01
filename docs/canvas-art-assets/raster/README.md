# Raster Image2 Concepts

这一组是面向“游戏化 Canvas 应用”的高精度位图资源，目标是贴近 `docs/inspiration.png` 的精细度，而不是上一版 SVG 占位素材。

## 资源

| 文件                                                     | 用途                                                     | 尺寸      |
| -------------------------------------------------------- | -------------------------------------------------------- | --------- |
| `image2-concepts/cyberoracle-master-key-art.png`         | 主视觉基准图，用来锁定整体美术方向、光照和材质密度       | 1672x941  |
| `image2-concepts/cyberoracle-background-plate-v2.png`    | 可直接作为 L0/L1 背景底板，中央区域留给水晶球和角色/道具 | 1672x941  |
| `image2-concepts/cyberoracle-prop-atlas.png`             | 可人工裁切的高精度互动道具图集                           | 1672x941  |
| `image2-concepts/cyberoracle-oracle-character-sheet.png` | 占卜师角色设定与表情/局部参考                            | 1536x1024 |
| `image2-concepts/cyberoracle-ui-vfx-atlas-v2.png`        | 结果面板、hover/press/VFX 视觉方向图集                   | 1672x941  |

## 重要说明

- 这些是概念级生产资源，不是已经透明抠图的最终 runtime sprite。
- 真正上线前建议走一次“裁切 + 抠图 + 边缘修复 + WebP/PNG 导出”的资产处理流程。
- 当前项目技术栈完全可以承载这种视觉质量：Canvas 负责调度、交互、粒子和状态机；高精度美术由位图 sprite 提供。
