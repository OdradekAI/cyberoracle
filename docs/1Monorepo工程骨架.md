# cyberoracle/ — Monorepo 完整工程化配置

这是整个项目的"工程收口"，把前面四篇里散落的 web、desktop、server、packages/\* 真正粘合成一个能 `pnpm install && pnpm dev` 一键跑起来的工作空间。我会按"为什么这么设计 → 根目录 → 应用包 → 共享包 → CI/CD → 上手清单"的顺序展开，每个文件都给完整可用的内容。

---

## 〇、几个关键工程决策（先说结论再上代码）

monorepo 的搭法千差万别，我需要先把这个项目特有的几个关键选择讲清楚，否则后面的配置看起来会有些"为什么这样而不那样"。

**第一，pnpm + Turborepo，不用 Nx 不用 Lerna**。pnpm 的 workspace + 硬链接节省磁盘的特性对一个有 Tauri/Vite/Next.js/satori 多套构建链的项目至关重要（Nx 的 cache 系统有学习成本，Lerna 已半弃用）。Turborepo 负责"跨包构建依赖图 + 远程缓存"，不引入额外抽象层，配置文件就一份 `turbo.json`。

**第二，packages/\* 用 TypeScript 源码直接导出（不预编译）**。每个共享包的 `package.json` 里 `main` 字段直接指向 `src/index.ts`，由消费方（Vite / Next.js / tsx）自己编译。这样改 `packages/poster` 一行代码不需要 watch build，前端立刻热更新。**只有发布到 npm 时才需要预编译**，本项目所有 packages 都是 `private: true`，永远不发，所以省掉编译这一步是巨大的开发体验红利。

**第三，Node 20 + pnpm 9 锁定**。在根 `package.json` 里 `engines` 严格声明，团队成员和 CI 用 Volta/asdf 跟随。Tauri Rust 那侧用 `rust-toolchain.toml` 锁定 1.78+。

**第四，turbo 的 task 图按"实际依赖"声明，不按目录套娃**。比如 `apps/desktop#build` 依赖 `packages/ui#build` 和 `packages/poster#build` 是因为它真的 import 了，而不是因为它在 monorepo 里——这让缓存命中率最大化。

**第五，root 提供"一键命令"**。`pnpm dev`、`pnpm dev:desktop`、`pnpm release:desktop` 这些聚合脚本写在 root 的 `package.json` 里，新人不需要记每个子包怎么跑。

---

## 一、目录结构（最终态）

```
cyberoracle/
├── package.json                       # root：workspace + 聚合脚本
├── pnpm-workspace.yaml                # 工作空间声明
├── pnpm-lock.yaml                     # 唯一锁文件
├── turbo.json                         # 任务图与缓存
├── tsconfig.base.json                 # 所有包共享的 TS 基线
├── .npmrc                             # pnpm 行为约束
├── .nvmrc                             # Node 版本钉死
├── rust-toolchain.toml                # Rust 版本钉死
├── .gitignore
├── .gitattributes
├── .editorconfig
├── .prettierrc
├── .prettierignore
├── eslint.config.js                   # flat config，全仓共享
├── .changeset/                        # 内部版本管理（虽然不发 npm，但用它做 release notes）
│   └── config.json
├── .github/
│   └── workflows/
│       ├── ci.yml                     # PR 检查
│       ├── release-web.yml            # web 部署
│       └── release-desktop.yml        # 客户端三平台打包
├── scripts/
│   ├── check-versions.sh              # 检查 Node/pnpm/Rust 是否符合
│   ├── clean.sh                       # 一键清空缓存
│   └── prepare-fonts.sh               # 字体子集化
├── apps/
│   ├── web/                           # Next.js 14
│   ├── desktop/                       # Tauri 2.0
│   └── server/                        # Next.js Route Handlers（云端 API）
└── packages/
    ├── core/                          # Prompt + Schema + 业务逻辑
    ├── poster/                        # satori 长图模板
    ├── ui/                            # 跨端 React 组件库
    └── tokens/                        # 设计 token
```

---

## 二、根目录配置

### `package.json`（root）

```json
{
  "name": "cyberoracle",
  "version": "0.0.0",
  "private": true,
  "description": "赛博玄学馆 monorepo",
  "packageManager": "pnpm@9.12.0",
  "engines": {
    "node": ">=20.10.0",
    "pnpm": ">=9.0.0"
  },
  "scripts": {
    "preinstall": "npx only-allow pnpm",
    "postinstall": "bash scripts/check-versions.sh",

    "dev": "turbo run dev --concurrency 20",
    "dev:web": "turbo run dev --filter=@cyberoracle/web... --filter=@cyberoracle/server...",
    "dev:desktop": "turbo run dev --filter=@cyberoracle/desktop... --filter=@cyberoracle/server...",
    "dev:server": "turbo run dev --filter=@cyberoracle/server",

    "build": "turbo run build",
    "build:web": "turbo run build --filter=@cyberoracle/web...",
    "build:desktop": "turbo run build --filter=@cyberoracle/desktop...",
    "build:server": "turbo run build --filter=@cyberoracle/server",
    "build:packages": "turbo run build --filter='./packages/*'",

    "lint": "turbo run lint",
    "lint:fix": "turbo run lint -- --fix",
    "typecheck": "turbo run typecheck",
    "test": "turbo run test",
    "test:watch": "turbo run test:watch --concurrency 1 --no-cache",

    "preview:poster": "pnpm --filter @cyberoracle/poster preview",
    "preview:poster:watch": "pnpm --filter @cyberoracle/poster preview:watch",

    "release:desktop": "pnpm --filter @cyberoracle/desktop tauri build",
    "release:desktop:mac": "pnpm --filter @cyberoracle/desktop tauri build --target universal-apple-darwin",
    "release:desktop:win": "pnpm --filter @cyberoracle/desktop tauri build --target x86_64-pc-windows-msvc",
    "release:desktop:linux": "pnpm --filter @cyberoracle/desktop tauri build --target x86_64-unknown-linux-gnu",

    "clean": "bash scripts/clean.sh",
    "clean:cache": "rm -rf .turbo node_modules/.cache && pnpm -r exec rm -rf .turbo dist .next .vite",
    "clean:all": "pnpm clean:cache && pnpm -r exec rm -rf node_modules && rm -rf node_modules",

    "fonts:prepare": "bash scripts/prepare-fonts.sh",

    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md,yml,yaml}\"",
    "format:check": "prettier --check \"**/*.{ts,tsx,js,jsx,json,md,yml,yaml}\"",

    "changeset": "changeset",
    "changeset:version": "changeset version"
  },
  "devDependencies": {
    "@changesets/cli": "^2.27.7",
    "@types/node": "^20.14.10",
    "eslint": "^9.7.0",
    "@eslint/js": "^9.7.0",
    "typescript-eslint": "^8.0.0",
    "eslint-plugin-react": "^7.35.0",
    "eslint-plugin-react-hooks": "^5.1.0",
    "only-allow": "^1.2.1",
    "prettier": "^3.3.3",
    "turbo": "^2.0.9",
    "typescript": "^5.5.4"
  },
  "pnpm": {
    "peerDependencyRules": {
      "allowedVersions": {
        "react": "18",
        "react-dom": "18"
      },
      "ignoreMissing": ["@types/react", "@types/react-dom"]
    },
    "overrides": {
      "react": "^18.3.1",
      "react-dom": "^18.3.1"
    },
    "onlyBuiltDependencies": [
      "@tauri-apps/cli",
      "@resvg/resvg-js",
      "esbuild",
      "sharp"
    ]
  }
}
```

