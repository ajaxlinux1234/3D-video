/**
 * PropertiesPanel Component
 * Displays and allows editing of selected clip properties
 */

import { useAppStore } from '../store/useAppStore';
import { TransformControlsPanel } from './TransformControlsPanel';
import { AudioPanel } from './AudioPanel';
import './PropertiesPanel.css';

export function PropertiesPanel() {
  const selectedClipId = useAppStore(state => state.selectedClipId);
  const clips = useAppStore(state => state.currentProject?.clips || []);
  const videos = useAppStore(state => state.videos);

  const selectedClip = clips.find(clip => clip.id === selectedClipId);
  const video = selectedClip ? videos.get(selectedClip.videoId) : null;

  if (!selectedClipId || !selectedClip) {
    return (
      <div className="properties-panel">
        <div className="properties-empty">
          <div className="empty-icon">📋</div>
          <h3>未选择片段</h3>
          <p>在时间轴或预览窗口中选择一个视频片段以查看和编辑其属性</p>
        </div>
      </div>
    );
  }

  return (
    <div className="properties-panel">
      <div className="properties-header">
        <h3>片段属性</h3>
        <div className="clip-id">{selectedClip.id.slice(0, 8)}...</div>
      </div>

      <div className="properties-content">
        {/* Basic Info */}
        <section className="property-section">
          <h4 className="section-title">基本信息</h4>
          <div className="property-group">
            <div className="property-item">
              <label>视频名称</label>
              <div className="property-value">{video?.file.name || 'Unknown'}</div>
            </div>
            <div className="property-item">
              <label>开始时间</label>
              <div className="property-value">{selectedClip.startTime.toFixed(2)}s</div>
            </div>
            <div className="property-item">
              <label>时长</label>
              <div className="property-value">{selectedClip.duration.toFixed(2)}s</div>
            </div>
          </div>
        </section>

        {/* Transform Controls */}
        <section className="property-section">
          <h4 className="section-title">3D 变换</h4>
          <TransformControlsPanel />
        </section>

        {/* Effects */}
        <section className="property-section">
          <h4 className="section-title">特效</h4>
          <div className="property-group">
            {selectedClip.effects && selectedClip.effects.length > 0 ? (
              <div className="effects-list">
                {selectedClip.effects.map((effect, index) => (
                  <div key={index} className="effect-item">
                    <span className="effect-name">{effect.type}</span>
                    <span className="effect-intensity">{effect.intensity}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-effects">
                <p>未应用特效</p>
                <p className="hint">在特效面板中选择特效以应用</p>
              </div>
            )}
          </div>
        </section>

        {/* Audio */}
        <section className="property-section">
          <h4 className="section-title">音频</h4>
          <AudioPanel />
        </section>

        {/* Transition */}
        {selectedClip.transition && (
          <section className="property-section">
            <h4 className="section-title">转场效果</h4>
            <div className="property-group">
              <div className="property-item">
                <label>类型</label>
                <div className="property-value">{selectedClip.transition.type}</div>
              </div>
              <div className="property-item">
                <label>时长</label>
                <div className="property-value">{selectedClip.transition.duration}s</div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
