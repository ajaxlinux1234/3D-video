/**
 * AspectRatioWarnings - Display warnings for clips outside safe area
 */
import { useAspectRatioAdapter } from '../core/useAspectRatioAdapter';
import { useSceneManager } from '../core/useSceneManager';
import { useAppStore } from '../store/useAppStore';
import './AspectRatioWarnings.css';

export function AspectRatioWarnings() {
  const { sceneManager } = useSceneManager({ autoStart: false });
  const { clipsOutsideSafeArea, showWarnings } = useAspectRatioAdapter(sceneManager);
  const currentProject = useAppStore(state => state.currentProject);
  const setSelectedClip = useAppStore(state => state.setSelectedClip);

  if (!showWarnings || clipsOutsideSafeArea.length === 0) {
    return null;
  }

  const handleClipClick = (clipId: string) => {
    setSelectedClip(clipId);
  };

  return (
    <div className="aspect-ratio-warnings">
      <div className="warning-header">
        <span className="warning-icon">⚠️</span>
        <span className="warning-title">边界警告</span>
      </div>
      <div className="warning-content">
        <p className="warning-message">
          以下视频片段超出了安全区域边界：
        </p>
        <ul className="warning-list">
          {clipsOutsideSafeArea.map(clipId => {
            const clip = currentProject?.clips.find(c => c.id === clipId);
            return (
              <li key={clipId} className="warning-item">
                <button
                  className="warning-clip-button"
                  onClick={() => handleClipClick(clipId)}
                  title="点击选中此片段"
                >
                  <span className="clip-id">{clipId.slice(0, 8)}...</span>
                  {clip && (
                    <span className="clip-time">
                      {clip.startTime.toFixed(1)}s
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
        <p className="warning-help">
          调整片段的位置或缩放以确保重要内容不被裁切
        </p>
      </div>
    </div>
  );
}
