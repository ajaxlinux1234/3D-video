/**
 * VideoManager - Handles video import, validation, and resource management
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */

import type { VideoResource, VideoMetadata } from '../types';

/**
 * Supported video formats
 */
const SUPPORTED_FORMATS = ['video/mp4', 'video/quicktime', 'video/webm'];
const SUPPORTED_EXTENSIONS = ['.mp4', '.mov', '.webm'];

/**
 * Constants
 */
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const MAX_VIDEO_COUNT = 20;

/**
 * Video validation result
 */
interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * VideoManager class for managing video resources
 */
export class VideoManager {
  private videos: Map<string, VideoResource> = new Map();
  private videoCache: Map<string, HTMLVideoElement> = new Map();
  private preloadQueue: Set<string> = new Set();

  /**
   * Import multiple video files
   */
  async importVideos(files: File[]): Promise<VideoResource[]> {
    const results: VideoResource[] = [];
    
    // Check video count limit
    if (this.videos.size + files.length > MAX_VIDEO_COUNT) {
      throw new Error(`视频数量超过限制。最多支持 ${MAX_VIDEO_COUNT} 个视频，当前已有 ${this.videos.size} 个。`);
    }

    for (const file of files) {
      try {
        const video = await this.importVideo(file);
        results.push(video);
      } catch (error) {
        console.error(`Failed to import video: ${file.name}`, error);
        throw error;
      }
    }

    return results;
  }

  /**
   * Import a single video file
   */
  async importVideo(file: File): Promise<VideoResource> {
    // Validate video
    const validation = await this.validateVideo(file);
    if (!validation.valid) {
      throw new Error(validation.error || '视频验证失败');
    }

    // Create object URL
    const url = URL.createObjectURL(file);

    // Create video element
    const videoElement = document.createElement('video');
    videoElement.preload = 'metadata';
    videoElement.src = url;

    // Wait for metadata to load
    await new Promise<void>((resolve, reject) => {
      videoElement.onloadedmetadata = () => resolve();
      videoElement.onerror = () => reject(new Error('无法加载视频元数据'));
    });

    // Extract metadata
    const metadata = this.extractMetadata(videoElement);

    // Generate thumbnail
    const thumbnail = await this.generateThumbnail(videoElement);

    // Create video resource
    const videoResource: VideoResource = {
      id: crypto.randomUUID(),
      file,
      url,
      metadata,
      thumbnail,
      videoElement,
    };

    // Store in cache
    this.videos.set(videoResource.id, videoResource);
    this.videoCache.set(videoResource.id, videoElement);

    return videoResource;
  }

  /**
   * Validate video file
   */
  async validateVideo(file: File): Promise<ValidationResult> {
    // Check file type
    const isValidMimeType = SUPPORTED_FORMATS.includes(file.type);
    const hasValidExtension = SUPPORTED_EXTENSIONS.some(ext => 
      file.name.toLowerCase().endsWith(ext)
    );

    if (!isValidMimeType && !hasValidExtension) {
      return {
        valid: false,
        error: `不支持的视频格式。支持的格式：MP4, MOV, WebM`,
      };
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      const maxSizeMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);
      return {
        valid: false,
        error: `视频文件过大 (${sizeMB}MB)。最大支持 ${maxSizeMB}MB`,
      };
    }

