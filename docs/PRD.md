# 赛博玄学馆 · 跨端 PRD（Web + Tauri 客户端）

## 一、产品定义

### 1.1 双形态定位

**Web 端 —— 赛博玄学馆（cyberoracle.app）**
- 定位：**轻量试玩 + 病毒传播 + 客户端获取入口**
- 核心目标：让访客在 60 秒内完成一次解读、生成可分享长图、看到客户端下载引导

**桌面客户端 —— 赛博玄学馆 · 桌面版**
- 定位：**沉浸式陪伴 + 完整功能 + 隐私优先**
- 核心目标：把"占卜师"做成一个有人格的桌面伙伴，类似 VTuber/桌宠的存在
- 差异化体验：本地 Live2D 立绘、语音播报、托盘驻留、每日运势主动推送、本地加密历史、无网络依赖（可选本地小模型）

### 1.2 用户旅程：从 Web 到客户端

```
小红书种草 / 朋友分享长图
  ↓
Web 首页 → 体验"AI 看手相"（无需注册）
  ↓
拿到精美长图 → 截图发圈 / 保存
  ↓
长图右下角 + 网站顶部 CTA：「下载桌面版，让她每天陪你」
  ↓
下载 Tauri 客户端（macOS / Windows / Linux）
  ↓
首次启动：导入 Web 历史（扫码或粘贴 ID）
  ↓
设置桌面伙伴形象 + 名字 + 互动频率
  ↓
长期使用：每日运势推送、随时呼出占卜、立绘陪伴
```

这是一个**"漏斗 + 留存"双轮模型**：Web 负责规模化曝光与拉新，客户端负责高粘性留存与变现。

### 1.3 北极星指标（双轨）

- **Web 端**：解读完成率 × 长图导出率 × 客户端下载转化率
- **客户端**：日活留存 × 单用户日均互动次数 × 7 日留存

---

## 二、功能矩阵

| 功能 | Web | 客户端 | 说明 |
|---|---|---|---|
| AI 看手相 | ✅ | ✅ | 共用同一套 Prompt 与出图模板 |
| AI 看面相 | ✅ | ✅ | 同上 |
| 解读长图导出 | ✅ | ✅ | 客户端可一键复制到剪贴板/拖拽到桌面 |
| 今日运势 | ✅ | ✅ | 客户端在每天 9:00 主动推送 |
| 历史记录 | IndexedDB（20 条） | 本地加密文件（无限） | 客户端隐私更强 |
| 水晶球主交互 | ✅ | ✅ | |
| **Live2D 桌面伙伴** | ❌ | ✅ | 客户端独占 |
| **语音播报解读** | ❌ | ✅ | TTS 朗读 |
| **托盘 + 全局快捷键** | ❌ | ✅ | `Cmd/Ctrl+Shift+O` 唤出占卜 |
| **桌宠透明窗口** | ❌ | ✅ | 立绘悬浮桌面 |
| **本地小模型可选** | ❌ | ✅（v2） | 完全离线运行 |
| 抽签 / 塔罗 | v2 | v2 | 二期共建 |
| 账号系统 | ❌ | ❌（用本地 ID + 可选云同步） | MVP 不做 |

> 关键决策：**客户端的"独占功能"必须足够诱人，否则用户没动力下载**。Live2D 立绘 + 主动陪伴是核心钩子，参考 VTuber 经济的成功逻辑。

---

## 三、统一架构总览

### 3.1 整体架构图

```
                      ┌────────────────────────┐
                      │   共享云服务（轻量）     │
                      │  - LLM/VLM 代理网关     │
                      │  - 内容安全转发         │
                      │  - 客户端版本检查       │
                      │  - 长图分享（Web only） │
                      └────────┬───────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            │                                     │
            │ HTTPS                               │ HTTPS
            │                                     │
┌───────────▼──────────┐              ┌───────────▼─────────────┐
│  Web 端              │              │  Tauri 桌面客户端        │
│  Next.js 14 + React  │              │  ┌──────────────────┐   │
│                      │              │  │ Webview          │   │
│  - 首页 / 上传 / 结果 │              │  │ Vite + React     │   │
│  - 文件落本服务器盘   │              │  │ (复用 Web 组件)   │   │
│  - SSR + SEO         │              │  └────────┬─────────┘   │
│  - satori 出图       │              │           │ tauri.invoke│
│  - Web 历史: IDB     │              │  ┌────────▼─────────┐   │
└──────────────────────┘              │  │ Rust 核心 (Axum  │   │
                                      │  │ 风格 command 层) │   │
                                      │  │  - LLM 调用      │   │
                                      │  │  - 出图 (resvg)  │   │
                                      │  │  - 加密存储      │   │
                                      │  │  - 托盘/窗口     │   │
                                      │  │  - Live2D 资源   │   │
                                      │  └──────────────────┘   │
                                      └─────────────────────────┘
```

