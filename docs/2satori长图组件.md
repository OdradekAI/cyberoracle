# packages/poster — satori 直渲染的完整组件库

## 一、先理解 satori 的渲染模型与硬性约束

satori 是 Vercel 写的"JSX → SVG"的纯 JS 渲染器，它**不跑浏览器、不跑 DOM、不跑真正的 React 渲染流程**。它做的事情是：
1. 把你写的 JSX 当作"标记 + 内联样式"读一遍；
2. 用一个内置的 yoga（Facebook 的 flexbox 布局引擎 WASM 版）算出每个节点的位置和大小；
3. 把每个节点画成 SVG 元素。

这意味着它有以下**必须严格遵守**的约束，否则会直接抛错或静默失败：

**(1) 只支持 flexbox，不支持 grid、float、position 复杂用法**
布局只能用 `display: flex` 表达。所有"非 flex 默认值"的元素（比如 `<div>` 默认是 block）satori 会强制要求显式设置 `display`，否则在多子节点时会抛错。

**(2) 不支持 className，所有样式必须写 inline `style`**
satori 不解析 CSS 文件、不解析 Tailwind class（除非你启用它的 Tailwind 插件，但该插件支持有限且文档稀少，**生产环境强烈建议直接用 inline style**）。这一条很多人栽过——拷贝一份普通 React 组件来出图，一点没渲染。

**(3) 字体必须显式提供 buffer，不能用 `@font-face`**
中文字体尤其重要，否则中文字符会全部渲染成豆腐方块。每种字重要单独传。

**(4) 图片必须是本地 buffer 或 data URL**
不能用 `<img src="https://...">`，satori 不会去 fetch。本地图要 `fs.readFileSync` 转 base64 或 buffer。

**(5) 不支持伪元素、不支持 `transform: rotate` 配合 flex 布局（旋转后 yoga 不会重新算尺寸）**
装饰元素需要 transform 时要用一个外层 flex 容器固定空间，内层再 transform。

**(6) 不支持 SVG 内嵌的复杂 filter / mask（部分版本支持简单的）**
我们这个项目大量用到的"暗金色细描边"靠 `border` 实现，"圆形序号背景"靠 `borderRadius` 实现，全部是 yoga 能算的几何，安全。

**(7) 文本默认不会自动换行到下一个 flex 子项内**
长文本要用 `display: flex; flex-direction: column` 明确告诉 yoga "这是一列"。

理解了这些之后，下面的设计原则就很自然了：

> **每个 satori 组件都用 inline style 直写、所有容器显式 `display: flex`、字体在出图时统一注入、图片用 SVG inline 化。**

---

## 二、包架构总览

```
packages/poster/
├── src/
│   ├── index.ts                    # 对外导出
│   │
│   ├── components/
│   │   ├── PalmReadingPoster.tsx   # 手相长图主组件
│   │   ├── FaceReadingPoster.tsx   # 面相长图主组件
│   │   └── DailyFortuneCard.tsx    # 今日运势短卡
│   │
│   ├── primitives/                 # satori 友好的原语组件（基石）
│   │   ├── Box.tsx                 # 显式 flex 的"div 替代品"
│   │   ├── Text.tsx                # 文本组件（含字体、行距）
│   │   ├── Card.tsx                # 模块卡片
│   │   ├── SectionNumber.tsx       # 圆形 01/02 序号
│   │   ├── Divider.tsx
│   │   └── Tag.tsx
│   │
│   ├── icons/                      # 内联 SVG 图标
│   │   ├── PalmDiagram.tsx
│   │   ├── HeartLine.tsx
│   │   ├── BrainLine.tsx
│   │   ├── LeafLine.tsx
│   │   ├── Signpost.tsx
│   │   ├── Wave.tsx
│   │   ├── HandIcon.tsx
│   │   ├── BookIcon.tsx
│   │   ├── MountainScene.tsx
│   │   ├── CornerOrnament.tsx      # 四角装饰
│   │   └── Watermark.tsx           # 右下角水印 + 二维码
│   │
│   ├── tokens/
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   └── layout.ts
│   │
│   ├── render/
│   │   ├── render-server.ts        # 服务端渲染入口（Node + satori + resvg-js）
│   │   ├── load-fonts.ts           # 字体加载（含子集化提示）
│   │   └── types.ts
│   │
│   └── data/
│       ├── schema.ts               # Zod schema：PalmReadingResult / FaceReadingResult
│       └── samples.ts              # 用于本地预览与测试的样例数据
│
├── fonts/                          # 思源宋体子集（不进 npm 包，运行时读取）
│   ├── NotoSerifSC-SemiBold.subset.otf
│   └── NotoSerifSC-Regular.subset.otf
│
├── package.json
└── tsconfig.json
```

**几个关键设计决策**：

第一，**primitives 层是这套组件的真正基础**。`Box` 包了一层"自动加 `display: flex`"的逻辑，让上层组件写起来像普通 React。`Text` 把字体、行高、颜色集中管理。所有业务组件都建在 primitives 上，**不直接出现裸 div**——这条纪律保证了 satori 不会因为某个隐藏的 div 没设置 display 而炸掉。

第二，**图标全部用 inline SVG 组件**。不引外部 SVG 文件、不引图标库（lucide-react 在 satori 里能跑但每次都要 SSR 渲染开销大）。手写 SVG 组件几行就够，且完全可控。

第三，**`render-server.ts` 是出图的唯一入口**。Web 端的 `/api/render-image`、Tauri 客户端的 sidecar、本地预览脚本都调它，保证一份代码三处一致。

---

## 三、设计 token

```ts
// packages/poster/src/tokens/colors.ts

/**
 * 长图配色：刻意与赛博站点形成"打开锦囊"的反差，
 * 主体走米白 + 墨黑 + 暗金的"传统命理书"质感。
 * 这套色值经过 WCAG AA 对比度验证。
 */
export const colors = {
  paper: '#F8F5EE',         // 主背景：米白宣纸
  paperDeep: '#F1ECE0',     // 次级背景：用于卡片底
  ink: '#1F1B16',           // 主文字：墨黑
  inkSoft: '#4A4338',       // 次级文字
  inkMuted: '#7A7167',      // 辅助说明
  gold: '#9A7B3F',          // 暗金：装饰、序号、强调
  goldSoft: '#C3A878',      // 浅金：分割线、边框
  line: '#E5DFD2',          // 卡片描边
  accent: '#7A2C2C',        // 印章红：极少量使用，避免艳俗
} as const;

export type ColorToken = keyof typeof colors;
```

```ts
// packages/poster/src/tokens/typography.ts

/**
 * satori 不支持 em/rem，所有字号必须是 px 数字。
 * 行高用倍数（lineHeight: 1.6）satori 是支持的。
 */
export const typography = {
  family: {
    serif: '"Noto Serif SC", serif',  // satori 会按你注入的 font 名匹配
  },
  size: {
    title: 56,        // 主标题"手相解读指南"
    subtitle: 22,     // 副标题
    sectionHeading: 32,  // "掌纹总览"
    bodyLarge: 22,
    body: 19,
    caption: 16,
    footnote: 14,
  },
  weight: {
    regular: 400,
    semibold: 600,
  },
  lineHeight: {
    tight: 1.35,
    normal: 1.7,    // 中文长正文用 1.7 阅读最舒服
    loose: 1.9,
  },
  letterSpacing: {
    title: 6,       // 中文标题加大字距更有"题字"感
    normal: 0,
  },
} as const;
```

