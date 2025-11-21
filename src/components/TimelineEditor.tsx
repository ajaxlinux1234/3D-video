import React, { useRef, useEffect, useState, useCallback } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import {
  useProject,
  useTimeline,
  useTimelineActions,
  useClipActions,
  useSelectedClip,
  useVideos,
} from '../store/useAppStore';
import type { VideoClip } from '../types';
import './TimelineEditor.css';

const PIXELS_PER_SECOND = 100; // Base scale

/**
 * Format time in seconds to MM:SS format
 */
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Timeline Clip Component with drag and resize
 */
interface TimelineClipProps {
  clip: VideoClip;
  zoom: number;
  onMove: (clipId: string, newStartTime: number) => void;
  onResize: (clipId: string, newDuration: number, newTrimStart: number) => void;
}

const TimelineClipComponent: React.FC<TimelineClipProps> = ({
  clip,
  zoom,
  onMove,
  onResize,
}) => {
  const videos = useVideos();
  const selectedClipId = useSelectedClip();
  const { setSelectedClip } = useClipActions();
  const [isResizing, setIsResizing] = useState<'left' | 'right' | null>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, duration: 0, trimStart: 0 });

  const video = videos.get(clip.videoId);
  const pixelsPerSecond = PIXELS_PER_SECOND * zoom;
  const left = clip.startTime * pixelsPerSecond;
  const width = clip.duration * pixelsPerSecond;

  const [{ isDragging }, drag] = useDrag({
    type: 'TIMELINE_CLIP',
    item: () => ({ clipId: clip.id, startTime: clip.startTime }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: () => !isResizing,
  });

  const [, drop] = useDrop({
    accept: 'TIMELINE_CLIP',
    hover: (item: { clipId: string; startTime: number }, monitor) => {
      if (item.clipId === clip.id) return;
      
      const delta = monitor.getDifferenceFromInitialOffset();
      if (!delta) return;

      const newStartTime = Math.max(0, item.startTime + delta.x / pixelsPerSecond);
      onMove(item.clipId, newStartTime);
      item.startTime = newStartTime;
    },
  });

  const combinedRef = (node: HTMLDivElement | null) => {
    drag(node);
    drop(node);
  };

  const handleMouseDown = (e: React.MouseEvent, side: 'left' | 'right') => {
    e.stopPropagation();
    setIsResizing(side);
    setResizeStart({
      x: e.clientX,
      duration: clip.duration,
      trimStart: clip.trimStart,
    });
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeStart.x;
      const deltaTime = deltaX / pixelsPerSecond;

      if (isResizing === 'right') {
        const newDuration = Math.max(0.1, resizeStart.duration + deltaTime);
        const maxDuration = video?.metadata.duration || resizeStart.duration;
        const clampedDuration = Math.min(newDuration, maxDuration - clip.trimStart);
        onResize(clip.id, clampedDuration, clip.trimStart);
      } else if (isResizing === 'left') {
        const newTrimStart = Math.max(0, resizeStart.trimStart + deltaTime);
        const newDuration = Math.max(0.1, resizeStart.duration - deltaTime);
        const maxTrimStart = video?.metadata.duration ? video.metadata.duration - 0.1 : resizeStart.trimStart;
        const clampedTrimStart = Math.min(newTrimStart, maxTrimStart);
        onResize(clip.id, newDuration, clampedTrimStart);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeStart, clip.id, clip.trimStart, pixelsPerSecond, onResize, video]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedClip(clip.id);
  };

  return (
    <div
      ref={combinedRef}
      className={`timeline-clip ${isDragging ? 'dragging' : ''} ${
        selectedClipId === clip.id ? 'selected' : ''
      }`}
      style={{
        left: `${left}px`,
        width: `${width}px`,
      }}
      onClick={handleClick}
    >
      {video?.thumbnail && (
        <img
          src={video.thumbnail}
          alt="Clip thumbnail"
          className="timeline-clip-thumbnail"
        />
      )}
      <div className="timeline-clip-content">
        <div className="timeline-clip-name">{video?.file.name || 'Video Clip'}</div>
        <div className="timeline-clip-duration">{formatTime(clip.duration)}</div>
      </div>
      <div
        className="timeline-clip-resize-handle left"
        onMouseDown={(e) => handleMouseDown(e, 'left')}
      />
      <div
        className="timeline-clip-resize-handle right"
        onMouseDown={(e) => handleMouseDown(e, 'right')}
      />
    </div>
  );
};

/**
 * Timeline Ruler Component
 */
interface TimelineRulerProps {
  duration: number;
  zoom: number;
  currentTime: number;
  onSeek: (time: number) => void;
}

