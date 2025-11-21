/**
 * SceneManager - Manages Three.js scene, camera, renderer, and video planes
 */
import * as THREE from 'three';
import { VideoPlane } from './VideoPlane';
import { PerformanceMonitor, type QualityLevel } from './PerformanceMonitor';
import { PerformanceOptimizer } from './PerformanceOptimizer';
import { AspectRatioAdapter } from './AspectRatioAdapter';
import type { VideoClip, Transform3D, AspectRatioAdaptation } from '../types';

export interface SceneConfig {
  width: number;
  height: number;
  antialias?: boolean;
  autoAdjustQuality?: boolean;
}

export class SceneManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private videoPlanes: Map<string, VideoPlane>;
  private performanceMonitor: PerformanceMonitor;
  private performanceOptimizer: PerformanceOptimizer | null = null;
  
  private animationFrameId: number | null = null;
  private isRendering: boolean = false;
  private currentTime: number = 0;
  
  // Lighting
  private ambientLight: THREE.AmbientLight;
  private directionalLight: THREE.DirectionalLight;
  
  // 9:16 aspect ratio (portrait)
  private readonly ASPECT_RATIO = 9 / 16;
  private readonly DEFAULT_WIDTH = 1080;
  private readonly DEFAULT_HEIGHT = 1920;
  
  // Safe area and boundary reference lines
  private safeAreaLines: THREE.LineSegments | null = null;
  private canvasBoundaryLines: THREE.LineSegments | null = null;
  private showSafeArea: boolean = true;

  constructor() {
    this.scene = new THREE.Scene();
    this.videoPlanes = new Map();
    this.performanceMonitor = new PerformanceMonitor(true);
    
    // Initialize camera (will be configured in initialize())
    this.camera = new THREE.PerspectiveCamera();
    
    // Initialize renderer (will be configured in initialize())
    this.renderer = new THREE.WebGLRenderer();
    
    // Initialize lights (will be added to scene in initialize())
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    
    // Setup performance monitoring callbacks
    this.setupPerformanceMonitoring();
  }

  /**
   * Initialize the scene with canvas element
   */
  initialize(canvas: HTMLCanvasElement, config?: Partial<SceneConfig>): void {
    
    const width = config?.width || this.DEFAULT_WIDTH;
    const height = config?.height || this.DEFAULT_HEIGHT;
    const antialias = config?.antialias !== undefined ? config.antialias : true;
    
    // Configure camera
    this.camera = new THREE.PerspectiveCamera(
      50, // FOV
      this.ASPECT_RATIO, // Aspect ratio (9:16)
      0.1, // Near plane
      1000 // Far plane
    );
    this.camera.position.set(0, 0, 5);
    this.camera.lookAt(0, 0, 0);
    
    // Configure renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias,
      alpha: true,
      powerPreference: 'high-performance',
    });
    
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 1);
    
    // Enable tone mapping for better color
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    
    // Setup scene background
    this.scene.background = new THREE.Color(0x000000);
    
    // Add lighting
    this.setupLighting();
    
    // Setup safe area and boundary lines
    this.setupReferenceLines();
    
    // Auto-adjust quality if enabled
    if (config?.autoAdjustQuality !== false) {
      this.performanceMonitor.setAutoAdjust(true);
    }

    // Initialize performance optimizer
    this.performanceOptimizer = new PerformanceOptimizer(this.camera, {
      enableLOD: true,
      enableFrustumCulling: true,
      enableCaching: true,
      enableTexturePooling: true,
      enableMemoryMonitoring: true,
    });
    this.performanceOptimizer.startOptimization();
  }

  /**
   * Setup scene lighting (ambient + directional)
   */
  private setupLighting(): void {
    // Ambient light for overall illumination
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(this.ambientLight);
    
    // Directional light for depth
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    this.directionalLight.position.set(5, 5, 5);
    this.directionalLight.castShadow = false; // Shadows disabled by default for performance
    this.scene.add(this.directionalLight);
  }

  /**
   * Setup reference lines (safe area and canvas boundary)
   */
  private setupReferenceLines(): void {
    // Create safe area lines
    this.safeAreaLines = AspectRatioAdapter.createSafeAreaLines();
    this.safeAreaLines.position.z = 0.01; // Slightly in front
    this.scene.add(this.safeAreaLines);
    
    // Create canvas boundary lines
    this.canvasBoundaryLines = AspectRatioAdapter.createCanvasBoundaryLines();
    this.canvasBoundaryLines.position.z = 0.01;
    this.scene.add(this.canvasBoundaryLines);
    
    // Initially visible
    this.setSafeAreaVisible(this.showSafeArea);
  }

  /**
   * Toggle safe area reference lines visibility
   */
  setSafeAreaVisible(visible: boolean): void {
    this.showSafeArea = visible;
    
    if (this.safeAreaLines) {
      this.safeAreaLines.visible = visible;
    }
    
    if (this.canvasBoundaryLines) {
      this.canvasBoundaryLines.visible = visible;
    }
  }

  /**
   * Get safe area visibility state
   */
  isSafeAreaVisible(): boolean {
    return this.showSafeArea;
  }

  /**
   * Setup performance monitoring callbacks
   */
  private setupPerformanceMonitoring(): void {
    this.performanceMonitor.onQualityChange((quality: QualityLevel) => {
      this.applyQualitySettings(quality);
    });
  }

  /**
   * Apply quality settings to renderer
   */
  private applyQualitySettings(quality: QualityLevel): void {
    const settings = this.performanceMonitor.getQualitySettings();
    
    // Adjust pixel ratio
    this.renderer.setPixelRatio(settings.pixelRatio);
    
    // Adjust resolution
    const width = this.DEFAULT_WIDTH * settings.resolution;
    const height = this.DEFAULT_HEIGHT * settings.resolution;
    this.renderer.setSize(width, height);
    
    // Adjust shadows
    this.directionalLight.castShadow = settings.shadows;
    
    console.log(`Quality adjusted to: ${quality}`, settings);
  }

  /**
   * Add video clip to scene
   */
  addVideoClip(clip: VideoClip, videoElement: HTMLVideoElement): VideoPlane {
    // Calculate aspect ratio from video
    const aspectRatio = videoElement.videoWidth / videoElement.videoHeight;
    
    // Create video plane
    const videoPlane = new VideoPlane(clip.id, videoElement, aspectRatio);
    
    // Apply aspect ratio adaptation if specified
    if (clip.aspectRatioAdaptation) {
      this.applyAspectRatioAdaptation(videoPlane, videoElement, clip.aspectRatioAdaptation);
    }
    
    // Apply initial transform
    videoPlane.updateTransform(clip.transform);
    
    // Add to scene
    this.scene.add(videoPlane.mesh);
    
    // Store reference
    this.videoPlanes.set(clip.id, videoPlane);
    
    // CRITICAL: Start video playback immediately for texture updates
    videoPlane.play().catch(err => {
      console.error('Failed to auto-play video:', err);
    });
    
    return videoPlane;
  }

  /**
   * Apply aspect ratio adaptation to a video plane
   */
  applyAspectRatioAdaptation(
    videoPlane: VideoPlane,
    videoElement: HTMLVideoElement,
    adaptation: AspectRatioAdaptation
  ): void {
    if (!adaptation.enabled) {
      AspectRatioAdapter.resetAdaptation(videoPlane.mesh);
      return;
    }

    switch (adaptation.mode) {
      case 'auto-crop':
        AspectRatioAdapter.applyAutoCrop(
          videoPlane.mesh,
          videoElement,
          adaptation.cropPosition || { x: 0.5, y: 0.5 }
        );
        break;
      
      case 'scale-fit':
        AspectRatioAdapter.applyScaleFit(videoPlane.mesh, videoElement);
        break;
      
      case 'blur-background':
        // For blur background, we need to create a group with background
        // This is more complex and would require restructuring the video plane
        // For now, fall back to scale-fit
        // Full implementation: AspectRatioAdapter.applyBlurBackground(this.scene, videoPlane.mesh, videoElement);
        AspectRatioAdapter.applyScaleFit(videoPlane.mesh, videoElement);
        console.warn('Blur background mode not fully implemented, using scale-fit');
        break;
    }
  }

  /**
   * Update aspect ratio adaptation for a clip
   */
  updateAspectRatioAdaptation(
    clipId: string,
    videoElement: HTMLVideoElement,
    adaptation: AspectRatioAdaptation
  ): void {
    const videoPlane = this.videoPlanes.get(clipId);
    if (videoPlane) {
      this.applyAspectRatioAdaptation(videoPlane, videoElement, adaptation);
    }
  }

  /**
   * Check if a clip is outside safe area
   */
  isClipOutsideSafeArea(clipId: string): boolean {
    const videoPlane = this.videoPlanes.get(clipId);
    if (!videoPlane) return false;
    
    return AspectRatioAdapter.isOutsideSafeArea(videoPlane.mesh);
  }

  /**
   * Get all clips that are outside safe area
   */
  getClipsOutsideSafeArea(): string[] {
    const clipsOutside: string[] = [];
    
    this.videoPlanes.forEach((videoPlane, clipId) => {
      if (AspectRatioAdapter.isOutsideSafeArea(videoPlane.mesh)) {
        clipsOutside.push(clipId);
      }
    });
    
    return clipsOutside;
  }

  /**
   * Detect if video needs aspect ratio adaptation
   */
  detectAspectRatioAdaptation(videoElement: HTMLVideoElement): AspectRatioAdaptation {
    return AspectRatioAdapter.getDefaultAdaptation(videoElement);
  }

  /**
   * Remove video clip from scene
   */
  removeVideoClip(clipId: string): void {
    const videoPlane = this.videoPlanes.get(clipId);
    if (videoPlane) {
      this.scene.remove(videoPlane.mesh);
      videoPlane.dispose();
      this.videoPlanes.delete(clipId);
    }
  }

  /**
   * Update clip transform
   */
  updateClipTransform(clipId: string, transform: Transform3D): void {
    const videoPlane = this.videoPlanes.get(clipId);
    if (videoPlane) {
      videoPlane.updateTransform(transform);
    }
  }

  /**
   * Set playback time for all video clips
   */
  setPlaybackTime(time: number): void {
    this.currentTime = time;
    
    // Update all video planes
    this.videoPlanes.forEach(videoPlane => {
      videoPlane.updateTime(time);
    });
  }

  /**
   * Play all videos
   */
  async playAllVideos(): Promise<void> {
    const playPromises = Array.from(this.videoPlanes.values()).map(plane => plane.play());
    await Promise.all(playPromises);
  }

  /**
   * Pause all videos
   */
  pauseAllVideos(): void {
    this.videoPlanes.forEach(plane => plane.pause());
  }

  /**
   * Get current playback time
   */
  getCurrentTime(): number {
    return this.currentTime;
  }

  /**
   * Start render loop (60fps target)
   */
  startRenderLoop(): void {
    if (this.isRendering) return;
    
    this.isRendering = true;
    this.renderLoop();
  }

  /**
   * Stop render loop
   */
  stopRenderLoop(): void {
    this.isRendering = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Render loop - maintains 60fps
   */
  private renderLoop = (): void => {
    if (!this.isRendering) return;
    
    // Performance monitoring
    this.performanceMonitor.beginFrame();
    
    // Apply performance optimizations
    if (this.performanceOptimizer) {
      this.performanceOptimizer.optimizeFrame(this.videoPlanes);
    }
    
    // Render scene
    this.render();
    
    // End performance monitoring
    this.performanceMonitor.endFrame();
    
    // Schedule next frame
    this.animationFrameId = requestAnimationFrame(this.renderLoop);
  };

  /**
   * Render single frame
   */
  render(): void {
    // Update all video textures before rendering
    this.videoPlanes.forEach(videoPlane => {
      videoPlane.videoTexture.update();
    });
    
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Resize renderer and camera
   */
  resize(width: number, height: number): void {
    // Update camera aspect ratio
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    
    // Update renderer size
    this.renderer.setSize(width, height);
  }

  /**
   * Get video plane by clip ID
   */
  getVideoPlane(clipId: string): VideoPlane | undefined {
    return this.videoPlanes.get(clipId);
  }

  /**
   * Get all video planes
   */
  getAllVideoPlanes(): VideoPlane[] {
    return Array.from(this.videoPlanes.values());
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return this.performanceMonitor.getMetrics();
  }

  /**
   * Get current quality level
   */
  getQuality(): QualityLevel {
    return this.performanceMonitor.getQuality();
  }

  /**
   * Set quality level manually
   */
  setQuality(quality: QualityLevel): void {
    this.performanceMonitor.setQuality(quality);
  }

  /**
   * Enable/disable auto quality adjustment
   */
  setAutoAdjustQuality(enabled: boolean): void {
    this.performanceMonitor.setAutoAdjust(enabled);
  }

  /**
   * Get scene reference (for advanced usage)
   */
  getScene(): THREE.Scene {
    return this.scene;
  }

  /**
   * Get camera reference (for advanced usage)
   */
  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  /**
   * Get renderer reference (for advanced usage)
   */
  getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  /**
   * Set selected clip (highlight it)
   */
  setSelectedClip(clipId: string | null): void {
    // Unhighlight all clips
    this.videoPlanes.forEach(plane => {
      plane.setHighlight(false);
    });

    // Highlight selected clip
    if (clipId) {
      const plane = this.videoPlanes.get(clipId);
      if (plane) {
        plane.setHighlight(true);
      }
    }
  }

  /**
   * Get selected clip ID from scene (by checking highlight state)
   */
  getSelectedClipId(): string | null {
    for (const [clipId, plane] of this.videoPlanes.entries()) {
      if (plane.isSelected()) {
        return clipId;
      }
    }
    return null;
  }

  /**
   * Get performance optimizer
   */
  getPerformanceOptimizer(): PerformanceOptimizer | null {
    return this.performanceOptimizer;
  }

  /**
   * Get optimization statistics
   */
  getOptimizationStats() {
    return this.performanceOptimizer?.getStats() || null;
  }

  /**
   * Dispose and clean up all resources
   */
  dispose(): void {
    // Stop rendering
    this.stopRenderLoop();
    
    // Dispose performance optimizer
    if (this.performanceOptimizer) {
      this.performanceOptimizer.dispose();
      this.performanceOptimizer = null;
    }
    
    // Dispose all video planes
    this.videoPlanes.forEach(videoPlane => {
      this.scene.remove(videoPlane.mesh);
      videoPlane.dispose();
    });
    this.videoPlanes.clear();
    
    // Dispose renderer
    this.renderer.dispose();
    
    // Clear scene
    this.scene.clear();
  }
}
