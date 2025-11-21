# Timeline Editor Component

## Overview

The TimelineEditor is a comprehensive timeline editing interface for the 3D Video Composer application. It provides a visual interface for arranging, editing, and controlling video clips on a timeline with full drag-and-drop support.

## Features

### 1. Timeline Ruler with Playhead
- **Visual time scale**: Displays time markers with major and minor ticks
- **Dynamic scaling**: Tick intervals adjust based on zoom level
- **Playhead indicator**: Blue vertical line showing current playback position
- **Click-to-seek**: Click anywhere on the ruler to jump to that time

### 2. Video Clip Management
- **Drag and drop**: Rearrange clips by dragging them along the timeline
- **Visual feedback**: Clips show hover and selection states
- **Thumbnail preview**: Each clip displays a thumbnail from the video
- **Duration display**: Shows clip duration in MM:SS format
- **Selection highlighting**: Selected clips are highlighted with a blue glow

### 3. Clip Resizing
- **Edge handles**: Drag left or right edges to adjust clip duration
- **Trim support**: Resizing adjusts both duration and trim points
- **Visual indicators**: Resize handles appear on hover
- **Constrained resizing**: Prevents invalid durations (minimum 0.1s)

### 4. Playback Controls
- **Play/Pause button**: Toggle playback with visual state indicator
- **Reset button**: Jump back to the beginning
- **Time display**: Shows current time and total duration
- **Auto-scroll**: Timeline automatically scrolls to follow playhead during playback

### 5. Timeline Zoom
- **Zoom slider**: Adjust zoom level from 0.25x to 4x
- **Dynamic scaling**: All clips and time markers scale accordingly
- **Zoom display**: Shows current zoom level (e.g., "1.00x")

### 6. Audio Track Support
- **Separate audio tracks**: Displays audio tracks below video tracks
- **Waveform visualization**: Placeholder for audio waveform display
- **Time-aligned**: Audio tracks align with video clips on the timeline

### 7. Synchronization
- **3D Scene sync**: Timeline state syncs with 3D preview via `useTimelineSync` hook
- **Video element sync**: All video elements play in sync with timeline
- **Real-time updates**: Changes immediately reflect in the preview

## Component Structure

```
TimelineEditor (Main Container)
├── TimelineControls (Top bar)
│   ├── Play/Pause Button
│   ├── Reset Button
│   ├── Time Display
│   └── Zoom Controls
├── TimelineContent
│   ├── TimelineRuler (Time scale and playhead)
│   └── TimelineTracks (Scrollable area)
│       ├── Video Track
│       │   └── TimelineClipComponent (Draggable clips)
│       └── Audio Tracks
│           └── Audio Waveform
└── Playhead Overlay
```

## Usage

### Adding Clips to Timeline

From the Video Library, click "添加到时间轴" (Add to Timeline) button:

```typescript
const handleAddToTimeline = (videoId: string) => {
  const newClip: VideoClip = {
    id: crypto.randomUUID(),
    videoId: videoId,
    startTime: lastClipEndTime, // Placed at end
    duration: video.metadata.duration,
    trimStart: 0,
    trimEnd: video.metadata.duration,
    transform: { /* default 3D transform */ },
    effects: [],
  };
  addClip(newClip);
};
```

### Dragging Clips

Clips use react-dnd for drag and drop:
- Drag a clip to reposition it on the timeline
- Drop zones are automatically calculated
- Clips snap to valid positions

### Resizing Clips

Click and drag the left or right edge of a clip:
- **Left edge**: Adjusts trim start and duration
- **Right edge**: Adjusts duration only
- Constraints prevent invalid values

### Playback

The timeline includes a real-time playback loop:
```typescript
const animate = (currentTime: number) => {
  const deltaTime = (currentTime - lastTime) / 1000;
  const newTime = timeline.currentTime + deltaTime * timeline.playbackRate;
  
  if (newTime >= timeline.duration) {
    pause();
  } else {
    setCurrentTime(newTime);
  }
  
  requestAnimationFrame(animate);
};
```

## Integration with 3D Scene

The timeline synchronizes with the 3D scene through the `useTimelineSync` hook:

```typescript
// In Preview3D component
const { currentTime, isPlaying } = useTimelineSync(sceneManager);
```

This hook:
- Updates video element `currentTime` for each clip
- Syncs play/pause state with video elements
- Updates the 3D scene manager with current time
- Handles playback rate changes

## Keyboard Shortcuts

Currently supported through UI buttons:
- **Play/Pause**: Click play button
- **Reset**: Click reset button
- **Zoom**: Use zoom slider

Future enhancements could add:
- Space: Play/Pause
- Home: Reset to start
- +/-: Zoom in/out
- Delete: Remove selected clip

## Styling

The timeline uses a dark theme consistent with the application:
- Background: `#1a1a1a`
- Controls bar: `#252525`
- Clips: Blue gradient (`#4a9eff` to `#357abd`)
- Playhead: Bright blue (`#4a9eff`)
- Selected clips: Glowing blue border

## Performance Considerations

1. **Efficient rendering**: Only visible clips are rendered
2. **RequestAnimationFrame**: Smooth 60fps playback loop
3. **Memoized callbacks**: Prevents unnecessary re-renders
4. **Scroll optimization**: Auto-scroll only during playback
5. **Drag optimization**: Throttled position updates

## State Management

Timeline state is managed through Zustand store:

```typescript
interface TimelineState {
  currentTime: number;
  duration: number;
  zoom: number;
  playbackRate: number;
  isPlaying: boolean;
}
```

Actions:
- `play()`: Start playback
- `pause()`: Pause playback
- `seek(time)`: Jump to specific time
- `setCurrentTime(time)`: Update current time
- `updateClip(id, updates)`: Modify clip properties

## Requirements Satisfied

This implementation satisfies the following requirements from the spec:

- **需求 2.4**: Timeline synchronization with 3D scene
- **需求 5.1**: Real-time preview with playback controls
- **需求 5.3**: Pause functionality with quick response
- **需求 5.4**: Playhead dragging and real-time updates

## Future Enhancements

1. **Multi-track support**: Multiple video layers
2. **Snap-to-grid**: Align clips to time markers
3. **Ripple editing**: Move subsequent clips when inserting
4. **Markers**: Add custom markers for important points
5. **Waveform rendering**: Actual audio waveform visualization
6. **Transition indicators**: Visual representation of transitions between clips
7. **Keyboard shortcuts**: Full keyboard navigation
8. **Undo/Redo**: Timeline-specific history
9. **Copy/Paste**: Duplicate clips
10. **Group selection**: Select and move multiple clips

## Dependencies

- `react-dnd`: Drag and drop functionality
- `react-dnd-html5-backend`: HTML5 drag and drop backend
- `zustand`: State management
- `@types/react`: TypeScript types

## Files

- `TimelineEditor.tsx`: Main component implementation
- `TimelineEditor.css`: Component styles
- `useTimelineSync.ts`: Timeline synchronization hook
- `TimelineEditor.README.md`: This documentation
