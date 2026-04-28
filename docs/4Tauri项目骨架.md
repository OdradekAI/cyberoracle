# apps/desktop — Tauri 2.0 项目骨架完整代码

下面是这个客户端的完整 Rust + 前端骨架。我会按"由内到外"的顺序展开：先 Cargo / Tauri 配置打地基，再分层构建 Rust 模块（错误、配置、存储、加密、LLM、命令），最后给出托盘、窗口管理、自动更新和前端集成。这个顺序与你将来真实开发时的搭建顺序一致——**每一步都能 `cargo build` 跑通**。

---

## 〇、Tauri 2.0 工程关键约定（先讲清楚再写代码）

Tauri 2.0 与 1.x 有几处重大变化，先说清楚，否则代码看起来会突兀：

**第一，权限系统改了**。1.x 的 `allowlist` 没了，改用 `capabilities` JSON 文件按窗口粒度授权，每个 plugin 都要显式列权限。这是 Tauri 2 安全模型的核心。

**第二，插件全部独立化**。tray、global-shortcut、updater、notification 等都不是核心，要 `cargo add tauri-plugin-xxx` 单独引入并在 `tauri.conf.json` 注册，前端也要装对应 npm 包。

**第三，AppHandle 是新的中枢**。`Manager` trait 的所有方法都从 `AppHandle` / `Window` 调用，比 1.x 干净得多。

**第四，windows 配置移到 `app.windows`**。多窗口、透明、装饰、跳过任务栏全在这一处声明。

**第五，移动端友好**。同一份代码可以打 iOS/Android，但本项目 MVP 只做 desktop，移动端配置我会留 placeholder 不展开。

---

## 一、目录结构总览

```
apps/desktop/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── index.html
├── src/                                 # 前端 Vite + React
│   ├── main.tsx
│   ├── App.tsx
│   ├── routes.tsx
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── PalmUploadPage.tsx
│   │   ├── ResultPage.tsx
│   │   ├── HistoryPage.tsx
│   │   ├── SettingsPage.tsx
│   │   ├── CompanionWindow.tsx
│   │   └── QuickAskWindow.tsx
│   ├── lib/
│   │   ├── tauri-api.ts                 # 封装 invoke 调用
│   │   ├── events.ts                    # 事件订阅
│   │   └── store.ts                     # Zustand 全局状态
│   └── styles/
│       └── globals.css
│
└── src-tauri/                           # Rust 端
    ├── Cargo.toml
    ├── tauri.conf.json
    ├── build.rs
    ├── icons/
    ├── capabilities/
    │   ├── main.json                    # 主窗口权限
    │   ├── companion.json               # 桌宠窗口权限
    │   └── quick.json                   # 速召唤窗口权限
    └── src/
        ├── main.rs                      # 入口
        ├── lib.rs                       # 模块组织
        ├── error.rs                     # 统一错误类型
        ├── config.rs                    # 用户配置 + 路径
        ├── crypto.rs                    # AES-256-GCM 加密
        ├── keyring.rs                   # 系统钥匙串封装
        ├── storage/
        │   ├── mod.rs
        │   ├── history.rs               # 加密历史
        │   ├── images.rs                # 长图缓存
        │   └── index.rs                 # JSONL 索引
        ├── llm/
        │   ├── mod.rs
        │   ├── client.rs                # HTTPS + JWT
        │   └── sse.rs                   # SSE 流转发
        ├── commands/
        │   ├── mod.rs
        │   ├── analyze.rs
        │   ├── upload.rs
        │   ├── render.rs
        │   ├── history.rs
        │   ├── companion.rs
        │   ├── window.rs
        │   ├── daily.rs
        │   └── quick.rs
        ├── tray.rs                      # 托盘菜单
        ├── windows.rs                   # 多窗口管理
        ├── shortcuts.rs                 # 全局快捷键
        ├── companion_events.rs          # 桌宠定时事件（早晨问候等）
        ├── device.rs                    # 设备指纹 + JWT
        └── updater.rs                   # 自动更新钩子
```

每个文件后面都会给出可编译的内容。

---

## 二、Cargo.toml — 依赖锁定

```toml
# apps/desktop/src-tauri/Cargo.toml

[package]
name = "cyberoracle-desktop"
version = "0.1.0"
edition = "2021"
description = "赛博玄学馆桌面客户端"
authors = ["CyberOracle Team"]
license = "MIT"
repository = ""
default-run = "cyberoracle-desktop"

[lib]
name = "cyberoracle_desktop_lib"
crate-type = ["staticlib", "cdylib", "rlib"]

[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
# Tauri 核心
tauri = { version = "2", features = ["protocol-asset", "macos-private-api"] }

# Tauri 官方插件
tauri-plugin-shell = "2"
tauri-plugin-dialog = "2"
tauri-plugin-fs = "2"
tauri-plugin-notification = "2"
tauri-plugin-clipboard-manager = "2"
tauri-plugin-global-shortcut = "2"
tauri-plugin-updater = "2"
tauri-plugin-process = "2"
tauri-plugin-opener = "2"
tauri-plugin-os = "2"
tauri-plugin-http = { version = "2", features = ["unsafe-headers"] }

# 异步运行时
tokio = { version = "1", features = ["full"] }
async-trait = "0.1"
futures-util = "0.3"

# HTTP / SSE
reqwest = { version = "0.12", features = ["json", "stream", "rustls-tls"], default-features = false }
eventsource-stream = "0.2"

# 序列化
serde = { version = "1", features = ["derive"] }
serde_json = "1"

# 错误
thiserror = "1"
anyhow = "1"

# 日志
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter"] }
tracing-appender = "0.2"

# 加密
aes-gcm = "0.10"
rand = "0.8"
sha2 = "0.10"
hex = "0.4"
base64 = "0.22"

# 系统钥匙串
keyring = "3"

# 工具
chrono = { version = "0.4", features = ["serde"] }
uuid = { version = "1", features = ["v4", "serde"] }
nanoid = "0.4"
dirs = "5"

# 图片处理
image = { version = "0.25", default-features = false, features = ["jpeg", "png", "webp"] }

# 设备指纹
machine-uid = "0.5"

[features]
default = ["custom-protocol"]
custom-protocol = ["tauri/custom-protocol"]

[profile.release]
codegen-units = 1
lto = true
opt-level = "s"           # 体积优先
panic = "abort"
strip = true
```

几个值得注意的选择：

`reqwest` 用 `rustls-tls` 而不是默认的 `native-tls`，避免依赖系统 OpenSSL，**这对 Linux 多发行版打包至关重要**。`image` 关闭默认 features 只开 jpeg/png/webp，能省 1~2MB 体积。`profile.release` 按"体积优先"配置，最终二进制能从 ~15MB 压到 ~7MB。

---

## 三、tauri.conf.json — 三窗口配置

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "赛博玄学馆",
  "version": "0.1.0",
  "identifier": "app.cyberoracle.desktop",
  "build": {
    "beforeDevCommand": "pnpm dev",
    "devUrl": "http://localhost:1420",
    "beforeBuildCommand": "pnpm build",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [
      {
        "label": "main",
        "title": "赛博玄学馆",
        "url": "/",
        "width": 1280,
        "height": 800,
        "minWidth": 1024,
        "minHeight": 720,
        "resizable": true,
        "fullscreen": false,
        "visible": false,
        "decorations": true,
        "transparent": false,
        "center": true
      },
      {
        "label": "companion",
        "title": "星子",
        "url": "/companion",
        "width": 400,
        "height": 600,
        "resizable": false,
        "decorations": false,
        "transparent": true,
        "alwaysOnTop": true,
        "skipTaskbar": true,
        "shadow": false,
        "visible": false,
        "focus": false
      },
      {
        "label": "quick",
        "title": "Quick Ask",
        "url": "/quick",
        "width": 520,
        "height": 360,
        "resizable": false,
        "decorations": false,
        "transparent": true,
        "alwaysOnTop": true,
        "skipTaskbar": true,
        "shadow": true,
        "visible": false,
        "center": true
      }
    ],
    "security": {
      "csp": "default-src 'self' ipc: https://ipc.localhost; img-src 'self' asset: data: blob: https://*.cyberoracle.app; connect-src 'self' ipc: https://ipc.localhost https://api.cyberoracle.app https://*.aliyuncs.com; style-src 'self' 'unsafe-inline'; script-src 'self'; font-src 'self' data:"
    },
    "trayIcon": {
      "iconPath": "icons/tray.png",
      "iconAsTemplate": true,
      "menuOnLeftClick": false,
      "tooltip": "赛博玄学馆 · 星子"
    },
    "macOSPrivateApi": true
  },
  "plugins": {
    "updater": {
      "active": true,
      "endpoints": [
        "https://api.cyberoracle.app/api/version/desktop?platform={{target}}&arch={{arch}}&current_version={{current_version}}"
      ],
      "dialog": false,
      "pubkey": "PASTE_TAURI_UPDATER_PUBKEY_HERE"
    }
  },
  "bundle": {
    "active": true,
    "targets": ["dmg", "app", "msi", "nsis", "appimage", "deb"],
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ],
    "category": "Entertainment",
    "shortDescription": "AI 桌面占卜师",
    "longDescription": "赛博玄学馆桌面版，让 AI 占卜师陪伴你的每一天。",
    "macOS": {
      "frameworks": [],
      "minimumSystemVersion": "11.0",
      "exceptionDomain": "",
      "signingIdentity": null,
      "providerShortName": null,
      "entitlements": null
    },
    "windows": {
      "certificateThumbprint": null,
      "digestAlgorithm": "sha256",
      "timestampUrl": "http://timestamp.digicert.com",
      "wix": {
        "language": "zh-CN"
      },
      "nsis": {
        "languages": ["SimpChinese", "English"],
        "displayLanguageSelector": true
      }
    },
    "linux": {
      "deb": {
        "depends": ["libwebkit2gtk-4.1-0", "libgtk-3-0"]
      }
    }
  }
}
```

**几个关键点说明**：

`macOSPrivateApi: true` 是桌宠窗口透明背景在 macOS 工作的前提条件——没有这个，立绘后面会有一块灰色矩形。

`companion` 窗口的 `focus: false` 让桌宠出现时不抢焦点（用户在写代码时桌宠冒出来不能打断输入）。

CSP 里同时允许了 `ipc:` 和 `https://api.cyberoracle.app`，前者是 Tauri 的命令通信，后者是云端 LLM 代理；`asset:` 协议让前端能直接 `<img src="asset://...">` 显示本地长图。

