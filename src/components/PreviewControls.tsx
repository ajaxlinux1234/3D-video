/**
 * PreviewControls - Playback control panel for preview
 * 
 * Features:
 * - Play/Pause/Stop buttons
 * - Seek bar with time display
 * - Playback rate control
 * - Jump forward/backward buttons
 * - Keyboard shortcuts
 */

import { useEffect, useCallback } from 'react';
import type { PreviewController } from '../core/PreviewController';
import './PreviewControls.css';

export interface PreviewControlsProps {
  controller: PreviewController | null;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  playbackRate?: number;
  onPlay?: () => void;
  onPause?: () => void;
  onStop?: () => void;
  onSeek?: (time: number) => void;
  onJumpForward?: () => void;
  onJumpBackward?: () => void;
  onPlaybackRateChange?: (rate: number) => void;
}

export function PreviewControls({
  controller,
  currentTime,
  duration,
  isPlaying,
  playbackRate = 1,
  onPlay,
  onPause,
  onStop,
  onSeek,
  onJumpForward,
  onJumpBackward,
  onPlaybackRateChange,
}: PreviewControlsProps) {
  
  // Format time as MM:SS.ms
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  // Handle seek bar change
  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    onSeek?.(time);
  };

  // Handle playback rate change
  const handlePlaybackRateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const rate = parseFloat(e.target.value);
    onPlaybackRateChange?.(rate);
  };

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore if typing in input
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    switch (e.key) {
      case ' ':
      case 'k':
        e.preventDefault();
        if (isPlaying) {
          onPause?.();
        } else {
          onPlay?.();
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        onJumpBackward?.();
        break;
      case 'ArrowRight':
        e.preventDefault();
        onJumpForward?.();
        break;
      case 'Home':
        e.preventDefault();
        onSeek?.(0);
        break;
      case 'End':
        e.preventDefault();
        onSeek?.(duration);
        break;
      case 'Escape':
        e.preventDefault();
        onStop?.();
        break;
    }
  }, [isPlaying, duration, onPlay, onPause, onStop, onSeek, onJumpForward, onJumpBackward]);

  // Register keyboard shortcuts
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="preview-controls">
      <div className="controls-main">
        {/* Transport controls */}
        <div className="transport-controls">
          <button
            className="control-button"
            onClick={onStop}
            title="Stop (Esc)"
            disabled={!controller}
          >
            <span className="icon">⏹</span>
          </button>
          
          <button
            className="control-button"
            onClick={onJumpBackward}
            title="Jump Backward 5s (←)"
            disabled={!controller}
          >
            <span className="icon">⏪</span>
          </button>
          
          <button
            className="control-button primary"
            onClick={isPlaying ? onPause : onPlay}
            title={isPlaying ? 'Pause (Space/K)' : 'Play (Space/K)'}
            disabled={!controller}
          >
            <span className="icon">{isPlaying ? '⏸' : '▶'}</span>
          </button>
          
          <button
            className="control-button"
            onClick={onJumpForward}
            title="Jump Forward 5s (→)"
            disabled={!controller}
          >
            <span className="icon">⏩</span>
          </button>
        </div>

        {/* Time display */}
        <div className="time-display">
          <span className="time-current">{formatTime(currentTime)}</span>
          <span className="time-separator">/</span>
          <span className="time-duration">{formatTime(duration)}</span>
        </div>

        {/* Playback rate */}
        <div className="playback-rate">
          <label htmlFor="playback-rate">Speed:</label>
          <select
            id="playback-rate"
            value={playbackRate}
            onChange={handlePlaybackRateChange}
            disabled={!controller}
          >
            <option value="0.25">0.25x</option>
            <option value="0.5">0.5x</option>
            <option value="0.75">0.75x</option>
            <option value="1">1x</option>
            <option value="1.25">1.25x</option>
            <option value="1.5">1.5x</option>
            <option value="2">2x</option>
          </select>
        </div>
      </div>

      {/* Seek bar */}
      <div className="seek-bar-container">
        <input
          type="range"
          className="seek-bar"
          min="0"
          max={duration}
          step="0.01"
          value={currentTime}
          onChange={handleSeekChange}
          disabled={!controller || duration === 0}
          style={{
            background: `linear-gradient(to right, #4CAF50 0%, #4CAF50 ${progress}%, #333 ${progress}%, #333 100%)`
          }}
        />
        <div className="seek-bar-progress" style={{ width: `${progress}%` }} />
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="shortcuts-hint">
        <span>Space: Play/Pause</span>
        <span>←/→: Jump</span>
        <span>Home/End: Start/End</span>
        <span>Esc: Stop</span>
      </div>
    </div>
  );
}
