// 保底进度核心逻辑：解析配置文件并计算距离保底的百分比

// 一个保底 = 90 抽 × 160 原石 = 14400 原石
export const PITY_COST = 14400;
// 一抽 = 160 原石
export const FATE_COST = 160;
// 达到该百分比后，五星角色出率大幅提升（软保底起点）
export const BOOST_THRESHOLD = 82;
// 折线图仅展示最近的七次记录，完整历史仍保留在配置中。
export const PROGRESS_CHART_LIMIT = 7;

// 配置读取失败时的兜底数据；历史节点是进度的唯一数据源。
export const FALLBACK_PROFILES = {
  userA: {
    name: 'userA',
    history: [{ date: '2026-08-30', fates: 6, primogems: 400 }],
  },
  userB: {
    name: 'userB',
    history: [{ date: '2026-08-30', fates: 11, primogems: 0 }],
  },
};

/**
 * 计算距离保底的百分比
 * @param {number} fates      已消耗纠缠之缘数量
 * @param {number} primogems  剩余原石数量
 * @returns {number} 百分比数值（如 9.78），精确到两位小数
 */
export function calcPercent(fates, primogems) {
  const value = ((fates * FATE_COST + primogems) / PITY_COST) * 100;
  return Math.round(value * 100) / 100;
}

/** 将 YYYY-MM-DD 格式日期解析为本地时间，避免 UTC 转换造成日期偏移。 */
function parseDate(value) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const [, year, month, day] = match.map(Number);
  const date = new Date(year, month - 1, day);
  const isValid = date.getFullYear() === year
    && date.getMonth() === month - 1
    && date.getDate() === day;

  return isValid ? value : null;
}

/**
 * 解析一个用户的历史快照。
 * 格式：YYYY-MM-DD,纠缠之缘,原石；多条记录使用分号分隔。
 */
export function parseHistory(value) {
  return value
    .split(';')
    .map((entry) => {
      const [rawDate, rawFates, rawPrimogems] = entry.split(',').map((part) => part.trim());
      const date = parseDate(rawDate ?? '');
      const fates = Number(rawFates);
      const primogems = Number(rawPrimogems);

      if (!date || !Number.isFinite(fates) || !Number.isFinite(primogems)) return null;
      if (fates < 0 || primogems < 0) return null;

      return { date, fates, primogems };
    })
    .filter(Boolean)
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** 生成按日期排序的进度时间序列，相同日期以较后的记录为准。 */
export function buildProgressHistory(profile) {
  const snapshots = new Map();

  for (const item of profile.history ?? []) {
    snapshots.set(item.date, {
      ...item,
      percent: calcPercent(item.fates, item.primogems),
    });
  }

  return [...snapshots.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/** 获取最新节点，供首页水杯、百分比与图表共同使用。 */
export function getLatestProgressPoint(profile) {
  return buildProgressHistory(profile).at(-1) ?? null;
}

/** 获取最近的进度节点，并保留每个节点相较完整历史上一节点的变化值。 */
export function getRecentProgressHistory(profile, limit = PROGRESS_CHART_LIMIT) {
  const history = buildProgressHistory(profile).map((point, index, allPoints) => ({
    ...point,
    changeFromPrevious: index === 0
      ? null
      : Math.round((point.percent - allPoints[index - 1].percent) * 100) / 100,
  }));

  return history.slice(-limit);
}

/**
 * 解析 properties 文本，仅识别 userA / userB 前缀的键
 * 支持的键：{user}.name / {user}.history
 */
export function parseProfiles(text) {
  const result = {
    userA: { ...FALLBACK_PROFILES.userA, history: [...FALLBACK_PROFILES.userA.history] },
    userB: { ...FALLBACK_PROFILES.userB, history: [...FALLBACK_PROFILES.userB.history] },
  };

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || line.startsWith('!')) continue;

    const eq = line.search(/[=:]/);
    if (eq <= 0) continue;

    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim();
    const match = key.match(/^(userA|userB)\.(name|history)$/);
    if (!match) continue;

    const [, user, field] = match;
    if (field === 'name') {
      if (value) result[user].name = value;
    } else {
      result[user].history = parseHistory(value);
    }
  }

  return result;
}

/** 拉取并解析配置文件，失败时返回兜底数据 */
export async function loadProfiles() {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}config.properties`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { profiles: parseProfiles(await res.text()), failed: false };
  } catch {
    return { profiles: FALLBACK_PROFILES, failed: true };
  }
}
