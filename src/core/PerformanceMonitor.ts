/**
 * PerformanceMonitor - Monitor and auto-adjust rendering quality
 */

export type QualityLevel = 'low' | 'medium' | 'high';

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage?: number;
  renderTime: number;
}

export class PerformanceMonitor {
  private fps: number = 60;
  private frameTime: number = 0;
  private renderTime: number = 0;
  private lastFrameTime: number = performance.now();
  private frameCount: number = 0;
  private fpsUpdateInterval: number = 1000; // Update FPS every second
  private lastFpsUpdate: number = performance.now();
  
  private currentQuality: QualityLevel = 'high';
  private minFps: number = 30;
  private autoAdjust: boolean = true;
  
  private qualityChangeCallbacks: Array<(quality: QualityLevel) => void> = [];

  constructor(autoAdjust: boolean = true) {
    this.autoAdjust = autoAdjust;
  }

  /**
   * Update performance metrics
   * Call this at the beginning of each frame
   */
  beginFrame(): void {
    const now = performance.now();
    this.frameTime = now - this.lastFrameTime;
    this.lastFrameTime = now;
    this.frameCount++;

    // Update FPS calculation
    if (now - this.lastFpsUpdate >= this.fpsUpdateInterval) {
      this.fps = (this.frameCount * 1000) / (now - this.lastFpsUpdate);
      this.frameCount = 0;
      this.lastFpsUpdate = now;

      // Auto-adjust quality if enabled
      if (this.autoAdjust) {
        this.adjustQuality();
      }
    }
  }

  /**
   * Mark end of render time
   */
  endFrame(): void {
    this.renderTime = performance.now() - this.lastFrameTime;
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    const metrics: PerformanceMetrics = {
      fps: Math.round(this.fps),
      frameTime: this.frameTime,
      renderTime: this.renderTime,
    };

    // Add memory usage if available (Chrome only)
    if ('memory' in performance) {
      const memory = (performance as { memory?: { usedJSHeapSize: number } }).memory;
      if (memory) {
        metrics.memoryUsage = memory.usedJSHeapSize / (1024 * 1024); // MB
      }
    }

    return metrics;
  }

  /**
   * Get current FPS
   */
  getFPS(): number {
    return Math.round(this.fps);
  }

  /**
   * Get current quality level
   */
  getQuality(): QualityLevel {
    return this.currentQuality;
  }

  /**
   * Set quality level manually
   */
  setQuality(quality: QualityLevel): void {
    if (this.currentQuality !== quality) {
      this.currentQuality = quality;
      this.notifyQualityChange(quality);
    }
  }

  /**
   * Enable or disable auto quality adjustment
   */
  setAutoAdjust(enabled: boolean): void {
    this.autoAdjust = enabled;
  }

  /**
   * Register callback for quality changes
   */
  onQualityChange(callback: (quality: QualityLevel) => void): void {
    this.qualityChangeCallbacks.push(callback);
  }

  /**
   * Auto-adjust quality based on performance
   */
  private adjustQuality(): void {
    const currentFps = this.fps;

    // Degrade quality if FPS is too low
    if (currentFps < this.minFps) {
      if (this.currentQuality === 'high') {
        this.setQuality('medium');
      } else if (this.currentQuality === 'medium') {
        this.setQuality('low');
      }
    }
    // Upgrade quality if FPS is good and stable
    else if (currentFps > 55 && this.canUpgradeQuality()) {
      if (this.currentQuality === 'low') {
        this.setQuality('medium');
      } else if (this.currentQuality === 'medium') {
        this.setQuality('high');
      }
    }
  }

  /**
   * Check if quality can be upgraded
   */
  private canUpgradeQuality(): boolean {
    // Only upgrade if FPS has been stable for a while
    return this.fps > 55 && this.frameTime < 18;
  }

  /**
   * Notify all callbacks of quality change
   */
  private notifyQualityChange(quality: QualityLevel): void {
    this.qualityChangeCallbacks.forEach(callback => callback(quality));
  }

  /**
   * Get quality settings for rendering
   */
  getQualitySettings(): {
    resolution: number;
    antialias: boolean;
    shadows: boolean;
    pixelRatio: number;
  } {
    switch (this.currentQuality) {
      case 'low':
        return {
          resolution: 0.5,
          antialias: false,
          shadows: false,
          pixelRatio: 1,
        };
      case 'medium':
        return {
          resolution: 0.75,
          antialias: true,
          shadows: false,
          pixelRatio: 1,
        };
      case 'high':
        return {
          resolution: 1.0,
          antialias: true,
          shadows: true,
          pixelRatio: Math.min(window.devicePixelRatio, 2),
        };
    }
  }

  /**
   * Reset performance metrics
   */
  reset(): void {
    this.fps = 60;
    this.frameTime = 0;
    this.renderTime = 0;
    this.frameCount = 0;
    this.lastFrameTime = performance.now();
    this.lastFpsUpdate = performance.now();
  }
}
