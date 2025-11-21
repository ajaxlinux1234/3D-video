/**
 * TransformControlsPanel - UI panel for transform controls and undo/redo
 */
import { useAppStore } from '../store/useAppStore';
import type { Transform3D } from '../types';
import './TransformControlsPanel.css';

export function TransformControlsPanel() {
  const currentProject = useAppStore(state => state.currentProject);
  const selectedClipId = useAppStore(state => state.selectedClipId);
  const updateClip = useAppStore(state => state.updateClip);
  const pushHistory = useAppStore(state => state.pushHistory);
  const undo = useAppStore(state => state.undo);
  const redo = useAppStore(state => state.redo);
  const canUndo = useAppStore(state => state.canUndo);
  const canRedo = useAppStore(state => state.canRedo);

  // Get selected clip
  const selectedClip = currentProject?.clips.find(clip => clip.id === selectedClipId);

  if (!selectedClip) {
    return (
      <div className="transform-controls-panel">
        <div className="panel-header">
          <h3>Transform Controls</h3>
        </div>
        <div className="panel-content">
          <p className="no-selection">No clip selected</p>
        </div>
        <div className="panel-actions">
          <button 
            onClick={undo} 
            disabled={!canUndo()}
            title="Undo (Ctrl+Z)"
          >
            ↶ Undo
          </button>
          <button 
            onClick={redo} 
            disabled={!canRedo()}
            title="Redo (Ctrl+Shift+Z)"
          >
            ↷ Redo
          </button>
        </div>
      </div>
    );
  }

  const handleTransformChange = (
    property: keyof Transform3D,
    axis: 'x' | 'y' | 'z',
    value: number
  ) => {
    const oldTransform = { ...selectedClip.transform };
    const newTransform = {
      ...oldTransform,
      [property]: {
        ...oldTransform[property],
        [axis]: value,
      },
    };

    // Update clip
    updateClip(selectedClipId!, { transform: newTransform });

    // Push to history
    pushHistory({
      type: 'transform',
      clipId: selectedClipId!,
      before: oldTransform,
      after: newTransform,
    });
  };

  const { position, rotation, scale } = selectedClip.transform;

  return (
    <div className="transform-controls-panel">
      <div className="panel-header">
        <h3>Transform Controls</h3>
        <span className="selected-clip-id">Clip: {selectedClipId?.slice(0, 8)}...</span>
      </div>

      <div className="panel-content">
        {/* Position Controls */}
        <div className="transform-section">
          <h4>Position</h4>
          <div className="transform-inputs">
            <label>
              X:
              <input
                type="number"
                step="0.1"
                value={position.x.toFixed(2)}
                onChange={(e) => handleTransformChange('position', 'x', parseFloat(e.target.value))}
              />
            </label>
            <label>
              Y:
              <input
                type="number"
                step="0.1"
                value={position.y.toFixed(2)}
                onChange={(e) => handleTransformChange('position', 'y', parseFloat(e.target.value))}
              />
            </label>
            <label>
              Z:
              <input
                type="number"
                step="0.1"
                value={position.z.toFixed(2)}
                onChange={(e) => handleTransformChange('position', 'z', parseFloat(e.target.value))}
              />
            </label>
          </div>
        </div>

        {/* Rotation Controls */}
        <div className="transform-section">
          <h4>Rotation (radians)</h4>
          <div className="transform-inputs">
            <label>
              X:
              <input
                type="number"
                step="0.1"
                value={rotation.x.toFixed(2)}
                onChange={(e) => handleTransformChange('rotation', 'x', parseFloat(e.target.value))}
              />
            </label>
            <label>
              Y:
              <input
                type="number"
                step="0.1"
                value={rotation.y.toFixed(2)}
                onChange={(e) => handleTransformChange('rotation', 'y', parseFloat(e.target.value))}
              />
            </label>
            <label>
              Z:
              <input
                type="number"
                step="0.1"
                value={rotation.z.toFixed(2)}
                onChange={(e) => handleTransformChange('rotation', 'z', parseFloat(e.target.value))}
              />
            </label>
          </div>
        </div>

        {/* Scale Controls */}
        <div className="transform-section">
          <h4>Scale</h4>
          <div className="transform-inputs">
            <label>
              X:
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={scale.x.toFixed(2)}
                onChange={(e) => handleTransformChange('scale', 'x', parseFloat(e.target.value))}
              />
            </label>
            <label>
              Y:
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={scale.y.toFixed(2)}
                onChange={(e) => handleTransformChange('scale', 'y', parseFloat(e.target.value))}
              />
            </label>
            <label>
              Z:
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={scale.z.toFixed(2)}
                onChange={(e) => handleTransformChange('scale', 'z', parseFloat(e.target.value))}
              />
            </label>
          </div>
        </div>
      </div>

      <div className="panel-actions">
        <button 
          onClick={undo} 
          disabled={!canUndo()}
          title="Undo (Ctrl+Z)"
        >
          ↶ Undo
        </button>
        <button 
          onClick={redo} 
          disabled={!canRedo()}
          title="Redo (Ctrl+Shift+Z)"
        >
          ↷ Redo
        </button>
      </div>
    </div>
  );
}
