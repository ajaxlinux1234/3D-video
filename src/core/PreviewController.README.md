# PreviewController - Real-time Preview System

## Overview

The `PreviewController` is a comprehensive playback control system for the 3D video composer. It manages real-time preview playback, synchronizes all video elements with the timeline, and provides robust error handling and logging.

## Features

### 1. Playback Controls
- **Play**: Start playback from current position
- **Pause**: Pause playback at current position
- **Stop**: Stop playback and reset to beginning
- **Seek**: Jump to specific time position
- **Jump Forward/Backward**: Quick navigation (default 5 seconds)
- **Playback Rate**: Adjust speed (0.25x to 2x)

### 2. Video Synchronization
- Automatically syncs all video elements with timeline position
- Handles video trimming and clip timing
- Manages active/inactive video states
- Throttled updates for performance

### 3. Performance Optimization
- Efficient playback loop using requestAnimationFrame
- Throttled video synchronization to prevent excessive updates
- Automatic cleanup and resource management

### 4. Error Handling
- Comprehensive error logging with timestamps
- Error categorization (video_sync, playback, render, unknown)
- Error details capture for debugging
- Configurable error callbacks

### 5. State Management
- Playback state tracking (playing, paused, stopped)
- Current time and duration management
- Playback rate control
- Integration with Zustand store

## Usage

### Basic Setup

```typescript
import { PreviewController } from './core/PreviewController';
import { SceneManager } from './core/SceneManager';

// Create controller with callbacks
const controller = new PreviewController({
  onTimeUpdate: (time) => {
    console.log('Current time:', time);
  },
  onPlaybackStateChange: (state) => {
    console.log('Playback state:', state);
  },
  onError: (error) => {
    console.error('Preview error:', error);
  },
  onPlaybackEnd: () => {
    console.log('Playback ended');
  },
});

// Set scene manager
controller.setSceneManager(sceneManager);

// Set project and videos
controller.setProject(project);
controller.setVideos(videosMap);

// Control playback
controller.play();
controller.pause();
controller.seek(10.5);
controller.stop();
```

### React Hook

```typescript
import { usePreviewController } from './core/usePreviewController';

function MyComponent() {
  const { sceneManager } = useSceneManager();
  
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
    togglePlayPause,
    setPlaybackRate,
    clearErrors,
  } = usePreviewController({
    sceneManager,
    autoSync: true, // Auto-sync with store
  });

  return (
    <div>
      <button onClick={togglePlayPause}>
        {isPlaying ? 'Pause' : 'Play'}
      </button>
      <button onClick={stop}>Stop</button>
      <input
        type="range"
        min={0}
        max={duration}
        value={currentTime}
        onChange={(e) => seek(parseFloat(e.target.value))}
      />
      <div>Time: {currentTime.toFixed(2)}s / {duration.toFixed(2)}s</div>
      {errors.length > 0 && (
        <div>
          Errors: {errors.length}
          <button onClick={clearErrors}>Clear</button>
        </div>
      )}
    </div>
  );
}
```

## Components

### PreviewControls

Full-featured playback control panel with:
- Transport controls (play/pause/stop/jump)
- Time display and seek bar
- Playback rate selector
- Keyboard shortcuts

```typescript
<PreviewControls
  controller={controller}
  currentTime={currentTime}
  duration={duration}
  isPlaying={isPlaying}
  onPlay={play}
  onPause={pause}
  onStop={stop}
  onSeek={seek}
  onJumpForward={jumpForward}
  onJumpBackward={jumpBackward}
  onPlaybackRateChange={setPlaybackRate}
/>
```

### PerformanceMonitorDisplay

Real-time performance metrics display:
- FPS (frames per second)
- Frame time and render time
- Memory usage (Chrome only)
- Quality level indicator
- Manual quality controls
- Auto-adjust toggle

```typescript
<PerformanceMonitorDisplay
  sceneManager={sceneManager}
  updateInterval={500}
  showDetailed={false}
/>
```

### PreviewErrorLog

Error log display with:
- Error list with timestamps
- Error type categorization
- Expandable error details
- Clear functionality

```typescript
<PreviewErrorLog
  errors={errors}
  onClear={clearErrors}
  maxVisible={5}
/>
```

## Keyboard Shortcuts

The PreviewControls component includes keyboard shortcuts:

- **Space / K**: Toggle play/pause
- **Arrow Left**: Jump backward 5 seconds
- **Arrow Right**: Jump forward 5 seconds
- **Home**: Seek to beginning
- **End**: Seek to end
- **Escape**: Stop playback

## Error Types

### video_sync
Video synchronization errors (e.g., failed to set currentTime)

### playback
Playback errors (e.g., failed to play video element)

### render
Rendering errors (e.g., failed to update scene time)

### unknown
Uncategorized errors

## Performance Considerations

### Video Synchronization
- Only seeks video when time difference > 0.1s
- Throttles synchronization updates
- Pauses inactive videos to save resources

### Playback Loop
- Uses requestAnimationFrame for smooth updates
- Calculates delta time for accurate playback
- Stops loop when paused/stopped

### Memory Management
- Limits error log to 50 entries
- Cleans up on dispose
- Releases references properly

## Integration with Timeline

The PreviewController integrates seamlessly with the timeline system:

1. **Auto-sync mode**: Automatically updates store when time changes
2. **Manual mode**: Allows independent preview control
3. **Bidirectional sync**: Can be controlled from timeline or preview

```typescript
// Auto-sync with store (default)
const controller = usePreviewController({
  sceneManager,
  autoSync: true,
});

// Manual control (no store sync)
const controller = usePreviewController({
  sceneManager,
  autoSync: false,
});
```

## Best Practices

1. **Always dispose**: Call `controller.dispose()` when unmounting
2. **Handle errors**: Implement error callbacks for debugging
3. **Throttle updates**: Don't update too frequently from external sources
4. **Check initialization**: Ensure scene manager is initialized before playing
5. **Monitor performance**: Watch FPS and adjust quality as needed

## Example: Complete Preview System

```typescript
function PreviewSystem() {
  const { sceneManager, canvasRef, isInitialized } = useSceneManager({
    autoStart: true,
    autoAdjustQuality: true,
  });

  const {
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

  return (
    <div className="preview-system">
      <canvas ref={canvasRef} />
      
      <PreviewControls
        controller={controller}
        currentTime={currentTime}
        duration={duration}
        isPlaying={isPlaying}
        onPlay={play}
        onPause={pause}
        onStop={stop}
        onSeek={seek}
        onJumpForward={jumpForward}
        onJumpBackward={jumpBackward}
        onPlaybackRateChange={setPlaybackRate}
      />
      
      <PerformanceMonitorDisplay
        sceneManager={sceneManager}
        updateInterval={500}
      />
      
      {errors.length > 0 && (
        <PreviewErrorLog
          errors={errors}
          onClear={clearErrors}
        />
      )}
    </div>
  );
}
```

## Requirements Fulfilled

This implementation fulfills the following requirements from task 11:

✅ **5.1**: Play/pause/stop/seek controls implemented
✅ **5.2**: Adaptive quality adjustment with performance monitoring
✅ **5.3**: Playback head synchronization with all video elements
✅ **5.4**: Real-time FPS, memory, and render time display
✅ **5.5**: Comprehensive error handling and logging

## Future Enhancements

- Frame-by-frame stepping
- Loop region selection
- Playback markers
- Audio waveform visualization in timeline
- Multi-camera preview
- Picture-in-picture mode
