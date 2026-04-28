# 一、Live2D 集成完整示例（React + PixiJS + Tauri 客户端）

## 1. 技术栈与版本锁定

先把版本钉死，因为 Live2D 这套生态很容易踩版本兼容的坑：

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "pixi.js": "6.5.10",
    "pixi-live2d-display": "0.4.0",
    "zustand": "^4.5.2"
  }
}
```

**为什么锁 PixiJS 6.5.10 而不是最新的 8.x？**
`pixi-live2d-display` 这个目前最主流的 Live2D 渲染库官方支持到 PixiJS 6.x，PixiJS 7+ 有 breaking changes 还没完全跟上。**新项目反直觉地用旧版本是常见现实**，这里不要追新，否则会浪费几天调兼容问题。

**Cubism Core SDK** 需要单独引入。Live2D 模型分两代：Cubism 2 (`.moc`) 和 Cubism 4 (`.moc3`)，目前主流是 Cubism 4。需要在 `index.html` 里加：

```html
<!-- public/index.html，必须在 React bundle 之前加载 -->
<script src="/live2d/live2dcubismcore.min.js"></script>
```

`live2dcubismcore.min.js` 从 Live2D 官网下载（免费但有商用授权要求，正式上线要走 Live2D Inc. 的授权流程）。

## 2. 模型资源目录约定

```
apps/desktop/public/live2d/
  ├── live2dcubismcore.min.js
  └── models/
      └── xingzi/                    # 模型 id："星子"
          ├── xingzi.model3.json     # 主入口
          ├── xingzi.moc3
          ├── xingzi.physics3.json
          ├── textures/
          │   └── texture_00.png
          ├── motions/
          │   ├── idle_01.motion3.json
          │   ├── idle_02.motion3.json
          │   ├── talk_01.motion3.json
          │   ├── think_01.motion3.json
          │   ├── celebrate_01.motion3.json
          │   └── greet_01.motion3.json
          └── expressions/
              ├── smile.exp3.json
              └── shy.exp3.json
```

模型动作必须按这套命名分组，下面代码会按"组名 + 随机索引"的方式调度，所以新加动作只要扔进对应组就能用。

## 3. 全局类型与状态定义

```ts
// packages/ui/src/Live2DStage/types.ts

// 占卜师的"情绪/行为"状态。这是对外暴露的高层 API，
// 屏蔽了底层 motion group / expression 的细节。
export type CompanionState =
  | 'idle'       // 空闲：随机播放 idle 动作 + 眨眼
  | 'greet'      // 打招呼：用户首次打开/早晨问好
  | 'thinking'   // 测算中：循环 think 动作 + 头顶光圈
  | 'talking'    // 正在说话：嘴部 lipsync + talk 动作
  | 'celebrate'  // 解读完成：celebrate 动作 + 鼓励
  | 'shy'        // 被点击的彩蛋反应
  | 'sad';       // 失败/错误兜底

export interface CompanionConfig {
  modelId: string;          // "xingzi"
  scale: number;            // 0.3 默认
  position: { x: number; y: number };  // 锚点偏移（百分比）
  enableLipSync: boolean;
  enableEyeTracking: boolean;  // 眼睛跟随鼠标
}

export interface MotionGroupMap {
  idle: string[];
  greet: string[];
  think: string[];
  talk: string[];
  celebrate: string[];
  sad: string[];
}
```

## 4. Live2D 控制器（核心引擎）

这是整个 Live2D 集成的大脑，封装了 PixiJS app 生命周期、模型加载、状态切换、嘴型同步、眼神跟随。**它故意写成框架无关的 class**，这样以后从 React 换 Vue / vanilla 都能复用。

```ts
// packages/ui/src/Live2DStage/Live2DController.ts

import * as PIXI from 'pixi.js';
import { Live2DModel } from 'pixi-live2d-display';
import type { CompanionState, CompanionConfig } from './types';

