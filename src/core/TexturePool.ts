/**
 * TexturePool - Reusable texture pool for memory optimization
 * Reduces texture allocation/deallocation overhead
 */

import * as THREE from 'three';

export interface TexturePoolConfig {
  maxPoolSize: number;
  defaultWidth: number;
  defaultHeight: number;
  enableCompression: boolean;
}

export interface PoolStats {
  totalTextures: number;
  availableTextures: number;
  inUseTextures: number;
  allocations: number;
  reuses: number;
  reuseRate: number;
}

export class TexturePool {
  private config: TexturePoolConfig;
  private availableTextures: THREE.Texture[] = [];
  private inUseTextures: Set<THREE.Texture> = new Set();
  
  // Statistics
  private allocations: number = 0;
  private reuses: number = 0;

  constructor(config?: Partial<TexturePoolConfig>) {
    this.config = {
      maxPoolSize: config?.maxPoolSize ?? 20,
      defaultWidth: config?.defaultWidth ?? 1920,
      defaultHeight: config?.defaultHeight ?? 1080,
      enableCompression: config?.enableCompression ?? true,
    };
  }

  /**
   * Acquire a texture from the pool
   */
  acquire(width?: number, height?: number): THREE.Texture {
    const w = width ?? this.config.defaultWidth;
    const h = height ?? this.config.defaultHeight;

    // Try to find a matching texture in the pool
    const matchingIndex = this.availableTextures.findIndex(
      texture => {
        const img = texture.image as { width?: number; height?: number } | undefined;
        return img?.width === w && img?.height === h;
      }
    );

    let texture: THREE.Texture;

    if (matchingIndex !== -1) {
      // Reuse existing texture
      texture = this.availableTextures.splice(matchingIndex, 1)[0];
      this.reuses++;
    } else {
      // Create new texture
      texture = this.createTexture(w, h);
      this.allocations++;
    }

    // Mark as in use
    this.inUseTextures.add(texture);

    return texture;
  }

  /**
   * Release a texture back to the pool
   */
  release(texture: THREE.Texture): void {
    if (!this.inUseTextures.has(texture)) {
      console.warn('Attempting to release texture not from pool');
      return;
    }

    // Remove from in-use set
    this.inUseTextures.delete(texture);

    // Check pool size limit
    if (this.availableTextures.length < this.config.maxPoolSize) {
      // Reset texture state
      this.resetTexture(texture);
      
      // Return to pool
      this.availableTextures.push(texture);
    } else {
      // Pool is full, dispose texture
      this.disposeTexture(texture);
    }
  }

  /**
   * Create a new texture
   */
  private createTexture(width: number, height: number): THREE.Texture {
    // Create canvas for texture
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    
    // Configure texture
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.generateMipmaps = false;

    // Apply compression if enabled
    if (this.config.enableCompression) {
      this.applyCompression(texture);
    }

    return texture;
  }

  /**
   * Apply texture compression (if supported)
   */
  private applyCompression(texture: THREE.Texture): void {
    // Check for WebGL compressed texture support
    // This is a simplified approach - real implementation would check
    // for specific compression formats (DXT, ETC, ASTC, etc.)
    
    // For now, we just set the format to reduce memory
    texture.format = THREE.RGBAFormat;
    texture.type = THREE.UnsignedByteType;
  }

  /**
   * Reset texture to default state
   */
  private resetTexture(texture: THREE.Texture): void {
    // Clear the canvas
    if (texture.image instanceof HTMLCanvasElement) {
      const ctx = texture.image.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, texture.image.width, texture.image.height);
      }
    }

    // Reset texture properties
    texture.needsUpdate = true;
    texture.offset.set(0, 0);
    texture.repeat.set(1, 1);
    texture.rotation = 0;
  }

  /**
   * Dispose a texture completely
   */
  private disposeTexture(texture: THREE.Texture): void {
    texture.dispose();
    
    // Clear canvas if it exists
    if (texture.image instanceof HTMLCanvasElement) {
      texture.image.width = 0;
      texture.image.height = 0;
    }
  }

  /**
   * Create a video texture (special case)
   */
  acquireVideoTexture(videoElement: HTMLVideoElement): THREE.VideoTexture {
    const texture = new THREE.VideoTexture(videoElement);
    
    // Configure video texture
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.format = THREE.RGBAFormat;
    texture.generateMipmaps = false;

    // Mark as in use (even though not from pool)
    this.inUseTextures.add(texture);
    this.allocations++;

    return texture;
  }

  /**
   * Release video texture
   */
  releaseVideoTexture(texture: THREE.VideoTexture): void {
    this.inUseTextures.delete(texture);
    // Video textures are not pooled, just dispose
    this.disposeTexture(texture);
  }

  /**
   * Get pool statistics
   */
  getStats(): PoolStats {
    const total = this.allocations + this.reuses;
    const reuseRate = total > 0 ? (this.reuses / total) * 100 : 0;

    return {
      totalTextures: this.availableTextures.length + this.inUseTextures.size,
      availableTextures: this.availableTextures.length,
      inUseTextures: this.inUseTextures.size,
      allocations: this.allocations,
      reuses: this.reuses,
      reuseRate,
    };
  }

  /**
   * Clear the entire pool
   */
  clear(): void {
    // Dispose all available textures
    this.availableTextures.forEach(texture => {
      this.disposeTexture(texture);
    });
    this.availableTextures = [];

    // Note: In-use textures are not disposed as they're still being used
    console.warn(`${this.inUseTextures.size} textures still in use during pool clear`);
  }

  /**
   * Resize pool capacity
   */
  setMaxPoolSize(size: number): void {
    this.config.maxPoolSize = size;

    // Trim pool if necessary
    while (this.availableTextures.length > size) {
      const texture = this.availableTextures.pop();
      if (texture) {
        this.disposeTexture(texture);
      }
    }
  }

  /**
   * Get pool configuration
   */
  getConfig(): TexturePoolConfig {
    return { ...this.config };
  }

  /**
   * Update pool configuration
   */
  updateConfig(config: Partial<TexturePoolConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Prewarm pool with textures
   */
  prewarm(count: number, width?: number, height?: number): void {
    const w = width ?? this.config.defaultWidth;
    const h = height ?? this.config.defaultHeight;

    for (let i = 0; i < count && this.availableTextures.length < this.config.maxPoolSize; i++) {
      const texture = this.createTexture(w, h);
      this.availableTextures.push(texture);
    }
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.allocations = 0;
    this.reuses = 0;
  }

  /**
   * Dispose all resources
   */
  dispose(): void {
    // Dispose available textures
    this.availableTextures.forEach(texture => {
      this.disposeTexture(texture);
    });
    this.availableTextures = [];

    // Dispose in-use textures
    this.inUseTextures.forEach(texture => {
      this.disposeTexture(texture);
    });
    this.inUseTextures.clear();
  }
}
