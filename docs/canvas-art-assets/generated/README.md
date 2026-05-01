# Generated Art Assets

这里存放根据 `art-assets-harness.json` 生成的位图美术资源。当前文件都是 raw production sheets：可作为后续裁切、抠图、修边、分层、导出 runtime WebP 的源素材，还不是最终透明 sprite。

## 文件清单

| 文件                                                 | 对应 harness                                                     | 用途                                                                     |
| ---------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `raw/background-plate-v2.png`                        | `ART-002`                                                        | 早期桌面背景 plate 候选                                                  |
| `raw/interactive-prop-atlas-v2.png`                  | `ART-004` ~ `ART-012`                                            | 水晶球、塔罗、八卦、手相、签筒、卷轴、机械臂、数据鱼综合道具图集         |
| `raw/oracle-character-layer-sheet-v2.png`            | `ART-013`                                                        | 占卜师角色分层 sheet                                                     |
| `raw/ui-vfx-atlas-v2.png`                            | `ART-014` ~ `ART-016`                                            | 结果面板、按钮、hover/press/reveal VFX 图集                              |
| `raw/cyber-cat-sprite-sheet-v1.png`                  | `ART-008`                                                        | 赛博猫主体、表情、尾巴和彩蛋姿态 sheet                                   |
| `raw/neon-signage-atlas-v1.png`                      | `ART-017`                                                        | 霓虹招牌、标签框、灯牌 glow 图集                                         |
| `raw/background-plate-clean-v3.png`                  | `ART-002`, `ART-019`, `ART-020`                                  | 更干净的空中心背景 plate，优先用于第一版静态合成                         |
| `raw/crystal-orb-production-sheet-v1.png`            | `ART-004`, `ART-015`, `ART-016`                                  | 水晶球本体、底座、玻璃高光、内部雾气、辉光和涟漪                         |
| `raw/tarot-deck-sheet-v1.png`                        | `ART-005`                                                        | 塔罗背面、空白正面、选中框和暗化状态                                     |
| `raw/fortune-scroll-sheet-v1.png`                    | `ART-009`, `ART-010`                                             | 签筒、飞签、卷轴闭合/展开态和边缘流光                                    |
| `raw/robo-arm-segment-sheet-v1.png`                  | `ART-011`                                                        | 机械臂底座、关节、臂段、手爪和接触火花                                   |
| `raw/particle-vfx-sheet-v1.png`                      | `ART-015`, `ART-016`                                             | 紫/青/金粒子、星光、雾气、符文环碎片和鼠标拖尾小件                       |
| `raw/bagua-palm-production-sheet-v1.png`             | `ART-006`, `ART-007`                                             | 八卦环、阴阳核心、手相面板、掌纹线、扫描线                               |
| `raw/oracle-dialogue-handscreen-sheet-v1.png`        | `ART-013`, `ART-014`                                             | 占卜师对话气泡、手部光屏、通知面板和情绪符号                             |
| `raw/result-panel-state-sheet-v1.png`                | `ART-014`                                                        | 结果面板、loading/error/success 状态、按钮和分割线                       |
| `raw/mobile-background-portrait-v1.png`              | `ART-002`, `ART-019`, `ART-020`                                  | 9:16 移动端背景 plate，中心竖向留白                                      |
| `raw/ambient-neon-objects-sheet-v1.png`              | `ART-012`, `ART-017`                                             | 灯笼、符纸、链饰、全息面板、数据鱼和环境小件                             |
| `raw/interaction-state-overlays-sheet-v1.png`        | `ART-015`                                                        | 通用交互状态覆盖层；有英文标签，只能裁视觉部分或弃用                     |
| `raw/interaction-overlays-label-free-sheet-v1.png`   | `ART-015`                                                        | 无字版通用交互状态覆盖层，优先用于后续裁切                               |
| `raw/data-fish-ambient-sheet-v1.png`                 | `ART-012`                                                        | 专用全息数据鱼、拖尾、代码粒子和雾气                                     |
| `raw/oracle-expression-hand-sheet-v1.png`            | `ART-013`                                                        | 占卜师表情、眼睛、嘴型和手势补充 sheet                                   |
| `raw/desktop-static-composition-reference-v1.png`    | `ART-020`                                                        | 桌面端最终画面静态合成参考，不作为 runtime 背景                          |
| `raw/mobile-ui-panel-sheet-v1.png`                   | `ART-014`, `ART-019`                                             | 移动端结果面板、按钮、底部操作条和安全区装饰                             |
| `raw/sound-status-icon-sheet-v2.png`                 | `ART-018`, `ART-014`                                             | 音效/状态/工具按钮视觉图标；不是真实音频资源                             |
| `raw/tarot-face-symbol-sheet-v1.png`                 | `ART-005`, `ART-014`, `ART-020`                                  | 高精度塔罗牌面符号和结果卡图案源 sheet                                   |
| `raw/fortune-result-card-illustration-sheet-v1.png`  | `ART-014`, `ART-020`                                             | 结果解读卡插画，用于 reveal 后的运势面板                                 |
| `raw/category-fortune-charm-sheet-v1.png`            | `ART-005`, `ART-009`, `ART-014`                                  | 爱情/事业/财富分类挂饰、徽章、印章和 hover badge                         |
| `raw/failure-reduced-motion-sheet-v1.png`            | `ART-015`, `ART-016`, `ART-019`                                  | 失败、禁用、低动效和降级状态视觉                                         |
| `raw/loading-preloader-ritual-sheet-v1.png`          | `ART-015`, `ART-016`, `ART-019`                                  | 加载环、仪式进度、洗牌 loader、进度条和低动效 loader                     |
| `raw/master-key-art-v1.png`                          | `ART-001`, `ART-020`                                             | 主视觉基准图，用于统一精细度、材质密度和焦点层级，不直接进 runtime       |
| `raw/runtime-layout-guide-label-free-v1.png`         | `ART-003`, `ART-019`, `ART-021`                                  | 无字版布局、锚点、命中区和安全区视觉参考                                 |
| `raw/p0-runtime-sprite-refinement-sheet-v1.png`      | `ART-004`, `ART-005`, `ART-006`, `ART-007`, `ART-014`, `ART-015` | 更干净的 P0 裁切源：水晶球、塔罗、八卦、手相、卡框和辉光                 |
| `raw/oracle-character-refinement-sheet-v1.png`       | `ART-013`                                                        | 更高完成度的占卜师角色分层参考和表情/手势补充                            |
| `raw/mobile-final-composition-reference-v1.png`      | `ART-019`, `ART-020`                                             | 移动端最终构图质量参考，不作为单张 runtime 背景                          |
| `raw/runtime-readiness-qa-contact-sheet-v1.png`      | `ART-003`, `ART-021`                                             | 资源交付检查视觉参考：透明边缘、深浅底、压缩、hitbox、fallback、授权状态 |
| `raw/p1-side-prop-refinement-sheet-v1.png`           | `ART-009`, `ART-010`, `ART-011`, `ART-012`, `ART-014`, `ART-017` | P1 侧边道具精修：签筒、卷轴、机械臂、数据鱼、空白霓虹框                  |
| `raw/ui-nine-slice-refinement-sheet-v1.png`          | `ART-014`                                                        | 更适合九宫格裁切的结果面板、按钮、tooltip、modal、tab 和边角件           |
| `raw/reveal-interaction-vfx-refinement-atlas-v1.png` | `ART-015`, `ART-016`, `ART-019`                                  | reveal、hover、press、scanline、粒子、低动效静态辉光精修 atlas           |
| `raw/cyber-cat-refinement-sheet-v1.png`              | `ART-008`                                                        | 更高完成度的赛博猫表情、尾巴、趴姿、翻肚皮彩蛋和项圈辉光                 |
| `raw/parallax-environment-layer-sheet-v1.png`        | `ART-002`, `ART-012`, `ART-017`, `ART-019`                       | 背景视差和边缘环境层：灯笼、链饰、空白招牌、城市条、代码雨、雾带、暗角   |
| `raw/background-plate-clean-v4.png`                  | `ART-002`, `ART-019`, `ART-020`                                  | 当前最推荐的桌面背景底图候选，中心留白比 v3 更适合叠加 runtime sprites   |