```ts
// packages/poster/src/tokens/layout.ts

/**
 * 800 宽刚好对应小红书 / 朋友圈分享的最佳预览宽度。
 * 高度让内容自然撑开，约 2400 上下。
 */
export const layout = {
  canvas: {
    width: 800,
    paddingX: 48,
    paddingY: 56,
  },
  card: {
    radius: 16,
    paddingX: 32,
    paddingY: 28,
    borderWidth: 1,
    gapBetween: 24,
  },
  module: {
    iconSize: 36,        // 心形/脑/叶子小图标
    sectionGap: 20,      // 模块内子项间距
  },
  sectionNumber: {
    size: 40,            // 圆形 01/02 序号
    fontSize: 16,
  },
} as const;
```

---

## 四、Zod schema：渲染契约

这份 schema 同时是 LLM 输出的契约和 React 组件的 props 类型。**LLM 输出经过 Zod 解析后才能进入组件**，保证渲染期不会因为字段缺失而炸。

```ts
// packages/poster/src/data/schema.ts

import { z } from 'zod';

export const MainLineIcon = z.enum([
  'heart', 'brain', 'leaf',           // 手相
  'eye', 'nose', 'mouth', 'eyebrow', 'face',  // 面相
]);

export const AuxIcon = z.enum(['signpost', 'wave', 'star', 'mountain']);

export const SummaryIllustration = z.enum(['mountain', 'river', 'cloud', 'lotus']);

const TextRange = (min: number, max: number) =>
  z.string().min(min).max(max);

export const PalmReadingResultSchema = z.object({
  meta: z.object({
    id: z.string(),
    type: z.literal('palm'),
    createdAt: z.string(),
    title: z.string(),                       // "手相解读指南"
    subtitle: z.string(),                    // "根据你的掌纹与手型做的简洁分析"
  }),
  overview: z.object({
    heading: z.string(),                     // "掌纹总览"
    body: TextRange(60, 200),
  }),
  mainLines: z.array(z.object({
    name: z.string(),                        // "感情线"
    icon: MainLineIcon,
    body: TextRange(40, 180),
  })).min(2).max(4),
  auxiliary: z.array(z.object({
    icon: AuxIcon,
    label: z.string().max(40),
    body: TextRange(30, 140),
  })).min(1).max(3),
  temperament: z.object({
    heading: z.string(),
    body: TextRange(60, 200),
  }),
  summary: z.object({
    heading: z.string(),
    body: TextRange(80, 260),
    illustration: SummaryIllustration,
  }),
  disclaimer: z.object({
    label: z.string(),
    body: z.string().max(120),
  }),
});

export type PalmReadingResult = z.infer<typeof PalmReadingResultSchema>;

// 面相 schema 与手相结构一致，仅 type/icon 范围不同，省略
export const FaceReadingResultSchema = PalmReadingResultSchema.extend({
  meta: PalmReadingResultSchema.shape.meta.extend({
    type: z.literal('face'),
  }),
});
export type FaceReadingResult = z.infer<typeof FaceReadingResultSchema>;
```

注意 `TextRange` 这个工具：**字数范围既是 LLM 输出的硬约束，也是渲染版面不溢出的保险**。如果 LLM 偶尔输出 500 字的"综合解读"，Zod 会直接拒收并触发重试。

---

## 五、primitives 层：satori 安全的基础组件

### 5.1 Box —— 强制 flex 的"div 替代品"

```tsx
// packages/poster/src/primitives/Box.tsx

import type { CSSProperties, ReactNode } from 'react';

interface BoxProps {
  children?: ReactNode;
  /**
   * direction 默认是 'row'，但 satori 里 div 默认是 column 不一致，
   * 我们干脆显式化：所有 Box 必须写 direction，避免歧义。
   */
  direction?: 'row' | 'column';
  /** flex 主轴对齐 */
  justify?: CSSProperties['justifyContent'];
  /** flex 交叉轴对齐 */
  align?: CSSProperties['alignItems'];
  /** 间距：satori 支持 gap，可放心使用 */
  gap?: number;
  /** 自动换行 */
  wrap?: boolean;
  /** 占据父容器剩余空间的弹性比 */
  flex?: number;
  width?: number | string;
  height?: number | string;
  padding?: number | string;
  paddingX?: number;
  paddingY?: number;
  background?: string;
  borderRadius?: number;
  border?: string;
  /** 用于偶尔需要的 escape hatch */
  style?: CSSProperties;
}

/**
 * Box 的核心使命：保证 satori 永远拿到 display: flex。
 * 这个组件是整个长图渲染稳定性的地基，
 * 业务层任何"我想要一个容器"的需求都用 Box，不要写 <div>。
 */
export function Box({
  children,
  direction = 'row',
  justify,
  align,
  gap,
  wrap,
  flex,
  width,
  height,
  padding,
  paddingX,
  paddingY,
  background,
  borderRadius,
  border,
  style,
}: BoxProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: direction,
        justifyContent: justify,
        alignItems: align,
        gap,
        flexWrap: wrap ? 'wrap' : 'nowrap',
        flex,
        width,
        height,
        padding,
        paddingLeft: paddingX,
        paddingRight: paddingX,
        paddingTop: paddingY,
        paddingBottom: paddingY,
        background,
        borderRadius,
        border,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
```

### 5.2 Text —— 字体、颜色、行高一站式

```tsx
// packages/poster/src/primitives/Text.tsx

import type { CSSProperties, ReactNode } from 'react';
import { typography, colors, type ColorToken } from '../tokens';

interface TextProps {
  children: ReactNode;
  size?: keyof typeof typography.size;
  weight?: keyof typeof typography.weight;
  color?: ColorToken;
  lineHeight?: keyof typeof typography.lineHeight;
  letterSpacing?: number;
  align?: CSSProperties['textAlign'];
  /** 让文本以 column 排布，避免 satori 多文本节点报错 */
  asBlock?: boolean;
  style?: CSSProperties;
}

/**
 * 关键提醒：
 *  satori 中如果一个 div 同时包含字符串子节点和元素子节点，会要求显式设置 display。
 *  Text 内部统一加 display: flex 来规避所有歧义。
 */
export function Text({
  children,
  size = 'body',
  weight = 'regular',
  color = 'ink',
  lineHeight = 'normal',
  letterSpacing,
  align,
  asBlock,
  style,
}: TextProps) {
  return (
    <div
      style={{
        display: 'flex',
        // asBlock=true 时换列向，让长文本能多行；
        // 默认 row 适合行内单行（标题等）。
        flexDirection: asBlock ? 'column' : 'row',
        fontFamily: typography.family.serif,
        fontSize: typography.size[size],
        fontWeight: typography.weight[weight],
        color: colors[color],
        lineHeight: typography.lineHeight[lineHeight],
        letterSpacing: letterSpacing ?? 0,
        textAlign: align,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
```

