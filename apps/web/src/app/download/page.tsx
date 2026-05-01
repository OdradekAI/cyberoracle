import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '下载桌面版 — 赛博玄学馆',
  description:
    '赛博玄学馆桌面版 — Live2D 桌面伙伴 · 全局快捷呼出 · 本地加密历史。即将上线 macOS / Windows / Linux。',
};

const PLATFORMS = [
  { name: 'macOS Universal', badge: 'macOS' },
  { name: 'Windows x64', badge: 'Windows' },
  { name: 'Linux AppImage', badge: 'Linux' },
];

const FEATURES = [
  {
    icon: '🐾',
    title: 'Live2D 桌面伙伴',
    desc: '赛博猫娘常驻桌面，随时互动',
  },
  {
    icon: '⚡',
    title: '全局快捷呼出',
    desc: '一键唤起算命面板，无需打开浏览器',
  },
  {
    icon: '🔒',
    title: '本地加密历史',
    desc: '所有解读记录 AES-256 加密存储',
  },
];

export default function DownloadPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0a12',
        color: 'rgba(200, 180, 230, 0.9)',
        fontFamily: 'serif',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '60px 20px',
        maxWidth: 600,
        margin: '0 auto',
      }}
    >
      {/* Hero */}
      <div
        style={{
          width: 160,
          height: 160,
          borderRadius: 24,
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(34, 211, 238, 0.2))',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 64,
          marginBottom: 24,
        }}
      >
        🔮
      </div>

      <h1
        style={{
          fontSize: 28,
          margin: '0 0 8px',
          color: 'rgba(168, 85, 247, 0.9)',
          textAlign: 'center',
        }}
      >
        赛博玄学馆 桌面版
      </h1>
      <p
        style={{
          fontSize: 14,
          color: 'rgba(200, 180, 230, 0.5)',
          margin: '0 0 40px',
          textAlign: 'center',
        }}
      >
        更深度的玄学体验，即将上线
      </p>

      {/* Feature bullets */}
      <div style={{ width: '100%', marginBottom: 40 }}>
        {FEATURES.map((f) => (
          <div
            key={f.title}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 16,
              padding: '16px 0',
              borderBottom: '1px solid rgba(168, 85, 247, 0.1)',
            }}
          >
            <span style={{ fontSize: 28, flexShrink: 0 }}>{f.icon}</span>
            <div>
              <h3
                style={{
                  margin: '0 0 4px',
                  fontSize: 15,
                  color: 'rgba(255, 215, 0, 0.8)',
                }}
              >
                {f.title}
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: 'rgba(200, 180, 230, 0.6)' }}>{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Platform buttons */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {PLATFORMS.map((p) => (
          <div
            key={p.badge}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 20px',
              background: 'rgba(30, 20, 50, 0.6)',
              border: '1px solid rgba(168, 85, 247, 0.2)',
              borderRadius: 8,
              opacity: 0.6,
              cursor: 'not-allowed',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 13, color: 'rgba(200, 180, 230, 0.7)' }}>{p.name}</span>
            </div>
            <span
              style={{
                fontSize: 12,
                padding: '3px 10px',
                background: 'rgba(168, 85, 247, 0.2)',
                borderRadius: 4,
                color: 'rgba(168, 85, 247, 0.7)',
              }}
            >
              即将上线
            </span>
          </div>
        ))}
      </div>

      {/* Back link */}
      <a
        href="/"
        style={{
          marginTop: 40,
          fontSize: 13,
          color: 'rgba(168, 85, 247, 0.5)',
          textDecoration: 'none',
        }}
      >
        返回首页
      </a>
    </div>
  );
}
