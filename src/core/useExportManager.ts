/**
 * React hook for ExportManager
 */
import { useEffect, useRef } from 'react';
import { ExportManager } from './ExportManager';
import { SceneManager } from './SceneManager';

export function useExportManager(sceneManager: SceneManager | null) {
  const exportManagerRef = useRef<ExportManager | null>(null);

  useEffect(() => {
    if (!sceneManager) return;

    // Create export manager
    exportManagerRef.current = new ExportManager(sceneManager);

    // Cleanup on unmount
    return () => {
      if (exportManagerRef.current) {
        exportManagerRef.current.dispose();
        exportManagerRef.current = null;
      }
    };
  }, [sceneManager]);

  return exportManagerRef.current;
}
