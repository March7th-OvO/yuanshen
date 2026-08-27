import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import CharacterCard3D from './CharacterCard3D.jsx';

const MAX_ROTATION_X = THREE.MathUtils.degToRad(15);
const clamp = (value, minimum, maximum) => Math.min(Math.max(value, minimum), maximum);

/** Lightbox 内专用的 WebGL 预览；页面其他区域保持为普通 React DOM。 */
export default function CharacterPreview3D({ character, isClosing }) {
  const targetRotation = useRef({ x: 0, y: 0 });
  const dragRef = useRef(null);
  const isDragging = useRef(false);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => {
      setReducedMotion(mediaQuery.matches);
    };
    updatePreference();
    mediaQuery.addEventListener('change', updatePreference);
    return () => mediaQuery.removeEventListener('change', updatePreference);
  }, []);

  const handlePointerDown = (event) => {
    if (isClosing || !['mouse', 'touch', 'pen'].includes(event.pointerType)) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    isDragging.current = true;
    dragRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      rotationX: targetRotation.current.x,
      rotationY: targetRotation.current.y,
    };
  };

  const handlePointerMove = (event) => {
    const dragStart = dragRef.current;
    if (!dragStart || dragStart.pointerId !== event.pointerId) return;

    // 仅更新 ref，动画帧再对 mesh 阻尼插值，避免拖动时触发 React 重渲染。
    const deltaX = event.clientX - dragStart.x;
    const deltaY = event.clientY - dragStart.y;
    // 垂直控制采用反向映射，拖动方向与此前的上下旋转结果相反。
    targetRotation.current.x = clamp(dragStart.rotationX + deltaY * 0.006, -MAX_ROTATION_X, MAX_ROTATION_X);
    // 水平方向持续累积，支持完整翻转；垂直方向仍限幅，避免卡片翻到难以控制的角度。
    targetRotation.current.y = dragStart.rotationY + deltaX * 0.006;
  };

  const handlePointerEnd = (event) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    isDragging.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div
      className="character-preview-3d"
      aria-label="按住鼠标或手指拖动可旋转照片"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
    >
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, 5], fov: 35 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace;
        }}
      >
        <ambientLight intensity={1.25} />
        <directionalLight position={[3.5, 4, 4]} intensity={2.1} />
        <directionalLight position={[-4, 1.5, -2]} intensity={0.7} color="#b8c8ff" />
        <Suspense fallback={null}>
          <CharacterCard3D
            key={character.src}
            src={character.src}
            targetRotation={targetRotation}
            isDragging={isDragging}
            reducedMotion={reducedMotion}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