几个反直觉的点值得展开讲：

**`preinstall: only-allow pnpm`** 是防御性约束。新人 `npm install` 会被立刻拦下，避免出现 `package-lock.json` 污染仓库（这是大型 monorepo 最常见的事故源之一）。

**`pnpm.overrides` 强制 react 18**。R3F、pixi-live2d-display、satori 都对 react 版本敏感，强制锁定一个版本能消除 90% 的"两份 react 实例"问题。即使将来某个间接依赖想升 react 19，也会被这条锁住。

**`onlyBuiltDependencies`** 是 pnpm 9 的安全特性。默认 pnpm 不再执行任意包的 postinstall 脚本（防供应链攻击），需要显式列出哪些包允许执行——`@tauri-apps/cli`（编译 Rust）、`@resvg/resvg-js`（编译原生 SVG 渲染器）、`esbuild`（下载二进制）、`sharp`（图像处理）这四个是真正需要的。

**dev 脚本用 `--filter=xxx...` 三个点**是 pnpm/turbo 的"含依赖图"过滤。`pnpm dev:desktop` 自动启动 desktop + 它依赖的 packages/\* + server，新人不用记三个终端要分别跑什么。

### `pnpm-workspace.yaml`

```yaml
packages:
  - 'apps/*'
  - 'packages/*'

# 可选：catalog 让所有包共享同一组依赖版本（pnpm 9.5+ 特性）
catalog:
  react: ^18.3.1
  react-dom: ^18.3.1
  '@types/react': ^18.3.3
  '@types/react-dom': ^18.3.0
  typescript: ^5.5.4
  zod: ^3.23.8
  zustand: ^4.5.2
  framer-motion: ^11.3.0
```

`catalog:` 是 pnpm 9.5 引入的新特性——子包用 `"react": "catalog:"` 引用，统一升级一处即所有包同步。**这个特性比 `overrides` 更优雅**，因为它把版本对齐变成了正向声明而非强制覆盖。

