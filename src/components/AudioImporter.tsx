/**
 * AudioImporter - Component for importing audio files
 */

import { useRef, useState } from 'react';
import { useAudioManager } from '../core/useAudioManager';
import { useAudioActions } from '../store/useAppStore';
import type { AudioTrack } from '../types';
import './AudioImporter.css';

export function AudioImporter() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { loadAudioFile, initialize, isInitialized } = useAudioManager();
  const { addAudioTrack } = useAudioActions();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setError(null);
    setIsLoading(true);

    try {
      // Initialize audio manager if needed
      if (!isInitialized) {
        await initialize();
      }

      // Process each file
      for (const file of Array.from(files)) {
        await importAudioFile(file);
      }
    } catch (err) {
      console.error('Failed to import audio:', err);
      setError(err instanceof Error ? err.message : 'Failed to import audio');
    } finally {
      setIsLoading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const importAudioFile = async (file: File) => {
    // Validate file type
    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/aac', 'audio/x-m4a'];
    if (!validTypes.includes(file.type)) {
      throw new Error(`Unsupported audio format: ${file.type}`);
    }

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('Audio file too large (max 100MB)');
    }

    // Load audio buffer
    const audioBuffer = await loadAudioFile(file);

    // Create audio track
    const track: AudioTrack = {
      id: crypto.randomUUID(),
      type: 'music',
      source: URL.createObjectURL(file),
      startTime: 0,
      duration: audioBuffer.duration,
      volume: 0.8, // Default 80% volume
      audioBuffer,
    };

    // Add to store
    addAudioTrack(track);

    console.log('Audio imported:', {
      name: file.name,
      duration: audioBuffer.duration,
      channels: audioBuffer.numberOfChannels,
      sampleRate: audioBuffer.sampleRate,
    });
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const files = Array.from(event.dataTransfer.files);
    if (files.length === 0) return;

    setError(null);
    setIsLoading(true);

    try {
      if (!isInitialized) {
        await initialize();
      }

      for (const file of files) {
        if (file.type.startsWith('audio/')) {
          await importAudioFile(file);
        }
      }
    } catch (err) {
      console.error('Failed to import audio:', err);
      setError(err instanceof Error ? err.message : 'Failed to import audio');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div className="audio-importer">
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/mpeg,audio/mp3,audio/wav,audio/aac,audio/x-m4a"
        multiple
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      <div
        className="audio-importer-dropzone"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={handleButtonClick}
      >
        {isLoading ? (
          <div className="audio-importer-loading">
            <div className="spinner"></div>
            <p>Loading audio...</p>
          </div>
        ) : (
          <>
            <div className="audio-importer-icon">🎵</div>
            <p className="audio-importer-text">
              Click or drag audio files here
            </p>
            <p className="audio-importer-hint">
              Supports MP3, WAV, AAC (max 100MB)
            </p>
          </>
        )}
      </div>

      {error && (
        <div className="audio-importer-error">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}
