/**
 * VideoTexture - Custom video texture wrapper for time-synchronized video playback
 */
import * as THREE from 'three';

export class VideoTexture extends THREE.VideoTexture {
  private isReady: boolean = false;

  constructor(video: HTMLVideoElement) {
    super(video);
    
    // Configure texture properties
    this.minFilter = THREE.LinearFilter;
    this.magFilter = THREE.LinearFilter;
    this.format = THREE.RGBAFormat;
    this.generateMipmaps = false;
    
    // Wait for video to be ready
    if (video.readyState >= video.HAVE_CURRENT_DATA) {
      this.isReady = true;
    } else {
      video.addEventListener('loadeddata', () => {
        this.isReady = true;
      }, { once: true });
    }
  }

  /**
   * Update video texture to specific time
   * @param currentTime - Target playback time in seconds
   */
  updateTime(currentTime: number): void {
    if (!this.isReady) return;

    const video = this.image as HTMLVideoElement;

    // Sync video element time if needed
    if (Math.abs(video.currentTime - currentTime) > 0.1) {
      video.currentTime = currentTime;
    }

    // Mark texture for update
    this.needsUpdate = true;
  }

  /**
   * Get current video time
   */
  getCurrentTime(): number {
    const video = this.image as HTMLVideoElement;
    return video.currentTime;
  }

  /**
   * Check if video is ready for playback
   */
  isVideoReady(): boolean {
    return this.isReady;
  }

  /**
   * Dispose texture and clean up resources
   */
  dispose(): void {
    super.dispose();
    const video = this.image as HTMLVideoElement;
    video.pause();
    video.src = '';
    video.load();
  }
}
