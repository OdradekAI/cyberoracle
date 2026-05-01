import type { Metadata } from 'next';

interface SharePageProps {
  params: { id: string };
}

export async function generateMetadata({ params: _params }: SharePageProps): Promise<Metadata> {
  return {
    title: '命运解读 — 赛博玄学馆',
    description: 'AI 算命结果分享页 — 查看完整命运解读，下载桌面版获得更深度的玄学体验。',
    openGraph: {
      title: '我的命运解读 — 赛博玄学馆',
      description: '来看看 AI 怎么解读我的命运吧！',
    },
  };
}

export default function SharePage({ params }: SharePageProps) {
  const id = params.id;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0a12',
        color: 'rgba(200, 180, 230, 0.9)',
        fontFamily: 'serif',
      }}
    >
      {/* Funnel CTA bar */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(34, 211, 238, 0.15))',
          borderBottom: '1px solid rgba(168, 85, 247, 0.3)',
          padding: '12px 20px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 12,
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <span style={{ fontSize: 13, color: 'rgba(200, 180, 230, 0.8)' }}>
          获得更深度的玄学体验
        </span>
        <a
          href="/download"
          style={{
            display: 'inline-block',
            padding: '6px 16px',
            background: 'rgba(168, 85, 247, 0.5)',
            border: '1px solid rgba(168, 85, 247, 0.6)',
            borderRadius: 4,
            color: 'rgba(255, 255, 255, 0.9)',
            textDecoration: 'none',
            fontSize: 13,
            fontWeight: 'bold',
          }}
        >
          下载桌面版
        </a>
      </div>

      {/* Result content loaded client-side */}
      <ShareResultClient id={id} />
    </div>
  );
}

function ShareResultClient({ id }: { id: string }) {
  // This is a server component wrapper — the actual client rendering is done
  // by a small inline script that fetches and displays the result.
  // For MVP we use a simple approach: an iframe to the result page.
  return (
    <iframe
      src={`/result/${id}`}
      title="命运解读"
      style={{
        width: '100%',
        height: 'calc(100vh - 50px)',
        border: 'none',
      }}
    />
  );
}
