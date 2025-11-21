/**
 * AudioPanel - Component for managing audio tracks
 */

import { useState, useEffect } from 'react';
import { useAudioManager } from '../core/useAudioManager';
import { useAppStore, useAudioActions } from '../store/useAppStore';
import { AudioImporter } from './AudioImporter';
import type { AudioTrack } from '../types';
import './AudioPanel.css';

interface AudioTrackItemProps {
  track: AudioTrack;
  onRemove: (trackId: string) => void;
  onVolumeChange: (trackId: string, volume: number) => void;
  onFadeInChange: (trackId: string, duration: number) => void;
  onFadeOutChange: (trackId: string, duration: number) => void;
}

function AudioTrackItem({
  track,
  onRemove,
  onVolumeChange,
  onFadeInChange,
  onFadeOutChange,
}: AudioTrackItemProps) {
  const [volumeDb, setVolumeDb] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Convert volume to dB for display
  useEffect(() => {
    const db = track.volume > 0 ? 20 * Math.log10(track.volume) : -60;
    setVolumeDb(Math.round(db));
  }, [track.volume]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const db = parseFloat(e.target.value);
    const volume = Math.pow(10, db / 20);
    onVolumeChange(track.id, volume);
  };

  const handleFadeInChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const duration = parseFloat(e.target.value);
    onFadeInChange(track.id, duration);
  };

  const handleFadeOutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const duration = parseFloat(e.target.value);
    onFadeOutChange(track.id, duration);
  };

  const getTrackIcon = () => {
    switch (track.type) {
      case 'video':
        return '🎬';
      case 'music':
        return '🎵';
      case 'sfx':
        return '🔊';
      default:
        return '🎵';
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="audio-track-item">
      <div className="audio-track-header">
        <div className="audio-track-info">
          <span className="audio-track-icon">{getTrackIcon()}</span>
          <div className="audio-track-details">
            <div className="audio-track-type">{track.type.toUpperCase()}</div>
            <div className="audio-track-duration">
              {formatDuration(track.duration)}
            </div>
          </div>
        </div>
        <div className="audio-track-actions">
          <button
            className="audio-track-toggle"
            onClick={() => setShowAdvanced(!showAdvanced)}
            title="Advanced settings"
          >
            ⚙️
          </button>
          <button
            className="audio-track-remove"
            onClick={() => onRemove(track.id)}
            title="Remove track"
          >
            🗑️
          </button>
        </div>
      </div>

      <div className="audio-track-controls">
        <div className="audio-control-group">
          <label className="audio-control-label">
            Volume: {volumeDb > 0 ? '+' : ''}{volumeDb} dB
          </label>
          <input
            type="range"
            min="-60"
            max="12"
            step="1"
            value={volumeDb}
            onChange={handleVolumeChange}
            className="audio-slider"
          />
        </div>
      </div>

      {showAdvanced && (
        <div className="audio-track-advanced">
          <div className="audio-control-group">
            <label className="audio-control-label">
              Fade In: {track.fadeIn?.toFixed(1) || 0}s
            </label>
            <input
              type="range"
              min="0"
              max="3"
              step="0.1"
              value={track.fadeIn || 0}
              onChange={handleFadeInChange}
              className="audio-slider"
            />
          </div>

          <div className="audio-control-group">
            <label className="audio-control-label">
              Fade Out: {track.fadeOut?.toFixed(1) || 0}s
            </label>
            <input
              type="range"
              min="0"
              max="3"
              step="0.1"
              value={track.fadeOut || 0}
              onChange={handleFadeOutChange}
              className="audio-slider"
            />
          </div>

          <div className="audio-track-timeline">
            <div className="audio-track-timeline-label">
              Start: {formatDuration(track.startTime)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function AudioPanel() {
  const currentProject = useAppStore(state => state.currentProject);
  const { removeAudioTrack, updateAudioTrack } = useAudioActions();
  const { setVolume, applyFadeIn, applyFadeOut, initialize, isInitialized } = useAudioManager();

  const audioTracks = currentProject?.audioTracks || [];

  // Initialize audio manager on mount
  useEffect(() => {
    if (!isInitialized) {
      initialize().catch(console.error);
    }
  }, [isInitialized, initialize]);

  const handleRemoveTrack = (trackId: string) => {
    removeAudioTrack(trackId);
  };

  const handleVolumeChange = (trackId: string, volume: number) => {
    setVolume(trackId, volume);
    updateAudioTrack(trackId, { volume });
  };

  const handleFadeInChange = (trackId: string, duration: number) => {
    applyFadeIn(trackId, duration);
    updateAudioTrack(trackId, { fadeIn: duration });
  };

  const handleFadeOutChange = (trackId: string, duration: number) => {
    applyFadeOut(trackId, duration);
    updateAudioTrack(trackId, { fadeOut: duration });
  };

  return (
    <div className="audio-panel">
      <div className="audio-panel-header">
        <h3>Audio Tracks</h3>
        <div className="audio-panel-stats">
          {audioTracks.length} track{audioTracks.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="audio-panel-content">
        <AudioImporter />

        {audioTracks.length > 0 && (
          <div className="audio-tracks-list">
            {audioTracks.map(track => (
              <AudioTrackItem
                key={track.id}
                track={track}
                onRemove={handleRemoveTrack}
                onVolumeChange={handleVolumeChange}
                onFadeInChange={handleFadeInChange}
                onFadeOutChange={handleFadeOutChange}
              />
            ))}
          </div>
        )}

        {audioTracks.length === 0 && (
          <div className="audio-panel-empty">
            <p>No audio tracks yet</p>
            <p className="audio-panel-hint">
              Import audio files or add video clips with audio
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
