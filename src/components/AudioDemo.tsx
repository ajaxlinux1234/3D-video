/**
 * AudioDemo - Example component demonstrating audio system usage
 */

import { useState, useEffect } from 'react';
import { useAudioManager } from '../core/useAudioManager';
import { AudioPanel } from './AudioPanel';
import { AudioWaveform } from './AudioWaveform';
import type { WaveformData } from '../core/AudioManager';
import './AudioDemo.css';

export function AudioDemo() {
  const {
    initialize,
    isInitialized,
    isPlaying,
    currentTime,
    tracks,
    play,
    pause,
    stop,
    seek,
    generateWaveform,
  } = useAudioManager();

  const [waveforms, setWaveforms] = useState<Map<string, WaveformData>>(new Map());

  // Initialize on mount
  useEffect(() => {
    initialize().catch(console.error);
  }, [initialize]);

  // Generate waveforms for tracks when they change
  const updateWaveforms = () => {
    const newWaveforms = new Map(waveforms);
    let updated = false;

    tracks.forEach(track => {
      if (track.audioBuffer && !newWaveforms.has(track.id)) {
        const waveformData = generateWaveform(track.audioBuffer, 500);
        newWaveforms.set(track.id, waveformData);
        updated = true;
      }
    });

    if (updated) {
      setWaveforms(newWaveforms);
    }
  };

  // Update waveforms when tracks change
  useEffect(() => {
    updateWaveforms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracks.length]);

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      play(currentTime);
    }
  };

  const handleStop = () => {
    stop();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    seek(time);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const maxDuration = Math.max(...tracks.map(t => t.startTime + t.duration), 10);

  return (
    <div className="audio-demo">
      <div className="audio-demo-header">
        <h2>Audio System Demo</h2>
        <div className="audio-demo-status">
          {isInitialized ? '✅ Initialized' : '⏳ Initializing...'}
        </div>
      </div>

      <div className="audio-demo-content">
        <div className="audio-demo-left">
          <AudioPanel />
        </div>

        <div className="audio-demo-right">
          <div className="audio-demo-playback">
            <h3>Playback Controls</h3>
            
            <div className="audio-demo-controls">
              <button
                onClick={handlePlayPause}
                disabled={!isInitialized || tracks.length === 0}
                className="audio-demo-button primary"
              >
                {isPlaying ? '⏸️ Pause' : '▶️ Play'}
              </button>
              
              <button
                onClick={handleStop}
                disabled={!isInitialized || tracks.length === 0}
                className="audio-demo-button"
              >
                ⏹️ Stop
              </button>

              <div className="audio-demo-time">
                {formatTime(currentTime)} / {formatTime(maxDuration)}
              </div>
            </div>

            <div className="audio-demo-seek">
              <input
                type="range"
                min="0"
                max={maxDuration}
                step="0.1"
                value={currentTime}
                onChange={handleSeek}
                disabled={!isInitialized || tracks.length === 0}
                className="audio-demo-slider"
              />
            </div>
          </div>

          {tracks.length > 0 && (
            <div className="audio-demo-waveforms">
              <h3>Waveforms</h3>
              <div className="audio-demo-waveform-list">
                {tracks.map(track => {
                  const waveformData = waveforms.get(track.id);
                  if (!waveformData) return null;

                  return (
                    <div key={track.id} className="audio-demo-waveform-item">
                      <div className="audio-demo-waveform-label">
                        {track.type.toUpperCase()} - {formatTime(track.duration)}
                      </div>
                      <AudioWaveform
                        waveformData={waveformData}
                        width={600}
                        height={60}
                        currentTime={currentTime - track.startTime}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="audio-demo-info">
            <h3>Features</h3>
            <ul>
              <li>✅ Audio file import (MP3, WAV, AAC)</li>
              <li>✅ Volume control (-60dB to +12dB)</li>
              <li>✅ Fade in/out effects (0.5-3s)</li>
              <li>✅ Multi-track mixing</li>
              <li>✅ Waveform visualization</li>
              <li>✅ Time synchronization</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