### 3.2 Monorepo 结构

```
cyberoracle/
├── apps/
│   ├── web/                      # Next.js 14 网页端
│   │   ├── app/
│   │   ├── public/
│   │   └── package.json
│   │
│   ├── desktop/                  # Tauri 客户端
│   │   ├── src/                  # Vite + React 前端
│   │   ├── src-tauri/            # Rust 后端
│   │   │   ├── src/
│   │   │   │   ├── main.rs
│   │   │   │   ├── commands/     # invoke 处理函数
│   │   │   │   ├── llm/          # LLM 调用 (reqwest + SSE)
│   │   │   │   ├── render/       # SVG → PNG
│   │   │   │   ├── storage/      # 加密文件存储
│   │   │   │   ├── tray.rs
│   │   │   │   └── window.rs
│   │   │   └── Cargo.toml
│   │   └── package.json
│   │
│   └── server/                   # 共享云端 API（Web 也用它）
│       ├── app/api/
│       └── package.json
│
├── packages/
│   ├── core/                     # 跨端业务逻辑
│   │   ├── prompts/              # system prompt + few-shot
│   │   ├── schemas/              # Zod schema (PalmReadingResult 等)
│   │   ├── content-safety/       # 关键词黑名单
│   │   └── types/
│   │
│   ├── poster/                   # satori 长图模板（React 组件）
│   │   ├── PalmReadingPoster.tsx
│   │   ├── FaceReadingPoster.tsx
│   │   ├── DailyFortuneCard.tsx
│   │   ├── icons/                # 内联 SVG 图标
│   │   └── fonts/                # 思源宋体子集
│   │
│   ├── ui/                       # 跨端 React 组件库
│   │   ├── CrystalBall/          # react-three-fiber 水晶球
│   │   ├── NeonText/
│   │   ├── UploadDropzone/
│   │   ├── StreamingPoster/      # 流式渲染长图组件
│   │   └── Live2DStage/          # 仅在 desktop 引用
│   │
│   └── tokens/                   # 设计 token (色板/字号/动效曲线)
│
├── pnpm-workspace.yaml
└── turbo.json
```

> 这个结构的关键收益是：**`packages/poster` 同时被 Web 端 satori（Node.js 服务端）、客户端 satori（Rust 通过 deno_core 或 Node sidecar 跑）、以及客户端预览 React 组件三处复用**——一份 JSX 三处出图，前面 PRD 那张精美的"手相解读指南"长图在两端体验完全一致。

### 3.3 客户端"出图"的两条可选路径

由于客户端不能直接跑 Node，satori 这个 npm 包要在 Tauri 里跑需要做选择。我评估了几条路并推荐方案：

**方案 A（推荐）：Node.js Sidecar**
Tauri 支持把一个 Node 可执行文件作为 sidecar 打包，约增加 30 MB 体积。出图请求通过本地 stdio 与 Node 进程通信，调 satori + resvg-js。**优点**：与 Web 端完全相同的代码路径，零差异；**缺点**：包体积变大。

**方案 B：纯 Rust 重写图模板**
用 `usvg` + `resvg` (rust crate) 直接构造 SVG，模板用 Rust 的 `askama` 或字符串拼接。**优点**：包体积小（<10 MB）；**缺点**：JSX 模板要在 Rust 里重写一遍，且无法享受 Tailwind。

**方案 C：调云端 API 出图**
直接复用 `apps/server` 的 `/api/render-image`。**优点**：零客户端工作量；**缺点**：客户端必须联网才能出图，违背"本地优先"卖点。

