# Core Modules

This directory contains the core business logic modules for the 3D Video Composer.

## VideoManager

The `VideoManager` class handles all video import, validation, and resource management functionality.

### Features

- ✅ Multi-file video import
- ✅ Drag-and-drop support
- ✅ Format validation (MP4, MOV, WebM)
- ✅ File size validation (max 500MB)
- ✅ Video metadata extraction (duration, resolution, FPS, codec)
- ✅ Automatic thumbnail generation
- ✅ Video resource caching
- ✅ Preload mechanism for smooth playback
- ✅ Video count limit enforcement (max 20 videos)

### Usage

#### Basic Import

```typescript
import { videoManager } from './core/VideoManager';

// Import single video
const file = // ... File object
const videoResource = await videoManager.importVideo(file);

// Import multiple videos
const files = // ... File[]
const videoResources = await videoManager.importVideos(files);
```

#### With React Hook

```typescript
import { useVideoManager } from './core/useVideoManager';

function MyComponent() {
  const { importing, error, importVideos, videoCount, remainingSlots } = useVideoManager();

  const handleImport = async (files: File[]) => {
    try {
      await importVideos(files);
      console.log('Import successful!');
    } catch (err) {
      console.error('Import failed:', err);
    }
  };

  return (
    <div>
      <p>Videos: {videoCount} / 20</p>
      <p>Remaining slots: {remainingSlots}</p>
      {error && <p>Error: {error}</p>}
    </div>
  );
}
```

### API Reference

#### VideoManager Class

##### Methods

- `importVideo(file: File): Promise<VideoResource>` - Import a single video file
- `importVideos(files: File[]): Promise<VideoResource[]>` - Import multiple video files
- `validateVideo(file: File): Promise<ValidationResult>` - Validate video format and size
- `extractMetadata(video: HTMLVideoElement): VideoMetadata` - Extract video metadata
- `generateThumbnail(video: HTMLVideoElement): Promise<string>` - Generate base64 thumbnail
- `getVideo(id: string): VideoResource | null` - Get video by ID
- `getAllVideos(): VideoResource[]` - Get all imported videos
- `getVideoCount(): number` - Get current video count
- `canAddVideos(count?: number): boolean` - Check if can add more videos
- `getRemainingSlots(): number` - Get remaining video slots
- `releaseVideo(id: string): void` - Release video resources
- `preloadVideos(ids: string[]): Promise<void>` - Preload videos for playback
- `clearAll(): void` - Clear all videos
- `getCacheStats()` - Get cache statistics

#### useVideoManager Hook

Returns an object with:

- `importing: boolean` - Import in progress
- `error: string | null` - Current error message
- `importVideos: (files: File[]) => Promise<VideoResource[]>` - Import function
- `importVideo: (file: File) => Promise<VideoResource>` - Import single video
- `removeVideo: (videoId: string) => void` - Remove video
- `clearError: () => void` - Clear error message
- `canAddVideos: (count?: number) => boolean` - Check capacity
- `remainingSlots: number` - Available slots
- `videoCount: number` - Current video count

### Validation Rules

1. **Supported Formats**: MP4, MOV, WebM
2. **Maximum File Size**: 500MB per video
3. **Maximum Video Count**: 20 videos per project
4. **Metadata Requirements**: Valid video duration, resolution, and codec

### Error Handling

The VideoManager throws descriptive errors for:

- Unsupported video formats
- Files exceeding size limit
- Exceeding video count limit
- Metadata extraction failures
- Thumbnail generation failures

### Performance Considerations

- Videos are cached using Object URLs
- Thumbnails are generated asynchronously
- Preloading mechanism for smooth playback
- Automatic resource cleanup on removal
- LRU-style cache management

### Requirements Satisfied

This implementation satisfies the following requirements from the spec:

- **Requirement 1.1**: Multi-file selection and drag-drop import
- **Requirement 1.2**: Format validation (MP4, MOV, WebM)
- **Requirement 1.3**: File size limit check (500MB)
- **Requirement 1.4**: Metadata extraction and display
- **Requirement 1.5**: Video count limit (max 20)



---

## SceneManager

The `SceneManager` class manages the Three.js 3D scene, camera, renderer, and video planes for rendering videos in 3D space.

### Features

- ✅ Three.js scene initialization with perspective camera
- ✅ 9:16 portrait aspect ratio (1080x1920) for vertical video
- ✅ WebGL renderer with performance optimization
- ✅ Video plane management (add, remove, transform)
- ✅ Scene lighting (ambient + directional lights)
- ✅ 60fps render loop with requestAnimationFrame
- ✅ Performance monitoring and auto quality adjustment
- ✅ Time-synchronized video playback

