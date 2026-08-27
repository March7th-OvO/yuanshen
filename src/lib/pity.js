// 保底进度核心逻辑：解析配置文件并计算距离保底的百分比

// 一个保底 = 90 抽 × 160 原石 = 14400 原石
export const PITY_COST = 14400;
// 一抽 = 160 原石
export const FATE_COST = 160;
// 达到该百分比后，五星角色出率大幅提升（软保底起点）
export const BOOST_THRESHOLD = 82;

// 配置读取失败时的兜底数据（与 config.properties 保持一致即可）
export const FALLBACK_PROFILES = {
  userA: { name: 'userA', fates: 6, primogems: 400 },
  userB: { name: 'userB', fates: 11, primogems: 0 },
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

/**
 * 解析 properties 文本，仅识别 userA / userB 前缀的键
 * 支持的键：{user}.fates / {user}.primogems / {user}.name
 */
export function parseProfiles(text) {
  const result = {
    userA: { ...FALLBACK_PROFILES.userA },
    userB: { ...FALLBACK_PROFILES.userB },
  };

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || line.startsWith('!')) continue;

    const eq = line.search(/[=:]/);
    if (eq <= 0) continue;

    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim();
    const match = key.match(/^(userA|userB)\.(fates|primogems|name)$/);
    if (!match) continue;

    const [, user, field] = match;
    if (field === 'name') {
      if (value) result[user].name = value;
    } else {
      const num = Number(value);
      if (!Number.isNaN(num) && num >= 0) result[user][field] = num;
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
