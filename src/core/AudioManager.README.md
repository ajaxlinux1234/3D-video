# AudioManager

The AudioManager is responsible for handling all audio operations in the 3D Video Composer, including audio extraction from videos, background music import, volume control, fade effects, multi-track mixing, and time synchronization.

## Features

### 1. Web Audio API Integration
- Initializes and manages AudioContext
- Handles audio context suspension/resumption
- Creates and manages audio nodes (source, gain, master)

### 2. Audio Track Management
- Extract audio from video elements
- Import audio files (MP3, WAV, AAC)
- Add, remove, and update audio tracks
- Support for multiple track types: video, music, sfx

### 3. Volume Control
- Volume adjustment from 0-1 (linear)
- dB-based volume control (-60dB to +12dB)
- Per-track gain nodes
- Master gain control

### 4. Fade Effects
- Fade in effects (0.5-3 seconds)
- Fade out effects (0.5-3 seconds)
- Smooth gain ramping using Web Audio API

### 5. Playback Control
- Play from specific time
- Pause and resume
- Stop and reset
- Seek to time position
- Time synchronization with video timeline

### 6. Multi-Track Mixing
- Mix multiple audio tracks into single buffer
- Offline audio rendering
- Preserves volume and fade settings
- Stereo output

### 7. Waveform Visualization
- Generate waveform data from audio buffers
- Configurable sample count
- Peak detection for visualization
- Used for timeline display

## Usage

### Basic Setup

```typescript
import { AudioManager, getAudioManager } from './core/AudioManager';

// Get singleton instance
const audioManager = getAudioManager();

// Initialize
await audioManager.initialize({
  sampleRate: 48000,
  latencyHint: 'interactive'
});
```

### Using the React Hook

```typescript
import { useAudioManager } from './core/useAudioManager';

function MyComponent() {
  const {
    initialize,
    loadAudioFile,
    addTrack,
    setVolume,
    play,
    pause,
    isPlaying,
    tracks
  } = useAudioManager();

  useEffect(() => {
    initialize();
  }, []);

  // ... use audio functions
}
```

### Import Audio File

```typescript
// Load audio file
const file = // ... File object
const audioBuffer = await audioManager.loadAudioFile(file);

// Create track
const track: AudioTrack = {
  id: crypto.randomUUID(),
  type: 'music',
  source: URL.createObjectURL(file),
  startTime: 0,
  duration: audioBuffer.duration,
  volume: 0.8,
  audioBuffer
};

// Add track
audioManager.addTrack(track);
```

### Volume Control

```typescript
// Set volume (0-1)
audioManager.setVolume(trackId, 0.8);

// Set volume in dB (-60 to +12)
audioManager.setVolumeDb(trackId, -6);
```

### Fade Effects

```typescript
// Apply fade in (0.5-3 seconds)
audioManager.applyFadeIn(trackId, 1.5);

// Apply fade out (0.5-3 seconds)
audioManager.applyFadeOut(trackId, 2.0);
```

### Playback Control

```typescript
// Play from beginning
audioManager.play();

// Play from specific time
audioManager.play(5.0);

// Pause
audioManager.pause();

// Stop
audioManager.stop();

// Seek
audioManager.seek(10.0);

// Get current time
const currentTime = audioManager.getCurrentTime();
```

### Mix Tracks

```typescript
// Mix all tracks into single buffer
const mixedBuffer = await audioManager.mixTracks();

// Use mixed buffer for export
// ...
```

### Generate Waveform

```typescript
// Generate waveform data
const waveformData = audioManager.generateWaveform(audioBuffer, 1000);

// Use for visualization
<AudioWaveform waveformData={waveformData} />
```

## Architecture

### Audio Node Graph

```
[AudioBufferSource] → [GainNode] → [MasterGain] → [Destination]
     (per track)      (per track)    (singleton)    (speakers)
```

### Time Synchronization

The AudioManager maintains synchronization with the video timeline:

1. **Play**: Starts all tracks from specified time
2. **Pause**: Stops playback and records pause time
3. **Seek**: Updates time and restarts if playing
4. **getCurrentTime**: Returns accurate playback position

### Track Scheduling

Tracks are scheduled based on their `startTime` and `duration`:

```typescript
// Only play tracks that overlap with current time
if (currentTime >= track.startTime && 
    currentTime < track.startTime + track.duration) {
  playTrack(trackId, currentTime);
}
```

## Components

### AudioImporter
Component for importing audio files via file picker or drag-and-drop.

### AudioPanel
Main panel for managing audio tracks with volume, fade controls.

### AudioWaveform
Canvas-based waveform visualization component.

## Requirements Mapping

- **Requirement 8.1**: ✅ Automatic audio extraction from videos
- **Requirement 8.2**: ✅ Background music import (MP3, WAV, AAC)
- **Requirement 8.3**: ✅ Volume control (-60dB to +12dB)
- **Requirement 8.4**: ✅ Fade in/out effects (0.5-3s)
- **Requirement 8.5**: ✅ Multi-track mixing and time sync

## Performance Considerations

1. **Offline Rendering**: Mixing uses OfflineAudioContext for better performance
2. **Memory Management**: Audio buffers are stored in tracks, cleaned up on removal
3. **Node Cleanup**: Source and gain nodes are properly disconnected
4. **Context Suspension**: Audio context suspended when not in use

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

All modern browsers support Web Audio API.

## Future Enhancements

1. Audio effects (reverb, EQ, compression)
2. Real-time audio analysis (spectrum, VU meters)
3. Audio recording from microphone
4. MIDI support
5. Audio stretching/time-shifting
