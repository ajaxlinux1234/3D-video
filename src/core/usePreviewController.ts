/**
 * usePreviewController - React hook for PreviewController
 * 
 * Manages real-time preview playback with automatic synchronization
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { PreviewController, type PlaybackState, type PreviewError } from './PreviewController';
import { useProject, useVideos, useAppStore } from '../store/useAppStore';
import type { SceneManager } from './SceneManager';

export interface UsePreviewControllerOptions {
  sceneManager: SceneManager | null;
  autoSync?: boolean;
}

export function usePreviewController(options: UsePreviewControllerOptions) {
  const { sceneManager, autoSync = true } = options;
  
  const controllerRef = useRef<PreviewController | null>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState>('stopped');
  const [currentTime, setCurrentTime] = useState(0);
  const [errors, setErrors] = useState<PreviewError[]>([]);
  
  const project = useProject();
  const videos = useVideos();
  const { setCurrentTime: setStoreTime, play: playStore, pause: pauseStore } = useAppStore.getState();

  // Initialize controller
  useEffect(() => {
    const controller = new PreviewController({
      onTimeUpdate: (time) => {
        setCurrentTime(time);
        if (autoSync) {
          setStoreTime(time);
        }
      },
      onPlaybackStateChange: (state) => {
        setPlaybackState(state);
        if (autoSync) {
          if (state === 'playing') {
            playStore();
          } else {
            pauseStore();
          }
        }
      },
      onError: (error) => {
        setErrors(prev => [...prev, error].slice(-50));
      },
      onPlaybackEnd: () => {
        console.log('Playback ended');
      },
    });

    controllerRef.current = controller;

    return () => {
      controller.dispose();
      controllerRef.current = null;
    };
  }, [autoSync, setStoreTime, playStore, pauseStore]);

  // Update scene manager
  useEffect(() => {
    if (controllerRef.current) {
      controllerRef.current.setSceneManager(sceneManager);
    }
  }, [sceneManager]);

  // Update project
  useEffect(() => {
    if (controllerRef.current) {
      controllerRef.current.setProject(project);
    }
  }, [project]);

  // Update videos
  useEffect(() => {
    if (controllerRef.current) {
      controllerRef.current.setVideos(videos);
    }
  }, [videos]);

  // Control functions
  const play = useCallback(() => {
    controllerRef.current?.play();
  }, []);

  const pause = useCallback(() => {
    controllerRef.current?.pause();
  }, []);

  const stop = useCallback(() => {
    controllerRef.current?.stop();
  }, []);

  const seek = useCallback((time: number) => {
    controllerRef.current?.seek(time);
  }, []);

  const jumpForward = useCallback((delta?: number) => {
    controllerRef.current?.jumpForward(delta);
  }, []);

  const jumpBackward = useCallback((delta?: number) => {
    controllerRef.current?.jumpBackward(delta);
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    controllerRef.current?.setPlaybackRate(rate);
  }, []);

  const togglePlayPause = useCallback(() => {
    if (playbackState === 'playing') {
      pause();
    } else {
      play();
    }
  }, [playbackState, play, pause]);

  const clearErrors = useCallback(() => {
    controllerRef.current?.clearErrors();
    setErrors([]);
  }, []);

  return {
    // State
    playbackState,
    currentTime,
    duration: project?.duration || 0,
    isPlaying: playbackState === 'playing',
    errors,
    
    // Controls
    play,
    pause,
    stop,
    seek,
    jumpForward,
    jumpBackward,
    togglePlayPause,
    setPlaybackRate,
    clearErrors,
    
    // Controller reference
    controller: controllerRef.current,
  };
}
