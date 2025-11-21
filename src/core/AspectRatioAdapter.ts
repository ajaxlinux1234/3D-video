/**
 * AspectRatioAdapter - Handles 9:16 portrait aspect ratio adaptation for videos
 */
import * as THREE from 'three';
import type { AspectRatioAdaptation } from '../types';

export interface VideoAspectInfo {
  width: number;
  height: number;
  aspectRatio: number;
  isLandscape: boolean;
  isPortrait: boolean;
  needsAdaptation: boolean;
}

export class AspectRatioAdapter {
  // Target aspect ratio for 9:16 portrait
  private static readonly TARGET_ASPECT_RATIO = 9 / 16;
  
  // Safe area margins (percentage from edges)
  private static readonly SAFE_AREA_MARGIN = 0.05; // 5% margin

  /**
   * Analyze video aspect ratio
   */
  static analyzeVideo(videoElement: HTMLVideoElement): VideoAspectInfo {
    const width = videoElement.videoWidth;
    const height = videoElement.videoHeight;
    const aspectRatio = width / height;
    
    return {
      width,
      height,
      aspectRatio,
      isLandscape: aspectRatio > 1,
      isPortrait: aspectRatio < 1,
      needsAdaptation: Math.abs(aspectRatio - this.TARGET_ASPECT_RATIO) > 0.01,
    };
  }

  /**
   * Check if video is landscape (needs adaptation)
   */
  static isLandscape(videoElement: HTMLVideoElement): boolean {
    return videoElement.videoWidth > videoElement.videoHeight;
  }

  /**
   * Get default adaptation mode based on video aspect ratio
   */
  static getDefaultAdaptation(videoElement: HTMLVideoElement): AspectRatioAdaptation {
    const info = this.analyzeVideo(videoElement);
    
    if (!info.needsAdaptation) {
      return {
        mode: 'auto-crop',
        enabled: false,
      };
    }
    
    // Default to auto-crop for landscape videos
    return {
      mode: 'auto-crop',
      enabled: true,
      cropPosition: { x: 0.5, y: 0.5 }, // Center crop
    };
  }

  /**
   * Apply auto-crop mode: intelligently crop landscape video to center area
   */
  static applyAutoCrop(
    mesh: THREE.Mesh,
    videoElement: HTMLVideoElement,
    cropPosition: { x: number; y: number } = { x: 0.5, y: 0.5 }
  ): void {
    const info = this.analyzeVideo(videoElement);
    
    if (!info.isLandscape) {
      // No need to crop portrait videos
      this.resetAdaptation(mesh);
      return;
    }
    
    // Calculate crop dimensions to achieve 9:16 aspect ratio
    const targetAspectRatio = this.TARGET_ASPECT_RATIO;
    
    // Calculate how much to crop from width
    const cropWidth = info.height * targetAspectRatio;
    const cropRatio = cropWidth / info.width;
    
    // Update UV coordinates to crop the texture
    const geometry = mesh.geometry as THREE.PlaneGeometry;
    const uvAttribute = geometry.attributes.uv;
    
    if (uvAttribute) {
      // Calculate UV offset based on crop position
      const uOffset = (1 - cropRatio) * cropPosition.x;
      const uScale = cropRatio;
      
      // Update UV coordinates
      for (let i = 0; i < uvAttribute.count; i++) {
        const u = uvAttribute.getX(i);
        uvAttribute.setX(i, u * uScale + uOffset);
      }
      
      uvAttribute.needsUpdate = true;
    }
    
    // Adjust mesh geometry to maintain 9:16 aspect ratio
    const width = 2;
    const height = width / targetAspectRatio;
    
    geometry.dispose();
    const newGeometry = new THREE.PlaneGeometry(width, height);
    mesh.geometry = newGeometry;
  }

  /**
   * Apply scale-fit mode: scale video proportionally and add letterboxing
   */
  static applyScaleFit(
    mesh: THREE.Mesh,
    videoElement: HTMLVideoElement
  ): void {
    const info = this.analyzeVideo(videoElement);
    
    // Reset UV coordinates
    this.resetAdaptation(mesh);
    
    // Calculate scale to fit within 9:16 bounds
    const targetAspectRatio = this.TARGET_ASPECT_RATIO;
    const sourceAspectRatio = info.aspectRatio;
    
    let scaleX = 1;
    let scaleY = 1;
    
    if (sourceAspectRatio > targetAspectRatio) {
      // Video is wider - fit to width
      scaleY = targetAspectRatio / sourceAspectRatio;
    } else {
      // Video is taller - fit to height
      scaleX = sourceAspectRatio / targetAspectRatio;
    }
    
    // Apply scale to mesh
    mesh.scale.x *= scaleX;
    mesh.scale.y *= scaleY;
    
    // Adjust geometry to 9:16 aspect ratio
    const width = 2;
    const height = width / targetAspectRatio;
    
    const geometry = mesh.geometry as THREE.PlaneGeometry;
    geometry.dispose();
    const newGeometry = new THREE.PlaneGeometry(width, height);
    mesh.geometry = newGeometry;
  }