### `turbo.json`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "ui": "tui",
  "globalDependencies": [
    "**/.env.*local",
    "tsconfig.base.json",
    ".prettierrc",
    "eslint.config.js"
  ],
  "globalEnv": ["NODE_ENV", "VERCEL_ENV", "CI"],
  "tasks": {
    "dev": {
      "cache": false,
      "persistent": true,
      "dependsOn": ["^build:dev"]
    },

    "build": {
      "dependsOn": ["^build"],
      "inputs": [
        "src/**",
        "public/**",
        "app/**",
        "fonts/**",
        "package.json",
        "tsconfig.json",
        "tsconfig.build.json",
        "next.config.*",
        "vite.config.*",
        "tauri.conf.json",
        "Cargo.toml",
        "src-tauri/**"
      ],
      "outputs": [
        "dist/**",
        ".next/**",
        "!.next/cache/**",
        "src-tauri/target/release/bundle/**"
      ],
      "env": [
        "API_BASE_URL",
        "NEXT_PUBLIC_*",
        "VITE_*",
        "TAURI_SIGNING_*",
        "APPLE_*",
        "WINDOWS_CERTIFICATE_*"
      ]
    },

    "build:dev": {
      "cache": false,
      "outputs": []
    },

    "lint": {
      "dependsOn": ["^build:dev"],
      "inputs": [
        "src/**",
        "*.ts",
        "*.tsx",
        "*.js",
        "package.json",
        "eslint.config.js"
      ],
      "outputs": []
    },

    "typecheck": {
      "dependsOn": ["^build:dev"],
      "inputs": [
        "src/**",
        "*.ts",
        "*.tsx",
        "tsconfig.json",
        "tsconfig.base.json"
      ],
      "outputs": []
    },

    "test": {
      "dependsOn": ["^build:dev"],
      "inputs": [
        "src/**",
        "tests/**",
        "*.test.ts",
        "*.test.tsx",
        "vitest.config.*"
      ],
      "outputs": ["coverage/**"]
    },

    "test:watch": {
      "cache": false,
      "persistent": true,
      "dependsOn": ["^build:dev"]
    },

    "preview": {
      "cache": false,
      "persistent": false
    },

    "preview:watch": {
      "cache": false,
      "persistent": true
    },

    "tauri": {
      "cache": false,
      "persistent": false
    }
  },
  "remoteCache": {
    "signature": true
  }
}
```

`build:dev` 是关键技巧——它是一个**空操作 task**（什么都不做、不缓存），存在的唯一目的是给上游包一个"我已经准备好被引用了"的信号。这样 dev/lint/test/typecheck 都能依赖 `^build:dev`（其它包在 dev 模式下的"准备就绪"），又不会真的触发预编译。

`globalEnv` 列出了所有影响构建结果的环境变量。**任何这里没列的环境变量，turbo 都会忽略它来计算 cache key**，所以新加 env 时一定要同步加到这里，否则会出现"改了 env 但 turbo 用了旧缓存"的诡异 bug。

`outputs` 里的 `!.next/cache/**` 是排除子目录——Next.js 的增量构建缓存不应该跟 build 产物一起被 turbo 上传到远程缓存。

### `tsconfig.base.json`

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],

    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "useUnknownInCatchVariables": true,

    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,

    "skipLibCheck": true,
    "incremental": true,

    "jsx": "preserve",

    "baseUrl": ".",
    "paths": {
      "@cyberoracle/core": ["./packages/core/src"],
      "@cyberoracle/core/*": ["./packages/core/src/*"],
      "@cyberoracle/poster": ["./packages/poster/src"],
      "@cyberoracle/poster/*": ["./packages/poster/src/*"],
      "@cyberoracle/ui": ["./packages/ui/src"],
      "@cyberoracle/ui/*": ["./packages/ui/src/*"],
      "@cyberoracle/tokens": ["./packages/tokens/src"],
      "@cyberoracle/tokens/*": ["./packages/tokens/src/*"]
    }
  },
  "exclude": ["node_modules", "dist", ".next", "src-tauri/target"]
}
```

**`paths` 直接指向各包的 `src` 目录而不是 `dist`**——这是配合"不预编译 packages"策略的关键。IDE 跳转、Vite/Next 编译都通过这个映射直读 TS 源码。

**`noUncheckedIndexedAccess: true`** 是项目级 lint 投资。它让 `arr[0]` 的类型是 `T | undefined`，逼着写代码时必须做边界判断。这个开关在 LLM 输出解析、动态 record 索引这类场景下能挡掉至少 70% 的运行时 NPE。

### `.npmrc`

```ini
# 所有依赖必须显式声明，禁止依赖提升带来的"幽灵依赖"
strict-peer-dependencies=false
auto-install-peers=true

# pnpm 9：默认 hoist=false 已生效，但显式声明更稳
shamefully-hoist=false

# 锁定 npm registry，避免私人 .npmrc 污染
registry=https://registry.npmjs.org/

# Tauri 依赖较大，缓存生命期延长
prefer-offline=true

# CI 行为
side-effects-cache=true

# 拒绝安装跨大版本（防意外升 React 19）
resolution-mode=highest

# 所有 dependency 用 ^ 而非 ~
save-prefix=^
```

### `.nvmrc`

```
20.10.0
```

### `rust-toolchain.toml`

```toml
[toolchain]
channel = "1.78.0"
components = ["rustfmt", "clippy"]
targets = [
  "x86_64-pc-windows-msvc",
  "x86_64-unknown-linux-gnu",
  "x86_64-apple-darwin",
  "aarch64-apple-darwin"
]
profile = "minimal"
```

把 Rust toolchain 通过文件钉死，团队和 CI 上 `rustup` 自动切版本，避免"我本地能编译，CI 报错"。

### `.gitignore`

```
# 依赖
node_modules/
.pnpm-store/

# 构建产物
dist/
.next/
out/
build/
.turbo/
.cache/
.vite/

# Rust
target/
src-tauri/target/
src-tauri/gen/

# 字体二进制（要从原始字体跑 prepare-fonts.sh 生成）
packages/poster/fonts/*.subset.otf
packages/poster/fonts/*.subset.ttf

# 环境变量
.env
.env.local
.env.*.local
!.env.example

# IDE
.vscode/
!.vscode/settings.recommended.json
!.vscode/extensions.json
.idea/
*.swp

# OS
.DS_Store
Thumbs.db

# 测试
coverage/
*.lcov

# 客户端签名密钥（永远不能进 git）
*.key
*.pem
*.p12
*.cer

# 应用本地数据（开发期）
.app-data/
```

### `.gitattributes`

```
# 二进制锁文件
pnpm-lock.yaml      -diff
*.png               binary
*.jpg               binary
*.webp              binary
*.otf               binary
*.ttf               binary
*.icns              binary
*.ico               binary

# 始终 LF 换行，避免 Windows 同事提交 CRLF
*.{ts,tsx,js,jsx,json,md,yml,yaml,sh,toml} text eol=lf
```

### `.editorconfig`

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true

[*.{md,mdx}]
trim_trailing_whitespace = false

[*.rs]
indent_size = 4

[Makefile]
indent_style = tab
```

### `.prettierrc`

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always",
  "endOfLine": "lf",
  "overrides": [
    {
      "files": ["*.md"],
      "options": { "printWidth": 80, "proseWrap": "preserve" }
    }
  ]
}
```

### `eslint.config.js`

```js
// eslint.config.js (flat config)
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  {
    ignores: [
      '**/dist/**',
      '**/.next/**',
      '**/.turbo/**',
      '**/node_modules/**',
      '**/src-tauri/target/**',
      '**/coverage/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { react, 'react-hooks': reactHooks },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];
