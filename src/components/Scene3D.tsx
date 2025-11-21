/**
 * Scene3D - React Three Fiber scene with transform controls
 */
import React, { useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Transform3DController } from './Transform3DController';
import { useAppStore } from '../store/useAppStore';
import * as THREE from 'three';

interface VideoPlaneProps {
  clipId: string;
  videoElement: HTMLVideoElement;
  transform: {
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number };
    scale: { x: number; y: number; z: number };
  };
  isSelected: boolean;
}

function VideoPlane3D({ clipId, videoElement, transform, isSelected }: VideoPlaneProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const textureRef = useRef<THREE.VideoTexture | null>(null);

  useEffect(() => {
    if (!videoElement || !materialRef.current) return;

    // Create video texture
    const texture = new THREE.VideoTexture(videoElement);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.format = THREE.RGBAFormat;
    textureRef.current = texture;

    // Apply texture to material
    materialRef.current.map = texture;
    materialRef.current.needsUpdate = true;

    return () => {
      texture.dispose();
    };
  }, [videoElement]);

  // Calculate plane size based on video aspect ratio
  const aspectRatio = videoElement.videoWidth / videoElement.videoHeight || 16 / 9;
  const width = 2;
  const height = width / aspectRatio;

  return (
    <group>
      <mesh
        ref={meshRef}
        position={[transform.position.x, transform.position.y, transform.position.z]}
        rotation={[transform.rotation.x, transform.rotation.y, transform.rotation.z]}
        scale={[transform.scale.x, transform.scale.y, transform.scale.z]}
      >
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial
          ref={materialRef}
          side={THREE.DoubleSide}
          transparent
          opacity={1.0}
        />
      </mesh>
      
      {/* Show selection outline */}
      {isSelected && (
        <lineSegments
          position={[transform.position.x, transform.position.y, transform.position.z]}
          rotation={[transform.rotation.x, transform.rotation.y, transform.rotation.z]}
          scale={[transform.scale.x, transform.scale.y, transform.scale.z]}
        >
          <edgesGeometry args={[new THREE.PlaneGeometry(width, height)]} />
          <lineBasicMaterial color={0x00ff00} linewidth={2} transparent opacity={0.8} />
        </lineSegments>
      )}
      
      {/* Transform controls - only render when selected and mesh is available */}
      {isSelected && <TransformControlsWrapper clipId={clipId} meshRef={meshRef} />}
    </group>
  );
}

// Separate component to handle transform controls with ref
function TransformControlsWrapper({ 
  clipId, 
  meshRef 
}: { 
  clipId: string; 
  meshRef: React.RefObject<THREE.Mesh | null>;
}) {
  const [mesh, setMesh] = React.useState<THREE.Mesh | null>(null);

  useEffect(() => {
    // Access ref in effect, not during render
    if (meshRef.current) {
      setMesh(meshRef.current);
    }
  }, [meshRef]);

  if (!mesh) return null;

  return <Transform3DController clipId={clipId} mesh={mesh} />;
}

export function Scene3D() {
  const currentProject = useAppStore(state => state.currentProject);
  const videos = useAppStore(state => state.videos);
  const selectedClipId = useAppStore(state => state.selectedClipId);
  const setSelectedClip = useAppStore(state => state.setSelectedClip);

  const handleCanvasClick = () => {
    // Deselect if clicking on empty space (canvas background)
    setSelectedClip(null);
  };

  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 50 }}
      style={{ width: '100%', height: '100%' }}
      onClick={handleCanvasClick}
    >
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />

      {/* Render video clips */}
      {currentProject?.clips.map(clip => {
        const video = videos.get(clip.videoId);
        if (!video?.videoElement) return null;

        return (
          <group
            key={clip.id}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedClip(clip.id);
            }}
          >
            <VideoPlane3D
              clipId={clip.id}
              videoElement={video.videoElement}
              transform={clip.transform}
              isSelected={selectedClipId === clip.id}
            />
          </group>
        );
      })}

      {/* Camera controls */}
      <OrbitControls makeDefault />
    </Canvas>
  );
}