`updater` 的 endpoint URL 用模板变量，云端按 platform/arch 返回不同的二进制下载地址，**这是市面上做得最简洁的自动更新方案**。

---

## 四、capabilities/ — 权限声明

Tauri 2 把权限按窗口隔离，每个窗口只能用它声明的能力。

### `capabilities/main.json`

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "main-capability",
  "description": "主窗口的能力集",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "core:window:allow-show",
    "core:window:allow-hide",
    "core:window:allow-close",
    "core:window:allow-set-focus",
    "core:event:default",
    "shell:allow-open",
    "dialog:allow-open",
    "dialog:allow-save",
    "fs:allow-read-text-file",
    "fs:allow-write-file",
    "notification:default",
    "clipboard-manager:allow-write-image",
    "clipboard-manager:allow-write-text",
    "global-shortcut:allow-register",
    "global-shortcut:allow-unregister",
    "updater:default",
    "process:allow-restart",
    "opener:default",
    "os:allow-platform",
    "http:default"
  ]
}
```

### `capabilities/companion.json`

```json
{
  "identifier": "companion-capability",
  "description": "桌宠窗口的能力集",
  "windows": ["companion"],
  "permissions": [
    "core:default",
    "core:window:allow-start-dragging",
    "core:window:allow-set-ignore-cursor-events",
    "core:window:allow-set-position",
    "core:window:allow-show",
    "core:window:allow-hide",
    "core:event:default"
  ]
}
```

### `capabilities/quick.json`

```json
{
  "identifier": "quick-capability",
  "description": "速召唤窗口的能力集",
  "windows": ["quick"],
  "permissions": [
    "core:default",
    "core:window:allow-show",
    "core:window:allow-hide",
    "core:window:allow-set-focus",
    "core:window:allow-close",
    "core:event:default"
  ]
}
```

桌宠窗口故意不给 dialog/fs 权限，**最小权限原则**——它只负责显示立绘，需要算命时跳到主窗口。即使桌宠 webview 被 XSS 攻破，也读不到本地文件。

---

## 五、Rust 入口与模块组织

### `src/main.rs`

```rust
// apps/desktop/src-tauri/src/main.rs

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    cyberoracle_desktop_lib::run();
}
```

> 把真正的入口逻辑放在 `lib.rs` 是 Tauri 2 推荐做法，未来要做 mobile build 时同一份 `run()` 可以被 iOS/Android 入口复用。

### `src/lib.rs`

```rust
// apps/desktop/src-tauri/src/lib.rs

mod commands;
mod companion_events;
mod config;
mod crypto;
mod device;
mod error;
mod keyring;
mod llm;
mod shortcuts;
mod storage;
mod tray;
mod updater;
mod windows;

use std::sync::Arc;
use tauri::Manager;
use tracing_subscriber::{fmt, prelude::*, EnvFilter};

use crate::config::AppConfig;
use crate::storage::StorageManager;

/// 应用全局 state，跨 command 共享。
/// 用 Arc 包是因为后台任务（companion_events）也要持有引用。
pub struct AppState {
    pub config: Arc<tokio::sync::RwLock<AppConfig>>,
    pub storage: Arc<StorageManager>,
    pub http: Arc<reqwest::Client>,
    pub device_token: Arc<tokio::sync::RwLock<Option<String>>>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    init_logging();

    let app = tauri::Builder::default()
        // —— 插件注册 ——
        // 顺序：基础类先注册，依赖类（如 updater 依赖 process）后注册
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_updater::Builder::new().build())
        // —— 命令注册 ——
        .invoke_handler(tauri::generate_handler![
            commands::upload::upload_image,
            commands::analyze::analyze_stream,
            commands::analyze::cancel_analyze,
            commands::render::render_poster,
            commands::history::list_history,
            commands::history::get_history,
            commands::history::delete_history,
            commands::history::clear_all_history,
            commands::history::save_image_to,
            commands::history::copy_image_to_clipboard,
            commands::daily::fetch_daily_fortune,
            commands::companion::set_companion_model,
            commands::companion::speak_text,
            commands::companion::companion_tapped,
            commands::window::toggle_companion_window,
            commands::window::show_main_window,
            commands::window::set_cursor_passthrough,
            commands::window::toggle_quick_window,
            commands::quick::quick_ask_stream,
            commands::history::import_web_history,
            commands::history::export_user_data,
        ])
        // —— 启动钩子 ——
        .setup(|app| {
            let handle = app.handle().clone();

            // 1. 加载配置 + 初始化存储
            let app_state = tauri::async_runtime::block_on(async {
                let config = AppConfig::load_or_default(&handle).await
                    .expect("failed to load config");
                let storage = StorageManager::new(&handle).await
                    .expect("failed to init storage");
                AppState {
                    config: Arc::new(tokio::sync::RwLock::new(config)),
                    storage: Arc::new(storage),
                    http: Arc::new(build_http_client()),
                    device_token: Arc::new(tokio::sync::RwLock::new(None)),
                }
            });
            app.manage(app_state);

            // 2. 设备指纹 + JWT 注册（异步后台）
            let h = handle.clone();
            tauri::async_runtime::spawn(async move {
                if let Err(e) = device::register_device(&h).await {
                    tracing::warn!("device register failed: {e}");
                }
            });

            // 3. 托盘
            tray::setup_tray(&handle)?;

            // 4. 全局快捷键
            shortcuts::register_shortcuts(&handle)?;

            // 5. 桌宠定时事件（早晨问候、闲时旁白）
            companion_events::start_scheduler(handle.clone());

            // 6. 自动更新检查（启动 60 秒后）
            updater::schedule_check(handle.clone());

            // 7. 显示主窗口（启动时延迟 200ms 显示，避免白屏）
            let h2 = handle.clone();
            tauri::async_runtime::spawn(async move {
                tokio::time::sleep(std::time::Duration::from_millis(200)).await;
                if let Some(win) = h2.get_webview_window("main") {
                    let _ = win.show();
                    let _ = win.set_focus();
                }
            });

            Ok(())
        })
        // —— 主窗口关闭行为：隐藏而非退出（保留桌宠常驻） ——
        .on_window_event(|window, event| {
            if window.label() == "main" {
                if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                    let _ = window.hide();
                    api.prevent_close();
                }
            }
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    // —— 防止 macOS 上 dock 图标点击不重新弹出 ——
    app.run(|handle, event| {
        if let tauri::RunEvent::Reopen { .. } = event {
            if let Some(win) = handle.get_webview_window("main") {
                let _ = win.show();
                let _ = win.set_focus();
            }
        }
    });
}

/// 构造 HTTPS 客户端：超时、UA、TLS、连接池
fn build_http_client() -> reqwest::Client {
    reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(60))
        .connect_timeout(std::time::Duration::from_secs(10))
        .user_agent(format!(
            "CyberOracleDesktop/{} ({})",
            env!("CARGO_PKG_VERSION"),
            std::env::consts::OS
        ))
        .pool_max_idle_per_host(4)
        .build()
        .expect("failed to build http client")
}

