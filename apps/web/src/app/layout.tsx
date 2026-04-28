import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '赛博玄学馆 · CyberOracle',
  description: 'AI-powered fortune telling — palm reading, face reading, daily fortune',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
