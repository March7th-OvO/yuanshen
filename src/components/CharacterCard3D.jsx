import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const CARD_HEIGHT = 3;
const CARD_DEPTH = 0.08;

/**
 * 实体角色卡片：前面为立绘，背面及四边使用独立材质，便于后续追加翻转和特效。
 */
export default function CharacterCard3D({ src, targetRotation, isDragging, reducedMotion }) {
  const meshRef = useRef(null);
  const motionRef = useRef(null);
  const entranceProgress = useRef(reducedMotion ? 1 : 0);
  // 必须在 Image 的 src 赋值前声明 anonymous，才能让跨域图片安全上传为 WebGL 纹理。
  const texture = useLoader(THREE.TextureLoader, src, (loader) => loader.setCrossOrigin('anonymous'));
  const { camera, size } = useThree();

  const width = useMemo(() => {
    const image = texture.image;
    const aspect = image?.width && image?.height ? image.width / image.height : 2 / 3;
    return CARD_HEIGHT * aspect;
  }, [texture]);

  useEffect(() => {
    // R2 图片按 sRGB 作为颜色纹理读取，避免 WebGL 显示时出现明显偏色。
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
  }, [texture]);

  useEffect(() => {
    // 宽图时适度后移相机，保证任何源图片比例都完整可见且不发生拉伸。
    const verticalFov = THREE.MathUtils.degToRad(camera.fov);
    const requiredDistance = Math.max(
      CARD_HEIGHT / (2 * Math.tan(verticalFov / 2)),
      width / (2 * (size.width / size.height) * Math.tan(verticalFov / 2)),
    );
    camera.position.z = Math.max(5, requiredDistance + 0.3);
    camera.updateProjectionMatrix();
  }, [camera, size.height, size.width, width]);

  useFrame((state, delta) => {
    const card = meshRef.current;
    const motion = motionRef.current;
    if (!card || !motion) return;

    if (reducedMotion) {
      card.rotation.set(targetRotation.current.x, targetRotation.current.y, 0);
      card.scale.setScalar(1);
      motion.position.y = 0;
      motion.rotation.set(0, 0, 0);
      return;
    }

    entranceProgress.current = THREE.MathUtils.damp(entranceProgress.current, 1, 4.8, delta);
    const progress = entranceProgress.current;

    // 先完整展示一圈卡片的六个面，再自然过渡到用户的目标旋转。
    const entryY = -Math.PI * 2 * (1 - progress);
    card.rotation.x = THREE.MathUtils.damp(
      card.rotation.x,
      targetRotation.current.x,
      9,
      delta,
    );
    card.rotation.y = THREE.MathUtils.damp(
      card.rotation.y,
      targetRotation.current.y + entryY,
      7,
      delta,
    );
    const scale = THREE.MathUtils.damp(card.scale.x, 1, 7, delta);
    card.scale.setScalar(scale);

    // 拖动期间停用呼吸动画，让用户对卡片的控制保持直接、稳定。
    if (!isDragging.current && progress > 0.98) {
      const elapsed = state.clock.elapsedTime;
      motion.position.y = Math.sin(elapsed * 1.25) * 0.035;
      motion.rotation.x = Math.sin(elapsed * 0.9) * 0.008;
      motion.rotation.z = Math.sin(elapsed * 0.75) * 0.006;
    } else {
      motion.position.y = THREE.MathUtils.damp(motion.position.y, 0, 8, delta);
      motion.rotation.x = THREE.MathUtils.damp(motion.rotation.x, 0, 8, delta);
      motion.rotation.z = THREE.MathUtils.damp(motion.rotation.z, 0, 8, delta);
    }
  });

  return (
    <group ref={motionRef}>
      <mesh
        ref={meshRef}
        rotation={[reducedMotion ? 0 : 0.08, reducedMotion ? 0 : -Math.PI * 2, 0]}
        scale={reducedMotion ? 1 : 0.2}
      >
        <boxGeometry args={[width, CARD_HEIGHT, CARD_DEPTH]} />
        {/* BoxGeometry 顺序为右、左、上、下、前、后；正面单独承载立绘纹理。 */}
        <meshPhysicalMaterial attach="material-0" color="#aeb5c0" metalness={0.58} roughness={0.38} />
        <meshPhysicalMaterial attach="material-1" color="#aeb5c0" metalness={0.58} roughness={0.38} />
        <meshPhysicalMaterial attach="material-2" color="#c3cad3" metalness={0.55} roughness={0.34} />
        <meshPhysicalMaterial attach="material-3" color="#929aa6" metalness={0.55} roughness={0.42} />
        <meshPhysicalMaterial
          attach="material-4"
          map={texture}
          roughness={0.26}
          metalness={0}
          clearcoat={0.92}
          clearcoatRoughness={0.14}
        />
        <meshPhysicalMaterial attach="material-5" color="#59616d" metalness={0.16} roughness={0.46} />
      </mesh>
    </group>
  );
}