// 把 PIXI 注入到 pixi-live2d-display，否则模型不会动
// 这一步是常见踩坑点：必须在 import Live2DModel 之后立刻注册
Live2DModel.registerTicker(PIXI.Ticker);

// 各情绪状态对应的 motion group 名（与 model3.json 中的 Motions 字段对应）
const STATE_TO_GROUP: Record<CompanionState, string> = {
  idle: 'Idle',
  greet: 'Greet',
  thinking: 'Think',
  talking: 'Talk',
  celebrate: 'Celebrate',
  shy: 'Shy',
  sad: 'Sad',
};

export class Live2DController {
  private app: PIXI.Application | null = null;
  private model: Live2DModel | null = null;
  private container: HTMLDivElement;
  private currentState: CompanionState = 'idle';
  private idleTimer: number | null = null;
  private mouthTargetValue = 0;     // lipsync 目标张嘴度 0~1
  private mouthCurrentValue = 0;    // 当前张嘴度（做平滑插值用）
  private destroyed = false;

  constructor(container: HTMLDivElement) {
    this.container = container;
  }

  /**
   * 初始化 PIXI 舞台并加载模型。
   * 故意做成 async，让外层用 useEffect + AbortController 优雅取消。
   */
  async init(config: CompanionConfig): Promise<void> {
    // 1. 创建 PIXI Application
    //    - transparent 让桌宠窗口可以做透明背景
    //    - antialias 提升立绘细腻度
    //    - autoDensity + resolution 保证 Retina 屏不糊
    this.app = new PIXI.Application({
      view: document.createElement('canvas'),
      autoStart: true,
      resizeTo: this.container,
      backgroundAlpha: 0,
      antialias: true,
      autoDensity: true,
      resolution: window.devicePixelRatio || 1,
    });

    this.container.appendChild(this.app.view as HTMLCanvasElement);

    if (this.destroyed) return;  // 防止初始化过程中被销毁

    // 2. 加载模型
    const modelUrl = `/live2d/models/${config.modelId}/${config.modelId}.model3.json`;
    this.model = await Live2DModel.from(modelUrl, {
      // 自动 update：让模型自己跟随 ticker 更新，省去手写 update 调用
      autoUpdate: true,
    });

    if (this.destroyed) {
      this.model.destroy();
      return;
    }

    this.app.stage.addChild(this.model);

    // 3. 设置位置和缩放
    //    锚点设到 0.5 让 model 以中心定位，便于做"放在窗口下半部分"这种布局
    this.model.anchor.set(0.5, 0.5);
    this.applyTransform(config);

    // 4. 启用每帧 hook：用来做嘴型平滑、眼神跟随的额外逻辑
    this.app.ticker.add(this.onTick);

    // 5. 进入默认空闲循环
    this.setState('idle');

    // 6. 鼠标跟随（可选）
    if (config.enableEyeTracking) {
      this.bindMouseTracking();
    }
  }

  /** 应用位置与缩放，独立成方法是为了让外部能动态调整（设置面板拖动） */
  applyTransform(config: CompanionConfig) {
    if (!this.model || !this.app) return;
    this.model.scale.set(config.scale);
    this.model.x = this.app.screen.width * (0.5 + config.position.x);
    this.model.y = this.app.screen.height * (0.7 + config.position.y);
  }

  /**
   * 每帧 tick：
   * - 嘴型从 current 平滑过渡到 target，避免直接赋值的"跳动"感
   * - PIXI ticker 的 deltaTime 单位是"帧"（约 1.0），所以这里乘以一个系数控制速度
   */
  private onTick = (deltaTime: number) => {
    if (!this.model) return;

    // 嘴型平滑：每帧朝目标值靠近 25%
    this.mouthCurrentValue += (this.mouthTargetValue - this.mouthCurrentValue) * 0.25;

    // Cubism 4 的嘴张参数名通常是 ParamMouthOpenY，写法因模型而异
    // pixi-live2d-display 提供 internalModel.coreModel.setParameterValueById
    const core = (this.model.internalModel as any).coreModel;
    if (core) {
      core.setParameterValueById('ParamMouthOpenY', this.mouthCurrentValue);
    }
  };

