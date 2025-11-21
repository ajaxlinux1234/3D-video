/**
 * FrustumCulling - Culls video planes outside camera view
 * Only renders visible video clips for performance
 */

import * as THREE from 'three';
import type { VideoPlane } from './VideoPlane';

export interface CullingStats {
  total: number;
  visible: number;
  culled: number;
  cullingRate: number; // Percentage culled
}

export class FrustumCulling {
  private frustum: THREE.Frustum;
  private projectionMatrix: THREE.Matrix4;
  private enabled: boolean = true;
  private stats: CullingStats = {
    total: 0,
    visible: 0,
    culled: 0,
    cullingRate: 0,
  };

  constructor(enabled: boolean = true) {
    this.frustum = new THREE.Frustum();
    this.projectionMatrix = new THREE.Matrix4();
    this.enabled = enabled;
  }

  /**
   * Update frustum from camera
   */
  updateFrustum(camera: THREE.Camera): void {
    if (!this.enabled) return;

    // Update projection matrix
    this.projectionMatrix.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    );

    // Update frustum
    this.frustum.setFromProjectionMatrix(this.projectionMatrix);
  }

  /**
   * Cull video planes based on frustum
   * Returns array of visible plane IDs
   */
  cullPlanes(videoPlanes: Map<string, VideoPlane>): string[] {
    if (!this.enabled) {
      // If culling disabled, all planes are visible
      return Array.from(videoPlanes.keys());
    }

    const visibleIds: string[] = [];
    let totalCount = 0;
    let visibleCount = 0;

    videoPlanes.forEach((plane, id) => {
      totalCount++;

      if (this.isPlaneVisible(plane)) {
        visibleIds.push(id);
        visibleCount++;
        plane.mesh.visible = true;
      } else {
        plane.mesh.visible = false;
      }
    });

    // Update stats
    this.stats = {
      total: totalCount,
      visible: visibleCount,
      culled: totalCount - visibleCount,
      cullingRate: totalCount > 0 ? ((totalCount - visibleCount) / totalCount) * 100 : 0,
    };

    return visibleIds;
  }

  /**
   * Check if a video plane is visible in frustum
   */
  private isPlaneVisible(plane: VideoPlane): boolean {
    // Get bounding box of the plane
    const boundingBox = new THREE.Box3();
    
    // Update world matrix
    plane.mesh.updateMatrixWorld(true);
    
    // Compute bounding box from geometry
    if (plane.mesh.geometry.boundingBox === null) {
      plane.mesh.geometry.computeBoundingBox();
    }

    if (plane.mesh.geometry.boundingBox) {
      boundingBox.copy(plane.mesh.geometry.boundingBox);
      boundingBox.applyMatrix4(plane.mesh.matrixWorld);
    }

    // Check if bounding box intersects frustum
    return this.frustum.intersectsBox(boundingBox);
  }

  /**
   * Check if a specific plane is visible
   */
  isVisible(plane: VideoPlane): boolean {
    if (!this.enabled) return true;
    return this.isPlaneVisible(plane);
  }

  /**
   * Enable or disable frustum culling
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;

    // Reset stats when toggling
    if (!enabled) {
      this.stats = {
        total: 0,
        visible: 0,
        culled: 0,
        cullingRate: 0,
      };
    }
  }

  /**
   * Get culling statistics
   */
  getStats(): CullingStats {
    return { ...this.stats };
  }

  /**
   * Check if culling is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      total: 0,
      visible: 0,
      culled: 0,
      cullingRate: 0,
    };
  }
}
