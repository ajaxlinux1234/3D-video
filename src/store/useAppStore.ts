import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  Project,
  VideoResource,
  VideoClip,
  TimelineState,
  AudioTrack,
  Transform3D,
} from '../types';

/**
 * UI State Interface
 */
interface UIState {
  showTimeline: boolean;
  showEffects: boolean;
  previewQuality: 'low' | 'medium' | 'high';
  isExporting: boolean;
  exportProgress: number;
  showSafeArea: boolean; // Show safe area reference lines
  showAspectRatioWarnings: boolean; // Show warnings for clips outside bounds
}

/**
 * History Entry for Undo/Redo
 */
interface HistoryEntry {
  type: 'transform' | 'clip' | 'audio';
  clipId?: string;
  before: unknown;
  after: unknown;
  timestamp: number;
}

/**
 * App State Interface
 */
interface AppState {
  // Project state
  currentProject: Project | null;
  
  // Video resources
  videos: Map<string, VideoResource>;
  
  // Timeline state
  timeline: TimelineState;
  
  // Selected state
  selectedClipId: string | null;
  
  // UI state
  ui: UIState;
  
  // History for undo/redo
  history: HistoryEntry[];
  historyIndex: number;
  
  // Actions
  setProject: (project: Project) => void;
  addVideo: (video: VideoResource) => void;
  removeVideo: (videoId: string) => void;
  addClip: (clip: VideoClip) => void;
  updateClip: (clipId: string, updates: Partial<VideoClip>) => void;
  removeClip: (clipId: string) => void;
  setCurrentTime: (time: number) => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  setSelectedClip: (clipId: string | null) => void;
  addAudioTrack: (track: AudioTrack) => void;
  removeAudioTrack: (trackId: string) => void;
  updateAudioTrack: (trackId: string, updates: Partial<AudioTrack>) => void;
  setUIState: (updates: Partial<UIState>) => void;
  resetProject: () => void;
  
  // History actions
  pushHistory: (entry: Omit<HistoryEntry, 'timestamp'>) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;
}

/**
 * Default timeline state
 */
const defaultTimelineState: TimelineState = {
  currentTime: 0,
  duration: 0,
  zoom: 1,
  playbackRate: 1,
  isPlaying: false,
};

/**
 * Default UI state
 */
const defaultUIState: UIState = {
  showTimeline: true,
  showEffects: true,
  previewQuality: 'high',
  isExporting: false,
  exportProgress: 0,
  showSafeArea: true,
  showAspectRatioWarnings: true,
};

/**
 * Create default project
 */
const createDefaultProject = (): Project => ({
  id: crypto.randomUUID(),
  name: '未命名项目',
  resolution: { width: 1080, height: 1920 }, // 9:16 vertical
  fps: 60,
  duration: 0,
  clips: [],
  audioTracks: [],
  createdAt: new Date(),
  updatedAt: new Date(),
});

/**
 * Main App Store with Zustand
 */
