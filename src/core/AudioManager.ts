/**
 * AudioManager - Manages audio processing, mixing, and synchronization
 * 
 * Features:
 * - Web Audio API context management
 * - Audio track extraction from videos
 * - Background music import (MP3, WAV, AAC)
 * - Volume control (-60dB to +12dB)
 * - Fade in/out effects
 * - Multi-track mixing
 * - Time synchronization with video
 */

import type { AudioTrack } from '../types';

export interface AudioManagerOptions {
  sampleRate?: number;
  latencyHint?: AudioContextLatencyCategory;
}

export interface WaveformData {
  peaks: Float32Array;
  duration: number;
  sampleRate: number;
}

/**
 * AudioManager class for handling all audio operations
 */
export class AudioManager {
  private audioContext: AudioContext | null = null;
  private tracks: Map<string, AudioTrack> = new Map();
  private sourceNodes: Map<string, AudioBufferSourceNode> = new Map();
  private gainNodes: Map<string, GainNode> = new Map();
  private masterGain: GainNode | null = null;
  private isInitialized = false;
  private currentTime = 0;
  private isPlaying = false;
  private startedAt = 0;
  private pausedAt = 0;

  /**
   * Initialize the Audio Manager
   */
  async initialize(options: AudioManagerOptions = {}): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Create audio context
      this.audioContext = new AudioContext({
        sampleRate: options.sampleRate || 48000,
        latencyHint: options.latencyHint || 'interactive',
      });

      // Create master gain node
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = 1.0;

