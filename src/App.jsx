import { useEffect, useState } from 'react';
import { loadProfiles, calcPercent } from './lib/pity.js';
import MeasuringCup from './components/MeasuringCup.jsx';
import UserSwitch from './components/UserSwitch.jsx';

const ORDER = ['userA', 'userB'];

export default function App() {
  const [active, setActive] = useState('userA');
  const [profiles, setProfiles] = useState(null);
  const [configFailed, setConfigFailed] = useState(false);

  useEffect(() => {
    let mounted = true;
    loadProfiles().then(({ profiles: data, failed }) => {
      if (!mounted) return;
      setProfiles(data);
      setConfigFailed(failed);
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (!profiles) {
    return (
      <div className="app">
        <div className="stars" aria-hidden="true" />
        <div className="loading">正在读取配置…</div>
      </div>
    );
  }

  // 轨道宽度为 200%，每个面板占轨道的 50%，偏移按轨道自身宽度计算
  const offset = ORDER.indexOf(active) * -50;

  return (
    <div className="app">
      <div className="stars" aria-hidden="true" />
      <div className="stars stars--far" aria-hidden="true" />

      <header className="app-header">
        <h1>五星角色获取进度</h1>
        <p className="subtitle">纠缠之缘与原石折算 · 满杯即达保底</p>
        {configFailed && (
          <p className="config-warning">配置文件读取失败，当前使用内置兜底数据</p>
        )}
      </header>

      <main className="stage">
        <div className="cups-track" style={{ transform: `translateX(${offset}%)` }}>
          {ORDER.map((key) => {
            const { name, fates, primogems } = profiles[key];
            const percent = calcPercent(fates, primogems);
            const isActive = active === key;
            return (
              <section
                key={key}
                className={`cup-panel${isActive ? ' is-active' : ''}`}
                aria-hidden={!isActive}
              >
                <h2 className="user-name">{name}</h2>
                <MeasuringCup percent={percent} active={isActive} idPrefix={key} />
                <div className="percent">
                  <span className="percent-value">{percent.toFixed(2)}</span>
                  <span className="percent-sign">%</span>
                </div>
                <p className="percent-caption">获取进度</p>
              </section>
            );
          })}
        </div>
      </main>

      <UserSwitch active={active} users={profiles} onChange={setActive} />
    </div>
  );
}
