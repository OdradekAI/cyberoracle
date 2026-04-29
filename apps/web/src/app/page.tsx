import { PACKAGE_NAME as corePkg } from '@cyberoracle/core';
import { PACKAGE_NAME as posterPkg } from '@cyberoracle/poster';
import { PACKAGE_NAME as uiPkg, CrystalBall } from '@cyberoracle/ui';
import { posterColors, semanticColors } from '@cyberoracle/tokens';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-4xl font-bold">赛博玄学馆 · CyberOracle</h1>
      <p className="text-lg opacity-80">Coming soon.</p>
      <CrystalBall />
      <footer className="mt-12 text-xs opacity-40">
        {corePkg} · {posterPkg} · {uiPkg} · gold {posterColors.gold} · primary{' '}
        {semanticColors.primary}
      </footer>
    </main>
  );
}