**最终决定**：**MVP 用方案 C**（快速上线、保证模板一致性），**v1.5 切到方案 A**（提供离线出图体验，体积代价可接受）。方案 B 仅在体积成为转化瓶颈时才考虑。

---

## 四、技术栈最终选型表

### 4.1 Web 端

| 层 | 选型 | 理由 |
|---|---|---|
| 框架 | Next.js 14 (App Router) + TypeScript | SSR + SEO + RSC + AI SDK 一等公民 |
| 样式 | Tailwind CSS + 设计 token | 与客户端共用 |
| 3D | react-three-fiber + drei + postprocessing | 水晶球、霓虹辉光 |
| 动画 | Framer Motion | UI 出入场 |
| 粒子 | tsParticles | 环境氛围 |
| AI SDK | Vercel AI SDK | 流式 SSE |
| 本地存储 | IndexedDB（Dexie.js） | 历史记录 20 条 |
| 出图 | satori + @resvg/resvg-js | 服务端生成 PNG |
| 部署 | Docker + VPS（Caddy 反代） | 文件系统持久化 |

### 4.2 Tauri 客户端 — 前端层

| 层 | 选型 | 理由 |
|---|---|---|
| 构建 | Vite + React 18 + TypeScript | 启动快、与 Web 共组件 |
| 路由 | React Router | SPA 路由 |
| 样式 | Tailwind CSS（同 Web） | 跨端 token 一致 |
| 3D | react-three-fiber（同 Web） | 共用水晶球组件 |
| 动画 | Framer Motion（同 Web） | |
| **Live2D 立绘** | PixiJS + pixi-live2d-display + Live2D Cubism SDK | 业界标准方案 |
| 状态管理 | Zustand | 轻量、跨端可移植 |
| Tauri 通信 | `@tauri-apps/api` 的 `invoke` / `event` | 官方 |

### 4.3 Tauri 客户端 — Rust 后端层

| 层 | 选型 | 理由 |
|---|---|---|
| Tauri | 2.0 | 最新稳定版，多窗口与权限模型 |
| HTTP / SSE | `reqwest` + `eventsource-stream` | 调 LLM API |
| 异步运行时 | Tokio | reqwest/Tauri 默认 |
| JSON | `serde` + `serde_json` | 与 TS schema 互通 |
| 本地存储加密 | `ring` (AES-256-GCM) + 文件系统 | 历史数据加密 |
| 密钥管理 | `keyring` crate（系统钥匙串） | macOS Keychain / Windows Credential Manager |
| LLM API Key | 走云端代理（不下发到客户端） | 防止盗用 |
| 出图 | MVP 调云端；v1.5 sidecar Node | 见 §3.3 |
| 全局快捷键 | `tauri-plugin-global-shortcut` | 官方 |
| 托盘 | Tauri 内置 tray API | |
| 自动更新 | `tauri-plugin-updater` | 官方 |
| TTS（语音播报） | macOS: `say`；Windows: SAPI；Linux: `espeak` | 系统自带，零依赖；v2 可换 Edge TTS |

### 4.4 共享云端 API

| 层 | 选型 | 理由 |
|---|---|---|
| 框架 | Next.js Route Handlers (Node 20) | 同时服务 Web 和客户端 |
| LLM | 通义千问 VL-Max (主) / GLM-4V (备) / GPT-4o (兜底) | 中文 + 视觉 + 价格 |
| 文本 LLM | DeepSeek V3 | 中文文学性强、便宜 |
| 内容安全 | 阿里云内容安全 API | 国内合规 |
| 限流 | 内存 LRU + IP 双层 | 无 Redis |
| 文件存储 | 本地文件系统 + 7 天清理 | 沿用前 PRD |
| 部署 | Docker + VPS + Caddy | 持久磁盘 |

> 关键安全设计：**LLM API Key 不下发到客户端**。所有 LLM 调用走云端代理 `apps/server`，这样既能集中限流计费、又能审计、又能实时换模型。客户端通过 device fingerprint + JWT 短令牌鉴权（不需要传统账号）。

---