> 备注：`raw/sound-status-icon-sheet-v1.png` 和 `raw/sound-status-icon-sheet-v2.png` 的哈希相同。当前 manifest 使用 `v2`；`v1` 只作为重复备份存在，正式裁切和接入时只选其中一份。

## 推荐使用顺序

1. 先用 `background-plate-clean-v4.png` 做桌面底图，用 `mobile-background-portrait-v1.png` 做移动端底图；`background-plate-clean-v3.png` 保留为备选。
2. P0 交互优先裁 `p0-runtime-sprite-refinement-sheet-v1.png`、`crystal-orb-production-sheet-v1.png`、`tarot-deck-sheet-v1.png`、`interaction-overlays-label-free-sheet-v1.png`。
3. P1 动态补充优先裁 `p1-side-prop-refinement-sheet-v1.png`、`bagua-palm-production-sheet-v1.png`、`data-fish-ambient-sheet-v1.png`、`parallax-environment-layer-sheet-v1.png`。
4. 角色表现裁 `oracle-character-layer-sheet-v2.png` 和 `oracle-expression-hand-sheet-v1.png`，用于假 Live2D 分层。
5. 最后补 polish：`reveal-interaction-vfx-refinement-atlas-v1.png`、`particle-vfx-sheet-v1.png`、`loading-preloader-ritual-sheet-v1.png`、`failure-reduced-motion-sheet-v1.png`、`category-fortune-charm-sheet-v1.png`。
6. 进入工程接入前，用 `runtime-layout-guide-label-free-v1.png` 和 `runtime-readiness-qa-contact-sheet-v1.png` 辅助填写 manifest、检查 hitbox、透明边缘、fallback 和授权记录。

