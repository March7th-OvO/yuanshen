import { useEffect, useRef, useState } from 'react';
import { loadProfiles, calcPercent, BOOST_THRESHOLD } from './lib/pity.js';
import MeasuringCup from './components/MeasuringCup.jsx';
import UserSwitch from './components/UserSwitch.jsx';
import CharacterPreview3D from './components/CharacterPreview3D.jsx';

const ORDER = ['userA', 'userB'];

const CHARACTER_PREVIEWS = {
  current: [
    {
      alt: '爱德妲角色立绘',
      src: 'https://assets.yuanshenniubi.com/AoDaita.png',
    },
    null,
  ],
  upcoming: [
    {
      alt: '薇斯娜角色立绘',
      src: 'https://assets.yuanshenniubi.com/WeiSina.png',
    },
    {
      alt: '沃娅妮莎角色立绘',
      src: 'https://assets.yuanshenniubi.com/WoYanisha.png',
    },
  ],
};

function CharacterPreviewSlots({ characters, onPreviewClick }) {
  return (
    <div className="character-preview-slots" aria-label="角色立绘预览">
      {characters.map((character, index) => (
        character ? (
          <button
            className="character-preview"
            key={character.src}
            type="button"
            aria-label={`查看${character.alt}原图`}
            onClick={() => onPreviewClick(character)}
          >
            <img src={character.src} alt={character.alt} />
          </button>
        ) : (
          <div className="character-preview" key={`empty-${index}`}>
            <span className="character-preview-empty" aria-label="暂无角色立绘">×</span>
          </div>
        )
      ))}
    </div>
  );
}

export default function App() {
  const [active, setActive] = useState('userA');
  const [profiles, setProfiles] = useState(null);
  const [configFailed, setConfigFailed] = useState(false);
  const [expandedCharacter, setExpandedCharacter] = useState(null);
  const [isPreviewClosing, setIsPreviewClosing] = useState(false);
  const swipeStartRef = useRef(null);

  const openCharacterPreview = (character) => {
    setExpandedCharacter(character);
    setIsPreviewClosing(false);
  };

  const closeCharacterPreview = () => {
    setIsPreviewClosing(true);
  };

  const changeUserBySwipe = (direction) => {
    const currentIndex = ORDER.indexOf(active);
    const nextIndex = Math.min(Math.max(currentIndex + direction, 0), ORDER.length - 1);

    if (nextIndex !== currentIndex) {
      setActive(ORDER[nextIndex]);
    }
  };

  const handlePointerDown = (event) => {
    // 仅在移动端处理触摸输入，桌面端仍保持原有的点击交互。
    if (event.pointerType !== 'touch' || !window.matchMedia('(max-width: 820px)').matches) return;

    swipeStartRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };
  };

  const handlePointerEnd = (event) => {
    const swipeStart = swipeStartRef.current;
    swipeStartRef.current = null;

    if (!swipeStart || swipeStart.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - swipeStart.x;
    const deltaY = event.clientY - swipeStart.y;
    const isHorizontalSwipe = Math.abs(deltaX) >= 48 && Math.abs(deltaX) > Math.abs(deltaY);

    if (isHorizontalSwipe) {
      changeUserBySwipe(deltaX < 0 ? 1 : -1);
    }
  };

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

  useEffect(() => {
    if (!expandedCharacter) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') closeCharacterPreview();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [expandedCharacter]);

  useEffect(() => {
    if (!isPreviewClosing) return undefined;

    // 降低动态效果时立即关闭，避免等待被禁用的动画结束。
    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1000;
    const timerId = window.setTimeout(() => {
      setExpandedCharacter(null);
      setIsPreviewClosing(false);
    }, duration);

    return () => window.clearTimeout(timerId);
  }, [isPreviewClosing]);

  if (!profiles) {
    return (
      <div className="app">
        <div className="ambient ambient--violet" aria-hidden="true" />
        <div className="ambient ambient--blue" aria-hidden="true" />
        <div className="stars" aria-hidden="true" />
        <div className="loading">正在读取配置…</div>
      </div>
    );
  }

  const offset = ORDER.indexOf(active) * -50;

  return (
    <div className="app">
      <div className="editorial-grid" aria-hidden="true" />
      <div className="ambient ambient--violet" aria-hidden="true" />
      <div className="ambient ambient--blue" aria-hidden="true" />
      <div className="stars" aria-hidden="true" />
      <div className="stars stars--far" aria-hidden="true" />

      <div className="editorial-shell">
        <header className="app-header">
          <div className="header-rule" aria-hidden="true" />
          <h1>五星角色获取进度</h1>
          <p className="subtitle">纠缠之缘与原石折算 · 满杯即达保底</p>
          {configFailed && (
            <p className="config-warning">配置文件读取失败，当前使用内置兜底数据</p>
          )}
        </header>

        <main
          className="stage"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerEnd}
          onPointerCancel={() => {
            swipeStartRef.current = null;
          }}
        >
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
                  <div className="profile-frame">
                    <div className="profile-heading">
                      <h2 className="user-name">{name}</h2>
                    </div>

                    <div className="visual-column">
                      <MeasuringCup percent={percent} active={isActive} idPrefix={key} />
                    </div>

                    <div className="metric-column">
                      <div className="metric-rule" aria-hidden="true" />
                      <div className={`percent${percent >= BOOST_THRESHOLD ? ' is-boost' : ''}`}>
                        <span className="percent-value">{percent.toFixed(2)}</span>
                        <span className="percent-sign">%</span>
                      </div>
                      <p className="percent-caption">获取进度</p>
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        </main>

        <aside className="character-showcase" aria-label="角色立绘预览">
          <section className="character-note character-note--left">
            <p className="stage-note-title">
              当期UP<span className="underlined">限定</span>
              <span className="five-star">五星</span>
            </p>
            <p className="stage-note-sub">8月12日-9月1日</p>
            <CharacterPreviewSlots
              characters={CHARACTER_PREVIEWS.current}
              onPreviewClick={openCharacterPreview}
            />
          </section>
          <section className="character-note character-note--right">
            <p className="stage-note-title">敬请期待新角色</p>
            <p className="stage-note-sub">9月23日</p>
            <CharacterPreviewSlots
              characters={CHARACTER_PREVIEWS.upcoming}
              onPreviewClick={openCharacterPreview}
            />
          </section>
        </aside>

        <UserSwitch active={active} users={profiles} onChange={setActive} />
      </div>

      {expandedCharacter && (
        <div
          className={`image-lightbox${isPreviewClosing ? ' is-closing' : ''}`}
          onClick={closeCharacterPreview}
        >
          <div
            className="image-lightbox-content"
            role="dialog"
            aria-modal="true"
            aria-label={`${expandedCharacter.alt}原图预览`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="image-lightbox-card">
              <CharacterPreview3D character={expandedCharacter} isClosing={isPreviewClosing} />
            </div>
            <button
              className="image-lightbox-close"
              type="button"
              aria-label="关闭原图预览"
              onClick={closeCharacterPreview}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
