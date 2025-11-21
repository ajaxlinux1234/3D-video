/**
 * MemoryMonitor - Monitors memory usage and triggers cleanup
 * Automatically releases resources when memory is low
 */

export interface MemoryStats {
  usedJSHeapSize: number;      // MB
  totalJSHeapSize: number;     // MB
  jsHeapSizeLimit: number;     // MB
  usagePercentage: number;     // 0-100
  isLow: boolean;              // Memory is running low
  isCritical: boolean;         // Memory is critically low
}

export interface MemoryThresholds {
  warningThreshold: number;    // Percentage (default: 70%)
  criticalThreshold: number;   // Percentage (default: 85%)
  autoCleanup: boolean;        // Auto cleanup when critical
}

export type MemoryWarningLevel = 'normal' | 'warning' | 'critical';

export class MemoryMonitor {
  private thresholds: MemoryThresholds;
  private isSupported: boolean;
  private checkInterval: number = 5000; // Check every 5 seconds
  private intervalId: number | null = null;
  
  // Callbacks
  private warningCallbacks: Array<(level: MemoryWarningLevel, stats: MemoryStats) => void> = [];
  private cleanupCallbacks: Array<() => void> = [];
  
  // Last known state
  private lastWarningLevel: MemoryWarningLevel = 'normal';

  constructor(thresholds?: Partial<MemoryThresholds>) {
    this.thresholds = {
      warningThreshold: thresholds?.warningThreshold ?? 70,
      criticalThreshold: thresholds?.criticalThreshold ?? 85,
      autoCleanup: thresholds?.autoCleanup ?? true,
    };

    // Check if performance.memory is supported (Chrome only)
    this.isSupported = 'memory' in performance;

    if (!this.isSupported) {
      console.warn('Memory monitoring not supported in this browser');
    }
  }

  /**
   * Get current memory statistics
   */
  getStats(): MemoryStats | null {
    if (!this.isSupported) {
      return null;
    }

    const memory = (performance as { memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    }}).memory;

    if (!memory) {
      return null;
    }

    const usedMB = memory.usedJSHeapSize / (1024 * 1024);
    const totalMB = memory.totalJSHeapSize / (1024 * 1024);
    const limitMB = memory.jsHeapSizeLimit / (1024 * 1024);
    const usagePercentage = (usedMB / limitMB) * 100;

    const isLow = usagePercentage >= this.thresholds.warningThreshold;
    const isCritical = usagePercentage >= this.thresholds.criticalThreshold;

    return {
      usedJSHeapSize: usedMB,
      totalJSHeapSize: totalMB,
      jsHeapSizeLimit: limitMB,
      usagePercentage,
      isLow,
      isCritical,
    };
  }

  /**
   * Get current warning level
   */
  getWarningLevel(): MemoryWarningLevel {
    const stats = this.getStats();
    
    if (!stats) {
      return 'normal';
    }

    if (stats.isCritical) {
      return 'critical';
    } else if (stats.isLow) {
      return 'warning';
    } else {
      return 'normal';
    }
  }

  /**
   * Start monitoring memory
   */
  startMonitoring(): void {
    if (!this.isSupported) {
      console.warn('Cannot start memory monitoring - not supported');
      return;
    }

    if (this.intervalId !== null) {
      return; // Already monitoring
    }

    // Initial check
    this.checkMemory();

    // Start periodic checks
    this.intervalId = window.setInterval(() => {
      this.checkMemory();
    }, this.checkInterval);
  }

  /**
   * Stop monitoring memory
   */
  stopMonitoring(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Check memory and trigger callbacks if needed
   */
  private checkMemory(): void {
    const stats = this.getStats();
    
    if (!stats) {
      return;
    }

    const currentLevel = this.getWarningLevel();

    // Check if warning level changed
    if (currentLevel !== this.lastWarningLevel) {
      this.notifyWarning(currentLevel, stats);
      this.lastWarningLevel = currentLevel;
    }

    // Auto cleanup if critical and enabled
    if (stats.isCritical && this.thresholds.autoCleanup) {
      this.triggerCleanup();
    }
  }

  /**
   * Notify warning callbacks
   */
  private notifyWarning(level: MemoryWarningLevel, stats: MemoryStats): void {
    this.warningCallbacks.forEach(callback => {
      try {
        callback(level, stats);
      } catch (error) {
        console.error('Error in memory warning callback:', error);
      }
    });
  }

  /**
   * Trigger cleanup callbacks
   */
  private triggerCleanup(): void {
    console.warn('Memory critical - triggering cleanup');
    
    this.cleanupCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in cleanup callback:', error);
      }
    });

    // Force garbage collection if available (Chrome with --js-flags=--expose-gc)
    const global = globalThis as unknown as { gc?: () => void };
    if (typeof global.gc === 'function') {
      global.gc();
    }
  }

  /**
   * Register callback for memory warnings
   */
  onWarning(callback: (level: MemoryWarningLevel, stats: MemoryStats) => void): void {
    this.warningCallbacks.push(callback);
  }

  /**
   * Register callback for cleanup
   */
  onCleanup(callback: () => void): void {
    this.cleanupCallbacks.push(callback);
  }

  /**
   * Remove warning callback
   */
  removeWarningCallback(callback: (level: MemoryWarningLevel, stats: MemoryStats) => void): void {
    this.warningCallbacks = this.warningCallbacks.filter(cb => cb !== callback);
  }

  /**
   * Remove cleanup callback
   */
  removeCleanupCallback(callback: () => void): void {
    this.cleanupCallbacks = this.cleanupCallbacks.filter(cb => cb !== callback);
  }

  /**
   * Update thresholds
   */
  updateThresholds(thresholds: Partial<MemoryThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  /**
   * Get current thresholds
   */
  getThresholds(): MemoryThresholds {
    return { ...this.thresholds };
  }

  /**
   * Set monitoring interval
   */
  setCheckInterval(intervalMs: number): void {
    this.checkInterval = intervalMs;
    
    // Restart monitoring if active
    if (this.intervalId !== null) {
      this.stopMonitoring();
      this.startMonitoring();
    }
  }

  /**
   * Check if monitoring is supported
   */
  isMonitoringSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Check if currently monitoring
   */
  isMonitoring(): boolean {
    return this.intervalId !== null;
  }

  /**
   * Force a memory check now
   */
  checkNow(): MemoryStats | null {
    const stats = this.getStats();
    
    if (stats) {
      const level = this.getWarningLevel();
      
      if (level !== this.lastWarningLevel) {
        this.notifyWarning(level, stats);
        this.lastWarningLevel = level;
      }

      if (stats.isCritical && this.thresholds.autoCleanup) {
        this.triggerCleanup();
      }
    }

    return stats;
  }

  /**
   * Get formatted memory info string
   */
  getFormattedStats(): string {
    const stats = this.getStats();
    
    if (!stats) {
      return 'Memory monitoring not available';
    }

    return `Memory: ${stats.usedJSHeapSize.toFixed(1)}MB / ${stats.jsHeapSizeLimit.toFixed(1)}MB (${stats.usagePercentage.toFixed(1)}%)`;
  }

  /**
   * Dispose and cleanup
   */
  dispose(): void {
    this.stopMonitoring();
    this.warningCallbacks = [];
    this.cleanupCallbacks = [];
  }
}