## 五、Tauri 客户端核心功能详细规格

### 5.1 多窗口设计

客户端有四种窗口形态，Tauri 用配置即可创建：

**(1) 主窗口 `main`**
- 尺寸：1280×800（可缩放）
- 内容：完整功能区（手相、面相、运势、历史、设置）
- 视觉：复用 Web 端的赛博玄学风格

**(2) 桌宠窗口 `companion`**
- 尺寸：400×600，无边框，透明背景，置顶可选
- 内容：Live2D 立绘 + 简易气泡对话
- 行为：可拖拽、双击呼出主窗口、右键菜单（隐藏/换装/对话）
- 默认开机自启动隐藏在桌面右下角

**(3) 速召唤窗口 `quick`**
- 尺寸：520×360，无边框，居中浮现
- 触发：全局快捷键 `Cmd/Ctrl+Shift+O`
- 内容：一个浮动的水晶球 + 输入框「问点什么？」
- 行为：失焦自动隐藏，类似 Spotlight/Raycast

**(4) 通知气泡 `bubble`**
- 系统原生通知或自定义小窗
- 触发：每日运势推送、解读完成提醒

### 5.2 Live2D 桌面伙伴详细设计

这是客户端的**最大独占卖点**，必须做出彩。

**资源选择**：
- MVP 使用 1-2 个开源/授权 Live2D 模型作为默认伙伴；
- 角色定位与图中视觉一致——白发、霓虹光、神秘机械感占卜师；
- 模型规格：Cubism 4.0+，含 idle/talk/think/celebrate/sad 五种基础动作；

**交互行为**：
- **空闲态**：每 8-12 秒随机播放一个 idle 动作 / 眨眼 / 微笑；
- **被点击**：随机触发"互动语录"+ 对应动作（点头/挥手/害羞）；
- **测算中**：think 动作循环 + 头顶冒紫色光圈；
- **解读完成**：celebrate 动作 + 鼓励台词；
- **每日运势**：早 9:00 主动播放"今天我看了下星象"+ 弹气泡；

**台词系统**：
- 一份本地 JSON（`companion-dialogues.json`）含 200+ 句分类台词；
- 也支持调 LLM 生成"今日的一句话"（用户可关闭省钱）；
- 台词可由用户在设置中自定义性格（古风端庄 / 俏皮少女 / 冷淡神秘）；

**性能预算**：
- Live2D 渲染独占一个 PixiJS 实例，60fps；
- 桌宠窗口空闲时 CPU < 3%，内存 < 150 MB；
- 主窗口未打开时桌宠不阻塞其他渲染。

### 5.3 全局快捷键 + 托盘

**默认快捷键**：
- `Cmd/Ctrl+Shift+O`：呼出快速窗口
- `Cmd/Ctrl+Shift+P`：直接进入手相上传
- `Cmd/Ctrl+Shift+D`：查看今日运势
- `Cmd/Ctrl+Shift+H`：显示/隐藏桌宠

**托盘菜单**：
```
📿 赛博玄学馆
─────────────
今日运势
─────────────
看手相
看面相
─────────────
显示主窗口
显示桌面伙伴 ✓
─────────────
设置
退出
```

### 5.4 本地加密存储

**目录布局**（macOS 示例）：
```
~/Library/Application Support/cyberoracle/
  ├── config.json              # 用户偏好（明文）
  ├── companion/
  │   ├── current.json         # 当前选中的 Live2D 模型
  │   └── models/              # 已下载的模型文件
  ├── history/
  │   ├── index.enc            # 加密历史索引
  │   └── records/
  │       └── {id}.enc         # 加密的解读 JSON
  ├── images/
  │   └── {id}.png             # 长图缓存（不加密，可分享）
  └── logs/
      └── app-{date}.log
```

**加密方案**：
- 首次启动时生成 256 位主密钥，存入系统钥匙串（macOS Keychain / Windows Credential Manager / Linux Secret Service）；
- 所有历史 JSON 用 AES-256-GCM 加密，IV 随机；
- 长图 PNG 不加密（用户要分享出去）；
- 即使整个 history 文件夹被拷走，无钥匙串也无法解密。