export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentProject: null,
      videos: new Map(),
      timeline: defaultTimelineState,
      selectedClipId: null,
      ui: defaultUIState,
      history: [],
      historyIndex: -1,

      // Project actions
      setProject: (project: Project) => {
        set({
          currentProject: {
            ...project,
            updatedAt: new Date(),
          },
          timeline: {
            ...get().timeline,
            duration: project.duration,
          },
        });
      },

      // Video resource actions
      addVideo: (video: VideoResource) => {
        const videos = new Map(get().videos);
        videos.set(video.id, video);
        set({ videos });
      },

      removeVideo: (videoId: string) => {
        const videos = new Map(get().videos);
        videos.delete(videoId);
        
        // Also remove clips that reference this video
        const project = get().currentProject;
        if (project) {
          const updatedClips = project.clips.filter(
            clip => clip.videoId !== videoId
          );
          set({
            videos,
            currentProject: {
              ...project,
              clips: updatedClips,
              updatedAt: new Date(),
            },
          });
        } else {
          set({ videos });
        }
      },

      // Clip actions
      addClip: (clip: VideoClip) => {
        const project = get().currentProject;
        if (!project) {
          // Create a new project if none exists
          const newProject = createDefaultProject();
          newProject.clips.push(clip);
          newProject.duration = Math.max(
            newProject.duration,
            clip.startTime + clip.duration
          );
          set({ currentProject: newProject });
          return;
        }

        const updatedClips = [...project.clips, clip];
        const newDuration = Math.max(
          project.duration,
          clip.startTime + clip.duration
        );

        set({
          currentProject: {
            ...project,
            clips: updatedClips,
            duration: newDuration,
            updatedAt: new Date(),
          },
          timeline: {
            ...get().timeline,
            duration: newDuration,
          },
        });
      },

      updateClip: (clipId: string, updates: Partial<VideoClip>) => {
        const project = get().currentProject;
        if (!project) return;

        const updatedClips = project.clips.map(clip =>
          clip.id === clipId ? { ...clip, ...updates } : clip
        );

        // Recalculate project duration
        const newDuration = updatedClips.reduce(
          (max, clip) => Math.max(max, clip.startTime + clip.duration),
          0
        );

        set({
          currentProject: {
            ...project,
            clips: updatedClips,
            duration: newDuration,
            updatedAt: new Date(),
          },
          timeline: {
            ...get().timeline,
            duration: newDuration,
          },
        });
      },

      removeClip: (clipId: string) => {
        const project = get().currentProject;
        if (!project) return;

        const updatedClips = project.clips.filter(clip => clip.id !== clipId);
        const newDuration = updatedClips.reduce(
          (max, clip) => Math.max(max, clip.startTime + clip.duration),
          0
        );

        set({
          currentProject: {
            ...project,
            clips: updatedClips,
            duration: newDuration,
            updatedAt: new Date(),
          },
          timeline: {
            ...get().timeline,
            duration: newDuration,
          },
          selectedClipId: get().selectedClipId === clipId ? null : get().selectedClipId,
        });
      },

      // Timeline actions
      setCurrentTime: (time: number) => {
        set({
          timeline: {
            ...get().timeline,
            currentTime: Math.max(0, Math.min(time, get().timeline.duration)),
          },
        });
      },

      play: () => {
        set({
          timeline: {
            ...get().timeline,
            isPlaying: true,
          },
        });
      },

      pause: () => {
        set({
          timeline: {
            ...get().timeline,
            isPlaying: false,
          },
        });
      },

      stop: () => {
        set({
          timeline: {
            ...get().timeline,
            isPlaying: false,
            currentTime: 0,
          },
        });
      },

      seek: (time: number) => {
        set({
          timeline: {
            ...get().timeline,
            currentTime: Math.max(0, Math.min(time, get().timeline.duration)),
            isPlaying: false,
          },
        });
      },

      // Selection actions
      setSelectedClip: (clipId: string | null) => {
        set({ selectedClipId: clipId });
      },

      // Audio track actions
      addAudioTrack: (track: AudioTrack) => {
        const project = get().currentProject;
        if (!project) return;

        set({
          currentProject: {
            ...project,
            audioTracks: [...project.audioTracks, track],
            updatedAt: new Date(),
          },
        });
      },

      removeAudioTrack: (trackId: string) => {
        const project = get().currentProject;
        if (!project) return;

        set({
          currentProject: {
            ...project,
            audioTracks: project.audioTracks.filter(track => track.id !== trackId),
            updatedAt: new Date(),
          },
        });
      },

      updateAudioTrack: (trackId: string, updates: Partial<AudioTrack>) => {
        const project = get().currentProject;
        if (!project) return;

        set({
          currentProject: {
            ...project,
            audioTracks: project.audioTracks.map(track =>
              track.id === trackId ? { ...track, ...updates } : track
            ),
            updatedAt: new Date(),
          },
        });
      },

      // UI actions
      setUIState: (updates: Partial<UIState>) => {
        set({
          ui: {
            ...get().ui,
            ...updates,
          },
        });
      },

      // Reset project
      resetProject: () => {
        set({
          currentProject: null,
          videos: new Map(),
          timeline: defaultTimelineState,
          selectedClipId: null,
          ui: defaultUIState,
          history: [],
          historyIndex: -1,
        });
      },

      // History actions
      pushHistory: (entry: Omit<HistoryEntry, 'timestamp'>) => {
        const state = get();
        const newEntry: HistoryEntry = {
          ...entry,
          timestamp: Date.now(),
        };

        // Remove any history after current index (when making new changes after undo)
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push(newEntry);

        // Limit history to 50 entries
        const limitedHistory = newHistory.slice(-50);

        set({
          history: limitedHistory,
          historyIndex: limitedHistory.length - 1,
        });
      },

      undo: () => {
        const state = get();
        if (!state.canUndo()) return;

        const entry = state.history[state.historyIndex];
        
        // Apply the 'before' state
        if (entry.type === 'transform' && entry.clipId) {
          state.updateClip(entry.clipId, { transform: entry.before as Transform3D });
        }

        set({ historyIndex: state.historyIndex - 1 });
      },

      redo: () => {
        const state = get();
        if (!state.canRedo()) return;

        const entry = state.history[state.historyIndex + 1];
        
        // Apply the 'after' state
        if (entry.type === 'transform' && entry.clipId) {
          state.updateClip(entry.clipId, { transform: entry.after as Transform3D });
        }

        set({ historyIndex: state.historyIndex + 1 });
      },

      canUndo: () => {
        const state = get();
        return state.historyIndex >= 0;
      },

      canRedo: () => {
        const state = get();
        return state.historyIndex < state.history.length - 1;
      },

      clearHistory: () => {
        set({
          history: [],
          historyIndex: -1,
        });
      },
    }),
    {
      name: 'video-composer-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentProject: state.currentProject ? {
          ...state.currentProject,
          createdAt: state.currentProject.createdAt.toISOString(),
          updatedAt: state.currentProject.updatedAt.toISOString(),
        } : null,
        // Don't persist videos Map (contains File objects and HTMLVideoElement)
        // Don't persist UI state (should reset on reload)
        timeline: {
          ...state.timeline,
          isPlaying: false, // Don't persist playing state
        },
      }),
      onRehydrateStorage: () => (state) => {
        // Convert ISO strings back to Date objects
        if (state?.currentProject) {
          state.currentProject.createdAt = new Date(state.currentProject.createdAt as unknown as string);
          state.currentProject.updatedAt = new Date(state.currentProject.updatedAt as unknown as string);
          
          // Clean up clips that reference non-existent videos
          // Since videos Map is not persisted (contains File objects), 
          // we need to clear all clips on reload
          if (state.currentProject.clips.length > 0) {
            console.warn('Clearing clips from previous session - video resources are not persisted');
            state.currentProject.clips = [];
            state.currentProject.duration = 0;
          }
          
          // Also clear audio tracks
          if (state.currentProject.audioTracks.length > 0) {
            console.warn('Clearing audio tracks from previous session');
            state.currentProject.audioTracks = [];
          }
        }
        
        // Reset timeline state
        if (state) {
          state.timeline = {
            ...defaultTimelineState,
            duration: state.currentProject?.duration || 0,
          };
          state.selectedClipId = null;
        }
      },
    }
  )
);

