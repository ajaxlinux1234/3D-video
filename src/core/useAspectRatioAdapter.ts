/**
 * useAspectRatioAdapter - Hook for managing 9:16 aspect ratio adaptation
 */
import { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { SceneManager } from './SceneManager';
import type { AspectRatioAdaptation } from '../types';

export function useAspectRatioAdapter(sceneManager: SceneManager | null) {
  const currentProject = useAppStore(state => state.currentProject);
  const videos = useAppStore(state => state.videos);
  const showSafeArea = useAppStore(state => state.ui.showSafeArea);
  const showWarnings = useAppStore(state => state.ui.showAspectRatioWarnings);
  const [clipsOutsideSafeArea, setClipsOutsideSafeArea] = useState<string[]>([]);

  // Update safe area visibility when setting changes
  useEffect(() => {
    if (!sceneManager) return;
    
    sceneManager.setSafeAreaVisible(showSafeArea);
  }, [sceneManager, showSafeArea]);

  // Check for clips outside safe area
  useEffect(() => {
    if (!sceneManager || !currentProject || !showWarnings) {
      setClipsOutsideSafeArea([]);
      return;
    }

    // Check all clips
    const outsideClips = sceneManager.getClipsOutsideSafeArea();
    setClipsOutsideSafeArea(outsideClips);
  }, [sceneManager, currentProject, showWarnings]);

  // Apply aspect ratio adaptation when clips are updated
  useEffect(() => {
    if (!sceneManager || !currentProject) return;

    currentProject.clips.forEach(clip => {
      if (clip.aspectRatioAdaptation) {
        const video = videos.get(clip.videoId);
        if (video?.videoElement) {
          sceneManager.updateAspectRatioAdaptation(
            clip.id,
            video.videoElement,
            clip.aspectRatioAdaptation
          );
        }
      }
    });
  }, [sceneManager, currentProject, videos]);

  /**
   * Detect and suggest aspect ratio adaptation for a video
   */
  const detectAdaptation = (videoElement: HTMLVideoElement): AspectRatioAdaptation => {
    if (!sceneManager) {
      return {
        mode: 'auto-crop',
        enabled: false,
      };
    }
    
    return sceneManager.detectAspectRatioAdaptation(videoElement);
  };

  /**
   * Check if a specific clip is outside safe area
   */
  const isClipOutsideSafeArea = (clipId: string): boolean => {
    return clipsOutsideSafeArea.includes(clipId);
  };

  return {
    clipsOutsideSafeArea,
    detectAdaptation,
    isClipOutsideSafeArea,
    showSafeArea,
    showWarnings,
  };
}
