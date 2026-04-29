import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PACKAGE_NAME as corePkg } from '@cyberoracle/core';
import { CrystalBall, NeonText } from '@cyberoracle/ui';
import { posterColors } from '@cyberoracle/tokens';

function App() {
  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <h1 style={{ color: posterColors.gold }}>赛博玄学馆 · CyberOracle</h1>
      <p>Desktop companion — coming soon.</p>
      <CrystalBall />
      <NeonText />
      <p style={{ opacity: 0.4, fontSize: '0.75rem', marginTop: '2rem' }}>{corePkg}</p>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