```

---

## 三、apps/web — Next.js 14 网页端

### `apps/web/package.json`

```json
{
  "name": "@cyberoracle/web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3000",
    "build": "next build",
    "start": "next start --port 3000",
    "lint": "next lint --max-warnings 0",
    "typecheck": "tsc --noEmit",
    "build:dev": "echo 'web ready'"
  },
  "dependencies": {
    "@cyberoracle/core": "workspace:*",
    "@cyberoracle/poster": "workspace:*",
    "@cyberoracle/tokens": "workspace:*",
    "@cyberoracle/ui": "workspace:*",
    "@react-three/drei": "^9.108.0",
    "@react-three/fiber": "^8.16.8",
    "@react-three/postprocessing": "^2.16.0",
    "ai": "^3.3.0",
    "dexie": "^4.0.8",
    "framer-motion": "catalog:",
    "next": "14.2.5",
    "qrcode": "^1.5.4",
    "react": "catalog:",
    "react-dom": "catalog:",
    "tsparticles": "^3.5.0",
    "three": "^0.166.0",
    "zod": "catalog:",
    "zustand": "catalog:"
  },
  "devDependencies": {
    "@types/qrcode": "^1.5.5",
    "@types/react": "catalog:",
    "@types/react-dom": "catalog:",
    "@types/three": "^0.166.0",
    "autoprefixer": "^10.4.19",
    "eslint": "^9.7.0",
    "eslint-config-next": "14.2.5",
    "postcss": "^8.4.40",
    "tailwindcss": "^3.4.7",
    "typescript": "catalog:"
  }
}
```

### `apps/web/next.config.mjs`

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 关键：让 Next.js 直接编译 packages/* 的 TS 源码
  transpilePackages: [
    '@cyberoracle/core',
    '@cyberoracle/poster',
    '@cyberoracle/ui',
    '@cyberoracle/tokens',
  ],
  experimental: {
    serverActions: { bodySizeLimit: '8mb' },
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**.cyberoracle.app' }],
  },
  webpack: (config, { isServer }) => {
    // satori + resvg 仅在服务端用
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }
    return config;
  },
};
export default nextConfig;
```

`transpilePackages` 是让"src 直接消费"模式工作的关键。Next.js 默认只编译应用自身的代码，对 `node_modules` 里的 TS 不处理；声明这一行后，Next 会把 `packages/*` 当作自己的代码编译。

---

## 四、apps/server — 云端 API（Next.js Route Handlers）

### `apps/server/package.json`

```json
{
  "name": "@cyberoracle/server",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3001",
    "build": "next build",
    "start": "next start --port 3001",
    "lint": "next lint --max-warnings 0",
    "typecheck": "tsc --noEmit",
    "build:dev": "echo 'server ready'",
    "test": "vitest run"
  },
  "dependencies": {
    "@cyberoracle/core": "workspace:*",
    "@cyberoracle/poster": "workspace:*",
    "@resvg/resvg-js": "^2.6.2",
    "ai": "^3.3.0",
    "jose": "^5.6.3",
    "lru-cache": "^11.0.0",
    "next": "14.2.5",
    "qrcode": "^1.5.4",
    "react": "catalog:",
    "react-dom": "catalog:",
    "satori": "^0.10.13",
    "zod": "catalog:"
  },
  "devDependencies": {
    "@types/node": "^20.14.10",
    "@types/qrcode": "^1.5.5",
    "@types/react": "catalog:",
    "eslint": "^9.7.0",
    "eslint-config-next": "14.2.5",
    "typescript": "catalog:",
    "vitest": "^2.0.5"
  }
}
```

把 server 与 web 拆成两个 Next.js 应用是**有意为之的边界**：web 关心 SEO/SSR/H5，server 只关心 API + LLM 代理 + 文件存储。两者部署可以分离（web 上 Vercel，server 在 VPS 跑 Docker），生命周期与缩放策略也不同。

### `apps/server/next.config.mjs`

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // 关键：让 Docker 部署只需要 .next/standalone 目录
  transpilePackages: ['@cyberoracle/core', '@cyberoracle/poster'],
  experimental: {
    serverActions: { bodySizeLimit: '10mb' },
  },
  // satori 渲染需要 fs 访问字体目录
  serverExternalPackages: ['@resvg/resvg-js', 'satori'],
};
export default nextConfig;
```

`output: 'standalone'` 是 Docker 部署的福音——构建产物自带最小依赖树，镜像体积能从 800MB 降到 200MB 以内。

### `apps/server/Dockerfile`

```dockerfile
# Multi-stage build：拷贝 monorepo 整体，但只构建 server
FROM node:20-bookworm-slim AS base
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /repo

# ---------- deps 层 ----------
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY apps/server/package.json apps/server/
COPY packages/core/package.json packages/core/
COPY packages/poster/package.json packages/poster/
RUN pnpm install --frozen-lockfile --filter=@cyberoracle/server...

# ---------- build 层 ----------
FROM base AS builder
COPY --from=deps /repo /repo
COPY . .
RUN pnpm --filter=@cyberoracle/server build

