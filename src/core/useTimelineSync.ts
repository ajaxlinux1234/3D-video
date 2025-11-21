import { useEffect, useRef } from 'react';
import { useTimeline, useProject, useVideos } from '../store/useAppStore';
import type { SceneManager } from './SceneManager';

/**
 * Hook to synchronize timeline playback with 3D scene and video elements
 * 
 * This hook:
 * - Updates video element currentTime based on timeline position
 * - Synchronizes all video clips with the timeline
 * - Handles play/pause state for all videos
 * - Updates 3D scene based on timeline state
 */
export const useTimelineSync = (sceneManager: SceneManager | null) => {
  const timeline = useTimeline();
  const project = useProject();
  const videos = useVideos();
  const lastTimeRef = useRef<number>(timeline.currentTime);
  const lastPlayingStateRef = useRef<boolean>(timeline.isPlaying);

  useEffect(() => {
    if (!project || !sceneManager) return;

    const currentTime = timeline.currentTime;
    const timeDelta = Math.abs(currentTime - lastTimeRef.current);
    const playingStateChanged = lastPlayingStateRef.current !== timeline.isPlaying;
    
    // Update video elements for each clip
    project.clips.forEach((clip) => {
      const video = videos.get(clip.videoId);
      if (!video?.videoElement) return;

      const videoElement = video.videoElement;
      
      // Check if this clip is active at current time
      const clipStartTime = clip.startTime;
      const clipEndTime = clip.startTime + clip.duration;
      const isActive = currentTime >= clipStartTime && currentTime < clipEndTime;

      if (isActive) {
        // Calculate the video's local time
        const localTime = currentTime - clipStartTime + clip.trimStart;
        const videoTimeDiff = Math.abs(videoElement.currentTime - localTime);
        
        // Seek if:
        // 1. Timeline jumped (timeDelta > 0.2s)
        // 2. Video is out of sync (> 0.2s difference)
        // 3. Playing state just changed
        if (timeDelta > 0.2 || videoTimeDiff > 0.2 || playingStateChanged) {
          videoElement.currentTime = localTime;
        }

        // Sync play/pause state
        if (timeline.isPlaying) {
          if (videoElement.paused) {
            videoElement.play().catch((err) => {
              console.warn('Failed to play video:', err);
            });
          }
        } else {
          if (!videoElement.paused) {
            videoElement.pause();
          }
        }

        // Set playback rate
        if (Math.abs(videoElement.playbackRate - timeline.playbackRate) > 0.01) {
          videoElement.playbackRate = timeline.playbackRate;
        }
      } else {
        // Pause videos that are not active
        if (!videoElement.paused) {
          videoElement.pause();
        }
      }
    });

    // Update scene manager with current time
    if (sceneManager.setPlaybackTime) {
      sceneManager.setPlaybackTime(currentTime);
    }

    lastTimeRef.current = currentTime;
    lastPlayingStateRef.current = timeline.isPlaying;
  }, [timeline.currentTime, timeline.isPlaying, timeline.playbackRate, project, videos, sceneManager]);

  // Cleanup: pause all videos when component unmounts
  useEffect(() => {
    return () => {
      videos.forEach((video) => {
        if (video.videoElement && !video.videoElement.paused) {
          video.videoElement.pause();
        }
      });
    };
  }, [videos]);

  return {
    currentTime: timeline.currentTime,
    isPlaying: timeline.isPlaying,
    duration: timeline.duration,
  };
};
