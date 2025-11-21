/**
 * Preview3D - 3D preview component for video composition
 * 
 * Enhanced with:
 * - Real-time preview controls (play/pause/stop/seek)
 * - Performance monitoring and quality adjustment
 * - Error logging and display
 */
import { useEffect, useMemo } from 'react';
import { useSceneManager } from '../core/useSceneManager';
import { useSceneSync } from '../core/useSceneSync';
import { useTransformControls } from '../core/useTransformControls';
import { usePreviewController } from '../core/usePreviewController';
import { useProject, useVideos, useTimeline } from '../store/useAppStore';
import { TransformControlsPanel } from './TransformControlsPanel';
import { PreviewControls } from './PreviewControls';
import { PerformanceMonitorDisplay } from './PerformanceMonitorDisplay';
import { PreviewErrorLog } from './PreviewErrorLog';
import './Preview3D.css';

export function Preview3D() {
  const { sceneManager, canvasRef, isInitialized } = useSceneManager({
    autoStart: true,
    autoAdjustQuality: true,
    width: 1080,
    height: 1920,
  });

  // Sync project clips to 3D scene
  useSceneSync(sceneManager);

  // Initialize transform controls
  const { selectedClipId } = useTransformControls(sceneManager);
  
  // Get project data
  const project = useProject();
  const videos = useVideos();
  const timeline = useTimeline();
  
  // Find currently playing clip
  const currentClip = useMemo(() => {
    if (!project || !timeline.isPlaying) return null;
    
    return project.clips.find(clip => {
      const clipStart = clip.startTime;
      const clipEnd = clip.startTime + clip.duration;
      return timeline.currentTime >= clipStart && timeline.currentTime < clipEnd;
    });
  }, [project, timeline.currentTime, timeline.isPlaying]);
  
  // Get current video info
  const currentVideo = currentClip ? videos.get(currentClip.videoId) : null;

  // Initialize preview controller with playback controls
  const {
    playbackState,
    currentTime,
    duration,
    isPlaying,
    errors,
    play,
    pause,
    stop,
    seek,
    jumpForward,
    jumpBackward,
    setPlaybackRate,
    clearErrors,
    controller,
  } = usePreviewController({
    sceneManager,
    autoSync: true,
  });

  useEffect(() => {
    if (!sceneManager || !isInitialized) return;

    console.log('3D Scene initialized successfully');
    console.log('Scene:', sceneManager.getScene());
    console.log('Camera:', sceneManager.getCamera());
    console.log('Renderer:', sceneManager.getRenderer());
  }, [sceneManager, isInitialized]);

  return (
    <div className="preview-3d">
      <div className="preview-main">
        <div className="preview-canvas-container">
          <canvas 
            ref={canvasRef} 
            className="preview-canvas"
          />
          {selectedClipId && (
            <div className="selection-indicator">
              Selected: {selectedClipId.slice(0, 8)}...
            </div>
          )}
          {!isInitialized && (
            <div className="preview-loading">
              <div className="loading-spinner"></div>
              <div className="loading-text">Initializing 3D Scene...</div>
            </div>
          )}
          {isPlaying && currentVideo && (
            <div className="now-playing-indicator">
              <span className="playing-icon">▶</span>
              <span className="playing-text">{currentVideo.file.name}</span>
            </div>
          )}
        </div>

        {/* Preview Controls */}
        <PreviewControls
          controller={controller}
          currentTime={currentTime}
          duration={duration}
          isPlaying={isPlaying}
          playbackRate={1}
          onPlay={play}
          onPause={pause}
          onStop={stop}
          onSeek={seek}
          onJumpForward={jumpForward}
          onJumpBackward={jumpBackward}
          onPlaybackRateChange={setPlaybackRate}
        />
      </div>

      <div className="preview-sidebar">
        {/* Transform Controls */}
        <TransformControlsPanel />

        {/* Performance Monitor */}
        <PerformanceMonitorDisplay
          sceneManager={sceneManager}
          updateInterval={500}
          showDetailed={false}
        />

        {/* Error Log */}
        {errors.length > 0 && (
          <PreviewErrorLog
            errors={errors}
            onClear={clearErrors}
            maxVisible={5}
          />
        )}

        {/* Playback Status */}
        <div className="playback-status">
          <div className="status-item">
            <span className="status-label">Status:</span>
            <span className={`status-value ${playbackState}`}>
              {playbackState === 'playing' && '▶ Playing'}
              {playbackState === 'paused' && '⏸ Paused'}
              {playbackState === 'stopped' && '⏹ Stopped'}
            </span>
          </div>
          <div className="status-item">
            <span className="status-label">Scene:</span>
            <span className="status-value">
              {isInitialized ? '✓ Ready' : '⏳ Loading...'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