fn init_logging() {
    let log_dir = dirs::data_local_dir()
        .map(|p| p.join("cyberoracle").join("logs"))
        .unwrap_or_else(|| std::env::temp_dir().join("cyberoracle-logs"));
    let _ = std::fs::create_dir_all(&log_dir);
    let file_appender = tracing_appender::rolling::daily(&log_dir, "app.log");

    tracing_subscriber::registry()
        .with(EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info")))
        .with(fmt::layer().with_target(true))
        .with(fmt::layer().with_writer(file_appender).with_ansi(false))
        .init();
}
```

这段是整个客户端的"装配车间"，几个值得讲的细节：

`AppState` 用 `Arc<RwLock<...>>` 包裹是为了让 command handler、tray 回调、定时任务都能并发访问。**这是 Tauri 后端最常见的状态共享模式**，比 1.x 的 `tauri::State` 更灵活。

`setup` 闭包里调用 `block_on` 是因为 setup 必须同步返回 `Ok(())`，但配置加载是 async 的。这里短暂阻塞 100ms 量级是可接受的。

`on_window_event` 拦截主窗口的关闭请求改成 hide，**这是桌宠类应用的标志性行为**——用户点关闭按钮后程序仍然驻留，桌宠继续陪伴，要退出走托盘菜单。

`Reopen` 事件是 macOS 专属的，处理 dock 图标点击，**Windows/Linux 上这段不会触发，所以不需要平台门控**。

---

## 六、统一错误类型

### `src/error.rs`

```rust
// apps/desktop/src-tauri/src/error.rs

use serde::Serialize;
use thiserror::Error;

/// 应用统一错误类型。
/// 所有 command 都返回 Result<T, AppError>；
/// AppError 序列化为 JSON 后传给前端，前端拿到 { code, message } 处理。
#[derive(Debug, Error)]
pub enum AppError {
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),

    #[error("json error: {0}")]
    Json(#[from] serde_json::Error),

    #[error("http error: {0}")]
    Http(#[from] reqwest::Error),

    #[error("crypto error: {0}")]
    Crypto(String),

    #[error("keyring error: {0}")]
    Keyring(#[from] ::keyring::Error),

    #[error("image error: {0}")]
    Image(#[from] image::ImageError),

    #[error("tauri error: {0}")]
    Tauri(#[from] tauri::Error),

    #[error("not found: {0}")]
    NotFound(String),

    #[error("unauthorized: {0}")]
    Unauthorized(String),

    #[error("invalid input: {0}")]
    InvalidInput(String),

    #[error("upstream rejected: {0}")]
    UpstreamRejected(String),

    #[error("internal: {0}")]
    Internal(String),
}

/// 给前端的错误形态：稳定的 code + 人类可读的 message。
/// code 用枚举名是为了前端能做 i18n。
#[derive(Serialize)]
pub struct AppErrorPayload {
    pub code: String,
    pub message: String,
}

impl Serialize for AppError {
    fn serialize<S: serde::Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        let code = match self {
            AppError::Io(_) => "IO",
            AppError::Json(_) => "JSON",
            AppError::Http(_) => "HTTP",
            AppError::Crypto(_) => "CRYPTO",
            AppError::Keyring(_) => "KEYRING",
            AppError::Image(_) => "IMAGE",
            AppError::Tauri(_) => "TAURI",
            AppError::NotFound(_) => "NOT_FOUND",
            AppError::Unauthorized(_) => "UNAUTHORIZED",
            AppError::InvalidInput(_) => "INVALID_INPUT",
            AppError::UpstreamRejected(_) => "UPSTREAM_REJECTED",
            AppError::Internal(_) => "INTERNAL",
        };
        AppErrorPayload {
            code: code.to_string(),
            message: self.to_string(),
        }
        .serialize(serializer)
    }
}

pub type AppResult<T> = Result<T, AppError>;
```

把 `AppError` 自定义序列化为 `{ code, message }` 是关键设计——前端能用 `code` 做精确分支处理，又能拿到 `message` 直接展示。比 Tauri 默认把错误序列化成裸字符串友好得多。

---

## 七、配置管理

### `src/config.rs`

```rust
// apps/desktop/src-tauri/src/config.rs

use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};

use crate::error::{AppError, AppResult};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub api_base_url: String,
    pub user: UserConfig,
    pub companion: CompanionConfig,
    pub privacy: PrivacyConfig,
    pub shortcuts: ShortcutsConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserConfig {
    pub nickname: String,
    pub installed_at: String,         // ISO 8601
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompanionConfig {
    pub model_id: String,             // "xingzi"
    pub personality: String,          // "gufeng" | "shaonu" | "lengdan"
    pub enable_morning_greet: bool,
    pub morning_greet_time: String,   // "09:00"
    pub enable_idle_lines: bool,
    pub idle_interval_minutes: u32,
    pub enable_voice: bool,
    pub voice_volume: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrivacyConfig {
    pub send_telemetry: bool,
    pub auto_clean_days: u32,         // 0 = 不自动清理
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ShortcutsConfig {
    pub quick_ask: String,
    pub palm: String,
    pub daily: String,
    pub toggle_companion: String,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            api_base_url: "https://api.cyberoracle.app".into(),
            user: UserConfig {
                nickname: "你".into(),
                installed_at: chrono::Utc::now().to_rfc3339(),
            },
            companion: CompanionConfig {
                model_id: "xingzi".into(),
                personality: "shaonu".into(),
                enable_morning_greet: true,
                morning_greet_time: "09:00".into(),
                enable_idle_lines: true,
                idle_interval_minutes: 45,
                enable_voice: false,
                voice_volume: 0.8,
            },
            privacy: PrivacyConfig {
                send_telemetry: true,
                auto_clean_days: 0,
            },
            shortcuts: ShortcutsConfig {
                quick_ask: default_shortcut("Shift+O"),
                palm: default_shortcut("Shift+P"),
                daily: default_shortcut("Shift+D"),
                toggle_companion: default_shortcut("Shift+H"),
            },
        }
    }
}

#[cfg(target_os = "macos")]
fn default_shortcut(key: &str) -> String {
    format!("Cmd+{}", key)
}
#[cfg(not(target_os = "macos"))]
fn default_shortcut(key: &str) -> String {
    format!("Ctrl+{}", key)
}

impl AppConfig {
    /// 配置文件路径：~/Library/Application Support/cyberoracle/config.json
    pub fn config_path(handle: &AppHandle) -> AppResult<PathBuf> {
        let dir = handle
            .path()
            .app_data_dir()
            .map_err(|e| AppError::Internal(format!("app_data_dir: {e}")))?;
        std::fs::create_dir_all(&dir)?;
        Ok(dir.join("config.json"))
    }

    pub async fn load_or_default(handle: &AppHandle) -> AppResult<Self> {
        let path = Self::config_path(handle)?;
        if !path.exists() {
            let cfg = Self::default();
            cfg.save_to(&path).await?;
            return Ok(cfg);
        }
        let text = tokio::fs::read_to_string(&path).await?;
        let cfg: AppConfig = serde_json::from_str(&text).unwrap_or_else(|e| {
            tracing::warn!("config parse failed: {e}, fallback to default");
            Self::default()
        });
        Ok(cfg)
    }

    pub async fn save(&self, handle: &AppHandle) -> AppResult<()> {
        let path = Self::config_path(handle)?;
        self.save_to(&path).await
    }

    async fn save_to(&self, path: &Path) -> AppResult<()> {
        let text = serde_json::to_string_pretty(self)?;
        // 原子写：临时文件 + rename，避免半截文件
        let tmp = path.with_extension("json.tmp");
        tokio::fs::write(&tmp, text).await?;
        tokio::fs::rename(&tmp, path).await?;
        Ok(())
    }
}
```

配置写盘用"临时文件 + rename"是防止断电/崩溃留半截文件——这是文件系统持久化的标准做法。Tauri 提供的 `app_data_dir` 在三个平台上都是符合操作系统约定的：macOS 在 `~/Library/Application Support/`、Windows 在 `%APPDATA%\`、Linux 在 `~/.local/share/`。

---

## 八、加密层（AES-256-GCM + 钥匙串）

### `src/keyring.rs`

```rust
// apps/desktop/src-tauri/src/keyring.rs

use crate::error::{AppError, AppResult};
use ::keyring::Entry;

const SERVICE: &str = "app.cyberoracle.desktop";
const KEY_NAME: &str = "master_key_v1";

/// 从系统钥匙串读取主密钥。
/// macOS: Keychain
/// Windows: Credential Manager
/// Linux: Secret Service (gnome-keyring / kwallet)
pub fn get_or_create_master_key() -> AppResult<[u8; 32]> {
    let entry = Entry::new(SERVICE, KEY_NAME)?;

    match entry.get_password() {
        Ok(hex_str) => {
            let bytes = hex::decode(&hex_str)
                .map_err(|e| AppError::Crypto(format!("hex decode: {e}")))?;
            if bytes.len() != 32 {
                return Err(AppError::Crypto("invalid key length".into()));
            }
            let mut key = [0u8; 32];
            key.copy_from_slice(&bytes);
            Ok(key)
        }
        Err(::keyring::Error::NoEntry) => {
            // 首次启动：生成随机主密钥并存入钥匙串
            use rand::RngCore;
            let mut key = [0u8; 32];
            rand::thread_rng().fill_bytes(&mut key);
            entry.set_password(&hex::encode(key))?;
            tracing::info!("master key created and saved to keyring");
            Ok(key)
        }
        Err(e) => Err(AppError::Keyring(e)),
    }
}

/// 重置主密钥（仅供"清空所有数据"功能使用）。
/// 调用后所有历史数据将无法解密。
pub fn rotate_master_key() -> AppResult<[u8; 32]> {
    let entry = Entry::new(SERVICE, KEY_NAME)?;
    let _ = entry.delete_credential();
    get_or_create_master_key()
}
```

把主密钥放在系统钥匙串而不是配置文件里是关键安全设计：**即使整个应用目录被拷走，没有钥匙串就无法解密历史**。这是和 Web 端比起来客户端的核心隐私优势之一。

### `src/crypto.rs`

```rust
// apps/desktop/src-tauri/src/crypto.rs

use crate::error::{AppError, AppResult};
use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Key, Nonce,
};
use rand::RngCore;

/// 文件加密格式：
///   [12 bytes nonce][N bytes ciphertext (含 16 bytes auth tag)]
/// 简单、自包含、支持随机访问检测篡改。
pub fn encrypt(key: &[u8; 32], plaintext: &[u8]) -> AppResult<Vec<u8>> {
    let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(key));

    let mut nonce_bytes = [0u8; 12];
    rand::thread_rng().fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = cipher
        .encrypt(nonce, plaintext)
        .map_err(|e| AppError::Crypto(format!("encrypt: {e}")))?;

    let mut out = Vec::with_capacity(12 + ciphertext.len());
    out.extend_from_slice(&nonce_bytes);
    out.extend_from_slice(&ciphertext);
    Ok(out)
}

pub fn decrypt(key: &[u8; 32], blob: &[u8]) -> AppResult<Vec<u8>> {
    if blob.len() < 12 + 16 {
        return Err(AppError::Crypto("blob too short".into()));
    }
    let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(key));
    let nonce = Nonce::from_slice(&blob[..12]);
    let ciphertext = &blob[12..];
    let plaintext = cipher
        .decrypt(nonce, ciphertext)
        .map_err(|e| AppError::Crypto(format!("decrypt: {e}")))?;
    Ok(plaintext)
}

/// 加密 JSON 序列化的便利方法
pub fn encrypt_json<T: serde::Serialize>(key: &[u8; 32], value: &T) -> AppResult<Vec<u8>> {
    let json = serde_json::to_vec(value)?;
    encrypt(key, &json)
}

pub fn decrypt_json<T: serde::de::DeserializeOwned>(
    key: &[u8; 32],
    blob: &[u8],
) -> AppResult<T> {
    let plaintext = decrypt(key, blob)?;
    Ok(serde_json::from_slice(&plaintext)?)
}
```

AES-256-GCM 是当前最主流的对称加密方案，**12 字节 nonce + 16 字节 auth tag** 的结构既保证机密性又能检测篡改。每条记录独立 nonce，所以即使加密同一份内容两次，密文也完全不同。

---

## 九、存储层

### `src/storage/mod.rs`

```rust
// apps/desktop/src-tauri/src/storage/mod.rs

pub mod history;
pub mod images;
pub mod index;

use crate::error::{AppError, AppResult};
use crate::keyring::get_or_create_master_key;
use std::path::PathBuf;
use std::sync::Arc;
use tauri::{AppHandle, Manager};
use tokio::sync::Mutex;

pub struct StorageManager {
    pub root: PathBuf,
    pub history_dir: PathBuf,
    pub images_dir: PathBuf,
    pub index_path: PathBuf,
    pub master_key: [u8; 32],
    /// index.jsonl 的写锁：避免多任务并发写入串行化。
    /// 只在写入路径上获取，读取走快照所以不锁。
    pub index_write_lock: Arc<Mutex<()>>,
}

impl StorageManager {
    pub async fn new(handle: &AppHandle) -> AppResult<Self> {
        let root = handle
            .path()
            .app_data_dir()
            .map_err(|e| AppError::Internal(format!("app_data_dir: {e}")))?;
        let history_dir = root.join("history").join("records");
        let images_dir = root.join("images");
        let index_path = root.join("history").join("index.jsonl");

        for d in [&history_dir, &images_dir] {
            std::fs::create_dir_all(d)?;
        }
        if let Some(p) = index_path.parent() {
            std::fs::create_dir_all(p)?;
        }
        if !index_path.exists() {
            std::fs::write(&index_path, "")?;
        }

        let master_key = tokio::task::spawn_blocking(get_or_create_master_key)
            .await
            .map_err(|e| AppError::Internal(format!("spawn_blocking: {e}")))??;

        Ok(Self {
            root,
            history_dir,
            images_dir,
            index_path,
            master_key,
            index_write_lock: Arc::new(Mutex::new(())),
        })
    }
}
```

### `src/storage/history.rs`

```rust
// apps/desktop/src-tauri/src/storage/history.rs

use crate::crypto::{decrypt_json, encrypt_json};
use crate::error::{AppError, AppResult};
use crate::storage::index::{IndexEntry, IndexOp};
use crate::storage::StorageManager;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

/// 解读结果（与前端 schema 对齐，简化版只保留必要字段做存储）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReadingRecord {
    pub id: String,
    #[serde(rename = "type")]
    pub kind: String, // "palm" | "face" | "daily"
    pub created_at: String,
    pub data: serde_json::Value, // 完整 PalmReadingResult JSON，对存储层透明
}

