/**
 * FrameCapture - Captures frames from the 3D scene for export
 */
import * as THREE from 'three';
import { SceneManager } from './SceneManager';

export class FrameCapture {
  private sceneManager: SceneManager;
  private offscreenCanvas: HTMLCanvasElement | null = null;
  private offscreenRenderer: THREE.WebGLRenderer | null = null;

  constructor(sceneManager: SceneManager) {
    this.sceneManager = sceneManager;
  }

  /**
   * Capture a single frame at the specified time
   */
  async captureFrame(time: number, width: number, height: number): Promise<ImageData> {
    // Setup offscreen renderer if not already created
    if (!this.offscreenRenderer) {
      this.setupOffscreenRenderer(width, height);
    }

    // Ensure renderer size matches requested dimensions
    if (this.offscreenRenderer && this.offscreenCanvas) {
      if (
        this.offscreenCanvas.width !== width ||
        this.offscreenCanvas.height !== height
      ) {
        this.offscreenRenderer.setSize(width, height);
      }
    }

    // Set playback time
    this.sceneManager.setPlaybackTime(time);

    // Render the frame
    if (this.offscreenRenderer) {
      const scene = this.sceneManager.getScene();
      const camera = this.sceneManager.getCamera();
      
      // Update camera aspect ratio for export dimensions
      const originalAspect = camera.aspect;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      
      // Render
      this.offscreenRenderer.render(scene, camera);
      
      // Restore original aspect ratio
      camera.aspect = originalAspect;
      camera.updateProjectionMatrix();
    }

    // Extract image data from canvas
    return this.extractImageData(width, height);
  }

  /**
   * Setup offscreen renderer for frame capture
   */
  private setupOffscreenRenderer(width: number, height: number): void {
    // Create offscreen canvas
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = width;
    this.offscreenCanvas.height = height;

    // Create offscreen renderer
    this.offscreenRenderer = new THREE.WebGLRenderer({
      canvas: this.offscreenCanvas,
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true, // Important for reading pixels
      powerPreference: 'high-performance',
    });

    this.offscreenRenderer.setSize(width, height);
    this.offscreenRenderer.setPixelRatio(1); // Use 1:1 pixel ratio for export
    this.offscreenRenderer.setClearColor(0x000000, 1);

    // Match tone mapping settings
    this.offscreenRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.offscreenRenderer.toneMappingExposure = 1.0;
  }

  /**
   * Extract ImageData from the offscreen canvas
   */
  private extractImageData(width: number, height: number): ImageData {
    if (!this.offscreenCanvas) {
      throw new Error('Offscreen canvas not initialized');
    }

    const ctx = this.offscreenCanvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context from offscreen canvas');
    }

    return ctx.getImageData(0, 0, width, height);
  }

  /**
   * Capture a sequence of frames
   */
  async captureSequence(
    startTime: number,
    endTime: number,
    fps: number,
    width: number,
    height: number,
    onFrame: (frame: ImageData, time: number, frameNumber: number) => void
  ): Promise<void> {
    const frameDuration = 1 / fps;
    const totalFrames = Math.ceil((endTime - startTime) * fps);

    for (let i = 0; i < totalFrames; i++) {
      const time = startTime + i * frameDuration;
      const frame = await this.captureFrame(time, width, height);
      onFrame(frame, time, i);
    }
  }

  /**
   * Dispose and clean up resources
   */
  dispose(): void {
    if (this.offscreenRenderer) {
      this.offscreenRenderer.dispose();
      this.offscreenRenderer = null;
    }

    if (this.offscreenCanvas) {
      this.offscreenCanvas = null;
    }
  }
}