/**
 * Selector hooks for optimized re-renders
 */
export const useProject = () => useAppStore(state => state.currentProject);
export const useVideos = () => useAppStore(state => state.videos);
export const useTimeline = () => useAppStore(state => state.timeline);
export const useSelectedClip = () => useAppStore(state => state.selectedClipId);
export const useUIState = () => useAppStore(state => state.ui);

/**
 * Action hooks - using direct references to avoid getSnapshot caching issues
 */
export const useProjectActions = () => ({
  setProject: useAppStore.getState().setProject,
  resetProject: useAppStore.getState().resetProject,
});

export const useVideoActions = () => ({
  addVideo: useAppStore.getState().addVideo,
  removeVideo: useAppStore.getState().removeVideo,
});

export const useClipActions = () => ({
  addClip: useAppStore.getState().addClip,
  updateClip: useAppStore.getState().updateClip,
  removeClip: useAppStore.getState().removeClip,
  setSelectedClip: useAppStore.getState().setSelectedClip,
});

export const useTimelineActions = () => ({
  setCurrentTime: useAppStore.getState().setCurrentTime,
  play: useAppStore.getState().play,
  pause: useAppStore.getState().pause,
  stop: useAppStore.getState().stop,
  seek: useAppStore.getState().seek,
});

export const useAudioActions = () => ({
  addAudioTrack: useAppStore.getState().addAudioTrack,
  removeAudioTrack: useAppStore.getState().removeAudioTrack,
  updateAudioTrack: useAppStore.getState().updateAudioTrack,
});

export const useHistoryActions = () => ({
  pushHistory: useAppStore.getState().pushHistory,
  undo: useAppStore.getState().undo,
  redo: useAppStore.getState().redo,
  canUndo: useAppStore.getState().canUndo,
  canRedo: useAppStore.getState().canRedo,
  clearHistory: useAppStore.getState().clearHistory,
});
