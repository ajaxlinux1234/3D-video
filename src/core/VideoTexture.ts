/**
 * VideoTexture - Custom video texture wrapper for time-synchronized video playback
 */
import * as THREE from 'three';

export class VideoTexture extends THREE.VideoTexture {
  private isReady: boolean = false;
  private isPlaying: boolean = false;

  constructor(video: HTMLVideoElement) {
    super(video);
    
    // Configure texture properties
    this.minFilter = THREE.LinearFilter;
    this.magFilter = THREE.LinearFilter;
    this.format = THREE.RGBAFormat;
    this.generateMipmaps = false;
    
    // CRITICAL: Set video to loop and muted for autoplay
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    
    // Wait for video to be ready
    if (video.readyState >= video.HAVE_CURRENT_DATA) {
      this.isReady = true;
      this.ensureVideoPlaying();
    } else {
      video.addEventListener('loadeddata', () => {
        this.isReady = true;
        this.ensureVideoPlaying();
      }, { once: true });
    }
  }

  /**
   * Ensure video is playing (critical for texture updates)
   */
  private async ensureVideoPlaying(): Promise<void> {
    const video = this.image as HTMLVideoElement;
    
    if (video.paused) {
      try {
        await video.play();
        this.isPlaying = true;
        console.log('Video started playing:', video.src.substring(0, 50));
      } catch (error) {
        console.error('Failed to play video:', error);
        this.isPlaying = false;
      }
    }
  }

  /**
   * Update video texture to specific time
   * @param currentTime - Target playback time in seconds
   */
  updateTime(currentTime: number): void {
    if (!this.isReady) return;

    const video = this.image as HTMLVideoElement;

    // Ensure video is playing
    if (video.paused && !this.isPlaying) {
      this.ensureVideoPlaying();
    }

    // Sync video element time if needed
    if (Math.abs(video.currentTime - currentTime) > 0.1) {
      video.currentTime = currentTime;
    }

    // ALWAYS mark texture for update on every frame
    this.needsUpdate = true;
  }

  /**
   * Force texture update (call this every frame during render)
   */
  update(): void {
    this.needsUpdate = true;
  }

  /**
   * Play video
   */
  async play(): Promise<void> {
    const video = this.image as HTMLVideoElement;
    if (video.paused) {
      try {
        await video.play();
        this.isPlaying = true;
      } catch (error) {
        console.error('Failed to play video:', error);
      }
    }
  }

  /**
   * Pause video
   */
  pause(): void {
    const video = this.image as HTMLVideoElement;
    if (!video.paused) {
      video.pause();
      this.isPlaying = false;
    }
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
   * Check if video is playing
   */
  isVideoPlaying(): boolean {
    return this.isPlaying;
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
