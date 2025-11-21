/**
 * useSceneManager - React hook for SceneManager
 */
import { useEffect, useRef, useState } from 'react';
import { SceneManager } from './SceneManager';
import type { QualityLevel } from './PerformanceMonitor';

export interface UseSceneManagerOptions {
  autoStart?: boolean;
  autoAdjustQuality?: boolean;
  width?: number;
  height?: number;
}

export function useSceneManager(options: UseSceneManagerOptions = {}) {
  const sceneManagerRef = useRef<SceneManager | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [quality, setQuality] = useState<QualityLevel>('high');
  const [fps, setFps] = useState(60);

  // Initialize scene manager
  useEffect(() => {
    if (!canvasRef.current || sceneManagerRef.current) return;

    const sceneManager = new SceneManager();
    sceneManager.initialize(canvasRef.current, {
      width: options.width || 1080,
      height: options.height || 1920,
      autoAdjustQuality: options.autoAdjustQuality !== false,
    });

    sceneManagerRef.current = sceneManager;
    setIsInitialized(true);

    // Start render loop if autoStart is enabled
    if (options.autoStart !== false) {
      sceneManager.startRenderLoop();
    }

    // Setup performance monitoring
    const monitorInterval = setInterval(() => {
      const metrics = sceneManager.getPerformanceMetrics();
      setFps(metrics.fps);
      setQuality(sceneManager.getQuality());
    }, 1000);

    // Cleanup
    return () => {
      clearInterval(monitorInterval);
      sceneManager.dispose();
      sceneManagerRef.current = null;
      setIsInitialized(false);
    };
  }, [options.autoStart, options.autoAdjustQuality, options.width, options.height]);

  return {
    sceneManager: sceneManagerRef.current,
    canvasRef,
    isInitialized,
    quality,
    fps,
  };
}