**为什么必须加密**：手相/面相涉及生物特征隐喻数据，国内监管对此类数据处理日趋严格；客户端"隐私优先"也是相对 Web 端的一个差异化卖点。

### 5.5 客户端调用流程

以"看手相"为例：

```
用户点击"看手相" 
  ↓
打开上传组件 → 选择/拖拽图片
  ↓
React 调 invoke("upload_image", { path, type: "palm" })
  ↓
Rust: 读文件 → sharp-rs 等库 resize → WebP 编码
       → 调云端 /api/upload → 返回 id
       → 写本地 history index (encrypted)
  ↓
React: 跳转 /result/:id，启动测算中 UI（水晶球 + Live2D thinking）
  ↓
React 调 invoke("analyze_stream", { id })
  ↓
Rust: reqwest 建立 SSE 连接 → /api/analyze
       → 用 tauri::Window::emit 把每个 chunk 推回前端
  ↓
React: 监听 event "analyze:chunk" → 增量更新 UI
  ↓
完成后 React 调 invoke("render_poster", { id })
  ↓
Rust: MVP 转发云端 /api/render-image，下载 PNG 落盘
       v1.5 启动 Node sidecar 本地出图
  ↓
React: 显示长图 + 操作（保存/复制/分享）
       Live2D 触发 celebrate
```

### 5.6 Rust Command 接口清单

```rust
// src-tauri/src/commands/mod.rs (示意)

#[tauri::command]
async fn upload_image(path: String, kind: String) -> Result<UploadResult, String>;

#[tauri::command]
async fn analyze_stream(window: tauri::Window, id: String) -> Result<(), String>;
// 通过 window.emit("analyze:chunk", payload) 推送

#[tauri::command]
async fn render_poster(id: String) -> Result<String, String>;  // 返回本地 PNG 路径

#[tauri::command]
async fn list_history(limit: usize) -> Result<Vec<HistoryItem>, String>;

#[tauri::command]
async fn get_history(id: String) -> Result<ReadingResult, String>;

#[tauri::command]
async fn delete_history(id: String) -> Result<(), String>;

#[tauri::command]
async fn save_image_to(target_path: String, id: String) -> Result<(), String>;

#[tauri::command]
async fn copy_image_to_clipboard(id: String) -> Result<(), String>;

#[tauri::command]
async fn fetch_daily_fortune() -> Result<DailyFortune, String>;

#[tauri::command]
async fn set_companion_model(model_id: String) -> Result<(), String>;

#[tauri::command]
async fn speak_text(text: String, voice: Option<String>) -> Result<(), String>;
// 调系统 TTS

#[tauri::command]
async fn toggle_companion_window() -> Result<bool, String>;

#[tauri::command]
async fn import_web_history(token: String) -> Result<usize, String>;
// 扫码 / 输入 token 从 Web 拉历史
```

> 这套 command 层就是你想要的"Rust 后端"——它本质上和 Axum 的 handler 是一回事，只是绑定到 Tauri IPC 而非 HTTP。**Rust 在客户端发挥真正价值**：本地 IO、加密、系统集成、性能。

---

## 六、Web → 客户端 转化漏斗设计

转化设计是这次新增的关键模块，必须刻意打磨。

### 6.1 Web 端引导触点

**触点 1：长图右下角水印**
每张生成的解读长图右下角加一行小字 + 二维码：
> "由赛博玄学馆生成 · 扫码下载桌面版让她每天陪你"

**触点 2：结果页 CTA**
解读完成后，水晶球区域转换为「她想搬到你桌面上」卡片，带 macOS / Windows 下载按钮，点击直跳 `/download`。

**触点 3：第二次访问触发**
通过 IDB 检测用户已生成过 ≥1 次解读且当次又来了，弹出温柔提示气泡："发现你回来了——要不要把我接到桌面？"

**触点 4：分享页钩子**
当被分享给的访客打开 `/share/{id}` 长图时，页面顶部固定条：「制作这张图的 AI 占卜师，可以下载到你的电脑陪你」。

### 6.2 下载页 `/download`

