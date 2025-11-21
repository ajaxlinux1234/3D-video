# State Management

This directory contains the Zustand store for managing application state.

## Store Structure

The main store (`useAppStore`) manages:

- **Project State**: Current project data including clips, audio tracks, and settings
- **Video Resources**: Map of imported video files and their metadata
- **Timeline State**: Playback position, duration, zoom level, and playing status
- **Selection State**: Currently selected clip ID
- **UI State**: UI preferences like preview quality, panel visibility, and export progress

## Usage

### Basic Usage

```typescript
import { useAppStore } from './store/useAppStore';

function MyComponent() {
  const project = useAppStore(state => state.currentProject);
  const addClip = useAppStore(state => state.addClip);
  
  // Use state and actions
}
```

### Optimized Selectors

Use the provided selector hooks for better performance:

```typescript
import { useProject, useTimeline, useClipActions } from './store/useAppStore';

function MyComponent() {
  const project = useProject();
  const timeline = useTimeline();
  const { addClip, updateClip } = useClipActions();
}
```

## Actions

### Project Actions
- `setProject(project)` - Set the current project
- `resetProject()` - Clear all project data

### Video Actions
- `addVideo(video)` - Add a video resource
- `removeVideo(videoId)` - Remove a video resource

### Clip Actions
- `addClip(clip)` - Add a video clip to the timeline
- `updateClip(clipId, updates)` - Update clip properties
- `removeClip(clipId)` - Remove a clip from the timeline
- `setSelectedClip(clipId)` - Set the selected clip

### Timeline Actions
- `play()` - Start playback
- `pause()` - Pause playback
- `stop()` - Stop playback and reset to start
- `seek(time)` - Jump to a specific time
- `setCurrentTime(time)` - Update current playback time

### Audio Actions
- `addAudioTrack(track)` - Add an audio track
- `removeAudioTrack(trackId)` - Remove an audio track
- `updateAudioTrack(trackId, updates)` - Update audio track properties

### UI Actions
- `setUIState(updates)` - Update UI state

## Persistence

The store automatically persists:
- Current project data
- Timeline state (except playing status)

The following are NOT persisted:
- Video resources (contains File objects and HTMLVideoElement)
- UI state (resets on reload)
- Playing state (always starts paused)

Data is stored in localStorage under the key `video-composer-storage`.

## Type Safety

All state and actions are fully typed with TypeScript. Import types from `../types`:

```typescript
import type { Project, VideoClip, Transform3D } from '../types';
```
