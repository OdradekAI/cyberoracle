import { colors } from '../tokens';

interface PalmDiagramProps {
  width?: number;
  height?: number;
}

export function PalmDiagram({ width = 280, height = 360 }: PalmDiagramProps) {
  return (
    <svg width={width} height={height} viewBox="0 0 280 360" fill="none">
      <path
        d="M70 340 L60 220 Q55 180 65 150 L70 80 Q72 60 90 60 Q105 60 108 80 L112 130 L120 50 Q122 30 138 30 Q154 30 156 50 L158 130 L168 60 Q170 42 186 42 Q202 42 204 60 L204 140 L218 90 Q222 75 234 78 Q246 82 244 100 L230 200 Q220 260 200 320 L180 350 Z"
        stroke={colors.ink}
        strokeWidth={1.6}
        fill="none"
        strokeLinejoin="round"
      />
      <path
        d="M80 180 Q140 150 200 180"
        stroke={colors.ink}
        strokeWidth={1.4}
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M75 220 Q140 210 215 240"
        stroke={colors.ink}
        strokeWidth={1.4}
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M95 175 Q70 230 100 305"
        stroke={colors.ink}
        strokeWidth={1.4}
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M150 320 Q148 260 152 200"
        stroke={colors.inkMuted}
        strokeWidth={1}
        strokeDasharray="3 4"
        fill="none"
      />
      <line x1={205} y1={178} x2={250} y2={170} stroke={colors.gold} strokeWidth={1} />
      <circle cx={252} cy={170} r={3} fill={colors.gold} />
      <line x1={215} y1={238} x2={250} y2={234} stroke={colors.gold} strokeWidth={1} />
      <circle cx={252} cy={234} r={3} fill={colors.gold} />
      <line x1={108} y1={300} x2={250} y2={290} stroke={colors.gold} strokeWidth={1} />
      <circle cx={252} cy={290} r={3} fill={colors.gold} />
      <line x1={154} y1={262} x2={250} y2={258} stroke={colors.gold} strokeWidth={1} />
      <circle cx={252} cy={258} r={3} fill={colors.gold} />
    </svg>
  );
}
