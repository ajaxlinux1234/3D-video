/**
 * Application constants
 */

// Canvas configuration for 9:16 vertical format (TikTok/Douyin)
export const CANVAS_CONFIG = {
  ASPECT_RATIO: 9 / 16,
  WIDTH: 1080,
  HEIGHT: 1920,
  FPS_DEFAULT: 60,
  FPS_OPTIONS: [30, 60] as const,
} as const;

// Resolution presets
export const RESOLUTION_PRESETS = {
  '720p': { width: 720, height: 1280 },
  '1080p': { width: 1080, height: 1920 },
  '2k': { width: 1440, height: 2560 },
} as const;

// Video constraints
export const VIDEO_CONSTRAINTS = {
  MAX_FILE_SIZE: 500 * 1024 * 1024, // 500MB
  MAX_VIDEO_COUNT: 20,
  SUPPORTED_FORMATS: ['video/mp4', 'video/quicktime', 'video/webm'],
  SUPPORTED_EXTENSIONS: ['.mp4', '.mov', '.webm'],
} as const;

// Audio constraints
export const AUDIO_CONSTRAINTS = {
  SUPPORTED_FORMATS: ['audio/mpeg', 'audio/wav', 'audio/aac'],
  SUPPORTED_EXTENSIONS: ['.mp3', '.wav', '.aac'],
  MIN_VOLUME_DB: -60,
  MAX_VOLUME_DB: 12,
  FADE_DURATION_MIN: 0.5,
  FADE_DURATION_MAX: 3,
} as const;

// Transition constraints
export const TRANSITION_CONSTRAINTS = {
  MIN_DURATION: 0.5,
  MAX_DURATION: 3,
  DEFAULT_DURATION: 1,
} as const;

// Effect constraints
export const EFFECT_CONSTRAINTS = {
  MIN_INTENSITY: 0,
  MAX_INTENSITY: 100,
  DEFAULT_INTENSITY: 50,
} as const;

// Performance thresholds
export const PERFORMANCE = {
  TARGET_FPS: 60,
  MIN_FPS: 30,
  MEMORY_WARNING_THRESHOLD: 0.8, // 80% of available memory
  MAX_TEXTURE_SIZE: 4096,
} as const;