  /**
   * 切换情绪状态：
   * - idle / thinking 是循环类，要起 random 调度
   * - greet / celebrate / shy / sad / talking 是一次性，播完自动回 idle
   */
  setState(state: CompanionState) {
    if (this.destroyed || !this.model) return;
    if (state === this.currentState && state === 'idle') return;  // 避免 idle 重复重置

    this.currentState = state;
    this.clearIdleTimer();

    const group = STATE_TO_GROUP[state];

    if (state === 'idle') {
      this.scheduleIdleLoop();
    } else if (state === 'thinking') {
      // thinking 也循环，但用 think 动作组
      this.playRandomMotion(group, 3 /* priority */);
      this.idleTimer = window.setTimeout(() => {
        if (this.currentState === 'thinking') this.setState('thinking');
      }, 4000);
    } else {
      // 一次性动作：播完后回 idle
      this.playRandomMotion(group, 3);
      // talk 状态由外部 stopTalking 显式结束
      if (state !== 'talking') {
        this.idleTimer = window.setTimeout(() => {
          this.setState('idle');
        }, 3500);
      }
    }
  }

  /** 在 idle 状态下随机间隔播放 idle 动作，让立绘"活着" */
  private scheduleIdleLoop() {
    if (this.currentState !== 'idle') return;
    this.playRandomMotion('Idle', 1 /* low priority，不打断高优先级动作 */);
    // 8~14 秒随机间隔，避免机械感
    const next = 8000 + Math.random() * 6000;
    this.idleTimer = window.setTimeout(() => this.scheduleIdleLoop(), next);
  }

  private clearIdleTimer() {
    if (this.idleTimer !== null) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }

  /**
   * 播放某 motion group 中的随机一条。
   * priority：1=idle, 2=normal, 3=force（pixi-live2d-display 的优先级体系）
   */
  private playRandomMotion(group: string, priority: number) {
    if (!this.model) return;
    const motionManager = (this.model.internalModel as any).motionManager;
    const definitions = motionManager.definitions[group];
    if (!definitions || definitions.length === 0) return;
    const index = Math.floor(Math.random() * definitions.length);
    this.model.motion(group, index, priority);
  }

  /** 外部触发说话：传入文本时长（毫秒）做粗略 lipsync */
  startTalking(durationMs: number) {
    this.setState('talking');
    // 模拟说话嘴型：用一个低频 + 高频叠加的伪随机驱动嘴张
    const startedAt = performance.now();
    const driveLipSync = () => {
      if (this.destroyed || this.currentState !== 'talking') return;
      const elapsed = performance.now() - startedAt;
      if (elapsed >= durationMs) {
        this.stopTalking();
        return;
      }
      // 0.5Hz 低频开合 + 4Hz 颤动，再加点噪声
      const t = elapsed / 1000;
      const base = 0.5 + 0.5 * Math.sin(t * Math.PI * 1.0);
      const flutter = 0.15 * Math.sin(t * Math.PI * 8);
      const noise = (Math.random() - 0.5) * 0.1;
      this.mouthTargetValue = Math.max(0, Math.min(1, base + flutter + noise));
      requestAnimationFrame(driveLipSync);
    };
    driveLipSync();
  }

  stopTalking() {
    this.mouthTargetValue = 0;
    if (this.currentState === 'talking') this.setState('idle');
  }

  /**
   * 真实音频驱动的 lipsync（v1.5 升级用）：
   * 接收 AudioContext 的 AnalyserNode，按音量驱动嘴张度。
   * 比上面的伪 lipsync 自然得多，留接口。
   */
  bindAudioLipSync(analyser: AnalyserNode) {
    const data = new Uint8Array(analyser.frequencyBinCount);
    const drive = () => {
      if (this.destroyed) return;
      analyser.getByteFrequencyData(data);
      // 取低频段平均值（人声主要在 100~800Hz）
      let sum = 0;
      const slice = data.slice(2, 24);
      for (const v of slice) sum += v;
      const volume = sum / slice.length / 255; // 0~1
      this.mouthTargetValue = Math.min(1, volume * 1.6);
      requestAnimationFrame(drive);
    };
    drive();
  }

