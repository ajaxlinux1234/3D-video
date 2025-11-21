/**
 * Core type definitions for 3D Video Composer
 */

// Project types
export interface Project {
  id: string;
  name: string;
  resolution: { width: number; height: number }; // 1080x1920 for 9:16
  fps: number; // 30 or 60
  duration: number; // Total duration in seconds
  clips: VideoClip[];
  audioTracks: AudioTrack[];
  createdAt: Date;
  updatedAt: Date;
}

// Aspect ratio adaptation modes
export const AspectRatioMode = {
  AUTO_CROP: 'auto-crop',
  SCALE_FIT: 'scale-fit',
  BLUR_BACKGROUND: 'blur-background',
} as const;

export type AspectRatioMode = typeof AspectRatioMode[keyof typeof AspectRatioMode];

// Aspect ratio adaptation settings
export interface AspectRatioAdaptation {
  mode: AspectRatioMode;
  enabled: boolean;
  cropPosition?: { x: number; y: number }; // For auto-crop mode (0-1 range)
  blurIntensity?: number; // For blur-background mode (0-100)
}

// Video clip types
export interface VideoClip {
  id: string;
  videoId: string; // Reference to video resource
  startTime: number; // Start time on timeline
  duration: number; // Clip duration
  trimStart: number; // Video trim start
  trimEnd: number; // Video trim end
  transform: Transform3D;
  effects: Effect[];
  transition?: Transition;
  aspectRatioAdaptation?: AspectRatioAdaptation; // 9:16 adaptation settings
}

// 3D Transform
export interface Transform3D {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
}

// Video resource
export interface VideoResource {
  id: string;
  file: File;
  url: string; // Object URL
  metadata: VideoMetadata;
  thumbnail: string; // Base64 thumbnail
  videoElement?: HTMLVideoElement;
}

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  fps: number;
  codec: string;
}

// Transition types
export const TransitionType = {
  CUBE_FLIP: 'cube-flip',
  SPHERE_WARP: 'sphere-warp',
  PARTICLE_BURST: 'particle-burst',
  PAGE_TURN: 'page-turn',
  DISSOLVE: 'dissolve',
  GLITCH: 'glitch',
  ZOOM_BLUR: 'zoom-blur',
  RIPPLE: 'ripple',
} as const;

export type TransitionType = typeof TransitionType[keyof typeof TransitionType];

export interface Transition {
  type: TransitionType;
  duration: number; // 0.5 - 3 seconds
  easing: string;
  params: Record<string, unknown>;
}

// Effect types
export const EffectType = {
  PARTICLES: 'particles',
  GLOW: 'glow',
  DISTORTION: 'distortion',
  GLITCH: 'glitch',
  CHROMATIC: 'chromatic',
  VIGNETTE: 'vignette',
  COLOR_GRADE: 'color-grade',
  BLUR: 'blur',
  PIXELATE: 'pixelate',
  RGB_SPLIT: 'rgb-split',
} as const;

export type EffectType = typeof EffectType[keyof typeof EffectType];

export interface Effect {
  id: string;
  type: EffectType;
  intensity: number; // 0-100
  params: Record<string, unknown>;
  enabled: boolean;
}

// Audio types
export interface AudioTrack {
  id: string;
  type: 'video' | 'music' | 'sfx';
  source: string; // URL or video ID
  startTime: number;
  duration: number;
  volume: number; // 0-1
  fadeIn?: number;
  fadeOut?: number;
  audioBuffer?: AudioBuffer;
}

// Timeline state
export interface TimelineState {
  currentTime: number;
  duration: number;
  zoom: number;
  playbackRate: number;
  isPlaying: boolean;
}

// Export settings
export interface ExportSettings {
  resolution: '720p' | '1080p' | '2k';
  fps: 30 | 60;
  bitrate: number; // Mbps
  format: 'mp4';
  codec: 'h264' | 'h265';
}

// Error types
export const ErrorType = {
  VIDEO_LOAD_FAILED: 'VIDEO_LOAD_FAILED',
  UNSUPPORTED_FORMAT: 'UNSUPPORTED_FORMAT',
  WEBGL_NOT_SUPPORTED: 'WEBGL_NOT_SUPPORTED',
  OUT_OF_MEMORY: 'OUT_OF_MEMORY',
  EXPORT_FAILED: 'EXPORT_FAILED',
  PROJECT_LOAD_FAILED: 'PROJECT_LOAD_FAILED',
} as const;

export type ErrorType = typeof ErrorType[keyof typeof ErrorType];