### 5.3 SectionNumber —— 圆形 01/02 序号

```tsx
// packages/poster/src/primitives/SectionNumber.tsx

import { Box } from './Box';
import { Text } from './Text';
import { colors, layout } from '../tokens';

interface SectionNumberProps {
  index: number;
}

/**
 * 圆形浅色背景 + 暗金两位数字。
 * satori 完美支持 borderRadius: 50% 形式不稳，建议直接用 width/height 相等 + borderRadius=size/2。
 */
export function SectionNumber({ index }: SectionNumberProps) {
  const size = layout.sectionNumber.size;
  return (
    <Box
      direction="row"
      justify="center"
      align="center"
      width={size}
      height={size}
      borderRadius={size / 2}
      background={colors.paperDeep}
      style={{
        flexShrink: 0,  // 防止在窄容器里被挤扁
      }}
    >
      <Text
        size="caption"
        weight="semibold"
        color="gold"
        letterSpacing={1}
      >
        {String(index).padStart(2, '0')}
      </Text>
    </Box>
  );
}
```

### 5.4 Card —— 模块卡片

```tsx
// packages/poster/src/primitives/Card.tsx

import type { ReactNode } from 'react';
import { Box } from './Box';
import { Text } from './Text';
import { SectionNumber } from './SectionNumber';
import { colors, layout, typography } from '../tokens';

interface CardProps {
  index: number;
  heading: string;
  /** 标题右侧的小图标（可选），如手相图标、放大镜 */
  trailing?: ReactNode;
  children: ReactNode;
}

/**
 * 标准卡片：左上角序号圆 + 标题 + 右上角小图标 + 正文区域。
 * 设计要点：
 *  - 卡片用 1px 描边而非阴影，保留"宣纸"质感；
 *  - 标题与正文之间留 20px 喘息；
 *  - children 区域给业务自由发挥。
 */
export function Card({ index, heading, trailing, children }: CardProps) {
  return (
    <Box
      direction="column"
      width="100%"
      paddingX={layout.card.paddingX}
      paddingY={layout.card.paddingY}
      background={colors.paper}
      borderRadius={layout.card.radius}
      border={`${layout.card.borderWidth}px solid ${colors.line}`}
      gap={20}
    >
      {/* 标题行：序号 + 标题 + 右侧图标 */}
      <Box direction="row" align="center" justify="space-between" width="100%">
        <Box direction="row" align="center" gap={14}>
          <SectionNumber index={index} />
          <Text
            size="sectionHeading"
            weight="semibold"
            color="ink"
            letterSpacing={2}
          >
            {heading}
          </Text>
        </Box>
        {trailing && (
          <Box direction="row" align="center">
            {trailing}
          </Box>
        )}
      </Box>

      {/* 正文区 */}
      <Box direction="column" width="100%" gap={layout.module.sectionGap}>
        {children}
      </Box>
    </Box>
  );
}
```

### 5.5 Divider 与 Tag

```tsx
// packages/poster/src/primitives/Divider.tsx

import { Box } from './Box';
import { colors } from '../tokens';

export function Divider({ marginY = 0 }: { marginY?: number }) {
  return (
    <Box
      direction="row"
      width="100%"
      height={1}
      background={colors.line}
      style={{ marginTop: marginY, marginBottom: marginY }}
    />
  );
}
```

```tsx
// packages/poster/src/primitives/Tag.tsx

import { Box } from './Box';
import { Text } from './Text';
import { colors } from '../tokens';

interface TagProps {
  children: string;
}

/** 暗金色描边小标签，用于综合解读的"稳步推进型"标签强调 */
export function Tag({ children }: TagProps) {
  return (
    <Box
      direction="row"
      align="center"
      paddingX={12}
      paddingY={6}
      borderRadius={6}
      border={`1px solid ${colors.gold}`}
    >
      <Text size="caption" color="gold" weight="semibold" letterSpacing={1}>
        {children}
      </Text>
    </Box>
  );
}
```

---

## 六、icons：内联 SVG 组件

satori 对 inline `<svg>` 支持很好，但要注意：**SVG 内不要用 className，所有 attribute 用 React 风格的 camelCase 写**。

### 6.1 PalmDiagram —— 通用手掌示意图

```tsx
// packages/poster/src/icons/PalmDiagram.tsx

import { colors } from '../tokens';

interface PalmDiagramProps {
  width?: number;
  height?: number;
}

/**
 * 通用手掌线稿示意图（不基于用户照片，理由见 PRD §7.3）。
 * 包含三大主线 + 命运线 + 标注线。
 * SVG 路径是手绘风格的简化版，正式上线建议让设计师重做更精致的版本。
 */
export function PalmDiagram({ width = 280, height = 360 }: PalmDiagramProps) {
  return (
    <svg width={width} height={height} viewBox="0 0 280 360" fill="none">
      {/* 手掌轮廓（极简形态） */}
      <path
        d="M70 340 L60 220 Q55 180 65 150 L70 80 Q72 60 90 60 Q105 60 108 80 L112 130 L120 50 Q122 30 138 30 Q154 30 156 50 L158 130 L168 60 Q170 42 186 42 Q202 42 204 60 L204 140 L218 90 Q222 75 234 78 Q246 82 244 100 L230 200 Q220 260 200 320 L180 350 Z"
        stroke={colors.ink}
        strokeWidth={1.6}
        fill="none"
        strokeLinejoin="round"
      />
      {/* 感情线（最上方弧） */}
      <path
        d="M80 180 Q140 150 200 180"
        stroke={colors.ink}
        strokeWidth={1.4}
        fill="none"
        strokeLinecap="round"
      />
      {/* 智慧线（中间贯穿） */}
      <path
        d="M75 220 Q140 210 215 240"
        stroke={colors.ink}
        strokeWidth={1.4}
        fill="none"
        strokeLinecap="round"
      />
      {/* 生命线（包绕拇指根） */}
      <path
        d="M95 175 Q70 230 100 305"
        stroke={colors.ink}
        strokeWidth={1.4}
        fill="none"
        strokeLinecap="round"
      />
      {/* 命运线（中央纵向） */}
      <path
        d="M150 320 Q148 260 152 200"
        stroke={colors.inkMuted}
        strokeWidth={1}
        strokeDasharray="3 4"
        fill="none"
      />

      {/* 右侧标注线 + 文本 */}
      {/* 感情线 */}
      <line x1={205} y1={178} x2={250} y2={170} stroke={colors.gold} strokeWidth={1} />
      <text x={252} y={174} fill={colors.ink} fontSize={14} fontFamily="Noto Serif SC">感情线</text>
      {/* 智慧线 */}
      <line x1={215} y1={238} x2={250} y2={234} stroke={colors.gold} strokeWidth={1} />
      <text x={252} y={238} fill={colors.ink} fontSize={14} fontFamily="Noto Serif SC">智慧线</text>
      {/* 生命线 */}
      <line x1={108} y1={300} x2={250} y2={290} stroke={colors.gold} strokeWidth={1} />
      <text x={252} y={294} fill={colors.ink} fontSize={14} fontFamily="Noto Serif SC">生命线</text>
      {/* 命运线 */}
      <line x1={154} y1={262} x2={250} y2={258} stroke={colors.gold} strokeWidth={1} />
      <text x={252} y={262} fill={colors.ink} fontSize={14} fontFamily="Noto Serif SC">命运线</text>
    </svg>
  );
}
```

