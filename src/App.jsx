import { useEffect, useRef, useState } from 'react';
import { loadProfiles, calcPercent, BOOST_THRESHOLD } from './lib/pity.js';
import MeasuringCup from './components/MeasuringCup.jsx';
import UserSwitch from './components/UserSwitch.jsx';

const ORDER = ['userA', 'userB'];
const clamp = (value, minimum, maximum) => Math.min(Math.max(value, minimum), maximum);

const CHARACTER_PREVIEWS = {
  current: [
    {
      alt: '爱德妲角色立绘',
      src: 'https://pub-07b2a608dee146d9b624d2df382fd4c4.r2.dev/AoDaita.png',
    },
    null,
  ],
  upcoming: [
    {
      alt: '薇斯娜角色立绘',
      src: 'https://pub-07b2a608dee146d9b624d2df382fd4c4.r2.dev/WeiSina.png',
    },
    {
      alt: '沃娅妮莎角色立绘',
      src: 'https://pub-07b2a608dee146d9b624d2df382fd4c4.r2.dev/WoYanisha.png',
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
  const [previewTilt, setPreviewTilt] = useState({ x: 0, y: 0, shineX: 50, shineY: 50 });
  const swipeStartRef = useRef(null);
  const previewDragRef = useRef(null);

  const openCharacterPreview = (character) => {
    setExpandedCharacter(character);
    setIsPreviewClosing(false);
    setPreviewTilt({ x: 0, y: 0, shineX: 50, shineY: 50 });
  };

  const closeCharacterPreview = () => {
    setIsPreviewClosing(true);
  };

  const handlePreviewPointerDown = (event) => {
    if (
      !['mouse', 'touch'].includes(event.pointerType)
      || isPreviewClosing
      || window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) return;

    // 将拖动限制为小范围倾斜，既保留立体感也避免遮挡内容。
    event.currentTarget.setPointerCapture(event.pointerId);
    previewDragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
  };

  const handlePreviewPointerMove = (event) => {
    const dragStart = previewDragRef.current;
    if (!dragStart || dragStart.pointerId !== event.pointerId) return;

    // 允许更大的拖动范围，将灵敏度再降为原来的一半并限制在 ±15°。
    event.preventDefault();
    const deltaX = clamp(event.clientX - dragStart.x, -300, 300);
    const deltaY = clamp(event.clientY - dragStart.y, -300, 300);
    setPreviewTilt({
      x: -deltaY / 20,
      y: deltaX / 20,
      shineX: 50 - deltaX * 0.14,
      shineY: 50 - deltaY * 0.14,
    });
  };

  const handlePreviewPointerEnd = (event) => {
    if (previewDragRef.current?.pointerId !== event.pointerId) return;

    previewDragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
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
              <div
                className="image-lightbox-tilt"
                aria-label="按住鼠标或手指拖动可旋转照片"
                style={{
                  '--tilt-x': `${previewTilt.x}deg`,
                  '--tilt-y': `${previewTilt.y}deg`,
                  '--shine-x': `${previewTilt.shineX}%`,
                  '--shine-y': `${previewTilt.shineY}%`,
                }}
                onPointerDown={handlePreviewPointerDown}
                onPointerMove={handlePreviewPointerMove}
                onPointerUp={handlePreviewPointerEnd}
                onPointerCancel={handlePreviewPointerEnd}
              >
                <img className="image-lightbox-image" src={expandedCharacter.src} alt={expandedCharacter.alt} draggable="false" />
                <div className="image-lightbox-sheen" aria-hidden="true" />
                <div className="image-lightbox-back" aria-hidden="true" />
              </div>
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
