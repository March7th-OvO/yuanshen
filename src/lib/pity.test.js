import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getLatestProgressPoint,
  getRecentProgressHistory,
  parseHistory,
  parseProfiles,
} from './pity.js';

test('历史快照按日期排序并忽略无效记录', () => {
  const history = parseHistory(
    '2026-08-23,5,640; invalid,2,300; 2026-08-02,1,160; 2026-02-30,3,0',
  );

  assert.deepEqual(history, [
    { date: '2026-08-02', fates: 1, primogems: 160 },
    { date: '2026-08-23', fates: 5, primogems: 640 },
  ]);
});

test('两个用户分别解析自己的进度历史', () => {
  const profiles = parseProfiles(`
    userA.history = 2026-08-01,1,0
    userB.history = 2026-08-01,8,0
  `);

  assert.equal(profiles.userA.history[0].fates, 1);
  assert.equal(profiles.userB.history[0].fates, 8);
});

test('首页进度读取日期最新的历史节点', () => {
  const latest = getLatestProgressPoint({
    history: [
      { date: '2026-08-02', fates: 1, primogems: 160 },
      { date: '2026-08-30', fates: 6, primogems: 2039 },
    ],
  });

  assert.deepEqual(latest, {
    date: '2026-08-30',
    fates: 6,
    primogems: 2039,
    percent: 20.83,
  });
});

test('旧版当前进度字段不再覆盖历史节点', () => {
  const profile = parseProfiles(`
    userA.fates = 90
    userA.primogems = 14400
    userA.updatedAt = 2026-08-31
    userA.history = 2026-08-30,6,2039
  `).userA;

  assert.equal('fates' in profile, false);
  assert.equal(getLatestProgressPoint(profile).percent, 20.83);
});

test('折线图仅返回最近七次并保留首个可见节点的历史增量', () => {
  const points = getRecentProgressHistory({
    history: Array.from({ length: 9 }, (_, index) => ({
      date: `2026-08-${String(index + 1).padStart(2, '0')}`,
      fates: index + 1,
      primogems: 0,
    })),
  });

  assert.equal(points.length, 7);
  assert.equal(points[0].date, '2026-08-03');
  assert.equal(points.at(-1).date, '2026-08-09');
  assert.equal(points[0].changeFromPrevious, 1.11);
});