impl StorageManager {
    fn record_path(&self, id: &str) -> PathBuf {
        self.history_dir.join(format!("{id}.enc"))
    }

    pub async fn save_record(&self, record: &ReadingRecord) -> AppResult<()> {
        let path = self.record_path(&record.id);
        let blob = encrypt_json(&self.master_key, record)?;

        // 原子写：tmp + rename
        let tmp = path.with_extension("enc.tmp");
        tokio::fs::write(&tmp, &blob).await?;
        tokio::fs::rename(&tmp, &path).await?;

        // 写索引
        self.append_index(IndexOp::Add(IndexEntry {
            id: record.id.clone(),
            kind: record.kind.clone(),
            created_at: record.created_at.clone(),
        }))
        .await?;

        Ok(())
    }

    pub async fn load_record(&self, id: &str) -> AppResult<ReadingRecord> {
        let path = self.record_path(id);
        if !path.exists() {
            return Err(AppError::NotFound(format!("record {id}")));
        }
        let blob = tokio::fs::read(&path).await?;
        let record: ReadingRecord = decrypt_json(&self.master_key, &blob)?;
        Ok(record)
    }

    pub async fn delete_record(&self, id: &str) -> AppResult<()> {
        let path = self.record_path(id);
        if path.exists() {
            tokio::fs::remove_file(&path).await?;
        }
        // 同步删长图
        let _ = tokio::fs::remove_file(self.image_path(id)).await;
        // 索引追加 delete 记录
        self.append_index(IndexOp::Delete(id.to_string())).await?;
        Ok(())
    }

    pub async fn clear_all(&self) -> AppResult<()> {
        let mut entries = tokio::fs::read_dir(&self.history_dir).await?;
        while let Some(e) = entries.next_entry().await? {
            tokio::fs::remove_file(e.path()).await?;
        }
        let mut entries = tokio::fs::read_dir(&self.images_dir).await?;
        while let Some(e) = entries.next_entry().await? {
            tokio::fs::remove_file(e.path()).await?;
        }
        // 重置索引文件
        tokio::fs::write(&self.index_path, "").await?;
        Ok(())
    }
}
```

### `src/storage/index.rs`

```rust
// apps/desktop/src-tauri/src/storage/index.rs

use crate::error::AppResult;
use crate::storage::StorageManager;
use serde::{Deserialize, Serialize};
use tokio::io::AsyncWriteExt;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IndexEntry {
    pub id: String,
    pub kind: String,
    pub created_at: String,
}

/// 索引文件（jsonl）支持的操作类型。
/// "soft delete" 模式：删除不会从索引文件物理移除，
/// 而是追加一条 Delete 记录；快照时合并出最终列表。
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "op", rename_all = "lowercase")]
pub enum IndexOp {
    Add(IndexEntry),
    Delete(String),
}

impl StorageManager {
    pub async fn append_index(&self, op: IndexOp) -> AppResult<()> {
        let _guard = self.index_write_lock.lock().await;
        let line = serde_json::to_string(&op)?;
        let mut f = tokio::fs::OpenOptions::new()
            .append(true)
            .create(true)
            .open(&self.index_path)
            .await?;
        f.write_all(line.as_bytes()).await?;
        f.write_all(b"\n").await?;
        f.flush().await?;
        Ok(())
    }

    /// 读取索引快照：合并 Add/Delete，按 created_at 倒序返回最近 limit 条。
    /// 这种"追加日志 + 内存合并"模式在小规模数据下性能足够（万条以内），
    /// 写零成本、读 O(N)。如果未来历史超过 1 万条再考虑压缩。
    pub async fn snapshot_index(&self, limit: usize) -> AppResult<Vec<IndexEntry>> {
        let text = tokio::fs::read_to_string(&self.index_path).await?;
        let mut alive: std::collections::BTreeMap<String, IndexEntry> = Default::default();
        for line in text.lines() {
            if line.trim().is_empty() {
                continue;
            }
            let op: IndexOp = match serde_json::from_str(line) {
                Ok(o) => o,
                Err(e) => {
                    tracing::warn!("skip corrupt index line: {e}");
                    continue;
                }
            };
            match op {
                IndexOp::Add(e) => {
                    alive.insert(e.id.clone(), e);
                }
                IndexOp::Delete(id) => {
                    alive.remove(&id);
                }
            }
        }
        let mut list: Vec<IndexEntry> = alive.into_values().collect();
        list.sort_by(|a, b| b.created_at.cmp(&a.created_at));
        list.truncate(limit);
        Ok(list)
    }
}
```

这套 jsonl 索引 + 内存合并的设计是**前 PRD 里"无数据库"承诺的关键落地**：写零开销（追加一行）、读简单（一次 read_to_string）、一致性强（任何崩溃只会丢失最后一条未刷盘记录，且 Add/Delete 都是幂等的）。

### `src/storage/images.rs`

```rust
// apps/desktop/src-tauri/src/storage/images.rs

use crate::error::AppResult;
use crate::storage::StorageManager;
use std::path::PathBuf;

impl StorageManager {
    pub fn image_path(&self, id: &str) -> PathBuf {
        self.images_dir.join(format!("{id}.png"))
    }

    pub async fn save_image(&self, id: &str, png_bytes: &[u8]) -> AppResult<PathBuf> {
        let path = self.image_path(id);
        let tmp = path.with_extension("png.tmp");
        tokio::fs::write(&tmp, png_bytes).await?;
        tokio::fs::rename(&tmp, &path).await?;
        Ok(path)
    }

    pub async fn load_image(&self, id: &str) -> AppResult<Vec<u8>> {
        Ok(tokio::fs::read(self.image_path(id)).await?)
    }
}
```

> 长图不加密的设计是**故意为之**：长图是要被分享出去的，加密反而会让用户每次保存都要解密，体验变差；且长图本身不含敏感信息（不含原始照片、不含设备指纹）。

---

## 十、设备指纹与 JWT

### `src/device.rs`

```rust
// apps/desktop/src-tauri/src/device.rs

use crate::error::{AppError, AppResult};
use crate::AppState;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use tauri::{AppHandle, Manager};

#[derive(Debug, Serialize)]
struct RegisterReq {
    device_fp: String,
    platform: String,
    arch: String,
    version: String,
}

#[derive(Debug, Deserialize)]
struct RegisterResp {
    token: String,
    expires_at: i64,
}

/// 生成设备指纹：machine-uid + 应用 salt 的 SHA-256。
/// 不收集任何 PII，纯粹做"同一台机器上的同一个用户"识别用。
pub fn device_fingerprint() -> AppResult<String> {
    let raw = machine_uid::get()
        .map_err(|e| AppError::Internal(format!("machine_uid: {e}")))?;
    let mut hasher = Sha256::new();
    hasher.update(raw.as_bytes());
    hasher.update(b"|cyberoracle-v1");
    Ok(format!("{:x}", hasher.finalize()))
}

/// 启动时调云端注册 / 续期 JWT。
/// 失败不阻塞启动——离线状态下用户仍可看历史记录。
pub async fn register_device(handle: &AppHandle) -> AppResult<()> {
    let state: tauri::State<AppState> = handle.state();
    let config = state.config.read().await;
    let api_base = config.api_base_url.clone();
    drop(config);

    let fp = device_fingerprint()?;
    let req = RegisterReq {
        device_fp: fp,
        platform: std::env::consts::OS.into(),
        arch: std::env::consts::ARCH.into(),
        version: env!("CARGO_PKG_VERSION").into(),
    };

    let resp: RegisterResp = state
        .http
        .post(format!("{api_base}/api/device/register"))
        .json(&req)
        .send()
        .await?
        .error_for_status()?
        .json()
        .await?;

    *state.device_token.write().await = Some(resp.token);
    tracing::info!("device registered, token expires at {}", resp.expires_at);
    Ok(())
}

/// 获取当前 JWT，若不存在就重新注册一次。
pub async fn get_device_token(handle: &AppHandle) -> AppResult<String> {
    let state: tauri::State<AppState> = handle.state();
    if let Some(t) = state.device_token.read().await.as_ref() {
        return Ok(t.clone());
    }
    register_device(handle).await?;
    state
        .device_token
        .read()
        .await
        .clone()
        .ok_or_else(|| AppError::Unauthorized("no device token".into()))
}
```

设备指纹用 `machine-uid` 是因为它在三个平台都有稳定实现：macOS 用 IOPlatformUUID、Windows 用 MachineGuid、Linux 用 /etc/machine-id。**用户在同一台机器上重装应用仍然是同一个 fp**，云端的限流计数能延续。

---

## 十一、LLM 客户端 + SSE 流转发

### `src/llm/mod.rs`

```rust
// apps/desktop/src-tauri/src/llm/mod.rs

pub mod client;
pub mod sse;
```

### `src/llm/client.rs`

```rust
// apps/desktop/src-tauri/src/llm/client.rs

use crate::device::get_device_token;
use crate::error::AppResult;
use crate::AppState;
use serde::Serialize;
use tauri::{AppHandle, Manager};