  /**
   * Apply blur-background mode: scale video as background, original video centered
   * This requires creating additional meshes
   * @param _scene - Scene (reserved for future use)
   * @param mesh - Video mesh
   * @param videoElement - Video element
   * @param _blurIntensity - Blur intensity (reserved for future shader implementation)
   */
  static applyBlurBackground(
    _scene: THREE.Scene,
    mesh: THREE.Mesh,
    videoElement: HTMLVideoElement
  ): THREE.Group {
    
    // Create a group to hold both background and foreground
    const group = new THREE.Group();
    group.userData.isBlurBackgroundGroup = true;
    
    // Create background plane (blurred and scaled to fill)
    const bgGeometry = new THREE.PlaneGeometry(2, 2 / this.TARGET_ASPECT_RATIO);
    const bgMaterial = new THREE.MeshBasicMaterial({
      map: (mesh.material as THREE.MeshBasicMaterial).map,
      transparent: true,
      opacity: 0.6,
    });
    
    const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);
    bgMesh.position.z = -0.1; // Behind the main video
    bgMesh.userData.isBackground = true;
    
    // Apply blur effect (simplified - full blur would require shader)
    // In production, this would use a blur shader pass
    bgMaterial.opacity = 0.6;
    
    group.add(bgMesh);
    
    // Add the original mesh (scaled to fit)
    this.applyScaleFit(mesh, videoElement);
    group.add(mesh);
    
    return group;
  }

  /**
   * Reset adaptation (restore original UV and geometry)
   */
  static resetAdaptation(mesh: THREE.Mesh): void {
    const geometry = mesh.geometry as THREE.PlaneGeometry;
    const uvAttribute = geometry.attributes.uv;
    
    if (uvAttribute) {
      // Reset UV coordinates to default (0,0) to (1,1)
      const uvs = [
        0, 1,  // bottom-left
        1, 1,  // bottom-right
        0, 0,  // top-left
        1, 0,  // top-right
      ];
      
      for (let i = 0; i < uvAttribute.count; i++) {
        uvAttribute.setXY(i, uvs[i * 2], uvs[i * 2 + 1]);
      }
      
      uvAttribute.needsUpdate = true;
    }
  }

  /**
   * Check if clip is outside safe area bounds
   */
  static isOutsideSafeArea(mesh: THREE.Mesh): boolean {
    const position = mesh.position;
    const scale = mesh.scale;
    
    // Calculate bounds
    const geometry = mesh.geometry as THREE.PlaneGeometry;
    const width = geometry.parameters.width * scale.x;
    const height = geometry.parameters.height * scale.y;
    
    const left = position.x - width / 2;
    const right = position.x + width / 2;
    const top = position.y + height / 2;
    const bottom = position.y - height / 2;
    
    // Safe area bounds (9:16 canvas with margin)
    const canvasWidth = 2;
    const canvasHeight = canvasWidth / this.TARGET_ASPECT_RATIO;
    const margin = this.SAFE_AREA_MARGIN;
    
    const safeLeft = -canvasWidth / 2 + canvasWidth * margin;
    const safeRight = canvasWidth / 2 - canvasWidth * margin;
    const safeTop = canvasHeight / 2 - canvasHeight * margin;
    const safeBottom = -canvasHeight / 2 + canvasHeight * margin;
    
    // Check if any part is outside safe area
    return left < safeLeft || right > safeRight || top > safeTop || bottom < safeBottom;
  }

  /**
   * Get safe area bounds for reference lines
   */
  static getSafeAreaBounds(): {
    width: number;
    height: number;
    margin: number;
  } {
    const width = 2;
    const height = width / this.TARGET_ASPECT_RATIO;
    const margin = this.SAFE_AREA_MARGIN;
    
    return {
      width: width * (1 - margin * 2),
      height: height * (1 - margin * 2),
      margin,
    };
  }

  /**
   * Create safe area reference lines mesh
   */
  static createSafeAreaLines(): THREE.LineSegments {
    const bounds = this.getSafeAreaBounds();
    
    const points: THREE.Vector3[] = [];
    const halfWidth = bounds.width / 2;
    const halfHeight = bounds.height / 2;
    
    // Create rectangle outline
    points.push(
      new THREE.Vector3(-halfWidth, halfHeight, 0),
      new THREE.Vector3(halfWidth, halfHeight, 0),
      
      new THREE.Vector3(halfWidth, halfHeight, 0),
      new THREE.Vector3(halfWidth, -halfHeight, 0),
      
      new THREE.Vector3(halfWidth, -halfHeight, 0),
      new THREE.Vector3(-halfWidth, -halfHeight, 0),
      
      new THREE.Vector3(-halfWidth, -halfHeight, 0),
      new THREE.Vector3(-halfWidth, halfHeight, 0)
    );
    
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.5,
      linewidth: 2,
    });
    
    const lines = new THREE.LineSegments(geometry, material);
    lines.userData.isSafeAreaLines = true;
    
    return lines;
  }

  /**
   * Create canvas boundary lines (9:16 frame)
   */
  static createCanvasBoundaryLines(): THREE.LineSegments {
    const width = 2;
    const height = width / this.TARGET_ASPECT_RATIO;
    
    const points: THREE.Vector3[] = [];
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    
    // Create rectangle outline
    points.push(
      new THREE.Vector3(-halfWidth, halfHeight, 0),
      new THREE.Vector3(halfWidth, halfHeight, 0),
      
      new THREE.Vector3(halfWidth, halfHeight, 0),
      new THREE.Vector3(halfWidth, -halfHeight, 0),
      
      new THREE.Vector3(halfWidth, -halfHeight, 0),
      new THREE.Vector3(-halfWidth, -halfHeight, 0),
      
      new THREE.Vector3(-halfWidth, -halfHeight, 0),
      new THREE.Vector3(-halfWidth, halfHeight, 0)
    );
    
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.3,
      linewidth: 1,
    });
    
    const lines = new THREE.LineSegments(geometry, material);
    lines.userData.isCanvasBoundary = true;
    
    return lines;
  }
}
