/**
 * useTransitionSystem - React hook for managing transitions
 */
import { useEffect, useRef, useCallback } from 'react';
import { TransitionSystem } from './TransitionSystem';
import { SceneManager } from './SceneManager';
import type { Transition, VideoClip } from '../types';

export interface TransitionPlayback {
  fromClipId: string;
  toClipId: string;
  transition: Transition;
  startTime: number;
  endTime: number;
}

export const useTransitionSystem = (sceneManager: SceneManager | null) => {
  const transitionSystemRef = useRef<TransitionSystem | null>(null);
  const activeTransitionsRef = useRef<TransitionPlayback[]>([]);

  // Initialize transition system
  useEffect(() => {
    if (sceneManager && !transitionSystemRef.current) {
      transitionSystemRef.current = new TransitionSystem(sceneManager.getScene());
    }

    return () => {
      if (transitionSystemRef.current) {
        transitionSystemRef.current.dispose();
        transitionSystemRef.current = null;
      }
    };
  }, [sceneManager]);

  /**
   * Add transition between two clips
   */
  const addTransition = useCallback(
    (fromClip: VideoClip, toClip: VideoClip, transition: Transition) => {
      if (!transitionSystemRef.current) return;

      // Calculate transition timing
      const fromEndTime = fromClip.startTime + fromClip.duration;
      const toStartTime = toClip.startTime;

      // Transition should occur at the boundary between clips
      const transitionStartTime = Math.min(fromEndTime, toStartTime);
      const transitionEndTime = transitionStartTime + transition.duration;

      const transitionPlayback: TransitionPlayback = {
        fromClipId: fromClip.id,
        toClipId: toClip.id,
        transition,
        startTime: transitionStartTime,
        endTime: transitionEndTime,
      };

      // Add to active transitions
      activeTransitionsRef.current.push(transitionPlayback);
    },
    []
  );

  /**
   * Remove transition
   */
  const removeTransition = useCallback((fromClipId: string, toClipId: string) => {
    activeTransitionsRef.current = activeTransitionsRef.current.filter(
      (t) => !(t.fromClipId === fromClipId && t.toClipId === toClipId)
    );
  }, []);

  /**
   * Update transitions based on current time
   */
  const updateTransitions = useCallback(
    (currentTime: number) => {
      if (!transitionSystemRef.current || !sceneManager) return;

      // Check each active transition
      activeTransitionsRef.current.forEach((transitionPlayback) => {
        const { fromClipId, toClipId, transition, startTime, endTime } = transitionPlayback;

        // Check if we're in the transition time range
        if (currentTime >= startTime && currentTime <= endTime) {
          // Calculate progress (0 to 1)
          const progress = (currentTime - startTime) / (endTime - startTime);

          // Get video planes
          const fromPlane = sceneManager.getVideoPlane(fromClipId);
          const toPlane = sceneManager.getVideoPlane(toClipId);

          if (fromPlane && toPlane && transitionSystemRef.current) {
            // Apply transition
            transitionSystemRef.current.applyTransition(
              fromPlane,
              toPlane,
              transition,
              progress
            );
          }
        } else if (currentTime > endTime) {
          // Transition complete - reset
          const fromPlane = sceneManager.getVideoPlane(fromClipId);
          const toPlane = sceneManager.getVideoPlane(toClipId);

          if (fromPlane && toPlane && transitionSystemRef.current) {
            transitionSystemRef.current.resetTransition(fromPlane, toPlane);
          }
        }
      });
    },
    [sceneManager]
  );

  /**
   * Clear all transitions
   */
  const clearTransitions = useCallback(() => {
    if (!transitionSystemRef.current || !sceneManager) return;

    // Reset all active transitions
    activeTransitionsRef.current.forEach((transitionPlayback) => {
      const fromPlane = sceneManager.getVideoPlane(transitionPlayback.fromClipId);
      const toPlane = sceneManager.getVideoPlane(transitionPlayback.toClipId);

      if (fromPlane && toPlane) {
        transitionSystemRef.current?.resetTransition(fromPlane, toPlane);
      }
    });

    activeTransitionsRef.current = [];
  }, [sceneManager]);

  /**
   * Get active transitions
   */
  const getActiveTransitions = useCallback(() => {
    return [...activeTransitionsRef.current];
  }, []);

  return {
    addTransition,
    removeTransition,
    updateTransitions,
    clearTransitions,
    getActiveTransitions,
  };
};