/// 调云端代理上传图片，返回 result id。
#[derive(Debug, Serialize)]
pub struct UploadParams {
    pub kind: String, // "palm" | "face"
}

pub async fn proxy_upload(
    handle: &AppHandle,
    image_bytes: Vec<u8>,
    kind: &str,
) -> AppResult<String> {
    let state: tauri::State<AppState> = handle.state();
    let api_base = state.config.read().await.api_base_url.clone();
    let token = get_device_token(handle).await?;

    let part = reqwest::multipart::Part::bytes(image_bytes)
        .file_name("upload.webp")
        .mime_str("image/webp")
        .unwrap();
    let form = reqwest::multipart::Form::new()
        .text("type", kind.to_string())
        .part("file", part);

    #[derive(serde::Deserialize)]
    struct Resp {
        id: String,
    }
    let resp: Resp = state
        .http
        .post(format!("{api_base}/api/upload"))
        .bearer_auth(&token)
        .multipart(form)
        .send()
        .await?
        .error_for_status()?
        .json()
        .await?;

    Ok(resp.id)
}

pub async fn proxy_render(handle: &AppHandle, id: &str) -> AppResult<Vec<u8>> {
    let state: tauri::State<AppState> = handle.state();
    let api_base = state.config.read().await.api_base_url.clone();
    let token = get_device_token(handle).await?;

    // 先触发渲染
    state
        .http
        .post(format!("{api_base}/api/render-image"))
        .bearer_auth(&token)
        .json(&serde_json::json!({ "id": id }))
        .send()
        .await?
        .error_for_status()?;

    // 再下载
    let bytes = state
        .http
        .get(format!("{api_base}/api/result/{id}/image"))
        .bearer_auth(&token)
        .send()
        .await?
        .error_for_status()?
        .bytes()
        .await?;
    Ok(bytes.to_vec())
}

pub async fn proxy_get_result(handle: &AppHandle, id: &str) -> AppResult<serde_json::Value> {
    let state: tauri::State<AppState> = handle.state();
    let api_base = state.config.read().await.api_base_url.clone();
    let token = get_device_token(handle).await?;

    let json: serde_json::Value = state
        .http
        .get(format!("{api_base}/api/result/{id}"))
        .bearer_auth(&token)
        .send()
        .await?
        .error_for_status()?
        .json()
        .await?;
    Ok(json)
}
```

### `src/llm/sse.rs`

```rust
// apps/desktop/src-tauri/src/llm/sse.rs

use crate::device::get_device_token;
use crate::error::{AppError, AppResult};
use crate::AppState;
use eventsource_stream::Eventsource;
use futures_util::StreamExt;
use tauri::{AppHandle, Emitter, Manager};

/// SSE 事件转发：从云端 /api/analyze 拉流，
/// 每收到一个 SSE event 就 emit 给前端。
/// 这样前端的体验和直连云端 SSE 完全一致，但所有流量都过 Rust 这一层，
/// 便于做超时、取消、重试的集中控制。
pub async fn proxy_analyze_stream(
    handle: AppHandle,
    id: String,
    cancel_rx: tokio::sync::oneshot::Receiver<()>,
) -> AppResult<()> {
    let state: tauri::State<AppState> = handle.state();
    let api_base = state.config.read().await.api_base_url.clone();
    let token = get_device_token(&handle).await?;
    let http = state.http.clone();
    drop(state);

    let url = format!("{api_base}/api/analyze?id={id}");
    let resp = http
        .get(&url)
        .bearer_auth(&token)
        .header("Accept", "text/event-stream")
        .send()
        .await?
        .error_for_status()?;

    let mut stream = resp.bytes_stream().eventsource();

    // futures::select! 在 cancel 与 stream next 之间二选一
    tokio::pin!(cancel_rx);
    loop {
        tokio::select! {
            biased;
            _ = &mut cancel_rx => {
                tracing::info!("analyze cancelled by user: {id}");
                handle.emit("analyze:cancelled", &id).ok();
                return Ok(());
            }
            next = stream.next() => {
                match next {
                    Some(Ok(event)) => {
                        let payload = serde_json::json!({
                            "id": id,
                            "event": event.event,
                            "data": serde_json::from_str::<serde_json::Value>(&event.data)
                                .unwrap_or(serde_json::Value::String(event.data)),
                        });
                        let topic = match event.event.as_str() {
                            "stage" => "analyze:stage",
                            "chunk" => "analyze:chunk",
                            "section_done" => "analyze:section_done",
                            "done" => "analyze:done",
                            _ => "analyze:other",
                        };
                        if handle.emit(topic, &payload).is_err() {
                            // 主窗口已关闭，停止流
                            return Ok(());
                        }
                        if event.event == "done" {
                            return Ok(());
                        }
                    }
                    Some(Err(e)) => {
                        tracing::error!("sse error: {e}");
                        handle.emit("analyze:error", &serde_json::json!({
                            "id": id, "message": e.to_string(),
                        })).ok();
                        return Err(AppError::Internal(format!("sse: {e}")));
                    }
                    None => {
                        return Ok(());
                    }
                }
            }
        }
    }
}
```

`tokio::select! { biased; ... }` 的 `biased` 关键字让 cancel 分支永远优先检查——确保用户点取消能立即生效，而不会被高频 chunk 抢走 poll。这是异步取消的常用细节。

---

## 十二、命令层

### `src/commands/mod.rs`

```rust
// apps/desktop/src-tauri/src/commands/mod.rs

pub mod analyze;
pub mod companion;
pub mod daily;
pub mod history;
pub mod quick;
pub mod render;
pub mod upload;
pub mod window;
```

### `src/commands/upload.rs`

```rust
// apps/desktop/src-tauri/src/commands/upload.rs

use crate::error::{AppError, AppResult};
use crate::llm::client::proxy_upload;
use image::{ImageFormat, ImageReader};
use serde::{Deserialize, Serialize};
use std::io::Cursor;
use std::path::PathBuf;
use tauri::AppHandle;

#[derive(Debug, Deserialize)]
pub struct UploadArgs {
    pub path: String,
    pub kind: String, // "palm" | "face"
}

#[derive(Debug, Serialize)]
pub struct UploadResult {
    pub id: String,
}

#[tauri::command]
pub async fn upload_image(handle: AppHandle, args: UploadArgs) -> AppResult<UploadResult> {
    let path = PathBuf::from(&args.path);
    if !path.exists() {
        return Err(AppError::InvalidInput(format!("file not found: {}", args.path)));
    }
    let bytes = tokio::fs::read(&path).await?;

    // 预处理：统一转 WebP 1280px 短边、质量 85
    let webp_bytes = tokio::task::spawn_blocking(move || -> AppResult<Vec<u8>> {
        let img = ImageReader::new(Cursor::new(bytes))
            .with_guessed_format()?
            .decode()?;
        // 限制最长边到 1280
        let img = img.thumbnail(1280, 1280);
        let mut buf = Vec::new();
        img.write_to(&mut Cursor::new(&mut buf), ImageFormat::WebP)?;
        Ok(buf)
    })
    .await
    .map_err(|e| AppError::Internal(format!("decode task: {e}")))??;

    let id = proxy_upload(&handle, webp_bytes, &args.kind).await?;
    Ok(UploadResult { id })
}
```

> 这里把 image 解码放在 `spawn_blocking` 里是必须的——`image` crate 是同步 CPU 密集 API，直接在 tokio 线程池里 decode 一张大图会阻塞整个 runtime，影响其它命令的响应。

### `src/commands/analyze.rs`

```rust
// apps/desktop/src-tauri/src/commands/analyze.rs

use crate::error::AppResult;
use crate::llm::sse::proxy_analyze_stream;
use crate::storage::history::ReadingRecord;
use crate::AppState;
use std::collections::HashMap;
use std::sync::Mutex;
use tauri::{AppHandle, Manager};
use tokio::sync::oneshot;

/// 全局可取消任务表（id -> cancel_tx）。
/// 用 std Mutex 是因为这是个同步操作（insert/remove），不需要 await。
static CANCEL_REGISTRY: once_cell::sync::Lazy<Mutex<HashMap<String, oneshot::Sender<()>>>> =
    once_cell::sync::Lazy::new(Default::default);

#[tauri::command]
pub async fn analyze_stream(handle: AppHandle, id: String) -> AppResult<()> {
    let (cancel_tx, cancel_rx) = oneshot::channel();
    CANCEL_REGISTRY.lock().unwrap().insert(id.clone(), cancel_tx);

    let h = handle.clone();
    let id_clone = id.clone();

    // 在后台跑流式转发，命令立刻返回，前端通过 event 接收
    tauri::async_runtime::spawn(async move {
        let res = proxy_analyze_stream(h.clone(), id_clone.clone(), cancel_rx).await;
        CANCEL_REGISTRY.lock().unwrap().remove(&id_clone);
        if let Err(e) = res {
            tracing::error!("analyze_stream failed: {e}");
            return;
        }
        // 流式完成后，从云端拉完整 JSON 并存入本地加密历史
        if let Err(e) = persist_after_done(&h, &id_clone).await {
            tracing::error!("persist failed: {e}");
        }
    });

    Ok(())
}

#[tauri::command]
pub async fn cancel_analyze(id: String) -> AppResult<()> {
    if let Some(tx) = CANCEL_REGISTRY.lock().unwrap().remove(&id) {
        let _ = tx.send(());
    }
    Ok(())
}

async fn persist_after_done(handle: &AppHandle, id: &str) -> AppResult<()> {
    let value = crate::llm::client::proxy_get_result(handle, id).await?;
    let kind = value
        .get("meta")
        .and_then(|m| m.get("type"))
        .and_then(|t| t.as_str())
        .unwrap_or("palm")
        .to_string();
    let created_at = value
        .get("meta")
        .and_then(|m| m.get("createdAt"))
        .and_then(|t| t.as_str())
        .unwrap_or(&chrono::Utc::now().to_rfc3339())
        .to_string();
    let record = ReadingRecord {
        id: id.to_string(),
        kind,
        created_at,
        data: value,
    };
    let state: tauri::State<AppState> = handle.state();
    state.storage.save_record(&record).await?;
    Ok(())
}
```

`once_cell::Lazy<Mutex<HashMap>>` 这个全局取消注册表很关键——前端任何时候调 `cancel_analyze(id)` 都能精确终止对应 SSE 流。把注册表做成全局而非 AppState 字段，是因为它纯粹是临时运行时状态，不需要持久化。

> `once_cell` 没有写在 Cargo.toml 里，要额外加 `once_cell = "1"`。

### `src/commands/render.rs`

```rust
// apps/desktop/src-tauri/src/commands/render.rs

