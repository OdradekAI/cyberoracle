'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { addHistoryEntry } from '../../../lib/history-db';

interface SSEEvent {
  step: string;
  status: string;
  data: unknown;
  error?: string;
}

interface ResultSection {
  title: string;
  content: string;
}

const PHASE_LABELS: Record<string, string> = {
  vlm_observe: '观察中...',
  llm_interpret: '解读中...',
  complete: '完成',
};

const STUB_SECTIONS: ResultSection[] = [
  {
    title: '总览',
    content:
      '你的人生正处于一个关键的转折点。星辰指引着一条充满机遇的道路，但需要你保持警觉与智慧。',
  },
  {
    title: '事业运',
    content: '近期工作中将出现新的合作机会。建议保持开放态度，但也要谨慎评估风险。贵人方位在东南。',
  },
  {
    title: '感情运',
    content: '内心深处的渴望正在被唤醒。缘分就在身边，但需要你主动表达真实感受。月中是关键时期。',
  },
  {
    title: '财运',
    content: '偏财运上升，但正财需要更多耐心。避免冲动消费，月中之后会有转机。投资宜守不宜攻。',
  },
];

export default function ResultPage() {
  const params = useParams();
  const id = params.id as string;
  const searchParams = useSearchParams();
  const readingType = (searchParams.get('kind') ?? 'palm') as 'palm' | 'face';
  const savedRef = useRef(false);
  const [phase, setPhase] = useState('loading');
  const [progress, setProgress] = useState(0);
  const [partialText, setPartialText] = useState('');
  const [sections, setSections] = useState<ResultSection[]>([]);
  const [resultData, setResultData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // For MVP: if no real upload exists, show stub result after simulated loading
    const timer = setTimeout(() => {
      simulateResult();
    }, 100);

    // Try SSE first
    try {
      const es = new EventSource(`/api/analyze?id=${encodeURIComponent(id)}`);
      esRef.current = es;

      es.onmessage = (e) => {
        try {
          const event: SSEEvent = JSON.parse(e.data);
          handleEvent(event);
        } catch {
          // Ignore parse errors
        }
      };

      es.onerror = () => {
        es.close();
        // SSE failed — stub result already triggered by timeout
      };
    } catch {
      // EventSource not supported — stub handles it
    }

    return () => {
      clearTimeout(timer);
      if (esRef.current) esRef.current.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function saveToHistory(summary: string) {
    if (savedRef.current) return;
    savedRef.current = true;
    addHistoryEntry({
      id,
      type: readingType,
      date: new Date().toLocaleDateString('zh-CN'),
      summary: summary.slice(0, 100),
    });
  }

  function handleEvent(event: SSEEvent) {
    if (event.error) {
      setError(event.error);
      return;
    }

    setPhase(event.step);

    if (event.step === 'vlm_observe') {
      setProgress(20);
    } else if (event.step === 'llm_interpret') {
      setProgress(50);
      if (
        event.data &&
        typeof event.data === 'object' &&
        'partial' in (event.data as Record<string, unknown>)
      ) {
        setPartialText((prev) => prev + ((event.data as { partial: string }).partial ?? ''));
      }
    } else if (event.step === 'complete' && event.status === 'done') {
      setProgress(100);
      setResultData(event.data as Record<string, unknown>);
      buildSections(event.data);
      saveToHistory(extractSummary(event.data));
    }
  }

  function extractSummary(data: unknown): string {
    if (!data || typeof data !== 'object') return '';
    const d = data as Record<string, unknown>;
    if (d.overview && typeof d.overview === 'object') {
      const ov = d.overview as Record<string, unknown>;
      if (typeof ov.body === 'string') return ov.body;
    }
    if (typeof d.summary === 'string') return d.summary;
    return '';
  }

  function simulateResult() {
    // Simulate loading phases for demo / no-upload case
    setPhase('vlm_observe');
    setProgress(20);

    setTimeout(() => {
      setPhase('llm_interpret');
      setProgress(50);
      setPartialText('正在分析命理数据...');
    }, 800);

    setTimeout(() => {
      setProgress(80);
      setPartialText('正在解读卦象...');
    }, 2000);

    setTimeout(() => {
      setPhase('complete');
      setProgress(100);
      setSections(STUB_SECTIONS);
      setResultData({ status: 'accepted' });
      saveToHistory(STUB_SECTIONS[0]?.content ?? '');
    }, 3500);
  }

  function buildSections(data: unknown) {
    if (!data || typeof data !== 'object') {
      setSections(STUB_SECTIONS);
      return;
    }

    const d = data as Record<string, unknown>;
    const built: ResultSection[] = [];

    if (d.overview) built.push({ title: '总览', content: String(d.overview) });
    if (d.mainLines) {
      const lines = Array.isArray(d.mainLines) ? d.mainLines : [];
      for (const line of lines) {
        const l = line as Record<string, unknown>;
        if (l.label && l.content) {
          built.push({ title: String(l.label), content: String(l.content) });
        }
      }
    }
    if (d.summary) built.push({ title: '总结', content: String(d.summary) });

    if (built.length === 0) {
      setSections(STUB_SECTIONS);
    } else {
      setSections(built);
    }
  }

  const isLoading = phase !== 'complete';

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
        padding: '40px 20px',
      }}
    >
      <h1 style={{ fontSize: 24, marginBottom: 8, color: 'rgba(168, 85, 247, 0.9)' }}>命运解读</h1>
      <p style={{ fontSize: 13, color: 'rgba(200, 180, 230, 0.5)', marginBottom: 32 }}>ID: {id}</p>

      {error && (
        <div
          style={{
            background: 'rgba(220, 50, 50, 0.15)',
            border: '1px solid rgba(220, 50, 50, 0.4)',
            borderRadius: 8,
            padding: 16,
            marginBottom: 24,
            maxWidth: 500,
            textAlign: 'center',
          }}
        >
          {error}
        </div>
      )}

      {/* Progress bar */}
      <div
        style={{
          width: '100%',
          maxWidth: 500,
          height: 4,
          background: 'rgba(168, 85, 247, 0.15)',
          borderRadius: 2,
          marginBottom: 16,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: '100%',
            background: 'rgba(168, 85, 247, 0.7)',
            borderRadius: 2,
            transition: 'width 0.5s ease-out',
          }}
        />
      </div>

      {/* Phase label */}
      <p style={{ fontSize: 14, marginBottom: 24, color: 'rgba(168, 85, 247, 0.7)' }}>
        {PHASE_LABELS[phase] ?? '处理中...'}
      </p>

      {/* Partial text during streaming */}
      {isLoading && partialText && (
        <div
          style={{
            maxWidth: 500,
            width: '100%',
            background: 'rgba(168, 85, 247, 0.08)',
            border: '1px solid rgba(168, 85, 247, 0.2)',
            borderRadius: 8,
            padding: 16,
            marginBottom: 24,
            fontSize: 13,
            minHeight: 60,
          }}
        >
          {partialText}
        </div>
      )}

      {/* Result sections */}
      {sections.map((section, i) => (
        <div
          key={i}
          style={{
            maxWidth: 500,
            width: '100%',
            background: 'rgba(30, 20, 50, 0.6)',
            border: '1px solid rgba(168, 85, 247, 0.2)',
            borderRadius: 8,
            padding: 16,
            marginBottom: 12,
            opacity: isLoading ? 0.3 : 1,
            transition: 'opacity 0.5s ease-out',
          }}
        >
          <h3
            style={{
              margin: '0 0 8px',
              fontSize: 15,
              color: 'rgba(255, 215, 0, 0.8)',
            }}
          >
            {section.title}
          </h3>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>{section.content}</p>
        </div>
      ))}

      {/* Poster preview */}
      {!isLoading && resultData !== null && (
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <div
            style={{
              maxWidth: 400,
              margin: '0 auto 16px',
              background: 'rgba(30, 20, 50, 0.4)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              borderRadius: 8,
              padding: 16,
              minHeight: 120,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/result/${id}/image`}
              alt="命运长图"
              style={{ maxWidth: '100%', borderRadius: 4 }}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageLoaded(false)}
            />
            {!imageLoaded && (
              <p style={{ fontSize: 13, color: 'rgba(200, 180, 230, 0.4)' }}>
                长图预览（需 M3 API 接入后生成）
              </p>
            )}
          </div>

          {/* Export button */}
          <a
            href={`/api/result/${id}/image`}
            download={`fortune-${id}.png`}
            style={{
              display: 'inline-block',
              padding: '10px 24px',
              background: 'rgba(168, 85, 247, 0.3)',
              border: '1px solid rgba(168, 85, 247, 0.5)',
              borderRadius: 6,
              color: 'rgba(200, 180, 230, 0.9)',
              textDecoration: 'none',
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            导出长图
          </a>
        </div>
      )}
    </div>
  );
}
