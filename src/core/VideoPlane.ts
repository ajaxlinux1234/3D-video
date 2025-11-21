/**
 * VideoPlane - 3D plane with video texture
 */
import * as THREE from 'three';
import { VideoTexture } from './VideoTexture';
import type { Transform3D, Effect } from '../types';

export class VideoPlane {
  public mesh: THREE.Mesh;
  public videoTexture: VideoTexture;
  public material: THREE.MeshBasicMaterial;
  private originalMaterial: THREE.MeshBasicMaterial;
  private clipId: string;
  private highlightMesh: THREE.LineSegments | null = null;
  private isHighlighted: boolean = false;

  constructor(clipId: string, videoElement: HTMLVideoElement, aspectRatio: number = 16 / 9) {
    this.clipId = clipId;

    // Create video texture
    this.videoTexture = new VideoTexture(videoElement);

    // Create material with video texture
    this.material = new THREE.MeshBasicMaterial({
      map: this.videoTexture,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 1.0,
    });

    // Store original material for transition reset
    this.originalMaterial = this.material.clone();

    // Create plane geometry based on aspect ratio
    // Default size: width = 2, height calculated from aspect ratio
    const width = 2;
    const height = width / aspectRatio;
    const geometry = new THREE.PlaneGeometry(width, height);

    // Create mesh
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.userData.clipId = clipId;
  }

  /**
   * Update transform (position, rotation, scale)
   */
  updateTransform(transform: Transform3D): void {
    this.mesh.position.set(
      transform.position.x,
      transform.position.y,
      transform.position.z
    );

    this.mesh.rotation.set(
      transform.rotation.x,
      transform.rotation.y,
      transform.rotation.z
    );

    this.mesh.scale.set(
      transform.scale.x,
      transform.scale.y,
      transform.scale.z
    );
  }

  /**
   * Apply effect to the video plane
   * Note: Full effect implementation will be in EffectProcessor
   */
  applyEffect(effect: Effect): void {
    // Basic effect handling - full implementation in task 8
    // Effects will be properly implemented in the EffectProcessor module
    if (effect.type === 'glow' && effect.enabled) {
      // Glow effect would require MeshStandardMaterial or custom shader
      // This is a placeholder for future implementation
      console.log('Effect applied:', effect.type, effect.intensity);
    }
  }

  /**
   * Set opacity of the video plane
   */
  setOpacity(opacity: number): void {
    this.material.opacity = Math.max(0, Math.min(1, opacity));
  }

  /**
   * Update video texture to specific time
   */
  updateTime(time: number): void {
    this.videoTexture.updateTime(time);
  }

  /**
   * Get clip ID
   */
  getClipId(): string {
    return this.clipId;
  }

  /**
   * Set highlight state (show selection outline)
   */
  setHighlight(highlighted: boolean): void {
    if (highlighted === this.isHighlighted) return;
    
    this.isHighlighted = highlighted;

    if (highlighted) {
      // Create highlight outline if it doesn't exist
      if (!this.highlightMesh) {
        const edges = new THREE.EdgesGeometry(this.mesh.geometry);
        const lineMaterial = new THREE.LineBasicMaterial({ 
          color: 0x00ff00, 
          linewidth: 2,
          transparent: true,
          opacity: 0.8,
        });
        this.highlightMesh = new THREE.LineSegments(edges, lineMaterial);
        this.mesh.add(this.highlightMesh);
      }
      this.highlightMesh.visible = true;
    } else {
      // Hide highlight
      if (this.highlightMesh) {
        this.highlightMesh.visible = false;
      }
    }
  }

  /**
   * Check if plane is highlighted
   */
  isSelected(): boolean {
    return this.isHighlighted;
  }

  /**
   * Check if video is ready
   */
  isReady(): boolean {
    return this.videoTexture.isVideoReady();
  }

  /**
   * Get video texture (for transition shaders)
   */
  getTexture(): THREE.VideoTexture {
    return this.videoTexture;
  }

  /**
   * Restore original material (after transition)
   */
  restoreOriginalMaterial(): void {
    // Dispose current material if it's not the original
    if (this.mesh.material !== this.material) {
      (this.mesh.material as THREE.Material).dispose();
    }
    
    // Restore original material
    this.mesh.material = this.material;
  }

  /**
   * Dispose and clean up resources
   */
  dispose(): void {
    // Dispose highlight mesh
    if (this.highlightMesh) {
      this.highlightMesh.geometry.dispose();
      (this.highlightMesh.material as THREE.Material).dispose();
      this.mesh.remove(this.highlightMesh);
      this.highlightMesh = null;
    }

    this.videoTexture.dispose();
    this.material.dispose();
    this.originalMaterial.dispose();
    this.mesh.geometry.dispose();
  }
}
