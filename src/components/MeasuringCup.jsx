import { useMemo } from 'react';
import { BOOST_THRESHOLD } from '../lib/pity.js';

const WAVE_LENGTH = 140;
const SURFACE_TOP = 62;
const SURFACE_BOTTOM = 236;

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
  };

  const frontWave = useMemo(() => buildWavePath(surfaceY, 4.5), [surfaceY]);
  const backWave = useMemo(() => buildWavePath(surfaceY - 3, 3), [surfaceY]);

  const ticks = [25, 50, 75].map((level) => {
    const y = SURFACE_BOTTOM - (level / 100) * (SURFACE_BOTTOM - SURFACE_TOP);
    const xStart = 68;
    return { level, y, x1: xStart, x2: xStart + 14 };
  });

  const thresholdY =
    SURFACE_BOTTOM - (BOOST_THRESHOLD / 100) * (SURFACE_BOTTOM - SURFACE_TOP);

  return (
    <div className={`cup${active ? ' is-active' : ''}`}>
      <svg viewBox="0 0 280 276" role="img" aria-label={`五星角色获取进度 ${percent.toFixed(2)}%`}>
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
          <clipPath id={ids.clip}>
            <path d="M 222 24 L 36 24 Q 50 35 58 45 L 58 228 Q 58 248 77 248 L 203 248 Q 222 248 222 228 L 222 24 Z" />
          </clipPath>
          <clipPath id={ids.bubbleClip}>
            <rect x="36" y={surfaceY} width="190" height={276 - surfaceY} />
          </clipPath>
        </defs>

        <g clipPath={`url(#${ids.clip})`}>
          <g key={active ? 'filled' : 'empty'} className={active ? 'water water-enter' : 'water'}>
            <path className="wave-back" d={backWave} fill={`url(#${ids.water})`} />
            <path className="wave-front" d={frontWave} fill={`url(#${ids.water})`} />
          </g>
          <g clipPath={`url(#${ids.bubbleClip})`}>
            <circle className="bubble" cx="106" cy="232" r="2.2" fill="rgba(230, 235, 255, 0.34)" />
            <circle className="bubble bubble--b" cx="142" cy="236" r="1.8" fill="rgba(197, 160, 89, 0.34)" />
            <circle className="bubble bubble--c" cx="176" cy="230" r="2.5" fill="rgba(219, 210, 240, 0.3)" />
          </g>
        </g>

        <path
          d="M 220 26 L 38 26 Q 52 36 60 46 L 60 228 Q 60 246 78 246 L 202 246 Q 220 246 220 228 L 220 26"
          fill={`url(#${ids.glass})`}
          stroke="rgba(197, 160, 89, 0.55)"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        <line
          className={`boost-line${clamped >= BOOST_THRESHOLD ? ' is-reached' : ''}`}
          x1="63"
          y1={thresholdY}
          x2="217"
          y2={thresholdY}
          stroke="rgba(232, 200, 126, 0.85)"
          strokeWidth="1.4"
          strokeDasharray="6 6"
          strokeLinecap="butt"
        />

        {ticks.map((t) => (
          <line
            key={t.level}
            x1={t.x1}
            y1={t.y}
            x2={t.x2}
            y2={t.y}
            stroke="rgba(197, 160, 89, 0.32)"
            strokeWidth="1.2"
          />
        ))}
      </svg>
    </div>
  );
}
