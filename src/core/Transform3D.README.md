# 3D Transform Control System

## Overview

The 3D Transform Control System provides interactive manipulation of video clips in 3D space with visual controls, selection management, and undo/redo functionality.

## Components

### 1. Transform3DController (`src/components/Transform3DController.tsx`)

React component that integrates with @react-three/drei's TransformControls to provide visual manipulation handles.

**Features:**
- Visual transform handles (translate, rotate, scale)
- Real-time transform updates
- Automatic history tracking for undo/redo
- Snap-to-grid functionality

**Usage:**
```tsx
<Transform3DController 
  clipId={clip.id}
  mesh={meshRef.current}
  onTransformChange={(transform) => console.log(transform)}
/>
```

### 2. TransformControlsPanel (`src/components/TransformControlsPanel.tsx`)

UI panel for precise numeric control of transforms and undo/redo buttons.

**Features:**
- Numeric input for position, rotation, scale
- Undo/Redo buttons with keyboard shortcuts
- Real-time sync with 3D scene
- Disabled state when no clip is selected

### 3. useTransformControls Hook (`src/core/useTransformControls.ts`)

React hook for managing transform controls state and interactions.

**Features:**
- Click-to-select functionality with raycasting
- Keyboard shortcuts (Ctrl+Z, Ctrl+Shift+Z, Delete, Escape)
- Selection state management
- Integration with SceneManager

**Usage:**
```tsx
const { selectedClipId, canUndo, canRedo, undo, redo } = useTransformControls(sceneManager);
```

## Store Integration

### History State

The store now includes undo/redo functionality:

```typescript
interface AppState {
  history: HistoryEntry[];
  historyIndex: number;
  
  pushHistory: (entry: Omit<HistoryEntry, 'timestamp'>) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;
}
```

### History Entry Format

```typescript
interface HistoryEntry {
  type: 'transform' | 'clip' | 'audio';
  clipId?: string;
  before: any;
  after: any;
  timestamp: number;
}
```

## VideoPlane Enhancements

### Highlight/Selection

VideoPlane now supports visual selection highlighting:

```typescript
videoPlane.setHighlight(true);  // Show green outline
videoPlane.isSelected();        // Check selection state
```

## SceneManager Enhancements

### Selection Management

```typescript
sceneManager.setSelectedClip(clipId);     // Highlight clip
sceneManager.getSelectedClipId();         // Get selected clip
```

## Keyboard Shortcuts

- **Ctrl+Z / Cmd+Z**: Undo last transform
- **Ctrl+Shift+Z / Cmd+Shift+Z**: Redo transform
- **Ctrl+Y / Cmd+Y**: Redo transform (alternative)
- **Delete / Backspace**: Remove selected clip
- **Escape**: Deselect current clip

## Transform Modes

The TransformControls supports three modes:
- **translate**: Move clip in 3D space
- **rotate**: Rotate clip around axes
- **scale**: Scale clip size

## Snap Settings

- **Translation Snap**: 0.1 units
- **Rotation Snap**: π/16 radians (~11.25°)
- **Scale Snap**: 0.1 units

## Integration Example

```tsx
import { Preview3D } from './components/Preview3D';
import { TransformControlsPanel } from './components/TransformControlsPanel';

function App() {
  return (
    <div className="app">
      <Preview3D />
      {/* TransformControlsPanel is already integrated in Preview3D */}
    </div>
  );
}
```

## Requirements Satisfied

This implementation satisfies requirements:
- **2.2**: 3D空间变换控制 (3D space transform controls)
- **2.4**: 撤销/重做功能 (Undo/redo functionality)

## Technical Details

### Transform Data Flow

1. User interacts with TransformControls or numeric inputs
2. Transform data updates in real-time
3. On drag end, history entry is created
4. Store updates trigger re-render
5. SceneManager applies transform to VideoPlane mesh

### History Management

- Maximum 50 history entries (FIFO)
- History cleared on project reset
- Undo/redo updates both store and 3D scene
- History entries include timestamp for debugging

## Future Enhancements

- Multi-select support
- Transform gizmo mode switching (G/R/S keys)
- Copy/paste transforms
- Transform presets
- Animation keyframes
