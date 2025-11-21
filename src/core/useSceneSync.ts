import { useEffect, useRef } from 'react';
import type { SceneManager } from './SceneManager';
import { useProject, useVideos } from '../store/useAppStore';

/**
 * Hook to synchronize project clips with 3D scene
 * 
 * This hook:
 * - Adds video clips to the scene when they are added to the project
 * - Removes video clips from the scene when they are removed from the project
 * - Updates clip transforms when they change
 */
export const useSceneSync = (sceneManager: SceneManager | null) => {
  const project = useProject();
  const videos = useVideos();
  const syncedClipsRef = useRef<Set<string>>(new Set());
  
  // Track videos.size to detect changes
  const videosSize = videos.size;

  useEffect(() => {
    if (!sceneManager || !project) {
      console.log('[useSceneSync] Waiting for sceneManager or project', {
        hasSceneManager: !!sceneManager,
        hasProject: !!project
      });
      return;
    }

    console.log('[useSceneSync] Syncing clips', {
      clipCount: project.clips.length,
      videoCount: videos.size,
      syncedCount: syncedClipsRef.current.size
    });

    const currentClipIds = new Set(project.clips.map(clip => clip.id));
    const syncedClipIds = syncedClipsRef.current;

    // Remove clips that are no longer in the project
    syncedClipIds.forEach(clipId => {
      if (!currentClipIds.has(clipId)) {
        sceneManager.removeVideoClip(clipId);
        syncedClipIds.delete(clipId);
        console.log('[useSceneSync] Removed clip from scene:', clipId);
      }
    });

    // Add or update clips
    project.clips.forEach(clip => {
      const video = videos.get(clip.videoId);
      
      console.log('[useSceneSync] Processing clip:', {
        clipId: clip.id,
        videoId: clip.videoId,
        hasVideo: !!video,
        hasVideoElement: !!video?.videoElement,
        videoElementSrc: video?.videoElement?.src,
        videoElementReadyState: video?.videoElement?.readyState
      });
      
      if (!video) {
        console.warn('[useSceneSync] Video not found for clip:', clip.id, 'videoId:', clip.videoId);
        console.warn('[useSceneSync] Available videos:', Array.from(videos.keys()));
        return;
      }
      
      if (!video.videoElement) {
        console.warn('[useSceneSync] Video element not found for clip:', clip.id);
        console.warn('[useSceneSync] Video object:', video);
        return;
      }

      if (!syncedClipIds.has(clip.id)) {
        // Add new clip to scene
        try {
          console.log('[useSceneSync] Adding clip to scene:', clip.id, video.file.name);
          sceneManager.addVideoClip(clip, video.videoElement);
          syncedClipIds.add(clip.id);
          console.log('[useSceneSync] ✓ Successfully added clip to scene:', clip.id);
        } catch (error) {
          console.error('[useSceneSync] ✗ Failed to add clip to scene:', error);
        }
      } else {
        // Update existing clip transform
        sceneManager.updateClipTransform(clip.id, clip.transform);
        
        // Update aspect ratio adaptation if changed
        if (clip.aspectRatioAdaptation) {
          sceneManager.updateAspectRatioAdaptation(
            clip.id,
            video.videoElement,
            clip.aspectRatioAdaptation
          );
        }
      }
    });

    // Update synced clips reference
    syncedClipsRef.current = syncedClipIds;
  }, [sceneManager, project, videos, videosSize]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sceneManager) {
        syncedClipsRef.current.forEach(clipId => {
          sceneManager.removeVideoClip(clipId);
        });
        syncedClipsRef.current.clear();
      }
    };
  }, [sceneManager]);
};
