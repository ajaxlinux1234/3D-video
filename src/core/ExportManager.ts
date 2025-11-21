/**
 * ExportManager - Handles video export with FFmpeg.wasm
 */
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import type { Project, ExportSettings } from '../types';
import { FrameCapture } from './FrameCapture';
import { SceneManager } from './SceneManager';
import { AudioManager } from './AudioManager';

export interface ExportProgress {
  phase: 'preparing' | 'rendering' | 'encoding' | 'complete' | 'error';
  progress: number; // 0-100
  currentFrame?: number;
  totalFrames?: number;
  estimatedTimeRemaining?: number; // seconds
  message?: string;
}

export interface ExportResult {
  success: boolean;
  blob?: Blob;
  error?: string;
  duration?: number; // Export duration in seconds
}

export class ExportManager {
  private ffmpeg: FFmpeg;
  private frameCapture: FrameCapture;
  private isInitialized: boolean = false;
  private isCancelled: boolean = false;
  private startTime: number = 0;
  // Worker support reserved for future implementation
  // private exportWorker: Worker | null = null;
  // private useWorker: boolean = true;
  
  constructor(sceneManager: SceneManager) {
    this.ffmpeg = new FFmpeg();
    this.frameCapture = new FrameCapture(sceneManager);
  }

  /**
   * Initialize FFmpeg.wasm
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load FFmpeg with progress callback
      this.ffmpeg.on('log', ({ message }) => {
        console.log('[FFmpeg]', message);
      });

      // Load FFmpeg core
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
      await this.ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });

      this.isInitialized = true;
      console.log('FFmpeg initialized successfully');
    } catch (error) {
      console.error('Failed to initialize FFmpeg:', error);
      throw new Error('Failed to initialize FFmpeg: ' + (error as Error).message);
    }
  }

  /**
   * Export video with given settings
   */
  async exportVideo(
    project: Project,
    settings: ExportSettings,
    audioManager: AudioManager,
    onProgress: (progress: ExportProgress) => void
  ): Promise<ExportResult> {
    this.isCancelled = false;
    this.startTime = Date.now();

    try {
      // Ensure FFmpeg is initialized
      if (!this.isInitialized) {
        onProgress({
          phase: 'preparing',
          progress: 0,
          message: 'Initializing FFmpeg...',
        });
        await this.initialize();
      }

      // Calculate total frames
      const totalFrames = Math.ceil(project.duration * settings.fps);
      
      onProgress({
        phase: 'preparing',
        progress: 5,
        totalFrames,
        message: 'Preparing export...',
      });

      // Get resolution dimensions
      const { width, height } = this.getResolutionDimensions(settings.resolution);

      // Phase 1: Render frames
      onProgress({
        phase: 'rendering',
        progress: 10,
        currentFrame: 0,
        totalFrames,
        message: 'Rendering frames...',
      });

      const frames = await this.renderFrames(
        project,
        settings,
        width,
        height,
        (currentFrame) => {
          if (this.isCancelled) throw new Error('Export cancelled');
          
          const renderProgress = 10 + (currentFrame / totalFrames) * 50;
          const elapsed = (Date.now() - this.startTime) / 1000;
          const estimatedTotal = (elapsed / currentFrame) * totalFrames;
          const estimatedRemaining = estimatedTotal - elapsed;

          onProgress({
            phase: 'rendering',
            progress: renderProgress,
            currentFrame,
            totalFrames,
            estimatedTimeRemaining: estimatedRemaining,
            message: `Rendering frame ${currentFrame}/${totalFrames}...`,
          });
        }
      );

      if (this.isCancelled) {
        return { success: false, error: 'Export cancelled by user' };
      }

      // Phase 2: Mix audio
      onProgress({
        phase: 'rendering',
        progress: 65,
        message: 'Mixing audio...',
      });

      const audioBlob = await this.mixAudio(project, audioManager);

      // Phase 3: Encode with FFmpeg
      onProgress({
        phase: 'encoding',
        progress: 70,
        message: 'Encoding video...',
      });

      const videoBlob = await this.encodeVideo(
        frames,
        audioBlob,
        settings,
        width,
        height,
        (encodingProgress) => {
          const progress = 70 + encodingProgress * 0.25;
          onProgress({
            phase: 'encoding',
            progress,
            message: 'Encoding video with FFmpeg...',
          });
        }
      );

      if (this.isCancelled) {
        return { success: false, error: 'Export cancelled by user' };
      }

      // Complete
      const duration = (Date.now() - this.startTime) / 1000;
      onProgress({
        phase: 'complete',
        progress: 100,
        message: 'Export complete!',
      });

      return {
        success: true,
        blob: videoBlob,
        duration,
      };

    } catch (error) {
      console.error('Export failed:', error);
      
      onProgress({
        phase: 'error',
        progress: 0,
        message: (error as Error).message,
      });

      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Render all frames for the project
   */
  private async renderFrames(
    project: Project,
    settings: ExportSettings,
    width: number,
    height: number,
    onFrameRendered: (frameNumber: number) => void
  ): Promise<ImageData[]> {
    const frames: ImageData[] = [];
    const totalFrames = Math.ceil(project.duration * settings.fps);
    const frameDuration = 1 / settings.fps;

    for (let i = 0; i < totalFrames; i++) {
      if (this.isCancelled) break;

      const time = i * frameDuration;
      const frame = await this.frameCapture.captureFrame(time, width, height);
      frames.push(frame);

      onFrameRendered(i + 1);
    }

    return frames;
  }

  /**
   * Mix all audio tracks into a single audio stream
   */
  private async mixAudio(
    project: Project,
    audioManager: AudioManager
  ): Promise<Blob | null> {
    try {
      // Use AudioManager to mix all tracks
      const mixedBuffer = await audioManager.mixAllTracks(project.duration);
      
      if (!mixedBuffer) {
        console.warn('No audio to mix');
        return null;
      }

      // Convert AudioBuffer to WAV blob
      return this.audioBufferToWav(mixedBuffer);
    } catch (error) {
      console.error('Failed to mix audio:', error);
      return null;
    }
  }

  /**
   * Convert AudioBuffer to WAV Blob
   */
  private audioBufferToWav(audioBuffer: AudioBuffer): Blob {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length * numberOfChannels * 2;
    const buffer = new ArrayBuffer(44 + length);
    const view = new DataView(buffer);
    const channels: Float32Array[] = [];
    let offset = 0;
    let pos = 0;

    // Write WAV header
    const setUint16 = (data: number) => {
      view.setUint16(pos, data, true);
      pos += 2;
    };
    const setUint32 = (data: number) => {
      view.setUint32(pos, data, true);
      pos += 4;
    };

    // RIFF identifier
    setUint32(0x46464952);
    // File length
    setUint32(36 + length);
    // RIFF type
    setUint32(0x45564157);
    // Format chunk identifier
    setUint32(0x20746d66);
    // Format chunk length
    setUint32(16);
    // Sample format (PCM)
    setUint16(1);
    // Channel count
    setUint16(numberOfChannels);
    // Sample rate
    setUint32(audioBuffer.sampleRate);
    // Byte rate
    setUint32(audioBuffer.sampleRate * numberOfChannels * 2);
    // Block align
    setUint16(numberOfChannels * 2);
    // Bits per sample
    setUint16(16);
    // Data chunk identifier
    setUint32(0x61746164);
    // Data chunk length
    setUint32(length);

    // Get channel data
    for (let i = 0; i < numberOfChannels; i++) {
      channels.push(audioBuffer.getChannelData(i));
    }

    // Interleave channels and write to buffer
    while (pos < buffer.byteLength) {
      for (let i = 0; i < numberOfChannels; i++) {
        let sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }

    return new Blob([buffer], { type: 'audio/wav' });
  }

  /**
   * Encode frames and audio into MP4 using FFmpeg
   */
  private async encodeVideo(
    frames: ImageData[],
    audioBlob: Blob | null,
    settings: ExportSettings,
    width: number,
    height: number,
    onProgress: (progress: number) => void
  ): Promise<Blob> {
    try {
      // Write frames as PNG images
      for (let i = 0; i < frames.length; i++) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.putImageData(frames[i], 0, 0);

        const blob = await new Promise<Blob>((resolve) =>
          canvas.toBlob((b) => resolve(b!), 'image/png')
        );

        const fileName = `frame${String(i).padStart(6, '0')}.png`;
        await this.ffmpeg.writeFile(fileName, await fetchFile(blob));

        onProgress(i / frames.length);
      }

      // Write audio if available
      const hasAudio = audioBlob !== null;
      if (hasAudio && audioBlob) {
        await this.ffmpeg.writeFile('audio.wav', await fetchFile(audioBlob));
      }

      // Build FFmpeg command
      const inputArgs = [
        '-framerate', String(settings.fps),
        '-i', 'frame%06d.png',
      ];

      if (hasAudio) {
        inputArgs.push('-i', 'audio.wav');
      }

      const outputArgs = [
        '-c:v', settings.codec === 'h265' ? 'libx265' : 'libx264',
        '-preset', 'medium',
        '-crf', '23',
        '-pix_fmt', 'yuv420p',
        '-vf', `scale=${width}:${height}`,
      ];

      if (hasAudio) {
        outputArgs.push(
          '-c:a', 'aac',
          '-b:a', '192k',
          '-shortest'
        );
      }

      outputArgs.push('output.mp4');

      // Execute FFmpeg
      await this.ffmpeg.exec([...inputArgs, ...outputArgs]);

      // Read output file
      const data = await this.ffmpeg.readFile('output.mp4');
      // Create blob from data
      const videoBlob = new Blob([data as BlobPart], { type: 'video/mp4' });

      // Clean up files
      await this.cleanup(frames.length);

      return videoBlob;

    } catch (error) {
      console.error('FFmpeg encoding failed:', error);
      throw new Error('Video encoding failed: ' + (error as Error).message);
    }
  }

  /**
   * Clean up temporary files in FFmpeg filesystem
   */
  private async cleanup(frameCount: number): Promise<void> {
    try {
      // Delete frame files
      for (let i = 0; i < frameCount; i++) {
        const fileName = `frame${String(i).padStart(6, '0')}.png`;
        try {
          await this.ffmpeg.deleteFile(fileName);
        } catch {
          // Ignore errors
        }
      }

      // Delete audio file
      try {
        await this.ffmpeg.deleteFile('audio.wav');
      } catch {
        // Ignore errors
      }

      // Delete output file
      try {
        await this.ffmpeg.deleteFile('output.mp4');
      } catch {
        // Ignore errors
      }
    } catch (error) {
      console.warn('Cleanup failed:', error);
    }
  }

  /**
   * Get resolution dimensions
   */
  private getResolutionDimensions(resolution: string): { width: number; height: number } {
    switch (resolution) {
      case '720p':
        return { width: 720, height: 1280 }; // 9:16
      case '1080p':
        return { width: 1080, height: 1920 }; // 9:16
      case '2k':
        return { width: 1440, height: 2560 }; // 9:16
      default:
        return { width: 1080, height: 1920 };
    }
  }

  /**
   * Cancel ongoing export
   */
  cancel(): void {
    this.isCancelled = true;
  }

  /**
   * Check if export is cancelled
   */
  isCancelRequested(): boolean {
    return this.isCancelled;
  }

  /**
   * Initialize export worker
   * Note: Worker initialization is deferred until first use for better performance
   */

  /**
   * Enable or disable worker usage
   * Note: Worker support is reserved for future implementation
   */
  setUseWorker(use: boolean): void {
    // Worker support will be implemented in a future update
    console.log(`Worker support is not yet implemented (requested: ${use})`);
  }

  /**
   * Dispose and clean up
   */
  dispose(): void {
    this.isCancelled = true;
    this.frameCapture.dispose();
  }
}
