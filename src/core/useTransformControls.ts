/**
 * useTransformControls - Hook for managing 3D transform controls
 */
import { useEffect, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { SceneManager } from './SceneManager';

export interface TransformMode {
  mode: 'translate' | 'rotate' | 'scale';
}

export function useTransformControls(sceneManager: SceneManager | null) {
  const selectedClipId = useAppStore(state => state.selectedClipId);
  const setSelectedClip = useAppStore(state => state.setSelectedClip);
  const undo = useAppStore(state => state.undo);
  const redo = useAppStore(state => state.redo);
  const canUndo = useAppStore(state => state.canUndo);
  const canRedo = useAppStore(state => state.canRedo);

  // Update scene manager when selection changes
  useEffect(() => {
    if (!sceneManager) return;
    sceneManager.setSelectedClip(selectedClipId);
  }, [sceneManager, selectedClipId]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Undo: Ctrl+Z (Cmd+Z on Mac)
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        if (canUndo()) {
          undo();
        }
      }

      // Redo: Ctrl+Shift+Z or Ctrl+Y (Cmd+Shift+Z or Cmd+Y on Mac)
      if (
        ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'z') ||
        ((event.ctrlKey || event.metaKey) && event.key === 'y')
      ) {
        event.preventDefault();
        if (canRedo()) {
          redo();
        }
      }

      // Delete: Delete or Backspace
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedClipId) {
        event.preventDefault();
        const removeClip = useAppStore.getState().removeClip;
        removeClip(selectedClipId);
      }

      // Deselect: Escape
      if (event.key === 'Escape' && selectedClipId) {
        event.preventDefault();
        setSelectedClip(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedClipId, setSelectedClip, undo, redo, canUndo, canRedo]);

  // Select clip by clicking on canvas
  const handleCanvasClick = useCallback((event: MouseEvent) => {
    if (!sceneManager) return;

    const canvas = sceneManager.getRenderer().domElement;
    const rect = canvas.getBoundingClientRect();
    
    // Calculate normalized device coordinates
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Raycasting to detect clicked object
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(x, y);
    raycaster.setFromCamera(mouse, sceneManager.getCamera());

    const videoPlanes = sceneManager.getAllVideoPlanes();
    const meshes = videoPlanes.map(plane => plane.mesh);
    const intersects = raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
      // Get the first intersected object
      const clickedMesh = intersects[0].object;
      const clipId = clickedMesh.userData.clipId;
      if (clipId) {
        setSelectedClip(clipId);
      }
    } else {
      // Clicked on empty space - deselect
      setSelectedClip(null);
    }
  }, [sceneManager, setSelectedClip]);

  // Attach click handler to canvas
  useEffect(() => {
    if (!sceneManager) return;

    const canvas = sceneManager.getRenderer().domElement;
    canvas.addEventListener('click', handleCanvasClick);

    return () => {
      canvas.removeEventListener('click', handleCanvasClick);
    };
  }, [sceneManager, handleCanvasClick]);

  return {
    selectedClipId,
    setSelectedClip,
    canUndo: canUndo(),
    canRedo: canRedo(),
    undo,
    redo,
  };
}

// Import THREE for raycasting
import * as THREE from 'three';