  /** 鼠标跟随：让眼睛 / 头部微微转向光标，提升"活感" */
  private bindMouseTracking() {
    const handler = (e: MouseEvent) => {
      if (!this.model || !this.app) return;
      const rect = (this.app.view as HTMLCanvasElement).getBoundingClientRect();
      // 转换到 -1 ~ 1 范围
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      // pixi-live2d-display 提供 focus(x, y) 直接驱动
      this.model.focus(nx, -ny);
    };
    window.addEventListener('mousemove', handler);
    // 在 destroy 中解绑
    this.mouseHandler = handler;
  }
  private mouseHandler: ((e: MouseEvent) => void) | null = null;

  /** 触发某个表情（和 motion 是两套系统，可以叠加） */
  setExpression(name: string) {
    if (!this.model) return;
    this.model.expression(name);
  }

  /** 命中点击：返回是否点到了立绘上（用于桌宠窗口的"点哪里有反应"判断） */
  hitTest(x: number, y: number): string[] {
    if (!this.model) return [];
    return this.model.hitTest(x, y);
  }

  /** 销毁：注意顺序——先停 ticker，再销毁 model，再销毁 app */
  destroy() {
    this.destroyed = true;
    this.clearIdleTimer();
    if (this.mouseHandler) {
      window.removeEventListener('mousemove', this.mouseHandler);
      this.mouseHandler = null;
    }
    if (this.app) {
      this.app.ticker.remove(this.onTick);
    }
    if (this.model) {
      this.model.destroy({ children: true, texture: true, baseTexture: true });
      this.model = null;
    }
    if (this.app) {
      this.app.destroy(true, { children: true, texture: true, baseTexture: true });
      this.app = null;
    }
  }
}
```

这段控制器有几个值得讲解的设计点：

**第一，状态机分两类**——idle/thinking 是"循环类"，靠 setTimeout 自驱动；其它是"一次性"动作，播完自动回 idle。这种区分让外部 API 极简：调用方只要 `setState('thinking')`，不需要管定时器。

**第二，嘴型用 target/current 双值平滑插值**。直接把 LLM 流式 chunk 的字数赋给 `ParamMouthOpenY` 会出现机械抖动，平滑后就像真在说话。这是个低成本高回报的小技巧。

**第三，留了真实音频 lipsync 接口**。MVP 用伪 lipsync 够用，后期接 TTS 音频时无缝升级，不用改业务代码。

**第四，destroy 顺序很关键**。Live2D + PixiJS 的资源释放如果顺序错了会泄露 GPU 纹理，所以严格按"timer → ticker → model → app"释放。

## 5. Zustand Store：把控制器接到全局状态

```ts
// packages/ui/src/Live2DStage/companionStore.ts

import { create } from 'zustand';
import type { CompanionState, CompanionConfig } from './types';
import type { Live2DController } from './Live2DController';

interface CompanionStore {
  controller: Live2DController | null;
  state: CompanionState;
  config: CompanionConfig;
  
  bindController: (c: Live2DController | null) => void;
  setState: (s: CompanionState) => void;
  speak: (text: string) => void;
  updateConfig: (patch: Partial<CompanionConfig>) => void;
}