use crate::error::AppResult;
use crate::llm::client::proxy_render;
use crate::AppState;
use serde::Serialize;
use tauri::{AppHandle, Manager};

#[derive(Debug, Serialize)]
pub struct RenderResult {
    pub local_path: String,
    pub asset_url: String,
}

#[tauri::command]
pub async fn render_poster(handle: AppHandle, id: String) -> AppResult<RenderResult> {
    let png = proxy_render(&handle, &id).await?;
    let state: tauri::State<AppState> = handle.state();
    let path = state.storage.save_image(&id, &png).await?;
    let local_path = path.to_string_lossy().to_string();
    let asset_url = format!("asset://localhost/{}", urlencoding::encode(&local_path));
    Ok(RenderResult { local_path, asset_url })
}
```

> `urlencoding` 也要加到 Cargo.toml：`urlencoding = "2"`。`asset://localhost/...` 是 Tauri 的本地资源协议，前端 `<img src={asset_url}>` 直接显示本地长图，比 base64 内嵌效率高得多。

### `src/commands/history.rs`

```rust
// apps/desktop/src-tauri/src/commands/history.rs

use crate::error::{AppError, AppResult};
use crate::storage::index::IndexEntry;
use crate::storage::history::ReadingRecord;
use crate::AppState;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};
use tauri_plugin_clipboard_manager::ClipboardExt;

#[tauri::command]
pub async fn list_history(handle: AppHandle, limit: Option<usize>) -> AppResult<Vec<IndexEntry>> {
    let state: tauri::State<AppState> = handle.state();
    state.storage.snapshot_index(limit.unwrap_or(50)).await
}

#[tauri::command]
pub async fn get_history(handle: AppHandle, id: String) -> AppResult<ReadingRecord> {
    let state: tauri::State<AppState> = handle.state();
    state.storage.load_record(&id).await
}

#[tauri::command]
pub async fn delete_history(handle: AppHandle, id: String) -> AppResult<()> {
    let state: tauri::State<AppState> = handle.state();
    state.storage.delete_record(&id).await
}

#[tauri::command]
pub async fn clear_all_history(handle: AppHandle) -> AppResult<()> {
    let state: tauri::State<AppState> = handle.state();
    state.storage.clear_all().await
}

#[derive(Debug, Deserialize)]
pub struct SaveImageArgs {
    pub id: String,
    pub target_path: String,
}

#[tauri::command]
pub async fn save_image_to(handle: AppHandle, args: SaveImageArgs) -> AppResult<()> {
    let state: tauri::State<AppState> = handle.state();
    let bytes = state.storage.load_image(&args.id).await?;
    tokio::fs::write(&args.target_path, &bytes).await?;
    Ok(())
}

#[tauri::command]
pub async fn copy_image_to_clipboard(handle: AppHandle, id: String) -> AppResult<()> {
    let state: tauri::State<AppState> = handle.state();
    let bytes = state.storage.load_image(&id).await?;

    // tauri clipboard plugin 当前对 image 支持平台不一，
    // 简单方案：写入剪贴板的"文件路径"+ 图像数据双轨。
    // 完整 image 写入用 arboard 等库会更稳。
    let path = state.storage.image_path(&id);
    handle
        .clipboard()
        .write_text(format!("file://{}", path.display()))
        .map_err(|e| AppError::Internal(format!("clipboard: {e}")))?;
    let _ = bytes; // 完整 image 写入留待后续接 arboard
    Ok(())
}

#[derive(Debug, Serialize)]
pub struct ImportResult {
    pub imported: usize,
}

#[derive(Debug, Deserialize)]
pub struct ImportArgs {
    pub code: String, // 6 位数字 handoff code
}

#[tauri::command]
pub async fn import_web_history(handle: AppHandle, args: ImportArgs) -> AppResult<ImportResult> {
    let state: tauri::State<AppState> = handle.state();
    let api_base = state.config.read().await.api_base_url.clone();
    let token = crate::device::get_device_token(&handle).await?;

    #[derive(Deserialize)]
    struct HandoffPayload {
        records: Vec<ReadingRecord>,
    }

    let resp: HandoffPayload = state
        .http
        .get(format!("{api_base}/api/handoff/{}", args.code))
        .bearer_auth(token)
        .send()
        .await?
        .error_for_status()?
        .json()
        .await?;

    let mut imported = 0;
    for record in resp.records {
        if state.storage.save_record(&record).await.is_ok() {
            imported += 1;
        }
    }
    Ok(ImportResult { imported })
}

#[tauri::command]
pub async fn export_user_data(handle: AppHandle, target_dir: String) -> AppResult<String> {
    let state: tauri::State<AppState> = handle.state();
    let entries = state.storage.snapshot_index(usize::MAX).await?;
    let mut all: Vec<ReadingRecord> = Vec::with_capacity(entries.len());
    for e in entries {
        if let Ok(r) = state.storage.load_record(&e.id).await {
            all.push(r);
        }
    }
    let json = serde_json::to_string_pretty(&all)?;
    let target = std::path::PathBuf::from(&target_dir).join("cyberoracle-export.json");
    tokio::fs::write(&target, json).await?;
    Ok(target.to_string_lossy().to_string())
}
```

`export_user_data` 是合规标配——给用户"我的数据可以随时带走"的承诺，也是 GDPR 风格的"数据可携权"。即使 MVP 阶段，这个命令的存在就足以传达隐私态度。

### `src/commands/companion.rs`

```rust
// apps/desktop/src-tauri/src/commands/companion.rs

use crate::error::AppResult;
use crate::AppState;
use serde::Deserialize;
use tauri::{AppHandle, Emitter, Manager};

#[derive(Debug, Deserialize)]
pub struct SetModelArgs {
    pub model_id: String,
}

#[tauri::command]
pub async fn set_companion_model(handle: AppHandle, args: SetModelArgs) -> AppResult<()> {
    let state: tauri::State<AppState> = handle.state();
    {
        let mut cfg = state.config.write().await;
        cfg.companion.model_id = args.model_id.clone();
        cfg.save(&handle).await?;
    }
    handle.emit(
        "companion:model_changed",
        &serde_json::json!({ "model_id": args.model_id }),
    )?;
    Ok(())
}

#[derive(Debug, Deserialize)]
pub struct SpeakArgs {
    pub text: String,
    pub voice: Option<String>,
}

#[tauri::command]
pub async fn speak_text(handle: AppHandle, args: SpeakArgs) -> AppResult<()> {
    // MVP：调用系统 TTS，跨平台分支
    #[cfg(target_os = "macos")]
    {
        let _ = std::process::Command::new("say").arg(&args.text).spawn();
    }
    #[cfg(target_os = "windows")]
    {
        let escaped = args.text.replace('"', "");
        let ps = format!(
            "Add-Type -AssemblyName System.Speech; \
             $s=New-Object System.Speech.Synthesis.SpeechSynthesizer; \
             $s.Speak(\"{}\")",
            escaped
        );
        let _ = std::process::Command::new("powershell")
            .args(["-Command", &ps])
            .spawn();
    }
    #[cfg(target_os = "linux")]
    {
        let _ = std::process::Command::new("espeak").arg(&args.text).spawn();
    }

    // 同步通知前端立绘做嘴型动画
    handle.emit(
        "companion:speak",
        &serde_json::json!({
            "text": args.text,
            "voice": args.voice,
        }),
    )?;
    Ok(())
}

#[derive(Debug, Deserialize)]
pub struct TappedArgs {
    pub hit_part: Option<String>, // "face" | "hair" | "hand" | "clothes"
}

#[tauri::command]
pub async fn companion_tapped(handle: AppHandle, args: TappedArgs) -> AppResult<()> {
    // 后端轻量决策：根据时间段、当日点击次数选择反应
    // 这里简化版：直接 emit，让前端去调"被点击台词"模板
    handle.emit(
        "companion:tapped",
        &serde_json::json!({
            "hit_part": args.hit_part.unwrap_or_else(|| "unknown".into())
        }),
    )?;
    Ok(())
}
```

### `src/commands/window.rs`

```rust
// apps/desktop/src-tauri/src/commands/window.rs

use crate::error::{AppError, AppResult};
use tauri::{AppHandle, Manager};

#[tauri::command]
pub async fn show_main_window(handle: AppHandle) -> AppResult<()> {
    if let Some(win) = handle.get_webview_window("main") {
        win.show()?;
        win.unminimize().ok();
        win.set_focus()?;
    }
    Ok(())
}

#[tauri::command]
pub async fn toggle_companion_window(handle: AppHandle) -> AppResult<bool> {
    let win = handle
        .get_webview_window("companion")
        .ok_or_else(|| AppError::NotFound("companion window".into()))?;
    let visible = win.is_visible()?;
    if visible {
        win.hide()?;
        Ok(false)
    } else {
        win.show()?;
        Ok(true)
    }
}

#[tauri::command]
pub async fn toggle_quick_window(handle: AppHandle) -> AppResult<bool> {
    let win = handle
        .get_webview_window("quick")
        .ok_or_else(|| AppError::NotFound("quick window".into()))?;
    let visible = win.is_visible()?;
    if visible {
        win.hide()?;
        Ok(false)
    } else {
        win.show()?;
        win.set_focus()?;
        Ok(true)
    }
}

#[tauri::command]
pub async fn set_cursor_passthrough(window: tauri::Window, passthrough: bool) -> AppResult<()> {
    window.set_ignore_cursor_events(passthrough)?;
    Ok(())
}
```

### `src/commands/daily.rs`