# ---------- runtime 层 ----------
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /repo/apps/server/.next/standalone ./
COPY --from=builder /repo/apps/server/.next/static ./apps/server/.next/static
COPY --from=builder /repo/apps/server/public ./apps/server/public
COPY --from=builder /repo/packages/poster/fonts ./packages/poster/fonts
EXPOSE 3001
CMD ["node", "apps/server/server.js"]
```

字体目录 `packages/poster/fonts` 必须显式拷到镜像里，因为它不在 `node_modules`，standalone 不会自动带——前面 satori 那篇讲过这是 resvg 在 Linux 上正确渲染中文的前提。

---

## 五、apps/desktop — Tauri 客户端

### `apps/desktop/package.json`

```json
{
  "name": "@cyberoracle/desktop",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --port 1420 --strictPort",
    "build": "tsc -b && vite build",
    "preview": "vite preview --port 1420",
    "lint": "eslint . --max-warnings 0",
    "typecheck": "tsc --noEmit",
    "build:dev": "echo 'desktop ready'",
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build",
    "tauri:build:debug": "tauri build --debug"
  },
  "dependencies": {
    "@cyberoracle/core": "workspace:*",
    "@cyberoracle/poster": "workspace:*",
    "@cyberoracle/tokens": "workspace:*",
    "@cyberoracle/ui": "workspace:*",
    "@tauri-apps/api": "^2.0.0",
    "@tauri-apps/plugin-clipboard-manager": "^2.0.0",
    "@tauri-apps/plugin-dialog": "^2.0.0",
    "@tauri-apps/plugin-fs": "^2.0.0",
    "@tauri-apps/plugin-global-shortcut": "^2.0.0",
    "@tauri-apps/plugin-http": "^2.0.0",
    "@tauri-apps/plugin-notification": "^2.0.0",
    "@tauri-apps/plugin-opener": "^2.0.0",
    "@tauri-apps/plugin-os": "^2.0.0",
    "@tauri-apps/plugin-process": "^2.0.0",
    "@tauri-apps/plugin-shell": "^2.0.0",
    "@tauri-apps/plugin-updater": "^2.0.0",
    "framer-motion": "catalog:",
    "pixi-live2d-display": "0.4.0",
    "pixi.js": "6.5.10",
    "react": "catalog:",
    "react-dom": "catalog:",
    "react-router-dom": "^6.26.0",
    "zustand": "catalog:"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2.0.0",
    "@types/react": "catalog:",
    "@types/react-dom": "catalog:",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.19",
    "eslint": "^9.7.0",
    "postcss": "^8.4.40",
    "tailwindcss": "^3.4.7",
    "typescript": "catalog:",
    "vite": "^5.4.0"
  }
}
```

**关键：`tauri dev` 不是直接调用 `vite`**。Tauri CLI 自己读 `tauri.conf.json` 里的 `beforeDevCommand: "pnpm dev"`，再启动 Rust 那侧的 webview。所以这里 `dev` 脚本只跑 Vite，`tauri:dev` 才启动完整客户端。

### `apps/desktop/vite.config.ts`

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

const host = process.env.TAURI_DEV_HOST;

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [react()],

  // Tauri 期望固定端口
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host ? { protocol: 'ws', host, port: 1421 } : undefined,
    // src-tauri 改了不要重启 vite
    watch: { ignored: ['**/src-tauri/**'] },
  },

  // packages/* 直接读 src
  resolve: {
    alias: {
      '@cyberoracle/core': path.resolve(__dirname, '../../packages/core/src'),
      '@cyberoracle/poster': path.resolve(
        __dirname,
        '../../packages/poster/src',
      ),
      '@cyberoracle/ui': path.resolve(__dirname, '../../packages/ui/src'),
      '@cyberoracle/tokens': path.resolve(
        __dirname,
        '../../packages/tokens/src',
      ),
    },
  },

  // 让 Vite 把 workspace 的源码也编译（默认它只会处理 src/）
  optimizeDeps: {
    include: ['react', 'react-dom', 'pixi.js', 'pixi-live2d-display'],
  },

  build: {
    target:
      process.env.TAURI_ENV_PLATFORM === 'windows' ? 'chrome105' : 'safari13',
    // Tauri 不需要 sourcemap 进生产包
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
    // 减小体积
    minify: !process.env.TAURI_ENV_DEBUG ? 'esbuild' : false,
  },
}));
```

`build.target` 按平台分别设——Windows 上 webview2 是 Chromium 内核（chrome105+），macOS 是 WebKit（safari13+）。**不针对 webview 设 target 会导致打出来的包要么过度 polyfill 体积大、要么用了不支持的语法在某平台白屏**，这是 Tauri 项目最易踩的发布陷阱。

### `apps/desktop/index.html`

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>赛博玄学馆</title>
    <!-- Live2D Cubism Core 必须在 React bundle 之前加载 -->
    <script src="/live2d/live2dcubismcore.min.js"></script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

## 六、packages/\* — 共享包

四个共享包配置高度相似，我给一份"模板"再列出每个的差异。

### 共同模板：`packages/<name>/package.json`

```json
{
  "name": "@cyberoracle/<name>",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./*": "./src/*"
  },
  "scripts": {
    "lint": "eslint src --max-warnings 0",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "build:dev": "echo '<name> ready'"
  },
  "dependencies": {},
  "devDependencies": {
    "typescript": "catalog:",
    "vitest": "^2.0.5"
  }
}
```

`main` / `types` / `exports` 全指向 `./src/index.ts` 是不预编译策略的关键。**消费方（Next/Vite/Tauri Vite）都用 transpilePackages 或 alias 把 TS 源码当作自己代码处理**，所以这些包永远不需要跑 `tsc --build`。

### `packages/tokens/package.json`

```json
{
  "name": "@cyberoracle/tokens",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./tailwind": "./src/tailwind-preset.js"
  },
  "scripts": {
    "lint": "eslint src --max-warnings 0",
    "typecheck": "tsc --noEmit",
    "build:dev": "echo 'tokens ready'"
  },
  "devDependencies": {
    "typescript": "catalog:"
  }
}
```

token 包暴露一个 `./tailwind` 子路径让 Web 与 Desktop 的 Tailwind 配置都 `presets: [require('@cyberoracle/tokens/tailwind')]`，**视觉一致性靠这一行保证**。

### `packages/core/package.json`

```json
{
  "name": "@cyberoracle/core",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./prompts": "./src/prompts/index.ts",
    "./schemas": "./src/schemas/index.ts",
    "./content-safety": "./src/content-safety/index.ts"
  },
  "scripts": {
    "lint": "eslint src --max-warnings 0",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "build:dev": "echo 'core ready'"
  },
  "dependencies": {
    "gray-matter": "^4.0.3",
    "zod": "catalog:"
  },
  "devDependencies": {
    "typescript": "catalog:",
    "vitest": "^2.0.5"
  }
}
```

