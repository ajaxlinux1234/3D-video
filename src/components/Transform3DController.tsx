/**
 * Transform3DController - Provides visual transform controls for selected video clips
 */
import { useRef } from 'react';
import { TransformControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '../store/useAppStore';
import type { Transform3D } from '../types';

interface Transform3DControllerProps {
  clipId: string;
  mesh: THREE.Mesh;
  onTransformChange?: (transform: Transform3D) => void;
}

export function Transform3DController({ 
  clipId, 
  mesh,
  onTransformChange 
}: Transform3DControllerProps) {
  const { camera, gl } = useThree();
  const updateClip = useAppStore(state => state.updateClip);
  const pushHistory = useAppStore(state => state.pushHistory);
  
  // Track if we're currently dragging
  const isDraggingRef = useRef(false);
  const initialTransformRef = useRef<Transform3D | null>(null);

  // Handle drag start - save initial state for undo
  const handleDragStart = () => {
    isDraggingRef.current = true;
    
    // Save initial transform for undo
    initialTransformRef.current = {
      position: { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z },
      rotation: { x: mesh.rotation.x, y: mesh.rotation.y, z: mesh.rotation.z },
      scale: { x: mesh.scale.x, y: mesh.scale.y, z: mesh.scale.z },
    };
  };

  // Handle drag - update transform in real-time
  const handleDrag = () => {
    if (!isDraggingRef.current) return;

    const transform: Transform3D = {
      position: { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z },
      rotation: { x: mesh.rotation.x, y: mesh.rotation.y, z: mesh.rotation.z },
      scale: { x: mesh.scale.x, y: mesh.scale.y, z: mesh.scale.z },
    };

    // Update store (without history during drag)
    updateClip(clipId, { transform });
    
    // Notify parent
    onTransformChange?.(transform);
  };

  // Handle drag end - save to history for undo/redo
  const handleDragEnd = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    const finalTransform: Transform3D = {
      position: { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z },
      rotation: { x: mesh.rotation.x, y: mesh.rotation.y, z: mesh.rotation.z },
      scale: { x: mesh.scale.x, y: mesh.scale.y, z: mesh.scale.z },
    };

    // Push to history for undo/redo
    if (initialTransformRef.current) {
      pushHistory({
        type: 'transform',
        clipId,
        before: initialTransformRef.current,
        after: finalTransform,
      });
    }

    initialTransformRef.current = null;
  };

  return (
    <TransformControls
      object={mesh}
      camera={camera}
      domElement={gl.domElement}
      mode="translate" // Default mode: translate, can be changed to 'rotate' or 'scale'
      translationSnap={0.1}
      rotationSnap={Math.PI / 16}
      scaleSnap={0.1}
      showX={true}
      showY={true}
      showZ={true}
      enabled={true}
      onObjectChange={handleDrag}
      onMouseDown={handleDragStart}
      onMouseUp={handleDragEnd}
    />
  );
}
