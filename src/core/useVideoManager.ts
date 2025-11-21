/**
 * React hook for VideoManager integration
 */

import { useState, useCallback } from 'react';
import { videoManager } from './VideoManager';
import { useAppStore } from '../store/useAppStore';
import type { VideoResource } from '../types';

interface UseVideoManagerReturn {
  importing: boolean;
  error: string | null;
  importVideos: (files: File[]) => Promise<VideoResource[]>;
  importVideo: (file: File) => Promise<VideoResource>;
  removeVideo: (videoId: string) => void;
  clearError: () => void;
  canAddVideos: (count?: number) => boolean;
  remainingSlots: number;
  videoCount: number;
}

/**
 * Hook for managing video imports
 */
export function useVideoManager(): UseVideoManagerReturn {
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const addVideo = useAppStore(state => state.addVideo);
  const removeVideoFromStore = useAppStore(state => state.removeVideo);
  const videos = useAppStore(state => state.videos);

  /**
   * Import multiple videos
   */
  const importVideos = useCallback(async (files: File[]): Promise<VideoResource[]> => {
    setImporting(true);
    setError(null);

    try {
      // Check if we can add these videos
      if (!videoManager.canAddVideos(files.length)) {
        throw new Error(
          `无法添加 ${files.length} 个视频。剩余可用位置：${videoManager.getRemainingSlots()}`
        );
      }

      // Import videos
      const videoResources = await videoManager.importVideos(files);

      // Add to store
      videoResources.forEach(video => {
        addVideo(video);
      });

      return videoResources;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '导入视频失败';
      setError(errorMessage);
      throw err;
    } finally {
      setImporting(false);
    }
  }, [addVideo]);

  /**
   * Import single video
   */
  const importVideo = useCallback(async (file: File): Promise<VideoResource> => {
    setImporting(true);
    setError(null);

    try {
      // Check if we can add this video
      if (!videoManager.canAddVideos(1)) {
        throw new Error(
          `已达到视频数量上限 (${videoManager.getVideoCount()}/20)`
        );
      }

      // Import video
      const videoResource = await videoManager.importVideo(file);

      // Add to store
      addVideo(videoResource);

      return videoResource;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '导入视频失败';
      setError(errorMessage);
      throw err;
    } finally {
      setImporting(false);
    }
  }, [addVideo]);

  /**
   * Remove video
   */
  const removeVideo = useCallback((videoId: string) => {
    try {
      // Release from manager
      videoManager.releaseVideo(videoId);
      
      // Remove from store
      removeVideoFromStore(videoId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '删除视频失败';
      setError(errorMessage);
    }
  }, [removeVideoFromStore]);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Check if can add videos
   */
  const canAddVideos = useCallback((count: number = 1): boolean => {
    return videoManager.canAddVideos(count);
  }, []);

  return {
    importing,
    error,
    importVideos,
    importVideo,
    removeVideo,
    clearError,
    canAddVideos,
    remainingSlots: videoManager.getRemainingSlots(),
    videoCount: videos.size,
  };
}