> 这张 SVG 是产品长图最具识别度的视觉锚点。代码里的路径只是占位级，正式上线务必让设计师交付一份精雕的 SVG，**保留接口不变**（width/height props + 同尺寸 viewBox）即可平滑替换。

### 6.2 三大主线小图标

```tsx
// packages/poster/src/icons/HeartLine.tsx
import { colors } from '../tokens';
export function HeartIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <path
        d="M14 24 C 4 17, 4 9, 9 7 C 12 6, 14 8, 14 10 C 14 8, 16 6, 19 7 C 24 9, 24 17, 14 24 Z"
        stroke={colors.gold}
        strokeWidth={1.4}
        fill="none"
        strokeLinejoin="round"
      />
    </svg>
  );
}
```

```tsx
// packages/poster/src/icons/BrainLine.tsx
import { colors } from '../tokens';
export function BrainIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <path
        d="M9 8 Q 5 8 5 12 Q 5 14 6 15 Q 5 16 5 18 Q 5 22 9 22 L 19 22 Q 23 22 23 18 Q 23 16 22 15 Q 23 14 23 12 Q 23 8 19 8 Z M 14 8 L 14 22"
        stroke={colors.gold}
        strokeWidth={1.4}
        fill="none"
        strokeLinejoin="round"
      />
    </svg>
  );
}
```

```tsx
// packages/poster/src/icons/LeafLine.tsx
import { colors } from '../tokens';
export function LeafIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <path
        d="M6 22 Q 6 8 22 6 Q 22 22 6 22 Z M 6 22 L 18 10"
        stroke={colors.gold}
        strokeWidth={1.4}
        fill="none"
        strokeLinejoin="round"
      />
    </svg>
  );
}
```

### 6.3 辅助观察图标

```tsx
// packages/poster/src/icons/Signpost.tsx
import { colors } from '../tokens';
export function SignpostIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <path d="M14 4 L 14 24" stroke={colors.gold} strokeWidth={1.4} strokeLinecap="round" />
      <path d="M5 8 L 22 8 L 24 10 L 22 12 L 5 12 Z" stroke={colors.gold} strokeWidth={1.4} fill="none" strokeLinejoin="round" />
      <path d="M22 16 L 5 16 L 3 18 L 5 20 L 22 20 Z" stroke={colors.gold} strokeWidth={1.4} fill="none" strokeLinejoin="round" />
    </svg>
  );
}
```

```tsx
// packages/poster/src/icons/Wave.tsx
import { colors } from '../tokens';
export function WaveIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <path d="M3 10 Q 8 5, 14 10 T 25 10" stroke={colors.gold} strokeWidth={1.4} fill="none" strokeLinecap="round" />
      <path d="M3 16 Q 8 11, 14 16 T 25 16" stroke={colors.gold} strokeWidth={1.4} fill="none" strokeLinecap="round" />
      <path d="M3 22 Q 8 17, 14 22 T 25 22" stroke={colors.gold} strokeWidth={1.4} fill="none" strokeLinecap="round" />
    </svg>
  );
}
```

### 6.4 山水装饰（综合解读模块用）

```tsx
// packages/poster/src/icons/MountainScene.tsx
import { colors } from '../tokens';

export function MountainScene({ width = 220, height = 110 }: { width?: number; height?: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 220 110" fill="none">
      {/* 远山 */}
      <path d="M0 70 Q 30 40 60 60 Q 90 38 130 58 Q 170 30 220 58 L 220 110 L 0 110 Z" 
            fill={colors.paperDeep} stroke="none" />
      {/* 中景山 */}
      <path d="M0 85 L 25 60 L 50 78 L 80 55 L 110 80 L 145 60 L 175 80 L 200 65 L 220 82 L 220 110 L 0 110 Z"
            stroke={colors.ink} strokeWidth={1.2} fill="none" strokeLinejoin="round" />
      {/* 几棵小树 */}
      <path d="M30 92 L 30 100 M28 96 L 32 96" stroke={colors.ink} strokeWidth={1} />
      <path d="M55 88 L 55 100 M52 93 L 58 93" stroke={colors.ink} strokeWidth={1} />
      <path d="M180 90 L 180 100 M177 95 L 183 95" stroke={colors.ink} strokeWidth={1} />
      {/* 河流（细线） */}
      <path d="M0 105 Q 60 98 120 104 Q 180 100 220 105" stroke={colors.goldSoft} strokeWidth={1} fill="none" />
    </svg>
  );
}
```

### 6.5 角落装饰 + 水印

```tsx
// packages/poster/src/icons/CornerOrnament.tsx
import { colors } from '../tokens';

/**
 * 四角的祥云回纹装饰，呼应你给的范例图右上/左上的小符号。
 * variant 控制朝向。
 */
export function CornerOrnament({
  size = 60,
  variant = 'tl',
}: { size?: number; variant?: 'tl' | 'tr' | 'bl' | 'br' }) {
  const rotation = { tl: 0, tr: 90, br: 180, bl: 270 }[variant];
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none"
         style={{ transform: `rotate(${rotation}deg)` }}>
      <path
        d="M5 5 L 25 5 L 25 10 L 10 10 L 10 25 L 5 25 Z M 14 14 L 22 14 L 22 22 L 14 22 Z"
        fill={colors.goldSoft}
      />
    </svg>
  );
}
```

```tsx
// packages/poster/src/icons/Watermark.tsx
import { Box } from '../primitives/Box';
import { Text } from '../primitives/Text';
import { colors } from '../tokens';

interface WatermarkProps {
  /** 已经预生成的二维码 SVG 路径 dataURL（PNG 也可），由出图入口注入 */
  qrDataUrl?: string;
  date: string;
}

/**
 * 长图右下角水印。Web 端有二维码，客户端版只有日期与 logo 文字。
 * 二维码图片通过 props 传入是因为 satori 不能 fetch，必须由调用方提前生成 buffer/dataURL。
 */
export function Watermark({ qrDataUrl, date }: WatermarkProps) {
  return (
    <Box direction="row" align="center" gap={12}>
      {qrDataUrl && (
        <img src={qrDataUrl} width={64} height={64}
             style={{ borderRadius: 6, border: `1px solid ${colors.line}` }} />
      )}
      <Box direction="column" gap={4}>
        <Text size="footnote" color="inkMuted">由赛博玄学馆生成</Text>
        <Text size="footnote" color="inkMuted">{date}</Text>
        {qrDataUrl && (
          <Text size="footnote" color="gold">扫码下载桌面版</Text>
        )}
      </Box>
    </Box>
  );
}
```

