/**
 * AspectRatioPanel - UI for configuring 9:16 aspect ratio adaptation
 */
import { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { AspectRatioMode, type AspectRatioAdaptation } from '../types';
import './AspectRatioPanel.css';

export function AspectRatioPanel() {
  const selectedClipId = useAppStore(state => state.selectedClipId);
  const currentProject = useAppStore(state => state.currentProject);
  const updateClip = useAppStore(state => state.updateClip);
  const showSafeArea = useAppStore(state => state.ui.showSafeArea);
  const setUIState = useAppStore(state => state.setUIState);

  const [adaptation, setAdaptation] = useState<AspectRatioAdaptation>({
    mode: 'auto-crop',
    enabled: false,
    cropPosition: { x: 0.5, y: 0.5 },
    blurIntensity: 50,
  });

  // Load adaptation settings when clip is selected
  useEffect(() => {
    if (selectedClipId && currentProject) {
      const clip = currentProject.clips.find(c => c.id === selectedClipId);
      if (clip?.aspectRatioAdaptation) {
        setAdaptation(clip.aspectRatioAdaptation);
      } else {
        // Reset to default
        setAdaptation({
          mode: 'auto-crop',
          enabled: false,
          cropPosition: { x: 0.5, y: 0.5 },
          blurIntensity: 50,
        });
      }
    }
  }, [selectedClipId, currentProject]);

  const handleModeChange = (mode: AspectRatioMode) => {
    const newAdaptation = { ...adaptation, mode };
    setAdaptation(newAdaptation);
    
    if (selectedClipId) {
      updateClip(selectedClipId, { aspectRatioAdaptation: newAdaptation });
    }
  };

  const handleEnabledChange = (enabled: boolean) => {
    const newAdaptation = { ...adaptation, enabled };
    setAdaptation(newAdaptation);
    
    if (selectedClipId) {
      updateClip(selectedClipId, { aspectRatioAdaptation: newAdaptation });
    }
  };

  const handleCropPositionChange = (axis: 'x' | 'y', value: number) => {
    const newCropPosition = { ...adaptation.cropPosition!, [axis]: value };
    const newAdaptation = { ...adaptation, cropPosition: newCropPosition };
    setAdaptation(newAdaptation);
    
    if (selectedClipId) {
      updateClip(selectedClipId, { aspectRatioAdaptation: newAdaptation });
    }
  };

  const handleBlurIntensityChange = (value: number) => {
    const newAdaptation = { ...adaptation, blurIntensity: value };
    setAdaptation(newAdaptation);
    
    if (selectedClipId) {
      updateClip(selectedClipId, { aspectRatioAdaptation: newAdaptation });
    }
  };

  const handleToggleSafeArea = () => {
    setUIState({ showSafeArea: !showSafeArea });
  };

  if (!selectedClipId) {
    return (
      <div className="aspect-ratio-panel">
        <div className="panel-header">
          <h3>9:16 竖屏适配</h3>
        </div>
        <div className="panel-content">
          <p className="no-selection">请选择一个视频片段</p>
        </div>
      </div>
    );
  }

  return (
    <div className="aspect-ratio-panel">
      <div className="panel-header">
        <h3>9:16 竖屏适配</h3>
      </div>
      
      <div className="panel-content">
        {/* Enable/Disable Adaptation */}
        <div className="control-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={adaptation.enabled}
              onChange={(e) => handleEnabledChange(e.target.checked)}
            />
            <span>启用适配</span>
          </label>
        </div>

        {/* Adaptation Mode Selection */}
        {adaptation.enabled && (
          <>
            <div className="control-group">
              <label>适配模式</label>
              <div className="mode-buttons">
                <button
                  className={`mode-button ${adaptation.mode === 'auto-crop' ? 'active' : ''}`}
                  onClick={() => handleModeChange('auto-crop')}
                  title="智能裁剪横屏视频中心区域"
                >
                  <span className="mode-icon">✂️</span>
                  <span className="mode-label">自动裁剪</span>
                </button>
                
                <button
                  className={`mode-button ${adaptation.mode === 'scale-fit' ? 'active' : ''}`}
                  onClick={() => handleModeChange('scale-fit')}
                  title="等比缩放并添加上下黑边"
                >
                  <span className="mode-icon">📐</span>
                  <span className="mode-label">缩放适配</span>
                </button>
                
                <button
                  className={`mode-button ${adaptation.mode === 'blur-background' ? 'active' : ''}`}
                  onClick={() => handleModeChange('blur-background')}
                  title="缩放视频作为背景，原视频居中显示"
                >
                  <span className="mode-icon">🌫️</span>
                  <span className="mode-label">背景模糊</span>
                </button>
              </div>
            </div>

            {/* Mode-specific controls */}
            {adaptation.mode === 'auto-crop' && (
              <div className="control-group">
                <label>裁剪位置</label>
                <div className="slider-control">
                  <span className="slider-label">水平:</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={adaptation.cropPosition?.x || 0.5}
                    onChange={(e) => handleCropPositionChange('x', parseFloat(e.target.value))}
                  />
                  <span className="slider-value">
                    {((adaptation.cropPosition?.x || 0.5) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="slider-control">
                  <span className="slider-label">垂直:</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={adaptation.cropPosition?.y || 0.5}
                    onChange={(e) => handleCropPositionChange('y', parseFloat(e.target.value))}
                  />
                  <span className="slider-value">
                    {((adaptation.cropPosition?.y || 0.5) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            )}

            {adaptation.mode === 'blur-background' && (
              <div className="control-group">
                <label>模糊强度</label>
                <div className="slider-control">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={adaptation.blurIntensity || 50}
                    onChange={(e) => handleBlurIntensityChange(parseInt(e.target.value))}
                  />
                  <span className="slider-value">{adaptation.blurIntensity || 50}%</span>
                </div>
              </div>
            )}

            {/* Mode descriptions */}
            <div className="mode-description">
              {adaptation.mode === 'auto-crop' && (
                <p>智能裁剪横屏视频的中心区域以适配9:16竖屏格式</p>
              )}
              {adaptation.mode === 'scale-fit' && (
                <p>等比缩放视频并添加黑边以适配9:16竖屏格式</p>
              )}
              {adaptation.mode === 'blur-background' && (
                <p>将视频作为模糊背景，原视频居中显示</p>
              )}
            </div>
          </>
        )}

        {/* Safe Area Toggle */}
        <div className="control-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showSafeArea}
              onChange={handleToggleSafeArea}
            />
            <span>显示安全区域参考线</span>
          </label>
          <p className="help-text">
            安全区域确保重要内容不会被裁切
          </p>
        </div>

        {/* Info */}
        <div className="info-box">
          <h4>💡 提示</h4>
          <ul>
            <li>横屏视频建议使用适配功能</li>
            <li>自动裁剪适合人物居中的视频</li>
            <li>缩放适配保留完整画面</li>
            <li>背景模糊创造更好的视觉效果</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
