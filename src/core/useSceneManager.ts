/**
 * useSceneManager - React hook for SceneManager
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { SceneManager } from './SceneManager';
import type { QualityLevel } from './PerformanceMonitor';

export interface UseSceneManagerOptions {
  autoStart?: boolean;
  autoAdjustQuality?: boolean;
  width?: number;
  height?: number;
}

export function useSceneManager(options: UseSceneManagerOptions = {}) {
  const [sceneManager, setSceneManager] = useState<SceneManager | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [quality, setQuality] = useState<QualityLevel>('high');
  const [fps, setFps] = useState(60);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Initialize scene manager when canvas is available
  const handleCanvasRef = useCallback((canvas: HTMLCanvasElement | null) => {
    canvasRef.current = canvas;
    
    if (!canvas) {
      // Cleanup if canvas is removed
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      setSceneManager(null);
      setIsInitialized(false);
      return;
    }

    // Initialize scene manager
    const manager = new SceneManager();
    manager.initialize(canvas, {
      width: options.width || 1080,
      height: options.height || 1920,
      autoAdjustQuality: options.autoAdjustQuality !== false,
    });

    setSceneManager(manager);
    setIsInitialized(true);

    // Start render loop if autoStart is enabled
    if (options.autoStart !== false) {
      manager.startRenderLoop();
    }

    // Setup performance monitoring
    const monitorInterval = setInterval(() => {
      const metrics = manager.getPerformanceMetrics();
      setFps(metrics.fps);
      setQuality(manager.getQuality());
    }, 1000);

    // Store cleanup function
    cleanupRef.current = () => {
      clearInterval(monitorInterval);
      manager.dispose();
    };
  }, [options.autoStart, options.autoAdjustQuality, options.width, options.height]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, []);

  return {
    sceneManager,
    canvasRef: handleCanvasRef,
    isInitialized,
    quality,
    fps,
  };
}
