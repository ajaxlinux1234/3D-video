# ExportManager

The ExportManager handles video export functionality, integrating FFmpeg.wasm to encode rendered frames and audio into a final MP4 video file.

## Features

- **FFmpeg.wasm Integration**: Browser-based video encoding without server
- **Frame-by-Frame Rendering**: Captures each frame from the 3D scene
- **Audio Mixing**: Combines all audio tracks into a single stream
- **Progress Tracking**: Real-time progress updates with ETA
- **Multiple Resolutions**: 720p, 1080p, 2K export options
- **Configurable Settings**: FPS, bitrate, codec selection
- **Error Recovery**: Handles export failures gracefully
- **Cancellation Support**: Allows users to cancel ongoing exports

## Architecture

```
ExportManager
├── FrameCapture (renders frames from scene)
├── AudioManager (mixes audio tracks)
└── FFmpeg.wasm (encodes video)
```

## Usage

### Basic Export

```typescript
import { ExportManager } from './core/ExportManager';
import { SceneManager } from './core/SceneManager';
import { AudioManager } from './core/AudioManager';

// Initialize
const sceneManager = new SceneManager();
const audioManager = new AudioManager();
const exportManager = new ExportManager(sceneManager);

// Configure export settings
const settings: ExportSettings = {
  resolution: '1080p',
  fps: 60,
  bitrate: 8,
  format: 'mp4',
  codec: 'h264',
};

// Export video
const result = await exportManager.exportVideo(
  project,
  settings,
  audioManager,
  (progress) => {
    console.log(`Progress: ${progress.progress}%`);
    console.log(`Phase: ${progress.phase}`);
    console.log(`Frame: ${progress.currentFrame}/${progress.totalFrames}`);
  }
);

if (result.success) {
  // Download the video
  const url = URL.createObjectURL(result.blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'video.mp4';
  a.click();
}
```

### With React Hook

```typescript
import { useExportManager } from './core/useExportManager';
import { useSceneManager } from './core/useSceneManager';

function MyComponent() {
  const sceneManager = useSceneManager();
  const exportManager = useExportManager(sceneManager);

  const handleExport = async () => {
    if (!exportManager) return;

    const result = await exportManager.exportVideo(
      project,
      settings,
      audioManager,
      (progress) => {
        setProgress(progress);
      }
    );
  };

  return <button onClick={handleExport}>Export</button>;
}
```

## Export Process

### Phase 1: Preparing (0-10%)
- Initialize FFmpeg.wasm
- Calculate total frames
- Setup rendering context

### Phase 2: Rendering (10-65%)
- Render each frame from the 3D scene
- Capture frame as ImageData
- Store frames in memory
- Update progress with ETA

### Phase 3: Audio Mixing (65-70%)
- Mix all audio tracks
- Apply volume, fade in/out
- Convert to WAV format

### Phase 4: Encoding (70-95%)
- Write frames as PNG images to FFmpeg
- Write audio file
- Execute FFmpeg encoding command
- Generate MP4 file

### Phase 5: Complete (95-100%)
- Read output file
- Clean up temporary files
- Return video blob

## Export Settings

### Resolution
- **720p**: 720x1280 (9:16 aspect ratio)
- **1080p**: 1080x1920 (9:16 aspect ratio)
- **2K**: 1440x2560 (9:16 aspect ratio)

### Frame Rate
- **30 fps**: Standard frame rate, smaller file size
- **60 fps**: Smooth motion, larger file size

### Bitrate
- **4 Mbps**: Low quality, small file
- **8 Mbps**: Medium quality (recommended)
- **12 Mbps**: High quality
- **16 Mbps**: Very high quality, large file

### Codec
- **H.264**: Wide compatibility, good compression
- **H.265**: Better compression, smaller files, less compatible

## Progress Tracking

The export process provides detailed progress information:

```typescript
interface ExportProgress {
  phase: 'preparing' | 'rendering' | 'encoding' | 'complete' | 'error';
  progress: number; // 0-100
  currentFrame?: number;
  totalFrames?: number;
  estimatedTimeRemaining?: number; // seconds
  message?: string;
}
```

## Error Handling

Common errors and solutions:

### FFmpeg Initialization Failed
- **Cause**: Network issue loading FFmpeg.wasm
- **Solution**: Check internet connection, retry

### Out of Memory
- **Cause**: Too many frames or high resolution
- **Solution**: Reduce resolution or split into shorter segments

### Encoding Failed
- **Cause**: Invalid settings or corrupted frames
- **Solution**: Check export settings, try different codec

### Export Cancelled
- **Cause**: User cancelled export
- **Solution**: Normal cancellation, no action needed

## Performance Considerations

### Memory Usage
- Each frame is stored in memory during rendering
- 1080p @ 60fps for 10 seconds = ~1.2GB memory
- Consider shorter exports or lower resolution for long videos

### Export Time
Approximate export times (on modern hardware):
- 10 seconds @ 1080p 60fps: ~2-3 minutes
- 30 seconds @ 1080p 60fps: ~6-9 minutes
- 60 seconds @ 1080p 60fps: ~12-18 minutes

### Optimization Tips
1. Use lower resolution for preview exports
2. Reduce FPS to 30 for faster exports
3. Close other applications to free memory
4. Use H.264 codec for faster encoding

## FFmpeg.wasm Integration

The ExportManager uses FFmpeg.wasm for video encoding:

```typescript
// FFmpeg command example
ffmpeg -framerate 60 \
  -i frame%06d.png \
  -i audio.wav \
  -c:v libx264 \
  -preset medium \
  -crf 23 \
  -pix_fmt yuv420p \
  -c:a aac \
  -b:a 192k \
  output.mp4
```

### FFmpeg Parameters
- `-framerate`: Input frame rate
- `-i frame%06d.png`: Input frame sequence
- `-i audio.wav`: Input audio file
- `-c:v libx264`: Video codec
- `-preset medium`: Encoding speed/quality tradeoff
- `-crf 23`: Constant rate factor (quality)
- `-pix_fmt yuv420p`: Pixel format for compatibility
- `-c:a aac`: Audio codec
- `-b:a 192k`: Audio bitrate

## Cancellation

Users can cancel an ongoing export:

```typescript
// Cancel export
exportManager.cancel();

// Check if cancelled
if (exportManager.isCancelRequested()) {
  // Handle cancellation
}
```

## Cleanup

Always dispose of the ExportManager when done:

```typescript
exportManager.dispose();
```

## Browser Compatibility

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support (iOS 16.4+)
- **Memory**: Minimum 4GB RAM recommended
- **Storage**: Temporary storage for frames during export

## Future Enhancements

Potential improvements:
- Streaming export (no frame buffering)
- Hardware acceleration (WebCodecs API)
- Background export (Web Workers)
- Resume failed exports
- Export presets (TikTok, Instagram, etc.)
- Watermark support
- Subtitle/caption support