      this.isInitialized = true;
      console.log('AudioManager initialized', {
        sampleRate: this.audioContext.sampleRate,
        state: this.audioContext.state,
      });
    } catch (error) {
      console.error('Failed to initialize AudioManager:', error);
      throw new Error('Web Audio API not supported');
    }
  }

  /**
   * Resume audio context if suspended (required for user interaction)
   */
  async resumeContext(): Promise<void> {
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  /**
   * Extract audio from video element
   */
  async extractAudioFromVideo(
    videoElement: HTMLVideoElement,
    videoId: string
  ): Promise<AudioTrack> {
    if (!this.audioContext) {
      throw new Error('AudioManager not initialized');
    }

    try {
      // Get audio buffer from video
      const audioBuffer = await this.decodeAudioFromVideo(videoElement);

      const track: AudioTrack = {
        id: `video-audio-${videoId}`,
        type: 'video',
        source: videoId,
        startTime: 0,
        duration: videoElement.duration,
        volume: 1.0,
        audioBuffer,
      };

      this.tracks.set(track.id, track);
      return track;
    } catch (error) {
      console.error('Failed to extract audio from video:', error);
      throw error;
    }
  }

  /**
   * Decode audio from video element
   * Note: This is a simplified implementation. In production, you would need to
   * extract audio data from the video file using a library or server-side processing.
   */
  private async decodeAudioFromVideo(
    videoElement: HTMLVideoElement
  ): Promise<AudioBuffer> {
    if (!this.audioContext) {
      throw new Error('AudioManager not initialized');
    }

    // Create a silent audio buffer as placeholder
    // In a real implementation, you would extract actual audio from the video
    const duration = videoElement.duration;
    const sampleRate = this.audioContext.sampleRate;
    const audioBuffer = this.audioContext.createBuffer(
      2, // stereo
      Math.ceil(sampleRate * duration),
      sampleRate
    );

    console.warn('decodeAudioFromVideo: Using silent buffer. Implement proper audio extraction.');
    return audioBuffer;
  }

  /**
   * Load audio file (MP3, WAV, AAC)
   */
  async loadAudioFile(file: File): Promise<AudioBuffer> {
    if (!this.audioContext) {
      throw new Error('AudioManager not initialized');
    }

    // Validate file format
    const validFormats = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/aac', 'audio/x-m4a'];
    if (!validFormats.includes(file.type)) {
      throw new Error(`Unsupported audio format: ${file.type}`);
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      return audioBuffer;
    } catch (error) {
      console.error('Failed to load audio file:', error);
      throw new Error('Failed to decode audio file');
    }
  }

  /**
   * Add audio track
   */
  addTrack(track: AudioTrack): void {
    this.tracks.set(track.id, track);
    console.log('Audio track added:', track.id);
  }

  /**
   * Remove audio track
   */
  removeTrack(trackId: string): void {
    // Stop and disconnect if playing
    this.stopTrack(trackId);
    
    // Remove from tracks
    this.tracks.delete(trackId);
    console.log('Audio track removed:', trackId);
  }

  /**
   * Update track properties
   */
  updateTrack(trackId: string, updates: Partial<AudioTrack>): void {
    const existingTrack = this.tracks.get(trackId);
    if (!existingTrack) {
      console.warn('Track not found:', trackId);
      return;
    }

    // Update track
    Object.assign(existingTrack, updates);

    // Update gain node if volume changed
    if (updates.volume !== undefined) {
      const gainNode = this.gainNodes.get(trackId);
      if (gainNode) {
        const dbValue = this.volumeToDb(updates.volume);
        gainNode.gain.value = this.dbToGain(dbValue);
      }
    }
  }

  /**
   * Set track volume (0-1 range)
   */
  setVolume(trackId: string, volume: number): void {
    const track = this.tracks.get(trackId);
    if (!track) return;

    track.volume = Math.max(0, Math.min(1, volume));
    
    const gainNode = this.gainNodes.get(trackId);
    if (gainNode) {
      const dbValue = this.volumeToDb(volume);
      gainNode.gain.value = this.dbToGain(dbValue);
    }
  }

  /**
   * Set track volume in dB (-60 to +12)
   */
  setVolumeDb(trackId: string, db: number): void {
    const clampedDb = Math.max(-60, Math.min(12, db));
    const volume = this.dbToVolume(clampedDb);
    this.setVolume(trackId, volume);
  }

  /**
   * Apply fade in effect
   */
  applyFadeIn(trackId: string, duration: number): void {
    const track = this.tracks.get(trackId);
    if (!track) return;

    track.fadeIn = Math.max(0.5, Math.min(3, duration));
    console.log(`Fade in applied to ${trackId}: ${duration}s`);
  }

  /**
   * Apply fade out effect
   */
  applyFadeOut(trackId: string, duration: number): void {
    const track = this.tracks.get(trackId);
    if (!track) return;

    track.fadeOut = Math.max(0.5, Math.min(3, duration));
    console.log(`Fade out applied to ${trackId}: ${duration}s`);
  }

  /**
   * Play all tracks from specified time
   */
  play(time: number = 0): void {
    if (!this.audioContext || !this.masterGain) {
      console.warn('AudioManager not initialized');
      return;
    }

    this.resumeContext();

    // Stop any currently playing tracks
    this.stopAll();

    this.currentTime = time;
    this.startedAt = this.audioContext.currentTime;
    this.pausedAt = 0;
    this.isPlaying = true;

    // Play each track
    this.tracks.forEach((_track, trackId) => {
      this.playTrack(trackId, time);
    });

    console.log('Audio playback started at', time);
  }

  /**
   * Play individual track
   */
  private playTrack(trackId: string, startTime: number): void {
    const track = this.tracks.get(trackId);
    if (!track || !track.audioBuffer || !this.audioContext || !this.masterGain) {
      return;
    }

    // Check if track should be playing at this time
    const trackEndTime = track.startTime + track.duration;
    if (startTime < track.startTime || startTime >= trackEndTime) {
      return;
    }

    // Create source node
    const source = this.audioContext.createBufferSource();
    source.buffer = track.audioBuffer;

    // Create gain node for this track
    const gainNode = this.audioContext.createGain();
    
    // Set initial volume
    const dbValue = this.volumeToDb(track.volume);
    gainNode.gain.value = this.dbToGain(dbValue);

    // Connect nodes
    source.connect(gainNode);
    gainNode.connect(this.masterGain);

    // Calculate playback parameters
    const offset = startTime - track.startTime;
    const duration = track.duration - offset;

    // Apply fade in
    if (track.fadeIn && offset < track.fadeIn) {
      const fadeInDuration = track.fadeIn - offset;
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(
        this.dbToGain(dbValue),
        this.audioContext.currentTime + fadeInDuration
      );
    }

    // Apply fade out
    if (track.fadeOut) {
      const fadeOutStart = duration - track.fadeOut;
      if (fadeOutStart > 0) {
        gainNode.gain.setValueAtTime(
          this.dbToGain(dbValue),
          this.audioContext.currentTime + fadeOutStart
        );
        gainNode.gain.linearRampToValueAtTime(
          0,
          this.audioContext.currentTime + duration
        );
      }
    }

    // Start playback
    source.start(this.audioContext.currentTime, offset, duration);

    // Store references
    this.sourceNodes.set(trackId, source);
    this.gainNodes.set(trackId, gainNode);

    // Clean up when finished
    source.onended = () => {
      this.stopTrack(trackId);
    };
  }

  /**
   * Pause playback
   */
  pause(): void {
    if (!this.isPlaying || !this.audioContext) return;

    this.pausedAt = this.audioContext.currentTime - this.startedAt + this.currentTime;
    this.isPlaying = false;

    // Stop all tracks
    this.stopAll();

    console.log('Audio playback paused at', this.pausedAt);
  }

  /**
   * Stop playback
   */
  stop(): void {
    this.stopAll();
    this.currentTime = 0;
    this.startedAt = 0;
    this.pausedAt = 0;
    this.isPlaying = false;
    console.log('Audio playback stopped');
  }

  /**
   * Stop all tracks
   */
  private stopAll(): void {
    this.sourceNodes.forEach((_source, trackId) => {
      this.stopTrack(trackId);
    });
  }

  /**
   * Stop individual track
   */
  private stopTrack(trackId: string): void {
    const source = this.sourceNodes.get(trackId);
    const gainNode = this.gainNodes.get(trackId);

    if (source) {
      try {
        source.stop();
        source.disconnect();
      } catch {
        // Already stopped
      }
      this.sourceNodes.delete(trackId);
    }

    if (gainNode) {
      gainNode.disconnect();
      this.gainNodes.delete(trackId);
    }
  }

  /**
   * Seek to specific time
   */
  seek(time: number): void {
    const wasPlaying = this.isPlaying;
    
    if (wasPlaying) {
      this.pause();
    }

    this.currentTime = time;
    this.pausedAt = time;

    if (wasPlaying) {
      this.play(time);
    }
  }

  /**
   * Get current playback time
   */
  getCurrentTime(): number {
    if (!this.audioContext) return 0;

    if (this.isPlaying) {
      return this.currentTime + (this.audioContext.currentTime - this.startedAt);
    }

    return this.pausedAt || this.currentTime;
  }

  /**
   * Mix all tracks into a single audio buffer
   */
  async mixTracks(): Promise<AudioBuffer | null> {
    if (!this.audioContext) {
      throw new Error('AudioManager not initialized');
    }

    // Calculate total duration
    let maxDuration = 0;
    this.tracks.forEach(track => {
      const endTime = track.startTime + track.duration;
      maxDuration = Math.max(maxDuration, endTime);
    });

    if (maxDuration === 0) {
      throw new Error('No audio tracks to mix');
    }

    return this.mixAllTracks(maxDuration);
  }

  /**
   * Mix all tracks into a single audio buffer with specified duration
   */
  async mixAllTracks(duration: number): Promise<AudioBuffer | null> {
    if (!this.audioContext) {
      throw new Error('AudioManager not initialized');
    }

    // Check if there are any tracks with audio buffers
    const tracksWithAudio = Array.from(this.tracks.values()).filter(
      track => track.audioBuffer
    );

    if (tracksWithAudio.length === 0) {
      console.warn('No audio tracks with buffers to mix');
      return null;
    }

    // Create offline context for mixing
    const offlineContext = new OfflineAudioContext(
      2, // stereo
      Math.ceil(this.audioContext.sampleRate * duration),
      this.audioContext.sampleRate
    );

    // Create master gain
    const masterGain = offlineContext.createGain();
    masterGain.connect(offlineContext.destination);

    // Add each track
    this.tracks.forEach(trackData => {
      if (!trackData.audioBuffer) return;

      const source = offlineContext.createBufferSource();
      source.buffer = trackData.audioBuffer;

      const gainNode = offlineContext.createGain();
      const dbValue = this.volumeToDb(trackData.volume);
      gainNode.gain.value = this.dbToGain(dbValue);

      source.connect(gainNode);
      gainNode.connect(masterGain);

      // Apply fade in
      if (trackData.fadeIn) {
        gainNode.gain.setValueAtTime(0, trackData.startTime);
        gainNode.gain.linearRampToValueAtTime(
          this.dbToGain(dbValue),
          trackData.startTime + trackData.fadeIn
        );
      }

      // Apply fade out
      if (trackData.fadeOut) {
        const fadeOutStart = trackData.startTime + trackData.duration - trackData.fadeOut;
        gainNode.gain.setValueAtTime(
          this.dbToGain(dbValue),
          fadeOutStart
        );
        gainNode.gain.linearRampToValueAtTime(
          0,
          trackData.startTime + trackData.duration
        );
      }

      source.start(trackData.startTime);
    });

    // Render mixed audio
    const mixedBuffer = await offlineContext.startRendering();
    console.log('Audio tracks mixed successfully');
    return mixedBuffer;
  }

  /**
   * Generate waveform data for visualization
   */
  generateWaveform(audioBuffer: AudioBuffer, samples: number = 1000): WaveformData {
    const channelData = audioBuffer.getChannelData(0); // Use first channel
    const blockSize = Math.floor(channelData.length / samples);
    const peaks = new Float32Array(samples);

    for (let i = 0; i < samples; i++) {
      const start = i * blockSize;
      const end = start + blockSize;
      let max = 0;

      for (let j = start; j < end; j++) {
        const abs = Math.abs(channelData[j]);
        if (abs > max) {
          max = abs;
        }
      }

      peaks[i] = max;
    }

    return {
      peaks,
      duration: audioBuffer.duration,
      sampleRate: audioBuffer.sampleRate,
    };
  }

  /**
   * Convert volume (0-1) to dB (-60 to +12)
   */
  private volumeToDb(volume: number): number {
    if (volume <= 0) return -60;
    return 20 * Math.log10(volume);
  }

  /**
   * Convert dB to volume (0-1)
   */
  private dbToVolume(db: number): number {
    return Math.pow(10, db / 20);
  }

  /**
   * Convert dB to gain value for Web Audio API
   */
  private dbToGain(db: number): number {
    return Math.pow(10, db / 20);
  }

  /**
   * Get all tracks
   */
  getTracks(): AudioTrack[] {
    return Array.from(this.tracks.values());
  }

  /**
   * Get track by ID
   */
  getTrack(trackId: string): AudioTrack | undefined {
    return this.tracks.get(trackId);
  }

  /**
   * Check if audio is playing
   */
  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Dispose and clean up resources
   */
  dispose(): void {
    this.stopAll();
    
    if (this.masterGain) {
      this.masterGain.disconnect();
      this.masterGain = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.tracks.clear();
    this.isInitialized = false;
    console.log('AudioManager disposed');
  }
}

// Export singleton instance
let audioManagerInstance: AudioManager | null = null;

export function getAudioManager(): AudioManager {
  if (!audioManagerInstance) {
    audioManagerInstance = new AudioManager();
  }
  return audioManagerInstance;
}
