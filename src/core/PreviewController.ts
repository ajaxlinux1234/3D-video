/**
 * PreviewController - Manages real-time preview playback and controls
 * 
 * This controller handles:
 * - Play/pause/stop/seek operations
 * - Synchronization of all video elements with timeline
 * - Playback loop and time updates
 * - Error handling and logging
 */

import type { SceneManager } from './SceneManager';
import type { Project, VideoResource } from '../types';

export type PlaybackState = 'playing' | 'paused' | 'stopped';

export interface PreviewError {
  type: 'video_sync' | 'playback' | 'render' | 'unknown';
  message: string;
  timestamp: number;
  details?: unknown;
}

export interface PreviewControllerOptions {
  onTimeUpdate?: (time: number) => void;
  onPlaybackStateChange?: (state: PlaybackState) => void;
  onError?: (error: PreviewError) => void;
  onPlaybackEnd?: () => void;
}

export class PreviewController {
  private sceneManager: SceneManager | null = null;
  private project: Project | null = null;
  private videos: Map<string, VideoResource> = new Map();
  
  private playbackState: PlaybackState = 'stopped';
  private currentTime: number = 0;
  private duration: number = 0;
  private playbackRate: number = 1;
  
  private animationFrameId: number | null = null;
  private lastUpdateTime: number = 0;
  private isUpdating: boolean = false;
  
  private errors: PreviewError[] = [];
  private readonly MAX_ERRORS = 50;
  
  private options: PreviewControllerOptions;

  constructor(options: PreviewControllerOptions = {}) {
    this.options = options;
  }

  /**
   * Initialize with scene manager
   */
  setSceneManager(sceneManager: SceneManager | null): void {
    this.sceneManager = sceneManager;
  }

  /**
   * Set project data
   */
  setProject(project: Project | null): void {
    this.project = project;
    this.duration = project?.duration || 0;
    
    // Reset playback if project changes
    if (this.playbackState === 'playing') {
      this.pause();
    }
  }

  /**
   * Set video resources
   */
  setVideos(videos: Map<string, VideoResource>): void {
    this.videos = videos;
  }

  /**
   * Play from current position
   */
  play(): void {
    if (!this.project || !this.sceneManager) {
      this.logError('playback', 'Cannot play: project or scene manager not initialized');
      return;
    }

    if (this.playbackState === 'playing') {
      return; // Already playing
    }

    // If at the end, restart from beginning
    if (this.currentTime >= this.duration) {
      this.currentTime = 0;
    }

    this.playbackState = 'playing';
    this.lastUpdateTime = performance.now();
    this.notifyPlaybackStateChange();
    
    // Start playback loop
    this.startPlaybackLoop();
    
    // Play all active video elements
    this.syncVideoPlayback();
  }

  /**
   * Pause playback
   */
  pause(): void {
    if (this.playbackState === 'stopped') {
      return;
    }

    this.playbackState = 'paused';
    this.notifyPlaybackStateChange();
    
    // Stop playback loop
    this.stopPlaybackLoop();
    
    // Pause all video elements
    this.pauseAllVideos();
  }

  /**
   * Stop playback and reset to beginning
   */
  stop(): void {
    this.playbackState = 'stopped';
    this.currentTime = 0;
    this.notifyPlaybackStateChange();
    this.notifyTimeUpdate();
    
    // Stop playback loop
    this.stopPlaybackLoop();
    
    // Pause and reset all video elements
    this.pauseAllVideos();
    this.syncVideoElements(0);
  }

  /**
   * Seek to specific time
   */
  seek(time: number): void {
    const wasPlaying = this.playbackState === 'playing';
    
    // Pause during seek
    if (wasPlaying) {
      this.pause();
    }

    // Clamp time to valid range
    this.currentTime = Math.max(0, Math.min(time, this.duration));
    this.notifyTimeUpdate();
    
    // Sync all video elements to new time
    this.syncVideoElements(this.currentTime);
    
    // Resume if was playing
    if (wasPlaying) {
      this.play();
    }
  }

  /**
   * Jump forward by delta seconds
   */
  jumpForward(delta: number = 5): void {
    this.seek(this.currentTime + delta);
  }

  /**
   * Jump backward by delta seconds
   */
  jumpBackward(delta: number = 5): void {
    this.seek(this.currentTime - delta);
  }

  /**
   * Set playback rate (speed)
   */
  setPlaybackRate(rate: number): void {
    this.playbackRate = Math.max(0.25, Math.min(rate, 2.0));
    
    // Update all video elements
    this.videos.forEach(video => {
      if (video.videoElement) {
        video.videoElement.playbackRate = this.playbackRate;
      }
    });
  }

  /**
   * Get current playback state
   */
  getPlaybackState(): PlaybackState {
    return this.playbackState;
  }

  /**
   * Get current time
   */
  getCurrentTime(): number {
    return this.currentTime;
  }

  /**
   * Get duration
   */
  getDuration(): number {
    return this.duration;
  }

  /**
   * Get playback rate
   */
  getPlaybackRate(): number {
    return this.playbackRate;
  }

  /**
   * Check if playing
   */
  isPlaying(): boolean {
    return this.playbackState === 'playing';
  }

