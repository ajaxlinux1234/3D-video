/**
 * LODSystem - Level of Detail system for video textures
 * Adjusts video texture resolution based on viewport distance
 */

import * as THREE from 'three';
import type { VideoPlane } from './VideoPlane';

export type LODLevel = 'high' | 'medium' | 'low';

export interface LODConfig {
  highDistance: number;    // Distance threshold for high quality (default: 5)
  mediumDistance: number;  // Distance threshold for medium quality (default: 10)
  enabled: boolean;
}

export interface LODSettings {
  level: LODLevel;
  resolution: number;      // Resolution multiplier (0.25 - 1.0)
  textureSize: number;     // Texture size in pixels
}

export class LODSystem {
  private config: LODConfig;
  private camera: THREE.Camera;
  private lodLevels: Map<string, LODLevel> = new Map();

  constructor(camera: THREE.Camera, config?: Partial<LODConfig>) {
    this.camera = camera;
    this.config = {
      highDistance: config?.highDistance ?? 5,
      mediumDistance: config?.mediumDistance ?? 10,
      enabled: config?.enabled ?? true,
    };
  }

  /**
   * Update LOD for all video planes based on camera distance
   */
  updateLOD(videoPlanes: Map<string, VideoPlane>): void {
    if (!this.config.enabled) return;

    videoPlanes.forEach((plane, id) => {
      const distance = this.calculateDistance(plane);
      const newLevel = this.determineLODLevel(distance);
      const currentLevel = this.lodLevels.get(id);

      // Only update if level changed
      if (currentLevel !== newLevel) {
        this.applyLOD(plane, newLevel);
        this.lodLevels.set(id, newLevel);
      }
    });
  }

  /**
   * Calculate distance from camera to video plane
   */
  private calculateDistance(plane: VideoPlane): number {
    const planePosition = new THREE.Vector3();
    plane.mesh.getWorldPosition(planePosition);
    
    const cameraPosition = new THREE.Vector3();
    this.camera.getWorldPosition(cameraPosition);

    return planePosition.distanceTo(cameraPosition);
  }

  /**
   * Determine LOD level based on distance
   */
  private determineLODLevel(distance: number): LODLevel {
    if (distance <= this.config.highDistance) {
      return 'high';
    } else if (distance <= this.config.mediumDistance) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Apply LOD settings to video plane
   */
  private applyLOD(plane: VideoPlane, level: LODLevel): void {
    // Get LOD settings for reference
    // const settings = this.getLODSettings(level);
    
    // Update video texture resolution
    if (plane.videoTexture) {
      // Set minFilter based on LOD level
      switch (level) {
        case 'high':
          plane.videoTexture.minFilter = THREE.LinearMipmapLinearFilter;
          plane.videoTexture.magFilter = THREE.LinearFilter;
          break;
        case 'medium':
          plane.videoTexture.minFilter = THREE.LinearFilter;
          plane.videoTexture.magFilter = THREE.LinearFilter;
          break;
        case 'low':
          plane.videoTexture.minFilter = THREE.NearestFilter;
          plane.videoTexture.magFilter = THREE.NearestFilter;
          break;
      }
      
      plane.videoTexture.needsUpdate = true;
    }

    // Update material quality
    if (plane.mesh.material instanceof THREE.ShaderMaterial || 
        plane.mesh.material instanceof THREE.MeshBasicMaterial) {
      // Adjust material precision based on LOD
      const material = plane.mesh.material as THREE.ShaderMaterial;
      if (material.defines) {
        material.defines.LOD_LEVEL = level === 'high' ? 2 : level === 'medium' ? 1 : 0;
        material.needsUpdate = true;
      }
    }
  }

  /**
   * Get LOD settings for a given level
   */
  getLODSettings(level: LODLevel): LODSettings {
    switch (level) {
      case 'high':
        return {
          level: 'high',
          resolution: 1.0,
          textureSize: 2048,
        };
      case 'medium':
        return {
          level: 'medium',
          resolution: 0.5,
          textureSize: 1024,
        };
      case 'low':
        return {
          level: 'low',
          resolution: 0.25,
          textureSize: 512,
        };
    }
  }

  /**
   * Get current LOD level for a plane
   */
  getLODLevel(planeId: string): LODLevel | undefined {
    return this.lodLevels.get(planeId);
  }

  /**
   * Enable or disable LOD system
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    
    // Reset all to high quality if disabled
    if (!enabled) {
      this.lodLevels.clear();
    }
  }

  /**
   * Update LOD configuration
   */
  updateConfig(config: Partial<LODConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get LOD statistics
   */
  getStats(): { high: number; medium: number; low: number } {
    const stats = { high: 0, medium: 0, low: 0 };
    
    this.lodLevels.forEach(level => {
      stats[level]++;
    });

    return stats;
  }

  /**
   * Clear LOD data
   */
  clear(): void {
    this.lodLevels.clear();
  }
}