### Usage

#### Basic Setup

```typescript
import { SceneManager } from './core/SceneManager';

const canvas = document.querySelector('canvas');
const sceneManager = new SceneManager();

sceneManager.initialize(canvas, {
  width: 1080,
  height: 1920,
  autoAdjustQuality: true,
});

sceneManager.startRenderLoop();
```

#### With React Hook

```typescript
import { useSceneManager } from './core/useSceneManager';

function Preview3D() {
  const { sceneManager, canvasRef, isInitialized, quality, fps } = useSceneManager({
    autoStart: true,
    autoAdjustQuality: true,
  });

  useEffect(() => {
    if (!sceneManager || !isInitialized) return;

    // Add video clip to scene
    const videoElement = document.createElement('video');
    videoElement.src = videoUrl;
    
    const clip = {
      id: 'clip-1',
      videoId: 'video-1',
      startTime: 0,
      duration: 10,
      trimStart: 0,
      trimEnd: 10,
      transform: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
      effects: [],
    };

    const videoPlane = sceneManager.addVideoClip(clip, videoElement);
  }, [sceneManager, isInitialized]);

  return (
    <div>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      <div>FPS: {fps} | Quality: {quality}</div>
    </div>
  );
}
```

### API Reference

#### SceneManager Class

##### Methods

- `initialize(canvas: HTMLCanvasElement, config?: SceneConfig): void` - Initialize scene with canvas
- `addVideoClip(clip: VideoClip, videoElement: HTMLVideoElement): VideoPlane` - Add video to scene
- `removeVideoClip(clipId: string): void` - Remove video from scene
- `updateClipTransform(clipId: string, transform: Transform3D): void` - Update video transform
- `setPlaybackTime(time: number): void` - Set playback time for all videos
- `getCurrentTime(): number` - Get current playback time
- `startRenderLoop(): void` - Start 60fps render loop
- `stopRenderLoop(): void` - Stop render loop
- `render(): void` - Render single frame
- `resize(width: number, height: number): void` - Resize renderer and camera
- `getVideoPlane(clipId: string): VideoPlane | undefined` - Get video plane by ID
- `getAllVideoPlanes(): VideoPlane[]` - Get all video planes
- `getPerformanceMetrics()` - Get performance metrics (FPS, frame time, memory)
- `getQuality(): QualityLevel` - Get current quality level
- `setQuality(quality: QualityLevel): void` - Set quality level manually
- `setAutoAdjustQuality(enabled: boolean): void` - Enable/disable auto quality adjustment
- `getScene(): THREE.Scene` - Get Three.js scene reference
- `getCamera(): THREE.PerspectiveCamera` - Get camera reference
- `getRenderer(): THREE.WebGLRenderer` - Get renderer reference
- `dispose(): void` - Clean up all resources

#### useSceneManager Hook

Returns an object with:

- `sceneManager: SceneManager | null` - Scene manager instance
- `canvasRef: RefObject<HTMLCanvasElement>` - Canvas ref for rendering
- `isInitialized: boolean` - Initialization status
- `quality: QualityLevel` - Current quality level ('low' | 'medium' | 'high')
- `fps: number` - Current frames per second

### Quality Levels

The SceneManager automatically adjusts quality based on performance:

- **High**: Full resolution (1080x1920), antialiasing, shadows, high pixel ratio
- **Medium**: 75% resolution, antialiasing, no shadows
- **Low**: 50% resolution, no antialiasing, no shadows

### Performance Monitoring

The built-in PerformanceMonitor tracks:

- **FPS**: Frames per second (target: 60fps)
- **Frame Time**: Time per frame in milliseconds
- **Render Time**: Actual render time
- **Memory Usage**: JavaScript heap usage (if available)

Quality automatically degrades when FPS drops below 30 and upgrades when stable above 55fps.

### Requirements Satisfied

This implementation satisfies the following requirements from the spec:

- **Requirement 2.1**: 3D scene with video textures on planes
- **Requirement 2.3**: Real-time preview updates (60fps target)
- **Requirement 5.2**: Auto quality adjustment for performance
- **Requirement 10.1**: GPU capability detection and optimization

---

## VideoPlane

The `VideoPlane` class represents a 3D plane mesh with video texture for rendering videos in 3D space.

### Features