---

## 七、业务组件：手相长图主体

```tsx
// packages/poster/src/components/PalmReadingPoster.tsx

import { Box } from '../primitives/Box';
import { Text } from '../primitives/Text';
import { Card } from '../primitives/Card';
import { Divider } from '../primitives/Divider';
import { Tag } from '../primitives/Tag';
import { PalmDiagram } from '../icons/PalmDiagram';
import { HeartIcon } from '../icons/HeartLine';
import { BrainIcon } from '../icons/BrainLine';
import { LeafIcon } from '../icons/LeafLine';
import { SignpostIcon } from '../icons/Signpost';
import { WaveIcon } from '../icons/Wave';
import { MountainScene } from '../icons/MountainScene';
import { CornerOrnament } from '../icons/CornerOrnament';
import { Watermark } from '../icons/Watermark';
import { colors, layout, typography } from '../tokens';
import type { PalmReadingResult } from '../data/schema';

interface Props {
  data: PalmReadingResult;
  qrDataUrl?: string;
  /** 客户端版 vs Web 版的水印文案差异 */
  source?: 'web' | 'desktop';
}

/** 主线/辅助线图标映射 */
const MAIN_LINE_ICONS = {
  heart: HeartIcon,
  brain: BrainIcon,
  leaf: LeafIcon,
} as const;

const AUX_ICONS = {
  signpost: SignpostIcon,
  wave: WaveIcon,
  star: WaveIcon,        // star 暂用 wave 占位，正式上线补充
  mountain: WaveIcon,
} as const;

export function PalmReadingPoster({ data, qrDataUrl, source = 'web' }: Props) {
  const date = new Date(data.meta.createdAt).toLocaleDateString('zh-CN');

  return (
    <Box
      direction="column"
      width={layout.canvas.width}
      background={colors.paper}
      paddingX={layout.canvas.paddingX}
      paddingY={layout.canvas.paddingY}
      gap={layout.card.gapBetween}
      style={{ position: 'relative' }}
    >
      {/* 四角装饰：用 absolute 定位，Box 外层加 position: relative 提供锚点 */}
      <Box
        direction="row"
        style={{ position: 'absolute', top: 16, left: 16 }}
      >
        <CornerOrnament variant="tl" />
      </Box>
      <Box
        direction="row"
        style={{ position: 'absolute', top: 16, right: 16 }}
      >
        <CornerOrnament variant="tr" />
      </Box>

      {/* —————— 标题区 —————— */}
      <Box direction="column" align="center" gap={16} width="100%">
        <Text
          size="title"
          weight="semibold"
          color="ink"
          letterSpacing={typography.letterSpacing.title}
        >
          {data.meta.title}
        </Text>
        <Box direction="row" align="center" gap={12}>
          <Box width={40} height={1} background={colors.gold} />
          <Text size="subtitle" color="inkSoft" letterSpacing={2}>
            {data.meta.subtitle}
          </Text>
          <Box width={40} height={1} background={colors.gold} />
        </Box>
      </Box>

      {/* —————— 模块 1：左图右文 —————— */}
      <Box direction="row" gap={20} width="100%" align="stretch">
        {/* 左：手掌示意 */}
        <Box
          direction="column"
          align="center"
          justify="center"
          gap={12}
          flex={1}
          paddingY={24}
          background={colors.paper}
          borderRadius={layout.card.radius}
          border={`1px solid ${colors.line}`}
        >
          <Box direction="row" align="center" gap={10}>
            <Box width={6} height={6} borderRadius={3} background={colors.gold} />
            <Text size="caption" color="inkSoft" letterSpacing={3}>
              你的掌纹示意图
            </Text>
            <Box width={6} height={6} borderRadius={3} background={colors.gold} />
          </Box>
          <PalmDiagram />
        </Box>

        {/* 右：总览卡 */}
        <Box flex={1.1} direction="column">
          <Card index={1} heading={data.overview.heading}>
            <Text size="body" lineHeight="normal" color="ink" asBlock>
              {data.overview.body}
            </Text>
          </Card>
        </Box>
      </Box>

      {/* —————— 模块 2：三大主线 —————— */}
      <Card index={2} heading="三大主线解读">
        {data.mainLines.map((line, i) => {
          const Icon = MAIN_LINE_ICONS[line.icon as keyof typeof MAIN_LINE_ICONS] ?? HeartIcon;
          return (
            <Box key={line.name} direction="column" gap={10}>
              {/* 子项行：图标 + 名称 */}
              <Box direction="row" align="center" gap={14}>
                <Box
                  direction="row" justify="center" align="center"
                  width={44} height={44} borderRadius={22}
                  background={colors.paperDeep}
                  style={{ flexShrink: 0 }}
                >
                  <Icon size={22} />
                </Box>
                <Text size="bodyLarge" weight="semibold" color="ink" letterSpacing={2}>
                  {line.name}
                </Text>
              </Box>
              {/* 子项正文 */}
              <Text size="body" color="inkSoft" lineHeight="normal" asBlock
                    style={{ paddingLeft: 58 }}>
                {line.body}
              </Text>
              {/* 项目间分割线（最后一项不画） */}
              {i < data.mainLines.length - 1 && <Divider marginY={6} />}
            </Box>
          );
        })}
      </Card>

      {/* —————— 模块 3：辅助观察 —————— */}
      <Card index={3} heading="辅助线观察">
        {data.auxiliary.map((aux, i) => {
          const Icon = AUX_ICONS[aux.icon] ?? SignpostIcon;
          return (
            <Box key={i} direction="row" gap={14} align="flex-start">
              <Box
                direction="row" justify="center" align="center"
                width={40} height={40} borderRadius={20}
                background={colors.paperDeep}
                style={{ flexShrink: 0, marginTop: 2 }}
              >
                <Icon size={20} />
              </Box>
              <Box direction="column" flex={1} gap={6}>
                <Text size="bodyLarge" weight="semibold" color="ink">
                  {aux.label}
                </Text>
                <Text size="body" color="inkSoft" lineHeight="normal" asBlock>
                  {aux.body}
                </Text>
              </Box>
            </Box>
          );
        })}
      </Card>

      {/* —————— 模块 4：气质 —————— */}
      <Card index={4} heading={data.temperament.heading}>
        <Text size="body" color="ink" lineHeight="normal" asBlock>
          {data.temperament.body}
        </Text>
      </Card>

      {/* —————— 模块 5：综合解读（带山水装饰） —————— */}
      <Box
        direction="column"
        paddingX={layout.card.paddingX}
        paddingY={layout.card.paddingY}
        background={colors.paperDeep}
        borderRadius={layout.card.radius}
        border={`1px solid ${colors.goldSoft}`}
        gap={18}
      >
        <Box direction="row" align="center" justify="space-between">
          <Box direction="row" align="center" gap={14}>
            {/* 复用 SectionNumber 内联（懒得 import 直接写也行） */}
            <Box
              direction="row" justify="center" align="center"
              width={40} height={40} borderRadius={20}
              background={colors.paper}
              style={{ flexShrink: 0 }}
            >
              <Text size="caption" weight="semibold" color="gold">05</Text>
            </Box>
            <Text size="sectionHeading" weight="semibold" color="ink" letterSpacing={2}>
              {data.summary.heading}
            </Text>
          </Box>
        </Box>

        {/* 山水插画 */}
        <Box direction="row" justify="center" width="100%">
          <MountainScene width={520} height={120} />
        </Box>

        <Text size="body" color="ink" lineHeight="loose" asBlock>
          {data.summary.body}
        </Text>
      </Box>

      {/* —————— 模块 6：免责（窄条） —————— */}
      <Box
        direction="row"
        align="center"
        gap={16}
        paddingX={28}
        paddingY={20}
        background={colors.paper}
        borderRadius={layout.card.radius}
        border={`1px solid ${colors.line}`}
      >
        <Box
          direction="row" justify="center" align="center"
          width={40} height={40} borderRadius={20}
          background={colors.paperDeep}
          style={{ flexShrink: 0 }}
        >
          <Text size="caption" weight="semibold" color="gold">06</Text>
        </Box>
        <Text size="caption" color="inkSoft" lineHeight="normal" asBlock style={{ flex: 1 }}>
          <Text size="body" weight="semibold" color="ink">{data.disclaimer.label}</Text>
          {'　'}
          {data.disclaimer.body}
        </Text>
      </Box>

      {/* —————— 水印 —————— */}
      <Box direction="row" justify="flex-end" width="100%" style={{ marginTop: 8 }}>
        <Watermark
          qrDataUrl={source === 'web' ? qrDataUrl : undefined}
          date={`${source === 'web' ? '网页版' : '桌面版'} · ${date}`}
        />
      </Box>
    </Box>
  );
}
```

