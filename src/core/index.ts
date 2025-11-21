/**
 * Core module exports
 */

// Scene and rendering
export { SceneManager } from './SceneManager';
export { VideoPlane } from './VideoPlane';
export { VideoTexture } from './VideoTexture';
export { VideoManager } from './VideoManager';
export { PerformanceMonitor } from './PerformanceMonitor';

// Performance optimization
export { PerformanceOptimizer } from './PerformanceOptimizer';
export type { OptimizationConfig, OptimizationStats } from './PerformanceOptimizer';
export { LODSystem } from './LODSystem';
export type { LODLevel, LODConfig, LODSettings } from './LODSystem';
export { FrustumCulling } from './FrustumCulling';
export type { CullingStats } from './FrustumCulling';
export { LRUCache } from './LRUCache';
export type { CacheEntry, CacheStats } from './LRUCache';
export { TexturePool } from './TexturePool';
export type { TexturePoolConfig, PoolStats } from './TexturePool';
export { MemoryMonitor } from './MemoryMonitor';
export type { MemoryStats, MemoryThresholds, MemoryWarningLevel } from './MemoryMonitor';

// Transition system
export { TransitionSystem, EasingFunctions } from './TransitionSystem';
export type { EasingFunction } from './TransitionSystem';

// Effect system
export { EffectProcessor, ParticleSystem } from './EffectProcessor';

// Audio system
export { AudioManager, getAudioManager } from './AudioManager';
export type { AudioManagerOptions, WaveformData } from './AudioManager';

// Aspect ratio adaptation
export { AspectRatioAdapter } from './AspectRatioAdapter';
export type { VideoAspectInfo } from './AspectRatioAdapter';

// Preview system
export { PreviewController } from './PreviewController';
export type { PlaybackState, PreviewError, PreviewControllerOptions } from './PreviewController';

// Export system
export { ExportManager } from './ExportManager';
export type { ExportProgress, ExportResult } from './ExportManager';
export { FrameCapture } from './FrameCapture';

// Project management
export { ProjectManager, projectManager } from './ProjectManager';
export type { ProjectFile, ProjectTemplate, VideoReference } from './ProjectManager';

// React hooks
export { useSceneManager } from './useSceneManager';
export { useSceneSync } from './useSceneSync';
export { useVideoManager } from './useVideoManager';
export { useTimelineSync } from './useTimelineSync';
export { useTransformControls } from './useTransformControls';
export { useTransitionSystem } from './useTransitionSystem';
export type { TransitionPlayback } from './useTransitionSystem';
export { useEffectProcessor } from './useEffectProcessor';
export type { UseEffectProcessorReturn, UseEffectProcessorOptions } from './useEffectProcessor';
export { useAudioManager } from './useAudioManager';
export type { UseAudioManagerReturn } from './useAudioManager';
export { useAspectRatioAdapter } from './useAspectRatioAdapter';
export { usePreviewController } from './usePreviewController';
export { useExportManager } from './useExportManager';
export { useProjectManager } from './useProjectManager';
export { usePerformanceOptimizer } from './usePerformanceOptimizer';
export type { UsePerformanceOptimizerReturn } from './usePerformanceOptimizer';