- ✅ Video texture mapping to 3D plane geometry
- ✅ Transform controls (position, rotation, scale)
- ✅ Opacity control for transitions
- ✅ Effect application support
- ✅ Time-synchronized video playback
- ✅ Automatic aspect ratio handling

### Usage

```typescript
import { VideoPlane } from './core/VideoPlane';

const videoElement = document.createElement('video');
videoElement.src = 'video.mp4';

const videoPlane = new VideoPlane('clip-1', videoElement, 16/9);

// Update transform
videoPlane.updateTransform({
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: Math.PI / 4, z: 0 },
  scale: { x: 1, y: 1, z: 1 },
});

// Update video time
videoPlane.updateTime(5.0); // Seek to 5 seconds

// Set opacity
videoPlane.setOpacity(0.5);

// Clean up
videoPlane.dispose();
```

---

## VideoTexture

The `VideoTexture` class extends Three.js VideoTexture with time-synchronized playback.

### Features

- ✅ Automatic video element synchronization
- ✅ Time-based texture updates
- ✅ Ready state management
- ✅ Optimized texture settings for video
- ✅ Resource cleanup

### Usage

```typescript
import { VideoTexture } from './core/VideoTexture';

const videoElement = document.createElement('video');
videoElement.src = 'video.mp4';

const videoTexture = new VideoTexture(videoElement);

// Update to specific time
videoTexture.update(5.0);

// Check if ready
if (videoTexture.isVideoReady()) {
  // Texture is ready for rendering
}

// Clean up
videoTexture.dispose();
```

---

## PerformanceMonitor

The `PerformanceMonitor` class monitors rendering performance and automatically adjusts quality.

### Features

- ✅ Real-time FPS tracking
- ✅ Frame time measurement
- ✅ Memory usage monitoring (when available)
- ✅ Auto quality adjustment (low/medium/high)
- ✅ Quality change callbacks
- ✅ Manual quality override

### Usage

```typescript
import { PerformanceMonitor } from './core/PerformanceMonitor';

const monitor = new PerformanceMonitor(true); // Enable auto-adjust

// Register quality change callback
monitor.onQualityChange((quality) => {
  console.log('Quality changed to:', quality);
});

// In render loop
function renderLoop() {
  monitor.beginFrame();
  
  // ... render scene ...
  
  monitor.endFrame();
  
  // Get metrics
  const metrics = monitor.getMetrics();
  console.log(`FPS: ${metrics.fps}, Frame Time: ${metrics.frameTime}ms`);
  
  requestAnimationFrame(renderLoop);
}
```



---

## TransitionSystem ✨ NEW (Task 7)

The `TransitionSystem` class manages 3D transition effects between video clips with GPU-accelerated rendering.

### Features

- ✅ 8 different transition types with unique visual effects
- ✅ Custom GLSL shaders for advanced effects
- ✅ Duration control (0.5-3 seconds)
- ✅ 7 easing functions for smooth animations
- ✅ GPU-accelerated particle systems
- ✅ Automatic resource management and cleanup
- ✅ Progress-based transition control (0-1)

### Supported Transitions

1. **Cube Flip** - 3D cube rotation effect using mesh transforms
2. **Sphere Warp** - Spherical distortion with custom GLSL shader
3. **Particle Burst** - Particle explosion using Three.js Points system
4. **Page Turn** - Book page flip with 3D curl simulation
5. **Dissolve** - Noise-based pixel dissolve with smooth edges
6. **Glitch** - Digital glitch with RGB separation and scanlines
7. **Zoom Blur** - Radial blur effect zooming into center
8. **Ripple** - Water ripple effect expanding from center

### Usage

#### Basic Usage

```typescript
import { TransitionSystem } from './core/TransitionSystem';
import { TransitionType } from './types';

const scene = new THREE.Scene();
const transitionSystem = new TransitionSystem(scene);

// Apply transition between two video planes
transitionSystem.applyTransition(
  fromVideoPlane,
  toVideoPlane,
  {
    type: TransitionType.CUBE_FLIP,
    duration: 1.0,
    easing: 'easeInOut',
    params: {}
  },
  0.5 // Progress: 0 to 1
);

// Reset when transition is complete
transitionSystem.resetTransition(fromVideoPlane, toVideoPlane);

// Clean up
transitionSystem.dispose();
```

#### With React Hook

