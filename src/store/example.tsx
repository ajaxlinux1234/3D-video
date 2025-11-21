/**
 * Example component demonstrating store usage
 * This file is for reference only and can be deleted
 */

import { useProject, useTimeline, useClipActions, useTimelineActions } from './useAppStore';
import type { VideoClip, Transform3D } from '../types';

export function StoreExample() {
  // Use selector hooks for optimized re-renders
  const project = useProject();
  const timeline = useTimeline();
  const { addClip, updateClip, removeClip } = useClipActions();
  const { play, pause, seek } = useTimelineActions();

  // Example: Add a new clip
  const handleAddClip = () => {
    const newClip: VideoClip = {
      id: crypto.randomUUID(),
      videoId: 'video-1',
      startTime: 0,
      duration: 5,
      trimStart: 0,
      trimEnd: 5,
      transform: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
      effects: [],
    };
    addClip(newClip);
  };

  // Example: Update clip transform
  const handleUpdateTransform = (clipId: string) => {
    const newTransform: Transform3D = {
      position: { x: 1, y: 0, z: 0 },
      rotation: { x: 0, y: Math.PI / 4, z: 0 },
      scale: { x: 1.5, y: 1.5, z: 1.5 },
    };
    updateClip(clipId, { transform: newTransform });
  };

  // Example: Timeline controls
  const handlePlayPause = () => {
    if (timeline.isPlaying) {
      pause();
    } else {
      play();
    }
  };

  return (
    <div>
      <h2>Store Example</h2>
      
      <div>
        <h3>Project Info</h3>
        <p>Name: {project?.name || 'No project'}</p>
        <p>Clips: {project?.clips.length || 0}</p>
        <p>Duration: {project?.duration || 0}s</p>
      </div>

      <div>
        <h3>Timeline</h3>
        <p>Current Time: {timeline.currentTime.toFixed(2)}s</p>
        <p>Playing: {timeline.isPlaying ? 'Yes' : 'No'}</p>
        <button onClick={handlePlayPause}>
          {timeline.isPlaying ? 'Pause' : 'Play'}
        </button>
        <button onClick={() => seek(0)}>Reset</button>
      </div>

      <div>
        <h3>Clips</h3>
        <button onClick={handleAddClip}>Add Clip</button>
        {project?.clips.map(clip => (
          <div key={clip.id}>
            <span>Clip {clip.id.slice(0, 8)}</span>
            <button onClick={() => handleUpdateTransform(clip.id)}>
              Update Transform
            </button>
            <button onClick={() => removeClip(clip.id)}>Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
}
