/**
 * AspectRatioDemo - Demo component for 9:16 aspect ratio adaptation system
 */
import { AspectRatioPanel } from './AspectRatioPanel';
import { AspectRatioWarnings } from './AspectRatioWarnings';
import { useAppStore } from '../store/useAppStore';
import { AspectRatioMode } from '../types';
import './AspectRatioDemo.css';

export function AspectRatioDemo() {
  const addClip = useAppStore(state => state.addClip);
  const setSelectedClip = useAppStore(state => state.setSelectedClip);
  const selectedClipId = useAppStore(state => state.selectedClipId);
  const showSafeArea = useAppStore(state => state.ui.showSafeArea);
  const setUIState = useAppStore(state => state.setUIState);

  const handleAddDemoClip = () => {
    const clip = {
      id: `demo-clip-${Date.now()}`,
      videoId: 'demo-video-1',
      startTime: 0,
      duration: 10,
      trimStart: 0,
      trimEnd: 10,
      transform: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
      effects: [],
      aspectRatioAdaptation: {
        mode: 'auto-crop' as AspectRatioMode,
        enabled: true,
        cropPosition: { x: 0.5, y: 0.5 },
      },
    };

    addClip(clip);
    setSelectedClip(clip.id);
  };

  const handleToggleSafeArea = () => {
    setUIState({ showSafeArea: !showSafeArea });
  };

  return (
    <div className="aspect-ratio-demo">
      <div className="demo-header">
        <h2>9:16 竖屏适配系统演示</h2>
        <p className="demo-description">
          演示如何将横屏视频适配为抖音标准的9:16竖屏格式
        </p>
      </div>

      <div className="demo-content">
        <div className="demo-section">
          <h3>功能特性</h3>
          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h4>画布比例锁定</h4>
              <p>固定为9:16（1080x1920）竖屏格式</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔍</div>
              <h4>横屏视频检测</h4>
              <p>自动检测并提供适配选项</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">✂️</div>
              <h4>自动裁剪模式</h4>
              <p>智能裁剪横屏视频中心区域</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📐</div>
              <h4>缩放适配模式</h4>
              <p>等比缩放并添加上下黑边</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🌫️</div>
              <h4>背景模糊模式</h4>
              <p>缩放视频作为背景，原视频居中</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📏</div>
              <h4>安全区域参考线</h4>
              <p>显示安全区域确保内容不被裁切</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">⚠️</div>
              <h4>边界警告提示</h4>
              <p>实时检测超出边界的视频片段</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h4>精确位置控制</h4>
              <p>调整裁剪位置和模糊强度</p>
            </div>
          </div>
        </div>

        <div className="demo-section">
          <h3>适配模式对比</h3>
          <div className="mode-comparison">
            <div className="comparison-item">
              <div className="comparison-visual auto-crop">
                <div className="video-frame landscape">
                  <div className="crop-indicator"></div>
                </div>
              </div>
              <h4>自动裁剪</h4>
              <p>裁剪横屏视频中心区域，适合人物居中的场景</p>
            </div>

            <div className="comparison-item">
              <div className="comparison-visual scale-fit">
                <div className="video-frame landscape-fit">
                  <div className="letterbox top"></div>
                  <div className="letterbox bottom"></div>
                </div>
              </div>
              <h4>缩放适配</h4>
              <p>保留完整画面，添加黑边填充</p>
            </div>

            <div className="comparison-item">
              <div className="comparison-visual blur-bg">
                <div className="video-frame blur-background">
                  <div className="blurred-bg"></div>
                  <div className="centered-video"></div>
                </div>
              </div>
              <h4>背景模糊</h4>
              <p>创造更好的视觉效果，适合精美内容</p>
            </div>
          </div>
        </div>

        <div className="demo-section">
          <h3>控制面板</h3>
          <div className="demo-controls">
            <button className="demo-button" onClick={handleAddDemoClip}>
              添加演示片段
            </button>
            <button className="demo-button" onClick={handleToggleSafeArea}>
              {showSafeArea ? '隐藏' : '显示'}安全区域
            </button>
          </div>
          
          {selectedClipId && (
            <div className="demo-panel">
              <AspectRatioPanel />
            </div>
          )}
        </div>

        <div className="demo-section">
          <h3>使用说明</h3>
          <ol className="usage-steps">
            <li>导入视频后，系统会自动检测是否需要适配</li>
            <li>选择视频片段，在右侧面板中启用适配</li>
            <li>选择合适的适配模式（自动裁剪/缩放适配/背景模糊）</li>
            <li>调整裁剪位置或模糊强度等参数</li>
            <li>开启安全区域参考线，确保重要内容不被裁切</li>
            <li>系统会自动警告超出边界的片段</li>
          </ol>
        </div>

        <div className="demo-section">
          <h3>技术实现</h3>
          <div className="tech-details">
            <div className="tech-item">
              <strong>AspectRatioAdapter:</strong> 核心适配逻辑类
            </div>
            <div className="tech-item">
              <strong>UV坐标调整:</strong> 通过修改纹理UV实现裁剪
            </div>
            <div className="tech-item">
              <strong>几何变换:</strong> 动态调整平面几何以保持9:16比例
            </div>
            <div className="tech-item">
              <strong>实时检测:</strong> 自动检测并警告超出边界的片段
            </div>
            <div className="tech-item">
              <strong>参考线系统:</strong> Three.js LineSegments实现可视化参考
            </div>
          </div>
        </div>
      </div>

      {/* Warnings component */}
      <AspectRatioWarnings />
    </div>
  );
}
