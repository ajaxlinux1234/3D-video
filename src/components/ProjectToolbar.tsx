/**
 * ProjectToolbar - Main toolbar for project management
 * 
 * Features:
 * - New project button
 * - Save/Load project
 * - Unsaved changes indicator
 * - Auto-save status
 */

import { useState, useEffect } from 'react';
import { useProjectManager } from '../core/useProjectManager';
import { NewProjectWizard } from './NewProjectWizard';
import { MissingFilesDialog } from './MissingFilesDialog';
import type { VideoReference } from '../core/ProjectManager';
import './ProjectToolbar.css';

export function ProjectToolbar() {
  const {
    currentProject,
    hasUnsavedChanges,
    lastSaveTime,
    isAutoSaveEnabled,
    setIsAutoSaveEnabled,
    saveProject,
    loadProject,
    closeProject,
    relocateMissingVideo,
  } = useProjectManager();

  const [showNewProjectWizard, setShowNewProjectWizard] = useState(false);
  const [showMissingFilesDialog, setShowMissingFilesDialog] = useState(false);
  const [missingFiles, setMissingFiles] = useState<VideoReference[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Auto-save status message
  useEffect(() => {
    if (saveStatus === 'saved') {
      const timer = setTimeout(() => setSaveStatus('idle'), 3000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  const handleNewProject = () => {
    if (currentProject && hasUnsavedChanges) {
      const confirmed = confirm('当前项目有未保存的更改。是否继续创建新项目？');
      if (!confirmed) return;
    }
    setShowNewProjectWizard(true);
  };

  const handleSave = async () => {
    if (!currentProject || isSaving) return;
    
    setIsSaving(true);
    setSaveStatus('saving');
    
    try {
      await saveProject();
      setSaveStatus('saved');
    } catch (error) {
      console.error('Save failed:', error);
      setSaveStatus('error');
      alert('保存失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoad = async () => {
    if (currentProject && hasUnsavedChanges) {
      const confirmed = confirm('当前项目有未保存的更改。是否继续加载项目？');
      if (!confirmed) return;
    }

    try {
      const result = await loadProject();
      
      if (result.missingVideos.length > 0) {
        setMissingFiles(result.missingVideos);
        setShowMissingFilesDialog(true);
      }
    } catch (error) {
      console.error('Load failed:', error);
      alert('加载失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  const handleMissingFilesSkip = () => {
    setShowMissingFilesDialog(false);
    setMissingFiles([]);
    // Project is already loaded, just close dialog
  };

  const handleMissingFilesCancel = () => {
    setShowMissingFilesDialog(false);
    setMissingFiles([]);
  };

  const handleClose = () => {
    closeProject();
  };

  const formatLastSaveTime = () => {
    if (!lastSaveTime) return '';
    
    const now = new Date();
    const diff = now.getTime() - lastSaveTime.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return '刚刚保存';
    if (minutes < 60) return `${minutes}分钟前保存`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}小时前保存`;
    
    return lastSaveTime.toLocaleDateString();
  };

  return (
    <>
      <div className="project-toolbar">
        <div className="toolbar-section">
          <button className="toolbar-button primary" onClick={handleNewProject}>
            <span className="button-icon">📄</span>
            新建项目
          </button>
          
          <button className="toolbar-button" onClick={handleLoad}>
            <span className="button-icon">📂</span>
            打开项目
          </button>
          
          <button
            className="toolbar-button"
            onClick={handleSave}
            disabled={!currentProject || isSaving}
          >
            <span className="button-icon">💾</span>
            {isSaving ? '保存中...' : '保存项目'}
          </button>

          {currentProject && (
            <button className="toolbar-button" onClick={handleClose}>
              <span className="button-icon">✕</span>
              关闭项目
            </button>
          )}
        </div>

        <div className="toolbar-section">
          {currentProject && (
            <div className="project-info">
              <span className="project-name">{currentProject.name}</span>
              
              {hasUnsavedChanges && (
                <span className="unsaved-indicator" title="有未保存的更改">
                  ● 未保存
                </span>
              )}
              
              {saveStatus === 'saving' && (
                <span className="save-status saving">保存中...</span>
              )}
              
              {saveStatus === 'saved' && (
                <span className="save-status saved">✓ 已保存</span>
              )}
              
              {saveStatus === 'error' && (
                <span className="save-status error">✕ 保存失败</span>
              )}
              
              {lastSaveTime && saveStatus === 'idle' && !hasUnsavedChanges && (
                <span className="last-save-time">{formatLastSaveTime()}</span>
              )}
            </div>
          )}

          <label className="auto-save-toggle">
            <input
              type="checkbox"
              checked={isAutoSaveEnabled}
              onChange={(e) => setIsAutoSaveEnabled(e.target.checked)}
            />
            <span>自动保存</span>
          </label>
        </div>
      </div>

      <NewProjectWizard
        isOpen={showNewProjectWizard}
        onClose={() => setShowNewProjectWizard(false)}
      />

      {showMissingFilesDialog && (
        <MissingFilesDialog
          missingFiles={missingFiles}
          onRelocate={relocateMissingVideo}
          onSkip={handleMissingFilesSkip}
          onCancel={handleMissingFilesCancel}
        />
      )}
    </>
  );
}