**关键内容**：
- 上方：客户端动图（Live2D 立绘在 mock 桌面上的 Lottie/视频）；
- 三大独占卖点：「桌面伙伴 Live2D」「全局呼出」「本地加密历史」；
- 平台下载按钮：macOS（Universal）/ Windows x64 / Linux AppImage；
- 系统要求；
- 一段简短的"她的故事"文案，把占卜师塑造成有人格的伙伴。

### 6.3 历史从 Web 导入客户端

**机制**：
1. 用户在 Web 端结果页点击"在桌面继续"，前端用 IDB 历史 + 一个一次性 token 调云端 `/api/handoff`，云端返回 6 位数字 code（10 分钟有效）；
2. 客户端首次启动后引导："你之前在网页玩过吗？输入 6 位码导入历史"；
3. 客户端调 `import_web_history(code)`，云端返回历史列表，写入本地加密存储。

**为什么不直接登录**：
保持"无账号"承诺，code 是一次性的，体验更轻、隐私顾虑更小。

### 6.4 客户端反向引导分享

客户端生成解读后的"分享"按钮提供三个选项：
1. **保存图片**（PNG）
2. **复制到剪贴板**
3. **生成分享链接**：客户端把 JSON 上传到云端 `/api/share`，得到 `cyberoracle.app/share/{id}`，便于发到社交。

---

## 七、Prompt 工程（双端共用）

完全复用前一份 PRD 的设计：**两阶段调用 + 严格 JSON Schema + few-shot**。这里只补充客户端独占的两个新 Prompt：

### 7.1 桌面伙伴台词生成（客户端独占）

**用途**：每日运势推送时，由 AI 生成一句符合伙伴人设的开场白。

**System Prompt**：
```
你是赛博玄学馆的桌面占卜师"星子"，性格设定如下：
{personality_preset}  // 用户在设置中选择的人设：古风端庄/俏皮少女/冷淡神秘

请生成一句"对今天的开场白"，用于早晨向用户问好并引出今日运势。
要求：
1. 30 字以内；
2. 第一人称；
3. 与今日干支 / 节气有微妙呼应（输入会提供）；
4. 温和、有陪伴感，不预测吉凶；
5. 仅输出一句话，无引号、无解释。
```

**User Prompt**：
```
今日干支：{ganzhi}
节气：{solar_term}
用户名：{user_nickname}
```

### 7.2 快速问答 Prompt（速召唤窗口）

用户按全局快捷键问"今天适合表白吗？"这种短问题时使用。

**System Prompt**（节选）：
```
你是赛博玄学馆的占卜师，用户向你提出生活中的小问题。
请用 80 字以内的回答，给出一个温和的、带有玄学风格的建议。
原则：
1. 不做绝对判断，多用"宜""不妨""可以试着"；
2. 回避健康、寿命、金额、生死话题；
3. 末尾可以加一句俏皮收束（占 1/3 概率）；
```

---

## 八、长图生成模板（双端一致）

完全复用 §7 前一版 PRD 的设计，这里强调**双端一致性保证**：

- 模板代码在 `packages/poster`，单一来源；
- Web 端服务端调 satori → resvg-js；
- 客户端 MVP 直接下载云端生成的 PNG；
- 客户端 v1.5 启动 Node sidecar 复用同一份 JSX；
- 字体（思源宋体子集）一份，两端共用；
- 长图右下角水印：Web 端是二维码 + 域名；客户端是「桌面版生成 · {date}」。

---

## 九、API 规格（云端共用）

所有接口同时服务 Web 和客户端，唯一差异是鉴权方式：

- Web：基于 IP + Turnstile；
- 客户端：基于设备指纹 JWT；

| 接口 | 方法 | Web | 客户端 | 说明 |
|---|---|---|---|---|
| `/api/upload` | POST | ✅ | ✅ | 上传图片，返回 id |
| `/api/analyze` | GET (SSE) | ✅ | ✅ | 流式解读 |
| `/api/render-image` | POST | ✅ | ✅（MVP） | 出图 |
| `/api/result/:id` | GET | ✅ | ✅ | 拉 JSON |
| `/api/result/:id/image` | GET | ✅ | ✅ | 拉 PNG |
| `/api/daily` | GET | ✅ | ✅ | 今日运势 |
| `/api/share` | POST | — | ✅ | 客户端→云端发布分享 |
| `/api/handoff` | POST | ✅ | — | Web 生成迁移 code |
| `/api/handoff/:code` | GET | — | ✅ | 客户端用 code 拉历史 |
| `/api/companion-line` | POST | — | ✅ | 桌面伙伴台词生成 |
| `/api/quick-ask` | POST (SSE) | — | ✅ | 快速问答 |
| `/api/version/desktop` | GET | — | ✅ | 自动更新元信息 |
| `/api/device/register` | POST | — | ✅ | 客户端首启领 JWT |

