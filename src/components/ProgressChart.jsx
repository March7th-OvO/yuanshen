import { useId } from 'react';
import { getRecentProgressHistory } from '../lib/pity.js';

const WIDTH = 760;
const HEIGHT = 280;
const PADDING = { top: 24, right: 22, bottom: 44, left: 54 };

function formatDate(date) {
  const [, month, day] = date.split('-');
  return `${Number(month)}月${Number(day)}日`;
}

function formatChange(change) {
  if (change === null) return '起点';
  return `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
}

export default function ProgressChart({ profile }) {
  const gradientId = useId().replace(/:/g, '');
  const points = getRecentProgressHistory(profile);
  const chartWidth = WIDTH - PADDING.left - PADDING.right;
  const chartHeight = HEIGHT - PADDING.top - PADDING.bottom;
  const highestPercent = Math.max(100, ...points.map((point) => point.percent));
  const yMax = Math.ceil(highestPercent / 20) * 20;
  const getX = (index) => PADDING.left
    + (points.length === 1 ? chartWidth / 2 : (index / (points.length - 1)) * chartWidth);
  const getY = (percent) => PADDING.top + chartHeight - (percent / yMax) * chartHeight;
  const path = points.map((point, index) => (
    `${index === 0 ? 'M' : 'L'} ${getX(index)} ${getY(point.percent)}`
  )).join(' ');
  const areaPath = points.length > 1
    ? `${path} L ${getX(points.length - 1)} ${PADDING.top + chartHeight} L ${getX(0)} ${PADDING.top + chartHeight} Z`
    : '';
  const latest = points.at(-1);
  const change = latest?.changeFromPrevious ?? null;
  const yTicks = Array.from({ length: 6 }, (_, index) => (yMax / 5) * index);

  return (
    <section className="progress-chart" aria-labelledby="progress-chart-title">
      <div className="progress-chart-heading">
        <div>
          <p className="progress-chart-kicker">PROGRESS ARCHIVE</p>
          <h2 id="progress-chart-title">{profile.name} 的进度趋势</h2>
        </div>
        <div className="progress-chart-summary" aria-label="最新进度变化">
          <span>较上次记录</span>
          <strong>{change === null ? '暂无对比' : `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`}</strong>
        </div>
      </div>

      {points.length === 0 ? (
        <p className="progress-chart-empty">请在配置文件中添加历史记录以查看进度变化。</p>
      ) : (
        <div className="progress-chart-canvas">
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            role="img"
            aria-label={`${profile.name} 从${formatDate(points[0].date)}到${formatDate(latest.date)}的进度折线图`}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8fb6d9" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#8fb6d9" stopOpacity="0" />
              </linearGradient>
            </defs>

            {yTicks.map((tick) => {
              const y = getY(tick);
              return (
                <g key={tick}>
                  <line className="chart-grid-line" x1={PADDING.left} x2={WIDTH - PADDING.right} y1={y} y2={y} />
                  <text className="chart-axis-label" x={PADDING.left - 12} y={y + 4} textAnchor="end">
                    {tick}%
                  </text>
                </g>
              );
            })}

            {areaPath && <path d={areaPath} fill={`url(#${gradientId})`} />}
            {points.length > 1 && <path className="chart-line" d={path} />}

            {points.map((point, index) => {
              const { changeFromPrevious } = point;
              const pointY = getY(point.percent);
              // 接近图表顶部时将变化值放到节点下方，避免文字超出绘图区。
              const changeLabelY = pointY < PADDING.top + 28 ? pointY + 22 : pointY - 14;
              const comparisonText = changeFromPrevious === null
                ? '起点'
                : `相较上个节点${formatChange(changeFromPrevious)}`;

              return (
                <g key={`${point.date}-${index}`}>
                  <circle className="chart-point-halo" cx={getX(index)} cy={pointY} r="9" />
                  <circle className="chart-point" cx={getX(index)} cy={pointY} r="4">
                    <title>{`${formatDate(point.date)}：${point.percent.toFixed(2)}%，${comparisonText}（${point.fates} 抽，${point.primogems} 原石）`}</title>
                  </circle>
                  <text
                    className={`chart-delta-label${changeFromPrevious < 0 ? ' is-negative' : ''}${changeFromPrevious === null ? ' is-start' : ''}`}
                    x={getX(index)}
                    y={changeLabelY}
                    textAnchor="middle"
                  >
                    {formatChange(changeFromPrevious)}
                  </text>
                  <text className="chart-date-label" x={getX(index)} y={HEIGHT - 15} textAnchor="middle">
                    {formatDate(point.date)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </section>
  );
}