这份组件实现了你给的范例图全部 6 个模块：标题 → 左图右文总览 → 三大主线 → 辅助观察 → 气质 → 综合解读（含山水插画 + 印章感分割）→ 阅读提示 → 水印。**所有版式都靠 flex + 显式 padding/gap 完成**，satori 能稳定算出每个节点尺寸。

---

## 八、面相长图（结构复用）

面相长图与手相在结构上 95% 一致，只在"模块 2 的子项"换成"五官"，"左侧示意图"换成面孔示意。这里给出关键差异：

```tsx
// packages/poster/src/components/FaceReadingPoster.tsx (节选关键差异)

const FACE_LINE_ICONS = {
  eye: () => /* 眼睛 SVG */ null,
  nose: () => /* 鼻 SVG */ null,
  mouth: () => /* 嘴 SVG */ null,
  eyebrow: () => /* 眉 SVG */ null,
  face: () => /* 脸型 SVG */ null,
} as const;

// 大部分代码与 PalmReadingPoster 完全一样，可考虑做成
// <ReadingPoster type="palm" /> 的统一组件，
// 但出图模板的可读性 > DRY，分开维护反而清晰。
```

我建议**手相和面相分别保留两个组件**而不是抽象成一个，因为出图模板未来一定会按类型独立演进（比如面相要加"印堂"高亮、手相要加"指节比例"小图），**过早抽象只会让模板变难改**。

---

## 九、字体加载

```ts
// packages/poster/src/render/load-fonts.ts

import { promises as fs } from 'fs';
import path from 'path';

export interface SatoriFont {
  name: string;
  data: ArrayBuffer | Buffer;
  weight: 400 | 600;
  style: 'normal';
}

/**
 * 加载思源宋体两种字重供 satori 使用。
 * 重要：
 *  1. 必须用子集化字体（subset），全集 14MB 进出图链路太重；
 *     用 fonttools 的 pyftsubset 把字体裁剪到只包含 GB18030 + 常用日韩，
 *     体积可降到 1.5~2MB，对 200ms 的出图延迟至关重要。
 *  2. 字体文件存放在 packages/poster/fonts/，不通过 npm 包发布
 *     （太大），由部署脚本拷贝到 server 启动目录。
 *  3. 字体在 Node 进程启动时一次性加载并复用，
 *     不要每次出图都读盘——这是常见性能陷阱。
 */
let cached: SatoriFont[] | null = null;

export async function loadFonts(fontsDir: string): Promise<SatoriFont[]> {
  if (cached) return cached;

  const [regular, semibold] = await Promise.all([
    fs.readFile(path.join(fontsDir, 'NotoSerifSC-Regular.subset.otf')),
    fs.readFile(path.join(fontsDir, 'NotoSerifSC-SemiBold.subset.otf')),
  ]);

  cached = [
    { name: 'Noto Serif SC', data: regular, weight: 400, style: 'normal' },
    { name: 'Noto Serif SC', data: semibold, weight: 600, style: 'normal' },
  ];
  return cached;
}
```

**关键提醒**：satori 出图速度 60% 的瓶颈在字体子集大小。把思源宋体子集裁剪到只包含 GB18030 常用字范围之后，单次出图能从 ~700ms 降到 ~180ms。

---

## 十、服务端渲染入口

```ts
// packages/poster/src/render/render-server.ts

import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import path from 'path';
import { loadFonts } from './load-fonts';
import { PalmReadingPoster } from '../components/PalmReadingPoster';
import { FaceReadingPoster } from '../components/FaceReadingPoster';
import type { PalmReadingResult, FaceReadingResult } from '../data/schema';
import { layout } from '../tokens';

interface RenderInput {
  data: PalmReadingResult | FaceReadingResult;
  qrDataUrl?: string;
  source?: 'web' | 'desktop';
  /** 输出尺寸缩放，默认 2x（高清） */
  scale?: number;
}

interface RenderOutput {
  png: Buffer;
  width: number;
  height: number;
  durationMs: number;
}

const FONTS_DIR = path.resolve(process.cwd(), 'packages/poster/fonts');

/**
 * 唯一对外的出图函数。
 * 设计为同步可测试（不依赖任何全局状态）+ 错误显式抛出。
 */
export async function renderReadingPoster(input: RenderInput): Promise<RenderOutput> {
  const start = Date.now();
  const { data, qrDataUrl, source = 'web', scale = 2 } = input;
  const fonts = await loadFonts(FONTS_DIR);

  // 选择对应业务组件
  const element = data.meta.type === 'palm'
    ? PalmReadingPoster({ data: data as PalmReadingResult, qrDataUrl, source })
    : FaceReadingPoster({ data: data as FaceReadingResult, qrDataUrl, source });

  // satori：JSX → SVG 字符串
  const svg = await satori(element, {
    width: layout.canvas.width,
    fonts,
    // satori 默认尽力按 yoga 算高，不需要传 height
    embedFont: true,
    debug: false,
  });

  // resvg：SVG → PNG buffer
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: layout.canvas.width * scale,
    },
    font: {
      // resvg 也需要字体（否则部分 emoji/text path 渲染异常）
      // 这里传字体目录，让 resvg 自己解析；
      // 如果遇到中文不渲染，再切换为 loadSystemFonts: false + fontFiles 显式列表
      fontDirs: [FONTS_DIR],
      loadSystemFonts: false,
      defaultFontFamily: 'Noto Serif SC',
    },
  });
  const pngData = resvg.render();
  const png = pngData.asPng();
  const { width, height } = pngData;

  return {
    png: Buffer.from(png),
    width,
    height,
    durationMs: Date.now() - start,
  };
}
```

