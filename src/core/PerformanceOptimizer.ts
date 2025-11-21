/**
 * PerformanceOptimizer - Integrates all performance optimization systems
 * Coordinates LOD, frustum culling, caching, texture pooling, and memory management
 */

import { LODSystem } from './LODSystem';
import { FrustumCulling } from './FrustumCulling';
import { LRUCache } from './LRUCache';
import { TexturePool } from './TexturePool';
import { MemoryMonitor, type MemoryWarningLevel } from './MemoryMonitor';
import type { VideoPlane } from './VideoPlane';
import type { VideoResource } from '../types';
import * as THREE from 'three';

export interface OptimizationConfig {
  enableLOD: boolean;
  enableFrustumCulling: boolean;
  enableCaching: boolean;
  enableTexturePooling: boolean;
  enableMemoryMonitoring: boolean;
  maxCachedVideos: number;
  maxTexturePoolSize: number;
}

export interface OptimizationStats {
  lod: {
    high: number;
    medium: number;
    low: number;
  };
  culling: {
    total: number;
    visible: number;
    culled: number;
    cullingRate: number;
  };
  cache: {
    size: number;
    capacity: number;
    hits: number;
    misses: number;
    hitRate: number;
  };
  texturePool: {
    totalTextures: number;
    availableTextures: number;
    inUseTextures: number;
    reuseRate: number;
  };
  memory: {
    usedMB: number;
    limitMB: number;
    usagePercentage: number;
    warningLevel: MemoryWarningLevel;
  } | null;
}

export class PerformanceOptimizer {
  private config: OptimizationConfig;
  
  // Optimization systems
  private lodSystem: LODSystem;
  private frustumCulling: FrustumCulling;
  private videoCache: LRUCache<VideoResource>;
  private texturePool: TexturePool;
  private memoryMonitor: MemoryMonitor;
  
  // References
  private camera: THREE.Camera;
  
  // State
  private isOptimizing: boolean = false;
  private optimizationFrameId: number | null = null;

  constructor(camera: THREE.Camera, config?: Partial<OptimizationConfig>) {
    this.camera = camera;
    
    this.config = {
      enableLOD: config?.enableLOD ?? true,
      enableFrustumCulling: config?.enableFrustumCulling ?? true,
      enableCaching: config?.enableCaching ?? true,
      enableTexturePooling: config?.enableTexturePooling ?? true,
      enableMemoryMonitoring: config?.enableMemoryMonitoring ?? true,
      maxCachedVideos: config?.maxCachedVideos ?? 10,
      maxTexturePoolSize: config?.maxTexturePoolSize ?? 20,
    };

    // Initialize systems
    this.lodSystem = new LODSystem(camera, {
      enabled: this.config.enableLOD,
    });

    this.frustumCulling = new FrustumCulling(this.config.enableFrustumCulling);

    this.videoCache = new LRUCache<VideoResource>(
      this.config.maxCachedVideos,
      (key, video) => this.handleVideoEviction(key, video)
    );

    this.texturePool = new TexturePool({
      maxPoolSize: this.config.maxTexturePoolSize,
      enableCompression: true,
    });

    this.memoryMonitor = new MemoryMonitor({
      warningThreshold: 70,
      criticalThreshold: 85,
      autoCleanup: true,
    });

    // Setup memory monitoring callbacks
    this.setupMemoryMonitoring();
  }

  /**
   * Setup memory monitoring callbacks
   */
  private setupMemoryMonitoring(): void {
    if (!this.config.enableMemoryMonitoring) return;

    this.memoryMonitor.onWarning((level, stats) => {
      console.warn(`Memory ${level}: ${stats.usagePercentage.toFixed(1)}% used`);
      
      if (level === 'warning') {
        this.handleMemoryWarning();
      } else if (level === 'critical') {
        this.handleMemoryCritical();
      }
    });

    this.memoryMonitor.onCleanup(() => {
      this.performEmergencyCleanup();
    });
  }

  /**
   * Handle memory warning
   */
  private handleMemoryWarning(): void {
    console.log('Performing memory optimization...');
    
    // Reduce cache size
    const currentCapacity = this.videoCache.getCapacity();
    this.videoCache.setCapacity(Math.max(5, Math.floor(currentCapacity * 0.7)));
    
    // Reduce texture pool size
    const poolConfig = this.texturePool.getConfig();
    this.texturePool.setMaxPoolSize(Math.max(10, Math.floor(poolConfig.maxPoolSize * 0.7)));
  }

  /**
   * Handle critical memory situation
   */
  private handleMemoryCritical(): void {
    console.error('Critical memory situation - aggressive cleanup');
    
    // More aggressive cleanup
    this.videoCache.setCapacity(Math.max(3, Math.floor(this.config.maxCachedVideos * 0.5)));
    this.texturePool.setMaxPoolSize(Math.max(5, Math.floor(this.config.maxTexturePoolSize * 0.5)));
  }

  /**
   * Perform emergency cleanup
   */
  private performEmergencyCleanup(): void {
    console.error('Emergency memory cleanup');
    
    // Clear oldest cache entries
    const lruKey = this.videoCache.getLRUKey();
    if (lruKey) {
      this.videoCache.remove(lruKey);
    }
    
    // Clear texture pool
    this.texturePool.clear();
  }

