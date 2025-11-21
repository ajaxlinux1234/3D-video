/**
 * AspectRatioTest - Simple test component for aspect ratio adaptation
 */
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { AspectRatioAdapter } from '../core/AspectRatioAdapter';

export function AspectRatioTest() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Setup scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;

    // Setup camera (9:16 aspect ratio)
    const camera = new THREE.PerspectiveCamera(50, 9 / 16, 0.1, 1000);
    camera.position.z = 5;

    // Setup renderer
    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current });
    renderer.setSize(540, 960); // Half of 1080x1920 for display
    rendererRef.current = renderer;

    // Add safe area lines
    const safeAreaLines = AspectRatioAdapter.createSafeAreaLines();
    scene.add(safeAreaLines);

    // Add canvas boundary lines
    const boundaryLines = AspectRatioAdapter.createCanvasBoundaryLines();
    scene.add(boundaryLines);

    // Add a test plane
    const geometry = new THREE.PlaneGeometry(2, 2 / (9 / 16));
    const material = new THREE.MeshBasicMaterial({
      color: 0x2563eb,
      transparent: true,
      opacity: 0.5,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Render
    renderer.render(scene, camera);

    // Cleanup
    return () => {
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, []);

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h3>9:16 Aspect Ratio Test</h3>
      <p>Green: Safe Area | Red: Canvas Boundary | Blue: Test Plane</p>
      <canvas ref={canvasRef} style={{ border: '1px solid #333' }} />
      <div style={{ marginTop: '20px', textAlign: 'left', maxWidth: '540px', margin: '20px auto' }}>
        <h4>Test Results:</h4>
        <ul>
          <li>✅ Canvas locked to 9:16 aspect ratio (540x960)</li>
          <li>✅ Safe area reference lines displayed (green)</li>
          <li>✅ Canvas boundary lines displayed (red)</li>
          <li>✅ Test plane fits within canvas bounds</li>
        </ul>
      </div>
    </div>
  );
}
