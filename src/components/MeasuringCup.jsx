import { useMemo } from 'react';

const WAVE_LENGTH = 140;
const SURFACE_TOP = 62;
const SURFACE_BOTTOM = 254;

function buildWavePath(surfaceY, amplitude) {
  let d = `M -360 ${surfaceY}`;
  for (let x = -360; x < 620; x += WAVE_LENGTH) {
    d += ` q 35 ${-amplitude} 70 0 q 35 ${amplitude} 70 0`;
  }
  d += ' L 620 400 L -360 400 Z';
  return d;
}

export default function MeasuringCup({ percent, active, idPrefix }) {
  const clamped = Math.max(0, Math.min(100, percent));
  const surfaceY = SURFACE_BOTTOM - (clamped / 100) * (SURFACE_BOTTOM - SURFACE_TOP);

  const ids = {
    water: `${idPrefix}-water`,
    glass: `${idPrefix}-glass`,
    clip: `${idPrefix}-cup-clip`,
    bubbleClip: `${idPrefix}-bubble-clip`,
    goldGlow: `${idPrefix}-gold-glow`,
  };

  const frontWave = useMemo(() => buildWavePath(surfaceY, 4.5), [surfaceY]);
  const backWave = useMemo(() => buildWavePath(surfaceY - 3, 3), [surfaceY]);

  const ticks = [25, 50, 75, 100].map((level) => {
    const y = SURFACE_BOTTOM - (level / 100) * (SURFACE_BOTTOM - SURFACE_TOP);
    const xStart = 68 + ((y - 50) / 210) * 20 + 6;
    return { level, y, x1: xStart, x2: xStart + (level === 100 ? 16 : 11) };
  });

  return (
    <div className={`cup${active ? ' is-active' : ''}`}>
      <svg viewBox="0 0 260 320" role="img" aria-label={`五星角色获取进度 ${percent.toFixed(2)}%`}>
        <defs>
          <linearGradient id={ids.water} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7587C7" stopOpacity="0.82" />
            <stop offset="48%" stopColor="#4D477D" stopOpacity="0.84" />
            <stop offset="100%" stopColor="#171B2A" stopOpacity="0.96" />
          </linearGradient>
          <linearGradient id={ids.glass} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F4E8D2" stopOpacity="0.055" />
            <stop offset="100%" stopColor="#7A6B58" stopOpacity="0.018" />
          </linearGradient>
          <radialGradient id={ids.goldGlow} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#C5A059" stopOpacity="0.38" />
            <stop offset="100%" stopColor="#C5A059" stopOpacity="0" />
          </radialGradient>
          <clipPath id={ids.clip}>
            <path d="M 72 54 L 188 54 L 169 256 Q 130 264 91 256 Z" />
          </clipPath>
          <clipPath id={ids.bubbleClip}>
            <rect x="60" y={surfaceY} width="140" height={320 - surfaceY} />
          </clipPath>
        </defs>

        <ellipse cx="130" cy="281" rx="68" ry="14" fill={`url(#${ids.goldGlow})`} />
        <ellipse cx="130" cy="282" rx="58" ry="7" fill="rgba(0, 0, 0, 0.48)" />

        <g clipPath={`url(#${ids.clip})`}>
          <g key={active ? 'filled' : 'empty'} className={active ? 'water water-enter' : 'water'}>
            <path className="wave-back" d={backWave} fill={`url(#${ids.water})`} />
            <path className="wave-front" d={frontWave} fill={`url(#${ids.water})`} />
            <ellipse cx="130" cy={surfaceY} rx="54" ry="3" fill="rgba(197, 160, 89, 0.22)" />
          </g>
          <g clipPath={`url(#${ids.bubbleClip})`}>
            <circle className="bubble" cx="110" cy="246" r="2.2" fill="rgba(230, 235, 255, 0.34)" />
            <circle className="bubble bubble--b" cx="134" cy="250" r="1.8" fill="rgba(197, 160, 89, 0.34)" />
            <circle className="bubble bubble--c" cx="152" cy="244" r="2.5" fill="rgba(219, 210, 240, 0.3)" />
          </g>
        </g>

        <path
          d="M 68 50 L 192 50 L 172 260 Q 130 270 88 260 Z"
          fill={`url(#${ids.glass})`}
          stroke="rgba(197, 160, 89, 0.42)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <ellipse
          cx="130"
          cy="50"
          rx="62"
          ry="9"
          fill="rgba(255, 255, 255, 0.018)"
          stroke="rgba(197, 160, 89, 0.58)"
          strokeWidth="1.4"
        />
        <path
          d="M 87 78 C 82 140 88 200 97 236"
          fill="none"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {ticks.map((t) => (
          <line
            key={t.level}
            x1={t.x1}
            y1={t.y}
            x2={t.x2}
            y2={t.y}
            stroke={t.level === 100 ? 'rgba(197, 160, 89, 0.7)' : 'rgba(197, 160, 89, 0.28)'}
            strokeWidth={t.level === 100 ? 1.6 : 1}
          />
        ))}
      </svg>
    </div>
  );
}
