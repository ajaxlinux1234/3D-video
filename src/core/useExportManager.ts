/**
 * React hook for ExportManager
 */
import { useEffect, useReducer, useRef } from 'react';
import { ExportManager } from './ExportManager';
import { SceneManager } from './SceneManager';

type ExportManagerState = ExportManager | null;
type ExportManagerAction = 
  | { type: 'SET'; manager: ExportManager | null }
  | { type: 'CLEAR' };

function exportManagerReducer(
  state: ExportManagerState,
  action: ExportManagerAction
): ExportManagerState {
  switch (action.type) {
    case 'SET':
      return action.manager;
    case 'CLEAR':
      return null;
    default:
      return state;
  }
}

export function useExportManager(sceneManager: SceneManager | null) {
  const [exportManager, dispatch] = useReducer(exportManagerReducer, null);
  const managerRef = useRef<ExportManager | null>(null);

  useEffect(() => {
    // Cleanup previous manager
    if (managerRef.current) {
      managerRef.current.dispose();
      managerRef.current = null;
    }

    // Create new manager if sceneManager exists
    if (sceneManager) {
      const manager = new ExportManager(sceneManager);
      managerRef.current = manager;
      dispatch({ type: 'SET', manager });
    } else {
      dispatch({ type: 'CLEAR' });
    }

    // Cleanup on unmount
    return () => {
      if (managerRef.current) {
        managerRef.current.dispose();
        managerRef.current = null;
      }
    };
  }, [sceneManager]);

  return exportManager;
}