const TimelineRuler: React.FC<TimelineRulerProps> = ({
  duration,
  zoom,
  currentTime,
  onSeek,
}) => {
  const rulerRef = useRef<HTMLDivElement>(null);
  const pixelsPerSecond = PIXELS_PER_SECOND * zoom;
  const totalWidth = duration * pixelsPerSecond;

  const handleClick = (e: React.MouseEvent) => {
    if (!rulerRef.current) return;
    const rect = rulerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + rulerRef.current.scrollLeft;
    const time = x / pixelsPerSecond;
    onSeek(Math.max(0, Math.min(time, duration)));
  };

  // Generate tick marks
  const ticks: React.ReactElement[] = [];
  const interval = zoom < 0.5 ? 10 : zoom < 1 ? 5 : zoom < 2 ? 2 : 1;
  
  for (let i = 0; i <= Math.ceil(duration); i += interval) {
    const isMajor = i % (interval * 2) === 0;
    ticks.push(
      <div
        key={i}
        className="timeline-tick"
        style={{ left: `${i * pixelsPerSecond}px` }}
      >
        <div className={`timeline-tick-line ${isMajor ? 'major' : ''}`} />
        {isMajor && <div className="timeline-tick-label">{formatTime(i)}</div>}
      </div>
    );
  }

  return (
    <div ref={rulerRef} className="timeline-ruler" onClick={handleClick}>
      <div className="timeline-ruler-ticks" style={{ width: `${totalWidth}px` }}>
        {ticks}
      </div>
      <div
        className="timeline-playhead"
        style={{ left: `${currentTime * pixelsPerSecond}px` }}
      />
    </div>
  );
};

/**
 * Main Timeline Editor Component
 */
export const TimelineEditor: React.FC = () => {
  const project = useProject();
  const timeline = useTimeline();
  const { play, pause, seek, setCurrentTime } = useTimelineActions();
  const { updateClip, setSelectedClip } = useClipActions();
  const [zoom, setZoom] = useState(1);
  const tracksRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);

  const pixelsPerSecond = PIXELS_PER_SECOND * zoom;
  const totalWidth = timeline.duration * pixelsPerSecond;

  // Playback loop
  useEffect(() => {
    if (!timeline.isPlaying) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
      return;
    }

    let lastTime = performance.now();
    const animate = () => {
      const currentTime = performance.now();
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      const newTime = timeline.currentTime + deltaTime * timeline.playbackRate;
      
      if (newTime >= timeline.duration) {
        pause();
        setCurrentTime(timeline.duration);
        return;
      } else {
        setCurrentTime(newTime);
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
    };
  }, [timeline.isPlaying, timeline.duration, timeline.playbackRate, pause, setCurrentTime]);

  // Auto-scroll to follow playhead
  useEffect(() => {
    if (!tracksRef.current || !timeline.isPlaying) return;

    const playheadX = timeline.currentTime * pixelsPerSecond;
    const scrollLeft = tracksRef.current.scrollLeft;
    const viewportWidth = tracksRef.current.clientWidth;

    // Scroll if playhead is near the edge
    if (playheadX > scrollLeft + viewportWidth - 100) {
      tracksRef.current.scrollLeft = playheadX - viewportWidth + 100;
    } else if (playheadX < scrollLeft + 100) {
      tracksRef.current.scrollLeft = playheadX - 100;
    }
  }, [timeline.currentTime, timeline.isPlaying, pixelsPerSecond]);

  const handlePlayPause = () => {
    if (timeline.isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const handleClipMove = useCallback(
    (clipId: string, newStartTime: number) => {
      updateClip(clipId, { startTime: Math.max(0, newStartTime) });
    },
    [updateClip]
  );

  const handleClipResize = useCallback(
    (clipId: string, newDuration: number, newTrimStart: number) => {
      updateClip(clipId, { duration: newDuration, trimStart: newTrimStart });
    },
    [updateClip]
  );

  const handleTrackClick = () => {
    setSelectedClip(null);
  };

  if (!project) {
    return (
      <div className="timeline-editor">
        <div className="timeline-empty">
          No project loaded. Import videos to get started.
        </div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="timeline-editor">
        <div className="timeline-controls">
          <button onClick={handlePlayPause} className={timeline.isPlaying ? 'playing' : ''}>
            {timeline.isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>
          <button onClick={() => seek(0)}>⏮ Reset</button>
          
          <div className="timeline-info">
            <span>
              {formatTime(timeline.currentTime)} / {formatTime(timeline.duration)}
            </span>
            <div className="timeline-zoom">
              <span>Zoom:</span>
              <input
                type="range"
                min="0.25"
                max="4"
                step="0.25"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
              />
              <span>{zoom.toFixed(2)}x</span>
            </div>
          </div>
        </div>

        <div className="timeline-content">
          <TimelineRuler
            duration={timeline.duration}
            zoom={zoom}
            currentTime={timeline.currentTime}
            onSeek={seek}
          />

          <div ref={tracksRef} className="timeline-tracks" onClick={handleTrackClick}>
            <div className="timeline-scrollable-area" style={{ width: `${totalWidth}px` }}>
              {project.clips.length === 0 ? (
                <div className="timeline-empty">
                  Drag video clips here from the library
                </div>
              ) : (
                <>
                  {/* Video tracks */}
                  <div className="timeline-track">
                    {project.clips.map((clip) => (
                      <TimelineClipComponent
                        key={clip.id}
                        clip={clip}
                        zoom={zoom}
                        onMove={handleClipMove}
                        onResize={handleClipResize}
                      />
                    ))}
                  </div>

                  {/* Audio tracks */}
                  {project.audioTracks.map((track) => (
                    <div key={track.id} className="timeline-audio-track">
                      <div
                        className="timeline-audio-waveform"
                        style={{
                          left: `${track.startTime * pixelsPerSecond}px`,
                          width: `${track.duration * pixelsPerSecond}px`,
                        }}
                      >
                        {/* Audio waveform visualization would go here */}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
            
            {/* Playhead overlay */}
            <div
              className="timeline-playhead"
              style={{
                left: `${timeline.currentTime * pixelsPerSecond}px`,
                height: '100%',
              }}
            />
          </div>
        </div>
      </div>
    </DndProvider>
  );
};