---

## 十、文件系统设计（云端 + 客户端）

### 10.1 云端（沿用前 PRD）

```
/storage
  /uploads/{id}.webp
  /uploads/{id}.meta.json
  /results/{id}.json
  /results/{id}.png
  /results/{id}.status
  /shares/{id}.json           # 客户端发布的分享
  /handoff/{code}.json        # Web→客户端迁移码（10 分钟过期）
  /index/index.jsonl
  /index/daily.json
  /logs/app-{date}.log
```

### 10.2 客户端（沿用 §5.4）

加密历史 + 长图缓存的方案如前述。

---

## 十一、设计语言（双端共用）

| 维度 | 规格 |
|---|---|
| 主色 | 紫 `#A855F7`、青 `#22D3EE`、品红 `#F472B6` |
| 暗底 | `#0B0420` |
| 长图配色（米色） | `#F8F5EE` 底 + `#1F1B16` 文字 + `#9A7B3F` 暗金 |
| 字体 | 思源宋体 SC（中文） + Orbitron（英文/数字） |
| 圆角 | 卡片 16，按钮 12，输入 10 |
| 辉光 | 三层 text-shadow 叠加 |
| 动效曲线 | `cubic-bezier(0.22, 1, 0.36, 1)` |
| 动效时长 | 进场 360ms / 退场 220ms |

设计 token 抽到 `packages/tokens`，Tailwind config 与原生 CSS 变量共用。

---

## 十二、性能与体积预算

### 12.1 Web 端

- 首屏 LCP ≤ 2.5s
- 首屏 JS gzip ≤ 220KB
- 3D / 粒子异步加载

### 12.2 客户端

| 指标 | 目标 |
|---|---|
| 安装包体积 | macOS DMG ≤ 12 MB；Windows MSI ≤ 10 MB（不含 Live2D 资源） |
| Live2D 模型按需下载 | 首次选择伙伴时拉取，每个 ~5-15 MB |
| 启动时间（冷） | ≤ 1.2s 到桌宠可见 |
| 主窗口打开 | ≤ 400ms |
| 桌宠空闲 CPU | < 3% |
| 桌宠空闲内存 | < 150 MB |
| 解读端到端 | ≤ 25s（与 Web 持平） |

---

## 十三、合规与安全

### 13.1 合规（双端一致）

- 全程定位为"娱乐性自我观察"，不涉及健康/寿命/政治/宗教；
- Prompt 与黑名单双重防护；
- 阿里云内容安全 API（图片 + 文本）；
- 客户端首启展示用户协议 + 隐私政策；
- 国内分发：Web 备案 + 客户端不通过 Mac App Store/Microsoft Store（避免审核延迟），通过官网 + 第三方下载站；
- 海外分发：客户端可考虑 Mac App Store 上架，文案略调。

### 13.2 客户端独有的安全要点

- **API Key 不下发**：所有 LLM 调用走云端代理；
- **设备 JWT 限流**：每设备每天 100 次解读上限（防滥用）；
- **代码签名**：macOS Apple Developer 签名 + Notarize；Windows EV 代码签名；
- **更新签名验证**：Tauri Updater 用 ed25519 公钥验证更新包；
- **防逆向不强求**：客户端代码没什么真正机密，关键凭据全在云端。

---

## 十四、监控与运维

### 14.1 客户端遥测（最小化）

只采集匿名指标，**不采集解读内容、不采集照片**：
- 启动次数、平台、版本；
- 功能使用次数（手相/面相/运势/快速问答各自 counter）；
- 崩溃栈（Sentry）；
- 性能：启动耗时、解读耗时；

用户在设置中可一键关闭遥测。

