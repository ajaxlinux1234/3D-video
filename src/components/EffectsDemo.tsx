/**
 * EffectsDemo - Demonstration component for the effects system
 */

import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { EffectsPanel } from './EffectsPanel';
import { useEffectProcessor } from '../core/useEffectProcessor';
import type { Effect } from '../types';
import './EffectsDemo.css';

/**
 * Demo scene with a video plane
 */
const DemoScene: React.FC<{
  onRenderReady: (scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer) => void;
}> = ({ onRenderReady }) => {
  const { scene, camera, gl } = useThree();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const [videoTexture, setVideoTexture] = useState<THREE.VideoTexture | null>(null);

  // Initialize video
  useEffect(() => {
    let mounted = true;
    
    const video = document.createElement('video');
    video.src = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
    video.crossOrigin = 'anonymous';
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    
    video.play().catch(err => console.error('Video play failed:', err));
    
    const texture = new THREE.VideoTexture(video);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.format = THREE.RGBFormat;
    
    videoRef.current = video;
    
    // Use requestAnimationFrame to avoid setState in effect
    requestAnimationFrame(() => {
      if (mounted) {
        setVideoTexture(texture);
      }
    });

    return () => {
      mounted = false;
      video.pause();
      video.src = '';
      texture.dispose();
    };
  }, []);

  // Notify parent when ready
  useEffect(() => {
    if (scene && camera && gl) {
      onRenderReady(scene, camera, gl);
    }
  }, [scene, camera, gl, onRenderReady]);

  useFrame(() => {
    if (videoRef.current) {
      // Video texture updates automatically
    }
  });

  if (!videoTexture) {
    return null;
  }

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <planeGeometry args={[4, 2.25]} />
        <meshBasicMaterial map={videoTexture} side={THREE.DoubleSide} />
      </mesh>
      
      <OrbitControls enableDamping dampingFactor={0.05} />
      
      {/* Background */}
      <mesh position={[0, 0, -2]}>
        <planeGeometry args={[20, 20]} />
        <meshBasicMaterial color="#0a0a0a" />
      </mesh>
    </>
  );
};

/**
 * Main demo component
 */
export const EffectsDemo: React.FC = () => {
  const [effects, setEffects] = useState<Effect[]>([]);
  const [renderObjects, setRenderObjects] = useState<{
    scene: THREE.Scene;
    camera: THREE.Camera;
    renderer: THREE.WebGLRenderer;
  } | null>(null);

  const handleRenderReady = (
    scene: THREE.Scene,
    camera: THREE.Camera,
    renderer: THREE.WebGLRenderer
  ) => {
    setRenderObjects({ scene, camera, renderer });
  };

  const effectProcessor = useEffectProcessor({
    scene: renderObjects?.scene ?? ({} as THREE.Scene),
    camera: renderObjects?.camera ?? ({} as THREE.Camera),
    renderer: renderObjects?.renderer ?? ({} as THREE.WebGLRenderer),
    enabled: !!renderObjects,
  });

  const handleAddEffect = (effect: Effect) => {
    setEffects(prev => [...prev, effect]);
    effectProcessor.addEffect('demo-clip', effect);
  };

  const handleRemoveEffect = (effectId: string) => {
    setEffects(prev => prev.filter(e => e.id !== effectId));
    effectProcessor.removeEffect('demo-clip', effectId);
  };

  const handleUpdateEffect = (effectId: string, updates: Partial<Effect>) => {
    setEffects(prev =>
      prev.map(e => (e.id === effectId ? { ...e, ...updates } : e))
    );
    effectProcessor.updateEffect('demo-clip', effectId, updates);
  };

  // Render with effects
  useEffect(() => {
    if (!effectProcessor.isReady) return;

    let animationId: number;
    let lastTime = performance.now();

    const animate = () => {
      const currentTime = performance.now();
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      effectProcessor.render(deltaTime);
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [effectProcessor]);

  return (
    <div className="effects-demo">
      <div className="effects-demo-header">
        <h2>Effects & Filters System Demo</h2>
        <p>Add effects to the video plane and adjust their intensity in real-time</p>
      </div>
      
      <div className="effects-demo-content">
        <div className="effects-demo-viewport">
          <Canvas
            camera={{ position: [0, 0, 5], fov: 50 }}
            gl={{ antialias: true, alpha: false }}
          >
            <DemoScene onRenderReady={handleRenderReady} />
          </Canvas>
          
          <div className="effects-demo-info">
            <div className="info-item">
              <span className="info-label">Active Effects:</span>
              <span className="info-value">{effects.filter(e => e.enabled).length}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Total Effects:</span>
              <span className="info-value">{effects.length}</span>
            </div>
          </div>
        </div>
        
        <div className="effects-demo-panel">
          <EffectsPanel
            clipId="demo-clip"
            activeEffects={effects}
            onAddEffect={handleAddEffect}
            onRemoveEffect={handleRemoveEffect}
            onUpdateEffect={handleUpdateEffect}
          />
        </div>
      </div>
    </div>
  );
};
