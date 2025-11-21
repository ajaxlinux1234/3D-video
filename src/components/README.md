# Components

React UI components for the 3D Video Composer application.

## Implemented Components

- `Preview3D.tsx` - 3D preview window with Three.js canvas
- `Scene3D.tsx` - 3D scene rendering component
- `TimelineEditor.tsx` - Timeline editor for arranging video clips
- `VideoImporter.tsx` - Video file import interface
- `VideoLibrary.tsx` - Video resource library display
- `Transform3DController.tsx` - 3D transform controls for video clips
- `TransformControlsPanel.tsx` - UI panel for transform controls
- `TransitionSelector.tsx` - Transition effect selector and configuration
- `TransitionDemo.tsx` - Example component demonstrating transition usage
- `EffectsPanel.tsx` - Effects and filters panel with real-time preview
- `EffectsDemo.tsx` - Example component demonstrating effect usage
- `AudioImporter.tsx` - Audio file import interface (NEW)
- `AudioPanel.tsx` - Audio track management panel (NEW)
- `AudioWaveform.tsx` - Audio waveform visualization (NEW)

## Transition Components (Task 7)

### TransitionSelector
UI component for selecting and configuring transition effects between video clips.

Features:
- Grid display of 8 transition types with icons and descriptions
- Duration adjustment (0.5-3 seconds)
- Easing function selection (7 options)
- Particle count control for particle burst effect
- Visual feedback for selected transition

### TransitionDemo
Example component showing how to integrate the transition system with the scene manager.

## Audio Components (Task 9)

### AudioImporter
Component for importing audio files via file picker or drag-and-drop.

Features:
- Drag-and-drop audio file import
- File picker interface
- Support for MP3, WAV, AAC formats
- File size validation (max 100MB)
- Loading state and error handling

### AudioPanel
Main panel for managing audio tracks with comprehensive controls.

Features:
- Display all audio tracks (video, music, sfx)
- Per-track volume control (-60dB to +12dB)
- Fade in/out effects (0.5-3 seconds)
- Track removal
- Advanced settings toggle
- Track type icons and duration display

### AudioWaveform
Canvas-based waveform visualization component.

Features:
- Real-time waveform rendering
- Configurable dimensions and colors
- Playhead indicator
- Peak detection visualization
- Smooth rendering

## Planned Structure

- `ExportDialog/` - Export settings dialog (Task 12)
- `Controls/` - Additional playback and editing controls