export const useCompanionStore = create<CompanionStore>((set, get) => ({
  controller: null,
  state: 'idle',
  config: {
    modelId: 'xingzi',
    scale: 0.3,
    position: { x: 0, y: 0 },
    enableLipSync: true,
    enableEyeTracking: true,
  },

  bindController: (c) => set({ controller: c }),

  setState: (s) => {
    set({ state: s });
    get().controller?.setState(s);
  },

  /**
   * speak 是高层 API：前端任何地方调 useCompanionStore().speak('...') 
   * 立绘就会嘴动 + 切换到 talking 态。
   * 时长按字数估算（中文约 200 字/分钟 = 300ms/字）
   */
  speak: (text: string) => {
    const ms = Math.max(1000, text.length * 250);
    get().controller?.startTalking(ms);
    set({ state: 'talking' });
  },

  updateConfig: (patch) => {
    const next = { ...get().config, ...patch };
    set({ config: next });
    get().controller?.applyTransform(next);
  },
}));
```

把控制器和 React 状态用 Zustand 桥接的好处是：业务代码（比如"解读完成"事件触发的地方）**不需要 import 控制器，只 import store**，调用 `setState('celebrate')` 就行。状态机的实现细节被牢牢封装。

## 6. React 组件 `<Live2DStage />`

```tsx
// packages/ui/src/Live2DStage/Live2DStage.tsx

import { useEffect, useRef } from 'react';
import { Live2DController } from './Live2DController';
import { useCompanionStore } from './companionStore';

interface Props {
  className?: string;
  /** 用于桌宠窗口：点击立绘的额外回调（除了内置的 shy 反应） */
  onTap?: () => void;
}