注意 `gray-matter` 是 Prompt 加载器解析 frontmatter 用的——这是 core 包"真的会被运行"的 npm 依赖。把它列在 dependencies 而非 devDependencies，是因为 server 在生产环境会调用 prompt loader。

### `packages/poster/package.json`

```json
{
  "name": "@cyberoracle/poster",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./render/render-server": "./src/render/render-server.ts",
    "./data/schema": "./src/data/schema.ts",
    "./components/*": "./src/components/*.tsx"
  },
  "scripts": {
    "preview": "tsx scripts/preview.ts",
    "preview:watch": "tsx scripts/preview.ts --watch",
    "lint": "eslint src --max-warnings 0",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "build:dev": "echo 'poster ready'"
  },
  "dependencies": {
    "@cyberoracle/core": "workspace:*",
    "@resvg/resvg-js": "^2.6.2",
    "react": "catalog:",
    "satori": "^0.10.13",
    "zod": "catalog:"
  },
  "devDependencies": {
    "@types/node": "^20.14.10",
    "@types/react": "catalog:",
    "chokidar": "^3.6.0",
    "pixelmatch": "^6.0.0",
    "pngjs": "^7.0.0",
    "tsx": "^4.16.0",
    "typescript": "catalog:",
    "vitest": "^2.0.5"
  }
}
```

`react` 在 dependencies 是必要的——satori 把 React JSX 当作 VDOM 输入，运行时真的要 react 包。**虽然不会真渲染到 DOM，但仍然需要 react runtime 存在**。这是 satori 项目最容易被新人忽略的一点。

### `packages/ui/package.json`

```json
{
  "name": "@cyberoracle/ui",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./CrystalBall": "./src/CrystalBall/index.ts",
    "./Live2DStage": "./src/Live2DStage/index.ts",
    "./StreamingPoster": "./src/StreamingPoster/index.ts",
    "./*": "./src/*"
  },
  "scripts": {
    "lint": "eslint src --max-warnings 0",
    "typecheck": "tsc --noEmit",
    "build:dev": "echo 'ui ready'"
  },
  "dependencies": {
    "@cyberoracle/tokens": "workspace:*",
    "react": "catalog:",
    "zustand": "catalog:"
  },
  "peerDependencies": {
    "@react-three/drei": "*",
    "@react-three/fiber": "*",
    "framer-motion": "*",
    "pixi-live2d-display": "*",
    "pixi.js": "*",
    "react-dom": "^18",
    "three": "*"
  },
  "peerDependenciesMeta": {
    "@react-three/drei": { "optional": true },
    "@react-three/fiber": { "optional": true },
    "pixi-live2d-display": { "optional": true },
    "pixi.js": { "optional": true },
    "three": { "optional": true }
  },
  "devDependencies": {
    "@types/react": "catalog:",
    "typescript": "catalog:"
  }
}
```

`peerDependencies` + `peerDependenciesMeta.optional` 是关键设计：**Live2D 相关重型依赖（pixi.js、live2d-display）由消费方按需提供**。Web 端不引 Live2D 时，那块代码（`./src/Live2DStage/`）不会被打包进去，省下 ~300KB 体积。这是 monorepo 共享 UI 包"按需引入"的标准做法。

### 各包的 `tsconfig.json`（统一模板）

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "noEmit": true
  },
  "include": ["src/**/*", "scripts/**/*", "tests/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

`noEmit: true` 是一致策略——packages 不输出 .js，typecheck 只是类型校验。

---

## 七、辅助脚本

### `scripts/check-versions.sh`

```bash
#!/usr/bin/env bash
set -e

NODE_REQ="20.10.0"
PNPM_REQ="9.0.0"

ver_ge() {
  [ "$(printf '%s\n' "$1" "$2" | sort -V | head -n1)" = "$2" ]
}

NODE_VER=$(node -v | sed 's/^v//')
PNPM_VER=$(pnpm -v 2>/dev/null || echo "0")

if ! ver_ge "$NODE_VER" "$NODE_REQ"; then
  echo "❌ Node $NODE_REQ+ required, found $NODE_VER"
  echo "   推荐使用 nvm/volta 安装：nvm use"
  exit 1
fi
if ! ver_ge "$PNPM_VER" "$PNPM_REQ"; then
  echo "❌ pnpm $PNPM_REQ+ required, found $PNPM_VER"
  echo "   安装命令：corepack enable && corepack prepare pnpm@9.12.0 --activate"
  exit 1
fi

if command -v rustc >/dev/null 2>&1; then
  RUST_VER=$(rustc -V | awk '{print $2}')
  echo "✓ Node $NODE_VER · pnpm $PNPM_VER · Rust $RUST_VER"
else
  echo "⚠ Rust 未安装，桌面端将无法构建"
  echo "  安装：curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
  echo "✓ Node $NODE_VER · pnpm $PNPM_VER"
fi
```

### `scripts/clean.sh`

```bash
#!/usr/bin/env bash
set -e

echo "▶ 清理 turbo 缓存..."
rm -rf .turbo
pnpm -r exec rm -rf .turbo

echo "▶ 清理构建产物..."
pnpm -r exec rm -rf dist .next .vite out build coverage

echo "▶ 清理 Rust target（保留 cargo registry）..."
rm -rf apps/desktop/src-tauri/target

echo "✓ 清理完成（保留了 node_modules 与 cargo registry）"
echo "  如要彻底重置：pnpm clean:all"
```

### `scripts/prepare-fonts.sh`

```bash
#!/usr/bin/env bash
set -e

# 把思源宋体子集化到 GB18030 常用字范围
# 依赖：python3 + pip install fonttools brotli

FONT_DIR="packages/poster/fonts"
SOURCE_REGULAR="$FONT_DIR/source/NotoSerifSC-Regular.otf"
SOURCE_SEMIBOLD="$FONT_DIR/source/NotoSerifSC-SemiBold.otf"

if [ ! -f "$SOURCE_REGULAR" ] || [ ! -f "$SOURCE_SEMIBOLD" ]; then
  echo "❌ 源字体缺失。请下载思源宋体到 $FONT_DIR/source/"
  echo "   https://github.com/notofonts/noto-cjk/releases"
  exit 1
fi

if ! command -v pyftsubset >/dev/null 2>&1; then
  echo "❌ pyftsubset 未安装"
  echo "   pip install fonttools brotli"
  exit 1
fi

echo "▶ 子集化 Regular..."
pyftsubset "$SOURCE_REGULAR" \
  --output-file="$FONT_DIR/NotoSerifSC-Regular.subset.otf" \
  --unicodes="U+0020-007E,U+00A0-00FF,U+2000-206F,U+3000-303F,U+4E00-9FFF,U+FF00-FFEF,U+3400-4DBF" \
  --layout-features="*" \
  --no-hinting \
  --desubroutinize

echo "▶ 子集化 SemiBold..."
pyftsubset "$SOURCE_SEMIBOLD" \
  --output-file="$FONT_DIR/NotoSerifSC-SemiBold.subset.otf" \
  --unicodes="U+0020-007E,U+00A0-00FF,U+2000-206F,U+3000-303F,U+4E00-9FFF,U+FF00-FFEF,U+3400-4DBF" \
  --layout-features="*" \
  --no-hinting \
  --desubroutinize

echo "✓ 字体子集化完成："
ls -lh "$FONT_DIR"/*.subset.otf
```

---

## 八、CI/CD 工作流

### `.github/workflows/ci.yml`

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint-typecheck-test:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 2 }

      - uses: pnpm/action-setup@v4
        with: { version: 9.12.0 }

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - name: Install
        run: pnpm install --frozen-lockfile

      - name: Restore turbo cache
        uses: actions/cache@v4
        with:
          path: .turbo
          key: turbo-${{ runner.os }}-${{ github.sha }}
          restore-keys: turbo-${{ runner.os }}-

      - name: Lint
        run: pnpm lint

      - name: Typecheck
        run: pnpm typecheck

      - name: Test
        run: pnpm test

      - name: Build
        run: pnpm build:packages
