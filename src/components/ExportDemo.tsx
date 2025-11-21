/**
 * ExportDemo - Demonstration of export functionality
 */
import { useSceneManager } from '../core/useSceneManager';
import { useExportManager } from '../core/useExportManager';
import { useAudioManager } from '../core/useAudioManager';
import { ExportButton } from './ExportButton';
import { useAppStore } from '../store/useAppStore';
import './ExportDemo.css';

export function ExportDemo() {
  const { sceneManager, canvasRef } = useSceneManager({
    width: 540,
    height: 960,
    autoStart: true,
  });
  const exportManager = useExportManager(sceneManager);
  const { audioManager } = useAudioManager();
  
  const currentProject = useAppStore(state => state.currentProject);
  const ui = useAppStore(state => state.ui);

  const hasProject = currentProject && currentProject.clips.length > 0;

  return (
    <div className="export-demo">
      <div className="export-demo-header">
        <h2>视频导出系统</h2>
        <p>将编辑好的3D视频导出为高质量MP4文件</p>
      </div>

      <div className="export-demo-content">
        {/* Preview Canvas */}
        <div className="export-preview">
          <canvas
            ref={canvasRef}
            className="export-canvas"
            width={540}
            height={960}
          />
          {!hasProject && (
            <div className="export-placeholder">
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                <line x1="7" y1="2" x2="7" y2="22" />
                <line x1="17" y1="2" x2="17" y2="22" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <line x1="2" y1="7" x2="7" y2="7" />
                <line x1="2" y1="17" x2="7" y2="17" />
                <line x1="17" y1="17" x2="22" y2="17" />
                <line x1="17" y1="7" x2="22" y2="7" />
              </svg>
              <p>没有视频片段</p>
              <p className="placeholder-hint">添加视频片段以开始编辑</p>
            </div>
          )}
        </div>

        {/* Export Info */}
        <div className="export-info">
          <h3>导出功能</h3>
          
          <div className="feature-list">
            <div className="feature-item">
              <div className="feature-icon">🎬</div>
              <div className="feature-content">
                <h4>逐帧渲染</h4>
                <p>高质量渲染每一帧，确保最佳视觉效果</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">🎵</div>
              <div className="feature-content">
                <h4>音频混音</h4>
                <p>自动混合所有音轨，支持音量和淡入淡出</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">⚙️</div>
              <div className="feature-content">
                <h4>灵活配置</h4>
                <p>支持多种分辨率、帧率和编码器选项</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">📊</div>
              <div className="feature-content">
                <h4>实时进度</h4>
                <p>显示导出进度、当前帧数和预计剩余时间</p>
              </div>
            </div>
          </div>

          {/* Export Status */}
          {ui.isExporting && (
            <div className="export-status">
              <div className="status-indicator">
                <div className="spinner" />
                <span>正在导出...</span>
              </div>
              <div className="status-progress">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${ui.exportProgress}%` }}
                  />
                </div>
                <span className="progress-text">{ui.exportProgress.toFixed(1)}%</span>
              </div>
            </div>
          )}

          {/* Export Button */}
          <div className="export-actions">
            <ExportButton
              exportManager={exportManager}
              audioManager={audioManager}
              disabled={!hasProject || ui.isExporting}
            />
            {!hasProject && (
              <p className="export-hint">
                请先添加视频片段到时间轴
              </p>
            )}
          </div>

          {/* Export Settings Info */}
          <div className="export-settings-info">
            <h4>支持的导出设置</h4>
            <ul>
              <li><strong>分辨率:</strong> 720p, 1080p, 2K (9:16竖屏)</li>
              <li><strong>帧率:</strong> 30fps, 60fps</li>
              <li><strong>码率:</strong> 4-16 Mbps</li>
              <li><strong>编码器:</strong> H.264, H.265</li>
              <li><strong>格式:</strong> MP4</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Technical Details */}
      <div className="export-technical">
        <h3>技术实现</h3>
        <div className="technical-grid">
          <div className="technical-item">
            <h4>FFmpeg.wasm</h4>
            <p>浏览器端视频编码，无需服务器</p>
          </div>
          <div className="technical-item">
            <h4>FrameCapture</h4>
            <p>离屏渲染器捕获高质量帧</p>
          </div>
          <div className="technical-item">
            <h4>AudioManager</h4>
            <p>Web Audio API混音处理</p>
          </div>
          <div className="technical-item">
            <h4>Progress Tracking</h4>
            <p>实时进度更新和ETA计算</p>
          </div>
        </div>
      </div>
    </div>
  );
}