### 14.2 关键告警

- 客户端解读失败率 >5% → 检查云端代理；
- 客户端崩溃率 >0.5% → 立即查看 Sentry；
- 客户端版本过旧（>3 个版本）的活跃比 >30% → 推送强更新提示。

---

## 十五、成本估算（月度）

假设：Web 1000 DAU + 客户端 500 DAU，人均 1.5 次解读。

| 项目 | 月用量 | 成本 |
|---|---|---|
| 通义千问 VL-Max | 67,500 次 | ¥1,350 |
| DeepSeek V3 解读 | 67,500 次 | ¥340 |
| 桌面伙伴台词（开启用户 50%） | 7,500 次 | ¥40 |
| 快速问答（10% 用户每天 1 次） | 1,500 次 | ¥10 |
| 阿里云内容安全 | 135,000 次 | ¥270 |
| VPS 4C8G 100G | — | ¥220 |
| 域名 + CDN | — | ¥80 |
| Sentry | — | ¥0（免费档） |
| Apple 开发者 + Windows EV | 摊销 | ¥150 |
| 对象存储冷备 | — | ¥10 |
| **合计** | | **≈ ¥2,470 / 月** |

边际单次成本约 ¥0.025，**双端不显著推高成本，但客户端用户的 LTV 远高于 Web**。

---

## 十六、里程碑与排期

| 阶段 | 时长 | 交付 |
|---|---|---|
| **M1 共享基建** | 2 周 | monorepo 搭建、设计 token、`packages/poster` 模板、`packages/core` Prompt + Schema |
| **M2 Web 端 MVP** | 2 周 | 上传 → 解读 → 出图全链路，可对外测试 |
| **M3 云端代理 + 鉴权** | 1 周 | 设备 JWT、限流、handoff 接口 |
| **M4 Tauri 客户端骨架** | 2 周 | 主窗口 + 上传/解读/历史，复用 Web 组件 |
| **M5 桌面伙伴 Live2D** | 2 周 | 桌宠窗口、立绘、台词、托盘、快捷键 |
| **M6 加密 + 自动更新 + 打包签名** | 1 周 | 三平台正式打包、Notarize、签名 |
| **M7 转化漏斗 + 灰度** | 1 周 | 下载页、引导、Sentry、灰度发布 |

**总计约 11 周**，团队配置：1 全栈（React/TS） + 1 Rust + 0.5 设计 + 0.5 Live2D 美术。

---

## 十七、风险与对策

| 风险 | 概率 | 影响 | 对策 |
|---|---|---|---|
| Live2D 模型版权 | 中 | 高 | MVP 用授权或自制模型，预算 ¥3-8 千/个 |
| 客户端代码签名繁琐 | 高 | 中 | 早期就申请 Apple Developer + Windows EV 证书，避免上线被卡 |
| Tauri 2.0 部分插件不稳 | 中 | 中 | 关键插件（updater、tray、global-shortcut）做兼容性 spike |
| satori sidecar 体积超预算 | 中 | 中 | MVP 走云端兜底，v1.5 再切本地 |
| 用户用 Web 不愿迁移客户端 | 中 | 高 | 转化漏斗 + 客户端独占功能必须强；A/B 测试 CTA 文案 |
| 客户端遥测合规 | 低 | 高 | 默认告知 + 可关闭 + 不采集内容数据 |
| LLM 中文输出风格漂移 | 中 | 中 | few-shot 锁定 + 灰度对比 + 关键词审计 |

---

## 十八、未来扩展（v2+）

- **本地小模型**：客户端集成 Qwen2-VL-2B / 7B INT4，支持完全离线（包大小 +2-4 GB，但隐私彻底）；
- **多伙伴系统**：用户可收集多个 Live2D 角色，类似 vtuber 经济；
- **付费会员**：客户端高级功能（无限历史、专属伙伴、4K 长图、定制语音）；
- **iOS / Android**：用 Tauri Mobile 或独立 React Native 实现；
- **联机互动**：朋友间互发"AI 给对方画一张面相"礼物长图；
- **直播版（实验）**：占卜师作为 AI VTuber 在 B站/抖音开播，用户弹幕提问。
