import { useMemo } from 'react';

// 波形周期宽度（px），水平循环位移的基准
const WAVE_LENGTH = 140;
// 杯体几何：杯口 y=50，杯底 y=260；水面活动范围 62（100%）~ 254（0%）
const SURFACE_TOP = 62;
const SURFACE_BOTTOM = 254;

/** 生成一条正弦近似的波浪路径，向下闭合用于填充水体 */
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

  const frontWave = useMemo(() => buildWavePath(surfaceY, 5), [surfaceY]);
  const backWave = useMemo(() => buildWavePath(surfaceY - 3, 3.5), [surfaceY]);

  // 刻度线：25% / 50% / 75% / 100%，贴左侧杯壁
  const ticks = [25, 50, 75, 100].map((level) => {
    const y = SURFACE_BOTTOM - (level / 100) * (SURFACE_BOTTOM - SURFACE_TOP);
    const xStart = 68 + ((y - 50) / 210) * 20 + 6;
    return { level, y, x1: xStart, x2: xStart + (level === 100 ? 16 : 11) };
  });

  return (
    <div className={`cup${active ? ' is-active' : ''}`}>
      <svg viewBox="0 0 260 320" role="img" aria-label={`保底进度 ${percent.toFixed(2)}%`}>
        <defs>
          <linearGradient id={ids.water} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8ee9ff" stopOpacity="0.95" />
            <stop offset="55%" stopColor="#3fb6ec" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#2a55c9" stopOpacity="0.92" />
          </linearGradient>
          <linearGradient id={ids.glass} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#aacdff" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#aacdff" stopOpacity="0.04" />
          </linearGradient>
          <clipPath id={ids.clip}>
            <path d="M 72 54 L 188 54 L 169 256 Q 130 264 91 256 Z" />
          </clipPath>
          <clipPath id={ids.bubbleClip}>
            <rect x="60" y={surfaceY} width="140" height={320 - surfaceY} />
          </clipPath>
        </defs>

        {/* 底座投影 */}
        <ellipse cx="130" cy="282" rx="62" ry="9" fill="rgba(0, 0, 0, 0.4)" />

        {/* 水体：两层波浪 + 水面高光 + 气泡，整体裁剪进杯内 */}
        <g clipPath={`url(#${ids.clip})`}>
          <g key={active ? 'filled' : 'empty'} className={active ? 'water water-enter' : 'water'}>
            <path className="wave-back" d={backWave} fill={`url(#${ids.water})`} />
            <path className="wave-front" d={frontWave} fill={`url(#${ids.water})`} />
            <ellipse cx="130" cy={surfaceY} rx="54" ry="3.4" fill="rgba(225, 250, 255, 0.45)" />
          </g>
          <g clipPath={`url(#${ids.bubbleClip})`}>
            <circle className="bubble" cx="110" cy="246" r="2.6" fill="rgba(255, 255, 255, 0.55)" />
            <circle className="bubble bubble--b" cx="134" cy="250" r="2" fill="rgba(255, 255, 255, 0.5)" />
            <circle className="bubble bubble--c" cx="152" cy="244" r="2.9" fill="rgba(255, 255, 255, 0.45)" />
          </g>
        </g>

        {/* 杯体玻璃 */}
        <path
          d="M 68 50 L 192 50 L 172 260 Q 130 270 88 260 Z"
          fill={`url(#${ids.glass})`}
          stroke="rgba(180, 212, 255, 0.55)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* 杯口 */}
        <ellipse
          cx="130" cy="50" rx="62" ry="9"
          fill="rgba(150, 190, 255, 0.06)"
          stroke="rgba(200, 225, 255, 0.75)"
          strokeWidth="2"
        />
        {/* 玻璃高光 */}
        <path
          d="M 87 78 C 82 140 88 200 97 236"
          fill="none"
          stroke="rgba(255, 255, 255, 0.16)"
          strokeWidth="5"
          strokeLinecap="round"
        />
        {/* 刻度 */}
        {ticks.map((t) => (
          <line
            key={t.level}
            x1={t.x1} y1={t.y} x2={t.x2} y2={t.y}
            stroke="rgba(190, 215, 255, 0.3)"
            strokeWidth={t.level === 100 ? 2 : 1.4}
          />
        ))}
      </svg>
    </div>
  );
}
