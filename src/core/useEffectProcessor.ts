/**
 * React hook for managing effect processor
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { EffectProcessor } from './EffectProcessor';
import type { Effect } from '../types';

export interface UseEffectProcessorOptions {
  scene: THREE.Scene;
  camera: THREE.Camera;
  renderer: THREE.WebGLRenderer;
  enabled?: boolean;
}

export interface UseEffectProcessorReturn {
  addEffect: (clipId: string, effect: Effect) => void;
  removeEffect: (clipId: string, effectId: string) => void;
  updateEffect: (clipId: string, effectId: string, updates: Partial<Effect>) => void;
  render: (deltaTime?: number) => void;
  isReady: boolean;
}

/**
 * Hook to manage post-processing effects
 */
export function useEffectProcessor(
  options: UseEffectProcessorOptions
): UseEffectProcessorReturn {
  const { scene, camera, renderer, enabled = true } = options;
  const processorRef = useRef<EffectProcessor | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Initialize processor
  useEffect(() => {
    if (!enabled || !scene || !camera || !renderer) {
      return;
    }

    let mounted = true;
    const processor = new EffectProcessor(scene, camera, renderer);
    processorRef.current = processor;
    
    // Use requestAnimationFrame to avoid setState in effect
    requestAnimationFrame(() => {
      if (mounted) {
        setIsReady(true);
      }
    });

    return () => {
      mounted = false;
      processor.dispose();
      processorRef.current = null;
      setIsReady(false);
    };
  }, [scene, camera, renderer, enabled]);

  // Handle window resize
  useEffect(() => {
    if (!processorRef.current) return;

    const handleResize = () => {
      if (processorRef.current && renderer) {
        const size = renderer.getSize(new THREE.Vector2());
        processorRef.current.setSize(size.x, size.y);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [renderer]);

  const addEffect = useCallback((clipId: string, effect: Effect) => {
    if (processorRef.current) {
      processorRef.current.addEffect(clipId, effect);
    }
  }, []);

  const removeEffect = useCallback((clipId: string, effectId: string) => {
    if (processorRef.current) {
      processorRef.current.removeEffect(clipId, effectId);
    }
  }, []);

  const updateEffect = useCallback((clipId: string, effectId: string, updates: Partial<Effect>) => {
    if (processorRef.current) {
      processorRef.current.updateEffect(clipId, effectId, updates);
    }
  }, []);

  const render = useCallback((deltaTime?: number) => {
    if (processorRef.current) {
      processorRef.current.render(deltaTime);
    }
  }, []);

  return {
    addEffect,
    removeEffect,
    updateEffect,
    render,
    isReady,
  };
}