export function Live2DStage({ className, onTap }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<Live2DController | null>(null);
  const { config, bindController, setState } = useCompanionStore();

  // 用一个 effect 处理初始化与销毁；
  // 注意 deps 是空数组——config 变化用单独的 effect 同步
  useEffect(() => {
    if (!containerRef.current) return;

    let cancelled = false;
    const controller = new Live2DController(containerRef.current);
    controllerRef.current = controller;

    controller.init(config).then(() => {
      if (cancelled) {
        controller.destroy();
        return;
      }
      bindController(controller);
    }).catch((err) => {
      console.error('[Live2D] init failed:', err);
    });

    return () => {
      cancelled = true;
      bindController(null);
      controller.destroy();
      controllerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // config 变化（比如设置面板调整缩放）时同步给控制器，
  // 这种"配置增量同步"比每次都重建控制器要平滑得多
  useEffect(() => {
    controllerRef.current?.applyTransform(config);
  }, [config]);

  const handleClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const hitParts = controllerRef.current?.hitTest(x, y) ?? [];
    if (hitParts.length > 0) {
      // 真的点到了立绘
      setState('shy');
      onTap?.();
    }
  };

  return (
    <div
      ref={containerRef}
      className={className}
      onClick={handleClick}
      style={{ width: '100%', height: '100%', cursor: 'pointer' }}
    />
  );
}
```

注意 `useEffect` 用空依赖数组只跑一次的写法。配置变化通过第二个 effect 增量同步给控制器，而不是销毁重建——**Live2D 模型重建一次需要 1-2 秒，绝对不能因为缩放调整就重建**。

## 7. 业务侧使用：测算流程接入立绘反应

下面演示业务代码如何驱动立绘的情绪——这是最终用户能看到的"她在认真看你的手相"的效果。

```tsx
// apps/desktop/src/pages/ResultPage.tsx (节选)

import { useEffect } from 'react';
import { useCompanionStore } from '@cyberoracle/ui/Live2DStage';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

export function ResultPage({ id }: { id: string }) {
  const setCompanion = useCompanionStore((s) => s.setState);
  const speak = useCompanionStore((s) => s.speak);

  useEffect(() => {
    let unlistenChunk: (() => void) | undefined;
    let unlistenDone: (() => void) | undefined;

    (async () => {
      // 1. 进入测算状态：立绘开始 think
      setCompanion('thinking');

      // 2. 监听 Rust 流式推回的解读 chunk
      unlistenChunk = await listen<{ delta: string }>('analyze:chunk', (e) => {
        // 每收到一段文字，让立绘"说"这段（嘴动 + 状态切到 talking）
        speak(e.payload.delta);
      });

      // 3. 监听完成事件：切换到 celebrate
      unlistenDone = await listen('analyze:done', () => {
        setCompanion('celebrate');
      });

      // 4. 触发后端开始流式分析
      try {
        await invoke('analyze_stream', { id });
      } catch (err) {
        console.error(err);
        setCompanion('sad');
      }
    })();

    return () => {
      unlistenChunk?.();
      unlistenDone?.();
      setCompanion('idle');
    };
  }, [id, setCompanion, speak]);

  return (
    <div className="result-page">
      {/* 左侧：立绘 */}
      <div className="companion-side">
        <Live2DStage />
      </div>
      {/* 右侧：流式渲染的解读卡片 */}
      <div className="poster-side">
        {/* ...解读 UI... */}
      </div>
    </div>
  );
}
```

这一段是整个 Live2D 集成在产品价值上最重要的一节：**业务代码只跟 store 打交道，不感知 PixiJS 的存在**。前端工程师写业务时心智负担为零，立绘像一个"会自动反应的角色"，符合预期。

## 8. 桌宠窗口：透明背景 + 拖拽 + 右键菜单

桌宠是 Tauri 客户端的杀手级体验，下面是 Tauri 配置和 React 组件的写法。

### 8.1 Tauri 窗口配置

```json
// apps/desktop/src-tauri/tauri.conf.json (节选)
{
  "app": {
    "windows": [
      {
        "label": "main",
        "title": "赛博玄学馆",
        "width": 1280,
        "height": 800,
        "visible": false
      },
      {
        "label": "companion",
        "url": "/companion",
        "width": 400,
        "height": 600,
        "decorations": false,
        "transparent": true,
        "alwaysOnTop": true,
        "skipTaskbar": true,
        "resizable": false,
        "shadow": false
      }
    ]
  }
}
```

注意：**`transparent: true` 在 macOS 上需要在 `Info.plist` 配置 `NSRequiresAquaSystemAppearance`，Linux 在某些 WM 下不支持**。Tauri 2 已经在多平台上抹平了大部分差异，但实际打包后必须三平台真机测试。

### 8.2 桌宠页面组件

```tsx
// apps/desktop/src/pages/CompanionWindow.tsx

import { useEffect } from 'react';
import { Live2DStage } from '@cyberoracle/ui/Live2DStage';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { Menu } from '@tauri-apps/api/menu';
import { invoke } from '@tauri-apps/api/core';

export function CompanionWindow() {
  // 拖拽：按下立绘任意位置都能拖动整个窗口
  // Tauri 提供 startDragging API，但要避免点击 hit test 命中部位时才拖
  const handlePointerDown = async (e: React.PointerEvent) => {
    // 左键且非右键菜单
    if (e.button !== 0) return;
    await getCurrentWindow().startDragging();
  };

  // 右键菜单
  const handleContextMenu = async (e: React.MouseEvent) => {
    e.preventDefault();
    const menu = await Menu.new({
      items: [
        { id: 'show_main', text: '打开主窗口' },
        { id: 'today', text: '看看今日运势' },
        { id: 'separator', kind: 'Separator' as const },
        { id: 'change_model', text: '换个伙伴' },
        { id: 'hide', text: '让她回家休息' },
      ],
    });
    await menu.popup();
    // 注意：实际项目用 Menu::on_event 在 Rust 侧处理点击会更稳，
    // 这里仅展示前端发起的最简形式
  };

  // 接收 Rust 推来的"主动陪伴"事件（每日运势、随机互动）
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    import('@tauri-apps/api/event').then(({ listen }) => {
      listen<{ kind: string; text?: string }>('companion:event', (e) => {
        // 由全局 store 统一调度
        // 例如 e.payload.kind === 'morning_greet' → 打招呼 + 朗读
      }).then((fn) => { unlisten = fn; });
    });
    return () => unlisten?.();
  }, []);

  return (
    <div
      onPointerDown={handlePointerDown}
      onContextMenu={handleContextMenu}
      style={{
        width: '100vw',
        height: '100vh',
        background: 'transparent',
        // 关键：让透明区域不响应鼠标，只有立绘本身可点击
        // 真正的"鼠标穿透"效果要靠 Live2DController.hitTest 配合
        // Tauri 的 setIgnoreCursorEvents 动态切换实现
      }}
    >
      <Live2DStage onTap={() => invoke('companion_tapped')} />
    </div>
  );
}
```

### 8.3 鼠标穿透优化

桌宠窗口是矩形的，但立绘是非矩形——不做处理的话，鼠标在立绘外侧的"看不见的方框区域"也会拦截点击，挡住下层桌面。处理方式是用 `mousemove` 实时检测当前光标是否在立绘像素上，命中切换 `setIgnoreCursorEvents`：

```ts
// 在 Live2DController 中加入
enableHitThroughOnTransparent(window: Window) {
  // 每秒 30 次足够，避免 mousemove 过频
  let lastSwitch = 0;
  window.addEventListener('mousemove', async (e) => {
    const now = performance.now();
    if (now - lastSwitch < 33) return;
    lastSwitch = now;

    const rect = (this.app!.view as HTMLCanvasElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const hitParts = this.model?.hitTest(x, y) ?? [];
    const onModel = hitParts.length > 0;

    // 通过 Tauri command 切换鼠标穿透
    await invoke('set_cursor_passthrough', { passthrough: !onModel });
  });
}
```

对应 Rust 侧：

```rust
// src-tauri/src/commands/window.rs
#[tauri::command]
pub async fn set_cursor_passthrough(window: tauri::Window, passthrough: bool) -> Result<(), String> {
    window.set_ignore_cursor_events(passthrough).map_err(|e| e.to_string())
}
```

这样桌宠就真正做到"立绘可点、其余穿透"的效果，和市面上的桌宠产品体验持平。

## 9. 性能与优化清单

| 项 | 做法 |
|---|---|
| 模型纹理大小 | 单张不超过 2048×2048，超过的让美术拆成多张 |
| 渲染帧率 | 桌宠窗口 30fps（够用且省电）；主窗口 60fps |
| 空闲省电 | 窗口失焦时把 ticker 降到 15fps（用 `app.ticker.maxFPS = 15`） |
| 内存 | 切换模型时严格 destroy 旧模型再加载新模型 |
| 启动加速 | 模型懒加载：主窗口先显示 UI，立绘 200ms 后再 init |
| 资源 | live2dcubismcore.min.js 和模型文件本地打包，不走网络 |

## 10. 已知坑位 cheat sheet

写出来你团队踩到时能快速对照：

- **黑屏不渲染**：99% 是 `live2dcubismcore.min.js` 没在 React 加载前注入，或路径 404；
- **嘴不动**：模型的参数 ID 不一定叫 `ParamMouthOpenY`，要打开 `model3.json` 看 `Parameters` 配置，不同模型不同；
- **PixiJS 8 模型加载失败**：版本不兼容，回退到 6.5.10；
- **macOS 透明窗口下立绘有黑边**：开 `antialias: true` + `backgroundAlpha: 0`；
- **Linux 透明窗口失败**：依赖合成器，部分发行版默认不开；
- **destroy 后再 init 报错"texture is destroyed"**：说明上次 destroy 不彻底，按 §4 destroy 顺序检查；
- **motion 不播放**：检查 `model3.json` 的 `Motions` 字段组名是否和 `STATE_TO_GROUP` 一致，**大小写敏感**。

---

这一份 Live2D 集成示例就到这里。它已经覆盖了：控制器引擎、状态机、嘴型同步、眼神跟随、Zustand 状态桥、React 组件封装、桌宠透明窗口、鼠标穿透、业务接入示例、性能与坑位。**拿到代码就能跑起来一个能在桌面上"陪你"的 Live2D 占卜师**。