  /**
   * Get recent errors
   */
  getErrors(): PreviewError[] {
    return [...this.errors];
  }

  /**
   * Clear error log
   */
  clearErrors(): void {
    this.errors = [];
  }

  /**
   * Start playback loop
   */
  private startPlaybackLoop(): void {
    if (this.animationFrameId !== null) {
      return; // Already running
    }

    this.lastUpdateTime = performance.now();
    this.playbackLoop();
  }

  /**
   * Stop playback loop
   */
  private stopPlaybackLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Playback loop - updates time and syncs videos
   */
  private playbackLoop = (): void => {
    if (this.playbackState !== 'playing') {
      this.animationFrameId = null;
      return;
    }

    const now = performance.now();
    const deltaTime = (now - this.lastUpdateTime) / 1000; // Convert to seconds
    this.lastUpdateTime = now;

    // Update current time
    this.currentTime += deltaTime * this.playbackRate;

    // Check if reached end
    if (this.currentTime >= this.duration) {
      this.currentTime = this.duration;
      this.pause();
      this.notifyTimeUpdate();
      this.notifyPlaybackEnd();
      return;
    }

    // Notify time update
    this.notifyTimeUpdate();

    // Sync video elements (throttled)
    if (!this.isUpdating) {
      this.isUpdating = true;
      this.syncVideoElements(this.currentTime);
      this.isUpdating = false;
    }

    // Update scene manager
    if (this.sceneManager) {
      try {
        this.sceneManager.setPlaybackTime(this.currentTime);
      } catch (error) {
        this.logError('render', 'Failed to update scene time', error);
      }
    }

    // Schedule next frame
    this.animationFrameId = requestAnimationFrame(this.playbackLoop);
  };

  /**
   * Sync all video elements to current time
   */
  private syncVideoElements(time: number): void {
    if (!this.project) return;

    this.project.clips.forEach(clip => {
      const video = this.videos.get(clip.videoId);
      if (!video?.videoElement) return;

      const videoElement = video.videoElement;
      
      // Check if clip is active at current time
      const clipStartTime = clip.startTime;
      const clipEndTime = clip.startTime + clip.duration;
      const isActive = time >= clipStartTime && time < clipEndTime;

      try {
        if (isActive) {
          // Calculate video's local time
          const localTime = time - clipStartTime + clip.trimStart;
          
          // Seek if time difference is significant (> 0.1s)
          if (Math.abs(videoElement.currentTime - localTime) > 0.1) {
            videoElement.currentTime = localTime;
          }

          // Ensure playback rate is correct
          if (videoElement.playbackRate !== this.playbackRate) {
            videoElement.playbackRate = this.playbackRate;
          }
        } else {
          // Pause inactive videos
          if (!videoElement.paused) {
            videoElement.pause();
          }
        }
      } catch (error) {
        this.logError('video_sync', `Failed to sync video ${clip.videoId}`, error);
      }
    });
  }

  /**
   * Sync video playback state (play active videos)
   */
  private syncVideoPlayback(): void {
    if (!this.project) return;

    this.project.clips.forEach(clip => {
      const video = this.videos.get(clip.videoId);
      if (!video?.videoElement) return;

      const videoElement = video.videoElement;
      
      // Check if clip is active at current time
      const clipStartTime = clip.startTime;
      const clipEndTime = clip.startTime + clip.duration;
      const isActive = this.currentTime >= clipStartTime && this.currentTime < clipEndTime;

      if (isActive && videoElement.paused) {
        videoElement.play().catch(error => {
          this.logError('playback', `Failed to play video ${clip.videoId}`, error);
        });
      }
    });
  }

  /**
   * Pause all video elements
   */
  private pauseAllVideos(): void {
    this.videos.forEach(video => {
      if (video.videoElement && !video.videoElement.paused) {
        video.videoElement.pause();
      }
    });
  }

  /**
   * Log error
   */
  private logError(
    type: PreviewError['type'],
    message: string,
    details?: unknown
  ): void {
    const error: PreviewError = {
      type,
      message,
      timestamp: Date.now(),
      details,
    };

    this.errors.push(error);
    
    // Limit error log size
    if (this.errors.length > this.MAX_ERRORS) {
      this.errors.shift();
    }

    // Notify callback
    if (this.options.onError) {
      this.options.onError(error);
    }

    // Log to console
    console.error(`[PreviewController] ${type}: ${message}`, details);
  }

  /**
   * Notify time update
   */
  private notifyTimeUpdate(): void {
    if (this.options.onTimeUpdate) {
      this.options.onTimeUpdate(this.currentTime);
    }
  }

  /**
   * Notify playback state change
   */
  private notifyPlaybackStateChange(): void {
    if (this.options.onPlaybackStateChange) {
      this.options.onPlaybackStateChange(this.playbackState);
    }
  }

  /**
   * Notify playback end
   */
  private notifyPlaybackEnd(): void {
    if (this.options.onPlaybackEnd) {
      this.options.onPlaybackEnd();
    }
  }

  /**
   * Dispose and cleanup
   */
  dispose(): void {
    this.stop();
    this.sceneManager = null;
    this.project = null;
    this.videos.clear();
    this.errors = [];
  }
}