```typescript
import { useTransitionSystem } from './core/useTransitionSystem';
import { useSceneManager } from './core/useSceneManager';

function MyComponent() {
  const { sceneManager } = useSceneManager();
  const { addTransition, updateTransitions, clearTransitions } = useTransitionSystem(sceneManager);

  // Add transition between clips
  const handleAddTransition = () => {
    addTransition(fromClip, toClip, {
      type: TransitionType.DISSOLVE,
      duration: 1.5,
      easing: 'easeInOut',
      params: {}
    });
  };

  // Update transitions in animation loop
  useEffect(() => {
    const animate = () => {
      const currentTime = sceneManager?.getCurrentTime() || 0;
      updateTransitions(currentTime);
      requestAnimationFrame(animate);
    };
    animate();
  }, [sceneManager, updateTransitions]);

  return <button onClick={handleAddTransition}>Add Transition</button>;
}
```

#### With TransitionSelector UI

```typescript
import { TransitionSelector } from './components/TransitionSelector';

function MyComponent() {
  const handleSelectTransition = (transition: Transition) => {
    console.log('Selected:', transition);
    // Apply to clips...
  };

  return (
    <TransitionSelector
      onSelectTransition={handleSelectTransition}
      currentTransition={currentTransition}
    />
  );
}
```

### API Reference

#### TransitionSystem Class

##### Constructor

- `constructor(scene: THREE.Scene)` - Initialize with Three.js scene

##### Methods

- `applyTransition(fromClip: VideoPlane, toClip: VideoPlane, transition: Transition, progress: number): void` - Apply transition effect
- `resetTransition(fromClip: VideoPlane, toClip: VideoPlane): void` - Reset clips to original state
- `dispose(): void` - Clean up all resources

##### Easing Functions

Available easing functions:
- `linear` - Constant speed
- `easeInOut` - Slow start and end, fast middle
- `easeIn` - Slow start, fast end
- `easeOut` - Fast start, slow end
- `easeInCubic` - Cubic ease in
- `easeOutCubic` - Cubic ease out
- `easeInOutCubic` - Cubic ease in and out

#### useTransitionSystem Hook

Returns an object with:

- `addTransition(fromClip: VideoClip, toClip: VideoClip, transition: Transition): void` - Add transition between clips
- `removeTransition(fromClipId: string, toClipId: string): void` - Remove transition
- `updateTransitions(currentTime: number): void` - Update all active transitions
- `clearTransitions(): void` - Clear all transitions
- `getActiveTransitions(): TransitionPlayback[]` - Get list of active transitions

### Transition Parameters

Each transition accepts a `Transition` object:

```typescript
interface Transition {
  type: TransitionType;        // One of 8 transition types
  duration: number;            // 0.5 to 3.0 seconds
  easing: string;              // Easing function name
  params: Record<string, any>; // Type-specific parameters
}
```

#### Type-Specific Parameters

**Particle Burst:**
```typescript
params: {
  particleCount: 1000  // Number of particles (500-5000)
}
```

### Shader Implementation

Transitions use custom GLSL shaders for advanced effects. Shaders are defined in `src/shaders/transitions/index.ts`:

```typescript
import { transitionShaders } from './shaders/transitions';

// Access shader code
const vertexShader = transitionShaders.dissolve.vertex;
const fragmentShader = transitionShaders.dissolve.fragment;
```

### Performance Considerations

- Shader materials are cached and reused
- Particle systems are created on-demand and cleaned up automatically
- GPU-accelerated rendering for smooth 60fps transitions
- Automatic resource disposal prevents memory leaks
- Optimized for mobile and desktop devices

### Requirements Satisfied

This implementation satisfies the following requirements from the spec:

- **Requirement 3.1**: 8 preset 3D transition effects with preview
- **Requirement 3.2**: Adjustable transition duration (0.5-3 seconds)
- **Requirement 3.3**: Real-time rendering of 3D transition animations
- **Requirement 3.4**: Transition parameter adjustment with preview
- **Requirement 3.5**: GPU-accelerated transition rendering

### Examples

#### Cube Flip Transition

```typescript
transitionSystem.applyTransition(fromPlane, toPlane, {
  type: TransitionType.CUBE_FLIP,
  duration: 1.0,
  easing: 'easeInOut',
  params: {}
}, progress);
```

#### Particle Burst with Custom Count

```typescript
transitionSystem.applyTransition(fromPlane, toPlane, {
  type: TransitionType.PARTICLE_BURST,
  duration: 2.0,
  easing: 'easeOut',
  params: { particleCount: 3000 }
}, progress);
```

#### Glitch Transition

```typescript
transitionSystem.applyTransition(fromPlane, toPlane, {
  type: TransitionType.GLITCH,
  duration: 0.8,
  easing: 'linear',
  params: {}
}, progress);
```