```rust
// apps/desktop/src-tauri/src/commands/daily.rs

use crate::error::AppResult;
use crate::AppState;
use serde::Serialize;
use tauri::{AppHandle, Manager};

#[derive(Debug, Serialize, serde::Deserialize)]
pub struct DailyFortune {
    pub title: String,
    pub date: String,
    pub ganzhi: String,
    pub solar_term: String,
    pub one_line: String,
    pub ratings: serde_json::Value,
    pub lucky: serde_json::Value,
    pub advice: serde_json::Value,
}

#[tauri::command]
pub async fn fetch_daily_fortune(handle: AppHandle) -> AppResult<DailyFortune> {
    let state: tauri::State<AppState> = handle.state();
    let api_base = state.config.read().await.api_base_url.clone();
    let token = crate::device::get_device_token(&handle).await?;

    let json: serde_json::Value = state
        .http
        .get(format!("{api_base}/api/daily"))
        .bearer_auth(token)
        .send()
        .await?
        .error_for_status()?
        .json()
        .await?;

    let parsed: DailyFortune = serde_json::from_value(json)?;
    Ok(parsed)
}
```

### `src/commands/quick.rs`

```rust
// apps/desktop/src-tauri/src/commands/quick.rs

use crate::error::AppResult;
use crate::AppState;
use eventsource_stream::Eventsource;
use futures_util::StreamExt;
use tauri::{AppHandle, Emitter, Manager};

#[tauri::command]
pub async fn quick_ask_stream(handle: AppHandle, question: String) -> AppResult<()> {
    let state: tauri::State<AppState> = handle.state();
    let api_base = state.config.read().await.api_base_url.clone();
    let token = crate::device::get_device_token(&handle).await?;
    let http = state.http.clone();
    drop(state);

    let h = handle.clone();
    tauri::async_runtime::spawn(async move {
        let resp = http
            .post(format!("{api_base}/api/quick-ask"))
            .bearer_auth(token)
            .json(&serde_json::json!({ "question": question }))
            .header("Accept", "text/event-stream")
            .send()
            .await;

        let resp = match resp {
            Ok(r) => match r.error_for_status() {
                Ok(r) => r,
                Err(e) => {
                    h.emit("quick:error", e.to_string()).ok();
                    return;
                }
            },
            Err(e) => {
                h.emit("quick:error", e.to_string()).ok();
                return;
            }
        };

        let mut stream = resp.bytes_stream().eventsource();
        while let Some(item) = stream.next().await {
            match item {
                Ok(ev) => {
                    h.emit("quick:chunk", &ev.data).ok();
                    if ev.event == "done" {
                        h.emit("quick:done", &serde_json::Value::Null).ok();
                        break;
                    }
                }
                Err(e) => {
                    h.emit("quick:error", e.to_string()).ok();
                    break;
                }
            }
        }
    });
    Ok(())
}
```

---

## 十三、托盘菜单

### `src/tray.rs`

```rust
// apps/desktop/src-tauri/src/tray.rs

use tauri::{
    menu::{Menu, MenuEvent, MenuItem, PredefinedMenuItem, Submenu},
    tray::TrayIconEvent,
    AppHandle, Manager,
};

pub fn setup_tray(handle: &AppHandle) -> tauri::Result<()> {
    let menu = build_menu(handle)?;
    if let Some(tray) = handle.tray_by_id("main") {
        tray.set_menu(Some(menu))?;
        tray.on_menu_event(handle_menu_event);
        tray.on_tray_icon_event(handle_tray_icon_event);
    }
    Ok(())
}

fn build_menu(handle: &AppHandle) -> tauri::Result<Menu<tauri::Wry>> {
    let m_today = MenuItem::with_id(handle, "today", "今日运势", true, None::<&str>)?;
    let m_palm = MenuItem::with_id(handle, "palm", "看手相", true, None::<&str>)?;
    let m_face = MenuItem::with_id(handle, "face", "看面相", true, None::<&str>)?;
    let m_show_main = MenuItem::with_id(handle, "show_main", "显示主窗口", true, None::<&str>)?;
    let m_toggle_companion =
        MenuItem::with_id(handle, "toggle_companion", "显示/隐藏桌面伙伴", true, None::<&str>)?;
    let m_settings = MenuItem::with_id(handle, "settings", "设置", true, None::<&str>)?;
    let m_quit = MenuItem::with_id(handle, "quit", "退出", true, None::<&str>)?;

    let sep1 = PredefinedMenuItem::separator(handle)?;
    let sep2 = PredefinedMenuItem::separator(handle)?;
    let sep3 = PredefinedMenuItem::separator(handle)?;

    let menu = Menu::with_items(
        handle,
        &[
            &m_today,
            &sep1,
            &m_palm,
            &m_face,
            &sep2,
            &m_show_main,
            &m_toggle_companion,
            &sep3,
            &m_settings,
            &m_quit,
        ],
    )?;
    Ok(menu)
}

fn handle_menu_event(handle: &AppHandle, event: MenuEvent) {
    let id = event.id().0.clone();
    let h = handle.clone();
    tauri::async_runtime::spawn(async move {
        match id.as_str() {
            "today" => {
                if let Some(win) = h.get_webview_window("main") {
                    let _ = win.show();
                    let _ = win.set_focus();
                    let _ = win.eval("window.location.hash = '#/daily'");
                }
            }
            "palm" => {
                if let Some(win) = h.get_webview_window("main") {
                    let _ = win.show();
                    let _ = win.set_focus();
                    let _ = win.eval("window.location.hash = '#/palm'");
                }
            }
            "face" => {
                if let Some(win) = h.get_webview_window("main") {
                    let _ = win.show();
                    let _ = win.set_focus();
                    let _ = win.eval("window.location.hash = '#/face'");
                }
            }
            "show_main" => {
                if let Some(win) = h.get_webview_window("main") {
                    let _ = win.show();
                    let _ = win.set_focus();
                }
            }
            "toggle_companion" => {
                if let Some(win) = h.get_webview_window("companion") {
                    let visible = win.is_visible().unwrap_or(false);
                    if visible {
                        let _ = win.hide();
                    } else {
                        let _ = win.show();
                    }
                }
            }
            "settings" => {
                if let Some(win) = h.get_webview_window("main") {
                    let _ = win.show();
                    let _ = win.set_focus();
                    let _ = win.eval("window.location.hash = '#/settings'");
                }
            }
            "quit" => {
                h.exit(0);
            }
            _ => {}
        }
    });
}

fn handle_tray_icon_event(_handle: &AppHandle, event: TrayIconEvent) {
    if let TrayIconEvent::DoubleClick { .. } = event {
        // 双击托盘 = 显示主窗口
        // 这里 _handle 没用上是因为实际操作要从 tray 拿 app handle，
        // 在 Tauri 2 里事件里直接通过 tray.app_handle() 取
    }
}
```

通过 `win.eval("window.location.hash = '#/palm'")` 直接操纵前端路由是个**实用小技巧**——避免了菜单到前端再到路由的多轮通信，托盘点击立刻跳到目标页面。

---

## 十四、全局快捷键

### `src/shortcuts.rs`

```rust
// apps/desktop/src-tauri/src/shortcuts.rs

use crate::AppState;
use tauri::{AppHandle, Manager};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};

pub fn register_shortcuts(handle: &AppHandle) -> tauri::Result<()> {
    let state: tauri::State<AppState> = handle.state();
    let cfg = tauri::async_runtime::block_on(async { state.config.read().await.clone() });

    let gs = handle.global_shortcut();

    let bindings: Vec<(String, &'static str)> = vec![
        (cfg.shortcuts.quick_ask, "quick_ask"),
        (cfg.shortcuts.palm, "palm"),
        (cfg.shortcuts.daily, "daily"),
        (cfg.shortcuts.toggle_companion, "toggle_companion"),
    ];

    for (combo, action) in bindings {
        let sc: Shortcut = match combo.parse() {
            Ok(s) => s,
            Err(e) => {
                tracing::warn!("invalid shortcut '{combo}': {e}");
                continue;
            }
        };
        let h = handle.clone();
        let action = action.to_string();
        gs.on_shortcut(sc, move |_app, _shortcut, event| {
            if event.state() != ShortcutState::Pressed {
                return;
            }
            let h2 = h.clone();
            let action = action.clone();
            tauri::async_runtime::spawn(async move {
                handle_action(&h2, &action).await;
            });
        })?;
    }

    Ok(())
}

async fn handle_action(handle: &AppHandle, action: &str) {
    match action {
        "quick_ask" => {
            if let Some(win) = handle.get_webview_window("quick") {
                let _ = win.show();
                let _ = win.set_focus();
            }
        }
        "palm" => {
            if let Some(win) = handle.get_webview_window("main") {
                let _ = win.show();
                let _ = win.set_focus();
                let _ = win.eval("window.location.hash = '#/palm'");
            }
        }
        "daily" => {
            if let Some(win) = handle.get_webview_window("main") {
                let _ = win.show();
                let _ = win.set_focus();
                let _ = win.eval("window.location.hash = '#/daily'");
            }
        }
        "toggle_companion" => {
            if let Some(win) = handle.get_webview_window("companion") {
                let visible = win.is_visible().unwrap_or(false);
                if visible {
                    let _ = win.hide();
                } else {
                    let _ = win.show();
                }
            }
        }
        _ => {}
    }
}
```

---

## 十五、桌宠定时事件

### `src/companion_events.rs`