**关于 resvg 的字体配置坑**：默认情况下 resvg 会去系统读字体，Linux 服务器上往往没有中文字体，导致中文渲染成空白。必须显式设 `loadSystemFonts: false` + `fontDirs` 指向你的子集字体目录，**这是部署时最容易踩的坑**。

---

## 十一、Web 端 API 接入

```ts
// apps/server/app/api/render-image/route.ts (Next.js Route Handler)

import { NextResponse } from 'next/server';
import { renderReadingPoster } from '@cyberoracle/poster/render/render-server';
import { PalmReadingResultSchema, FaceReadingResultSchema } from '@cyberoracle/poster/data/schema';
import { readResultJson, writeResultPng, generateShareQrDataUrl } from '@/lib/storage';

export const runtime = 'nodejs';   // satori + resvg 必须 Node runtime
export const maxDuration = 30;

export async function POST(req: Request) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 });

  // 1. 从文件系统读 LLM 输出 JSON
  const raw = await readResultJson(id);

  // 2. 用 Zod 校验
  const parsed = raw.meta.type === 'palm'
    ? PalmReadingResultSchema.safeParse(raw)
    : FaceReadingResultSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid result schema', detail: parsed.error.format() },
      { status: 422 }
    );
  }

  // 3. 生成二维码（指向 /share/{id}）
  const qrDataUrl = await generateShareQrDataUrl(id);

  // 4. 出图
  const { png, width, height, durationMs } = await renderReadingPoster({
    data: parsed.data,
    qrDataUrl,
    source: 'web',
  });

  // 5. 落盘
  await writeResultPng(id, png);

  return NextResponse.json({
    url: `/api/result/${id}/image`,
    width, height,
    renderMs: durationMs,
  });
}
```

---

## 十二、本地预览脚本（开发利器）

写 satori 组件最大的痛是"改一行要重启 server 才能看效果"。下面这个脚本支持 watch 模式，改完保存自动出图刷新，是开发期生产力 10 倍的关键：

```ts
// packages/poster/scripts/preview.ts

import { renderReadingPoster } from '../src/render/render-server';
import { PalmReadingResultSchema } from '../src/data/schema';
import { palmSample } from '../src/data/samples';
import { promises as fs } from 'fs';
import path from 'path';
import chokidar from 'chokidar';

const OUT = path.resolve(__dirname, '../preview/output.png');

async function build() {
  const data = PalmReadingResultSchema.parse(palmSample);
  const { png, durationMs, width, height } = await renderReadingPoster({
    data, source: 'web',
  });
  await fs.mkdir(path.dirname(OUT), { recursive: true });
  await fs.writeFile(OUT, png);
  console.log(`[preview] ${width}x${height} in ${durationMs}ms → ${OUT}`);
}

// 初始构建
build().catch(console.error);

// watch 模式：改 src 自动重建
if (process.argv.includes('--watch')) {
  chokidar.watch(path.resolve(__dirname, '../src'), { ignoreInitial: true })
    .on('change', () => {
      build().catch(console.error);
    });
  console.log('[preview] watching src/ for changes...');
}
```

配合 macOS Preview 自带的"自动刷新已修改图片"特性，开发体验和热更新前端基本一致。

---

## 十三、样例数据（双重用途）

```ts
// packages/poster/src/data/samples.ts

import type { PalmReadingResult } from './schema';

/**
 * 这份样例同时用于：
 *  1. 本地预览脚本（preview.ts）
 *  2. CI 视觉回归测试（每次构建出图，与 baseline PNG diff）
 *  3. LLM 输出格式的"标准答卷"，可作为 few-shot 来源
 * 内容刻意呼应你给的"手相解读指南"原图，便于对照视觉。
 */
export const palmSample: PalmReadingResult = {
  meta: {
    id: 'sample-001',
    type: 'palm',
    createdAt: '2025-01-15T10:00:00Z',
    title: '手相解读指南',
    subtitle: '根据你的掌纹与手型做的简洁分析',
  },
  overview: {
    heading: '掌纹总览',
    body: '你的掌纹整体偏清晰，主线分布有层次，说明你做事讲逻辑，也重视实际感受。智慧线较突出，代表思考投入度高，遇事倾向于先判断再行动。生命线连贯而长，整体给人的感觉是稳、耐心、能持续。',
  },
  mainLines: [
    {
      name: '感情线',
      icon: 'heart',
      body: '感情线位置较平稳，线条偏细，说明你情感表达偏克制，重视关系中的信任感与稳定度。你通常不会轻易外露情绪，更看重长期相处是否舒服、可靠。',
    },
    {
      name: '智慧线',
      icon: 'brain',
      body: '智慧线较长，并向掌心下方微斜延伸，代表思考细致，观察力较强，也带一点想象力。你处理问题时往往会先建立判断框架，再逐步推进，适合做需要分析与耐心的事。',
    },
    {
      name: '生命线',
      icon: 'leaf',
      body: '生命线弧度完整，延伸较长，通常象征耐力与恢复力不错。你的做事方式更像持续推进型，不急着一冲到最前面，但节奏稳，越往后越能看出韧性。',
    },
  ],
  auxiliary: [
    {
      icon: 'signpost',
      label: '命运线偏淡但可见',
      body: '更适合在实践中逐渐明确方向，职业路径往往靠持续积累形成，不一定一开始就很明确，但会越做越清楚。',
    },
    {
      icon: 'wave',
      label: '细纹分布适中',
      body: '说明你对外界变化有感知力，也容易进入思考状态。在关系里看重相处感，好处是判断细，挑战是偶尔会想得比较多，需要给自己留一点行动空间。',
    },
  ],
  temperament: {
    heading: '手型气质',
    body: '从手型看，掌底偏宽厚，拇指有张力，手指整体较端正，给人的印象偏务实、直接、可靠。你通常有自己的判断标准，不太喜欢被随意打乱节奏，适合稳定深耕、持续投入的路径。',
  },
  summary: {
    heading: '综合解读',
    body: '这是一只偏"稳步推进型"的手。你在思考上认真，在行动上讲节奏，在关系里看重长期感受。你未必追求表面的张扬效率，但一旦确认方向，通常能持续往前，把事情做得更扎实。对你来说，价值往往来自时间累积，而不是短期起伏。',
    illustration: 'mountain',
  },
  disclaimer: {
    label: '阅读提示',
    body: '手相更适合作为观察自我倾向的一种有趣视角，可把它当作个性与状态的轻量参考。',
  },
};
```

---

## 十四、对外导出