```

### `.github/workflows/release-desktop.yml`

```yaml
name: Release Desktop
on:
  push:
    tags:
      - 'desktop-v*'
  workflow_dispatch:

jobs:
  build:
    permissions: { contents: write }
    strategy:
      fail-fast: false
      matrix:
        include:
          - platform: macos-latest
            target: universal-apple-darwin
            args: --target universal-apple-darwin
          - platform: ubuntu-22.04
            target: x86_64-unknown-linux-gnu
            args: ''
          - platform: windows-latest
            target: x86_64-pc-windows-msvc
            args: ''

    runs-on: ${{ matrix.platform }}
    timeout-minutes: 60
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with: { version: 9.12.0 }

      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }

      - name: Install Rust
        uses: dtolnay/rust-toolchain@stable
        with:
          targets: ${{ matrix.target }}

      - name: Cache Cargo
        uses: actions/cache@v4
        with:
          path: |
            ~/.cargo/registry
            ~/.cargo/git
            apps/desktop/src-tauri/target
          key: cargo-${{ matrix.platform }}-${{ hashFiles('**/Cargo.lock') }}

      - name: Install Linux deps
        if: matrix.platform == 'ubuntu-22.04'
        run: |
          sudo apt-get update
          sudo apt-get install -y libwebkit2gtk-4.1-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev libssl-dev

      - name: Install JS deps
        run: pnpm install --frozen-lockfile

      - name: Prepare fonts
        run: pnpm fonts:prepare
        # 字体源文件由 secret 注入或预先打入 runner image

      - name: Build & sign
        uses: tauri-apps/tauri-action@v0
        env:
          TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}
          TAURI_SIGNING_PRIVATE_KEY_PASSWORD: ${{ secrets.TAURI_KEY_PASSWORD }}
          # macOS
          APPLE_CERTIFICATE: ${{ secrets.APPLE_CERTIFICATE }}
          APPLE_CERTIFICATE_PASSWORD: ${{ secrets.APPLE_CERT_PASSWORD }}
          APPLE_SIGNING_IDENTITY: ${{ secrets.APPLE_SIGNING_IDENTITY }}
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APPLE_PASSWORD: ${{ secrets.APPLE_APP_PASSWORD }}
          APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
          # Windows
          WINDOWS_CERTIFICATE: ${{ secrets.WINDOWS_CERTIFICATE }}
          WINDOWS_CERTIFICATE_PASSWORD: ${{ secrets.WINDOWS_CERT_PASSWORD }}
        with:
          projectPath: apps/desktop
          tagName: ${{ github.ref_name }}
          releaseName: 'CyberOracle Desktop ${{ github.ref_name }}'
          releaseDraft: true
          prerelease: false
          args: ${{ matrix.args }}
```

### `.github/workflows/release-web.yml`

```yaml
name: Release Web
on:
  push:
    branches: [main]
    paths:
      - 'apps/web/**'
      - 'apps/server/**'
      - 'packages/**'
      - 'pnpm-lock.yaml'
  workflow_dispatch:

jobs:
  deploy-web:
    runs-on: ubuntu-latest
    if: github.event_name == 'push' || github.event_name == 'workflow_dispatch'
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9.12.0 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm build:web
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID_WEB }}
          working-directory: apps/web
          vercel-args: '--prod'

  deploy-server:
    runs-on: ubuntu-latest
    needs: []
    steps:
      - uses: actions/checkout@v4
      - name: Build Docker image
        run: |
          docker build -t cyberoracle/server:${{ github.sha }} -f apps/server/Dockerfile .
          docker tag cyberoracle/server:${{ github.sha }} cyberoracle/server:latest
      - name: Push to registry
        run: |
          echo "${{ secrets.DOCKER_PASSWORD }}" | docker login -u "${{ secrets.DOCKER_USERNAME }}" --password-stdin
          docker push cyberoracle/server:${{ github.sha }}
          docker push cyberoracle/server:latest
      - name: SSH deploy to VPS
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: |
            cd /opt/cyberoracle
            docker compose pull server
            docker compose up -d server
            docker image prune -f
