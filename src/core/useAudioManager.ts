/**
 * React hook for AudioManager
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { AudioManager, getAudioManager } from './AudioManager';
import type { AudioTrack } from '../types';
import { useAppStore } from '../store/useAppStore';

export interface UseAudioManagerReturn {
  audioManager: AudioManager | null;
  isInitialized: boolean;
  isPlaying: boolean;
  currentTime: number;
  tracks: AudioTrack[];
  initialize: () => Promise<void>;
  loadAudioFile: (file: File) => Promise<AudioBuffer>;
  addTrack: (track: AudioTrack) => void;
  removeTrack: (trackId: string) => void;
  updateTrack: (trackId: string, updates: Partial<AudioTrack>) => void;
  setVolume: (trackId: string, volume: number) => void;
  setVolumeDb: (trackId: string, db: number) => void;
  applyFadeIn: (trackId: string, duration: number) => void;
  applyFadeOut: (trackId: string, duration: number) => void;
  play: (time?: number) => void;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  mixTracks: () => Promise<AudioBuffer | null>;
  generateWaveform: (audioBuffer: AudioBuffer, samples?: number) => ReturnType<AudioManager['generateWaveform']>;
}

/**
 * Hook for managing audio in the application
 */
export function useAudioManager(): UseAudioManagerReturn {
  const audioManagerRef = useRef<AudioManager | null>(null);
  const [audioManager, setAudioManager] = useState<AudioManager | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [tracks, setTracks] = useState<AudioTrack[]>([]);

  // Get timeline state from store
  const timeline = useAppStore(state => state.timeline);
  const currentProject = useAppStore(state => state.currentProject);
  
  // Derive isPlaying from timeline state instead of maintaining separate state
  const isPlaying = timeline.isPlaying && isInitialized;

  // Initialize audio manager
  const initialize = useCallback(async () => {
    if (!audioManagerRef.current) {
      const manager = getAudioManager();
      audioManagerRef.current = manager;
      setAudioManager(manager);
    }

    if (!isInitialized) {
      try {
        await audioManagerRef.current.initialize();
        setIsInitialized(true);
        console.log('AudioManager initialized via hook');
      } catch (error) {
        console.error('Failed to initialize AudioManager:', error);
        throw error;
      }
    }
  }, [isInitialized]);

  // Load audio file
  const loadAudioFile = useCallback(async (file: File): Promise<AudioBuffer> => {
    if (!audioManagerRef.current) {
      throw new Error('AudioManager not initialized');
    }
    return audioManagerRef.current.loadAudioFile(file);
  }, []);

  // Add track
  const addTrack = useCallback((track: AudioTrack) => {
    if (!audioManagerRef.current) return;
    audioManagerRef.current.addTrack(track);
    setTracks(audioManagerRef.current.getTracks());
  }, []);

  // Remove track
  const removeTrack = useCallback((trackId: string) => {
    if (!audioManagerRef.current) return;
    audioManagerRef.current.removeTrack(trackId);
    setTracks(audioManagerRef.current.getTracks());
  }, []);

  // Update track
  const updateTrack = useCallback((trackId: string, updates: Partial<AudioTrack>) => {
    if (!audioManagerRef.current) return;
    audioManagerRef.current.updateTrack(trackId, updates);
    setTracks(audioManagerRef.current.getTracks());
  }, []);

  // Set volume
  const setVolume = useCallback((trackId: string, volume: number) => {
    if (!audioManagerRef.current) return;
    audioManagerRef.current.setVolume(trackId, volume);
  }, []);

  // Set volume in dB
  const setVolumeDb = useCallback((trackId: string, db: number) => {
    if (!audioManagerRef.current) return;
    audioManagerRef.current.setVolumeDb(trackId, db);
  }, []);

  // Apply fade in
  const applyFadeIn = useCallback((trackId: string, duration: number) => {
    if (!audioManagerRef.current) return;
    audioManagerRef.current.applyFadeIn(trackId, duration);
  }, []);

  // Apply fade out
  const applyFadeOut = useCallback((trackId: string, duration: number) => {
    if (!audioManagerRef.current) return;
    audioManagerRef.current.applyFadeOut(trackId, duration);
  }, []);

  // Play
  const play = useCallback((time?: number) => {
    if (!audioManagerRef.current) return;
    const startTime = time ?? currentTime;
    audioManagerRef.current.play(startTime);
    // Note: isPlaying is now derived from timeline.isPlaying
  }, [currentTime]);

  // Pause
  const pause = useCallback(() => {
    if (!audioManagerRef.current) return;
    audioManagerRef.current.pause();
    // Note: isPlaying is now derived from timeline.isPlaying
  }, []);

  // Stop
  const stop = useCallback(() => {
    if (!audioManagerRef.current) return;
    audioManagerRef.current.stop();
    setCurrentTime(0);
    // Note: isPlaying is now derived from timeline.isPlaying
  }, []);

  // Seek
  const seek = useCallback((time: number) => {
    if (!audioManagerRef.current) return;
    audioManagerRef.current.seek(time);
    setCurrentTime(time);
  }, []);

  // Mix tracks
  const mixTracks = useCallback(async (): Promise<AudioBuffer | null> => {
    if (!audioManagerRef.current) {
      throw new Error('AudioManager not initialized');
    }
    return audioManagerRef.current.mixTracks();
  }, []);

  // Generate waveform
  const generateWaveform = useCallback((audioBuffer: AudioBuffer, samples?: number) => {
    if (!audioManagerRef.current) {
      throw new Error('AudioManager not initialized');
    }
    return audioManagerRef.current.generateWaveform(audioBuffer, samples);
  }, []);

  // Sync with timeline state
  // Track previous timeline state to detect changes
  const prevTimelinePlayingRef = useRef(timeline.isPlaying);
  
  useEffect(() => {
    if (!audioManagerRef.current || !isInitialized) return;

    const timelinePlayingChanged = prevTimelinePlayingRef.current !== timeline.isPlaying;
    prevTimelinePlayingRef.current = timeline.isPlaying;

    if (!timelinePlayingChanged) return;

    // Only update external system (AudioManager), not React state
    if (timeline.isPlaying) {
      audioManagerRef.current.play(timeline.currentTime);
    } else {
      audioManagerRef.current.pause();
    }
  }, [timeline.isPlaying, timeline.currentTime, isInitialized]);

  // Update current time periodically when playing
  useEffect(() => {
    if (!isPlaying || !audioManagerRef.current) return;

    const interval = setInterval(() => {
      if (audioManagerRef.current) {
        const time = audioManagerRef.current.getCurrentTime();
        setCurrentTime(time);
      }
    }, 100); // Update every 100ms

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Load tracks from project
  useEffect(() => {
    if (!audioManagerRef.current || !currentProject) return;

    // Clear existing tracks
    const existingTracks = audioManagerRef.current.getTracks();
    existingTracks.forEach(track => {
      audioManagerRef.current?.removeTrack(track.id);
    });

    // Add project tracks
    currentProject.audioTracks.forEach(track => {
      audioManagerRef.current?.addTrack(track);
    });

    setTracks(audioManagerRef.current.getTracks());
  }, [currentProject, currentProject?.audioTracks]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioManagerRef.current) {
        audioManagerRef.current.dispose();
        audioManagerRef.current = null;
        setAudioManager(null);
      }
    };
  }, []);

  return {
    audioManager,
    isInitialized,
    isPlaying,
    currentTime,
    tracks,
    initialize,
    loadAudioFile,
    addTrack,
    removeTrack,
    updateTrack,
    setVolume,
    setVolumeDb,
    applyFadeIn,
    applyFadeOut,
    play,
    pause,
    stop,
    seek,
    mixTracks,
    generateWaveform,
  };
}