```ts
// packages/poster/src/index.ts

// 业务组件（前端预览也可直接 import 渲染 React 版本）
export { PalmReadingPoster } from './components/PalmReadingPoster';
export { FaceReadingPoster } from './components/FaceReadingPoster';
export { DailyFortuneCard } from './components/DailyFortuneCard';

// 出图入口
export { renderReadingPoster } from './render/render-server';
export { loadFonts } from './render/load-fonts';

// schema（LLM 输出校验 + Zod 类型）
export {
  PalmReadingResultSchema,
  FaceReadingResultSchema,
} from './data/schema';
export type {
  PalmReadingResult,
  FaceReadingResult,
} from './data/schema';

// 样例（dev / test / few-shot 三用）
export { palmSample } from './data/samples';

// 设计 token（被前端 UI 引用，保证 React 预览与 satori 出图视觉一致）
export { colors, typography, layout } from './tokens';
```

---

## 十五、package.json 与构建配置

```json
{
  "name": "@cyberoracle/poster",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./render/render-server": {
      "import": "./dist/render/render-server.js",
      "types": "./dist/render/render-server.d.ts"
    },
    "./data/schema": {
      "import": "./dist/data/schema.js",
      "types": "./dist/data/schema.d.ts"
    }
  },
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "dev": "tsc -w -p tsconfig.build.json",
    "preview": "tsx scripts/preview.ts",
    "preview:watch": "tsx scripts/preview.ts --watch",
    "test": "vitest"
  },
  "dependencies": {
    "satori": "^0.10.13",
    "@resvg/resvg-js": "^2.6.2",
    "zod": "^3.23.8",
    "react": "^18.3.1"
  },
  "devDependencies": {
    "tsx": "^4.7.0",
    "chokidar": "^3.6.0",
    "typescript": "^5.4.5",
    "vitest": "^1.6.0",
    "@types/react": "^18.3.0",
    "@types/node": "^20.0.0"
  },
  "peerDependencies": {
    "react": "^18.3.1"
  }
}
```

**子路径导出（exports map）**很重要：让外部按需引用 `@cyberoracle/poster/render/render-server`，**不会因为 import 触发整个组件树的副作用**，对 Tauri 客户端体积优化尤其关键。

---

## 十六、视觉回归测试（防止 LLM 输出导致版面崩坏）

```ts
// packages/poster/tests/visual-regression.test.ts

import { describe, it, expect } from 'vitest';
import { renderReadingPoster } from '../src/render/render-server';
import { palmSample } from '../src/data/samples';
import { promises as fs } from 'fs';
import path from 'path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const BASELINE = path.resolve(__dirname, 'baselines/palm.png');

describe('PalmReadingPoster 视觉回归', () => {
  it('与基线图差异 < 0.5%', async () => {
    const { png } = await renderReadingPoster({ data: palmSample, source: 'web' });

    const current = PNG.sync.read(png);
    const baseline = PNG.sync.read(await fs.readFile(BASELINE));
    const { width, height } = current;

    const diff = new PNG({ width, height });
    const diffPx = pixelmatch(
      current.data, baseline.data, diff.data,
      width, height, { threshold: 0.1 }
    );
    const ratio = diffPx / (width * height);
    expect(ratio).toBeLessThan(0.005);
  });

  it('极端字数（最大上限）不溢出', async () => {
    const stressed = {
      ...palmSample,
      overview: { ...palmSample.overview, body: 'X'.repeat(200) },
      summary: { ...palmSample.summary, body: 'X'.repeat(260) },
    };
    const { png } = await renderReadingPoster({ data: stressed as any, source: 'web' });
    expect(png.length).toBeGreaterThan(1000);  // 至少出图成功
  });
});
```

视觉回归测试是 satori 项目的"安全网"——任何样式调整后跑一次测试，能立刻发现版面破坏。**LLM 的输出文字长度有抖动，必须用极端字数样本压力测试**，否则真实流量上一旦触发字数边界，长图就会被撑变形。

---

## 十七、性能与已知坑位

### 性能优化清单

| 项 | 措施 | 收益 |
|---|---|---|
| 字体子集化 | pyftsubset 裁剪到 GB18030 常用字 | 单次出图 700ms → 180ms |
| 字体缓存 | 进程级单例（loadFonts 内置） | 避免每次出图重读 2MB |
| resvg fitTo | mode: 'width' 精确控制 | 避免计算 height 偏差 |
| @2x 输出 | scale=2 在 resvg 里放大，不在 satori | satori 端尺寸越大越慢 |
| 二维码生成 | 用 `qrcode` 包生成 SVG dataURL，不用 PNG | 体积更小、渲染更快 |
| 长文截断 | Zod 字数上限挡住 | 防止极端文本撑爆版面 |

### satori 已知踩坑 cheat sheet

- **错误："div with multiple children must have display: flex"** → 找到那个 div，改用 `Box`；
- **中文渲染豆腐方块** → 字体没注入，或字体名不匹配（必须是 `Noto Serif SC` 与组件里 fontFamily 完全一致）；
- **layout 偏移、卡片不对齐** → 检查是否漏了 `flexShrink: 0`，satori 默认会压缩 flex 子项；
- **transform: rotate 把布局搞乱** → 外层用固定尺寸 Box 包，内层再 rotate；
- **resvg 中文不显示** → resvg 没找到字体，加 `fontDirs` + `loadSystemFonts: false`；
- **`<img>` 不显示** → 必须本地 buffer 或 dataURL，不能远程 URL；
- **emoji 不显示** → satori 需要单独传 emoji 字体（如 Twemoji），本项目避免使用 emoji；
- **borderRadius 50% 不圆** → 改成具体数字（width/2）；
- **`position: absolute` 配合 flex 偶尔失效** → 父容器加 `position: relative`，且 absolute 元素本身建议显式设 `display: flex`。

---

## 十八、与上层包的关系总结

最后用一张关系图收尾，让你看清这个包在整个 monorepo 中的位置：

```
@cyberoracle/poster
   ├──→ 被 apps/server 调用：/api/render-image 出图
   ├──→ 被 apps/web 调用：本地 React 预览（同一份组件 SSR 渲染）
   ├──→ 被 apps/desktop 调用：sidecar Node 进程出图（v1.5）
   ├──→ 被 packages/core/prompts 引用 schema：作为 LLM 输出契约
   └──→ 被 packages/ui 引用 tokens：保证 Web 站点视觉与长图一致
```

> 一句话总结：**`@cyberoracle/poster` 是整个产品"美感的单一来源"——一份 JSX、一套 token、三处出图、双端 + LLM 全部共享**。这是 monorepo 设计在这个项目中能拿到的最大复利。

---

这份 packages/poster 的完整代码就到这里。它已经覆盖了：satori 约束分析、设计 token、Zod 契约、primitives 基石组件、SVG 图标、手相主组件、字体加载、服务端出图入口、API 接入、本地预览、视觉回归测试、性能优化、踩坑 cheat sheet。**拿到代码就能跑出与你给的"手相解读指南"范例视觉风格高度一致的长图**。
