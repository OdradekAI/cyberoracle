'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getHistoryEntries, clearHistory, type HistoryEntry } from '../../lib/history-db';

const TYPE_ICONS: Record<string, string> = {
  palm: '✋',
  face: '👤',
};

export default function HistoryPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getHistoryEntries().then((data) => {
      setEntries(data);
      setLoaded(true);
    });
  }, []);

  function handleItemClick(id: string) {
    router.push(`/result/${id}`);
  }

  async function handleClear() {
    await clearHistory();
    setEntries([]);
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0a12',
        color: 'rgba(200, 180, 230, 0.9)',
        fontFamily: 'serif',
        padding: '40px 20px',
        maxWidth: 600,
        margin: '0 auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 32,
        }}
      >
        <h1 style={{ fontSize: 24, margin: 0, color: 'rgba(168, 85, 247, 0.9)' }}>解读记录</h1>
        <Link
          href="/"
          style={{ fontSize: 13, color: 'rgba(168, 85, 247, 0.7)', textDecoration: 'none' }}
        >
          返回首页
        </Link>
      </div>

      {!loaded && (
        <p style={{ textAlign: 'center', color: 'rgba(200, 180, 230, 0.5)' }}>加载中...</p>
      )}

      {loaded && entries.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <p style={{ fontSize: 16, marginBottom: 16, color: 'rgba(200, 180, 230, 0.6)' }}>
            还没有解读记录
          </p>
          <Link
            href="/"
            style={{
              display: 'inline-block',
              padding: '10px 24px',
              background: 'rgba(168, 85, 247, 0.3)',
              border: '1px solid rgba(168, 85, 247, 0.5)',
              borderRadius: 6,
              color: 'rgba(200, 180, 230, 0.9)',
              textDecoration: 'none',
              fontSize: 14,
            }}
          >
            开始第一次解读
          </Link>
        </div>
      )}

      {loaded && entries.length > 0 && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {entries.map((entry) => (
              <button
                key={entry.id}
                onClick={() => handleItemClick(entry.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: 'rgba(30, 20, 50, 0.6)',
                  border: '1px solid rgba(168, 85, 247, 0.2)',
                  borderRadius: 8,
                  padding: 16,
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  color: 'inherit',
                  fontFamily: 'inherit',
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 6,
                    background: 'rgba(168, 85, 247, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                    flexShrink: 0,
                    overflow: 'hidden',
                  }}
                >
                  {TYPE_ICONS[entry.type] ?? '🔮'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}
                  >
                    <span style={{ fontSize: 13, color: 'rgba(200, 180, 230, 0.5)' }}>
                      {entry.type === 'palm' ? '手相' : '面相'}
                    </span>
                    <span style={{ fontSize: 12, color: 'rgba(200, 180, 230, 0.4)' }}>
                      {entry.date}
                    </span>
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 14,
                      lineHeight: 1.5,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {entry.summary || '解读结果'}
                  </p>
                </div>
              </button>
            ))}
          </div>

          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <button
              onClick={handleClear}
              style={{
                padding: '8px 16px',
                background: 'transparent',
                border: '1px solid rgba(220, 50, 50, 0.3)',
                borderRadius: 6,
                color: 'rgba(220, 100, 100, 0.7)',
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              清空记录
            </button>
          </div>
        </>
      )}
    </div>
  );
}
