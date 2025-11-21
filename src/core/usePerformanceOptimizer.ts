/**
 * usePerformanceOptimizer - React hook for performance optimization
 */

import { useEffect, useState, useCallback } from 'react';
import type { PerformanceOptimizer, OptimizationStats, OptimizationConfig } from './PerformanceOptimizer';

export interface UsePerformanceOptimizerReturn {
  stats: OptimizationStats | null;
  config: OptimizationConfig | null;
  updateConfig: (config: Partial<OptimizationConfig>) => void;
  checkMemory: () => void;
  getMemoryInfo: () => string;
  clearCaches: () => void;
  prewarmTexturePool: (count: number) => void;
}

export function usePerformanceOptimizer(
  optimizer: PerformanceOptimizer | null
): UsePerformanceOptimizerReturn {
  const [stats, setStats] = useState<OptimizationStats | null>(() => 
    optimizer?.getStats() || null
  );
  const [config, setConfig] = useState<OptimizationConfig | null>(() =>
    optimizer?.getConfig() || null
  );

  // Update stats periodically
  useEffect(() => {
    if (!optimizer) return;

    // Update stats every second
    const interval = setInterval(() => {
      setStats(optimizer.getStats());
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [optimizer]);

  // Update configuration
  const updateConfig = useCallback((newConfig: Partial<OptimizationConfig>) => {
    if (!optimizer) return;
    
    optimizer.updateConfig(newConfig);
    setConfig(optimizer.getConfig());
  }, [optimizer]);

  // Check memory
  const checkMemory = useCallback(() => {
    if (!optimizer) return;
    optimizer.checkMemory();
  }, [optimizer]);

  // Get memory info
  const getMemoryInfo = useCallback((): string => {
    if (!optimizer) return 'Optimizer not available';
    return optimizer.getMemoryInfo();
  }, [optimizer]);

  // Clear caches
  const clearCaches = useCallback(() => {
    if (!optimizer) return;
    optimizer.clearCaches();
  }, [optimizer]);

  // Prewarm texture pool
  const prewarmTexturePool = useCallback((count: number) => {
    if (!optimizer) return;
    optimizer.prewarmTexturePool(count);
  }, [optimizer]);

  return {
    stats,
    config,
    updateConfig,
    checkMemory,
    getMemoryInfo,
    clearCaches,
    prewarmTexturePool,
  };
}
