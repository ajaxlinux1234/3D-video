/**
 * ExportDialogWrapper - Wrapper for ExportDialog with manager initialization
 */

import { useState, useEffect } from 'react';
import { ExportDialog } from './ExportDialog';
import { ExportManager } from '../core/ExportManager';
import { AudioManager } from '../core/AudioManager';
import { SceneManager } from '../core/SceneManager';

interface ExportDialogWrapperProps {
  onClose: () => void;
}

export function ExportDialogWrapper({ onClose }: ExportDialogWrapperProps) {
  const [exportManager, setExportManager] = useState<ExportManager | null>(null);
  const [audioManager, setAudioManager] = useState<AudioManager | null>(null);

  useEffect(() => {
    // Initialize managers
    const initManagers = async () => {
      try {
        // Create a temporary scene manager for export
        // In a real scenario, this should be passed from the main app
        const sceneManager = new SceneManager();
        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1920;
        sceneManager.initialize(canvas);

        const expMgr = new ExportManager(sceneManager);
        await expMgr.initialize();
        setExportManager(expMgr);

        const audMgr = new AudioManager();
        await audMgr.initialize();
        setAudioManager(audMgr);
      } catch (error) {
        console.error('Failed to initialize export managers:', error);
      }
    };

    initManagers();

    return () => {
      // Cleanup if needed
    };
  }, []);

  return (
    <ExportDialog
      exportManager={exportManager}
      audioManager={audioManager}
      onClose={onClose}
    />
  );
}