## 裁切与配置方式

1. 用 Photopea / Photoshop / Krita / Aseprite 打开 raw sheet。
2. 每个独立物件裁成透明 PNG，保留源 PNG，再导出 WebP runtime 版本。
3. 发光、粒子、扫描线、涟漪等资源尽量单独导出 `*-glow`、`*-mask` 或 `*-vfx`。
4. 所有中文文案在运行时绘制，不要烘焙进图片。
5. 为每个最终 sprite 记录 `naturalSize`、`anchor`、`hitbox`、`zIndex`、`states`、`motionPreset`。
6. 运行时资源建议登记到未来的 `apps/web/public/canvas-assets/manifest.json`，raw 源文件继续留在 docs 作为制作档。

## 质量备注

- `background-plate-clean-v3.png` 比 v2 更适合 runtime，因为中心留白更稳定。
- `background-plate-clean-v4.png` 比 v3 更适合第一版 runtime 合成：中心更暗、更空，能承托水晶球、占卜师和塔罗牌。
- `interaction-state-overlays-sheet-v1.png` 带英文标签，不建议直接使用；优先用 `interaction-overlays-label-free-sheet-v1.png`。
- `category-fortune-charm-sheet-v1.png` 有少量疑似伪文字纹理，近景使用前需要避开或重绘。
- `desktop-static-composition-reference-v1.png` 只用于构图参考，真实 runtime 必须保持背景、角色、道具、VFX 分层。
- `sound-status-icon-sheet-v2.png` 只解决 UI 图标，不包含真实 OGG/MP3 音效。
- `master-key-art-v1.png` 和 `mobile-final-composition-reference-v1.png` 是高质量参考图，不能偷懒当整张背景直接用；项目目标是分层 Canvas 交互。
- `runtime-layout-guide-label-free-v1.png`、`runtime-readiness-qa-contact-sheet-v1.png` 属于交付说明图，不应打包进首屏 runtime。
- `cyber-cat-refinement-sheet-v1.png` 比早期猫 sheet 更适合做最终猫状态源，但毛发边缘仍需要人工抠图修边。

## 仍需补充

- 透明背景单体 sprites。
- 每个 sprite 的 `anchor`、`hitbox`、`naturalSize` 和状态映射。
- 桌面、平板、移动端 WebP 导出规格。
- OGG/MP3 音效资源。
- 授权记录：生成日期、prompt、模型/工具、使用范围。