    return { valid: true };
  }

  /**
   * Extract video metadata
   */
  extractMetadata(video: HTMLVideoElement): VideoMetadata {
    const metadata: VideoMetadata = {
      duration: video.duration,
      width: video.videoWidth,
      height: video.videoHeight,
      fps: 30, // Default, actual FPS detection requires more complex analysis
      codec: 'unknown',
    };

    // Try to detect FPS from video element (limited browser support)
    // This is a simplified approach
    if ('getVideoPlaybackQuality' in video) {
      try {
        const quality = (video as HTMLVideoElement & {
          getVideoPlaybackQuality: () => { totalVideoFrames?: number };
        }).getVideoPlaybackQuality();
        if (quality && quality.totalVideoFrames && video.duration) {
          metadata.fps = Math.round(quality.totalVideoFrames / video.duration);
        }
      } catch {
        // Fallback to default FPS
        console.warn('Could not detect FPS, using default 30fps');
      }
    }

    return metadata;
  }

  /**
   * Generate thumbnail from video first frame
   */
  async generateThumbnail(video: HTMLVideoElement): Promise<string> {
    return new Promise((resolve, reject) => {
      // Create canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('无法创建 Canvas 上下文'));
        return;
      }

      // Set canvas size (thumbnail size)
      const maxWidth = 320;
      const maxHeight = 180;
      const aspectRatio = video.videoWidth / video.videoHeight;

      if (aspectRatio > maxWidth / maxHeight) {
        canvas.width = maxWidth;
        canvas.height = maxWidth / aspectRatio;
      } else {
        canvas.height = maxHeight;
        canvas.width = maxHeight * aspectRatio;
      }

      // Seek to first frame
      video.currentTime = 0;

      const captureFrame = () => {
        try {
          // Draw video frame to canvas
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          // Convert to base64
          const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
          resolve(thumbnail);
        } catch {
          reject(new Error('无法生成缩略图'));
        }
      };

      // Wait for seek to complete
      video.onseeked = captureFrame;
      
      // Fallback if already at position 0
      if (video.currentTime === 0 && video.readyState >= 2) {
        captureFrame();
      }
    });
  }

  /**
   * Get video resource by ID
   */
  getVideo(id: string): VideoResource | null {
    return this.videos.get(id) || null;
  }

  /**
   * Get all videos
   */
  getAllVideos(): VideoResource[] {
    return Array.from(this.videos.values());
  }

  /**
   * Get video count
   */
  getVideoCount(): number {
    return this.videos.size;
  }

  /**
   * Check if can add more videos
   */
  canAddVideos(count: number = 1): boolean {
    return this.videos.size + count <= MAX_VIDEO_COUNT;
  }

  /**
   * Get remaining video slots
   */
  getRemainingSlots(): number {
    return Math.max(0, MAX_VIDEO_COUNT - this.videos.size);
  }

  /**
   * Release video resource
   */
  releaseVideo(id: string): void {
    const video = this.videos.get(id);
    if (video) {
      // Revoke object URL
      URL.revokeObjectURL(video.url);

      // Remove video element
      if (video.videoElement) {
        video.videoElement.src = '';
        video.videoElement.load();
      }

      // Remove from cache
      this.videoCache.delete(id);
      this.videos.delete(id);
      this.preloadQueue.delete(id);
    }
  }

  /**
   * Preload videos for smooth playback
   */
  async preloadVideos(ids: string[]): Promise<void> {
    const preloadPromises = ids.map(async (id) => {
      if (this.preloadQueue.has(id)) {
        return; // Already preloading
      }

      const video = this.videoCache.get(id);
      if (!video) {
        return;
      }

      this.preloadQueue.add(id);

      try {
        // Set preload attribute
        video.preload = 'auto';

        // Wait for enough data to be loaded
        if (video.readyState < 3) {
          await new Promise<void>((resolve) => {
            const onCanPlay = () => {
              video.removeEventListener('canplay', onCanPlay);
              resolve();
            };
            video.addEventListener('canplay', onCanPlay);
          });
        }
      } catch (error) {
        console.error(`Failed to preload video ${id}:`, error);
      } finally {
        this.preloadQueue.delete(id);
      }
    });

    await Promise.all(preloadPromises);
  }

  /**
   * Clear all videos
   */
  clearAll(): void {
    // Release all videos
    const ids = Array.from(this.videos.keys());
    ids.forEach(id => this.releaseVideo(id));
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      totalVideos: this.videos.size,
      cachedVideos: this.videoCache.size,
      preloadingVideos: this.preloadQueue.size,
      remainingSlots: this.getRemainingSlots(),
    };
  }
}

/**
 * Singleton instance
 */
export const videoManager = new VideoManager();

