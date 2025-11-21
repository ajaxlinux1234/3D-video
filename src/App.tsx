import { useEffect, useState, useCallback } from 'react';
import { MaterialLibrary } from './components/MaterialLibrary';
import { TimelineEditor } from './components/TimelineEditor';
import { Preview3D } from './components/Preview3D';
import { EffectsPanelWrapper } from './components/EffectsPanelWrapper';
import { TransitionSelectorWrapper } from './components/TransitionSelectorWrapper';
import { PropertiesPanel } from './components/PropertiesPanel';
import { ExportDialogWrapper } from './components/ExportDialogWrapper';
import { ProjectToolbar } from './components/ProjectToolbar';
import { KeyboardShortcutsHelp } from './components/KeyboardShortcutsHelp';
import { ErrorBoundary } from './components/ErrorBoundary';
import { WebGLCheck } from './components/WebGLCheck';
import { ToastContainer, useToast } from './components/Toast';
import { MemoryWarning } from './components/MemoryWarning';
import { useAppStore } from './store/useAppStore';
import './App.css';

type PanelType = 'library' | 'effects' | 'transitions' | 'properties';

function App() {
  const [leftPanel, setLeftPanel] = useState<PanelType>('library');
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
  
  const selectedClipId = useAppStore(state => state.selectedClipId);
  const play = useAppStore(state => state.play);
  const pause = useAppStore(state => state.pause);
  const removeClip = useAppStore(state => state.removeClip);
  const isPlaying = useAppStore(state => state.timeline.isPlaying);
  
  // Toast notifications
  const { messages, removeToast } = useToast();
  
  // Memory optimization handler
  const handleOptimizeMemory = useCallback(() => {
    // Implement memory optimization logic
    // This could include clearing caches, reducing quality, etc.
    console.log('Optimizing memory usage...');
  }, []);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore if typing in input
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    // Space: Play/Pause
    if (e.code === 'Space') {
      e.preventDefault();
      if (isPlaying) {
        pause();
      } else {
        play();
      }
    }

    // Delete: Remove selected clip
    if (e.code === 'Delete' && selectedClipId) {
      e.preventDefault();
      if (confirm('确定要删除选中的片段吗？')) {
        removeClip(selectedClipId);
      }
    }

    // Ctrl+Z: Undo (placeholder)
    if (e.ctrlKey && e.code === 'KeyZ') {
      e.preventDefault();
      console.log('Undo (not implemented yet)');
    }

    // Ctrl+Y: Redo (placeholder)
    if (e.ctrlKey && e.code === 'KeyY') {
      e.preventDefault();
      console.log('Redo (not implemented yet)');
    }

    // Ctrl+S: Save project
    if (e.ctrlKey && e.code === 'KeyS') {
      e.preventDefault();
      console.log('Save project (handled by ProjectToolbar)');
    }

    // Ctrl+E: Export
    if (e.ctrlKey && e.code === 'KeyE') {
      e.preventDefault();
      setShowExportDialog(true);
    }

    // Number keys: Switch panels
    if (e.code === 'Digit1') {
      setLeftPanel('library');
    } else if (e.code === 'Digit2') {
      setLeftPanel('effects');
    } else if (e.code === 'Digit3') {
      setLeftPanel('transitions');
    } else if (e.code === 'Digit4') {
      setLeftPanel('properties');
    }

    // Tab: Toggle left panel
    if (e.code === 'Tab' && !e.ctrlKey && !e.shiftKey) {
      e.preventDefault();
      setIsLeftPanelCollapsed(prev => !prev);
    }
  }, [isPlaying, play, pause, selectedClipId, removeClip]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const renderLeftPanel = () => {
    switch (leftPanel) {
      case 'library':
        return <MaterialLibrary />;
      case 'effects':
        return <EffectsPanelWrapper />;
      case 'transitions':
        return <TransitionSelectorWrapper />;
      case 'properties':
        return <PropertiesPanel />;
      default:
        return null;
    }
  };

  return (
    <ErrorBoundary>
      <WebGLCheck>
        <div className="app">
          {/* Top Toolbar */}
          <ProjectToolbar />

          {/* Main Content Area */}
          <main className="app-main">
        {/* Left Sidebar - Material Library / Effects / Transitions / Properties */}
        {!isLeftPanelCollapsed && (
          <aside className="left-sidebar">
            {/* Panel Tabs */}
            <div className="panel-tabs">
              <button
                className={`panel-tab ${leftPanel === 'library' ? 'active' : ''}`}
                onClick={() => setLeftPanel('library')}
                title="素材库 (1)"
              >
                <span className="tab-icon">📁</span>
                <span className="tab-label">素材库</span>
              </button>
              <button
                className={`panel-tab ${leftPanel === 'effects' ? 'active' : ''}`}
                onClick={() => setLeftPanel('effects')}
                title="特效 (2)"
              >
                <span className="tab-icon">✨</span>
                <span className="tab-label">特效</span>
              </button>
              <button
                className={`panel-tab ${leftPanel === 'transitions' ? 'active' : ''}`}
                onClick={() => setLeftPanel('transitions')}
                title="转场 (3)"
              >
                <span className="tab-icon">🔄</span>
                <span className="tab-label">转场</span>
              </button>
              <button
                className={`panel-tab ${leftPanel === 'properties' ? 'active' : ''}`}
                onClick={() => setLeftPanel('properties')}
                title="属性 (4)"
              >
                <span className="tab-icon">⚙️</span>
                <span className="tab-label">属性</span>
              </button>
            </div>

            {/* Panel Content */}
            <div className="panel-content">
              {renderLeftPanel()}
            </div>
          </aside>
        )}

        {/* Toggle Button */}
        <button
          className="panel-toggle"
          onClick={() => setIsLeftPanelCollapsed(!isLeftPanelCollapsed)}
          title={isLeftPanelCollapsed ? '展开侧边栏 (Tab)' : '收起侧边栏 (Tab)'}
        >
          {isLeftPanelCollapsed ? '▶' : '◀'}
        </button>

        {/* Center - Preview Window */}
        <div className="center-area">
          <div className="preview-wrapper">
            <Preview3D />
          </div>

          {/* Bottom - Timeline Editor */}
          <div className="timeline-wrapper">
            <TimelineEditor />
          </div>
        </div>
      </main>

      {/* Export Dialog */}
      {showExportDialog && (
        <ExportDialogWrapper
          onClose={() => setShowExportDialog(false)}
        />
      )}

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp />

          <div className="shortcuts-hint">
            <span>快捷键: </span>
            <kbd>Space</kbd> 播放/暂停 |
            <kbd>Delete</kbd> 删除 |
            <kbd>Tab</kbd> 切换侧边栏 |
            <kbd>Ctrl+E</kbd> 导出 |
            <kbd>1-4</kbd> 切换面板 |
            <kbd>?</kbd> 帮助
          </div>

          {/* Toast Notifications */}
          <ToastContainer messages={messages} onClose={removeToast} />

          {/* Memory Warning */}
          <MemoryWarning onOptimize={handleOptimizeMemory} />
        </div>
      </WebGLCheck>
    </ErrorBoundary>
  );
}

export default App;