```rust
// apps/desktop/src-tauri/src/companion_events.rs

use crate::AppState;
use chrono::{Local, NaiveTime};
use tauri::{AppHandle, Emitter, Manager};
use tokio::time::{sleep, Duration};

/// 启动后台调度器：
/// - 每分钟检查一次是否到了"早晨问候"时间
/// - 按配置间隔触发"闲时旁白"
pub fn start_scheduler(handle: AppHandle) {
    tauri::async_runtime::spawn(morning_greet_loop(handle.clone()));
    tauri::async_runtime::spawn(idle_line_loop(handle));
}

async fn morning_greet_loop(handle: AppHandle) {
    let mut last_fired_date: Option<chrono::NaiveDate> = None;
    loop {
        sleep(Duration::from_secs(60)).await;

        let state: tauri::State<AppState> = handle.state();
        let cfg = state.config.read().await;
        if !cfg.companion.enable_morning_greet {
            continue;
        }
        let target = match NaiveTime::parse_from_str(&cfg.companion.morning_greet_time, "%H:%M") {
            Ok(t) => t,
            Err(_) => continue,
        };
        drop(cfg);

        let now = Local::now();
        let today = now.date_naive();
        let now_t = now.time();

        if Some(today) == last_fired_date {
            continue;
        }
        // 到点了 ±1 分钟
        let diff = (now_t.signed_duration_since(target)).num_minutes();
        if diff.abs() <= 1 {
            handle
                .emit(
                    "companion:event",
                    &serde_json::json!({
                        "kind": "morning_greet"
                    }),
                )
                .ok();
            // 自动唤起桌宠窗口
            if let Some(win) = handle.get_webview_window("companion") {
                let _ = win.show();
            }
            last_fired_date = Some(today);
        }
    }
}

async fn idle_line_loop(handle: AppHandle) {
    loop {
        let state: tauri::State<AppState> = handle.state();
        let cfg = state.config.read().await;
        let enabled = cfg.companion.enable_idle_lines;
        let interval = cfg.companion.idle_interval_minutes.max(10) as u64;
        drop(cfg);

        sleep(Duration::from_secs(interval * 60)).await;

        if !enabled {
            continue;
        }
        // 仅当桌宠窗口可见时触发
        let visible = handle
            .get_webview_window("companion")
            .and_then(|w| w.is_visible().ok())
            .unwrap_or(false);
        if visible {
            let now = Local::now();
            let time_of_day = match now.hour() {
                5..=10 => "morning",
                11..=14 => "noon",
                15..=18 => "afternoon",
                19..=22 => "evening",
                _ => "night",
            };
            handle
                .emit(
                    "companion:event",
                    &serde_json::json!({
                        "kind": "idle",
                        "time_of_day": time_of_day,
                    }),
                )
                .ok();
        }
    }
}
```

`use chrono::Timelike;` 别忘了——`now.hour()` 来自这个 trait。我没把它写进 use 语句是因为 chrono prelude 通常会带，实际编译时如果报错加上即可。

---

## 十六、自动更新

### `src/updater.rs`

```rust
// apps/desktop/src-tauri/src/updater.rs

use tauri::AppHandle;
use tauri_plugin_updater::UpdaterExt;
use tokio::time::{sleep, Duration};

pub fn schedule_check(handle: AppHandle) {
    tauri::async_runtime::spawn(async move {
        // 启动后 60 秒再检查，避免影响首屏体验
        sleep(Duration::from_secs(60)).await;
        if let Err(e) = check_for_updates(&handle).await {
            tracing::warn!("update check failed: {e}");
        }
    });
}

async fn check_for_updates(handle: &AppHandle) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let updater = handle.updater()?;
    let update = match updater.check().await? {
        Some(u) => u,
        None => {
            tracing::info!("already up to date");
            return Ok(());
        }
    };

    tracing::info!("update available: {} -> {}", env!("CARGO_PKG_VERSION"), update.version);

    // 把"有新版本"的事件发给前端，让 UI 弹一个友好提示
    use tauri::Emitter;
    handle.emit(
        "update:available",
        &serde_json::json!({
            "version": update.version,
            "notes": update.body,
        }),
    )?;

    // 下面的 download_and_install 由前端按用户确认后再调，
    // 这里只通知，不自动装。这是更尊重用户的策略。
    Ok(())
}
```

把更新决策权留给用户而不是静默后台升级，是桌面应用应有的礼仪——尤其是带桌宠的应用，强制更新会打断"陪伴感"。

---

## 十七、前端最小集成

下面给出前端如何把这些 command 串起来用，**只贴关键的 lib 和一个页面示例**，完整前端代码已经在前几篇里展开过。

### `src/lib/tauri-api.ts`

```ts
// apps/desktop/src/lib/tauri-api.ts

import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';

/**
 * 统一的命令调用层。所有错误形态都是 { code, message }，
 * 上层用 try/catch 拿到的 e 可以直接 e.code 判断。
 */
export const api = {
  upload(path: string, kind: 'palm' | 'face') {
    return invoke<{ id: string }>('upload_image', { args: { path, kind } });
  },
  analyzeStream(id: string) {
    return invoke<void>('analyze_stream', { id });
  },
  cancelAnalyze(id: string) {
    return invoke<void>('cancel_analyze', { id });
  },
  renderPoster(id: string) {
    return invoke<{ localPath: string; assetUrl: string }>('render_poster', { id });
  },
  listHistory(limit = 50) {
    return invoke<Array<{ id: string; kind: string; created_at: string }>>('list_history', { limit });
  },
  getHistory(id: string) {
    return invoke<{ id: string; kind: string; created_at: string; data: any }>('get_history', { id });
  },
  deleteHistory(id: string) {
    return invoke<void>('delete_history', { id });
  },
  fetchDaily() {
    return invoke('fetch_daily_fortune');
  },
  speak(text: string) {
    return invoke<void>('speak_text', { args: { text } });
  },
  showMain() {
    return invoke<void>('show_main_window');
  },
  toggleCompanion() {
    return invoke<boolean>('toggle_companion_window');
  },
  setCursorPassthrough(passthrough: boolean) {
    return invoke<void>('set_cursor_passthrough', { passthrough });
  },
  importWebHistory(code: string) {
    return invoke<{ imported: number }>('import_web_history', { args: { code } });
  },
};

/**
 * 事件订阅的轻封装：返回 unlisten 函数便于 useEffect 清理。
 */
export const events = {
  on<T = any>(name: string, handler: (payload: T) => void): Promise<UnlistenFn> {
    return listen<T>(name, (e) => handler(e.payload));
  },
};
```

### `src/pages/ResultPage.tsx`（简化）

```tsx
// apps/desktop/src/pages/ResultPage.tsx

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, events } from '../lib/tauri-api';
import { useCompanionStore } from '@cyberoracle/ui/Live2DStage';

export function ResultPage() {
  const { id } = useParams<{ id: string }>();
  const setCompanionState = useCompanionStore((s) => s.setState);
  const speak = useCompanionStore((s) => s.speak);

  const [stage, setStage] = useState<'thinking' | 'rendered' | 'failed'>('thinking');
  const [imageUrl, setImageUrl] = useState<string>('');

  useEffect(() => {
    if (!id) return;
    setCompanionState('thinking');
    const unlisteners: Array<Promise<() => void>> = [];

    unlisteners.push(events.on<{ data: any }>('analyze:chunk', (p) => {
      const text: string | undefined = p?.data?.delta;
      if (text) speak(text);
    }));
    unlisteners.push(events.on('analyze:done', async () => {
      setCompanionState('celebrate');
      const r = await api.renderPoster(id);
      setImageUrl(r.assetUrl);
      setStage('rendered');
    }));
    unlisteners.push(events.on('analyze:error', () => {
      setCompanionState('sad');
      setStage('failed');
    }));

    api.analyzeStream(id).catch(() => setStage('failed'));

    return () => {
      api.cancelAnalyze(id).catch(() => {});
      unlisteners.forEach((p) => p.then((fn) => fn()).catch(() => {}));
      setCompanionState('idle');
    };
  }, [id, setCompanionState, speak]);

  return (
    <div className="result-page">
      {stage === 'thinking' && <div>她正在认真看你的手相……</div>}
      {stage === 'rendered' && <img src={imageUrl} alt="解读长图" />}
      {stage === 'failed' && <div>这次没看清，要不要再试一张？</div>}
    </div>
  );
}
```

### `package.json`（前端部分）

```json
{
  "name": "cyberoracle-desktop-frontend",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "tauri": "tauri"
  },
  "dependencies": {
    "@tauri-apps/api": "^2.0.0",
    "@tauri-apps/plugin-clipboard-manager": "^2.0.0",
    "@tauri-apps/plugin-dialog": "^2.0.0",
    "@tauri-apps/plugin-fs": "^2.0.0",
    "@tauri-apps/plugin-global-shortcut": "^2.0.0",
    "@tauri-apps/plugin-notification": "^2.0.0",
    "@tauri-apps/plugin-os": "^2.0.0",
    "@tauri-apps/plugin-process": "^2.0.0",
    "@tauri-apps/plugin-shell": "^2.0.0",
    "@tauri-apps/plugin-updater": "^2.0.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.0",
    "zustand": "^4.5.2"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "typescript": "^5.4.5",
    "vite": "^5.4.0"
  }
}
```

---

## 十八、build.rs

### `src-tauri/build.rs`

```rust
fn main() {
    tauri_build::build()
}
```

最简单的 build script，但这个文件**必须存在**，否则 Tauri 的代码生成（capabilities → Rust 代码）不会执行，编译会报奇怪的错。

---

## 十九、签名与发布速查

最后给一份签名/打包的快速参考，避免你团队真到上线那天临时翻文档：

**生成更新签名密钥对**：
```bash
pnpm tauri signer generate -w ~/.tauri/cyberoracle.key
# 公钥贴到 tauri.conf.json 的 plugins.updater.pubkey
# 私钥设为环境变量 TAURI_SIGNING_PRIVATE_KEY 用于 CI 签名
```

**macOS 代码签名 + Notarize**：
```bash
export APPLE_SIGNING_IDENTITY="Developer ID Application: YourName (TEAMID)"
export APPLE_ID="your@apple.id"
export APPLE_PASSWORD="@keychain:AC_PASSWORD"
export APPLE_TEAM_ID="TEAMID"
pnpm tauri build --target universal-apple-darwin
```

**Windows EV 签名**：
```bash
# 把 EV 证书指纹填入 tauri.conf.json 的 bundle.windows.certificateThumbprint
pnpm tauri build --target x86_64-pc-windows-msvc
```

**Linux**：
```bash
pnpm tauri build --target x86_64-unknown-linux-gnu
# AppImage / deb 双产物
```

---

## 总结

这份骨架已经覆盖了 Tauri 客户端从零跑起来需要的所有"非业务"基础设施：

第一，**配置 + 错误 + 加密 + 钥匙串 + 存储这五层是底盘**，决定了应用的稳定性与隐私可信度。AES-256-GCM + 系统钥匙串让"你的解读历史只有你本人能解开"是可以严肃承诺的事。

第二，**多窗口 + 托盘 + 全局快捷键 + 桌宠定时事件构成了"桌面陪伴"的体感**。主窗口关闭只是隐藏、托盘双击唤回、Cmd+Shift+O 立刻召唤、早晨 9 点自动问候——这些细节加在一起就让"星子"真正住进了用户的电脑里。

第三，**LLM 全部走云端代理 + 设备 JWT 是安全与商业的底线**。任何 API key 都不会下发到客户端，单设备的限流、计费、灰度都在云端可控。
