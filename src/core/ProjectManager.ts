/**
 * ProjectManager - Handles project save, load, and template management
 * 
 * Features:
 * - Save/load projects as .v3d files
 * - Project templates (fast-paced, slow-paced, glitch, etc.)
 * - Missing file relocation
 * - Auto-save functionality
 */

import type { Project, VideoClip, AudioTrack, Effect, Transition } from '../types';

/**
 * Project file format (.v3d)
 */
export interface ProjectFile {
  version: string;
  project: SerializedProject;
  videoReferences: VideoReference[];
}

interface SerializedProject {
  id: string;
  name: string;
  resolution: { width: number; height: number };
  fps: number;
  duration: number;
  clips: VideoClip[];
  audioTracks: AudioTrack[];
  createdAt: string;
  updatedAt: string;
}

export interface VideoReference {
  id: string;
  filename: string;
  path: string;
  size: number;
  lastModified: number;
}

/**
 * Project template definition
 */
export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: 'preset' | 'custom';
  thumbnail?: string;
  config: {
    fps: number;
    defaultTransition?: Transition;
    defaultEffects?: Effect[];
    clipDefaults?: Partial<VideoClip>;
  };
}

/**
 * Auto-save configuration
 */
interface AutoSaveConfig {
  enabled: boolean;
  intervalMs: number;
  maxBackups: number;
}

/**
 * ProjectManager class
 */
export class ProjectManager {
  private static readonly VERSION = '1.0';
  private static readonly FILE_EXTENSION = '.v3d';
  
  private autoSaveConfig: AutoSaveConfig = {
    enabled: true,
    intervalMs: 60000, // 1 minute
    maxBackups: 5,
  };
  
  private autoSaveTimer: number | null = null;
  private hasUnsavedChanges: boolean = false;
  private lastSaveTime: Date | null = null;

