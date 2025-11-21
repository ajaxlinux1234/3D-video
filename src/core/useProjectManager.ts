/**
 * React hook for ProjectManager
 */

import { useCallback, useEffect, useState } from 'react';
import { projectManager, type ProjectTemplate, type VideoReference } from './ProjectManager';
import { useAppStore } from '../store/useAppStore';

export function useProjectManager() {
  const currentProject = useAppStore(state => state.currentProject);
  const videos = useAppStore(state => state.videos);
  const setProject = useAppStore(state => state.setProject);
  const resetProject = useAppStore(state => state.resetProject);
  
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(true);

  /**
   * Create new blank project
   */
  const createNewProject = useCallback((name?: string) => {
    const project = projectManager.createProject(name);
    setProject(project);
    projectManager.markUnsaved();
    return project;
  }, [setProject]);

  /**
   * Create project from template
   */
  const createFromTemplate = useCallback((template: ProjectTemplate, name: string) => {
    const project = projectManager.createFromTemplate(template, name);
    setProject(project);
    projectManager.markUnsaved();
    return project;
  }, [setProject]);

  /**
   * Save current project
   */
  const saveProject = useCallback(async () => {
    if (!currentProject) {
      throw new Error('No project to save');
    }

    // Convert videos Map to Map<string, File>
    const videoFiles = new Map<string, File>();
    videos.forEach((video, id) => {
      videoFiles.set(id, video.file);
    });

    await projectManager.exportProjectFile(currentProject, videoFiles);
    setHasUnsavedChanges(false);
    setLastSaveTime(new Date());
  }, [currentProject, videos]);

  /**
   * Load project from file
   */
  const loadProject = useCallback(async () => {
    try {
      const { project, videoReferences } = await projectManager.importProjectFile();
      
      // Check for missing videos
      const videoFiles = new Map<string, File>();
      videos.forEach((video, id) => {
        videoFiles.set(id, video.file);
      });
      
      const missingVideos = projectManager.findMissingVideos(videoReferences, videoFiles);
      
      if (missingVideos.length > 0) {
        // Return project and missing videos for UI to handle
        return { project, missingVideos };
      }
      
      setProject(project);
      setHasUnsavedChanges(false);
      return { project, missingVideos: [] };
    } catch (error) {
      console.error('Failed to load project:', error);
      throw error;
    }
  }, [setProject, videos]);

  /**
   * Relocate missing video
   */
  const relocateMissingVideo = useCallback(async (reference: VideoReference) => {
    return await projectManager.relocateMissingVideo(reference);
  }, []);

  /**
   * Get available templates
   */
  const getTemplates = useCallback(() => {
    return projectManager.getTemplates();
  }, []);

  /**
   * Close project with unsaved changes check
   */
  const closeProject = useCallback(() => {
    if (hasUnsavedChanges) {
      const confirmed = confirm('项目有未保存的更改。是否确定要关闭？');
      if (!confirmed) {
        return false;
      }
    }
    resetProject();
    setHasUnsavedChanges(false);
    setLastSaveTime(null);
    return true;
  }, [hasUnsavedChanges, resetProject]);

  /**
   * Mark project as modified
   */
  const markModified = useCallback(() => {
    projectManager.markUnsaved();
    setHasUnsavedChanges(true);
  }, []);

  /**
   * Setup auto-save
   */
  useEffect(() => {
    if (isAutoSaveEnabled && currentProject) {
      projectManager.enableAutoSave(async () => {
        if (!currentProject) return;
        
        const videoFiles = new Map<string, File>();
        videos.forEach((video, id) => {
          videoFiles.set(id, video.file);
        });
        
        // Save to localStorage as backup
        const blob = await projectManager.saveProject(currentProject, videoFiles);
        const text = await blob.text();
        localStorage.setItem('auto-save-backup', text);
        
        setHasUnsavedChanges(false);
        setLastSaveTime(new Date());
      });
    }

    return () => {
      projectManager.disableAutoSave();
    };
  }, [isAutoSaveEnabled, currentProject, videos]);

  /**
   * Setup beforeunload handler
   */
  useEffect(() => {
    projectManager.setupBeforeUnloadHandler();
  }, []);

  /**
   * Track project changes - removed automatic marking as it causes cascading renders
   * Users should call markModified() explicitly when making changes
   */

  return {
    currentProject,
    hasUnsavedChanges,
    lastSaveTime,
    isAutoSaveEnabled,
    setIsAutoSaveEnabled,
    createNewProject,
    createFromTemplate,
    saveProject,
    loadProject,
    closeProject,
    relocateMissingVideo,
    getTemplates,
    markModified,
  };
}