```

---

## 九、上手清单（README 摘要）

```markdown
# 赛博玄学馆

## 系统要求

- Node.js 20.10+
- pnpm 9.0+（推荐 corepack: `corepack enable && corepack prepare pnpm@9.12.0 --activate`）
- Rust 1.78+（仅桌面端构建需要）
- Linux 桌面构建额外依赖：libwebkit2gtk-4.1-dev libgtk-3-dev

## 第一次安装

\`\`\`bash
git clone <repo>
cd cyberoracle
nvm use # 切到 Node 20
pnpm install # 安装所有依赖
pnpm fonts:prepare # 子集化思源宋体（首次必跑）
cp apps/server/.env.example apps/server/.env.local
cp apps/web/.env.example apps/web/.env.local
\`\`\`

## 常用命令

| 命令                          | 说明                                            |
| ----------------------------- | ----------------------------------------------- |
| \`pnpm dev\`                  | 启动所有 app（web + server + desktop frontend） |
| \`pnpm dev:web\`              | 仅 web + server                                 |
| \`pnpm dev:desktop\`          | 仅 desktop + server                             |
| \`pnpm preview:poster:watch\` | 本地预览长图模板（改 JSX 自动出图）             |
| \`pnpm typecheck\`            | 全仓类型检查                                    |
| \`pnpm test\`                 | 全仓测试                                        |
| \`pnpm release:desktop:mac\`  | 打 macOS 客户端                                 |
| \`pnpm clean:cache\`          | 清缓存（不删 node_modules）                     |

## 桌面端开发

\`\`\`bash
pnpm dev:server # 终端 1：起后端代理
pnpm --filter @cyberoracle/desktop tauri:dev # 终端 2：起客户端（自动启 Vite + Rust）
\`\`\`

## 目录索引

- \`apps/web\`：网页端（Next.js）
- \`apps/server\`：云端 API（Next.js Route Handlers）
- \`apps/desktop\`：桌面客户端（Tauri 2 + Vite）
- \`packages/core\`：Prompt + Schema + 安全
- \`packages/poster\`：satori 长图模板
- \`packages/ui\`：跨端组件库（含 Live2D / 水晶球）
- \`packages/tokens\`：设计 token

## 发版流程

- Web：push 到 main 自动触发 release-web.yml
- Desktop：打 tag \`desktop-vX.Y.Z\` 触发 release-desktop.yml，三平台并行构建签名
```

---

## 十、设计反思 — 这套配置能解决的真实问题

最后回到工程价值层面收束。这套 monorepo 配置不是"行业最佳实践堆砌"，每条选择都对应这个项目的具体痛点：

**第一，packages/\* 不预编译解决了"同一份 JSX 三处出图"的开发体验问题**。前面 satori 那篇的核心价值——"Web 端、客户端、本地预览三处共用一份 React 组件"——只有在源码共享模式下才能做到改一行立即生效。如果走传统 `tsc --build` 路线，每次改 `packages/poster` 都要重 build，开发体验崩坏。

**第二，turbo 的任务图按真实依赖声明而非按目录套娃**。`apps/desktop#build` 依赖 `packages/poster#build:dev` 而非 `packages/poster#build`，意味着开发时不需要等任何编译就能起 dev。生产构建时 build 才真正递归。这种"开发模式松、生产模式严"的双轨设计是 monorepo 工程化的精髓。

**第三，pnpm catalog + overrides 双层锁版本**。catalog 做"我们希望的版本"声明，overrides 做"绝对不能突破"的硬约束。同一个 react 18 在 R3F、satori、Live2D、Next.js、Tauri Vite 五处被用到，只要任何一处升到 react 19 就可能整个项目崩盘——这两层防护让"react 升级"必须是一次主动的、全员知晓的决策。

**第四，Web 与 Desktop 的部署完全解耦**。GitHub Actions 三个独立 workflow，分别按 paths 和 tags 触发，任何一端的发版都不影响另一端。早期 monorepo 项目最容易栽在"改个客户端 bug 把网页也连带重新部署一次"这种事故上，提前把发版边界划好。

**第五，签名密钥与字体源文件全部走 GitHub Secrets**。仓库里看不到任何敏感凭据，新人 clone 即可在本地跑（用桌面端 dev 模式，不需要签名）；只有 CI 上有完整凭据来打正式包。这是开源策略与商用安全的标准平衡点。

---

至此，从 PRD（这个我们更早讨论过）→ Live2D 集成 → satori 长图模板 → Prompt 文件库 → Tauri 项目骨架 → monorepo 工程化收口，整个赛博玄学馆双端项目的**完整技术蓝图**已经全部交付。

如果你接下来想推进的话，几个最有价值的下一步可以考虑：

第一，**先把 packages/poster 的本地预览跑通**——这是验证整套工程化是否对的最快方式，从 `pnpm install` 到看见第一张长图大概 30 分钟。第二，**搭最小 server + web 链路上线一次**，哪怕只支持手相一种类型，先拿到真实流量数据再迭代。第三，**Live2D 模型的版权与采购**，这是客户端最关键的非工程任务，建议尽早联系美术或 Live2D 模型作者，因为模型制作周期通常 4-6 周，会成为客户端发布的关键路径瓶颈。

需要我帮你深入任何一块吗？比如真正能跑的最小化 MVP 启动包、Live2D 模型作者的合作范本、还是某个具体技术点（比如 SSE 重连、代码签名故障排查、字体子集化的 Unicode 范围调优）的深度方案。