  /**
   * Handle video eviction from cache
   */
  private handleVideoEviction(key: string, video: VideoResource): void {
    console.log(`Evicting video from cache: ${key}`);
    
    // Release video resources
    if (video.url) {
      URL.revokeObjectURL(video.url);
    }
    
    if (video.videoElement) {
      video.videoElement.src = '';
      video.videoElement.load();
    }
  }

  /**
   * Start optimization loop
   */
  startOptimization(): void {
    if (this.isOptimizing) return;
    
    this.isOptimizing = true;
    
    // Start memory monitoring
    if (this.config.enableMemoryMonitoring) {
      this.memoryMonitor.startMonitoring();
    }
    
    console.log('Performance optimization started');
  }

  /**
   * Stop optimization loop
   */
  stopOptimization(): void {
    this.isOptimizing = false;
    
    if (this.optimizationFrameId !== null) {
      cancelAnimationFrame(this.optimizationFrameId);
      this.optimizationFrameId = null;
    }
    
    // Stop memory monitoring
    this.memoryMonitor.stopMonitoring();
    
    console.log('Performance optimization stopped');
  }

  /**
   * Optimize frame - call this every frame
   */
  optimizeFrame(videoPlanes: Map<string, VideoPlane>): void {
    if (!this.isOptimizing) return;

    // Update frustum culling
    if (this.config.enableFrustumCulling) {
      this.frustumCulling.updateFrustum(this.camera);
      this.frustumCulling.cullPlanes(videoPlanes);
    }

    // Update LOD system
    if (this.config.enableLOD) {
      this.lodSystem.updateLOD(videoPlanes);
    }
  }

  /**
   * Cache video resource
   */
  cacheVideo(id: string, video: VideoResource): void {
    if (!this.config.enableCaching) return;
    this.videoCache.put(id, video);
  }

  /**
   * Get cached video
   */
  getCachedVideo(id: string): VideoResource | undefined {
    if (!this.config.enableCaching) return undefined;
    return this.videoCache.get(id);
  }

  /**
   * Remove video from cache
   */
  removeCachedVideo(id: string): void {
    this.videoCache.remove(id);
  }

  /**
   * Acquire texture from pool
   */
  acquireTexture(width?: number, height?: number): THREE.Texture {
    if (!this.config.enableTexturePooling) {
      // Create new texture without pooling
      const canvas = document.createElement('canvas');
      canvas.width = width ?? 1920;
      canvas.height = height ?? 1080;
      return new THREE.CanvasTexture(canvas);
    }
    
    return this.texturePool.acquire(width, height);
  }

  /**
   * Release texture back to pool
   */
  releaseTexture(texture: THREE.Texture): void {
    if (!this.config.enableTexturePooling) {
      texture.dispose();
      return;
    }
    
    this.texturePool.release(texture);
  }

  /**
   * Acquire video texture
   */
  acquireVideoTexture(videoElement: HTMLVideoElement): THREE.VideoTexture {
    return this.texturePool.acquireVideoTexture(videoElement);
  }

  /**
   * Release video texture
   */
  releaseVideoTexture(texture: THREE.VideoTexture): void {
    this.texturePool.releaseVideoTexture(texture);
  }

  /**
   * Get optimization statistics
   */
  getStats(): OptimizationStats {
    const memoryStats = this.memoryMonitor.getStats();
    
    return {
      lod: this.lodSystem.getStats(),
      culling: this.frustumCulling.getStats(),
      cache: this.videoCache.getStats(),
      texturePool: this.texturePool.getStats(),
      memory: memoryStats ? {
        usedMB: memoryStats.usedJSHeapSize,
        limitMB: memoryStats.jsHeapSizeLimit,
        usagePercentage: memoryStats.usagePercentage,
        warningLevel: this.memoryMonitor.getWarningLevel(),
      } : null,
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Update individual systems
    this.lodSystem.setEnabled(this.config.enableLOD);
    this.frustumCulling.setEnabled(this.config.enableFrustumCulling);
    
    if (this.config.maxCachedVideos !== this.videoCache.getCapacity()) {
      this.videoCache.setCapacity(this.config.maxCachedVideos);
    }
    
    if (this.config.maxTexturePoolSize !== this.texturePool.getConfig().maxPoolSize) {
      this.texturePool.setMaxPoolSize(this.config.maxTexturePoolSize);
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): OptimizationConfig {
    return { ...this.config };
  }

  /**
   * Force memory check
   */
  checkMemory(): void {
    this.memoryMonitor.checkNow();
  }

  /**
   * Get memory info string
   */
  getMemoryInfo(): string {
    return this.memoryMonitor.getFormattedStats();
  }

  /**
   * Clear all caches
   */
  clearCaches(): void {
    this.videoCache.clear();
    this.texturePool.clear();
    this.lodSystem.clear();
    this.frustumCulling.resetStats();
  }

  /**
   * Prewarm texture pool
   */
  prewarmTexturePool(count: number): void {
    this.texturePool.prewarm(count);
  }

  /**
   * Dispose and cleanup all resources
   */
  dispose(): void {
    this.stopOptimization();
    this.videoCache.clear();
    this.texturePool.dispose();
    this.memoryMonitor.dispose();
    this.lodSystem.clear();
  }
}