  /**
   * Create a new blank project
   */
  createProject(name: string = '未命名项目'): Project {
    return {
      id: crypto.randomUUID(),
      name,
      resolution: { width: 1080, height: 1920 }, // 9:16
      fps: 60,
      duration: 0,
      clips: [],
      audioTracks: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Create project from template
   */
  createFromTemplate(template: ProjectTemplate, name: string): Project {
    const project = this.createProject(name);
    project.fps = template.config.fps;
    
    // Apply template defaults to project
    // (clips will be added by user, but defaults are stored for when they add clips)
    
    return project;
  }

  /**
   * Serialize project to JSON
   */
  private serializeProject(project: Project): SerializedProject {
    return {
      ...project,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    };
  }

  /**
   * Deserialize project from JSON
   */
  private deserializeProject(data: SerializedProject): Project {
    return {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    };
  }

  /**
   * Save project to .v3d file
   */
  async saveProject(
    project: Project,
    videoFiles: Map<string, File>
  ): Promise<Blob> {
    // Create video references
    const videoReferences: VideoReference[] = [];
    for (const clip of project.clips) {
      const file = videoFiles.get(clip.videoId);
      if (file && !videoReferences.find(ref => ref.id === clip.videoId)) {
        videoReferences.push({
          id: clip.videoId,
          filename: file.name,
          path: '', // Will be set when user saves
          size: file.size,
          lastModified: file.lastModified,
        });
      }
    }

    // Create project file
    const projectFile: ProjectFile = {
      version: ProjectManager.VERSION,
      project: this.serializeProject(project),
      videoReferences,
    };

    // Convert to JSON blob
    const json = JSON.stringify(projectFile, null, 2);
    const blob = new Blob([json], { type: 'application/json' });

    this.hasUnsavedChanges = false;
    this.lastSaveTime = new Date();

    return blob;
  }

  /**
   * Load project from .v3d file
   */
  async loadProject(file: File): Promise<{
    project: Project;
    videoReferences: VideoReference[];
  }> {
    try {
      const text = await file.text();
      const projectFile: ProjectFile = JSON.parse(text);

      // Validate version
      if (projectFile.version !== ProjectManager.VERSION) {
        console.warn(`Project version mismatch: ${projectFile.version} vs ${ProjectManager.VERSION}`);
      }

      const project = this.deserializeProject(projectFile.project);

      return {
        project,
        videoReferences: projectFile.videoReferences,
      };
    } catch (error) {
      throw new Error(`Failed to load project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Export project file (download)
   */
  async exportProjectFile(
    project: Project,
    videoFiles: Map<string, File>
  ): Promise<void> {
    const blob = await this.saveProject(project, videoFiles);
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name}${ProjectManager.FILE_EXTENSION}`;
    a.click();
    
    URL.revokeObjectURL(url);
  }

  /**
   * Import project file (upload)
   */
  async importProjectFile(): Promise<{
    project: Project;
    videoReferences: VideoReference[];
  }> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = ProjectManager.FILE_EXTENSION;

      input.onchange = async (e) => {
        const target = e.target as HTMLInputElement;
        if (target.files && target.files[0]) {
          try {
            const result = await this.loadProject(target.files[0]);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        } else {
          reject(new Error('No file selected'));
        }
      };

      input.oncancel = () => {
        reject(new Error('File selection cancelled'));
      };

      input.click();
    });
  }

  /**
   * Check for missing video files
   */
  findMissingVideos(
    videoReferences: VideoReference[],
    availableVideos: Map<string, File>
  ): VideoReference[] {
    return videoReferences.filter(ref => !availableVideos.has(ref.id));
  }

  /**
   * Relocate missing video file
   */
  async relocateMissingVideo(reference: VideoReference): Promise<File | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'video/mp4,video/quicktime,video/webm';

      input.onchange = (e) => {
        const target = e.target as HTMLInputElement;
        if (target.files && target.files[0]) {
          const file = target.files[0];
          
          // Validate file matches reference
          if (file.name === reference.filename && file.size === reference.size) {
            resolve(file);
          } else {
            // Allow user to use different file
            const confirmed = confirm(
              `文件名或大小不匹配。\n` +
              `期望: ${reference.filename} (${this.formatFileSize(reference.size)})\n` +
              `选择: ${file.name} (${this.formatFileSize(file.size)})\n\n` +
              `是否继续使用选择的文件？`
            );
            resolve(confirmed ? file : null);
          }
        } else {
          resolve(null);
        }
      };

      input.oncancel = () => {
        resolve(null);
      };

      input.click();
    });
  }

  /**
   * Mark project as having unsaved changes
   */
  markUnsaved(): void {
    this.hasUnsavedChanges = true;
  }

  /**
   * Check if project has unsaved changes
   */
  hasUnsaved(): boolean {
    return this.hasUnsavedChanges;
  }

  /**
   * Get last save time
   */
  getLastSaveTime(): Date | null {
    return this.lastSaveTime;
  }

  /**
   * Enable auto-save
   */
  enableAutoSave(
    onSave: () => Promise<void>,
    config?: Partial<AutoSaveConfig>
  ): void {
    if (config) {
      this.autoSaveConfig = { ...this.autoSaveConfig, ...config };
    }

    this.disableAutoSave();

    if (this.autoSaveConfig.enabled) {
      this.autoSaveTimer = window.setInterval(async () => {
        if (this.hasUnsavedChanges) {
          try {
            await onSave();
            console.log('Auto-save completed');
          } catch (error) {
            console.error('Auto-save failed:', error);
          }
        }
      }, this.autoSaveConfig.intervalMs);
    }
  }

  /**
   * Disable auto-save
   */
  disableAutoSave(): void {
    if (this.autoSaveTimer !== null) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  /**
   * Prompt user before closing with unsaved changes
   */
  setupBeforeUnloadHandler(): void {
    window.addEventListener('beforeunload', (e) => {
      if (this.hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    });
  }

  /**
   * Get predefined project templates
   */
  getTemplates(): ProjectTemplate[] {
    return [
      {
        id: 'blank',
        name: '空白项目',
        description: '从零开始创建项目',
        category: 'preset',
        config: {
          fps: 60,
        },
      },
      {
        id: 'fast-paced',
        name: '快节奏',
        description: '适合快速剪辑和动感视频',
        category: 'preset',
        config: {
          fps: 60,
          defaultTransition: {
            type: 'zoom-blur',
            duration: 0.5,
            easing: 'ease-in-out',
            params: {},
          },
          clipDefaults: {
            duration: 2,
          },
        },
      },
      {
        id: 'slow-paced',
        name: '慢节奏',
        description: '适合叙事和情感视频',
        category: 'preset',
        config: {
          fps: 30,
          defaultTransition: {
            type: 'dissolve',
            duration: 2,
            easing: 'ease-in-out',
            params: {},
          },
          clipDefaults: {
            duration: 5,
          },
        },
      },
      {
        id: 'glitch-style',
        name: '故障风',
        description: '赛博朋克和故障艺术风格',
        category: 'preset',
        config: {
          fps: 60,
          defaultTransition: {
            type: 'glitch',
            duration: 0.8,
            easing: 'ease-in-out',
            params: {},
          },
          defaultEffects: [
            {
              id: crypto.randomUUID(),
              type: 'glitch',
              intensity: 50,
              params: {},
              enabled: true,
            },
            {
              id: crypto.randomUUID(),
              type: 'rgb-split',
              intensity: 30,
              params: {},
              enabled: true,
            },
          ],
        },
      },
      {
        id: 'cinematic',
        name: '电影感',
        description: '电影级视觉效果',
        category: 'preset',
        config: {
          fps: 30,
          defaultTransition: {
            type: 'page-turn',
            duration: 1.5,
            easing: 'ease-in-out',
            params: {},
          },
          defaultEffects: [
            {
              id: crypto.randomUUID(),
              type: 'vignette',
              intensity: 40,
              params: {},
              enabled: true,
            },
            {
              id: crypto.randomUUID(),
              type: 'color-grade',
              intensity: 60,
              params: { preset: 'cinematic' },
              enabled: true,
            },
          ],
        },
      },
      {
        id: 'dreamy',
        name: '梦幻',
        description: '柔和梦幻的视觉风格',
        category: 'preset',
        config: {
          fps: 30,
          defaultTransition: {
            type: 'ripple',
            duration: 1.5,
            easing: 'ease-out',
            params: {},
          },
          defaultEffects: [
            {
              id: crypto.randomUUID(),
              type: 'glow',
              intensity: 50,
              params: {},
              enabled: true,
            },
            {
              id: crypto.randomUUID(),
              type: 'blur',
              intensity: 20,
              params: {},
              enabled: true,
            },
          ],
        },
      },
    ];
  }

  /**
   * Format file size helper
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  }

  /**
   * Cleanup
   */
  dispose(): void {
    this.disableAutoSave();
  }
}

// Singleton instance
export const projectManager = new ProjectManager();
