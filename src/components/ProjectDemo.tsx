/**
 * ProjectDemo - Demonstration of project management features
 */

import { ProjectToolbar } from './ProjectToolbar';
import { useProjectManager } from '../core/useProjectManager';
import './ProjectDemo.css';

export function ProjectDemo() {
  const { currentProject, hasUnsavedChanges, lastSaveTime, isAutoSaveEnabled } = useProjectManager();

  return (
    <div className="project-demo">
      <h2>项目管理功能演示</h2>
      
      <div className="demo-section">
        <h3>功能说明</h3>
        <ul>
          <li>✅ 创建新项目（空白或从模板）</li>
          <li>✅ 保存项目为 .v3d 文件</li>
          <li>✅ 加载已保存的项目</li>
          <li>✅ 缺失文件自动检测和重定位</li>
          <li>✅ 未保存更改提示</li>
          <li>✅ 自动保存功能</li>
          <li>✅ 项目模板系统（快节奏、慢节奏、故障风等）</li>
        </ul>
      </div>

      <div className="demo-section">
        <h3>项目工具栏</h3>
        <ProjectToolbar />
      </div>

      <div className="demo-section">
        <h3>当前项目状态</h3>
        {currentProject ? (
          <div className="project-status">
            <div className="status-item">
              <span className="status-label">项目名称:</span>
              <span className="status-value">{currentProject.name}</span>
            </div>
            <div className="status-item">
              <span className="status-label">项目 ID:</span>
              <span className="status-value">{currentProject.id}</span>
            </div>
            <div className="status-item">
              <span className="status-label">分辨率:</span>
              <span className="status-value">
                {currentProject.resolution.width}x{currentProject.resolution.height}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">帧率:</span>
              <span className="status-value">{currentProject.fps} FPS</span>
            </div>
            <div className="status-item">
              <span className="status-label">时长:</span>
              <span className="status-value">{currentProject.duration.toFixed(2)}s</span>
            </div>
            <div className="status-item">
              <span className="status-label">视频片段:</span>
              <span className="status-value">{currentProject.clips.length}</span>
            </div>
            <div className="status-item">
              <span className="status-label">音频轨道:</span>
              <span className="status-value">{currentProject.audioTracks.length}</span>
            </div>
            <div className="status-item">
              <span className="status-label">创建时间:</span>
              <span className="status-value">
                {currentProject.createdAt.toLocaleString()}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">更新时间:</span>
              <span className="status-value">
                {currentProject.updatedAt.toLocaleString()}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">未保存更改:</span>
              <span className={`status-value ${hasUnsavedChanges ? 'warning' : 'success'}`}>
                {hasUnsavedChanges ? '是 ●' : '否 ✓'}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">自动保存:</span>
              <span className={`status-value ${isAutoSaveEnabled ? 'success' : ''}`}>
                {isAutoSaveEnabled ? '已启用 ✓' : '已禁用'}
              </span>
            </div>
            {lastSaveTime && (
              <div className="status-item">
                <span className="status-label">最后保存:</span>
                <span className="status-value">{lastSaveTime.toLocaleString()}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="no-project">
            <p>📄 没有打开的项目</p>
            <p>点击"新建项目"开始创建</p>
          </div>
        )}
      </div>

      <div className="demo-section">
        <h3>使用说明</h3>
        <div className="instructions">
          <div className="instruction-item">
            <h4>1. 创建新项目</h4>
            <p>点击"新建项目"按钮，输入项目名称，选择模板（或空白项目）</p>
          </div>
          <div className="instruction-item">
            <h4>2. 编辑项目</h4>
            <p>添加视频片段、调整效果、编辑时间轴等操作会自动标记为未保存</p>
          </div>
          <div className="instruction-item">
            <h4>3. 保存项目</h4>
            <p>点击"保存项目"按钮，项目会下载为 .v3d 文件</p>
          </div>
          <div className="instruction-item">
            <h4>4. 加载项目</h4>
            <p>点击"打开项目"按钮，选择之前保存的 .v3d 文件</p>
          </div>
          <div className="instruction-item">
            <h4>5. 自动保存</h4>
            <p>启用自动保存后，项目会每分钟自动保存到浏览器本地存储</p>
          </div>
        </div>
      </div>

      <div className="demo-section">
        <h3>项目模板</h3>
        <div className="templates-info">
          <div className="template-info-item">
            <span className="template-icon">📄</span>
            <div>
              <strong>空白项目</strong>
              <p>从零开始创建项目</p>
            </div>
          </div>
          <div className="template-info-item">
            <span className="template-icon">⚡</span>
            <div>
              <strong>快节奏</strong>
              <p>60fps，快速转场，适合动感视频</p>
            </div>
          </div>
          <div className="template-info-item">
            <span className="template-icon">🌙</span>
            <div>
              <strong>慢节奏</strong>
              <p>30fps，慢速转场，适合叙事视频</p>
            </div>
          </div>
          <div className="template-info-item">
            <span className="template-icon">🎮</span>
            <div>
              <strong>故障风</strong>
              <p>赛博朋克风格，故障效果</p>
            </div>
          </div>
          <div className="template-info-item">
            <span className="template-icon">🎬</span>
            <div>
              <strong>电影感</strong>
              <p>电影级视觉效果，暗角和调色</p>
            </div>
          </div>
          <div className="template-info-item">
            <span className="template-icon">✨</span>
            <div>
              <strong>梦幻</strong>
              <p>柔和梦幻风格，光晕和模糊</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
